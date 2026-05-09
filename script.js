// ========== SWITCH TABS (Login/Register) ==========
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

// ========== FONCTION REGISTER ==========
function register(event) {
    event.preventDefault();
    
    // Récupérer les valeurs
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

    // Désactiver le bouton pendant l'inscription
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Création en cours...';

    // Créer l'utilisateur dans Firebase Auth
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Sauvegarder les informations dans Firestore
            return db.collection('users').doc(user.uid).set({
                nom: nom,
                prenom: prenom,
                username: username,
                email: email,
                telephone: telephone,
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            // Succès
            alert('✅ Compte créé avec succès ! Bienvenue ' + prenom + ' !');
            
            // Réinitialiser le formulaire
            document.getElementById('registerForm').reset();
            
            // Rediriger vers le dashboard (à créer)
            // window.location.href = 'dashboard.html';
            
            console.log('✅ Utilisateur enregistré dans Firestore');
        })
        .catch((error) => {
            // Gestion des erreurs
            let message = '❌ Erreur lors de l\'inscription';
            
            switch(error.code) {
                case 'auth/email-already-in-use':
                    message = '❌ Cet email est déjà utilisé';
                    break;
                case 'auth/invalid-email':
                    message = '❌ Format d\'email invalide';
                    break;
                case 'auth/weak-password':
                    message = '❌ Le mot de passe est trop faible';
                    break;
                case 'auth/operation-not-allowed':
                    message = '❌ Inscription par email/mot de passe non activée';
                    break;
                default:
                    message = '❌ ' + error.message;
            }
            
            alert(message);
            console.error('Erreur registration:', error);
        })
        .finally(() => {
            // Réactiver le bouton
            submitBtn.disabled = false;
            submitBtn.textContent = 'Créer un compte';
        });
}

// ========== FONCTION LOGIN ==========
function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Désactiver le bouton pendant la connexion
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Connexion en cours...';

    // Connecter l'utilisateur
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Vérifier si l'utilisateur existe dans Firestore
            return db.collection('users').doc(user.uid).get();
        })
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Sauvegarder les infos utilisateur dans localStorage
                localStorage.setItem('currentUser', JSON.stringify({
                    uid: doc.id,
                    ...userData
                }));
                
                alert('✅ Bienvenue ' + userData.prenom + ' ' + userData.nom + ' !');
                
                console.log('👤 Utilisateur connecté:', userData);
                
                // Rediriger vers le dashboard (à créer)
                // window.location.href = 'dashboard.html';
            } else {
                // L'utilisateur existe dans Auth mais pas dans Firestore
                alert('❌ Profil utilisateur non trouvé');
                auth.signOut();
            }
        })
        .catch((error) => {
            // Gestion des erreurs
            let message = '❌ Erreur de connexion';
            
            switch(error.code) {
                case 'auth/user-not-found':
                    message = '❌ Aucun compte trouvé avec cet email';
                    break;
                case 'auth/wrong-password':
                    message = '❌ Mot de passe incorrect';
                    break;
                case 'auth/invalid-email':
                    message = '❌ Format d\'email invalide';
                    break;
                case 'auth/user-disabled':
                    message = '❌ Ce compte a été désactivé';
                    break;
                case 'auth/too-many-requests':
                    message = '❌ Trop de tentatives. Réessayez plus tard';
                    break;
                default:
                    message = '❌ ' + error.message;
            }
            
            alert(message);
            console.error('Erreur login:', error);
        })
        .finally(() => {
            // Réactiver le bouton
            submitBtn.disabled = false;
            submitBtn.textContent = 'Se connecter';
        });
}

// ========== VÉRIFIER L'ÉTAT DE L'AUTHENTIFICATION ==========
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('✅ Utilisateur connecté:', user.email);
        
        // Mettre à jour le localStorage
        db.collection('users').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    localStorage.setItem('currentUser', JSON.stringify({
                        uid: user.uid,
                        ...doc.data()
                    }));
                }
            })
            .catch((error) => {
                console.error('Erreur mise à jour localStorage:', error);
            });
    } else {
        console.log('👋 Aucun utilisateur connecté');
        localStorage.removeItem('currentUser');
    }
});

// ========== FONCTIONS UTILITAIRES ==========

// Fonction pour récupérer l'utilisateur courant
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Fonction pour vérifier le rôle
function checkRole(requiredRole) {
    const user = getCurrentUser();
    return user && user.role === requiredRole;
}

// Fonction de déconnexion
function logout() {
    auth.signOut()
        .then(() => {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Erreur déconnexion:', error);
        });
}

console.log('🍗 Chicken Way - Script chargé avec succès');
