import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../../store/authStore';
import useUserStore from '../../store/userStore';
import { signOut } from '../../services/auth';
import useToastStore from '../../store/toastStore';
import colors from '../../constants/colors';

export default function ProfileScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);
  const { profile, dailyTarget } = useUserStore();
  const showToast = useToastStore((state) => state.show);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          clearUser();
          showToast('Signed out successfully', 'info');
        },
      },
    ]);
  };

  const handleEdit = () => {
    navigation.navigate('EditProfile');
  };

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1e1a23' }]} />
      {/* Decorative Glow */}
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'transparent']}
        style={{ position: 'absolute', top: -100, left: -50, width: 300, height: 300, borderRadius: 150 }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity style={styles.settingsIcon} onPress={handleEdit}>
               <Ionicons name="settings-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* User Card */}
          <View style={styles.userCard}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={handleEdit}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={32} color="#666" />
                </View>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={12} color="#000" />
              </View>
            </TouchableOpacity>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>

          {/* Stats... (unchanged) */}
          <View style={styles.statsGrid}>
             <StatCard label="Daily Goal" value={`${dailyTarget?.calories || '-'}`} unit="kcal" icon="flame" color={colors.accentOrange} />
             <StatCard label="Protein" value={`${Math.round(dailyTarget?.protein_g || 0)}`} unit="g" icon="food-drumstick" color={colors.accentGreen} isMaterial />
             <StatCard label="Goal" value={formatGoal(profile?.goal)} icon="target" color={colors.accentPurple} isMaterial />
             <StatCard label="Activity" value={formatActivity(profile?.activity_level)} icon="walk" color={colors.accentGold} />
          </View>

          {/* Settings Group */}
          <View style={styles.menuGroup}>
            <Text style={styles.groupLabel}>Account</Text>
            <SettingsRow icon="person-outline" label="Personal Information" onPress={handleEdit} />
            <SettingsRow icon="notifications-outline" label="Notifications" />
            <SettingsRow icon="shield-checkmark-outline" label="Privacy & Security" />
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Roz v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatCard({ label, value, unit, icon, color, isMaterial }) {
  const IconComponent = isMaterial ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={statStyles.card}>
      <View style={statStyles.row}>
         <IconComponent name={icon} size={16} color={color} />
         <Text style={statStyles.label}>{label}</Text>
      </View>
      <Text style={statStyles.value}>{value}{unit && <Text style={statStyles.unit}> {unit}</Text>}</Text>
    </View>
  );
}

function SettingsRow({ icon, label, subtitle, onPress }) {
  return (
    <TouchableOpacity style={settingStyles.row} onPress={onPress}>
      <View style={settingStyles.iconWrap}>
        <Ionicons name={icon} size={20} color="#FFF" />
      </View>
      <View style={settingStyles.content}>
        <Text style={settingStyles.label}>{label}</Text>
        {subtitle && <Text style={settingStyles.subtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#444" />
    </TouchableOpacity>
  );
}

function formatGoal(goal) {
  const map = {
    fat_loss: 'Lose Fat',
    muscle_gain: 'Build Muscle',
    maintenance: 'Maintain',
    slow_bulk: 'Slow Bulk',
    aggressive_cut: 'Aggressive Cut',
  };
  return map[goal] || '-';
}

function formatActivity(level) {
  const map = {
    sedentary: 'Sedentary',
    lightly_active: 'Light',
    moderately_active: 'Moderate',
    very_active: 'Very Active',
    extra_active: 'Extra Active',
  };
  return map[level] || '-';
}

const statStyles = StyleSheet.create({
  card: { width: '48%', backgroundColor: colors.bgCard, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#262626' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  value: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  unit: { fontSize: 13, fontWeight: '400', color: '#666' },
  label: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
});

const settingStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', gap: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#262626' },
  content: { flex: 1 },
  label: { fontSize: 16, color: '#FFF', fontWeight: '500' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  scroll: { paddingHorizontal: 20, paddingBottom: 150 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  settingsIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center' },
  userCard: { alignItems: 'center', marginBottom: 32 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#262626' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  userName: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  userEmail: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  menuGroup: { marginBottom: 32 },
  groupLabel: { fontSize: 13, color: '#666', fontWeight: '800', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#1A1A1A' },
  signOutText: { fontSize: 16, color: colors.danger, fontWeight: '700' },
  version: { fontSize: 12, color: '#333', textAlign: 'center', marginTop: 20 },
});
