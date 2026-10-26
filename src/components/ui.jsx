import { useId, useState } from 'react';

export function Field({ label, error, hint, children, id: idProp }) {
  const autoId = useId();
  const id = idProp || autoId;
  const describedBy = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id} className="field__label">{label}</label>
      {children({ id, 'aria-invalid': Boolean(error) || undefined, 'aria-describedby': describedBy })}
      {hint && !error && <p id={`${id}-hint`} className="field__hint">{hint}</p>}
      {error && <p id={`${id}-err`} className="field__error" role="alert">{error}</p>}
    </div>
  );
}

export function TextInput({ label, error, hint, ...props }) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(a11y) => <input className="input" {...a11y} {...props} />}
    </Field>
  );
}

export function PasswordInput({ label = 'Password', error, hint, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} error={error} hint={hint}>
      {(a11y) => (
        <div className="input-wrap">
          <input className="input" type={show ? 'text' : 'password'} {...a11y} {...props} />
          <button type="button" className="input-wrap__toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
      )}
    </Field>
  );
}

export function Button({ variant = 'primary', loading = false, children, className = '', ...props }) {
  return (
    <button className={`btn btn--${variant} ${className}`} disabled={loading || props.disabled} aria-busy={loading || undefined} {...props}>
      {loading && <span className="spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}

export function Alert({ tone = 'info', children, title }) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {title && <strong className="alert__title">{title}</strong>}
      <div>{children}</div>
    </div>
  );
}

export function Avatar({ user, size = 40 }) {
  const initials = (user?.displayName || '?')
    .split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  return user?.avatarUrl ? (
    <img className="avatar" src={user.avatarUrl} alt="" width={size} height={size} style={{ width: size, height: size }} />
  ) : (
    <span className="avatar avatar--initials" style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">{initials}</span>
  );
}

export function PasswordStrength({ value }) {
  const checks = [
    { ok: value.length >= 8, label: '8+ characters' },
    { ok: /[A-Za-z]/.test(value), label: 'a letter' },
    { ok: /\d/.test(value), label: 'a number' },
  ];
  const score = checks.filter((c) => c.ok).length + (value.length >= 12 ? 1 : 0);
  return (
    <div className="pw-strength" aria-live="polite">
      <div className="pw-strength__bar"><span style={{ width: `${(score / 4) * 100}%` }} data-score={score} /></div>
      <ul className="pw-strength__checks">
        {checks.map((c) => <li key={c.label} className={c.ok ? 'ok' : ''}>{c.ok ? '✓' : '•'} {c.label}</li>)}
      </ul>
    </div>
  );
}

export function Spinner({ label = 'Loading' }) {
  return <div className="page-spinner" role="status"><span className="spinner spinner--lg" /><span className="sr-only">{label}</span></div>;
}

export function EmptyState({ icon, title, children, action }) {
  return (
    <div className="empty">
      {icon && <div className="empty__icon" aria-hidden="true">{icon}</div>}
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
