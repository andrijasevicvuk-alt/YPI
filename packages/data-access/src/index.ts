import type {
  ComparableCandidateQuery,
  ComparableCandidateResult,
  DuplicateSignal,
  GeographyBucket,
  ManualEntryDraft,
  ManualEntrySubmissionReceipt,
  NormalizedListingStatus,
  OwnershipStatus,
  RecencyBucket,
  SourceRegistryEntry,
  ValuationReadyComparable,
  YearMatchBucket
} from "@ypi/domain";

export interface RawIngestionRepository {
  submitManualEntry(
    draft: ManualEntryDraft
  ): Promise<ManualEntrySubmissionReceipt>;
  listSources(): Promise<SourceRegistryEntry[]>;
}

export interface ValuationReadyRepository {
  listComparableCandidates(
    query: ComparableCandidateQuery
  ): Promise<ComparableCandidateResult>;
}

export interface QueryLayer {
  rawIngestion: RawIngestionRepository;
  valuationReady: ValuationReadyRepository;
}

export interface SupabaseRestConfig {
  projectUrl: string;
  apiKey: string;
  schema?: string;
}

interface SourceSiteRow {
  id: string;
  source_name: string;
  source_type: SourceRegistryEntry["sourceType"];
  allowed_collection_method: SourceRegistryEntry["allowedCollectionMethod"];
  market_focus: string | null;
  base_url: string | null;
  parser_version: string | null;
  reliability_score: number | null;
  ownership_status_signal_strength: number | null;
  price_signal_strength: number | null;
  year_signal_strength: number | null;
  region_signal_strength: number | null;
  is_active: boolean;
  notes: string | null;
}

interface ValuationReadyComparableRow {
  comparable_id: string;
  boat_id: string;
  listing_id: string;
  raw_listing_id: string;
  source_site_id: string;
  source_name: string;
  source_listing_key: string | null;
  listing_url: string | null;
  created_from_normalized_lineage: boolean;
  builder_id: string | null;
  canonical_builder: string | null;
  model_id: string | null;
  canonical_model: string | null;
  variant_id: string | null;
  canonical_variant: string | null;
  year_built: number | null;
  year_match_bucket: YearMatchBucket;
  ownership_status_code: OwnershipStatus | null;
  asking_price: number | string | null;
  currency: string | null;
  price_eur: number | string | null;
  first_seen_at: string;
  last_seen_at: string;
  listing_status: NormalizedListingStatus;
  publication_status: ValuationReadyComparable["publicationStatus"];
  country_code: string | null;
  location_region_id: string | null;
  location_bucket: string | null;
  marina_or_city: string | null;
  geography_bucket: GeographyBucket;
  source_reliability_score: number | string | null;
  data_quality_score: number | string | null;
  comparable_eligible: boolean;
  exclusion_reason: string | null;
  recency_bucket: RecencyBucket;
  duplicate_signal: DuplicateSignal;
}

const VALUATION_READY_SELECT_COLUMNS = [
  "comparable_id",
  "boat_id",
  "listing_id",
  "raw_listing_id",
  "source_site_id",
  "source_name",
  "source_listing_key",
  "listing_url",
  "created_from_normalized_lineage",
  "builder_id",
  "canonical_builder",
  "model_id",
  "canonical_model",
  "variant_id",
  "canonical_variant",
  "year_built",
  "year_match_bucket",
  "ownership_status_code",
  "asking_price",
  "currency",
  "price_eur",
  "first_seen_at",
  "last_seen_at",
  "listing_status",
  "publication_status",
  "country_code",
  "location_region_id",
  "location_bucket",
  "marina_or_city",
  "geography_bucket",
  "source_reliability_score",
  "data_quality_score",
  "comparable_eligible",
  "exclusion_reason",
  "recency_bucket",
  "duplicate_signal"
] as const;

const DEFAULT_COMPARABLE_LIMIT = 50;
const MAX_COMPARABLE_LIMIT = 200;

function createHeaders(config: SupabaseRestConfig): HeadersInit {
  return {
    apikey: config.apiKey,
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Profile": config.schema ?? "public",
    "Content-Profile": config.schema ?? "public"
  };
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function requestJson<T>(
  config: SupabaseRestConfig,
  path: string,
  init: RequestInit
): Promise<T> {
  const response = await fetch(`${config.projectUrl}${path}`, {
    ...init,
    headers: {
      ...createHeaders(config),
      ...init.headers
    },
    cache: "no-store"
  });
  const payload = await readResponseBody(response);

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : typeof payload === "object" &&
            payload !== null &&
            "message" in payload &&
            typeof payload.message === "string"
          ? payload.message
          : `Supabase request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return payload as T;
}

function toSourceRegistryEntry(row: SourceSiteRow): SourceRegistryEntry {
  return {
    id: row.id,
    sourceName: row.source_name,
    sourceType: row.source_type,
    allowedCollectionMethod: row.allowed_collection_method,
    marketFocus: row.market_focus,
    baseUrl: row.base_url,
    parserVersion: row.parser_version,
    reliabilityScore: row.reliability_score,
    ownershipStatusSignalStrength: row.ownership_status_signal_strength,
    priceSignalStrength: row.price_signal_strength,
    yearSignalStrength: row.year_signal_strength,
    regionSignalStrength: row.region_signal_strength,
    isActive: row.is_active,
    notes: row.notes
  };
}

function toNumberOrNull(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }
  if (typeof value === "number") {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clampComparableLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_COMPARABLE_LIMIT;
  }

  return Math.max(1, Math.min(Math.trunc(limit), MAX_COMPARABLE_LIMIT));
}

function buildComparableCandidatesPath(query: ComparableCandidateQuery): string {
  const params = new URLSearchParams({
    select: VALUATION_READY_SELECT_COLUMNS.join(","),
    comparable_eligible: "eq.true",
    publication_status: "eq.published",
    listing_status: "eq.active",
    price_eur: "not.is.null",
    builder_id: `eq.${query.target.builderId}`,
    model_id: `eq.${query.target.modelId}`,
    order: "last_seen_at.desc.nullslast,first_seen_at.desc.nullslast,listing_id.asc",
    limit: String(clampComparableLimit(query.limit))
  });

  if (query.target.variantId) {
    params.set("variant_id", `eq.${query.target.variantId}`);
  }

  return `/rest/v1/valuation_ready_comparables?${params.toString()}`;
}

function toValuationReadyComparable(
  row: ValuationReadyComparableRow
): ValuationReadyComparable {
  return {
    comparableId: row.comparable_id,
    boatId: row.boat_id,
    listingId: row.listing_id,
    rawListingId: row.raw_listing_id,
    sourceSiteId: row.source_site_id,
    sourceListingKey: row.source_listing_key,
    listingUrl: row.listing_url,
    createdFromNormalizedLineage: row.created_from_normalized_lineage,
    builderId: row.builder_id,
    canonicalBuilder: row.canonical_builder,
    modelId: row.model_id,
    canonicalModel: row.canonical_model,
    variantId: row.variant_id,
    canonicalVariant: row.canonical_variant,
    yearBuilt: row.year_built,
    yearMatchBucket: row.year_match_bucket,
    ownershipStatusCode: row.ownership_status_code,
    askingPrice: toNumberOrNull(row.asking_price),
    currency: row.currency,
    priceEur: toNumberOrNull(row.price_eur),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    listingStatus: row.listing_status,
    publicationStatus: row.publication_status,
    countryCode: row.country_code,
    locationRegionId: row.location_region_id,
    locationBucket: row.location_bucket,
    marinaOrCity: row.marina_or_city,
    geographyBucket: row.geography_bucket,
    sourceName: row.source_name,
    sourceReliabilityScore: toNumberOrNull(row.source_reliability_score),
    dataQualityScore: toNumberOrNull(row.data_quality_score),
    comparableEligible: row.comparable_eligible,
    exclusionReason: row.exclusion_reason,
    recencyBucket: row.recency_bucket,
    duplicateSignal: row.duplicate_signal
  };
}

export function createSupabaseRestQueryLayer(
  config: SupabaseRestConfig
): QueryLayer {
  return {
    rawIngestion: {
      async submitManualEntry(draft) {
        return requestJson<ManualEntrySubmissionReceipt>(
          config,
          "/rest/v1/rpc/submit_manual_entry",
          {
            method: "POST",
            body: JSON.stringify({
              entry: {
                source_name: draft.sourceName ?? "internal_manual_entry",
                entered_by: draft.enteredBy ?? null,
                listing_url: draft.listingUrl ?? null,
                source_listing_key: draft.sourceListingKey ?? null,
                title: draft.title ?? null,
                description: draft.description ?? null,
                builder: draft.builder ?? null,
                model: draft.model ?? null,
                variant: draft.variant ?? null,
                year_built: draft.yearBuilt ?? null,
                asking_price: draft.askingPrice ?? null,
                currency: draft.currency ?? null,
                location: draft.location ?? null,
                ownership_status_hint: draft.ownershipStatusHint ?? null,
                engine_info: draft.engineInfo ?? null,
                raw_notes: draft.rawNotes ?? null
              }
            })
          }
        );
      },
      async listSources() {
        const rows = await requestJson<SourceSiteRow[]>(
          config,
          "/rest/v1/source_sites?select=id,source_name,source_type,allowed_collection_method,market_focus,base_url,parser_version,reliability_score,ownership_status_signal_strength,price_signal_strength,year_signal_strength,region_signal_strength,is_active,notes&order=source_name.asc",
          {
            method: "GET"
          }
        );

        return rows.map(toSourceRegistryEntry);
      }
    },
    valuationReady: {
      async listComparableCandidates(query) {
        const rows = await requestJson<ValuationReadyComparableRow[]>(
          config,
          buildComparableCandidatesPath(query),
          {
            method: "GET"
          }
        );

        return {
          target: query.target,
          candidates: rows.map(toValuationReadyComparable)
        };
      }
    }
  };
}

export function createUnconfiguredQueryLayer(): QueryLayer {
  return {
    rawIngestion: {
      async submitManualEntry() {
        throw new Error("Manual entry repository is not wired yet.");
      },
      async listSources() {
        return [];
      }
    },
    valuationReady: {
      async listComparableCandidates(query) {
        return {
          target: query.target,
          candidates: []
        };
      }
    }
  };
}
