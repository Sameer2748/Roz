import { GoogleSignin } from '@react-native-google-signin/google-signin';
import api from './api';
import { setItem, removeItem, StorageKeys, clearAll } from './storage';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '770578055075-7fdnr5dic99l4rrqab44ajsoq2e0fupt.apps.googleusercontent.com',
  offlineAccess: true,
});

export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken || userInfo.idToken;

    const response = await api.post('/auth/google', { idToken });
    const { accessToken, refreshToken, user, isNewUser } = response.data.data;

    await setItem(StorageKeys.ACCESS_TOKEN, accessToken);
    await setItem(StorageKeys.REFRESH_TOKEN, refreshToken);
    await setItem(StorageKeys.USER, user);

    return { user, isNewUser };
  } catch (googleError) {
    // Fallback to dev-login if Google Sign-In fails (dev builds without google-services.json)
    console.log('Google Sign-In failed, trying dev-login:', googleError.message);
    return signInDev();
  }
}

export async function signInDev() {
  const response = await api.post('/auth/dev-login', {
    email: 'user@roz.app',
    name: 'Roz User',
  });

  const { accessToken, refreshToken, user, isNewUser } = response.data.data;

  await setItem(StorageKeys.ACCESS_TOKEN, accessToken);
  await setItem(StorageKeys.REFRESH_TOKEN, refreshToken);
  await setItem(StorageKeys.USER, user);

  return { user, isNewUser };
}

export async function signOut() {
  try {
    const refreshToken = StorageKeys.REFRESH_TOKEN;
    await api.post('/auth/logout', { refreshToken });
  } catch (_) {
    // ignore
  }
  try {
    await GoogleSignin.signOut();
  } catch (_) {
    // ignore
  }
  await clearAll();
}

export async function getCurrentUser() {
  const response = await api.get('/users/me');
  return response.data.data;
}
