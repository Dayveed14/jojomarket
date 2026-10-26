import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ResendVerification from '../../components/ResendVerification';
import Seo from '../../components/Seo';
import { Alert, Avatar, Button, Field, PasswordInput, PasswordStrength, TextInput } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';
import { meApi } from '../../services/api';

function AvatarCard() {
  const { user, setUser } = useAuth();
  const inputRef = useRef(null);
  const [state, setState] = useState({ busy: false, error: '', preview: null });

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setState((s) => ({ ...s, error: 'Please choose a JPG, PNG or WebP image.' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setState((s) => ({ ...s, error: 'That image is over 2 MB. Please choose a smaller one.' }));
      return;
    }
    const preview = URL.createObjectURL(file);
    setState({ busy: true, error: '', preview });
    try {
      const { user: updated } = await meApi.uploadAvatar(file);
      setUser(updated);
      setState({ busy: false, error: '', preview: null });
    } catch (err) {
      setState({ busy: false, error: err.message, preview: null });
    } finally {
      URL.revokeObjectURL(preview);
    }
  };

  const onRemove = async () => {
    setState({ busy: true, error: '', preview: null });
    try {
      const { user: updated } = await meApi.removeAvatar();
      setUser(updated);
      setState({ busy: false, error: '', preview: null });
    } catch (err) {
      setState({ busy: false, error: err.message, preview: null });
    }
  };

  return (
    <section className="card">
      <header className="card__head"><h2>Profile photo</h2></header>
      <div className="avatar-edit">
        <div className={`avatar-edit__img${state.busy ? ' is-busy' : ''}`}>
          {state.preview ? <img className="avatar" src={state.preview} alt="" width="96" height="96" /> : <Avatar user={user} size={96} />}
        </div>
        <div className="avatar-edit__actions">
          <p className="muted">JPG, PNG or WebP, up to 2 MB. Helps Jojo recognise you at hand-off.</p>
          <div className="btn-row">
            <Button variant="secondary" className="btn--sm" loading={state.busy} onClick={() => inputRef.current?.click()}>
              {user.avatarUrl ? 'Change photo' : 'Upload photo'}
            </Button>
            {user.avatarUrl && !state.busy && <Button variant="ghost" className="btn--sm" onClick={onRemove}>Remove</Button>}
          </div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onPick} />
          {state.error && <p className="field__error" role="alert">{state.error}</p>}
        </div>
      </div>
    </section>
  );
}

function ProfileCard() {
  const { user, setUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const { bind, values, setValues, errors, formError, submitting, submit } = useForm({
    displayName: user.displayName,
    phone: user.phone || '',
    preferredContactMethod: user.preferredContactMethod,
    bookingUpdates: user.notificationPreferences.bookingUpdates,
    promotions: user.notificationPreferences.promotions,
  });

  const onSubmit = submit(async (v) => {
    setSaved(false);
    const { user: updated } = await meApi.update({
      displayName: v.displayName,
      phone: v.phone,
      preferredContactMethod: v.preferredContactMethod,
      notificationPreferences: { bookingUpdates: v.bookingUpdates, promotions: v.promotions },
    });
    setUser(updated);
    setValues((s) => ({ ...s, phone: updated.phone || '' }));
    setSaved(true);
  });

  return (
    <section className="card card--span2">
      <header className="card__head"><h2>Your details</h2></header>
      {formError && <Alert tone="error">{formError}</Alert>}
      {saved && <Alert tone="success">Saved.</Alert>}
      <form className="form form--grid" onSubmit={onSubmit} noValidate>
        <TextInput label="Name" autoComplete="name" {...bind('displayName')} error={errors.displayName} />
        <div>
          <TextInput label="Email" value={user.email} disabled hint={user.emailVerified ? '✓ Confirmed' : undefined} />
          {!user.emailVerified && <p className="field__hint field__hint--warn">Not yet confirmed · <ResendVerification label="Resend link" /></p>}
        </div>
        <TextInput label="Phone" type="tel" autoComplete="tel" placeholder="0803 123 4567" {...bind('phone')} error={errors.phone} />
        <Field label="Preferred contact">
          {(a11y) => (
            <select className="input" {...a11y} {...bind('preferredContactMethod')}>
              <option value="email">Email</option>
              <option value="phone">Phone call</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          )}
        </Field>
        <fieldset className="toggles form--full">
          <legend>Email notifications</legend>
          <label className="toggle">
            <input type="checkbox" checked={values.bookingUpdates} onChange={(e) => setValues((s) => ({ ...s, bookingUpdates: e.target.checked }))} />
            <span>Booking updates, quotes and receipts</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={values.promotions} onChange={(e) => setValues((s) => ({ ...s, promotions: e.target.checked }))} />
            <span>Occasional news and market-day offers</span>
          </label>
        </fieldset>
        <div className="form--full"><Button type="submit" loading={submitting}>Save changes</Button></div>
      </form>
    </section>
  );
}

function PasswordCard() {
  const { applySession } = useAuth();
  const [done, setDone] = useState('');
  const { bind, values, setValues, errors, setErrors, formError, submitting, submit } = useForm({ currentPassword: '', newPassword: '', confirm: '' });

  const onSubmit = submit(async (v) => {
    setDone('');
    if (v.newPassword !== v.confirm) { setErrors({ confirm: 'Passwords do not match' }); return; }
    const res = await meApi.changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword });
    applySession(res);
    setValues({ currentPassword: '', newPassword: '', confirm: '' });
    setDone(res.message);
  });

  return (
    <section className="card">
      <header className="card__head"><h2>Password</h2></header>
      {formError && <Alert tone="error">{formError}</Alert>}
      {done && <Alert tone="success">{done}</Alert>}
      <form className="form" onSubmit={onSubmit} noValidate>
        <PasswordInput label="Current password" autoComplete="current-password" {...bind('currentPassword')} error={errors.currentPassword} />
        <div>
          <PasswordInput label="New password" autoComplete="new-password" {...bind('newPassword')} error={errors.newPassword} />
          {values.newPassword && <PasswordStrength value={values.newPassword} />}
        </div>
        <PasswordInput label="Confirm new password" autoComplete="new-password" {...bind('confirm')} error={errors.confirm} />
        <Button type="submit" variant="secondary" loading={submitting}>Update password</Button>
      </form>
    </section>
  );
}

function HouseholdCard() {
  const { user, setUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const { values, setValues, errors, formError, submitting, submit } = useForm({
    householdSize: user.householdSize ?? '',
    reminderLeadDays: user.reminderLeadDays ?? 3,
    restockRemindersEnabled: user.restockRemindersEnabled,
  });
  const onSubmit = submit(async (v) => {
    setSaved(false);
    const { user: updated } = await meApi.update({
      householdSize: v.householdSize === '' ? null : Number(v.householdSize),
      reminderLeadDays: Number(v.reminderLeadDays),
      restockRemindersEnabled: v.restockRemindersEnabled,
    });
    setUser(updated);
    setSaved(true);
  });
  return (
    <section className="card">
      <header className="card__head"><h2>Household &amp; reminders</h2></header>
      <p className="muted small">Optional. Helps estimate when staples like rice or oil may run low. We never assume — you can correct any estimate.</p>
      {formError && <Alert tone="error">{formError}</Alert>}
      {saved && <Alert tone="success">Saved.</Alert>}
      <form className="form" onSubmit={onSubmit} noValidate>
        <TextInput label="People in your household" inputMode="numeric" placeholder="e.g. 4" value={values.householdSize}
          onChange={(e) => setValues((s) => ({ ...s, householdSize: e.target.value.replace(/\D/g, '') }))} error={errors.householdSize} />
        <Field label="Remind me this many days before">
          {(a11y) => (
            <select className="input" {...a11y} value={values.reminderLeadDays} onChange={(e) => setValues((s) => ({ ...s, reminderLeadDays: e.target.value }))}>
              {[0, 1, 2, 3, 5, 7, 10, 14].map((d) => <option key={d} value={d}>{d === 0 ? 'On the day' : `${d} day${d > 1 ? 's' : ''}`}</option>)}
            </select>
          )}
        </Field>
        <label className="toggle">
          <input type="checkbox" checked={values.restockRemindersEnabled} onChange={(e) => setValues((s) => ({ ...s, restockRemindersEnabled: e.target.checked }))} />
          <span>Email me when things may be running low</span>
        </label>
        <Button type="submit" variant="secondary" loading={submitting}>Save</Button>
      </form>
    </section>
  );
}

export default function Settings({ admin = false }) {
  return (
    <>
      <Seo title="Profile & security" noindex />
      <header className="page-head">
        <h1>Profile &amp; security</h1>
        <p className="muted">Manage how Jojo reaches you and keep your account safe.{!admin && <> Delivery addresses are under <Link to="/app/addresses">Addresses</Link>.</>}</p>
      </header>
      <div className="dash-grid">
        <ProfileCard />
        <AvatarCard />
        {!admin && <HouseholdCard />}
        <PasswordCard />
      </div>
    </>
  );
}
