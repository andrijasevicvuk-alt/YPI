import type {
  ManualEntryDraft,
  ManualEntrySubmissionReceipt,
  SourceRegistryEntry,
  ValuationComparable
} from "@ypi/domain";

export interface RawIngestionRepository {
  submitManualEntry(
    draft: ManualEntryDraft
  ): Promise<ManualEntrySubmissionReceipt>;
  listSources(): Promise<SourceRegistryEntry[]>;
}

export interface ValuationReadyRepository {
  listComparableCandidates(): Promise<ValuationComparable[]>;
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
      async listComparableCandidates() {
        return [];
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
      async listComparableCandidates() {
        return [];
      }
    }
  };
}
