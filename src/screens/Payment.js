import React, { useState } from 'react';
import { View, ScrollView, TextInput, Pressable, StyleSheet, Text, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';
import { T } from '../components/ui';
import { useI18n } from '../i18n';
import api, { CONFIG } from '../api/odoo';

export function PaymentScreen({ navigation, route }) {
  const { t, isRTL, textAlign } = useI18n();
  const [plan, setPlan] = useState('full');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const row = isRTL ? 'row-reverse' : 'row';

  // بيانات التسجيل القادمة من شاشة إنشاء الحساب
  const registration = route?.params?.registration;

  const PLANS = [
    { key: 'full', title: t('planFull'), desc: t('planFullDesc'), price: '﷼ 499' },
    { key: 'integration', title: t('planIntegration'), desc: t('planIntegrationDesc'), price: '﷼ 199' },
  ];

  const onPay = async () => {
    setError('');
    // وضع التجربة: بدون باك اند ندخل مباشرة
    if (!CONFIG.USE_API || !registration) {
      navigation.replace('App');
      return;
    }
    setLoading(true);
    try {
      // إنشاء الحساب فعلياً في أودو
      const res = await api.register({ ...registration, plan });
      if (res && res.ok) {
        navigation.replace('App');
      } else {
        const miss = res && res.fields ? ` (${res.fields.join(', ')})` : '';
        setError('تعذّر إنشاء الحساب' + miss);
      }
    } catch (e) {
      setError('تعذّر الاتصال بالخادم. تأكد من الشبكة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F5FA' }}>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        {/* رجوع */}
        <Pressable onPress={() => navigation.goBack()} style={[styles.backLink, { flexDirection: row }]}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ transform: isRTL ? [] : [{ scaleX: -1 }] }}>
            <Path d="M9 5l7 7-7 7" stroke={colors.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <T size={13.5} weight="bold" color={colors.accent}>{t('createAccountTitle')}</T>
        </Pressable>

        <T size={25} weight="bold">{t('payTitle')}</T>
        <T size={13.5} color="#6B6779" style={{ marginTop: 5 }}>{t('step2of2')}</T>

        {/* اختيار الخطة */}
        <View style={{ gap: 12, marginTop: 20 }}>
          {PLANS.map((p) => {
            const on = plan === p.key;
            return (
              <Pressable key={p.key} onPress={() => setPlan(p.key)}
                style={[styles.planCard, { flexDirection: row }, on && { borderColor: colors.accent, backgroundColor: '#F7F5FB' }]}>
                <View style={[styles.radioOuter, on && { borderColor: colors.accent }]}>
                  {on && <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between' }}>
                    <T weight="bold" size={15}>{p.title}</T>
                    <View style={{ flexDirection: row, alignItems: 'baseline', gap: 3 }}>
                      <T weight="bold" size={16} color={colors.accent}>{p.price}</T>
                      <T size={11} color={colors.muted}>{t('perMonth')}</T>
                    </View>
                  </View>
                  <T size={12} color="#8A8698" style={{ marginTop: 4 }}>{p.desc}</T>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* بطاقة الدفع */}
        <View style={styles.payBox}>
          <PayField label={t('cardNumber')} placeholder="•••• •••• •••• ••••" ltr keyboard="number-pad" />
          <View style={{ flexDirection: row, gap: 12 }}>
            <View style={{ flex: 1 }}><PayField label={t('expiry')} placeholder="MM / YY" ltr keyboard="number-pad" /></View>
            <View style={{ flex: 1 }}><PayField label={t('cvc')} placeholder="•••" ltr keyboard="number-pad" secure /></View>
          </View>
          <PayField label={t('cardHolder')} placeholder="RAWAA TRADING" ltr last />
        </View>

        {error ? (
          <Text style={{ color: '#B4271F', fontSize: 12.5, fontWeight: '600', textAlign, marginBottom: 10, marginTop: 6 }}>{error}</Text>
        ) : null}
        <Pressable onPress={onPay} disabled={loading} style={[styles.payBtn, { backgroundColor: colors.accent }, loading && { opacity: 0.6 }]}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{t('payNow')}</Text>}
        </Pressable>

        <T center size={11.5} color="#8A8698" style={{ marginTop: 14 }}>{t('securedNote')}</T>
      </ScrollView>
    </View>
  );
}

function PayField({ label, placeholder, ltr, secure, keyboard, last }) {
  const { textAlign, isRTL } = useI18n();
  return (
    <View style={{ marginBottom: last ? 0 : 12 }}>
      <Text style={[styles.label, { textAlign }]}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#B8B3C4"
        secureTextEntry={secure}
        keyboardType={keyboard}
        style={[styles.input, { textAlign: ltr ? 'left' : textAlign }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, paddingTop: 58, paddingBottom: 40 },
  backLink: { alignItems: 'center', gap: 6, marginBottom: 16 },
  planCard: { alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: '#E2DEEC', borderRadius: 16, padding: 15, backgroundColor: '#fff' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#C9C4D6', alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  payBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#EBE7F4', borderRadius: 16, padding: 16, marginTop: 18 },
  label: { fontSize: 12, fontWeight: '600', color: '#4B4858', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#DDD9E6', borderRadius: 13, padding: 13, fontSize: 13.5, backgroundColor: '#fff', color: colors.ink },
  payBtn: { borderRadius: 15, paddingVertical: 16, alignItems: 'center', marginTop: 18 },
});
