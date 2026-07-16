import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, radius, syncBadge } from '../theme';
import { T, ScreenTitle } from '../components/ui';
import { ScreenBg } from '../components/ScreenBg';
import { StoreHeader } from '../components/StoreHeader';
import { useI18n } from '../i18n';
import { useStore } from '../data/store';
import { ORDERS, ORDER_ITEMS, initialOf, avatarOf } from '../data/mock';
import api, { CONFIG } from '../api/odoo';

const PCOLOR = { 'زد': colors.accent };
const RANGES = [['today', 'اليوم'], ['7', '7 أيام'], ['30', '30 يوم'], ['month', 'هذا الشهر']];

// تحويل مفتاح المنصة من الباك اند (zid) إلى الاسم العربي (زد)
const PROVIDER_AR = { zid: 'زد' };

// عدد الأيام منذ تاريخ الطلب (الباك اند يرسل "YYYY-MM-DD HH:MM")
function daysSince(dateStr) {
  if (!dateStr) return 9999;
  const d = new Date(String(dateStr).replace(' ', 'T'));
  if (isNaN(d.getTime())) return 9999;
  const ms = Date.now() - d.getTime();
  return Math.floor(ms / 86400000);
}

export function OrdersScreen({ navigation }) {
  const { isRTL, tr } = useI18n();
  const { curStoreId, curStore, curProvider } = useStore();   // المتجر المختار
  const row = isRTL ? 'row-reverse' : 'row';
  const [range, setRange] = useState('30');
  const [prov, setProv] = useState('all');

  const [liveOrders, setLiveOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!CONFIG.USE_API) return;
    // لا نجلب شيئاً حتى يختار المستخدم متجراً
    if (!curStoreId) { setLiveOrders([]); return; }

    let alive = true;
    setLoading(true);
    setError('');
    (async () => {
      try {
        // طلبات المتجر المختار فقط
        const res = await api.fetchOrders(curStoreId, 1);
        if (!res || !res.ok || !Array.isArray(res.orders)) {
          throw new Error((res && (res.detail || res.error)) || 'تعذّر جلب الطلبات');
        }
        const providerKey = 'zid';
        const all = res.orders.map((o) => ({
          id: String(o.id),
          ref: o.name,
          customer: o.customer || '—',
          mobile: o.customer_mobile || '',
          provider: PROVIDER_AR[providerKey] || providerKey,
          providerKey,
          store: curStore,
          date: o.date || '',
          days: daysSince(o.date),
          currency: o.currency || '',
          total: `${o.currency || ''} ${o.total}`,
          amount_total: o.total,
          state: o.state,
          state_label: o.state_label,
          sync: o.zid_ref ? 'synced' : 'pending',
          soRef: o.zid_ref || '—',
          payment: '—',
        }));
        if (alive) setLiveOrders(all);
      } catch (e) {
        if (alive) setError(e.message || 'تعذّر الاتصال بالخادم');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [curStoreId]);   // يعيد الجلب عند تبديل المتجر

  const source = CONFIG.USE_API ? liveOrders : ORDERS;
  // قبل اختيار متجر: لا نعرض شيئاً
  const noStore = CONFIG.USE_API && !curStoreId;

  // فلاتر المدة تعمل الآن على البيانات الحقيقية أيضاً
  const rd = { today: 0, '7': 7, '30': 30, month: 31 }[range];
  let list = source.filter((o) =>
    range === 'today' ? o.days === 0 : o.days <= rd
  );
  if (prov !== 'all') list = list.filter((o) => o.provider === prov);

  const stats = { done: 0, pending: 0, failed: 0 };
  list.forEach((o) => { stats[o.sync === 'synced' ? 'done' : o.sync === 'pending' ? 'pending' : 'failed']++; });

  const isEmpty = CONFIG.USE_API && !loading && !error && list.length === 0;

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 18 }}>
          <T size={24} weight="bold" style={{ marginBottom: 12 }}>الطلبات المزامَنة</T>
        </View>

        {/* مبدّل المتجر */}
        <View style={{ paddingHorizontal: 18, marginBottom: 14 }}>
          <StoreHeader navigation={navigation} embedded />
        </View>

        {/* قبل اختيار متجر: لا نعرض بيانات */}
        {noStore ? (
          <View style={{ paddingHorizontal: 18, paddingVertical: 40 }}>
            <T center size={15} weight="bold">اختر متجراً أولاً</T>
            <T center size={12.5} color={colors.muted} style={{ marginTop: 8 }}>
              اضغط على مبدّل المتجر بالأعلى لعرض طلبات المتجر
            </T>
          </View>
        ) : (
        <>
        {loading && <T center size={13} color={colors.muted} style={{ marginBottom: 12 }}>جارٍ تحميل الطلبات…</T>}
        {error ? <T center size={12.5} color={colors.danger} style={{ marginBottom: 12 }}>{error}</T> : null}

        <View style={[styles.statsRow, { flexDirection: row }]}>
          <StatBox bg={colors.syncOkBg} border={colors.syncOkBorder} dot={colors.syncOkDot} labelColor={colors.syncOkText} label="مكتملة" value={stats.done} />
          <StatBox bg={colors.syncWarnBg} border={colors.syncWarnBorder} dot={colors.syncWarnDot} labelColor={colors.syncWarnText} label="قيد الانتظار" value={stats.pending} />
          <StatBox bg={colors.syncFailBg} border={colors.syncFailBorder} dot={colors.syncFailDot} labelColor={colors.syncFailText} label="فشل" value={stats.failed} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.pillRow, { flexDirection: row }]}>
          {RANGES.map(([k, l]) => <FilterPill key={k} label={l} active={range === k} onPress={() => setRange(k)} square />)}
        </ScrollView>
        {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.pillRow, { flexDirection: row, paddingBottom: 14 }]}>
          {PROVS.map(([k, l]) => <FilterPill key={k} label={l} active={prov === k} onPress={() => setProv(k)} />)}
        </ScrollView> */}

        {isEmpty && (
          <View style={{ paddingHorizontal: 18, paddingVertical: 24 }}>
            <T center size={13.5} weight="bold">لا توجد طلبات</T>
            <T center size={12} color={colors.muted} style={{ marginTop: 6 }}>جرّبي توسيع المدة أو مزامنة متجرك</T>
          </View>
        )}

        <View style={{ paddingHorizontal: 18, gap: 11 }}>
          {list.map((o, i) => {
            const [avBg, avFg] = avatarOf(i);
            const b = syncBadge[o.sync];
            const pc = PCOLOR[o.provider] || colors.accent; // لون افتراضي لو المنصة غير معروفة
            return (
              <Pressable key={o.id} onPress={() => navigation.navigate('OrderDetail', { id: o.id, order: o })} style={styles.orderCard}>
                <View style={[styles.orderTop, { flexDirection: row }]}>
                  <View>
                    <T weight="bold" size={14} style={{ writingDirection: 'ltr', textAlign: isRTL ? 'right' : 'left' }}>{o.ref || o.id}</T>
                    <T size={11} color={colors.muted} style={{ marginTop: 2 }}>{o.date}</T>
                  </View>
                  <View style={{ flexDirection: row, alignItems: 'center', gap: 7 }}>
                    <View style={[styles.tag, { backgroundColor: b.bg }]}><T size={10.5} weight="bold" color={b.fg}>{b.label}</T></View>
                    <View style={[styles.tag, { backgroundColor: pc }]}><T size={10.5} weight="bold" color="#fff">{o.provider}</T></View>
                  </View>
                </View>
                <View style={[styles.orderBottom, { flexDirection: row }]}>
                  <View style={{ flexDirection: row, alignItems: 'center', gap: 10 }}>
                    <View style={[styles.avatar, { backgroundColor: avBg }]}><T weight="bold" size={13} color={avFg}>{initialOf(o.customer)}</T></View>
                    <View>
                      <T weight="bold" size={14}>{o.customer}</T>
                      <T size={11.5} color={colors.muted}>{o.store}</T>
                    </View>
                  </View>
                  <T weight="bold" size={15}>{o.total}</T>
                </View>
              </Pressable>
            );
          })}
        </View>
        </>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

function StatBox({ bg, border, dot, labelColor, label, value }) {
  return (
    <View style={[styles.statBox, { backgroundColor: bg, borderColor: border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={[styles.smallDot, { backgroundColor: dot }]} />
        <T size={11} weight="semi" color={labelColor}>{label}</T>
      </View>
      <T size={20} weight="bold" style={{ marginTop: 5 }}>{value}</T>
    </View>
  );
}

function FilterPill({ label, active, onPress, square }) {
  return (
    <Pressable onPress={onPress} style={[
      styles.filterPill,
      { borderRadius: square ? 10 : 20, backgroundColor: active ? colors.accent : '#fff', borderColor: active ? colors.accent : '#E2DEEC' },
    ]}>
      <T size={12.5} weight="semi" color={active ? '#fff' : colors.inkSoft}>{label}</T>
    </Pressable>
  );
}

export function OrderDetailScreen({ route, navigation }) {
  const { isRTL, tr } = useI18n();
  const row = isRTL ? 'row-reverse' : 'row';
  const id = route.params?.id || ORDERS[0].id;
  const o = route.params?.order || ORDERS.find((x) => x.id === id) || ORDERS[0];
  const b = syncBadge[o.sync];
  const [avBg, avFg] = avatarOf(0);

  // منتجات الطلب الحقيقية من أودو
  const [lines, setLines] = useState(CONFIG.USE_API ? [] : ORDER_ITEMS);
  const [loadingLines, setLoadingLines] = useState(CONFIG.USE_API);

  useEffect(() => {
    if (!CONFIG.USE_API) return;
    let alive = true;
    api.fetchOrderDetail(id)
      .then((res) => {
        if (!alive) return;
        if (res && res.ok && res.order && Array.isArray(res.order.lines)) {
          setLines(res.order.lines.map((l) => ({
            name: l.name,
            sku: l.sku || '',
            qty: l.qty,
            line: `${o.currency || ''} ${l.subtotal}`,
          })));
        }
      })
      .catch(() => {})
      .finally(() => alive && setLoadingLines(false));
    return () => { alive = false; };
  }, [id]);

  const timeline = [
    { label: `${tr('استلام من')} ${tr(o.provider)}`, time: o.date, color: colors.accent },
    { label: 'الربط بعميل أودو', time: 'بعد لحظات', color: '#8d6fc0' },
    {
      label: o.sync === 'failed' ? 'فشلت المزامنة — تحتاج إعادة' : 'إنشاء أمر البيع',
      time: o.sync === 'failed' ? 'يتطلب إجراء' : 'اكتمل',
      color: o.sync === 'failed' ? colors.danger : colors.success,
    },
  ];

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 52, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <ScreenTitle title={o.ref || o.id} onBack={() => navigation.goBack()} />

        <View style={styles.detailCard}>
          <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
              <View style={[styles.avatar, { backgroundColor: avBg, width: 46, height: 46, borderRadius: 23 }]}><T weight="bold" size={16} color={avFg}>{initialOf(o.customer)}</T></View>
              <View>
                <T weight="bold" size={16}>{o.customer}</T>
                <T size={12.5} color={colors.muted} ltr>{o.mobile}</T>
              </View>
            </View>
            <View style={[styles.tag, { backgroundColor: b.bg }]}><T size={11} weight="bold" color={b.fg}>{b.label}</T></View>
          </View>
          <Line label="المتجر" value={`${tr(o.provider)} · ${tr(o.store)}`} />
          <Line label="الحالة" value={o.state_label || '—'} />
          <Line label="مرجع أمر البيع (أودو)" value={o.soRef} ltr />
          <Line label="الإجمالي" value={o.total} last />
        </View>

        <View style={styles.detailCard}>
          <T size={11} weight="bold" color={colors.muted} style={{ marginBottom: 11 }}>المنتجات</T>
          {loadingLines && <T size={12.5} color={colors.muted}>جارٍ التحميل…</T>}
          {!loadingLines && lines.length === 0 && (
            <T size={12.5} color={colors.muted}>لا توجد بنود لهذا الطلب</T>
          )}
          {lines.map((it, i) => (
            <View key={i} style={[styles.itemRow, { flexDirection: row }, i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderSoft }]}>
              <View style={{ flex: 1 }}>
                <T size={13.5} weight="semi">{it.name}</T>
                <T size={11} color={colors.muted}>{it.sku ? it.sku + ' · ' : ''}× {it.qty}</T>
              </View>
              <T size={13.5} weight="semi">{it.line}</T>
            </View>
          ))}
        </View>

        <View style={styles.detailCard}>
          <T size={11} weight="bold" color={colors.muted} style={{ marginBottom: 14 }}>مسار المزامنة مع أودو</T>
          {timeline.map((t, i) => (
            <View key={i} style={{ flexDirection: row, gap: 12, marginBottom: i < timeline.length - 1 ? 14 : 0 }}>
              <View style={{ alignItems: 'center' }}>
                <View style={[styles.tlDot, { backgroundColor: t.color }]} />
                {i < timeline.length - 1 && <View style={styles.tlLine} />}
              </View>
              <View style={{ flex: 1 }}>
                <T size={13.5} weight="semi">{t.label}</T>
                <T size={11.5} color={colors.muted}>{t.time}</T>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenBg>
  );
}

function Line({ label, value, ltr, last }) {
  const { isRTL } = useI18n();
  const row = isRTL ? 'row-reverse' : 'row';
  return (
    <View style={[styles.line, { flexDirection: row }, !last && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft }]}>
      <T size={13} color={colors.muted}>{label}</T>
      <T size={13} weight="semi" style={ltr ? { writingDirection: 'ltr' } : null}>{value}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 58, paddingBottom: 30 },
  statsRow: { gap: 8, paddingHorizontal: 18, paddingBottom: 14 },
  statBox: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 10, paddingHorizontal: 12 },
  smallDot: { width: 7, height: 7, borderRadius: 4 },
  pillRow: { gap: 8, paddingHorizontal: 18, paddingBottom: 10 },
  filterPill: { borderWidth: 1, paddingVertical: 8, paddingHorizontal: 14 },
  orderCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 15 },
  orderTop: { flexDirection: 'row-reverse', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 13 },
  orderBottom: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  tag: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  detailCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginBottom: 14 },
  line: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 9 },
  itemRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 8 },
  tlDot: { width: 14, height: 14, borderRadius: 7 },
  tlLine: { width: 2, height: 30, backgroundColor: colors.border, marginTop: 2 },
});
