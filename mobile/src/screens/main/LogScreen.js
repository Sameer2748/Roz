import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ScannerOverlay from '../../components/animations/ScannerOverlay';
import api from '../../services/api';
import { getMealTypeByTime } from '../../utils/dateUtils';
import useLogStore from '../../store/logStore';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function LogScreen({ route, navigation }) {
  const { width, height } = useWindowDimensions();
  const initialMeal = route?.params?.mealType || getMealTypeByTime();
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState(null);
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState(initialMeal);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [logging, setLogging] = useState(false);
  const [logged, setLogged] = useState(false);
  const cameraRef = useRef(null);

  const addPending = useLogStore(s => s.addPendingLog);
  const removePending = useLogStore(s => s.removePendingLog);

  useFocusEffect(
    useCallback(() => {
      setLogged(false);
      setResult(null);
      setCapturedImage(null);
      setAnalyzing(false);
      setDescription('');
    }, [])
  );

  const compressImage = async (uri) => {
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulated;
    } catch (e) {
      return { uri };
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        exif: false,
      });
      if (photo) {
        const compressed = await compressImage(photo.uri);
        setCapturedImage(compressed.uri);
        analyzeImage(compressed.uri);
      }
    } catch (e) {
      console.error('takePhoto error:', e);
      Alert.alert('Camera Error', 'Failed to capture image.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const compressed = await compressImage(uri);
        setCapturedImage(compressed.uri);
        analyzeImage(compressed.uri);
      }
    } catch (e) {
      console.error('Gallery error:', e);
      Alert.alert('Gallery Error', 'Failed to pick image.');
    }
  };

  const analyzeImage = async (uri) => {
    const pendingId = Date.now().toString();
    addPending({ id: pendingId, image_uri: uri, meal_type: mealType });

    navigation.navigate('Home', { resetToToday: true });

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: 'image/jpeg',
        name: 'food.jpg',
      });
      if (description) formData.append('description', description);
      formData.append('meal_type', mealType);

      await api.post('/logs/fast-log', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
      });

      // Fetch fresh logs AFTER successful save
      await useLogStore.getState().fetchTodayLogs(api);

      // Cleanup pending once backend is done and fresh data is here
      removePending(pendingId);
    } catch (err) {
      console.error('Fast log error:', err);
      removePending(pendingId);
      Alert.alert('Analysis Failed', 'Could not analyze your meal. Please try again.');
    }
  };

  if (logged) {
    return (
      <View style={styles.darkContainer}>
        <View style={styles.successWrapper}>
          <MaterialCommunityIcons name="check-circle" size={100} color="#4CD964" />
          <Text style={styles.successTitle}>Logged!</Text>
          <TouchableOpacity style={styles.wideBtn} onPress={() => navigation.navigate('Home')}>
             <Text style={styles.wideBtnText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.darkContainer}>
        <View style={styles.centeredContent}>
           <Ionicons name="camera-outline" size={80} color="#666" />
           <Text style={styles.permissionText}>Camera Access Required</Text>
           <TouchableOpacity style={styles.wideBtn} onPress={requestPermission}>
              <Text style={styles.wideBtnText}>Allow Camera</Text>
           </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.darkContainer}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      
      <View style={styles.topControlLayer}>
         <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="close" size={24} color="#FFF" />
         </TouchableOpacity>
         <Text style={styles.topTitle}>New Meal</Text>
         <TouchableOpacity style={styles.circleBtn} onPress={pickFromGallery}>
            <Ionicons name="images" size={24} color="#FFF" />
         </TouchableOpacity>
      </View>

      <View style={styles.bottomControlLayer}>
         <View style={styles.typeRow}>
            {MEAL_TYPES.map(m => (
              <TouchableOpacity key={m} style={[styles.typePill, mealType === m && styles.typePillActive]} onPress={() => setMealType(m)}>
                 <Text style={[styles.typePillText, mealType === m && styles.typePillTextActive]}>{m.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
         </View>

         <View style={styles.mainCaptureRow}>
            <View style={{ width: 60 }} />
            <TouchableOpacity style={styles.shutterBig} onPress={takePhoto}>
               <View style={styles.shutterInner} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.gallerySmall} onPress={pickFromGallery}>
               <MaterialCommunityIcons name="image-multiple" size={24} color="#FFF" />
            </TouchableOpacity>
         </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  darkContainer: { flex: 1, backgroundColor: '#000' },
  centeredContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  camera: { flex: 1 },
  topControlLayer: { position: 'absolute', top: 60, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  topTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  bottomControlLayer: { position: 'absolute', bottom: 120, left: 0, right: 0, alignItems: 'center' },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)' },
  typePillActive: { backgroundColor: '#FFF' },
  typePillText: { color: '#666', fontSize: 10, fontWeight: '800' },
  typePillTextActive: { color: '#000' },
  mainCaptureRow: { flexDirection: 'row', alignItems: 'center', gap: 40 },
  shutterBig: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#FFF' },
  gallerySmall: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  successWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  successTitle: { color: '#FFF', fontSize: 32, fontWeight: '800', marginTop: 20, marginBottom: 40 },
  wideBtn: { width: '100%', height: 60, backgroundColor: '#FFF', borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  wideBtnText: { color: '#000', fontSize: 18, fontWeight: '700' },
  permissionText: { color: '#FFF', fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 20 },
});
