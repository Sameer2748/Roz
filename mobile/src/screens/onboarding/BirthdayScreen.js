import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import WheelPicker from '../../components/ui/WheelPicker';
import useUserStore from '../../store/userStore';
import colors from '../../constants/colors';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 81 }, (_, i) => currentYear - 10 - i).reverse(); // 1944 to 2014 or so

export default function BirthdayScreen({ navigation }) {
  const updateOnboardingData = useUserStore((s) => s.updateOnboardingData);
  const onboardingData = useUserStore((s) => s.onboardingData);

  const [monthIdx, setMonthIdx] = useState(0);
  const [dayIdx, setDayIdx] = useState(14); // 15th
  const [yearIdx, setYearIdx] = useState(YEARS.length - 20); // ~1995

  const daysInMonth = new Date(YEARS[yearIdx], monthIdx + 1, 0).getDate();
  const DAYS = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  // Adjust day if month change makes it invalid
  if (dayIdx >= DAYS.length) setDayIdx(DAYS.length - 1);

  const handleContinue = () => {
    const birthday = {
      month: monthIdx + 1,
      day: DAYS[dayIdx],
      year: YEARS[yearIdx]
    };
    const age = currentYear - birthday.year;
    
    updateOnboardingData({ birthday, age });
    navigation.navigate('Goal');
  };

  return (
    <OnboardingLayout
      title="When were you born?"
      subtitle="This will be used to calibrate your custom plan."
      onBack={() => navigation.goBack()}
      progress={0.35}
      scrollable={false}
      footer={
        <Button title="Continue" onPress={handleContinue} style={styles.button} />
      }
    >
      <View style={styles.pickersContainer}>
        <WheelPicker items={MONTHS} selectedIndex={monthIdx} onSelect={setMonthIdx} />
        <WheelPicker items={DAYS} selectedIndex={dayIdx} onSelect={setDayIdx} />
        <WheelPicker items={YEARS} selectedIndex={yearIdx} onSelect={setYearIdx} />
      </View>

      <View style={styles.summary}>
        <Text style={styles.ageLabel}>You are</Text>
        <Text style={styles.ageValue}>{currentYear - YEARS[yearIdx]} years old</Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  pickersContainer: {
    flexDirection: 'row',
    height: 260,
    marginTop: 20,
    gap: 8,
  },
  summary: {
    alignItems: 'center',
    marginTop: 40,
  },
  ageLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  ageValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  spacer: {
    flex: 1,
  },
  button: {
    marginBottom: 20,
    borderRadius: 100,
  },
});
