begin;

do $$
declare
  v_receipt jsonb;
  v_raw_listing_id uuid;
  v_manual_entry_id uuid;
  v_ingest_run_id uuid;
  v_source_site_id uuid;
  v_boats_before bigint;
  v_boats_after bigint;
  v_engines_before bigint;
  v_engines_after bigint;
  v_listings_before bigint;
  v_listings_after bigint;
  v_price_history_before bigint;
  v_price_history_after bigint;
  v_worker_notes_before bigint;
  v_worker_notes_after bigint;
  v_count bigint;
begin
  select count(*) into v_boats_before from public.boats;
  select count(*) into v_engines_before from public.engines;
  select count(*) into v_listings_before from public.listings;
  select count(*) into v_price_history_before from public.price_history;
  select count(*) into v_worker_notes_before from public.worker_notes;

  select public.submit_manual_entry(
    jsonb_build_object(
      'source_name', 'internal_manual_entry',
      'entered_by', 'step3-smoke',
      'listing_url', 'https://example.test/listings/lagoon-42-step3-smoke',
      'source_listing_key', 'step3-smoke-lagoon-42',
      'title', 'Lagoon 42 Step 3 Smoke Test',
      'description', 'Kontrolirani Step 3 smoke test za manual-entry raw ingestion.',
      'builder', 'Lagoon',
      'model', '42',
      'variant', 'Owner Version',
      'year_built', '2020',
      'asking_price', '420000',
      'currency', 'EUR',
      'location', 'Hrvatska, Split',
      'ownership_status_hint', 'private',
      'engine_info', '2x Yanmar 57 HP',
      'raw_notes', 'Ovaj zapis mora ostati u raw ingestion sloju.'
    )
  ) into v_receipt;

  v_raw_listing_id := (v_receipt->>'rawListingId')::uuid;
  v_manual_entry_id := (v_receipt->>'manualEntryId')::uuid;
  v_ingest_run_id := (v_receipt->>'ingestRunId')::uuid;
  v_source_site_id := (v_receipt->>'sourceSiteId')::uuid;

  if v_receipt->>'sourceName' <> 'internal_manual_entry' then
    raise exception 'Unexpected sourceName in receipt: %', v_receipt;
  end if;

  if v_receipt->>'acquisitionMethod' <> 'manual_entry' then
    raise exception 'Unexpected acquisitionMethod in receipt: %', v_receipt;
  end if;

  select count(*) into v_count
  from public.ingest_runs ir
  join public.source_sites ss on ss.id = ir.source_site_id
  where ir.id = v_ingest_run_id
    and ir.source_site_id = v_source_site_id
    and ir.acquisition_method = 'manual_entry'
    and ir.trigger_type = 'worker_submit'
    and ir.status = 'completed'
    and ir.record_count = 1
    and ir.notes = 'manual_entry_submitted_to_raw_ingestion'
    and ss.source_name = 'internal_manual_entry'
    and ss.source_type = 'manual'
    and ss.allowed_collection_method = 'manual_only';

  if v_count <> 1 then
    raise exception 'ingest_runs/source_sites verification failed for receipt: %', v_receipt;
  end if;

  select count(*) into v_count
  from public.raw_listings rl
  where rl.id = v_raw_listing_id
    and rl.ingest_run_id = v_ingest_run_id
    and rl.source_site_id = v_source_site_id
    and rl.acquisition_method = 'manual_entry'
    and rl.source_listing_key = 'step3-smoke-lagoon-42'
    and rl.raw_title = 'Lagoon 42 Step 3 Smoke Test'
    and rl.raw_price_text = '420000 EUR'
    and rl.raw_location_text = 'Hrvatska, Split'
    and rl.ingest_status = 'pending'
    and rl.raw_specs_json->>'builder_input' = 'Lagoon'
    and rl.raw_specs_json->>'model_input' = '42'
    and rl.raw_specs_json->>'year_input' = '2020'
    and rl.raw_payload_json->>'origin' = 'manual_entry'
    and rl.raw_payload_json->>'submitted_via' = 'web_manual_entry_form'
    and rl.raw_payload_json->>'raw_ingestion_target' = 'public.raw_listings';

  if v_count <> 1 then
    raise exception 'raw_listings source trace verification failed for receipt: %', v_receipt;
  end if;

  select count(*) into v_count
  from public.worker_manual_entries wme
  where wme.id = v_manual_entry_id
    and wme.raw_listing_id = v_raw_listing_id
    and wme.entered_by = 'step3-smoke'
    and wme.builder_input = 'Lagoon'
    and wme.model_input = '42'
    and wme.year_input = '2020'
    and wme.asking_price_input = '420000'
    and wme.currency_input = 'EUR'
    and wme.location_input = 'Hrvatska, Split'
    and wme.ownership_status_hint = 'private';

  if v_count <> 1 then
    raise exception 'worker_manual_entries verification failed for receipt: %', v_receipt;
  end if;

  select count(*) into v_boats_after from public.boats;
  select count(*) into v_engines_after from public.engines;
  select count(*) into v_listings_after from public.listings;
  select count(*) into v_price_history_after from public.price_history;
  select count(*) into v_worker_notes_after from public.worker_notes;

  if v_boats_after <> v_boats_before then
    raise exception 'submit_manual_entry changed public.boats count from % to %', v_boats_before, v_boats_after;
  end if;

  if v_engines_after <> v_engines_before then
    raise exception 'submit_manual_entry changed public.engines count from % to %', v_engines_before, v_engines_after;
  end if;

  if v_listings_after <> v_listings_before then
    raise exception 'submit_manual_entry changed public.listings count from % to %', v_listings_before, v_listings_after;
  end if;

  if v_price_history_after <> v_price_history_before then
    raise exception 'submit_manual_entry changed public.price_history count from % to %', v_price_history_before, v_price_history_after;
  end if;

  if v_worker_notes_after <> v_worker_notes_before then
    raise exception 'submit_manual_entry changed public.worker_notes count from % to %', v_worker_notes_before, v_worker_notes_after;
  end if;

  raise notice 'Step 3 manual-entry smoke test passed. Receipt: %', v_receipt;
end $$;

rollback;
