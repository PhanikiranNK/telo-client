import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { AuthStack } from './AuthStack';
import { MainTabNavigator } from './MainTabNavigator';
import { useAuth } from '../hooks/useAuth';

// Must be called before any navigation renders
enableScreens();

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  useAuth();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
