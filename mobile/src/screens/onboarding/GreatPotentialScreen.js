import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Path, LinearGradient, vec, Group, Circle } from "@shopify/react-native-skia";
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import useUserStore from '../../store/userStore';
import colors from '../../constants/colors';

const { width: SW } = Dimensions.get('window');
const CHART_WIDTH = SW - 88;
const CHART_HEIGHT = 160;

export default function GreatPotentialScreen({ navigation }) {
  const { onboardingData } = useUserStore();
  const goal = onboardingData.goal || 'fat_loss';
  const isLoss = goal === 'fat_loss';

  // Curve Path (Normalized 0-160 range)
  const lossPath = "M 0 40 C 40 40, 80 50, 160 140";
  const gainPath = "M 0 140 C 40 140, 80 130, 160 30";
  const path = isLoss ? lossPath : gainPath;

  // Fill area path
  const fillPath = isLoss 
    ? `${lossPath} L 160 160 L 0 160 Z`
    : `${gainPath} L 160 0 L 0 0 Z`;

  return (
    <OnboardingLayout
      title={`Great potential to\ncrush your goal.`}
      onBack={() => navigation.goBack()}
      progress={0.8}
      footer={
        <Button 
          title="Continue" 
          onPress={() => navigation.navigate('Rating')} 
          style={styles.button} 
        />
      }
    >
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your weight transition</Text>
          
          <View style={styles.graphWrapper}>
            <Canvas style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}>
              {/* Vertical Guide Lines */}
              <Path path="M 0 0 L 0 160" color="rgba(255,255,255,0.05)" strokeWidth={1} style="stroke" />
              <Path path={`M ${CHART_WIDTH * 0.3} 0 L ${CHART_WIDTH * 0.3} 160`} color="rgba(255,255,255,0.05)" strokeWidth={1} style="stroke" strokeDasharray={[4, 4]} />
              <Path path={`M ${CHART_WIDTH * 0.6} 0 L ${CHART_WIDTH * 0.6} 160`} color="rgba(255,255,255,0.05)" strokeWidth={1} style="stroke" strokeDasharray={[4, 4]} />
              <Path path={`M ${CHART_WIDTH} 0 L ${CHART_WIDTH} 160`} color="rgba(255,255,255,0.05)" strokeWidth={1} style="stroke" />

              {/* Gradient Fill under the curve */}
              <Group transform={[{ scaleX: CHART_WIDTH / 160 }, { scaleY: 1 }]}>
                <Path path={fillPath} opacity={0.1}>
                  <LinearGradient 
                    start={vec(0, isLoss ? 40 : 140)} 
                    end={vec(0, isLoss ? 160 : 0)} 
                    colors={[colors.white, "transparent"]} 
                  />
                </Path>

                {/* Main Curve */}
                <Path 
                  path={path} 
                  color={colors.white} 
                  strokeWidth={4} 
                  style="stroke" 
                  strokeCap="round"
                />
                
                {/* Highlights at key points */}
                <Circle cx={0} cy={isLoss ? 40 : 140} r={5} color={colors.white} />
                <Circle cx={0} cy={isLoss ? 40 : 140} r={3} color={colors.bgCardSecondary} />

                <Circle cx={80} cy={isLoss ? 50 : 130} r={5} color={colors.white} />
                <Circle cx={80} cy={isLoss ? 50 : 130} r={3} color={colors.bgCardSecondary} />

                <Circle cx={160} cy={isLoss ? 140 : 30} r={5} color={colors.white} />
                <Circle cx={160} cy={isLoss ? 140 : 30} r={3} color={colors.bgCardSecondary} />
              </Group>
            </Canvas>

            {/* Float Labels Overlay */}
            <View style={styles.timeLabels}>
               <Text style={styles.timeLabel}>Day 1</Text>
               <Text style={styles.timeLabel}>Day 7</Text>
               <Text style={styles.timeLabel}>Day 30</Text>
            </View>
          </View>

          <View style={styles.insightBox}>
             <Text style={styles.insightText}>
               Results often accelerate after the first week as your metabolism adapts to the Roz plan.
             </Text>
          </View>
        </View>

        <View style={styles.celebrationRow}>
          <Text style={{ fontSize: 40 }}>🥈</Text>
          <View style={{ flex: 1, marginLeft: 16 }}>
             <Text style={styles.medalTitle}>95% Accuracy</Text>
             <Text style={styles.medalSub}>Highest precision AI model for weight forecasting.</Text>
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingTop: 20 },
  card: {
    backgroundColor: colors.bgCardSecondary,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: colors.textSecondary, 
    marginBottom: 24, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  graphWrapper: { position: 'relative', marginBottom: 20 },
  timeLabels: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 12,
  },
  timeLabel: { fontSize: 13, fontWeight: '800', color: colors.textSecondary },
  insightBox: { marginTop: 24, paddingVertical: 16, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  insightText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, fontWeight: '500' },
  celebrationRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 40, 
    marginHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 20,
    borderRadius: 24,
  },
  medalTitle: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  medalSub: { fontSize: 14, color: colors.textSecondary, marginTop: 2, fontWeight: '500' },
  button: { marginBottom: 20, borderRadius: 100, height: 60 },
});
