import { useEffect, useState } from 'react';
import { ErrorState, MoneyInput, Tabs, useAsync } from '../../components/common';
import Seo from '../../components/Seo';
import { Alert, Button, Field, Spinner, TextInput } from '../../components/ui';
import { adminApi } from '../../services/api';
import { naira } from '../../utils/format';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Num({ label, value, onChange, hint, suffix }) {
  return (
    <Field label={label} hint={hint}>
      {(a) => (
        <div className={suffix ? 'money-input money-input--suffix' : ''}>
          <input className="input" {...a} inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))} />
          {suffix && <span aria-hidden="true">{suffix}</span>}
        </div>
      )}
    </Field>
  );
}

export default function ServiceSettings() {
  const { data, error, loading, reload } = useAsync(() => adminApi.settings(), []);
  const [tab, setTab] = useState('operations');
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (data) setF(structuredClone(data.settings)); }, [data]);
  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!f) return <Spinner />;

  const set = (group, key) => (v) => setF((x) => ({ ...x, [group]: { ...x[group], [key]: typeof v === 'object' && v?.target ? v.target.value : v } }));
  const save = async () => {
    setBusy(true); setMsg(''); setErr('');
    try {
      const raw = f[tab];
      const body = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) && !['accountNumber'].includes(k) ? Number(v) : v]));
      await adminApi.saveSettings(tab, body);
      setMsg('Saved.');
      reload();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const ops = f.operations;
  const pr = f.pricing;
  const exFee = Math.min(Math.max(Number(pr.fullPurchaseFeeFixed) + 80000 * Number(pr.fullPurchaseFeePercent) / 100, Number(pr.fullPurchaseFeeMin)), Number(pr.fullPurchaseFeeMax));

  return (
    <>
      <Seo title="Service settings" noindex />
      <header className="page-head"><h1>Service settings</h1><p className="muted">Your business rules. Changes apply to new requests and quotes.</p></header>
      <Tabs value={tab} onChange={(t) => { setTab(t); setMsg(''); setErr(''); }} label="Settings" tabs={[
        { value: 'operations', label: 'Working days & capacity' }, { value: 'pricing', label: 'Fees & transport' }, { value: 'baseLocation', label: 'Base location' },
        { value: 'payments', label: 'Payments' }, { value: 'restocking', label: 'Restocking' },
      ]} />
      <section className="card stack">
        {err && <Alert tone="error">{err}</Alert>}
        {msg && <Alert tone="success">{msg}</Alert>}

        {tab === 'operations' && (
          <div className="form form--grid">
            <fieldset className="toggles form--full"><legend>Working days</legend>
              <div className="chip-row">{DAYS.map((d, i) => (
                <button key={d} type="button" className={`chip-btn${ops.workingDays.includes(i) ? ' is-on' : ''}`} aria-pressed={ops.workingDays.includes(i)}
                  onClick={() => set('operations', 'workingDays')(ops.workingDays.includes(i) ? ops.workingDays.filter((x) => x !== i) : [...ops.workingDays, i].sort())}>{d}</button>
              ))}</div>
            </fieldset>
            <Num label="Capacity units per day" value={ops.dailyCapacityUnits} onChange={set('operations', 'dailyCapacityUnits')} hint="How much work you can take in one day." />
            <Num label="Units for a full shop" value={ops.fullPurchaseUnits} onChange={set('operations', 'fullPurchaseUnits')} />
            <Num label="Units for a sample run" value={ops.sampleRunUnits} onChange={set('operations', 'sampleRunUnits')} />
            <Num label="Earliest booking (days ahead)" value={ops.leadTimeDays} onChange={set('operations', 'leadTimeDays')} hint="1 = tomorrow at the earliest." />
            <Num label="Bookable up to (days ahead)" value={ops.bookingWindowDays} onChange={set('operations', 'bookingWindowDays')} />
            <Num label="Hold a date while you review (hours)" value={ops.reviewHoldHours} onChange={set('operations', 'reviewHoldHours')} hint="Unreviewed requests release their date after this." />
            <Num label="Quote valid for (hours)" value={ops.quoteValidHours} onChange={set('operations', 'quoteValidHours')} />
            <Num label="Time to pay after accepting (hours)" value={ops.paymentWindowHours} onChange={set('operations', 'paymentWindowHours')} />
          </div>
        )}

        {tab === 'pricing' && (
          <>
            <div className="form form--grid">
              <Field label="Full shop: base fee">{(a) => <MoneyInput {...a} value={pr.fullPurchaseFeeFixed} onChange={set('pricing', 'fullPurchaseFeeFixed')} />}</Field>
              <Num label="Plus % of goods estimate" value={pr.fullPurchaseFeePercent} onChange={set('pricing', 'fullPurchaseFeePercent')} suffix="%" />
              <Field label="Minimum service fee">{(a) => <MoneyInput {...a} value={pr.fullPurchaseFeeMin} onChange={set('pricing', 'fullPurchaseFeeMin')} />}</Field>
              <Field label="Maximum service fee">{(a) => <MoneyInput {...a} value={pr.fullPurchaseFeeMax} onChange={set('pricing', 'fullPurchaseFeeMax')} />}</Field>
              <Field label="Sample run fee">{(a) => <MoneyInput {...a} value={pr.sampleRunFee} onChange={set('pricing', 'sampleRunFee')} />}</Field>
              <Num label="Suggested limit headroom above estimate" value={pr.authorizedLimitBufferPercent} onChange={set('pricing', 'authorizedLimitBufferPercent')} suffix="%" />
              <Field label="Transport: fare per trip">{(a) => <MoneyInput {...a} value={pr.transportBaseFare} onChange={set('pricing', 'transportBaseFare')} />}</Field>
              <Field label="Transport: per km (road)">{(a) => <MoneyInput {...a} value={pr.transportPerKm} onChange={set('pricing', 'transportPerKm')} />}</Field>
            </div>
            <p className="muted small">Example: an ₦80,000 list → service fee {naira(Math.ceil(exFee / 100) * 100)}. Transport = fare + km × rate for base → market → customer → base (sample runs: base → market → base).</p>
          </>
        )}

        {tab === 'baseLocation' && (
          <>
            <Alert tone="info" title="Private">Used only on the server to estimate transport. It is never shown to customers or included in any public page.</Alert>
            <div className="form form--grid">
              <TextInput label="Label" value={f.baseLocation.label} onChange={set('baseLocation', 'label')} />
              <span />
              <TextInput label="Latitude" inputMode="decimal" value={f.baseLocation.lat} onChange={set('baseLocation', 'lat')} hint="Google Maps → right-click your starting point → copy the first number." />
              <TextInput label="Longitude" inputMode="decimal" value={f.baseLocation.lng} onChange={set('baseLocation', 'lng')} />
            </div>
          </>
        )}

        {tab === 'payments' && (
          <>
            <p className="muted">{data.onlinePayments ? 'Online payments (Paystack) are switched on.' : 'Online payments are off — add PAYSTACK_SECRET_KEY on the server to turn on card/USSD payments.'}</p>
            <div className="form form--grid">
              <label className="check form--full"><input type="checkbox" checked={f.payments.allowManualTransfer} onChange={(e) => set('payments', 'allowManualTransfer')(e.target.checked)} /><span>Accept bank transfers (you confirm each one when it arrives)</span></label>
              <TextInput label="Bank" value={f.payments.bankName} onChange={set('payments', 'bankName')} placeholder="e.g. UBA" />
              <TextInput label="Account name" value={f.payments.accountName} onChange={set('payments', 'accountName')} />
              <TextInput label="Account number (NUBAN)" inputMode="numeric" value={f.payments.accountNumber} onChange={(e) => set('payments', 'accountNumber')(e.target.value.replace(/\D/g, '').slice(0, 10))} />
              <TextInput label="Instructions for customers" value={f.payments.instructions} onChange={set('payments', 'instructions')} />
            </div>
            <p className="muted small">These details are shown only to a customer who has an amount to pay.</p>
          </>
        )}

        {tab === 'restocking' && (
          <div className="form form--grid">
            <Num label="Household size when not given" value={f.restocking.defaultHouseholdSize} onChange={set('restocking', 'defaultHouseholdSize')} />
            <Num label="Default reminder (days before)" value={f.restocking.defaultLeadDays} onChange={set('restocking', 'defaultLeadDays')} />
            <Num label="Shortest estimate (days)" value={f.restocking.minDays} onChange={set('restocking', 'minDays')} />
            <Num label="Longest estimate (days)" value={f.restocking.maxDays} onChange={set('restocking', 'maxDays')} />
            <p className="muted small form--full">How long each item lasts is set per item in the Catalogue (“restock estimate”). Customers can always correct their own estimates.</p>
          </div>
        )}
        <div><Button loading={busy} onClick={save}>Save changes</Button></div>
      </section>
    </>
  );
}
