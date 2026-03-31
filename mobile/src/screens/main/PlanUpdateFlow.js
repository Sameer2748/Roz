import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  Alert,
  ScrollView,
  useWindowDimensions,
  TextInput
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS, 
  useDerivedValue,
  useAnimatedGestureHandler,
  interpolate,
  Extrapolate,
  useAnimatedProps
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';

import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import WheelPicker from '../../components/ui/WheelPicker';
import UnitToggle from '../../components/ui/UnitToggle';
import colors from '../../constants/colors';
import api from '../../services/api';
import useUserStore from '../../store/userStore';

const { width: SW } = Dimensions.get('window');
const SLIDER_WIDTH = SW - 80;
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// ONBOARDING CONSTANTS SYNC
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 81 }, (_, i) => currentYear - 10 - i).reverse(); 

const CM_HEIGHTS = Array.from({ length: 101 }, (_, i) => 120 + i); 
const KG_WEIGHTS = Array.from({ length: 221 }, (_, i) => 30 + i); 
const LB_WEIGHTS = Array.from({ length: 441 }, (_, i) => 60 + i); 
const FT_VALUES = Array.from({ length: 9 }, (_, i) => i + 1); 
const IN_VALUES = Array.from({ length: 12 }, (_, i) => i); 

const GOALS = [
  { id: 'fat_loss', title: 'Lose Fat', icon: 'trending-down', desc: 'Burn fat and get leaner' },
  { id: 'maintenance', title: 'Maintain', icon: 'swap-horizontal', desc: 'Keep your current physique' },
  { id: 'muscle_gain', title: 'Build Muscle', icon: 'trending-up', desc: 'Gain strength and mass' },
];

const ACTIVITIES = [
  { id: 'sedentary', title: 'Sedentary', desc: 'Little to no exercise', icon: 'human-handsdown' },
  { id: 'lightly_active', title: 'Lightly Active', desc: 'Exercise 1-3 days/week', icon: 'walk' },
  { id: 'moderately_active', title: 'Moderately Active', desc: 'Exercise 3-5 days/week', icon: 'run' },
  { id: 'very_active', title: 'Very Active', desc: 'Exercise 6-7 days/week', icon: 'bike' },
  { id: 'extra_active', title: 'Extra Active', desc: 'Physical job or 2x training', icon: 'weight-lifter' },
];

const CHECKLIST = ['Calories', 'Carbs', 'Protein', 'Fats', 'Metabolism Check', 'Plan Optimization'];

export default function PlanUpdateFlow({ navigation }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { profile, setProfile, setDailyTarget } = useUserStore();
  const [unit, setUnit] = useState('Imperial');

  // Calculation Progress
  const [percent, setPercent] = useState(0);
  const [completedIndex, setCompletedIndex] = useState(-1);
  const progressPercent = useSharedValue(0);

  useDerivedValue(() => {
    runOnJS(setPercent)(Math.round(progressPercent.value));
    runOnJS(setCompletedIndex)(Math.floor(progressPercent.value / (100 / CHECKLIST.length)));
  });

  // Initial State Sanitization to prevent VirtualizedList NaN crashes
  const initialMonth = (Number(profile?.birthday?.month) || 1) - 1;
  const initialYearValue = Number(profile?.birthday?.year) || (currentYear - 25);
  const foundYearIdx = YEARS.findIndex(y => y === initialYearValue);
  const initialYearIdx = foundYearIdx !== -1 ? foundYearIdx : (YEARS.length - 25);
  
  const initialCmVal = Number(profile?.height_cm) || 170;
  const initialKgVal = Number(profile?.weight_kg) || 70;
  const initialInchesVal = Math.round(initialCmVal / 2.54);

  const [monthIdx, setMonthIdx] = useState(initialMonth);
  const [yearIdx, setYearIdx] = useState(initialYearIdx);
  
  const daysInMonth = new Date(YEARS[initialYearIdx] || (currentYear - 25), initialMonth + 1, 0).getDate();
  const DAYS = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const [dayIdx, setDayIdx] = useState(Math.min((Number(profile?.birthday?.day) || 15) - 1, daysInMonth - 1));

  const [cmIdx, setCmIdx] = useState(Math.max(0, initialCmVal - 120));
  const [kgIdx, setKgIdx] = useState(Math.max(0, initialKgVal - 30));
  const [ftLocal, setFtLocal] = useState(Math.max(0, Math.floor(initialInchesVal / 12) - 1));
  const [incLocal, setIncLocal] = useState(initialInchesVal % 12);
  const [lbsLocal, setLbsLocal] = useState(Math.max(0, Math.round(initialKgVal / 0.453592) - 60));

  const [data, setData] = useState({
    gender: profile?.gender || 'male',
    goal: profile?.goal || 'fat_loss',
    activity_level: profile?.activity_level || 'sedentary',
    pace: Number(profile?.pace) || 1.0,
  });

  // Imperial conversion logic mirroring SpeedScreen
  // (Pace slider in SpeedScreen uses Metric calculations for label)
  const isMetric = unit === 'Metric';

  // Sync state when profile is available
  useEffect(() => {
    if (profile) {
      if (profile.birthday) {
        setMonthIdx(profile.birthday.month - 1 || 0);
        const yIdx = YEARS.findIndex(y => y === profile.birthday.year);
        if (yIdx !== -1) setYearIdx(yIdx);
        setDayIdx(Math.min(profile.birthday.day - 1 || 14, daysInMonth - 1));
      }
      
      const pCm = Number(profile.height_cm) || 170;
      const pKg = Number(profile.weight_kg) || 70;
      setCmIdx(Math.max(0, pCm - 120));
      setKgIdx(Math.max(0, pKg - 30));

      const pInches = Math.round(pCm / 2.54);
      setFtLocal(Math.max(0, Math.floor(pInches / 12) - 1));
      setIncLocal(pInches % 12);
      setLbsLocal(Math.max(0, Math.round(pKg / 0.453592) - 60));
      
      setData(prev => ({
        ...prev,
        gender: profile.gender || prev.gender,
        goal: profile.goal || prev.goal,
        activity_level: profile.activity_level || prev.activity_level,
        pace: profile.pace || prev.pace,
      }));
    }
  }, [profile]);

  const [calculatedPlan, setCalculatedPlan] = useState(null);

  // Speed Slider State - EXACT SpeedScreen logic
  const translateX = useSharedValue((((data.pace || 1.0) - 0.2) / 2.8) * SLIDER_WIDTH);
  const displayString = useDerivedValue(() => {
    const s = interpolate(translateX.value, [0, SLIDER_WIDTH], [0.2, 3.0], Extrapolate.CLAMP);
    const lbsVal = s.toFixed(1);
    const kgVal = (s * 0.453592).toFixed(1);
    return isMetric ? `${kgVal} kg (${lbsVal} lbs)` : `${lbsVal} lbs (${kgVal} kg)`;
  });

  const animatedProps = useAnimatedProps(() => ({ text: displayString.value }));
  const triggerHaptic = () => Haptics.selectionAsync();

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => { ctx.startX = translateX.value; },
    onActive: (event, ctx) => {
      let nextX = Math.max(0, Math.min(SLIDER_WIDTH, ctx.startX + event.translationX));
      const oldVal = Math.round(interpolate(translateX.value, [0, SLIDER_WIDTH], [0.2, 3.0], Extrapolate.CLAMP) * 4);
      const newVal = Math.round(interpolate(nextX, [0, SLIDER_WIDTH], [0.2, 3.0], Extrapolate.CLAMP) * 4);
      translateX.value = nextX;
      if (oldVal !== newVal) runOnJS(triggerHaptic)();
    },
    onEnd: (event) => {
      const finalSpeed = interpolate(translateX.value, [0, SLIDER_WIDTH], [0.2, 3.0], Extrapolate.CLAMP);
      runOnJS(setData)({ ...data, pace: Math.round(finalSpeed * 10) / 10 });
    }
  });

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - 15 }, { scale: 1.1 }],
  }));

  const startCalculation = async () => {
    setStep(5);
    progressPercent.value = 0;
    
    const finalAge = currentYear - YEARS[yearIdx];
    let finalHeight, finalWeight;
    if (unit === 'Metric') {
      finalHeight = CM_HEIGHTS[cmIdx];
      finalWeight = KG_WEIGHTS[kgIdx];
    } else {
      const totalInches = (ftLocal + 1) * 12 + incLocal;
      finalHeight = Math.round(totalInches * 2.54);
      finalWeight = Math.round(LB_WEIGHTS[lbsLocal] * 0.453592);
    }

    try {
      const res = await api.post('/users/calculate-plan', { 
        ...data, age: finalAge, height_cm: finalHeight, weight_kg: finalWeight, unit_preference: unit.toLowerCase() 
      });
      setCalculatedPlan(res.data.data.plan);
      setData(prev => ({ ...prev, age: finalAge, height_cm: finalHeight, weight_kg: finalWeight, unit_preference: unit.toLowerCase() }));
    } catch (err) { console.error(err); }

    progressPercent.value = withTiming(100, { duration: 5000 }, (finished) => {
      if (finished) runOnJS(setStep)(6);
    });
  };

  const handleUpdate = async () => {
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await api.post('/users/onboarding', { ...data, onboardingComplete: true });
      const me = await api.get('/users/me');
      setProfile(me.data.data.profile);
      setDailyTarget(me.data.data.daily_target);
      Alert.alert('Success', 'Plan updated!');
      navigation.navigate('Tabs');
    } catch (err) { Alert.alert('Error', 'Update failed'); }
    finally { setLoading(false); }
  };

  const currentActionLabel = (data.goal || 'fat_loss') === 'fat_loss' ? 'Lose' : 'Gain';

  const getStepUI = () => {
     switch(step) {
        case 0: return {
           title: "When were you born?",
           subtitle: "Your age helps us calculate your metabolism.",
           content: (
              <View style={styles.birthdayContainer}>
                 <View style={styles.pickersGrid}>
                    <WheelPicker items={MONTHS} selectedIndex={monthIdx} onSelect={setMonthIdx} style={{ flex: 1 }} />
                    <WheelPicker items={DAYS} selectedIndex={dayIdx} onSelect={setDayIdx} style={{ flex: 1 }} />
                    <WheelPicker items={YEARS} selectedIndex={yearIdx} onSelect={setYearIdx} style={{ flex: 1 }} />
                 </View>
                 <View style={styles.ageBadge}><Text style={styles.ageText}>{currentYear - YEARS[yearIdx]} years old</Text></View>
              </View>
           )
        };
        case 1: return {
           title: "Height & weight",
           subtitle: "This will be used to calibrate your custom plan.",
           content: (
              <View style={{ flex: 1 }}>
                <View style={[styles.toggleRow, { width: '100%', alignSelf: 'center' }]}>
                  <Text style={[styles.toggleText, unit === 'Imperial' && styles.activeToggle]}>Imperial</Text>
                  <UnitToggle units={['Imperial', 'Metric']} activeUnit={unit} onUnitChange={setUnit} type="switch" />
                  <Text style={[styles.toggleText, unit === 'Metric' && styles.activeToggle]}>Metric</Text>
                </View>
                <View style={styles.pickersContainer}>
                   <View style={styles.column}>
                      <Text style={styles.columnLabel}>Height</Text>
                      <View style={styles.pickerRow}>
                        {unit === 'Metric' ? <WheelPicker items={CM_HEIGHTS} selectedIndex={cmIdx} onSelect={setCmIdx} suffix=" cm" style={styles.largeWheel} /> :
                        <>
                          <WheelPicker items={FT_VALUES} selectedIndex={ftLocal} onSelect={setFtLocal} suffix=" ft" style={styles.smallWheel} />
                          <WheelPicker items={IN_VALUES} selectedIndex={incLocal} onSelect={setIncLocal} suffix=" in" style={styles.smallWheel} />
                        </>}
                      </View>
                   </View>
                   <View style={styles.column}>
                      <Text style={styles.columnLabel}>Weight</Text>
                      <View style={styles.pickerRow}>
                        <WheelPicker items={unit === 'Metric' ? KG_WEIGHTS : LB_WEIGHTS} selectedIndex={unit === 'Metric' ? kgIdx : lbsLocal} onSelect={unit === 'Metric' ? setKgIdx : setLbsLocal} suffix={unit === 'Metric' ? " kg" : " lb"} style={styles.largeWheel} />
                      </View>
                   </View>
                </View>
              </View>
           )
        };
        case 2: return {
           title: "Activity level?",
           subtitle: "This heavily impacts your calorie needs.",
           content: (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {ACTIVITIES.map(a => (
                  <TouchableOpacity key={a.id} style={[styles.activityItem, data.activity_level === a.id && styles.activeItem]} onPress={() => { Haptics.selectionAsync(); setData({ ...data, activity_level: a.id }); }}>
                    <MaterialCommunityIcons name={a.icon} size={24} color={data.activity_level === a.id ? '#FFF' : colors.textSecondary} />
                    <View><Text style={styles.itemTitle}>{a.title}</Text><Text style={styles.itemDesc}>{a.desc}</Text></View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
           )
        };
        case 3: return {
           title: "What's the goal?",
           subtitle: "Fat loss, maintenance, or muscle gain?",
           content: (
              <View style={{ gap: 16 }}>
                {GOALS.map(g => (
                  <TouchableOpacity key={g.id} style={[styles.activityItem, data.goal === g.id && styles.activeItem]} onPress={() => { Haptics.selectionAsync(); setData({ ...data, goal: g.id }); }}>
                    <View style={styles.gIconBox}><Ionicons name={g.icon} size={24} color={data.goal === g.id ? '#FFF' : colors.textSecondary} /></View>
                    <View><Text style={styles.itemTitle}>{g.title}</Text><Text style={styles.itemDesc}>{g.desc}</Text></View>
                  </TouchableOpacity>
                ))}
              </View>
           )
        };
        case 4: return {
           title: "How fast is the goal?",
           onBack: () => setStep(s => s - 1),
           content: (
              <View style={styles.speedContent}>
                <Text style={styles.speedLabel}>{currentActionLabel} weight speed per week</Text>
                
                <View style={styles.speedValueContainer}>
                  <AnimatedTextInput
                    underlineColorAndroid="transparent"
                    editable={false}
                    value={displayString.value}
                    style={styles.speedValueText}
                    animatedProps={animatedProps}
                  />
                </View>

                <View style={styles.sliderWrapper}>
                  <View style={styles.speedIconsRow}>
                     <Text style={styles.emojiText}>🐢</Text>
                     <Text style={styles.emojiText}>🐇</Text>
                     <Text style={styles.emojiText}>🐆</Text>
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
                  <Text style={styles.infoBoxTitle}>Expert Recommendation</Text>
                  <Text style={styles.infoBoxText}>
                    Setting a path between 0.5 - 1 kg per week is considered healthy and sustainable for long-term results.
                  </Text>
                </View>
              </View>
           )
        };
        case 5: return {
           title: "", subtitle: "", 
           content: (
              <View style={styles.loaderCenter}>
                 <Text style={styles.bigNum}>{percent}%</Text>
                 <Text style={styles.calcMsg}>Applying credentials</Text>
                 <View style={styles.barWrap}><Animated.View style={[styles.barFill, { width: `${progressPercent.value}%` }]} /></View>
                 <View style={styles.checklistCard}>
                    {CHECKLIST.map((item, i) => (
                      <View key={item} style={styles.checkLine}>
                         <Text style={styles.checkText}>• {item}</Text>
                         {completedIndex >= i && <Ionicons name="checkmark-circle" size={18} color="#FFF" />}
                      </View>
                    ))}
                 </View>
              </View>
           )
        };
        case 6: return {
           title: "Congratulations\nyour plan is ready!",
           subtitle: "Your new blueprint is calculated and ready to go.",
           content: (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.readyCard}>
                  <Text style={styles.readyCardTitle}>Daily Recommendation</Text>
                  <View style={styles.nutrientGrid}>
                    <NutrientTile label="Calories" value={Math.round(calculatedPlan?.calories || 0)} unit="" icon="flame" color={colors.accentOrange} />
                    <NutrientTile label="Carbs" value={Math.round(calculatedPlan?.carbs_g || 0)} unit="g" icon="leaf" color={colors.accentGreen} />
                    <NutrientTile label="Protein" value={Math.round(calculatedPlan?.protein_g || 0)} unit="g" icon="barbell" color={colors.accentPink} />
                    <NutrientTile label="Fats" value={Math.round(calculatedPlan?.fat_g || 0)} unit="g" icon="water" color={colors.accentPurple} />
                  </View>
                </View>
              </ScrollView>
           )
        };
     }
  };

  const ui = getStepUI();

  return (
    <>
      <OnboardingLayout
        title={ui.title} subtitle={ui.subtitle}
        onBack={step === 0 ? () => navigation.goBack() : (step < 5 ? () => setStep(s => s - 1) : null)}
        progress={step >= 5 ? 0.99 : (step + 1) / 6}
        scrollable={false}
        footer={step !== 5 && (
          <Button 
            title={step === 6 ? "Apply New Plan" : "Continue"} 
            onPress={() => {
              if (step === 4) startCalculation();
              else if (step === 6) handleUpdate();
              else setStep(s => s + 1);
            }}
            loading={loading && step === 6}
            style={styles.cta} 
          />
        )}
      >
        {ui.content}
      </OnboardingLayout>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.loadingText}>Applying your blueprint...</Text>
            <Text style={styles.loadingSubtext}>Persisting your new nutrition profile</Text>
          </View>
        </View>
      )}
    </>
  );
}

function NutrientTile({ label, value, unit, icon, color }) {
  return (
    <View style={styles.ntTile}>
      <View style={styles.ntHeader}><Ionicons name={icon} size={14} color={color} /><Text style={styles.ntLabel}>{label}</Text></View>
      <Text style={styles.ntValue}>{value}<Text style={styles.ntUnit}>{unit}</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  birthdayContainer: { flex: 1 },
  pickersGrid: { flexDirection: 'row', gap: 8, height: 260 },
  ageBadge: { alignItems: 'center', marginTop: 30 },
  ageText: { fontSize: 32, fontWeight: '800', color: colors.textPrimary },
  
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 40, gap: 12, backgroundColor: 'rgba(255,255,255,0.02)', paddingVertical: 12, borderRadius: 20 },
  toggleText: { fontSize: 16, fontWeight: '800', color: colors.textSecondary, width: 80, textAlign: 'center' },
  activeToggle: { color: colors.textPrimary },
  
  pickersContainer: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginTop: 20 },
  column: { alignItems: 'center' }, 
  columnLabel: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 32 },
  pickerRow: { flexDirection: 'row', gap: 12 }, 
  smallWheel: { width: 85, height: 280, flex: 0 }, 
  largeWheel: { width: 140, height: 280, flex: 0 },

  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCardSecondary, padding: 20, borderRadius: 28, borderWidth: 1, borderColor: colors.borderGray, gap: 16 },
  activeItem: { borderColor: colors.white },
  itemTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  itemDesc: { color: colors.textSecondary, fontSize: 13 },
  loaderCenter: { flex: 1, alignItems: 'center', paddingTop: 10 },
  bigNum: { fontSize: 64, fontWeight: '900', color: colors.textPrimary, marginBottom: 12 },
  calcMsg: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 40 },
  barWrap: { width: '100%', height: 12, backgroundColor: colors.bgCardSecondary, borderRadius: 6, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: colors.borderGray },
  barFill: { height: '100%', backgroundColor: colors.white },
  checklistCard: { backgroundColor: colors.bgCardSecondary, borderRadius: 32, padding: 24, width: '100%', borderWidth: 1, borderColor: colors.borderGray },
  checkLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  checkText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  readyCard: { backgroundColor: colors.bgCardSecondary, borderRadius: 32, padding: 24, width: '100%', borderWidth: 1, borderColor: colors.borderGray, marginTop: 20 },
  readyCardTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 20 },
  nutrientGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  ntTile: { width: '47%', backgroundColor: colors.bgBase, borderRadius: 20, padding: 16, gap: 8, borderWidth: 1, borderColor: colors.borderGray },
  ntHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ntLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  ntValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  ntUnit: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  cta: { marginBottom: 20, borderRadius: 100, height: 60 },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  loadingCard: { backgroundColor: colors.bgCardSecondary, padding: 40, borderRadius: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.borderGray, width: '85%' },
  loadingText: { color: '#FFF', fontSize: 20, fontWeight: '800', marginTop: 20, textAlign: 'center' },
  loadingSubtext: { color: colors.textSecondary, fontSize: 14, marginTop: 8, fontWeight: '600', textAlign: 'center' },

  // SPEED SCREEN EXACT STYLES
  speedContent: { flex: 1, alignItems: 'center', paddingTop: 20 },
  speedLabel: { fontSize: 16, color: colors.textSecondary, marginBottom: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  speedValueContainer: { height: 80, width: SW, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  speedValueText: { fontSize: 34, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', width: '100%' },
  sliderWrapper: { width: SLIDER_WIDTH + 30, marginBottom: 40 },
  speedIconsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  emojiText: { fontSize: 24 },
  trackContainer: { height: 40, justifyContent: 'center', position: 'relative' },
  trackBackground: { height: 10, backgroundColor: colors.bgCardSecondary, borderRadius: 5, width: SLIDER_WIDTH, alignSelf: 'center', borderWidth: 1, borderColor: colors.borderGray },
  thumb: { position: 'absolute', left: 15, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  label: { fontSize: 13, color: colors.textSecondary, fontWeight: '800', textTransform: 'uppercase' },
  infoBox: { backgroundColor: colors.bgCardSecondary, padding: 24, borderRadius: 24, width: '100%', borderWidth: 1, borderColor: colors.borderGray, marginTop: 20 },
  infoBoxTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  infoBoxText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, fontWeight: '500' },
});
