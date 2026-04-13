const workstreams = [
  {
    title: "Search i usporedba",
    href: "/architecture",
    description: "Glavni proizvod radi nad valuation-ready podacima: unos plovila, usporedbe, raspon cijene i objašnjenje."
  },
  {
    title: "Ručni unos",
    href: "/manual-entry",
    description: "Bootstrap/admin alat za kontrolirane iznimke. Ne predstavlja glavni product flow."
  },
  {
    title: "CSV uvoz",
    href: "/csv-import",
    description: "Bootstrap/admin alat za kontrolirane tablične ulaze, ne primarni izvor tržišnih podataka."
  }
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Yacht Premium Insurance</p>
        <h1>Search i usporedba mediteranskih cijena brodova.</h1>
        <p className="lede">
          Glavni proizvod je search and comparison UI nad valuation-ready
          datasetom: korisnik unosi plovilo, sustav dohvaća usporedive oglase,
          računa branljiv raspon cijene i objašnjava rezultat. Scraping
          marketplace i broker izvora je primarni način akvizicije podataka, dok
          su ručni unos i CSV uvoz samo bootstrap/admin alati.
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
