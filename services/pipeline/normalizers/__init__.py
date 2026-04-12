"""Normalization step placeholder."""
from ..contracts import ExtractionResult, NormalizationResult, Normalizer


class UnconfiguredNormalizer:
    def normalize(self, extracted: ExtractionResult) -> NormalizationResult:
        raise NotImplementedError(
            "Normalization is not implemented yet. Provide a Normalizer implementation for the next phase."
        )


__all__ = ["ExtractionResult", "NormalizationResult", "Normalizer", "UnconfiguredNormalizer"]
