import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import colors from '../../constants/colors';

const { width } = Dimensions.get('window');

export default function ProgressGraphScreen({ navigation }) {
  const data = {
    labels: ['', '', '', '', ''],
    datasets: [
      {
        data: [100, 90, 70, 95, 105], // Traditional: Yo-yo (Drawn first, behind)
        color: (opacity = 1) => `rgba(139, 92, 246, ${opacity * 0.4})`, // Purple
        strokeWidth: 2,
      },
      {
        data: [100, 95, 75, 45, 35], // Roz: Steady decline (Drawn second, on top)
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, 
        strokeWidth: 4,
      }
    ],
  };

  const chartConfig = {
    backgroundColor: colors.bgCardSecondary,
    backgroundGradientFrom: colors.bgCardSecondary,
    backgroundGradientTo: colors.bgCardSecondary,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
    propsForDots: {
      r: '0', 
    },
    useShadowColorFromDataset: false,
    propsForBackgroundLines: {
      strokeDasharray: '5, 5', 
      stroke: 'rgba(255,255,255,0.05)',
    },
    fillShadowGradient: colors.white,
    fillShadowGradientOpacity: 0.05,
  };

  return (
    <OnboardingLayout
      title={`Roz creates\nlong-term results.`}
      onBack={() => navigation.goBack()}
      progress={0.2}
      footer={
        <Button 
           title="Continue" 
           onPress={() => navigation.navigate('HeightWeight')} 
           style={styles.button} 
        />
      }
    >
      <View style={styles.content}>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Your weight</Text>
          
          <View style={styles.chartWrapper}>
            <LineChart
              data={data}
              width={width - 64} 
              height={200}
              chartConfig={chartConfig}
              bezier
              withInnerLines={true}
              withOuterLines={false}
              withHorizontalLabels={false}
              withVerticalLabels={false}
              style={styles.chart}
              segments={2}
            />
            
            {/* Start point dot - positioned specifically to avoid overflow */}
            <View style={[styles.endpointDot, { top: 34, left: 0 }]}>
               <View style={styles.dotInner} />
            </View>

            {/* End point dot - positioned specifically for Roz line end */}
            <View style={[styles.endpointDot, { bottom: 18, right: 0 }]}>
               <View style={styles.dotInner} />
            </View>

            {/* Labels overlay */}
            <View style={[styles.labelPos, { top: 85, right: 10 }]}>
              <Text style={styles.tradLabel}>Traditional diet</Text>
            </View>

            <View style={styles.rozLabelRow}>
               <View style={styles.rozIconCircle}>
                 <Text style={{ fontSize: 8 }}>🛡️</Text>
               </View>
               <Text style={styles.rozText}>Roz</Text>
               <View style={styles.weightTag}>
                 <Text style={styles.weightTagText}>Weight</Text>
               </View>
            </View>
          </View>

          <View style={styles.xAxis}>
            <Text style={styles.xLabel}>Month 1</Text>
            <Text style={styles.xLabel}>Month 6</Text>
          </View>
        </View>

        <View style={styles.footerTextContainer}>
           <Text style={styles.statText}>
             <Text style={styles.boldWhite}>80% of Roz users</Text> maintain their{'\n'}weight loss even 6 months later.
           </Text>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { marginTop: 20 },
  chartCard: {
    backgroundColor: colors.bgCardSecondary,
    borderRadius: 32,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  chartTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 20 },
  chartWrapper: { position: 'relative', width: '100%' },
  chart: { paddingRight: 0, marginLeft: -24 },
  labelPos: { position: 'absolute' },
  tradLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  rozLabelRow: { 
    position: 'absolute', 
    bottom: 18, 
    left: 0, 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 6
  },
  rozIconCircle: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  rozText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  weightTag: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  weightTagText: { color: colors.textSecondary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  endpointDot: { 
    position: 'absolute', 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    backgroundColor: colors.white, 
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 10,
  },
  dotInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.bgCardSecondary },
  xAxis: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10
  },
  xLabel: { fontSize: 14, color: colors.textPrimary, fontWeight: '800' },
  footerTextContainer: { marginTop: 40, paddingHorizontal: 20 },
  statText: { fontSize: 18, color: colors.textSecondary, textAlign: 'center', lineHeight: 26, fontWeight: '500' },
  boldWhite: { color: colors.textPrimary, fontWeight: '800' },
  button: { marginBottom: 20, borderRadius: 100, height: 60 },
});
