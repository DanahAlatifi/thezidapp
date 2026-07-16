import React, { useRef, useEffect, useState } from 'react';
import { View, Pressable, Text, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { colors, radius, shadow } from '../theme';
import { useI18n } from '../i18n';

import { HomeScreen } from '../screens/Home';
import { OrdersScreen, OrderDetailScreen } from '../screens/Orders';
import { SyncScreen, LogsScreen } from '../screens/Sync';
import { MoreScreen } from '../screens/More';
import { InvoicesScreen, InvoiceDetailScreen } from '../screens/Invoices';
import {
  ServicesScreen, ConnectScreen, TeamScreen, UserSettingsScreen,
  CustomersScreen, BillingScreen, ProfileScreen, AddMemberScreen,
  ConnectSetupScreen, ConnectProgressScreen, AddPaymentScreen, ManagePlanScreen,
  StoreDetailScreen, StoreSettingsScreen,
} from '../screens/Manage';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ name, color }) {
  const paths = {
    home: <Path d="M3 10.5L12 3l9 7.5M5 9v11h14V9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    orders: <><Path d="M6 2h12l2 5v13a1 1 0 01-1 1H5a1 1 0 01-1-1V7l2-5z" stroke={color} strokeWidth="2" strokeLinejoin="round" /><Path d="M4 7h16M9 11a3 3 0 006 0" stroke={color} strokeWidth="2" strokeLinecap="round" /></>,
    sync: <Path d="M4 12a8 8 0 0113.7-5.7L20 8M20 4v4h-4M20 12a8 8 0 01-13.7 5.7L4 16M4 20v-4h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    more: <><Circle cx="5" cy="12" r="1.9" fill={color} /><Circle cx="12" cy="12" r="1.9" fill={color} /><Circle cx="19" cy="12" r="1.9" fill={color} /></>,
  };
  return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">{paths[name]}</Svg>;
}

function TabBar({ state, navigation }) {
  const { t, isRTL } = useI18n();
  const { width } = useWindowDimensions();
  const labels = { Home: t('tabHome'), Orders: t('tabOrders'), Sync: t('tabSync'), More: t('tabMore') };
  const icons = { Home: 'home', Orders: 'orders', Sync: 'sync', More: 'more' };

  const OUTER = 16;
  const PAD = 6;
  const barWidth = width - OUTER * 2;
  const count = state.routes.length;
  const slotWidth = (barWidth - PAD * 2) / count;

  // مع direction=rtl في الـ navigator، الـ pager يعكس الترتيب تلقائياً
  // فنعرض التبويبات بالترتيب الطبيعي (بدون عكس يدوي)
  const order = state.routes;

  // الموضع المعروض للتبويب النشط (0 = أقصى اليسار بصرياً)
  const activeRoute = state.routes[state.index];
  const displayPos = order.indexOf(activeRoute);

  // المؤشر البنفسجي يتحرك للموضع المعروض
  const anim = useRef(new Animated.Value(displayPos)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: displayPos,
      useNativeDriver: true,
      friction: 9,
      tension: 90,
    }).start();
  }, [displayPos]);

  const inputRange = order.map((_, i) => i);
  const translateX = anim.interpolate({
    inputRange: inputRange.length > 1 ? inputRange : [0, 1],
    outputRange: (inputRange.length > 1 ? inputRange : [0, 1]).map((i) => PAD + i * slotWidth),
  });

  return (
    <View style={styles.tabWrap}>
      <View style={[styles.tabBar, { width: barWidth, flexDirection: 'row' }]}>
        <Animated.View
          style={[styles.indicator, { backgroundColor: colors.accent, width: slotWidth, transform: [{ translateX }] }]}
        />
        {order.map((route) => {
          const routeIndex = state.routes.indexOf(route);
          const focused = state.index === routeIndex;
          const color = focused ? '#fff' : colors.mutedLight;
          const onPress = () => {
            const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tabItem, { width: slotWidth, flexDirection: 'row' }]}
            >
              <TabIcon name={icons[route.name]} color={color} />
              <Text numberOfLines={1} style={[styles.tabLabel, { color, opacity: focused ? 1 : 0.85 }]}>
                {labels[route.name]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}



function Tabs() {
  const { isRTL } = useI18n();
  const screens = [
    <Tab.Screen key="Home" name="Home" component={HomeScreen} />,
    <Tab.Screen key="Orders" name="Orders" component={OrdersScreen} />,
    <Tab.Screen key="Sync" name="Sync" component={SyncScreen} />,
    <Tab.Screen key="More" name="More" component={MoreScreen} />,
  ];
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(p) => <TabBar {...p} />}
      tabBarPosition="bottom"
      swipeEnabled={true}
      screenOptions={{ swipeEnabled: true }}
      screenOptions={{ swipeEnabled: true, lazy: true }}
    >
      {isRTL ? [...screens].reverse() : screens}
    </Tab.Navigator>
  );
}

// المكدس الداخلي بعد تسجيل الدخول
export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      <Stack.Screen name="Logs" component={LogsScreen} />
      <Stack.Screen name="Services" component={ServicesScreen} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} />
      <Stack.Screen name="StoreSettings" component={StoreSettingsScreen} />
      <Stack.Screen name="Connect" component={ConnectScreen} />
      <Stack.Screen name="ConnectSetup" component={ConnectSetupScreen} />
      <Stack.Screen name="ConnectProgress" component={ConnectProgressScreen} />
      <Stack.Screen name="Team" component={TeamScreen} />
      <Stack.Screen name="AddMember" component={AddMemberScreen} />
      <Stack.Screen name="UserSettings" component={UserSettingsScreen} />
      <Stack.Screen name="Customers" component={CustomersScreen} />
      <Stack.Screen name="Billing" component={BillingScreen} />
      <Stack.Screen name="AddPayment" component={AddPaymentScreen} />
      <Stack.Screen name="ManagePlan" component={ManagePlanScreen} />
      <Stack.Screen name="Invoices" component={InvoicesScreen} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabWrap: { paddingHorizontal: 16, paddingBottom: 26, paddingTop: 4, backgroundColor: 'transparent', alignItems: 'center' },
  tabBar: {
    alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: 26,
    padding: 6, height: 56, position: 'relative', ...shadow.float,
  },
  // المؤشر البنفسجي المتحرك خلف التبويب النشط
  indicator: {
    position: 'absolute',
    top: 6, bottom: 6, left: 0,
    borderRadius: 20,
  },
  tabItem: {
    alignItems: 'center', justifyContent: 'center', gap: 6,
    height: '100%', borderRadius: 20,
  },
  tabLabel: { fontWeight: '700', fontSize: 12.5, flexShrink: 1 },
});