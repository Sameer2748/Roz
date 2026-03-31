import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import colors from '../../constants/colors';

// Using a placeholder for heart fingers image
const HERO_IMAGE = require('../../../assets/clapping_hands_onboarding.jpg'); 

export default function GeneratePlanScreen({ navigation }) {
  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PlanCreation');
  };

  return (
    <OnboardingLayout
      onBack={() => navigation.goBack()}
      progress={0.98}
      footer={
        <Button 
          title="Continue" 
          onPress={handleContinue} 
          style={styles.button}
        />
      }
    >
      <View style={styles.center}>
        <View style={styles.imageBox}>
          <Image source={HERO_IMAGE} style={styles.image} />
          <View style={styles.doneBadge}>
             <Text style={styles.doneText}>✓ All done!</Text>
          </View>
        </View>

        <Text style={styles.title}>Time to generate{"\n"}your custom plan!</Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', paddingTop: 60 },
  imageBox: { 
    width: 240, height: 240, borderRadius: 120, 
    backgroundColor: '#F9FAFB', 
    justifyContent: 'center', alignItems: 'center', 
    marginBottom: 60,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  image: { width: 140, height: 140 },
  doneBadge: { 
    position: 'absolute', 
    bottom: 20, 
    backgroundColor: '#FEF3C7', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  doneText: { fontSize: 13, fontWeight: '700', color: '#D97706' },
  title: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  button: { marginBottom: 20, borderRadius: 100 },
});
