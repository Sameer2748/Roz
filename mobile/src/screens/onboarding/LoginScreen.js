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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
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
        // 2b. Case: New user. Did they fill out the onboarding form in the app yet?
        if (onboardingData.gender) {
          // Yes! Submit their data to finalize the profile and create the plan
          const response = await api.post('/users/onboarding', {
            ...onboardingData,
            age: onboardingData.age || 25,
            allergies: onboardingData.allergies || [],
            meals_per_day: onboardingData.meals_per_day || 3
          });

          if (response.data.success) {
            const { plan } = response.data.data;
            setProfile({ ...onboardingData, onboarding_complete: true });
            setDailyTarget(plan);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } else {
          // No! They clicked "Sign In" from the Welcome screen without filling the form.
          // Force them to go through the questionnaire to get an accurate plan.
          Alert.alert(
            'Almost there!',
            'Please complete your profile so we can create a personalized nutrition plan just for you.',
            [{ text: 'Start Onboarding', onPress: () => navigation.replace('Gender') }]
          );
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
