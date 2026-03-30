import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated as RNAnimated } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';
import colors from '../../constants/colors';

const { width: SW } = Dimensions.get('window');
const TICK_W = 10;
const AnimatedFlatList = RNAnimated.createAnimatedComponent(FlatList);

const KG_WEIGHTS = Array.from({ length: 2201 }, (_, i) => 30 + i / 10); 
const LB_WEIGHTS = Array.from({ length: 4401 }, (_, i) => 60 + i / 10);

export default function DesiredWeightScreen({ navigation }) {
  const { onboardingData, updateOnboardingData } = useUserStore();
  const unitPreference = onboardingData.unit_preference;
  const useLbs = unitPreference === 'metric';
  
  const currentWeightMetric = onboardingData.weight_kg || 70;
  const currentWeight = useLbs 
    ? Math.round(currentWeightMetric * 2.20462)
    : currentWeightMetric;

  const goal = onboardingData.goal;
  const weights = useLbs ? LB_WEIGHTS : KG_WEIGHTS;
  
  const defaultTarget = goal === 'fat_loss' 
    ? currentWeight - (useLbs ? 10 : 5) 
    : goal === 'muscle_gain' 
      ? currentWeight + (useLbs ? 10 : 5) 
      : currentWeight;

  const weightToIdx = (w) => weights.findIndex(v => Math.abs(v - w) < 0.05);

  const [target, setTarget] = useState(defaultTarget);
  const scrollX = useRef(new RNAnimated.Value(0)).current;
  const lastVal = useRef(defaultTarget);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const targetMetric = useLbs ? target * 0.453592 : target;
    updateOnboardingData({ target_weight_kg: Number(targetMetric.toFixed(1)) });
    navigation.navigate('RealisticTarget');
  };

  const goalText = goal === 'fat_loss' ? 'Lose weight' : goal === 'muscle_gain' ? 'Gain weight' : 'Maintain';
  const unitLabel = useLbs ? 'lbs' : 'kg';

  const memoizedRuler = useMemo(() => (
    <AnimatedFlatList
      data={weights}
      horizontal
      keyExtractor={(item) => item.toString()}
      showsHorizontalScrollIndicator={false}
      snapToInterval={TICK_W}
      decelerationRate="fast"
      scrollEventThrottle={16}
      onScroll={RNAnimated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { 
          useNativeDriver: true,
          listener: (event) => {
            const x = event.nativeEvent.contentOffset.x;
            const idx = Math.round(x / TICK_W);
            const clamped = Math.max(0, Math.min(idx, weights.length - 1));
            const val = weights[clamped];
            if (val !== lastVal.current) {
              lastVal.current = val;
              Haptics.selectionAsync();
              setTarget(val);
            }
          }
        }
      )}
      contentContainerStyle={{ paddingHorizontal: SW / 2 - TICK_W / 2 }}
      getItemLayout={(_, i) => ({ length: TICK_W, offset: TICK_W * i, index: i })}
      initialScrollIndex={weightToIdx(defaultTarget)}
      renderItem={({ item, index }) => {
        const isInteger = Math.abs(item % 1) < 0.001;
        const isHalf = Math.abs(item % 1 - 0.5) < 0.001;
        
        const inputRange = [(index - 2) * TICK_W, index * TICK_W, (index + 2) * TICK_W];
        const scale = scrollX.interpolate({ inputRange, outputRange: [0.9, 1.45, 0.9], extrapolate: 'clamp' });
        const opacity = scrollX.interpolate({ inputRange, outputRange: [0.5, 1, 0.5], extrapolate: 'clamp' });

        return (
          <View style={[styles.tick, { width: TICK_W }]}>
            <RNAnimated.View style={[
              styles.tickLine, 
              { 
                width: isInteger ? 2 : 1, 
                height: isInteger ? 40 : (isHalf ? 30 : 20), 
                transform: [{ scaleY: scale }], 
                opacity 
              }
            ]} />
            {isInteger && (
              <RNAnimated.Text style={[styles.tickLabel, { transform: [{ scale }], opacity, color: colors.textPrimary }]}>
                {item.toFixed(0)}
              </RNAnimated.Text>
            )}
          </View>
        );
      }}
      onScrollBeginDrag={() => {}}
    />
  ), [weights, scrollX]);

  return (
    <OnboardingLayout
      title="What is your desired weight?"
      onBack={() => navigation.goBack()}
      progress={0.45}
      scrollable={false}
      footer={
        <Button 
          title="Continue" 
          onPress={handleContinue} 
          style={styles.button}
        />
      }
    >
      <View style={styles.valueDisplay}>
        <Text style={styles.goalLabel}>{goalText}</Text>
        <Text style={styles.bigValue}>
          {target.toFixed(1)} <Text style={styles.unit}>{unitLabel}</Text>
        </Text>
      </View>

      <View style={styles.rulerContainer}>
        <View style={styles.scannedArea} pointerEvents="none" />
        <View style={styles.centerIndicator} pointerEvents="none" />
        {memoizedRuler}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  valueDisplay: { alignItems: 'center', marginBottom: 40 },
  goalLabel: { fontSize: 16, color: colors.textSecondary, marginBottom: 8, fontWeight: '500' },
  bigValue: { fontSize: 44, fontWeight: '800', color: colors.textPrimary },
  unit: { fontSize: 24, fontWeight: '600' },
  rulerContainer: { 
    height: 120, 
    width: SW, 
    position: 'relative', 
    backgroundColor: '#fff',
  },
  scannedArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 30, 
    width: SW / 2,
    backgroundColor: '#F3F4F6',
    zIndex: -1,
  },
  centerIndicator: {
    position: 'absolute',
    left: SW / 2,
    top: 0,
    bottom: 30,
    width: 2.5,
    marginLeft: -1.25,
    backgroundColor: '#000',
    zIndex: 10,
    borderRadius: 1,
  },
  tick: { alignItems: 'center', height: 80, justifyContent: 'flex-start' },
  tickLine: { backgroundColor: colors.border, borderRadius: 1 },
  tickLabel: { 
    position: 'absolute',
    bottom: -25, 
    width: 60,
    marginLeft: -30, 
    left: 1, 
    fontSize: 13, 
    fontWeight: '700', 
    color: colors.textTertiary,
    textAlign: 'center',
  },
  button: { marginBottom: 20, borderRadius: 100 },
});
