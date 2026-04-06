create extension if not exists pgcrypto;

create table if not exists public.source_sites (
  id uuid primary key default gen_random_uuid(),
  source_name text not null unique,
  base_url text,
  source_type text not null,
  market_focus text,
  allowed_collection_method text not null,
  parser_version text,
  reliability_score numeric(5,2),
  ownership_status_signal_strength numeric(5,2),
  price_signal_strength numeric(5,2),
  year_signal_strength numeric(5,2),
  region_signal_strength numeric(5,2),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_sites_source_type_check check (
    source_type in ('manual', 'csv', 'seed', 'broker', 'marketplace', 'internal', 'unknown')
  ),
  constraint source_sites_allowed_collection_method_check check (
    allowed_collection_method in ('manual_only', 'csv_upload', 'api', 'scrape', 'mixed')
  )
);

create table if not exists public.ingest_runs (
  id uuid primary key default gen_random_uuid(),
  source_site_id uuid not null references public.source_sites(id),
  acquisition_method text not null,
  trigger_type text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running',
  record_count integer not null default 0,
  notes text,
  constraint ingest_runs_acquisition_method_check check (
    acquisition_method in ('manual_entry', 'csv_import', 'seed_import', 'api_import', 'web_scrape')
  ),
  constraint ingest_runs_status_check check (
    status in ('running', 'completed', 'failed', 'partial')
  )
);

create table if not exists public.raw_listings (
  id uuid primary key default gen_random_uuid(),
  source_site_id uuid not null references public.source_sites(id),
  ingest_run_id uuid references public.ingest_runs(id),
  acquisition_method text not null,
  source_listing_key text,
  listing_url text,
  raw_title text,
  raw_price_text text,
  raw_location_text text,
  raw_description text,
  raw_specs_json jsonb,
  raw_payload_json jsonb,
  input_payload_json jsonb,
  observed_at timestamptz not null default now(),
  fetched_at timestamptz not null default now(),
  ingest_status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint raw_listings_acquisition_method_check check (
    acquisition_method in ('manual_entry', 'csv_import', 'seed_import', 'api_import', 'web_scrape')
  ),
  constraint raw_listings_ingest_status_check check (
    ingest_status in ('pending', 'validated', 'failed', 'processed')
  )
);

create index if not exists raw_listings_source_site_idx
  on public.raw_listings (source_site_id);

create index if not exists raw_listings_source_listing_key_idx
  on public.raw_listings (source_listing_key);

create index if not exists raw_listings_observed_at_idx
  on public.raw_listings (observed_at desc);

create table if not exists public.raw_listing_assets (
  id uuid primary key default gen_random_uuid(),
  raw_listing_id uuid not null references public.raw_listings(id) on delete cascade,
  asset_type text not null,
  storage_path text not null,
  content_type text,
  created_at timestamptz not null default now(),
  constraint raw_listing_assets_asset_type_check check (
    asset_type in ('html_snapshot', 'json_snapshot', 'csv_row_snapshot', 'manual_note_attachment', 'other')
  )
);

create table if not exists public.ingest_errors (
  id uuid primary key default gen_random_uuid(),
  source_site_id uuid references public.source_sites(id),
  ingest_run_id uuid references public.ingest_runs(id),
  raw_listing_id uuid references public.raw_listings(id) on delete set null,
  error_stage text not null,
  error_code text,
  error_message text not null,
  error_context_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.worker_manual_entries (
  id uuid primary key default gen_random_uuid(),
  raw_listing_id uuid not null unique references public.raw_listings(id) on delete cascade,
  entered_by text,
  builder_input text,
  model_input text,
  variant_input text,
  year_input text,
  asking_price_input text,
  currency_input text,
  location_input text,
  ownership_status_hint text,
  engine_info_input text,
  raw_notes text,
  created_at timestamptz not null default now()
);
