import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';
import colors from '../../constants/colors';

const { width: SW } = Dimensions.get('window');

export default function GreatPotentialScreen({ navigation }) {
  const { onboardingData } = useUserStore();
  const goal = onboardingData.goal === 'fat_loss' ? 'loss' : 'gain';

  return (
    <OnboardingLayout
      onBack={() => navigation.goBack()}
      progress={0.8}
    >
      <View style={styles.content}>
        <Text style={styles.title}>You have great potential to crush your goal</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your weight transition</Text>
          
          <View style={styles.graphContainer}>
            {/* Simple representation of the curved graph in the image */}
            <View style={styles.graphLines}>
               {/* Vertical Grid Lines */}
               <View style={styles.gridLine} />
               <View style={styles.gridLine} />
               <View style={styles.gridLine} />
            </View>
            
            <View style={styles.curveContainer}>
               {/* This would be an SVG in a real app, using View for now */}
               <View style={[styles.curve, goal === 'gain' ? styles.curveUp : styles.curveDown]} />
               
               {/* Points */}
               <View style={[styles.point, { left: '10%', bottom: goal === 'gain' ? '20%' : '80%' }]} />
               <View style={[styles.point, { left: '40%', bottom: goal === 'gain' ? '30%' : '70%' }]} />
               <View style={[styles.point, { left: '80%', bottom: goal === 'gain' ? '70%' : '30%' }]} />
               
               {/* Float Label */}
               <View style={[styles.floatLabel, { right: '10%', top: goal === 'gain' ? '20%' : '60%' }]}>
                  <Ionicons name="caret-down" size={12} color="#D97706" />
               </View>
            </View>
          </View>

          <View style={styles.timeLabels}>
            <Text style={styles.timeLabel}>3 Days</Text>
            <Text style={styles.timeLabel}>7 Days</Text>
            <Text style={styles.timeLabel}>30 Days</Text>
          </View>

          <Text style={styles.cardFooter}>
            Based on Roz's historical data, weight {goal} is usually delayed at first, but after 7 days, you can reach your goal quickly!
          </Text>
        </View>
      </View>

      <View style={styles.spacer} />

      <Button 
        title="Continue" 
        onPress={() => navigation.navigate('HealthConnect')} 
        style={styles.button}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingTop: 20 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: 32, paddingHorizontal: 10 },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.textSecondary, marginBottom: 20 },
  graphContainer: { height: 180, position: 'relative', marginBottom: 20 },
  graphLines: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  gridLine: { width: 1, backgroundColor: '#E5E7EB', height: '100%' },
  curveContainer: { ...StyleSheet.absoluteFillObject },
  curve: {
    position: 'absolute', left: '0%', right: '0%',
    height: 120, borderTopWidth: 3, borderColor: '#D97706',
    borderTopLeftRadius: 100, borderTopRightRadius: 20, // Simplified curve
  },
  curveUp: { bottom: 0, borderTopWidth: 0, borderBottomWidth: 3, borderBottomRightRadius: 100 },
  curveDown: { top: 40 },
  point: {
    position: 'absolute', width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#FFF', borderWidth: 2, borderColor: '#D97706',
  },
  floatLabel: { position: 'absolute' },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 24 },
  timeLabel: { fontSize: 12, fontWeight: '700', color: colors.textTertiary },
  cardFooter: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, textAlign: 'center' },
  spacer: { flex: 1 },
  button: { marginBottom: 20, borderRadius: 100 },
});
