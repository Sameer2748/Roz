import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withTiming, useDerivedValue } from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(Text);

export default function CounterAnimation({ value, duration = 1200, style }) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, { duration });
  }, [value]);

  const displayValue = useDerivedValue(() => {
    return Math.round(animatedValue.value).toString();
  });

  // For reanimated v3, we use a simple approach with animated text
  return (
    <ReanimatedCounter animatedValue={animatedValue} style={style} />
  );
}

function ReanimatedCounter({ animatedValue, style }) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    // Poll the animated value for display
    let frame;
    const update = () => {
      setDisplay(Math.round(animatedValue.value));
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [animatedValue]);

  return <Text style={style}>{display}</Text>;
}
