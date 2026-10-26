import { useState } from 'react';
import { ErrorState, Modal, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { Alert, Button, Field, Spinner, TextInput } from '../../components/ui';
import { adminApi } from '../../services/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function MarketEditor({ market, categories, onClose, onSaved }) {
  const [f, setF] = useState(() => ({
    name: market.name || '', slug: market.slug || '', area: market.area || '', city: market.city || 'Lagos',
    lat: market.lat ?? '', lng: market.lng ?? '', publicDescription: market.public_description || '', internalNotes: market.internal_notes || '',
    openDays: market.open_days || [1, 2, 3, 4, 5, 6], opensAt: market.opens_at || '07:00', closesAt: market.closes_at || '18:00',
    active: market.active == null ? true : Boolean(market.active), categoryIds: market.category_ids || [],
  }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const toggle = (k, v) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v].sort() }));

  const save = async () => {
    setError(''); setBusy(true);
    try {
      await adminApi.saveMarket(market.id, { ...f, slug: f.slug || f.name.toLowerCase().replace(/market/g, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), lat: Number(f.lat), lng: Number(f.lng) });
      onSaved();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={market.id ? `Edit ${market.name}` : 'New market'} wide footer={<><Button variant="ghost" className="btn--sm" onClick={onClose}>Cancel</Button><Button className="btn--sm" loading={busy} onClick={save}>Save market</Button></>}>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="form form--grid">
        <TextInput label="Market name" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Mile 12 Market" />
        <TextInput label="Area" value={f.area} onChange={(e) => set('area', e.target.value)} placeholder="Kosofe" />
        <TextInput label="Latitude" inputMode="decimal" value={f.lat} onChange={(e) => set('lat', e.target.value)} hint="From Google Maps: right-click the market → copy coordinates." />
        <TextInput label="Longitude" inputMode="decimal" value={f.lng} onChange={(e) => set('lng', e.target.value)} />
        <TextInput label="Opens" type="time" value={f.opensAt} onChange={(e) => set('opensAt', e.target.value)} />
        <TextInput label="Closes" type="time" value={f.closesAt} onChange={(e) => set('closesAt', e.target.value)} />
        <fieldset className="toggles form--full"><legend>Open days</legend>
          <div className="chip-row">{DAYS.map((d, i) => <button type="button" key={d} className={`chip-btn${f.openDays.includes(i) ? ' is-on' : ''}`} onClick={() => toggle('openDays', i)} aria-pressed={f.openDays.includes(i)}>{d}</button>)}</div>
        </fieldset>
        <fieldset className="toggles form--full"><legend>What Jojo buys here</legend>
          <div className="chip-row">{categories.map((c) => <button type="button" key={c.id} className={`chip-btn${f.categoryIds.includes(c.id) ? ' is-on' : ''}`} onClick={() => toggle('categoryIds', c.id)} aria-pressed={f.categoryIds.includes(c.id)}>{c.icon} {c.name}</button>)}</div>
        </fieldset>
        <div className="form--full"><Field label="Description for customers">{(a) => <textarea className="input" rows={2} {...a} value={f.publicDescription} onChange={(e) => set('publicDescription', e.target.value)} />}</Field></div>
        <div className="form--full"><Field label="Private notes">{(a) => <textarea className="input" rows={2} {...a} value={f.internalNotes} onChange={(e) => set('internalNotes', e.target.value)} placeholder="Best stalls, parking, contacts…" />}</Field></div>
        <label className="check"><input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} /><span>Customers can book this market</span></label>
      </div>
    </Modal>
  );
}

export default function Markets() {
  const { data, error, loading, reload } = useAsync(() => adminApi.catalog(), []);
  const [editing, setEditing] = useState(null);
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const catName = (id) => data.categories.find((c) => c.id === id);
  return (
    <>
      <Seo title="Markets" noindex />
      <header className="page-head page-head--row">
        <div><h1>Markets</h1><p className="muted">Where Jojo shops, when they’re open, and what she buys at each one.</p></div>
        <Button className="btn--sm" onClick={() => setEditing({})}>+ New market</Button>
      </header>
      <div className="addr-grid">
        {data.markets.map((m) => (
          <article key={m.id} className={`card${m.active ? '' : ' is-muted'}`}>
            <header className="card__head"><h2>{m.name}</h2><span className={`pill ${m.active ? 'pill--green' : ''}`}>{m.active ? 'Live' : 'Hidden'}</span></header>
            <p className="muted small">{m.area} · {m.open_days.map((d) => DAYS[d]).join(', ')} · {m.opens_at}–{m.closes_at}</p>
            <p className="small">{m.public_description}</p>
            <p className="chip-row">{m.category_ids.map((id) => <span key={id} className="pill">{catName(id)?.icon} {catName(id)?.name}</span>)}</p>
            <Button variant="secondary" className="btn--sm" onClick={() => setEditing(m)}>Edit</Button>
          </article>
        ))}
      </div>
      {editing && <MarketEditor market={editing} categories={data.categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}
