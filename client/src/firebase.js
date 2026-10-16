import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

/**
 * Firebase Configuration for Google Phone Authentication
 * 10,000 SMS / Month FREE Tier
 * 
 * Paste your Firebase credentials in client/.env:
 * VITE_FIREBASE_API_KEY=...
 * VITE_FIREBASE_AUTH_DOMAIN=...
 * VITE_FIREBASE_PROJECT_ID=...
 * VITE_FIREBASE_STORAGE_BUCKET=...
 * VITE_FIREBASE_MESSAGING_SENDER_ID=...
 * VITE_FIREBASE_APP_ID=...
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCI0AAOeX7Y1_lV3xxCD6atJJ4L-SkKRyk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "avian-lane-459810-j9.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "avian-lane-459810-j9",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "avian-lane-459810-j9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "697427190286",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:697427190286:web:609d1a6b4a98381c6ed25f"
};

// Check if valid Firebase project credentials are provided
export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey.length > 10 && 
    firebaseConfig.projectId
  );
};

// Singleton Firebase App & Auth instance
let app = null;
let auth = null;

if (typeof window !== 'undefined') {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (err) {
    console.warn('[Firebase] Initialization notice:', err.message);
  }
}

export { app, auth };

/**
 * Initialize Invisible reCAPTCHA verifier for phone auth
 * @param {string} containerId - Element ID for reCAPTCHA widget (default: 'recaptcha-container')
 */
export const setupRecaptcha = (containerId = 'recaptcha-container') => {
  if (!auth) return null;

  try {
    const el = document.getElementById(containerId);
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        // ignore clear error
      }
      window.recaptchaVerifier = null;
    }
    if (el) {
      el.innerHTML = '';
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, el || containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        console.warn('[Firebase] reCAPTCHA expired, please retry.');
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch (e) {}
          window.recaptchaVerifier = null;
        }
      }
    });

    return window.recaptchaVerifier;
  } catch (err) {
    console.error('[Firebase] setupRecaptcha error:', err);
    return null;
  }
};

/**
 * Send SMS OTP via Google Firebase (10,000 Free SMS / Month)
 * @param {string} rawPhone - 10-digit Indian phone number
 * @param {RecaptchaVerifier} verifier - RecaptchaVerifier instance
 */
export const sendFirebaseOtp = async (rawPhone, verifier) => {
  if (!auth) throw new Error('Firebase Auth is not initialized');

  const cleanPhone = rawPhone.toString().replace(/\D/g, '').slice(-10);
  const formattedE164 = `+91${cleanPhone}`;

  const confirmationResult = await signInWithPhoneNumber(auth, formattedE164, verifier);
  window.confirmationResult = confirmationResult;
  return confirmationResult;
};

/**
 * Verify SMS OTP Code with Firebase
 * @param {ConfirmationResult} confirmationResult 
 * @param {string} code - 6-digit OTP code entered by user
 */
export const confirmFirebaseOtp = async (confirmationResult, code) => {
  if (!confirmationResult && window.confirmationResult) {
    confirmationResult = window.confirmationResult;
  }
  if (!confirmationResult) {
    throw new Error('No active OTP session found. Please request a new OTP.');
  }

  const credential = await confirmationResult.confirm(code);
  const user = credential.user;
  const idToken = await user.getIdToken();

  return {
    user,
    idToken,
    phoneNumber: user.phoneNumber
  };
};
