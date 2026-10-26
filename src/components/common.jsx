import { useCallback, useEffect, useRef, useState } from 'react';
import { STATUS_TONE } from '../utils/format';

export function StatusBadge({ status, label }) {
  return <span className={`status status--${STATUS_TONE[status] || 'muted'}`}>{label || status}</span>;
}

/** Load data with loading/error state and a reload function. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const live = useRef(true);
  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      if (live.current) setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      if (live.current) setState({ data: null, error, loading: false });
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    live.current = true;
    run();
    return () => { live.current = false; };
  }, [run]);
  return { ...state, reload: run, setData: (d) => setState((s) => ({ ...s, data: typeof d === 'function' ? d(s.data) : d })) };
}

/** Accessible modal built on <dialog>. */
export function Modal({ open, onClose, title, children, footer, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className={`modal${wide ? ' modal--wide' : ''}`} onClose={onClose} onCancel={onClose} aria-labelledby="modal-title">
      {open && (
        <>
          <header className="modal__head">
            <h2 id="modal-title">{title}</h2>
            <button type="button" className="modal__x" onClick={onClose} aria-label="Close">×</button>
          </header>
          <div className="modal__body">{children}</div>
          {footer && <footer className="modal__foot">{footer}</footer>}
        </>
      )}
    </dialog>
  );
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.value} role="tab" type="button" aria-selected={value === t.value} className={`tabs__tab${value === t.value ? ' is-active' : ''}`} onClick={() => onChange(t.value)}>
          {t.label}{t.count != null && <span className="tabs__count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Shows 188,500 while the parent keeps the raw "188500". */
const withCommas = (v) => {
  if (v === '' || v == null) return '';
  const [int, dec] = String(v).split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${dec !== undefined ? `.${dec}` : ''}`;
};

export function MoneyInput({ value, onChange, id, placeholder = '0', ...rest }) {
  return (
    <div className="money-input">
      <span aria-hidden="true">₦</span>
      <input
        id={id} className="input" inputMode="decimal" placeholder={placeholder ? withCommas(placeholder) : placeholder} value={withCommas(value ?? '')}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.]/g, '');
          const [i, ...d] = raw.split('.');
          onChange(d.length ? `${i}.${d.join('').slice(0, 2)}` : i);
        }} {...rest}
      />
    </div>
  );
}

export function KeyValue({ rows }) {
  return (
    <dl className="kv">
      {rows.filter(Boolean).map(([k, v, strong]) => (
        <div key={k} className={strong ? 'kv__row kv__row--strong' : 'kv__row'}><dt>{k}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="alert alert--error" role="alert">
      <div>{error?.message || 'Something went wrong.'} {onRetry && <button className="link-btn" onClick={onRetry}>Try again</button>}</div>
    </div>
  );
}

export function Confirm({ open, title, children, confirmLabel = 'Confirm', tone = 'primary', onConfirm, onClose, busy, needsReason, reasonLabel = 'Reason' }) {
  const [reason, setReason] = useState('');
  useEffect(() => { if (open) setReason(''); }, [open]);
  return (
    <Modal open={open} onClose={onClose} title={title} footer={(
      <>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>Back</button>
        <button type="button" className={`btn btn--${tone} btn--sm`} disabled={busy || (needsReason && reason.trim().length < 3)} onClick={() => onConfirm(reason)}>
          {busy && <span className="spinner" aria-hidden="true" />}{confirmLabel}
        </button>
      </>
    )}>
      {children}
      {needsReason && (
        <div className="field" style={{ marginTop: 12 }}>
          <label className="field__label" htmlFor="confirm-reason">{reasonLabel}</label>
          <textarea id="confirm-reason" className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      )}
    </Modal>
  );
}
