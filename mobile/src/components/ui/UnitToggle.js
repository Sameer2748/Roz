import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import colors from '../../constants/colors';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';

export default function UnitToggle({ units, activeUnit, onUnitChange, type = 'buttons' }) {
  const isFirst = activeUnit === units[0];

  const handleToggle = () => {
    const next = isFirst ? units[1] : units[0];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUnitChange(next);
  };

  if (type === 'switch') {
    return (
      <TouchableOpacity 
        style={styles.switchContainer} 
        onPress={handleToggle}
        activeOpacity={1}
      >
        <View style={styles.switchTrack}>
          <View style={[styles.switchThumb, { transform: [{ translateX: isFirst ? 0 : 20 }] }]} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {units.map((unit) => (
        <TouchableOpacity
          key={unit}
          style={[
            styles.unitButton,
            activeUnit === unit && styles.activeButton,
          ]}
          onPress={() => onUnitChange(unit)}
          activeOpacity={0.8}
        >
          <Text style={[styles.unitText, activeUnit === unit && styles.activeText]}>
            {unit}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    width: 140,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  unitText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  activeText: { color: colors.textPrimary },
  switchContainer: {
    width: 44,
    height: 24,
    justifyContent: 'center',
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    padding: 2,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1,
  },
});
