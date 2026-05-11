// ==================== AUTH ====================
function handleLogin(event) {
    event.preventDefault();
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var btn = document.getElementById('loginBtn');
    
    if (!email || !password) { showLoginError('Remplissez tous les champs'); return false; }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    hideLoginError();
    
    auth.signInWithEmailAndPassword(email, password).then(function(userCredential) {
        return db.collection('users').doc(userCredential.user.uid).get().then(function(doc) {
            if (!doc.exists) { auth.signOut(); showLoginError('Compte introuvable'); return; }
            var userData = doc.data();
            if (userData.authorized !== 'yes') { 
                auth.signOut(); 
                showLoginError('Compte en attente de validation par l\'administrateur.'); 
                return; 
            }
            window.currentUserData = { uid: doc.id, userData: userData };
            localStorage.setItem('currentUser', JSON.stringify(window.currentUserData));
            if (userData.role === 'client') showClientPage();
            else showDashboard();
        });
    }).catch(function(error) {
        var msg = error.code === 'auth/user-not-found' ? 'Email non trouve' : 
                  error.code === 'auth/wrong-password' ? 'Mot de passe incorrect' : 
                  error.code === 'auth/invalid-email' ? 'Email invalide' : error.message;
        showLoginError(msg);
    }).finally(function() {
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
        el.style.cssText = 'background:#fee2e2;color:#991b1b;padding:15px;border-radius:12px;margin-bottom:20px;font-size:0.9rem;text-align:center;border:2px solid #fecaca;';
        var loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.parentNode.insertBefore(el, loginForm);
    }
    el.innerHTML = msg;
    el.style.display = 'block';
}

function hideLoginError() {
    var e = document.getElementById('loginError');
    if (e) e.style.display = 'none';
}

function handleRegister(event) {
    event.preventDefault();
    var nom = document.getElementById('regNom').value.trim();
    var prenom = document.getElementById('regPrenom').value.trim();
    var username = document.getElementById('regUsername').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var telephone = document.getElementById('regTelephone').value.trim();
    var role = document.getElementById('regRole').value;
    var password = document.getElementById('regPassword').value;
    var btn = document.getElementById('registerBtn');
    
    if (!nom || !prenom || !username || !email || !telephone || !role || !password) {
        alert('Tous les champs sont obligatoires');
        return false;
    }
    if (password.length < 6) { alert('Mot de passe: 6 caracteres minimum'); return false; }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creation...';
    
    auth.createUserWithEmailAndPassword(email, password).then(function(userCredential) {
        return db.collection('users').doc(userCredential.user.uid).set({
            nom: nom,
            prenom: prenom,
            username: username,
            email: email,
            telephone: telephone,
            role: role,
            authorized: 'no',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: 'self'
        });
    }).then(function() {
        alert('Compte cree avec succes !\n\nVotre compte est en attente de validation par l\'administrateur.\nVous recevrez un email de confirmation.');
        document.getElementById('registerForm').reset();
        showLogin();
    }).catch(function(e) {
        if (e.code === 'auth/email-already-in-use') {
            alert('Cet email est deja utilise.');
        } else if (e.code === 'auth/weak-password') {
            alert('Mot de passe trop faible.');
        } else {
            alert('Erreur: ' + e.message);
        }
    }).finally(function() {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Creer mon compte';
    });
    return false;
}

function handleLogout() {
    auth.signOut().then(function() {
        localStorage.removeItem('currentUser');
        window.currentUser = null;
        window.currentUserData = null;
        showAuthPage();
    });
}

function showLogin() { 
    document.getElementById('loginContainer').classList.remove('hidden'); 
    document.getElementById('registerContainer').classList.add('hidden'); 
    hideLoginError(); 
}

function showRegister() { 
    document.getElementById('loginContainer').classList.add('hidden'); 
    document.getElementById('registerContainer').classList.remove('hidden'); 
    hideLoginError(); 
}

console.log('Auth JS chargé');
