insert into public.source_sites (
  source_name,
  base_url,
  source_type,
  market_focus,
  allowed_collection_method,
  parser_version,
  reliability_score,
  ownership_status_signal_strength,
  price_signal_strength,
  year_signal_strength,
  region_signal_strength,
  notes
)
values
  (
    'internal_manual_entry',
    null,
    'manual',
    'mediterranean',
    'manual_only',
    null,
    1.00,
    0.80,
    0.80,
    0.70,
    0.70,
    'Primary guaranteed input path during early MVP.'
  ),
  (
    'controlled_csv_upload',
    null,
    'csv',
    'mediterranean',
    'csv_upload',
    null,
    0.70,
    0.50,
    0.70,
    0.60,
    0.60,
    'Secondary controlled import path. No external dataset is assumed.'
  ),
  (
    'seed_internal_dataset',
    null,
    'seed',
    'mediterranean',
    'mixed',
    null,
    0.90,
    0.70,
    0.70,
    0.70,
    0.70,
    'Project-owned seed records for development and testing.'
  )
on conflict (source_name) do nothing;
