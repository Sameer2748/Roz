import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import colors from '../../constants/colors';

const { width: screenWidth } = Dimensions.get('window');
const CHART_WIDTH = screenWidth - 88; // Accounting for 20px screen padding + 24px card padding on each side

export default function CalorieBarChart({ data = [], target = 2000 }) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data yet</Text>
      </View>
    );
  }

  const labels = data.map(d => {
    const date = new Date(d.date);
    return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
  });

  const values = data.map(d => Math.round(parseFloat(d.calories || 0)));

  return (
    <View style={styles.container}>
      <BarChart
        data={{
          labels,
          datasets: [{ data: values }],
        }}
        width={CHART_WIDTH}
        height={180}
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#1e1a23',
          backgroundGradientFrom: '#1e1a23',
          backgroundGradientTo: '#1e1a23',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`, // accentGold
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.5})`,
          barPercentage: 0.6,
          style: {
            borderRadius: 16,
          },
          propsForBackgroundLines: {
            stroke: 'rgba(255, 255, 255, 0.05)',
            strokeDasharray: '', // solid background lines
          },
        }}
        style={styles.chart}
        fromZero
        showValuesOnTopOfBars
        flatColor={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    borderRadius: 24,
    paddingRight: 0,
    paddingLeft: 0,
  },
  empty: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
  },
  emptyText: {
    color: '#6A6A6E',
    fontSize: 14,
    fontWeight: '600',
  },
});
