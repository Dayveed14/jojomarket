import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Confirm, ErrorState, KeyValue, StatusBadge, useAsync } from '../../../components/common';
import { DishArt, DishImage } from '../../../components/kitchen/DishArt';
import Seo from '../../../components/Seo';
import { Alert, Spinner } from '../../../components/ui';
import { kitchenApi } from '../../../services/api';
import { fmtDateTime, naira } from '../../../utils/format';
import { SPICE } from '../../../utils/kitchen';
import { PaymentCard } from '../BookingDetail';

const CLOSED = ['declined', 'cancelled', 'expired'];

export function Tracker({ o }) {
  const steps = [
    ...(o.orderType === 'express' ? [['express_requested', 'Requested', '⚡'], ['awaiting_payment', 'Approved', '👍']] : [['awaiting_payment', 'Placed', '🧾']]),
    ['confirmed', 'Paid', '✓'], ['preparing', 'Preparing', '🔪'], ['cooking', 'Cooking', '🍲'], ['out_for_delivery', 'On the way', '🛵'], ['delivered', 'Delivered', '🏠'],
  ];
  if (CLOSED.includes(o.status)) return null;
  const idx = steps.findIndex(([k]) => k === o.status);
  return (
    <ol className="k-tracker" aria-label="Order progress">
      {steps.map(([k, label, icon], i) => (
        <li key={k} className={i < idx || o.status === 'delivered' ? 'is-done' : i === idx ? 'is-current' : ''} aria-current={i === idx ? 'step' : undefined}>
          <span className="k-tracker__dot">{icon}</span>{label}
        </li>
      ))}
    </ol>
  );
}

export function OrderItems({ o, meals }) {
  const byId = new Map((meals || []).map((m) => [m.id, m]));
  return (
    <ul className="k-order-items">
      {o.items.map((i) => (
        <li key={i.id}>
          <DishImage meal={byId.get(i.mealId) || { illustration: 'jollof', name: i.mealName }} />
          <div>
            <strong>{i.quantity} × {i.mealName}</strong> <span className="muted small">({i.optionLabel})</span>
            <div>
              {i.exclusions.map((e) => <span key={e} className="k-pill">{e}</span>)}
              {i.spiceLevel && <span className="k-pill k-pill--hot">{SPICE[i.spiceLevel]}</span>}
            </div>
            {i.instructions && <div className="muted small">“{i.instructions}”</div>}
          </div>
          <span>{naira(i.lineTotal)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function KitchenOrder() {
  const { reference } = useParams();
  const { state } = useLocation();
  const { data, error, loading, reload, setData } = useAsync(() => kitchenApi.get(reference).then((r) => r.order), [reference]);
  const { data: menu } = useAsync(() => kitchenApi.menu(), []);
  const [actionError, setActionError] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const o = data;
  const refresh = async () => setData((await kitchenApi.get(reference)).order);
  const pendingTransfer = o.payments.some((p) => p.provider === 'manual' && p.status === 'pending');

  return (
    <div className="k-scope">
      <Seo title={`Order ${o.reference}`} noindex />
      <nav className="crumbs"><Link to="/app/kitchen">Jojo’s Kitchen</Link> <span aria-hidden="true">›</span> {o.reference}</nav>
      <header className="page-head page-head--row">
        <div>
          <p className="eyebrow">{o.orderType === 'express' ? '⚡ Express order' : 'Kitchen order'} · <span className="mono">{o.reference}</span></p>
          <h1>Delivery {o.deliveryText}</h1>
        </div>
        <StatusBadge status={o.status} label={o.statusLabel} />
      </header>
      {actionError && <Alert tone="error">{actionError}</Alert>}
      <Tracker o={o} />

      <div className="dash-grid">
        <div className="card--span2 stack">
          {o.status === 'express_requested' && (
            <section className="k-banner" style={{ marginBottom: 0 }}>
              <div>
                <h1>{state?.placed ? 'We are getting across to Jojo…' : 'Waiting for Jojo'}</h1>
                <p>She’s checking she can have this ready {o.deliveryText}. You’ll get an email the moment she replies — then you can pay.
                  {o.expiresAt && ` If she can’t answer by ${fmtDateTime(o.expiresAt)}, the request closes and nothing is charged.`}</p>
              </div>
              <DishArt dish="peppersoup" steam />
            </section>
          )}
          {o.status === 'awaiting_payment' && (
            <>
              {o.orderType === 'express'
                ? <Alert tone="success" title="Your express request has been approved 🎉">Kindly proceed to make payment to confirm it.{o.operatorNote && ` Jojo says: “${o.operatorNote}”`}</Alert>
                : state?.placed && <Alert tone="success" title="Order placed!">Pay now to lock in your delivery slot.</Alert>}
              {o.expiresAt && !pendingTransfer && <p className="muted small">Please pay by <strong>{fmtDateTime(o.expiresAt)}</strong> — after that the slot is released for someone else.</p>}
              <PaymentCard b={o} refresh={refresh} setError={setActionError} payApi={kitchenApi} heldText="your order is held for you" footer="Your order is confirmed once payment is verified — Jojo then starts shopping for fresh ingredients." />
            </>
          )}
          {o.status === 'confirmed' && (
            <section className="card card--action"><h2>You’re booked in! 🎉</h2><p className="muted">Jojo will buy fresh ingredients and cook for delivery {o.deliveryText}. We’ll email you when it’s on the way.</p></section>
          )}
          {['preparing', 'cooking'].includes(o.status) && (
            <section className="k-banner" style={{ marginBottom: 0 }}>
              <div><h1>{o.status === 'preparing' ? 'Preparation in progress' : 'Cooking in progress'}</h1><p>{o.status === 'preparing' ? 'Fresh ingredients are being washed, chopped and prepped.' : 'Your food is on the fire — made exactly how you asked.'}</p></div>
              <DishArt dish={o.status === 'cooking' ? 'egusi' : 'jollof'} steam />
            </section>
          )}
          {o.status === 'out_for_delivery' && <Alert tone="success" title="Delivery is being made 🛵">Your food is sealed and on its way to {o.address.area}.</Alert>}
          {o.status === 'delivered' && (
            <section className="card card--action"><h2>Delivered — enjoy! 😋</h2><p className="muted">Thank you for ordering from Jojo’s Kitchen.</p><Link to="/app/kitchen/new" className="btn btn--accent btn--sm">Order again</Link></section>
          )}
          {CLOSED.includes(o.status) && (
            <section className="card">
              <h2>{o.statusLabel}</h2>
              {o.statusReason && <p className="muted">{o.statusReason}</p>}
              {o.refundStatus === 'credited' && <Alert tone="success">{naira(o.refundDue)} has been added to your Jojo Market credit.</Alert>}
              {o.refundStatus === 'refund_pending' && <Alert tone="info">A refund of {naira(o.refundDue)} is being sent to you.</Alert>}
              {o.refundStatus === 'refunded' && <Alert tone="success">{naira(o.refundDue)} has been refunded.</Alert>}
              <Link to="/app/kitchen/new" className="btn btn--primary btn--sm">Start a new order</Link>
            </section>
          )}

          <section className="card">
            <header className="card__head"><h2>Your food</h2>{o.isBulk && <span className="badge">Bulk</span>}</header>
            <OrderItems o={o} meals={menu?.meals} />
            <KeyValue rows={[
              ['Food', naira(o.subtotal)], ['Delivery', naira(o.deliveryFee)],
              o.orderType === 'express' && [o.status === 'express_requested' ? 'Express (estimate)' : 'Express', naira(o.expressFee)],
              [o.status === 'express_requested' ? 'Estimated total' : 'Total', naira(o.total), true],
            ]} />
          </section>
        </div>

        <aside className="stack">
          <section className="card">
            <h2>Delivering to</h2>
            <p style={{ margin: 0 }}><strong>{o.address.recipientName}</strong> · {o.address.recipientPhone}<br />{o.address.addressLine}, {o.address.area}{o.address.landmark && <><br /><span className="muted small">Near {o.address.landmark}</span></>}</p>
          </section>
          {(o.allergyNotes || o.customerNotes) && (
            <section className="card stack">
              {o.allergyNotes && <div className="k-allergy">⚠ Allergy: {o.allergyNotes}</div>}
              {o.customerNotes && <p className="muted small" style={{ margin: 0 }}>Your note: “{o.customerNotes}”</p>}
            </section>
          )}
          <section className="card">
            <h2>Timeline</h2>
            <ul className="timeline">
              {o.timeline.map((e, i) => <li key={i}><strong>{e.label}</strong><span className="muted small">{fmtDateTime(e.at)}{e.reason ? ` · ${e.reason}` : ''}</span></li>)}
            </ul>
          </section>
          {o.canCancel && <button type="button" className="link-btn" onClick={() => setCancelOpen(true)}>Cancel this order</button>}
        </aside>
      </div>

      <Confirm open={cancelOpen} title="Cancel this order?" tone="accent" confirmLabel="Yes, cancel" busy={busy}
        onClose={() => setCancelOpen(false)}
        onConfirm={async (reason) => {
          setBusy(true);
          try { setData((await kitchenApi.cancel(o.reference, reason || undefined)).order); setCancelOpen(false); } catch (e) { setActionError(e.message); } finally { setBusy(false); }
        }}>
        Nothing has been paid, so there’s nothing to refund.
      </Confirm>
    </div>
  );
}
