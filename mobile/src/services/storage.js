import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  ONBOARDING_COMPLETE: 'onboarding_complete',
};

export async function setItem(key, value) {
  const v = typeof value === 'object' ? JSON.stringify(value) : String(value);
  await AsyncStorage.setItem(key, v);
}

export async function getItem(key) {
  return (await AsyncStorage.getItem(key)) || null;
}

export async function getJSON(key) {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function removeItem(key) {
  await AsyncStorage.removeItem(key);
}

export async function clearAll() {
  await AsyncStorage.clear();
}

export default { setItem, getItem, getJSON, removeItem, clearAll };
