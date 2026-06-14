from __future__ import annotations

import argparse
import csv
import json
import re
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import quote_plus, urljoin, urlparse
from urllib.request import Request, urlopen


SOURCE_NAME = "Boat24"
BASE_URL = "https://www.boat24.com"
DEFAULT_OUTPUT_DIR = Path("data/curated/boat24_mixed_common_models")
DEFAULT_LIMIT = 20
HARD_LIMIT = 20
REQUEST_DELAY_SECONDS = 2.0

DEFAULT_QUERIES = [
    "Lagoon 42",
    "Lagoon 450",
    "Bali 4.1",
    "Bali 4.2",
    "Fountaine Pajot Lucia 40",
    "Fountaine Pajot Astrea 42",
    "Beneteau Oceanis 45",
    "Beneteau Oceanis 46.1",
    "Jeanneau Sun Odyssey 440",
    "Jeanneau Sun Odyssey 449",
    "Bavaria Cruiser 45",
    "Bavaria Cruiser 46",
    "Hanse 455",
    "Hanse 458",
    "Dufour 430",
    "Dufour 460",
]

FIELDNAMES = [
    "source_name",
    "listing_url",
    "source_listing_key",
    "collected_at",
    "search_query",
    "dataset_group",
    "raw_title",
    "builder",
    "model",
    "variant",
    "year_built",
    "asking_price",
    "currency",
    "location_text",
    "country",
    "length_overall",
    "beam",
    "cabins",
    "berths",
    "heads",
    "engine_count",
    "engine_power",
    "fuel_or_propulsion",
    "ownership_status",
    "private_charter_excharter_signal",
    "condition_notes",
    "refit_notes",
    "equipment_notes",
    "listing_status",
    "extraction_confidence",
    "review_status",
    "reviewer_notes",
]


@dataclass
class DraftRow:
    source_name: str
    listing_url: str
    source_listing_key: str
    collected_at: str
    search_query: str
    dataset_group: str
    raw_title: str
    builder: str
    model: str
    variant: str
    year_built: str
    asking_price: str
    currency: str
    location_text: str
    country: str
    length_overall: str
    beam: str
    cabins: str
    berths: str
    heads: str
    engine_count: str
    engine_power: str
    fuel_or_propulsion: str
    ownership_status: str
    private_charter_excharter_signal: str
    condition_notes: str
    refit_notes: str
    equipment_notes: str
    listing_status: str
    extraction_confidence: str
    review_status: str
    reviewer_notes: str


@dataclass
class CollectionSummary:
    queries_attempted: int
    listings_attempted: int
    rows_extracted: int
    output_csv: str
    output_json: str
    missing_field_counts: dict[str, int]
    rows_needing_manual_review: int
    blockers: list[str]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Collect a tiny Boat24 draft dataset for owner review. "
            "This script writes CSV/JSON fixtures only and never writes to Supabase."
        )
    )
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument(
        "--queries",
        help="Optional comma-separated search queries. Defaults to common YPI test models.",
    )
    return parser.parse_args()


def clean_text(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    value = unescape(value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def short_text(value: str, max_length: int = 140) -> str:
    value = clean_text(value)
    return value if len(value) <= max_length else value[: max_length - 3].rstrip() + "..."


def request_html(url: str) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": (
                "YPI-Step5.5-Boat24-DraftCollector/0.1 "
                "(local owner review; contact placeholder)"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.8",
        },
    )
    with urlopen(request, timeout=20) as response:
        content_type = response.headers.get("content-type", "")
        if "html" not in content_type:
            raise RuntimeError(f"Unexpected content type for {url}: {content_type}")
        return response.read().decode("utf-8", "replace")


def search_urls_for_query(query: str) -> list[str]:
    encoded = quote_plus(query)
    return [
        f"{BASE_URL}/en/search/?q={encoded}",
        f"{BASE_URL}/en/boats/search/?q={encoded}",
    ]


def extract_listing_links(html: str) -> list[str]:
    hrefs = re.findall(r'href=["\']([^"\']+)["\']', html, flags=re.IGNORECASE)
    links: list[str] = []

    for href in hrefs:
        absolute = urljoin(BASE_URL, href)
        parsed = urlparse(absolute)
        if parsed.netloc and "boat24.com" not in parsed.netloc:
            continue
        if "/en/" not in parsed.path:
            continue
        if any(skip in parsed.path for skip in ["/search", "/login", "/dealer", "/magazine"]):
            continue
        if not re.search(r"(boat|sailing|motor|catamaran|yacht)", parsed.path, re.I):
            continue
        links.append(absolute.split("#", 1)[0])

    return list(dict.fromkeys(links))


def infer_builder_model(query: str, title: str) -> tuple[str, str, str]:
    candidates = [query, title]
    known_builders = [
        "Lagoon",
        "Bali",
        "Fountaine Pajot",
        "Beneteau",
        "Jeanneau",
        "Bavaria",
        "Hanse",
        "Dufour",
    ]

    for text in candidates:
        normalized = clean_text(text)
        for builder in known_builders:
            if normalized.lower().startswith(builder.lower()):
                model = normalized[len(builder) :].strip(" -")
                return builder, model, ""

    return "", "", ""


def extract_year(text: str) -> str:
    match = re.search(r"\b(19[8-9]\d|20[0-3]\d)\b", text)
    return match.group(1) if match else ""


def extract_price_currency(text: str) -> tuple[str, str]:
    match = re.search(
        r"(?:\u20ac|EUR|CHF|USD|GBP)?\s*([0-9][0-9.,'\s]{3,})\s*(\u20ac|EUR|CHF|USD|GBP)?",
        text,
        flags=re.IGNORECASE,
    )
    if not match:
        return "", ""

    currency = (match.group(2) or "").upper()
    prefix_window = text[max(0, match.start() - 8) : match.start()].upper()
    if "EUR" in prefix_window or "\u20ac" in prefix_window:
        currency = "EUR"
    elif "CHF" in prefix_window:
        currency = "CHF"
    elif "USD" in prefix_window:
        currency = "USD"
    elif "GBP" in prefix_window:
        currency = "GBP"
    elif currency == "\u20ac":
        currency = "EUR"

    amount = re.sub(r"[^0-9.,]", "", match.group(1)).strip(".,")
    return amount, currency


def source_key_from_url(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path.rstrip("/")
    slug = path.rsplit("/", 1)[-1]
    return slug or path.strip("/").replace("/", "-")


def classify_group(query: str, title: str, confidence: str) -> str:
    if confidence == "low":
        return "incomplete_review_needed"
    builder, model, _variant = infer_builder_model(query, title)
    if builder and model:
        return "same_model_candidate"
    return "related_model_candidate"


def extraction_confidence(row: dict[str, str]) -> str:
    required = ["builder", "model", "year_built", "asking_price", "currency", "listing_url"]
    missing = [field for field in required if not row.get(field)]
    if not missing:
        return "high"
    if len(missing) <= 2 and row.get("builder") and row.get("model"):
        return "medium"
    return "low"


def make_empty_row(
    listing_url: str,
    query: str,
    collected_at: str,
    title: str,
    page_text: str,
) -> DraftRow:
    builder, model, variant = infer_builder_model(query, title)
    price, currency = extract_price_currency(page_text)
    base = {
        "source_name": SOURCE_NAME,
        "listing_url": listing_url,
        "source_listing_key": source_key_from_url(listing_url),
        "collected_at": collected_at,
        "search_query": query,
        "dataset_group": "",
        "raw_title": short_text(title),
        "builder": builder,
        "model": model,
        "variant": variant,
        "year_built": extract_year(page_text),
        "asking_price": price,
        "currency": currency,
        "location_text": "",
        "country": "",
        "length_overall": "",
        "beam": "",
        "cabins": "",
        "berths": "",
        "heads": "",
        "engine_count": "",
        "engine_power": "",
        "fuel_or_propulsion": "",
        "ownership_status": "",
        "private_charter_excharter_signal": "",
        "condition_notes": "",
        "refit_notes": "",
        "equipment_notes": "",
        "listing_status": "active",
        "extraction_confidence": "",
        "review_status": "draft",
        "reviewer_notes": "",
    }
    confidence = extraction_confidence(base)
    base["extraction_confidence"] = confidence
    base["dataset_group"] = classify_group(query, title, confidence)
    return DraftRow(**base)


def extract_title(html: str) -> str:
    title_match = re.search(r"<h1[^>]*>(.*?)</h1>", html, flags=re.IGNORECASE | re.DOTALL)
    if title_match:
        return short_text(title_match.group(1))
    doc_title = re.search(r"<title[^>]*>(.*?)</title>", html, flags=re.IGNORECASE | re.DOTALL)
    if doc_title:
        return short_text(doc_title.group(1).split("|")[0])
    return ""


def collect_rows(queries: list[str], limit: int) -> tuple[list[DraftRow], CollectionSummary]:
    rows: list[DraftRow] = []
    seen_urls: set[str] = set()
    blockers: list[str] = []
    listings_attempted = 0
    collected_at = datetime.now(timezone.utc).isoformat()

    for query in queries:
        if len(rows) >= limit:
            break

        query_links: list[str] = []
        for search_url in search_urls_for_query(query):
            try:
                html = request_html(search_url)
                query_links.extend(extract_listing_links(html))
                time.sleep(REQUEST_DELAY_SECONDS)
            except HTTPError as exc:
                blockers.append(f"{query}: {search_url} returned HTTP {exc.code}")
            except (URLError, TimeoutError, RuntimeError) as exc:
                blockers.append(f"{query}: {search_url} failed: {exc}")

        for listing_url in dict.fromkeys(query_links):
            if len(rows) >= limit:
                break
            if listing_url in seen_urls:
                continue

            seen_urls.add(listing_url)
            listings_attempted += 1
            try:
                html = request_html(listing_url)
                page_text = clean_text(html)
                title = extract_title(html)
                if not title:
                    blockers.append(f"{listing_url}: missing title selector")
                    continue
                rows.append(make_empty_row(listing_url, query, collected_at, title, page_text))
                time.sleep(REQUEST_DELAY_SECONDS)
            except HTTPError as exc:
                blockers.append(f"{listing_url}: returned HTTP {exc.code}")
            except (URLError, TimeoutError, RuntimeError) as exc:
                blockers.append(f"{listing_url}: failed: {exc}")

    missing_counts = {
        field: sum(1 for row in rows if not getattr(row, field))
        for field in FIELDNAMES
        if field
        not in {
            "reviewer_notes",
            "condition_notes",
            "refit_notes",
            "equipment_notes",
        }
    }
    rows_needing_review = sum(
        1
        for row in rows
        if row.extraction_confidence == "low"
        or row.dataset_group == "incomplete_review_needed"
    )

    summary = CollectionSummary(
        queries_attempted=len(queries),
        listings_attempted=listings_attempted,
        rows_extracted=len(rows),
        output_csv="",
        output_json="",
        missing_field_counts=missing_counts,
        rows_needing_manual_review=rows_needing_review,
        blockers=blockers[:25],
    )
    return rows, summary


def write_csv(path: Path, rows: Iterable[DraftRow]) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES)
        writer.writeheader()
        for row in rows:
            writer.writerow(asdict(row))


def write_json(path: Path, rows: Iterable[DraftRow]) -> None:
    payload = [asdict(row) for row in rows]
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_readme(path: Path, rows: list[DraftRow], summary: CollectionSummary) -> None:
    status = (
        "Live collection produced draft rows."
        if rows
        else "Live collection did not produce rows. Boat24 access or parsing was blocked."
    )
    blocker_text = "\n".join(f"- {blocker}" for blocker in summary.blockers) or "- None"
    path.write_text(
        "\n".join(
            [
                "# Boat24 mixed common models draft dataset",
                "",
                "This folder contains the Step 5.5 Boat24 draft dataset for owner/manual review.",
                "",
                "This is not production scraping. These files are draft fixtures only and must not be imported automatically.",
                "",
                f"Status: {status}",
                "",
                "Source: Boat24",
                "",
                "Initial target size: 10-20 rows. Hard cap: 20 rows.",
                "",
                "Review rules before any future raw import:",
                "- builder must be visible or intentionally corrected by the owner",
                "- model must be visible or intentionally corrected by the owner",
                "- year may be blank only if the owner accepts it",
                "- price and currency must be visible for valuation-ready testing",
                "- listing URL must be stable",
                "- obvious parsing errors must be corrected",
                "- `review_status` must remain `draft` until owner approval",
                "",
                "Future ingestion boundary:",
                "- approved rows may later be imported into `raw_listings` only",
                "- no row from this folder may be inserted directly into `boats`, `listings`, or `valuation_ready_comparables`",
                "- Step 4 pipeline remains the only path from raw records to normalized rows",
                "",
                "Last run summary:",
                f"- queries attempted: {summary.queries_attempted}",
                f"- listings attempted: {summary.listings_attempted}",
                f"- rows extracted: {summary.rows_extracted}",
                f"- rows needing manual review: {summary.rows_needing_manual_review}",
                "",
                "Collection blockers / warnings:",
                blocker_text,
                "",
                "Manual fallback if Boat24 blocks automated access:",
                "- owner manually opens Boat24 search results for the seed models",
                "- owner fills the CSV/JSON draft rows with visible facts only",
                "- owner keeps `review_status=draft` until review is complete",
                "- future import still targets raw ingestion only",
                "",
            ]
        ),
        encoding="utf-8",
    )


def print_summary(summary: CollectionSummary) -> None:
    print("Boat24 curated mixed dataset summary")
    print(f"queries attempted: {summary.queries_attempted}")
    print(f"listings attempted: {summary.listings_attempted}")
    print(f"rows extracted: {summary.rows_extracted}")
    print(f"output CSV: {summary.output_csv}")
    print(f"output JSON: {summary.output_json}")
    print(f"rows needing manual review: {summary.rows_needing_manual_review}")
    print("missing-field counts:")
    for field, count in summary.missing_field_counts.items():
        if count:
            print(f"  {field}: {count}")
    if summary.blockers:
        print("blockers/warnings:")
        for blocker in summary.blockers:
            print(f"  - {blocker}")


def main() -> int:
    args = parse_args()
    limit = max(1, min(args.limit, HARD_LIMIT))
    queries = (
        [item.strip() for item in args.queries.split(",") if item.strip()]
        if args.queries
        else DEFAULT_QUERIES
    )
    out_dir: Path = args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    rows, summary = collect_rows(queries, limit)
    csv_path = out_dir / "boat24_mixed_common_models_draft.csv"
    json_path = out_dir / "boat24_mixed_common_models_draft.json"
    readme_path = out_dir / "README.md"

    write_csv(csv_path, rows)
    write_json(json_path, rows)
    summary.output_csv = str(csv_path)
    summary.output_json = str(json_path)
    write_readme(readme_path, rows, summary)
    print_summary(summary)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
