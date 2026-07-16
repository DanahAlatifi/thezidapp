import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ScrollView, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { colors, radius } from '../theme';
import { T } from '../components/ui';
import { ScreenBg } from '../components/ScreenBg';
import { StoreHeader } from '../components/StoreHeader';
import { useI18n } from '../i18n';
import { useStore } from '../data/store';
import { BRAND } from '../brands';
import api, { CONFIG } from '../api/odoo';

// مدّة التحديث التلقائي (بالميلي ثانية)
const REFRESH_MS = 60000; // دقيقة واحدة

// بطاقة حالة مزامنة (منصة)
function SyncCard({ initial, color, name, sub, state, onPress, isRTL }) {
  const ok = state === 'ok';
  const row = isRTL ? 'row-reverse' : 'row';
  return (
    <Pressable onPress={onPress} style={[styles.syncCard, { flexDirection: row,
      backgroundColor: ok ? colors.syncOkBg : colors.syncWarnBg,
      borderColor: ok ? colors.syncOkBorder : colors.syncWarnBorder,
    }]}>
      <View style={[styles.syncBadgeSq, { backgroundColor: color }]}>
        <T weight="bold" size={13} color="#fff">{initial}</T>
      </View>
      <View style={{ flex: 1 }}>
        <T weight="bold" size={13.5}>{name}</T>
        <T size={11.5} color={ok ? colors.syncOkText : colors.syncWarnText}>{sub}</T>
      </View>
      <View style={[styles.statusPill, { flexDirection: row, backgroundColor: ok ? '#DCEFE2' : '#F7ECCD' }]}>
        <View style={[styles.statusDot, { backgroundColor: ok ? colors.syncOkDot : colors.syncWarnDot }]} />
        <T size={11} weight="bold" color={ok ? colors.syncOkText : '#A6791B'}>{ok ? 'متزامن' : 'تحذير'}</T>
      </View>
    </Pressable>
  );
}

// تنسيق رقم بفواصل الآلاف، مع بديل أثناء التحميل
function fmt(n, fallback = '—') {
  if (n === null || n === undefined || Number.isNaN(n)) return fallback;
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// نص/لون شارة نسبة التغيّر (▲/▼) أو نص محايد لو ما فيه بيانات مقارنة
function changeBadge(pct, positiveLabel, neutralLabel = 'لا تغيّر بعد') {
  if (pct === null || pct === undefined) {
    return { text: neutralLabel, bg: '#EFEBF6', color: colors.muted };
  }
  const up = pct >= 0;
  const arrow = up ? '▲' : '▼';
  return {
    text: `${arrow} ${Math.abs(pct)}%${positiveLabel ? ' ' + positiveLabel : ''}`,
    bg: up ? colors.successBg : colors.dangerBg,
    color: up ? colors.success : colors.danger,
  };
}

// يبني مسار SVG لمخطط sparkline من مصفوفة أرقام (قيم يومية)
function buildSparklinePath(values, w = 300, h = 62, padTop = 8, padBottom = 6) {
  const arr = (values && values.length) ? values : [0];
  const max = Math.max(...arr, 1);
  const stepX = arr.length > 1 ? w / (arr.length - 1) : 0;
  const pts = arr.map((v, i) => {
    const x = i * stepX;
    const ratio = v / max;
    const y = h - padBottom - ratio * (h - padTop - padBottom);
    return [x, y];
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  return { line, area };
}

// بطاقة نظرة عامة
function OverviewCard({ icon, iconBg, iconColor, borderColor, title, valueLabel, value, badge, badgeBg, badgeColor, onPress, isRTL }) {
  const row = isRTL ? 'row-reverse' : 'row';
  return (
    <Pressable onPress={onPress} style={[styles.ovCard, { flexDirection: row, borderColor }]}>
      <View style={[styles.ovIcon, { backgroundColor: iconBg }]}>{icon(iconColor)}</View>
      <View style={{ flex: 1 }}>
        <T weight="bold" size={15.5}>{title}</T>
        <T size={12.5} color="#5C5C5C" style={{ marginTop: 3 }}>
          {valueLabel}: <T size={12.5} weight="bold">{value}</T>
        </T>
        <View style={[styles.ovBadge, { backgroundColor: badgeBg }]}>
          <T size={11} weight="bold" color={badgeColor}>{badge}</T>
        </View>
      </View>
    </Pressable>
  );
}

export function HomeScreen({ navigation }) {
  const { t, isRTL } = useI18n();
  const { profile, initials, curStoreId, curStore } = useStore();
  const row = isRTL ? 'row-reverse' : 'row';
  const displayName = profile.accountType === 'company' ? profile.company : profile.name;

  // ----- الحالة -----
  const [liveStores, setLiveStores] = useState(CONFIG.USE_API ? [] : null);
  const [storesError, setStoresError] = useState('');
  const [dash, setDash] = useState(null);
  const [dashError, setDashError] = useState('');
  const [rangeType, setRangeType] = useState('days');   // days | months | years
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const aliveRef = useRef(true);

  // ----- جلب البيانات (المتاجر + الداشبورد معاً) -----
  const loadData = useCallback(async () => {
    if (!CONFIG.USE_API) return;

    try {
      // المتاجر دائماً، والداشبورد فقط عند اختيار متجر
      const conn = await api.fetchConnections();
      if (aliveRef.current) {
        if (conn && conn.ok && Array.isArray(conn.stores)) {
          setLiveStores(conn.stores);
          setStoresError('');
        } else {
          setStoresError((conn && (conn.detail || conn.error)) || 'تعذّر الجلب');
        }
      }

      // لا نجلب الداشبورد قبل اختيار متجر
      if (!curStoreId) {
        setDash(null);
        setLastUpdate(new Date());
        return;
      }

      const dashRes = await api.fetchDashboard(rangeType, curStoreId);
      if (!aliveRef.current) return;

      if (dashRes && dashRes.ok && dashRes.dashboard) {
        setDash(dashRes.dashboard);
        setDashError('');
      } else {
        setDashError((dashRes && (dashRes.detail || dashRes.error)) || 'تعذّر الجلب');
      }

      setLastUpdate(new Date());
    } catch (e) {
      if (!aliveRef.current) return;
      setStoresError(e.message || 'تعذّر الاتصال');
      setDashError(e.message || 'تعذّر الاتصال');
    }
  }, [rangeType, curStoreId]);

  // ----- تحميل أولي + تحديث تلقائي كل دقيقة -----
  useEffect(() => {
    aliveRef.current = true;
    loadData();

    const id = setInterval(loadData, REFRESH_MS);

    return () => {
      aliveRef.current = false;
      clearInterval(id);
    };
  }, [loadData]);

  // ----- تحديث عند العودة للشاشة -----
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // ----- سحب للتحديث -----
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // ----- اشتقاق آمن للبيانات -----
  const live = CONFIG.USE_API ? dash : null;
  const today = live?.today ?? {};
  const overview = live?.overview ?? {};

  const currency = today.currency || live?.currency || '﷼';
  const activeStoresCount = liveStores ? liveStores.filter((s) => s.running).length : null;
  const totalStoresCount = liveStores ? liveStores.length : null;


  // بيانات الرسم من الفلتر الزمني (chart)، مع تراجع لـ sales_last6 القديم
  const chartData = live?.chart?.length ? live.chart : null;
  const salesBars = chartData
    ? (() => {
        const vals = chartData.map((c) => c.sales);
        const max = Math.max(...vals, 1);
        return vals.map((v) => Math.max(6, Math.round((v / max) * 100)));
      })()
    : live?.sales_last6?.length
    ? (() => {
        const vals = live.sales_last6;
        const max = Math.max(...vals, 1);
        return vals.map((v) => Math.max(6, Math.round((v / max) * 100)));
      })()
    : [42, 60, 48, 76, 54, 100];

  const chartLabels = chartData ? chartData.map((c) => c.label) : [];

  // إجمالي المبيعات/الطلبات للفترة المختارة (يتغير مع الفلتر)
  const rangeSales = live?.range_sales ?? null;
  const rangeOrders = live?.range_orders ?? null;
  const rangeLabel = rangeType === 'years' ? 'آخر 5 سنوات'
    : rangeType === 'months' ? 'آخر 12 شهر' : 'آخر 30 يوم';

  const updateLabel = lastUpdate
    ? `آخر تحديث ${lastUpdate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    : '';

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={styles.wrap}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* مبدّل المتجر + أفاتار */}
        <View style={{ flexDirection: row, alignItems: 'center', gap: 11, marginBottom: 18 }}>
          <View style={{ flex: 1 }}>
            <StoreHeader navigation={navigation} embedded />
          </View>
          <View style={styles.userAvatar}><T weight="bold" size={14} color={colors.accent}>{initials || 'RA'}</T></View>
        </View>

        {/* التحية */}
        <T size={12} weight="bold" style={{ color: '#9B96A9', letterSpacing: 0.3 }}>{t('goodEvening')}{isRTL ? '، ' : ', '}{profile.name}</T>
        <T size={25} weight="bold" style={{ marginTop: 3 }}>{displayName}</T>
        {updateLabel ? (
          <T size={10.5} color="#B0ABBD" style={{ marginTop: 4 }}>{updateLabel}</T>
        ) : null}

        {/* لا نعرض الأرقام قبل اختيار متجر */}
        {CONFIG.USE_API && !curStoreId ? (
          <View style={{ paddingVertical: 50, alignItems: 'center' }}>
            <T center size={15} weight="bold">اختر متجراً لعرض البيانات</T>
            <T center size={12.5} color={colors.muted} style={{ marginTop: 8 }}>
              اضغط على مبدّل المتجر بالأعلى لعرض مبيعات وإحصائيات المتجر
            </T>
          </View>
        ) : (
        <>
        {/* ملخص اليوم */}
        <View style={[styles.sectionHead, { flexDirection: row }]}>
          <T size={16} weight="bold">{t('todaySummary')}</T>
          <Pressable onPress={() => navigation.navigate('Orders')}>
            <T size={12.5} weight="bold" color={colors.accent}>{t('allOrders')}</T>
          </Pressable>
        </View>

        {/* رسم المبيعات مع فلتر زمني */}
        <View style={styles.chartCard}>
          <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <T size={14} weight="bold">المبيعات</T>
            <View style={{ flexDirection: row, gap: 6 }}>
              {[['days', 'أيام'], ['months', 'شهور'], ['years', 'سنوات']].map(([k, label]) => {
                const on = rangeType === k;
                return (
                  <Pressable key={k} onPress={() => setRangeType(k)}
                    style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 9,
                             backgroundColor: on ? colors.accent : '#F1EEF7' }}>
                    <T size={11.5} weight="bold" color={on ? '#fff' : colors.muted}>{label}</T>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {/* إجمالي مبيعات الفترة المختارة */}
          <View style={{ marginBottom: 12 }}>
            <T size={11.5} color="#7C7690">{rangeLabel}</T>
            <View style={{ flexDirection: row, alignItems: 'baseline', gap: 8, marginTop: 3 }}>
              <T size={26} weight="bold" style={{ letterSpacing: -0.5 }}>
                {currency} {live && rangeSales !== null ? fmt(rangeSales) : (CONFIG.USE_API ? '…' : '0')}
              </T>
              <T size={11.5} color={colors.muted}>
                {live && rangeOrders !== null ? `${fmt(rangeOrders)} طلب` : ''}
              </T>
            </View>
          </View>
          <View style={[styles.barRow, { height: 90 }]}>
            {salesBars.map((h, i) => (
              <View key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: i === salesBars.length - 1 ? '#F5B72E' : '#FBE6AE', borderRadius: 4 }} />
            ))}
          </View>
          {chartLabels.length > 0 && (
            <View style={{ flexDirection: row, marginTop: 6, justifyContent: 'space-between' }}>
              <T size={9} color={colors.muted}>{chartLabels[0]}</T>
              {chartLabels.length > 2 && <T size={9} color={colors.muted}>{chartLabels[Math.floor(chartLabels.length / 2)]}</T>}
              <T size={9} color={colors.muted}>{chartLabels[chartLabels.length - 1]}</T>
            </View>
          )}
        </View>

        {/* المبيعات + المتاجر */}
        <View style={[styles.dualRow, { flexDirection: row }]}>
          <View style={{ flex: 1 }}>
            <T size={12} color="#7C7690">{t('salesToday')}</T>
            <View style={{ flexDirection: row, alignItems: 'baseline', gap: 7, marginTop: 3, marginBottom: 11 }}>
              <T size={21} weight="bold" style={{ letterSpacing: -0.5 }}>
                {currency} {live ? fmt(today.sales_total) : (CONFIG.USE_API ? '…' : '2,940')}
              </T>
              {(() => {
                const b = live ? changeBadge(today.sales_change_pct) : { text: '▲ 8%', color: colors.success };
                return <T size={10.5} weight="bold" color={b.color} style={{ writingDirection: 'ltr' }}>{b.text}</T>;
              })()}
            </View>
          </View>
          <View style={styles.vDivider} />
          <View style={{ flex: 1 }}>
            <T size={12} color="#7C7690">{t('activeStores')}</T>
            <View style={{ flexDirection: row, alignItems: 'baseline', gap: 6, marginTop: 3, marginBottom: 11 }}>
              <T size={21} weight="bold" style={{ letterSpacing: -0.5 }}>
                {activeStoresCount === null ? (CONFIG.USE_API ? '…' : '3') : activeStoresCount}
              </T>
              <T size={13} weight="semi" color="#B7B1C8">/ {totalStoresCount === null ? (CONFIG.USE_API ? '…' : '4') : totalStoresCount}</T>
            </View>
            <View style={styles.barRow}>
              {(liveStores && liveStores.length ? liveStores : [{}, {}, {}, {}]).map((s, i, arr) => {
                const on = liveStores ? s.running : i !== arr.length - 1;
                return <View key={s.id || i} style={{ flex: 1, height: `${on ? 100 : 40}%`, backgroundColor: on ? '#0E9C8E' : '#E4E0EC', borderRadius: 4 }} />;
              })}
            </View>
          </View>
        </View>

        {/* حالة المزامنة */}
        <View style={[styles.sectionHead, { flexDirection: row }]}>
          <T size={16} weight="bold">{t('syncStatus')}</T>
          <Pressable onPress={() => navigation.navigate('Sync')}>
            <T size={12.5} weight="bold" color={colors.accent}>{t('details')}</T>
          </Pressable>
        </View>
        <View style={{ gap: 10 }}>
          {CONFIG.USE_API ? (
            storesError ? (
              <T center size={12.5} color={colors.danger}>{storesError}</T>
            ) : (liveStores && liveStores.length ? liveStores.map((s) => {
              const meta = BRAND[s.provider] || { name: s.provider, color: colors.accent };
              return (
                <SyncCard
                  key={s.id}
                  initial={(meta.name || 'M').charAt(0)}
                  color={meta.color || colors.accent}
                  name={s.name}
                  sub={`${meta.name} · ${s.running ? 'يعمل' : 'متوقف'} · ${s.last_sync_orders || '—'}`}
                  state={s.running ? 'ok' : 'warn'}
                  onPress={() => navigation.navigate('Sync')}
                  isRTL={isRTL}
                />
              );
            }) : (
              <T center size={12.5} color={colors.muted}>لا توجد متاجر مربوطة بعد</T>
            ))
          ) : (
            <>
              <SyncCard initial="Z" color={colors.accent} name="زد" sub="متجران · تمت المزامنة قبل 5 د" state="ok" onPress={() => navigation.navigate('Sync')} isRTL={isRTL} />
            </>
          )}
        </View>

        {/* نظرة عامة */}
        <T size={16} weight="bold" style={{ marginTop: 24, marginBottom: 12, marginHorizontal: 2 }}>{t('overview')}</T>
        <View style={{ gap: 12 }}>
          <OverviewCard isRTL={isRTL}
            borderColor="#F1E4C8" iconBg="#F8D8B6" iconColor="#C67C2E"
            icon={(c) => <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"><Path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" stroke={c} strokeWidth="2" strokeLinejoin="round" /><Path d="M3 7l9 5 9-5M12 12v10" stroke={c} strokeWidth="2" strokeLinejoin="round" /></Svg>}
            title="إجمالي المنتجات" valueLabel="المنتجات"
            value={live ? fmt(overview.products_total) : (CONFIG.USE_API ? '…' : '342')}
            badge={live && overview.products_new_month != null
              ? `+${fmt(overview.products_new_month)} جديد هذا الشهر`
              : 'مجموع منتجات كل المتاجر المربوطة'}
            badgeBg="#F6EBCB" badgeColor="#964D00"
          />
          <OverviewCard isRTL={isRTL}
            borderColor="#D2ECE2" iconBg="#C4EADF" iconColor="#159A83"
            icon={(c) => <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"><Path d="M4 5h2l2.5 11h9l2-8H7" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><Circle cx="9.5" cy="20" r="1.4" fill={c} /><Circle cx="17" cy="20" r="1.4" fill={c} /></Svg>}
            title="متوسط قيمة الطلب" valueLabel="متوسط الطلب"
            value={live ? `${fmt(overview.avg_order_value)} ${currency}` : (CONFIG.USE_API ? '…' : '230 ﷼')}
            badge={live ? changeBadge(overview.avg_order_value_change_pct, 'نمو').text : '▲ 6% نمو'}
            badgeBg={live ? changeBadge(overview.avg_order_value_change_pct, 'نمو').bg : '#DCEFE2'}
            badgeColor={live ? changeBadge(overview.avg_order_value_change_pct, 'نمو').color : colors.success}
          />
          <OverviewCard isRTL={isRTL}
            onPress={() => navigation.navigate('Customers')}
            borderColor="#E2D8F3" iconBg="#DAD0F0" iconColor="#7A57BC"
            icon={(c) => <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"><Circle cx="8" cy="9" r="3" stroke={c} strokeWidth="2" /><Circle cx="16" cy="9" r="3" stroke={c} strokeWidth="2" /><Path d="M2.5 19a5 5 0 019 0M12.5 19a5 5 0 019 0" stroke={c} strokeWidth="2" strokeLinecap="round" /></Svg>}
            title="العملاء النشطون" valueLabel="العملاء النشطون"
            value={live ? fmt(overview.active_customers) : (CONFIG.USE_API ? '…' : '4,120')}
            badge={live ? changeBadge(overview.active_customers_change_pct, 'جديد').text : '▲ 12% جديد'}
            badgeBg={live ? changeBadge(overview.active_customers_change_pct, 'جديد').bg : '#DCEFE2'}
            badgeColor={live ? changeBadge(overview.active_customers_change_pct, 'جديد').color : colors.success}
          />
          <OverviewCard isRTL={isRTL}
            onPress={() => navigation.navigate('Orders')}
            borderColor="#E0D7F1" iconBg="#E3DBF5" iconColor={colors.accent}
            icon={(c) => <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"><Path d="M6 2h12l2 5v13a1 1 0 01-1 1H5a1 1 0 01-1-1V7l2-5z" stroke={c} strokeWidth="2" strokeLinejoin="round" /><Path d="M4 7h16M9 11a3 3 0 006 0" stroke={c} strokeWidth="2" strokeLinecap="round" /></Svg>}
            title="الطلبات المزامَنة" valueLabel="الإجمالي"
            value={live ? fmt(overview.synced_orders_total) : (CONFIG.USE_API ? '…' : '1,284')}
            badge={live ? `${fmt(overview.synced_orders_today)} طلباً اليوم` : '18 طلباً اليوم'}
            badgeBg="#DCEFE2" badgeColor={colors.success}
          />
        </View>

        {dashError ? (
          <T center size={12} color={colors.danger} style={{ marginTop: 10 }}>
            تعذّر تحميل بعض أرقام الداشبورد: {dashError}
          </T>
        ) : null}
        </>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 18, paddingTop: 56, paddingBottom: 30 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EBE5F6', alignItems: 'center', justifyContent: 'center' },
  sectionHead: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12, marginHorizontal: 2 },
  dualRow: { flexDirection: 'row-reverse', gap: 15, borderTopWidth: 1, borderTopColor: 'rgba(110,79,162,.14)', paddingTop: 15, marginTop: 15 },
  vDivider: { width: 1, backgroundColor: 'rgba(110,79,162,.14)' },
  barRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 48 },
  chartCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginBottom: 14 },
  syncCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 14, paddingHorizontal: 15, borderRadius: 16, borderWidth: 1 },
  syncBadgeSq: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statusPill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 11, borderRadius: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  ovCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 20, padding: 16, backgroundColor: '#fff' },
  ovIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ovBadge: { alignSelf: 'flex-start', marginTop: 9, paddingVertical: 4, paddingHorizontal: 11, borderRadius: 20 },
});