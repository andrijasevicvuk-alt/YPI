\set ON_ERROR_STOP on

\if :{?valid_key}
\else
  \set valid_key 'step4-smoke-valid-lagoon-42'
\endif

\if :{?invalid_key}
\else
  \set invalid_key 'step4-smoke-invalid-missing-fields'
\endif

select set_config('ypi.valid_key', :'valid_key', false);
select set_config('ypi.invalid_key', :'invalid_key', false);

do $$
declare
  v_valid_key text := current_setting('ypi.valid_key');
  v_invalid_key text := current_setting('ypi.invalid_key');
  v_missing_columns text[];
  v_valid_raw_id uuid;
  v_invalid_raw_id uuid;
  v_count bigint;
begin
  if to_regclass('public.valuation_ready_comparables') is null then
    raise exception 'View public.valuation_ready_comparables does not exist.';
  end if;

  select array_agg(required.column_name order by required.column_name)
    into v_missing_columns
  from (
    values
      ('comparable_id'),
      ('boat_id'),
      ('listing_id'),
      ('raw_listing_id'),
      ('source_site_id'),
      ('source_name'),
      ('source_listing_key'),
      ('listing_url'),
      ('created_from_normalized_lineage'),
      ('builder_id'),
      ('canonical_builder'),
      ('model_id'),
      ('canonical_model'),
      ('variant_id'),
      ('canonical_variant'),
      ('year_built'),
      ('year_match_bucket'),
      ('ownership_status_code'),
      ('asking_price'),
      ('currency'),
      ('price_eur'),
      ('first_seen_at'),
      ('last_seen_at'),
      ('listing_status'),
      ('publication_status'),
      ('country_code'),
      ('location_region_id'),
      ('location_bucket'),
      ('marina_or_city'),
      ('geography_bucket'),
      ('source_reliability_score'),
      ('data_quality_score'),
      ('comparable_eligible'),
      ('exclusion_reason'),
      ('recency_bucket'),
      ('duplicate_signal')
  ) as required(column_name)
  where not exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'valuation_ready_comparables'
      and c.column_name = required.column_name
  );

  if v_missing_columns is not null then
    raise exception 'Missing columns on public.valuation_ready_comparables: %', v_missing_columns;
  end if;

  select id into v_valid_raw_id
  from public.raw_listings
  where source_listing_key = v_valid_key
  limit 1;

  if v_valid_raw_id is null then
    raise notice 'Valid Step 4 smoke raw listing with key % not found. Run Step 4 smoke setup/pipeline first for row-level verification.', v_valid_key;
  else
    select count(*) into v_count
    from public.valuation_ready_comparables
    where raw_listing_id = v_valid_raw_id
      and comparable_eligible = true
      and publication_status = 'published'
      and listing_status = 'active'
      and price_eur is not null;

    if v_count <> 1 then
      raise exception 'Expected 1 eligible valuation-ready comparable for valid raw listing %, found %.', v_valid_raw_id, v_count;
    end if;

    raise notice 'Valid valuation-ready comparable check passed for raw_listing_id=%', v_valid_raw_id;
  end if;

  select id into v_invalid_raw_id
  from public.raw_listings
  where source_listing_key = v_invalid_key
  limit 1;

  if v_invalid_raw_id is null then
    raise notice 'Invalid Step 4 smoke raw listing with key % not found. Skipping invalid row-level check.', v_invalid_key;
  else
    select count(*) into v_count
    from public.valuation_ready_comparables
    where raw_listing_id = v_invalid_raw_id
      and comparable_eligible = true;

    if v_count <> 0 then
      raise exception 'Invalid raw listing % appeared as an eligible valuation-ready comparable.', v_invalid_raw_id;
    end if;

    raise notice 'Invalid valuation-ready comparable exclusion check passed for raw_listing_id=%', v_invalid_raw_id;
  end if;

  raise notice 'Step 5B valuation-ready view smoke check passed.';
end $$;
