// ============================================
// CHICKEN WAY - SCRIPT
// ============================================

let currentUser = null;
let currentUserData = null;

// ============================================
// INIT
// ============================================
window.addEventListener('DOMContentLoaded', function() {
    console.log('🍗 Chicken Way - Prêt');
    
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK manquant');
        return;
    }
    
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

// ============================================
// AFFICHAGE PAGES
// ============================================
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
    navigateTo('dashboard');
}

function showLogin() {
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('registerContainer').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('registerContainer').classList.remove('hidden');
}

// ============================================
// LOGIN
// ============================================
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
            else msg = '❌ ' + error.message;
            alert(msg);
        })
        .finally(function() {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
        });
    
    return false;
}

// ============================================
// REGISTER
// ============================================
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
            else msg = '❌ ' + error.message;
            alert(msg);
        })
        .finally(function() {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte';
        });
    
    return false;
}

// ============================================
// LOGOUT
// ============================================
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

// ============================================
// USER DATA
// ============================================
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
        el.innerHTML = '<i class="fas fa-user-circle"></i> ' + currentUserData.prenom + ' ' + currentUserData.nom + ' <small style="color:#f39c12;">(' + currentUserData.role + ')</small>';
    }
}

// ============================================
// NAVIGATION
// ============================================
function navigateTo(page) {
    var items = document.querySelectorAll('.nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    
    var pages = [
        'dashboard', 'pos', 'categories', 'products',
        'clients', 'fournisseurs', 'ventes', 'credits', 'depenses',
        'statistiques', 'options'
    ];
    
    var index = pages.indexOf(page);
    if (index >= 0 && items[index]) {
        items[index].classList.add('active');
    }
    
    var titles = {
        'dashboard': 'Dashboard',
        'pos': 'Point de Vente (POS)',
        'categories': 'Catégories',
        'products': 'Produits',
        'clients': 'Clients',
        'fournisseurs': 'Fournisseurs',
        'ventes': 'Ventes',
        'credits': 'Crédits',
        'depenses': 'Dépenses',
        'statistiques': 'Statistiques',
        'options': 'Options'
    };
    
    var icons = {
        'dashboard': 'fa-th-large',
        'pos': 'fa-cash-register',
        'categories': 'fa-layer-group',
        'products': 'fa-utensils',
        'clients': 'fa-users',
        'fournisseurs': 'fa-truck',
        'ventes': 'fa-shopping-cart',
        'credits': 'fa-credit-card',
        'depenses': 'fa-money-bill-wave',
        'statistiques': 'fa-chart-bar',
        'options': 'fa-cog'
    };
    
    document.getElementById('pageTitle').textContent = titles[page] || 'Page';
    
    var headerIcon = document.querySelector('.header-title i');
    if (headerIcon && icons[page]) {
        headerIcon.className = 'fas ' + icons[page];
    }
    
    var content = document.getElementById('dynamicContent');
    
    if (page === 'dashboard') {
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-shopping-bag"></i></div>
                    <div class="stat-info">
                        <span class="stat-label">Ventes aujourd'hui</span>
                        <span class="stat-value" id="todayOrders">0</span>
                        <span class="stat-unit">commandes</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-euro-sign"></i></div>
                    <div class="stat-info">
                        <span class="stat-label">Revenus</span>
                        <span class="stat-value" id="todayRevenue">0.00</span>
                        <span class="stat-unit">€</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-utensils"></i></div>
                    <div class="stat-info">
                        <span class="stat-label">Produits</span>
                        <span class="stat-value" id="productsCount">0</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-info">
                        <span class="stat-label">Clients</span>
                        <span class="stat-value" id="clientsCount">0</span>
                    </div>
                </div>
            </div>
            <div class="content-card">
                <div class="card-header">
                    <h3><i class="fas fa-clock"></i> Commandes récentes</h3>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr><th>N°</th><th>Client</th><th>Total</th><th>Date</th></tr>
                        </thead>
                        <tbody id="recentOrdersTable">
                            <tr><td colspan="4" style="text-align:center;">Aucune commande</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        loadDashboardStats();
        
    } else if (page === 'options') {
        content.innerHTML = `
            <div class="content-card">
                <div class="card-header">
                    <h3><i class="fas fa-cog"></i> Options</h3>
                </div>
                <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                    <i class="fas fa-cog" style="font-size: 4rem; margin-bottom: 20px; display: block;"></i>
                    <p style="font-size: 1.3rem; font-weight: 600;">Options</p>
                    <p>Gestion des paramètres et autorisations</p>
                    <p style="font-size: 0.85rem; margin-top: 10px;">Page en cours de développement</p>
                </div>
            </div>
        `;
        
    } else {
        content.innerHTML = `
            <div class="content-card">
                <div class="card-header">
                    <h3><i class="fas ${icons[page] || 'fa-file'}"></i> ${titles[page]}</h3>
                </div>
                <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                    <i class="fas ${icons[page] || 'fa-tools'}" style="font-size: 4rem; margin-bottom: 20px; display: block;"></i>
                    <p style="font-size: 1.3rem; font-weight: 600;">${titles[page]}</p>
                    <p>Page en cours de développement</p>
                </div>
            </div>
        `;
    }
}

// ============================================
// STATS
// ============================================
function loadDashboardStats() {
    db.collection('products').get().then(function(snap) {
        var el = document.getElementById('productsCount');
        if (el) el.textContent = snap.size;
    }).catch(function() {});
    
    db.collection('users').where('role', '==', 'client').get().then(function(snap) {
        var el = document.getElementById('clientsCount');
        if (el) el.textContent = snap.size;
    }).catch(function() {});
    
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    
    db.collection('orders').where('createdAt', '>=', today).get().then(function(snap) {
        var el = document.getElementById('todayOrders');
        if (el) el.textContent = snap.size;
        
        var total = 0;
        snap.forEach(function(doc) {
            total += doc.data().total || 0;
        });
        var revEl = document.getElementById('todayRevenue');
        if (revEl) revEl.textContent = total.toFixed(2);
    }).catch(function() {});
}

console.log('✅ Script OK');
