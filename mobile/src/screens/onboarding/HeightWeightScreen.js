import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate, 
  interpolateColor,
  Extrapolate,
  runOnJS,
  useAnimatedRef,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import UnitToggle from '../../components/ui/UnitToggle';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';
import colors from '../../constants/colors';

import WheelPicker from '../../components/ui/WheelPicker';

const CM_HEIGHTS = Array.from({ length: 101 }, (_, i) => 120 + i); // 120-220 cm
const KG_WEIGHTS = Array.from({ length: 221 }, (_, i) => 30 + i); // 30-250 kg

const FT_IN_HEIGHTS = Array.from({ length: 37 }, (_, i) => {
  const totalInches = 48 + i; // Start from 4'0"
  const ft = Math.floor(totalInches / 12);
  const inc = totalInches % 12;
  return { label: `${ft}' ${inc}"`, totalInches };
});

const LB_WEIGHTS = Array.from({ length: 441 }, (_, i) => 60 + i); // 60-500 lbs

const FT_VALUES = Array.from({ length: 9 }, (_, i) => i + 1); // 1-9 ft
const IN_VALUES = Array.from({ length: 12 }, (_, i) => i); // 0-11 in

export default function HeightWeightScreen({ navigation }) {
  const updateOnboardingData = useUserStore((s) => s.updateOnboardingData);
  const [unit, setUnit] = useState('Imperial'); // Imperial by default per image

  // Imperial (ft, in, lbs)
  const [ft, setFt] = useState(4); // 5ft (index 4)
  const [inc, setInc] = useState(9); // 9in
  const [lbs, setLbs] = useState(95); // 155lb (index 95 if LB_WEIGHTS starts at 60)

  // Metric (cm, kg)
  const [cmIdx, setCmIdx] = useState(50); // 170cm
  const [kgIdx, setKgIdx] = useState(40); // 70kg

  const handleContinue = () => {
    let finalHeight, finalWeight;
    if (unit === 'Metric') {
      finalHeight = CM_HEIGHTS[cmIdx];
      finalWeight = KG_WEIGHTS[kgIdx];
    } else {
      const totalInches = (ft + 1) * 12 + inc;
      finalHeight = Math.round(totalInches * 2.54);
      finalWeight = Math.round(LB_WEIGHTS[lbs] * 0.453592);
    }
    
    updateOnboardingData({ height_cm: finalHeight, weight_kg: finalWeight, unit_preference: unit.toLowerCase() });
    navigation.navigate('Birthday');
  };

  return (
    <OnboardingLayout
      title="Height & weight"
      subtitle="This will be used to calibrate your custom plan."
      onBack={() => navigation.goBack()}
      progress={0.3}
      scrollable={false}
      footer={
        <Button title="Continue" onPress={handleContinue} style={styles.button} />
      }
    >
      <View style={styles.toggleRow}>
        <Text style={[styles.toggleText, unit === 'Imperial' && styles.activeToggle]}>Imperial</Text>
        <UnitToggle 
          units={['Imperial', 'Metric']} 
          activeUnit={unit} 
          onUnitChange={setUnit} 
          type="switch"
        />
        <Text style={[styles.toggleText, unit === 'Metric' && styles.activeToggle]}>Metric</Text>
      </View>

      <View style={styles.pickersContainer}>
        {/* Height Column */}
        <View style={styles.column}>
          <Text style={styles.columnLabel}>Height</Text>
          <View style={styles.pickerRow}>
            {unit === 'Imperial' ? (
              <>
                <WheelPicker
                  items={FT_VALUES}
                  selectedIndex={ft}
                  onSelect={setFt}
                  suffix=" ft"
                  style={styles.smallWheel}
                />
                <WheelPicker
                  items={IN_VALUES}
                  selectedIndex={inc}
                  onSelect={setInc}
                  suffix=" in"
                  style={styles.smallWheel}
                />
              </>
            ) : (
              <WheelPicker
                items={CM_HEIGHTS}
                selectedIndex={cmIdx}
                onSelect={setCmIdx}
                suffix=" cm"
                style={styles.largeWheel}
              />
            )}
          </View>
        </View>

        {/* Weight Column */}
        <View style={styles.column}>
          <Text style={styles.columnLabel}>Weight</Text>
          <View style={styles.pickerRow}>
            <WheelPicker
              items={unit === 'Imperial' ? LB_WEIGHTS : KG_WEIGHTS}
              selectedIndex={unit === 'Imperial' ? lbs : kgIdx}
              onSelect={unit === 'Imperial' ? setLbs : setKgIdx}
              suffix={unit === 'Imperial' ? ' lb' : ' kg'}
              style={styles.largeWheel}
            />
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 40, paddingHorizontal: 10 },
  toggleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 40, 
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingVertical: 12,
    borderRadius: 20,
    width: '100%',
  },
  toggleText: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: colors.textSecondary,
    width: 80,
    textAlign: 'center',
  },
  activeToggle: { color: colors.textPrimary },
  pickersContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    gap: 40, 
    marginTop: 20,
  },
  column: { alignItems: 'center' }, 
  columnLabel: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 32 },
  pickerRow: { flexDirection: 'row', gap: 12 }, 
  smallWheel: { width: 85, height: 280, flex: 0 }, 
  largeWheel: { width: 140, height: 280, flex: 0 },
  button: { 
    marginBottom: 20, 
    borderRadius: 100,
    height: 60,
  },
});
