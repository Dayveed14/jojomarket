import { Link } from 'react-router-dom';
import { ErrorState, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { EmptyState, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/api';
import { fmtDate } from '../../utils/format';
import { BookingRow } from '../customer/Bookings';

const ACTION_LABELS = {
  'auth.register': 'New sign-ups', 'auth.login': 'Customer sign-ins', 'auth.operator_login': 'Operator sign-ins',
  'auth.login_failed': 'Failed sign-ins', 'auth.refresh_reuse_detected': 'Suspicious session reuse',
  'booking.submitted': 'Requests received', 'quote.proposed': 'Quotes sent', 'quote.accepted': 'Quotes accepted',
  'payment.manual_confirmed': 'Transfers confirmed', 'payment.verified': 'Online payments', 'booking.completed': 'Shops completed',
  'booking.cancelled': 'Cancellations', 'booking.extra_spend_approved': 'Extra spend approved', 'payment.amount_mismatch': 'Payment mismatches',
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(() => adminApi.dashboard(), []);
  const today = new Date().toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <Seo title="Operations" noindex />
      <header className="page-head page-head--row">
        <div><p className="eyebrow">{today}</p><h1>Hello, {user.displayName.split(' ')[0]}</h1></div>
        <Link to="/admin/calendar" className="btn btn--secondary btn--sm">Calendar</Link>
      </header>
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !data ? <Spinner /> : data && (
        <>
          <div className="queue queue--big">
            <Link to="/admin/bookings?scope=review" className={`queue__item${data.queue.toReview ? ' is-hot' : ''}`}><span>To review</span><strong>{data.queue.toReview}</strong></Link>
            <Link to="/admin/payments?status=pending&provider=manual" className={`queue__item${data.queue.pendingTransfers ? ' is-hot' : ''}`}><span>Transfers to confirm</span><strong>{data.queue.pendingTransfers}</strong></Link>
            <Link to="/admin/bookings?scope=customer" className="queue__item"><span>Waiting on customers</span><strong>{data.queue.awaitingCustomer + data.queue.awaitingPayment}</strong></Link>
            <Link to="/admin/bookings?scope=active" className="queue__item"><span>Shopping / delivering</span><strong>{data.queue.inProgress}</strong></Link>
            <Link to="/admin/payments" className={`queue__item${data.queue.openReconciliations ? ' is-hot' : ''}`}><span>Refunds &amp; balances</span><strong>{data.queue.openReconciliations}</strong></Link>
          </div>

          <div className="dash-grid">
            <section className="card card--span2">
              <header className="card__head"><h2>Today’s market runs</h2><Link to="/admin/bookings?scope=scheduled" className="link-sm">Scheduled</Link></header>
              {data.today.length ? <ul className="booking-list">{data.today.map((b) => <BookingRow key={b.reference} b={b} to={`/admin/bookings/${b.reference}`} />)}</ul>
                : <EmptyState icon="☀️" title="Nothing booked today">Enjoy the day — or check the queue for new requests.</EmptyState>}
            </section>
            <section className="card">
              <header className="card__head"><h2>Customers</h2><Link to="/admin/customers" className="link-sm">All</Link></header>
              <ul className="mini-list">
                <li><span>Total</span><strong>{data.customers.total}</strong></li>
                <li><span>New this week</span><strong>{data.customers.newThisWeek}</strong></li>
                <li><span>Email unconfirmed</span><strong>{data.customers.unverified}</strong></li>
              </ul>
              <h3 className="review__h">Newest</h3>
              <ul className="mini-list">{data.recentCustomers.map((c) => <li key={c.id}><Link to={`/admin/customers/${c.id}`}>{c.displayName}</Link><span className="muted small">{fmtDate(c.createdAt)}</span></li>)}</ul>
            </section>
            <section className="card card--span2">
              <header className="card__head"><h2>Coming up (next 14 days)</h2><Link to="/admin/bookings" className="link-sm">Queue</Link></header>
              {data.upcoming.length ? <ul className="booking-list">{data.upcoming.map((b) => <BookingRow key={b.reference} b={b} to={`/admin/bookings/${b.reference}`} />)}</ul>
                : <p className="muted">No upcoming paid or quoted bookings.</p>}
            </section>
            <section className="card">
              <header className="card__head"><h2>Last 7 days</h2><Link to="/admin/audit-log" className="link-sm">Audit log</Link></header>
              {data.activity.length ? (
                <ul className="activity">{data.activity.map((a) => (
                  <li key={a.action} className={/failed|reuse|mismatch/.test(a.action) ? 'is-warn' : ''}><span>{ACTION_LABELS[a.action] || a.action}</span><strong>{a.total}</strong></li>
                ))}</ul>
              ) : <p className="muted">No activity yet.</p>}
            </section>
          </div>
        </>
      )}
    </>
  );
}
