import type {
  ManualEntryDraft,
  ManualEntrySubmissionReceipt,
  OwnershipStatus
} from "@ypi/domain";

export const ownershipStatuses: OwnershipStatus[] = [
  "private",
  "charter",
  "ex_charter",
  "unknown"
];

export type ManualEntryField =
  | "enteredBy"
  | "listingUrl"
  | "sourceListingKey"
  | "title"
  | "description"
  | "builder"
  | "model"
  | "variant"
  | "yearBuilt"
  | "askingPrice"
  | "currency"
  | "location"
  | "ownershipStatusHint"
  | "engineInfo"
  | "rawNotes";

export interface ManualEntryFormState {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors: Partial<Record<ManualEntryField, string>>;
  values: ManualEntryDraft;
  receipt: ManualEntrySubmissionReceipt | null;
}

export function createEmptyManualEntryDraft(): ManualEntryDraft {
  return {
    sourceName: "internal_manual_entry",
    enteredBy: "",
    listingUrl: "",
    sourceListingKey: "",
    title: "",
    description: "",
    builder: "",
    model: "",
    variant: "",
    yearBuilt: "",
    askingPrice: "",
    currency: "EUR",
    location: "",
    ownershipStatusHint: "unknown",
    engineInfo: "",
    rawNotes: ""
  };
}

export const initialManualEntryFormState: ManualEntryFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  values: createEmptyManualEntryDraft(),
  receipt: null
};

export function normalizeManualEntryFormState(
  state: ManualEntryFormState | undefined
): ManualEntryFormState {
  if (!state) {
    return initialManualEntryFormState;
  }

  return {
    status: state.status ?? "idle",
    message: state.message ?? null,
    fieldErrors: state.fieldErrors ?? {},
    values: {
      ...createEmptyManualEntryDraft(),
      ...(state.values ?? {})
    },
    receipt: state.receipt ?? null
  };
}
