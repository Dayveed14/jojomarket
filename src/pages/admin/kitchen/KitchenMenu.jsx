import { useState } from 'react';
import { ErrorState, Modal, MoneyInput, useAsync } from '../../../components/common';
import { DishArt, DishImage, ILLUSTRATIONS } from '../../../components/kitchen/DishArt';
import Seo from '../../../components/Seo';
import { Alert, Button, Field, Spinner, TextInput } from '../../../components/ui';
import { adminKitchenApi, kitchenApi } from '../../../services/api';
import { naira } from '../../../utils/format';

const EXCLUSIONS = {
  no_garlic: 'No garlic', no_ginger: 'No ginger', no_onions: 'No onions', no_seasoning_cubes: 'No seasoning cubes', no_msg: 'No MSG', no_crayfish: 'No crayfish',
  low_salt: 'Low salt', low_oil: 'Less oil', no_palm_oil: 'No palm oil', no_beef: 'No beef', no_shellfish: 'No shellfish', no_nuts: 'No nuts',
};
const blank = { slug: '', name: '', category: 'rice', description: '', illustration: 'jollof', allowedExclusions: ['no_garlic', 'no_ginger', 'low_salt'], spiceLevels: true, contains: '', featured: false, active: true, sort: 0, options: [{ label: 'Plate', serves: 'Serves 1', price: '', portions: 1, isBulk: false, active: true }] };

function MealEditor({ meal, categories, onClose, onSaved }) {
  const [f, setF] = useState(() => (meal ? {
    ...blank, ...meal, description: meal.description || '', contains: meal.contains || '',
    options: meal.options.filter((o) => o.active !== false).map((o) => ({ ...o, serves: o.serves || '' })),
  } : blank));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }));
  const setOpt = (i, k, v) => setF((x) => ({ ...x, options: x.options.map((o, j) => (j === i ? { ...o, [k]: v } : o)) }));
  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = {
        slug: f.slug || f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), name: f.name, category: f.category, description: f.description || null,
        illustration: f.illustration, allowedExclusions: f.allowedExclusions, spiceLevels: f.spiceLevels, contains: f.contains || null, featured: f.featured, active: f.active, sort: Number(f.sort) || 0,
        options: f.options.map((o) => ({ id: o.id || null, label: o.label, serves: o.serves || null, price: Number(o.price) || 0, portions: Number(o.portions) || 1, isBulk: Boolean(o.isBulk), active: true })),
      };
      onSaved((await adminKitchenApi.saveMeal(meal?.id, body)).meal);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={meal ? `Edit ${meal.name}` : 'New dish'} wide footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={save}>Save dish</Button></>}>
      {err && <Alert tone="error">{err}</Alert>}
      <div className="form form--grid">
        <TextInput label="Name" value={f.name} onChange={set('name')} />
        <Field label="Section">{(a) => <select className="input" {...a} value={f.category} onChange={set('category')}>{categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>}</Field>
        <div className="form--full"><Field label="Description">{(a) => <textarea className="input" rows={2} {...a} value={f.description} onChange={set('description')} />}</Field></div>
        <TextInput label="Contains (allergens)" value={f.contains} onChange={set('contains')} placeholder="e.g. fish, egg" />
        <Field label="Illustration (used until you upload a photo)">
          {(a) => <select className="input" {...a} value={f.illustration} onChange={set('illustration')}>{ILLUSTRATIONS.map((k) => <option key={k} value={k}>{k}</option>)}</select>}
        </Field>
      </div>
      <div style={{ width: 110, margin: '8px 0' }}><DishArt dish={f.illustration} /></div>
      <fieldset className="fieldset-plain" style={{ marginTop: 10 }}>
        <legend className="field__label">Customers may ask to leave out</legend>
        <div className="k-excl">
          {Object.entries(EXCLUSIONS).map(([k, l]) => (
            <label key={k}><input type="checkbox" checked={f.allowedExclusions.includes(k)} onChange={() => setF((x) => ({ ...x, allowedExclusions: x.allowedExclusions.includes(k) ? x.allowedExclusions.filter((y) => y !== k) : [...x.allowedExclusions, k] }))} />{l}</label>
          ))}
        </div>
      </fieldset>
      <div className="btn-row" style={{ margin: '12px 0' }}>
        <label className="check"><input type="checkbox" checked={f.spiceLevels} onChange={set('spiceLevels')} /> Customer picks pepper level</label>
        <label className="check"><input type="checkbox" checked={f.featured} onChange={set('featured')} /> Jojo’s pick</label>
        <label className="check"><input type="checkbox" checked={f.active} onChange={set('active')} /> On the menu</label>
      </div>
      <h3>Sizes &amp; prices</h3>
      <p className="muted small">“Portions” is cooking effort — a plate is 1, a 5-litre soup bucket about 15. It decides how full a day gets.</p>
      {f.options.map((o, i) => (
        <div key={o.id || `n${i}`} className="form form--grid" style={{ borderTop: '1px dashed var(--line)', paddingTop: 10 }}>
          <TextInput label="Size" value={o.label} onChange={(e) => setOpt(i, 'label', e.target.value)} />
          <TextInput label="Serves" value={o.serves} onChange={(e) => setOpt(i, 'serves', e.target.value)} />
          <Field label="Price">{(a) => <MoneyInput {...a} value={o.price} onChange={(v) => setOpt(i, 'price', v)} />}</Field>
          <TextInput label="Portions" inputMode="decimal" value={o.portions} onChange={(e) => setOpt(i, 'portions', e.target.value.replace(/[^\d.]/g, ''))} />
          <label className="check"><input type="checkbox" checked={o.isBulk} onChange={(e) => setOpt(i, 'isBulk', e.target.checked)} /> Party / bulk size (extra notice)</label>
          {f.options.length > 1 && <button type="button" className="link-btn" onClick={() => setF((x) => ({ ...x, options: x.options.filter((_, j) => j !== i) }))}>Remove size</button>}
        </div>
      ))}
      <Button variant="ghost" className="btn--sm" onClick={() => setF((x) => ({ ...x, options: [...x.options, { label: '', serves: '', price: '', portions: 1, isBulk: false, active: true }] }))}>+ Add a size</Button>
    </Modal>
  );
}

export default function KitchenMenu() {
  const { data, error, loading, reload, setData } = useAsync(() => adminKitchenApi.menu(), []);
  const { data: pub } = useAsync(() => kitchenApi.menu(), []);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(null);
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const categories = pub?.categories || [];
  const replace = (m) => setData((d) => ({ meals: d.meals.some((x) => x.id === m.id) ? d.meals.map((x) => (x.id === m.id ? m : x)) : [...d.meals, m] }));

  return (
    <div className="k-scope">
      <Seo title="Kitchen menu" noindex />
      <header className="page-head page-head--row">
        <div><h1>Kitchen menu</h1><p className="muted">Prices, sizes, what can be left out — and real photos of your food.</p></div>
        <Button variant="accent" onClick={() => setEditing({})}>+ New dish</Button>
      </header>
      {err && <Alert tone="error">{err}</Alert>}
      <div className="stack">
        {categories.map((c) => {
          const meals = data.meals.filter((m) => m.category === c.key);
          if (!meals.length) return null;
          return (
            <section key={c.key} className="stack">
              <h2>{c.label}</h2>
              {meals.map((m) => (
                <div key={m.id} className={`k-admin-meal${m.active ? '' : ' is-off'}`}>
                  <DishImage meal={m} />
                  <div>
                    <strong>{m.name}</strong> {m.featured && <span className="k-pill k-pill--warn">Jojo’s pick</span>} {!m.active && <span className="k-pill">Hidden</span>}
                    <div className="muted small">{m.options.filter((o) => o.active).map((o) => `${o.label} ${naira(o.price)}`).join(' · ')}</div>
                  </div>
                  <div className="btn-row">
                    <label className="btn btn--ghost btn--sm">
                      {uploading === m.id ? 'Uploading…' : m.imageUrl ? 'Change photo' : 'Upload photo'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async (e) => {
                        const file = e.target.files?.[0]; e.target.value = '';
                        if (!file) return;
                        setUploading(m.id); setErr('');
                        try { replace((await adminKitchenApi.uploadPhoto(m.id, file)).meal); } catch (x) { setErr(x.message); } finally { setUploading(null); }
                      }} />
                    </label>
                    {m.imageUrl && <button type="button" className="link-btn" onClick={async () => { try { replace((await adminKitchenApi.removePhoto(m.id)).meal); } catch (x) { setErr(x.message); } }}>Use illustration</button>}
                    <Button variant="secondary" className="btn--sm" onClick={() => setEditing({ meal: m })}>Edit</Button>
                  </div>
                </div>
              ))}
            </section>
          );
        })}
      </div>
      {editing && <MealEditor meal={editing.meal} categories={categories} onClose={() => setEditing(null)} onSaved={(m) => { replace(m); setEditing(null); }} />}
    </div>
  );
}
