alter table if exists public.worker_manual_entries
  add column if not exists description_input text;

insert into public.source_sites (
  source_name,
  base_url,
  source_type,
  market_focus,
  allowed_collection_method,
  reliability_score,
  ownership_status_signal_strength,
  price_signal_strength,
  year_signal_strength,
  region_signal_strength,
  notes
)
values (
  'internal_manual_entry',
  null,
  'manual',
  'mediterranean',
  'manual_only',
  1.00,
  0.80,
  0.80,
  0.70,
  0.70,
  'Primary guaranteed input path during early MVP.'
)
on conflict (source_name) do nothing;

create table if not exists public.boat_builders (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  normalized_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.builder_aliases (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references public.boat_builders(id) on delete cascade,
  alias text not null unique,
  normalized_alias text,
  created_at timestamptz not null default now()
);

create table if not exists public.boat_models (
  id uuid primary key default gen_random_uuid(),
  builder_id uuid not null references public.boat_builders(id) on delete cascade,
  canonical_name text not null,
  normalized_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint boat_models_builder_canonical_name_key unique (builder_id, canonical_name)
);

create table if not exists public.model_aliases (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.boat_models(id) on delete cascade,
  alias text not null unique,
  normalized_alias text,
  created_at timestamptz not null default now()
);

create table if not exists public.boat_variants (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.boat_models(id) on delete cascade,
  canonical_name text not null,
  normalized_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint boat_variants_model_canonical_name_key unique (model_id, canonical_name)
);

create table if not exists public.variant_aliases (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.boat_variants(id) on delete cascade,
  alias text not null unique,
  normalized_alias text,
  created_at timestamptz not null default now()
);

create table if not exists public.ownership_statuses (
  code text primary key,
  display_name text not null,
  description text,
  created_at timestamptz not null default now(),
  constraint ownership_statuses_code_check check (
    code in ('private', 'charter', 'ex_charter', 'unknown')
  )
);

insert into public.ownership_statuses (code, display_name, description)
values
  ('private', 'Private', 'Privatno vlasnistvo ili privatna uporaba.'),
  ('charter', 'Charter', 'Aktivni charter listing ili charter uporaba.'),
  ('ex_charter', 'Ex-charter', 'Bivsi charter listing ili plovilo.'),
  ('unknown', 'Unknown', 'Ownership status nije potvrden.')
on conflict (code) do nothing;

create table if not exists public.ownership_status_aliases (
  id uuid primary key default gen_random_uuid(),
  ownership_status_code text not null references public.ownership_statuses(code) on delete cascade,
  alias text not null unique,
  normalized_alias text,
  created_at timestamptz not null default now()
);

create table if not exists public.countries (
  code text primary key,
  canonical_name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.country_aliases (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code) on delete cascade,
  alias text not null unique,
  normalized_alias text,
  created_at timestamptz not null default now()
);

create table if not exists public.location_regions (
  id uuid primary key default gen_random_uuid(),
  country_code text references public.countries(code) on delete set null,
  canonical_name text not null,
  normalized_name text,
  region_type text not null default 'subregion',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint location_regions_region_type_check check (
    region_type in ('country', 'subregion', 'marina_cluster', 'city_bucket')
  ),
  constraint location_regions_country_canonical_name_key unique (country_code, canonical_name)
);

create table if not exists public.location_aliases (
  id uuid primary key default gen_random_uuid(),
  location_region_id uuid not null references public.location_regions(id) on delete cascade,
  alias text not null unique,
  normalized_alias text,
  marina_or_city text,
  created_at timestamptz not null default now()
);

create table if not exists public.boats (
  id uuid primary key default gen_random_uuid(),
  primary_raw_listing_id uuid references public.raw_listings(id) on delete set null,
  builder_id uuid references public.boat_builders(id) on delete set null,
  model_id uuid references public.boat_models(id) on delete set null,
  variant_id uuid references public.boat_variants(id) on delete set null,
  year_built integer,
  year_launched integer,
  boat_type text,
  loa_m numeric(10,2),
  beam_m numeric(10,2),
  draft_m numeric(10,2),
  cabins integer,
  berths integer,
  heads integer,
  hull_material text,
  condition_rating numeric(5,2),
  refit_year integer,
  normalization_status text not null default 'draft',
  normalization_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint boats_year_built_check check (
    year_built is null or year_built between 1800 and 2100
  ),
  constraint boats_year_launched_check check (
    year_launched is null or year_launched between 1800 and 2100
  ),
  constraint boats_refit_year_check check (
    refit_year is null or refit_year between 1800 and 2100
  ),
  constraint boats_normalization_status_check check (
    normalization_status in ('draft', 'normalized', 'review_required')
  )
);

create table if not exists public.engines (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats(id) on delete cascade,
  source_raw_listing_id uuid references public.raw_listings(id) on delete set null,
  engine_brand text,
  engine_model text,
  engine_count integer,
  horsepower_each integer,
  engine_hours integer,
  engine_type text,
  fuel_type text,
  drive_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint engines_engine_count_check check (
    engine_count is null or engine_count > 0
  )
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  raw_listing_id uuid not null unique references public.raw_listings(id) on delete cascade,
  boat_id uuid not null references public.boats(id) on delete cascade,
  source_site_id uuid not null references public.source_sites(id),
  source_listing_key text,
  title text,
  listing_url text,
  country_code text references public.countries(code) on delete set null,
  location_region_id uuid references public.location_regions(id) on delete set null,
  marina_or_city text,
  ownership_status_code text references public.ownership_statuses(code) on delete set null,
  listing_status text not null default 'draft',
  publication_status text not null default 'draft',
  asking_price numeric(14,2),
  currency text,
  price_eur numeric(14,2),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  description_raw text,
  source_reliability_score numeric(5,2),
  parse_confidence numeric(5,2),
  data_quality_score numeric(5,2),
  duplicate_cluster_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listings_listing_status_check check (
    listing_status in ('draft', 'active', 'stale', 'removed', 'sold', 'archived')
  ),
  constraint listings_publication_status_check check (
    publication_status in ('draft', 'published', 'review_required', 'rejected')
  )
);

create table if not exists public.price_history (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  raw_listing_id uuid references public.raw_listings(id) on delete set null,
  observed_at timestamptz not null default now(),
  price_amount numeric(14,2),
  currency text,
  price_eur numeric(14,2),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.worker_notes (
  id uuid primary key default gen_random_uuid(),
  raw_listing_id uuid references public.raw_listings(id) on delete cascade,
  boat_id uuid references public.boats(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  note_type text not null default 'general',
  note_body text not null,
  created_by text,
  created_at timestamptz not null default now(),
  constraint worker_notes_reference_check check (
    raw_listing_id is not null or boat_id is not null or listing_id is not null
  )
);

create index if not exists boat_builders_canonical_name_idx
  on public.boat_builders (canonical_name);

create index if not exists builder_aliases_builder_id_idx
  on public.builder_aliases (builder_id);

create index if not exists boat_models_builder_id_idx
  on public.boat_models (builder_id);

create index if not exists model_aliases_model_id_idx
  on public.model_aliases (model_id);

create index if not exists boat_variants_model_id_idx
  on public.boat_variants (model_id);

create index if not exists variant_aliases_variant_id_idx
  on public.variant_aliases (variant_id);

create index if not exists country_aliases_country_code_idx
  on public.country_aliases (country_code);

create index if not exists location_regions_country_code_idx
  on public.location_regions (country_code);

create index if not exists location_aliases_region_id_idx
  on public.location_aliases (location_region_id);

create index if not exists boats_builder_model_variant_idx
  on public.boats (builder_id, model_id, variant_id);

create index if not exists boats_primary_raw_listing_idx
  on public.boats (primary_raw_listing_id);

create index if not exists engines_boat_id_idx
  on public.engines (boat_id);

create index if not exists listings_boat_id_idx
  on public.listings (boat_id);

create index if not exists listings_source_site_id_idx
  on public.listings (source_site_id);

create index if not exists listings_country_region_idx
  on public.listings (country_code, location_region_id);

create index if not exists listings_ownership_status_idx
  on public.listings (ownership_status_code);

create index if not exists listings_publication_status_idx
  on public.listings (publication_status);

create index if not exists listings_last_seen_at_idx
  on public.listings (last_seen_at desc);

create index if not exists price_history_listing_observed_idx
  on public.price_history (listing_id, observed_at desc);

create index if not exists worker_notes_listing_idx
  on public.worker_notes (listing_id);

create index if not exists worker_notes_raw_listing_idx
  on public.worker_notes (raw_listing_id);

create or replace function public.submit_manual_entry(entry jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry jsonb := coalesce(entry, '{}'::jsonb);
  v_source_name text := coalesce(nullif(btrim(v_entry->>'source_name'), ''), 'internal_manual_entry');
  v_source_site_id uuid;
  v_ingest_run_id uuid;
  v_raw_listing_id uuid;
  v_manual_entry_id uuid;
  v_submitted_at timestamptz := now();
  v_raw_specs_json jsonb;
  v_raw_payload_json jsonb;
  v_raw_price_text text;
begin
  select id
    into v_source_site_id
  from public.source_sites
  where source_name = v_source_name
    and is_active = true
  limit 1;

  if v_source_site_id is null then
    raise exception 'Manual entry source "%" is not registered in source_sites.', v_source_name;
  end if;

  insert into public.ingest_runs (
    source_site_id,
    acquisition_method,
    trigger_type,
    started_at,
    status,
    record_count,
    notes
  )
  values (
    v_source_site_id,
    'manual_entry',
    'worker_submit',
    v_submitted_at,
    'running',
    0,
    'web_manual_entry_form'
  )
  returning id into v_ingest_run_id;

  v_raw_price_text := nullif(
    concat_ws(
      ' ',
      nullif(btrim(v_entry->>'asking_price'), ''),
      nullif(upper(btrim(v_entry->>'currency')), '')
    ),
    ''
  );

  v_raw_specs_json := jsonb_strip_nulls(
    jsonb_build_object(
      'builder_input', nullif(btrim(v_entry->>'builder'), ''),
      'model_input', nullif(btrim(v_entry->>'model'), ''),
      'variant_input', nullif(btrim(v_entry->>'variant'), ''),
      'year_input', nullif(btrim(v_entry->>'year_built'), ''),
      'currency_input', nullif(upper(btrim(v_entry->>'currency')), ''),
      'ownership_status_hint', nullif(btrim(v_entry->>'ownership_status_hint'), ''),
      'engine_info_input', nullif(btrim(v_entry->>'engine_info'), '')
    )
  );

  v_raw_payload_json := jsonb_strip_nulls(
    v_entry ||
    jsonb_build_object(
      'source_name', v_source_name,
      'origin', 'manual_entry',
      'submitted_via', 'web_manual_entry_form',
      'raw_ingestion_target', 'public.raw_listings',
      'submitted_at', to_char(v_submitted_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  );

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
    nullif(btrim(v_entry->>'source_listing_key'), ''),
    nullif(btrim(v_entry->>'listing_url'), ''),
    nullif(btrim(v_entry->>'title'), ''),
    v_raw_price_text,
    nullif(btrim(v_entry->>'location'), ''),
    nullif(btrim(v_entry->>'description'), ''),
    v_raw_specs_json,
    v_raw_payload_json,
    jsonb_strip_nulls(v_entry),
    v_submitted_at,
    v_submitted_at,
    'pending'
  )
  returning id into v_raw_listing_id;

  insert into public.worker_manual_entries (
    raw_listing_id,
    entered_by,
    builder_input,
    model_input,
    variant_input,
    year_input,
    asking_price_input,
    currency_input,
    location_input,
    ownership_status_hint,
    engine_info_input,
    description_input,
    raw_notes,
    created_at
  )
  values (
    v_raw_listing_id,
    nullif(btrim(v_entry->>'entered_by'), ''),
    nullif(btrim(v_entry->>'builder'), ''),
    nullif(btrim(v_entry->>'model'), ''),
    nullif(btrim(v_entry->>'variant'), ''),
    nullif(btrim(v_entry->>'year_built'), ''),
    nullif(btrim(v_entry->>'asking_price'), ''),
    nullif(upper(btrim(v_entry->>'currency')), ''),
    nullif(btrim(v_entry->>'location'), ''),
    nullif(btrim(v_entry->>'ownership_status_hint'), ''),
    nullif(btrim(v_entry->>'engine_info'), ''),
    nullif(btrim(v_entry->>'description'), ''),
    nullif(btrim(v_entry->>'raw_notes'), ''),
    v_submitted_at
  )
  returning id into v_manual_entry_id;

  update public.ingest_runs
  set
    status = 'completed',
    record_count = 1,
    completed_at = v_submitted_at,
    notes = 'manual_entry_submitted_to_raw_ingestion'
  where id = v_ingest_run_id;

  return jsonb_build_object(
    'rawListingId', v_raw_listing_id,
    'manualEntryId', v_manual_entry_id,
    'ingestRunId', v_ingest_run_id,
    'sourceSiteId', v_source_site_id,
    'sourceName', v_source_name,
    'acquisitionMethod', 'manual_entry',
    'ingestStatus', 'pending',
    'submittedAt', to_char(v_submitted_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
exception
  when others then
    if v_ingest_run_id is not null then
      update public.ingest_runs
      set
        status = 'failed',
        completed_at = now(),
        notes = left(format('manual_entry_rpc_failed: %s', sqlerrm), 500)
      where id = v_ingest_run_id;

      insert into public.ingest_errors (
        source_site_id,
        ingest_run_id,
        raw_listing_id,
        error_stage,
        error_code,
        error_message,
        error_context_json
      )
      values (
        v_source_site_id,
        v_ingest_run_id,
        v_raw_listing_id,
        'manual_entry_submission',
        'manual_entry_rpc_failed',
        sqlerrm,
        jsonb_build_object('entry', v_entry)
      );
    end if;

    raise;
end;
$$;
