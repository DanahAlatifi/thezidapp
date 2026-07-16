// ---------------------------------------------------------------------------
// عروض الحالة المشتركة: تحميل / خطأ / فارغ / مسار غير جاهز
// تُستخدم في كل الشاشات التي تسحب من أودو لتوحيد الشكل.
// ---------------------------------------------------------------------------
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../theme';
import { T, Card } from './ui';

export function LoadingView({ label = 'جارٍ التحميل…' }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 26 }}>
      <ActivityIndicator color={colors.accent} />
      <T center size={12.5} color={colors.muted} style={{ marginTop: 10 }}>{label}</T>
    </View>
  );
}

export function ErrorView({ message, onRetry }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 26, marginBottom: 14 }}>
      <T center size={13} weight="bold" color={colors.danger}>{message || 'حدث خطأ'}</T>
      {onRetry && (
        <T center size={12.5} color={colors.accent} weight="semi" style={{ marginTop: 10 }} onPress={onRetry}>
          إعادة المحاولة
        </T>
      )}
    </Card>
  );
}

export function EmptyView({ title = 'لا توجد بيانات', hint }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 30, marginBottom: 14 }}>
      <T size={14} weight="bold">{title}</T>
      {hint ? <T size={12} color={colors.muted} style={{ marginTop: 6 }}>{hint}</T> : null}
    </Card>
  );
}

// مسار الباك اند غير جاهز بعد (الفواتير/السجلّات)
export function PendingView({ title = 'غير متاح بعد', hint = 'سيظهر المحتوى فور تجهيز الخدمة في الخادم.' }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 30, marginBottom: 14 }}>
      <T size={14} weight="bold" color={colors.muted}>{title}</T>
      <T size={12} color={colors.mutedLight} style={{ marginTop: 6, textAlign: 'center' }}>{hint}</T>
    </Card>
  );
}

// غلاف يختار العرض المناسب حسب الحالة، وإلا يعرض children
export function AsyncState({ loading, error, pending, empty, onRetry, loadingLabel, emptyTitle, emptyHint, pendingTitle, pendingHint, children }) {
  if (loading) return <LoadingView label={loadingLabel} />;
  if (error) return <ErrorView message={error} onRetry={onRetry} />;
  if (pending) return <PendingView title={pendingTitle} hint={pendingHint} />;
  if (empty) return <EmptyView title={emptyTitle} hint={emptyHint} />;
  return children;
}
