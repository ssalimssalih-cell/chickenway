let currentUser = null;
let currentUserData = null;
let currentCollection = '';
let editingId = null;

// ============================================
// INIT
// ============================================
window.addEventListener('DOMContentLoaded', function() {
    console.log('Chicken Way Started');
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('clientPage').classList.add('hidden');
    
    auth.onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            db.collection('users').doc(user.uid).get().then(function(doc) {
                if (!doc.exists) { alert('Account error'); auth.signOut(); showAuthPage(); return; }
                var userData = doc.data();
                if (userData.authorized !== 'yes') {
                    auth.signOut(); showAuthPage();
                    setTimeout(function() { showLoginError('Compte en attente de validation.'); }, 300);
                    return;
                }
                currentUserData = { uid: doc.id, ...userData };
                localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                if (userData.role === 'client') { showClientPage(); } else { showDashboard(); }
            }).catch(function(e) { auth.signOut(); showAuthPage(); });
        } else {
            currentUser = null; currentUserData = null;
            localStorage.removeItem('currentUser'); showAuthPage();
        }
    });
});

// ============================================
// PAGES
// ============================================
function showAuthPage() {
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('clientPage').classList.add('hidden');
    document.getElementById('authPage').classList.remove('hidden');
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('registerContainer').classList.add('hidden');
    hideLoginError();
}
function showDashboard() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('clientPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    buildMenu(); updateSidebarUserInfo();
    if (currentUserData.role === 'caissier') { navigateTo('pos'); } else { navigateTo('dashboard'); }
}
function showClientPage() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('clientPage').classList.remove('hidden');
    updateClientSidebarInfo(); clientNavigate('commander');
}
function showLogin() { document.getElementById('loginContainer').classList.remove('hidden'); document.getElementById('registerContainer').classList.add('hidden'); hideLoginError(); }
function showRegister() { document.getElementById('loginContainer').classList.add('hidden'); document.getElementById('registerContainer').classList.remove('hidden'); hideLoginError(); }

// ============================================
// MENU
// ============================================
function buildMenu() {
    var menu = document.getElementById('navMenu');
    if (currentUserData.role === 'admin') {
        menu.innerHTML = '<li class="nav-item" onclick="navigateTo(\'dashboard\')"><i class="fas fa-th-large"></i> Dashboard</li><li class="nav-item" onclick="navigateTo(\'pos\')"><i class="fas fa-cash-register"></i> POS</li><li class="nav-item" onclick="navigateTo(\'categories\')"><i class="fas fa-layer-group"></i> Categories</li><li class="nav-item" onclick="navigateTo(\'products\')"><i class="fas fa-utensils"></i> Produits</li><li class="nav-item" onclick="navigateTo(\'clients\')"><i class="fas fa-users"></i> Clients</li><li class="nav-item" onclick="navigateTo(\'fournisseurs\')"><i class="fas fa-truck"></i> Fournisseurs</li><li class="nav-item" onclick="navigateTo(\'ventes\')"><i class="fas fa-shopping-cart"></i> Ventes</li><li class="nav-item" onclick="navigateTo(\'credits\')"><i class="fas fa-credit-card"></i> Credits</li><li class="nav-item" onclick="navigateTo(\'depenses\')"><i class="fas fa-money-bill-wave"></i> Depenses</li><li class="nav-item" onclick="navigateTo(\'statistiques\')"><i class="fas fa-chart-bar"></i> Statistiques</li><li class="nav-item" onclick="navigateTo(\'options\')"><i class="fas fa-cog"></i> Options</li>';
        document.getElementById('sidebarRole').textContent = 'Admin';
    } else if (currentUserData.role === 'caissier') {
        menu.innerHTML = '<li class="nav-item active" onclick="navigateTo(\'pos\')"><i class="fas fa-cash-register"></i> POS</li>';
        document.getElementById('sidebarRole').textContent = 'Caissier';
    }
}

// ============================================
// NAVIGATION
// ============================================
function navigateTo(page) {
    if (!currentUserData || currentUserData.authorized !== 'yes') { auth.signOut(); showAuthPage(); return; }
    if (currentUserData.role === 'caissier' && page !== 'pos') { return; }
    
    var items = document.querySelectorAll('#navMenu .nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    var adminPages = ['dashboard','pos','categories','products','clients','fournisseurs','ventes','credits','depenses','statistiques','options'];
    var caissierPages = ['pos'];
    var pages = (currentUserData.role === 'caissier') ? caissierPages : adminPages;
    var index = pages.indexOf(page);
    if (index >= 0 && items[index]) items[index].classList.add('active');
    
    var titles = {dashboard:'Dashboard',pos:'POS',categories:'Categories',products:'Produits',clients:'Clients',fournisseurs:'Fournisseurs',ventes:'Ventes',credits:'Credits',depenses:'Depenses',statistiques:'Statistiques',options:'Options'};
    var icons = {dashboard:'fa-th-large',pos:'fa-cash-register',categories:'fa-layer-group',products:'fa-utensils',clients:'fa-users',fournisseurs:'fa-truck',ventes:'fa-shopping-cart',credits:'fa-credit-card',depenses:'fa-money-bill-wave',statistiques:'fa-chart-bar',options:'fa-cog'};
    document.getElementById('pageTitle').textContent = titles[page] || 'Page';
    var hi = document.querySelector('.header-title i');
    if (hi && icons[page]) hi.className = 'fas ' + icons[page];
    
    var content = document.getElementById('dynamicContent');
    
    if (page === 'categories') { loadCategoriesPage(content); }
    else if (page === 'products') { loadProductsPage(content); }
    else if (page === 'clients') { loadClientsPage(content); }
    else if (page === 'fournisseurs') { loadFournisseursPage(content); }
    else if (page === 'depenses') { loadDepensesPage(content); }
    else if (page === 'options') { loadOptionsPage(content); }
    else if (page === 'dashboard') { content.innerHTML = '<div class="stats-grid"><div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-bag"></i></div><div class="stat-info"><span class="stat-label">Commandes</span><span class="stat-value" id="todayOrders">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-euro-sign"></i></div><div class="stat-info"><span class="stat-label">Revenus</span><span class="stat-value" id="todayRevenue">0.00</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-utensils"></i></div><div class="stat-info"><span class="stat-label">Produits</span><span class="stat-value" id="productsCount">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value" id="clientsCount">0</span></div></div></div>'; loadDashboardStats(); }
    else { content.innerHTML = '<div class="content-card"><div class="card-header"><h3>'+titles[page]+'</h3></div><p style="text-align:center;padding:40px;">En developpement</p></div>'; }
}

// ============================================
// MODAL
// ============================================
function openModal(title, bodyHTML) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modalOverlay').classList.remove('hidden');
}
function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
    editingId = null;
    currentCollection = '';
}

// ============================================
// CRUD GENERIQUE
// ============================================
function loadCollection(collectionName, tbodyId, rowRenderer) {
    db.collection(collectionName).orderBy('createdAt','desc').get().then(function(snapshot) {
        var tbody = document.getElementById(tbodyId);
        tbody.innerHTML = '';
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="20" style="text-align:center;padding:30px;">Aucune donnee</td></tr>';
            return;
        }
        snapshot.forEach(function(doc) {
            tbody.innerHTML += rowRenderer(doc.id, doc.data());
        });
    }).catch(function(e) { console.error('Error loading '+collectionName, e); });
}

function saveDocument(collectionName, data) {
    if (editingId) {
        data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        return db.collection(collectionName).doc(editingId).update(data);
    } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        return db.collection(collectionName).add(data);
    }
}

function editDocument(collectionName, id) {
    db.collection(collectionName).doc(id).get().then(function(doc) {
        if (doc.exists) {
            editingId = id;
            currentCollection = collectionName;
            var data = doc.data();
            openEditForm(collectionName, data);
        }
    });
}

function deleteDocument(collectionName, id) {
    if (confirm('Supprimer definitivement ?')) {
        db.collection(collectionName).doc(id).delete().then(function() {
            alert('Supprime !');
            refreshCurrentPage();
        }).catch(function(e) { alert('Erreur: '+e.message); });
    }
}

function refreshCurrentPage() {
    var pageTitle = document.getElementById('pageTitle').textContent;
    var pageMap = {'Categories':'categories','Produits':'products','Clients':'clients','Fournisseurs':'fournisseurs','Depenses':'depenses'};
    var page = pageMap[pageTitle] || 'dashboard';
    navigateTo(page);
}

// ============================================
// CATEGORIES CRUD
// ============================================
function loadCategoriesPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-layer-group"></i> Categories</h3><button class="btn-add" onclick="openCategoryForm()"><i class="fas fa-plus"></i> Ajouter</button></div><div class="table-container"><table
