import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  useDerivedValue
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import useUserStore from '../../store/userStore';
import api from '../../services/api';
import colors from '../../constants/colors';

const CHECKLIST = [
  { key: 'calories', label: 'Calories' },
  { key: 'carbs', label: 'Carbs' },
  { key: 'protein', label: 'Protein' },
  { key: 'fats', label: 'Fats' },
  { key: 'health', label: 'Health Score' },
];

export default function PlanCreationScreen({ navigation }) {
  const { onboardingData, setDailyTarget } = useUserStore();
  const [percent, setPercent] = useState(0);
  const [completedIndex, setCompletedIndex] = useState(-1);
  const progressPercent = useSharedValue(0);

  useDerivedValue(() => {
    runOnJS(setPercent)(Math.round(progressPercent.value));
    runOnJS(setCompletedIndex)(Math.floor(progressPercent.value / (100 / CHECKLIST.length)));
  });

  useEffect(() => {
    const generatePlan = async () => {
      try {
        const response = await api.post('/users/calculate-plan', {
          age: onboardingData.age || 25,
          gender: onboardingData.gender || 'male',
          height_cm: onboardingData.height_cm || 180,
          weight_kg: onboardingData.weight_kg || 75,
          activity_level: onboardingData.activity_level || 'moderately_active',
          goal: onboardingData.goal || 'fat_loss',
          pace: onboardingData.pace || 1.0,
          dietary_preference: onboardingData.dietary_preference || 'none',
        });

        if (response.data.success) {
          setDailyTarget(response.data.data.plan);
        }
      } catch (error) {
        console.error('Plan Preview generation failed:', error);
      }
    };

    generatePlan();

    progressPercent.value = withTiming(100, { duration: 6000 }, (finished) => {
      if (finished) {
        runOnJS(navigation.navigate)('PlanReady');
      }
    });

    const interval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressPercent.value}%`,
  }));

  return (
    <OnboardingLayout
      showBack={false}
      progress={0.99}
    >
      <View style={styles.center}>
        <Text style={styles.logoText}>{percent}%</Text>
        <Text style={styles.mainTitle}>We're setting{"\n"}everything up for you</Text>

        <View style={styles.progressBarWrapper}>
          <Animated.View style={[styles.progressBarFill, progressBarStyle]} />
        </View>
        <Text style={styles.finalizingText}>Finalizing results...</Text>

        <View style={styles.checklistCard}>
          <Text style={styles.cardHeader}>Daily recommendation for</Text>
          <View style={styles.list}>
            {CHECKLIST.map((item, i) => {
              const isDone = completedIndex >= i || percent === 100;
              return (
                <View key={item.key} style={styles.checkItem}>
                  <Text style={styles.itemBullet}>• {item.label}</Text>
                  <View style={[styles.iconBox, isDone && styles.doneIconBox]}>
                    {isDone && <Ionicons name="checkmark-circle" size={18} color="#FFF" />}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', paddingTop: 40 },
  logoText: { fontSize: 64, fontWeight: '900', color: colors.textPrimary, marginBottom: 12 },
  mainTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', lineHeight: 32, marginBottom: 40 },
  progressBarWrapper: { width: '100%', height: 12, backgroundColor: colors.bgCardSecondary, borderRadius: 6, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: colors.borderGray },
  progressBarFill: { height: '100%', backgroundColor: colors.white, borderRadius: 6 },
  finalizingText: { fontSize: 13, color: colors.textSecondary, marginBottom: 40, fontWeight: '600' },
  checklistCard: { backgroundColor: colors.bgCardSecondary, borderRadius: 32, padding: 24, width: '100%', borderWidth: 1, borderColor: colors.borderGray },
  cardHeader: { color: colors.textSecondary, fontSize: 13, marginBottom: 16, fontWeight: '700' },
  list: { gap: 14 },
  checkItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemBullet: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  iconBox: { width: 22, height: 22 },
  doneIconBox: {},
});
