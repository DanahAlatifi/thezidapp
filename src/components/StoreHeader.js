import React, { useState, useEffect } from 'react';
import { View, Pressable, Modal, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius, shadow } from '../theme';
import { T } from './ui';
import { useStore } from '../data/store';
import { useI18n } from '../i18n';
import { BRAND } from '../brands';
import api, { CONFIG } from '../api/odoo';

const PCOLOR = { 'زد': colors.accent };
const PINIT = { 'زد': 'Z' };

export function StoreHeader({ navigation, embedded }) {
  const { curProvider, curStore, pick } = useStore();
  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isRTL, t } = useI18n();
  const row = isRTL ? 'row-reverse' : 'row';

  // نسحب المتاجر من أودو ونجمّعها حسب المنصّة
  useEffect(() => {
    if (!CONFIG.USE_API) return;
    let alive = true;
    setLoading(true);
    api.fetchConnections()
      .then((res) => {
        if (!alive) return;
        if (res && res.ok && Array.isArray(res.stores)) {
          const g = {};
          res.stores.forEach((s) => {
            const key = s.provider || 'zid';
            const name = (BRAND[key] || {}).name || key;
            const color = (BRAND[key] || {}).color || colors.accent;
            if (!g[key]) g[key] = { key, name, color, stores: [] };
            g[key].stores.push({ id: s.id, name: s.name });
          });
          setGroups(Object.values(g));
        }
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={[styles.header, { flexDirection: row }, embedded && styles.embedded]}>
        <View style={[styles.badgeSq, { backgroundColor: PCOLOR[curProvider] || colors.accent }]}>
          <T weight="bold" size={13} color="#fff">{PINIT[curProvider] || (curProvider || '?').charAt(0)}</T>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T weight="bold" size={14}>{curStore || 'اختر متجراً'}</T>
          <T size={11.5} color={colors.muted}>{curProvider} · {t('tapToSwitch')}</T>
        </View>
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
          <Path d="M6 9l6 6 6-6" stroke={colors.muted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.grabber} />
            <T size={11.5} weight="bold" color={colors.muted} style={{ marginBottom: 10 }}>الخدمات والمتاجر</T>
            <ScrollView style={{ maxHeight: 360 }}>
              {loading && <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} />}
              {!loading && groups.length === 0 && (
                <T center size={13} color={colors.muted} style={{ paddingVertical: 20 }}>لا توجد متاجر مربوطة</T>
              )}
              {groups.map((p) => (
                <View key={p.key} style={{ marginBottom: 8 }}>
                  <View style={[styles.provRow, { flexDirection: row }]}>
                    <View style={[styles.badgeMini, { backgroundColor: p.color }]}>
                      <T weight="bold" size={11} color="#fff">{PINIT[p.name] || p.name.charAt(0)}</T>
                    </View>
                    <T weight="bold" size={12.5} color={colors.inkSoft}>{p.name}</T>
                  </View>
                  {p.stores.map((st) => {
                    const active = curProvider === p.name && curStore === st.name;
                    return (
                      <Pressable
                        key={st.id ?? st.name}
                        onPress={() => { pick(p.name, st.name, st.id); setOpen(false); }}
                        style={[styles.storeRow, { flexDirection: row }, active && { backgroundColor: '#F5F3FA' }]}
                      >
                        <T size={14} weight="semi">{st.name}</T>
                        {active && (
                          <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
                            <Path d="M5 12l4 4 10-10" stroke={colors.accent} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                          </Svg>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
            <Pressable onPress={() => { setOpen(false); navigation.navigate('Connect'); }} style={[styles.connectRow, { flexDirection: row }]}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
                <Path d="M12 5v14M5 12h14" stroke={colors.accent} strokeWidth="2.4" strokeLinecap="round" />
              </Svg>
              <T size={14} weight="bold" color={colors.accent}>ربط خدمة جديدة</T>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center', gap: 10, backgroundColor: '#fff',
    borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 10, paddingHorizontal: 12,
    ...shadow.card,
  },
  embedded: { marginBottom: 0 },
  badgeSq: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeMini: { width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,12,40,.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18, paddingBottom: 34 },
  grabber: { width: 40, height: 4, borderRadius: 4, backgroundColor: '#E0DCEA', alignSelf: 'center', marginBottom: 16 },
  provRow: { alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 4 },
  storeRow: {
    alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 12, borderRadius: radius.md,
  },
  connectRow: {
    alignItems: 'center', gap: 8, paddingTop: 14, marginTop: 6,
    borderTopWidth: 1, borderTopColor: colors.borderSoft,
  },
});
