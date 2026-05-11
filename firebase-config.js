if (typeof firebaseConfig === 'undefined') {
    const firebaseConfig = {
        apiKey: "AIzaSyDBtroF6W2tgAmJeGwtSCjNGeYcG77IfsU",
        authDomain: "chickenway2026.firebaseapp.com",
        projectId: "chickenway2026",
        storageBucket: "chickenway2026.firebasestorage.app",
        messagingSenderId: "734739564037",
        appId: "1:734739564037:web:649d31ff5d5b561ae93e6c"
    };
    firebase.initializeApp(firebaseConfig);
    var auth = firebase.auth();
    var db = firebase.firestore();
    var storage = firebase.storage();
    console.log('Firebase OK');
}
