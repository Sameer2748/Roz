import React from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '../../constants/colors';

export default function Card({ children, style, selected = false }) {
  return (
    <View style={[styles.card, selected && styles.selected, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
  },
  selected: {
    backgroundColor: colors.selected,
  },
});
