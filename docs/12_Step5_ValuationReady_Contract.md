# Step 5A - Valuation-ready contract

## 1. Svrha
Step 5A definira ugovor za valuation-ready comparable sloj prije bilo kakve SQL implementacije.

Step 5 pocinje s contract/design fazom zato sto je valuation-ready granica proizvodni sloj izmedu normalized tablica i scoring/search logike. Ako se taj ugovor preskoci, scoring ili UI bi mogli poceti citati `raw_listings`, `boats` ili `listings` direktno i time zaobici arhitekturu projekta.

Ispravan tok ostaje:

`raw -> normalized -> valuation-ready -> scoring -> search/comparison UI`

Valuation-ready sloj mora biti prvi sloj koji product comparison UI i scoring smiju koristiti za glavni korisnicki tok:

`input boat -> retrieve comparables -> compute valuation range -> explain result`

## 2. Zasto UI i scoring ne citaju raw/normalized direktno
Raw sloj postoji za audit, reprocessing i debug. Normalized sloj postoji za strukturirane business zapise i lineage.

Glavni product UI ne smije citati raw ili normalized operativne tablice direktno jer:
- raw podaci mogu biti nepotpuni, nevalidirani ili source-specific
- normalized tablice mogu sadrzavati zapise koji jos nisu eligible za valuation
- scoring treba stabilan, objasnjiv comparable payload
- UI treba prikazati ukljucenje, iskljucenje, source trace i quality signale bez poznavanja pipeline detalja

Valuation-ready sloj zato postaje product-facing data boundary.

## 3. Sto Step 5A ne implementira
Step 5A ne implementira:
- SQL view ili migration
- data-access query prema valuation-ready viewu
- scoring formulu
- ranking
- valuation range calculation
- confidence model
- geography weighting
- recency weighting
- scraping
- search/comparison UI
- production auth/RLS
- atomic publication RPC

Step 5A samo definira ugovor, fieldove, placeholder granice i prvi retrieval boundary.

## 4. Kako Step 5A priprema sljedece podfaze
Step 5A priprema:
- Step 5B tako da definira tocno koja polja minimalni SQL view mora izloziti
- Step 5C tako da data-access zna koji payload treba vratiti
- Step 5D tako da basic retrieval filteri imaju stabilne fieldove
- Step 5E tako da scoring contract moze koristiti valuation-ready comparable bez citanja raw/normalized tablica
- Step 5F tako da verification zna sto mora dokazati

## 5. Step 5 podfaze

### Step 5A - valuation-ready contract/design
Goal:
- definirati `ValuationReadyComparable` i osnovni retrieval boundary

Likely files:
- `docs/12_Step5_ValuationReady_Contract.md`
- `packages/domain/src/index.ts`
- minimalni linkovi u `README.md` i `docs/AGENTS.md`

Acceptance criteria:
- contract jasno razlikuje real-now fieldove od placeholder/future-derived fieldova
- TypeScript typecheck prolazi
- nema SQL migracija ni query implementacije

Out of scope:
- valuation-ready SQL view
- scoring formula
- UI/API implementation

### Step 5B - minimal SQL view
Goal:
- implementirati read-only valuation-ready SQL view nad normalized tablicama

Likely files:
- `supabase/migrations/0004_valuation_ready_comparables.sql`
- `supabase/verify_step5_valuation_ready.sql`

Acceptance criteria:
- view cita iz normalized lineagea, ne direktno iz raw sloja kao product sourcea
- view vraca minimalni comparable payload
- Step 4 smoke testovi i typecheck i dalje prolaze

Out of scope:
- materialized view
- physical valuation-ready table
- scoring formula
- scraper volume

### Step 5C - data-access query for comparable candidates
Goal:
- implementirati `ValuationReadyRepository.listComparableCandidates(...)`

Likely files:
- `packages/data-access/src/index.ts`
- testovi ili smoke provjera za mapiranje rowova u domain contract

Acceptance criteria:
- query cita valuation-ready view
- ne cita raw tablice za product comparison flow
- moze filtrirati osnovni target boat input

Out of scope:
- final ranking
- UI
- scoring formula

### Step 5D - basic comparable retrieval filters
Goal:
- definirati i primijeniti prvi minimalni comparable filter

Prvi retrieval boundary:
- same `builder_id`
- same `model_id`
- optional exact `variant_id`
- `publication_status = published`
- `listing_status = active`
- `price_eur is not null`
- `comparable_eligible = true`

Acceptance criteria:
- query vraca samo eligible candidate rows
- nearest-year fallback je pripremljen kao bucket/signal, ali nije score
- geography/recency su fieldovi, ne weights

Out of scope:
- numeric score
- confidence model
- price range calculation

### Step 5E - scoring contract only
Goal:
- definirati minimalni scoring input/output ugovor bez formule

Likely files:
- `packages/scoring/src/index.ts`
- `packages/domain/src/index.ts`

Acceptance criteria:
- scoring contract prima valuation-ready comparable payload
- output moze nositi score/explanation placeholder
- nema finalne formule ni weightinga

Out of scope:
- geography weighting
- recency weighting
- confidence calculation
- valuation range calculation

### Step 5F - verification and docs
Goal:
- dokumentirati i provjeriti Step 5 minimalni data path

Acceptance criteria:
- typecheck prolazi
- SQL smoke za view prolazi nakon lokalnog Supabase reset/migracija
- data-access query smoke prolazi kad Step 5C postoji
- docs tocno govore sto je implementirano i sto ostaje placeholder

Out of scope:
- production deploy
- scraper-driven ingestion volume

## 6. Valuation-ready comparable contract

### Core identity and lineage
- `comparable_id`
- `boat_id`
- `listing_id`
- `raw_listing_id`
- `source_site_id`
- `source_name`
- `source_listing_key`
- `listing_url`
- `created_from_normalized_lineage`

### Canonical boat identity
- `builder_id`
- `canonical_builder`
- `model_id`
- `canonical_model`
- `variant_id`
- `canonical_variant`
- `year_built`
- `year_match_bucket`

### Commercial/listing data
- `ownership_status_code`
- `asking_price`
- `currency`
- `price_eur`
- `first_seen_at`
- `last_seen_at`
- `listing_status`
- `publication_status`

### Location/geography signals
- `country_code`
- `location_region_id`
- `location_bucket`
- `marina_or_city`
- `geography_bucket`

### Quality/source/eligibility signals
- `source_reliability_score`
- `data_quality_score`
- `comparable_eligible`
- `exclusion_reason`
- `recency_bucket`
- `duplicate_signal`

## 7. Real-now fieldovi
Sljedeca polja se mogu dobiti iz trenutne Step 4 normalized sheme ili source registryja:
- `boat_id`
- `listing_id`
- `raw_listing_id`
- `source_site_id`
- `source_name`
- `source_listing_key`
- `listing_url`
- `builder_id`
- `canonical_builder`
- `model_id`
- `canonical_model`
- `variant_id`
- `canonical_variant`
- `year_built`
- `ownership_status_code`
- `asking_price`
- `currency`
- `price_eur`
- `first_seen_at`
- `last_seen_at`
- `listing_status`
- `publication_status`
- `marina_or_city`
- `source_reliability_score`
- `created_from_normalized_lineage`

## 8. Placeholder/future-derived fieldovi
Sljedeca polja moraju postojati u contractu, ali se ne smije glumiti lazna preciznost ako ih Step 5B jos ne moze pouzdano izracunati:
- `year_match_bucket` - ovisi o target boat inputu i kasnijem retrieval/scoring kontekstu
- `country_code` - postoji u shemi, ali Step 4 ga jos ne normalizira pouzdano
- `location_region_id` - postoji u shemi, ali Step 4 ga jos ne linka pouzdano
- `location_bucket` - treba kasnije izvesti iz location mappinga
- `geography_bucket` - treba kasnije pratiti Croatia -> Slovenia -> Adriatic -> Mediterranean strategiju
- `data_quality_score` - postoji u shemi, ali Step 4 ga ne racuna
- `comparable_eligible` - u Step 5B moze biti jednostavno izveden iz minimalnih business pravila
- `exclusion_reason` - mora objasniti zasto zapis nije eligible kad se uvedu stroza pravila
- `recency_bucket` - kasnije se izvodi iz `last_seen_at`, ali ne smije postati weight u Step 5A/B
- `duplicate_signal` - Step 4 jos ne implementira dedupe

## 9. Geography i recency granica
Step 5 priprema signalna polja, ali ne implementira finalno weighting ponasanje.

Buduci market priority ostaje:

`Croatia -> Slovenia -> Adriatic -> Mediterranean`

U Step 5A/B to znaci:
- pripremiti `country_code`, `location_bucket` i `geography_bucket`
- ne dodjeljivati numeric geography weight
- pripremiti `last_seen_at` i `recency_bucket`
- ne tretirati stare listinge kao beskorisne

Stariji listingi ostaju korisni za price range i market structure. Kasniji scoring/confidence model moze smanjiti povjerenje u valuation koji se previse oslanja na starije ili udaljene comparablese.

## 10. Prvi retrieval boundary
Prvi comparable candidate rule:
- same `builder_id`
- same `model_id`
- optional exact `variant_id`
- `publication_status = published`
- `listing_status = active`
- `price_eur is not null`
- `comparable_eligible = true`

Nearest-year fallback je samo pripremljen kroz `year_match_bucket`; ne scorea se u Step 5A/B.

Geography i recency fieldovi su pripremljeni za kasnije, ali nisu weighted.

## 11. View vs table odluka za Step 5B
Step 5B treba poceti kao SQL view.

Razlozi:
- lokalni MVP scale je mali
- schema se jos razvija
- view je lakse mijenjati nego physical table
- view jasnije cuva read-only product boundary
- materialized view ili table imaju smisla tek kad se pojave scraping volume, performance potreba ili refresh semantics

Step 5A je definirala contract; Step 5B implementira prvi normal SQL view prema tom contractu.

## 12. Step 5B implementation status
Step 5B kreira prvi minimalni read-only SQL view:

`public.valuation_ready_comparables`

View cita iz normalized/core tablica:
- `listings`
- `boats`
- `boat_builders`
- `boat_models`
- `boat_variants`
- `source_sites`
- `location_regions`

View ne koristi `raw_listings` kao product source. Lineage prema raw sloju ostaje dostupan kroz `listings.raw_listing_id`, ali product-facing payload nastaje iz normalized tablica.

Step 5B ne implementira:
- data-access query prema viewu
- scoring
- ranking
- confidence model
- geography weighting
- recency weighting
- valuation range
- scraping
- UI

## 13. Step 5B real-now fields
U viewu su real-now polja:
- `comparable_id`
- `boat_id`
- `listing_id`
- `raw_listing_id`
- `source_site_id`
- `source_name`
- `source_listing_key`
- `listing_url`
- `created_from_normalized_lineage`
- `builder_id`
- `canonical_builder`
- `model_id`
- `canonical_model`
- `variant_id`
- `canonical_variant`
- `year_built`
- `ownership_status_code`
- `asking_price`
- `currency`
- `price_eur`
- `first_seen_at`
- `last_seen_at`
- `listing_status`
- `publication_status`
- `country_code`
- `location_region_id`
- `location_bucket` when `location_region_id` is linked
- `marina_or_city`
- `source_reliability_score`
- `data_quality_score`
- `comparable_eligible`
- `exclusion_reason`
- `duplicate_signal` only when `duplicate_cluster_key` exists

## 14. Step 5B placeholder/future fields
Step 5B namjerno koristi jednostavne placeholdere za polja koja jos nisu sigurno izvedena:
- `year_match_bucket = 'not_evaluated'`
- `geography_bucket = 'not_evaluated'`
- `recency_bucket = 'not_evaluated'`
- `duplicate_signal = 'not_evaluated'` when no duplicate cluster exists

Ova polja postoje da Step 5C/D/E mogu raditi nad stabilnim payloadom, ali ne predstavljaju scoring ili weighting implementaciju.

## 15. Step 5B eligibility rule
`comparable_eligible` je `true` samo kad:
- `publication_status = 'published'`
- `listing_status = 'active'`
- `price_eur is not null`
- `builder_id is not null`
- `model_id is not null`

`exclusion_reason` vraca prvi jednostavni razlog:
- `not_published`
- `not_active`
- `missing_price_eur`
- `missing_builder`
- `missing_model`
- `null` if eligible

Stariji listingi se ne iskljucuju samo zbog starosti. Recency ostaje signal za kasniji confidence/scoring, ne Step 5B filter.

## 16. Step 5C implementation status
Step 5C implementira data-access query:

`ValuationReadyRepository.listComparableCandidates(query)`

U configured Supabase query layeru metoda cita samo:

`public.valuation_ready_comparables`

Metoda ne cita:
- `raw_listings`
- `boats`
- `listings`
- druge normalized tablice direktno

To cuva boundary:

`normalized -> valuation-ready -> data-access`

## 17. Step 5C query filters
Step 5C koristi samo sigurne candidate-selection filtere:
- `comparable_eligible = true`
- `publication_status = published`
- `listing_status = active`
- `price_eur is not null`
- `builder_id = target.builderId`
- `model_id = target.modelId`
- `variant_id = target.variantId` only when `variantId` is provided

`limit` se primjenjuje s default vrijednoscu i max capom u data-access sloju.

Step 5C ne implementira:
- scoring
- ranking
- confidence model
- geography weighting
- recency weighting
- valuation range calculation

## 18. Step 5C deterministic ordering
Step 5C koristi deterministicki order samo radi stabilnog outputa:
- `last_seen_at desc`
- `first_seen_at desc`
- `listing_id asc`

Ovo nije valuation ranking i ne smije se tretirati kao scoring.

## 19. Step 5C mapping behavior
SQL rowovi se mapiraju u `ValuationReadyComparable`.

Mapping pravila:
- nullable SQL fieldovi ostaju `null`
- placeholder bucketi kao `not_evaluated` ostaju nepromijenjeni
- numeric values se mapiraju u `number | null`
- `data_quality_score`, `country_code`, `location_region_id` i slicni nezreli signali ne dobivaju fake vrijednosti

Step 5D ce formalnije definirati retrieval filter behavior, a Step 5E scoring contract. Scoring formule ostaju izvan Step 5C.
