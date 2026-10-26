import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, StatusBadge, Tabs, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { EmptyState, Spinner } from '../../components/ui';
import { bookingApi } from '../../services/api';
import { BOOKING_TYPES, nairaRange } from '../../utils/format';

export function BookingRow({ b, to }) {
  return (
    <li>
      <Link to={to} className="booking-row">
        <span className="booking-row__date">
          <strong>{new Date(`${b.serviceDate}T12:00:00Z`).getUTCDate()}</strong>
          <span>{new Date(`${b.serviceDate}T12:00:00Z`).toLocaleString('en-NG', { month: 'short', timeZone: 'UTC' })}</span>
        </span>
        <span className="booking-row__main">
          <strong>{b.market.name}</strong>
          <span className="muted small">{BOOKING_TYPES[b.bookingType]} · <span className="mono">{b.reference}</span>{b.customerName && to.startsWith('/admin') ? ` · ${b.customerName}` : ''}</span>
        </span>
        {b.bookingType === 'full_purchase' && b.goodsEstimateMax > 0 && <span className="booking-row__amt">{nairaRange(b.goodsEstimateMin, b.goodsEstimateMax)}</span>}
        <StatusBadge status={b.status} label={b.statusLabel} />
      </Link>
    </li>
  );
}

export default function Bookings() {
  const [scope, setScope] = useState('active');
  const { data, error, loading, reload } = useAsync(() => bookingApi.list(scope).then((r) => r.items), [scope]);

  return (
    <>
      <Seo title="My bookings" noindex />
      <header className="page-head page-head--row">
        <div><h1>My bookings</h1><p className="muted">Track quotes, payments and shopping days.</p></div>
        <Link to="/app/bookings/new" className="btn btn--accent btn--sm">+ New booking</Link>
      </header>
      <Tabs value={scope} onChange={setScope} label="Booking status" tabs={[
        { value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }, { value: 'closed', label: 'Cancelled & expired' },
      ]} />
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !data ? <Spinner /> : data && (
        data.length ? <ul className="booking-list card card--flush">{data.map((b) => <BookingRow key={b.reference} b={b} to={`/app/bookings/${b.reference}`} />)}</ul>
          : <div className="card"><EmptyState icon="🧺" title={scope === 'active' ? 'No active bookings' : 'Nothing here yet'} action={<Link to="/app/bookings/new" className="btn btn--primary btn--sm">Book a market run</Link>}>
            {scope === 'active' ? 'When you send Jojo a list, you can follow it here.' : 'Past bookings will show here.'}
          </EmptyState></div>
      )}
    </>
  );
}
