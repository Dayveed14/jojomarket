// Order builder: 1) food & quantity  2) delivery date  3) address & review.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AddressForm from '../../../components/AddressForm';
import { Modal, useAsync } from '../../../components/common';
import { DishArt, DishImage } from '../../../components/kitchen/DishArt';
import Seo from '../../../components/Seo';
import { Alert, Button, Spinner } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { kitchenApi, meApi } from '../../../services/api';
import { naira, plural } from '../../../utils/format';
import { SPICE, datetimeLocalToLagosIso, fmtClock, toMinutes } from '../../../utils/kitchen';
import { DishCard } from '../../public/Kitchen';

const STEPS = ['Food & quantity', 'Delivery day', 'Address & review'];
let lineSeq = 0;

function DishModal({ meal, line, onClose, onSave }) {
  const [optionId, setOptionId] = useState(line?.option.id || meal?.options[0]?.id);
  const [quantity, setQuantity] = useState(line?.quantity || 1);
  const [exclusions, setExclusions] = useState(line?.exclusions || []);
  const [spice, setSpice] = useState(line?.spiceLevel || (meal?.spiceLevels ? 'medium' : null));
  const [instructions, setInstructions] = useState(line?.instructions || '');
  if (!meal) return null;
  const option = meal.options.find((o) => o.id === optionId) || meal.options[0];
  const toggle = (k) => setExclusions((x) => (x.includes(k) ? x.filter((y) => y !== k) : [...x, k]));
  return (
    <Modal open onClose={onClose} title={meal.name} wide footer={(
      <>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="accent" onClick={() => onSave({ key: line?.key || `l${++lineSeq}`, meal, option, quantity, exclusions, spiceLevel: spice, instructions: instructions.trim() })}>
          {line ? 'Update' : 'Add to order'} · {naira(option.price * quantity)}
        </Button>
      </>
    )}>
      <div className="k-dish-modal k-scope">
        <div className={`k-dish-modal__art k-bg--${meal.category}`}><DishImage meal={meal} steam /></div>
        <div className="stack">
          {meal.description && <p className="muted" style={{ margin: 0 }}>{meal.description}</p>}
          {meal.contains && <p className="small" style={{ margin: 0 }}><strong>Contains:</strong> {meal.contains}</p>}
          <fieldset className="fieldset-plain">
            <legend className="field__label">Size</legend>
            <div className="k-sizes">
              {meal.options.map((o) => (
                <label key={o.id} className="k-size">
                  <span className="k-size__label">
                    <input type="radio" name="size" checked={o.id === option.id} onChange={() => setOptionId(o.id)} />
                    <span>{o.label}{o.serves && <small>{o.serves}{o.isBulk ? ' · party size' : ''}</small>}</span>
                  </span>
                  <strong>{naira(o.price)}</strong>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <span className="field__label">Quantity</span>
            <div className="k-qty k-qty--lg">
              <button type="button" aria-label="Fewer" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <input aria-label="Quantity" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(Math.min(200, Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1)))} />
              <button type="button" aria-label="More" onClick={() => setQuantity((q) => Math.min(200, q + 1))}>+</button>
            </div>
          </div>
          {meal.exclusions.length > 0 && (
            <fieldset className="fieldset-plain">
              <legend className="field__label">Make it your way — leave out</legend>
              <div className="k-excl">
                {meal.exclusions.map((e) => (
                  <label key={e.key}><input type="checkbox" checked={exclusions.includes(e.key)} onChange={() => toggle(e.key)} />{e.label}</label>
                ))}
              </div>
            </fieldset>
          )}
          {meal.spiceLevels && (
            <fieldset className="fieldset-plain">
              <legend className="field__label">Pepper level</legend>
              <div className="k-spice">
                {Object.entries(SPICE).map(([k, l]) => <label key={k}><input type="radio" name="spice" checked={spice === k} onChange={() => setSpice(k)} />{l}</label>)}
              </div>
            </fieldset>
          )}
          <label className="field">
            <span className="field__label">Anything else for this dish? <span className="muted">(optional)</span></span>
            <textarea className="input" rows={2} maxLength={500} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. extra dodo on the side, goat meat instead of beef" />
          </label>
        </div>
      </div>
    </Modal>
  );
}

function Tray({ lines, setLines, quote, onEdit, children }) {
  const count = lines.reduce((a, l) => a + l.quantity, 0);
  return (
    <aside className="k-tray k-scope" aria-label="Your order">
      <h2>🍽️ Your order {count > 0 && <span className="badge">{count}</span>}</h2>
      {!lines.length && (
        <div className="k-tray__empty"><DishArt dish="jollof" /><p>Nothing here yet — tap a dish to add it.</p></div>
      )}
      {lines.map((l) => (
        <div key={l.key} className="k-line">
          <DishImage meal={l.meal} />
          <div>
            <button type="button" className="link-btn k-line__name" onClick={() => onEdit?.(l)}>{l.meal.name}</button>
            <div className="k-line__meta">{l.option.label}{l.spiceLevel ? ` · ${SPICE[l.spiceLevel]}` : ''}</div>
            {l.exclusions.length > 0 && <div className="k-line__meta">{l.exclusions.map((k) => l.meal.exclusions.find((e) => e.key === k)?.label).join(', ')}</div>}
          </div>
          <div className="k-line__x">
            <strong>{naira(l.option.price * l.quantity)}</strong>
            {setLines ? (
              <div className="k-qty">
                <button type="button" aria-label={`Fewer ${l.meal.name}`} onClick={() => setLines((ls) => ls.flatMap((x) => (x.key !== l.key ? [x] : x.quantity > 1 ? [{ ...x, quantity: x.quantity - 1 }] : [])))}>{l.quantity > 1 ? '−' : '×'}</button>
                <span>{l.quantity}</span>
                <button type="button" aria-label={`More ${l.meal.name}`} onClick={() => setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, quantity: Math.min(200, x.quantity + 1) } : x)))}>+</button>
              </div>
            ) : <span className="muted small">× {l.quantity}</span>}
          </div>
        </div>
      ))}
      {lines.length > 0 && (
        <div className="k-totals">
          <div><span>Food</span><strong>{naira(lines.reduce((a, l) => a + l.option.price * l.quantity, 0))}</strong></div>
          {quote?.deliveryFee != null && <div><span>Delivery</span><span>{naira(quote.deliveryFee)}</span></div>}
          {quote?.isBulk && <div className="muted small"><span>🎉 Bulk order — needs an extra day</span></div>}
        </div>
      )}
      {children}
    </aside>
  );
}

export default function KitchenNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: menu, loading } = useAsync(() => kitchenApi.menu(), []);
  const { data: addrData, setData: setAddrData } = useAsync(() => meApi.addresses(), []);
  const addresses = addrData?.items || [];

  const [step, setStep] = useState(0);
  const [cat, setCat] = useState('all');
  const [lines, setLines] = useState([]);
  const [editing, setEditing] = useState(null); // { meal, line? }
  const [mode, setMode] = useState(params.get('express') ? 'express' : 'regular');
  const [date, setDate] = useState('');
  const [windowKey, setWindowKey] = useState('');
  const [expressAt, setExpressAt] = useState('');
  const [addressId, setAddressId] = useState('');
  const [notes, setNotes] = useState('');
  const [allergy, setAllergy] = useState('');
  const [accept, setAccept] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [addrOpen, setAddrOpen] = useState(false);
  const opened = useRef(false);

  // open the dish from the public page link (?dish=party-jollof)
  useEffect(() => {
    if (!menu || opened.current) return;
    opened.current = true;
    const m = menu.meals.find((x) => x.slug === params.get('dish'));
    if (m) setEditing({ meal: m });
  }, [menu, params]);
  useEffect(() => {
    if (!addressId && addresses.length) setAddressId(String((addresses.find((a) => a.isDefault) || addresses[0]).id));
  }, [addresses, addressId]);

  const apiItems = useMemo(() => lines.map((l) => ({ mealId: l.meal.id, optionId: l.option.id, quantity: l.quantity, exclusions: l.exclusions, spiceLevel: l.spiceLevel || null, instructions: l.instructions || undefined })), [lines]);

  // live price + calendar from the server
  useEffect(() => {
    if (!apiItems.length) { setQuote(null); return undefined; }
    const t = setTimeout(() => {
      kitchenApi.quote({ items: apiItems, addressId: addressId ? Number(addressId) : undefined })
        .then((q) => { setQuote(q); setQuoteError(''); })
        .catch((e) => setQuoteError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [apiItems, addressId]);

  // drop a chosen date/window that is no longer available (e.g. order grew into bulk)
  const day = quote?.days.find((d) => d.date === date);
  useEffect(() => {
    if (date && quote && !day?.available) { setDate(''); setWindowKey(''); }
    else if (day && windowKey && !day.windows.some((w) => w.key === windowKey)) setWindowKey('');
  }, [quote, date, day, windowKey]);

  if (loading) return <Spinner label="Loading the menu" />;
  if (!menu?.enabled) return <Alert tone="info" title="Jojo’s Kitchen is resting">The kitchen isn’t taking orders right now. Please check back soon.</Alert>;
  const rules = menu.rules;
  const meals = cat === 'all' ? menu.meals : menu.meals.filter((m) => m.category === cat);
  const usedCats = menu.categories.filter((c) => menu.meals.some((m) => m.category === c.key));

  const saveLine = (l) => {
    setLines((ls) => (ls.some((x) => x.key === l.key) ? ls.map((x) => (x.key === l.key ? l : x)) : [...ls, l]));
    setEditing(null);
  };

  // datetime-local "min" in Lagos wall-clock time (UTC+1): now + notice + 15 minutes
  const minExpress = new Date(Date.now() + rules.expressMinHoursAhead * 3_600_000 + 15 * 60_000 + 3_600_000).toISOString().slice(0, 16);
  const expressErr = (() => {
    if (!expressAt) return null;
    const mins = toMinutes(expressAt.slice(11, 16));
    if (mins < toMinutes(rules.expressEarliestTime) || mins > toMinutes(rules.expressLatestTime)) return `Express deliveries are between ${fmtClock(toMinutes(rules.expressEarliestTime))} and ${fmtClock(toMinutes(rules.expressLatestTime))}.`;
    if (new Date(datetimeLocalToLagosIso(expressAt)).getTime() < Date.now() + rules.expressMinHoursAhead * 3_600_000) return `Please choose a time at least ${rules.expressMinHoursAhead} hours from now.`;
    return null;
  })();
  const deliveryOk = mode === 'regular' ? Boolean(date && windowKey) : Boolean(expressAt && !expressErr);
  const deliverySummary = mode === 'regular'
    ? (date && windowKey ? `${new Date(`${date}T12:00:00Z`).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })} · ${rules.deliveryWindows.find((w) => w.key === windowKey)?.label}` : '')
    : (expressAt ? `${new Date(datetimeLocalToLagosIso(expressAt)).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })} (Express)` : '');

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const body = {
        orderType: mode, items: apiItems, addressId: Number(addressId), acceptTerms: true,
        customerNotes: notes.trim() || undefined, allergyNotes: allergy.trim() || undefined,
        ...(mode === 'regular' ? { deliveryDate: date, deliveryWindow: windowKey } : { requestedDeliveryAt: datetimeLocalToLagosIso(expressAt) }),
      };
      const r = await kitchenApi.create(body);
      navigate(`/app/kitchen/orders/${r.reference}`, { state: { placed: mode } });
    } catch (e) {
      setError(e.message);
      if (e.status === 409 && mode === 'regular') { setStep(1); setDate(''); setWindowKey(''); }
    } finally { setBusy(false); }
  };

  const foodTotal = lines.reduce((a, l) => a + l.option.price * l.quantity, 0);
  const estTotal = quote?.deliveryFee != null ? foodTotal + quote.deliveryFee + (mode === 'express' ? quote.expressFeeEstimate : 0) : null;

  return (
    <div className="k-scope">
      <Seo title="Order from Jojo’s Kitchen" noindex />
      <nav className="crumbs"><Link to="/app/kitchen">Jojo’s Kitchen</Link> <span aria-hidden="true">›</span> New order</nav>
      <ol className="k-steps" aria-label="Steps">
        {STEPS.map((s, i) => <li key={s} className={i === step ? 'is-current' : i < step ? 'is-done' : ''}><b>{i < step ? '✓' : i + 1}</b>{s}</li>)}
      </ol>
      {error && <Alert tone="error">{error}</Alert>}
      {quoteError && <Alert tone="error">{quoteError}</Alert>}

      <div className="k-builder">
        <div className="stack">
          {step === 0 && (
            <section>
              <header className="page-head"><h1>What would you like?</h1><p className="muted">Tap a dish to choose the size, quantity and how Jojo should make it.</p></header>
              <div className="k-cats" style={{ justifyContent: 'flex-start' }}>
                <button className={cat === 'all' ? 'is-on' : ''} onClick={() => setCat('all')}>Everything</button>
                {usedCats.map((c) => <button key={c.key} className={cat === c.key ? 'is-on' : ''} onClick={() => setCat(c.key)}>{c.label}</button>)}
              </div>
              <div className="k-grid">
                {meals.map((m) => <DishCard key={m.id} meal={m} compact onAdd={(meal) => setEditing({ meal })} />)}
              </div>
            </section>
          )}

          {step === 1 && quote && (
            <section className="card">
              <h1 className="card__h">When should it arrive?</h1>
              <div className="k-mode" role="radiogroup">
                <label><input type="radio" name="mode" checked={mode === 'regular'} onChange={() => setMode('regular')} /><strong>📅 Regular delivery</strong><small>Pick an open day and a delivery window. Pay now to confirm.</small></label>
                {rules.expressEnabled && (
                  <label><input type="radio" name="mode" checked={mode === 'express'} onChange={() => setMode('express')} /><strong>⚡ Express</strong><small>Choose the exact time. Jojo confirms first · +{rules.expressSurchargePercent}% (min {naira(rules.expressMinFee)})</small></label>
                )}
              </div>
              {mode === 'regular' ? (
                <>
                  <p className="k-lead"><span aria-hidden="true">⏰</span><span>{quote.earliest.label}</span></p>
                  <div className="k-days">
                    {quote.days.map((d) => {
                      const dt = new Date(`${d.date}T12:00:00Z`);
                      return (
                        <button key={d.date} type="button" disabled={!d.available} className={`k-day${d.date === date ? ' is-on' : ''}`} onClick={() => { setDate(d.date); setWindowKey(d.windows.length === 1 ? d.windows[0].key : ''); }}
                          aria-label={`${dt.toDateString()}${d.available ? '' : ` — ${d.reason}`}`}>
                          <small>{dt.toLocaleDateString('en-NG', { weekday: 'short', timeZone: 'UTC' })}</small>
                          <strong>{dt.getUTCDate()}</strong>
                          <small className={d.available ? '' : 'k-day__why'}>{d.available ? dt.toLocaleDateString('en-NG', { month: 'short', timeZone: 'UTC' }) : d.reason === 'full' ? 'Fully booked' : d.reason === 'closed' ? 'Closed' : 'Too soon'}</small>
                        </button>
                      );
                    })}
                  </div>
                  {!quote.days.some((d) => d.available) && <Alert tone="info">Every day in the next few weeks is fully booked for an order this size. Try fewer portions, or request Express.</Alert>}
                  {day?.available && (
                    <>
                      <p className="field__label" style={{ marginTop: 16 }}>Delivery window</p>
                      <div className="k-windows">
                        {day.windows.map((w) => <button key={w.key} type="button" className={`k-window${w.key === windowKey ? ' is-on' : ''}`} onClick={() => setWindowKey(w.key)}>{w.label}</button>)}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="k-lead"><span aria-hidden="true">⚡</span><span>Tell us exactly when you want it. We’ll get across to Jojo — once she approves, you’ll get an email to pay. Nothing is charged before then.</span></p>
                  <label className="field">
                    <span className="field__label">Delivery date &amp; time (Lagos time)</span>
                    <input className="input" type="datetime-local" value={expressAt} min={minExpress} step={900} onChange={(e) => setExpressAt(e.target.value)} />
                    <span className="field__hint">At least {rules.expressMinHoursAhead} hours from now, between {fmtClock(toMinutes(rules.expressEarliestTime))} and {fmtClock(toMinutes(rules.expressLatestTime))}.</span>
                  </label>
                  {expressErr && <Alert tone="error">{expressErr}</Alert>}
                  <p className="muted small">Estimated express charge: <strong>{naira(quote.expressFeeEstimate)}</strong>. Jojo confirms the final amount when she approves.</p>
                </>
              )}
            </section>
          )}

          {step === 2 && (
            <section className="card stack">
              <h1 className="card__h">Where should Jojo deliver?</h1>
              {addresses.length ? (
                <label className="field">
                  <span className="field__label">Delivery address</span>
                  <select className="input" value={addressId} onChange={(e) => setAddressId(e.target.value)}>
                    {addresses.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.addressLine}, {a.area}</option>)}
                  </select>
                </label>
              ) : <Alert tone="info">Add an address so we can work out delivery.</Alert>}
              <div><Button variant="ghost" className="btn--sm" onClick={() => setAddrOpen(true)}>+ Add a new address</Button></div>
              <label className="field">
                <span className="field__label">Allergies <span className="muted">(important — optional)</span></span>
                <input className="input" maxLength={500} value={allergy} onChange={(e) => setAllergy(e.target.value)} placeholder="e.g. groundnut allergy, no shellfish at all" />
              </label>
              <label className="field">
                <span className="field__label">Note for Jojo <span className="muted">(optional)</span></span>
                <textarea className="input" rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate code, who will receive it, an occasion…" />
              </label>
              <div className="k-lead"><span aria-hidden="true">🛵</span><span><strong>{deliverySummary}</strong><br /><span className="muted small">Delivery only — no pick-up.</span></span></div>
              <label className="check">
                <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
                <span>{mode === 'express'
                  ? 'I understand this is a request — Jojo confirms the time and final express charge before I pay.'
                  : 'The dishes, quantities and delivery time are correct. I’ll pay now to confirm my slot.'}</span>
              </label>
            </section>
          )}
        </div>

        <Tray lines={lines} setLines={step === 0 ? setLines : null} quote={quote} onEdit={(l) => setEditing({ meal: l.meal, line: l })}>
          {step === 2 && estTotal != null && (
            <div className="k-totals" style={{ borderTop: 0, paddingTop: 0 }}>
              {mode === 'express' && <div><span>Express (estimate)</span><span>{naira(quote.expressFeeEstimate)}</span></div>}
              <div className="is-total"><span>{mode === 'express' ? 'Estimated total' : 'Total'}</span><strong>{naira(estTotal)}</strong></div>
            </div>
          )}
          <div className="stack" style={{ marginTop: 14 }}>
            {step === 0 && <Button variant="accent" className="btn--block" disabled={!lines.length || !quote} onClick={() => setStep(1)}>Next: delivery day →</Button>}
            {step === 1 && <Button variant="accent" className="btn--block" disabled={!deliveryOk} onClick={() => setStep(2)}>Next: address & review →</Button>}
            {step === 2 && (
              <Button variant="accent" className="btn--block" loading={busy} disabled={!accept || !addressId} onClick={submit}>
                {mode === 'express' ? 'Send express request to Jojo' : `Place order · ${estTotal != null ? naira(estTotal) : ''}`}
              </Button>
            )}
            {step > 0 && <Button variant="ghost" className="btn--block" onClick={() => setStep(step - 1)}>← Back</Button>}
            {lines.length > 0 && step === 0 && <p className="muted small center">{plural(lines.length, 'dish', 'dishes')} · tap a dish name to change it</p>}
          </div>
        </Tray>
      </div>

      {editing && <DishModal key={editing.line?.key || editing.meal.id} meal={editing.meal} line={editing.line} onClose={() => setEditing(null)} onSave={saveLine} />}
      <Modal open={addrOpen} onClose={() => setAddrOpen(false)} title="Add a delivery address" wide>
        <AddressForm defaultName={user.displayName} defaultPhone={user.phone} onCancel={() => setAddrOpen(false)}
          onSaved={(a) => { setAddrData((d) => ({ items: [...(d?.items || []), a] })); setAddressId(String(a.id)); setAddrOpen(false); }} />
      </Modal>
    </div>
  );
}
