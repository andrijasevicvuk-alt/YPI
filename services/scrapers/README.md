# Scrapers Service Boundary

This directory is intentionally present from the start, but full scraping is not implemented yet.

Current purpose:

- reserve the adapter boundary
- keep raw acquisition separate from the pipeline and scoring packages
- store future source fixtures and parser tests

Pilot scraping is the primary market data acquisition path. Start with one or two marketplace/broker adapters once the raw ingestion boundary and source registry contracts are stable.
