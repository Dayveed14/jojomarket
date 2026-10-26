// Restocking estimates — "you may be running low", never "you've run out".
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, Modal, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { Alert, Button, EmptyState, Spinner, TextInput } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { meApi } from '../../services/api';
import { fmtDate } from '../../utils/format';

function Gauge({ pct, low }) {
  return (
    <div className={`gauge${low ? ' gauge--low' : ''}`} role="img" aria-label={`About ${pct}% estimated left`}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

function daysText(e) {
  if (e.status === 'finished') return 'You said this is finished';
  if (e.status === 'running_low') return 'You said you’re running low';
  if (e.daysLeft < 0) return `Probably finished (${Math.abs(e.daysLeft)} days past estimate)`;
  if (e.daysLeft === 0) return 'May run out today';
  return `About ${e.daysLeft} day${e.daysLeft === 1 ? '' : 's'} left`;
}

export default function Restocking() {
  const { user } = useAuth();
  const { data, error, loading, reload, setData } = useAsync(() => meApi.restocking().then((r) => r.items), []);
  const [busy, setBusy] = useState(null);
  const [adjust, setAdjust] = useState(null);
  const [days, setDays] = useState('');
  const [err, setErr] = useState('');

  const update = async (e, body) => {
    setBusy(e.id); setErr('');
    try {
      const { item } = await meApi.updateRestock(e.id, body);
      setData((list) => list.map((x) => (x.id === item.id ? item : x)).sort((a, b) => a.estimatedDepletionDate.localeCompare(b.estimatedDepletionDate)));
    } catch (ex) { setErr(ex.message); } finally { setBusy(null); }
  };

  const low = data?.filter((e) => e.likelyLow) || [];

  return (
    <>
      <Seo title="Restocking" noindex />
      <header className="page-head page-head--row">
        <div>
          <h1>Restocking</h1>
          <p className="muted">Rough estimates from your past shops{user.householdSize ? ` for a household of ${user.householdSize}` : ''}. Tell us what you still have and we’ll adjust.</p>
        </div>
        {low.length > 0 && <Link to="/app/bookings/new?type=full_purchase" className="btn btn--accent btn--sm">Plan a shop</Link>}
      </header>

      {!user.householdSize && (
        <Alert tone="info">Estimates assume a household of 4. <Link to="/app/settings">Set your household size</Link> for better guesses (optional).</Alert>
      )}
      {!user.restockRemindersEnabled && <Alert tone="warning">Reminder emails are off. <Link to="/app/settings">Turn them on</Link> if you’d like a nudge.</Alert>}
      {err && <Alert tone="error">{err}</Alert>}
      {error && <ErrorState error={error} onRetry={reload} />}

      {loading && !data ? <Spinner /> : data && (data.length ? (
        <ul className="restock-grid">
          {data.map((e) => (
            <li key={e.id} className={`card restock${e.likelyLow ? ' is-low' : ''}`}>
              <header className="restock__head">
                <span className="restock__icon" aria-hidden="true">{e.icon}</span>
                <div><strong>{e.label}</strong><div className="muted small">Bought {fmtDate(e.lastPurchaseDate)}{e.lastBookingReference && <> · <Link to={`/app/bookings/${e.lastBookingReference}`}>{e.lastBookingReference}</Link></>}</div></div>
              </header>
              <Gauge pct={['finished'].includes(e.status) ? 0 : e.percentLeft} low={e.likelyLow} />
              <p className="restock__left">{daysText(e)}</p>
              <p className="muted small">Usually lasts ~{e.estimatedDurationDays} days{e.customerAdjusted ? ' (your estimate)' : ''} · est. {fmtDate(e.estimatedDepletionDate)}</p>
              <div className="restock__actions" role="group" aria-label={`Update ${e.label}`}>
                <button className={`chip-btn${e.status === 'still_available' ? ' is-on' : ''}`} disabled={busy === e.id} onClick={() => update(e, { status: 'still_available' })}>Still have some</button>
                <button className={`chip-btn${e.status === 'running_low' ? ' is-on' : ''}`} disabled={busy === e.id} onClick={() => update(e, { status: 'running_low' })}>Running low</button>
                <button className={`chip-btn${e.status === 'finished' ? ' is-on' : ''}`} disabled={busy === e.id} onClick={() => update(e, { status: 'finished' })}>Finished</button>
              </div>
              <div className="restock__more">
                <button className="link-btn small" onClick={() => { setAdjust(e); setDays(String(e.estimatedDurationDays)); }}>It usually lasts…</button>
                <button className="link-btn small" onClick={() => update(e, { snoozeDays: 7 })}>Remind me in a week</button>
                <label className="check check--sm">
                  <input type="checkbox" checked={e.remindersEnabled} onChange={(ev) => update(e, { remindersEnabled: ev.target.checked })} />
                  <span>Email reminders</span>
                </label>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card"><EmptyState icon="📦" title="Nothing to track yet" action={<Link to="/app/bookings/new" className="btn btn--primary btn--sm">Book a market run</Link>}>
          After your first completed shop, we’ll estimate when things like rice, beans and oil may run low — and send a gentle reminder if you want one.
        </EmptyState></div>
      ))}

      <Modal open={Boolean(adjust)} onClose={() => setAdjust(null)} title={`How long does ${adjust?.label} usually last?`} footer={(
        <>
          <Button variant="ghost" className="btn--sm" onClick={() => setAdjust(null)}>Cancel</Button>
          <Button className="btn--sm" disabled={!(Number(days) > 0)} onClick={async () => { await update(adjust, { estimatedDurationDays: Number(days) }); setAdjust(null); }}>Save</Button>
        </>
      )}>
        <TextInput label="Number of days" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} hint="For the amount you usually buy. We’ll use this from now on." />
      </Modal>
    </>
  );
}
