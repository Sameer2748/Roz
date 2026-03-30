import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TextInput } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedGestureHandler, 
  useAnimatedStyle, 
  useSharedValue, 
  runOnJS,
  interpolate,
  Extrapolate,
  useAnimatedProps,
  useDerivedValue
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';
import colors from '../../constants/colors';

const { width: SW } = Dimensions.get('window');
const SLIDER_WIDTH = SW - 80;
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function SpeedScreen({ navigation }) {
  const { onboardingData, updateOnboardingData } = useUserStore();
  const unit = onboardingData.unit_preference === 'metric' ? 'kg' : 'lbs';
  const action = (onboardingData.goal || 'maintenance') === 'fat_loss' ? 'Lose' : 'Gain';
  
  const [speed, setSpeed] = useState(1.0);
  const translateX = useSharedValue(((1.0 - 0.2) / 2.8) * SLIDER_WIDTH);

  // Derived strings for high-performance updates
  const displayString = useDerivedValue(() => {
    const s = interpolate(translateX.value, [0, SLIDER_WIDTH], [0.2, 3.0], Extrapolate.CLAMP);
    const lbs = s.toFixed(1);
    const kg = (s * 0.453592).toFixed(1);
    return unit === 'kg' ? `${kg} kg (${lbs} lbs)` : `${lbs} lbs (${kg} kg)`;
  });

  const animatedProps = useAnimatedProps(() => ({
    text: displayString.value,
  }));

  const updateSpeedJS = (val) => {
    const rounded = Math.round(val * 10) / 10;
    if (rounded !== speed) {
      setSpeed(rounded);
      Haptics.selectionAsync();
    }
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      let nextX = ctx.startX + event.translationX;
      nextX = Math.max(0, Math.min(SLIDER_WIDTH, nextX));
      translateX.value = nextX;
      
      const newSpeed = interpolate(nextX, [0, SLIDER_WIDTH], [0.2, 3.0], Extrapolate.CLAMP);
      runOnJS(updateSpeedJS)(newSpeed);
    },
    onEnd: () => {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }
  });

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - 15 }],
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateOnboardingData({ pace: speed });
    navigation.navigate('TwiceAsMuch');
  };

  return (
    <OnboardingLayout
      title="How fast do you want to reach your goal?"
      onBack={() => navigation.goBack()}
      progress={0.55}
      footer={
        <Button 
          title="Continue" 
          onPress={handleContinue} 
          style={styles.button}
        />
      }
    >
      <View style={styles.content}>
        <Text style={styles.speedLabel}>{action} weight speed per week</Text>
        
        {/* Animated value display to prevent re-renders */}
        <View style={styles.valueContainer}>
          <AnimatedTextInput
            underlineColorAndroid="transparent"
            editable={false}
            value={displayString.value}
            style={styles.speedValue}
            animatedProps={animatedProps}
          />
        </View>

        <View style={styles.sliderWrapper}>
          <View style={styles.iconsRow}>
            <Text style={styles.emoji}>🐢</Text>
            <Text style={styles.emoji}>🐇</Text>
            <Text style={styles.emoji}>🐆</Text>
          </View>
          
          <View style={styles.trackContainer}>
            <View style={styles.trackBackground} />
            <PanGestureHandler onGestureEvent={gestureHandler}>
              <Animated.View style={[styles.thumb, animatedThumbStyle]} />
            </PanGestureHandler>
          </View>
          
          <View style={styles.labelsRow}>
            <Text style={styles.label}>Slow</Text>
            <Text style={styles.label}>Moderate</Text>
            <Text style={styles.label}>Extreme</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Expert Recommendation</Text>
          <Text style={styles.infoText}>
            Losing 0.5 - 1 kg per week is considered healthy and sustainable for long-term results.
          </Text>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', paddingTop: 20 },
  speedLabel: { fontSize: 16, color: colors.textSecondary, marginBottom: 8, fontWeight: '600' },
  valueContainer: { height: 60, width: SW, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  speedValue: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', width: '100%' },
  sliderWrapper: { width: SLIDER_WIDTH + 30, marginBottom: 40 },
  iconsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  emoji: { fontSize: 24 },
  trackContainer: { height: 40, justifyContent: 'center', position: 'relative' },
  trackBackground: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, width: SLIDER_WIDTH, alignSelf: 'center' },
  thumb: {
    position: 'absolute',
    left: 15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  label: { fontSize: 12, color: colors.textTertiary, fontWeight: '700' },
  infoBox: { 
    backgroundColor: '#F9FAFB', 
    padding: 20, 
    borderRadius: 16, 
    width: '100%',
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  infoTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  infoText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  button: { marginBottom: 20, borderRadius: 100 },
});
