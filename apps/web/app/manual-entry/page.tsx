import type { Metadata } from "next";

import { ManualEntryForm } from "./ManualEntryForm";

export const metadata: Metadata = {
  title: "Admin ručni unos | YPI",
  description: "Bootstrap/admin ručni unos koji prvo zapisuje podatke u sirovi ingestion sloj."
};

const flowSteps = [
  {
    title: "1. Admin dodaje bootstrap zapis",
    body: "Forma služi za kontrolirane iznimke, testne primjere ili privremeni unos prije stabilnog scrapinga."
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
        <p className="eyebrow">Bootstrap / admin alat</p>
        <h1>Ručni unos je pomoćni put, ne glavni proizvod.</h1>
        <p className="lede">
          Ova ruta postoji za bootstrap podatke, kontrolirane iznimke i admin
          provjere dok se glavni tržišni dataset puni scrapingom marketplace i
          broker izvora. Zapis se i dalje namjerno sprema prvo u sirovi sloj, a
          ne direktno u `boats`, `engines` ili `listings`.
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
