// ==================== AUTH ====================
function handleLogin(event) {
    event.preventDefault();
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var btn = document.getElementById('loginBtn');
    if (!email || !password) { showLoginError('Veuillez remplir tous les champs'); return false; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    hideLoginError();

    auth.signInWithEmailAndPassword(email, password)
        .then(function(uc) {
            return db.collection('users').doc(uc.user.uid).get();
        })
        .then(function(doc) {
            if (!doc.exists) { auth.signOut(); showLoginError('Compte introuvable'); return; }
            var userData = doc.data();
            if (userData.authorized !== 'yes') { auth.signOut(); showLoginError('Compte en attente de validation'); return; }
            window.currentUserData = { uid: doc.id, userData: userData };
            localStorage.setItem('currentUser', JSON.stringify(window.currentUserData));
            if (userData.role === 'client') showClientPage();
            else showDashboard();
        })
        .catch(function(error) {
            var msg = 'Erreur de connexion';
            if (error.code === 'auth/user-not-found') msg = 'Email introuvable';
            else if (error.code === 'auth/wrong-password') msg = 'Mot de passe incorrect';
            else if (error.code === 'auth/too-many-requests') msg = 'Trop de tentatives, réessayez plus tard';
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
        el.style.cssText = 'background:#fee2e2;color:#991b1b;padding:12px 15px;border-radius:12px;margin-bottom:15px;font-size:0.9rem;text-align:center;border:2px solid #fecaca;';
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
    var nom = document.getElementById('regNom').value.trim();
    var prenom = document.getElementById('regPrenom').value.trim();
    var username = document.getElementById('regUsername').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var telephone = document.getElementById('regTelephone').value.trim();
    var role = document.getElementById('regRole').value;
    var password = document.getElementById('regPassword').value;
    var btn = document.getElementById('registerBtn');

    // Créer ou récupérer la boîte de message (succès/erreur)
    var msgBox = document.getElementById('registerMsgBox');
    if (!msgBox) {
        msgBox = document.createElement('div');
        msgBox.id = 'registerMsgBox';
        msgBox.style.cssText = 'padding:12px 15px;border-radius:12px;margin-bottom:15px;font-size:0.9rem;text-align:center;display:none;';
        var container = document.querySelector('#registerContainer .register-form');
        if (container) container.insertBefore(msgBox, container.firstChild);
    }
    // Cacher tout message précédent
    msgBox.style.display = 'none';

    // Validation des champs
    if (!nom || !prenom || !username || !email || !telephone || !role || !password) {
        msgBox.style.background = '#fee2e2'; msgBox.style.color = '#991b1b'; msgBox.style.border = '2px solid #fecaca';
        msgBox.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Tous les champs sont obligatoires';
        msgBox.style.display = 'block';
        return false;
    }
    if (password.length < 6) {
        msgBox.style.background = '#fee2e2'; msgBox.style.color = '#991b1b'; msgBox.style.border = '2px solid #fecaca';
        msgBox.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Le mot de passe doit contenir au moins 6 caractères';
        msgBox.style.display = 'block';
        return false;
    }

    // Désactiver le bouton et lancer la création
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';

    auth.createUserWithEmailAndPassword(email, password)
        .then(function(uc) {
            // Enregistrer les infos supplémentaires dans Firestore
            return db.collection('users').doc(uc.user.uid).set({
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
            // ✅ Succès : message vert + bouton réactivé immédiatement
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte';

            msgBox.style.background = '#dcfce7'; msgBox.style.color = '#16a34a'; msgBox.style.border = '2px solid #bbf7d0';
            msgBox.innerHTML = '✅ Compte créé avec succès !<br>En attente de validation par l\'administrateur.<br>Redirection vers la connexion...';
            msgBox.style.display = 'block';
            document.getElementById('registerForm').reset();

            // Rediriger vers le formulaire de connexion après 2 secondes
            setTimeout(function() {
                showLogin();
            }, 2000);
        })
        .catch(function(error) {
            // ❌ Erreur : bouton réactivé + message rouge
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte';

            var msg = 'Erreur lors de la création';
            if (error.code === 'auth/email-already-in-use') msg = 'Cet email est déjà utilisé';
            else if (error.code === 'auth/weak-password') msg = 'Mot de passe trop faible (6 caractères minimum)';
            else if (error.code === 'auth/invalid-email') msg = 'Email invalide';
            else if (error.code === 'auth/operation-not-allowed') msg = 'L\'inscription par email/mot de passe n\'est pas activée. Contactez l\'administrateur.';
            msgBox.style.background = '#fee2e2'; msgBox.style.color = '#991b1b'; msgBox.style.border = '2px solid #fecaca';
            msgBox.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + msg;
            msgBox.style.display = 'block';
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
        console.error(e);
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
console.log('Auth JS OK');
