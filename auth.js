function handleLogin(event) {
    event.preventDefault();
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var btn = document.getElementById('loginBtn');
    if (!email || !password) { showLoginError('Remplissez tous les champs'); return false; }
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...'; hideLoginError();
    auth.signInWithEmailAndPassword(email, password).then(function(uc) {
        return db.collection('users').doc(uc.user.uid).get().then(function(doc) {
            if (!doc.exists) { auth.signOut(); showLoginError('Compte introuvable'); return; }
            var ud = doc.data();
            if (ud.authorized !== 'yes') { auth.signOut(); showLoginError('En attente de validation.'); return; }
            window.currentUserData = { uid: doc.id, userData: ud };
            localStorage.setItem('currentUser', JSON.stringify(window.currentUserData));
            if (ud.role === 'client') showClientPage(); else showDashboard();
        });
    }).catch(function(e) { showLoginError(e.message); }).finally(function() { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter'; });
    return false;
}
function showLoginError(msg) { var el = document.getElementById('loginError'); if (!el) { el = document.createElement('div'); el.id = 'loginError'; el.style.cssText = 'background:#fee2e2;color:#991b1b;padding:15px;border-radius:12px;margin-bottom:20px;font-size:0.9rem;text-align:center;'; var lf = document.getElementById('loginForm'); if (lf) lf.parentNode.insertBefore(el, lf); } el.innerHTML = msg; el.style.display = 'block'; }
function hideLoginError() { var e = document.getElementById('loginError'); if (e) e.style.display = 'none'; }
function handleRegister(event) {
    event.preventDefault();
    var nom = document.getElementById('regNom').value.trim(), prenom = document.getElementById('regPrenom').value.trim(), username = document.getElementById('regUsername').value.trim(), email = document.getElementById('regEmail').value.trim(), telephone = document.getElementById('regTelephone').value.trim(), role = document.getElementById('regRole').value, password = document.getElementById('regPassword').value, btn = document.getElementById('registerBtn');
    if (!nom || !prenom || !username || !email || !telephone || !role || !password) { alert('Tous les champs obligatoires'); return false; }
    if (password.length < 6) { alert('6 caracteres minimum'); return false; }
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creation...';
    auth.createUserWithEmailAndPassword(email, password).then(function(uc) {
        return db.collection('users').doc(uc.user.uid).set({ nom:nom, prenom:prenom, username:username, email:email, telephone:telephone, role:role, authorized:'no', createdAt:firebase.firestore.FieldValue.serverTimestamp() });
    }).then(function() { alert('Compte cree ! En attente de validation.'); document.getElementById('registerForm').reset(); showLogin(); }).catch(function(e) { alert(e.message); }).finally(function() { btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus"></i> Creer mon compte'; });
    return false;
}
function handleLogout() { auth.signOut().then(function() { localStorage.removeItem('currentUser'); window.currentUser = null; window.currentUserData = null; showAuthPage(); }); }
function showLogin() { document.getElementById('loginContainer').classList.remove('hidden'); document.getElementById('registerContainer').classList.add('hidden'); hideLoginError(); }
function showRegister() { document.getElementById('loginContainer').classList.add('hidden'); document.getElementById('registerContainer').classList.remove('hidden'); hideLoginError(); }
console.log('Auth JS OK');
