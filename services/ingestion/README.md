# Ingestion Service Boundary

This service owns controlled acquisition into raw ingestion tables.

Guaranteed MVP paths:

- manual entry
- CSV import
- seed import

Later paths:

- pilot broker adapter
- pilot marketplace adapter

Rules:

- write raw records first
- keep source-specific behavior here
- do not publish valuation-ready rows directly from ingestion
