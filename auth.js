function handleLogin(event) {
    event.preventDefault();
    var email = document.getElementById('loginEmail');
    var password = document.getElementById('loginPassword');
    var btn = document.getElementById('loginBtn');
    
    if (!email || !password || !btn) { console.error('Éléments manquants'); return false; }
    if (!email.value.trim() || !password.value) { showLoginError('Remplissez tous les champs'); return false; }
    
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...'; hideLoginError();
    auth.signInWithEmailAndPassword(email.value.trim(), password.value).then(function(uc) {
        return db.collection('users').doc(uc.user.uid).get().then(function(doc) {
            if (!doc.exists) { auth.signOut(); showLoginError('Compte introuvable'); return; }
            var ud = doc.data();
            if (ud.authorized !== 'yes') { auth.signOut(); showLoginError('En attente de validation.'); return; }
            window.currentUserData = { uid: doc.id, userData: ud };
            localStorage.setItem('currentUser', JSON.stringify(window.currentUserData));
            if (ud.role === 'client') showClientPage(); else showDashboard();
        });
    }).catch(function(e) { 
        var msg = e.code === 'auth/user-not-found' ? 'Email introuvable' : e.code === 'auth/wrong-password' ? 'Mot de passe incorrect' : e.message;
        showLoginError(msg); 
    }).finally(function() { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter'; });
    return false;
}

function showLoginError(msg) { var el = document.getElementById('loginError'); if (!el) { el = document.createElement('div'); el.id = 'loginError'; el.style.cssText = 'background:#fee2e2;color:#991b1b;padding:12px;border-radius:12px;margin-bottom:15px;font-size:.85rem;text-align:center;'; var lf = document.getElementById('loginForm'); if (lf) lf.parentNode.insertBefore(el, lf); } el.innerHTML = msg; el.style.display = 'block'; }
function hideLoginError() { var e = document.getElementById('loginError'); if (e) e.style.display = 'none'; }

function handleRegister(event) {
    event.preventDefault();
    var nom = document.getElementById('regNom'), prenom = document.getElementById('regPrenom'), username = document.getElementById('regUsername'), email = document.getElementById('regEmail'), telephone = document.getElementById('regTelephone'), role = document.getElementById('regRole'), password = document.getElementById('regPassword'), btn = document.getElementById('registerBtn');
    if (!btn) { console.error('Bouton registerBtn introuvable'); return false; }
    if (!nom.value.trim() || !prenom.value.trim() || !username.value.trim() || !email.value.trim() || !telephone.value.trim() || !role.value || !password.value) { alert('Tous les champs obligatoires'); return false; }
    if (password.value.length < 6) { alert('6 caractères minimum'); return false; }
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
    auth.createUserWithEmailAndPassword(email.value.trim(), password.value).then(function(uc) {
        return db.collection('users').doc(uc.user.uid).set({ nom:nom.value.trim(), prenom:prenom.value.trim(), username:username.value.trim(), email:email.value.trim(), telephone:telephone.value.trim(), role:role.value, authorized:'no', createdAt:firebase.firestore.FieldValue.serverTimestamp() });
    }).then(function() { alert('Compte créé ! En attente de validation.'); document.getElementById('registerForm').reset(); showLogin(); }).catch(function(e) { alert(e.message); }).finally(function() { btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte'; });
    return false;
}

function handleLogout() { auth.signOut().then(function() { localStorage.removeItem('currentUser'); window.currentUser = null; window.currentUserData = null; showAuthPage(); }); }
function showLogin() { document.getElementById('loginContainer').classList.remove('hidden'); document.getElementById('registerContainer').classList.add('hidden'); hideLoginError(); }
function showRegister() { document.getElementById('loginContainer').classList.add('hidden'); document.getElementById('registerContainer').classList.remove('hidden'); hideLoginError(); }
console.log('Auth JS OK');
