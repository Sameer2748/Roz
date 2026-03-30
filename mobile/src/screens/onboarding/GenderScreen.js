import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import SelectionButton from '../../components/ui/SelectionButton';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';
import colors from '../../constants/colors';

const GENDERS = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'other', label: 'Other' },
];

export default function GenderScreen({ navigation }) {
  const updateOnboardingData = useUserStore((s) => s.updateOnboardingData);
  const onboardingData = useUserStore((s) => s.onboardingData);
  const [selected, setSelected] = useState(onboardingData.gender || null);

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateOnboardingData({ gender: selected });
    navigation.navigate('ActivityLevel'); // Go to Workouts (ActivityLevel) next per design
  };

  const selectGender = (key) => {
    setSelected(key);
    // Optional: auto-advance after a short delay
    // setTimeout(handleContinue, 400); 
  };

  return (
    <OnboardingLayout
      title="What is your gender?"
      subtitle="This helps us calculate your metabolism rate."
      onBack={() => navigation.goBack()}
      progress={0.05}
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
        {GENDERS.map((g) => (
          <SelectionButton
            key={g.key}
            label={g.label}
            selected={selected === g.key}
            onPress={() => selectGender(g.key)}
          />
        ))}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  cards: {
    marginTop: 20,
  },
  spacer: {
    height: 40,
  },
  button: {
    marginTop: 20,
    borderRadius: 100,
  },
});
