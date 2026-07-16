import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '../theme';
import { T, Card, Row, Badge, PrimaryButton, ScreenTitle } from '../components/ui';
import { ScreenBg } from '../components/ScreenBg';
import { AsyncState } from '../components/StateViews';
import { PROVIDER_KEY_BY_NAME } from '../data/ui';
import { BrandLogo, BRAND } from '../brands';
import api, { CONFIG } from '../api/odoo';
import { useApiList } from '../api/useApi';

const ENTITY_KEYS = [
  ['orders', 'الطلبات'],
  ['products', 'المنتجات'],
  ['customers', 'العملاء'],
  ['categories', 'التصنيفات'],
];
const LOG_ICON_COLOR = { ok: colors.success, warn: colors.warning, err: colors.danger };
const LOG_BG = { ok: colors.successBg, warn: colors.warningBg, err: colors.dangerBg };

// ————— شاشة المزامنة —————
export function SyncScreen({ navigation }) {
  // نسحب المتاجر من أودو (نفس مصدر /api/connections)
  const { data: stores, loading, error, empty, reload } = useApiList(
    api.fetchConnections,
    (res) => (res.stores || []).map((s) => ({
      id: s.id,
      name: s.name,
      key: s.provider || 'zid',
      provider: (BRAND[s.provider] || {}).name || s.provider,
      last: s.last_sync_orders || '—',
      running: s.running,
      failed: !s.running,
      sync: s.sync || {}, // {orders, products, customers, categories, prices, images} من الباك اند
    })),
    [],
  );

  // حالة المزامنة الفردية: 'idle' | id المتجر الجاري
  const [busy, setBusy] = useState('idle');
  const [msg, setMsg] = useState('');

  const syncOne = async (store) => {
    if (busy !== 'idle') return;
    setBusy(store.id);
    setMsg('');
    try {
      const res = await api.syncStore(store.id, 'all');
      if (!res || !res.ok) {
        setMsg('تعذّرت مزامنة ' + store.name + (res && res.detail ? `: ${res.detail}` : ''));
      }
    } catch (e) {
      setMsg('تعذّر الاتصال بالخادم');
    }
    setBusy('idle');
    reload();
  };

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="المزامنة" />

        {msg ? <T center size={11.5} color={colors.danger} style={{ marginBottom: 14 }}>{msg}</T> : null}

        <AsyncState
          loading={loading} error={error} empty={empty} onRetry={reload}
          loadingLabel="جارٍ جلب المتاجر…"
          emptyTitle="لا توجد متاجر مربوطة"
          emptyHint="اربط متجرك الأول لتبدأ المزامنة"
        >
          {stores.map((st, i) => {
            const oneBusy = busy === st.id;
            return (
              <Card key={st.id ?? i} style={{ marginBottom: 12 }}>
                <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                  <Row gap={10}>
                    <BrandLogo brand={st.key} size={36} />
                    <View>
                      <T weight="bold" size={14}>{st.name}</T>
                      <T size={11.5} color={colors.muted}>
                        {st.provider} · {oneBusy ? 'جارٍ المزامنة…' : 'آخر مزامنة ' + st.last}
                      </T>
                    </View>
                  </Row>
                  <Badge
                    label={oneBusy ? 'يزامن' : st.failed ? 'متوقف' : 'سليم'}
                    bg={oneBusy ? colors.accentSoft : st.failed ? colors.warningBg : colors.successBg}
                    fg={oneBusy ? colors.accent : st.failed ? colors.warning : colors.success}
                  />
                </Row>
                <Row gap={6} style={{ flexWrap: 'wrap' }}>
                  {ENTITY_KEYS.map(([key, label]) => {
                    const enabled = st.sync[key] !== false; // افتراضي مفعّل لو ما وصل الحقل
                    return (
                      <View key={key} style={[styles.entityChip, !enabled && { opacity: 0.4 }]}>
                        <T size={11.5} color={colors.inkSoft} weight="semi">{label}</T>
                      </View>
                    );
                  })}
                </Row>
                <Pressable
                  onPress={() => syncOne(st)}
                  style={[styles.syncBtn, (oneBusy || !st.running) && { opacity: 0.55 }]}
                >
                  <T size={13} weight="bold" color={colors.accent}>
                    {oneBusy ? 'جارٍ المزامنة…' : st.running ? 'مزامنة هذا المتجر' : 'المتجر متوقف'}
                  </T>
                </Pressable>
              </Card>
            );
          })}
        </AsyncState>

        <Pressable onPress={() => navigation.navigate('Logs')} style={{ marginTop: 6 }}>
          <T center size={13.5} weight="semi" color={colors.accent}>عرض سجل المزامنة الكامل ←</T>
        </Pressable>
      </ScrollView>
    </ScreenBg>
  );
}

// ————— شاشة سجل المزامنة —————
export function LogsScreen({ navigation }) {
  // السجلّات: لا يوجد endpoint في الباك اند بعد → api.fetchLogs ترجّع pending مباشرة
  const { data: logs, loading, error, pending, empty, reload } = useApiList(
    api.fetchLogs,
    (res) => res.logs || [],
    [],
  );

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="سجل المزامنة" onBack={() => navigation.goBack()} />
        <AsyncState
          loading={loading} error={error} pending={pending} empty={empty} onRetry={reload}
          loadingLabel="جارٍ جلب السجلّات…"
          pendingTitle="سجل المزامنة غير متاح بعد"
          pendingHint="سيظهر السجل فور تجهيز الخدمة في الخادم."
          emptyTitle="لا توجد عمليات مسجّلة"
        >
          <Card style={{ padding: 0 }}>
            {logs.map((l, i) => (
              <Row key={i} gap={12} style={[styles.logRow, i > 0 && styles.divider]}>
                <View style={[styles.logIcon, { backgroundColor: LOG_BG[l.status] || colors.successBg }]}>
                  {l.status === 'ok' && <Svg width={13} height={13} viewBox="0 0 24 24" fill="none"><Path d="M5 12l4 4 10-10" stroke={LOG_ICON_COLOR.ok} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></Svg>}
                  {l.status === 'warn' && <Svg width={13} height={13} viewBox="0 0 24 24" fill="none"><Path d="M12 3l9 16H3z" stroke={LOG_ICON_COLOR.warn} strokeWidth="2" strokeLinejoin="round" /></Svg>}
                  {l.status === 'err' && <Svg width={13} height={13} viewBox="0 0 24 24" fill="none"><Path d="M6 6l12 12M18 6L6 18" stroke={LOG_ICON_COLOR.err} strokeWidth="3" strokeLinecap="round" /></Svg>}
                </View>
                <View style={{ flex: 1 }}>
                  <T size={13} weight="semi">{l.msg}</T>
                  <Row gap={6} style={{ marginTop: 2 }}>
                    <BrandLogo brand={PROVIDER_KEY_BY_NAME[l.provider] || l.provider} size={14} />
                    <T size={11} color={colors.muted}>{l.store} · {l.entity} · {l.time}</T>
                  </Row>
                </View>
              </Row>
            ))}
          </Card>
        </AsyncState>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingTop: 52, paddingBottom: 30 },
  entityChip: { backgroundColor: '#F5F3FA', borderRadius: 10, paddingHorizontal: 11, paddingVertical: 6 },
  syncBtn: {
    marginTop: 12, borderWidth: 1, borderColor: '#E2DEEC', borderRadius: radius.md,
    paddingVertical: 11, alignItems: 'center',
  },
  logRow: { padding: 14 },
  divider: { borderTopWidth: 1, borderTopColor: colors.borderSoft },
  logIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});