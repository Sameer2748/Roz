import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import useUserStore from '../../store/userStore';
import useAuthStore from '../../store/authStore';
import { signInWithGoogle } from '../../services/auth';
import api from '../../services/api';
import colors from '../../constants/colors';

export default function LoginScreen({ navigation }) {
  const { onboardingData, setProfile, setDailyTarget } = useUserStore();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // 1. Authenticate with Google (or fallback dev login)
      const { user, isNewUser } = await signInWithGoogle();
      
      // Update local auth state
      await setUser(user);

      if (!isNewUser) {
        // 2a. Fetch existing user profile & plan if already onboarded
        const response = await api.get('/users/me');
        if (response.data.success) {
          const { profile, daily_target, streak } = response.data.data;
          setProfile({ ...profile, onboarding_complete: true });
          setDailyTarget(daily_target);
          // RootNavigator will switch to Main automatically
        }
      } else {
        // 2b. Submit onboarding data and generate plan on backend for new users
        const response = await api.post('/users/onboarding', {
          age: onboardingData.age || 25,
          gender: onboardingData.gender || 'male',
          height_cm: onboardingData.height_cm || 180,
          weight_kg: onboardingData.weight_kg || 75,
          target_weight_kg: onboardingData.target_weight_kg || 70,
          activity_level: onboardingData.activity_level || 'moderately_active',
          goal: onboardingData.goal || 'fat_loss',
          pace: onboardingData.pace || 1.0,
          dietary_preference: onboardingData.dietary_preference || 'none',
          allergies: [],
          meals_per_day: 3
        });

        if (response.data.success) {
          const { plan } = response.data.data;
          
          // 3. Mark onboarding as complete and save final profile
          const finalProfile = { ...onboardingData, onboarding_complete: true };
          setProfile(finalProfile);
          setDailyTarget(plan);
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          throw new Error('Onboarding data synchronization failed');
        }
      }
    } catch (error) {
      console.error('Login/Onboarding Error:', error);
      Alert.alert('Error', 'Something went wrong during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      onBack={() => navigation.goBack()}
    >
      <View style={styles.center}>
        <Text style={styles.title}>Create an account</Text>
        <Text style={styles.subtitle}>Save your personal plan and start your journey with Roz Today.</Text>

        <TouchableOpacity 
          style={[styles.googleBtn, loading && styles.disabledBtn]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Ionicons name="logo-google" size={24} color="#000" style={styles.icon} />
              <Text style={styles.googleText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.privacyNote}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 34, fontWeight: '800', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40, lineHeight: 24 },
  footer: { gap: 16, marginBottom: 40, alignItems: 'center' },
  googleBtn: {
    flexDirection: 'row',
    width: '100%',
    height: 64,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  disabledBtn: { opacity: 0.6 },
  icon: { marginRight: 12 },
  googleText: { fontSize: 17, fontWeight: '700', color: '#000' },
  privacyNote: { fontSize: 12, color: colors.textTertiary, textAlign: 'center', paddingHorizontal: 40, marginTop: 8 },
});
