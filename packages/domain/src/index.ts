export type AcquisitionMethod =
  | "manual_entry"
  | "csv_import"
  | "seed_import"
  | "api_import"
  | "web_scrape";

export type SourceType =
  | "manual"
  | "csv"
  | "seed"
  | "broker"
  | "marketplace"
  | "internal"
  | "unknown";

export type AllowedCollectionMethod =
  | "manual_only"
  | "csv_upload"
  | "api"
  | "scrape"
  | "mixed";

export type RawRecordStatus =
  | "pending"
  | "validated"
  | "failed"
  | "processed";

export interface SourceRegistryEntry {
  id: string;
  sourceName: string;
  sourceType: SourceType;
  allowedCollectionMethod: AllowedCollectionMethod;
  marketFocus: string | null;
  baseUrl: string | null;
  parserVersion: string | null;
  reliabilityScore: number | null;
  ownershipStatusSignalStrength: number | null;
  priceSignalStrength: number | null;
  yearSignalStrength: number | null;
  regionSignalStrength: number | null;
  isActive: boolean;
  notes: string | null;
}

export interface RawListingRecord {
  id: string;
  sourceSiteId: string;
  acquisitionMethod: AcquisitionMethod;
  sourceListingKey: string | null;
  listingUrl: string | null;
  rawTitle: string | null;
  rawPriceText: string | null;
  rawLocationText: string | null;
  rawDescription: string | null;
  rawSpecsJson: Record<string, unknown> | null;
  rawPayloadJson: Record<string, unknown> | null;
  inputPayloadJson: Record<string, unknown> | null;
  observedAt: string;
  fetchedAt: string;
  ingestStatus: RawRecordStatus;
}

export interface ManualEntryDraft {
  sourceName: string;
  listingUrl?: string;
  sourceListingKey?: string;
  title?: string;
  builder?: string;
  model?: string;
  variant?: string;
  askingPrice?: string;
  currency?: string;
  yearBuilt?: string;
  location?: string;
  ownershipStatusHint?: string;
  engineInfo?: string;
  rawNotes?: string;
}

export interface ValuationComparable {
  comparableId: string;
  canonicalBuilder: string;
  canonicalModel: string;
  canonicalVariant: string | null;
  yearBuilt: number | null;
  ownershipStatus: string | null;
  locationBucket: string | null;
  priceEur: number;
  sourceName: string;
  sourceReliabilityScore: number;
  dataQualityScore: number;
  comparableEligibility: boolean;
  exclusionReason: string | null;
}
