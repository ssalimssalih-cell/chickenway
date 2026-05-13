function handleLogin(event) {
    event.preventDefault();
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var btn = document.getElementById('loginBtn');
    
    // Vérification de sécurité
    if (!btn) { console.error('Bouton loginBtn introuvable'); return false; }
    
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

function handleRegister(event) {
    event.preventDefault();
    var nom = document.getElementById('regNom').value.trim(), prenom = document.getElementById('regPrenom').value.trim(), username = document.getElementById('regUsername').value.trim(), email = document.getElementById('regEmail').value.trim(), telephone = document.getElementById('regTelephone').value.trim(), role = document.getElementById('regRole').value, password = document.getElementById('regPassword').value, btn = document.getElementById('registerBtn');
    
    // Vérification de sécurité
    if (!btn) { console.error('Bouton registerBtn introuvable'); return false; }
    
    if (!nom || !prenom || !username || !email || !telephone || !role || !password) { alert('Tous les champs obligatoires'); return false; }
    if (password.length < 6) { alert('6 caracteres minimum'); return false; }
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creation...';
    auth.createUserWithEmailAndPassword(email, password).then(function(uc) {
        return db.collection('users').doc(uc.user.uid).set({ nom:nom, prenom:prenom, username:username, email:email, telephone:telephone, role:role, authorized:'no', createdAt:firebase.firestore.FieldValue.serverTimestamp() });
    }).then(function() { alert('Compte cree !'); document.getElementById('registerForm').reset(); showLogin(); }).catch(function(e) { alert(e.message); }).finally(function() { btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus"></i> Creer mon compte'; });
    return false;
}
