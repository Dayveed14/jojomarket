import { DishArt } from '../../components/kitchen/DishArt';
import { Link, useLocation } from 'react-router-dom';
import { ErrorState, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { Alert, Avatar, EmptyState, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import ResendVerification from '../../components/ResendVerification';
import { meApi } from '../../services/api';
import { naira } from '../../utils/format';
import { BookingRow } from './Bookings';

const greeting = () => {
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', hourCycle: 'h23' }).format(new Date()));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { state } = useLocation();
  const { data, error, loading, reload } = useAsync(() => meApi.dashboard(), []);
  const addresses = useAsync(() => meApi.addresses().then((r) => r.items), []);
  const firstName = user.displayName.split(' ')[0];

  const checklist = [
    { done: user.emailVerified, label: 'Confirm your email' },
    { done: Boolean(addresses.data?.length), label: 'Save a delivery address', to: '/app/addresses' },
    { done: Boolean(user.phone), label: 'Add a phone number for shopping day', to: '/app/settings' },
    { done: Boolean(user.householdSize), label: 'Household size (for restock reminders)', to: '/app/settings' },
  ];
  const doneCount = checklist.filter((c) => c.done).length;


  return (
    <>
      <Seo title="My dashboard" noindex />
      <section className="dash-hero">
        <div className="dash-hero__who">
          <Avatar user={user} size={56} />
          <div><p className="dash-hero__hello">{greeting()},</p><h1 className="dash-hero__name">{firstName}</h1></div>
        </div>
        <Link to="/app/bookings/new" className="btn btn--accent">+ New booking</Link>
      </section>

      {state?.welcome && <Alert tone="success" title="Welcome to Jojo Market!">Your account is ready.</Alert>}
      {!user.emailVerified && (
        <Alert tone="warning" title="Please confirm your email">
          We sent a link to <strong>{user.email}</strong> — we use it for quotes, receipts and reminders. Can’t find it? Check spam, or{' '}
          <ResendVerification label="send a new link" />
        </Alert>
      )}
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !data ? <Spinner /> : data && (
        <>
          {data.counts.waitingOnYou > 0 && (
            <Alert tone="warning" title={`${data.counts.waitingOnYou} booking${data.counts.waitingOnYou > 1 ? 's need' : ' needs'} your attention`}>
              A quote to accept, a payment, or a question from Jojo. See below.
            </Alert>
          )}
          <Link to="/app/kitchen" className="k-teaser">
            <div>
              <h2>Hungry? Jojo cooks too.</h2>
              <p>Jollof, egusi, ofada, small chops and party trays — cooked fresh, your way, delivered.</p>
              <span className="btn btn--accent btn--sm">Order from Jojo’s Kitchen</span>
            </div>
            <DishArt dish="jollof" steam />
          </Link>
          <div className="stat-row">
            <div className="stat"><span className="stat__label">Active bookings</span><span className="stat__value">{data.counts.upcoming}</span></div>
            <div className={`stat${data.counts.waitingOnYou ? ' stat--orange' : ''}`}><span className="stat__label">Waiting on you</span><span className="stat__value">{data.counts.waitingOnYou}</span><span className="stat__hint">Quotes, payments &amp; approvals</span></div>
            <div className="stat"><span className="stat__label">Completed shops</span><span className="stat__value">{data.counts.completed}</span></div>
            <Link to="/app/purchases" className="stat stat--gold"><span className="stat__label">Jojo Market credit</span><span className="stat__value">{naira(data.creditBalance)}</span></Link>
          </div>

          <div className="dash-grid">
            <section className="card card--span2">
              <header className="card__head"><h2>Your bookings</h2><Link to="/app/bookings" className="link-sm">View all</Link></header>
              {data.active.length ? (
                <ul className="booking-list">{data.active.map((b) => <BookingRow key={b.reference} b={b} to={`/app/bookings/${b.reference}`} />)}</ul>
              ) : (
                <div className="book-options">
                  <Link to="/app/bookings/new?type=full_purchase" className="book-option book-option--green">
                    <span className="book-option__emoji" aria-hidden="true">🧺</span><strong>Full shopping</strong><span>Send your list — Jojo buys, records and delivers.</span>
                  </Link>
                  <Link to="/app/bookings/new?type=sample_run" className="book-option book-option--cream">
                    <span className="book-option__emoji" aria-hidden="true">🔍</span><strong>Sample run</strong><span>See prices, photos and quality before committing.</span>
                  </Link>
                </div>
              )}
            </section>

            <section className="card">
              <header className="card__head"><h2>Running low?</h2><Link to="/app/restocking" className="link-sm">Restocking</Link></header>
              {data.restock.tracked === 0 ? (
                <p className="muted small">After your first shop, we’ll estimate when staples like rice and oil may run low.</p>
              ) : data.restock.likelyLow === 0 ? (
                <p className="muted">You’re probably well stocked. We’re tracking {data.restock.tracked} items.</p>
              ) : (
                <>
                  <p><strong>{data.restock.likelyLow}</strong> item{data.restock.likelyLow > 1 ? 's' : ''} may be running low:</p>
                  <ul className="mini-list">{data.restock.next.filter((e) => e.likelyLow).map((e) => <li key={e.id}><span aria-hidden="true">{e.icon}</span> {e.label}</li>)}</ul>
                  <Link to="/app/bookings/new?type=full_purchase" className="btn btn--accent btn--sm">Plan a shop</Link>
                </>
              )}
            </section>

            {doneCount < checklist.length && (
              <section className="card">
                <header className="card__head"><h2>Get set up</h2><span className="muted">{doneCount}/{checklist.length}</span></header>
                <div className="progress" aria-hidden="true"><span style={{ width: `${(doneCount / checklist.length) * 100}%` }} /></div>
                <ul className="checklist">
                  {checklist.map((c) => (
                    <li key={c.label} className={c.done ? 'is-done' : ''}>
                      <span className="checklist__tick" aria-hidden="true">{c.done ? '✓' : ''}</span>
                      {c.done || !c.to ? c.label : <Link to={c.to}>{c.label}</Link>}
                      {!c.done && c.label === 'Confirm your email' && <> · <ResendVerification label="resend" /></>}
                      <span className="sr-only">{c.done ? '(done)' : '(to do)'}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="card card--span2">
              <header className="card__head"><h2>Recent shops</h2><Link to="/app/purchases" className="link-sm">Receipts</Link></header>
              {data.recent.length ? (
                <ul className="booking-list">{data.recent.map((b) => <BookingRow key={b.reference} b={b} to={`/app/bookings/${b.reference}`} />)}</ul>
              ) : <EmptyState icon="🧾" title="No completed shops yet">Itemised receipts will appear here after each market run.</EmptyState>}
            </section>

            <section className="card card--tint">
              <header className="card__head"><h2>How your money is protected</h2></header>
              <ul className="money-rules">
                <li><strong>You pay after the quote.</strong> Jojo reviews first; nothing is charged before you accept.</li>
                <li><strong>Your limit is final.</strong> Anything above it needs your approval.</li>
                <li><strong>Leftovers come back.</strong> Refund to your bank or keep as credit — you choose.</li>
              </ul>
            </section>
          </div>
        </>
      )}
    </>
  );
}
