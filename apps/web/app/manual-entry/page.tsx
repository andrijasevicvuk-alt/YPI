export default function ManualEntryPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Guaranteed input path</p>
        <h1>Manual entry comes first.</h1>
        <p className="lede">
          This page is the placeholder for the first fully supported acquisition
          route. Worker-entered listings should write to raw ingestion tables
          first, then move through normalization, quality scoring, and
          valuation-ready publication.
        </p>
      </section>

      <section className="panel">
        <h2>Planned initial fields</h2>
        <p>
          Source name, listing URL if available, title, builder, model, year,
          asking price, currency, location, ownership status hints, engine
          details, and raw notes.
        </p>
      </section>
    </main>
  );
}
