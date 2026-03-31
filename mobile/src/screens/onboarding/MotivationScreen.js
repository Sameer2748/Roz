import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import SelectionButton from '../../components/ui/SelectionButton';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';

const MOTIVATIONS = [
  { key: 'health', label: 'Eat and live healthier', icon: 'nutrition-outline' },
  { key: 'energy', label: 'Boost my energy and mood', icon: 'sunny-outline' },
  { key: 'motivated', label: 'Stay motivated and consistent', icon: 'fitness-outline' },
  { key: 'body', label: 'Feel better about my body', icon: 'body-outline' },
];

export default function MotivationScreen({ navigation }) {
  const updateOnboardingData = useUserStore((s) => s.updateOnboardingData);
  const [selected, setSelected] = useState([]);

  const toggleMotivation = (key) => {
    if (selected.includes(key)) {
      setSelected(selected.filter(k => k !== key));
    } else {
      setSelected([...selected, key]);
    }
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateOnboardingData({ motivation: selected });
    navigation.navigate('GreatPotential');
  };

  return (
    <OnboardingLayout
      title="What would you like to accomplish?"
      onBack={() => navigation.goBack()}
      progress={0.75}
      footer={
        <Button 
          title="Continue" 
          onPress={handleContinue} 
          disabled={selected.length === 0}
          style={styles.button}
        />
      }
    >
      <View style={styles.cards}>
        {MOTIVATIONS.map((m) => (
          <SelectionButton
            key={m.key}
            label={m.label}
            icon={m.icon}
            selected={selected.includes(m.key)}
            onPress={() => toggleMotivation(m.key)}
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
