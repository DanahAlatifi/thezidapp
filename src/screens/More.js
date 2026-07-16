import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius, roleBadge } from '../theme';
import { T, Card, Row, Avatar, Badge, ScreenTitle } from '../components/ui';
import { ScreenBg } from '../components/ScreenBg';
import { initialOf, avatarOf } from '../data/ui';
import { useI18n } from '../i18n';
import { useStore } from '../data/store';

const ITEMS = [
  { key: 'Services', tkey: 'mServices', icon: 'grid' },
  { key: 'Connect', tkey: 'mConnect', icon: 'plus' },
  { key: 'Team', tkey: 'mTeam', icon: 'users' },
  //{ key: 'Customers', tkey: 'mCustomers', icon: 'user' },
  //{ key: 'Billing', tkey: 'mBilling', icon: 'card' },
  //{ key: 'Invoices', tkey: 'mInvoices', icon: 'invoice' },
  { key: 'Logs', tkey: 'mLogs', icon: 'clock' },
];

function Icon({ name }) {
  const p = {
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    plus: 'M12 5v14M5 12h14',
    users: 'M16 20v-2a4 4 0 00-8 0v2M12 12a4 4 0 100-8 4 4 0 000 8',
    user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8',
    card: 'M3 7h18v11H3zM3 10h18',
    invoice: 'M6 2h9l3 3v17H6zM9 8h6M9 12h6M9 16h4',
    clock: 'M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18',
  }[name];
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d={p} stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MoreScreen({ navigation }) {
  const { isRTL, toggle, lang, t } = useI18n();
  const { profile, role: myRole, initials } = useStore();
  const row = isRTL ? 'row-reverse' : 'row';
  const [avBg, avFg] = avatarOf(0);
  const roleLabel = myRole === 'manager' ? 'مدير' : myRole === 'admin' ? 'مشرف' : 'مستخدم';
  const rb = roleBadge[roleLabel] || roleBadge['مدير'];

  return (
    <ScreenBg>
      <ScrollView contentContainerStyle={styles.wrap} showsVerticalScrollIndicator={false}>
        <ScreenTitle title={t('tabMore')} />

        {/* بطاقة المستخدم */}
        <Pressable onPress={() => navigation.navigate('Profile')}>
          <Card style={{ marginBottom: 16 }}>
            <Row gap={14}>
              <Avatar initial={initials || initialOf(profile.name)} bg={avBg} fg={avFg} size={54} />
              <View style={{ flex: 1 }}>
                <T weight="bold" size={16}>{profile.name}</T>
                <T size={12.5} color={colors.muted} ltr>{profile.email}</T>
              </View>
              <Badge label={roleLabel} bg={rb.bg} fg={rb.fg} />
            </Row>
          </Card>
        </Pressable>

        <Card style={{ padding: 0 }}>
          {ITEMS.map((it, i) => (
            <Pressable key={it.key} onPress={() => navigation.navigate(it.key)} style={[styles.row, { flexDirection: row }, i > 0 && styles.divider]}>
              <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}><Icon name={it.icon} /></View>
              <T size={14.5} weight="semi" style={{ flex: 1 }}>{t(it.tkey)}</T>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M15 5l-7 7 7 7" stroke={colors.mutedLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
          ))}
        </Card>

        {/* اللغة — تبديل سريع */}
        <Card style={{ padding: 0, marginTop: 16 }}>
          <Pressable onPress={toggle} style={[styles.row, { flexDirection: row }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M4 5h7M9 3v2c0 5-2.5 8-6 10M6 8c0 3 3 5 6 6" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M14 20l4-9 4 9M15.5 17h5" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <T size={14.5} weight="semi" style={{ flex: 1 }}>{t('language')}</T>
            <View style={{ flexDirection: row, alignItems: 'center', gap: 8 }}>
              <T size={13} weight="bold" color={colors.accent}>{lang === 'ar' ? 'العربية' : 'English'}</T>
              <View style={{ backgroundColor: colors.accentSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <T size={12} weight="bold" color={colors.accent}>{lang === 'ar' ? 'EN' : 'ع'}</T>
              </View>
            </View>
          </Pressable>
        </Card>

        <Pressable onPress={() => navigation.getParent()?.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] })} style={styles.logout}>
          <T center size={14} weight="bold" color={colors.danger}>{t('logout')}</T>
        </Pressable>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingTop: 52, paddingBottom: 30 },
  row: { alignItems: 'center', gap: 14, padding: 15 },
  divider: { borderTopWidth: 1, borderTopColor: colors.borderSoft },
  iconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  logout: { marginTop: 16, borderWidth: 1, borderColor: colors.dangerBg, backgroundColor: '#fff', borderRadius: radius.md, paddingVertical: 14 },
});
