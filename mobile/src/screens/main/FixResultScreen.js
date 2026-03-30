import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';

export default function FixResultScreen({ route, navigation }) {
  const { log } = route.params;
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!description.trim()) return;
    
    setLoading(true);
    try {
      const res = await api.put(`/logs/${log.id}/fix`, { correction: description });
      if (res.data.success) {
        Alert.alert('Updated!', 'The AI has refined your results.', [
          { text: 'OK', onPress: () => navigation.pop(2) } // Go back to Home
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.titleRow}>
           <MaterialCommunityIcons name="sparkles" size={28} color="#FFF" />
           <Text style={styles.title}>Fix result</Text>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Describe what need to be fixed"
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
            autoFocus
            multiline
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.updateBtn, !description.trim() && styles.disabledBtn]}
            onPress={handleUpdate}
            disabled={!description.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.updateBtnText}>Update</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121214' },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  inputWrapper: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 120,
  },
  input: {
    color: '#FFF',
    fontSize: 18,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  footer: { position: 'absolute', bottom: 40, left: 24, right: 24 },
  updateBtn: { 
    height: 56, backgroundColor: '#FFF', borderRadius: 100, 
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
  },
  disabledBtn: { backgroundColor: '#333' },
  updateBtnText: { color: '#000', fontSize: 18, fontWeight: '700' },
});
