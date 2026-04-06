const workstreams = [
  {
    title: "Manual Entry",
    href: "/manual-entry",
    description: "The first guaranteed acquisition path for controlled market data."
  },
  {
    title: "CSV Import",
    href: "/csv-import",
    description: "A secondary ingestion path for controlled tabular inputs without assuming an external dataset."
  },
  {
    title: "Valuation-Ready Architecture",
    href: "/architecture",
    description: "The system is organized around raw, normalized, and valuation-ready layers."
  }
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Yacht Premium Insurance</p>
        <h1>Controlled ingestion first, scraping later.</h1>
        <p className="lede">
          This scaffold is intentionally data-first. Manual entry works first,
          CSV import stays available as a controlled fallback, and pilot
          marketplace or broker scraping is prepared as a later phase.
        </p>
      </section>

      <section className="grid">
        {workstreams.map((item) => (
          <a key={item.href} className="panel" href={item.href}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </a>
        ))}
      </section>
    </main>
  );
}
