import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';
import colors from '../../constants/colors';

export default function PlanReadyScreen({ navigation }) {
  const { onboardingData, dailyTarget, setProfile } = useUserStore();

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
    >
      <View style={styles.center}>
        <View style={styles.checkIcon}>
          <Ionicons name="checkmark-circle" size={32} color="#000" />
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
            <NutrientCard label="Calories" value={plan.calories} unit="" icon="flame" color="#F87171" progress={0.7} />
            <NutrientCard label="Carbs" value={plan.carbs_g} unit="g" icon="leaf" color="#FACC15" progress={0.65} />
            <NutrientCard label="Protein" value={plan.protein_g} unit="g" icon="meat" color="#EB5757" progress={0.8} />
            <NutrientCard label="Fats" value={plan.fat_g} unit="g" icon="water" color="#60A5FA" progress={0.5} />
          </View>
        </View>
      </View>

      <Button 
        title="Let's get started!" 
        onPress={handleContinue} 
        style={styles.button}
      />
    </OnboardingLayout>
  );
}

function NutrientCard({ label, value, unit, icon, color, progress }) {
  return (
    <View style={styles.nCard}>
       <View style={styles.nHeader}>
          <Ionicons name={icon} size={14} color={color} />
          <Text style={styles.nLabel}>{label}</Text>
       </View>
       <View style={styles.nCircleContainer}>
          <View style={[styles.nCircle, { borderColor: '#F3F4F6' }]} />
          {/* Simple semi-circle progress representation */}
          <Text style={styles.nValue}>{value}<Text style={styles.nUnit}>{unit}</Text></Text>
          <Ionicons name="pencil" size={10} color="#000" style={styles.editIcon} />
       </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', paddingTop: 20 },
  checkIcon: { marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', lineHeight: 32, marginBottom: 20 },
  goalLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  goalBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: 30 },
  goalText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  card: { backgroundColor: '#F9FAFB', borderRadius: 24, padding: 20, width: '100%', marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: colors.textTertiary, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  nCard: { width: '48%', backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 12 },
  nHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  nCircleContainer: { height: 70, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  nValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  nUnit: { fontSize: 12, fontWeight: '600' },
  editIcon: { position: 'absolute', bottom: 0, right: 0 },
  button: { marginBottom: 20, borderRadius: 100 },
});
