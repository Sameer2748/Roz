import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import colors from '../../constants/colors';

const { width } = Dimensions.get('window');

export default function ProgressGraphScreen({ navigation }) {
  const data = {
    labels: ['1', '2', '3', '4', '5'],
    datasets: [
      {
        data: [100, 85, 75, 68, 62],
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        strokeWidth: 4,
      },
      {
        data: [100, 95, 92, 90, 88], // Slower comparison
        color: (opacity = 1) => `rgba(200, 200, 200, ${opacity})`,
        strokeWidth: 2,
      }
    ],
  };

  const chartConfig = {
    backgroundColor: '#F9FAFB',
    backgroundGradientFrom: '#F9FAFB',
    backgroundGradientTo: '#F9FAFB',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(153, 153, 153, ${opacity})`,
    propsForDots: { r: '0' },
  };

  return (
    <OnboardingLayout
      title={`Roz creates\nlong-term results.`}
      onBack={() => navigation.goBack()}
      progress={0.25}
      footer={
        <Button title="Continue" onPress={() => navigation.navigate('HeightWeight')} style={styles.button} />
      }
    >
      <View style={styles.content}>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Your weight</Text>
          
          <View style={styles.chartWrapper}>
            <LineChart
              data={data}
              width={width - 50}
              height={180}
              chartConfig={chartConfig}
              bezier
              withInnerLines={false}
              withOuterLines={false}
              withHorizontalLabels={false}
              withVerticalLabels={false}
              style={styles.chart}
            />
            {/* Legend marker */}
            <View style={styles.markerContainer}>
              <View style={styles.markerBadge}>
                <View style={styles.dot} />
                <Text style={styles.markerText}>Roz</Text>
              </View>
            </View>
          </View>

          <View style={styles.chartBottom}>
            <Text style={styles.monthLabel}>Month 1</Text>
          </View>
        </View>

        <View style={styles.footer}>
           <Text style={styles.percentageText}>
             <Text style={styles.highlight}>80% of Roz users</Text> lose weight in their first month.
           </Text>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { marginTop: 20 },
  chartCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 32,
    padding: 24,
    paddingRight: 0, // Chart has internal padding
    width: '100%',
  },
  chartTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 10 },
  chartWrapper: { position: 'relative' },
  chart: { paddingRight: 0, marginLeft: -20 },
  markerContainer: { 
    position: 'absolute',
    top: 80,
    left: 40,
  },
  markerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'black', marginRight: 4 },
  markerText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  chartBottom: { marginTop: 10, width: '100%', paddingRight: 24, alignItems: 'center' },
  monthLabel: { fontSize: 13, color: colors.textTertiary, fontWeight: '700' },
  footer: { marginTop: 40, width: '100%', paddingHorizontal: 20 },
  percentageText: { fontSize: 18, color: colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  highlight: { color: colors.textPrimary, fontWeight: '800' },
  spacer: { flex: 1, minHeight: 40 },
  button: { marginBottom: 20, borderRadius: 100 },
});
