// ========== ATTENDRE LE CHARGEMENT DE LA PAGE ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🍗 Chicken Way - Page chargée');
});

// ========== SWITCH TABS (Login/Register) ==========
function switchTab(tab) {
    console.log('Switch tab:', tab);
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    
    if (!loginForm || !registerForm || !tabLogin || !tabRegister) {
        console.error('❌ Éléments non trouvés');
        return;
    }
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else if (tab === 'register') {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
    }
}

// ========== FONCTION REGISTER ==========
function register(event) {
    event.preventDefault();
    console.log('📝 Début inscription...');
    
    // Récupérer les valeurs
    const nom = document.getElementById('nom').value.trim();
    const prenom = document.getElementById('prenom').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const telephone = document.getElementById('telephone').value.trim();
    const role = document.getElementById('role').value;
    const password = document.getElementById('password').value;

    // Validation basique
    if (!nom || !prenom || !username || !email || !telephone || !role || !password) {
        alert('❌ Tous les champs sont obligatoires');
        return false;
    }

    if (password.length < 6) {
        alert('❌ Le mot de passe doit contenir au moins 6 caractères');
        return false;
    }

    // Désactiver le bouton
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Création en cours...';
    }

    // Créer l'utilisateur
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('✅ Auth créé:', user.uid);
            
            // Sauvegarder dans Firestore
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
            document.getElementById('registerForm').reset();
            console.log('✅ Données sauvegardées dans Firestore');
        })
        .catch((error) => {
            console.error('❌ Erreur:', error);
            alert('❌ Erreur: ' + error.message);
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Créer un compte';
            }
        });
    
    return false;
}

// ========== FONCTION LOGIN ==========
function login(event) {
    event.preventDefault();
    console.log('🔑 Tentative de connexion...');
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('❌ Email et mot de passe requis');
        return false;
    }

    // Désactiver le bouton
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Connexion...';
    }

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('✅ Connecté:', user.uid);
            
            // Vérifier dans Firestore
            return db.collection('users').doc(user.uid).get();
        })
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                console.log('👤 Données utilisateur:', userData);
                
                // Sauvegarder dans localStorage
                localStorage.setItem('currentUser', JSON.stringify({
                    uid: doc.id,
                    ...userData
                }));
                
                alert('✅ Bienvenue ' + userData.prenom + ' ' + userData.nom + ' !');
                console.log('💾 Session sauvegardée');
            } else {
                alert('❌ Profil non trouvé');
                auth.signOut();
            }
        })
        .catch((error) => {
            console.error('❌ Erreur connexion:', error);
            
            let message = 'Erreur de connexion';
            if (error.code === 'auth/user-not-found') {
                message = '❌ Email non trouvé';
            } else if (error.code === 'auth/wrong-password') {
                message = '❌ Mot de passe incorrect';
            } else {
                message = '❌ ' + error.message;
            }
            alert(message);
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Se connecter';
            }
        });
    
    return false;
}

// Vérifier l'état de l'authentification
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('✅ Utilisateur connecté:', user.email);
    } else {
        console.log('👋 Non connecté');
        localStorage.removeItem('currentUser');
    }
});

console.log('🍗 Script.js chargé avec succès');
