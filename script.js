// ============================================
// CHICKEN WAY - SCRIPT COMPLET
// ============================================

let currentUser = null;
let currentUserData = null;
let allUsers = [];

// ============================================
// INITIALISATION
// ============================================
window.addEventListener('DOMContentLoaded', function() {
    console.log('🍗 Chicken Way - Prêt');
    
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK manquant');
        return;
    }
    
    if (typeof auth === 'undefined') {
        console.error('❌ Auth non défini');
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
// MODAL
// ============================================
function openModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('detailModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

// ============================================
// AUTHENTIFICATION
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
                var userData = doc.data();
                
                // Vérifier si le compte est actif
                if (userData.status === 'en_attente') {
                    alert('⏳ Votre compte est en attente de validation par l\'administrateur.');
                    auth.signOut();
                    return;
                }
                
                if (userData.status === 'desactive') {
                    alert('❌ Votre compte a été désactivé. Contactez l\'administrateur.');
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
            
            // Statut par défaut : en_attente pour tous sauf admin
            var status = (role === 'admin') ? 'actif' : 'en_attente';
            
            return db.collection('users').doc(user.uid).set({
                nom: nom,
                prenom: prenom,
                username: username,
                email: email,
                telephone: telephone,
                role: role,
                status: status,
                permissions: {
                    dashboard: true,
                    pos: (role === 'admin' || role === 'caissier'),
                    categories: (role === 'admin'),
                    products: (role === 'admin'),
                    commandesEnLigne: true,
                    clients: (role === 'admin'),
                    fournisseurs: (role === 'admin'),
                    ventes: (role === 'admin' || role === 'caissier'),
                    credits: (role === 'admin'),
                    depenses: (role === 'admin'),
                    statistiques: (role === 'admin'),
                    options: (role === 'admin')
                },
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(function() {
            if (document.getElementById('regRole').value === 'admin') {
                alert('✅ Compte Admin créé ! Vous pouvez vous connecter.');
            } else {
                alert('✅ Compte créé ! En attente de validation par l\'administrateur.');
            }
            document.getElementById('registerForm').reset();
            showLogin();
        })
        .catch(function(error) {
            console.error('❌ Erreur:', error.code);
            var msg = 'Erreur';
            if (error.code === 'auth/email-already-in-use') msg = '❌ Email déjà utilisé';
            else if (error.code === 'auth/operation-not-allowed') msg = '❌ Activez Email/Password dans Firebase Console';
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

// ============================================
// DONNÉES UTILISATEUR
// ============================================
function loadUserData(uid) {
    db.collection('users').doc(uid).get()
        .then(function(doc) {
            if (doc.exists) {
                currentUserData = { uid: doc.id, ...doc.data() };
                localStorage.setItem('currentUser', JSON.stringify(currentUserData));
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
// VÉRIFICATION PERMISSIONS
// ============================================
function hasPermission(page) {
    if (!currentUserData || !currentUserData.permissions) return false;
    
    var permMap = {
        'dashboard': 'dashboard',
        'pos': 'pos',
        'categories': 'categories',
        'products': 'products',
        'commandes-en-ligne': 'commandesEnLigne',
        'clients': 'clients',
        'fournisseurs': 'fournisseurs',
        'ventes': 'ventes',
        'credits': 'credits',
        'depenses': 'depenses',
        'statistiques': 'statistiques',
        'options': 'options'
    };
    
    var permKey = permMap[page];
    if (!permKey) return true;
    
    return currentUserData.permissions[permKey] === true;
}

// ============================================
// NAVIGATION
// ============================================
function navigateTo(page) {
    // Vérifier permission
    if (!hasPermission(page)) {
        alert('⛔ Accès refusé. Vous n\'avez pas la permission d\'accéder à cette page.');
        return;
    }
    
    // Mise à jour menu actif
    var items = document.querySelectorAll('.nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    
    var pages = [
        'dashboard', 'pos', 'categories', 'products', 'commandes-en-ligne',
        'clients', 'fournisseurs', 'ventes', 'credits', 'depenses',
        'statistiques', 'options'
    ];
    
    var index = pages.indexOf(page);
    if (index >= 0 && items[index]) {
        items[index].classList.add('active');
    }
    
    // Titres et icônes
    var titles = {
        'dashboard': 'Dashboard',
        'pos': 'Point de Vente (POS)',
        'categories': 'Catégories',
        'products': 'Produits',
        'commandes-en-ligne': 'Commandes en ligne',
        'clients': 'Clients',
        'fournisseurs': 'Fournisseurs',
        'ventes': 'Ventes',
        'credits': 'Crédits',
        'depenses': 'Dépenses',
        'statistiques': 'Statistiques',
        'options': 'Options - Gestion des autorisations'
    };
    
    var icons = {
        'dashboard': 'fa-th-large',
        'pos': 'fa-cash-register',
        'categories': 'fa-layer-group',
        'products': 'fa-utensils',
        'commandes-en-ligne': 'fa-globe',
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
        loadDashboardContent(content);
    } else if (page === 'options') {
        loadOptionsContent(content);
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
// DASHBOARD
// ============================================
function loadDashboardContent(content) {
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

// ============================================
// OPTIONS - GESTION DES AUTORISATIONS
// ============================================
function loadOptionsContent(content) {
    // Vérifier que seul l'admin peut voir cette page
    if (!currentUserData || currentUserData.role !== 'admin') {
        content.innerHTML = `
            <div class="content-card">
                <div style="text-align: center; padding: 60px; color: #ef4444;">
                    <i class="fas fa-lock" style="font-size: 4rem; margin-bottom: 20px;"></i>
                    <p style="font-size: 1.3rem; font-weight: 600;">Accès réservé à l'administrateur</p>
                </div>
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <div class="content-card" style="margin-bottom: 20px;">
            <div class="card-header">
                <h3><i class="fas fa-users-cog"></i> Gestion des autorisations</h3>
                <span style="font-size: 0.85rem; color: #64748b;">
                    <i class="fas fa-info-circle"></i> Validez ou modifiez les comptes utilisateurs
                </span>
            </div>
        </div>
        
        <!-- Résumé -->
        <div class="stats-grid" style="margin-bottom: 20px;">
            <div class="stat-card">
                <div class="stat-icon" style="background: #fef3c7;"><i class="fas fa-clock" style="color: #d97706;"></i></div>
                <div class="stat-info">
                    <span class="stat-label">En attente</span>
                    <span class="stat-value" id="pendingCount">0</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: #dcfce7;"><i class="fas fa-check-circle" style="color: #16a34a;"></i></div>
                <div class="stat-info">
                    <span class="stat-label">Actifs</span>
                    <span class="stat-value" id="activeCount">0</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: #fee2e2;"><i class="fas fa-ban" style="color: #dc2626;"></i></div>
                <div class="stat-info">
                    <span class="stat-label">Désactivés</span>
                    <span class="stat-value" id="disabledCount">0</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: #e0e7ff;"><i class="fas fa-users" style="color: #4f46e5;"></i></div>
                <div class="stat-info">
                    <span class="stat-label">Total</span>
                    <span class="stat-value" id="totalUsersCount">0</span>
                </div>
            </div>
        </div>
        
        <!-- Tableau des utilisateurs -->
        <div class="content-card">
            <div class="card-header">
                <h3><i class="fas fa-list"></i> Liste des utilisateurs</h3>
                <button class="btn-add" onclick="rafraichirUtilisateurs()">
                    <i class="fas fa-sync-alt"></i> Actualiser
                </button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Utilisateur</th>
                            <th>Nom complet</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Rôle</th>
                            <th>Statut</th>
                            <th>Date création</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr>
                            <td colspan="8" style="text-align: center; padding: 30px;">
                                <i class="fas fa-spinner fa-spin"></i> Chargement...
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Charger les utilisateurs
    loadAllUsers();
}

function loadAllUsers() {
    db.collection('users').orderBy('createdAt', 'desc').get()
        .then(function(snapshot) {
            allUsers = [];
            var pending = 0, active = 0, disabled = 0;
            
            snapshot.forEach(function(doc) {
                var user = { id: doc.id, ...doc.data() };
                allUsers.push(user);
                
                if (user.status === 'en_attente') pending++;
                else if (user.status === 'actif') active++;
                else if (user.status === 'desactive') disabled++;
            });
            
            // Mettre à jour les compteurs
            document.getElementById('pendingCount').textContent = pending;
            document.getElementById('activeCount').textContent = active;
            document.getElementById('disabledCount').textContent = disabled;
            document.getElementById('totalUsersCount').textContent = allUsers.length;
            
            // Afficher le tableau
            displayUsersTable(allUsers);
        })
        .catch(function(error) {
            console.error('❌ Erreur:', error);
            document.getElementById('usersTableBody').innerHTML = `
                <tr><td colspan="8" style="text-align: center; color: #ef4444;">Erreur de chargement</td></tr>
            `;
        });
}

function displayUsersTable(users) {
    var tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Aucun utilisateur</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    users.forEach(function(user) {
        var row = document.createElement('tr');
        
        // Statut avec couleur
        var statusClass = '';
        var statusText = '';
        if (user.status === 'actif') {
            statusClass = 'status-success';
            statusText = '✅ Actif';
        } else if (user.status === 'en_attente') {
            statusClass = 'status-warning';
            statusText = '⏳ En attente';
        } else if (user.status === 'desactive') {
            statusClass = 'status-danger';
            statusText = '❌ Désactivé';
        }
        
        var dateStr = user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : 'N/A';
        
        row.innerHTML = `
            <td><strong>@${user.username || 'N/A'}</strong></td>
            <td>${user.prenom || ''} ${user.nom || ''}</td>
            <td>${user.email || 'N/A'}</td>
            <td>${user.telephone || 'N/A'}</td>
            <td><span style="text-transform: capitalize;">${user.role || 'N/A'}</span></td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td>${dateStr}</td>
            <td>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    ${user.status === 'en_attente' ? `
                        <button class="btn-edit" onclick="changerStatut('${user.id}', 'actif')" title="Activer" style="color: #16a34a;">
                            <i class="fas fa-check-circle"></i>
                        </button>
                    ` : ''}
                    ${user.status === 'actif' ? `
                        <button class="btn-edit" onclick="changerStatut('${user.id}', 'desactive')" title="Désactiver" style="color: #d97706;">
                            <i class="fas fa-pause-circle"></i>
                        </button>
                    ` : ''}
                    ${user.status === 'desactive' ? `
                        <button class="btn-edit" onclick="changerStatut('${user.id}', 'actif')" title="Réactiver" style="color: #16a34a;">
                            <i class="fas fa-play-circle"></i>
                        </button>
                    ` : ''}
                    <button class="btn-edit" onclick="gererPermissions('${user.id}')" title="Permissions" style="color: #4f46e5;">
                        <i class="fas fa-shield-alt"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function changerStatut(userId, newStatus) {
    var statusMessages = {
        'actif': 'activer',
        'desactive': 'désactiver'
    };
    
    if (!confirm('Voulez-vous ' + (statusMessages[newStatus] || 'changer') + ' cet utilisateur ?')) {
        return;
    }
    
    db.collection('users').doc(userId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(function() {
        alert('✅ Statut mis à jour !');
        loadAllUsers();
    })
    .catch(function(error) {
        alert('❌ Erreur: ' + error.message);
    });
}

function gererPermissions(userId) {
    var user = allUsers.find(function(u) { return u.id === userId; });
    if (!user) return;
    
    var permissions = user.permissions || {};
    
    var permList = [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'pos', label: 'Point de Vente (POS)' },
        { key: 'categories', label: 'Catégories' },
        { key: 'products', label: 'Produits' },
        { key: 'commandesEnLigne', label: 'Commandes en ligne' },
        { key: 'clients', label: 'Clients' },
        { key: 'fournisseurs', label: 'Fournisseurs' },
        { key: 'ventes', label: 'Ventes' },
        { key: 'credits', label: 'Crédits' },
        { key: 'depenses', label: 'Dépenses' },
        { key: 'statistiques', label: 'Statistiques' },
        { key: 'options', label: 'Options' }
    ];
    
    var permHTML = permList.map(function(p) {
        var checked = permissions[p.key] === true ? 'checked' : '';
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #e2e8f0;">
                <span style="font-weight: 600;">${p.label}</span>
                <label class="switch">
                    <input type="checkbox" ${checked} onchange="togglePermission('${userId}', '${p.key}', this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
        `;
    }).join('');
    
    var content = `
        <div style="margin-bottom: 20px;">
            <p><strong>Utilisateur:</strong> @${user.username}</p>
            <p><strong>Nom:</strong> ${user.prenom} ${user.nom}</p>
            <p><strong>Rôle:</strong> ${user.role}</p>
        </div>
        <h4 style="margin-bottom: 15px;">Permissions d'accès :</h4>
        ${permHTML}
    `;
    
    openModal('Gestion des permissions - ' + user.prenom, content);
}

function togglePermission(userId, permKey, value) {
    var updateData = {};
    updateData['permissions.' + permKey] = value;
    
    db.collection('users').doc(userId).update(updateData)
        .then(function() {
            console.log('✅ Permission mise à jour:', permKey, value);
            // Mettre à jour allUsers localement
            var user = allUsers.find(function(u) { return u.id === userId; });
            if (user) {
                if (!user.permissions) user.permissions = {};
                user.permissions[permKey] = value;
            }
        })
        .catch(function(error) {
            alert('❌ Erreur: ' + error.message);
        });
}

function rafraichirUtilisateurs() {
    loadAllUsers();
}

// ============================================
// INIT
// ============================================
console.log('✅ Script OK - Chicken Way');
