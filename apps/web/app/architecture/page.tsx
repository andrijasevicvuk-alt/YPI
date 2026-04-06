export default function ArchitecturePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Core architecture</p>
        <h1>Raw to normalized to valuation-ready.</h1>
        <p className="lede">
          Acquisition logic, cleaning logic, and business scoring are kept as
          separate boundaries so the system remains explainable and safe to
          evolve from manual data to later pilot scraping.
        </p>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Raw</h2>
          <p>Audit-first ingestion records with source trace and raw payloads.</p>
        </article>
        <article className="panel">
          <h2>Normalized</h2>
          <p>Canonical builder, model, price, location, and engine data.</p>
        </article>
        <article className="panel">
          <h2>Valuation-Ready</h2>
          <p>Only eligible records for scoring, explanation, and worker UI.</p>
        </article>
      </section>
    </main>
  );
}
