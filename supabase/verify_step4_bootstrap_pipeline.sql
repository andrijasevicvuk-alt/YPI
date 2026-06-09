\set ON_ERROR_STOP on

\if :{?phase}
\else
  \echo 'Set phase to one of: setup_valid, check_valid, reset_valid_pending, setup_invalid, check_invalid'
  \quit 1
\endif

\if :{?valid_key}
\else
  \set valid_key 'step4-smoke-valid-lagoon-42'
\endif

\if :{?invalid_key}
\else
  \set invalid_key 'step4-smoke-invalid-missing-fields'
\endif

select set_config('ypi.phase', :'phase', false);
select set_config('ypi.valid_key', :'valid_key', false);
select set_config('ypi.invalid_key', :'invalid_key', false);

do $$
declare
  v_phase text := current_setting('ypi.phase');
  v_valid_key text := current_setting('ypi.valid_key');
  v_invalid_key text := current_setting('ypi.invalid_key');
  v_source_site_id uuid;
  v_ingest_run_id uuid;
  v_raw_listing_id uuid;
  v_count bigint;
begin
  if v_phase not in ('setup_valid', 'check_valid', 'reset_valid_pending', 'setup_invalid', 'check_invalid') then
    raise exception 'Unknown phase %. Use setup_valid, check_valid, reset_valid_pending, setup_invalid, or check_invalid.', v_phase;
  end if;

  if v_phase in ('setup_valid', 'setup_invalid') then
    select id into v_source_site_id
    from public.source_sites
    where source_name = 'internal_manual_entry'
    limit 1;

    if v_source_site_id is null then
      raise exception 'Source internal_manual_entry is missing. Run migrations/seed first.';
    end if;
  end if;

  if v_phase = 'setup_valid' then
    delete from public.listings
    where raw_listing_id in (select id from public.raw_listings where source_listing_key = v_valid_key);

    delete from public.boats
    where primary_raw_listing_id in (select id from public.raw_listings where source_listing_key = v_valid_key);

    delete from public.ingest_errors
    where raw_listing_id in (select id from public.raw_listings where source_listing_key = v_valid_key);

    delete from public.raw_listings
    where source_listing_key = v_valid_key;

    delete from public.ingest_runs
    where notes = 'step4_smoke_valid';

    insert into public.ingest_runs (
      source_site_id,
      acquisition_method,
      trigger_type,
      status,
      record_count,
      notes
    )
    values (
      v_source_site_id,
      'manual_entry',
      'step4_smoke',
      'completed',
      1,
      'step4_smoke_valid'
    )
    returning id into v_ingest_run_id;

    insert into public.raw_listings (
      source_site_id,
      ingest_run_id,
      acquisition_method,
      source_listing_key,
      listing_url,
      raw_title,
      raw_price_text,
      raw_location_text,
      raw_description,
      raw_specs_json,
      raw_payload_json,
      input_payload_json,
      observed_at,
      fetched_at,
      ingest_status
    )
    values (
      v_source_site_id,
      v_ingest_run_id,
      'manual_entry',
      v_valid_key,
      'https://example.test/listings/step4-valid-lagoon-42',
      'Lagoon 42 Step 4 Valid Smoke Test',
      '420000 EUR',
      'Hrvatska, Split',
      'Controlled valid Step 4 smoke record.',
      jsonb_build_object(
        'builder_input', 'Lagoon',
        'model_input', '42',
        'variant_input', 'Owner Version',
        'year_input', '2020',
        'currency_input', 'EUR',
        'ownership_status_hint', 'private'
      ),
      jsonb_build_object(
        'origin', 'step4_smoke',
        'submitted_via', 'verify_step4_bootstrap_pipeline.sql',
        'asking_price', '420000',
        'currency', 'EUR',
        'location', 'Hrvatska, Split'
      ),
      jsonb_build_object(
        'builder', 'Lagoon',
        'model', '42',
        'variant', 'Owner Version',
        'year_built', '2020',
        'asking_price', '420000',
        'currency', 'EUR',
        'location', 'Hrvatska, Split',
        'ownership_status_hint', 'private'
      ),
      timestamptz '2000-01-01 00:00:00+00',
      timestamptz '2000-01-01 00:00:00+00',
      'pending'
    );

    raise notice 'Step 4 valid smoke record created with source_listing_key=%', v_valid_key;
  elsif v_phase = 'check_valid' then
    select id into v_raw_listing_id
    from public.raw_listings
    where source_listing_key = v_valid_key;

    if v_raw_listing_id is null then
      raise exception 'Valid Step 4 smoke raw listing not found for key %', v_valid_key;
    end if;

    perform 1
    from public.raw_listings
    where id = v_raw_listing_id
      and ingest_status = 'processed';

    if not found then
      raise exception 'Valid Step 4 smoke raw listing was not marked processed.';
    end if;

    select count(*) into v_count
    from public.boats
    where primary_raw_listing_id = v_raw_listing_id;

    if v_count <> 1 then
      raise exception 'Expected 1 boat linked to valid raw listing %, found %', v_raw_listing_id, v_count;
    end if;

    select count(*) into v_count
    from public.listings
    where raw_listing_id = v_raw_listing_id
      and publication_status = 'published';

    if v_count <> 1 then
      raise exception 'Expected 1 published listing linked to valid raw listing %, found %', v_raw_listing_id, v_count;
    end if;

    select count(*) into v_count
    from public.listings l
    join public.boats b on b.id = l.boat_id
    where l.raw_listing_id = v_raw_listing_id
      and b.primary_raw_listing_id = v_raw_listing_id;

    if v_count <> 1 then
      raise exception 'Lineage check failed for valid raw listing %', v_raw_listing_id;
    end if;

    select count(*) into v_count
    from public.ingest_errors
    where raw_listing_id = v_raw_listing_id;

    if v_count <> 0 then
      raise exception 'Expected 0 ingest_errors for valid raw listing %, found %', v_raw_listing_id, v_count;
    end if;

    raise notice 'Step 4 valid smoke check passed for raw_listing_id=%', v_raw_listing_id;
  elsif v_phase = 'reset_valid_pending' then
    select id into v_raw_listing_id
    from public.raw_listings
    where source_listing_key = v_valid_key;

    if v_raw_listing_id is null then
      raise exception 'Valid Step 4 smoke raw listing not found for key %', v_valid_key;
    end if;

    select count(*) into v_count
    from public.boats
    where primary_raw_listing_id = v_raw_listing_id;

    if v_count <> 1 then
      raise exception 'Expected exactly 1 boat before idempotency rerun for raw listing %, found %', v_raw_listing_id, v_count;
    end if;

    select count(*) into v_count
    from public.listings
    where raw_listing_id = v_raw_listing_id;

    if v_count <> 1 then
      raise exception 'Expected exactly 1 listing before idempotency rerun for raw listing %, found %', v_raw_listing_id, v_count;
    end if;

    update public.raw_listings
    set ingest_status = 'pending'
    where id = v_raw_listing_id;

    raise notice 'Step 4 valid smoke record reset to pending for idempotency rerun. raw_listing_id=%', v_raw_listing_id;
  elsif v_phase = 'setup_invalid' then
    delete from public.listings
    where raw_listing_id in (select id from public.raw_listings where source_listing_key = v_invalid_key);

    delete from public.boats
    where primary_raw_listing_id in (select id from public.raw_listings where source_listing_key = v_invalid_key);

    delete from public.ingest_errors
    where raw_listing_id in (select id from public.raw_listings where source_listing_key = v_invalid_key);

    delete from public.raw_listings
    where source_listing_key = v_invalid_key;

    delete from public.ingest_runs
    where notes = 'step4_smoke_invalid';

    insert into public.ingest_runs (
      source_site_id,
      acquisition_method,
      trigger_type,
      status,
      record_count,
      notes
    )
    values (
      v_source_site_id,
      'manual_entry',
      'step4_smoke',
      'completed',
      1,
      'step4_smoke_invalid'
    )
    returning id into v_ingest_run_id;

    insert into public.raw_listings (
      source_site_id,
      ingest_run_id,
      acquisition_method,
      source_listing_key,
      listing_url,
      raw_title,
      raw_location_text,
      raw_description,
      raw_specs_json,
      raw_payload_json,
      input_payload_json,
      observed_at,
      fetched_at,
      ingest_status
    )
    values (
      v_source_site_id,
      v_ingest_run_id,
      'manual_entry',
      v_invalid_key,
      'https://example.test/listings/step4-invalid-missing-fields',
      'Step 4 Invalid Smoke Test',
      'Hrvatska, Split',
      'Controlled invalid Step 4 smoke record with missing builder, model, price, and currency.',
      '{}'::jsonb,
      jsonb_build_object(
        'origin', 'step4_smoke',
        'submitted_via', 'verify_step4_bootstrap_pipeline.sql'
      ),
      '{}'::jsonb,
      timestamptz '2000-01-02 00:00:00+00',
      timestamptz '2000-01-02 00:00:00+00',
      'pending'
    );

    raise notice 'Step 4 invalid smoke record created with source_listing_key=%', v_invalid_key;
  elsif v_phase = 'check_invalid' then
    select id into v_raw_listing_id
    from public.raw_listings
    where source_listing_key = v_invalid_key;

    if v_raw_listing_id is null then
      raise exception 'Invalid Step 4 smoke raw listing not found for key %', v_invalid_key;
    end if;

    perform 1
    from public.raw_listings
    where id = v_raw_listing_id
      and ingest_status = 'failed';

    if not found then
      raise exception 'Invalid Step 4 smoke raw listing was not marked failed.';
    end if;

    select count(*) into v_count
    from public.ingest_errors
    where raw_listing_id = v_raw_listing_id
      and error_stage = 'step4_validation'
      and error_code = 'validation_failed';

    if v_count < 1 then
      raise exception 'Expected step4_validation/validation_failed ingest_error for raw listing %', v_raw_listing_id;
    end if;

    select count(*) into v_count
    from public.boats
    where primary_raw_listing_id = v_raw_listing_id;

    if v_count <> 0 then
      raise exception 'Invalid Step 4 smoke record created % boat rows.', v_count;
    end if;

    select count(*) into v_count
    from public.listings
    where raw_listing_id = v_raw_listing_id;

    if v_count <> 0 then
      raise exception 'Invalid Step 4 smoke record created % listing rows.', v_count;
    end if;

    raise notice 'Step 4 invalid smoke check passed for raw_listing_id=%', v_raw_listing_id;
  end if;
end $$;
