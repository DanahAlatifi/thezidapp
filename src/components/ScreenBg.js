import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

// خلفية الشاشة الناعمة (تدرّج بسيط)
export function ScreenBg({ children }) {
  return <View style={styles.bg}>{children}</View>;
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.surface },
});
