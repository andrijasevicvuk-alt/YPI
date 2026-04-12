"""Publication step placeholder."""
from ..contracts import PublicationResult, Publisher, ValidationResult


class UnconfiguredPublisher:
    def publish(self, validation: ValidationResult) -> PublicationResult:
        raise NotImplementedError(
            "Publication is not implemented yet. Provide a Publisher implementation for the next phase."
        )


__all__ = ["PublicationResult", "Publisher", "UnconfiguredPublisher", "ValidationResult"]
