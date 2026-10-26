import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Confirm, ErrorState, KeyValue, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { Alert, Button, EmptyState, Spinner } from '../../components/ui';
import { adminApi } from '../../services/api';
import { fmtDate, naira } from '../../utils/format';
import { BookingRow } from '../customer/Bookings';

export default function Customers() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const page = Number(params.get('page') || 1);
  const [search, setSearch] = useState(q);
  const { data, error, loading, reload } = useAsync(() => adminApi.customers({ q, page }), [q, page]);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <Seo title="Customers" noindex />
      <header className="page-head page-head--row">
        <div><h1>Customers</h1><p className="muted">{data ? `${data.total} ${data.total === 1 ? 'customer' : 'customers'}` : ' '}</p></div>
        <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); setParams(search ? { q: search } : {}); }}>
          <label htmlFor="cust-q" className="sr-only">Search customers</label>
          <input id="cust-q" className="input" placeholder="Name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn--primary btn--sm" type="submit">Search</button>
        </form>
      </header>
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !data ? <Spinner /> : data && (data.items.length === 0 ? (
        <div className="card"><EmptyState icon="🔎" title={q ? 'No matches' : 'No customers yet'}>{q ? 'Try a different name, email or phone.' : 'New sign-ups will appear here.'}</EmptyState></div>
      ) : (
        <div className="card card--flush">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Shops</th><th>Joined</th><th>Status</th></tr></thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id}>
                    <td><Link to={`/admin/customers/${c.id}`}><strong>{c.displayName}</strong></Link></td>
                    <td>{c.email} {!c.emailVerified && <span className="pill">unconfirmed</span>}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.completedCount}/{c.bookingCount}</td>
                    <td>{fmtDate(c.createdAt)}</td>
                    <td><span className={`pill ${c.status === 'active' ? 'pill--green' : 'pill--red'}`}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <nav className="pager" aria-label="Pagination">
              <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setParams({ ...(q ? { q } : {}), page: String(page - 1) })}>← Previous</button>
              <span>Page {page} of {pages}</span>
              <button className="btn btn--ghost btn--sm" disabled={page >= pages} onClick={() => setParams({ ...(q ? { q } : {}), page: String(page + 1) })}>Next →</button>
            </nav>
          )}
        </div>
      ))}
    </>
  );
}

export function CustomerDetail() {
  const { id } = useParams();
  const { data, error, loading, reload, setData } = useAsync(() => adminApi.customer(id).then((r) => r.customer), [id]);
  const [dialog, setDialog] = useState(false);
  const [err, setErr] = useState('');
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const c = data;
  const next = c.status === 'active' ? 'suspended' : 'active';
  return (
    <>
      <Seo title={c.displayName} noindex />
      <nav className="crumbs"><Link to="/admin/customers">Customers</Link> <span aria-hidden="true">›</span> {c.displayName}</nav>
      <header className="page-head page-head--row">
        <div><h1>{c.displayName}</h1><p className="muted">Customer since {fmtDate(c.createdAt)}</p></div>
        <span className={`pill ${c.status === 'active' ? 'pill--green' : 'pill--red'}`}>{c.status}</span>
      </header>
      {err && <Alert tone="error">{err}</Alert>}
      <div className="dash-grid">
        <section className="card">
          <KeyValue rows={[
            ['Email', <a key="e" href={`mailto:${c.email}`}>{c.email}</a>], ['Email confirmed', c.emailVerified ? 'Yes' : 'No'],
            ['Phone', c.phone || '—'], ['Household', c.householdSize || '—'], ['Last sign-in', fmtDate(c.lastLoginAt)], ['Credit balance', naira(c.creditBalance)],
          ]} />
          <Button variant="ghost" className={`btn--sm${next === 'suspended' ? ' danger-text' : ''}`} onClick={() => setDialog(true)}>{next === 'suspended' ? 'Suspend account' : 'Reactivate account'}</Button>
        </section>
        <section className="card card--span2">
          <header className="card__head"><h2>Bookings</h2><span className="muted small">{c.bookings.length}</span></header>
          {c.bookings.length ? <ul className="booking-list">{c.bookings.map((b) => <BookingRow key={b.reference} b={b} to={`/admin/bookings/${b.reference}`} />)}</ul> : <p className="muted">No bookings yet.</p>}
        </section>
      </div>
      <Confirm open={dialog} title={next === 'suspended' ? 'Suspend this customer?' : 'Reactivate this customer?'} confirmLabel={next === 'suspended' ? 'Suspend' : 'Reactivate'} needsReason onClose={() => setDialog(false)}
        onConfirm={async (reason) => { try { setData((await adminApi.setCustomerStatus(c.id, next, reason)).customer); } catch (e) { setErr(e.message); } setDialog(false); }}>
        <p className="muted">{next === 'suspended' ? 'They will be signed out everywhere and can’t sign in or book.' : 'They can sign in and book again.'} This is recorded in the audit log.</p>
      </Confirm>
    </>
  );
}
