import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Button from '../../components/ui/Button';
import colors from '../../constants/colors';
import useAuthStore from '../../store/authStore';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const setUser = useAuthStore((s) => s.setUser);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Gender');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="sparkles" size={24} color={colors.white} />
            </View>
            <Text style={styles.logo}>Roz</Text>
            <Text style={styles.tagline}>Precision Calorie Tracking</Text>
          </View>

          <View style={styles.heroContainer}>
            <View style={styles.heroCircle}>
              <Ionicons name="nutrition" size={120} color={colors.ctaBackground} />
              <View style={[styles.microBadge, { top: -20, right: -20, backgroundColor: '#FFD700' }]}>
                <Ionicons name="star" size={24} color={colors.white} />
              </View>
              <View style={[styles.microBadge, { bottom: 20, left: -40, backgroundColor: '#4CD964' }]}>
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
    backgroundColor: colors.background,
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
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.ctaBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.ctaBackground,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: colors.backgroundSecondary,
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
    fontWeight: '700',
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
  },
  mainButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 100,
  },
  signInLink: {
    marginTop: 20,
  },
  signInText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signInHighlight: {
    color: colors.ctaBackground,
    fontWeight: '700',
  },
});
