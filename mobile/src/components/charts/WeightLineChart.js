import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import colors from '../../constants/colors';

const { width: screenWidth } = Dimensions.get('window');
const CHART_WIDTH = screenWidth - 88; // Accounting for screen padding (20x2) and card padding (24x2)

export default function WeightLineChart({ data = [], targetWeight }) {
  if (data.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Record 2+ weight logs to view chart</Text>
      </View>
    );
  }

  // Reverse data because history comes descending, but chart needs ascending time
  const sorted = [...data].sort((a,b) => new Date(a.logged_at) - new Date(b.logged_at));
  const recent = sorted.slice(-7);

  const labels = recent.map(d => {
    const date = new Date(d.logged_at);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const values = recent.map(d => parseFloat(d.weight_kg));

  const datasets = [{ 
    data: values, 
    strokeWidth: 3, 
    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})` // accentPurple 
  }];
  
  if (targetWeight) {
    datasets.push({
      data: Array(values.length).fill(targetWeight),
      strokeWidth: 1,
      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.2})`, // target line
      withDots: false,
    });
  }

  return (
    <View style={styles.container}>
      <LineChart
        data={{ labels, datasets }}
        width={CHART_WIDTH}
        height={180}
        chartConfig={{
          backgroundColor: '#1e1a23',
          backgroundGradientFrom: '#1e1a23',
          backgroundGradientTo: '#1e1a23',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.4})`,
          propsForBackgroundLines: {
            stroke: 'rgba(255, 255, 255, 0.05)',
            strokeDasharray: '4',
          },
          propsForDots: {
            r: '5',
            strokeWidth: '2',
            stroke: '#1e1a23',
          },
        }}
        style={styles.chart}
        bezier
        withInnerLines={true}
        withOuterLines={false}
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
    marginTop: 10,
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
