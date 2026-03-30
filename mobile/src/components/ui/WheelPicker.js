import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate,
  runOnJS,
  useAnimatedRef,
} from 'react-native-reanimated';
import colors from '../../constants/colors';

const ITEM_HEIGHT = 64;

const PickerItem = React.memo(({ item, index, scrollY, suffix }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollY.value - (index * ITEM_HEIGHT));
    const scale = interpolate(
      distance,
      [0, ITEM_HEIGHT],
      [1.1, 0.9],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      distance,
      [0, ITEM_HEIGHT * 2.5],
      [1, 0.2],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const isActive = Math.round(scrollY.value / ITEM_HEIGHT) === index;
    return {
      color: isActive ? '#000000' : '#CCCCCC',
      fontWeight: isActive ? '800' : '600',
    };
  });

  const suffixStyle = useAnimatedStyle(() => {
    const isActive = Math.round(scrollY.value / ITEM_HEIGHT) === index;
    return {
      color: isActive ? '#000000' : '#CCCCCC',
    };
  });

  return (
    <Animated.View style={[wheelStyles.item, animatedStyle]}>
      <View style={wheelStyles.textContainer}>
        <Animated.Text style={[wheelStyles.itemText, textStyle]}>
          {typeof item === 'object' ? item.label : item}
        </Animated.Text>
        {suffix ? (
          <Animated.Text style={[wheelStyles.suffixText, suffixStyle]}>
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

  useEffect(() => {
    // Only scroll manually on mount or if external value changes while NOT scrolling
    if (flatListRef.current && currentIndex.value !== selectedIndex) {
      setTimeout(() => {
        flatListRef.current.scrollToOffset({ 
          offset: selectedIndex * ITEM_HEIGHT, 
          animated: false 
        });
        currentIndex.value = selectedIndex;
        scrollY.value = selectedIndex * ITEM_HEIGHT;
      }, 50);
    }
  }, [items]); // Only re-scroll when items list changes (e.g. unit switch)

  const triggerHaptic = (index) => {
    if (index !== selectedIndex) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(index);
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      const index = Math.round(event.contentOffset.y / ITEM_HEIGHT);
      if (index >= 0 && index < items.length && index !== currentIndex.value) {
        currentIndex.value = index;
        runOnJS(triggerHaptic)(index);
      }
    },
  });

  const renderItem = useCallback(({ item, index }) => (
    <PickerItem 
      item={item} 
      index={index} 
      scrollY={scrollY} 
      suffix={suffix} 
    />
  ), [suffix]);

  const containerStyle = [
    { flex: 1 }, // Default to flexible if no width provided
    wheelStyles.container,
    style
  ];

  return (
    <View style={containerStyle}>
      <View style={wheelStyles.indicator} />
      <Animated.FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: 110 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        initialScrollIndex={selectedIndex}
        {...flatListProps}
      />
    </View>
  );
}

const wheelStyles = StyleSheet.create({
  container: { height: 280, position: 'relative', overflow: 'hidden' }, // Removed flex: 1 from here
  indicator: {
    position: 'absolute', top: '50%', left: 0, right: 0,
    height: 64, marginTop: -32,
    backgroundColor: '#F3F4F6', borderRadius: 12, zIndex: -1,
  },
  item: { height: 64, justifyContent: 'center', alignItems: 'center' },
  textContainer: { 
    flexDirection: 'row', 
    alignItems: 'baseline', // Baseline looks better for units
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  itemText: { 
    fontSize: 24, 
    textAlign: 'center',
  },
  suffixText: { 
    fontSize: 14, 
    marginLeft: 2, 
    fontWeight: '600',
    marginBottom: 2, // Slight lift to match baseline visually
  },
});
