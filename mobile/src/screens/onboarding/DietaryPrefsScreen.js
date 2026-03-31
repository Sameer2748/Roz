import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import SelectionButton from '../../components/ui/SelectionButton';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';

const DIETS = [
  { key: 'classic', label: 'Classic', icon: 'restaurant-outline' },
  { key: 'pescatarian', label: 'Pescatarian', icon: 'fish-outline' },
  { key: 'vegetarian', label: 'Vegetarian', icon: 'nutrition-outline' },
  { key: 'vegan', label: 'Vegan', icon: 'leaf-outline' },
];

export default function DietaryPrefsScreen({ navigation }) {
  const updateOnboardingData = useUserStore((s) => s.updateOnboardingData);
  const onboardingData = useUserStore((s) => s.onboardingData);
  const [selected, setSelected] = useState(onboardingData.dietary_preference || null);

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateOnboardingData({ dietary_preference: selected });
    navigation.navigate('Motivation');
  };

  return (
    <OnboardingLayout
      title="Do you follow a specific diet?"
      onBack={() => navigation.goBack()}
      progress={0.7}
    >
      <View style={styles.cards}>
        {DIETS.map((d) => (
          <SelectionButton
            key={d.key}
            label={d.label}
            icon={d.icon}
            selected={selected === d.key}
            onPress={() => setSelected(d.key)}
          />
        ))}
      </View>

      <View style={styles.spacer} />

      <Button 
        title="Continue" 
        onPress={handleContinue} 
        disabled={!selected}
        style={styles.button}
      />
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
