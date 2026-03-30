import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity, 
  RefreshControl, 
  useWindowDimensions, 
  ActivityIndicator, 
  Image, 
  Animated,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Swipeable, GestureHandlerRootView, RectButton } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../../store/authStore';
import useUserStore from '../../store/userStore';
import useLogStore from '../../store/logStore';
import useToastStore from '../../store/toastStore';
import api from '../../services/api';
import colors from '../../constants/colors';

const GAP = 16;

// Helper to get local date string YYYY-MM-DD
const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Shimmer Effect Component
const ShimmerPlaceholder = ({ style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return <Animated.View style={[style, { backgroundColor: '#333', opacity }]} />;
};

// Image with Loader
const ShimmerImage = ({ uri, style }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <View style={style}>
      {!loaded && <ShimmerPlaceholder style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />}
      <Image 
        source={{ uri }} 
        style={[style, !loaded && { position: 'absolute', opacity: 0 }]} 
        onLoad={() => setLoaded(true)}
        resizeMode="cover"
      />
    </View>
  );
};

// Scrollable Calendar Component
const ScrollableCalendar = ({ onDateSelect, selectedDate }) => {
  const scrollRef = useRef(null);
  
  // Generate last 30 days
  const dates = useMemo(() => {
    const arr = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push({
        day: d.toLocaleString('en-US', { weekday: 'short' }),
        date: d.getDate(),
        full: formatLocalDate(d), // Use local date string instead of ISO
        raw: d
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    // Initial scroll to end (today)
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={calendarStyles.container}
      contentContainerStyle={calendarStyles.content}
      ref={scrollRef}
    >
      {dates.map((item, i) => (
        <TouchableOpacity
          key={i}
          style={[calendarStyles.dayCol, selectedDate === item.full && calendarStyles.activeDayCol]}
          onPress={() => {
            Haptics.selectionAsync();
            onDateSelect(item.full);
          }}
        >
          <Text style={calendarStyles.dayText}>{item.day}</Text>
          <View style={[
            calendarStyles.dateCircle, 
            selectedDate === item.full ? calendarStyles.activeDateCircle : calendarStyles.inactiveDateCircle
          ]}>
            <Text style={calendarStyles.dateText}>{item.date}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default function HomeScreen({ navigation, route }) {
  const { width, height } = useWindowDimensions();
  const PAGE_WIDTH = width - 32;
  const SNAP_INTERVAL = PAGE_WIDTH + GAP;
  const { dailyTarget, streak, setDailyTarget, setStreak, setProfile } = useUserStore();
  const { todayLogs, todayTotals, setTodayLogs, pendingLogs } = useLogStore();
  const showToast = useToastStore((state) => state.show);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedDate, setSelectedDate] = useState(formatLocalDate(new Date()));
  const lastFetchRef = useRef(null);

  const fetchData = useCallback(async (targetDate = selectedDate, force = false) => {
    // If we're already fetching this exact date/force combo, skip
    const fetchKey = `${targetDate}-${force}`;
    if (lastFetchRef.current === fetchKey && !force) return;
    lastFetchRef.current = fetchKey;

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const [userRes, logsRes] = await Promise.all([
        api.get('/users/me'),
        api.get(`/logs/day?date=${targetDate}&tz=${tz}`),
      ]);

      const data = userRes.data.data;
      setProfile(data.profile);
      setDailyTarget(data.daily_target);
      setStreak(userRes.data.data.streak || streak);
      setTodayLogs(logsRes.data.data.meals, logsRes.data.data.totals);
    } catch (err) {
      showToast('Connection error', 'error');
    }
  }, [selectedDate, setDailyTarget, setProfile, setStreak, setTodayLogs, showToast]);

  // Fetch data whenever selectedDate changes (handles date selection from calendar)
  useEffect(() => {
    fetchData(selectedDate, true);
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // On screen focus: only reset to today if coming back from LogScreen with resetToToday flag
  useFocusEffect(
    useCallback(() => {
      const resetToToday = route?.params?.resetToToday;
      if (resetToToday) {
        const today = formatLocalDate(new Date());
        navigation.setParams({ resetToToday: false }); // Clear the flag
        setSelectedDate(today); // This will trigger the useEffect above to fetch
      }
      // Otherwise just do a normal refresh of the current selected date
      else {
        fetchData(selectedDate);
      }
    }, [fetchData, navigation, route?.params?.resetToToday, selectedDate])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(selectedDate, true);
    setRefreshing(false);
  };

  const handleDeleteLog = async (id, mealType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); // Using Heavy for a "destroyed" feel

    // OPTIMISTIC UPDATE: remove from UI immediately
    const updatedMeals = { ...todayLogs };
    let deletedItem = null;

    for (const type in updatedMeals) {
      const index = updatedMeals[type].findIndex(l => l.id === id);
      if (index > -1) {
        deletedItem = updatedMeals[type][index];
        updatedMeals[type] = updatedMeals[type].filter(l => l.id !== id);
        break;
      }
    }

    if (deletedItem) {
      const newTotals = {
        ...todayTotals,
        calories: todayTotals.calories - parseFloat(deletedItem.calories || 0),
        protein_g: todayTotals.protein_g - parseFloat(deletedItem.protein_g || 0),
        carbs_g: todayTotals.carbs_g - parseFloat(deletedItem.carbs_g || 0),
        fat_g: todayTotals.fat_g - parseFloat(deletedItem.fat_g || 0),
      };
      setTodayLogs(updatedMeals, newTotals);
    }

    // PERSIST: call the API to actually delete it
    try {
      await api.delete(`/logs/${id}`);
      showToast('Entry removed', 'success');
    } catch (err) {
      showToast('Failed to delete entry', 'error');
      fetchData(selectedDate, true); // Revert UI if it failed
    }
  };

  const target = dailyTarget || { calories: 2465, protein_g: 166, carbs_g: 295, fat_g: 68 };
  const consumed = todayTotals;
  const calCount = Math.round(consumed.calories);
  const calMax = target.calories;
  const calPct = Math.min(calCount / calMax, 1);

  const onScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SNAP_INTERVAL);
    setCurrentPage(page);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Dynamic Background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1e1a23' }]} />
      <LinearGradient
        colors={['#372f38', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.8 }}
        style={{ position: 'absolute', top: 0, left: 0, width: width, height: height * 0.5 }}
      />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            <View style={styles.brandLeft}>
              <Image source={require('../../../assets/icon.png')} style={styles.appLogo} />
              <Text style={styles.brandName}>Roz</Text>
            </View>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color={colors.accentOrange} />
              <Text style={styles.streakText}>{streak.current_streak || 0}</Text>
            </View>
          </View>
          <ScrollableCalendar onDateSelect={setSelectedDate} selectedDate={selectedDate} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
          }
        >
          {/* Main Dashboard Carousel */}
          <View style={styles.carouselWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              snapToInterval={SNAP_INTERVAL}
              snapToAlignment="start"
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContent}
            >
              {/* PAGE 1: Calories + Primary Macros */}
              <View style={[styles.carouselPage, { width: PAGE_WIDTH }]}>
                <View style={styles.mainCard}>
                  <View style={styles.mainCardLeft}>
                    <Text style={styles.mainCalories}>
                       {Math.max(0, Math.round(calMax - calCount))} 
                       <Text style={styles.totalCalText}> kcal</Text>
                    </Text>
                    <Text style={styles.mainLabel}>Calories left</Text>
                  </View>
                  <View style={styles.bigRingContainer}>
                     <View style={styles.bigRingTrack} />
                     <View style={[styles.bigRingFill, { 
                       borderLeftColor: '#FFF', 
                       borderTopColor: '#FFF',
                       borderBottomColor: calPct > 0.5 ? '#FFF' : 'transparent',
                       borderRightColor: calPct > 0.75 ? '#FFF' : 'transparent',
                       opacity: calPct > 0 ? 1 : 0
                     }]} />
                     <View style={styles.iconCapsule}>
                        <Ionicons name="flame" size={24} color="#FFF" />
                     </View>
                  </View>
                </View>

                <View style={styles.macroRow}>
                  <MacroMiniCard label="Protein" val={Math.round(consumed.protein_g)} max={target.protein_g} icon="food-drumstick" color={colors.accentGreen} />
                  <MacroMiniCard label="Carbs" val={Math.round(consumed.carbs_g)} max={target.carbs_g} icon="leaf" color={colors.accentGold} />
                  <MacroMiniCard label="Fats" val={Math.round(consumed.fat_g)} max={target.fat_g} icon="opacity" color={colors.accentPink} />
                </View>
              </View>

              {/* PAGE 2: Secondary Macros + Health Score */}
              <View style={[styles.carouselPage, { width: PAGE_WIDTH }]}>
                <View style={styles.macroRow}>
                  <MacroMiniCard label="Fiber" val={Math.round(consumed.fiber_g || 0)} max={38} icon="blur" color={colors.accentPurple} />
                  <MacroMiniCard label="Sugar" val={Math.round(consumed.sugar_g || 0)} max={90} icon="shimmer" color={colors.accentPink} />
                  <MacroMiniCard label="Sodium" val={Math.round(consumed.sodium_mg || 0)} max={2300} icon="shaker-outline" color={colors.accentGold} />
                </View>

                <View style={styles.healthCard}>
                  <View style={styles.healthHeader}>
                    <Text style={styles.healthTitle}>Health score</Text>
                    <Text style={styles.healthScore}>6/10</Text>
                  </View>
                  <View style={styles.healthProgressWrap}>
                    <View style={styles.healthProgressBar} />
                    <View style={[styles.healthProgressFill, { width: '60%' }]} />
                  </View>
                  <Text style={styles.healthDesc}>
                    Carbs and fat are on track. You’re low in calories and protein, which can slow weight loss and impact muscle retention.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.paginationDots}>
              <View style={[styles.dot, currentPage === 0 && styles.activeDot]} />
              <View style={[styles.dot, currentPage === 1 && styles.activeDot]} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>
             {selectedDate === new Date().toISOString().split('T')[0] ? 'Recently uploaded' : `Logs for ${new Date(selectedDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
          </Text>

          <View style={styles.logsList}>
            {pendingLogs.map((item) => (
              <View key={item.id} style={[styles.logRow, { opacity: 0.7 }]}>
                <View style={styles.pendingImageWrap}>
                   <ShimmerPlaceholder style={styles.logImage} />
                  <View style={styles.loaderOverlay}>
                    <ActivityIndicator size="small" color="#FFF" />
                  </View>
                </View>
                <View style={styles.logInfo}>
                  <Text style={styles.pendingTitle}>Analyzing meal...</Text>
                  <Text style={styles.pendingSub}>{item.meal_type.toUpperCase()}</Text>
                  <View style={styles.shimmerBar} />
                </View>
              </View>
            ))}

            {Object.values(todayLogs).flat().length === 0 && pendingLogs.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={48} color="#444" />
                <Text style={styles.emptyTitle}>No logs for this day</Text>
                <Text style={styles.emptySub}>Track your nutrition by scanning meals</Text>
              </View>
            ) : (
              Object.keys(todayLogs).map((type) =>
                todayLogs[type].map((item) => (
                  <View key={item.id} style={styles.swipeWrapper}>
                    <Swipeable
                      friction={2}
                      rightThreshold={40}
                      overshootRight={false}
                      renderRightActions={() => (
                        <RectButton
                          style={styles.deleteAction}
                          onPress={() => {
                            handleDeleteLog(item.id, type);
                          }}
                        >
                          <Ionicons name="trash" size={24} color="#FF453A" />
                          <Text style={styles.deleteActionText}>Delete</Text>
                        </RectButton>
                      )}
                    >
                      <TouchableOpacity
                        style={styles.logRow}
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('FoodDetail', { log: item })}
                      >
                        {item.image_url ? (
                          <ShimmerImage uri={item.image_url} style={styles.logImage} />
                        ) : (
                          <View style={[styles.logImage, { backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="restaurant" size={32} color="#666" />
                          </View>
                        )}

                        <View style={styles.logInfo}>
                          <Text style={styles.logTime}>{new Date(item.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                          <Text style={styles.logName} numberOfLines={1}>{item.food_name}</Text>

                          <View style={styles.logStats}>
                            <View style={styles.logCalRow}>
                              <Ionicons name="flame" size={16} color={colors.accentOrange} />
                              <Text style={styles.logCalText}>{Math.round(item.calories)} calories</Text>
                            </View>

                            <View style={styles.logMacroRow}>
                              <View style={styles.miniMacro}>
                                <MaterialCommunityIcons name="food-drumstick" size={14} color={colors.accentGreen} />
                                <Text style={styles.miniMacroText}>{Math.round(item.protein_g)}g</Text>
                              </View>
                              <View style={styles.miniMacro}>
                                <MaterialCommunityIcons name="leaf" size={14} color={colors.accentGold} />
                                <Text style={styles.miniMacroText}>{Math.round(item.carbs_g)}g</Text>
                              </View>
                              <View style={styles.miniMacro}>
                                <MaterialCommunityIcons name="opacity" size={14} color={colors.accentPink} />
                                <Text style={styles.miniMacroText}>{Math.round(item.fat_g)}g</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Swipeable>
                  </View>
                ))
              )
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function MacroMiniCard({ label, val, max, icon, color }) {
  const pct = Math.min(val / max, 1);
  return (
    <View style={styles.miniCard}>
      <View style={styles.miniLabelGroup}>
         <Text style={styles.miniValText}>{Math.max(0, Math.round(max - val))}g</Text>
         <Text style={styles.miniEatenText}>{label} left</Text>
      </View>
      <View style={styles.miniProgressContainer}>
         <View style={[styles.miniProgressRing, { borderColor: 'rgba(255,255,255,0.05)' }]} />
         <View style={[styles.miniProgressRingActive, { 
           borderColor: color, 
           borderBottomColor: pct > 0.5 ? color : 'transparent',
           borderRightColor: pct > 0.75 ? color : 'transparent',
           borderLeftColor: color,
           borderTopColor: color,
           opacity: pct > 0 ? 1 : 0
         }]} />
         <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
    </View>
  );
}

const calendarStyles = StyleSheet.create({
  container: { marginBottom: 4 },
  content: { paddingHorizontal: 16, gap: 10, alignItems: 'center' },
  dayCol: { alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 20 },
  activeDayCol: { backgroundColor: 'rgba(255,255,255,0.05)' },
  dayText: { fontSize: 11, color: '#9CA3AF', fontWeight: '700' },
  dateCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  inactiveDateCircle: { borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'dashed' },
  activeDateCircle: { borderColor: colors.accentGreen, borderStyle: 'solid' },
  dateText: { fontSize: 13, color: '#FFF', fontWeight: '800' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1a23' },
  topHeader: { paddingBottom: 10 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 10, marginBottom: 20 },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appLogo: { width: 28, height: 28, borderRadius: 6 },
  brandName: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, gap: 4, borderWidth: 1, borderColor: colors.borderGray },
  streakText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  scroll: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
  
  carouselWrapper: { marginBottom: 8 },
  carouselContent: { gap: GAP },
  carouselPage: { gap: 10 },
  
  mainCard: {
    width: '100%', height: 134, backgroundColor: '#1e1a23', borderRadius: 28, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderGray, marginBottom: 10
  },
  mainCardLeft: { flex: 1 },
  mainCalories: { fontSize: 34, fontWeight: '800', color: '#FFF' },
  totalCalText: { fontSize: 22, color: '#6A6A6E', fontWeight: '500' },
  mainLabel: { fontSize: 13, color: '#FFF', fontWeight: '600', marginTop: 2 },
  bigRingContainer: { width: 84, height: 84, justifyContent: 'center', alignItems: 'center' },
  bigRingTrack: { position: 'absolute', width: 84, height: 84, borderRadius: 42, borderWidth: 7, borderColor: 'rgba(255,255,255,0.05)' },
  bigRingFill: { position: 'absolute', width: 84, height: 84, borderRadius: 42, borderWidth: 7 },
  iconCapsule: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center' },

  macroRow: { flexDirection: 'row', gap: 10 },
  miniCard: {
    flex: 1, height: 134, backgroundColor: '#1e1a23', borderRadius: 28, padding: 14, justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.borderGray
  },
  miniLabelGroup: { gap: 1 },
  miniValText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  miniMaxText: { fontSize: 10, color: '#6A6A6E', fontWeight: '500' },
  miniEatenText: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  miniProgressContainer: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: 4 },
  miniProgressRing: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 6 },
  miniProgressRingActive: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 6 },

  healthCard: { width: '100%', height: 134, backgroundColor: '#1e1a23', borderRadius: 28, padding: 18, borderWidth: 1, borderColor: colors.borderGray, marginTop: 10, justifyContent: 'center' },
  healthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  healthTitle: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  healthScore: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  healthProgressWrap: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  healthProgressBar: { ...StyleSheet.absoluteFillObject },
  healthProgressFill: { height: '100%', backgroundColor: colors.accentGreen, borderRadius: 3 },
  healthDesc: { fontSize: 11, color: '#9CA3AF', lineHeight: 16, fontWeight: '500' },

  paginationDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10, marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)' },
  activeDot: { backgroundColor: '#FFF' },

  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginTop: 20, marginBottom: 16 },
  emptyState: { backgroundColor: '#1e1a23', borderRadius: 32, padding: 40, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.borderGray },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  emptySub: { fontSize: 14, color: '#6A6A6E', textAlign: 'center', lineHeight: 22 },
  logsList: { gap: 12 },
  swipeWrapper: { backgroundColor: '#252538', borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderGray },
  logRow: { flexDirection: 'row', padding: 12, height: 134, backgroundColor: '#1e1a23' },
  logImage: { width: 110, height: 110, borderRadius: 24 },
  logInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  logName: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  logTime: { position: 'absolute', top: 0, right: 0, fontSize: 12, color: '#6A6A6E', fontWeight: '600' },
  logStats: { gap: 6 },
  logCalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logCalText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  logMacroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniMacro: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniMacroText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  deleteAction: { width: 80, justifyContent: 'center', alignItems: 'center', height: 134, backgroundColor: 'rgba(255, 69, 58, 0.15)' },
  deleteActionText: { color: '#FFF', fontSize: 12, fontWeight: '700', marginTop: 4 },

  pendingImageWrap: { width: 110, height: 110, borderRadius: 24, overflow: 'hidden' },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  pendingTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  pendingSub: { fontSize: 13, fontWeight: '600', color: '#6A6A6E', marginBottom: 12 },
  shimmerBar: { height: 12, backgroundColor: '#2C2C2E', borderRadius: 6, width: '80%', opacity: 0.5 },
});
