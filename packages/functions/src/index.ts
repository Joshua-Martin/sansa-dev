import { initializeApp } from 'firebase-admin/app';
import { addToWaitlist } from './waitlist.js';
import { xBotScore } from './x-bot-score.js';
import { xDxChecker } from './x-dx-checker.js';

// Initialize Firebase Admin SDK
const app = initializeApp();
console.log('Firebase Admin SDK initialized:', app);

// Export all functions
export { addToWaitlist, xBotScore, xDxChecker };
