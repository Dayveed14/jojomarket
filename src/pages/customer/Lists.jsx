import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Confirm, ErrorState, useAsync } from '../../components/common';
import ListEditor, { fromApiLines, toApiLines } from '../../components/ListEditor';
import Seo from '../../components/Seo';
import { Alert, Button, EmptyState, Field, Spinner, TextInput } from '../../components/ui';
import { meApi, publicApi } from '../../services/api';
import { fmtDate } from '../../utils/format';

export function Lists() {
  const { data, error, loading, reload } = useAsync(() => meApi.lists().then((r) => r.items), []);
  const [removing, setRemoving] = useState(null);
  return (
    <>
      <Seo title="Saved lists" noindex />
      <header className="page-head page-head--row">
        <div><h1>Saved lists</h1><p className="muted">Your usual shops, ready to book again. Prices are always today’s.</p></div>
        <Link to="/app/lists/new" className="btn btn--primary btn--sm">+ New list</Link>
      </header>
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !data ? <Spinner /> : data && (data.length ? (
        <div className="addr-grid">
          {data.map((l) => (
            <article key={l.id} className="card">
              <header className="card__head"><h2>{l.name}</h2><span className="muted small">{l.itemCount} items</span></header>
              <p className="muted small">{l.marketName || 'Any market'} · updated {fmtDate(l.updatedAt)}</p>
              <div className="btn-row">
                <Link className="btn btn--accent btn--sm" to={`/app/bookings/new?list=${l.id}`}>Book this list</Link>
                <Link className="btn btn--secondary btn--sm" to={`/app/lists/${l.id}`}>Edit</Link>
                <Button variant="ghost" className="btn--sm" onClick={() => setRemoving(l)}>Delete</Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card"><EmptyState icon="📝" title="No saved lists yet" action={<Link to="/app/lists/new" className="btn btn--primary btn--sm">Create a list</Link>}>
          Save your weekly foodstuff list once and book it again in seconds. You can also save any booking as a list.
        </EmptyState></div>
      ))}
      <Confirm open={Boolean(removing)} title="Delete this list?" confirmLabel="Delete" onClose={() => setRemoving(null)}
        onConfirm={async () => { await meApi.deleteList(removing.id); setRemoving(null); reload(); }}>
        <p>“{removing?.name}” will be deleted. Bookings made from it aren’t affected.</p>
      </Confirm>
    </>
  );
}

export function ListEdit() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [markets, setMarkets] = useState(null);
  const [name, setName] = useState('');
  const [marketId, setMarketId] = useState('');
  const [lines, setLines] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(isNew);

  useEffect(() => { publicApi.markets().then((r) => { setMarkets(r.items); if (isNew && r.items[0]) setMarketId(String(r.items[0].id)); }); }, [isNew]);
  useEffect(() => {
    if (isNew) return;
    meApi.list(id).then(({ list }) => { setName(list.name); setMarketId(list.marketId ? String(list.marketId) : ''); setLines(fromApiLines(list.items)); setLoaded(true); })
      .catch((e) => setError(e.message));
  }, [id, isNew]);
  useEffect(() => { if (marketId) publicApi.catalog(marketId).then(setCatalog); }, [marketId]);

  const save = async () => {
    setError(''); setBusy(true);
    try {
      const body = { name: name.trim(), marketId: marketId ? Number(marketId) : null, items: toApiLines(lines) };
      if (isNew) await meApi.createList(body); else await meApi.updateList(id, body);
      navigate('/app/lists');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  if (!loaded || !markets) return <Spinner />;
  return (
    <>
      <Seo title={isNew ? 'New list' : 'Edit list'} noindex />
      <nav className="crumbs"><Link to="/app/lists">Saved lists</Link> <span aria-hidden="true">›</span> {isNew ? 'New' : name}</nav>
      <header className="page-head"><h1>{isNew ? 'New list' : 'Edit list'}</h1></header>
      {error && <Alert tone="error">{error}</Alert>}
      <section className="card stack">
        <div className="form form--grid">
          <TextInput label="List name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Weekly foodstuff" maxLength={80} />
          <Field label="Usual market">
            {(a11y) => (
              <select className="input" {...a11y} value={marketId} onChange={(e) => { setMarketId(e.target.value); }}>
                {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
          </Field>
        </div>
        {!catalog ? <Spinner /> : <ListEditor catalog={catalog} lines={lines} onChange={setLines} />}
        <div className="wizard-nav">
          <Link to="/app/lists" className="btn btn--ghost">Cancel</Link>
          <Button onClick={save} loading={busy} disabled={!name.trim()}>Save list</Button>
        </div>
      </section>
    </>
  );
}
