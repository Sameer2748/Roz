import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Button from '../../components/ui/Button';
import colors from '../../constants/colors';
import useAuthStore from '../../store/authStore';
import useUserStore from '../../store/userStore';

const { width } = Dimensions.get('window');
const APP_ICON = require('../../../assets/icon_roz.png');

export default function WelcomeScreen({ navigation }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const profile = useUserStore((s) => s.profile);

  React.useEffect(() => {
    // If user is already logged in but hasn't finished onboarding, skip welcome
    if (isAuthenticated && (!profile || !profile.onboarding_complete)) {
      navigation.navigate('Gender');
    }
  }, [isAuthenticated, profile]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Gender');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Image source={APP_ICON} style={styles.logoImage} />
            <Text style={styles.logo}>Roz</Text>
            <Text style={styles.tagline}>Precision Calorie Tracking</Text>
          </View>

          <View style={styles.heroContainer}>
            <View style={styles.heroCircle}>
              <Ionicons name="nutrition" size={120} color={colors.white} />
              <View style={[styles.microBadge, { top: -20, right: -20, backgroundColor: colors.accentGold }]}>
                <Ionicons name="star" size={24} color={colors.white} />
              </View>
              <View style={[styles.microBadge, { bottom: 20, left: -40, backgroundColor: colors.accentGreen }]}>
                <Ionicons name="leaf" size={24} color={colors.white} />
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.title}>Track what you eat.</Text>
            <Text style={styles.subtitle}>
              AI-powered calorie tracking that{'\n'}actually understands your food.
            </Text>

            <Button
              title="Get Started"
              onPress={handleStart}
              style={styles.mainButton}
            />

            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              style={styles.signInLink}
            >
              <Text style={styles.signInText}>Already have an account? <Text style={styles.signInHighlight}>Sign In</Text></Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 18,
    marginBottom: 16,
  },
  logo: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  heroCircle: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: colors.bgCardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  microBadge: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  footer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  mainButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
  },
  signInLink: {
    marginTop: 20,
  },
  signInText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  signInHighlight: {
    color: colors.white,
    fontWeight: '800',
  },
});
