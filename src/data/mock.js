// ---------------------------------------------------------------------------
// بيانات تجريبية مطابقة لبنية الباك اند (pt-platform / zid_connect)
// أسماء الحقول والحالات هنا تطابق نماذج Odoo الفعلية:
//   - platform.partner (type: company | partner)
//   - zid.store (state: on | off ، provider: zid)
//   - sale.order (name, date_order, partner_id.name, amount_total, state, id_in_zid_store)
// عند ربط الـ API لاحقاً، البيانات تجي بنفس هذا الشكل تماماً.
// ---------------------------------------------------------------------------

// بيانات المنصات (provider keys مطابقة للباك اند: zid)
export const PROVIDER_META = {
  zid:     { key: 'zid',     name: 'زد',    color: '#7A57BC', badge: 'zid' },
};

// المتاجر — مطابقة لـ zid.store
// state: 'on' (Running) | 'off' (Stopped)
export const STORES = [
  { id: 1, name: 'متجر رواء',   store_id: '41287',  provider: 'zid',     state: 'on',  last_sync: 'قبل 5 د',  owner: 'مدير رواء' },
  { id: 2, name: 'رواء أوتلت',  store_id: '41290',  provider: 'zid',     state: 'on',  last_sync: 'قبل 12 د', owner: 'منى السالم' },
];

// تجميع المتاجر حسب المنصة (مثل _build_groups في connections.py)
export function groupStoresByProvider(stores = STORES) {
  const groups = {};
  stores.forEach((s) => {
    const meta = PROVIDER_META[s.provider] || { key: s.provider, name: s.provider, color: '#888' };
    if (!groups[s.provider]) {
      groups[s.provider] = { key: meta.key, name: meta.name, color: meta.color, stores: [] };
    }
    groups[s.provider].stores.push(s);
  });
  return Object.values(groups);
}

// تحويل قائمة PROVIDERS القديمة (للتوافق مع الشاشات الحالية)
export const PROVIDERS = groupStoresByProvider().map((g) => ({
  key: g.key,
  name: g.name,
  color: g.color,
  since: 'مارس 2025',
  stores: g.stores.map((s) => ({
    name: s.name,
    account: 'شركة · رواء التجارية',
    owner: s.owner,
    last: s.last_sync,
    dot: s.state === 'on' ? '#1B7A43' : '#B4271F',
    state: s.state,
    store_id: s.store_id,
  })),
}));

export const PROVIDER_KEY_BY_NAME = { 'زد': 'zid' };
export const PROVIDER_NAME_BY_KEY = { zid: 'زد' };

// الطلبات — مطابقة لـ sale.order
// state: حالة أمر البيع في Odoo (draft/sent/sale/done/cancel) مع تسمية معروضة.
// نُبقي حقل sync للعرض (متزامن/قيد الانتظار/فشل) كما في التطبيق.
export const ORDERS = [
  { id: 'ZID-10847', name: 'ZID-10847', customer: 'أحمد الغامدي', provider: 'زد', store: 'متجر رواء', days: 0, date: 'اليوم 14:20', total: '﷼ 349', amount_total: 349, currency: '﷼', state: 'sale', sync: 'synced', mobile: '+966 55 214 8890', payment: 'مدى', soRef: '041 2287', zid_ref: '041 2287' },
  { id: 'ZID-10846', name: 'ZID-10846', customer: 'سارة العتيبي', provider: 'زد', store: 'متجر رواء', days: 0, date: 'اليوم 13:05', total: '﷼ 128', amount_total: 128, currency: '﷼', state: 'draft', sync: 'pending', mobile: '+966 50 118 7723', payment: 'الدفع عند الاستلام', soRef: '041 2286', zid_ref: '041 2286' },
  { id: 'ZID-10844', name: 'ZID-10844', customer: 'نورة القحطاني', provider: 'زد', store: 'رواء أوتلت', days: 2, date: '5 يوليو', total: '﷼ 89', amount_total: 89, currency: '﷼', state: 'sale', sync: 'synced', mobile: '+966 56 445 9987', payment: 'مدى', soRef: '041 2271', zid_ref: '041 2271' },
  { id: 'ZID-10842', name: 'ZID-10842', customer: 'ريم الشهري', provider: 'زد', store: 'متجر رواء', days: 9, date: '28 يونيو', total: '﷼ 210', amount_total: 210, currency: '﷼', state: 'sale', sync: 'synced', mobile: '+966 54 771 3320', payment: 'مدى', soRef: '041 2240', zid_ref: '041 2240' },
  { id: 'ZID-10820', name: 'ZID-10820', customer: 'عبدالله الزهراني', provider: 'زد', store: 'متجر رواء', days: 26, date: '11 يونيو', total: '﷼ 455', amount_total: 455, currency: '﷼', state: 'sale', sync: 'synced', mobile: '+966 53 118 4490', payment: 'مدى', soRef: '041 2140', zid_ref: '041 2140' },
];

export const ORDER_ITEMS = [
  { name: 'سماعات لاسلكية', sku: 'EAR-201', qty: 1, price: '﷼ 299', line: '﷼ 299' },
  { name: 'كوب حراري', sku: 'MUG-044', qty: 1, price: '﷼ 30', line: '﷼ 30' },
];

// كيانات المزامنة — مطابقة لحقول last_sync_* في zid.store
export const SYNC_ENTITIES = ['الطلبات', 'المنتجات', 'العملاء', 'التصنيفات'];

export const LOGS = [
  { time: '14:22', provider: 'زد', store: 'متجر رواء', entity: 'الطلبات', msg: 'استيراد 24 طلباً جديداً', status: 'ok' },
  { time: '14:05', provider: 'زد', store: 'رواء أوتلت', entity: 'المنتجات', msg: 'تحديث 6 منتجات', status: 'ok' },
  { time: '11:00', provider: 'زد', store: 'متجر رواء', entity: 'العملاء', msg: 'مزامنة 12 عميلاً', status: 'ok' },
  { time: 'أمس', provider: 'زد', store: 'متجر رواء', entity: 'الصور', msg: 'مزامنة صور المنتجات', status: 'ok' },
];

// الفريق — مطابق لـ team_member_ids في platform.partner
// role: manager | admin | user (يوافق الأدوار في التطبيق)
export const TEAM = [
  { name: 'مدير رواء', email: 'admin@rawaa.sa', role: 'مدير', roleKey: 'manager', sync: true, scope: 'كل المتاجر' },
  { name: 'منى السالم', email: 'mona@rawaa.sa', role: 'مشرف', roleKey: 'admin', sync: true, scope: 'زد · رواء أوتلت' },
  { name: 'سارة العتيبي', email: 'sara@rawaa.sa', role: 'مستخدم', roleKey: 'user', sync: false, scope: 'زد · متجر رواء' },
  { name: 'نورة القحطاني', email: 'noura@rawaa.sa', role: 'مستخدم', roleKey: 'user', sync: false, scope: 'كل المتاجر (عرض)' },
];

// العملاء — مطابق لـ res.partner (partner_ids في zid.store)
export const CUSTOMERS = [
  { name: 'أحمد الغامدي', owner: 'مدير رواء', stores: 'زد · متجر رواء', orders: 21, mobile: '+966 55 214 8890' },
  { name: 'عبدالله الزهراني', owner: 'خالد المطيري', stores: 'زد · متجر رواء', orders: 8, mobile: '+966 53 118 4490' },
  { name: 'سارة العتيبي', owner: 'منى السالم', stores: 'زد · رواء أوتلت', orders: 5, mobile: '+966 50 118 7723' },
  { name: 'ريم الشهري', owner: 'مدير رواء', stores: 'زد · متجر رواء', orders: 1, mobile: '+966 54 771 3320' },
];


// الفواتير — مطابقة لـ account.move في Odoo
// payment_state: paid | not_paid | in_payment | partial | reversed
// status المعروض: paid (مدفوعة) | pending (مستحقة) | overdue (متأخرة)
export const INVOICES = [
  {
    id: 'INV-2026-0142', number: 'INV-2026-0142', status: 'paid',
    date: '1 يوليو 2026', due: '1 يوليو 2026', paid_date: '1 يوليو 2026',
    amount_total: 573.85, subtotal: 499, tax: 74.85, currency: '﷼',
    plan: 'الخدمة الكاملة', method: 'فيزا •••• 4921', period: 'يوليو 2026',
    lines: [
      { name: 'اشتراك الخدمة الكاملة', qty: 1, price: 499, total: 499 },
    ],
  },
  {
    id: 'INV-2026-0128', number: 'INV-2026-0128', status: 'paid',
    date: '1 يونيو 2026', due: '1 يونيو 2026', paid_date: '1 يونيو 2026',
    amount_total: 573.85, subtotal: 499, tax: 74.85, currency: '﷼',
    plan: 'الخدمة الكاملة', method: 'فيزا •••• 4921', period: 'يونيو 2026',
    lines: [
      { name: 'اشتراك الخدمة الكاملة', qty: 1, price: 499, total: 499 },
    ],
  },
  {
    id: 'INV-2026-0155', number: 'INV-2026-0155', status: 'pending',
    date: '1 أغسطس 2026', due: '8 أغسطس 2026', paid_date: null,
    amount_total: 573.85, subtotal: 499, tax: 74.85, currency: '﷼',
    plan: 'الخدمة الكاملة', method: '—', period: 'أغسطس 2026',
    lines: [
      { name: 'اشتراك الخدمة الكاملة', qty: 1, price: 499, total: 499 },
    ],
  },
  {
    id: 'INV-2026-0113', number: 'INV-2026-0113', status: 'paid',
    date: '1 مايو 2026', due: '1 مايو 2026', paid_date: '2 مايو 2026',
    amount_total: 802.85, subtotal: 698, tax: 104.85, currency: '﷼',
    plan: 'الخدمة الكاملة + متجر إضافي', method: 'فيزا •••• 4921', period: 'مايو 2026',
    lines: [
      { name: 'اشتراك الخدمة الكاملة', qty: 1, price: 499, total: 499 },
      { name: 'متجر إضافي (زد)', qty: 1, price: 199, total: 199 },
    ],
  },
  {
    id: 'INV-2026-0098', number: 'INV-2026-0098', status: 'overdue',
    date: '1 أبريل 2026', due: '8 أبريل 2026', paid_date: null,
    amount_total: 228.85, subtotal: 199, tax: 29.85, currency: '﷼',
    plan: 'الربط فقط', method: '—', period: 'أبريل 2026',
    lines: [
      { name: 'اشتراك الربط فقط', qty: 1, price: 199, total: 199 },
    ],
  },
];

export const INVOICE_STATUS = {
  paid:    { label: 'مدفوعة', bg: '#EEF7F1', fg: '#4B7A5C', dot: '#28A05B' },
  pending: { label: 'مستحقة', bg: '#FDF6E7', fg: '#977219', dot: '#D9A52B' },
  overdue: { label: 'متأخرة', bg: '#FCEDEC', fg: '#9A4038', dot: '#D64545' },
};

export const AVATARS = [
  ['#EBE5F6', '#6E4FA2'], ['#FDF4DD', '#A65A00'], ['#E9EFFB', '#2456C7'],
  ['#EAF6EE', '#1B7A43'], ['#FBE9E7', '#B4271F'],
];

export const initialOf = (t = '') => t.trim().charAt(0);
export const avatarOf = (i) => AVATARS[i % AVATARS.length];
