import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import useAuthStore from '../store/authStore';
import useUserStore from '../store/userStore';
import api from '../services/api';
import OnboardingNavigator from './OnboardingNavigator';
import MainStackNavigator from './MainStackNavigator';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hydrate = useAuthStore((s) => s.hydrate);
  const profile = useUserStore((s) => s.profile);
  const onboardingComplete = profile?.onboarding_complete;

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me');
      if (res.data.success) {
        useUserStore.getState().setProfile(res.data.data.profile);
        useUserStore.getState().setDailyTarget(res.data.data.daily_target);
        useUserStore.getState().setStreak(res.data.data.streak);
      }
    } catch (err) {
      console.log('Failed to fetch profile in RootNavigator:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await hydrate();
      // Check auth state in the store directly because isAuthenticated from hook might not be updated yet
      const currentAuth = useAuthStore.getState().isAuthenticated;
      if (currentAuth) {
        await fetchProfile();
      }
    };
    init();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated || !onboardingComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainStackNavigator} />
      )}
    </Stack.Navigator>
  );
}
