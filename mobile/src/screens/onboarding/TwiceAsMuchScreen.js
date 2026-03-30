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
      progress={0.75}
      footer={
        <Button 
          title="Continue" 
          onPress={() => navigation.navigate('Obstacles')} 
          style={styles.button}
        />
      }
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
              <View style={[styles.bar, styles.whiteBar, { height: '80%' }]} />
              <Text style={styles.barValHighlight}>2X</Text>
            </View>
            <Text style={styles.barLabelHighlight}>With{"\n"}Roz</Text>
          </View>
        </View>
        
        <Text style={styles.subtext}>
          Roz makes it easy and holds you accountable.
        </Text>
      </View>
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
    backgroundColor: colors.bgCardSecondary,
    borderRadius: 32,
    paddingVertical: 30,
    borderWidth: 1,
    borderColor: colors.borderGray,
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
    borderRadius: 16,
  },
  grayBar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  whiteBar: {
    backgroundColor: colors.white,
  },
  barVal: {
    position: 'absolute',
    top: '50%',
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
  },
  barValHighlight: {
    position: 'absolute',
    top: '40%',
    color: colors.black,
    fontSize: 20,
    fontWeight: '900',
  },
  barLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  barLabelHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
    textAlign: 'center',
    lineHeight: 18,
  },
  subtext: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 20,
    fontWeight: '500',
  },
  button: {
    marginBottom: 20,
    borderRadius: 100,
    height: 60,
  },
});
