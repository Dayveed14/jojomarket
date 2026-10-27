import { useEffect, useState } from 'react';
import { ErrorState, MoneyInput, Tabs, useAsync } from '../../../components/common';
import Seo from '../../../components/Seo';
import { Alert, Button, Field, Spinner, TextInput } from '../../../components/ui';
import { adminApi, adminKitchenApi } from '../../../services/api';
import { fmtDay } from '../../../utils/format';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const NUMERIC = /^-?\d+(\.\d+)?$/;

function Calendar() {
  const { data, error, loading, reload, setData } = useAsync(() => adminKitchenApi.calendar(), []);
  const [err, setErr] = useState('');
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const set = async (body) => { setErr(''); try { setData(await adminKitchenApi.setOverride(body)); } catch (e) { setErr(e.message); } };
  return (
    <section className="card stack">
      <p className="muted">Block a day (an event, a rest day) or change how much you can cook. Customers can’t pick a closed or full day.</p>
      {err && <Alert tone="error">{err}</Alert>}
      <div className="k-cal">
        {data.days.map((d) => {
          const pct = d.capacity ? Math.min(100, Math.round((d.portions / d.capacity) * 100)) : 100;
          return (
            <div key={d.date} className={`k-cal__day${d.capacity === 0 ? ' is-closed' : ''}`}>
              <strong>{fmtDay(d.date)}</strong>
              <span className="muted small">{d.capacity === 0 ? (d.override?.reason || 'Closed') : `${d.portions}/${d.capacity} portions · ${d.orders} orders`}</span>
              {d.capacity > 0 && <div className="k-capbar"><span style={{ width: `${pct}%` }} /></div>}
              <div className="btn-row">
                {d.override
                  ? <button type="button" className="link-btn small" onClick={() => set({ date: d.date, type: 'clear' })}>Reset</button>
                  : <button type="button" className="link-btn small" onClick={() => set({ date: d.date, type: 'blocked', reason: 'Not cooking' })}>Block</button>}
                <button type="button" className="link-btn small" onClick={() => {
                  const v = window.prompt('Portions you can cook that day', String(d.capacity || 30));
                  if (v != null && /^\d+$/.test(v)) set({ date: d.date, type: 'capacity', capacityPortions: Number(v) });
                }}>Capacity</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function KitchenSetup() {
  const { data, error, loading, reload } = useAsync(() => adminApi.settings(), []);
  const [tab, setTab] = useState('calendar');
  const [k, setK] = useState(null);
  const [emails, setEmails] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) { setK(structuredClone(data.settings.kitchen)); setEmails(data.settings.notifications?.operatorEmails || ''); } }, [data]);
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!k) return <Spinner />;
  const set = (key) => (v) => setK((x) => ({ ...x, [key]: v?.target ? (v.target.type === 'checkbox' ? v.target.checked : v.target.value) : v }));
  const Num = ({ label, name, hint }) => <TextInput key={name} label={label} hint={hint} inputMode="numeric" value={k[name]} onChange={(e) => set(name)(e.target.value.replace(/[^\d.]/g, ''))} />;
  const save = async (key, body) => {
    setBusy(true); setMsg(''); setErr('');
    try { await adminApi.saveSettings(key, body); setMsg('Saved.'); reload(); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const kitchenBody = () => Object.fromEntries(Object.entries(k).map(([key, v]) => [key, typeof v === 'string' && NUMERIC.test(v) ? Number(v) : v]));

  return (
    <div className="k-scope">
      <Seo title="Kitchen setup" noindex />
      <header className="page-head"><h1>Kitchen setup</h1><p className="muted">Cooking days, how much you take on, ordering times and express rules.</p></header>
      <Tabs label="Setup" value={tab} onChange={(t) => { setTab(t); setMsg(''); setErr(''); }} tabs={[
        { value: 'calendar', label: 'Calendar' }, { value: 'capacity', label: 'Days & capacity' }, { value: 'timing', label: 'Ordering times' },
        { value: 'express', label: 'Express & delivery' }, { value: 'alerts', label: 'Email alerts' },
      ]} />
      {msg && <Alert tone="success">{msg}</Alert>}
      {err && <Alert tone="error">{err}</Alert>}
      {tab === 'calendar' && <Calendar />}
      {tab === 'capacity' && (
        <section className="card stack">
          <label className="check"><input type="checkbox" checked={k.enabled} onChange={set('enabled')} /> Kitchen is taking orders</label>
          <fieldset className="fieldset-plain"><legend className="field__label">Cooking days</legend>
            <div className="k-excl">{DAYS.map((d, i) => <label key={d}><input type="checkbox" checked={k.workingDays.includes(i)} onChange={() => set('workingDays')(k.workingDays.includes(i) ? k.workingDays.filter((x) => x !== i) : [...k.workingDays, i].sort())} />{d}</label>)}</div>
          </fieldset>
          <div className="form form--grid">
            {Num({ label: "Portions per day", name: "dailyCapacityPortions", hint: "Plate = 1. When a day reaches this it shows as fully booked." })}
            {Num({ label: "Max orders per day", name: "maxOrdersPerDay" })}
            {Num({ label: "Bulk from (portions)", name: "bulkPortionThreshold" })}
            {Num({ label: "Extra days for bulk", name: "bulkExtraDays" })}
            {Num({ label: "Booking window (days ahead)", name: "bookingWindowDays" })}
            {Num({ label: "Hours to pay before slot is released", name: "paymentWindowHours" })}
          </div>
          <Button loading={busy} onClick={() => save('kitchen', kitchenBody())}>Save</Button>
        </section>
      )}
      {tab === 'timing' && (
        <section className="card stack">
          <p className="muted">Orders before the first time → tomorrow. Between the two → tomorrow + extra hours. After the second → the day after tomorrow.</p>
          <div className="form form--grid">
            <TextInput label="Next-day cut-off" type="time" value={k.fullDayCutoff} onChange={set('fullDayCutoff')} />
            <TextInput label="Afternoon cut-off" type="time" value={k.extraHoursCutoff} onChange={set('extraHoursCutoff')} />
            {Num({ label: "Extra hours between cut-offs", name: "extraHours" })}
          </div>
          <h3>Delivery windows</h3>
          {k.deliveryWindows.map((w, i) => (
            <div key={w.key} className="form form--grid">
              <TextInput label="Label" value={w.label} onChange={(e) => set('deliveryWindows')(k.deliveryWindows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <TextInput label="From" type="time" value={w.start} onChange={(e) => set('deliveryWindows')(k.deliveryWindows.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} />
              <TextInput label="To" type="time" value={w.end} onChange={(e) => set('deliveryWindows')(k.deliveryWindows.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} />
            </div>
          ))}
          <Button loading={busy} onClick={() => save('kitchen', kitchenBody())}>Save</Button>
        </section>
      )}
      {tab === 'express' && (
        <section className="card stack">
          <label className="check"><input type="checkbox" checked={k.expressEnabled} onChange={set('expressEnabled')} /> Offer Express (customer picks the time, you approve)</label>
          <div className="form form--grid">
            {Num({ label: "Express surcharge %", name: "expressSurchargePercent" })}
            <Field label="Minimum express charge">{(a) => <MoneyInput {...a} value={k.expressMinFee} onChange={set('expressMinFee')} />}</Field>
            {Num({ label: "Minimum notice (hours)", name: "expressMinHoursAhead" })}
            {Num({ label: "Hours you have to reply", name: "expressReplyHours" })}
            <TextInput label="Earliest express delivery" type="time" value={k.expressEarliestTime} onChange={set('expressEarliestTime')} />
            <TextInput label="Latest express delivery" type="time" value={k.expressLatestTime} onChange={set('expressLatestTime')} />
            <Field label="Delivery base fee">{(a) => <MoneyInput {...a} value={k.deliveryBaseFee} onChange={set('deliveryBaseFee')} />}</Field>
            <Field label="Delivery per km">{(a) => <MoneyInput {...a} value={k.deliveryPerKm} onChange={set('deliveryPerKm')} />}</Field>
          </div>
          <Button loading={busy} onClick={() => save('kitchen', kitchenBody())}>Save</Button>
        </section>
      )}
      {tab === 'alerts' && (
        <section className="card stack">
          <p className="muted">Who gets emailed about new express requests, paid kitchen orders, new market bookings and bank transfer notices. Leave blank to email every operator account.</p>
          <TextInput label="Operator emails (comma-separated)" value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="jojo@example.com, assistant@example.com" />
          <Button loading={busy} onClick={() => save('notifications', { operatorEmails: emails.trim() })}>Save</Button>
        </section>
      )}
    </div>
  );
}
