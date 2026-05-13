// Variables globales partagées
var currentUser = null;
var currentUserData = null;

function handleLogin(event) {
    event.preventDefault();
    
    var emailInput = document.getElementById('loginEmail');
    var passwordInput = document.getElementById('loginPassword');
    var btn = document.getElementById('loginBtn');
    
    if (!emailInput || !passwordInput || !btn) {
        alert('Erreur: Page non chargée correctement. Rafraîchissez.');
        return false;
    }
    
    var email = emailInput.value.trim();
    var password = passwordInput.value;
    
    if (!email || !password) {
        showLoginError('Veuillez remplir tous les champs');
        return false;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    hideLoginError();
    
    auth.signInWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            return db.collection('users').doc(userCredential.user.uid).get();
        })
        .then(function(doc) {
            if (!doc.exists) {
                auth.signOut();
                showLoginError('Compte introuvable');
                return;
            }
            var userData = doc.data();
            if (userData.authorized !== 'yes') {
                auth.signOut();
                showLoginError('Compte en attente de validation par l\'administrateur');
                return;
            }
            window.currentUserData = { uid: doc.id, userData: userData };
            localStorage.setItem('currentUser', JSON.stringify(window.currentUserData));
            
            if (userData.role === 'client') {
                showClientPage();
            } else {
                showDashboard();
            }
        })
        .catch(function(error) {
            var msg = 'Erreur de connexion';
            if (error.code === 'auth/user-not-found') msg = 'Email introuvable';
            else if (error.code === 'auth/wrong-password') msg = 'Mot de passe incorrect';
            else if (error.code === 'auth/invalid-email') msg = 'Email invalide';
            else if (error.code === 'auth/too-many-requests') msg = 'Trop de tentatives, réessayez plus tard';
            else if (error.code === 'auth/network-request-failed') msg = 'Erreur réseau. Vérifiez votre connexion.';
            showLoginError(msg);
        })
        .finally(function() {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
        });
    
    return false;
}

function showLoginError(msg) {
    var el = document.getElementById('loginError');
    if (!el) {
        el = document.createElement('div');
        el.id = 'loginError';
        el.style.cssText = 'background:#fee2e2;color:#991b1b;padding:12px 15px;border-radius:12px;margin-bottom:15px;font-size:0.85rem;text-align:center;border:2px solid #fecaca;';
        var form = document.getElementById('loginForm');
        if (form) form.parentNode.insertBefore(el, form);
    }
    el.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + msg;
    el.style.display = 'block';
}

function hideLoginError() {
    var e = document.getElementById('loginError');
    if (e) e.style.display = 'none';
}

function handleRegister(event) {
    event.preventDefault();
    
    var nomInput = document.getElementById('regNom');
    var prenomInput = document.getElementById('regPrenom');
    var usernameInput = document.getElementById('regUsername');
    var emailInput = document.getElementById('regEmail');
    var telephoneInput = document.getElementById('regTelephone');
    var roleInput = document.getElementById('regRole');
    var passwordInput = document.getElementById('regPassword');
    var btn = document.getElementById('registerBtn');
    
    if (!btn) {
        alert('Erreur: Page non chargée correctement.');
        return false;
    }
    
    var nom = nomInput.value.trim();
    var prenom = prenomInput.value.trim();
    var username = usernameInput.value.trim();
    var email = emailInput.value.trim();
    var telephone = telephoneInput.value.trim();
    var role = roleInput.value;
    var password = passwordInput.value;
    
    if (!nom || !prenom || !username || !email || !telephone || !role || !password) {
        alert('Tous les champs sont obligatoires');
        return false;
    }
    if (password.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères');
        return false;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            return db.collection('users').doc(userCredential.user.uid).set({
                nom: nom,
                prenom: prenom,
                username: username,
                email: email,
                telephone: telephone,
                role: role,
                authorized: 'no',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(function() {
            alert('✅ Compte créé avec succès !\n\nVotre compte est en attente de validation par l\'administrateur.');
            document.getElementById('registerForm').reset();
            showLogin();
        })
        .catch(function(error) {
            if (error.code === 'auth/email-already-in-use') {
                alert('Cet email est déjà utilisé.');
            } else if (error.code === 'auth/weak-password') {
                alert('Mot de passe trop faible (6 caractères minimum).');
            } else if (error.code === 'auth/network-request-failed') {
                alert('Erreur réseau. Vérifiez votre connexion internet.');
            } else {
                alert('Erreur: ' + error.message);
            }
        })
        .finally(function() {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte';
        });
    
    return false;
}

function handleLogout() {
    auth.signOut().then(function() {
        localStorage.removeItem('currentUser');
        window.currentUser = null;
        window.currentUserData = null;
        showAuthPage();
    }).catch(function(e) {
        console.error('Erreur déconnexion:', e);
        showAuthPage();
    });
}

function showLogin() {
    var lc = document.getElementById('loginContainer');
    var rc = document.getElementById('registerContainer');
    if (lc) lc.classList.remove('hidden');
    if (rc) rc.classList.add('hidden');
    hideLoginError();
}

function showRegister() {
    var lc = document.getElementById('loginContainer');
    var rc = document.getElementById('registerContainer');
    if (lc) lc.classList.add('hidden');
    if (rc) rc.classList.remove('hidden');
    hideLoginError();
}

console.log('Auth JS OK');
