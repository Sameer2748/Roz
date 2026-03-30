import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import colors from '../../constants/colors';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
} from 'react-native-reanimated';

export default function UnitToggle({ units, activeUnit, onUnitChange, type = 'buttons' }) {
  const isFirst = activeUnit === units[0];

  const handleToggle = () => {
    const next = isFirst ? units[1] : units[0];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUnitChange(next);
  };

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(isFirst ? 2 : 22, { damping: 15, stiffness: 120 }) }],
  }));

  if (type === 'switch') {
    return (
      <TouchableOpacity 
        style={styles.switchContainer} 
        onPress={handleToggle}
        activeOpacity={1}
      >
        <View style={styles.switchTrack}>
          <Animated.View style={[styles.switchThumb, thumbStyle]} />
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
    backgroundColor: colors.bgCardSecondary,
    borderRadius: 14,
    padding: 4,
    width: 160,
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeButton: {
    backgroundColor: colors.white,
  },
  unitText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  activeText: { color: colors.black },
  switchContainer: {
    width: 52,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgCardSecondary,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderGray,
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
