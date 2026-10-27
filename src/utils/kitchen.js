// Display helpers for Jojo's Kitchen. The server is the source of truth for every rule;
// these only explain the rules to the customer before they ask the server.
const LAGOS_OFFSET = 60; // UTC+1, no DST

export const toMinutes = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };
export const fmtClock = (mins) => {
  const h = Math.floor(mins / 60) % 24; const m = mins % 60;
  const hh = h % 12 || 12; const ap = h < 12 ? 'am' : 'pm';
  return m ? `${hh}:${String(m).padStart(2, '0')}${ap}` : `${hh}${ap}`;
};
export function lagosNow(now = new Date()) {
  const l = new Date(now.getTime() + LAGOS_OFFSET * 60_000);
  return { date: l.toISOString().slice(0, 10), minutes: l.getUTCHours() * 60 + l.getUTCMinutes() };
}

/** Which of the three ordering bands are we in right now? */
export function currentBand(rules, now = new Date()) {
  const { minutes } = lagosNow(now);
  if (minutes < toMinutes(rules.fullDayCutoff)) return 'early';
  if (minutes < toMinutes(rules.extraHoursCutoff)) return 'late_morning';
  return 'afternoon';
}

export const KITCHEN_STATUS_TONE = {
  express_requested: 'warn', awaiting_payment: 'warn', confirmed: 'info', preparing: 'info', cooking: 'info',
  out_for_delivery: 'info', delivered: 'success', declined: 'muted', cancelled: 'muted', expired: 'muted',
};

export const TRACK_STEPS = [
  { key: 'confirmed', label: 'Confirmed', icon: '✓' },
  { key: 'preparing', label: 'Preparing', icon: '🔪' },
  { key: 'cooking', label: 'Cooking', icon: '🍲' },
  { key: 'out_for_delivery', label: 'On the way', icon: '🛵' },
  { key: 'delivered', label: 'Delivered', icon: '🏠' },
];

export const SPICE = { mild: 'Mild', medium: 'Medium', hot: 'Hot 🔥' };

export function datetimeLocalToLagosIso(value) {
  // "2025-11-04T14:30" typed by the customer is Lagos time, whatever their device's time zone.
  return value ? `${value}:00+01:00` : '';
}
