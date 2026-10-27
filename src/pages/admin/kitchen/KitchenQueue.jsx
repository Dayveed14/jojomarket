import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, Tabs, useAsync } from '../../../components/common';
import { DishArt } from '../../../components/kitchen/DishArt';
import Seo from '../../../components/Seo';
import { EmptyState, Spinner } from '../../../components/ui';
import { adminKitchenApi } from '../../../services/api';
import { fmtDay } from '../../../utils/format';
import { SPICE, lagosNow } from '../../../utils/kitchen';
import { KitchenOrderRow } from '../../customer/kitchen/KitchenOrders';

function CookingSheet() {
  const [date, setDate] = useState(lagosNow().date);
  const { data, error, loading, reload } = useAsync(() => adminKitchenApi.sheet(date), [date]);
  const pct = data?.load.capacity ? Math.min(100, Math.round((data.load.portions / data.load.capacity) * 100)) : 0;
  return (
    <section className="stack">
      <div className="card">
        <div className="page-head--row" style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
          <label className="field" style={{ margin: 0 }}>
            <span className="field__label">Cooking day</span>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          {data && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="muted small">{data.load.portions} of {data.load.capacity} portions · {data.load.orders} of {data.load.maxOrders} orders</div>
              <div className="k-capbar"><span style={{ width: `${pct}%` }} /></div>
            </div>
          )}
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => window.print()}>Print sheet</button>
        </div>
      </div>
      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && !data.orders.length && <EmptyState icon="🍳" title={`Nothing to cook on ${fmtDay(date)}`}>Paid orders for this day will appear here.</EmptyState>}
      {data?.orders.length > 0 && (
        <>
          <section className="card">
            <h2>Cook in total</h2>
            {data.dishes.map((d) => (
              <div key={`${d.meal}${d.option}`} className="k-sheet-dish">
                <span><strong>{d.quantity} × {d.meal}</strong> <span className="muted">({d.option})</span></span>
                {d.special > 0 && <span className="k-pill k-pill--warn">{d.special} special</span>}
              </div>
            ))}
          </section>
          {data.orders.map((o) => (
            <section key={o.reference} className="card">
              <header className="card__head">
                <h3><Link to={`/admin/kitchen/orders/${o.reference}`}>{o.reference}</Link> · {o.customerName} · {o.area}</h3>
                <span className="muted small">{o.deliveryText}</span>
              </header>
              {o.allergyNotes && <div className="k-allergy" style={{ marginBottom: 8 }}>⚠ Allergy: {o.allergyNotes}</div>}
              <ul className="plain-list">
                {o.items.map((i, n) => (
                  <li key={n}>
                    <strong>{i.quantity} × {i.meal}</strong> ({i.option}){' '}
                    {i.exclusions.map((e) => <span key={e} className="k-pill">{e}</span>)}
                    {i.spice && <span className="k-pill k-pill--hot">{SPICE[i.spice]}</span>}
                    {i.instructions && <div className="muted small">“{i.instructions}”</div>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </section>
  );
}

export default function KitchenQueue() {
  const [scope, setScope] = useState('express');
  const { data, error, loading, reload } = useAsync(() => (scope === 'sheet' ? Promise.resolve(null) : adminKitchenApi.orders({ scope, pageSize: 50 })), [scope]);
  return (
    <div className="k-scope">
      <Seo title="Kitchen orders" noindex />
      <section className="k-banner">
        <div>
          <h1>Jojo’s Kitchen</h1>
          <p>Approve express requests, follow today’s cooking and move orders along.</p>
          <div className="k-banner__actions">
            <Link to="/admin/kitchen/menu" className="btn k-btn-light btn--sm">Menu & photos</Link>
            <Link to="/admin/kitchen/setup" className="btn k-btn-light btn--sm">Days, capacity & rules</Link>
            <Link to="/kitchen" className="btn k-btn-light btn--sm">Public page ↗</Link>
          </div>
        </div>
        <DishArt dish="egusi" steam />
      </section>
      <Tabs label="Kitchen" value={scope} onChange={setScope} tabs={[
        { value: 'express', label: '⚡ Express requests' }, { value: 'payment', label: 'Awaiting payment' }, { value: 'upcoming', label: 'To cook' },
        { value: 'sheet', label: 'Cooking sheet' }, { value: 'delivered', label: 'Delivered' }, { value: 'closed', label: 'Closed' },
      ]} />
      {scope === 'sheet' ? <CookingSheet /> : (
        <>
          {loading && <Spinner />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {data && !data.items.length && <EmptyState icon="🍲" title="Nothing here">{scope === 'express' ? 'No express requests waiting for you.' : 'No orders in this list.'}</EmptyState>}
          <div className="k-order-list">{data?.items.map((o) => <KitchenOrderRow key={o.reference} o={o} to={`/admin/kitchen/orders/${o.reference}`} />)}</div>
        </>
      )}
    </div>
  );
}
