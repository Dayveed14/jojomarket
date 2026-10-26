import { useEffect, useState } from 'react';
import { useForm } from '../hooks/useForm';
import { meApi, publicApi } from '../services/api';
import { Alert, Button, Field, TextInput } from './ui';

let areaCache = null;

export function useAreas() {
  const [areas, setAreas] = useState(areaCache || []);
  useEffect(() => {
    if (areaCache) return;
    publicApi.areas().then((r) => { areaCache = r.items; setAreas(r.items); }).catch(() => {});
  }, []);
  return areas;
}

export default function AddressForm({ initial, onSaved, onCancel, defaultName = '', defaultPhone = '' }) {
  const areas = useAreas();
  const { bind, values, setValues, errors, formError, submitting, submit } = useForm({
    label: initial?.label || 'Home',
    recipientName: initial?.recipientName || defaultName,
    recipientPhone: initial?.recipientPhone || defaultPhone || '',
    addressLine: initial?.addressLine || '',
    areaId: initial?.areaId || '',
    landmark: initial?.landmark || '',
    deliveryInstructions: initial?.deliveryInstructions || '',
    isDefault: initial?.isDefault || false,
  });

  const onSubmit = submit(async (v) => {
    const body = { ...v, areaId: Number(v.areaId) || undefined };
    const { address } = initial?.id ? await meApi.updateAddress(initial.id, body) : await meApi.createAddress(body);
    onSaved(address);
  });

  return (
    <form className="form form--grid" onSubmit={onSubmit} noValidate>
      {formError && <div className="form--full"><Alert tone="error">{formError}</Alert></div>}
      <TextInput label="Name for this address" placeholder="Home, Office, Mum’s place" {...bind('label')} error={errors.label} />
      <Field label="Area" error={errors.areaId} hint="Used to estimate transport. Your exact address is only shared with Jojo.">
        {(a11y) => (
          <select className="input" {...a11y} {...bind('areaId')}>
            <option value="">Choose your area in Lagos…</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}{a.lga && a.lga !== a.name ? ` (${a.lga})` : ''}</option>)}
          </select>
        )}
      </Field>
      <div className="form--full">
        <TextInput label="Street address" autoComplete="street-address" placeholder="House number, street, estate" {...bind('addressLine')} error={errors.addressLine} />
      </div>
      <TextInput label="Nearest landmark (optional)" placeholder="Opposite the filling station" {...bind('landmark')} error={errors.landmark} />
      <TextInput label="Who receives the delivery?" autoComplete="name" {...bind('recipientName')} error={errors.recipientName} />
      <TextInput label="Their phone number" type="tel" autoComplete="tel" placeholder="0803 123 4567" {...bind('recipientPhone')} error={errors.recipientPhone} />
      <div className="form--full">
        <Field label="Delivery instructions (optional)" error={errors.deliveryInstructions}>
          {(a11y) => <textarea className="input" rows={2} placeholder="Gate code, call on arrival, leave with the security man…" {...a11y} {...bind('deliveryInstructions')} />}
        </Field>
      </div>
      <label className="check form--full">
        <input type="checkbox" checked={values.isDefault} onChange={(e) => setValues((s) => ({ ...s, isDefault: e.target.checked }))} />
        <span>Use as my default delivery address</span>
      </label>
      <div className="form--full btn-row">
        <Button type="submit" loading={submitting}>{initial?.id ? 'Save address' : 'Add address'}</Button>
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
