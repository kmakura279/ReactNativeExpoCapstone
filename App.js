
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Profile from './screens/Profile';
import SplashScreen from './screens/SplashScreen';

const Stack = createNativeStackNavigator();

const STORAGE_KEYS = [
  'isOnboardingCompleted',
  'firstName',
  'lastName',
  'email',
  'phoneNumber',
  'avatarImage',
  'emailNotifications',
];

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingCompleted, setIsOnboardingCompleted] =
    useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem(
          'isOnboardingCompleted'
        );

        setIsOnboardingCompleted(value === 'true');
      } catch (error) {
        console.error(
          'Error loading onboarding status:',
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  const completeOnboarding = async (firstName, email) => {
    try {
      await AsyncStorage.multiSet([
        ['firstName', firstName.trim()],
        ['email', email.trim()],
        ['isOnboardingCompleted', 'true'],
      ]);

      setIsOnboardingCompleted(true);
    } catch (error) {
      console.error('Onboarding error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(STORAGE_KEYS);

      setIsOnboardingCompleted(false);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <SplashScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: '#FFFFFF',
            },
          }}
        >
          {isOnboardingCompleted ? (
            <>
              <Stack.Screen
                name="Home"
                component={Home}
              />

              <Stack.Screen name="Profile">
                {() => <Profile onLogout={logout} />}
              </Stack.Screen>
            </>
          ) : (
            <Stack.Screen name="Onboarding">
              {() => (
                <Onboarding
                  onComplete={completeOnboarding}
                />
              )}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
