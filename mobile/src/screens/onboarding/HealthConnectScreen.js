import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import colors from '../../constants/colors';

const CLAPPING_HANDS = require('../../../assets/clapping_hands_onboarding.jpg');

export default function HealthConnectScreen({ navigation }) {
  const [stage, setStage] = useState('thank_you'); // 'thank_you' or 'sync'

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (stage === 'thank_you') {
      setStage('sync');
    } else {
      navigation.navigate('BurnedBack');
    }
  };

  if (stage === 'thank_you') {
    return (
      <OnboardingLayout
        onBack={() => navigation.goBack()}
        progress={0.85}
      >
        <View style={styles.center}>
          <Image source={CLAPPING_HANDS} style={styles.heroImage} />
          
          <Text style={styles.title}>Thank you for trusting us</Text>
          <Text style={styles.subtitle}>Now let's personalize Roz for you...</Text>
          
          <View style={styles.privacyBox}>
            <Text style={styles.privacyText}>
              <Ionicons name="shield-checkmark" size={14} color={colors.accentGold} /> Your privacy and security matter to us.
            </Text>
            <Text style={styles.privacySubtext}>
              We promise to always keep your personal information private and secure.
            </Text>
          </View>
        </View>

        <View style={styles.spacer} />

        <Button 
          title="Continue" 
          onPress={handleContinue} 
          style={styles.button}
        />
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout
      onBack={() => setStage('thank_you')}
      progress={0.9}
    >
      <View style={styles.center}>
        <View style={styles.syncVisual}>
          <View style={styles.syncCircle}>
             <Ionicons name="logo-apple" size={32} color={colors.white} />
          </View>
          <View style={styles.syncArrow}>
             <Ionicons name="sync" size={24} color={colors.textSecondary} />
          </View>
          <View style={styles.syncCircle}>
             <View style={styles.appIconPlaceholder}>
                <View style={[styles.appIn, { backgroundColor: colors.white }]} />
             </View>
          </View>
        </View>

        <Text style={styles.title}>Connect to{"\n"}Apple Health</Text>
        <Text style={styles.subtitle}>
          Sync your daily activity between Roz and the Health app to have the most thorough data.
        </Text>
      </View>

      <View style={styles.spacer} />

      <Button 
        title="Continue" 
        onPress={handleContinue} 
        style={styles.button}
      />
      <TouchableOpacity 
        style={styles.laterBtn}
        onPress={() => navigation.navigate('BurnedBack')}
      >
        <Text style={styles.laterText}>Not now</Text>
      </TouchableOpacity>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', paddingTop: 60 },
  heroImage: { width: 200, height: 200, borderRadius: 100, marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40, fontWeight: '500' },
  privacyBox: {
    backgroundColor: colors.bgCardSecondary,
    borderRadius: 24,
    padding: 24,
    marginTop: 60,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  privacyText: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  privacySubtext: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, fontWeight: '500' },
  syncVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 60,
  },
  syncCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.bgCardSecondary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.borderGray,
  },
  appIn: { width: 40, height: 40, borderRadius: 10 },
  spacer: { flex: 1 },
  button: { marginBottom: 12, borderRadius: 100, height: 60 },
  laterBtn: { paddingVertical: 12, alignItems: 'center' },
  laterText: { fontSize: 16, fontWeight: '700', color: colors.textSecondary },
});
