var currentUser = null;
var currentUserData = null;
var editingId = null;
var currentCollection = '';

window.addEventListener('DOMContentLoaded', function() {
    console.log('Chicken Way Started');
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('clientPage').classList.add('hidden');
    
    auth.onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            db.collection('users').doc(user.uid).get().then(function(doc) {
                if (!doc.exists) { auth.signOut(); showAuthPage(); return; }
                var userData = doc.data();
                if (userData.authorized !== 'yes') {
                    auth.signOut(); showAuthPage();
                    setTimeout(function() { showLoginError('Compte en attente de validation.'); }, 300);
                    return;
                }
                currentUserData = { uid: doc.id, userData: userData };
                localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                if (userData.role === 'client') { showClientPage(); } else { showDashboard(); }
            }).catch(function() { auth.signOut(); showAuthPage(); });
        } else {
            currentUser = null; currentUserData = null;
            localStorage.removeItem('currentUser'); showAuthPage();
        }
    });
});

function showAuthPage() {
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('clientPage').classList.add('hidden');
    document.getElementById('authPage').classList.remove('hidden');
    showLogin();
}

function showDashboard() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('clientPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    buildMenu(); updateSidebarUserInfo();
    if (currentUserData.userData.role === 'caissier') { navigateTo('pos'); } else { navigateTo('dashboard'); }
}

function showClientPage() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('clientPage').classList.remove('hidden');
    updateClientSidebarInfo(); clientNavigate('commander');
}

function showLogin() { document.getElementById('loginContainer').classList.remove('hidden'); document.getElementById('registerContainer').classList.add('hidden'); hideLoginError(); }
function showRegister() { document.getElementById('loginContainer').classList.add('hidden'); document.getElementById('registerContainer').classList.remove('hidden'); hideLoginError(); }

function buildMenu() {
    var menu = document.getElementById('navMenu');
    menu.innerHTML = '';
    var items = [];
    if (currentUserData.userData.role === 'admin') {
        items = [
            {p:'dashboard',i:'fa-th-large',l:'Dashboard'},{p:'pos',i:'fa-cash-register',l:'POS'},
            {p:'categories',i:'fa-layer-group',l:'Categories'},{p:'products',i:'fa-utensils',l:'Produits'},
            {p:'clients',i:'fa-users',l:'Clients'},{p:'fournisseurs',i:'fa-truck',l:'Fournisseurs'},
            {p:'ventes',i:'fa-shopping-cart',l:'Ventes'},{p:'credits',i:'fa-credit-card',l:'Credits'},
            {p:'depenses',i:'fa-money-bill-wave',l:'Depenses'},{p:'statistiques',i:'fa-chart-bar',l:'Statistiques'},
            {p:'options',i:'fa-cog',l:'Options'}
        ];
        document.getElementById('sidebarRole').textContent = 'Admin';
    } else if (currentUserData.userData.role === 'caissier') {
        items = [{p:'pos',i:'fa-cash-register',l:'POS'}];
        document.getElementById('sidebarRole').textContent = 'Caissier';
    }
    items.forEach(function(item) {
        var li = document.createElement('li');
        li.className = 'nav-item';
        li.setAttribute('onclick', 'navigateTo(\"' + item.p + '\")');
        li.innerHTML = '<i class="fas ' + item.i + '"></i> ' + item.l;
        menu.appendChild(li);
    });
}

function navigateTo(page) {
    if (!currentUserData || currentUserData.userData.authorized !== 'yes') { auth.signOut(); showAuthPage(); return; }
    if (currentUserData.userData.role === 'caissier' && page !== 'pos') { return; }
    
    var items = document.querySelectorAll('#navMenu .nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    
    var pages = ['dashboard','pos','categories','products','clients','fournisseurs','ventes','credits','depenses','statistiques','options'];
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
    else if (page === 'dashboard') { loadDashboardPage(content); }
    else { content.innerHTML = '<div class="content-card"><h3>' + titles[page] + '</h3><p style="text-align:center;padding:40px;">En developpement</p></div>'; }
}

function loadDashboardPage(content) {
    content.innerHTML = '<div class="stats-grid"><div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-bag"></i></div><div class="stat-info"><span class="stat-label">Commandes</span><span class="stat-value" id="todayOrders">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-euro-sign"></i></div><div class="stat-info"><span class="stat-label">Revenus</span><span class="stat-value" id="todayRevenue">0.00</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-utensils"></i></div><div class="stat-info"><span class="stat-label">Produits</span><span class="stat-value" id="productsCount">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value" id="clientsCount">0</span></div></div></div>';
    loadDashboardStats();
}

function loadDashboardStats() {
    db.collection('products').get().then(function(s) { var e = document.getElementById('productsCount'); if (e) e.textContent = s.size; }).catch(function() {});
    db.collection('clients').get().then(function(s) { var e = document.getElementById('clientsCount'); if (e) e.textContent = s.size; }).catch(function() {});
}

function openModal(title, bodyHTML) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
    editingId = null; currentCollection = '';
}

function loadCollection(collectionName, tbodyId, rowFn) {
    db.collection(collectionName).orderBy('createdAt','desc').get().then(function(snapshot) {
        var tbody = document.getElementById(tbodyId);
        tbody.innerHTML = '';
        if (snapshot.empty) { tbody.innerHTML = '<tr><td colspan="20" style="text-align:center;padding:30px;">Aucune donnee</td></tr>'; return; }
        snapshot.forEach(function(doc) { tbody.innerHTML += rowFn(doc.id, doc.data()); });
    });
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
        if (doc.exists) { editingId = id; currentCollection = collectionName; openEditForm(collectionName, doc.data()); }
    });
}

function deleteDocument(collectionName, id) {
    if (confirm('Supprimer ?')) { db.collection(collectionName).doc(id).delete().then(function() { alert('Supprime'); refreshCurrentPage(); }); }
}

function refreshCurrentPage() {
    var title = document.getElementById('pageTitle').textContent;
    var map = {Categories:'categories',Produits:'products',Clients:'clients',Fournisseurs:'fournisseurs',Depenses:'depenses'};
    navigateTo(map[title] || 'dashboard');
}
