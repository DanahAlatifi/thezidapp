import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors } from '../theme';
import { T, LangToggle } from '../components/ui';
import { useI18n } from '../i18n';
import { useStore } from '../data/store';
import api, { CONFIG } from '../api/odoo';
import { useBrand } from '../theme/BrandContext';

export function LoginScreen({ navigation }) {
  const { t, isRTL, textAlign } = useI18n();
  const { updateProfile, setRole } = useStore();
  const { refreshBrand } = useBrand();              // ← ١) هنا فقط
  const [email, setEmail] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onLogin = async () => {
    setError('');
    if (!CONFIG.USE_API) {
      navigation.replace('App');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('أدخل البريد وكلمة المرور');
      return;
    }
    setLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      if (res && res.ok) {
        await refreshBrand().catch(() => {});                   // ← ٢) هنا داخل onLogin

        const meRes = await api.me();
        if (meRes && meRes.ok && meRes.user) {
          updateProfile({
            name: meRes.user.name || email,
            email: meRes.user.email || email,
            company: meRes.user.company || '',
            accountType: meRes.user.account_type || 'company',
          });
          if (setRole) setRole(meRes.user.is_owner ? 'manager' : 'user');
        } else {
          updateProfile({ name: email, email });
        }
        navigation.replace('App');
      } else {
        setError('البريد أو كلمة مرور غير صحيحة');
      }
    } catch (e) {
       console.log('LOGIN ERROR >>>', e.message);
       setError('خطأ: ' + e.message);
        } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#EADDFA', '#F3EEC8', '#D6F0E2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      {/* زر اللغة أعلى الصفحة */}
      <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <LangToggle />
      </View>

      <ScrollView contentContainerStyle={styles.loginWrap}>
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <T center style={{ color: 'rgba(26,26,26,.76)', fontWeight: '700', fontSize: 33, lineHeight: 45 }}>{t('appName')}</T>
          <T center size={12} style={{ color: '#5C5470', marginTop: 11, lineHeight: 20 }}>{t('tagline')}</T>
        </View>

        <View style={styles.glassCard}>
          <Text style={[styles.labelDark, { textAlign }]}>{t('email')}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="admin"
            placeholderTextColor="#9C97A8"
            style={[styles.glassInput, { textAlign: 'left' }]}
          />
          <Text style={[styles.labelDark, { textAlign }]}>{t('password')}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••••"
            placeholderTextColor="#9C97A8"
            style={[styles.glassInput, { textAlign }]}
          />

          {error ? (
            <Text style={{ color: '#B4271F', fontSize: 12.5, fontWeight: '600', textAlign, marginBottom: 10 }}>{error}</Text>
          ) : null}

          <Pressable onPress={onLogin} disabled={loading} style={[styles.glassBtn, loading && { opacity: 0.6 }]}>
            {loading
              ? <ActivityIndicator color="#4C475D" />
              : <Text style={{ color: '#4C475D', fontWeight: '700', fontSize: 15 }}>{t('login')}</Text>}
          </Pressable>
        </View>

        <T center size={13} style={{ color: '#3C3550', marginTop: 20 }}>
          {t('newHere')}{' '}
          <Text onPress={() => navigation.navigate('Register')} style={{ fontWeight: '700', color: '#7A57BC' }}>
            {t('createAccount')}
          </Text>
        </T>

        <T center size={11.5} style={{ color: '#7C7690', marginTop: 40 }}>{t('noAccessBeforeLogin')}</T>
      </ScrollView>
    </LinearGradient>
  );
}

// ————— إنشاء حساب —————
export function RegisterScreen({ navigation }) {
  const { t, isRTL, textAlign } = useI18n();
  const { updateProfile } = useStore();
  const [type, setType] = useState('company');
  const isCompany = type === 'company';
  const row = isRTL ? 'row-reverse' : 'row';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [location, setLocation] = useState('');
  const [company, setCompany] = useState('');
  const [vat, setVat] = useState('');
  const [error, setError] = useState('');

  const goPayment = () => {
    setError('');
    // الحقول المطلوبة في الباك اند: full_name, email, mobile
    if (!name.trim() || !email.trim() || !mobile.trim()) {
      setError('يرجى تعبئة الاسم والبريد ورقم الهاتف');
      return;
    }
    updateProfile({
      name: name.trim(),
      email: email.trim(),
      company: company.trim() || name.trim(),
      accountType: type,
    });
    // نمرّر بيانات التسجيل لصفحة الدفع لإنشاء الحساب في أودو بعد الدفع
    navigation.navigate('Payment', {
      registration: {
        full_name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        address: location.trim(),
        account_type: type,
        company_name: company.trim(),
        vat: vat.trim(),
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F5FA' }}>
      <ScrollView contentContainerStyle={styles.regWrap} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Pressable onPress={() => navigation.goBack()} style={{ flexDirection: row, alignItems: 'center', gap: 6 }}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ transform: isRTL ? [] : [{ scaleX: -1 }] }}>
              <Path d="M9 5l7 7-7 7" stroke={colors.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <T size={13.5} weight="bold" color={colors.accent}>{t('login')}</T>
          </Pressable>
          <LangToggle />
        </View>

        <T size={25} weight="bold">{t('createAccountTitle')}</T>
        <T size={13.5} color="#6B6779" style={{ marginTop: 5 }}>{t('step1of2')}</T>

        <View style={{ flexDirection: row, gap: 10, marginTop: 20 }}>
          <TypeCard active={type === 'partner'} onPress={() => setType('partner')} icon="person" title={t('individuals')} desc={t('individualsDesc')} isRTL={isRTL} />
          <TypeCard active={isCompany} onPress={() => setType('company')} icon="company" title={t('partner')} desc={t('partnerDesc')} isRTL={isRTL} />
        </View>

        <View style={{ marginTop: 18 }}>
          <RegField label={t('fullName')} textAlign={textAlign} value={name} onChangeText={setName} />
          <RegField label={t('email')} ltr textAlign={textAlign} value={email} onChangeText={setEmail} keyboard="email-address" />
          <RegField label={t('phone')} ltr placeholder="+966 5• ••• ••••" textAlign={textAlign} value={mobile} onChangeText={setMobile} keyboard="phone-pad" />
          <RegField label={t('location')} placeholder={t('locationPh')} textAlign={textAlign} value={location} onChangeText={setLocation} />
          <RegField label={t('password')} secure defaultValue="••••••••••" textAlign={textAlign} />
          <RegField label={t('confirmPassword')} secure defaultValue="••••••••••" textAlign={textAlign} />

          {isCompany && (
            <View style={styles.companyBox}>
              <T size={11.5} weight="bold" color={colors.accent} style={{ marginBottom: 11 }}>{t('companyDetails')}</T>
              <RegField label={t('legalName')} compact textAlign={textAlign} value={company} onChangeText={setCompany} />
              <RegField label={t('taxNumber')} ltr placeholder="3•• •••• •••• •••" compact textAlign={textAlign} value={vat} onChangeText={setVat} />
              <RegField label={t('crNumber')} ltr compact last textAlign={textAlign} />
            </View>
          )}

          {error ? (
            <Text style={{ color: '#B4271F', fontSize: 12.5, fontWeight: '600', textAlign, marginBottom: 10 }}>{error}</Text>
          ) : null}
          <Pressable onPress={goPayment} style={styles.regBtn}>
            <Text style={{ color: '#1A1A1A', fontWeight: '700', fontSize: 15 }}>{t('continueToPayment')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function TypeCard({ active, onPress, icon, title, desc, isRTL }) {
  const ink = active ? colors.accent : '#2A2833';
  const row = isRTL ? 'row-reverse' : 'row';
  return (
    <Pressable onPress={onPress} style={[styles.typeCard, active && { borderColor: colors.accent, backgroundColor: '#F7F5FB' }]}>
      <View style={{ flexDirection: row, alignItems: 'center', justifyContent: 'space-between' }}>
        <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
          {icon === 'person' ? (
            <>
              <Circle cx="12" cy="8" r="4" stroke={ink} strokeWidth="2" />
              <Path d="M4 20a8 8 0 0116 0" stroke={ink} strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <Rect x="4" y="4" width="16" height="16" rx="2" stroke={ink} strokeWidth="2" />
              <Path d="M9 20v-4h6v4" stroke={ink} strokeWidth="2" strokeLinecap="round" />
            </>
          )}
        </Svg>
        <View style={[styles.radioOuter, active && { borderColor: colors.accent }]}>
          {active && <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />}
        </View>
      </View>
      <T weight="bold" size={14} color={ink} style={{ marginTop: 10 }}>{title}</T>
      <T size={11.5} color="#8A8698" style={{ marginTop: 2 }}>{desc}</T>
    </Pressable>
  );
}

function RegField({ label, ltr, secure, placeholder, defaultValue, compact, last, textAlign, value, onChangeText, keyboard }) {
  return (
    <View style={{ marginBottom: last ? 0 : 12 }}>
      <Text style={[styles.labelReg, { textAlign }]}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#B8B3C4"
        secureTextEntry={secure}
        defaultValue={defaultValue}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboard}
        style={[styles.regInput, compact && { padding: 12 }, { textAlign: ltr ? 'left' : textAlign }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingTop: 50, paddingHorizontal: 20, justifyContent: 'space-between' },
  loginWrap: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 30 },
  glassCard: {
    borderRadius: 26, padding: 22, backgroundColor: 'rgba(255,255,255,.5)',
    shadowColor: '#5A4682', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.18, shadowRadius: 60, elevation: 6,
  },
  labelDark: { fontSize: 12.5, fontWeight: '600', color: '#000', marginBottom: 8 },
  glassInput: {
    borderRadius: 13, padding: 14, fontSize: 14, color: '#2A2833', marginBottom: 14,
    backgroundColor: 'rgba(199,178,238,.13)',
  },
  glassBtn: { borderRadius: 15, paddingVertical: 15, alignItems: 'center', marginTop: 6, backgroundColor: 'rgba(199,178,238,.57)' },
  regWrap: { padding: 20, paddingTop: 54, paddingBottom: 40 },
  typeCard: { flex: 1, borderWidth: 1.5, borderColor: '#E2DEEC', borderRadius: 16, padding: 15 },
  radioOuter: { width: 17, height: 17, borderRadius: 9, borderWidth: 2, borderColor: '#C9C4D6', alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
  labelReg: { fontSize: 12, fontWeight: '600', color: '#4B4858', marginBottom: 6 },
  regInput: { borderWidth: 1, borderColor: '#DDD9E6', borderRadius: 13, padding: 13, fontSize: 13.5, backgroundColor: '#fff', color: colors.ink },
  companyBox: { backgroundColor: '#F7F5FB', borderWidth: 1, borderColor: '#EBE7F4', borderRadius: 16, padding: 15, marginBottom: 12 },
  regBtn: { backgroundColor: '#C7B2EE', borderRadius: 15, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
});