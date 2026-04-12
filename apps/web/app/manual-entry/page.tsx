import type { Metadata } from "next";

import { ManualEntryForm } from "./ManualEntryForm";

export const metadata: Metadata = {
  title: "Ručni unos | YPI",
  description: "Interni ručni unos koji prvo zapisuje podatke u raw ingestion sloj."
};

const flowSteps = [
  {
    title: "1. Radnik unosi sirove podatke",
    body: "Forma prima naslov, builder, model, cijenu, lokaciju i interne bilješke bez pokušaja direktnog kanonskog mapiranja."
  },
  {
    title: "2. Aplikacija zapisuje u raw sloj",
    body: "Serverska akcija poziva `submit_manual_entry`, koji otvara `ingest_run`, stvara `raw_listing` i sprema pomoćni zapis u `worker_manual_entries`."
  },
  {
    title: "3. Pipeline preuzima kasnije",
    body: "Ekstrakcija, normalizacija, validacija i objava ostaju odvojeni koraci za sljedeću fazu."
  }
];

export default function ManualEntryPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Korak 3</p>
        <h1>Ručni unos prvo ide u raw ingestion.</h1>
        <p className="lede">
          Ovo je interni radnicki obrazac za prvi garantirani ulazni put. Zapis se
          namjerno ne sprema direktno u `boats`, `engines` ili `listings`, nego
          prvo u raw sloj prilagoden auditu, s jasnim tragom izvora i porijeklom
          rucnog unosa.
        </p>
      </section>

      <ManualEntryForm />

      <section className="grid">
        {flowSteps.map((step) => (
          <article className="panel" key={step.title}>
            <h2>{step.title}</h2>
            <p>{step.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
