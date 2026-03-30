import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import colors from '../../constants/colors';

export default function ReferralCodeScreen({ navigation }) {
  const [code, setCode] = useState('');

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('GeneratePlan');
  };

  return (
    <OnboardingLayout
      title="Do you have a referral code?"
      onBack={() => navigation.goBack()}
      progress={0.97}
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
          placeholderTextColor="#9CA3AF"
          autoCapitalize="characters"
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', paddingTop: 60 },
  subtext: { fontSize: 16, color: colors.textSecondary, marginBottom: 40, width: '100%' },
  input: { 
    width: '100%', 
    height: 60, 
    backgroundColor: '#F9FAFB', 
    borderRadius: 16, 
    paddingHorizontal: 20, 
    fontSize: 16, 
    fontWeight: '600',
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: '#F3F4F6'
  },
  button: { marginBottom: 20, borderRadius: 100 },
});
