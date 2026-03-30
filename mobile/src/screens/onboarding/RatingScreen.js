import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import OnboardingLayout from '../../components/ui/OnboardingLayout';
import Button from '../../components/ui/Button';
import colors from '../../constants/colors';

const REVIEWER_IMG = require('../../../assets/premium_user_avatar.jpg');
const AVATARS = [
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
];

export default function RatingScreen({ navigation }) {
  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('ReferralCode');
  };

  return (
    <OnboardingLayout
      title="Trusted by millions"
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
            <Ionicons key={i} name="star" size={32} color={colors.accentGold} />
          ))}
        </View>

        <Text style={styles.subTitle}>Roz was made for{"\n"}people like you</Text>

        <View style={styles.avatarsRow}>
          {AVATARS.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={[styles.avatar, { zIndex: 10 - i }]} />
          ))}
          <View style={styles.avatarTextContainer}>
            <Text style={styles.avatarText}>+3M Roz users</Text>
          </View>
        </View>

        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
             <Image source={REVIEWER_IMG} style={styles.reviewAvatar} />
             <View>
                <Text style={styles.reviewName}>Marley Bryle</Text>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Ionicons key={i} name="star" size={10} color={colors.accentGold} />
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
  avatarsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 60 },
  avatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    borderWidth: 2, 
    borderColor: colors.background,
    marginLeft: -12, // Overlap effect
  },
  avatarTextContainer: { marginLeft: 16 },
  avatarText: { fontSize: 13, fontWeight: '800', color: colors.textSecondary },
  reviewCard: { 
    backgroundColor: colors.bgCardSecondary, 
    borderRadius: 32, 
    padding: 24, 
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  reviewAvatar: { width: 44, height: 44, borderRadius: 22 },
  reviewName: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewText: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, fontWeight: '500', fontStyle: 'italic' },
  button: { marginBottom: 20, borderRadius: 100, height: 60 },
});
