# Pipeline Service Boundary

This service owns:

- extraction
- canonical mapping
- normalization
- validation
- dedupe
- quality scoring
- review queue generation
- publication to normalized and valuation-ready layers

It reads from raw ingestion and publishes clean business-safe datasets.
