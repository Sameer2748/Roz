import { Platform } from 'react-native';

const DEV_API = Platform.OS === 'android' ? 'http://192.168.1.11:3000' : 'http://localhost:3000';

export const API_BASE_URL = __DEV__ ? DEV_API : 'https://api.roz.app';
export const API_VERSION = '/api/v1';
