import { initializeApp } from 'firebase-admin/app';
import { addToWaitlist } from './waitlist.js';

// Initialize Firebase Admin SDK
const app = initializeApp();
console.log('Firebase Admin SDK initialized:', app);

// Export all functions
export { addToWaitlist };
