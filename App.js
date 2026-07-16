import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen, RegisterScreen } from './src/screens/Auth';
import { PaymentScreen } from './src/screens/Payment';
import { AppStack } from './src/navigation';
import { StoreProvider } from './src/data/store';
import { I18nProvider } from './src/i18n';
import { BrandProvider } from './src/theme/BrandContext';

const Root = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <BrandProvider>
          <StoreProvider>
           <NavigationContainer>
             <StatusBar style="dark" />
              <Root.Navigator screenOptions={{ headerShown: false }}>
                <Root.Screen name="Login" component={LoginScreen} />
                <Root.Screen name="Register" component={RegisterScreen} />
                <Root.Screen name="Payment" component={PaymentScreen} />
                <Root.Screen name="App" component={AppStack} />
              </Root.Navigator>
            </NavigationContainer>
          </StoreProvider>
        </BrandProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
