import React, { useEffect, useRef, useCallback, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import colors from '../../constants/colors';

const ITEM_HEIGHT = 64;

const PickerItem = memo(({ item, index, scrollY, suffix }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollY.value - (index * ITEM_HEIGHT));
    const scale = interpolate(distance, [0, ITEM_HEIGHT], [1.1, 0.9], Extrapolate.CLAMP);
    const opacity = interpolate(distance, [0, ITEM_HEIGHT * 2.5], [1, 0.3], Extrapolate.CLAMP);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollY.value - (index * ITEM_HEIGHT));
    const isActive = distance < ITEM_HEIGHT / 2;
    return {
      color: isActive ? colors.black : colors.textSecondary,
      fontWeight: isActive ? '800' : '600',
    };
  });

  return (
    <Animated.View style={[wheelStyles.item, animatedStyle]}>
      <View style={wheelStyles.textContainer}>
        <Animated.Text style={[wheelStyles.itemText, textStyle]}>
          {typeof item === 'object' ? item.label : item}
        </Animated.Text>
        {suffix ? (
          <Animated.Text style={[wheelStyles.suffixText, textStyle]}>
            {suffix}
          </Animated.Text>
        ) : null}
      </View>
    </Animated.View>
  );
});

export default function WheelPicker({ items, selectedIndex, onSelect, suffix = '', flatListProps = {}, style = {} }) {
  const scrollY = useSharedValue(selectedIndex * ITEM_HEIGHT);
  const currentIndex = useSharedValue(selectedIndex);
  const flatListRef = useRef(null);
  const isScrolling = useRef(false);

  // Sync with prop changes (e.g. unit switch)
  useEffect(() => {
    if (flatListRef.current && currentIndex.value !== selectedIndex) {
      const offset = selectedIndex * ITEM_HEIGHT;
      flatListRef.current.scrollToOffset({ offset, animated: false });
      currentIndex.value = selectedIndex;
      scrollY.value = offset;
    }
  }, [selectedIndex]);

  // Haptic feedback is ultra-light, can stay on JS thread.
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelect = (index) => {
    if (index >= 0 && index < items.length) {
      onSelect(index);
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      const index = Math.round(event.contentOffset.y / ITEM_HEIGHT);
      if (index !== currentIndex.value) {
        currentIndex.value = index;
        runOnJS(triggerHaptic)();
      }
    },
    onBeginDrag: () => {
      isScrolling.current = true;
    },
    onEndDrag: (event) => {
      isScrolling.current = false;
      const index = Math.round(event.contentOffset.y / ITEM_HEIGHT);
      runOnJS(handleSelect)(index);
    },
    onMomentumScrollEnd: (event) => {
      const index = Math.round(event.contentOffset.y / ITEM_HEIGHT);
      runOnJS(handleSelect)(index);
    },
  });

  const renderItem = useCallback(({ item, index }) => (
    <PickerItem item={item} index={index} scrollY={scrollY} suffix={suffix} />
  ), [suffix]);

  return (
    <View style={[{ flex: 1 }, wheelStyles.container, style]}>
      <View style={wheelStyles.indicator} />
      <Animated.FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: 108 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        initialScrollIndex={selectedIndex}
        removeClippedSubviews={true}
        windowSize={3}
        initialNumToRender={8}
        {...flatListProps}
      />
    </View>
  );
}

const wheelStyles = StyleSheet.create({
  container: { height: 280, position: 'relative', overflow: 'hidden' },
  indicator: {
    position: 'absolute', top: '50%', left: 0, right: 0,
    height: ITEM_HEIGHT, marginTop: -ITEM_HEIGHT / 2,
    backgroundColor: colors.white, borderRadius: 16, zIndex: -1,
  },
  item: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  textContainer: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', width: '100%', paddingHorizontal: 4 },
  itemText: { fontSize: 24, textAlign: 'center' },
  suffixText: { fontSize: 14, marginLeft: 2, fontWeight: '700', marginBottom: 2 },
});
