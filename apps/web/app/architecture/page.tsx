export default function ArchitecturePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Temeljna arhitektura</p>
        <h1>Raw prema normalized prema valuation-ready sloju.</h1>
        <p className="lede">
          Logika prikupljanja, čišćenja i poslovnog bodovanja ostaju odvojene
          granice kako bi sustav ostao objašnjiv. Glavni product flow čita
          valuation-ready podatke za search i usporedbu, dok scraping puni raw
          sloj kroz marketplace i broker izvore.
        </p>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Raw</h2>
          <p>Ingestion zapisi za audit, s tragom izvora i raw payloadima.</p>
        </article>
        <article className="panel">
          <h2>Normalized</h2>
          <p>Kanonski builder, model, cijena, lokacija i podaci o motoru.</p>
        </article>
        <article className="panel">
          <h2>Valuation-Ready</h2>
          <p>Samo prihvatljivi zapisi za search, usporedbu, bodovanje i objašnjenje.</p>
        </article>
      </section>
    </main>
  );
}
