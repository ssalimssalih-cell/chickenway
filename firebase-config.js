// ==================== FIREBASE CONFIGURATION - ALMA COFFEE SHOP ====================
const firebaseConfig = {
    apiKey: "AIzaSyVOTRE_CLE_ICI",           // ← votre vraie clé API
    authDomain: "alma-coffee-shop.firebaseapp.com",
    projectId: "alma-coffee-shop",
    storageBucket: "alma-coffee-shop.firebasestorage.app",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};

// Initialisation Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log('☕ Alma Coffee Shop - Firebase OK');
