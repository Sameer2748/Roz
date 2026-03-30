import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import colors from '../../constants/colors';

export default function RatingScreen({ navigation }) {
  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('ReferralCode');
  };

  return (
    <OnboardingLayout
      title="Give us a rating"
      onBack={() => navigation.goBack()}
      progress={0.95}
      footer={
        <Button 
          title="Continue" 
          onPress={handleContinue} 
          style={styles.button}
        />
      }
    >
      <View style={styles.center}>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <Ionicons key={i} name="star" size={32} color="#FBBF24" />
          ))}
        </View>

        <Text style={styles.subTitle}>Roz was made for{"\n"}people like you</Text>

        <View style={styles.avatarsRow}>
           <View style={styles.avatar} />
           <View style={styles.avatar} />
           <View style={styles.avatar} />
           <Text style={styles.avatarText}>+3M Roz users</Text>
        </View>

        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
             <View style={styles.reviewAvatar} />
             <View>
                <Text style={styles.reviewName}>Marley Bryle</Text>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Ionicons key={i} name="star" size={10} color="#FBBF24" />
                  ))}
                </View>
             </View>
          </View>
          <Text style={styles.reviewText}>
            "I lost 15 lbs in 2 months! I was about to go on Ozempic but decided to give this app a shot and it worked :)"
          </Text>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', paddingTop: 60 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  subTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 20 },
  avatarsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 60, gap: -10 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', borderWidth: 2, borderColor: '#FFF' },
  avatarText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginLeft: 20 },
  reviewCard: { 
    backgroundColor: '#000', 
    borderRadius: 24, 
    padding: 24, 
    width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#374151' },
  reviewName: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewText: { fontSize: 14, color: '#9CA3AF', lineHeight: 20, fontStyle: 'italic' },
  button: { marginBottom: 20, borderRadius: 100 },
});
