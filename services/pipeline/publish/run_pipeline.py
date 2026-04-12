"""Pipeline entry point placeholder.

This will later orchestrate:
1. raw record selection
2. extraction
3. normalization
4. validation
5. dedupe
6. quality scoring
7. publication to normalized and valuation-ready layers
"""

from __future__ import annotations

try:
    from ..contracts import (
        Extractor,
        Normalizer,
        PublicationResult,
        Publisher,
        RawListingEnvelope,
        Validator,
    )
except ImportError:  # pragma: no cover - fallback for direct script execution
    from services.pipeline.contracts import (  # type: ignore
        Extractor,
        Normalizer,
        PublicationResult,
        Publisher,
        RawListingEnvelope,
        Validator,
    )


def run_pipeline_for_record(
    raw_listing: RawListingEnvelope,
    *,
    extractor: Extractor,
    normalizer: Normalizer,
    validator: Validator,
    publisher: Publisher,
) -> PublicationResult:
    extracted = extractor.extract(raw_listing)
    normalized = normalizer.normalize(extracted)
    validation = validator.validate(normalized)
    return publisher.publish(validation)


def main() -> None:
    raise NotImplementedError(
        "Pipeline orchestration is not implemented yet. Wire concrete extractor/normalizer/validator/publisher components first."
    )


if __name__ == "__main__":
    main()
