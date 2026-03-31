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

  const displayString = useDerivedValue(() => {
    const s = interpolate(translateX.value, [0, SLIDER_WIDTH], [0.2, 3.0], Extrapolate.CLAMP);
    const lbs = s.toFixed(1);
    const kg = (s * 0.453592).toFixed(1);
    return unit === 'kg' ? `${kg} kg (${lbs} lbs)` : `${lbs} lbs (${kg} kg)`;
  });

  const animatedProps = useAnimatedProps(() => ({
    text: displayString.value,
  }));

  const triggerHaptic = () => Haptics.selectionAsync();

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
    },
    onActive: (event, ctx) => {
      let nextX = ctx.startX + event.translationX;
      nextX = Math.max(0, Math.min(SLIDER_WIDTH, nextX));
      
      // Only trigger haptics on every 0.5 increment to keep it subtle
      const oldVal = Math.round(interpolate(translateX.value, [0, SLIDER_WIDTH], [0.2, 3.0], Extrapolate.CLAMP) * 2);
      const newVal = Math.round(interpolate(nextX, [0, SLIDER_WIDTH], [0.2, 3.0], Extrapolate.CLAMP) * 2);
      
      translateX.value = nextX;
      
      if (oldVal !== newVal) {
        runOnJS(triggerHaptic)();
      }
    },
    onEnd: (event) => {
      const finalX = Math.max(0, Math.min(SLIDER_WIDTH, translateX.value));
      const finalSpeed = interpolate(finalX, [0, SLIDER_WIDTH], [0.2, 3.0], Extrapolate.CLAMP);
      runOnJS(setSpeed)(Math.round(finalSpeed * 10) / 10);
    }
  });

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - 15 }, { scale: 1.1 }],
  }));

  const handleContinue = () => {
    Haptics.selectionAsync();
    updateOnboardingData({ pace: speed });
    navigation.navigate('TwiceAsMuch');
  };

  return (
    <OnboardingLayout
      title="How fast is the goal?"
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
            Setting a path between 0.5 - 1 kg per week is considered healthy and sustainable for long-term results.
          </Text>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', paddingTop: 20 },
  speedLabel: { fontSize: 16, color: colors.textSecondary, marginBottom: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  valueContainer: { height: 80, width: SW, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  speedValue: { fontSize: 34, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', width: '100%' },
  sliderWrapper: { width: SLIDER_WIDTH + 30, marginBottom: 40 },
  iconsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  emoji: { fontSize: 24 },
  trackContainer: { height: 40, justifyContent: 'center', position: 'relative' },
  trackBackground: { 
    height: 10, 
    backgroundColor: colors.bgCardSecondary, 
    borderRadius: 5, 
    width: SLIDER_WIDTH, 
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  thumb: {
    position: 'absolute',
    left: 15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  label: { fontSize: 13, color: colors.textSecondary, fontWeight: '800', textTransform: 'uppercase' },
  infoBox: { 
    backgroundColor: colors.bgCardSecondary, 
    padding: 24, 
    borderRadius: 24, 
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderGray,
    marginTop: 20,
  },
  infoTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  infoText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, fontWeight: '500' },
  button: { marginBottom: 20, borderRadius: 100, height: 60 },
});
