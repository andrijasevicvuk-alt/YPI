# Ingestion Service Boundary

This service owns controlled acquisition into raw ingestion tables.

Primary acquisition path:

- marketplace and broker scraping adapters

Bootstrap/admin paths:

- manual entry
- CSV import
- seed import

Pilot scraping paths:

- pilot broker adapter
- pilot marketplace adapter

Rules:

- write raw records first
- keep source-specific behavior here
- do not publish valuation-ready rows directly from ingestion
- do not let manual entry or CSV import define the main product flow
