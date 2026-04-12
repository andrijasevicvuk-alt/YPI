from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Mapping, Protocol, Sequence


@dataclass(frozen=True)
class RawListingEnvelope:
    raw_listing_id: str
    source_site_id: str
    acquisition_method: str
    source_listing_key: str | None
    listing_url: str | None
    observed_at: datetime
    raw_title: str | None
    raw_price_text: str | None
    raw_location_text: str | None
    raw_description: str | None
    raw_specs: Mapping[str, Any] | None = None
    raw_payload: Mapping[str, Any] | None = None
    input_payload: Mapping[str, Any] | None = None


@dataclass(frozen=True)
class ExtractedField:
    field_name: str
    extracted_value: Any
    extraction_method: str
    extraction_confidence: float


@dataclass(frozen=True)
class ExtractionResult:
    raw_listing: RawListingEnvelope
    fields: Sequence[ExtractedField]
    warnings: Sequence[str] = field(default_factory=tuple)


@dataclass(frozen=True)
class NormalizedBoatCandidate:
    builder_alias: str | None
    model_alias: str | None
    variant_alias: str | None
    year_built: int | None
    year_launched: int | None
    boat_type: str | None
    loa_m: float | None
    beam_m: float | None
    draft_m: float | None
    cabins: int | None
    berths: int | None
    heads: int | None
    hull_material: str | None
    condition_rating: float | None
    refit_year: int | None


@dataclass(frozen=True)
class NormalizedEngineCandidate:
    engine_brand: str | None
    engine_model: str | None
    engine_count: int | None
    horsepower_each: int | None
    engine_hours: int | None
    engine_type: str | None
    fuel_type: str | None
    drive_type: str | None


@dataclass(frozen=True)
class NormalizedListingCandidate:
    source_site_id: str
    source_listing_key: str | None
    title: str | None
    listing_url: str | None
    country_alias: str | None
    location_alias: str | None
    marina_or_city: str | None
    ownership_status_hint: str | None
    listing_status: str
    asking_price: float | None
    currency: str | None
    price_eur: float | None
    first_seen_at: datetime
    last_seen_at: datetime
    description_raw: str | None
    parse_confidence: float | None
    data_quality_score: float | None


@dataclass(frozen=True)
class NormalizationResult:
    raw_listing: RawListingEnvelope
    boat: NormalizedBoatCandidate | None
    engines: Sequence[NormalizedEngineCandidate]
    listing: NormalizedListingCandidate
    worker_notes: Sequence[str] = field(default_factory=tuple)


@dataclass(frozen=True)
class ValidationIssue:
    issue_type: str
    severity: str
    message: str
    field_name: str | None = None
    is_blocking: bool = False


@dataclass(frozen=True)
class ValidationResult:
    normalization: NormalizationResult
    issues: Sequence[ValidationIssue]
    review_reasons: Sequence[str] = field(default_factory=tuple)

    @property
    def is_publishable(self) -> bool:
        return not any(issue.is_blocking for issue in self.issues)


@dataclass(frozen=True)
class PublicationResult:
    raw_listing_id: str
    published_boat_id: str | None
    published_listing_id: str | None
    published_engine_ids: Sequence[str] = field(default_factory=tuple)
    publication_status: str = "draft"
    skipped_reason: str | None = None


class Extractor(Protocol):
    def extract(self, raw_listing: RawListingEnvelope) -> ExtractionResult: ...


class Normalizer(Protocol):
    def normalize(self, extracted: ExtractionResult) -> NormalizationResult: ...


class Validator(Protocol):
    def validate(self, normalized: NormalizationResult) -> ValidationResult: ...


class Publisher(Protocol):
    def publish(self, validation: ValidationResult) -> PublicationResult: ...
