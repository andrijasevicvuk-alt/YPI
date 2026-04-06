import type {
  ManualEntryDraft,
  RawListingRecord,
  SourceRegistryEntry,
  ValuationComparable
} from "@ypi/domain";

export interface RawIngestionRepository {
  createManualEntry(draft: ManualEntryDraft): Promise<RawListingRecord>;
  listSources(): Promise<SourceRegistryEntry[]>;
}

export interface ValuationReadyRepository {
  listComparableCandidates(): Promise<ValuationComparable[]>;
}

export interface QueryLayer {
  rawIngestion: RawIngestionRepository;
  valuationReady: ValuationReadyRepository;
}

export function createUnconfiguredQueryLayer(): QueryLayer {
  return {
    rawIngestion: {
      async createManualEntry() {
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
