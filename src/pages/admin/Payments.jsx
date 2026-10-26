import { Link, useSearchParams } from 'react-router-dom';
import { ErrorState, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { EmptyState, Spinner } from '../../components/ui';
import { adminApi } from '../../services/api';
import { fmtDateTime, naira } from '../../utils/format';

const TYPE = { charge: 'Payment', additional_charge: 'Balance', refund: 'Refund', credit_issued: 'Credit issued', credit_applied: 'Credit used' };
const REC = { awaiting_customer: 'Customer to choose refund/credit', refund_pending: 'Send refund', additional_due: 'Customer owes balance', disputed: 'Disputed' };

export default function Payments() {
  const [params, setParams] = useSearchParams();
  const filters = { status: params.get('status') || '', provider: params.get('provider') || '', type: params.get('type') || '', page: Number(params.get('page') || 1) };
  const { data, error, loading, reload } = useAsync(() => adminApi.payments(filters), [filters.status, filters.provider, filters.type, filters.page]);
  const set = (k) => (e) => setParams(Object.fromEntries(Object.entries({ ...filters, [k]: e.target.value, page: '' }).filter(([, v]) => v)));

  return (
    <>
      <Seo title="Payments" noindex />
      <header className="page-head"><h1>Payments &amp; reconciliation</h1><p className="muted">Every charge, refund and credit. Successful records are never edited.</p></header>
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !data ? <Spinner /> : data && (
        <div className="stack">
          {data.openReconciliations.length > 0 && (
            <section className="card card--action">
              <header className="card__head"><h2>Needs attention</h2></header>
              <ul className="mini-list">
                {data.openReconciliations.map((r) => (
                  <li key={r.reference}><Link to={`/admin/bookings/${r.reference}`}><span className="mono">{r.reference}</span> · {r.customerName}</Link><span>{REC[r.status]} · {naira(r.refundDue || r.additionalDue)}</span></li>
                ))}
              </ul>
            </section>
          )}
          <div className="filters">
            <select className="input input--sm" aria-label="Status" value={filters.status} onChange={set('status')}>
              <option value="">Any status</option>{['pending', 'successful', 'failed', 'initiated'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="input input--sm" aria-label="Method" value={filters.provider} onChange={set('provider')}>
              <option value="">Any method</option><option value="manual">Bank transfer</option><option value="paystack">Paystack</option><option value="credit">Credit</option>
            </select>
            <select className="input input--sm" aria-label="Type" value={filters.type} onChange={set('type')}>
              <option value="">Any type</option>{Object.entries(TYPE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {data.items.length ? (
            <div className="card card--flush">
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>When</th><th>Booking</th><th>Customer</th><th>Type</th><th>Method</th><th>Status</th><th className="num">Amount</th></tr></thead>
                  <tbody>
                    {data.items.map((t) => (
                      <tr key={t.id}>
                        <td>{fmtDateTime(t.verifiedAt || t.createdAt)}</td>
                        <td>{t.bookingReference ? <Link to={`/admin/bookings/${t.bookingReference}`} className="mono">{t.bookingReference}</Link> : '—'}</td>
                        <td>{t.customerName}</td>
                        <td>{TYPE[t.type]}</td>
                        <td>{{ manual: 'Transfer', paystack: 'Paystack', credit: 'Credit' }[t.provider]}{t.payerNote && <div className="muted small">{t.payerNote}</div>}</td>
                        <td><span className={`pill ${t.status === 'successful' ? 'pill--green' : t.status === 'failed' ? 'pill--red' : ''}`}>{t.status}</span></td>
                        <td className="num">{naira(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : <div className="card"><EmptyState icon="₦" title="No transactions">Nothing matches these filters.</EmptyState></div>}
        </div>
      )}
    </>
  );
}
