// Booking wizard: type → market → list → date → delivery → review & submit.
// The draft is kept in this browser so nothing is lost if the customer navigates away.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AddressForm from '../../components/AddressForm';
import { KeyValue, Modal, MoneyInput } from '../../components/common';
import ListEditor, { fromApiLines, toApiLines } from '../../components/ListEditor';
import Seo from '../../components/Seo';
import { Alert, Button, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { ApiError, bookingApi, meApi, publicApi } from '../../services/api';
import { BOOKING_TYPES, TIME_WINDOWS, fmtDay, naira, nairaRange, safeStorage } from '../../utils/format';

const DRAFT_KEY = 'jojo:booking-draft';
const STEPS = ['Type', 'Market', 'List', 'Date', 'Delivery', 'Review'];
const EMPTY = { bookingType: null, marketId: null, lines: [], serviceDate: null, timeWindow: 'morning', addressId: null, deliveryRequired: false, intendedGoodsBudget: '', authorizedGoodsLimit: '', customerNotes: '', sourceReference: null };

function StepNav({ step, maxStep, onGo }) {
  return (
    <ol className="wizard-steps" aria-label="Booking steps">
      {STEPS.map((s, i) => (
        <li key={s} className={i === step ? 'is-current' : i < step ? 'is-done' : ''}>
          <button type="button" disabled={i > maxStep} onClick={() => onGo(i)} aria-current={i === step ? 'step' : undefined}>
            <span className="wizard-steps__n">{i < step ? '✓' : i + 1}</span><span className="wizard-steps__l">{s}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export default function NewBooking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [draft, setDraft] = useState(() => ({ ...EMPTY, ...(safeStorage.get(DRAFT_KEY) || {}) }));
  const [step, setStep] = useState(0);
  const [markets, setMarkets] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [days, setDays] = useState(null);
  const [addresses, setAddresses] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [addrOpen, setAddrOpen] = useState(false);
  const [accept, setAccept] = useState(false);
  const [prefillNote, setPrefillNote] = useState('');

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const isSample = draft.bookingType === 'sample_run';

  // Persist draft
  useEffect(() => { safeStorage.set(DRAFT_KEY, draft); }, [draft]);

  // Prefill from ?type, ?list=<id>, ?repeat=<ref>
  useEffect(() => {
    const type = params.get('type');
    const listId = params.get('list');
    const repeat = params.get('repeat');
    if (listId) {
      meApi.list(listId).then(({ list }) => {
        setDraft({ ...EMPTY, bookingType: 'full_purchase', marketId: list.marketId, lines: fromApiLines(list.items.filter((i) => i.available)) });
        setPrefillNote(`Started from your list “${list.name}”. Prices are today’s — please check quantities.`);
        setStep(list.marketId ? 2 : 1);
      }).catch(() => setError('That saved list could not be loaded.'));
    } else if (repeat) {
      bookingApi.repeat(repeat).then((r) => {
        setDraft({ ...EMPTY, bookingType: r.bookingType, marketId: r.marketId, lines: fromApiLines(r.items), sourceReference: r.sourceReference });
        setPrefillNote(r.sourceReference ? `Turning sample run ${r.sourceReference} into a full shop. Review the list and amounts.` : `Copied from booking ${repeat}. Prices are today’s, not the old ones.`);
        setStep(2);
      }).catch(() => setError('That booking could not be copied.'));
    } else if (type && ['full_purchase', 'sample_run'].includes(type)) {
      setDraft((d) => (d.bookingType === type ? d : { ...EMPTY, bookingType: type }));
      setStep(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { publicApi.markets().then((r) => setMarkets(r.items)).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    if (!draft.marketId) return;
    setCatalog(null);
    publicApi.catalog(draft.marketId).then(setCatalog).catch((e) => setError(e.message));
  }, [draft.marketId]);
  useEffect(() => {
    if (!draft.marketId || !draft.bookingType) return;
    setDays(null);
    publicApi.availability(draft.bookingType, draft.marketId).then((r) => setDays(r.days)).catch((e) => setError(e.message));
  }, [draft.marketId, draft.bookingType]);
  useEffect(() => {
    meApi.addresses().then((r) => {
      setAddresses(r.items);
      setDraft((d) => (d.addressId && r.items.some((a) => a.id === d.addressId) ? d : { ...d, addressId: r.items.find((a) => a.isDefault)?.id || null }));
    }).catch(() => setAddresses([]));
  }, []);

  const market = markets?.find((m) => m.id === draft.marketId);
  const address = addresses?.find((a) => a.id === draft.addressId);
  const maxStep = !draft.bookingType ? 0 : !draft.marketId ? 1 : !draft.lines.length ? 2 : !draft.serviceDate ? 3 : 5;

  const apiBody = useMemo(() => ({
    bookingType: draft.bookingType,
    marketId: draft.marketId,
    items: toApiLines(draft.lines),
    addressId: (!isSample || draft.deliveryRequired) ? draft.addressId : null,
    deliveryRequired: isSample ? draft.deliveryRequired : true,
    intendedGoodsBudget: draft.intendedGoodsBudget === '' ? null : Number(draft.intendedGoodsBudget),
    authorizedGoodsLimit: draft.authorizedGoodsLimit === '' ? null : Number(draft.authorizedGoodsLimit),
  }), [draft, isSample]);

  // Validate the list with the server before moving on (it owns the pricing rules)
  const checkList = async () => {
    setError(''); setFieldErrors({});
    setBusy(true);
    try {
      await bookingApi.estimate({ ...apiBody, addressId: null, intendedGoodsBudget: null, authorizedGoodsLimit: null });
      setStep(3);
    } catch (e) {
      setError(e.message);
      const m = /^Item (\d+):/.exec(e.message);
      if (m) setFieldErrors({ [Number(m[1]) - 1]: e.message.replace(/^Item \d+: /, '') });
    } finally { setBusy(false); }
  };

  const loadEstimate = async () => {
    setError('');
    setBusy(true);
    try {
      const est = await bookingApi.estimate(apiBody);
      setEstimate(est);
      setDraft((d) => ({
        ...d,
        intendedGoodsBudget: d.intendedGoodsBudget === '' && !isSample ? est.goodsMax : d.intendedGoodsBudget,
        authorizedGoodsLimit: d.authorizedGoodsLimit === '' && !isSample ? est.suggestedLimit : d.authorizedGoodsLimit,
      }));
      setStep(5);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const submit = async () => {
    setError(''); setFieldErrors({});
    setBusy(true);
    try {
      const { reference } = await bookingApi.create({
        ...apiBody, serviceDate: draft.serviceDate, timeWindow: draft.timeWindow, customerNotes: draft.customerNotes || null,
        sourceReference: draft.sourceReference, acceptPolicies: accept,
      });
      safeStorage.remove(DRAFT_KEY);
      navigate(`/app/bookings/${reference}`, { replace: true, state: { submitted: true } });
    } catch (e) {
      setError(e.message);
      if (e instanceof ApiError) setFieldErrors(e.fields || {});
      if (e.status === 409) { // date taken meanwhile
        publicApi.availability(draft.bookingType, draft.marketId).then((r) => setDays(r.days));
      }
    } finally { setBusy(false); }
  };

  const reset = () => { safeStorage.remove(DRAFT_KEY); setDraft(EMPTY); setEstimate(null); setStep(0); setPrefillNote(''); };

  // Budget/limit live checks
  const budget = Number(draft.intendedGoodsBudget) || 0;
  const limit = Number(draft.authorizedGoodsLimit) || 0;
  const limitWarn = !isSample && estimate && limit && limit < estimate.goodsMax
    ? `Your limit is below the top of the estimate (${naira(estimate.goodsMax)}). If prices are high on the day, Jojo will pause and ask before spending more.` : '';
  const limitErr = !isSample && limit && budget && limit < budget ? 'Your limit must be at least your budget.' : '';

  return (
    <>
      <Seo title="New booking" noindex />
      <header className="page-head page-head--row">
        <div>
          <h1>Book a market run</h1>
          <p className="muted">Nothing is charged until Jojo reviews your request and you accept her quote.</p>
        </div>
        {(draft.bookingType || draft.lines.length > 0) && <button className="btn btn--ghost btn--sm" onClick={reset}>Start over</button>}
      </header>

      <StepNav step={step} maxStep={maxStep} onGo={setStep} />
      {prefillNote && <Alert tone="info">{prefillNote}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <section className="card wizard-card">
        {/* 1. TYPE */}
        {step === 0 && (
          <>
            <h2 className="wizard-card__title">What do you need?</h2>
            <div className="choice-grid">
              {[
                ['full_purchase', '🧺', 'Full shopping', 'Send your list. Jojo buys everything within your spending limit and delivers to you.'],
                ['sample_run', '🔍', 'Sample run', 'Not sure yet? Jojo checks prices, quality and colours and sends you photos and notes first.'],
              ].map(([v, icon, title, body]) => (
                <button key={v} type="button" className={`choice${draft.bookingType === v ? ' is-on' : ''}`} onClick={() => { set({ bookingType: v, serviceDate: null }); setEstimate(null); setStep(1); }}>
                  <span className="choice__icon" aria-hidden="true">{icon}</span>
                  <strong>{title}</strong>
                  <span>{body}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* 2. MARKET */}
        {step === 1 && (
          <>
            <h2 className="wizard-card__title">Which market should Jojo go to?</h2>
            {!markets ? <Spinner /> : (
              <div className="market-grid">
                {markets.map((m) => (
                  <button key={m.id} type="button" className={`market-card${draft.marketId === m.id ? ' is-on' : ''}`}
                    onClick={() => {
                      const filtered = draft.marketId && draft.marketId !== m.id ? [] : draft.lines;
                      set({ marketId: m.id, lines: filtered, serviceDate: null }); setEstimate(null); setStep(2);
                    }}>
                    <strong>{m.name}</strong>
                    <span className="muted small">{m.area} · {m.openDaysLabel} · {m.hours}</span>
                    <span className="market-card__desc">{m.description}</span>
                    <span className="market-card__cats">{m.categories.map((c) => <span key={c.id} title={c.name}>{c.icon}</span>)}</span>
                  </button>
                ))}
              </div>
            )}
            {draft.marketId && draft.lines.length > 0 && <p className="muted small">Changing market clears your list, because each market sells different things.</p>}
          </>
        )}

        {/* 3. LIST */}
        {step === 2 && (
          <>
            <h2 className="wizard-card__title">{isSample ? 'What should Jojo look at for you?' : 'Your shopping list'} <span className="muted">· {market?.name}</span></h2>
            {!isSample && (
              <p className="muted">
                For each item, choose a quantity of the usual unit (like <strong>2 baskets of tomatoes</strong>) or just the
                amount you want to spend (like <strong>₦7,000 of tomatoes</strong>). Items without a fixed price are bought by amount.
              </p>
            )}
            {!catalog ? <Spinner /> : (
              <ListEditor catalog={catalog} lines={draft.lines} onChange={(lines) => { set({ lines }); setEstimate(null); }} bookingType={draft.bookingType} lineErrors={fieldErrors} />
            )}
            <div className="wizard-nav">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={checkList} loading={busy} disabled={!draft.lines.length}>Continue</Button>
            </div>
          </>
        )}

        {/* 4. DATE */}
        {step === 3 && (
          <>
            <h2 className="wizard-card__title">When should Jojo go?</h2>
            <p className="muted">Only days Jojo can take and {market?.name} is open are shown as available.</p>
            {!days ? <Spinner /> : (
              <div className="date-grid" role="radiogroup" aria-label="Available dates">
                {days.map((d) => (
                  <button key={d.date} type="button" role="radio" aria-checked={draft.serviceDate === d.date} disabled={!d.available}
                    className={`date-chip${draft.serviceDate === d.date ? ' is-on' : ''}`} onClick={() => set({ serviceDate: d.date })}
                    title={d.available ? 'Available' : { full: 'Fully booked', closed: 'Jojo is not working', market_closed: 'Market closed', unavailable: 'Unavailable' }[d.reason]}>
                    <span className="date-chip__d">{fmtDay(d.date).split(',')[0]}</span>
                    <strong>{new Date(`${d.date}T12:00:00Z`).getUTCDate()}</strong>
                    <span className="date-chip__m">{new Date(`${d.date}T12:00:00Z`).toLocaleString('en-NG', { month: 'short', timeZone: 'UTC' })}</span>
                    {!d.available && <span className="date-chip__x">{d.reason === 'full' ? 'Full' : 'Closed'}</span>}
                  </button>
                ))}
              </div>
            )}
            <fieldset className="toggles" style={{ marginTop: 20 }}>
              <legend>Preferred time</legend>
              <div className="seg seg--wide">
                {Object.entries(TIME_WINDOWS).map(([v, l]) => (
                  <button key={v} type="button" className={draft.timeWindow === v ? 'is-on' : ''} aria-pressed={draft.timeWindow === v} onClick={() => set({ timeWindow: v })}>{l}</button>
                ))}
              </div>
            </fieldset>
            <div className="wizard-nav">
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)} disabled={!draft.serviceDate}>Continue</Button>
            </div>
          </>
        )}

        {/* 5. DELIVERY */}
        {step === 4 && (
          <>
            <h2 className="wizard-card__title">{isSample ? 'Do you want the samples delivered?' : 'Where should Jojo deliver?'}</h2>
            {isSample && (
              <div className="seg seg--wide" style={{ marginBottom: 16 }}>
                <button type="button" className={!draft.deliveryRequired ? 'is-on' : ''} onClick={() => set({ deliveryRequired: false })}>No — photos &amp; notes are enough</button>
                <button type="button" className={draft.deliveryRequired ? 'is-on' : ''} onClick={() => set({ deliveryRequired: true })}>Yes, bring samples to me</button>
              </div>
            )}
            {(!isSample || draft.deliveryRequired) && (
              !addresses ? <Spinner /> : (
                <>
                  <div className="address-pick">
                    {addresses.map((a) => (
                      <label key={a.id} className={`address-opt${draft.addressId === a.id ? ' is-on' : ''}`}>
                        <input type="radio" name="addr" checked={draft.addressId === a.id} onChange={() => set({ addressId: a.id })} />
                        <span><strong>{a.label}</strong> · {a.areaName}<br /><span className="muted small">{a.addressLine}{a.landmark ? ` · ${a.landmark}` : ''}</span></span>
                      </label>
                    ))}
                  </div>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => setAddrOpen(true)}>+ Add an address</button>
                  {fieldErrors.addressId && <p className="field__error">{fieldErrors.addressId}</p>}
                </>
              )
            )}
            <div className="wizard-nav">
              <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={loadEstimate} loading={busy} disabled={(!isSample || draft.deliveryRequired) && !draft.addressId}>See estimate</Button>
            </div>
          </>
        )}

        {/* 6. REVIEW */}
        {step === 5 && (
          !estimate ? (
            <div className="wizard-nav"><Button onClick={loadEstimate} loading={busy}>Calculate estimate</Button></div>
          ) : (
            <div className="review">
              <div>
                <h2 className="wizard-card__title">Review your request</h2>
                <KeyValue rows={[
                  ['Service', BOOKING_TYPES[draft.bookingType]],
                  ['Market', market?.name],
                  ['Date', `${fmtDay(draft.serviceDate)} · ${TIME_WINDOWS[draft.timeWindow]}`],
                  [isSample ? 'Delivery' : 'Deliver to', address && (!isSample || draft.deliveryRequired) ? `${address.label} · ${address.areaName}` : 'No delivery — results by photo'],
                ]} />
                <h3 className="review__h">Items</h3>
                <ul className="review-lines">
                  {estimate.lines.map((l, i) => (
                    <li key={i}>
                      <span><strong>{l.itemName}</strong>{l.optionLabel && <span className="muted"> · {l.optionLabel}</span>}<br />
                        <span className="muted small">{l.requestMethod === 'quantity' ? `${l.quantity} × ${l.optionLabel}` : l.amount ? `${naira(l.amount)} worth` : 'To check'}</span>
                      </span>
                      {!isSample && <span>{nairaRange(l.estimateMin, l.estimateMax)}</span>}
                    </li>
                  ))}
                </ul>
                <button type="button" className="link-btn" onClick={() => setStep(2)}>Edit list</button>

                <div className="field" style={{ marginTop: 20 }}>
                  <label className="field__label" htmlFor="notes">Anything else Jojo should know? (optional)</label>
                  <textarea id="notes" className="input" rows={3} maxLength={1000} value={draft.customerNotes} onChange={(e) => set({ customerNotes: e.target.value })} placeholder="e.g. I prefer Mama Bisi’s stall for pepper; no plastic bags please." />
                </div>
              </div>

              <aside className="review__money">
                <h3 className="review__h">Estimated cost</h3>
                <KeyValue rows={[
                  [isSample ? 'Sample cost limit' : 'Goods (estimate)', isSample ? naira(Number(draft.authorizedGoodsLimit) || 0) : nairaRange(estimate.goodsMin, estimate.goodsMax)],
                  [isSample ? 'Sample run fee' : 'Service fee', naira(estimate.serviceFee)],
                  ['Transport (estimate)', estimate.transportEstimate == null ? 'In the quote' : naira(estimate.transportEstimate)],
                  ['Estimated total', nairaRange(estimate.estimatedTotalMin, estimate.estimatedTotalMax), true],
                ]} />

                {!isSample ? (
                  <div className="limits">
                    <div className="field">
                      <label className="field__label" htmlFor="budget">Your goods budget</label>
                      <MoneyInput id="budget" value={draft.intendedGoodsBudget} onChange={(v) => set({ intendedGoodsBudget: v })} />
                      <p className="field__hint">What you expect to spend on goods.</p>
                    </div>
                    <div className={`field${limitErr || fieldErrors.authorizedGoodsLimit ? ' field--error' : ''}`}>
                      <label className="field__label" htmlFor="limit">Most Jojo may spend without asking</label>
                      <MoneyInput id="limit" value={draft.authorizedGoodsLimit} onChange={(v) => set({ authorizedGoodsLimit: v })} />
                      {(limitErr || fieldErrors.authorizedGoodsLimit) && <p className="field__error">{limitErr || fieldErrors.authorizedGoodsLimit}</p>}
                      {!limitErr && limitWarn && <p className="field__hint field__hint--warn">{limitWarn}</p>}
                      {!limitErr && !limitWarn && <p className="field__hint">Above this, Jojo stops and asks you first. Always.</p>}
                    </div>
                  </div>
                ) : (
                  <div className="field">
                    <label className="field__label" htmlFor="slimit">Sample cost limit (optional)</label>
                    <MoneyInput id="slimit" value={draft.authorizedGoodsLimit} onChange={(v) => set({ authorizedGoodsLimit: v })} placeholder="0" />
                    <p className="field__hint">Only if Jojo may buy small samples (e.g. a fabric swatch). Leave at ₦0 for photos only.</p>
                  </div>
                )}

                <ul className="assumptions">{estimate.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
                <label className="check">
                  <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
                  <span>I understand prices are estimates and I’ll pay only after accepting Jojo’s quote. I’ve read the <Link to="/terms" target="_blank">cancellation &amp; refund terms</Link>.</span>
                </label>
                <Button variant="accent" className="btn--block btn--lg" loading={busy} disabled={!accept || Boolean(limitErr)} onClick={submit}>Send request to Jojo</Button>
                <button type="button" className="link-btn small" onClick={loadEstimate}>Recalculate</button>
              </aside>
            </div>
          )
        )}
      </section>

      <Modal open={addrOpen} onClose={() => setAddrOpen(false)} title="Add a delivery address" wide>
        <AddressForm defaultName={user.displayName} defaultPhone={user.phone} onCancel={() => setAddrOpen(false)}
          onSaved={(a) => { setAddresses((list) => [...(list || []).map((x) => (a.isDefault ? { ...x, isDefault: false } : x)), a]); set({ addressId: a.id }); setAddrOpen(false); }} />
      </Modal>
    </>
  );
}

