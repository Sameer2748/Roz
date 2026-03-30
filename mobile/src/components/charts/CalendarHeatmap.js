import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../constants/colors';

export default function CalendarHeatmap({ data = {}, days = 30 }) {
  const today = new Date();
  const cells = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const count = data[key] || 0;
    cells.push({ date: key, count });
  }

  const getColor = (count) => {
    if (count === 0) return '#F0F0F0';
    if (count <= 2) return '#C8C8C8';
    if (count <= 4) return '#888888';
    return '#1C1C1C';
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {cells.map((cell) => (
          <View
            key={cell.date}
            style={[styles.cell, { backgroundColor: getColor(cell.count) }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  cell: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
});
