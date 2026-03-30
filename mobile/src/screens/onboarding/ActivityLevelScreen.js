import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import SelectionButton from '../../components/ui/SelectionButton';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';
import colors from '../../constants/colors';

const LEVELS = [
  { key: 'sedentary', label: '0-2', subtitle: 'Workouts now and then', icon: 'ellipse' },
  { key: 'lightly_active', label: '3-5', subtitle: 'A few workouts per week', icon: 'apps' },
  { key: 'moderately_active', label: '6+', subtitle: 'Dedicated athlete', icon: 'grid' },
];

export default function ActivityLevelScreen({ navigation }) {
  const updateOnboardingData = useUserStore((s) => s.updateOnboardingData);
  const onboardingData = useUserStore((s) => s.onboardingData);
  const [selected, setSelected] = useState(onboardingData.activity_level || null);

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateOnboardingData({ activity_level: selected });
    navigation.navigate('Source');
  };

  return (
    <OnboardingLayout
      title="What is your workout level?"
      subtitle="This helps us calculate your metabolism rate."
      onBack={() => navigation.goBack()}
      progress={0.15}
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
        {LEVELS.map((lvl) => (
          <SelectionButton
            key={lvl.key}
            label={lvl.label}
            subtitle={lvl.subtitle}
            icon={lvl.icon}
            selected={selected === lvl.key}
            onPress={() => setSelected(lvl.key)}
          />
        ))}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  cards: { marginTop: 24 },
  spacer: { flex: 1, minHeight: 40 },
  button: { marginBottom: 20, borderRadius: 100 },
});
