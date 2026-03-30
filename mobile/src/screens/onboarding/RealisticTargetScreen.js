import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';
import colors from '../../constants/colors';

export default function RealisticTargetScreen({ navigation }) {
  const { onboardingData } = useUserStore();
  const unit = onboardingData.unit_preference === 'metric' ? 'kg' : 'lbs';
  
  // Calculate diff (already in memory or based on current/target weight)
  const currentWeightMetric = onboardingData.weight_kg || 70;
  const targetWeightMetric = onboardingData.target_weight_kg || 75;
  
  const currentWeight = unit === 'lbs' ? Math.round(currentWeightMetric * 2.20462) : currentWeightMetric;
  const targetWeight = unit === 'lbs' ? Math.round(targetWeightMetric * 2.20462) : targetWeightMetric;
  const diff = Math.abs(targetWeight - currentWeight);
  const action = targetWeight > currentWeight ? 'Gaining' : 'Losing';

  return (
    <OnboardingLayout
      onBack={() => navigation.goBack()}
      progress={0.5}
    >
      <View style={styles.center}>
        <Text style={styles.title}>
          {action} <Text style={styles.highlight}>{diff} {unit}</Text> is a realistic target. It's not hard at all!
        </Text>
        
        <Text style={styles.subtext}>
          90% of users say that the change is obvious after using Roz and it is not easy to rebound.
        </Text>
      </View>

      <View style={styles.spacer} />

      <Button 
        title="Continue" 
        onPress={() => navigation.navigate('Speed')} 
        style={styles.button}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 24,
  },
  highlight: {
    color: '#D97706', // Orange-ish
  },
  subtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  spacer: {
    flex: 1,
  },
  button: {
    marginBottom: 20,
    borderRadius: 100,
  },
});
