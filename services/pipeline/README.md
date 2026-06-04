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

## Step 4 bootstrap runner

The current implemented slice is intentionally small. It processes controlled
manual-entry/bootstrap raw records only:

`raw_listings -> extraction -> normalization -> validation -> boats + listings`

It does not implement scoring, ranking, confidence, geography weighting,
scraping, dedupe, or valuation-ready publication.

### Local run

Start local Supabase and make sure a manual-entry record exists with
`raw_listings.ingest_status = 'pending'`.

Set the same server-side env vars used by the web app:

```powershell
$env:SUPABASE_URL="http://127.0.0.1:54321"
$env:SUPABASE_SERVICE_ROLE_KEY="<service_role key from supabase status>"
python -m services.pipeline.bootstrap --limit 1
```

Equivalent entry point:

```powershell
python -m services.pipeline.publish.run_pipeline --limit 1
```

### Verification checklist

After running the pipeline, verify:

```sql
select id, ingest_status
from public.raw_listings
order by created_at desc
limit 5;
```

```sql
select id, primary_raw_listing_id, builder_id, model_id, normalization_status
from public.boats
order by created_at desc
limit 5;
```

```sql
select id, raw_listing_id, boat_id, publication_status, asking_price, currency
from public.listings
order by created_at desc
limit 5;
```

Expected result:

- successful record moves from `pending` to `processed`
- `boats.primary_raw_listing_id` points back to the raw record
- `listings.raw_listing_id` points back to the raw record
- validation failures move the raw record to `failed` and create an `ingest_errors` row
