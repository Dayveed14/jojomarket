// Build a market list. How each item can be bought comes from the catalogue:
//   fixed  → "Basket · ₦20,000": choose a quantity, or just type an amount ("₦7,000 of tomatoes")
//   range  → "Bag (50kg) · Basmati · ₦95,000 – ₦140,000": quantity gives a range, or type an amount
//   none   → "Market price varies": type the amount you want to spend
// The figures here are a preview; the server re-prices everything from the catalogue.
import { useMemo, useState } from 'react';
import { MoneyInput } from './common';
import { nairaRange, priceText } from '../utils/format';

let keySeq = 0;
export const newKey = () => `l${Date.now().toString(36)}${(keySeq++).toString(36)}`;

/** Client-side preview of a line's estimate (mirrors the server rules). */
export function lineEstimate(line, item, bookingType) {
  if (bookingType === 'sample_run') return { min: 0, max: 0 };
  const opt = item?.options.find((o) => o.id === line.optionId);
  if (line.requestMethod === 'quantity' && opt && line.quantity > 0) {
    const q = Number(line.quantity);
    if (opt.price.type === 'fixed') return { min: q * opt.price.price, max: q * opt.price.price };
    if (opt.price.type === 'range') return { min: q * opt.price.min, max: q * opt.price.max };
  }
  const a = Number(line.amount) || 0;
  return { min: a, max: a };
}

export function defaultLineFor(item) {
  const priced = item.options.find((o) => o.isStandard && o.price.type !== 'none') || item.options.find((o) => o.price.type !== 'none');
  const opt = priced || item.options[0] || null;
  return {
    key: newKey(),
    catalogItemId: item.id,
    optionId: opt?.id ?? null,
    requestMethod: opt && opt.allowQuantity ? 'quantity' : 'amount',
    quantity: opt && opt.allowQuantity ? 1 : '',
    amount: '',
    preferences: '',
    allowSubstitution: false,
  };
}

function ItemPicker({ catalog, onAdd, existingIds }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return catalog.items.filter((i) => (cat === 'all' || i.categoryId === cat)
      && (!term || i.name.toLowerCase().includes(term) || (i.searchTerms || '').toLowerCase().includes(term)));
  }, [catalog.items, q, cat]);

  return (
    <div className="picker">
      <div className="picker__bar">
        <label htmlFor="picker-q" className="sr-only">Search items</label>
        <input id="picker-q" className="input" placeholder="Search: tomatoes, rodo, basmati, ankara…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="chip-row" role="group" aria-label="Categories">
        <button type="button" className={`chip-btn${cat === 'all' ? ' is-on' : ''}`} onClick={() => setCat('all')}>All</button>
        {catalog.categories.map((c) => (
          <button key={c.id} type="button" className={`chip-btn${cat === c.id ? ' is-on' : ''}`} onClick={() => setCat(c.id)}>
            <span aria-hidden="true">{c.icon}</span> {c.name}
          </button>
        ))}
      </div>
      <ul className="picker__grid">
        {results.map((i) => {
          const first = i.options.find((o) => o.isStandard) || i.options[0];
          const added = existingIds.has(i.id);
          return (
            <li key={i.id}>
              <button type="button" className={`picker__item${added ? ' is-added' : ''}`} onClick={() => onAdd(i)}>
                <span className="picker__name">{i.name}</span>
                <span className="picker__price">{first ? `${first.label} · ${priceText(first.price)}` : 'Market price varies'}</span>
                <span className="picker__add" aria-hidden="true">{added ? '✓ Added — add again' : '+ Add'}</span>
              </button>
            </li>
          );
        })}
        {!results.length && <li className="picker__none">No match. Use “Add something not listed” below.</li>}
      </ul>
    </div>
  );
}

function LineRow({ line, item, bookingType, onChange, onRemove, index, errors }) {
  const isSample = bookingType === 'sample_run';
  const opt = item?.options.find((o) => o.id === line.optionId) || null;
  const canQty = Boolean(opt?.allowQuantity);
  const canAmount = !item || !opt || opt.price.type === 'none' || item.allowOpenAmount;
  const est = lineEstimate(line, item, bookingType);
  const set = (patch) => onChange({ ...line, ...patch });
  const id = `line-${line.key}`;

  const pickOption = (value) => {
    const optionId = value === '' ? null : Number(value);
    const o = item.options.find((x) => x.id === optionId);
    set({ optionId, requestMethod: o?.allowQuantity ? line.requestMethod : 'amount', quantity: o?.allowQuantity ? line.quantity || 1 : '' });
  };

  return (
    <li className="line">
      <div className="line__head">
        <span className="line__num" aria-hidden="true">{index + 1}</span>
        <div className="line__title">
          {item ? <strong>{item.name}</strong> : (
            <input className="input input--sm" aria-label="Item name" placeholder="What should Jojo look for?" value={line.customName || ''} onChange={(e) => set({ customName: e.target.value })} />
          )}
          {item && <span className="muted small">{item.categoryName}</span>}
        </div>
        <button type="button" className="line__remove" onClick={onRemove} aria-label={`Remove ${item?.name || 'item'}`}>Remove</button>
      </div>

      <div className="line__grid">
        {item && item.options.length > 0 && (
          <div className="field">
            <label className="field__label" htmlFor={`${id}-opt`}>How it’s sold</label>
            <select id={`${id}-opt`} className="input" value={line.optionId ?? ''} onChange={(e) => pickOption(e.target.value)}>
              {item.options.map((o) => <option key={o.id} value={o.id}>{o.label} — {priceText(o.price)}</option>)}
              {item.allowOpenAmount && !item.options.some((o) => o.price.type === 'none') && <option value="">Just an amount (no fixed unit)</option>}
            </select>
          </div>
        )}

        {!isSample && canQty && canAmount && (
          <div className="field">
            <span className="field__label" id={`${id}-m`}>Buy by</span>
            <div className="seg" role="radiogroup" aria-labelledby={`${id}-m`}>
              <button type="button" role="radio" aria-checked={line.requestMethod === 'quantity'} className={line.requestMethod === 'quantity' ? 'is-on' : ''} onClick={() => set({ requestMethod: 'quantity', quantity: line.quantity || 1 })}>Quantity</button>
              <button type="button" role="radio" aria-checked={line.requestMethod === 'amount'} className={line.requestMethod === 'amount' ? 'is-on' : ''} onClick={() => set({ requestMethod: 'amount' })}>Amount (₦)</button>
            </div>
          </div>
        )}

        {line.requestMethod === 'quantity' && canQty ? (
          <div className="field">
            <label className="field__label" htmlFor={`${id}-q`}>{isSample ? 'Quantity (optional)' : `Quantity · ${opt?.unitLabel || 'units'}`}</label>
            <div className="stepper">
              <button type="button" aria-label="Less" onClick={() => set({ quantity: Math.max(0.5, Number(line.quantity || 1) - 1) })}>−</button>
              <input id={`${id}-q`} className="input" inputMode="decimal" value={line.quantity ?? ''} onChange={(e) => set({ quantity: e.target.value.replace(/[^\d.]/g, '') })} />
              <button type="button" aria-label="More" onClick={() => set({ quantity: Number(line.quantity || 0) + 1 })}>+</button>
            </div>
          </div>
        ) : (
          <div className="field">
            <label className="field__label" htmlFor={`${id}-a`}>{isSample ? 'Budget for this (optional)' : 'How much do you want to spend?'}</label>
            <MoneyInput id={`${id}-a`} value={line.amount} onChange={(v) => set({ amount: v })} placeholder={opt?.price.type === 'fixed' ? String(opt.price.price) : 'e.g. 7000'} />
            {!isSample && opt?.price.type === 'fixed' && (
              <p className="field__hint">You don’t need to buy a whole {opt.unitLabel.toLowerCase()} — Jojo buys what your amount gets on the day.</p>
            )}
          </div>
        )}

        {!isSample && (
          <div className="line__est" aria-live="polite">
            <span className="muted small">Estimate</span>
            <strong>{est.max ? nairaRange(est.min, est.max) : '—'}</strong>
          </div>
        )}
      </div>

      <div className="line__extra">
        <label className="sr-only" htmlFor={`${id}-p`}>Preferences</label>
        <input id={`${id}-p`} className="input input--sm" placeholder={isSample ? 'What should Jojo check? e.g. colours, brands, quality' : 'Preferences, e.g. ripe but firm, no small ones'} value={line.preferences || ''} onChange={(e) => set({ preferences: e.target.value })} maxLength={500} />
        {!isSample && (!item || item.allowSubstitutions) && (
          <label className="check check--sm">
            <input type="checkbox" checked={Boolean(line.allowSubstitution)} onChange={(e) => set({ allowSubstitution: e.target.checked })} />
            <span>Jojo may suggest a substitute (she’ll still ask you)</span>
          </label>
        )}
      </div>
      {errors && <p className="field__error" role="alert">{errors}</p>}
    </li>
  );
}

export default function ListEditor({ catalog, lines, onChange, bookingType = 'full_purchase', lineErrors = {} }) {
  const byId = useMemo(() => new Map(catalog.items.map((i) => [i.id, i])), [catalog.items]);
  const existingIds = useMemo(() => new Set(lines.map((l) => l.catalogItemId).filter(Boolean)), [lines]);
  const [showPicker, setShowPicker] = useState(lines.length === 0);

  const add = (item) => onChange([...lines, defaultLineFor(item)]);
  const addCustom = () => onChange([...lines, { key: newKey(), catalogItemId: null, optionId: null, customName: '', requestMethod: 'amount', amount: '', preferences: '', allowSubstitution: false }]);
  const update = (key, next) => onChange(lines.map((l) => (l.key === key ? next : l)));
  const remove = (key) => onChange(lines.filter((l) => l.key !== key));

  const totals = lines.reduce((acc, l) => {
    const e = lineEstimate(l, byId.get(l.catalogItemId), bookingType);
    return { min: acc.min + e.min, max: acc.max + e.max };
  }, { min: 0, max: 0 });

  return (
    <div className="list-editor">
      {lines.length > 0 && (
        <ol className="lines">
          {lines.map((l, i) => (
            <LineRow key={l.key} index={i} line={l} item={l.catalogItemId ? byId.get(l.catalogItemId) : null} bookingType={bookingType}
              onChange={(next) => update(l.key, next)} onRemove={() => remove(l.key)} errors={lineErrors[i]} />
          ))}
        </ol>
      )}

      <div className="list-editor__actions">
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => setShowPicker((s) => !s)} aria-expanded={showPicker}>
          {showPicker ? 'Hide item list' : '+ Add from the market list'}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={addCustom}>+ Add something not listed</button>
      </div>
      {showPicker && <ItemPicker catalog={catalog} onAdd={add} existingIds={existingIds} />}

      {bookingType !== 'sample_run' && lines.length > 0 && (
        <div className="list-total" aria-live="polite">
          <span>Goods estimate · {lines.length} {lines.length === 1 ? 'item' : 'items'}</span>
          <strong>{nairaRange(totals.min, totals.max)}</strong>
        </div>
      )}
    </div>
  );
}

/** Convert editor lines to the API's shape. */
export const toApiLines = (lines) => lines.map((l) => ({
  catalogItemId: l.catalogItemId || null,
  optionId: l.optionId || null,
  customName: l.catalogItemId ? null : (l.customName || '').trim() || null,
  requestMethod: l.requestMethod,
  quantity: l.requestMethod === 'quantity' && l.quantity !== '' ? Number(l.quantity) : null,
  amount: l.requestMethod === 'amount' && l.amount !== '' ? Number(l.amount) : null,
  preferences: l.preferences?.trim() || null,
  allowSubstitution: Boolean(l.allowSubstitution),
}));

/** Convert API items (saved list / repeat) back to editor lines. */
export const fromApiLines = (items) => items.map((i) => ({
  key: newKey(),
  catalogItemId: i.catalogItemId,
  optionId: i.optionId,
  customName: i.customName || (i.catalogItemId ? null : i.itemName),
  requestMethod: i.requestMethod,
  quantity: i.quantity ?? '',
  amount: i.amount ?? '',
  preferences: i.preferences || '',
  allowSubstitution: Boolean(i.allowSubstitution),
}));

