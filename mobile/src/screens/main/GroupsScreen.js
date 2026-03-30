import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  StatusBar,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import colors from '../../constants/colors';
// Shimmer Effect Component
const ShimmerPlaceholder = ({ style }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return <Animated.View style={[style, { backgroundColor: 'rgba(255,255,255,0.05)', opacity }]} />;
};

export default function GroupsScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  
  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleJoinGroup = async () => {
    if (!inviteCode) return;
    setJoinLoading(true);
    try {
      const response = await api.post('/groups/join', { inviteCode });
      Alert.alert('Success', 'Joined group successfully!');
      setInviteCode('');
      fetchGroups();
      navigation.navigate('GroupDetail', { groupId: response.data.data.id });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Could not join group');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newName) return;
    setCreateLoading(true);
    try {
      const response = await api.post('/groups', { name: newName });
      Alert.alert('Success', 'Community created!');
      setNewName('');
      setShowCreateModal(false);
      fetchGroups();
      navigation.navigate('GroupDetail', { groupId: response.data.data.id });
    } catch (err) {
      Alert.alert('Error', 'Could not create community');
    } finally {
      setCreateLoading(false);
    }
  };

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.groupCard}
      onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })}
    >
      <View style={styles.groupAvatarBody}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.groupIcon} />
        ) : (
          <View style={styles.groupIconPlaceholder}>
            <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
          </View>
        )}
      </View>
      <View style={styles.groupInfo}>
        <View style={styles.groupTitleRow}>
          <Text style={styles.groupName}>{item.name}</Text>
          {item.is_private && <Ionicons name="lock-closed" size={12} color={colors.textMuted} style={{ marginLeft: 6 }} />}
        </View>
        <Text style={styles.groupMemberCount}>{item.member_count} members</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.borderGray} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgBase }]} />
      
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.title}>Communities</Text>
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.joinSection}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter invite code"
              placeholderTextColor={colors.textSecondary}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              onPress={handleJoinGroup}
              disabled={joinLoading || !inviteCode}
              style={styles.joinButton}
            >
              {joinLoading ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.joinButtonText}>Join</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.listContainer}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={styles.groupCard}>
                <ShimmerPlaceholder style={styles.groupIcon} />
                <View style={styles.groupInfo}>
                  <ShimmerPlaceholder style={{ height: 18, width: '60%', borderRadius: 4, marginBottom: 8 }} />
                  <ShimmerPlaceholder style={{ height: 12, width: '30%', borderRadius: 4 }} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.borderGray} />
                <Text style={styles.emptyText}>No communities yet.{"\n"}Join one or create your own!</Text>
              </View>
            }
          />
        )}

        {/* Create Modal */}
        <Modal visible={showCreateModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Community</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Community Name"
                placeholderTextColor={colors.textSecondary}
                value={newName}
                onChangeText={setNewName}
              />

              <TouchableOpacity 
                onPress={handleCreateGroup}
                disabled={createLoading || !newName}
                style={styles.submitButton}
              >
                {createLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitButtonText}>Create Community</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '900', color: '#FFF' },
  fab: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  
  joinSection: { paddingHorizontal: 20, marginBottom: 25 },
  inputWrapper: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 4, borderWidth: 1, borderColor: colors.borderGray, height: 62, alignItems: 'center' },
  input: { flex: 1, color: '#FFF', fontSize: 16, paddingHorizontal: 16, fontWeight: '600' },
  joinButton: { width: 80, height: 52, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  joinButtonText: { color: '#000', fontWeight: '800', fontSize: 16 },

  listContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  groupCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 24, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.borderGray },
  groupIcon: { width: 56, height: 56, borderRadius: 20 },
  groupIconPlaceholder: { width: 56, height: 56, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
  groupInfo: { flex: 1, marginLeft: 16 },
  groupTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  groupName: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  groupMemberCount: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },

  emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
  emptyText: { color: '#FFF', textAlign: 'center', marginTop: 16, fontSize: 15, lineHeight: 22 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1e1a23', borderRadius: 32, padding: 24, width: '90%', borderWidth: 1, borderColor: colors.borderGray },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, height: 56, paddingHorizontal: 20, color: '#FFF', fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.borderGray },
  submitButton: { height: 56, borderRadius: 28, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  submitButtonText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
