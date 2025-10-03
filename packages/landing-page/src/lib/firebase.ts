// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCB5cFHCcL9W1l_L9m3F26fkBNMqE_ggfY',
  authDomain: 'sansa-ml.firebaseapp.com',
  projectId: 'sansa-ml',
  storageBucket: 'sansa-ml.firebasestorage.app',
  messagingSenderId: '212590454675',
  appId: '1:212590454675:web:f1161a4c8829cb7dc0aa66',
  measurementId: 'G-2N34LCRR5D',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const functions = getFunctions(app);

export { analytics, functions };



