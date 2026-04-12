"use client";

import { useActionState } from "react";

import {
  initialManualEntryFormState,
  submitManualEntryAction
} from "./actions";
import { SubmitButton } from "./SubmitButton";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="field-error">{message}</p>;
}

export function ManualEntryForm() {
  const [state, formAction] = useActionState(
    submitManualEntryAction,
    initialManualEntryFormState
  );

  return (
    <form className="panel manual-entry-form" action={formAction}>
      <div className="form-intro">
        <div>
          <p className="eyebrow">Interni unos</p>
          <h2>Pošalji zapis u raw ingestion</h2>
        </div>
        <p className="helper-copy">
          Ovaj obrazac ne upisuje podatke direktno u normalizirane poslovne
          tablice. Svaki unos prvo stvara `ingest_run`, `raw_listing` i zapis u
          `worker_manual_entries`.
        </p>
      </div>

      <div className="status-stack" aria-live="polite">
        <div className="status-chip">
          Izvor: <strong>internal_manual_entry</strong>
        </div>
        <div className="status-chip">
          Metoda: <strong>manual_entry</strong>
        </div>
        <div className="status-chip">
          Odrediste: <strong>raw ingestion sloj</strong>
        </div>
      </div>

      {state.message ? (
        <div
          className={
            state.status === "success" ? "form-message success" : "form-message error"
          }
        >
          <p>{state.message}</p>
          {state.receipt ? (
            <dl className="receipt-grid">
              <div>
                <dt>ID raw zapisa</dt>
                <dd>{state.receipt.rawListingId}</dd>
              </div>
              <div>
                <dt>ID ingest runa</dt>
                <dd>{state.receipt.ingestRunId}</dd>
              </div>
              <div>
                <dt>Status zapisa</dt>
                <dd>{state.receipt.ingestStatus}</dd>
              </div>
            </dl>
          ) : null}
        </div>
      ) : null}

      <div className="form-grid">
        <label className="field">
          <span>Radnik / inicijali</span>
          <input
            name="enteredBy"
            type="text"
            defaultValue={state.values.enteredBy}
            placeholder="npr. JS"
          />
          <small>Opcionalno, za interni trag unosa.</small>
          <FieldError message={state.fieldErrors.enteredBy} />
        </label>

        <label className="field">
          <span>URL oglasa</span>
          <input
            name="listingUrl"
            type="url"
            defaultValue={state.values.listingUrl}
            placeholder="https://..."
          />
          <small>Ako postoji stabilan URL, spremamo ga u raw trag izvora.</small>
          <FieldError message={state.fieldErrors.listingUrl} />
        </label>

        <label className="field">
          <span>Izvorni ključ oglasa</span>
          <input
            name="sourceListingKey"
            type="text"
            defaultValue={state.values.sourceListingKey}
            placeholder="interna oznaka ili ID"
          />
          <small>Koristi se kad URL nije dovoljan ili nije dostupan.</small>
          <FieldError message={state.fieldErrors.sourceListingKey} />
        </label>

        <label className="field field-span-2">
          <span>Naslov oglasa / radni naziv</span>
          <input
            name="title"
            type="text"
            required
            defaultValue={state.values.title}
            placeholder="npr. Lagoon 42 Owner Version"
          />
          <small>Ovo je minimalni signal za kasniju ekstrakciju i mapiranje.</small>
          <FieldError message={state.fieldErrors.title} />
        </label>

        <label className="field">
          <span>Builder</span>
          <input
            name="builder"
            type="text"
            required
            defaultValue={state.values.builder}
            placeholder="Lagoon"
          />
          <small>Unesite kako je zapis trenutno poznat.</small>
          <FieldError message={state.fieldErrors.builder} />
        </label>

        <label className="field">
          <span>Model</span>
          <input
            name="model"
            type="text"
            required
            defaultValue={state.values.model}
            placeholder="42"
          />
          <small>Model ostaje sirov signal dok ga pipeline ne mapira.</small>
          <FieldError message={state.fieldErrors.model} />
        </label>

        <label className="field">
          <span>Varijanta</span>
          <input
            name="variant"
            type="text"
            defaultValue={state.values.variant}
            placeholder="Owner Version"
          />
          <small>Opcionalno, ako varijanta pomaže razlikovanju modela.</small>
          <FieldError message={state.fieldErrors.variant} />
        </label>

        <label className="field">
          <span>Godina gradnje</span>
          <input
            name="yearBuilt"
            type="text"
            inputMode="numeric"
            defaultValue={state.values.yearBuilt}
            placeholder="2019"
          />
          <small>Ako nije sigurno, ostavite prazno umjesto nagađanja.</small>
          <FieldError message={state.fieldErrors.yearBuilt} />
        </label>

        <label className="field">
          <span>Tražena cijena</span>
          <input
            name="askingPrice"
            type="text"
            inputMode="decimal"
            required
            defaultValue={state.values.askingPrice}
            placeholder="450000"
          />
          <small>Spremamo izvorni unos prije normalizacije valute.</small>
          <FieldError message={state.fieldErrors.askingPrice} />
        </label>

        <label className="field">
          <span>Valuta</span>
          <input
            name="currency"
            type="text"
            required
            maxLength={3}
            defaultValue={state.values.currency}
            placeholder="EUR"
          />
          <small>Troslovni ISO kod, npr. EUR ili USD.</small>
          <FieldError message={state.fieldErrors.currency} />
        </label>

        <label className="field">
          <span>Lokacija</span>
          <input
            name="location"
            type="text"
            required
            defaultValue={state.values.location}
            placeholder="Hrvatska / Split"
          />
          <small>Država, regija, marina ili grad kako ih trenutno znate.</small>
          <FieldError message={state.fieldErrors.location} />
        </label>

        <label className="field">
          <span>Status vlasnistva</span>
          <select
            name="ownershipStatusHint"
            defaultValue={String(state.values.ownershipStatusHint ?? "unknown")}
          >
            <option value="unknown">Nepoznato</option>
            <option value="private">Privatno</option>
            <option value="charter">Charter</option>
            <option value="ex_charter">Bivsi charter</option>
          </select>
          <small>Ovo je pocetni signal za pipeline, ne finalna kanonska vrijednost.</small>
          <FieldError message={state.fieldErrors.ownershipStatusHint} />
        </label>

        <label className="field field-span-2">
          <span>Opis oglasa</span>
          <textarea
            name="description"
            rows={4}
            defaultValue={state.values.description}
            placeholder="Sažetak opisa, opreme ili važnih marketinških navoda."
          />
          <small>
            Ako imate tekst oglasa, spremite ga ovdje kao sirovi opis za kasniju
            ekstrakciju.
          </small>
          <FieldError message={state.fieldErrors.description} />
        </label>

        <label className="field field-span-2">
          <span>Podaci o motoru</span>
          <textarea
            name="engineInfo"
            rows={3}
            defaultValue={state.values.engineInfo}
            placeholder="npr. 2 x Yanmar 57 HP, 1200 h"
          />
          <small>Može ostati slobodni tekst dok normalizacija motora ne bude gotova.</small>
          <FieldError message={state.fieldErrors.engineInfo} />
        </label>

        <label className="field field-span-2">
          <span>Radna bilješka</span>
          <textarea
            name="rawNotes"
            rows={4}
            defaultValue={state.values.rawNotes}
            placeholder="Interna napomena za pregled, sumnju u vlasnistvo ili kvalitetu oglasa."
          />
          <small>
            Bilješka ostaje vezana uz ručni unos i ne gubi se pri kasnijoj obradi.
          </small>
          <FieldError message={state.fieldErrors.rawNotes} />
        </label>
      </div>

      <div className="form-actions">
        <p className="helper-copy">
          Nakon spremanja zapis ostaje u `pending` statusu dok sljedeci pipeline
          korak ne napravi ekstrakciju, normalizaciju, validaciju i objavu.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
