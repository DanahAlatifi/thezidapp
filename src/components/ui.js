import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius, shadow, font } from '../theme';
import { useI18n } from '../i18n';

// نص يحترم اتجاه اللغة الحالية
export function T({ children, style, weight, size, color, center, ltr, noTr, ...rest }) {
  const i18n = useI18n();
  const isRTL = i18n ? i18n.isRTL : true;
  const align = center ? 'center' : ltr ? (isRTL ? 'right' : 'left') : isRTL ? 'right' : 'left';
  const dir = ltr ? 'ltr' : isRTL ? 'rtl' : 'ltr';
  // ترجمة تلقائية للنص العربي الثابت عند اختيار الإنجليزية
  const kids = (!noTr && i18n && i18n.tr)
    ? React.Children.map(children, (c) => (typeof c === 'string' ? i18n.tr(c) : c))
    : children;
  return (
    <Text
      {...rest}
      style={[
        { color: color || colors.ink, fontSize: size || font.body, textAlign: align, writingDirection: dir },
        weight === 'bold' && { fontWeight: '700' },
        weight === 'semi' && { fontWeight: '600' },
        style,
      ]}
    >
      {kids}
    </Text>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, shadow.card, style]}>{children}</View>;
}

export function Badge({ label, bg, fg }) {
  const i18n = useI18n();
  const txt = i18n && i18n.tr ? i18n.tr(label) : label;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '700' }}>{txt}</Text>
    </View>
  );
}

export function Avatar({ initial, bg, fg, size = 44 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius.md, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: fg, fontWeight: '700', fontSize: size * 0.4 }}>{initial}</Text>
    </View>
  );
}

export function Pill({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        { backgroundColor: active ? colors.accent : '#fff', borderColor: active ? colors.accent : '#E2DEEC' },
      ]}
    >
      <Text style={{ color: active ? '#fff' : colors.inkSoft, fontSize: 12.5, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

// صف يبدأ من جهة القراءة (يمين للعربي، يسار للإنجليزي)
export function Row({ children, style, gap = 10 }) {
  const i18n = useI18n();
  const dir = (i18n ? i18n.isRTL : true) ? 'row-reverse' : 'row';
  return <View style={[{ flexDirection: dir, alignItems: 'center', gap }, style]}>{children}</View>;
}

export function BackButton({ onPress }) {
  const i18n = useI18n();
  const isRTL = i18n ? i18n.isRTL : true;
  return (
    <Pressable onPress={onPress} style={styles.backBtn}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ transform: isRTL ? [] : [{ scaleX: -1 }] }}>
        {/* السهم يشير نحو جهة الرجوع حسب اللغة */}
        <Path d="M15 5l-7 7 7 7" stroke={colors.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Pressable>
  );
}

export function ScreenTitle({ title, onBack }) {
  return (
    <Row gap={12} style={{ marginBottom: 18 }}>
      {onBack ? <BackButton onPress={onBack} /> : null}
      <T size={font.h1} weight="bold">{title}</T>
    </Row>
  );
}

export function PrimaryButton({ label, onPress, style }) {
  const i18n = useI18n();
  const txt = i18n && i18n.tr ? i18n.tr(label) : label;
  return (
    <Pressable onPress={onPress} style={[styles.primaryBtn, { backgroundColor: colors.accent }, style]}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{txt}</Text>
    </Pressable>
  );
}

// زر تبديل اللغة
export function LangToggle({ style }) {
  const i18n = useI18n();
  if (!i18n) return null;
  return (
    <Pressable onPress={i18n.toggle} style={[styles.langBtn, style]}>
      <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>
        {i18n.isRTL ? 'EN' : 'ع'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.round, borderWidth: 1 },
  backBtn: {
    width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  primaryBtn: {
    paddingVertical: 15, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  langBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
});
