import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import SelectionButton from '../../components/ui/SelectionButton';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';

const SOURCES = [
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook' },
  { key: 'tiktok', label: 'TikTok', icon: 'logo-tiktok' },
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube' },
  { key: 'google', label: 'Google', icon: 'logo-google' },
  { key: 'tv', label: 'TV', icon: 'tv-outline' },
];

export default function SourceScreen({ navigation }) {
  const updateOnboardingData = useUserStore((s) => s.updateOnboardingData);
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateOnboardingData({ source: selected });
    navigation.navigate('PreviousApps');
  };

  return (
    <OnboardingLayout
      title="How did you hear about us?"
      onBack={() => navigation.goBack()}
      progress={0.2}
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
        {SOURCES.map((s) => (
          <SelectionButton
            key={s.key}
            label={s.label}
            icon={s.icon}
            selected={selected === s.key}
            onPress={() => setSelected(s.key)}
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
