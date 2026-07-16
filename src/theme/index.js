// ألوان وقيم التصميم — مطابقة لتصميم "بوابة الربط"
// ملاحظة: accent وما يشتق منه تُحدَّث من أودو عبر applyBrandColor()
export const colors = {
  accent: '#2ec27e',       // البنفسجي الأساسي (مطابق للتصميم)
  accentDeep: '#533A7D',
  accentSoft: '#F1ECFA',
  accentSoftAlt: '#EBE5F6',

  // ألوان حالة المزامنة الناعمة (بطاقات الرئيسية)
  syncOkBg: '#EEF7F1',
  syncOkBorder: '#D8EDDF',
  syncOkText: '#4B7A5C',
  syncOkDot: '#28A05B',
  syncWarnBg: '#FDF6E7',
  syncWarnBorder: '#F1E3BE',
  syncWarnText: '#977219',
  syncWarnDot: '#D9A52B',
  syncFailBg: '#FCEDEC',
  syncFailBorder: '#F3D6D3',
  syncFailText: '#9A4038',
  syncFailDot: '#D64545',

  gold2: '#F5B72E',

  ink: '#2A2833',         // النص الأساسي
  inkSoft: '#4B4858',
  muted: '#8A8698',
  mutedLight: '#A49DB4',

  surface: '#F6F5FA',
  card: '#FFFFFF',
  border: '#ECE9F3',
  borderSoft: '#F1EEF7',

  success: '#1B7A43',
  successBg: '#EAF6EE',
  warning: '#A65A00',
  warningBg: '#FBEFD9',
  danger: '#B4271F',
  dangerBg: '#FBE9E7',

  info: '#2456C7',
  infoBg: '#E9EFFB',

  gold: '#F5B72E',

  screenGradient: ['#efeaf7', '#e9e4f1', '#e3dee9'],
};

export const radius = {
  sm: 11,
  md: 13,
  lg: 18,
  xl: 20,
  pill: 24,
  round: 999,
};

export const spacing = (n) => n * 4;

export const font = {
  // في التطبيق الحقيقي استخدم خط "IBM Plex Sans Arabic"
  family: undefined,
  h1: 22,
  h2: 18,
  body: 14,
  small: 12.5,
  tiny: 11,
};

export const shadow = {
  card: {
    shadowColor: '#503C78',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  float: {
    shadowColor: '#2E1E56',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 34,
    elevation: 8,
  },
};

// شارات حالة المزامنة
export const syncBadge = {
  synced: { label: 'تمت المزامنة', bg: colors.successBg, fg: colors.success },
  pending: { label: 'قيد الانتظار', bg: colors.warningBg, fg: colors.warning },
  failed: { label: 'فشل', bg: colors.dangerBg, fg: colors.danger },
};

export const roleBadge = {
  مدير: { bg: colors.accentSoftAlt, fg: colors.accent },
  مشرف: { bg: colors.infoBg, fg: colors.info },
  مستخدم: { bg: '#EEEFF2', fg: '#5B6470' },
};


// ---------------------------------------------------------------------------
// تحديث لون الهوية القادم من أودو (primary_color في res.company)
// يعدّل كائن colors نفسه، فتلتقطه كل الشاشات تلقائياً عند إعادة الرسم.
// ---------------------------------------------------------------------------

// تفتيح/تغميق لون hex بنسبة معينة
function shade(hex, percent) {
  const h = String(hex).replace('#', '');
  if (h.length !== 6) return hex;
  const num = parseInt(h, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.min(255, Math.max(0, Math.round(r + (percent / 100) * (percent > 0 ? 255 - r : r))));
  g = Math.min(255, Math.max(0, Math.round(g + (percent / 100) * (percent > 0 ? 255 - g : g))));
  b = Math.min(255, Math.max(0, Math.round(b + (percent / 100) * (percent > 0 ? 255 - b : b))));
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function applyBrandColor(hex) {
  if (!hex || !/^#?[0-9a-fA-F]{6}$/.test(String(hex).replace('#', '').padStart(6, '0'))) return;
  const base = hex.startsWith('#') ? hex : '#' + hex;

  colors.accent        = base;
  colors.accentDeep    = shade(base, -25);
  colors.accentSoft    = shade(base, 88);
  colors.accentSoftAlt = shade(base, 80);
  colors.screenGradient = [shade(base, 90), shade(base, 86), shade(base, 82)];

  // الشارات التي تعتمد على اللون الأساسي
  roleBadge['مدير'] = { bg: colors.accentSoftAlt, fg: colors.accent };
}
