import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import colors from '../../constants/colors';

export default function RolloverScreen({ navigation }) {
  const handleAnswer = (val) => {
    Haptics.selectionAsync();
    navigation.navigate('Rating');
  };

  return (
    <OnboardingLayout
      title="Rollover extra calories to the next day?"
      onBack={() => navigation.goBack()}
      progress={0.93}
    >
      <View style={styles.center}>
        <View style={styles.card}>
           <View style={styles.dayBox}>
              <Text style={styles.dayLabel}>Yesterday</Text>
              <Text style={styles.dayVal}>350/500</Text>
              <View style={styles.rolloverTag}><Text style={styles.tagText}>Rollover up to 200 cals</Text></View>
           </View>
           <View style={styles.todayBox}>
              <Text style={styles.todayLabel}>Today</Text>
              <Text style={styles.todayVal}>350/650</Text>
           </View>
        </View>
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
  card: { direction: 'column', gap: 20, width: '100%', alignItems: 'center' },
  dayBox: { width: 180, height: 180, borderRadius: 24, padding: 20, backgroundColor: '#F9FAFB', alignItems: 'center', position: 'relative' },
  dayLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  dayVal: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  rolloverTag: { position: 'absolute', top: -10, alignSelf: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '700', color: colors.textTertiary },
  todayBox: { width: 220, height: 220, borderRadius: 32, padding: 24, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4 },
  todayLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
  todayVal: { fontSize: 40, fontWeight: '800', color: colors.textPrimary },
  footer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  halfBtn: { flex: 1, borderRadius: 100 },
});
