import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../constants/colors';

export default function MacroStackedBar({ protein = 0, carbs = 0, fat = 0 }) {
  const total = protein * 4 + carbs * 4 + fat * 9;
  if (total === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No macro data</Text>
      </View>
    );
  }

  const proteinPct = ((protein * 4) / total) * 100;
  const carbsPct = ((carbs * 4) / total) * 100;
  const fatPct = ((fat * 9) / total) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <View style={[styles.segment, { width: `${proteinPct}%`, backgroundColor: colors.proteinStroke }]} />
        <View style={[styles.segment, { width: `${carbsPct}%`, backgroundColor: colors.carbsStroke }]} />
        <View style={[styles.segment, { width: `${fatPct}%`, backgroundColor: colors.fatStroke }]} />
      </View>
      <View style={styles.legend}>
        <LegendItem color={colors.proteinStroke} label="Protein" value={`${Math.round(protein)}g`} pct={Math.round(proteinPct)} />
        <LegendItem color={colors.carbsStroke} label="Carbs" value={`${Math.round(carbs)}g`} pct={Math.round(carbsPct)} />
        <LegendItem color={colors.fatStroke} label="Fat" value={`${Math.round(fat)}g`} pct={Math.round(fatPct)} />
      </View>
    </View>
  );
}

function LegendItem({ color, label, value, pct }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value} ({pct}%)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
  },
  bar: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  segment: {
    height: '100%',
  },
  legend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  empty: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
  },
  emptyText: {
    color: colors.textTertiary,
  },
});
