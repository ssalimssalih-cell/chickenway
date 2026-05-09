// ========== CONFIGURATION FIREBASE ==========
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
const auth = firebase.auth();
const db = firebase.firestore();

// ========== SWITCH TABS ==========
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.tab');
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        tabs[1].classList.add('active');
        tabs[0].classList.remove('active');
    }
}

// ========== REGISTER ==========
function register(event) {
    event.preventDefault();
    
    const nom = document.getElementById('nom').value.trim();
    const prenom = document.getElementById('prenom').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const telephone = document.getElementById('telephone').value.trim();
    const role = document.getElementById('role').value;
    const password = document.getElementById('password').value;

    // Validation
    if (password.length < 6) {
        alert('❌ Le mot de passe doit contenir au moins 6 caractères');
        return;
    }

    // Créer utilisateur dans Firebase Auth
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Sauvegarder les infos dans Firestore
            return db.collection('users').doc(user.uid).set({
                nom: nom,
                prenom: prenom,
                username: username,
                email: email,
                telephone: telephone,
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            alert('✅ Compte créé avec succès !');
            // Rediriger vers dashboard (à créer plus tard)
            // window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            let message = 'Erreur lors de l\'inscription';
            if (error.code === 'auth/email-already-in-use') {
                message = '❌ Cet email est déjà utilisé';
            } else if (error.code === 'auth/invalid-email') {
                message = '❌ Email invalide';
            } else if (error.code === 'auth/weak-password') {
                message = '❌ Mot de passe trop faible';
            }
            alert(message);
            console.error(error);
        });
}

// ========== LOGIN ==========
function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Vérifier si l'utilisateur existe dans Firestore
            return db.collection('users').doc(user.uid).get();
        })
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                alert('✅ Bienvenue ' + userData.prenom + ' ' + userData.nom + ' !');
                
                // Sauvegarder dans localStorage
                localStorage.setItem('currentUser', JSON.stringify(userData));
                
                // Rediriger vers dashboard (à créer plus tard)
                // window.location.href = 'dashboard.html';
                console.log('Utilisateur connecté:', userData);
            } else {
                alert('❌ Utilisateur non trouvé dans la base de données');
                auth.signOut();
            }
        })
        .catch((error) => {
            let message = 'Erreur de connexion';
            if (error.code === 'auth/user-not-found') {
                message = '❌ Aucun compte trouvé avec cet email';
            } else if (error.code === 'auth/wrong-password') {
                message = '❌ Mot de passe incorrect';
            } else if (error.code === 'auth/invalid-email') {
                message = '❌ Email invalide';
            }
            alert(message);
            console.error(error);
        });
}

// ========== VÉRIFIER SI DÉJÀ CONNECTÉ ==========
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('Utilisateur déjà connecté:', user.email);
        // Rediriger automatiquement vers le dashboard si déjà connecté
        // if (window.location.pathname.includes('index.html')) {
        //     window.location.href = 'dashboard.html';
        // }
    }
});
