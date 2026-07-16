import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { colors, radius, roleBadge } from '../theme';
import { T, Card, Row, Avatar, Badge, ScreenTitle, PrimaryButton } from '../components/ui';
import { ScreenBg } from '../components/ScreenBg';
import { useI18n } from '../i18n';
import { useStore } from '../data/store';
import { PROVIDERS, TEAM, CUSTOMERS, initialOf, avatarOf, PROVIDER_KEY_BY_NAME } from '../data/mock';
import { BrandLogo, BRAND } from '../brands';
import api, { CONFIG } from '../api/odoo';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
const st = StyleSheet.create({
  wrap: { padding: 16, paddingTop: 52, paddingBottom: 30 },
});

// ————— الخدمات والمتاجر —————
export function ServicesScreen({ navigation }) {
  const { tr } = useI18n();
  // عند تفعيل الـ API نبدأ فارغين ونعتمد فقط على أودو (بدون بيانات تجريبية)
  const [providers, setProviders] = useState(CONFIG.USE_API ? [] : PROVIDERS);
  const [loading, setLoading] = useState(CONFIG.USE_API);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(!CONFIG.USE_API);

  useEffect(() => {
    if (!CONFIG.USE_API) return;
    let alive = true;
    setLoading(true);
    setError('');
    api.fetchConnections()
      .then((res) => {
        if (!alive) return;
        if (res && res.ok && Array.isArray(res.stores)) {
          const groups = {};
          res.stores.forEach((s) => {
            const key = s.provider || 'zid';
            const meta = BRAND[key] || { name: key };
            if (!groups[key]) groups[key] = { key, name: meta.name, since: '—', stores: [] };
            groups[key].stores.push({
              id: s.id,
              name: s.name,
              store_id: s.store_id,
              account: 'شركة',
              last: s.last_sync_orders || '—',
              state: s.running ? 'on' : 'off',
              dot: s.running ? '#1B7A43' : '#B4271F',
              orders_count: s.orders_count,
              products_count: s.products_count,
              customers_count: s.customers_count,
            });
          });
          setProviders(Object.values(groups)); // قد تكون فارغة = قاعدتك فارغة
        } else {
          setError((res && res.error) ? ('خطأ: ' + res.error) : 'تعذّر جلب المتاجر');
        }
      })
      .catch((e) => alive && setError('تعذّر الاتصال بالخادم: ' + (e.message || '')))
      .finally(() => { if (alive) { setLoading(false); setLoaded(true); } });
    return () => { alive = false; };
  }, []);

  const isEmpty = loaded && !loading && !error && providers.length === 0;

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="الخدمات والمتاجر" onBack={() => navigation.goBack()} />
        {loading && <T center size={13} color={colors.muted} style={{ marginBottom: 14 }}>جارٍ التحميل…</T>}
        {error ? <T center size={12.5} color={colors.danger} style={{ marginBottom: 14 }}>{error}</T> : null}
        {isEmpty && (
          <Card style={{ alignItems: 'center', paddingVertical: 30, marginBottom: 14 }}>
            <T size={14} weight="bold">لا توجد متاجر مربوطة</T>
            <T size={12} color={colors.muted} style={{ marginTop: 6 }}>ابدأ بربط متجرك الأول</T>
          </Card>
        )}
        {providers.map((p) => (
          <Card key={p.key} style={{ marginBottom: 14 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <Row gap={12}>
                <BrandLogo brand={p.key} size={44} />
                <View>
                  <T weight="bold" size={15}>{p.name}</T>
                  <T size={11.5} color={colors.muted}>{tr('مرتبط منذ')} {p.since}</T>
                </View>
              </Row>
              <Badge label={p.stores.length === 1 ? 'متجر واحد' : `${p.stores.length} ${tr('متاجر')}`} bg={colors.accentSoft} fg={colors.accent} />
            </Row>
            {p.stores.map((s, i) => (
              <Pressable key={i} onPress={() => navigation.navigate('StoreDetail', { provider: p.key, providerName: p.name, store: s })}>
                <Row gap={10} style={[styles2.storeItem, i > 0 && styles2.div]}>
                  <View style={[styles2.dot, { backgroundColor: s.dot }]} />
                  <View style={{ flex: 1 }}>
                    <T size={13.5} weight="semi">{s.name}</T>
                    <T size={11} color={colors.muted}>{s.account} · آخر مزامنة {s.last}</T>
                  </View>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d="M15 5l-7 7 7 7" stroke={colors.mutedLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                </Row>
              </Pressable>
            ))}
          </Card>
        ))}
        <PrimaryButton label="+ ربط خدمة جديدة" onPress={() => navigation.navigate('Connect')} />
      </ScrollView>
    </ScreenBg>
  );
}

// ————— تفاصيل متجر —————
export function StoreDetailScreen({ route, navigation }) {
  const { isRTL } = useI18n();
  const row = isRTL ? 'row-reverse' : 'row';
  const provider = route.params?.provider || 'zid';
  const providerName = route.params?.providerName || 'زد';
  const store = route.params?.store || {};

  // حالة حيّة: تشغيل/إيقاف + مزامنة + أوقات آخر مزامنة
  const [running, setRunning] = useState(store.state !== 'off');
  const [syncing, setSyncing] = useState(false);

  // نبني القائمة من بيانات المتجر الفعلية فقط — بدون أوقات وهمية ابتدائية
  const [entities, setEntities] = useState([
    { key: 'orders', label: 'الطلبات', last: store.last_sync_orders || '—', state: 'ok' },
    { key: 'products', label: 'المنتجات', last: store.last_sync_products || '—', state: 'ok' },
    { key: 'customers', label: 'العملاء', last: store.last_sync_customers || '—', state: 'ok' },
    { key: 'categories', label: 'التصنيفات', last: store.last_sync_categories || '—', state: 'ok' },
  ]);

  // أرقام حقيقية فقط — "—" بدل أي رقم وهمي لو الحقل غير موجود
  const stats = [
    { label: 'الطلبات', value: store.orders_count != null ? String(store.orders_count) : '—' },
    { label: 'المنتجات', value: store.products_count != null ? String(store.products_count) : '—' },
    { label: 'العملاء', value: store.customers_count != null ? String(store.customers_count) : '—' },
  ];

  // مزامنة المتجر فعلياً عبر أودو
  const runSync = async () => {
    if (syncing || !running) return;
    setSyncing(true);
    setEntities((es) => es.map((e) => ({ ...e, state: 'syncing' })));

    if (CONFIG.USE_API) {
      try {
        await api.syncStore(store.id, 'all');
        // نعيد جلب بيانات المتجر الفعلية بعد المزامنة بدل ما نفترض "الآن" للكل
        const conn = await api.fetchConnections();
        const fresh = conn?.stores?.find((s) => s.id === store.id);
        setEntities((es) => es.map((x) => ({
          ...x,
          state: 'ok',
          last: fresh?.[`last_sync_${x.key}`] || 'الآن',
        })));
      } catch (e) {
        setEntities((es) => es.map((x) => ({ ...x, state: 'ok' })));
      }
      setSyncing(false);
      return;
    }

    entities.forEach((e, i) => {
      setTimeout(() => {
        setEntities((es) => es.map((x, xi) => xi === i ? { ...x, state: 'ok', last: 'الآن' } : x));
        if (i === entities.length - 1) setSyncing(false);
      }, (i + 1) * 700);
    });
  };
const toggleStore = async () => {
    if (!CONFIG.USE_API) { setRunning((v) => !v); return; }
    try {
      const res = await api.toggleStore(store.id);
      if (res && res.ok) setRunning(res.state === 'on');
    } catch (e) { /* تجاهل */ }
  };

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title={store.name || 'المتجر'} onBack={() => navigation.goBack()} />

        <Card style={{ marginBottom: 14 }}>
          <Row gap={14}>
            <BrandLogo brand={provider} size={48} />
            <View style={{ flex: 1 }}>
              <T weight="bold" size={16}>{store.name}</T>
              <T size={12} color={colors.muted}>{providerName} · {store.account || 'شركة · رواء التجارية'}</T>
            </View>
            <View style={[amStyles.statePill, { backgroundColor: running ? colors.successBg : '#FBE9E7' }]}>
              <View style={[amStyles.stateDot, { backgroundColor: running ? colors.success : colors.danger }]} />
              <T size={11.5} weight="bold" color={running ? colors.success : colors.danger}>
                {running ? 'يعمل' : 'متوقف'}
              </T>
            </View>
          </Row>
          <Row gap={8} style={{ marginTop: 14 }}>
            {stats.map((x, i) => (
              <View key={i} style={amStyles.statBox}>
                <T size={19} weight="bold" center>{x.value}</T>
                <T size={11} color={colors.muted} center>{x.label}</T>
              </View>
            ))}
          </Row>
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <InfoRow label="معرّف المتجر" value={store.store_id || '—'} ltr row={row} />
          <InfoRow label="المالك" value={store.owner || '—'} row={row} />
          <InfoRow label="آخر مزامنة" value={syncing ? 'جارٍ المزامنة…' : (store.last || '—')} row={row} last />
        </Card>

        <T weight="bold" size={12} color={colors.muted} style={{ marginBottom: 10, marginHorizontal: 2 }}>حالة المزامنة</T>
        <Card style={{ padding: 0, marginBottom: 16 }}>
          {entities.map((e, i) => (
            <Row key={e.key} gap={12} style={[{ padding: 14 }, i > 0 && styles2.div]}>
              <View style={[amStyles.syncTick, e.state === 'syncing' && { backgroundColor: '#EFEAF7' }]}>
                {e.state === 'syncing' ? (
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path d="M4 12a8 8 0 0113.7-5.7L20 8M20 4v4h-4" stroke={colors.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                ) : (
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                    <Path d="M5 12l4 4 10-10" stroke={colors.success} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </View>
              <T size={13.5} weight="semi" style={{ flex: 1 }}>{e.label}</T>
              <T size={11.5} color={e.state === 'syncing' ? colors.accent : colors.muted}>
                {e.state === 'syncing' ? 'جارٍ…' : e.last}
              </T>
            </Row>
          ))}
        </Card>

        <PrimaryButton
          label={syncing ? 'جارٍ المزامنة…' : 'مزامنة هذا المتجر الآن'}
          onPress={runSync}
          style={(syncing || !running) && { opacity: 0.55 }}
        />
        {!running && (
          <T center size={11.5} color={colors.muted} style={{ marginTop: 8 }}>
            شغّل المتجر أولاً لتتمكّن من المزامنة.
          </T>
        )}
        <Row gap={10} style={{ marginTop: 12 }}>
          <Pressable
            onPress={() => navigation.navigate('StoreSettings', { provider, providerName, store })}
            style={[amStyles.secondaryBtn, { flex: 1 }]}
          >
            <T size={13.5} weight="bold" color={colors.accent} center>الإعدادات</T>
          </Pressable>
          <Pressable onPress={toggleStore} style={[amStyles.secondaryBtn, { flex: 1, borderColor: running ? '#F3D6D3' : '#D8EDDF' }]}>
            <T size={13.5} weight="bold" color={running ? colors.danger : colors.success} center>
              {running ? 'إيقاف المتجر' : 'تشغيل المتجر'}
            </T>
          </Pressable>
        </Row>
      </ScrollView>
    </ScreenBg>
  );
}



function InfoRow({ label, value, ltr, last, row }) {
  return (
    <View style={[{ flexDirection: row, justifyContent: 'space-between', paddingVertical: 9 },
                  !last && styles2.div]}>
      <T size={13} color={colors.muted}>{label}</T>
      <T size={13} weight="semi" style={ltr ? { writingDirection: 'ltr' } : null}>{value}</T>
   </View>
  );
}
// ————— إعدادات المتجر —————
export function StoreSettingsScreen({ route, navigation }) {
  const { isRTL } = useI18n();
  const row = isRTL ? 'row-reverse' : 'row';
  const store = route.params?.store || {};

  const DEFAULT_TOGGLES = { orders: true, products: true, customers: true, categories: true, prices: true, images: false };
  const [toggles, setToggles] = useState(CONFIG.USE_API ? null : DEFAULT_TOGGLES);
  const [loading, setLoading] = useState(CONFIG.USE_API);
  const [loadError, setLoadError] = useState('');
  const [savingSet, setSavingSet] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!CONFIG.USE_API) return;
    let alive = true;
    api.fetchStoreSettings(store.id)
      .then((res) => {
        if (!alive) return;
        if (res && res.ok && res.settings) {
          setToggles({ ...DEFAULT_TOGGLES, ...res.settings });
        } else {
          setLoadError(res?.error || 'تعذّر جلب الإعدادات');
        }
      })
      .catch(() => alive && setLoadError('تعذّر الاتصال بالخادم'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [store.id]);

  const flip = (k) => setToggles((t) => ({ ...t, [k]: !t[k] }));

  const saveSettings = async () => {
    if (!CONFIG.USE_API) { navigation.goBack(); return; }
    setSavingSet(true);
    setSaveError('');
    try {
      const res = await api.saveStoreSettings(store.id, toggles);
      if (res && res.ok) navigation.goBack();
      else setSaveError(res?.error || 'تعذّر حفظ الإعدادات');
    } catch (e) {
      setSaveError('تعذّر الاتصال بالخادم');
    } finally {
      setSavingSet(false);
    }
  };

  const rows = [
    ['orders', 'مزامنة الطلبات', 'استيراد الطلبات الجديدة تلقائياً'],
    ['products', 'مزامنة المنتجات', 'تحديث المنتجات والمخزون'],
    ['customers', 'مزامنة العملاء', 'استيراد بيانات العملاء'],
    ['categories', 'مزامنة التصنيفات', 'ربط تصنيفات المنتجات'],
    ['prices', 'مزامنة الأسعار', 'تحديث الأسعار من المنصة'],
    ['images', 'مزامنة صور المنتجات', 'استيراد صور المنتجات (أبطأ)'],
  ];

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="إعدادات المتجر" onBack={() => navigation.goBack()} />

        <Card style={{ marginBottom: 14 }}>
          <T size={12.5} weight="semi">{store.name || 'المتجر'}</T>
          <T size={11.5} color={colors.muted} style={{ marginTop: 2 }}>تحكّم في ما تتم مزامنته لهذا المتجر</T>
        </Card>

        {loading && <T center size={13} color={colors.muted} style={{ marginBottom: 14 }}>جارٍ تحميل الإعدادات…</T>}
        {loadError ? <T center size={12.5} color={colors.danger} style={{ marginBottom: 14 }}>{loadError}</T> : null}

        {toggles && (
          <>
            <T weight="bold" size={12} color={colors.muted} style={{ marginBottom: 10, marginHorizontal: 2 }}>خيارات المزامنة</T>
            <Card style={{ padding: 0, marginBottom: 18 }}>
              {rows.map(([k, label, desc], i) => (
                <View key={k} style={[{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', padding: 15 }, i > 0 && styles2.div]}>
                  <View style={{ flex: 1, marginEnd: 12 }}>
                    <T size={14} weight="semi">{label}</T>
                    <T size={11.5} color={colors.muted} style={{ marginTop: 2 }}>{desc}</T>
                  </View>
                  <Pressable onPress={() => flip(k)} style={[styles2.track, { backgroundColor: toggles[k] ? colors.accent : '#D9D4E2' }]}>
                    <View style={[styles2.knob, { alignSelf: toggles[k] ? 'flex-end' : 'flex-start' }]} />
                  </Pressable>
                </View>
              ))}
            </Card>

            {saveError ? <T center size={12.5} color={colors.danger} style={{ marginBottom: 10 }}>{saveError}</T> : null}
            <PrimaryButton
              label={savingSet ? 'جارٍ الحفظ…' : 'حفظ الإعدادات'}
              onPress={saveSettings}
              style={savingSet && { opacity: 0.6 }}
            />
          </>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

// ————— ربط خدمة جديدة —————
export function ConnectScreen({ navigation }) {
  const [sel, setSel] = useState(null);
  const AVAILABLE = ['zid'];   // المتاح حالياً فقط
  const options = ['zid'];
  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="ربط خدمة جديدة" onBack={() => navigation.goBack()} />
        <T size={13} color={colors.muted} style={{ marginBottom: 16 }}>
          اختر المنصة التي تريد ربطها بحساب أودو الخاص بك.
        </T>
        {options.map((k) => {
          const available = AVAILABLE.includes(k);
          const on = sel === k;
          return (
            <Pressable key={k} onPress={() => available && setSel(k)} disabled={!available}>
              <Card style={[
                { marginBottom: 12 },
                on && { borderColor: colors.accent, backgroundColor: '#F7F5FB' },
                !available && { opacity: 0.55, backgroundColor: '#FAFAFC' },
              ]}>
                <Row gap={14}>
                  <BrandLogo brand={k} size={48} />
                  <View style={{ flex: 1 }}>
                    <Row gap={8}>
                      <T weight="bold" size={15}>{BRAND[k].name}</T>
                      {!available && (
                        <View style={styles2.soonBadge}>
                          <T size={10.5} weight="bold" color={colors.muted}>قريباً</T>
                        </View>
                      )}
                    </Row>
                    <T size={12} color={colors.muted}>
                      {available
                        ? `${BRAND[k].nameEn} · مزامنة الطلبات والمنتجات والعملاء`
                        : 'سيكون متاحاً قريباً'}
                    </T>
                  </View>
                  {available && (
                    <View style={[styles2.radio, on && { borderColor: colors.accent }]}>
                      {on && <View style={[styles2.radioDot, { backgroundColor: colors.accent }]} />}
                    </View>
                  )}
                </Row>
              </Card>
            </Pressable>
          );
        })}

        {/* أودو كوجهة الربط */}
        <Card style={{ marginTop: 4, marginBottom: 16, backgroundColor: BRAND.odoo.bg, borderColor: '#E3D4DD' }}>
          <Row gap={12}>
            <BrandLogo brand="odoo" size={40} />
            <View style={{ flex: 1 }}>
              <T weight="bold" size={14}>الوجهة: أودو</T>
              <T size={11.5} color={colors.muted}>ستتم مزامنة البيانات مع مثيل أودو 19 الخاص بك</T>
            </View>
          </Row>
        </Card>

        <PrimaryButton label="متابعة الربط" onPress={() => sel && navigation.navigate('ConnectSetup', { provider: sel })} style={!sel && { opacity: 0.5 }} />
      </ScrollView>
    </ScreenBg>
  );
}

// ————— إعداد الربط (إدخال بيانات المتجر) —————
export function ConnectSetupScreen({ route, navigation }) {
  const { textAlign } = useI18n();
  const provider = route.params?.provider || 'zid';
  const [name, setName] = useState('');
  const [storeId, setStoreId] = useState('');
  const b = BRAND[provider] || BRAND.zid;

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const start = async () => {
    setErr('');
    // وضع التجربة
    if (!CONFIG.USE_API) {
      navigation.replace('ConnectProgress', { provider, name: name || b.name });
      return;
    }
    setSaving(true);
    try {
      // إنشاء المتجر فعلياً في أودو
      const res = await api.connectStore({ name: name.trim(), store_id: storeId.trim(), provider });
      if (res && res.ok) {
        navigation.replace('ConnectProgress', { provider, name: name || b.name, store: res.store });
      } else {
        setErr(res && res.error ? ('تعذّر الربط: ' + res.error) : 'تعذّر ربط المتجر');
      }
    } catch (e) {
      setErr('تعذّر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="إعداد الربط" onBack={() => navigation.goBack()} />

        <Card style={{ marginBottom: 14 }}>
          <Row gap={14}>
            <BrandLogo brand={provider} size={44} />
            <View style={{ flex: 1 }}>
              <T weight="bold" size={15}>{b.name}</T>
              <T size={12} color={colors.muted}>أدخل بيانات المتجر للربط</T>
            </View>
          </Row>
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <T size={12} color={colors.muted} weight="semi" style={{ marginBottom: 6 }}>اسم المتجر</T>
          <TextInput value={name} onChangeText={setName} placeholder="مثال: متجر رواء"
            placeholderTextColor="#B8B3C4" style={[amStyles.input, { textAlign }]} />
          <T size={12} color={colors.muted} weight="semi" style={{ marginTop: 14, marginBottom: 6 }}>
            معرّف المتجر (Store ID)
          </T>
          <TextInput value={storeId} onChangeText={setStoreId} placeholder="41287"
            placeholderTextColor="#B8B3C4" autoCapitalize="none"
            style={[amStyles.input, { textAlign: 'left' }]} />
          <T size={11} color={colors.mutedLight} style={{ marginTop: 8 }}>
            تجدين معرّف المتجر في لوحة تحكم {b.name}.
          </T>
        </Card>

        {err ? <T center size={12.5} color={colors.danger} style={{ marginBottom: 10 }}>{err}</T> : null}
        <PrimaryButton
          label={saving ? 'جارٍ الربط…' : 'بدء الربط'}
          onPress={start}
          style={(!(name && storeId) || saving) && { opacity: 0.5 }}
        />
      </ScrollView>
    </ScreenBg>
  );
}

// ————— متابعة الربط (شاشة تقدّم) —————
export function ConnectProgressScreen({ route, navigation }) {
  const provider = route.params?.provider || 'zid';
  const storeName = route.params?.name || 'المتجر';
  const b = BRAND[provider] || BRAND.zid;

  const STEPS = [
    'التحقق من بيانات المتجر',
    'جلب رمز الوصول (Access Token)',
    'اختبار الاتصال مع المنصة',
    'إنشاء المتجر في أودو',
    'أول مزامنة للطلبات والمنتجات',
  ];
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (step < STEPS.length) {
      const timer = setTimeout(() => setStep((v) => v + 1), 900);
      return () => clearTimeout(timer);
    } else {
      setDone(true);
    }
  }, [step]);

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="متابعة الربط" onBack={() => navigation.navigate('Tabs')} />

        <Card style={{ alignItems: 'center', marginBottom: 16, paddingVertical: 24 }}>
          <BrandLogo brand={provider} size={56} />
          <T weight="bold" size={16} style={{ marginTop: 12 }}>{storeName}</T>
          <T size={12.5} color={colors.muted} style={{ marginTop: 2 }}>
            {done ? 'تم الربط بنجاح' : 'جارٍ الربط مع ' + b.name + '…'}
          </T>
        </Card>

        <Card>
          {STEPS.map((label, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'wait';
            return (
              <Row key={i} gap={12} style={{ paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderTopColor: colors.borderSoft }}>
                <View style={[amStyles.stepDot, {
                  backgroundColor: state === 'done' ? colors.success : state === 'active' ? colors.accent : '#EAE7F1',
                }]}>
                  {state === 'done' && (
                    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                      <Path d="M5 12l4 4 10-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  )}
                  {state === 'active' && <View style={amStyles.pulse} />}
                </View>
                <T size={13.5} weight={state === 'wait' ? 'semi' : 'bold'}
                  color={state === 'wait' ? colors.mutedLight : colors.ink}>{label}</T>
              </Row>
            );
          })}
        </Card>

        {done && (
          <PrimaryButton label="تم · العودة للرئيسية" onPress={() => navigation.navigate('Tabs')} style={{ marginTop: 18 }} />
        )}
      </ScrollView>
    </ScreenBg>
  );
}

// ————— الفريق —————
export function TeamScreen({ navigation }) {
  const [team, setTeam] = useState(CONFIG.USE_API ? [] : TEAM);
  const [loading, setLoading] = useState(CONFIG.USE_API);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!CONFIG.USE_API) return;
    setLoading(true);
    setError('');
    api.fetchTeam()
      .then((res) => {
        if (res && res.ok && Array.isArray(res.team)) {
          setTeam(res.team);
        } else {
          setError((res && res.error) ? res.error : 'تعذّر جلب الفريق');
        }
      })
      .catch((e) => setError('تعذّر الاتصال بالخادم: ' + (e.message || '')))
      .finally(() => setLoading(false));
  }, []);

  // يعيد الجلب في كل مرة يرجع فيها المستخدم لهذي الشاشة (بعد إضافة عضو مثلاً)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isEmpty = CONFIG.USE_API && !loading && !error && team.length === 0;

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="الفريق والصلاحيات" onBack={() => navigation.goBack()} />

        {loading && <T center size={13} color={colors.muted} style={{ marginBottom: 12 }}>جارٍ التحميل…</T>}
        {error ? <T center size={12.5} color={colors.danger} style={{ marginBottom: 12 }}>{error}</T> : null}
        {isEmpty && (
          <Card style={{ alignItems: 'center', paddingVertical: 24, marginBottom: 14 }}>
            <T size={13.5} weight="bold">لا يوجد أعضاء بعد</T>
          </Card>
        )}

        {team.map((u, i) => {
          const [avBg, avFg] = avatarOf(i);
          const roleAr = u.role === 'manager' ? 'مدير' : u.role === 'admin' ? 'مشرف' : 'مستخدم';
          const rb = roleBadge[roleAr] || roleBadge['مدير'];
          return (
            <Pressable key={u.id ?? i} onPress={() => navigation.navigate('UserSettings', { i, member: u })}>
              <Card style={{ marginBottom: 12 }}>
                <Row gap={12}>
                  <Avatar initial={initialOf(u.name)} bg={avBg} fg={avFg} size={44} />
                  <View style={{ flex: 1 }}>
                    <T weight="bold" size={14}>{u.name}</T>
                    <T size={11.5} color={colors.muted}>{u.job_title || u.email}</T>
                  </View>
                  <View style={{ alignItems: 'flex-start', gap: 6 }}>
                    <Badge label={roleAr} bg={rb.bg} fg={rb.fg} />
                  </View>
                </Row>
              </Card>
            </Pressable>
          );
        })}
        <PrimaryButton label="+ إضافة عضو" onPress={() => navigation.navigate('AddMember')} />
      </ScrollView>
    </ScreenBg>
  );
}

// ————— إضافة / دعوة عضو —————
export function AddMemberScreen({ navigation }) {
  const { isRTL, textAlign } = useI18n();
  const row = isRTL ? 'row-reverse' : 'row';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('user');
  const [savingMem, setSavingMem] = useState(false);
  const [memErr, setMemErr] = useState('');

  const roles = [
    ['manager', 'مدير', 'يدير كل المستخدمين والمتاجر'],
    ['admin', 'مشرف', 'يدير المتاجر المسندة إليه'],
    ['user', 'مستخدم', 'يرى سجلاته فقط'],
  ];

  const submit = async () => {
    setMemErr('');
    if (!CONFIG.USE_API) { navigation.goBack(); return; }
    if (!name.trim() || !email.trim()) {
      setMemErr('يرجى تعبئة الاسم والبريد');
      return;
    }
    setSavingMem(true);
    try {
      const res = await api.createTeamMember({
        name: name.trim(),
        email: email.trim(),
        job_title: jobTitle.trim(),
        phone: phone.trim(),
        role,
      });
      if (res && res.ok) navigation.goBack();
      else setMemErr(res && res.error ? ('تعذّر: ' + res.error) : 'تعذّر إضافة العضو');
    } catch (e) {
      setMemErr('تعذّر الاتصال بالخادم');
    } finally {
      setSavingMem(false);
    }
  };

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="إضافة عضو للفريق" onBack={() => navigation.goBack()} />

        <Card style={{ marginBottom: 14 }}>
          <T size={12} color={colors.muted} weight="semi" style={{ marginBottom: 6 }}>الاسم الكامل</T>
          <TextInput value={name} onChangeText={setName} placeholder="مثال: منى السالم"
            placeholderTextColor="#B8B3C4" style={[amStyles.input, { textAlign }]} />
          <T size={12} color={colors.muted} weight="semi" style={{ marginTop: 14, marginBottom: 6 }}>البريد الإلكتروني</T>
          <TextInput value={email} onChangeText={setEmail} placeholder="name@rawaa.sa"
            placeholderTextColor="#B8B3C4" keyboardType="email-address" autoCapitalize="none"
            style={[amStyles.input, { textAlign: 'left' }]} />
          <T size={12} color={colors.muted} weight="semi" style={{ marginTop: 14, marginBottom: 6 }}>المسمى الوظيفي</T>
          <TextInput value={jobTitle} onChangeText={setJobTitle} placeholder="مثال: محاسب"
            placeholderTextColor="#B8B3C4" style={[amStyles.input, { textAlign }]} />
          <T size={12} color={colors.muted} weight="semi" style={{ marginTop: 14, marginBottom: 6 }}>رقم الجوال</T>
          <TextInput value={phone} onChangeText={setPhone} placeholder="+966"
            placeholderTextColor="#B8B3C4" keyboardType="phone-pad"
            style={[amStyles.input, { textAlign: 'left' }]} />
        </Card>

        <T weight="bold" size={12} color={colors.muted} style={{ marginBottom: 10, marginHorizontal: 2 }}>الدور</T>
        {roles.map(([k, label, desc]) => {
          const on = role === k;
          return (
            <Pressable key={k} onPress={() => setRole(k)}>
              <Card style={[{ marginBottom: 10 }, on && { borderColor: colors.accent, backgroundColor: '#F7F5FB' }]}>
                <Row gap={12}>
                  <View style={[styles2.radio, on && { borderColor: colors.accent }]}>{on && <View style={[styles2.radioDot, { backgroundColor: colors.accent }]} />}</View>
                  <View style={{ flex: 1 }}>
                    <T weight="bold" size={14}>{label}</T>
                    <T size={11.5} color={colors.muted}>{desc}</T>
                  </View>
                </Row>
              </Card>
            </Pressable>
          );
        })}

        {memErr ? <T center size={12.5} color={colors.danger} style={{ marginTop: 8, marginBottom: 10 }}>{memErr}</T> : null}
        <PrimaryButton label={savingMem ? 'جارٍ الحفظ…' : 'إضافة العضو'} onPress={submit}
          style={[{ marginTop: 8 }, savingMem && { opacity: 0.6 }]} />
        <T center size={11.5} color={colors.muted} style={{ marginTop: 12 }}>
          سيُضاف العضو مباشرة إلى فريقك في النظام.
        </T>
      </ScrollView>
    </ScreenBg>
  );
}

const amStyles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#DDD9E6', borderRadius: 13, padding: 13, fontSize: 14, backgroundColor: '#fff', color: colors.ink },

  // ---- تفاصيل المتجر ----
  statePill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 11, borderRadius: 20 },
  stateDot: { width: 7, height: 7, borderRadius: 4 },
  statBox: { flex: 1, backgroundColor: '#F6F5FA', borderRadius: 13, paddingVertical: 12 },
  syncTick: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#EAF6EE', alignItems: 'center', justifyContent: 'center' },
  secondaryBtn: { borderWidth: 1, borderColor: '#E2DEEC', borderRadius: 13, paddingVertical: 13, backgroundColor: '#fff' },
  stepDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  pulse: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#fff' },

  // ---- معاينة بطاقة الدفع ----
  cardPreview: {
    borderRadius: 20, padding: 22, height: 200, justifyContent: 'space-between',
    shadowColor: '#2E1E56', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 24, elevation: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: {
    width: 40, height: 30, borderRadius: 7, backgroundColor: '#E8C86A',
    padding: 6, justifyContent: 'space-between',
  },
  chipLine: { height: 3, borderRadius: 2, backgroundColor: 'rgba(120,90,20,.45)' },
  cardBrand: { color: '#fff', fontSize: 20, fontWeight: '800', fontStyle: 'italic', letterSpacing: 1 },
  cardNumber: {
    color: '#fff', fontSize: 21, fontWeight: '600', letterSpacing: 3,
    textAlign: 'left', writingDirection: 'ltr',
  },
  cardBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  cardTiny: { color: 'rgba(255,255,255,.6)', fontSize: 8.5, letterSpacing: 1, textAlign: 'left', marginBottom: 3 },
  cardValue: { color: '#fff', fontSize: 13, fontWeight: '700', textAlign: 'left', writingDirection: 'ltr' },
});

// ————— إعدادات مستخدم —————
export function UserSettingsScreen({ route, navigation }) {
  const memberFromNav = route.params?.member;
  const i = route.params?.i ?? 0;

  // كل الشاشات المتاحة للصلاحيات
  const SCREENS = [
    ['orders', 'الطلبات'],
    ['customers', 'العملاء'],
    ['invoices', 'الفواتير'],
    ['payments', 'طرق الدفع'],
    ['sync', 'المزامنة'],
    ['team', 'الفريق'],
  ];

  const [member, setMember] = useState(memberFromNav || (CONFIG.USE_API ? null : TEAM[i]));
  const [loading, setLoading] = useState(CONFIG.USE_API && !memberFromNav);
  const [role, setRole] = useState(memberFromNav?.roleKey || memberFromNav?.role || 'user');
  // الصلاحيات: قائمة الشاشات المسموحة
  const [perms, setPerms] = useState(memberFromNav?.permissions || SCREENS.map((s) => s[0]));
  // المتاجر المسموحة + قائمة كل المتاجر المتاحة
  const [storeIds, setStoreIds] = useState(memberFromNav?.store_ids || []);
  const [allStores, setAllStores] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const togglePerm = (key) => {
    setPerms((cur) => cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]);
  };
  const toggleStoreId = (id) => {
    setStoreIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  };

  // نجيب كل المتاجر المتاحة (للأدمن يختار منها)
  useEffect(() => {
    if (!CONFIG.USE_API) return;
    let alive = true;
    api.fetchStoresAll()
      .then((res) => {
        if (alive && res?.ok && Array.isArray(res.stores)) setAllStores(res.stores);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (memberFromNav || !CONFIG.USE_API) return;
    let alive = true;
    api.fetchTeam()
      .then((res) => {
        if (!alive) return;
        const found = res?.team?.[i];
        if (found) {
          setMember(found);
          setRole(found.roleKey || found.role || 'user');
          if (Array.isArray(found.permissions)) setPerms(found.permissions);
          if (Array.isArray(found.store_ids)) setStoreIds(found.store_ids);
        } else {
          setError('تعذّر إيجاد بيانات العضو');
        }
      })
      .catch(() => alive && setError('تعذّر الاتصال بالخادم'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const [avBg, avFg] = avatarOf(i);
  const roles = [
    ['manager', 'مدير', 'يدير كل المستخدمين والمتاجر'],
    ['admin', 'مشرف', 'يدير المتاجر المسندة إليه'],
    ['user', 'مستخدم', 'يرى سجلاته فقط'],
  ];

  const save = async () => {
    if (!CONFIG.USE_API || !member) { navigation.goBack(); return; }
    setSaving(true);
    setError('');
    try {
      const res = await api.updateTeamMember(member.id, { role, permissions: perms, store_ids: storeIds });
      if (res && res.ok) navigation.goBack();
      else setError(res?.error || 'تعذّر حفظ التعديلات');
    } catch (e) {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenBg>
        <ScrollView contentContainerStyle={st.wrap}>
          <ScreenTitle title="صلاحيات العضو" onBack={() => navigation.goBack()} />
          <T center size={13} color={colors.muted}>جارٍ التحميل…</T>
        </ScrollView>
      </ScreenBg>
    );
  }

  if (!member) {
    return (
      <ScreenBg>
        <ScrollView contentContainerStyle={st.wrap}>
          <ScreenTitle title="صلاحيات العضو" onBack={() => navigation.goBack()} />
          <T center size={13} color={colors.danger}>{error || 'تعذّر إيجاد العضو'}</T>
        </ScrollView>
      </ScreenBg>
    );
  }

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="صلاحيات العضو" onBack={() => navigation.goBack()} />
        <Card style={{ marginBottom: 14 }}>
          <Row gap={12}>
            <Avatar initial={initialOf(member.name)} bg={avBg} fg={avFg} size={50} />
            <View>
              <T weight="bold" size={15}>{member.name}</T>
              <T size={12} color={colors.muted} style={{ writingDirection: 'ltr' }}>{member.email}</T>
            </View>
          </Row>
        </Card>

        <T weight="bold" size={12} color={colors.muted} style={{ marginBottom: 10 }}>الدور</T>
        {roles.map(([k, l, d]) => {
          const on = role === k;
          return (
            <Pressable key={k} onPress={() => setRole(k)}>
              <Card style={[{ marginBottom: 10 }, on && { borderColor: colors.accent, backgroundColor: '#F7F5FB' }]}>
                <Row gap={12}>
                  <View style={[styles2.radio, on && { borderColor: colors.accent }]}>{on && <View style={[styles2.radioDot, { backgroundColor: colors.accent }]} />}</View>
                  <View>
                    <T weight="bold" size={14}>{l}</T>
                    <T size={11.5} color={colors.muted}>{d}</T>
                  </View>
                </Row>
              </Card>
            </Pressable>
          );
        })}

        {/* صلاحيات الشاشات */}
        <T weight="bold" size={12} color={colors.muted} style={{ marginTop: 10, marginBottom: 10 }}>الشاشات المسموحة</T>
        <Card style={{ padding: 6, marginBottom: 16 }}>
          {SCREENS.map(([key, label], idx) => {
            const on = perms.includes(key);
            return (
              <View key={key} style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13 }, idx > 0 && styles2.div]}>
                <T size={14} weight="semi">{label}</T>
                <Pressable onPress={() => togglePerm(key)} style={[styles2.track, { backgroundColor: on ? colors.accent : '#D9D4E2' }]}>
                  <View style={[styles2.knob, { alignSelf: on ? 'flex-end' : 'flex-start' }]} />
                </Pressable>
              </View>
            );
          })}
        </Card>

        {/* المتاجر المسموحة */}
        <T weight="bold" size={12} color={colors.muted} style={{ marginTop: 10, marginBottom: 10 }}>المتاجر المسموحة</T>
        <Card style={{ padding: 6, marginBottom: 16 }}>
          {allStores.length === 0 ? (
            <T size={12.5} color={colors.muted} style={{ padding: 12 }}>جارٍ تحميل المتاجر…</T>
          ) : allStores.map((s, idx) => {
            const on = storeIds.includes(s.id);
            return (
              <View key={s.id} style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13 }, idx > 0 && styles2.div]}>
                <T size={14} weight="semi">{s.name}</T>
                <Pressable onPress={() => toggleStoreId(s.id)} style={[styles2.track, { backgroundColor: on ? colors.accent : '#D9D4E2' }]}>
                  <View style={[styles2.knob, { alignSelf: on ? 'flex-end' : 'flex-start' }]} />
                </Pressable>
              </View>
            );
          })}
        </Card>

        {error ? <T center size={12.5} color={colors.danger} style={{ marginBottom: 10 }}>{error}</T> : null}
        <PrimaryButton label={saving ? 'جارٍ الحفظ…' : 'حفظ التعديلات'} onPress={save} style={saving && { opacity: 0.6 }} />
      </ScrollView>
    </ScreenBg>
  );
}

// ————— العملاء —————
export function CustomersScreen({ navigation }) {
  const [customers, setCustomers] = useState(CONFIG.USE_API ? [] : CUSTOMERS);
  const [loading, setLoading] = useState(CONFIG.USE_API);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!CONFIG.USE_API) return;
    let alive = true;
    setLoading(true);
    setError('');
    api.fetchCustomers()
      .then((res) => {
        if (!alive) return;
        if (res && res.ok && Array.isArray(res.customers)) {
          setCustomers(res.customers);
        } else {
          setError((res && res.error) ? res.error : 'تعذّر جلب العملاء');
        }
      })
      .catch((e) => alive && setError('تعذّر الاتصال بالخادم: ' + (e.message || '')))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const isEmpty = CONFIG.USE_API && !loading && !error && customers.length === 0;

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="العملاء" onBack={() => navigation.goBack()} />

        {loading && <T center size={13} color={colors.muted} style={{ marginBottom: 12 }}>جارٍ التحميل…</T>}
        {error ? <T center size={12.5} color={colors.danger} style={{ marginBottom: 12 }}>{error}</T> : null}
        {isEmpty && (
          <Card style={{ alignItems: 'center', paddingVertical: 24, marginBottom: 14 }}>
            <T size={13.5} weight="bold">لا يوجد عملاء بعد</T>
          </Card>
        )}

        {customers.map((c, i) => {
          const [avBg, avFg] = avatarOf(i);
          const prov = (c.stores || '').split(' · ')[0];
          return (
            <Card key={c.id ?? i} style={{ marginBottom: 12 }}>
              <Row gap={12}>
                <Avatar initial={initialOf(c.name)} bg={avBg} fg={avFg} size={44} />
                <View style={{ flex: 1 }}>
                  <T weight="bold" size={14}>{c.name}</T>
                  <Row gap={6} style={{ marginTop: 3 }}>
                    <BrandLogo brand={PROVIDER_KEY_BY_NAME[prov]} size={15} />
                    <T size={11.5} color={colors.muted}>{c.stores}</T>
                  </Row>
                </View>
                <View style={{ alignItems: 'flex-start' }}>
                  <T weight="bold" size={15}>{c.orders}</T>
                  <T size={10.5} color={colors.muted}>طلب</T>
                </View>
              </Row>
            </Card>
          );
        })}
      </ScrollView>
    </ScreenBg>
  );
}

// ————— الفوترة —————
export function BillingScreen({ navigation }) {
  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="الفوترة والدفع" onBack={() => navigation.goBack()} />
        <LinearGradient colors={[colors.accent, colors.accentDeep]} style={styles2.planCard}>
          <T size={12.5} color="rgba(255,255,255,.75)">الخطة الحالية</T>
          <T size={22} weight="bold" color="#fff" style={{ marginTop: 6 }}>الخدمة الكاملة</T>
          <T size={13} color="rgba(255,255,255,.8)" style={{ marginTop: 8 }}>﷼ 499 / شهرياً · تتجدد 1 أغسطس 2026</T>
          <Pressable onPress={() => navigation.navigate('ManagePlan')} style={styles2.planBtn}><T size={13} weight="bold" color="#493200">إدارة الخطة</T></Pressable>
        </LinearGradient>

        <Card style={{ marginBottom: 14 }}>
          <T size={11} weight="bold" color={colors.muted} style={{ marginBottom: 11 }}>جهة الفوترة</T>
          {[['الشركة', 'شركة رواء التجارية', false], ['الرقم الضريبي', '300 1234 5678 003', true], ['السجل التجاري', '1010 445 221', true]].map(([l, v, ltr], i) => (
            <Row key={i} style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
              <T size={13} color={colors.muted}>{l}</T>
              <T size={13} weight="semi" style={ltr ? { writingDirection: 'ltr' } : null}>{v}</T>
            </Row>
          ))}
        </Card>

        <Card>
          <T size={11} weight="bold" color={colors.muted} style={{ marginBottom: 11 }}>طريقة الدفع</T>
          <Row gap={12} style={styles2.payCard}>
            <View style={styles2.visa}><T size={11} weight="bold" color="#fff">VISA</T></View>
            <View style={{ flex: 1 }}>
              <T weight="bold" size={13.5} style={{ writingDirection: 'ltr' }}>•••• 4921</T>
              <T size={11.5} color={colors.muted}>تنتهي 09 / 28</T>
            </View>
            <Badge label="افتراضية" bg={colors.successBg} fg={colors.success} />
          </Row>
          <Pressable onPress={() => navigation.navigate('AddPayment')} style={styles2.addPay}><T size={13.5} weight="bold" color={colors.accent}>+ إضافة طريقة دفع</T></Pressable>
        </Card>

        <Pressable onPress={() => navigation.navigate('Invoices')} style={styles2.invoicesLink}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row gap={10}>
              <View style={styles2.invIcon}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M6 2h9l3 3v17H6zM9 8h6M9 12h6M9 16h4" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
              <T size={14.5} weight="semi">عرض كل الفواتير</T>
            </Row>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"><Path d="M15 5l-7 7 7 7" stroke={colors.mutedLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </Row>
        </Pressable>
      </ScrollView>
    </ScreenBg>
  );
}

// ————— إضافة طريقة دفع —————
export function AddPaymentScreen({ navigation }) {
  const { textAlign, isRTL } = useI18n();
  const row = isRTL ? 'row-reverse' : 'row';
  const [num, setNum] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');
  const [holder, setHolder] = useState('');
  const [saveMode, setSaveMode] = useState('save');

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="إضافة طريقة دفع" onBack={() => navigation.goBack()} />

        {/* معاينة البطاقة — دائماً LTR كبطاقة بنكية حقيقية */}
        <LinearGradient
          colors={['#6E4FA2', '#4C3475', '#2E2049']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={amStyles.cardPreview}
        >
          {/* الصف العلوي: الشريحة + شعار الشبكة */}
          <View style={amStyles.cardTop}>
            <View style={amStyles.chip}>
              <View style={amStyles.chipLine} />
              <View style={amStyles.chipLine} />
            </View>
            <Text style={amStyles.cardBrand}>VISA</Text>
          </View>

          {/* رقم البطاقة */}
          <Text style={amStyles.cardNumber}>{num || '•••• •••• •••• ••••'}</Text>

          {/* الصف السفلي: الاسم + الانتهاء */}
          <View style={amStyles.cardBottom}>
            <View>
              <Text style={amStyles.cardTiny}>CARD HOLDER</Text>
              <Text style={amStyles.cardValue} numberOfLines={1}>{holder || 'RAWAA TRADING'}</Text>
            </View>
            <View>
              <Text style={amStyles.cardTiny}>EXPIRES</Text>
              <Text style={amStyles.cardValue}>{exp || 'MM/YY'}</Text>
            </View>
          </View>
        </LinearGradient>

        <Card style={{ marginTop: 16 }}>
          <T size={12} color={colors.muted} weight="semi" style={{ marginBottom: 6 }}>رقم البطاقة</T>
          <TextInput value={num} onChangeText={setNum} placeholder="•••• •••• •••• ••••"
            placeholderTextColor="#B8B3C4" keyboardType="number-pad"
            style={[amStyles.input, { textAlign: 'left' }]} />
          <View style={{ flexDirection: row, gap: 12, marginTop: 14 }}>
            <View style={{ flex: 1 }}>
              <T size={12} color={colors.muted} weight="semi" style={{ marginBottom: 6 }}>تاريخ الانتهاء</T>
              <TextInput value={exp} onChangeText={setExp} placeholder="MM / YY"
                placeholderTextColor="#B8B3C4" keyboardType="number-pad"
                style={[amStyles.input, { textAlign: 'left' }]} />
            </View>
            <View style={{ flex: 1 }}>
              <T size={12} color={colors.muted} weight="semi" style={{ marginBottom: 6 }}>رمز التحقق</T>
              <TextInput value={cvc} onChangeText={setCvc} placeholder="•••" secureTextEntry
                placeholderTextColor="#B8B3C4" keyboardType="number-pad"
                style={[amStyles.input, { textAlign: 'left' }]} />
            </View>
          </View>
          <T size={12} color={colors.muted} weight="semi" style={{ marginTop: 14, marginBottom: 6 }}>اسم حامل البطاقة</T>
          <TextInput value={holder} onChangeText={setHolder} placeholder="RAWAA TRADING"
            placeholderTextColor="#B8B3C4" autoCapitalize="characters"
            style={[amStyles.input, { textAlign: 'left' }]} />
        </Card>

        {/* خيار حفظ البطاقة */}
        <T weight="bold" size={12} color={colors.muted} style={{ marginBottom: 10, marginHorizontal: 2 }}>حفظ البطاقة</T>
        <View style={{ gap: 10, marginBottom: 4 }}>
          {[
            ['save', 'حفظ البطاقة دائماً', 'تُحفظ بأمان لاستخدامها في المدفوعات القادمة'],
            ['once', 'استخدامها مرة واحدة', 'لن تُحفظ بياناتك بعد إتمام هذه العملية'],
          ].map(([k, label, desc]) => {
            const on = saveMode === k;
            return (
              <Pressable key={k} onPress={() => setSaveMode(k)}>
                <Card style={[{ padding: 14 }, on && { borderColor: colors.accent, backgroundColor: '#F7F5FB' }]}>
                  <View style={{ flexDirection: row, alignItems: 'center', gap: 12 }}>
                    <View style={[styles2.radio, on && { borderColor: colors.accent }]}>
                      {on && <View style={styles2.radioDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <T weight="bold" size={13.5}>{label}</T>
                      <T size={11.5} color={colors.muted} style={{ marginTop: 2 }}>{desc}</T>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton
          label={saveMode === 'once' ? 'استخدام البطاقة' : 'حفظ البطاقة'}
          onPress={() => navigation.goBack()}
          style={{ marginTop: 14 }}
        />
        <T center size={11.5} color={colors.muted} style={{ marginTop: 12 }}>
          بياناتك محمية ومشفّرة. لا نحفظ رقم بطاقتك كاملاً.
        </T>
      </ScrollView>
    </ScreenBg>
  );
}

// ————— إدارة الخطة —————
export function ManagePlanScreen({ navigation }) {
  const [plan, setPlan] = useState('full');
  const PLANS = [
    { key: 'full', name: 'الخدمة الكاملة', price: '﷼ 499', period: '/ شهرياً',
      features: ['الطلبات والمنتجات والعملاء', 'الفريق والصلاحيات', 'الفوترة والتقارير', 'دعم أولوية'] },
    { key: 'integration', name: 'الربط فقط', price: '﷼ 199', period: '/ شهرياً',
      features: ['مزامنة الطلبات', 'جلب/إرسال الكتالوج', 'السجلّات', 'دعم أساسي'] },
  ];

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="إدارة الخطة" onBack={() => navigation.goBack()} />

        {PLANS.map((p) => {
          const on = plan === p.key;
          return (
            <Pressable key={p.key} onPress={() => setPlan(p.key)}>
              <Card style={[{ marginBottom: 14 }, on && { borderColor: colors.accent, borderWidth: 2 }]}>
                <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                  <View>
                    <T weight="bold" size={16}>{p.name}</T>
                    <Row gap={4} style={{ marginTop: 3 }}>
                      <T weight="bold" size={18} color={colors.accent}>{p.price}</T>
                      <T size={12} color={colors.muted}>{p.period}</T>
                    </Row>
                  </View>
                  <View style={[styles2.radio, on && { borderColor: colors.accent }]}>
                    {on && <View style={styles2.radioDot} />}
                  </View>
                </Row>
                {p.features.map((ft, i) => (
                  <Row key={i} gap={8} style={{ paddingVertical: 4 }}>
                    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                      <Path d="M5 12l4 4 10-10" stroke={colors.success} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <T size={12.5} color={colors.inkSoft}>{ft}</T>
                  </Row>
                ))}
              </Card>
            </Pressable>
          );
        })}

        <PrimaryButton label="تأكيد التغيير" onPress={() => navigation.goBack()} />
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 14 }}>
          <T center size={13} weight="semi" color={colors.danger}>إلغاء الاشتراك</T>
        </Pressable>
      </ScrollView>
    </ScreenBg>
  );
}

// ————— الملف الشخصي —————
export function ProfileScreen({ navigation }) {
  const { t, isRTL, lang, toggle } = useI18n();
  const { profile, role: myRole, initials } = useStore();
  const [avBg, avFg] = avatarOf(0);
  const roleLabel = myRole === 'manager' ? 'مدير' : myRole === 'admin' ? 'مشرف' : 'مستخدم';
  const rb = roleBadge[roleLabel] || roleBadge['مدير'];
  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={st.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title={t('profileTitle')} onBack={() => navigation.goBack()} />
        <Card style={{ alignItems: 'center', marginBottom: 14 }}>
          <Avatar initial={initials || initialOf(profile.name)} bg={avBg} fg={avFg} size={72} />
          <T weight="bold" size={17} style={{ marginTop: 12 }}>{profile.name}</T>
          <T size={13} color={colors.muted} ltr>{profile.email}</T>
          <Badge label={roleLabel} bg={rb.bg} fg={rb.fg} />
        </Card>

        {/* اللغة — زر تبديل فعّال */}
        <Card style={{ padding: 0 }}>
          <Pressable onPress={toggle} style={[st2row, { justifyContent: 'space-between', padding: 15, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <T size={14} weight="semi">{t('language')}</T>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
              <T size={13} color={colors.accent} weight="bold">{lang === 'ar' ? 'العربية' : 'English'}</T>
              <View style={{ backgroundColor: colors.accentSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <T size={12} weight="bold" color={colors.accent}>{lang === 'ar' ? 'EN' : 'ع'}</T>
              </View>
            </View>
          </Pressable>
          {[[t('timezone'), t('timezoneVal')], [t('notifications'), t('notificationsOn')]].map(([l, v], i) => (
            <Row key={i} style={[{ justifyContent: 'space-between', padding: 15 }, styles2.div]}>
              <T size={14} weight="semi">{l}</T>
              <T size={13} color={colors.muted}>{v}</T>
            </Row>
          ))}
        </Card>
      </ScrollView>
    </ScreenBg>
  );
}

const st2row = { alignItems: 'center' };

const styles2 = StyleSheet.create({
  storeItem: { paddingVertical: 11 },
  div: { borderTopWidth: 1, borderTopColor: colors.borderSoft },
  dot: { width: 8, height: 8, borderRadius: 4 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#C9C4D6', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.accent },
  soonBadge: { backgroundColor: '#EFEDF3', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  track: { width: 46, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  planCard: { borderRadius: radius.xl, padding: 20, marginBottom: 14 },
  planBtn: { marginTop: 16, backgroundColor: colors.gold, borderRadius: radius.sm, paddingVertical: 9, paddingHorizontal: 16, alignSelf: 'flex-start' },
  payCard: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 13, marginBottom: 13 },
  visa: { width: 42, height: 30, borderRadius: 6, backgroundColor: '#1A1F36', alignItems: 'center', justifyContent: 'center' },
  addPay: { borderWidth: 1, borderColor: '#E2DEEC', borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  invoicesLink: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 15, marginTop: 14 },
  invIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
});
