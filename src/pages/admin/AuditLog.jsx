import { useSearchParams } from 'react-router-dom';
import { ErrorState, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { Spinner } from '../../components/ui';
import { adminApi } from '../../services/api';
import { fmtDateTime } from '../../utils/format';

const GROUPS = [['', 'Everything'], ['auth', 'Sign-ins'], ['booking', 'Bookings'], ['quote', 'Quotes'], ['payment', 'Payments'], ['reconciliation', 'Refunds & credit'], ['catalog', 'Catalogue'], ['settings', 'Settings'], ['customer', 'Customers']];

export default function AuditLog() {
  const [params, setParams] = useSearchParams();
  const action = params.get('action') || '';
  const page = Number(params.get('page') || 1);
  const { data, error, loading, reload } = useAsync(() => adminApi.auditLog({ action, page, pageSize: 50 }), [action, page]);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  return (
    <>
      <Seo title="Audit log" noindex />
      <header className="page-head page-head--row">
        <div><h1>Audit log</h1><p className="muted">Sensitive actions: who, what and when. Passwords, tokens and full addresses are never logged.</p></div>
        <select className="input input--sm" aria-label="Filter" value={action} onChange={(e) => setParams(e.target.value ? { action: e.target.value } : {})} style={{ width: 'auto' }}>
          {GROUPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </header>
      {error && <ErrorState error={error} onRetry={reload} />}
      {loading && !data ? <Spinner /> : data && (
        <div className="card card--flush">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>When</th><th>Who</th><th>Action</th><th>On</th><th>Details</th></tr></thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id}>
                    <td>{fmtDateTime(r.createdAt)}</td>
                    <td>{r.actor}</td>
                    <td><code>{r.action}</code></td>
                    <td className="muted small">{r.entityType ? `${r.entityType} ${r.entityId ?? ''}` : '—'}</td>
                    <td className="muted small wrap">{[r.reason, r.metadata && Object.entries(r.metadata).map(([k, v]) => `${k}: ${v}`).join(', ')].filter(Boolean).join(' · ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <nav className="pager" aria-label="Pagination">
              <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => setParams({ ...(action ? { action } : {}), page: String(page - 1) })}>← Newer</button>
              <span>Page {page} of {pages}</span>
              <button className="btn btn--ghost btn--sm" disabled={page >= pages} onClick={() => setParams({ ...(action ? { action } : {}), page: String(page + 1) })}>Older →</button>
            </nav>
          )}
        </div>
      )}
    </>
  );
}
