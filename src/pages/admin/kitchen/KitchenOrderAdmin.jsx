import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Confirm, ErrorState, KeyValue, MoneyInput, StatusBadge, useAsync } from '../../../components/common';
import Seo from '../../../components/Seo';
import { Alert, Button, Field, Spinner, TextInput } from '../../../components/ui';
import { adminKitchenApi, kitchenApi } from '../../../services/api';
import { fmtDateTime, naira } from '../../../utils/format';
import { OrderItems, Tracker } from '../../customer/kitchen/KitchenOrder';

const NEXT_LABEL = { preparing: 'Start preparing', cooking: 'Start cooking', out_for_delivery: 'Send out for delivery', delivered: 'Mark delivered' };
const num = (v) => (v === '' || v == null ? 0 : Number(v));

function ApproveCard({ o, done, setError }) {
  const [f, setF] = useState({ expressFee: o.expressFee, deliveryFee: o.deliveryFee, note: '' });
  const [busy, setBusy] = useState('');
  const [declining, setDeclining] = useState(false);
  const load = o.dayLoad;
  const total = o.subtotal + num(f.expressFee) + num(f.deliveryFee);
  return (
    <section className="card card--action">
      <header className="card__head"><h2>⚡ Express request</h2><span className="badge">Wanted {o.deliveryText}</span></header>
      <p className="muted">That day you already have <strong>{load.portions}</strong> of {load.capacity} portions and <strong>{load.orders}</strong> of {load.maxOrders} orders booked.
        {o.expiresAt && ` The request closes automatically at ${fmtDateTime(o.expiresAt)}.`}</p>
      <div className="form form--grid">
        <Field label="Express charge" hint="Suggested from your express settings">{(a) => <MoneyInput {...a} value={f.expressFee} onChange={(v) => setF({ ...f, expressFee: v })} />}</Field>
        <Field label="Delivery">{(a) => <MoneyInput {...a} value={f.deliveryFee} onChange={(v) => setF({ ...f, deliveryFee: v })} />}</Field>
        <div className="form--full"><TextInput label="Note to the customer (optional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. Fresh catfish today!" /></div>
      </div>
      <div className="quote-total"><span>Customer will pay</span><strong>{naira(total)}</strong></div>
      <div className="btn-row">
        <Button variant="accent" loading={busy === 'a'} onClick={async () => {
          setBusy('a'); setError('');
          try { done((await adminKitchenApi.approve(o.reference, { expressFee: num(f.expressFee), deliveryFee: num(f.deliveryFee), note: f.note || null })).order); } catch (e) { setError(e.message); } finally { setBusy(''); }
        }}>Approve & ask for payment</Button>
        <Button variant="ghost" onClick={() => setDeclining(true)}>Decline</Button>
      </div>
      <Confirm open={declining} title="Decline this express request?" confirmLabel="Decline" needsReason reasonLabel="Reason (emailed to the customer)" onClose={() => setDeclining(false)}
        onConfirm={async (reason) => { try { done((await adminKitchenApi.decline(o.reference, reason)).order); } catch (e) { setError(e.message); } setDeclining(false); }}>
        <p className="muted">The customer hasn’t paid anything, so nothing needs refunding.</p>
      </Confirm>
    </section>
  );
}

export default function KitchenOrderAdmin() {
  const { reference } = useParams();
  const { data, error, loading, reload, setData } = useAsync(() => adminKitchenApi.order(reference).then((r) => r.order), [reference]);
  const { data: menu } = useAsync(() => kitchenApi.menu(), []);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [dialog, setDialog] = useState(null);
  const [refundMethod, setRefundMethod] = useState('credit');
  const [refundRef, setRefundRef] = useState('');

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const o = data;
  const act = async (key, fn) => {
    setBusy(key); setErr('');
    try { setData((await fn()).order); setDialog(null); } catch (e) { setErr(e.message); } finally { setBusy(''); }
  };
  const pending = o.payments.filter((p) => p.provider === 'manual' && p.status === 'pending');
  const paid = o.payments.some((p) => p.status === 'successful' && ['charge', 'credit_applied'].includes(p.type));
  const cancellable = !['delivered', 'declined', 'cancelled', 'expired', 'out_for_delivery', 'cooking'].includes(o.status);

  return (
    <div className="k-scope">
      <Seo title={`Kitchen ${o.reference}`} noindex />
      <nav className="crumbs"><Link to="/admin/kitchen">Kitchen</Link> <span aria-hidden="true">›</span> {o.reference}</nav>
      <header className="page-head page-head--row">
        <div>
          <p className="eyebrow">{o.orderType === 'express' ? '⚡ Express' : 'Regular'} · <span className="mono">{o.reference}</span>{o.isBulk ? ' · Bulk' : ''}</p>
          <h1>{o.customer.name} — {o.deliveryText}</h1>
          <p className="muted">{o.customer.email}{o.customer.phone ? ` · ${o.customer.phone}` : ''}</p>
        </div>
        <StatusBadge status={o.status} label={o.statusLabel} />
      </header>
      {err && <Alert tone="error">{err}</Alert>}
      <Tracker o={o} />

      <div className="dash-grid">
        <div className="card--span2 stack">
          {o.status === 'express_requested' && <ApproveCard o={o} done={setData} setError={setErr} />}
          {o.status === 'awaiting_payment' && (
            <Alert tone="info" title="Waiting for the customer to pay">{naira(o.amountDue.amount)} due{o.expiresAt ? ` by ${fmtDateTime(o.expiresAt)}` : ''}.</Alert>
          )}
          {pending.map((p) => (
            <section key={p.id} className="card card--action">
              <h2>Bank transfer to confirm</h2>
              <p>{naira(p.amount)} — “{p.payerNote}” · {fmtDateTime(p.createdAt)}</p>
              <p className="muted small">Only confirm once the money is in your account.</p>
              <div className="btn-row">
                <Button variant="accent" loading={busy === `c${p.id}`} onClick={() => act(`c${p.id}`, () => adminKitchenApi.confirmPayment(o.reference, p.id))}>Money received — confirm</Button>
                <Button variant="ghost" onClick={() => setDialog({ reject: p.id })}>Not received</Button>
              </div>
            </section>
          ))}
          {o.nextStep && (
            <section className="card card--action">
              <h2>Next step</h2>
              <p className="muted">{o.nextStep === 'out_for_delivery' ? 'The customer gets an email that delivery is being made.' : o.nextStep === 'delivered' ? 'The customer gets a thank-you email.' : 'The customer sees this on their tracker.'}</p>
              <div className="btn-row">
                <Button variant="accent" loading={busy === 'adv'} onClick={() => act('adv', () => adminKitchenApi.advance(o.reference, o.nextStep))}>{NEXT_LABEL[o.nextStep]}</Button>
                {o.status === 'confirmed' && <Button variant="ghost" loading={busy === 'skip'} onClick={() => act('skip', () => adminKitchenApi.advance(o.reference, 'cooking'))}>Skip to cooking</Button>}
              </div>
            </section>
          )}
          {o.refundStatus === 'refund_pending' && (
            <section className="card card--action">
              <h2>Refund to send: {naira(o.refundDue)}</h2>
              <form className="inline-form" onSubmit={(e) => { e.preventDefault(); act('ref', () => adminKitchenApi.refund(o.reference, { reference: refundRef || null })); }}>
                <TextInput label="Transfer reference (optional)" value={refundRef} onChange={(e) => setRefundRef(e.target.value)} />
                <Button type="submit" variant="secondary" loading={busy === 'ref'}>I’ve sent the refund</Button>
              </form>
            </section>
          )}
          {['declined', 'cancelled', 'expired'].includes(o.status) && o.statusReason && <Alert tone="info" title={o.statusLabel}>{o.statusReason}</Alert>}

          <section className="card">
            <header className="card__head"><h2>Cook this</h2><span className="muted small">{o.portions} portions</span></header>
            {o.allergyNotes && <div className="k-allergy" style={{ marginBottom: 10 }}>⚠ Allergy: {o.allergyNotes}</div>}
            <OrderItems o={o} meals={menu?.meals} />
            {o.customerNotes && <p className="muted small">Customer note: “{o.customerNotes}”</p>}
            <KeyValue rows={[['Food', naira(o.subtotal)], ['Delivery', naira(o.deliveryFee)], o.orderType === 'express' && ['Express', naira(o.expressFee)], ['Total', naira(o.total), true]]} />
          </section>
        </div>
        <aside className="stack">
          <section className="card">
            <h2>Deliver to</h2>
            <p style={{ margin: 0 }}><strong>{o.address.recipientName}</strong> · <a href={`tel:${o.address.recipientPhone}`}>{o.address.recipientPhone}</a><br />{o.address.addressLine}, {o.address.area}
              {o.address.landmark && <><br />Near {o.address.landmark}</>}{o.address.instructions && <><br /><span className="muted small">{o.address.instructions}</span></>}</p>
          </section>
          <section className="card">
            <h2>Payments</h2>
            {!o.payments.length && <p className="muted small">None yet.</p>}
            <ul className="plain-list">{o.payments.map((p) => <li key={p.id}>{naira(p.amount)} · {p.provider} · {p.type} · <strong>{p.status}</strong></li>)}</ul>
          </section>
          <section className="card">
            <h2>Timeline</h2>
            <ul className="timeline">{o.timeline.map((e, i) => <li key={i}><strong>{e.label}</strong><span className="muted small">{fmtDateTime(e.at)} · {e.by}{e.reason ? ` · ${e.reason}` : ''}</span></li>)}</ul>
          </section>
          {cancellable && <button type="button" className="link-btn" onClick={() => setDialog({ cancel: true })}>Cancel this order</button>}
        </aside>
      </div>

      <Confirm open={Boolean(dialog?.cancel)} title="Cancel this order?" confirmLabel="Cancel order" needsReason reasonLabel="Reason (emailed to the customer)" busy={busy === 'cancel'}
        onClose={() => setDialog(null)} onConfirm={(reason) => act('cancel', () => adminKitchenApi.cancel(o.reference, { reason, refundMethod }))}>
        {paid ? (
          <fieldset className="fieldset-plain">
            <legend className="field__label">The customer has paid. Return the money as:</legend>
            <label className="check"><input type="radio" checked={refundMethod === 'credit'} onChange={() => setRefundMethod('credit')} /> Jojo Market credit (instant)</label>
            <label className="check"><input type="radio" checked={refundMethod === 'refund'} onChange={() => setRefundMethod('refund')} /> Bank refund (you send it, then record it here)</label>
          </fieldset>
        ) : <p className="muted">Nothing has been paid.</p>}
      </Confirm>
      <Confirm open={Boolean(dialog?.reject)} title="Transfer not received?" confirmLabel="Reject transfer notice" needsReason onClose={() => setDialog(null)}
        onConfirm={(reason) => act('rej', () => adminKitchenApi.rejectPayment(o.reference, dialog.reject, reason))}>
        <p className="muted">The customer can try again or pay online.</p>
      </Confirm>
    </div>
  );
}
