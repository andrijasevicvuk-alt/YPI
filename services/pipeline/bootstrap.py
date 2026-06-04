from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Iterable, Mapping, Sequence
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from .contracts import (
    ExtractedField,
    ExtractionResult,
    NormalizationResult,
    NormalizedBoatCandidate,
    NormalizedListingCandidate,
    PublicationResult,
    RawListingEnvelope,
    ValidationIssue,
    ValidationResult,
)


class PipelineConfigurationError(RuntimeError):
    pass


class PipelineRequestError(RuntimeError):
    pass


def _blank_to_none(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _first_text(*values: Any) -> str | None:
    for value in values:
        text = _blank_to_none(value)
        if text is not None:
            return text
    return None


def _parse_datetime(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed


def _parse_year(value: Any) -> int | None:
    text = _blank_to_none(value)
    if text is None:
        return None
    match = re.search(r"\b(18\d{2}|19\d{2}|20\d{2}|2100)\b", text)
    if not match:
        return None
    return int(match.group(1))


def _parse_decimal(value: Any) -> Decimal | None:
    text = _blank_to_none(value)
    if text is None:
        return None
    cleaned = re.sub(r"[^0-9,.\-]", "", text)
    if not cleaned:
        return None
    if "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(".", "").replace(",", ".")
    else:
        cleaned = cleaned.replace(",", ".")
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def _normalize_currency(value: Any) -> str | None:
    text = _blank_to_none(value)
    if text is None:
        return None
    match = re.search(r"\b[A-Za-z]{3}\b", text)
    return match.group(0).upper() if match else None


def _to_json_value(value: Any) -> Any:
    if isinstance(value, Decimal):
        return str(value)
    return value


def _get_mapping(mapping: Mapping[str, Any] | None, key: str) -> Any:
    if not mapping:
        return None
    return mapping.get(key)


class ManualEntryBootstrapExtractor:
    def extract(self, raw_listing: RawListingEnvelope) -> ExtractionResult:
        specs = raw_listing.raw_specs or {}
        payload = raw_listing.raw_payload or {}
        input_payload = raw_listing.input_payload or {}

        field_values: dict[str, Any] = {
            "builder": _first_text(
                _get_mapping(specs, "builder_input"),
                _get_mapping(payload, "builder"),
                _get_mapping(input_payload, "builder"),
            ),
            "model": _first_text(
                _get_mapping(specs, "model_input"),
                _get_mapping(payload, "model"),
                _get_mapping(input_payload, "model"),
            ),
            "variant": _first_text(
                _get_mapping(specs, "variant_input"),
                _get_mapping(payload, "variant"),
                _get_mapping(input_payload, "variant"),
            ),
            "year": _first_text(
                _get_mapping(specs, "year_input"),
                _get_mapping(payload, "year_built"),
                _get_mapping(input_payload, "year_built"),
            ),
            "asking_price": _first_text(
                _get_mapping(payload, "asking_price"),
                _get_mapping(input_payload, "asking_price"),
                raw_listing.raw_price_text,
            ),
            "currency": _first_text(
                _get_mapping(specs, "currency_input"),
                _get_mapping(payload, "currency"),
                _get_mapping(input_payload, "currency"),
                raw_listing.raw_price_text,
            ),
            "location_text": _first_text(
                raw_listing.raw_location_text,
                _get_mapping(payload, "location"),
                _get_mapping(input_payload, "location"),
            ),
            "ownership_hint": _first_text(
                _get_mapping(specs, "ownership_status_hint"),
                _get_mapping(payload, "ownership_status_hint"),
                _get_mapping(input_payload, "ownership_status_hint"),
            ),
        }

        fields = tuple(
            ExtractedField(
                field_name=name,
                extracted_value=value,
                extraction_method="manual_entry_payload",
                extraction_confidence=0.95 if value is not None else 0.0,
            )
            for name, value in field_values.items()
        )
        return ExtractionResult(raw_listing=raw_listing, fields=fields)


class BootstrapNormalizer:
    def normalize(self, extracted: ExtractionResult) -> NormalizationResult:
        values = {field.field_name: field.extracted_value for field in extracted.fields}
        year_built = _parse_year(values.get("year"))
        asking_price = _parse_decimal(values.get("asking_price"))
        currency = _normalize_currency(values.get("currency"))
        ownership_hint = _blank_to_none(values.get("ownership_hint")) or "unknown"
        if ownership_hint not in {"private", "charter", "ex_charter", "unknown"}:
            ownership_hint = "unknown"

        boat = NormalizedBoatCandidate(
            builder_alias=_blank_to_none(values.get("builder")),
            model_alias=_blank_to_none(values.get("model")),
            variant_alias=_blank_to_none(values.get("variant")),
            year_built=year_built,
            year_launched=None,
            boat_type=None,
            loa_m=None,
            beam_m=None,
            draft_m=None,
            cabins=None,
            berths=None,
            heads=None,
            hull_material=None,
            condition_rating=None,
            refit_year=None,
        )
        raw = extracted.raw_listing
        listing = NormalizedListingCandidate(
            source_site_id=raw.source_site_id,
            source_listing_key=raw.source_listing_key,
            title=raw.raw_title,
            listing_url=raw.listing_url,
            country_alias=None,
            location_alias=_blank_to_none(values.get("location_text")),
            marina_or_city=_blank_to_none(values.get("location_text")),
            ownership_status_hint=ownership_hint,
            listing_status="active",
            asking_price=float(asking_price) if asking_price is not None else None,
            currency=currency,
            price_eur=float(asking_price)
            if asking_price is not None and currency == "EUR"
            else None,
            first_seen_at=raw.observed_at,
            last_seen_at=raw.observed_at,
            description_raw=raw.raw_description,
            parse_confidence=None,
            data_quality_score=None,
        )
        return NormalizationResult(
            raw_listing=raw,
            boat=boat,
            engines=(),
            listing=listing,
        )


class BootstrapValidator:
    def validate(self, normalized: NormalizationResult) -> ValidationResult:
        issues: list[ValidationIssue] = []
        boat = normalized.boat
        listing = normalized.listing

        if boat is None or not _blank_to_none(boat.builder_alias):
            issues.append(
                ValidationIssue(
                    issue_type="missing_builder",
                    severity="error",
                    message="Builder is required for Step 4 normalized publication.",
                    field_name="builder",
                    is_blocking=True,
                )
            )
        if boat is None or not _blank_to_none(boat.model_alias):
            issues.append(
                ValidationIssue(
                    issue_type="missing_model",
                    severity="error",
                    message="Model is required for Step 4 normalized publication.",
                    field_name="model",
                    is_blocking=True,
                )
            )
        if listing.asking_price is None:
            issues.append(
                ValidationIssue(
                    issue_type="missing_price",
                    severity="error",
                    message="Asking price is required for first listing publication slice.",
                    field_name="asking_price",
                    is_blocking=True,
                )
            )
        if not listing.currency:
            issues.append(
                ValidationIssue(
                    issue_type="missing_currency",
                    severity="error",
                    message="Currency is required for first listing publication slice.",
                    field_name="currency",
                    is_blocking=True,
                )
            )

        return ValidationResult(normalization=normalized, issues=tuple(issues))


@dataclass(frozen=True)
class ProcessingResult:
    raw_listing_id: str
    status: str
    publication: PublicationResult | None = None
    issues: Sequence[ValidationIssue] = ()


class SupabaseRestClient:
    def __init__(self, project_url: str, api_key: str, schema: str = "public") -> None:
        self.project_url = project_url.rstrip("/")
        self.api_key = api_key
        self.schema = schema

    @classmethod
    def from_env(cls) -> "SupabaseRestClient":
        project_url = _first_text(
            os.environ.get("SUPABASE_URL"),
            os.environ.get("NEXT_PUBLIC_SUPABASE_URL"),
        )
        api_key = _first_text(
            os.environ.get("SUPABASE_SERVICE_ROLE_KEY"),
            os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
        )
        if project_url is None or api_key is None:
            raise PipelineConfigurationError(
                "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the Step 4 pipeline."
            )
        return cls(project_url=project_url, api_key=api_key)

    def request(
        self,
        method: str,
        path: str,
        *,
        query: Mapping[str, str] | None = None,
        body: Any | None = None,
        prefer: str | None = None,
    ) -> Any:
        url = f"{self.project_url}{path}"
        if query:
            url = f"{url}?{urlencode(query)}"
        payload = None if body is None else json.dumps(body, default=_to_json_value).encode()
        headers = {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "Accept-Profile": self.schema,
            "Content-Profile": self.schema,
        }
        if body is not None:
            headers["Content-Type"] = "application/json"
        if prefer is not None:
            headers["Prefer"] = prefer

        request = Request(url, data=payload, method=method, headers=headers)
        try:
            with urlopen(request, timeout=30) as response:
                response_body = response.read().decode()
                return json.loads(response_body) if response_body else None
        except HTTPError as error:
            error_body = error.read().decode()
            raise PipelineRequestError(f"{method} {path} failed: {error_body}") from error

    def get_many(self, table: str, query: Mapping[str, str]) -> list[dict[str, Any]]:
        result = self.request("GET", f"/rest/v1/{table}", query=query)
        return list(result or [])

    def insert_one(self, table: str, row: Mapping[str, Any]) -> dict[str, Any]:
        result = self.request(
            "POST",
            f"/rest/v1/{table}",
            body=row,
            prefer="return=representation",
        )
        if not result:
            raise PipelineRequestError(f"Insert into {table} did not return a row.")
        return dict(result[0])

    def patch(self, table: str, query: Mapping[str, str], row: Mapping[str, Any]) -> None:
        self.request("PATCH", f"/rest/v1/{table}", query=query, body=row)


class SupabaseRawListingRepository:
    def __init__(self, client: SupabaseRestClient) -> None:
        self.client = client

    def fetch_pending(self, limit: int) -> list[RawListingEnvelope]:
        rows = self.client.get_many(
            "raw_listings",
            {
                "select": ",".join(
                    (
                        "id",
                        "source_site_id",
                        "acquisition_method",
                        "source_listing_key",
                        "listing_url",
                        "observed_at",
                        "raw_title",
                        "raw_price_text",
                        "raw_location_text",
                        "raw_description",
                        "raw_specs_json",
                        "raw_payload_json",
                        "input_payload_json",
                    )
                ),
                "ingest_status": "eq.pending",
                "order": "observed_at.asc",
                "limit": str(limit),
            },
        )
        return [self._to_envelope(row) for row in rows]

    def mark_processed(self, raw_listing_id: str) -> None:
        self.client.patch(
            "raw_listings",
            {"id": f"eq.{raw_listing_id}"},
            {"ingest_status": "processed"},
        )

    def mark_failed(self, raw_listing_id: str, issues: Sequence[ValidationIssue]) -> None:
        self.client.patch(
            "raw_listings",
            {"id": f"eq.{raw_listing_id}"},
            {"ingest_status": "failed"},
        )
        error_message = "; ".join(issue.message for issue in issues) or "Step 4 validation failed."
        self.client.insert_one(
            "ingest_errors",
            {
                "raw_listing_id": raw_listing_id,
                "error_stage": "step4_validation",
                "error_code": "validation_failed",
                "error_message": error_message[:500],
                "error_context_json": {
                    "issues": [
                        {
                            "issue_type": issue.issue_type,
                            "severity": issue.severity,
                            "field_name": issue.field_name,
                            "message": issue.message,
                        }
                        for issue in issues
                    ]
                },
            },
        )

    def _to_envelope(self, row: Mapping[str, Any]) -> RawListingEnvelope:
        return RawListingEnvelope(
            raw_listing_id=str(row["id"]),
            source_site_id=str(row["source_site_id"]),
            acquisition_method=str(row["acquisition_method"]),
            source_listing_key=row.get("source_listing_key"),
            listing_url=row.get("listing_url"),
            observed_at=_parse_datetime(row.get("observed_at")),
            raw_title=row.get("raw_title"),
            raw_price_text=row.get("raw_price_text"),
            raw_location_text=row.get("raw_location_text"),
            raw_description=row.get("raw_description"),
            raw_specs=row.get("raw_specs_json") or {},
            raw_payload=row.get("raw_payload_json") or {},
            input_payload=row.get("input_payload_json") or {},
        )


class SupabaseBootstrapPublisher:
    def __init__(self, client: SupabaseRestClient) -> None:
        self.client = client

    def publish(self, validation: ValidationResult) -> PublicationResult:
        raw = validation.normalization.raw_listing
        if not validation.is_publishable:
            return PublicationResult(
                raw_listing_id=raw.raw_listing_id,
                published_boat_id=None,
                published_listing_id=None,
                publication_status="review_required",
                skipped_reason="validation_failed",
            )

        normalized = validation.normalization
        assert normalized.boat is not None
        builder_id = self._resolve_builder(normalized.boat.builder_alias)
        model_id = self._resolve_model(builder_id, normalized.boat.model_alias)
        variant_id = self._resolve_variant(model_id, normalized.boat.variant_alias)
        boat_id = self._resolve_boat(raw.raw_listing_id, builder_id, model_id, variant_id, normalized.boat)
        listing_id = self._resolve_listing(raw.raw_listing_id, boat_id, normalized.listing)

        return PublicationResult(
            raw_listing_id=raw.raw_listing_id,
            published_boat_id=boat_id,
            published_listing_id=listing_id,
            publication_status="published",
        )

    def _resolve_builder(self, canonical_name: str | None) -> str:
        if not canonical_name:
            raise PipelineRequestError("Builder is required before publication.")
        rows = self.client.get_many("boat_builders", {"select": "id", "canonical_name": f"eq.{canonical_name}"})
        if rows:
            return str(rows[0]["id"])
        row = self.client.insert_one(
            "boat_builders",
            {"canonical_name": canonical_name, "normalized_name": canonical_name.lower()},
        )
        return str(row["id"])

    def _resolve_model(self, builder_id: str, canonical_name: str | None) -> str:
        if not canonical_name:
            raise PipelineRequestError("Model is required before publication.")
        rows = self.client.get_many(
            "boat_models",
            {
                "select": "id",
                "builder_id": f"eq.{builder_id}",
                "canonical_name": f"eq.{canonical_name}",
            },
        )
        if rows:
            return str(rows[0]["id"])
        row = self.client.insert_one(
            "boat_models",
            {
                "builder_id": builder_id,
                "canonical_name": canonical_name,
                "normalized_name": canonical_name.lower(),
            },
        )
        return str(row["id"])

    def _resolve_variant(self, model_id: str, canonical_name: str | None) -> str | None:
        if not canonical_name:
            return None
        rows = self.client.get_many(
            "boat_variants",
            {
                "select": "id",
                "model_id": f"eq.{model_id}",
                "canonical_name": f"eq.{canonical_name}",
            },
        )
        if rows:
            return str(rows[0]["id"])
        row = self.client.insert_one(
            "boat_variants",
            {
                "model_id": model_id,
                "canonical_name": canonical_name,
                "normalized_name": canonical_name.lower(),
            },
        )
        return str(row["id"])

    def _resolve_boat(
        self,
        raw_listing_id: str,
        builder_id: str,
        model_id: str,
        variant_id: str | None,
        boat: NormalizedBoatCandidate,
    ) -> str:
        rows = self.client.get_many(
            "boats",
            {"select": "id", "primary_raw_listing_id": f"eq.{raw_listing_id}"},
        )
        if rows:
            return str(rows[0]["id"])
        row = self.client.insert_one(
            "boats",
            {
                "primary_raw_listing_id": raw_listing_id,
                "builder_id": builder_id,
                "model_id": model_id,
                "variant_id": variant_id,
                "year_built": boat.year_built,
                "normalization_status": "normalized",
                "normalization_notes": "step4_bootstrap_pipeline",
            },
        )
        return str(row["id"])

    def _resolve_listing(
        self,
        raw_listing_id: str,
        boat_id: str,
        listing: NormalizedListingCandidate,
    ) -> str:
        rows = self.client.get_many("listings", {"select": "id", "raw_listing_id": f"eq.{raw_listing_id}"})
        if rows:
            return str(rows[0]["id"])
        row = self.client.insert_one(
            "listings",
            {
                "raw_listing_id": raw_listing_id,
                "boat_id": boat_id,
                "source_site_id": listing.source_site_id,
                "source_listing_key": listing.source_listing_key,
                "title": listing.title,
                "listing_url": listing.listing_url,
                "marina_or_city": listing.marina_or_city,
                "ownership_status_code": listing.ownership_status_hint or "unknown",
                "listing_status": listing.listing_status,
                "publication_status": "published",
                "asking_price": listing.asking_price,
                "currency": listing.currency,
                "price_eur": listing.price_eur,
                "first_seen_at": listing.first_seen_at.isoformat(),
                "last_seen_at": listing.last_seen_at.isoformat(),
                "description_raw": listing.description_raw,
                "parse_confidence": listing.parse_confidence,
                "data_quality_score": listing.data_quality_score,
            },
        )
        return str(row["id"])


class BootstrapPipelineRunner:
    def __init__(
        self,
        raw_repository: SupabaseRawListingRepository,
        extractor: ManualEntryBootstrapExtractor,
        normalizer: BootstrapNormalizer,
        validator: BootstrapValidator,
        publisher: SupabaseBootstrapPublisher,
    ) -> None:
        self.raw_repository = raw_repository
        self.extractor = extractor
        self.normalizer = normalizer
        self.validator = validator
        self.publisher = publisher

    def run_pending(self, *, limit: int) -> list[ProcessingResult]:
        results: list[ProcessingResult] = []
        for raw_listing in self.raw_repository.fetch_pending(limit):
            try:
                extracted = self.extractor.extract(raw_listing)
                normalized = self.normalizer.normalize(extracted)
                validation = self.validator.validate(normalized)
                if not validation.is_publishable:
                    self.raw_repository.mark_failed(raw_listing.raw_listing_id, validation.issues)
                    results.append(
                        ProcessingResult(
                            raw_listing_id=raw_listing.raw_listing_id,
                            status="failed",
                            issues=validation.issues,
                        )
                    )
                    continue

                publication = self.publisher.publish(validation)
                self.raw_repository.mark_processed(raw_listing.raw_listing_id)
                results.append(
                    ProcessingResult(
                        raw_listing_id=raw_listing.raw_listing_id,
                        status="processed",
                        publication=publication,
                    )
                )
            except Exception as error:
                issue = ValidationIssue(
                    issue_type="pipeline_exception",
                    severity="error",
                    message=str(error),
                    is_blocking=True,
                )
                self.raw_repository.mark_failed(raw_listing.raw_listing_id, (issue,))
                results.append(
                    ProcessingResult(
                        raw_listing_id=raw_listing.raw_listing_id,
                        status="failed",
                        issues=(issue,),
                    )
                )
        return results


def build_runner_from_env() -> BootstrapPipelineRunner:
    client = SupabaseRestClient.from_env()
    return BootstrapPipelineRunner(
        raw_repository=SupabaseRawListingRepository(client),
        extractor=ManualEntryBootstrapExtractor(),
        normalizer=BootstrapNormalizer(),
        validator=BootstrapValidator(),
        publisher=SupabaseBootstrapPublisher(client),
    )


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run the Step 4 bootstrap raw-to-normalized pipeline.")
    parser.add_argument("--limit", type=int, default=1, help="Maximum pending raw records to process.")
    args = parser.parse_args(argv)

    runner = build_runner_from_env()
    results = runner.run_pending(limit=args.limit)
    for result in results:
        print(
            json.dumps(
                {
                    "rawListingId": result.raw_listing_id,
                    "status": result.status,
                    "boatId": result.publication.published_boat_id if result.publication else None,
                    "listingId": result.publication.published_listing_id if result.publication else None,
                    "issues": [issue.message for issue in result.issues],
                },
                ensure_ascii=False,
            )
        )
    if not results:
        print("No pending raw listings found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
