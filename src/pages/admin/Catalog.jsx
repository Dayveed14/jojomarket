// Catalogue: items and how they're sold. Every price is editable data — nothing is hardcoded.
//   Fixed  — one known price for the unit (Tomatoes · Basket · ₦20,000)
//   Range  — varies by type (Rice · Bag · Basmati ₦95,000–₦140,000)
//   No price — customer enters the amount (Ugwu, spices)
import { useMemo, useState } from 'react';
import { ErrorState, Modal, MoneyInput, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { Alert, Button, Field, Spinner, TextInput } from '../../components/ui';
import { adminApi } from '../../services/api';
import { fmtDate, naira, nairaRange } from '../../utils/format';

const blankOption = () => ({ id: null, unitLabel: '', variant: '', priceType: 'fixed', price: '', priceMin: '', priceMax: '', allowQuantity: true, isStandard: false, active: true });

const optPrice = (o) => (o.price_type === 'fixed' ? naira(o.price) : o.price_type === 'range' ? nairaRange(o.price_min, o.price_max) : 'Customer sets amount');

function ItemEditor({ item, categories, onClose, onSaved }) {
  const [f, setF] = useState(() => item?.id ? {
    categoryId: item.category_id, name: item.name, description: item.description || '', searchTerms: item.search_terms || '',
    allowOpenAmount: Boolean(item.allow_open_amount), allowSubstitutions: Boolean(item.allow_substitutions), restockDays: item.restock_days ?? '', active: Boolean(item.active),
    options: item.options.filter((o) => o.active).map((o) => ({
      id: o.id, unitLabel: o.unit_label, variant: o.variant || '', priceType: o.price_type, price: o.price ?? '', priceMin: o.price_min ?? '', priceMax: o.price_max ?? '',
      allowQuantity: Boolean(o.allow_quantity), isStandard: Boolean(o.is_standard), active: true,
    })),
  } : { categoryId: item?.categoryId || categories[0]?.id, name: '', description: '', searchTerms: '', allowOpenAmount: true, allowSubstitutions: true, restockDays: '', active: true, options: [blankOption()] });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setOpt = (i, patch) => setF((x) => ({ ...x, options: x.options.map((o, j) => (j === i ? { ...o, ...patch } : patch.isStandard ? { ...o, isStandard: false } : o)) }));

  const save = async () => {
    setError(''); setBusy(true);
    try {
      const body = {
        ...f, categoryId: Number(f.categoryId), restockDays: f.restockDays === '' ? null : Number(f.restockDays),
        options: f.options.map((o, i) => ({
          ...o, sort: i, variant: o.variant || null,
          price: o.priceType === 'fixed' ? Number(o.price) : null,
          priceMin: o.priceType === 'range' ? Number(o.priceMin) : null,
          priceMax: o.priceType === 'range' ? Number(o.priceMax) : null,
        })),
      };
      await adminApi.saveItem(item?.id, body);
      onSaved();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={item?.id ? `Edit ${item.name}` : 'New item'} wide footer={(
      <><Button variant="ghost" className="btn--sm" onClick={onClose}>Cancel</Button><Button className="btn--sm" loading={busy} onClick={save}>Save item</Button></>
    )}>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="form form--grid">
        <TextInput label="Item name" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Tomatoes" />
        <Field label="Category">{(a) => <select className="input" {...a} value={f.categoryId} onChange={(e) => set('categoryId', e.target.value)}>{categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select>}</Field>
        <TextInput label="Other names customers search for" value={f.searchTerms} onChange={(e) => set('searchTerms', e.target.value)} placeholder="tomato, rodo, tatashe" />
        <TextInput label="Restock estimate (days one standard unit lasts a family of 4)" inputMode="numeric" value={f.restockDays} onChange={(e) => set('restockDays', e.target.value.replace(/\D/g, ''))} hint="Leave blank for things that aren’t restocked (fabric, clothes)." />
        <label className="check"><input type="checkbox" checked={f.allowOpenAmount} onChange={(e) => set('allowOpenAmount', e.target.checked)} /><span>Customers may buy by amount (e.g. “₦7,000 of tomatoes”)</span></label>
        <label className="check"><input type="checkbox" checked={f.allowSubstitutions} onChange={(e) => set('allowSubstitutions', e.target.checked)} /><span>Substitutions possible</span></label>
        <label className="check"><input type="checkbox" checked={f.active} onChange={(e) => set('active', e.target.checked)} /><span>Show to customers</span></label>
      </div>

      <h3 className="review__h">How it’s sold</h3>
      <p className="muted small">Add one row per unit or type. Old bookings keep the price they were made with; every change is kept in price history.</p>
      <div className="opt-rows">
        {f.options.map((o, i) => (
          <div key={o.id || `n${i}`} className="opt-row">
            <TextInput label="Unit" value={o.unitLabel} onChange={(e) => setOpt(i, { unitLabel: e.target.value })} placeholder="Basket, Bag (50kg), Cup" />
            <TextInput label="Type / variant (optional)" value={o.variant} onChange={(e) => setOpt(i, { variant: e.target.value })} placeholder="Basmati, Oloyin" />
            <Field label="Price">{(a) => (
              <select className="input" {...a} value={o.priceType} onChange={(e) => setOpt(i, { priceType: e.target.value, allowQuantity: e.target.value !== 'none' })}>
                <option value="fixed">Fixed price</option><option value="range">Price range</option><option value="none">No price — customer sets amount</option>
              </select>
            )}</Field>
            {o.priceType === 'fixed' && <Field label="₦ per unit">{(a) => <MoneyInput {...a} value={o.price} onChange={(v) => setOpt(i, { price: v })} />}</Field>}
            {o.priceType === 'range' && (
              <>
                <Field label="From ₦">{(a) => <MoneyInput {...a} value={o.priceMin} onChange={(v) => setOpt(i, { priceMin: v })} />}</Field>
                <Field label="To ₦">{(a) => <MoneyInput {...a} value={o.priceMax} onChange={(v) => setOpt(i, { priceMax: v })} />}</Field>
              </>
            )}
            <div className="opt-row__flags">
              {o.priceType !== 'none' && <label className="check check--sm"><input type="checkbox" checked={o.allowQuantity} onChange={(e) => setOpt(i, { allowQuantity: e.target.checked })} /><span>Can order by quantity</span></label>}
              <label className="check check--sm"><input type="radio" name="std" checked={o.isStandard} onChange={() => setOpt(i, { isStandard: true })} /><span>Standard unit (for restocking)</span></label>
              <button type="button" className="line__remove" onClick={() => setF((x) => ({ ...x, options: x.options.filter((_, j) => j !== i) }))}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setF((x) => ({ ...x, options: [...x.options, blankOption()] }))}>+ Add a unit / type</button>
    </Modal>
  );
}

export default function Catalog() {
  const { data, error, loading, reload } = useAsync(() => adminApi.catalog(), []);
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [catEdit, setCatEdit] = useState(null);

  const items = useMemo(() => (data?.items || []).filter((i) => (cat === 'all' || i.category_id === cat) && (!q || `${i.name} ${i.search_terms || ''}`.toLowerCase().includes(q.toLowerCase()))), [data, cat, q]);

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <Seo title="Catalogue" noindex />
      <header className="page-head page-head--row">
        <div><h1>Catalogue &amp; prices</h1><p className="muted">What customers can ask for, and how each item is sold. Update prices as the market changes.</p></div>
        <div className="btn-row">
          <Button variant="ghost" className="btn--sm" onClick={() => setCatEdit({})}>+ Category</Button>
          <Button className="btn--sm" onClick={() => setEditing({ categoryId: cat === 'all' ? undefined : cat })}>+ New item</Button>
        </div>
      </header>
      <div className="chip-row">
        <button className={`chip-btn${cat === 'all' ? ' is-on' : ''}`} onClick={() => setCat('all')}>All ({data.items.length})</button>
        {data.categories.map((c) => (
          <button key={c.id} className={`chip-btn${cat === c.id ? ' is-on' : ''}${c.active ? '' : ' is-off'}`} onClick={() => setCat(c.id)} onDoubleClick={() => setCatEdit(c)} title="Double-click to edit">
            {c.icon} {c.name}
          </button>
        ))}
        <input className="input input--sm" aria-label="Search items" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 200 }} />
      </div>
      <div className="card card--flush">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Item</th><th>How it’s sold</th><th>Restock</th><th>Status</th><th /></tr></thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className={i.active ? '' : 'is-muted'}>
                  <td><strong>{i.name}</strong><div className="muted small">{i.category_name}</div></td>
                  <td className="wrap">
                    {i.options.filter((o) => o.active).length ? (
                      <ul className="opt-list">{i.options.filter((o) => o.active).map((o) => (
                        <li key={o.id}>{o.unit_label}{o.variant && ` · ${o.variant}`}: <strong>{optPrice(o)}</strong>{o.is_standard ? <span className="pill">std</span> : null}<span className="muted small"> · {fmtDate(o.price_updated_at)}</span></li>
                      ))}</ul>
                    ) : <span className="muted">Customer sets amount</span>}
                  </td>
                  <td>{i.restock_days ? `${i.restock_days} days` : '—'}</td>
                  <td><span className={`pill ${i.active ? 'pill--green' : ''}`}>{i.active ? 'Live' : 'Hidden'}</span></td>
                  <td><Button variant="secondary" className="btn--sm" onClick={() => setEditing(i)}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <ItemEditor item={editing} categories={data.categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {catEdit && <CategoryEditor cat={catEdit} onClose={() => setCatEdit(null)} onSaved={() => { setCatEdit(null); reload(); }} />}
    </>
  );
}

function CategoryEditor({ cat, onClose, onSaved }) {
  const [f, setF] = useState({ name: cat.name || '', slug: cat.slug || '', icon: cat.icon || '', sort: cat.sort ?? 0, active: cat.active == null ? true : Boolean(cat.active) });
  const [error, setError] = useState('');
  const save = async () => {
    setError('');
    try { await adminApi.saveCategory(cat.id, { ...f, slug: f.slug || f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }); onSaved(); } catch (e) { setError(e.message); }
  };
  return (
    <Modal open onClose={onClose} title={cat.id ? 'Edit category' : 'New category'} footer={<><Button variant="ghost" className="btn--sm" onClick={onClose}>Cancel</Button><Button className="btn--sm" onClick={save}>Save</Button></>}>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="form">
        <TextInput label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <TextInput label="Icon (emoji)" value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })} />
        <label className="check"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /><span>Active</span></label>
      </div>
    </Modal>
  );
}
