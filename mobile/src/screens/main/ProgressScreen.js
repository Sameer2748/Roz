import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CalorieBarChart from '../../components/charts/CalorieBarChart';
import WeightLineChart from '../../components/charts/WeightLineChart';
import MacroStackedBar from '../../components/charts/MacroStackedBar';
import CalendarHeatmap from '../../components/charts/CalendarHeatmap';
import api from '../../services/api';
import useUserStore from '../../store/userStore';
import useToastStore from '../../store/toastStore';
import colors from '../../constants/colors';

const TABS = ['Week', 'Month', 'All Time'];

export default function ProgressScreen() {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState(0);
  const [weeklyData, setWeeklyData] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [weightInput, setWeightInput] = useState('');
  const [loading, setLoading] = useState(true);
  const { streak, dailyTarget } = useUserStore();
  const showToast = useToastStore((state) => state.show);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [weekRes, weightRes] = await Promise.all([
        api.get('/stats/weekly'),
        api.get('/weight/history?limit=30'),
      ]);
      setWeeklyData(weekRes.data.data.days || []);
      setWeightData(weightRes.data.data || []);
    } catch (err) {
      showToast('Could not fetch latest stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  const logWeight = async () => {
    const kg = parseFloat(weightInput);
    if (!kg || kg <= 0) return;
    try {
      await api.post('/weight', { weight_kg: kg });
      setWeightInput('');
      fetchData();
      showToast('Weight updated!', 'success');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update weight';
      showToast(msg, 'error');
    }
  };

  const avgProtein = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((s, d) => s + parseFloat(d.protein_g || 0), 0) / weeklyData.length)
    : 0;
  const avgCarbs = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((s, d) => s + parseFloat(d.carbs_g || 0), 0) / weeklyData.length)
    : 0;
  const avgFat = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((s, d) => s + parseFloat(d.fat_g || 0), 0) / weeklyData.length)
    : 0;

  const currentWeight = weightData.length > 0 ? parseFloat(weightData[0].weight_kg) : null;
  const prevWeight = weightData.length > 1 ? parseFloat(weightData[1].weight_kg) : null;
  const trend = currentWeight && prevWeight ? currentWeight - prevWeight : 0;

  const alreadyLoggedToday = weightData.length > 0 && 
    new Date(weightData[0].logged_at).toDateString() === new Date().toDateString();

  const consistencyScore = weeklyData.length > 0 
    ? Math.round((weeklyData.filter(d => Math.abs(d.calories - dailyTarget.calories) < 200).length / weeklyData.length) * 100)
    : 0;

  const heatmapData = {};
  weeklyData.forEach((d) => {
    heatmapData[d.date] = d.meal_count || 0;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1e1a23' }]} />
      
      <LinearGradient
        colors={['#372f38', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.8 }}
        style={{ position: 'absolute', top: 0, left: 0, width: width, height: 400 }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.brandRow}>
           <Text style={styles.title}>Progress</Text>
           <View style={styles.streakBadge}>
              <Ionicons name="flame" size={16} color={colors.accentOrange} />
              <Text style={styles.streakText}>{streak.current_streak || 0}</Text>
           </View>
        </View>

        {loading ? (
          <View style={styles.center}>
             <ActivityIndicator size="large" color={colors.white} />
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scroll} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.tabBar}>
              {TABS.map((tab, i) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === i && styles.tabActive]}
                  onPress={() => setActiveTab(i)}
                >
                  <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.statsGrid}>
               <View style={styles.statMiniCard}>
                  <Text style={styles.miniLabel}>Consistency</Text>
                  <Text style={[styles.miniValue, { color: '#FFF' }]}>{consistencyScore}%</Text>
               </View>
               <View style={styles.statMiniCard}>
                  <Text style={styles.miniLabel}>Goal Trend</Text>
                  <Text style={[styles.miniValue, { color: trend <= 0 ? colors.accentGreen : colors.danger }]}>
                    {trend <= 0 ? 'Optimal' : 'Rising'}
                  </Text>
               </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardLabel}>Current Weight</Text>
                  <Text style={styles.cardValue}>
                    {currentWeight || '--'} <Text style={styles.unitText}>kg</Text>
                  </Text>
                </View>
                {trend !== 0 && (
                  <View style={[styles.trendBadge, trend < 0 ? styles.trendDown : styles.trendUp]}>
                    <Ionicons name={trend < 0 ? "trending-down" : "trending-up"} size={16} color={trend < 0 ? colors.accentGreen : colors.danger} />
                    <Text style={[styles.trendText, { color: trend < 0 ? colors.accentGreen : colors.danger }]}>
                      {Math.abs(trend).toFixed(1)} kg
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.chartWrapper}>
                 <WeightLineChart data={weightData} targetWeight={dailyTarget?.target_weight_kg} />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                 <Text style={styles.cardLabel}>Calorie Trends</Text>
                 <MaterialCommunityIcons name="lightning-bolt" size={20} color={colors.accentGold} />
              </View>
              <View style={styles.chartWrapper}>
                 <CalorieBarChart data={weeklyData} target={dailyTarget?.calories} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Average Nutrition Split</Text>
              <View style={styles.macroChartContainer}>
                <MacroStackedBar protein={avgProtein} carbs={avgCarbs} fat={avgFat} />
              </View>
              <View style={styles.macroLabels}>
                <MacroLabel dot={colors.accentGreen} label="P" val={`${avgProtein}g`} />
                <MacroLabel dot={colors.accentGold} label="C" val={`${avgCarbs}g`} />
                <MacroLabel dot={colors.accentPink} label="F" val={`${avgFat}g`} />
              </View>
            </View>

            <View style={[styles.logWeightCard, alreadyLoggedToday && styles.lockedCard]}>
              <View style={styles.logWeightLeft}>
                 <Text style={styles.logTitle}>{alreadyLoggedToday ? 'Daily Check-in' : 'Update Weight'}</Text>
                 <Text style={styles.logSub}>{alreadyLoggedToday ? 'You are all set for today!' : 'Record today\'s check-in'}</Text>
              </View>
              {alreadyLoggedToday ? (
                <View style={styles.doneCheck}>
                   <Ionicons name="checkmark-circle" size={28} color={colors.accentGreen} />
                </View>
              ) : (
                <View style={styles.weightInputRow}>
                  <TextInput
                    placeholder="00.0"
                    value={weightInput}
                    onChangeText={setWeightInput}
                    keyboardType="decimal-pad"
                    style={styles.weightInput}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                  <TouchableOpacity style={styles.saveBtn} onPress={logWeight}>
                    <Ionicons name="add" size={24} color={colors.black} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

function MacroLabel({ dot, label, val }) {
  return (
    <View style={styles.macroLabelRow}>
       <View style={[styles.macroDot, { backgroundColor: dot }]} />
       <Text style={styles.macroLabelText}>{label}: <Text style={styles.macroValText}>{val}</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1a23' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 16, paddingTop: 10 },
  
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, gap: 4, borderWidth: 1, borderColor: colors.borderGray },
  streakText: { fontSize: 16, fontWeight: '800', color: '#FFF' },

  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 100, padding: 4, marginBottom: 28, borderWidth: 1, borderColor: colors.borderGray },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 100, alignItems: 'center' },
  tabActive: { backgroundColor: '#FFF' },
  tabText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase' },
  tabTextActive: { color: colors.black },

  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statMiniCard: { flex: 1, backgroundColor: '#1e1a23', borderRadius: 28, padding: 18, borderWidth: 1, borderColor: colors.borderGray },
  miniLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 },
  miniValue: { fontSize: 20, fontWeight: '900' },

  card: { backgroundColor: '#1e1a23', borderRadius: 28, padding: 24, marginBottom: 12, borderWidth: 1, borderColor: colors.borderGray },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardLabel: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  cardValue: { fontSize: 38, fontWeight: '900', color: '#FFF', marginTop: 4, letterSpacing: -1 },
  unitText: { fontSize: 18, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  
  trendBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4, backgroundColor: 'rgba(255,255,255,0.05)' },
  trendText: { fontSize: 14, fontWeight: '900' },
  chartWrapper: { height: 180, width: '100%', marginTop: 10 },

  macroChartContainer: { marginVertical: 10 },
  macroLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  macroLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroLabelText: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
  macroValText: { color: '#FFF' },

  logWeightCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#1e1a23', 
    borderRadius: 28, 
    padding: 24, 
    marginBottom: 24, 
    borderWidth: 1, 
    borderColor: colors.borderGray,
  },
  logWeightLeft: { flex: 1 },
  logTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', marginBottom: 2 },
  logSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
  lockedCard: { opacity: 0.6 },
  doneCheck: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  weightInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weightInput: { 
    width: 80, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    height: 48, 
    borderRadius: 14, 
    paddingHorizontal: 12, 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: '800',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.borderGray
  },
  saveBtn: { 
    backgroundColor: colors.white, 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});
