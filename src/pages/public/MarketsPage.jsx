import { Link } from 'react-router-dom';
import { useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { Spinner } from '../../components/ui';
import { SITE } from '../../config/site';
import { publicApi } from '../../services/api';

export default function MarketsPage() {
  const { data } = useAsync(() => publicApi.markets().then((r) => r.items), []);
  return (
    <section className="section">
      <Seo
        title={`Markets we shop in ${SITE.city}`}
        description={`Jojo Market shops at ${SITE.city}'s traditional markets — Mile 12, Balogun, Idumota, Oyingbo and more — for foodstuff, fabric, plastics and household goods.`}
        jsonLd={data && { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: data.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: m.name, description: m.description })) }}
      />
      <div className="container">
        <header className="section__head">
          <p className="eyebrow">Markets</p>
          <h1 className="section__title">Where Jojo shops in {SITE.city}</h1>
          <p className="section__lead">Pick the market when you book. Each one is best for different things.</p>
        </header>
        {!data ? <Spinner /> : (
          <div className="market-grid market-grid--public">
            {data.map((m) => (
              <article key={m.id} className="market-card market-card--static">
                <h2>{m.name}</h2>
                <span className="muted small">{m.area} · {m.openDaysLabel} · {m.hours}</span>
                <p className="market-card__desc">{m.description}</p>
                <ul className="chip-row">{m.categories.map((c) => <li key={c.id} className="pill">{c.icon} {c.name}</li>)}</ul>
              </article>
            ))}
          </div>
        )}
        <p className="center" style={{ marginTop: 32 }}><Link to="/register" className="btn btn--accent btn--lg">Book a shopper</Link></p>
      </div>
    </section>
  );
}
