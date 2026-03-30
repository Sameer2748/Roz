import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';
import colors from '../../constants/colors';

export default function PlanReadyScreen({ navigation }) {
  const { onboardingData, dailyTarget } = useUserStore();

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('Login');
  };

  const plan = dailyTarget || {
    calories: 2465,
    protein_g: 166,
    carbs_g: 295,
    fat_g: 68
  };

  const targetWeightText = onboardingData.goal === 'muscle_gain' ? 'gain' : 'lose';
  const weightDiff = Math.abs((onboardingData.target_weight_kg || 75) - (onboardingData.weight_kg || 70)).toFixed(0);

  return (
    <OnboardingLayout
      showBack={true}
      onBack={() => navigation.goBack()}
      progress={1.0}
      footer={
        <Button
          title="Let's get started!"
          onPress={handleContinue}
          style={styles.button}
        />
      }
    >
      <View style={styles.center}>
        <View style={styles.checkIcon}>
          <Ionicons name="checkmark-circle" size={48} color={colors.white} />
        </View>

        <Text style={styles.title}>Congratulations{"\n"}your custom plan is ready!</Text>

        <Text style={styles.goalLabel}>You should {targetWeightText}:</Text>
        <View style={styles.goalBadge}>
          <Text style={styles.goalText}>{weightDiff} kg by September 28</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily recommendation</Text>
          <Text style={styles.cardSubtitle}>You can edit this anytime</Text>

          <View style={styles.grid}>
            <NutrientCard label="Calories" value={plan.calories} unit="" icon="flame" color={colors.accentOrange} />
            <NutrientCard label="Carbs" value={plan.carbs_g} unit="g" icon="leaf" color={colors.accentGreen} />
            <NutrientCard label="Protein" value={plan.protein_g} unit="g" icon="barbell" color={colors.accentPink} />
            <NutrientCard label="Fats" value={plan.fat_g} unit="g" icon="water" color={colors.accentPurple} />
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
}

function NutrientCard({ label, value, unit, icon, color }) {
  return (
    <View style={styles.nCard}>
      <View style={styles.nHeader}>
        <Ionicons name={icon} size={14} color={color} />
        <Text style={styles.nLabel}>{label}</Text>
      </View>
      <Text style={styles.nValue}>{value}<Text style={styles.nUnit}>{unit}</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', paddingTop: 20 },
  checkIcon: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', lineHeight: 32, marginBottom: 20 },
  goalLabel: { fontSize: 16, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  goalBadge: { backgroundColor: colors.bgCardSecondary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginBottom: 30, borderWidth: 1, borderColor: colors.borderGray },
  goalText: { fontSize: 15, fontWeight: '800', color: colors.white },
  card: { backgroundColor: colors.bgCardSecondary, borderRadius: 32, padding: 24, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: colors.borderGray },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 20, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  nCard: { width: '47%', backgroundColor: colors.bgBase, borderRadius: 20, padding: 16, gap: 8, borderWidth: 1, borderColor: colors.borderGray },
  nHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  nValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  nUnit: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  button: { marginBottom: 20, borderRadius: 100, height: 60 },
});
