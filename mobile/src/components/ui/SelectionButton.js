import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import colors from '../../constants/colors';

export default function SelectionButton({ 
  label, 
  subtitle,
  onPress, 
  selected = false, 
  icon, 
  style 
}) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress && onPress();
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        selected ? styles.selectedContainer : styles.unselectedContainer,
        !icon && { justifyContent: 'center' },
        style
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.left, !icon && { justifyContent: 'center', width: '100%' }]}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={24} 
            color={selected ? colors.black : colors.textPrimary} 
            style={styles.icon}
          />
        )}
        <View style={styles.textContainer}>
          <Text style={[
            styles.label, 
            selected ? styles.selectedLabel : styles.unselectedLabel,
            !icon && { textAlign: 'center' }
          ]}>
            {label}
          </Text>
          {typeof subtitle === 'string' && (
            <Text style={[
              styles.subtitle, 
              selected ? styles.selectedSubtitle : styles.unselectedSubtitle,
              !icon && { textAlign: 'center' }
            ]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {selected && icon && (
        <Ionicons name="checkmark-circle" size={24} color={colors.black} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 24, 
    borderWidth: 1.5,
    marginBottom: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unselectedContainer: {
    backgroundColor: colors.bgCardSecondary,
    borderColor: colors.borderGray,
  },
  selectedContainer: {
    backgroundColor: colors.ctaBackground,
    borderColor: colors.ctaBackground,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 16,
  },
  textContainer: {
    flexShrink: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  unselectedLabel: {
    color: colors.textPrimary,
  },
  selectedLabel: {
    color: colors.black,
  },
  unselectedSubtitle: {
    color: colors.textSecondary,
  },
  selectedSubtitle: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
});
