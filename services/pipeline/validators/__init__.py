"""Validation step placeholder."""
from ..contracts import NormalizationResult, ValidationResult, Validator


class UnconfiguredValidator:
    def validate(self, normalized: NormalizationResult) -> ValidationResult:
        raise NotImplementedError(
            "Validation is not implemented yet. Provide a Validator implementation for the next phase."
        )


__all__ = ["NormalizationResult", "ValidationResult", "Validator", "UnconfiguredValidator"]
