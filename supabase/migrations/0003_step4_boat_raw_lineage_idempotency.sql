create unique index if not exists boats_primary_raw_listing_unique_idx
  on public.boats (primary_raw_listing_id)
  where primary_raw_listing_id is not null;
