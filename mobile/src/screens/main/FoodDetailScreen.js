import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  useWindowDimensions, 
  Alert, 
  StatusBar, 
  Animated,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import api from '../../services/api';
import useToastStore from '../../store/toastStore';
import colors from '../../constants/colors';

const IMAGE_HEIGHT = 420;
const GAP = 12;

export default function FoodDetailScreen({ route, navigation }) {
  const { width, height } = useWindowDimensions();
  const PAGE_WIDTH = width - 48;
  const SNAP_INTERVAL = PAGE_WIDTH + GAP;
  const originalLog = route.params.log;
  const initialServing = parseFloat(originalLog.serving_count) || 1;
  const [log, setLog] = useState(originalLog);
  const [quantity, setQuantity] = useState(initialServing);
  const [activePage, setActivePage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const showToast = useToastStore((state) => state.show);
  
  // Always derive from the stored base values to avoid double-multiplication
  // Base = Total / Saved Serving Count
  const baseValues = React.useMemo(() => ({
    calories: (log.calories || 0) / initialServing,
    protein: (log.protein_g || 0) / initialServing,
    carbs: (log.carbs_g || 0) / initialServing,
    fat: (log.fat_g || 0) / initialServing,
    fiber: (log.fiber_g || 0) / initialServing,
    sugar: (log.sugar_g || 0) / initialServing,
    sodium: (log.sodium_mg || 0) / initialServing,
  }), [log.id]); // Recalculate only if starting from a fresh log
  
  const displayCalories = Math.round(baseValues.calories * quantity);
  const displayProtein = Math.round(baseValues.protein * quantity * 10) / 10;
  const displayCarbs = Math.round(baseValues.carbs * quantity * 10) / 10;
  const displayFat = Math.round(baseValues.fat * quantity * 10) / 10;
  const displayFiber = Math.round(baseValues.fiber * quantity * 10) / 10;
  const displaySugar = Math.round(baseValues.sugar * quantity * 10) / 10;
  const displaySodium = Math.round(baseValues.sodium * quantity);
  
  // Multiplier for individual ingredients
  const activeMultiplier = quantity / initialServing;

  const handleDeleteLog = async () => {
    Alert.alert('Delete Log', 'Are you sure you want to remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await api.delete(`/logs/${log.id}`);
            navigation.navigate('Home'); 
          } catch (err) {
            Alert.alert('Error', 'Failed to delete log');
          }
        }
      }
    ]);
  };

  const handleUpdateQuantity = (newVal) => {
    if (newVal < 0.5) return;
    setQuantity(newVal);
    setHasChanges(true); 
  };

  const handleRemoveIngredient = (index) => {
    const raw = { ...log.ai_raw_response };
    const items = [...raw.items_detected];
    const removedItem = items.splice(index, 1)[0];
    
    // Partially update the local log state (don't save to DB yet)
    const newLog = {
      ...log,
      calories: log.calories - (removedItem.calories || 0),
      protein_g: log.protein_g - (removedItem.protein_g || 0),
      carbs_g: log.carbs_g - (removedItem.carbs_g || 0),
      fat_g: log.fat_g - (removedItem.fat_g || 0),
      fiber_g: (log.fiber_g || 0) - (removedItem.fiber_g || 0),
      sugar_g: (log.sugar_g || 0) - (removedItem.sugar_g || 0),
      sodium_mg: (log.sodium_mg || 0) - (removedItem.sodium_mg || 0),
      ai_raw_response: { ...raw, items_detected: items }
    };
    
    setLog(newLog);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Apply the multiplier to the values before saving
      const finalPayload = {
        calories: displayCalories,
        protein_g: displayProtein,
        carbs_g: displayCarbs,
        fat_g: displayFat,
        fiber_g: displayFiber,
        sugar_g: displaySugar,
        sodium_mg: displaySodium,
        serving_count: quantity,
        ai_raw_response: log.ai_raw_response
      };

      const res = await api.put(`/logs/${log.id}`, finalPayload);
      if (res.data.success) {
        setLog(res.data.data);
        setHasChanges(false);
        showToast('Meal updated!', 'success');
      }
    } catch (err) {
      showToast('Failed to save changes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const renderRightActions = (progress, dragX, index) => {
    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
    });
    return (
      <TouchableOpacity 
        style={styles.deleteAction} 
        onPress={() => handleRemoveIngredient(index)}
      >
        <Animated.View style={[styles.actionIcon, { transform: [{ translateX: trans }] }]}>
          <Ionicons name="trash-outline" size={24} color="#FFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const onScrollMacros = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const page = Math.round(x / SNAP_INTERVAL);
    setActivePage(page);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={[styles.fixedImageContainer, { width, height: IMAGE_HEIGHT }]}>
        <Image source={{ uri: log.image_url }} style={styles.heroImage} resizeMode="cover" />
      </View>

      <SafeAreaView style={styles.headerAbsolute} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Selected food</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.circleBtn}>
              <Ionicons name="share-outline" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn} onPress={handleDeleteLog}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        bounces={true} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: IMAGE_HEIGHT - 40 }} />

        <View style={[styles.card, { minHeight: height - 60 }]}>
          <View style={styles.badgeRow}>
             <View style={styles.bookmarkBox}>
                <Ionicons name="bookmark" size={18} color="#FFF" />
             </View>
             <View style={styles.timeBadge}>
                <Text style={styles.timeText}>
                   {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
             </View>
          </View>

          <View style={styles.titleRow}>
            <Text style={styles.foodName} numberOfLines={2}>{log.food_name}</Text>
            <View style={styles.qtyPill}>
              <TouchableOpacity onPress={() => handleUpdateQuantity(quantity - 1)} style={styles.qtyControl}>
                <Ionicons name="remove" size={18} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity onPress={() => handleUpdateQuantity(quantity + 1)} style={styles.qtyControl}>
                <Ionicons name="add" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.carouselContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={SNAP_INTERVAL}
              snapToAlignment="start"
              decelerationRate="fast"
              onScroll={onScrollMacros}
              scrollEventThrottle={16}
              contentContainerStyle={styles.carouselContent}
            >
              <View style={[styles.carouselPage, { width: PAGE_WIDTH }]}>
                <View style={styles.caloriesHeroCard}>
                  <View style={styles.calIconBox}>
                      <Ionicons name="flame" size={20} color="#FFF" />
                  </View>
                  <View style={styles.calTextGroup}>
                      <Text style={styles.calLabel}>Calories</Text>
                      <Text style={styles.calValue}>{displayCalories}</Text>
                  </View>
                </View>

                <View style={styles.macrosRow}>
                  <MacroMiniCard label="Protein" value={displayProtein} unit="g" icon="food-drumstick" color={colors.accentGreen} />
                  <MacroMiniCard label="Carbs" value={displayCarbs} unit="g" icon="leaf" color={colors.accentGold} />
                  <MacroMiniCard label="Fats" value={displayFat} unit="g" icon="opacity" color={colors.accentPink} />
                </View>
              </View>

              <View style={[styles.carouselPage, { width: PAGE_WIDTH }]}>
                <View style={styles.macrosRow}>
                   <MacroMiniCard label="Fiber" value={displayFiber} unit="g" icon="blur" color={colors.accentPurple} />
                   <MacroMiniCard label="Sugar" value={displaySugar} unit="g" icon="shimmer" color={colors.accentPink} />
                   <MacroMiniCard label="Sodium" value={displaySodium} unit="mg" icon="shaker-outline" color={colors.accentGold} />
                </View>
                
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Health Summary</Text>
                    <Text style={styles.summaryText}>
                      This {log.food_name} contains {displayProtein}g protein. {displayFiber > 3 ? 'Good fiber content!' : 'Consider adding more fiber.'}
                    </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.paginationDots}>
              <View style={[styles.dot, activePage === 0 && styles.activeDot]} />
              <View style={[styles.dot, activePage === 1 && styles.activeDot]} />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <TouchableOpacity style={styles.addBtn}>
                <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ingredientsList}>
            {log.ai_raw_response?.items_detected?.map((item, idx) => (
              <View key={`${idx}-${item.name}`} style={styles.swipeWrapper}>
                <Swipeable
                  renderRightActions={(p, d) => renderRightActions(p, d, idx)}
                  overshootRight={false}
                >
                  <View style={styles.ingredientRow}>
                    <View style={styles.ingredientIconBox}>
                        <MaterialCommunityIcons name="food-apple-outline" size={24} color="#FFF" />
                    </View>
                    <View style={styles.ingInfo}>
                      <Text style={styles.ingName}>{item.name}</Text>
                      <Text style={styles.ingMeta}>
                        {Math.round(item.calories * activeMultiplier)} cal • {item.quantity_description || '1 serving'}
                      </Text>
                      
                      <View style={styles.ingMacrosRow}>
                         <View style={styles.ingMacro}>
                            <MaterialCommunityIcons name="food-drumstick" size={12} color={colors.accentGreen} />
                            <Text style={styles.ingMacroText}>{Math.round(item.protein_g * activeMultiplier)}g</Text>
                         </View>
                         <View style={styles.ingMacro}>
                            <MaterialCommunityIcons name="leaf" size={12} color={colors.accentGold} />
                            <Text style={styles.ingMacroText}>{Math.round(item.carbs_g * activeMultiplier)}g</Text>
                         </View>
                         <View style={styles.ingMacro}>
                            <MaterialCommunityIcons name="opacity" size={12} color={colors.accentPink} />
                            <Text style={styles.ingMacroText}>{Math.round(item.fat_g * activeMultiplier)}g</Text>
                         </View>
                      </View>
                    </View>
                  </View>
                </Swipeable>
              </View>
            ))}
          </View>

          <View style={styles.feedbackCard}>
             <View style={styles.feedbackLeft}>
                <MaterialCommunityIcons name="star-four-points" size={20} color="#FFF" />
                <Text style={styles.feedbackPrompt}>How did Roz do?</Text>
             </View>
             <View style={styles.thumbGroup}>
                <TouchableOpacity style={styles.thumbBtn}>
                    <Ionicons name="thumbs-down-outline" size={18} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.thumbBtn}>
                    <Ionicons name="thumbs-up-outline" size={18} color="#FFF" />
                </TouchableOpacity>
             </View>
          </View>
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Fixed Sticky Footer */}
      <View style={styles.footerSticky}>
        <SafeAreaView edges={['bottom']}>
          <View style={styles.footerRow}>
            {hasChanges ? (
              <TouchableOpacity 
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.bgBase} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={colors.bgBase} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.fixBtn}
                  onPress={() => navigation.navigate('FixResult', { log })}
                >
                  <MaterialCommunityIcons name="creation" size={20} color="#FFF" />
                  <Text style={styles.fixBtnText}>Fix Results</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.doneBtn}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </View>
    </GestureHandlerRootView>
  );
}

function MacroMiniCard({ label, value, unit, icon, color }) {
  return (
    <View style={styles.macroMiniCard}>
        <View style={styles.macroHeader}>
           <MaterialCommunityIcons name={icon} size={14} color={color} />
           <Text style={styles.macroLabel}>{label}</Text>
        </View>
        <Text style={styles.macroValue}>{value}{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1a23' },
  fixedImageContainer: { position: 'absolute', top: 0 },
  heroImage: { width: '100%', height: '100%' },
  headerAbsolute: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 60 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  circleBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  headerRight: { flexDirection: 'row', gap: 8 },
  
  scrollContent: { paddingTop: 0 },
  card: { backgroundColor: '#1e1a23', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24 },
  
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  bookmarkBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
  timeBadge: { backgroundColor: '#2C2C2E', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100 },
  timeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  foodName: { flex: 1, fontSize: 26, fontWeight: '800', color: '#FFF', marginRight: 12, letterSpacing: -0.5 },
  qtyPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1a23', borderRadius: 100, padding: 2, borderWidth: 1, borderColor: colors.borderGray, height: 42 },
  qtyControl: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  qtyValue: { color: '#FFF', fontSize: 16, fontWeight: '800', marginHorizontal: 10 },

  carouselContainer: { marginBottom: 20 },
  carouselContent: { gap: GAP },
  carouselPage: { gap: 10 },

  caloriesHeroCard: { backgroundColor: '#1e1a23', borderRadius: 22, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.borderGray, width: '100%' },
  calIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
  calTextGroup: { gap: -2 },
  calLabel: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  calValue: { color: '#FFF', fontSize: 26, fontWeight: '900' },

  macrosRow: { flexDirection: 'row', gap: 8, width: '100%' },
  macroMiniCard: { flex: 1, backgroundColor: '#1e1a23', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.borderGray, gap: 4 },
  macroHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  macroLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '600' },
  macroValue: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  summaryCard: { backgroundColor: '#1e1a23', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: colors.borderGray, height: 110, justifyContent: 'center' },
  summaryTitle: { color: '#FFF', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  summaryText: { color: '#9CA3AF', fontSize: 12, lineHeight: 18, fontWeight: '500' },

  paginationDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#333' },
  activeDot: { backgroundColor: '#FFF' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  addBtn: { flexDirection: 'row', alignItems: 'center' },
  addBtnText: { color: '#9CA3AF', fontSize: 14, fontWeight: '700' },

  ingredientsList: { gap: 12, marginBottom: 24 },
  swipeWrapper: { backgroundColor: '#252538', borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderGray, marginBottom: 12 },
  ingredientRow: { backgroundColor: '#1e1a23', padding: 12, flexDirection: 'row', alignItems: 'center' },
  ingredientIconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center' },
  ingInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  ingName: { color: '#FFF', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  ingMeta: { color: '#6A6A6E', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  
  ingMacrosRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ingMacro: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ingMacroText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },

  deleteAction: { backgroundColor: 'rgba(255, 69, 58, 0.15)', justifyContent: 'center', alignItems: 'center', width: 80, height: '100%' },
  actionIcon: { alignItems: 'center' },

  feedbackCard: { backgroundColor: '#1e1a23', borderRadius: 100, padding: 6, paddingLeft: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.borderGray, marginBottom: 20 },
  feedbackLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackPrompt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  thumbGroup: { flexDirection: 'row', gap: 6 },
  thumbBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },

  footerSticky: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1e1a23', borderTopWidth: 1, borderTopColor: colors.borderGray },
  footerRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  fixBtn: { flex: 1, height: 52, borderRadius: 100, backgroundColor: '#1e1a23', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.borderGray },
  fixBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  doneBtn: { flex: 1, height: 52, borderRadius: 100, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  doneBtnText: { color: '#000', fontSize: 15, fontWeight: '900' },

  saveBtn: { flex: 1, height: 52, borderRadius: 100, backgroundColor: colors.accentGreen, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  saveBtnText: { color: colors.bgBase, fontSize: 17, fontWeight: '900' },
});
