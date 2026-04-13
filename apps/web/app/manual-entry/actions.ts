"use server";

import type {
  ManualEntryDraft,
  OwnershipStatus
} from "@ypi/domain";

import { createServerQueryLayer } from "../../lib/query-layer";
import {
  type ManualEntryField,
  type ManualEntryFormState,
  ownershipStatuses
} from "./form-state";

function readOptionalString(formData: FormData, field: ManualEntryField): string {
  const value = formData.get(field);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function toDraft(formData: FormData): ManualEntryDraft {
  const ownershipStatusHint = readOptionalString(formData, "ownershipStatusHint");

  return {
    sourceName: "internal_manual_entry",
    enteredBy: readOptionalString(formData, "enteredBy"),
    listingUrl: readOptionalString(formData, "listingUrl"),
    sourceListingKey: readOptionalString(formData, "sourceListingKey"),
    title: readOptionalString(formData, "title"),
    description: readOptionalString(formData, "description"),
    builder: readOptionalString(formData, "builder"),
    model: readOptionalString(formData, "model"),
    variant: readOptionalString(formData, "variant"),
    yearBuilt: readOptionalString(formData, "yearBuilt"),
    askingPrice: readOptionalString(formData, "askingPrice"),
    currency: readOptionalString(formData, "currency").toUpperCase(),
    location: readOptionalString(formData, "location"),
    ownershipStatusHint: ownershipStatusHint.length > 0 ? ownershipStatusHint : "unknown",
    engineInfo: readOptionalString(formData, "engineInfo"),
    rawNotes: readOptionalString(formData, "rawNotes")
  };
}

function validateDraft(
  draft: ManualEntryDraft
): Partial<Record<ManualEntryField, string>> {
  const fieldErrors: Partial<Record<ManualEntryField, string>> = {};

  if (!draft.title) {
    fieldErrors.title = "Unesite naslov oglasa ili interni radni naziv.";
  }

  if (!draft.builder) {
    fieldErrors.builder = "Unesite builder kako bi normalizacija imala početni signal.";
  }

  if (!draft.model) {
    fieldErrors.model = "Unesite model kako bi zapis kasnije mogao ući u mapping.";
  }

  if (!draft.askingPrice) {
    fieldErrors.askingPrice = "Unesite traženu cijenu u izvornom obliku.";
  } else if (!/^[0-9.,\s]+$/.test(draft.askingPrice)) {
    fieldErrors.askingPrice = "Koristite brojčani unos, točke ili zareze.";
  }

  if (!draft.currency) {
    fieldErrors.currency = "Unesite valutu, npr. EUR ili USD.";
  } else if (!/^[A-Z]{3}$/.test(draft.currency)) {
    fieldErrors.currency = "Valuta mora biti troslovni ISO kod.";
  }

  if (!draft.location) {
    fieldErrors.location = "Unesite državu, regiju ili marinu kako je trenutno poznato.";
  }

  if (draft.yearBuilt && !/^\d{4}$/.test(draft.yearBuilt)) {
    fieldErrors.yearBuilt = "Godina mora imati četiri znamenke.";
  }

  if (
    draft.ownershipStatusHint &&
    !ownershipStatuses.includes(draft.ownershipStatusHint as OwnershipStatus)
  ) {
    fieldErrors.ownershipStatusHint =
      "Odaberite jedan od ponuđenih statusa vlasništva.";
  }

  return fieldErrors;
}

function toErrorState(
  values: ManualEntryDraft,
  message: string,
  fieldErrors: Partial<Record<ManualEntryField, string>> = {}
): ManualEntryFormState {
  return {
    status: "error",
    message,
    fieldErrors,
    values,
    receipt: null
  };
}

export async function submitManualEntryAction(
  _previousState: ManualEntryFormState,
  formData: FormData
): Promise<ManualEntryFormState> {
  const draft = toDraft(formData);
  const fieldErrors = validateDraft(draft);

  if (Object.keys(fieldErrors).length > 0) {
    return toErrorState(
      draft,
      "Provjerite označena polja prije spremanja unosa.",
      fieldErrors
    );
  }

  try {
    const queryLayer = createServerQueryLayer();
    const receipt = await queryLayer.rawIngestion.submitManualEntry(draft);

    return {
      status: "success",
      message:
        "Unos je spremljen u sirovi ingestion sloj i čeka ekstrakciju, normalizaciju i objavu.",
      fieldErrors: {},
      values: draft,
      receipt
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Ručni unos nije spremljen zbog nepoznate greške.";

    return toErrorState(draft, message);
  }
}
