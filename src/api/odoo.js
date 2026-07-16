// ---------------------------------------------------------------------------
// طبقة الربط مع الباك اند عبر موديول zid_connect_api (مسارات /api/... JSON)
// ---------------------------------------------------------------------------
// مهم: React Native لا يحفظ كوكيز الجلسة تلقائياً مثل المتصفح، لذلك
// نلتقط session_id من استجابة تسجيل الدخول ونرسله يدوياً مع كل طلب.
// ---------------------------------------------------------------------------

export const CONFIG = {
  BASE_URL: 'http://192.168.100.100:8076',
  DB: 'test',
  USE_API: true,
};

let SESSION_ID = null;
export const setSession = (sid) => { SESSION_ID = sid; };
export const getSession = () => SESSION_ID;
export const clearSession = () => { SESSION_ID = null; };
export const fetchBranding = () => call('/api/branding', {});

// استدعاء JSON-RPC (Odoo type="json" يتوقع هذا الشكل)
async function call(path, params = {}) {
  const headers = { 'Content-Type': 'application/json' };
  // نرسل كوكي الجلسة يدوياً إن وُجدت

  const res = await fetch(`${CONFIG.BASE_URL}${path}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: SESSION_ID ? { ...params, session_id: SESSION_ID } : params }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.data?.message || data.error.message || 'server_error');
  }
  return data.result !== undefined ? data.result : data;
}

// ---- المصادقة ----
export const login = async (email, password) => {
  const res = await call('/api/login', { db: CONFIG.DB, login: email, password });
  // احفظ الجلسة القادمة من الباك اند
  if (res && res.session_id) setSession(res.session_id);
  return res;
};
export const logout = () => { clearSession(); return call('/api/logout', {}); };
export const me = () => call('/api/me', {});
//sync
export const runSync = (payload) => call('/api/sync', payload);

// ---- التسجيل ----
export const register = (vals) => call('/api/register', vals);

// ---- لوحة المعلومات ----
export const fetchDashboard = (rangeType = 'days', storeId = null) =>
  call('/api/dashboard', storeId ? { range_type: rangeType, store_id: storeId } : { range_type: rangeType });

// ---- الخدمات والمتاجر ----
export const fetchConnections = () => call('/api/connections', {});
export const fetchStoresAll = () => call('/api/stores/all', {});
export const connectStore = ({ name, store_id, provider = 'zid' }) =>
  call('/api/connections/connect', { name, store_id, provider });
export const toggleStore = (storeId) =>
  call(`/api/connections/${storeId}/toggle`, {});

// ---- الفواتير ----
export const fetchInvoices = () => call('/api/invoices', {});

// ---- تفاصيل فاتورة ----
export const fetchInvoiceDetail = (invoiceId) => call(`/api/invoices/${invoiceId}`, {});

// ---- الطلبات ----
export const fetchOrders = (storeId, page = 1) =>
  call(`/api/connections/${storeId}/orders`, { page });
export const fetchOrderDetail = (orderId) => call(`/api/orders/${orderId}`, {});

// ---- المزامنة ----
export const syncStore = (storeId, entity = 'all') =>
  call(`/api/connections/${storeId}/sync`, { entity });

export const fetchLogs = () => Promise.resolve({ ok: true, pending: true, logs: [] });

// ---- العملاء والفريق ----
export const fetchCustomers = () => call('/api/connections/customers', {});
export const createCustomer = (vals) => call('/api/connections/customers/create', vals);
export const fetchTeam = () => call('/api/connections/team', {});
export const createTeamMember = (vals) => call('/api/connections/team/create', vals);
export const updateTeamMember = (memberId, vals) => call(`/api/connections/team/${memberId}/update`, vals);

// ---- الإعدادات ----
export const fetchStoreSettings = (storeId) =>
  call(`/api/connections/${storeId}/settings`, {});
export const saveStoreSettings = (storeId, toggles) =>
  call(`/api/connections/${storeId}/settings/save`, toggles);


export default {
  CONFIG, setSession, getSession, clearSession,
  login, logout, me, register,
  fetchDashboard, fetchBranding,
  fetchConnections, fetchStoresAll, connectStore, toggleStore,
  fetchOrders, fetchOrderDetail, syncStore,
  fetchStoreSettings, saveStoreSettings,
  fetchCustomers, createCustomer, fetchTeam, createTeamMember,
  updateTeamMember,fetchLogs,
  fetchInvoices, fetchInvoiceDetail,   
};
