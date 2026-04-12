# Model podataka i dataset slojevi

## 1. Nacelo
Dataset nije jedna CSV tablica, nego skup povezanih slojeva koji sluze razlicitim namjenama.

## 2. Predlozeni logicki slojevi

### 2.1 Raw ingestion dataset
Sadrzi sto je izvor stvarno dao.

Predlozena polja:
- raw_record_id
- source_site_id
- source_listing_key
- fetched_at
- listing_url
- raw_title
- raw_price_text
- raw_location_text
- raw_description
- raw_specs_json
- raw_html_path
- raw_json_path
- parser_name
- parser_version
- fetch_status

Svrha:
- audit
- reprocessing
- debugging
- usporedba parser verzija

### 2.2 Normalized boat dataset
Sadrzi kanonsku reprezentaciju plovila.

Polja:
- boat_id
- canonical_builder
- canonical_model
- canonical_variant
- year_built
- year_launched
- boat_type
- loa_m
- beam_m
- draft_m
- cabins
- berths
- heads
- hull_material
- condition_rating
- refit_year

### 2.3 Normalized engine dataset
Polja:
- engine_id
- boat_id
- engine_brand
- engine_model
- engine_count
- horsepower_each
- engine_hours
- engine_type
- fuel_type
- drive_type

### 2.4 Normalized listing dataset
Polja:
- listing_id
- boat_id
- source_site_id
- source_listing_key
- title
- listing_url
- country
- subregion
- marina_or_city
- ownership_status
- listing_status
- asking_price
- currency
- price_eur
- first_seen_at
- last_seen_at
- description_raw
- source_reliability_score
- parse_confidence
- data_quality_score
- duplicate_cluster_id

### 2.5 Price history dataset
Polja:
- price_history_id
- listing_id
- observed_at
- price_amount
- currency
- price_eur
- note

### 2.6 Review / exceptions dataset
Polja:
- review_item_id
- source_record_id
- issue_type
- severity
- suggested_fix
- reviewer_name
- reviewed_at
- review_status

## 3. Mapping tablice koje trebaju postojati
Za stabilan cleaning trebaju i lookup / mapping tablice:
- builder_aliases
- model_aliases
- variant_aliases
- country_aliases
- marina_aliases
- currency_rules
- ownership_status_rules
- engine_type_rules

## 4. Dataset flow
Raw -> Parsed -> Normalized -> Deduped -> Valuation-ready -> UI/API

To znaci:
- raw dataset nikad ne ide direktno u scoring
- UI ne cita raw tablice
- valuation engine radi samo nad normaliziranim i filtriranim zapisima

## 5. Valuation-ready view
Predlozeni output za scoring i UI:

- comparable_id
- boat_id
- listing_id
- canonical_builder
- canonical_model
- canonical_variant
- year_built
- ownership_status
- location_bucket
- loa_m
- engine_signature
- price_eur
- source_name
- source_reliability_score
- data_quality_score
- comparable_eligibility
- exclusion_reason
- last_seen_at

## 6. Pravila eligibility
Zapis ulazi u valuation-ready view samo ako:
- ima builder i model
- ima cijenu i valutu
- cijena je uspjesno normalizirana
- godina je poznata ili razumno izvedena
- listing nije duplicate ili ocito neispravan
- quality score je iznad minimalnog praga

## 7. Zasto je ova struktura bitna za web app
Web app mora moci:
- brzo filtrirati
- pokazati razlog zasto je rezultat ukljucen
- pokazati trag izvora
- objasniti fallback
- ne lomiti se zbog prljavih raw podataka

Zato aplikacija i scoring motor ne smiju ovisiti o neobradenim izvorima.

## 8. Trenutna MVP schema nakon Step 3
Step 3 sada uvodi minimalni normalized core schema koji ostaje uskladen s pravilom `raw -> normalized -> valuation-ready`.

Dodane normalized core tablice:
- `boats`
- `engines`
- `listings`
- `price_history`
- `worker_notes`

Dodane rane mapping/reference tablice:
- `boat_builders`
- `builder_aliases`
- `boat_models`
- `model_aliases`
- `boat_variants`
- `variant_aliases`
- `ownership_statuses`
- `ownership_status_aliases`
- `countries`
- `country_aliases`
- `location_regions`
- `location_aliases`

Bitan lineage detalj:
- `listings.raw_listing_id` veze normalized listing natrag na raw zapis
- manual entry jos uvijek prvo puni `raw_listings` i `worker_manual_entries`
- normalized tablice postoje kao publication cilj, ali ih Step 3 jos ne puni automatski
