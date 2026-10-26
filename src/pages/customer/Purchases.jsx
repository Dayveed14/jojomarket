import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, Tabs, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { EmptyState, Spinner } from '../../components/ui';
import { bookingApi, meApi } from '../../services/api';
import { fmtDateTime, naira } from '../../utils/format';
import { BookingRow } from './Bookings';

const TYPE_LABEL = { charge: 'Payment', additional_charge: 'Balance payment', refund: 'Refund to you', credit_issued: 'Credit added', credit_applied: 'Credit used' };
const PROVIDER = { paystack: 'Paystack', manual: 'Bank transfer', credit: 'Jojo credit' };

export default function Purchases() {
  const [tab, setTab] = useState('shops');
  const shops = useAsync(() => bookingApi.list('completed').then((r) => r.items), []);
  const pays = useAsync(() => meApi.payments(), []);

  return (
    <>
      <Seo title="Purchases & payments" noindex />
      <header className="page-head page-head--row">
        <div><h1>Purchases &amp; payments</h1><p className="muted">Itemised receipts for every shop, and every naira in and out.</p></div>
        {pays.data && <div className="stat stat--gold stat--inline"><span className="stat__label">Jojo Market credit</span><span className="stat__value">{naira(pays.data.creditBalance)}</span></div>}
      </header>
      <Tabs value={tab} onChange={setTab} label="View" tabs={[{ value: 'shops', label: 'Completed shops' }, { value: 'payments', label: 'Payments & credit' }]} />

      {tab === 'shops' && (shops.error ? <ErrorState error={shops.error} onRetry={shops.reload} /> : !shops.data ? <Spinner /> : shops.data.length ? (
        <ul className="booking-list card card--flush">{shops.data.map((b) => <BookingRow key={b.reference} b={b} to={`/app/bookings/${b.reference}`} />)}</ul>
      ) : <div className="card"><EmptyState icon="🧾" title="No completed shops yet" action={<Link to="/app/bookings/new" className="btn btn--primary btn--sm">Book a market run</Link>}>Your receipts will appear here after each shop.</EmptyState></div>)}

      {tab === 'payments' && (pays.error ? <ErrorState error={pays.error} onRetry={pays.reload} /> : !pays.data ? <Spinner /> : pays.data.items.length ? (
        <div className="card card--flush">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Booking</th><th>What</th><th>Method</th><th>Status</th><th className="num">Amount</th></tr></thead>
              <tbody>
                {pays.data.items.map((t) => (
                  <tr key={t.id}>
                    <td>{fmtDateTime(t.verifiedAt || t.createdAt)}</td>
                    <td>{t.bookingReference ? <Link to={`/app/bookings/${t.bookingReference}`} className="mono">{t.bookingReference}</Link> : '—'}</td>
                    <td>{TYPE_LABEL[t.type]}</td>
                    <td>{PROVIDER[t.provider]}</td>
                    <td><span className={`pill ${t.status === 'successful' ? 'pill--green' : ''}`}>{t.status === 'successful' ? 'Confirmed' : 'Awaiting confirmation'}</span></td>
                    <td className={`num ${['refund', 'credit_issued'].includes(t.type) ? 'pos' : ''}`}>{['refund', 'credit_issued'].includes(t.type) ? '+' : ''}{naira(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : <div className="card"><EmptyState icon="₦" title="No payments yet">Payments appear here once Jojo confirms them.</EmptyState></div>)}
    </>
  );
}
