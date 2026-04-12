"""Extraction step placeholder."""
from ..contracts import ExtractionResult, Extractor, RawListingEnvelope


class UnconfiguredExtractor:
    def extract(self, raw_listing: RawListingEnvelope) -> ExtractionResult:
        raise NotImplementedError(
            "Extraction is not implemented yet. Provide an Extractor implementation for the next phase."
        )


__all__ = ["ExtractionResult", "Extractor", "RawListingEnvelope", "UnconfiguredExtractor"]
