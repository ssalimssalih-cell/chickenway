// Configuration Firebase - Remplacez avec vos propres clés
const firebaseConfig = {
    apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "restaurant-xxxxx.firebaseapp.com",
    projectId: "restaurant-xxxxx",
    storageBucket: "restaurant-xxxxx.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
