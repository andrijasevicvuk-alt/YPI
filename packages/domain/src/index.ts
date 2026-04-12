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

export type OwnershipStatus =
  | "private"
  | "charter"
  | "ex_charter"
  | "unknown";

export type NormalizedListingStatus =
  | "draft"
  | "active"
  | "stale"
  | "removed"
  | "sold"
  | "archived";

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
  ingestRunId: string | null;
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
  createdAt: string;
}

export interface ManualEntryDraft {
  sourceName?: string;
  enteredBy?: string;
  listingUrl?: string;
  sourceListingKey?: string;
  title?: string;
  description?: string;
  builder?: string;
  model?: string;
  variant?: string;
  askingPrice?: string;
  currency?: string;
  yearBuilt?: string;
  location?: string;
  ownershipStatusHint?: OwnershipStatus | string;
  engineInfo?: string;
  rawNotes?: string;
}

export interface ManualEntrySubmissionReceipt {
  rawListingId: string;
  manualEntryId: string;
  ingestRunId: string;
  sourceSiteId: string;
  sourceName: string;
  acquisitionMethod: AcquisitionMethod;
  ingestStatus: RawRecordStatus;
  submittedAt: string;
}

export interface NormalizedBoatRecord {
  id: string;
  primaryRawListingId: string | null;
  builderId: string | null;
  modelId: string | null;
  variantId: string | null;
  yearBuilt: number | null;
  yearLaunched: number | null;
  boatType: string | null;
  loaM: number | null;
  beamM: number | null;
  draftM: number | null;
  cabins: number | null;
  berths: number | null;
  heads: number | null;
  hullMaterial: string | null;
  conditionRating: number | null;
  refitYear: number | null;
}

export interface NormalizedEngineRecord {
  id: string;
  boatId: string;
  sourceRawListingId: string | null;
  engineBrand: string | null;
  engineModel: string | null;
  engineCount: number | null;
  horsepowerEach: number | null;
  engineHours: number | null;
  engineType: string | null;
  fuelType: string | null;
  driveType: string | null;
}

export interface NormalizedListingRecord {
  id: string;
  rawListingId: string;
  boatId: string;
  sourceSiteId: string;
  sourceListingKey: string | null;
  title: string | null;
  listingUrl: string | null;
  countryCode: string | null;
  locationRegionId: string | null;
  marinaOrCity: string | null;
  ownershipStatusCode: OwnershipStatus | null;
  listingStatus: NormalizedListingStatus;
  askingPrice: number | null;
  currency: string | null;
  priceEur: number | null;
  firstSeenAt: string;
  lastSeenAt: string;
  descriptionRaw: string | null;
  sourceReliabilityScore: number | null;
  parseConfidence: number | null;
  dataQualityScore: number | null;
  duplicateClusterKey: string | null;
}

export interface PriceHistoryRecord {
  id: string;
  listingId: string;
  rawListingId: string | null;
  observedAt: string;
  priceAmount: number | null;
  currency: string | null;
  priceEur: number | null;
  note: string | null;
}

export interface WorkerNoteRecord {
  id: string;
  rawListingId: string | null;
  boatId: string | null;
  listingId: string | null;
  noteType: string;
  noteBody: string;
  createdBy: string | null;
  createdAt: string;
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
