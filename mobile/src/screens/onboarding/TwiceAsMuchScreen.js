import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';
import colors from '../../constants/colors';

export default function TwiceAsMuchScreen({ navigation }) {
  const { onboardingData } = useUserStore();
  const goal = onboardingData.goal === 'fat_loss' ? 'Lose' : 'Gain';

  return (
    <OnboardingLayout
      onBack={() => navigation.goBack()}
      progress={0.6}
    >
      <View style={styles.center}>
        <Text style={styles.title}>
          {goal} twice as much weight with Roz vs on your own
        </Text>

        <View style={styles.chart}>
          <View style={styles.barGroup}>
            <View style={styles.barWrapper}>
              <View style={[styles.bar, styles.grayBar, { height: '30%' }]} />
              <Text style={styles.barVal}>20%</Text>
            </View>
            <Text style={styles.barLabel}>Without{"\n"}Roz</Text>
          </View>

          <View style={styles.barGroup}>
            <View style={styles.barWrapper}>
              <View style={[styles.bar, styles.blackBar, { height: '80%' }]} />
              <Text style={styles.barVal}>2X</Text>
            </View>
            <Text style={styles.barLabel}>With{"\n"}Roz</Text>
          </View>
        </View>
        
        <Text style={styles.subtext}>
          Roz makes it easy and holds you accountable.
        </Text>
      </View>

      <View style={styles.spacer} />

      <Button 
        title="Continue" 
        onPress={() => navigation.navigate('Obstacles')} 
        style={styles.button}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 36,
    marginBottom: 40,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 240,
    alignItems: 'flex-end',
    marginBottom: 40,
    paddingHorizontal: 30,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingVertical: 30,
  },
  barGroup: {
    alignItems: 'center',
    width: 100,
  },
  barWrapper: {
    height: 140,
    width: 60,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },
  bar: {
    width: '100%',
    borderRadius: 12,
  },
  grayBar: {
    backgroundColor: '#E5E7EB',
  },
  blackBar: {
    backgroundColor: '#000',
  },
  barVal: {
    position: 'absolute',
    top: '50%',
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  subtext: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 20,
  },
  spacer: {
    flex: 1,
  },
  button: {
    marginBottom: 20,
    borderRadius: 100,
  },
});
