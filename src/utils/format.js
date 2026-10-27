export const naira = (v, { dash = '—' } = {}) =>
  v == null || Number.isNaN(Number(v)) ? dash : `₦${Number(v).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

export const nairaRange = (min, max) => (min === max ? naira(min) : `${naira(min)} – ${naira(max)}`);

/** "₦20,000" / "₦80,000 – ₦95,000" / "Market price varies" */
export function priceText(price) {
  if (!price) return 'Market price varies';
  if (price.type === 'fixed') return naira(price.price);
  if (price.type === 'range') return nairaRange(price.min, price.max);
  return 'Market price varies';
}

const LAGOS = 'Africa/Lagos';

export const fmtDate = (d, opts = {}) => {
  if (!d) return '—';
  const date = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00Z`) : new Date(d);
  return date.toLocaleDateString('en-NG', { timeZone: LAGOS, day: 'numeric', month: 'short', year: 'numeric', ...opts });
};

export const fmtDay = (iso) => fmtDate(iso, { weekday: 'short', day: 'numeric', month: 'short', year: undefined });
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-NG', { timeZone: LAGOS, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—');

export const TIME_WINDOWS = { morning: 'Morning (7–11am)', midday: 'Midday (11am–2pm)', afternoon: 'Afternoon (2–5pm)' };
export const BOOKING_TYPES = { full_purchase: 'Full shopping', sample_run: 'Sample run' };

/** Visual tone per status, shared by customer and operator views. */
export const STATUS_TONE = {
  submitted: 'gold', awaiting_customer_approval: 'orange', awaiting_payment: 'orange', paid: 'green',
  shopping_in_progress: 'green', awaiting_customer_decision: 'orange', ready_for_delivery: 'green',
  completed: 'ink', declined: 'red', cancelled: 'muted', expired: 'muted',
  // Jojo's Kitchen
  express_requested: 'gold', confirmed: 'green', preparing: 'green', cooking: 'orange', out_for_delivery: 'green', delivered: 'ink',
};

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function lineRequestText(l) {
  if (l.requestMethod === 'quantity' && l.quantity) return `${Number(l.quantity)} × ${l.optionLabel || 'unit'}`;
  if (l.amount) return `${naira(l.amount)} worth${l.optionLabel ? ` · ${l.optionLabel}` : ''}`;
  return l.optionLabel || '—';
}

/** localStorage that never throws (private mode, blocked storage). */
export const safeStorage = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};
