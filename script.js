// ============================================
// CHICKEN WAY - SCRIPT PRINCIPAL
// ============================================

// Variables globales
let currentUser = null;
let currentUserData = null;

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🍗 Chicken Way - Application démarrée');
    
    // Vérifier que Firebase est bien initialisé
    if (typeof auth === 'undefined') {
        console.error('❌ Firebase Auth non initialisé');
        alert('Erreur de configuration Firebase');
        return;
    }
    
    if (typeof db === 'undefined') {
        console.error('❌ Firestore non initialisé');
        alert('Erreur de configuration Firestore');
        return;
    }
    
    // Vérifier l'état de l'authentification
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('✅ Utilisateur connecté:', user.email);
            currentUser = user;
            loadUserData(user.uid);
            showDashboard();
        } else {
            console.log('👋 Aucun utilisateur connecté');
            currentUser = null;
            currentUserData = null;
            showAuthPage();
        }
    });
});

// ============================================
// GESTION DES PAGES (AUTH / DASHBOARD)
// ============================================
function showAuthPage() {
    document.getElementById('authPage').classList.remove('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
    showLogin();
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

// ============================================
// AUTHENTIFICATION
// ============================================

// LOGIN
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    
    if (!email || !password) {
        alert('❌ Veuillez remplir tous les champs');
        return false;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('✅ Connecté:', userCredential.user.uid);
            return db.collection('users').doc(userCredential.user.uid).get();
        })
        .then((doc) => {
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
        .catch((error) => {
            console.error('❌ Erreur login:', error.code, error.message);
            let message = 'Erreur de connexion';
            if (error.code === 'auth/user-not-found') message = '❌ Email non trouvé';
            else if (error.code === 'auth/wrong-password') message = '❌ Mot de passe incorrect';
            else if (error.code === 'auth/invalid-email') message = '❌ Email invalide';
            else message = '❌ ' + error.message;
            alert(message);
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
        });
    
    return false;
}

// REGISTER
function handleRegister(event) {
    event.preventDefault();
    
    const nom = document.getElementById('regNom').value.trim();
    const prenom = document.getElementById('regPrenom').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const telephone = document.getElementById('regTelephone').value.trim();
    const role = document.getElementById('regRole').value;
    const password = document.getElementById('regPassword').value;
    const btn = document.getElementById('registerBtn');
    
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
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('✅ Compte créé:', user.uid);
            
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
        .then(() => {
            alert('✅ Compte créé avec succès !');
            document.getElementById('registerForm').reset();
            showLogin();
        })
        .catch((error) => {
            console.error('❌ Erreur register:', error.code, error.message);
            let message = 'Erreur inscription';
            if (error.code === 'auth/email-already-in-use') message = '❌ Email déjà utilisé';
            else if (error.code === 'auth/weak-password') message = '❌ Mot de passe trop faible';
            else if (error.code === 'auth/operation-not-allowed') message = '❌ Inscription par email désactivée dans Firebase';
            else message = '❌ ' + error.message;
            alert(message);
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte';
        });
    
    return false;
}

// LOGOUT
function handleLogout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        auth.signOut()
            .then(() => {
                localStorage.removeItem('currentUser');
                currentUser = null;
                currentUserData = null;
                showAuthPage();
            })
            .catch((error) => {
                console.error('❌ Erreur logout:', error);
            });
    }
}

// ============================================
// CHARGEMENT DONNÉES UTILISATEUR
// ============================================
function loadUserData(uid) {
    db.collection('users').doc(uid).get()
        .then((doc) => {
            if (doc.exists) {
                currentUserData = { uid: doc.id, ...doc.data() };
                localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                console.log('👤 Données chargées:', currentUserData.prenom);
                updateSidebarUserInfo();
            }
        })
        .catch((error) => {
            console.error('❌ Erreur chargement user:', error);
        });
}

function updateSidebarUserInfo() {
    const userInfo = document.getElementById('sidebarUserInfo');
    if (userInfo && currentUserData) {
        userInfo.innerHTML = `
            <i class="fas fa-user-circle"></i>
            <span>${currentUserData.prenom} ${currentUserData.nom}<br><small style="color: #f39c12;">${currentUserData.role}</small></span>
        `;
    }
}

// ============================================
// NAVIGATION DASHBOARD
// ============================================
function navigateTo(page) {
    console.log('📄 Navigation vers:', page);
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    const items = document.querySelectorAll('.nav-item');
    const pages = ['dashboard', 'pos', 'categories', 'products', 'clients', 'fournisseurs', 'ventes', 'credits', 'depenses', 'statistiques'];
    const index = pages.indexOf(page);
    
    if (index >= 0 && items[index]) {
        items[index].classList.add('active');
    }
    
    const titles = {
        dashboard: 'Dashboard',
        pos: 'Point de Vente',
        categories: 'Catégories',
        products: 'Produits',
        clients: 'Clients',
        fournisseurs: 'Fournisseurs',
        ventes: 'Ventes',
        credits: 'Crédits',
        depenses: 'Dépenses',
        statistiques: 'Statistiques'
    };
    
    document.getElementById('pageTitle').textContent = titles[page] || 'Page';
    
    const content = document.getElementById('dynamicContent');
    
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
                        <span class="stat-label">Revenus aujourd'hui</span>
                        <span class="stat-value" id="todayRevenue">0.00</span>
                        <span class="stat-unit">€</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-utensils"></i></div>
                    <div class="stat-info">
                        <span class="stat-label">Produits</span>
                        <span class="stat-value" id="productsCount">0</span>
                        <span class="stat-unit">articles</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-info">
                        <span class="stat-label">Clients</span>
                        <span class="stat-value" id="clientsCount">0</span>
                        <span class="stat-unit">inscrits</span>
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
                            <tr>
                                <th>N°</th>
                                <th>Client</th>
                                <th>Total</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody id="recentOrdersTable">
                            <tr><td colspan="4" style="text-align:center;">Aucune commande</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        loadDashboardStats();
    } else {
        content.innerHTML = `
            <div class="content-card">
                <div class="card-header">
                    <h3>📄 ${titles[page]}</h3>
                </div>
                <div style="text-align:center; padding:60px 20px; color:#94a3b8;">
                    <i class="fas fa-tools" style="font-size:4rem; margin-bottom:20px;"></i>
                    <p style="font-size:1.2rem; font-weight:600;">Page en développement</p>
                    <p style="font-size:0.9rem;">La page "${titles[page]}" sera bientôt disponible</p>
                </div>
            </div>
        `;
    }
}

// ============================================
// DASHBOARD STATS
// ============================================
function loadDashboardStats() {
    console.log('📊 Chargement des statistiques...');
    
    // Compter les produits
    db.collection('products').get()
        .then((snapshot) => {
            const el = document.getElementById('productsCount');
            if (el) el.textContent = snapshot.size;
        })
        .catch((error) => {
            console.log('⚠️ Collection products pas encore créée');
        });
    
    // Compter les clients
    db.collection('users').where('role', '==', 'client').get()
        .then((snapshot) => {
            const el = document.getElementById('clientsCount');
            if (el) el.textContent = snapshot.size;
        })
        .catch((error) => {
            console.log('⚠️ Erreur comptage clients:', error.message);
        });
    
    // Commandes du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    db.collection('orders')
        .where('createdAt', '>=', today)
        .get()
        .then((snapshot) => {
            let totalRevenue = 0;
            snapshot.forEach((doc) => {
                const order = doc.data();
                totalRevenue += order.total || 0;
            });
            
            const ordersEl = document.getElementById('todayOrders');
            const revenueEl = document.getElementById('todayRevenue');
            
            if (ordersEl) ordersEl.textContent = snapshot.size;
            if (revenueEl) revenueEl.textContent = totalRevenue.toFixed(2);
        })
        .catch((error) => {
            console.log('⚠️ Collection orders pas encore créée');
        });
}

console.log('🍗 Script.js chargé avec succès');
