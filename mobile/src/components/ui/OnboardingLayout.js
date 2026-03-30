import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import colors from '../../constants/colors';

export default function OnboardingLayout({ 
  children, 
  title, 
  subtitle, 
  onBack, 
  progress = 0,
  showBack = true,
  scrollable = true,
  footer // New prop for the button
}) {
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack && onBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header (Fixed at the top) */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          {showBack ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.backButtonPlaceholder} />
        </View>
        
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      {/* 2. Content (Centered in the middle space) */}
      <View style={styles.mainContentContainer}>
        {scrollable ? (
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={styles.centeredContent}>
            {children}
          </View>
        )}
      </View>

      {/* 3. Footer (Fixed at the bottom) */}
      {footer && (
        <View style={styles.footer}>
          {footer}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center', alignItems: 'center',
  },
  backButtonPlaceholder: { width: 40 },
  progressBarContainer: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: colors.backgroundSecondary,
    marginHorizontal: 16, overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.ctaBackground,
    borderRadius: 3,
  },
  title: {
    fontSize: 28, fontWeight: '800', color: colors.textPrimary,
    letterSpacing: -0.5, textAlign: 'center', marginBottom: 8,
  },
  subtitle: {
    fontSize: 16, color: colors.textSecondary,
    lineHeight: 22, textAlign: 'center',
  },
  mainContentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    // alignItems: 'center', // REMOVED to avoid narrow touch targets
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 30, // Lifted from bottom
  },
});
