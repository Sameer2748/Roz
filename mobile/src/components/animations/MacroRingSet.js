import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ProgressRing from '../ui/ProgressRing';
import colors from '../../constants/colors';

function MacroRingCard({ label, value, target, unit, strokeColor, trackColor, icon }) {
  const progress = target > 0 ? value / target : 0;

  return (
    <View style={styles.card}>
      <ProgressRing
        size={80}
        strokeWidth={6}
        progress={progress}
        strokeColor={strokeColor}
        trackColor={trackColor}
      >
        <Text style={styles.ringValue}>{Math.round(value)}</Text>
        <Text style={styles.ringUnit}>{unit}</Text>
      </ProgressRing>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

export default function MacroRingSet({ calories, caloriesTarget, protein, proteinTarget, carbs, carbsTarget, fat, fatTarget }) {
  return (
    <View style={styles.grid}>
      <MacroRingCard
        label="Calories"
        value={calories}
        target={caloriesTarget}
        unit="kcal"
        strokeColor={colors.caloriesStroke}
        trackColor={colors.caloriesTrack}
      />
      <MacroRingCard
        label="Carbs"
        value={carbs}
        target={carbsTarget}
        unit="g"
        strokeColor={colors.carbsStroke}
        trackColor={colors.carbsTrack}
      />
      <MacroRingCard
        label="Protein"
        value={protein}
        target={proteinTarget}
        unit="g"
        strokeColor={colors.proteinStroke}
        trackColor={colors.proteinTrack}
      />
      <MacroRingCard
        label="Fat"
        value={fat}
        target={fatTarget}
        unit="g"
        strokeColor={colors.fatStroke}
        trackColor={colors.fatTrack}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  ringValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  ringUnit: {
    fontSize: 10,
    color: '#999999',
  },
  cardLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
});
