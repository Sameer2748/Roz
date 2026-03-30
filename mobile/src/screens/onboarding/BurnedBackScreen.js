import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import colors from '../../constants/colors';

export default function BurnedBackScreen({ navigation }) {
  const handleAnswer = (val) => {
    Haptics.selectionAsync();
    navigation.navigate('Rollover');
  };

  return (
    <OnboardingLayout
      title="Add calories burned back to your daily goal?"
      onBack={() => navigation.goBack()}
      progress={0.91}
    >
      <View style={styles.center}>
        <View style={styles.card}>
           <View style={styles.todayBox}>
              <Text style={styles.todayLabel}>Today's Goal</Text>
              <Text style={styles.todayVal}>🔥 500 Cals</Text>
           </View>
           <View style={styles.burnedBox}>
              <Text style={styles.burnedLabel}>Running</Text>
              <Text style={styles.burnedVal}>+100 cals</Text>
           </View>
        </View>
        <Text style={styles.subtext}>You can change this in settings anytime.</Text>
      </View>

      <View style={styles.footer}>
        <Button 
          title="No" 
          onPress={() => handleAnswer(false)} 
          variant="secondary"
          style={styles.halfBtn}
        />
        <Button 
          title="Yes" 
          onPress={() => handleAnswer(true)} 
          style={styles.halfBtn}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', paddingTop: 60 },
  card: { 
    width: '100%', 
    padding: 24, 
    borderRadius: 24, 
    backgroundColor: '#F9FAFB', 
    gap: 16,
    marginBottom: 20
  },
  todayBox: { padding: 20, backgroundColor: '#FFF', borderRadius: 16, alignItems: 'center' },
  todayLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  todayVal: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  burnedBox: { 
    padding: 20, 
    backgroundColor: '#000', 
    borderRadius: 16, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  burnedLabel: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  burnedVal: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  subtext: { fontSize: 13, color: colors.textTertiary, textAlign: 'center' },
  footer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  halfBtn: { flex: 1, borderRadius: 100 },
});
