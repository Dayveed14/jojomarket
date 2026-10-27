import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, StatusBadge, Tabs, useAsync } from '../../../components/common';
import { DishArt } from '../../../components/kitchen/DishArt';
import Seo from '../../../components/Seo';
import { EmptyState, Spinner } from '../../../components/ui';
import { kitchenApi } from '../../../services/api';
import { naira } from '../../../utils/format';

export function KitchenOrderRow({ o, to }) {
  return (
    <Link to={to} className="k-order-card">
      <DishArt dish={o.orderType === 'express' ? 'peppersoup' : o.isBulk ? 'partypack' : 'jollof'} />
      <div>
        <p className="eyebrow" style={{ margin: 0 }}>{o.orderType === 'express' ? '⚡ Express' : 'Regular'} · <span className="mono">{o.reference}</span></p>
        <strong>{o.deliveryText}</strong>
        <div className="muted small">{o.customerName ? `${o.customerName} · ` : ''}{naira(o.total)}{o.isBulk ? ' · bulk' : ''}</div>
      </div>
      <StatusBadge status={o.status} label={o.statusLabel} />
    </Link>
  );
}

export default function KitchenOrders() {
  const [scope, setScope] = useState('active');
  const { data, error, loading, reload } = useAsync(() => kitchenApi.list(scope), [scope]);
  return (
    <div className="k-scope">
      <Seo title="Jojo’s Kitchen" noindex />
      <section className="k-banner">
        <div>
          <h1>Jojo’s Kitchen</h1>
          <p>Home-cooked Nigerian food, made your way and delivered to your door.</p>
          <div className="k-banner__actions">
            <Link to="/app/kitchen/new" className="btn btn--accent">Order food</Link>
            <Link to="/app/kitchen/new?express=1" className="btn k-btn-light">⚡ Express</Link>
            <Link to="/kitchen" className="btn k-btn-light">See the menu</Link>
          </div>
        </div>
        <DishArt dish="jollof" steam />
      </section>
      <Tabs label="Orders" value={scope} onChange={setScope} tabs={[{ value: 'active', label: 'Current' }, { value: 'past', label: 'Past' }]} />
      {loading && <Spinner />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && !data.items.length && (
        <EmptyState icon="🍲" title={scope === 'active' ? 'No orders cooking right now' : 'No past orders yet'} action={<Link to="/app/kitchen/new" className="btn btn--accent">Order something delicious</Link>}>
          Jollof for the weekend? Egusi for the week? Small chops for the party?
        </EmptyState>
      )}
      <div className="k-order-list">
        {data?.items.map((o) => <KitchenOrderRow key={o.reference} o={o} to={`/app/kitchen/orders/${o.reference}`} />)}
      </div>
    </div>
  );
}
