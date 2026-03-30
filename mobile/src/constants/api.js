import { Platform } from 'react-native';

const PROD_API = 'https://roz-r2rf.onrender.com';
const DEV_API = Platform.OS === 'android' ? 'http://192.168.1.11:3000' : 'http://localhost:3000';

// export const API_BASE_URL = __DEV__ ? DEV_API : PROD_API;
export const API_BASE_URL = PROD_API;
export const API_VERSION = '/api/v1';
  