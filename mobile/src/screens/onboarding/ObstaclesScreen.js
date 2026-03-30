import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import SelectionButton from '../../components/ui/SelectionButton';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';
import colors from '../../constants/colors';

const OBSTACLES = [
  { key: 'consistency', label: 'Lack of consistency', icon: 'analytics-outline' },
  { key: 'habits', label: 'Unhealthy eating habits', icon: 'fast-food-outline' },
  { key: 'support', label: 'Lack of support', icon: 'hand-right-outline' },
  { key: 'schedule', label: 'Busy schedule', icon: 'calendar-outline' },
  { key: 'inspiration', label: 'Lack of meal inspiration', icon: 'nutrition-outline' },
];

export default function ObstaclesScreen({ navigation }) {
  const updateOnboardingData = useUserStore((s) => s.updateOnboardingData);
  const [selected, setSelected] = useState([]);

  const toggleObstacle = (key) => {
    if (selected.includes(key)) {
      setSelected(selected.filter(k => k !== key));
    } else {
      setSelected([...selected, key]);
    }
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateOnboardingData({ obstacles: selected });
    navigation.navigate('DietaryPrefs');
  };

  return (
    <OnboardingLayout
      title="What's stopping you?"
      onBack={() => navigation.goBack()}
      progress={0.8}
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
        {OBSTACLES.map((o) => (
          <SelectionButton
            key={o.key}
            label={o.label}
            icon={o.icon}
            selected={selected.includes(o.key)}
            onPress={() => toggleObstacle(o.key)}
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
  button: {
    marginBottom: 20,
    borderRadius: 100,
    height: 60,
  },
});
