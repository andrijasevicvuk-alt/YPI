export default function CsvImportPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Bootstrap / admin alat</p>
        <h1>CSV uvoz je pomoćni put za kontrolirane tablice.</h1>
        <p className="lede">
          Glavni tržišni dataset treba dolaziti iz scraping adaptera za
          marketplace i broker izvore. CSV uvoz ostaje dostupan samo za
          bootstrap, testne podatke ili admin kontrolirane tablice.
        </p>
      </section>

      <section className="panel">
        <h2>Pravilo dizajna</h2>
        <p>
          Importeri moraju mapirati nepoznate ulazne stupce u raw ingestion
          zapise. CSV format ne smije oblikovati glavni product flow, koji radi
          nad valuation-ready slojem.
        </p>
      </section>
    </main>
  );
}
