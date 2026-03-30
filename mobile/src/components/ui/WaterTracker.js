import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';

export default function WaterTracker({ current = 0, target = 2000, onAdd }) {
  const drops = 8;
  const perDrop = target / drops;
  const filledDrops = Math.min(Math.floor(current / perDrop), drops);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Water</Text>
        <Text style={styles.value}>{current} / {target} ml</Text>
      </View>
      <View style={styles.dropsRow}>
        {Array.from({ length: drops }).map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onAdd?.(perDrop)}
            style={styles.dropButton}
          >
            <Ionicons
              name="water"
              size={28}
              color={i < filledDrops ? '#4A90E2' : '#E0E0E0'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  value: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dropsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dropButton: {
    padding: 4,
  },
});
