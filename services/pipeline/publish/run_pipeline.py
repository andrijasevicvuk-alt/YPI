"""Small Step 4 pipeline orchestration helpers."""

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
    try:
        from ..bootstrap import main as bootstrap_main
    except ImportError:  # pragma: no cover - fallback for direct script execution
        from services.pipeline.bootstrap import main as bootstrap_main  # type: ignore

    raise SystemExit(bootstrap_main())


if __name__ == "__main__":
    main()
