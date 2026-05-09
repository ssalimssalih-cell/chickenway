// ============================================
// FIREBASE CONFIGURATION - CHICKEN WAY
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyDBtroF6W2tgAmJeGwtSCjNGeYcG77IfsU",
    authDomain: "chickenway2026.firebaseapp.com",
    projectId: "chickenway2026",
    storageBucket: "chickenway2026.firebasestorage.app",
    messagingSenderId: "734739564037",
    appId: "1:734739564037:web:649d31ff5d5b561ae93e6c"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);

// Références globales
const auth = firebase.auth();
const db = firebase.firestore();

console.log('✅ Firebase initialisé avec succès');
console.log('📧 Auth:', auth);
console.log('🗄️ Firestore:', db);
