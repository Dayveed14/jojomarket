import { API_URL } from '../config/site';

/**
 * Access token lives only in memory (never localStorage) so XSS can't lift a long-lived credential.
 * The refresh token is an httpOnly cookie the browser sends to /api/auth/refresh automatically.
 */
let accessToken = null;
let onSessionChange = () => {};
let refreshInFlight = null;

export const setAccessToken = (token) => { accessToken = token; };
export const registerSessionListener = (fn) => { onSessionChange = fn; };

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message || 'Something went wrong. Please try again.');
    this.status = status;
    this.code = body?.error?.code;
    this.fields = body?.error?.fields || {};
  }
}

const CSRF_HEADER = { 'X-Requested-With': 'jojo-web' };

async function rawRequest(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
  const isForm = body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...CSRF_HEADER,
      ...headers,
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  if (res.status === 204) return { res, data: null };
  const data = await res.json().catch(() => null);
  return { res, data };
}

/** Single-flight refresh: concurrent 401s share one refresh call. */
export function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        const { res, data } = await rawRequest('/auth/refresh', { method: 'POST', auth: false });
        if (res.status === 204) { // not signed in — nothing to restore
          setAccessToken(null);
          onSessionChange(null);
          return null;
        }
        if (res.ok) {
          setAccessToken(data.accessToken);
          onSessionChange(data.user);
          return data;
        }
        if (res.status === 409 && attempt === 0) { // another tab just rotated the cookie
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        setAccessToken(null);
        onSessionChange(null);
        return null;
      }
      return null;
    })().finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

export async function api(path, options = {}) {
  let { res, data } = await rawRequest(path, options);
  if (res.status === 401 && options.auth !== false && !options._retried) {
    const refreshed = await refreshSession();
    if (refreshed) ({ res, data } = await rawRequest(path, { ...options, _retried: true }));
  }
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

const qs = (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : '';
};

export const authApi = {
  register: (body) => api('/auth/register', { method: 'POST', body, auth: false }),
  login: (body) => api('/auth/login', { method: 'POST', body, auth: false }),
  logout: () => api('/auth/logout', { method: 'POST', auth: false }),
  forgotPassword: (email) => api('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
  resetPassword: (token, password) => api('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false }),
  verifyEmail: (token) => api('/auth/verify-email', { method: 'POST', body: { token }, auth: false }),
  resendVerification: () => api('/auth/resend-verification', { method: 'POST' }),
};

export const publicApi = {
  markets: () => api('/markets', { auth: false }),
  catalog: (marketId) => api(`/markets/${marketId}/catalog`, { auth: false }),
  areas: () => api('/areas', { auth: false }),
  serviceInfo: () => api('/service-info', { auth: false }),
  availability: (bookingType, marketId) => api(`/availability${qs({ bookingType, marketId })}`, { auth: false }),
};

export const meApi = {
  get: () => api('/me'),
  update: (body) => api('/me', { method: 'PATCH', body }),
  changePassword: (body) => api('/me/password', { method: 'POST', body }),
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append('avatar', file);
    return api('/me/avatar', { method: 'POST', body: fd });
  },
  removeAvatar: () => api('/me/avatar', { method: 'DELETE' }),
  dashboard: () => api('/me/dashboard'),
  addresses: () => api('/me/addresses'),
  createAddress: (body) => api('/me/addresses', { method: 'POST', body }),
  updateAddress: (id, body) => api(`/me/addresses/${id}`, { method: 'PATCH', body }),
  deleteAddress: (id) => api(`/me/addresses/${id}`, { method: 'DELETE' }),
  payments: () => api('/me/payments'),
  lists: () => api('/me/lists'),
  list: (id) => api(`/me/lists/${id}`),
  createList: (body) => api('/me/lists', { method: 'POST', body }),
  updateList: (id, body) => api(`/me/lists/${id}`, { method: 'PATCH', body }),
  deleteList: (id) => api(`/me/lists/${id}`, { method: 'DELETE' }),
  restocking: () => api('/me/restocking'),
  updateRestock: (id, body) => api(`/me/restocking/${id}`, { method: 'PATCH', body }),
};

export const bookingApi = {
  estimate: (body) => api('/bookings/estimate', { method: 'POST', body }),
  create: (body) => api('/bookings', { method: 'POST', body }),
  list: (scope) => api(`/bookings${qs({ scope })}`),
  get: (ref) => api(`/bookings/${ref}`),
  cancel: (ref, reason) => api(`/bookings/${ref}/cancel`, { method: 'POST', body: { reason } }),
  acceptQuote: (ref, quoteId) => api(`/bookings/${ref}/accept-quote`, { method: 'POST', body: { quoteId } }),
  requestRevision: (ref, reason) => api(`/bookings/${ref}/request-revision`, { method: 'POST', body: { reason } }),
  payOnline: (ref) => api(`/bookings/${ref}/pay/online`, { method: 'POST' }),
  payManual: (ref, payerNote) => api(`/bookings/${ref}/pay/manual`, { method: 'POST', body: { payerNote } }),
  payCredit: (ref) => api(`/bookings/${ref}/pay/credit`, { method: 'POST' }),
  decideChange: (ref, id, decision, note) => api(`/bookings/${ref}/changes/${id}`, { method: 'POST', body: { decision, note } }),
  refundChoice: (ref, choice) => api(`/bookings/${ref}/refund-choice`, { method: 'POST', body: { choice } }),
  repeat: (ref) => api(`/bookings/${ref}/repeat`),
  saveAsList: (ref, name) => api(`/bookings/${ref}/save-list`, { method: 'POST', body: { name } }),
  attachment: (ref, id) => api(`/bookings/${ref}/attachments/${id}`),
  verifyPayment: (reference) => api('/payments/verify', { method: 'POST', body: { reference } }),
};

export const adminApi = {
  dashboard: () => api('/admin/dashboard'),
  bookings: (params) => api(`/admin/bookings${qs(params)}`),
  booking: (ref) => api(`/admin/bookings/${ref}`),
  quote: (ref, body) => api(`/admin/bookings/${ref}/quote`, { method: 'POST', body }),
  decline: (ref, reason) => api(`/admin/bookings/${ref}/decline`, { method: 'POST', body: { reason } }),
  cancel: (ref, reason) => api(`/admin/bookings/${ref}/cancel`, { method: 'POST', body: { reason } }),
  confirmPayment: (ref, id) => api(`/admin/bookings/${ref}/payments/${id}/confirm`, { method: 'POST' }),
  rejectPayment: (ref, id, reason) => api(`/admin/bookings/${ref}/payments/${id}/reject`, { method: 'POST', body: { reason } }),
  start: (ref) => api(`/admin/bookings/${ref}/start`, { method: 'POST' }),
  saveSheet: (ref, body) => api(`/admin/bookings/${ref}/sheet`, { method: 'PUT', body }),
  requestChange: (ref, body) => api(`/admin/bookings/${ref}/changes`, { method: 'POST', body }),
  withdrawChange: (ref, id) => api(`/admin/bookings/${ref}/changes/${id}/withdraw`, { method: 'POST' }),
  finish: (ref) => api(`/admin/bookings/${ref}/finish`, { method: 'POST' }),
  reopen: (ref) => api(`/admin/bookings/${ref}/reopen`, { method: 'POST', body: {} }),
  complete: (ref) => api(`/admin/bookings/${ref}/complete`, { method: 'POST' }),
  uploadAttachment: (ref, file, kind, caption) => {
    const fd = new FormData();
    fd.append('photo', file);
    fd.append('kind', kind);
    if (caption) fd.append('caption', caption);
    return api(`/admin/bookings/${ref}/attachments`, { method: 'POST', body: fd });
  },
  attachment: (ref, id) => api(`/admin/bookings/${ref}/attachments/${id}`),
  deleteAttachment: (ref, id) => api(`/admin/bookings/${ref}/attachments/${id}`, { method: 'DELETE' }),
  recordRefund: (ref, body) => api(`/admin/bookings/${ref}/refund`, { method: 'POST', body }),
  reconciliationStatus: (ref, body) => api(`/admin/bookings/${ref}/reconciliation-status`, { method: 'POST', body }),
  calendar: (params) => api(`/admin/calendar${qs(params)}`),
  setException: (body) => api('/admin/calendar/exceptions', { method: 'POST', body }),
  catalog: () => api('/admin/catalog'),
  saveItem: (id, body) => api(id ? `/admin/catalog/items/${id}` : '/admin/catalog/items', { method: id ? 'PUT' : 'POST', body }),
  saveCategory: (id, body) => api(id ? `/admin/catalog/categories/${id}` : '/admin/catalog/categories', { method: id ? 'PUT' : 'POST', body }),
  saveMarket: (id, body) => api(id ? `/admin/markets/${id}` : '/admin/markets', { method: id ? 'PUT' : 'POST', body }),
  settings: () => api('/admin/settings'),
  saveSettings: (key, body) => api(`/admin/settings/${key}`, { method: 'PUT', body }),
  customers: (params) => api(`/admin/customers${qs(params)}`),
  customer: (id) => api(`/admin/customers/${id}`),
  setCustomerStatus: (id, status, reason) => api(`/admin/customers/${id}/status`, { method: 'POST', body: { status, reason } }),
  payments: (params) => api(`/admin/payments${qs(params)}`),
  purchases: (params) => api(`/admin/purchases${qs(params)}`),
  auditLog: (params) => api(`/admin/audit-log${qs(params)}`),
};
