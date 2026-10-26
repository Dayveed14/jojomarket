import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Confirm, ErrorState, KeyValue, Modal, StatusBadge, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { Alert, Button, Spinner, TextInput } from '../../components/ui';
import { bookingApi } from '../../services/api';
import { BOOKING_TYPES, TIME_WINDOWS, fmtDateTime, fmtDay, lineRequestText, naira, nairaRange } from '../../utils/format';

const PROGRESS = [
  ['Requested', ['submitted']],
  ['Quote', ['awaiting_customer_approval']],
  ['Payment', ['awaiting_payment']],
  ['Scheduled', ['paid']],
  ['Shopping', ['shopping_in_progress', 'awaiting_customer_decision']],
  ['Done', ['ready_for_delivery', 'completed']],
];

function Progress({ status }) {
  const idx = PROGRESS.findIndex(([, s]) => s.includes(status));
  if (idx < 0) return null;
  return (
    <ol className="progress-steps" aria-label="Progress">
      {PROGRESS.map(([label], i) => (
        <li key={label} className={i < idx || status === 'completed' ? 'is-done' : i === idx ? 'is-current' : ''}>{label}</li>
      ))}
    </ol>
  );
}

function QuoteCard({ b, onAccept, onRevise, busy }) {
  const q = b.quote;
  return (
    <section className="card card--action">
      <header className="card__head"><h2>Jojo’s quote</h2><span className="badge">Version {q.version}</span></header>
      {q.noteToCustomer && <blockquote className="note">“{q.noteToCustomer}”</blockquote>}
      <KeyValue rows={[
        [b.bookingType === 'sample_run' ? 'Sample cost allowance' : 'Goods money (held for shopping)', naira(q.goodsAmount)],
        [b.bookingType === 'sample_run' ? 'Sample run fee' : 'Service fee', naira(q.serviceFee)],
        ['Transport', naira(q.transportCost)],
        q.otherCharges > 0 && [q.otherLabel || 'Other', naira(q.otherCharges)],
        ['Pay upfront', naira(q.upfrontAmount), true],
      ]} />
      {q.assumptions && <p className="muted small">{q.assumptions}</p>}
      {b.bookingType === 'full_purchase' && <p className="muted small">Your spending limit for goods is <strong>{naira(b.authorizedGoodsLimit)}</strong>. Anything left over comes back to you as a refund or credit.</p>}
      {q.validUntil && <p className="muted small">This quote is valid until {fmtDateTime(q.validUntil)}.</p>}
      <div className="btn-row">
        <Button variant="accent" loading={busy} onClick={onAccept}>Accept quote</Button>
        <Button variant="ghost" onClick={onRevise}>Ask for changes</Button>
      </div>
    </section>
  );
}

function PaymentCard({ b, refresh, setError }) {
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const pendingManual = b.payments.find((p) => p.provider === 'manual' && p.status === 'pending');
  const run = async (key, fn) => {
    setBusy(key); setError('');
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(''); }
  };

  return (
    <section className="card card--action">
      <header className="card__head"><h2>{b.amountDue.label || 'Payment'}</h2><strong className="big-money">{naira(b.amountDue.amount)}</strong></header>
      {pendingManual ? (
        <Alert tone="info" title="Transfer notice received">
          You told us you sent {naira(pendingManual.amount)} ({pendingManual.payerNote}). Jojo will confirm once it reaches her account — your booking is held for you.
        </Alert>
      ) : (
        <div className="pay-options">
          {b.creditBalance > 0 && (
            <div className="pay-option">
              <strong>Use my Jojo Market credit</strong>
              <span className="muted small">Available: {naira(b.creditBalance)}</span>
              <Button variant="secondary" className="btn--sm" loading={busy === 'credit'} onClick={() => run('credit', async () => { await bookingApi.payCredit(b.reference); await refresh(); })}>
                Apply {naira(Math.min(b.creditBalance, b.amountDue.amount))}
              </Button>
            </div>
          )}
          {b.onlinePayment && (
            <div className="pay-option">
              <strong>Pay online</strong>
              <span className="muted small">Card, bank transfer or USSD via Paystack.</span>
              <Button variant="accent" className="btn--sm" loading={busy === 'online'} onClick={() => run('online', async () => {
                const { authorizationUrl } = await bookingApi.payOnline(b.reference);
                window.location.assign(authorizationUrl);
              })}>Pay {naira(b.amountDue.amount)}</Button>
            </div>
          )}
          {b.manualPayment && (
            <div className="pay-option pay-option--wide">
              <strong>Pay by bank transfer</strong>
              {b.manualPayment.accountNumber ? (
                <KeyValue rows={[
                  ['Bank', b.manualPayment.bankName], ['Account name', b.manualPayment.accountName],
                  ['Account number', <span className="mono" key="n">{b.manualPayment.accountNumber}</span>], ['Narration', <span className="mono" key="r">{b.reference}</span>],
                ]} />
              ) : <p className="muted small">Jojo will share her account details with you directly.</p>}
              <p className="muted small">{b.manualPayment.instructions}</p>
              <form className="inline-form" onSubmit={(e) => { e.preventDefault(); run('manual', async () => { await bookingApi.payManual(b.reference, note); setNote(''); await refresh(); }); }}>
                <TextInput label="Name on the transfer or bank reference" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. ADA OBI — GTBank" />
                <Button type="submit" variant="secondary" className="btn--sm" loading={busy === 'manual'} disabled={note.trim().length < 3}>I’ve sent the money</Button>
              </form>
            </div>
          )}
        </div>
      )}
      <p className="muted small">Your booking is confirmed only when payment is verified — not just when you click.</p>
    </section>
  );
}

function DecisionCard({ b, refresh, setError }) {
  const [busy, setBusy] = useState(null);
  const pending = b.changeRequests.filter((c) => c.status === 'pending');
  if (!pending.length) return null;
  const decide = async (id, decision) => {
    setBusy(id + decision); setError('');
    try { await bookingApi.decideChange(b.reference, id, decision); await refresh(); } catch (e) { setError(e.message); } finally { setBusy(null); }
  };
  return (
    <section className="card card--action card--alert">
      <header className="card__head"><h2>Jojo needs your OK</h2></header>
      {pending.map((c) => (
        <div key={c.id} className="decision">
          <p><strong>{c.type === 'extra_spend' ? `Spend ${naira(c.extraAmount)} more` : 'Substitution'}</strong>{c.itemName && <> on <strong>{c.itemName}</strong></>}</p>
          <p className="muted">{c.description}</p>
          {c.type === 'extra_spend' && <p className="muted small">Approving raises your spending limit from {naira(b.authorizedGoodsLimit)} to {naira(b.authorizedGoodsLimit + c.extraAmount)}. You’ll only pay for what’s actually bought.</p>}
          <div className="btn-row">
            <Button className="btn--sm" loading={busy === c.id + 'approve'} onClick={() => decide(c.id, 'approve')}>Approve</Button>
            <Button className="btn--sm" variant="ghost" loading={busy === c.id + 'reject'} onClick={() => decide(c.id, 'reject')}>No, thanks</Button>
          </div>
        </div>
      ))}
    </section>
  );
}

function ReceiptCard({ b, refresh, setError }) {
  const [busy, setBusy] = useState('');
  const p = b.purchase;
  const r = b.reconciliation;
  const isSample = b.bookingType === 'sample_run';
  const choose = async (choice) => {
    setBusy(choice); setError('');
    try { await bookingApi.refundChoice(b.reference, choice); await refresh(); } catch (e) { setError(e.message); } finally { setBusy(''); }
  };
  return (
    <section className="card card--span2">
      <header className="card__head">
        <h2>{isSample ? 'Sample run results' : b.status === 'completed' ? 'Your receipt' : 'What Jojo has bought so far'}</h2>
        {p.shoppingCompletedAt && <span className="muted small">Finished {fmtDateTime(p.shoppingCompletedAt)}</span>}
      </header>
      {p.summaryNote && <blockquote className="note">“{p.summaryNote}”</blockquote>}
      <div className="table-wrap">
        <table className="table table--receipt">
          <thead><tr><th>Item</th><th>{isSample ? 'Findings' : 'Bought'}</th>{isSample ? <th>Price seen</th> : null}<th className="num">{isSample ? 'Spent' : 'Cost'}</th></tr></thead>
          <tbody>
            {p.items.map((i) => (
              <tr key={i.id}>
                <td><strong>{i.itemName}</strong>{i.optionLabel && <div className="muted small">{i.optionLabel}</div>}</td>
                <td>
                  <span className={`outcome outcome--${i.outcome}`}>{{ bought: 'Bought', partly: 'Partly', unavailable: 'Not available', substituted: 'Substituted', sampled: 'Checked' }[i.outcome]}</span>
                  {(i.actualQuantity || i.quantityNote) && <div className="small">{[i.actualQuantity, i.quantityNote].filter(Boolean).join(' · ')}</div>}
                  {i.notes && <div className="muted small">{i.notes}</div>}
                </td>
                {isSample ? <td>{naira(i.observedPrice)}</td> : null}
                <td className="num">{naira(i.actualAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {b.status === 'completed' && (
        <div className="receipt-totals">
          <KeyValue rows={[
            ['Goods', naira(p.goodsTotal)], [isSample ? 'Sample fee' : 'Service fee', naira(p.serviceFee)], ['Transport', naira(p.transportCost)],
            p.otherCosts > 0 && [p.otherLabel || 'Other', naira(p.otherCosts)],
            ['Final total', naira(p.finalTotal), true],
            r && ['You paid', naira(r.paidTotal)],
          ]} />
          {r?.refundDue > 0 && (
            r.status === 'awaiting_customer' ? (
              <div className="refund-choice">
                <p><strong>{naira(r.refundDue)}</strong> of your money wasn’t spent. How would you like it back?</p>
                <div className="btn-row">
                  <Button className="btn--sm" loading={busy === 'refund'} onClick={() => choose('refund')}>Refund to my bank</Button>
                  <Button className="btn--sm" variant="gold" loading={busy === 'credit'} onClick={() => choose('credit')}>Keep as credit for next time</Button>
                </div>
              </div>
            ) : (
              <Alert tone="success">{{ credited: `${naira(r.refundDue)} added to your Jojo Market credit.`, refund_pending: `Refund of ${naira(r.refundDue)} requested — Jojo will send it shortly.`, refunded: `${naira(r.refundDue)} refunded to you.` }[r.status] || ''}</Alert>
            )
          )}
          {r?.additionalDue > 0 && r.status === 'settled' && <Alert tone="success">Balance paid. Thank you!</Alert>}
        </div>
      )}
    </section>
  );
}

function Photos({ b }) {
  const [view, setView] = useState(null);
  const [err, setErr] = useState('');
  if (!b.attachments.length) return null;
  const open = async (a) => {
    setErr('');
    try { const { url } = await bookingApi.attachment(b.reference, a.id); setView({ ...a, url }); } catch (e) { setErr(e.message); }
  };
  return (
    <section className="card">
      <header className="card__head"><h2>Receipts &amp; photos</h2></header>
      <ul className="attach-list">
        {b.attachments.map((a) => (
          <li key={a.id}><button className="attach" onClick={() => open(a)}><span aria-hidden="true">{a.kind === 'receipt' ? '🧾' : '📷'}</span>{a.caption || { receipt: 'Receipt', sample_photo: 'Sample photo', item_photo: 'Item photo', other: 'Photo' }[a.kind]}</button></li>
        ))}
      </ul>
      {err && <p className="field__error">{err}</p>}
      <p className="muted small">Photos are private to you and Jojo. Links expire after a few minutes.</p>
      <Modal open={Boolean(view)} onClose={() => setView(null)} title={view?.caption || 'Photo'} wide>
        {view && <img src={view.url} alt={view.caption || 'Booking photo'} className="attach-img" />}
      </Modal>
    </section>
  );
}

export default function BookingDetail() {
  const { reference } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { data, error, loading, reload, setData } = useAsync(() => bookingApi.get(reference).then((r) => r.booking), [reference]);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState('');
  const [dialog, setDialog] = useState(null);
  const [listName, setListName] = useState('');
  const [notice, setNotice] = useState('');

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const b = data;
  const refresh = async () => { const r = await bookingApi.get(reference); setData(r.booking); };
  const act = async (key, fn) => {
    setBusy(key); setActionError('');
    try { const r = await fn(); if (r?.booking) setData(r.booking); else await refresh(); setDialog(null); } catch (e) { setActionError(e.message); } finally { setBusy(''); }
  };

  return (
    <>
      <Seo title={`Booking ${b.reference}`} noindex />
      <nav className="crumbs"><Link to="/app/bookings">My bookings</Link> <span aria-hidden="true">›</span> {b.reference}</nav>
      <header className="page-head page-head--row">
        <div>
          <p className="eyebrow">{BOOKING_TYPES[b.bookingType]} · <span className="mono">{b.reference}</span></p>
          <h1>{b.market.name}</h1>
          <p className="muted">{fmtDay(b.serviceDate)} · {TIME_WINDOWS[b.timeWindow]}</p>
        </div>
        <StatusBadge status={b.status} label={b.statusLabel} />
      </header>

      {state?.submitted && b.status === 'submitted' && (
        <Alert tone="success" title="Request sent!">Jojo will review your list and date, then send a quote. Nothing is charged until you accept it.</Alert>
      )}
      {notice && <Alert tone="success">{notice}</Alert>}
      {actionError && <Alert tone="error">{actionError}</Alert>}
      <Progress status={b.status} />

      <div className="dash-grid">
        <div className="card--span2 stack">
          {b.status === 'submitted' && (
            <section className="card card--action">
              <h2>Waiting for Jojo</h2>
              <p className="muted">She’s checking the date, the market and your list.{b.expiresAt && ` If she can’t respond by ${fmtDateTime(b.expiresAt)}, the date is released and you won’t be charged.`}</p>
            </section>
          )}
          {b.actions.canAcceptQuote && (
            <QuoteCard b={b} busy={busy === 'accept'} onAccept={() => act('accept', () => bookingApi.acceptQuote(b.reference, b.quote.id))} onRevise={() => setDialog('revise')} />
          )}
          {b.actions.canPay && <PaymentCard b={b} refresh={refresh} setError={setActionError} />}
          <DecisionCard b={b} refresh={refresh} setError={setActionError} />
          {b.status === 'paid' && (
            <section className="card card--action">
              <h2>You’re booked!</h2>
              <p className="muted">Jojo will shop on {fmtDay(b.serviceDate)}. You’ll get an email if she needs your OK on anything.</p>
            </section>
          )}
          {b.status === 'shopping_in_progress' && !b.purchase?.items?.some((i) => i.actualAmount > 0) && (
            <section className="card card--action"><h2>Jojo is at the market</h2><p className="muted">Items appear here as she records them.</p></section>
          )}
          {['declined', 'expired', 'cancelled'].includes(b.status) && (
            <section className="card">
              <h2>{b.statusLabel}</h2>
              {b.statusReason && <p className="muted">{b.statusReason}</p>}
              {b.reconciliation?.refundDue > 0 && b.reconciliation.status === 'awaiting_customer' && (
                <div className="refund-choice">
                  <p><strong>{naira(b.reconciliation.refundDue)}</strong> will be returned. How would you like it?</p>
                  <div className="btn-row">
                    <Button className="btn--sm" onClick={() => act('r', () => bookingApi.refundChoice(b.reference, 'refund'))}>Refund to my bank</Button>
                    <Button className="btn--sm" variant="gold" onClick={() => act('c', () => bookingApi.refundChoice(b.reference, 'credit'))}>Keep as credit</Button>
                  </div>
                </div>
              )}
              <Link to="/app/bookings/new" className="btn btn--primary btn--sm">Book another date</Link>
            </section>
          )}
          {b.purchase && <ReceiptCard b={b} refresh={refresh} setError={setActionError} />}
          {b.actions.canProceedFromSample && (
            <section className="card card--action">
              <h2>Ready to buy?</h2>
              <p className="muted">Turn this sample run into a full shop. You’ll review the list, quantities and spending limit before anything is bought.</p>
              <Button variant="accent" onClick={() => navigate(`/app/bookings/new?repeat=${b.reference}`)}>Create a full shop from these samples</Button>
            </section>
          )}

          <section className="card">
            <header className="card__head"><h2>Your request</h2><span className="muted small">{b.items.length} items</span></header>
            <ul className="req-lines">
              {b.items.map((i) => (
                <li key={i.id}>
                  <div><strong>{i.itemName}</strong><div className="muted small">{lineRequestText(i)}{i.preferences && ` · “${i.preferences}”`}</div></div>
                  {b.bookingType === 'full_purchase' && <span>{nairaRange(i.estimateMin, i.estimateMax)}</span>}
                </li>
              ))}
            </ul>
            {b.bookingType === 'full_purchase' && (
              <KeyValue rows={[['Goods estimate', nairaRange(b.goodsEstimateMin, b.goodsEstimateMax)], ['Your budget', naira(b.intendedGoodsBudget)], ['Spending limit', naira(b.authorizedGoodsLimit), true]]} />
            )}
            {b.customerNotes && <p className="muted small">Your note: “{b.customerNotes}”</p>}
          </section>
        </div>

        <div className="stack">
          {b.address && (
            <section className="card">
              <h2 className="card__h">Delivery</h2>
              <p><strong>{b.address.label}</strong> · {b.address.area}<br />{b.address.addressLine}{b.address.landmark && <><br /><span className="muted small">{b.address.landmark}</span></>}</p>
              <p className="muted small">{b.address.recipientName} · {b.address.recipientPhone}</p>
            </section>
          )}
          <Photos b={b} />
          {b.source && <section className="card"><p className="small">Created from sample run <Link to={`/app/bookings/${b.source.reference}`}>{b.source.reference}</Link></p></section>}
          {b.linked.length > 0 && <section className="card"><p className="small">Follow-on shop: {b.linked.map((l) => <Link key={l.reference} to={`/app/bookings/${l.reference}`}>{l.reference}</Link>)}</p></section>}

          <section className="card">
            <h2 className="card__h">Timeline</h2>
            <ol className="timeline">
              {b.timeline.map((t, i) => (
                <li key={i}><strong>{t.label}</strong><span className="muted small">{fmtDateTime(t.at)}{t.reason ? ` · ${t.reason}` : ''}</span></li>
              ))}
            </ol>
          </section>

          <section className="card stack-sm">
            <Button variant="secondary" className="btn--sm btn--block" onClick={() => { setListName(`${b.market.name} list`); setDialog('save'); }}>Save as a reusable list</Button>
            {b.status === 'completed' && b.bookingType === 'full_purchase' && <Link className="btn btn--ghost btn--sm btn--block" to={`/app/bookings/new?repeat=${b.reference}`}>Book this again</Link>}
            {b.actions.canCancel && <Button variant="ghost" className="btn--sm btn--block danger-text" onClick={() => setDialog('cancel')}>Cancel booking</Button>}
          </section>
        </div>
      </div>

      <Confirm open={dialog === 'cancel'} title="Cancel this booking?" tone="primary" confirmLabel="Yes, cancel" busy={busy === 'cancel'} onClose={() => setDialog(null)} needsReason={false}
        onConfirm={() => act('cancel', () => bookingApi.cancel(b.reference, null))}>
        <p>{b.status === 'paid' ? 'You’ve already paid. The full amount will come back to you as a refund or credit — your choice.' : 'Your date will be released. You haven’t been charged.'}</p>
      </Confirm>
      <Confirm open={dialog === 'revise'} title="Ask Jojo for a revised quote" confirmLabel="Send" busy={busy === 'revise'} onClose={() => setDialog(null)} needsReason reasonLabel="What would you like changed?"
        onConfirm={(reason) => act('revise', () => bookingApi.requestRevision(b.reference, reason))}>
        <p className="muted">Jojo will review again and send a new quote.</p>
      </Confirm>
      <Modal open={dialog === 'save'} onClose={() => setDialog(null)} title="Save as a list" footer={(
        <>
          <Button variant="ghost" className="btn--sm" onClick={() => setDialog(null)}>Cancel</Button>
          <Button className="btn--sm" loading={busy === 'save'} disabled={!listName.trim()} onClick={() => act('save', async () => { await bookingApi.saveAsList(b.reference, listName.trim()); setNotice('Saved to your lists.'); })}>Save list</Button>
        </>
      )}>
        <TextInput label="List name" value={listName} onChange={(e) => setListName(e.target.value)} maxLength={80} />
      </Modal>
    </>
  );
}
