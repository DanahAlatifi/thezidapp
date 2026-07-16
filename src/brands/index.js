import React from 'react';
import { Image } from 'react-native';
import Svg, {
  Rect, Path, Circle, G, Defs, LinearGradient, Stop, Text as SvgText,
} from 'react-native-svg';

/**
 * شعارات المنصات — أشكال مبنية بألوان الهوية الرسمية لكل منصة.
 * ملاحظة: هذه أشكال تمثيلية بألوان العلامة الرسمية (وليست ملفات الشعار
 * الرسمية المحمية بحقوق الملكية). عند النشر الفعلي استبدلها بأصول الشعار
 * الرسمية من كل منصة (Zid / Odoo) بعد الحصول على إذن الاستخدام.
 */

// —— ألوان الهوية الرسمية لكل منصة ——
export const BRAND = {
  zid: { key: 'zid', name: 'زد', nameEn: 'Zid', color: '#7A57BC', bg: '#EEE7F8', initial: 'ز' },
  odoo: { key: 'odoo', name: 'أودو', nameEn: 'Odoo', color: '#714B67', bg: '#EFE7ED', initial: 'O' },
};

// ————— شعار زد (Zid) الرسمي — من ملف الصورة —————
// الصورة مستطيلة (النسبة ~2.47:1)، فنحسب العرض من الارتفاع للحفاظ على الشكل.
const ZID_LOGO_SRC = require('../../assets/zid-logo.png');
const ZID_ASPECT = 487 / 197; // ≈ 2.47

export function ZidLogo({ size = 44, rounded = true }) {
  // size يمثّل الارتفاع؛ العرض يُحسب من نسبة الصورة الأصلية
  return (
    <Image
      source={ZID_LOGO_SRC}
      style={{
        height: size,
        width: size * ZID_ASPECT,
        borderRadius: rounded ? size * 0.25 : 0,
      }}
      resizeMode="contain"
    />
  );
}

// ————— شعار أودو (Odoo) —————
export function OdooLogo({ size = 44, rounded = true }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {rounded && <Rect width="48" height="48" rx="12" fill="#714B67" />}
      {/* حرفا O المميزان لأودو */}
      <Circle cx="19" cy="24" r="6.2" fill="none" stroke="#FFFFFF" strokeWidth="3" />
      <Circle cx="31.5" cy="24" r="6.2" fill="none" stroke="#8F6E86" strokeWidth="3" />
    </Svg>
  );
}

// اختيار الشعار بالمفتاح
export function BrandLogo({ brand, size = 44, rounded = true }) {
  switch (brand) {
    case 'zid': return <ZidLogo size={size} rounded={rounded} />;
    case 'odoo': return <OdooLogo size={size} rounded={rounded} />;
    default: return null;
  }
}

// ————— شعار التطبيق نفسه (العقدة الثلاثية) —————
export function AppLogo({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="appbg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#EADDFA" />
          <Stop offset="0.55" stopColor="#F6F0C4" />
          <Stop offset="1" stopColor="#D6F0E2" />
        </LinearGradient>
      </Defs>
      <Rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="url(#appbg)" />
      <Path d="M24 24V12M24 24l-10.5 7M24 24l10.5 7" stroke="#6E4B8C" strokeWidth="2.2" strokeLinecap="round" />
      <Circle cx="24" cy="11" r="5" fill="#B79BE6" stroke="#fff" strokeWidth="1.8" />
      <Circle cx="13.5" cy="32" r="5" fill="#E9DE7A" stroke="#fff" strokeWidth="1.8" />
      <Circle cx="34.5" cy="32" r="5" fill="#8FD3AE" stroke="#fff" strokeWidth="1.8" />
      <Circle cx="24" cy="24" r="4.6" fill="#fff" />
      <Circle cx="24" cy="24" r="2" fill="#6E4B8C" />
    </Svg>
  );
}
