import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, Modal, StatusBadge, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { Alert, Button, Field, Spinner, TextInput } from '../../components/ui';
import { adminApi } from '../../services/api';
import { fmtDay } from '../../utils/format';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Calendar() {
  const { data, error, loading, reload } = useAsync(() => adminApi.calendar({ days: 42 }), []);
  const [day, setDay] = useState(null);
  const [f, setF] = useState({ type: 'blocked', capacityUnits: '', reason: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const open = (d) => { setDay(d); setErr(''); setF({ type: d.exception?.type || 'blocked', capacityUnits: d.exception?.capacityUnits ?? d.capacity, reason: d.exception?.reason || '' }); };
  const save = async (type) => {
    setBusy(true); setErr('');
    try { await adminApi.setException({ date: day.date, type, capacityUnits: type === 'capacity' ? Number(f.capacityUnits) : undefined, reason: f.reason || null }); setDay(null); reload(); }
    catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const lead = new Date(`${data.days[0].date}T12:00:00Z`).getUTCDay();

  return (
    <>
      <Seo title="Calendar" noindex />
      <header className="page-head page-head--row">
        <div>
          <h1>Calendar &amp; capacity</h1>
          <p className="muted">Each day has {data.units.daily} capacity units. A full shop uses {data.units.fullPurchase}, a sample run {data.units.sampleRun}. Tap a day to block it or change its capacity.</p>
        </div>
        <Link to="/admin/settings/service" className="btn btn--ghost btn--sm">Working days &amp; capacity</Link>
      </header>
      <div className="cal" role="grid" aria-label="Next six weeks">
        {DOW.map((d) => <div key={d} className="cal__dow" role="columnheader">{d}</div>)}
        {Array.from({ length: lead }).map((_, i) => <div key={`pad${i}`} className="cal__pad" />)}
        {data.days.map((d) => {
          const pct = d.capacity ? Math.min(100, Math.round((d.used / d.capacity) * 100)) : 100;
          return (
            <button key={d.date} role="gridcell" className={`cal__day${d.capacity === 0 ? ' is-off' : ''}${d.exception?.type === 'blocked' ? ' is-blocked' : ''}${pct >= 100 && d.capacity ? ' is-full' : ''}`} onClick={() => open(d)}>
              <span className="cal__date">{new Date(`${d.date}T12:00:00Z`).getUTCDate()}</span>
              {d.exception && <span className="cal__flag" title={d.exception.reason || ''}>{d.exception.type === 'blocked' ? 'Blocked' : `Cap ${d.exception.capacityUnits}`}</span>}
              {d.capacity > 0 && <span className="cal__bar"><span style={{ width: `${pct}%` }} /></span>}
              <span className="cal__count">{d.capacity ? `${d.used}/${d.capacity}` : d.exception?.type === 'blocked' ? '' : 'Off'}</span>
              {d.bookings.slice(0, 3).map((b) => <span key={b.reference} className={`cal__b cal__b--${b.type}`}>{b.customer?.split(' ')[0] || b.reference}</span>)}
              {d.bookings.length > 3 && <span className="cal__more">+{d.bookings.length - 3}</span>}
            </button>
          );
        })}
      </div>

      <Modal open={Boolean(day)} onClose={() => setDay(null)} title={day ? fmtDay(day.date) : ''} wide>
        {day && (
          <div className="stack">
            {err && <Alert tone="error">{err}</Alert>}
            {day.bookings.length ? (
              <ul className="mini-list">{day.bookings.map((b) => (
                <li key={b.reference}><Link to={`/admin/bookings/${b.reference}`}><span className="mono">{b.reference}</span> · {b.customer} · {b.market}</Link><StatusBadge status={b.status} label={b.statusLabel} /></li>
              ))}</ul>
            ) : <p className="muted">No bookings on this day.</p>}
            <p className="small">Using {day.used} of {day.capacity} units.</p>
            <div className="form form--grid">
              <Field label="Capacity units for this day">{(a) => <input className="input" {...a} inputMode="numeric" value={f.capacityUnits} onChange={(e) => setF({ ...f, capacityUnits: e.target.value.replace(/\D/g, '') })} />}</Field>
              <TextInput label="Reason (private)" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Family event, public holiday…" />
            </div>
            <p className="muted small">Blocking a day stops new bookings. Existing bookings stay — reschedule or cancel them from the booking page.</p>
            <div className="btn-row">
              <Button className="btn--sm" variant="secondary" loading={busy} onClick={() => save('capacity')}>Set capacity</Button>
              <Button className="btn--sm" loading={busy} onClick={() => save('blocked')}>Block this day</Button>
              {day.exception && <Button className="btn--sm" variant="ghost" loading={busy} onClick={() => save('clear')}>Back to normal</Button>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
