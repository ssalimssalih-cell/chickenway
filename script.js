// ============================================
// CHICKEN WAY - TOUS EN ATTENTE + SUPPRESSION
// ============================================

let currentUser = null;
let currentUserData = null;

// INIT
window.addEventListener('DOMContentLoaded', function() {
    console.log('🍗 Chicken Way');
    auth.onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            loadUserData(user.uid);
            showDashboard();
        } else {
            currentUser = null;
            currentUserData = null;
            showAuthPage();
        }
    });
});

// AFFICHAGE
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

// LOGIN
function handleLogin(event) {
    event.preventDefault();
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var btn = document.getElementById('loginBtn');
    
    if (!email || !password) { alert('❌ Remplissez tous les champs'); return false; }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    
    auth.signInWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            return db.collection('users').doc(userCredential.user.uid).get();
        })
        .then(function(doc) {
            if (doc.exists) {
                var userData = doc.data();
                
                if (userData.authorized !== 'yes') {
                    alert('⏳ Votre compte n\'a pas encore été autorisé par l\'administrateur.');
                    auth.signOut();
                    return;
                }
                
                currentUserData = { uid: doc.id, ...userData };
                localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                alert('✅ Bienvenue ' + currentUserData.prenom + ' !');
                showDashboard();
            } else {
                alert('❌ Profil non trouvé');
                auth.signOut();
            }
        })
        .catch(function(error) {
            var msg = 'Erreur';
            if (error.code === 'auth/user-not-found') msg = '❌ Email non trouvé';
            else if (error.code === 'auth/wrong-password') msg = '❌ Mot de passe incorrect';
            else msg = '❌ ' + error.message;
            alert(msg);
        })
        .finally(function() { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter'; });
    return false;
}

// REGISTER
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
        alert('❌ Tous les champs sont obligatoires'); return false;
    }
    if (password.length < 6) { alert('❌ Mot de passe : minimum 6 caractères'); return false; }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            return db.collection('users').doc(userCredential.user.uid).set({
                nom: nom, prenom: prenom, username: username,
                email: email, telephone: telephone, role: role,
                authorized: 'no',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(function() {
            alert('✅ Compte créé !\n\n⏳ En attente de validation par l\'administrateur.');
            document.getElementById('registerForm').reset();
            showLogin();
        })
        .catch(function(error) {
            var msg = 'Erreur';
            if (error.code === 'auth/email-already-in-use') msg = '❌ Cet email est déjà utilisé';
            else msg = '❌ ' + error.message;
            alert(msg);
        })
        .finally(function() { btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte'; });
    return false;
}

// LOGOUT
function handleLogout() {
    if (confirm('Déconnexion ?')) {
        auth.signOut().then(function() {
            localStorage.removeItem('currentUser');
            currentUser = null; currentUserData = null;
            showAuthPage();
        });
    }
}

// USER DATA
function loadUserData(uid) {
    db.collection('users').doc(uid).get().then(function(doc) {
        if (doc.exists) { currentUserData = { uid: doc.id, ...doc.data() }; updateSidebarUserInfo(); }
    }).catch(function() {});
}
function updateSidebarUserInfo() {
    var el = document.getElementById('sidebarUserInfo');
    if (el && currentUserData) {
        el.innerHTML = '<i class="fas fa-user-circle"></i> ' + currentUserData.prenom + ' ' + currentUserData.nom + ' <small style="color:#f39c12;">(' + currentUserData.role + ')</small>';
    }
}

// NAVIGATION
function navigateTo(page) {
    var items = document.querySelectorAll('.nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    var pages = ['dashboard','pos','categories','products','clients','fournisseurs','ventes','credits','depenses','statistiques','options'];
    var index = pages.indexOf(page);
    if (index >= 0 && items[index]) items[index].classList.add('active');
    
    var titles = { dashboard:'Dashboard', pos:'POS', categories:'Catégories', products:'Produits', clients:'Clients', fournisseurs:'Fournisseurs', ventes:'Ventes', credits:'Crédits', depenses:'Dépenses', statistiques:'Statistiques', options:'Options' };
    var icons = { dashboard:'fa-th-large', pos:'fa-cash-register', categories:'fa-layer-group', products:'fa-utensils', clients:'fa-users', fournisseurs:'fa-truck', ventes:'fa-shopping-cart', credits:'fa-credit-card', depenses:'fa-money-bill-wave', statistiques:'fa-chart-bar', options:'fa-cog' };
    
    document.getElementById('pageTitle').textContent = titles[page] || 'Page';
    var hi = document.querySelector('.header-title i');
    if (hi && icons[page]) hi.className = 'fas ' + icons[page];
    
    var content = document.getElementById('dynamicContent');
    
    if (page === 'dashboard') {
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-bag"></i></div><div class="stat-info"><span class="stat-label">Ventes</span><span class="stat-value" id="todayOrders">0</span></div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-euro-sign"></i></div><div class="stat-info"><span class="stat-label">Revenus</span><span class="stat-value" id="todayRevenue">0.00</span></div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-utensils"></i></div><div class="stat-info"><span class="stat-label">Produits</span><span class="stat-value" id="productsCount">0</span></div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value" id="clientsCount">0</span></div></div>
            </div>
            <div class="content-card"><div class="card-header"><h3><i class="fas fa-clock"></i> Commandes</h3></div><table class="data-table"><thead><tr><th>N°</th><th>Client</th><th>Total</th><th>Date</th></tr></thead><tbody id="recentOrdersTable"><tr><td colspan="4" style="text-align:center;">Aucune</td></tr></tbody></table></div>
        `;
        loadDashboardStats();
    } else if (page === 'options') {
        loadOptionsPage();
    } else {
        content.innerHTML = `<div class="content-card"><div class="card-header"><h3><i class="fas ${icons[page]}"></i> ${titles[page]}</h3></div><div style="text-align:center;padding:60px;color:#94a3b8;"><i class="fas ${icons[page]}" style="font-size:4rem;margin-bottom:20px;display:block;"></i><p style="font-size:1.3rem;font-weight:600;">${titles[page]}</p><p>Page en développement</p></div></div>`;
    }
}

// ==========================================
// OPTIONS - AUTORISER / SUPPRIMER
// ==========================================
function loadOptionsPage() {
    var content = document.getElementById('dynamicContent');
    if (!currentUserData || currentUserData.role !== 'admin') {
        content.innerHTML = '<div class="content-card"><div style="text-align:center;padding:60px;color:#ef4444;"><i class="fas fa-lock" style="font-size:4rem;"></i><p style="font-size:1.3rem;font-weight:600;">Accès réservé Admin</p></div></div>';
        return;
    }
    
    content.innerHTML = `
        <div class="stats-grid" style="margin-bottom:20px;">
            <div class="stat-card"><div class="stat-icon" style="background:#fef3c7;"><i class="fas fa-clock" style="color:#d97706;"></i></div><div class="stat-info"><span class="stat-label">En attente</span><span class="stat-value" id="pendingCount">0</span></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#dcfce7;"><i class="fas fa-check-circle" style="color:#16a34a;"></i></div><div class="stat-info"><span class="stat-label">Autorisés</span><span class="stat-value" id="authorizedCount">0</span></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#e0e7ff;"><i class="fas fa-users" style="color:#4f46e5;"></i></div><div class="stat-info"><span class="stat-label">Total</span><span class="stat-value" id="totalUsers">0</span></div></div>
        </div>
        <div class="content-card">
            <div class="card-header"><h3><i class="fas fa-users-cog"></i> Gestion des utilisateurs</h3><button class="btn-add" onclick="rafraichirOptions()"><i class="fas fa-sync-alt"></i> Actualiser</button></div>
            <div class="table-container">
                <table class="data-table">
                    <thead><tr><th>Username</th><th>Nom complet</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Date</th><th>Actions</th></tr></thead>
                    <tbody id="usersTableBody"><tr><td colspan="7" style="text-align:center;">Chargement...</td></tr></tbody>
                </table>
            </div>
        </div>
    `;
    loadUsersList();
}

function loadUsersList() {
    db.collection('users').orderBy('createdAt', 'desc').get()
        .then(function(snapshot) {
            var pending = 0, authorized = 0;
            var tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = '';
            
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Aucun utilisateur</td></tr>';
                document.getElementById('pendingCount').textContent = '0';
                document.getElementById('authorizedCount').textContent = '0';
                document.getElementById('totalUsers').textContent = '0';
                return;
            }
            
            snapshot.forEach(function(doc) {
                var user = doc.data();
                var userId = doc.id;
                
                if (user.authorized === 'no') pending++;
                else authorized++;
                
                var statusBadge = user.authorized === 'yes' ? 
                    '<span class="status-success">✅ Autorisé</span>' : 
                    '<span class="status-warning">⏳ En attente</span>';
                
                var dateStr = user.createdAt ? 
                    new Date(user.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : 'N/A';
                
                // Boutons d'action
                var actionBtns = '';
                
                if (user.authorized === 'no') {
                    actionBtns = `
                        <button class="btn-add" style="padding:6px 10px;font-size:0.7rem;margin-right:5px;" onclick="autoriserUser('${userId}')" title="Autoriser">
                            <i class="fas fa-check"></i> 
                        </button>
                        <button class="btn-delete" style="padding:6px 10px;font-size:0.7rem;" onclick="supprimerUser('${userId}')" title="Supprimer">
                            <i class="fas fa-trash"></i> 
                        </button>
                    `;
                } else {
                    actionBtns = `
                        <button class="btn-edit" style="padding:6px 10px;font-size:0.7rem;margin-right:5px;color:#d97706;" onclick="desactiverUser('${userId}')" title="Désactiver">
                            <i class="fas fa-ban"></i> 
                        </button>
                        <button class="btn-delete" style="padding:6px 10px;font-size:0.7rem;" onclick="supprimerUser('${userId}')" title="Supprimer">
                            <i class="fas fa-trash"></i> 
                        </button>
                    `;
                }
                
                var row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>@${user.username}</strong></td>
                    <td>${user.prenom} ${user.nom}</td>
                    <td>${user.email}</td>
                    <td><span style="text-transform:capitalize;">${user.role}</span></td>
                    <td>${statusBadge}</td>
                    <td>${dateStr}</td>
                    <td>${actionBtns}</td>
                `;
                tbody.appendChild(row);
            });
            
            document.getElementById('pendingCount').textContent = pending;
            document.getElementById('authorizedCount').textContent = authorized;
            document.getElementById('totalUsers').textContent = snapshot.size;
        })
        .catch(function(error) {
            console.error('❌ Erreur:', error);
            document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="7" style="text-align:center;color:#ef4444;">Erreur de chargement</td></tr>';
        });
}

// AUTORISER
function autoriserUser(uid) {
    if (confirm('✅ Autoriser cet utilisateur à se connecter ?')) {
        db.collection('users').doc(uid).update({ 
            authorized: 'yes', 
            updatedAt: firebase.firestore.FieldValue.serverTimestamp() 
        })
        .then(function() { 
            alert('✅ Utilisateur autorisé avec succès !'); 
            loadUsersList(); 
        })
        .catch(function(e) { 
            alert('❌ Erreur: ' + e.message); 
        });
    }
}

// DÉSACTIVER
function desactiverUser(uid) {
    if (confirm('⏳ Désactiver cet utilisateur ? Il ne pourra plus se connecter.')) {
        db.collection('users').doc(uid).update({ 
            authorized: 'no', 
            updatedAt: firebase.firestore.FieldValue.serverTimestamp() 
        })
        .then(function() { 
            alert('✅ Utilisateur désactivé !'); 
            loadUsersList(); 
        })
        .catch(function(e) { 
            alert('❌ Erreur: ' + e.message); 
        });
    }
}

// SUPPRIMER
function supprimerUser(uid) {
    if (confirm('⚠️ ATTENTION !\n\nVoulez-vous vraiment SUPPRIMER cet utilisateur ?\n\nCette action est irréversible !')) {
        
        // Supprimer de Firestore d'abord
        db.collection('users').doc(uid).delete()
            .then(function() {
                alert('✅ Utilisateur supprimé de la base de données.');
                loadUsersList();
                
                // Note: Pour supprimer aussi de Firebase Auth, il faut une Cloud Function
                // car le client ne peut pas supprimer d'autres utilisateurs
                console.log('⚠️ Pour supprimer complètement, utilisez la console Firebase Auth');
            })
            .catch(function(e) { 
                alert('❌ Erreur: ' + e.message); 
            });
    }
}

function rafraichirOptions() { 
    loadUsersList(); 
}

// STATS
function loadDashboardStats() {
    db.collection('products').get().then(function(s) { var e = document.getElementById('productsCount'); if (e) e.textContent = s.size; }).catch(function() {});
    db.collection('users').where('role','==','client').get().then(function(s) { var e = document.getElementById('clientsCount'); if (e) e.textContent = s.size; }).catch(function() {});
    var today = new Date(); today.setHours(0,0,0,0);
    db.collection('orders').where('createdAt','>=',today).get().then(function(s) {
        var e = document.getElementById('todayOrders'); if (e) e.textContent = s.size;
        var t = 0; s.forEach(function(d) { t += d.data().total || 0; });
        var r = document.getElementById('todayRevenue'); if (r) r.textContent = t.toFixed(2);
    }).catch(function() {});
}

console.log('✅ Script OK');
