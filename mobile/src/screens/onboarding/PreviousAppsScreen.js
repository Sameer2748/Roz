import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import SelectionButton from '../../components/ui/SelectionButton';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';

const OPTIONS = [
  { key: 'no', label: 'No', icon: 'thumbs-down' },
  { key: 'yes', label: 'Yes', icon: 'thumbs-up' },
];

export default function PreviousAppsScreen({ navigation }) {
  const updateOnboardingData = useUserStore((s) => s.updateOnboardingData);
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateOnboardingData({ used_previous_apps: selected === 'yes' });
    navigation.navigate('ProgressGraph');
  };

  return (
    <OnboardingLayout
      title="Have you tried other calorie tracking apps?"
      onBack={() => navigation.goBack()}
      progress={0.2}
    >
      <View style={styles.cards}>
        {OPTIONS.map((o) => (
          <SelectionButton
            key={o.key}
            label={o.label}
            icon={o.icon}
            selected={selected === o.key}
            onPress={() => setSelected(o.key)}
          />
        ))}
      </View>

      <View style={styles.spacer} />

      <Button title="Continue" onPress={handleContinue} disabled={!selected} style={styles.button} />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  cards: { marginTop: 40 },
  spacer: { flex: 1, minHeight: 40 },
  button: { marginBottom: 20, borderRadius: 100 },
});
