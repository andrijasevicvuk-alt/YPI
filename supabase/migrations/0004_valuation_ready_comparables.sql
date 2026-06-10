create or replace view public.valuation_ready_comparables as
select
  l.id as comparable_id,
  b.id as boat_id,
  l.id as listing_id,
  l.raw_listing_id,
  l.source_site_id,
  ss.source_name,
  l.source_listing_key,
  l.listing_url,
  (
    l.raw_listing_id is not null
    and l.boat_id is not null
    and b.id is not null
  ) as created_from_normalized_lineage,
  b.builder_id,
  bb.canonical_name as canonical_builder,
  b.model_id,
  bm.canonical_name as canonical_model,
  b.variant_id,
  bv.canonical_name as canonical_variant,
  b.year_built,
  'not_evaluated'::text as year_match_bucket,
  l.ownership_status_code,
  l.asking_price,
  l.currency,
  l.price_eur,
  l.first_seen_at,
  l.last_seen_at,
  l.listing_status,
  l.publication_status,
  l.country_code,
  l.location_region_id,
  lr.canonical_name as location_bucket,
  l.marina_or_city,
  'not_evaluated'::text as geography_bucket,
  coalesce(l.source_reliability_score, ss.reliability_score) as source_reliability_score,
  l.data_quality_score,
  (
    l.publication_status = 'published'
    and l.listing_status = 'active'
    and l.price_eur is not null
    and b.builder_id is not null
    and b.model_id is not null
  ) as comparable_eligible,
  case
    when l.publication_status <> 'published' then 'not_published'
    when l.listing_status <> 'active' then 'not_active'
    when l.price_eur is null then 'missing_price_eur'
    when b.builder_id is null then 'missing_builder'
    when b.model_id is null then 'missing_model'
    else null
  end as exclusion_reason,
  'not_evaluated'::text as recency_bucket,
  case
    when l.duplicate_cluster_key is not null then 'duplicate_clustered'
    else 'not_evaluated'
  end as duplicate_signal
from public.listings l
join public.boats b
  on b.id = l.boat_id
join public.source_sites ss
  on ss.id = l.source_site_id
left join public.boat_builders bb
  on bb.id = b.builder_id
left join public.boat_models bm
  on bm.id = b.model_id
left join public.boat_variants bv
  on bv.id = b.variant_id
left join public.location_regions lr
  on lr.id = l.location_region_id;
