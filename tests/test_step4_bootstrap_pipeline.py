from __future__ import annotations

import unittest
from datetime import datetime, timezone

from services.pipeline.bootstrap import (
    BootstrapNormalizer,
    BootstrapPipelineRunner,
    BootstrapValidator,
    ManualEntryBootstrapExtractor,
    ProcessingResult,
)
from services.pipeline.contracts import PublicationResult, RawListingEnvelope, ValidationResult


class FakeRawRepository:
    def __init__(self, records: list[RawListingEnvelope]) -> None:
        self.records = records
        self.processed: list[str] = []
        self.failed: list[str] = []

    def fetch_pending(self, limit: int) -> list[RawListingEnvelope]:
        return self.records[:limit]

    def mark_processed(self, raw_listing_id: str) -> None:
        self.processed.append(raw_listing_id)

    def mark_failed(self, raw_listing_id: str, _issues: object) -> None:
        self.failed.append(raw_listing_id)


class FakePublisher:
    def __init__(self) -> None:
        self.validations: list[ValidationResult] = []

    def publish(self, validation: ValidationResult) -> PublicationResult:
        self.validations.append(validation)
        return PublicationResult(
            raw_listing_id=validation.normalization.raw_listing.raw_listing_id,
            published_boat_id="boat-1",
            published_listing_id="listing-1",
            publication_status="published",
        )


class RaisingPublisher:
    def publish(self, _validation: ValidationResult) -> PublicationResult:
        raise RuntimeError("publication failed")


def make_raw_listing(**overrides: object) -> RawListingEnvelope:
    defaults = {
        "raw_listing_id": "raw-1",
        "source_site_id": "source-1",
        "acquisition_method": "manual_entry",
        "source_listing_key": "step4-smoke-lagoon-42",
        "listing_url": "https://example.test/listings/lagoon-42",
        "observed_at": datetime(2026, 4, 27, tzinfo=timezone.utc),
        "raw_title": "Lagoon 42 Step 4 Smoke Test",
        "raw_price_text": "420000 EUR",
        "raw_location_text": "Hrvatska, Split",
        "raw_description": "Controlled Step 4 manual-entry payload.",
        "raw_specs": {
            "builder_input": "Lagoon",
            "model_input": "42",
            "variant_input": "Owner Version",
            "year_input": "2020",
            "currency_input": "EUR",
            "ownership_status_hint": "private",
        },
        "raw_payload": {
            "asking_price": "420000",
            "currency": "EUR",
            "location": "Hrvatska, Split",
        },
        "input_payload": {},
    }
    defaults.update(overrides)
    return RawListingEnvelope(**defaults)  # type: ignore[arg-type]


class Step4BootstrapPipelineTests(unittest.TestCase):
    def test_controlled_manual_entry_payload_normalizes_and_validates(self) -> None:
        extractor = ManualEntryBootstrapExtractor()
        normalizer = BootstrapNormalizer()
        validator = BootstrapValidator()

        extracted = extractor.extract(make_raw_listing())
        normalized = normalizer.normalize(extracted)
        validation = validator.validate(normalized)

        self.assertTrue(validation.is_publishable)
        self.assertIsNotNone(normalized.boat)
        self.assertEqual(normalized.boat.builder_alias, "Lagoon")
        self.assertEqual(normalized.boat.model_alias, "42")
        self.assertEqual(normalized.boat.variant_alias, "Owner Version")
        self.assertEqual(normalized.boat.year_built, 2020)
        self.assertEqual(normalized.listing.asking_price, 420000.0)
        self.assertEqual(normalized.listing.currency, "EUR")
        self.assertEqual(normalized.listing.price_eur, 420000.0)
        self.assertEqual(normalized.listing.ownership_status_hint, "private")
        self.assertIsNone(normalized.listing.parse_confidence)
        self.assertIsNone(normalized.listing.data_quality_score)

    def test_missing_builder_blocks_publication_and_marks_failed(self) -> None:
        raw_listing = make_raw_listing(raw_specs={"model_input": "42", "currency_input": "EUR"})
        repository = FakeRawRepository([raw_listing])
        publisher = FakePublisher()
        runner = BootstrapPipelineRunner(
            raw_repository=repository,  # type: ignore[arg-type]
            extractor=ManualEntryBootstrapExtractor(),
            normalizer=BootstrapNormalizer(),
            validator=BootstrapValidator(),
            publisher=publisher,  # type: ignore[arg-type]
        )

        results = runner.run_pending(limit=1)

        self.assertEqual([result.status for result in results], ["failed"])
        self.assertEqual(repository.failed, ["raw-1"])
        self.assertEqual(repository.processed, [])
        self.assertEqual(publisher.validations, [])

    def test_publishable_record_marks_processed(self) -> None:
        repository = FakeRawRepository([make_raw_listing()])
        publisher = FakePublisher()
        runner = BootstrapPipelineRunner(
            raw_repository=repository,  # type: ignore[arg-type]
            extractor=ManualEntryBootstrapExtractor(),
            normalizer=BootstrapNormalizer(),
            validator=BootstrapValidator(),
            publisher=publisher,  # type: ignore[arg-type]
        )

        results: list[ProcessingResult] = runner.run_pending(limit=1)

        self.assertEqual([result.status for result in results], ["processed"])
        self.assertEqual(repository.processed, ["raw-1"])
        self.assertEqual(repository.failed, [])
        self.assertEqual(results[0].publication.published_boat_id, "boat-1")  # type: ignore[union-attr]

    def test_publication_exception_marks_failed(self) -> None:
        repository = FakeRawRepository([make_raw_listing()])
        runner = BootstrapPipelineRunner(
            raw_repository=repository,  # type: ignore[arg-type]
            extractor=ManualEntryBootstrapExtractor(),
            normalizer=BootstrapNormalizer(),
            validator=BootstrapValidator(),
            publisher=RaisingPublisher(),  # type: ignore[arg-type]
        )

        results = runner.run_pending(limit=1)

        self.assertEqual([result.status for result in results], ["failed"])
        self.assertEqual(repository.failed, ["raw-1"])
        self.assertEqual(repository.processed, [])
        self.assertEqual(results[0].issues[0].issue_type, "pipeline_exception")


if __name__ == "__main__":
    unittest.main()
