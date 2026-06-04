# Tests

Testing priorities for the next phase:

- migration smoke checks
- manual-entry ingestion tests
- mapping and normalization unit tests
- valuation-ready publication tests
- fixture-based parser tests for later pilot sources

Current Step 4 smoke tests:

```powershell
python -m unittest tests.test_step4_bootstrap_pipeline
```
