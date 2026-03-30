import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const EMOJIS = ['🍎', '🥑', '🍗', '🥗', '🍕', '🥦', '🍊', '🥚', '🍞', '🥛'];

function Particle({ emoji, delay, startX }) {
  const translateY = useSharedValue(height);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-100, { duration: 6000 + Math.random() * 4000, easing: Easing.linear }),
        -1,
        false
      )
    );
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(Math.sin(startX) * 30, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
    opacity.value = withDelay(delay, withTiming(0.3, { duration: 1000 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.particle, { left: startX }, style]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </Animated.View>
  );
}

export default function FoodParticles() {
  const particles = Array.from({ length: 12 }).map((_, i) => ({
    emoji: EMOJIS[i % EMOJIS.length],
    delay: i * 500,
    startX: (width / 12) * i + Math.random() * 20,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    bottom: 0,
  },
  emoji: {
    fontSize: 28,
  },
});
