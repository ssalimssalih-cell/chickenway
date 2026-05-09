// Attendre que tout soit chargé
window.addEventListener('DOMContentLoaded', function() {
    console.log('🍗 Chicken Way - Ready');
    
    // Vérifier Firebase
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK non chargé');
        return;
    }
    
    if (typeof auth === 'undefined') {
        console.error('❌ Auth non défini - Vérifiez firebase-config.js');
        return;
    }
    
    // Auth state observer
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log('✅ Connecté:', user.email);
            currentUser = user;
            loadUserData(user.uid);
            showDashboard();
        } else {
            console.log('👋 Non connecté');
            currentUser = null;
            currentUserData = null;
            showAuthPage();
        }
    });
});

let currentUser = null;
let currentUserData = null;

function showAuthPage() {
    document.getElementById('authPage').classList.remove('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('registerContainer').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    updateSidebarUserInfo();
    loadDashboardStats();
}

function showLogin() {
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('registerContainer').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('registerContainer').classList.remove('hidden');
}

function handleLogin(event) {
    event.preventDefault();
    
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var btn = document.getElementById('loginBtn');
    
    if (!email || !password) {
        alert('❌ Remplissez tous les champs');
        return false;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    
    auth.signInWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            return db.collection('users').doc(userCredential.user.uid).get();
        })
        .then(function(doc) {
            if (doc.exists) {
                currentUserData = { uid: doc.id, ...doc.data() };
                localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                alert('✅ Bienvenue ' + currentUserData.prenom + ' !');
                showDashboard();
            } else {
                alert('❌ Profil non trouvé');
                auth.signOut();
            }
        })
        .catch(function(error) {
            console.error('❌ Erreur:', error.code);
            var msg = 'Erreur';
            if (error.code === 'auth/user-not-found') msg = '❌ Email non trouvé';
            else if (error.code === 'auth/wrong-password') msg = '❌ Mot de passe incorrect';
            else if (error.code === 'auth/configuration-not-found') msg = '❌ Activez Email/Password dans Firebase Console';
            else msg = '❌ ' + error.message;
            alert(msg);
        })
        .finally(function() {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
        });
    
    return false;
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
        alert('❌ Tous les champs sont obligatoires');
        return false;
    }
    
    if (password.length < 6) {
        alert('❌ Mot de passe : minimum 6 caractères');
        return false;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            var user = userCredential.user;
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
        .then(function() {
            alert('✅ Compte créé !');
            document.getElementById('registerForm').reset();
            showLogin();
        })
        .catch(function(error) {
            console.error('❌ Erreur:', error.code);
            var msg = 'Erreur';
            if (error.code === 'auth/email-already-in-use') msg = '❌ Email déjà utilisé';
            else if (error.code === 'auth/operation-not-allowed') msg = '❌ Activez Email/Password dans Firebase Console';
            else if (error.code === 'auth/configuration-not-found') msg = '❌ Configuration Firebase manquante';
            else msg = '❌ ' + error.message;
            alert(msg);
        })
        .finally(function() {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte';
        });
    
    return false;
}

function handleLogout() {
    if (confirm('Déconnexion ?')) {
        auth.signOut().then(function() {
            localStorage.removeItem('currentUser');
            currentUser = null;
            currentUserData = null;
            showAuthPage();
        });
    }
}

function loadUserData(uid) {
    db.collection('users').doc(uid).get()
        .then(function(doc) {
            if (doc.exists) {
                currentUserData = { uid: doc.id, ...doc.data() };
                updateSidebarUserInfo();
            }
        })
        .catch(function(error) {
            console.error('Erreur:', error);
        });
}

function updateSidebarUserInfo() {
    var el = document.getElementById('sidebarUserInfo');
    if (el && currentUserData) {
        el.innerHTML = '<i class="fas fa-user-circle"></i> ' + currentUserData.prenom + ' ' + currentUserData.nom + ' <small style="color:#f39c12;">' + currentUserData.role + '</small>';
    }
}

function navigateTo(page) {
    var items = document.querySelectorAll('.nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    
    var pages = ['dashboard', 'pos', 'categories', 'products', 'clients', 'fournisseurs', 'ventes', 'credits', 'depenses', 'statistiques'];
    var index = pages.indexOf(page);
    if (index >= 0 && items[index]) items[index].classList.add('active');
    
    var titles = {
        dashboard: 'Dashboard', pos: 'Point de Vente', categories: 'Catégories',
        products: 'Produits', clients: 'Clients', fournisseurs: 'Fournisseurs',
        ventes: 'Ventes', credits: 'Crédits', depenses: 'Dépenses', statistiques: 'Statistiques'
    };
    
    document.getElementById('pageTitle').textContent = titles[page] || 'Page';
    
    if (page === 'dashboard') {
        document.getElementById('dynamicContent').innerHTML = `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-bag"></i></div><div class="stat-info"><span class="stat-label">Ventes aujourd'hui</span><span class="stat-value" id="todayOrders">0</span><span class="stat-unit">commandes</span></div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-euro-sign"></i></div><div class="stat-info"><span class="stat-label">Revenus</span><span class="stat-value" id="todayRevenue">0.00</span><span class="stat-unit">€</span></div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-utensils"></i></div><div class="stat-info"><span class="stat-label">Produits</span><span class="stat-value" id="productsCount">0</span></div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value" id="clientsCount">0</span></div></div>
            </div>
        `;
        loadDashboardStats();
    } else {
        document.getElementById('dynamicContent').innerHTML = '<div class="content-card"><h3>' + titles[page] + ' - En développement</h3></div>';
    }
}

function loadDashboardStats() {
    db.collection('products').get().then(function(snap) {
        var el = document.getElementById('productsCount');
        if (el) el.textContent = snap.size;
    }).catch(function() {});
    
    db.collection('users').where('role', '==', 'client').get().then(function(snap) {
        var el = document.getElementById('clientsCount');
        if (el) el.textContent = snap.size;
    }).catch(function() {});
}

console.log('✅ Script OK');
