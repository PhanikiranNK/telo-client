// client/src/config/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeAuth, 
  getAuth, 
  // @ts-ignore
  getReactNativePersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
export const isFirebaseMock = !apiKey || apiKey === 'YOUR_API_KEY' || apiKey.trim() === '';

let app: any;
let auth: any;
let db: any;
let rtdb: any;

if (!isFirebaseMock) {
  try {
    const firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
    };

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    if (getApps().length === 0) {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } else {
      auth = getAuth(app);
    }

    db = getFirestore(app);
    rtdb = getDatabase(app);
    console.log('🔥 Firebase client SDK successfully initialized.');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase client SDK:', error);
    // Force mock fallback on initialization failure
    app = {};
    auth = { currentUser: null, signOut: async () => {} };
    db = {};
    rtdb = {};
  }
} else {
  console.warn('⚠️  No valid EXPO_PUBLIC_FIREBASE_API_KEY found. TELO is running in client DEVELOPMENT MOCK mode.');
  app = {};
  auth = {
    currentUser: null,
    signOut: async () => {},
  };
  db = {};
  rtdb = {};
}

export { app, auth, db, rtdb };