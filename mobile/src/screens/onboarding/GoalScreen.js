import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import SelectionButton from '../../components/ui/SelectionButton';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';

const GOALS = [
  { key: 'fat_loss', label: 'Lose weight' },
  { key: 'maintenance', label: 'Maintain' },
  { key: 'muscle_gain', label: 'Gain weight' },
];

export default function GoalScreen({ navigation }) {
  const updateOnboardingData = useUserStore((s) => s.updateOnboardingData);
  const onboardingData = useUserStore((s) => s.onboardingData);
  const [selected, setSelected] = useState(onboardingData.goal || null);

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateOnboardingData({ goal: selected });
    navigation.navigate('DesiredWeight');
  };

  return (
    <OnboardingLayout
      title="What is your goal?"
      subtitle="This helps us generate a plan for your calorie intake."
      onBack={() => navigation.goBack()}
      progress={0.4}
      footer={
        <Button 
          title="Continue" 
          onPress={handleContinue} 
          disabled={!selected}
          style={styles.button}
        />
      }
    >
      <View style={styles.cards}>
        {GOALS.map((g) => (
          <SelectionButton
            key={g.key}
            label={g.label}
            selected={selected === g.key}
            onPress={() => setSelected(g.key)}
          />
        ))}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  cards: {
    marginTop: 20,
    gap: 12,
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  button: {
    marginTop: 20,
    borderRadius: 100,
  },
});
