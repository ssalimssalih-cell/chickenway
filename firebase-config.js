if (typeof firebaseConfig === 'undefined') {
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← une vraie clé, pas "VOTRE_API_KEY"
  authDomain: "alma-coffee-shop.firebaseapp.com",
  projectId: "alma-coffee-shop",
  storageBucket: "alma-coffee-shop.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:..."
};
    firebase.initializeApp(firebaseConfig);
    var auth = firebase.auth();
    var db = firebase.firestore();
    var storage = firebase.storage();
    console.log('Firebase OK');
}
