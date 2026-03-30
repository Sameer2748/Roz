import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import api from '../../services/api';
import colors from '../../constants/colors';
import useAuthStore from '../../store/authStore';
import useToastStore from '../../store/toastStore';
import socketService from '../../services/socket';

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
  const { user } = useAuthStore();
  const { show: showToast } = useToastStore();
  const insets = useSafeAreaInsets();
  
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Chat'); 
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const chatListRef = useRef(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const fetchGroupDetail = async () => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      setGroup(response.data.data);
    } catch (err) {
      console.error('Error fetching group detail:', err);
      Alert.alert('Error', 'Could not load group details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await api.get(`/groups/${groupId}/messages`);
      setMessages(response.data.data);
    } catch (err) {
      console.error('Error fetching chat:', err);
    }
  };

  useEffect(() => {
    fetchGroupDetail();
    fetchChatHistory();

    let socket;
    socketService.connect(user.id).then((s) => {
      socket = s;
      socket.emit('join_group_room', groupId);
      
      const onNewMessage = (msg) => {
        if (msg.group_id === groupId) {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      };

      socket.on('new_group_message', onNewMessage);
    });

    return () => {
      if (socket) {
        socket.off('new_group_message');
      }
    };
  }, [groupId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const response = await api.post(`/groups/${groupId}/messages`, { content });
      const sentMsg = response.data.data;
      setMessages(prev => {
        if (prev.find(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
      setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      showToast('Could not send message', 'error');
      setNewMessage(content); 
    } finally {
      setSending(false);
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(group.invite_code);
    showToast('Invite code copied!', 'success');
  };

  const handleShareCode = async () => {
    try {
      const { Share } = require('react-native');
      await Share.share({ message: `Join my Roz community! Code: ${group.invite_code}` });
    } catch (error) { console.error(error.message); }
  };

  const handleAddByPhone = async () => {
    if (!phone.trim()) return;
    setAddLoading(true);
    try {
      await api.post(`/groups/${groupId}/invite-phone`, { phoneNumber: phone.trim() });
      showToast('Member added!', 'success');
      setPhone('');
      setShowAddModal(false);
      fetchGroupDetail(); 
    } catch (err) {
      showToast(err.response?.data?.error || 'Could not add member', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const formatChatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accentPurple} />
      </View>
    );
  }

  const renderMessage = ({ item }) => {
    const isMe = item.user_id === user.id;
    return (
      <View style={[styles.msgWrapper, isMe ? styles.msgMeWrapper : styles.msgOtherWrapper]}>
        {!isMe && (
          <View style={styles.msgAvatarWrapper}>
            {item.user_avatar ? (
              <Image source={{ uri: item.user_avatar }} style={styles.msgAvatar} />
            ) : (
              <View style={[styles.msgAvatar, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#FFF', fontSize: 10 }}>{item.user_name?.[0] || '?'}</Text>
              </View>
            )}
          </View>
        )}
        <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
          {!isMe && <Text style={styles.msgUserName}>{item.user_name}</Text>}
          <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>{item.content}</Text>
          <Text style={[styles.msgTime, isMe && { color: 'rgba(0,0,0,0.4)' }]}>{formatChatTime(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  const renderMember = ({ item, index }) => (
    <View style={[styles.memberItem, item.id === group.created_by && styles.ownerCard]}>
      <View style={styles.rankContainer}>
        {index < 3 ? (
          <Ionicons name="trophy" size={18} color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'} />
        ) : (
          <Text style={styles.rankText}>{index + 1}</Text>
        )}
      </View>
      <View style={styles.avatarPlaceholder}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
        )}
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRole}>{item.role === 'owner' ? '👑 Founder' : 'Member'}</Text>
      </View>
      <View style={styles.streakBadge}>
        <Ionicons name="flame" size={16} color={colors.accentOrange} />
        <Text style={styles.streakText}>{item.current_streak || 0}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bgBase }]} />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar barStyle="light-content" />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            {group.image_url ? (
               <Image source={{ uri: group.image_url }} style={styles.headerIcon} />
            ) : (
              <View style={styles.headerIconPlaceholder}>
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 12 }}>{group.name.substring(0, 2).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
              <Text style={styles.headerSub}>{group.member_count} members</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.headerActionBtn}>
            <Ionicons name="person-add-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsWrapper}>
          <View style={styles.tabsContainer}>
            {['Chat', 'Leaderboard', 'Members'].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {activeTab === 'Chat' ? (
            <View style={{ flex: 1 }}>
              <FlatList
                ref={chatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.chatContent}
                onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: false })}
                onLayout={() => chatListRef.current?.scrollToEnd({ animated: false })}
              />
              <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 15) }]}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Say something..."
                  placeholderTextColor="#666"
                  value={newMessage}
                  onChangeText={setNewMessage}
                  multiline
                />
                <TouchableOpacity 
                   onPress={handleSendMessage} 
                   disabled={sending || !newMessage.trim()}
                   style={styles.sendBtn}
                >
                  {sending ? <ActivityIndicator color="#000" size="small" /> : <Ionicons name="send" size={18} color="#000" />}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {activeTab === 'Members' && (
                <TouchableOpacity style={styles.codeRow} onPress={handleCopyCode} activeOpacity={0.7}>
                  <Text style={styles.codeLabel}>INVITE CODE:</Text>
                  <Text style={styles.codeValue}>{group.invite_code}</Text>
                  <Ionicons name="copy-outline" size={16} color={colors.textSecondary} style={{ marginLeft: 10 }} />
                </TouchableOpacity>
              )}
              <FlatList
                data={group.members}
                renderItem={renderMember}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListFooterComponent={<View style={{ height: 40 }} />}
              />
            </View>
          )}
        </KeyboardAvoidingView>

        <Modal visible={showAddModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Member</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="+91..."
                placeholderTextColor="#444"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddByPhone} style={[styles.modalButton, styles.addBtnAction]}>
                  {addLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.addBtnText}>Add</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  loadingContainer: { flex: 1, backgroundColor: colors.bgBase, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerIcon: { width: 36, height: 36, borderRadius: 12 },
  headerIconPlaceholder: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  headerSub: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  headerActionBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  tabsWrapper: { paddingHorizontal: 20, marginVertical: 12 },
  tabsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 100, padding: 4, borderWidth: 1, borderColor: colors.borderGray },
  tab: { flex: 1, height: 38, borderRadius: 100, justifyContent: 'center', alignItems: 'center' },
  activeTab: { backgroundColor: 'rgba(255,255,255,0.08)' },
  tabText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  activeTabText: { color: '#FFF' },
  chatContent: { padding: 20, paddingBottom: 30 },
  msgWrapper: { marginBottom: 16, flexDirection: 'row', alignItems: 'flex-end' },
  msgMeWrapper: { justifyContent: 'flex-end' },
  msgOtherWrapper: { justifyContent: 'flex-start' },
  msgAvatarWrapper: { marginRight: 8 },
  msgAvatar: { width: 28, height: 28, borderRadius: 14 },
  msgBubble: { maxWidth: '80%', padding: 12, borderRadius: 20 },
  msgBubbleMe: { backgroundColor: '#FFF', borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: colors.bgCard, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.borderGray },
  msgUserName: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: 4 },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgTextMe: { color: '#000', fontWeight: '600' },
  msgTextOther: { color: '#EEE', fontWeight: '500' },
  msgTime: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'right' },
  inputContainer: { flexDirection: 'row', padding: 15, backgroundColor: colors.bgBase, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 100, paddingHorizontal: 20, paddingVertical: 10, color: '#FFF', fontSize: 16, maxHeight: 100, borderWidth: 1, borderColor: colors.borderGray, marginRight: 12 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingHorizontal: 20 },
  codeRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgCard, marginHorizontal: 20, padding: 12, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.borderGray },
  codeLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '800', marginRight: 10 },
  codeValue: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  memberItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: 24, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.borderGray },
  ownerCard: { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.03)' },
  rankContainer: { width: 20, alignItems: 'center' },
  rankText: { color: colors.textSecondary, fontSize: 14, fontWeight: '800' },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginHorizontal: 15 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { color: '#FFF', fontWeight: '800', fontSize: 18 },
  memberInfo: { flex: 1 },
  memberName: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  memberRole: { color: colors.textSecondary, fontSize: 11, marginTop: 2, fontWeight: '600' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(249, 115, 22, 0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  streakText: { color: colors.accentOrange, fontWeight: '900', fontSize: 14, marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1e1a23', borderRadius: 32, padding: 30, borderWidth: 1, borderColor: colors.borderGray, width: '85%' },
  modalTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, height: 56, paddingHorizontal: 20, color: '#FFF', fontSize: 18, marginBottom: 25, textAlign: 'center', borderWidth: 1, borderColor: colors.borderGray },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.05)' },
  addBtnAction: { backgroundColor: '#FFF', flex: 1.5 },
  cancelBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  addBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
});
