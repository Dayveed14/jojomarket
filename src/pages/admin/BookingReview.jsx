import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Confirm, ErrorState, KeyValue, Modal, MoneyInput, StatusBadge, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { Alert, Button, Field, Spinner, TextInput } from '../../components/ui';
import { adminApi } from '../../services/api';
import { BOOKING_TYPES, TIME_WINDOWS, fmtDateTime, fmtDay, lineRequestText, naira, nairaRange } from '../../utils/format';

const num = (v) => (v === '' || v == null ? 0 : Number(v));

function QuoteForm({ b, onDone, setError }) {
  const s = b.quoteSuggestion;
  const prev = b.quote?.status === 'proposed' ? b.quote : null;
  const [f, setF] = useState({
    goodsAmount: prev?.goodsAmount ?? s.goodsAmount, serviceFee: prev?.serviceFee ?? s.serviceFee, transportCost: prev?.transportCost ?? s.transportCost,
    otherCharges: prev?.otherCharges ?? 0, otherLabel: prev?.otherLabel ?? '', noteToCustomer: prev?.noteToCustomer ?? '',
    assumptions: prev?.assumptions ?? s.assumptions, serviceDate: b.serviceDate, timeWindow: b.timeWindow,
  });
  const [busy, setBusy] = useState(false);
  const [declining, setDeclining] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: typeof v === 'object' && v?.target ? v.target.value : v }));
  const total = num(f.goodsAmount) + num(f.serviceFee) + num(f.transportCost) + num(f.otherCharges);
  const dates = [...new Set([b.serviceDate, ...(b.rescheduleDays || [])])].sort();

  const send = async () => {
    setBusy(true); setError('');
    try {
      const r = await adminApi.quote(b.reference, {
        goodsAmount: num(f.goodsAmount), serviceFee: num(f.serviceFee), transportCost: num(f.transportCost), otherCharges: num(f.otherCharges),
        otherLabel: f.otherLabel || null, noteToCustomer: f.noteToCustomer || null, assumptions: f.assumptions || null,
        serviceDate: f.serviceDate !== b.serviceDate ? f.serviceDate : undefined, timeWindow: f.timeWindow !== b.timeWindow ? f.timeWindow : undefined,
      });
      onDone(r.booking);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return (
    <section className="card card--action">
      <header className="card__head"><h2>{prev ? 'Revise quote' : 'Review & quote'}</h2>{prev && <span className="badge">v{prev.version} sent {fmtDateTime(prev.createdAt)}</span>}</header>
      <div className="route">
        <strong>Transport estimate: {naira(s.transport.cost)}</strong>
        <span className="muted small">{s.transport.totalKm} km · {s.transport.method === 'google_road' ? 'Google road distance' : 'estimated road distance'}</span>
        <ol className="route__legs">{s.transport.legs.map((l, i) => <li key={i}>{l.from} → {l.to} <span className="muted">{l.km} km</span></li>)}</ol>
        <span className="muted small">Only the ₦ amount is shown to the customer — never your base location or distances.</span>
      </div>
      <div className="form form--grid">
        <Field label={b.bookingType === 'sample_run' ? 'Sample cost allowance' : 'Goods money upfront'} hint={b.bookingType === 'full_purchase' ? `Customer budget ${naira(b.intendedGoodsBudget)} · limit ${naira(b.authorizedGoodsLimit)}` : `Customer cap ${naira(b.authorizedGoodsLimit)}`}>
          {(a) => <MoneyInput {...a} value={f.goodsAmount} onChange={set('goodsAmount')} />}
        </Field>
        <Field label={b.bookingType === 'sample_run' ? 'Sample run fee' : 'Service fee'} hint={`Suggested ${naira(s.serviceFee)}`}>
          {(a) => <MoneyInput {...a} value={f.serviceFee} onChange={set('serviceFee')} />}
        </Field>
        <Field label="Transport" hint={`Suggested ${naira(s.transportCost)}`}>{(a) => <MoneyInput {...a} value={f.transportCost} onChange={set('transportCost')} />}</Field>
        <Field label="Other charge (optional)">{(a) => <MoneyInput {...a} value={f.otherCharges} onChange={set('otherCharges')} />}</Field>
        {num(f.otherCharges) > 0 && <TextInput label="What is the other charge for?" value={f.otherLabel} onChange={set('otherLabel')} />}
        <Field label="Market day">
          {(a) => <select className="input" {...a} value={f.serviceDate} onChange={set('serviceDate')}>{dates.map((d) => <option key={d} value={d}>{fmtDay(d)}{d === b.serviceDate ? ' (requested)' : ''}</option>)}</select>}
        </Field>
        <Field label="Time">
          {(a) => <select className="input" {...a} value={f.timeWindow} onChange={set('timeWindow')}>{Object.entries(TIME_WINDOWS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>}
        </Field>
        <div className="form--full"><Field label="Note to customer (optional)">{(a) => <textarea className="input" rows={2} {...a} value={f.noteToCustomer} onChange={set('noteToCustomer')} placeholder="e.g. Tomatoes are cheaper this week!" />}</Field></div>
        <div className="form--full"><Field label="Assumptions shown with the quote">{(a) => <textarea className="input" rows={2} {...a} value={f.assumptions} onChange={set('assumptions')} />}</Field></div>
      </div>
      <div className="quote-total"><span>Customer pays upfront</span><strong>{naira(total)}</strong></div>
      <div className="btn-row">
        <Button variant="accent" loading={busy} onClick={send}>{prev ? 'Send revised quote' : 'Accept & send quote'}</Button>
        <Button variant="ghost" onClick={() => setDeclining(true)}>Decline request</Button>
      </div>
      <Confirm open={declining} title="Decline this request?" confirmLabel="Decline" needsReason reasonLabel="Reason (shown to the customer)" onClose={() => setDeclining(false)}
        onConfirm={async (reason) => { try { const r = await adminApi.decline(b.reference, reason); setDeclining(false); onDone(r.booking); } catch (e) { setError(e.message); setDeclining(false); } }}>
        <p className="muted">The date is released and the customer is emailed.</p>
      </Confirm>
    </section>
  );
}

function PendingPayments({ b, onDone, setError }) {
  const pending = b.payments.filter((p) => p.provider === 'manual' && p.status === 'pending');
  const [rejecting, setRejecting] = useState(null);
  const [busy, setBusy] = useState(null);
  if (!pending.length && b.status !== 'awaiting_payment') return null;
  return (
    <section className="card card--action">
      <header className="card__head"><h2>Payment</h2>{b.amountDue.amount > 0 && <strong className="big-money">{naira(b.amountDue.amount)} due</strong>}</header>
      {!pending.length && <p className="muted">Waiting for the customer to pay{b.expiresAt ? ` (by ${fmtDateTime(b.expiresAt)})` : ''}.</p>}
      {pending.map((p) => (
        <div key={p.id} className="decision">
          <p><strong>Bank transfer notice: {naira(p.amount)}</strong> <span className="muted small">· {fmtDateTime(p.createdAt)}</span></p>
          <p className="muted">“{p.payerNote}”</p>
          <p className="muted small">Confirm only after you see the money in your account.</p>
          <div className="btn-row">
            <Button className="btn--sm" loading={busy === p.id} onClick={async () => { setBusy(p.id); setError(''); try { onDone((await adminApi.confirmPayment(b.reference, p.id)).booking); } catch (e) { setError(e.message); } finally { setBusy(null); } }}>I’ve received it</Button>
            <Button className="btn--sm" variant="ghost" onClick={() => setRejecting(p)}>Not received</Button>
          </div>
        </div>
      ))}
      <Confirm open={Boolean(rejecting)} title="Mark transfer as not received?" confirmLabel="Mark not received" needsReason onClose={() => setRejecting(null)}
        onConfirm={async (reason) => { try { onDone((await adminApi.rejectPayment(b.reference, rejecting.id, reason)).booking); } catch (e) { setError(e.message); } setRejecting(null); }}>
        <p className="muted">The customer can send a new notice.</p>
      </Confirm>
    </section>
  );
}

function Sheet({ b, onDone, setError }) {
  const p = b.purchase;
  const isSample = b.bookingType === 'sample_run';
  const editable = ['shopping_in_progress', 'awaiting_customer_decision', 'ready_for_delivery'].includes(b.status);
  const reqById = useMemo(() => new Map(b.items.map((i) => [i.id, i])), [b.items]);
  const init = () => ({
    lines: p.items.map((i) => ({ ...i, actualQuantity: i.actualQuantity ?? '', actualAmount: i.actualAmount || '', observedPrice: i.observedPrice ?? '', quantityNote: i.quantityNote || '', notes: i.notes || '' })),
    serviceFee: p.serviceFee, transportCost: p.transportCost, otherCosts: p.otherCosts || '', otherLabel: p.otherLabel || '', summaryNote: p.summaryNote || '', internalNotes: p.internalNotes || '',
  });
  const [s, setS] = useState(init);
  const [busy, setBusy] = useState('');
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { setS(init()); setDirty(false); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b.purchase]);

  const setLine = (idx, patch) => { setS((x) => ({ ...x, lines: x.lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)) })); setDirty(true); };
  const goods = s.lines.reduce((a, l) => a + num(l.actualAmount), 0);
  const over = goods - b.authorizedGoodsLimit;
  const final = goods + num(s.serviceFee) + num(s.transportCost) + num(s.otherCosts);

  const save = async () => {
    setBusy('save'); setError(''); setMsg('');
    try {
      const r = await adminApi.saveSheet(b.reference, {
        items: s.lines.map((l) => ({
          bookingItemId: l.bookingItemId || null, itemName: l.itemName, optionLabel: l.optionLabel || null, outcome: l.outcome,
          actualQuantity: l.actualQuantity === '' ? null : Number(l.actualQuantity), quantityNote: l.quantityNote || null,
          actualAmount: num(l.actualAmount), observedPrice: l.observedPrice === '' ? null : Number(l.observedPrice), notes: l.notes || null,
        })),
        serviceFee: num(s.serviceFee), transportCost: num(s.transportCost), otherCosts: num(s.otherCosts), otherLabel: s.otherLabel || null,
        summaryNote: s.summaryNote || null, internalNotes: s.internalNotes || null,
      });
      onDone(r.booking); setMsg('Saved.'); setDirty(false);
      return true;
    } catch (e) { setError(e.message); return false; } finally { setBusy(''); }
  };

  const OUTCOMES = isSample ? [['sampled', 'Checked'], ['bought', 'Sample bought'], ['unavailable', 'Not found']] : [['bought', 'Bought'], ['partly', 'Partly'], ['substituted', 'Substituted'], ['unavailable', 'Not available']];

  return (
    <section className="card card--span2">
      <header className="card__head">
        <h2>{isSample ? 'Sample findings' : 'Shopping record'}</h2>
        <span className={`limit-meter${over > 0 ? ' is-over' : goods > b.authorizedGoodsLimit * 0.9 ? ' is-near' : ''}`}>
          Goods {naira(goods)} / limit {naira(b.authorizedGoodsLimit)}
        </span>
      </header>
      {over > 0 && <Alert tone="error">That’s {naira(over)} above the customer’s limit. Ask them to approve the extra before saving.</Alert>}
      <div className="sheet">
        {s.lines.map((l, idx) => {
          const req = reqById.get(l.bookingItemId);
          return (
            <div key={l.id || idx} className="sheet__row">
              <div className="sheet__item">
                {req ? <><strong>{l.itemName}</strong><span className="muted small">Asked: {lineRequestText(req)}{req.preferences ? ` · “${req.preferences}”` : ''}</span></>
                  : <input className="input input--sm" aria-label="Item name" value={l.itemName} disabled={!editable} onChange={(e) => setLine(idx, { itemName: e.target.value })} />}
              </div>
              <select className="input input--sm" aria-label="Outcome" value={l.outcome} disabled={!editable} onChange={(e) => setLine(idx, { outcome: e.target.value })}>
                {OUTCOMES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
              <input className="input input--sm" aria-label="Quantity" inputMode="decimal" placeholder="Qty" value={l.actualQuantity} disabled={!editable} onChange={(e) => setLine(idx, { actualQuantity: e.target.value.replace(/[^\d.]/g, '') })} />
              <input className="input input--sm" aria-label="Quantity note" placeholder="e.g. 1 big basket" value={l.quantityNote} disabled={!editable} onChange={(e) => setLine(idx, { quantityNote: e.target.value })} />
              {isSample && <MoneyInput aria-label="Price seen" placeholder="Price seen" value={l.observedPrice} disabled={!editable} onChange={(v) => setLine(idx, { observedPrice: v })} />}
              <MoneyInput aria-label="Amount spent" placeholder="Spent" value={l.actualAmount} disabled={!editable} onChange={(v) => setLine(idx, { actualAmount: v })} />
              <input className="input input--sm sheet__notes" aria-label="Notes for customer" placeholder={isSample ? 'Quality, colours, brands…' : 'Note for customer'} value={l.notes} disabled={!editable} onChange={(e) => setLine(idx, { notes: e.target.value })} />
              {editable && !req && <button className="line__remove" onClick={() => { setS((x) => ({ ...x, lines: x.lines.filter((_, i) => i !== idx) })); setDirty(true); }}>Remove</button>}
            </div>
          );
        })}
      </div>
      {editable && <button className="btn btn--ghost btn--sm" onClick={() => { setS((x) => ({ ...x, lines: [...x.lines, { itemName: '', outcome: isSample ? 'sampled' : 'bought', actualQuantity: '', actualAmount: '', observedPrice: '', quantityNote: '', notes: '' }] })); setDirty(true); }}>+ Add a line</button>}

      <div className="form form--grid" style={{ marginTop: 16 }}>
        <Field label={isSample ? 'Sample fee (actual)' : 'Service fee (actual)'}>{(a) => <MoneyInput {...a} value={s.serviceFee} disabled={!editable} onChange={(v) => { setS((x) => ({ ...x, serviceFee: v })); setDirty(true); }} />}</Field>
        <Field label="Transport (actual)">{(a) => <MoneyInput {...a} value={s.transportCost} disabled={!editable} onChange={(v) => { setS((x) => ({ ...x, transportCost: v })); setDirty(true); }} />}</Field>
        <Field label="Other cost (optional)">{(a) => <MoneyInput {...a} value={s.otherCosts} disabled={!editable} onChange={(v) => { setS((x) => ({ ...x, otherCosts: v })); setDirty(true); }} />}</Field>
        <TextInput label="Other cost is for" value={s.otherLabel} disabled={!editable} onChange={(e) => { setS((x) => ({ ...x, otherLabel: e.target.value })); setDirty(true); }} />
        <div className="form--full"><Field label="Message to customer">{(a) => <textarea className="input" rows={2} {...a} value={s.summaryNote} disabled={!editable} onChange={(e) => { setS((x) => ({ ...x, summaryNote: e.target.value })); setDirty(true); }} />}</Field></div>
        <div className="form--full"><Field label="Private notes (not shown to customer)">{(a) => <textarea className="input" rows={2} {...a} value={s.internalNotes} disabled={!editable} onChange={(e) => { setS((x) => ({ ...x, internalNotes: e.target.value })); setDirty(true); }} />}</Field></div>
      </div>
      <div className="quote-total"><span>Final total</span><strong>{naira(final)}</strong></div>
      {msg && <Alert tone="success">{msg}</Alert>}
      {editable && (
        <div className="btn-row">
          <Button loading={busy === 'save'} disabled={over > 0} onClick={save}>Save record</Button>
          {b.status === 'shopping_in_progress' && (
            <Button variant="accent" loading={busy === 'finish'} disabled={over > 0} onClick={async () => {
              if (dirty && !(await save())) return;
              setBusy('finish'); setError('');
              try { onDone((await adminApi.finish(b.reference)).booking); } catch (e) { setError(e.message); } finally { setBusy(''); }
            }}>{isSample ? 'Send results to customer' : 'Shopping done — out for delivery'}</Button>
          )}
          {b.status === 'ready_for_delivery' && (
            <Button variant="accent" loading={busy === 'complete'} onClick={async () => {
              if (dirty && !(await save())) return;
              setBusy('complete'); setError('');
              try { onDone((await adminApi.complete(b.reference)).booking); } catch (e) { setError(e.message); } finally { setBusy(''); }
            }}>{isSample ? 'Complete sample run' : 'Delivered — complete & reconcile'}</Button>
          )}
        </div>
      )}
    </section>
  );
}

function AskCustomer({ b, onDone, setError }) {
  const [f, setF] = useState({ type: 'extra_spend', bookingItemId: '', description: '', extraAmount: '' });
  const [busy, setBusy] = useState(false);
  const pending = b.changeRequests.filter((c) => c.status === 'pending');
  return (
    <section className="card">
      <h2 className="card__h">Ask the customer</h2>
      {pending.map((c) => (
        <div key={c.id} className="decision">
          <p><strong>{c.type === 'extra_spend' ? `Extra ${naira(c.extraAmount)}` : 'Substitution'}</strong> · waiting</p>
          <p className="muted small">{c.description}</p>
          <button className="link-btn small" onClick={async () => { try { onDone((await adminApi.withdrawChange(b.reference, c.id)).booking); } catch (e) { setError(e.message); } }}>Withdraw</button>
        </div>
      ))}
      <div className="form">
        <div className="seg">
          <button type="button" className={f.type === 'extra_spend' ? 'is-on' : ''} onClick={() => setF({ ...f, type: 'extra_spend' })}>Extra spending</button>
          <button type="button" className={f.type === 'substitution' ? 'is-on' : ''} onClick={() => setF({ ...f, type: 'substitution' })}>Substitution</button>
        </div>
        <Field label="Item (optional)">
          {(a) => <select className="input" {...a} value={f.bookingItemId} onChange={(e) => setF({ ...f, bookingItemId: e.target.value })}><option value="">— Whole list —</option>{b.items.map((i) => <option key={i.id} value={i.id}>{i.itemName}</option>)}</select>}
        </Field>
        {f.type === 'extra_spend' && <Field label="Extra amount needed">{(a) => <MoneyInput {...a} value={f.extraAmount} onChange={(v) => setF({ ...f, extraAmount: v })} />}</Field>}
        <Field label="Explain to the customer">{(a) => <textarea className="input" rows={2} {...a} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder={f.type === 'extra_spend' ? 'Tomatoes are ₦22,500 a basket today' : 'No Oloyin beans today — Drum beans instead?'} />}</Field>
        <Button variant="secondary" className="btn--sm" loading={busy} disabled={f.description.trim().length < 5 || (f.type === 'extra_spend' && !(num(f.extraAmount) > 0))} onClick={async () => {
          setBusy(true); setError('');
          try { onDone((await adminApi.requestChange(b.reference, { type: f.type, bookingItemId: f.bookingItemId ? Number(f.bookingItemId) : null, description: f.description, extraAmount: num(f.extraAmount) })).booking); setF({ type: f.type, bookingItemId: '', description: '', extraAmount: '' }); } catch (e) { setError(e.message); } finally { setBusy(false); }
        }}>Send & pause shopping</Button>
      </div>
    </section>
  );
}

function Attachments({ b, onDone, setError }) {
  const input = useRef(null);
  const [kind, setKind] = useState(b.bookingType === 'sample_run' ? 'sample_photo' : 'receipt');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState(null);
  return (
    <section className="card">
      <h2 className="card__h">Receipts &amp; photos</h2>
      <ul className="attach-list">
        {b.attachments.map((a) => (
          <li key={a.id}>
            <button className="attach" onClick={async () => { try { const { url } = await adminApi.attachment(b.reference, a.id); setView({ ...a, url }); } catch (e) { setError(e.message); } }}>
              <span aria-hidden="true">{a.kind === 'receipt' ? '🧾' : '📷'}</span>{a.caption || a.kind.replace('_', ' ')}
            </button>
            <button className="line__remove" onClick={async () => { try { onDone((await adminApi.deleteAttachment(b.reference, a.id)).booking); } catch (e) { setError(e.message); } }}>Remove</button>
          </li>
        ))}
      </ul>
      <div className="btn-row">
        <select className="input input--sm" aria-label="Photo type" value={kind} onChange={(e) => setKind(e.target.value)} style={{ width: 'auto' }}>
          <option value="receipt">Receipt</option><option value="item_photo">Item photo</option><option value="sample_photo">Sample photo</option><option value="other">Other</option>
        </select>
        <Button variant="secondary" className="btn--sm" loading={busy} onClick={() => input.current?.click()}>Upload photo</Button>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={async (e) => {
        const file = e.target.files?.[0]; e.target.value = '';
        if (!file) return;
        setBusy(true); setError('');
        try { onDone((await adminApi.uploadAttachment(b.reference, file, kind)).booking); } catch (ex) { setError(ex.message); } finally { setBusy(false); }
      }} />
      <p className="muted small">Stored privately; only you and this customer can open them.</p>
      <Modal open={Boolean(view)} onClose={() => setView(null)} title={view?.caption || 'Photo'} wide>{view && <img src={view.url} alt="" className="attach-img" />}</Modal>
    </section>
  );
}

function Reconciliation({ b, onDone, setError }) {
  const r = b.reconciliation;
  const [f, setF] = useState({ method: 'bank_transfer', reference: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [override, setOverride] = useState(false);
  if (!r) return null;
  const label = { awaiting_customer: 'Waiting for customer: refund or credit', refund_pending: 'Customer chose a refund — send it', refunded: 'Refunded', credited: 'Kept as credit', additional_due: 'Customer owes a balance', settled: 'Settled', disputed: 'Disputed' }[r.status];
  return (
    <section className="card card--action">
      <header className="card__head"><h2>Reconciliation</h2><span className={`pill ${['settled', 'refunded', 'credited'].includes(r.status) ? 'pill--green' : ''}`}>{label}</span></header>
      <KeyValue rows={[['Quoted upfront', naira(r.quotedTotal)], ['Received', naira(r.paidTotal)], ['Final cost', naira(r.finalTotal)], r.refundDue > 0 && ['Due back to customer', naira(r.refundDue), true], r.additionalDue > 0 && ['Customer owes', naira(r.additionalDue), true]]} />
      {r.status === 'refund_pending' && (
        <div className="form">
          <div className="seg">
            <button type="button" className={f.method === 'bank_transfer' ? 'is-on' : ''} onClick={() => setF({ ...f, method: 'bank_transfer' })}>Bank transfer</button>
            <button type="button" className={f.method === 'paystack' ? 'is-on' : ''} onClick={() => setF({ ...f, method: 'paystack' })}>Paystack refund</button>
          </div>
          <TextInput label="Transfer / refund reference" value={f.reference} onChange={(e) => setF({ ...f, reference: e.target.value })} />
          <Button loading={busy} disabled={!f.reference.trim()} onClick={async () => { setBusy(true); setError(''); try { onDone((await adminApi.recordRefund(b.reference, f)).booking); } catch (e) { setError(e.message); } finally { setBusy(false); } }}>Record refund of {naira(r.refundDue)} as sent</Button>
        </div>
      )}
      <button className="link-btn small" onClick={() => setOverride(true)}>Change status manually…</button>
      <Confirm open={override} title="Change reconciliation status" confirmLabel="Mark as settled" needsReason onClose={() => setOverride(false)}
        onConfirm={async (reason) => { try { onDone((await adminApi.reconciliationStatus(b.reference, { status: 'settled', reason })).booking); } catch (e) { setError(e.message); } setOverride(false); }}>
        <p className="muted">For example, a small balance you’ve agreed to waive. This is recorded in the audit log.</p>
      </Confirm>
    </section>
  );
}

export default function BookingReview() {
  const { reference } = useParams();
  const { data, error, loading, reload, setData } = useAsync(() => adminApi.booking(reference).then((r) => r.booking), [reference]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [cancelling, setCancelling] = useState(false);

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const b = data;
  const onDone = (booking) => { setData(booking); setErr(''); };
  const shopping = ['shopping_in_progress', 'awaiting_customer_decision', 'ready_for_delivery'].includes(b.status);

  return (
    <>
      <Seo title={`${b.reference} · Review`} noindex />
      <nav className="crumbs"><Link to="/admin/bookings">Booking queue</Link> <span aria-hidden="true">›</span> {b.reference}</nav>
      <header className="page-head page-head--row">
        <div>
          <p className="eyebrow">{BOOKING_TYPES[b.bookingType]} · <span className="mono">{b.reference}</span></p>
          <h1>{b.customer.name} · {b.market.name}</h1>
          <p className="muted">{fmtDay(b.serviceDate)} · {TIME_WINDOWS[b.timeWindow]}</p>
        </div>
        <StatusBadge status={b.status} label={b.statusLabel} />
      </header>
      {err && <Alert tone="error">{err}</Alert>}

      <div className="dash-grid">
        <div className="card--span2 stack">
          {b.quoteSuggestion && <QuoteForm b={b} onDone={onDone} setError={setErr} />}
          {b.status === 'awaiting_customer_approval' && <Alert tone="info">Quote sent — waiting for the customer to accept{b.expiresAt ? ` (until ${fmtDateTime(b.expiresAt)})` : ''}. You can revise it above.</Alert>}
          <PendingPayments b={b} onDone={onDone} setError={setErr} />
          {b.status === 'paid' && (
            <section className="card card--action">
              <h2>Paid &amp; scheduled</h2>
              <p className="muted">Start the shopping record when you’re at the market. The customer’s goods limit is <strong>{naira(b.authorizedGoodsLimit)}</strong>.</p>
              <Button variant="accent" loading={busy === 'start'} onClick={async () => { setBusy('start'); try { onDone((await adminApi.start(b.reference)).booking); } catch (e) { setErr(e.message); } finally { setBusy(''); } }}>Start shopping</Button>
            </section>
          )}
          {b.status === 'awaiting_customer_decision' && <Alert tone="warning" title="Paused">Waiting for the customer to answer your request. Don’t spend above the limit until they do.</Alert>}
          {b.purchase && <Sheet b={b} onDone={onDone} setError={setErr} />}
          {b.status === 'ready_for_delivery' && <button className="link-btn small" onClick={async () => { try { onDone((await adminApi.reopen(b.reference)).booking); } catch (e) { setErr(e.message); } }}>Reopen shopping to correct something</button>}
          <Reconciliation b={b} onDone={onDone} setError={setErr} />

          <section className="card">
            <header className="card__head"><h2>Customer’s list</h2><span className="muted small">{b.items.length} items</span></header>
            <ul className="req-lines">
              {b.items.map((i) => (
                <li key={i.id}>
                  <div><strong>{i.itemName}</strong>{i.allowSubstitution && <span className="pill">subs OK</span>}<div className="muted small">{lineRequestText(i)}{i.preferences && ` · “${i.preferences}”`}</div></div>
                  {b.bookingType === 'full_purchase' && <span>{nairaRange(i.estimateMin, i.estimateMax)}</span>}
                </li>
              ))}
            </ul>
            {b.bookingType === 'full_purchase' && <KeyValue rows={[['Goods estimate', nairaRange(b.goodsEstimateMin, b.goodsEstimateMax)], ['Customer budget', naira(b.intendedGoodsBudget)], ['Spending limit', naira(b.authorizedGoodsLimit), true]]} />}
            {b.customerNotes && <blockquote className="note">“{b.customerNotes}”</blockquote>}
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <h2 className="card__h">Customer</h2>
            <p><strong>{b.customer.name}</strong><br /><a href={`mailto:${b.customer.email}`}>{b.customer.email}</a>{b.customer.phone && <><br /><a href={`tel:${b.customer.phone}`}>{b.customer.phone}</a> · <a href={`https://wa.me/${b.customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp</a></>}</p>
            <Link to={`/admin/customers/${b.customer.id}`} className="link-sm">Customer history</Link>
          </section>
          {b.address && (
            <section className="card">
              <h2 className="card__h">Deliver to</h2>
              <p><strong>{b.address.area}</strong><br />{b.address.addressLine}{b.address.landmark && <><br /><span className="muted small">{b.address.landmark}</span></>}</p>
              <p className="small">{b.address.recipientName} · <a href={`tel:${b.address.recipientPhone}`}>{b.address.recipientPhone}</a></p>
              {b.address.instructions && <p className="muted small">“{b.address.instructions}”</p>}
            </section>
          )}
          {shopping && <AskCustomer b={b} onDone={onDone} setError={setErr} />}
          {(shopping || b.status === 'completed' || b.attachments.length > 0) && <Attachments b={b} onDone={onDone} setError={setErr} />}
          {b.payments.length > 0 && (
            <section className="card">
              <h2 className="card__h">Money</h2>
              <ul className="mini-list">
                {b.payments.map((p) => <li key={p.id}><span>{p.type.replace('_', ' ')} · {p.provider}</span><span className={p.status === 'successful' ? 'pos' : 'muted'}>{naira(p.amount)} {p.status !== 'successful' && `(${p.status})`}</span></li>)}
              </ul>
            </section>
          )}
          {b.quotes.length > 0 && (
            <section className="card">
              <h2 className="card__h">Quote history</h2>
              <ul className="mini-list">{b.quotes.map((q) => <li key={q.id}><span>v{q.version} · {q.status}</span><span>{naira(q.upfrontAmount)}</span></li>)}</ul>
            </section>
          )}
          <section className="card">
            <h2 className="card__h">Timeline</h2>
            <ol className="timeline">{b.timeline.map((t, i) => <li key={i}><strong>{t.label}</strong><span className="muted small">{fmtDateTime(t.at)} · {t.by}{t.reason ? ` · ${t.reason}` : ''}</span></li>)}</ol>
          </section>
          {['submitted', 'awaiting_customer_approval', 'awaiting_payment', 'paid'].includes(b.status) && (
            <Button variant="ghost" className="btn--sm danger-text" onClick={() => setCancelling(true)}>Cancel booking</Button>
          )}
        </div>
      </div>
      <Confirm open={cancelling} title="Cancel this booking?" confirmLabel="Cancel booking" needsReason reasonLabel="Reason (shown to the customer)" onClose={() => setCancelling(false)}
        onConfirm={async (reason) => { try { onDone((await adminApi.cancel(b.reference, reason)).booking); } catch (e) { setErr(e.message); } setCancelling(false); }}>
        <p className="muted">{b.status === 'paid' ? 'The customer has paid — they’ll be offered a full refund or credit.' : 'The date is released.'}</p>
      </Confirm>
    </>
  );
}
