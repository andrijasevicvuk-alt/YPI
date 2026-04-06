export default function CsvImportPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Secondary input path</p>
        <h1>CSV import is supported, but not assumed.</h1>
        <p className="lede">
          The system does not depend on any confirmed external dataset. CSV
          import stays available for controlled inputs when a valid source is
          later confirmed.
        </p>
      </section>

      <section className="panel">
        <h2>Design rule</h2>
        <p>
          Importers must map unknown input columns into raw ingestion records
          instead of shaping the whole system around one source format.
        </p>
      </section>
    </main>
  );
}
