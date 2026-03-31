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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
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
  const [newDesc, setNewDesc] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🥗');
  const [selectedImage, setSelectedImage] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  const ICONS = ['🥗', '🏋️', '🍳', '🥤', '🥑', '🥥', '🔥', '🏆', '💎', '👟'];

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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleCreateGroup = async () => {
    if (!newName) return;
    setCreateLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      const formData = new FormData();
      formData.append('name', `${selectedIcon} ${newName}`);
      formData.append('description', newDesc);
      
      if (selectedImage) {
        const uriParts = selectedImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('image', {
          uri: selectedImage,
          name: `group_icon.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      await api.post('/groups', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setNewName('');
      setNewDesc('');
      setSelectedImage(null);
      setShowCreateModal(false);
      fetchGroups();
    } catch (err) {
      console.error('Create group error:', err);
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

        {/* Create Modal - Bottom Sheet Style */}
        <Modal 
          visible={showCreateModal} 
          transparent 
          animationType="slide"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalDismissArea} 
              activeOpacity={1} 
              onPress={() => setShowCreateModal(false)} 
            />
            <View style={styles.sheetContent}>
              <View style={styles.sheetHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Community</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCreateModal(false)}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.profileSection}>
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  {selectedImage ? (
                    <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.emojiCircle}>
                      <Text style={styles.previewEmoji}>{selectedIcon}</Text>
                    </View>
                  )}
                  <View style={styles.cameraIcon}>
                    <Ionicons name="camera" size={18} color="#000" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.imageNote}>Tap to upload photo</Text>
              </View>
              
              <Text style={styles.inputLabel}>Or pick an emoji</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.iconScroll}
                contentContainerStyle={styles.iconScrollContent}
              >
                {ICONS.map(icon => (
                  <TouchableOpacity 
                    key={icon} 
                    style={[styles.iconCircle, selectedIcon === icon && styles.activeIconCircle]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedIcon(icon);
                    }}
                  >
                    <Text style={styles.iconEmoji}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Community Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Morning Runners"
                placeholderTextColor={colors.textSecondary}
                value={newName}
                onChangeText={setNewName}
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                placeholder="What is this group about?"
                placeholderTextColor={colors.textSecondary}
                value={newDesc}
                onChangeText={setNewDesc}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity 
                onPress={handleCreateGroup}
                disabled={createLoading || !newName}
                style={[styles.submitButton, (!newName || createLoading) && { opacity: 0.5 }]}
              >
                {createLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.submitButtonText}>Create Community</Text>}
              </TouchableOpacity>
              
              <View style={{ height: 40 }} />
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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1 },
  sheetContent: { 
    backgroundColor: '#1e1a23', 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    padding: 24, 
    paddingTop: 12,
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: 0,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  
  profileSection: { alignItems: 'center', marginBottom: 32 },
  imagePicker: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderGray, position: 'relative' },
  previewImage: { width: 100, height: 100, borderRadius: 50 },
  emojiCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  previewEmoji: { fontSize: 44 },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#1e1a23' },
  imageNote: { color: colors.textSecondary, fontSize: 13, marginTop: 12, fontWeight: '600' },

  inputLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },
  iconScroll: { marginBottom: 32, marginHorizontal: -24 },
  iconScrollContent: { paddingHorizontal: 24, gap: 12 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  activeIconCircle: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: '#FFF' },
  iconEmoji: { fontSize: 28 },

  modalInput: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, height: 60, paddingHorizontal: 20, color: '#FFF', fontSize: 17, marginBottom: 24, borderWidth: 1, borderColor: colors.borderGray, fontWeight: '600' },
  textArea: { height: 100, paddingTop: 16, textAlignVertical: 'top' },
  submitButton: { height: 64, borderRadius: 32, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  submitButtonText: { color: '#000', fontSize: 17, fontWeight: '800' },
});
