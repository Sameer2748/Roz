import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import useToastStore from '../../store/toastStore';
import colors from '../../constants/colors';

export default function EditProfileScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const showToast = useToastStore((state) => state.show);

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      handleAvatarUpload(result.assets[0].uri);
    }
  };

  const handleAvatarUpload = async (uri) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });

      const res = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setAvatar(res.data.data.avatar_url);
        // Update local user state immediately
        setUser({ ...user, avatar_url: res.data.data.avatar_url });
        showToast('Profile picture updated', 'success');
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
      showToast('Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return showToast('Name cannot be empty', 'error');
    
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const res = await api.put('/users/profile', { name });
      if (res.data.success) {
        setUser({ ...user, name });
        showToast('Profile updated', 'success');
        navigation.goBack();
      }
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1e1a23' }]} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Personal Information</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={40} color="#666" />
                  </View>
                )}
                {uploading ? (
                  <View style={styles.uploadOverlay}>
                    <ActivityIndicator color="#FFF" />
                  </View>
                ) : (
                  <View style={styles.editBadge}>
                    <Ionicons name="camera" size={16} color="#000" />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Tap to change photo</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={[styles.input, styles.disabledInput]}>
                   <Text style={styles.disabledText}>{user?.email}</Text>
                   <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.2)" />
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, loading && styles.disabledBtn]} 
              onPress={handleSave}
              disabled={loading || uploading}
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 60 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 22 },
  title: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  scroll: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 100 },
  
  avatarSection: { alignItems: 'center', marginBottom: 48 },
  avatarWrapper: { width: 120, height: 120, position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#262626' },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  editBadge: { position: 'absolute', bottom: 4, right: 4, width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#1e1a23' },
  avatarHint: { color: colors.textSecondary, marginTop: 12, fontSize: 13, fontWeight: '600' },
  
  form: { gap: 24, marginBottom: 40 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  input: { 
     height: 56, 
     backgroundColor: 'rgba(255,255,255,0.03)', 
     borderRadius: 16, 
     paddingHorizontal: 18, 
     fontSize: 16, 
     color: '#FFF', 
     fontWeight: '700',
     borderWidth: 1,
     borderColor: 'rgba(255,255,255,0.05)'
  },
  disabledInput: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderColor: 'transparent'
  },
  disabledText: { color: 'rgba(255,255,255,0.3)', fontWeight: '600' },
  
  saveBtn: { 
     height: 56, 
     backgroundColor: '#FFF', 
     borderRadius: 28, 
     justifyContent: 'center', 
     alignItems: 'center',
     shadowColor: '#FFF',
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.1,
     shadowRadius: 10,
     elevation: 5
  },
  disabledBtn: { opacity: 0.5 },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: '800' },
});
