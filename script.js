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
        return;
    }
    
    // Désactiver le bouton
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
            console.error('❌ Erreur login:', error);
            let message = 'Erreur de connexion';
            if (error.code === 'auth/user-not-found') message = '❌ Email non trouvé';
            else if (error.code === 'auth/wrong-password') message = '❌ Mot de passe incorrect';
            else if (error.code === 'auth/invalid-email') message = '❌ Email invalide';
            else if (error.code === 'auth/too-many-requests') message = '❌ Trop de tentatives';
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
    
    // Validation
    if (!nom || !prenom || !username || !email || !telephone || !role || !password) {
        alert('❌ Tous les champs sont obligatoires');
        return false;
    }
    
    if (password.length < 6) {
        alert('❌ Mot de passe : minimum 6 caractères');
        return false;
    }
    
    // Désactiver le bouton
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log('✅ Compte créé:', user.uid);
            
            // Sauvegarder dans Firestore
            return db.collection('users').doc(user.uid).set({
                nom: nom,
                prenom: prenom,
                username: username,
                email: email,
                telephone: telephone,
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            alert('✅ Compte créé avec succès !');
            document.getElementById('registerForm').reset();
            showLogin();
        })
        .catch((error) => {
            console.error('❌ Erreur register:', error);
            let message = 'Erreur inscription';
            if (error.code === 'auth/email-already-in-use') message = '❌ Email déjà utilisé';
            else if (error.code === 'auth/weak-password') message = '❌ Mot de passe trop faible';
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
            <span>${currentUserData.prenom} ${currentUserData.nom} <br><small>${currentUserData.role}</small></span>
        `;
    }
}

// ============================================
// NAVIGATION DASHBOARD
// ============================================
function navigateTo(page) {
    console.log('📄 Navigation vers:', page);
    
    // Mettre à jour les classes actives
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Trouver l'élément cliqué et le marquer actif
    const navItems = document.querySelectorAll('.nav-item');
    const pageNames = ['dashboard', 'pos', 'categories', 'products', 'clients', 'fournisseurs', 'ventes', 'credits', 'depenses', 'statistiques'];
    const index = pageNames.indexOf(page);
    if (index >= 0 && navItems[index]) {
        navItems[index].classList.add('active');
    }
    
    // Mettre à jour le titre
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
    
    // Afficher un message pour les pages non encore développées
    const content = document.getElementById('dynamicContent');
    if (page === 'dashboard') {
        loadDashboardStats();
    } else {
        content.innerHTML = `
            <div class="content-card">
                <div class="card-header">
                    <h3>📄 ${titles[page]}</h3>
                </div>
                <div style="text-align: center; padding: 50px; color: #94a3b8;">
                    <i class="fas fa-tools" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <p style="font-size: 1.2rem;">Page en cours de développement</p>
                    <p style="font-size: 0.9rem;">La page "${titles[page]}" sera bientôt disponible</p>
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
            const statValue = document.querySelector('.stats-grid .stat-card:nth-child(3) .stat-value');
            if (statValue) statValue.textContent = snapshot.size;
        })
        .catch((error) => {
            console.error('❌ Erreur comptage produits:', error);
        });
    
    // Compter les clients
    db.collection('users').where('role', '==', 'client').get()
        .then((snapshot) => {
            const statValue = document.querySelector('.stats-grid .stat-card:nth-child(4) .stat-value');
            if (statValue) statValue.textContent = snapshot.size;
        })
        .catch((error) => {
            console.error('❌ Erreur comptage clients:', error);
        });
    
    // Compter les ventes du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    db.collection('orders')
        .where('createdAt', '>=', today)
        .get()
        .then((snapshot) => {
            let totalRevenue = 0;
            snapshot.forEach((doc) => {
                const order = doc.data();
                if (order.status !== 'annulée') {
                    totalRevenue += order.total || 0;
                }
            });
            
            // Mettre à jour les stats
            const ordersCount = document.querySelector('.stats-grid .stat-card:nth-child(1) .stat-value');
            const revenueValue = document.querySelector('.stats-grid .stat-card:nth-child(2) .stat-value');
            
            if (ordersCount) ordersCount.textContent = snapshot.size;
            if (revenueValue) revenueValue.textContent = totalRevenue.toFixed(2);
        })
        .catch((error) => {
            console.error('❌ Erreur ventes:', error);
        });
}

// ============================================
// UTILITAIRES
// ============================================
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatPrice(price) {
    return parseFloat(price).toFixed(2) + ' €';
}

console.log('🍗 Script.js chargé avec succès');
