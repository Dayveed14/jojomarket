import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ErrorState, Tabs, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { EmptyState, Spinner } from '../../components/ui';
import { adminApi } from '../../services/api';
import { BookingRow } from '../customer/Bookings';

const SCOPES = [
  { value: 'review', label: 'To review' }, { value: 'customer', label: 'Waiting on customer' }, { value: 'scheduled', label: 'Paid & scheduled' },
  { value: 'active', label: 'Shopping' }, { value: 'completed', label: 'Completed' }, { value: 'closed', label: 'Closed' }, { value: '', label: 'All' },
];

export default function AdminBookings() {
  const [params, setParams] = useSearchParams();
  const scope = params.get('scope') ?? 'review';
  const q = params.get('q') || '';
  const type = params.get('type') || '';
  const page = Number(params.get('page') || 1);
  const [search, setSearch] = useState(q);
  const { data, error, loading, reload } = useAsync(() => adminApi.bookings({ scope: scope || undefined, q, type, page }), [scope, q, type, page]);
  const update = (patch) => {
    const next = { scope, q, type, page: 1, ...patch };
    const p = { scope: next.scope }; // keep scope even when '' (= All)
    if (next.q) p.q = next.q;
    if (next.type) p.type = next.type;
    if (next.page > 1) p.page = String(next.page);
    setParams(p);
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <>
      <Seo title="Booking queue" noindex />
      <header className="page-head page-head--row">
        <div><h1>Booking queue</h1><p className="muted">{data ? `${data.total} booking${data.total === 1 ? '' : 's'}` : ' '}</p></div>
        <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); update({ q: search }); }}>
          <label htmlFor="bq" className="sr-only">Search</label>
          <input id="bq" className="input" placeholder="Reference, name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input" aria-label="Type" value={type} onChange={(e) => update({ type: e.target.value })} style={{ width: 'auto' }}>
            <option value="">All types</option><option value="full_purchase">Full shopping</option><option value="sample_run">Sample runs</option>
          </select>
          <button className="btn btn--primary btn--sm" type="submit">Search</button>
        </form>
      </header>
      <Tabs value={scope} onChange={(v) => update({ scope: v })} tabs={SCOPES} label="Queue" />
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !data ? <Spinner /> : data && (data.items.length ? (
        <div className="card card--flush">
          <ul className="booking-list">{data.items.map((b) => <BookingRow key={b.reference} b={b} to={`/admin/bookings/${b.reference}`} />)}</ul>
          {pages > 1 && (
            <nav className="pager" aria-label="Pagination">
              <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>← Previous</button>
              <span>Page {page} of {pages}</span>
              <button className="btn btn--ghost btn--sm" disabled={page >= pages} onClick={() => update({ page: page + 1 })}>Next →</button>
            </nav>
          )}
        </div>
      ) : <div className="card"><EmptyState icon="✅" title="All clear">Nothing in this queue right now.</EmptyState></div>)}
    </>
  );
}
