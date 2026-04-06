# Services

Runtime boundaries are split by responsibility:

- `ingestion/` collects raw input
- `pipeline/` transforms raw input into normalized and valuation-ready layers
- `scrapers/` holds later pilot adapters and fixtures

Acquisition logic must remain separate from business scoring logic.
