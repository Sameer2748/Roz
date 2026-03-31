import React, { useState, useRef, useMemo, memo, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';
import colors from '../../constants/colors';

const { width: SW } = Dimensions.get('window');
const TICK_W = 10;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const KG_WEIGHTS = Array.from({ length: 2201 }, (_, i) => 30 + i / 10); 
const LB_WEIGHTS = Array.from({ length: 4401 }, (_, i) => 60 + i / 10);

const RulerTick = memo(({ item, index, scrollX }) => {
  const isInteger = Math.abs(item % 1) < 0.001;
  const isHalf = Math.abs(item % 1 - 0.5) < 0.001;

  const tickStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollX.value - (index * TICK_W));
    const scale = interpolate(distance, [0, TICK_W * 2], [1.2, 1], Extrapolate.CLAMP);
    const opacity = interpolate(distance, [0, SW / 2.5], [1, 0.2], Extrapolate.CLAMP);

    return {
      height: isInteger ? 40 : (isHalf ? 28 : 18),
      width: isInteger ? 2.5 : 1.5,
      opacity,
      transform: [{ scaleY: scale }],
      backgroundColor: isInteger ? colors.white : colors.textSecondary,
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollX.value - (index * TICK_W));
    const opacity = interpolate(distance, [0, TICK_W * 3], [1, 0], Extrapolate.CLAMP);
    return { opacity };
  });

  return (
    <View style={styles.tickContainer}>
      <Animated.View style={[styles.tickLine, tickStyle]} />
      {isInteger && (
        <Animated.Text style={[styles.tickLabel, labelStyle]}>
          {item.toFixed(0)}
        </Animated.Text>
      )}
    </View>
  );
});

export default function DesiredWeightScreen({ navigation }) {
  const { onboardingData, updateOnboardingData } = useUserStore();
  
  // Explicitly check the preference
  const unitPreference = onboardingData.unit_preference || 'imperial';
  const isMetric = unitPreference.toLowerCase() === 'metric';
  
  const weights = isMetric ? KG_WEIGHTS : LB_WEIGHTS;
  const unitLabel = isMetric ? 'kg' : 'lbs';
  
  const currentWeightMetric = onboardingData.weight_kg || 70;
  const currentWeight = isMetric 
    ? currentWeightMetric 
    : Math.round(currentWeightMetric * 2.20462);

  const goal = onboardingData.goal;

  // Set a smart default target based on the unit and goal
  const defaultTarget = useMemo(() => {
    if (goal === 'fat_loss') {
      return currentWeight - (isMetric ? 5 : 10);
    } else if (goal === 'muscle_gain') {
      return currentWeight + (isMetric ? 5 : 10);
    }
    return currentWeight;
  }, [currentWeight, goal, isMetric]);

  const scrollX = useSharedValue(0);
  const [localTarget, setLocalTarget] = useState(defaultTarget);
  const lastTarget = useRef(defaultTarget);

  const initialIdx = weights.findIndex(v => Math.abs(v - defaultTarget) < 0.05);

  const handleImpact = () => Haptics.selectionAsync();
  const updateStore = (val) => setLocalTarget(val);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const x = event.contentOffset.x;
      scrollX.value = x;
      const idx = Math.round(x / TICK_W);
      const val = weights[Math.max(0, Math.min(idx, weights.length - 1))];
      
      if (val !== lastTarget.current) {
        lastTarget.current = val;
        runOnJS(handleImpact)();
        runOnJS(updateStore)(val);
      }
    }
  });

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const targetKg = isMetric ? localTarget : localTarget * 0.453592;
    updateOnboardingData({ target_weight_kg: Number(targetKg.toFixed(1)) });
    navigation.navigate('RealisticTarget');
  };

  const renderItem = useCallback(({ item, index }) => (
    <RulerTick item={item} index={index} scrollX={scrollX} />
  ), []);

  return (
    <OnboardingLayout
      title="Desired weight"
      onBack={() => navigation.goBack()}
      progress={0.45}
      scrollable={false}
      footer={
        <Button title="Continue" onPress={handleContinue} style={styles.button} />
      }
    >
      <View style={styles.valueDisplay}>
        <Text style={styles.goalLabel}>Desired Target</Text>
        <Text style={styles.bigValue}>
          {localTarget.toFixed(1)} <Text style={styles.unit}>{unitLabel}</Text>
        </Text>
      </View>

      <View style={styles.rulerOuter}>
        <View style={styles.centerIndicator} pointerEvents="none" />
        <AnimatedFlatList
          data={weights}
          horizontal
          keyExtractor={(item) => item.toString()}
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK_W}
          decelerationRate="fast"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          getItemLayout={(_, i) => ({ length: TICK_W, offset: TICK_W * i, index: i })}
          initialScrollIndex={initialIdx >= 0 ? initialIdx : 0}
          contentContainerStyle={styles.flatListContent}
          renderItem={renderItem}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          initialNumToRender={20}
          windowSize={3}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  valueDisplay: { alignItems: 'center', marginBottom: 40 },
  goalLabel: { fontSize: 16, color: colors.textSecondary, marginBottom: 8, fontWeight: '700', textTransform: 'uppercase' },
  bigValue: { fontSize: 48, fontWeight: '900', color: colors.textPrimary, textAlign: 'center' },
  unit: { fontSize: 24, fontWeight: '600', color: colors.textSecondary },
  rulerOuter: { 
    height: 140, 
    width: SW, 
    marginLeft: -24,
    position: 'relative', 
    backgroundColor: 'transparent',
    marginTop: 20,
    overflow: 'hidden',
  },
  flatListContent: {
    paddingHorizontal: SW / 2 - TICK_W / 2,
  },
  centerIndicator: {
    position: 'absolute',
    left: SW / 2,
    top: 0,
    bottom: 50,
    width: 3,
    marginLeft: -1.5,
    backgroundColor: colors.white,
    zIndex: 10,
    borderRadius: 2,
  },
  tickContainer: { width: TICK_W, alignItems: 'center', height: 100 },
  tickLine: { borderRadius: 2 },
  tickLabel: { 
    position: 'absolute',
    bottom: 0, 
    fontSize: 12, 
    fontWeight: '800', 
    color: colors.textSecondary,
    width: 40,
    textAlign: 'center'
  },
  button: { marginBottom: 20, borderRadius: 100, height: 60 },
});
