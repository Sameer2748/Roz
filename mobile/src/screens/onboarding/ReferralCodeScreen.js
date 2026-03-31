import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';
import colors from '../../constants/colors';

export default function ReferralCodeScreen({ navigation }) {
  const updateOnboardingData = useUserStore((s) => s.updateOnboardingData);
  const [code, setCode] = useState('');

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateOnboardingData({ referral_code: code.trim() });
    navigation.navigate('GeneratePlan');
  };

  return (
    <OnboardingLayout
      title="Do you have a referral code?"
      onBack={() => navigation.goBack()}
      progress={0.9}
      footer={
        <Button 
          title="Continue" 
          onPress={handleContinue} 
          style={styles.button}
        />
      }
    >
      <View style={styles.center}>
        <Text style={styles.subtext}>You can skip this step.</Text>
        
        <TextInput 
          style={styles.input}
          placeholder="Referral Code"
          value={code}
          onChangeText={setCode}
          placeholderTextColor="#666"
          autoCapitalize="characters"
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', paddingTop: 60 },
  subtext: { fontSize: 16, color: colors.textSecondary, marginBottom: 40, width: '100%', fontWeight: '500' },
  input: { 
    width: '100%', 
    height: 64, 
    backgroundColor: colors.bgCardSecondary, 
    borderRadius: 20, 
    paddingHorizontal: 20, 
    fontSize: 18, 
    fontWeight: '800',
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.borderGray,
  },
  button: { marginBottom: 20, borderRadius: 100, height: 60 },
});
