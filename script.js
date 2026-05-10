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
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-layer-group"></i> Categories</h3><button class="btn-add" onclick="openCategoryForm()"><i class="fas fa-plus"></i> Ajouter</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Icone</th><th>Nom</th><th>Description</th><th>CA (MAD)</th><th>Profit (MAD)</th><th>Date</th><th>Actions</th></tr></thead><tbody id="categoriesTable"></tbody></table></div></div>';
    loadCollection('categories', 'categoriesTable', function(id, d) {
        var ca = (d.ca || 0).toFixed(2);
        var profit = (d.profit || 0).toFixed(2);
        var date = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleDateString('fr-FR') : 'N/A';
        return '<tr><td><span class="emoji-icon">'+(d.icon || '📁')+'</span></td><td><strong>'+d.nom+'</strong></td><td>'+(d.description || '-')+'</td><td>'+ca+' MAD</td><td>'+profit+' MAD</td><td>'+date+'</td><td><button class="btn-edit" onclick="editDocument(\'categories\',\''+id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'categories\',\''+id+'\')"><i class="fas fa-trash"></i></button></td></tr>';
    });
}

function openCategoryForm(data) {
    data = data || {};
    var html = '<div class="form-row"><div class="form-group"><label>Icone (emoji)</label><input type="text" id="catIcon" value="'+(data.icon || '📁')+'" placeholder="📁"></div><div class="form-group"><label>Nom *</label><input type="text" id="catNom" value="'+(data.nom || '')+'" required></div></div><div class="form-row"><div class="form-group"><label>Description</label><textarea id="catDesc">'+(data.description || '')+'</textarea></div></div><div class="form-row"><div class="form-group"><label>CA (MAD)</label><input type="number" id="catCA" value="'+(data.ca || 0)+'" step="0.01"></div><div class="form-group"><label>Profit (MAD)</label><input type="number" id="catProfit" value="'+(data.profit || 0)+'" step="0.01"></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveCategory()">Enregistrer</button>';
    currentCollection = 'categories';
    openModal(editingId ? 'Modifier Categorie' : 'Nouvelle Categorie', html);
}

function saveCategory() {
    var data = {nom: document.getElementById('catNom').value, icon: document.getElementById('catIcon').value, description: document.getElementById('catDesc').value, ca: parseFloat(document.getElementById('catCA').value) || 0, profit: parseFloat(document.getElementById('catProfit').value) || 0};
    if (!data.nom) { alert('Nom obligatoire'); return; }
    saveDocument('categories', data).then(function() { closeModal(); refreshCurrentPage(); }).catch(function(e) { alert('Erreur: '+e.message); });
}

// ============================================
// PRODUCTS CRUD
// ============================================
function loadProductsPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-utensils"></i> Produits</h3><button class="btn-add" onclick="openProductForm()"><i class="fas fa-plus"></i> Ajouter</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Image</th><th>Nom</th><th>Categorie</th><th>Prix Achat</th><th>Prix Vente</th><th>Profit</th><th>Promo</th><th>Stock</th><th>Vendues</th><th>CA</th><th>Prep</th><th>Dispo</th><th>Actions</th></tr></thead><tbody id="productsTable"></tbody></table></div></div>';
    loadCollection('products', 'productsTable', function(id, d) {
        var img = d.image ? '<img src="'+d.image+'" class="product-img-thumb">' : '🍗';
        var dispo = d.disponible !== false ? '<span class="status-success">Oui</span>' : '<span class="status-danger">Non</span>';
        return '<tr><td>'+img+'</td><td><strong>'+d.nom+'</strong></td><td>'+(d.categorie || '-')+'</td><td>'+(d.prixAchat || 0)+'</td><td>'+(d.prixVente || 0)+'</td><td>'+(d.profit || 0)+'</td><td>'+(d.prixPromo || '-')+'</td><td>'+(d.stock || 0)+'</td><td>'+(d.vendues || 0)+'</td><td>'+(d.ca || 0)+'</td><td>'+(d.tempsPrep || '-')+'</td><td>'+dispo+'</td><td><button class="btn-edit" onclick="editDocument(\'products\',\''+id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'products\',\''+id+'\')"><i class="fas fa-trash"></i></button></td></tr>';
    });
}

function openProductForm(data) {
    data = data || {};
    var html = '<div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="prodNom" value="'+(data.nom || '')+'" required></div><div class="form-group"><label>Categorie</label><input type="text" id="prodCat" value="'+(data.categorie || '')+'"></div></div><div class="form-row"><div class="form-group"><label>Prix Achat</label><input type="number" id="prodPA" value="'+(data.prixAchat || 0)+'" step="0.01"></div><div class="form-group"><label>Prix Vente</label><input type="number" id="prodPV" value="'+(data.prixVente || 0)+'" step="0.01"></div><div class="form-group"><label>Prix Promo</label><input type="number" id="prodPromo" value="'+(data.prixPromo || 0)+'" step="0.01"></div></div><div class="form-row"><div class="form-group"><label>Profit</label><input type="number" id="prodProfit" value="'+(data.profit || 0)+'" step="0.01"></div><div class="form-group"><label>Stock</label><input type="number" id="prodStock" value="'+(data.stock || 0)+'"></div><div class="form-group"><label>Vendues</label><input type="number" id="prodVendues" value="'+(data.vendues || 0)+'"></div></div><div class="form-row"><div class="form-group"><label>CA</label><input type="number" id="prodCA" value="'+(data.ca || 0)+'" step="0.01"></div><div class="form-group"><label>Temps prep</label><input type="text" id="prodPrep" value="'+(data.tempsPrep || '')+'"></div><div class="form-group"><label>Disponible</label><select id="prodDispo"><option value="1" '+(data.disponible !== false ? 'selected' : '')+'>Oui</option><option value="0" '+(data.disponible === false ? 'selected' : '')+'>Non</option></select></div></div><div class="form-row"><div class="form-group"><label>Image URL</label><input type="text" id="prodImage" value="'+(data.image || '')+'"></div></div><div class="form-row"><div class="form-group"><label>Description</label><textarea id="prodDesc">'+(data.description || '')+'</textarea></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveProduct()">Enregistrer</button>';
    currentCollection = 'products';
    openModal(editingId ? 'Modifier Produit' : 'Nouveau Produit', html);
}

function saveProduct() {
    var data = {nom: document.getElementById('prodNom').value, categorie: document.getElementById('prodCat').value, prixAchat: parseFloat(document.getElementById('prodPA').value) || 0, prixVente: parseFloat(document.getElementById('prodPV').value) || 0, prixPromo: parseFloat(document.getElementById('prodPromo').value) || 0, profit: parseFloat(document.getElementById('prodProfit').value) || 0, stock: parseInt(document.getElementById('prodStock').value) || 0, vendues: parseInt(document.getElementById('prodVendues').value) || 0, ca: parseFloat(document.getElementById('prodCA').value) || 0, tempsPrep: document.getElementById('prodPrep').value, disponible: document.getElementById('prodDispo').value === '1', image: document.getElementById('prodImage').value, description: document.getElementById('prodDesc').value};
    if (!data.nom) { alert('Nom obligatoire'); return; }
    data.profit = data.prixVente - data.prixAchat;
    data.ca = data.vendues * data.prixVente;
    saveDocument('products', data).then(function() { closeModal(); refreshCurrentPage(); }).catch(function(e) { alert('Erreur: '+e.message); });
}

// ============================================
// CLIENTS CRUD
// ============================================
function loadClientsPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-users"></i> Clients</h3><button class="btn-add" onclick="openClientForm()"><i class="fas fa-plus"></i> Ajouter</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Nom</th><th>Prenom</th><th>Genre</th><th>Tel</th><th>WhatsApp</th><th>CA</th><th>Profit</th><th>Points</th><th>Niveau</th><th>Actions</th></tr></thead><tbody id="clientsTable"></tbody></table></div></div>';
    loadCollection('clients', 'clientsTable', function(id, d) {
        return '<tr><td><strong>'+(d.nom || '')+'</strong></td><td>'+(d.prenom || '')+'</td><td>'+(d.genre || '-')+'</td><td>'+(d.telephone || '-')+'</td><td>'+(d.whatsapp || '-')+'</td><td>'+(d.ca || 0)+'</td><td>'+(d.profit || 0)+'</td><td>'+(d.points || 0)+'</td><td>'+(d.niveau || '-')+'</td><td><button class="btn-edit" onclick="editDocument(\'clients\',\''+id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'clients\',\''+id+'\')"><i class="fas fa-trash"></i></button></td></tr>';
    });
}

function openClientForm(data) {
    data = data || {};
    var html = '<div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="cliNom" value="'+(data.nom || '')+'" required></div><div class="form-group"><label>Prenom *</label><input type="text" id="cliPrenom" value="'+(data.prenom || '')+'" required></div><div class="form-group"><label>Genre</label><select id="cliGenre"><option value="">-</option><option value="H" '+(data.genre==='H'?'selected':'')+'>Homme</option><option value="F" '+(data.genre==='F'?'selected':'')+'>Femme</option></select></div></div><div class="form-row"><div class="form-group"><label>Adresse</label><input type="text" id="cliAdresse" value="'+(data.adresse || '')+'"></div><div class="form-group"><label>Profession</label><input type="text" id="cliProfession" value="'+(data.profession || '')+'"></div></div><div class="form-row"><div class="form-group"><label>Telephone</label><input type="text" id="cliTel" value="'+(data.telephone || '')+'"></div><div class="form-group"><label>WhatsApp</label><input type="text" id="cliWhatsApp" value="'+(data.whatsapp || '')+'"></div><div class="form-group"><label>Instagram</label><input type="text" id="cliInstagram" value="'+(data.instagram || '')+'"></div></div><div class="form-row"><div class="form-group"><label>CA</label><input type="number" id="cliCA" value="'+(data.ca || 0)+'" step="0.01"></div><div class="form-group"><label>Profit</label><input type="number" id="cliProfit" value="'+(data.profit || 0)+'" step="0.01"></div><div class="form-group"><label>Points</label><input type="number" id="cliPoints" value="'+(data.points || 0)+'"></div></div><div class="form-row"><div class="form-group"><label>Niveau</label><input type="text" id="cliNiveau" value="'+(data.niveau || '')+'"></div><div class="form-group"><label>Plats preferes</label><input type="text" id="cliPlats" value="'+(data.plats || '')+'"></div></div><div class="form-row"><div class="form-group"><label>Allergies</label><input type="text" id="cliAllergies" value="'+(data.allergies || '')+'"></div></div><div class="form-row"><div class="form-group"><label>Description</label><textarea id="cliDesc">'+(data.description || '')+'</textarea></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveClient()">Enregistrer</button>';
    currentCollection = 'clients';
    openModal(editingId ? 'Modifier Client' : 'Nouveau Client', html);
}

function saveClient() {
    var data = {nom: document.getElementById('cliNom').value, prenom: document.getElementById('cliPrenom').value, genre: document.getElementById('cliGenre').value, adresse: document.getElementById('cliAdresse').value, profession: document.getElementById('cliProfession').value, telephone: document.getElementById('cliTel').value, whatsapp: document.getElementById('cliWhatsApp').value, instagram: document.getElementById('cliInstagram').value, ca: parseFloat(document.getElementById('cliCA').value) || 0, profit: parseFloat(document.getElementById('cliProfit').value) || 0, points: parseInt(document.getElementById('cliPoints').value) || 0, niveau: document.getElementById('cliNiveau').value, plats: document.getElementById('cliPlats').value, allergies: document.getElementById('cliAllergies').value, description: document.getElementById('cliDesc').value};
    if (!data.nom || !data.prenom) { alert('Nom et Prenom obligatoires'); return; }
    saveDocument('clients', data).then(function() { closeModal(); refreshCurrentPage(); }).catch(function(e) { alert('Erreur: '+e.message); });
}

// ============================================
// FOURNISSEURS CRUD
// ============================================
function loadFournisseursPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-truck"></i> Fournisseurs</h3><button class="btn-add" onclick="openFournisseurForm()"><i class="fas fa-plus"></i> Ajouter</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Nom</th><th>Prenom</th><th>Tel</th><th>WhatsApp</th><th>CA</th><th>Profit</th><th>Actions</th></tr></thead><tbody id="fournisseursTable"></tbody></table></div></div>';
    loadCollection('fournisseurs', 'fournisseursTable', function(id, d) {
        return '<tr><td><strong>'+(d.nom || '')+'</strong></td><td>'+(d.prenom || '')+'</td><td>'+(d.telephone || '-')+'</td><td>'+(d.whatsapp || '-')+'</td><td>'+(d.ca || 0)+'</td><td>'+(d.profit || 0)+'</td><td><button class="btn-edit" onclick="editDocument(\'fournisseurs\',\''+id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'fournisseurs\',\''+id+'\')"><i class="fas fa-trash"></i></button></td></tr>';
    });
}

function openFournisseurForm(data) {
    data = data || {};
    var html = openClientFormHTML(data, 'fournisseurs');
    currentCollection = 'fournisseurs';
    openModal(editingId ? 'Modifier Fournisseur' : 'Nouveau Fournisseur', html);
}
function openClientFormHTML(data, type) {
    data = data || {};
    var prefix = (type === 'fournisseurs') ? 'fourn' : 'cli';
    return '<div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="'+prefix+'Nom" value="'+(data.nom || '')+'" required></div><div class="form-group"><label>Prenom *</label><input type="text" id="'+prefix+'Prenom" value="'+(data.prenom || '')+'" required></div><div class="form-group"><label>Genre</label><select id="'+prefix+'Genre"><option value="">-</option><option value="H" '+(data.genre==='H'?'selected':'')+'>Homme</option><option value="F" '+(data.genre==='F'?'selected':'')+'>Femme</option></select></div></div><div class="form-row"><div class="form-group"><label>Telephone</label><input type="text" id="'+prefix+'Tel" value="'+(data.telephone || '')+'"></div><div class="form-group"><label>WhatsApp</label><input type="text" id="'+prefix+'WhatsApp" value="'+(data.whatsapp || '')+'"></div></div><div class="form-row"><div class="form-group"><label>CA</label><input type="number" id="'+prefix+'CA" value="'+(data.ca || 0)+'" step="0.01"></div><div class="form-group"><label>Profit</label><input type="number" id="'+prefix+'Profit" value="'+(data.profit || 0)+'" step="0.01"></div></div><div class="form-row"><div class="form-group"><label>Description</label><textarea id="'+prefix+'Desc">'+(data.description || '')+'</textarea></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveFournisseur()">Enregistrer</button>';
}

function saveFournisseur() {
    var data = {nom: document.getElementById('fournNom').value, prenom: document.getElementById('fournPrenom').value, genre: document.getElementById('fournGenre').value, telephone: document.getElementById('fournTel').value, whatsapp: document.getElementById('fournWhatsApp').value, ca: parseFloat(document.getElementById('fournCA').value) || 0, profit: parseFloat(document.getElementById('fournProfit').value) || 0, description: document.getElementById('fournDesc').value};
    if (!data.nom || !data.prenom) { alert('Nom et Prenom obligatoires'); return; }
    saveDocument('fournisseurs', data).then(function() { closeModal(); refreshCurrentPage(); }).catch(function(e) { alert('Erreur: '+e.message); });
}

// ============================================
// DEPENSES CRUD
// ============================================
function loadDepensesPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-money-bill-wave"></i> Depenses</h3><button class="btn-add" onclick="openDepenseForm()"><i class="fas fa-plus"></i> Ajouter</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Categorie</th><th>Description</th><th>Montant</th><th>Mode</th><th>Actions</th></tr></thead><tbody id="depensesTable"></tbody></table></div></div>';
    loadCollection('depenses', 'depensesTable', function(id, d) {
        var date = d.date || (d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleDateString('fr-FR') : 'N/A');
        return '<tr><td>'+date+'</td><td>'+(d.categorie || '-')+'</td><td>'+(d.description || '-')+'</td><td><strong style="color:#ef4444;">'+(d.montant || 0).toFixed(2)+' MAD</strong></td><td>'+(d.mode || '-')+'</td><td><button class="btn-edit" onclick="editDocument(\'depenses\',\''+id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'depenses\',\''+id+'\')"><i class="fas fa-trash"></i></button></td></tr>';
    });
}

function openDepenseForm(data) {
    data = data || {};
    var html = '<div class="form-row"><div class="form-group"><label>Date</label><input type="date" id="depDate" value="'+(data.date || new Date().toISOString().split('T')[0])+'"></div><div class="form-group"><label>Categorie</label><input type="text" id="depCat" value="'+(data.categorie || '')+'"></div></div><div class="form-row"><div class="form-group"><label>Montant *</label><input type="number" id="depMontant" value="'+(data.montant || 0)+'" step="0.01" required></div><div class="form-group"><label>Mode paiement</label><select id="depMode"><option value="Especes">Especes</option><option value="Carte">Carte</option><option value="Virement">Virement</option><option value="Cheque">Cheque</option></select></div></div><div class="form-row"><div class="form-group"><label>Description</label><textarea id="depDesc">'+(data.description || '')+'</textarea></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveDepense()">Enregistrer</button>';
    currentCollection = 'depenses';
    openModal(editingId ? 'Modifier Depense' : 'Nouvelle Depense', html);
}

function saveDepense() {
    var data = {date: document.getElementById('depDate').value, categorie: document.getElementById('depCat').value, montant: parseFloat(document.getElementById('depMontant').value) || 0, mode: document.getElementById('depMode').value, description: document.getElementById('depDesc').value};
    if (!data.montant) { alert('Montant obligatoire'); return; }
    saveDocument('depenses', data).then(function() { closeModal(); refreshCurrentPage(); }).catch(function(e) { alert('Erreur: '+e.message); });
}

// ============================================
// EDIT DOCUMENT
// ============================================
function openEditForm(collectionName, data) {
    if (collectionName === 'categories') { openCategoryForm(data); }
    else if (collectionName === 'products') { openProductForm(data); }
    else if (collectionName === 'clients') { openClientForm(data); }
    else if (collectionName === 'fournisseurs') { openFournisseurForm(data); }
    else if (collectionName === 'depenses') { openDepenseForm(data); }
}

// ============================================
// OPTIONS
// ============================================
function loadOptionsPage(content) {
    if (!currentUserData || currentUserData.role !== 'admin') { content.innerHTML = '<div class="content-card"><p>Acces refuse</p></div>'; return; }
    content.innerHTML = '<div class="stats-grid" style="margin-bottom:20px;"><div class="stat-card"><div class="stat-icon" style="background:#fef3c7;"><i class="fas fa-clock" style="color:#d97706;"></i></div><div class="stat-info"><span class="stat-label">En attente</span><span class="stat-value" id="pendingCount">0</span></div></div><div class="stat-card"><div class="stat-icon" style="background:#dcfce7;"><i class="fas fa-check-circle" style="color:#16a34a;"></i></div><div class="stat-info"><span class="stat-label">Autorises</span><span class="stat-value" id="authorizedCount">0</span></div></div><div class="stat-card"><div class="stat-icon" style="background:#e0e7ff;"><i class="fas fa-users" style="color:#4f46e5;"></i></div><div class="stat-info"><span class="stat-label">Total</span><span class="stat-value" id="totalUsers">0</span></div></div></div><div class="content-card"><div class="card-header"><h3>Gestion utilisateurs</h3><button class="btn-add" onclick="loadUsersList()">Actualiser</button></div><table class="data-table"><thead><tr><th>Username</th><th>Nom</th><th>Email</th><th>Role</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="usersTableBody"></tbody></table></div>';
    loadUsersList();
}

function loadUsersList() {
    db.collection('users').orderBy('createdAt','desc').get().then(function(snapshot) {
        var pending=0, authorized=0, tbody=document.getElementById('usersTableBody'); tbody.innerHTML='';
        if(snapshot.empty){tbody.innerHTML='<tr><td colspan="6">Aucun</td></tr>';return;}
        snapshot.forEach(function(doc){
            var u=doc.data(), id=doc.id;
            if(u.authorized==='no')pending++;else authorized++;
            var badge=u.authorized==='yes'?'<span class="status-success">Autorise</span>':'<span class="status-warning">En attente</span>';
            var btn=u.authorized==='no'?'<button class="btn-add" style="padding:4px 8px;font-size:0.7rem;margin-right:5px;" onclick="authorizeUser(\''+id+'\')">Autoriser</button><button class="btn-delete" style="padding:4px 8px;font-size:0.7rem;" onclick="deleteDocument(\'users\',\''+id+'\')">Supprimer</button>':'<button class="btn-edit" style="padding:4px 8px;font-size:0.7rem;margin-right:5px;color:#d97706;" onclick="deauthorizeUser(\''+id+'\')">Bloquer</button><button class="btn-delete" style="padding:4px 8px;font-size:0.7rem;" onclick="deleteDocument(\'users\',\''+id+'\')">Supprimer</button>';
            tbody.innerHTML+='<tr><td>@'+u.username+'</td><td>'+u.prenom+' '+u.nom+'</td><td>'+u.email+'</td><td>'+u.role+'</td><td>'+badge+'</td><td>'+btn+'</td></tr>';
        });
        document.getElementById('pendingCount').textContent=pending;
        document.getElementById('authorizedCount').textContent=authorized;
        document.getElementById('totalUsers').textContent=snapshot.size;
    });
}

function authorizeUser(uid){if(confirm('Autoriser ?')){db.collection('users').doc(uid).update({authorized:'yes',updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){loadUsersList();});}}
function deauthorizeUser(uid){if(confirm('Bloquer ?')){db.collection('users').doc(uid).update({authorized:'no',updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){loadUsersList();});}}

// ============================================
// LOGIN / REGISTER / LOGOUT
// ============================================
function handleLogin(event) {
    event.preventDefault();
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var btn = document.getElementById('loginBtn');
    if (!email || !password) { showLoginError('Remplissez tous les champs'); return false; }
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...'; hideLoginError();
    auth.signInWithEmailAndPassword(email, password).then(function(userCredential) {
        return db.collection('users').doc(userCredential.user.uid).get().then(function(doc) {
            if (!doc.exists) { throw new Error('NO_DOC'); }
            var userData = doc.data();
            if (userData.authorized !== 'yes') { auth.signOut(); showLoginError('Compte en attente.'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Connexion'; return; }
            currentUserData = { uid: doc.id, ...userData };
            localStorage.setItem('currentUser', JSON.stringify(currentUserData));
            if (userData.role === 'client') { showClientPage(); } else { showDashboard(); }
        });
    }).catch(function(error) {
        var msg = error.code === 'auth/user-not-found' ? 'Email non trouve' : error.code === 'auth/wrong-password' ? 'Mot de passe incorrect' : error.message;
        showLoginError(msg);
    }).finally(function() { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Connexion'; });
    return false;
}

function showLoginError(msg) {
    var el = document.getElementById('loginError');
    if (!el) { el = document.createElement('div'); el.id = 'loginError'; el.style.cssText = 'background:#fee2e2;color:#991b1b;padding:15px;border-radius:12px;margin-bottom:20px;font-size:0.9rem;text-align:center;border:2px solid #fecaca;'; document.getElementById('loginForm').parentNode.insertBefore(el, document.getElementById('loginForm')); }
    el.innerHTML = 'X ' + msg; el.style.display = 'block';
}
function hideLoginError() { var e = document.getElementById('loginError'); if (e) e.style.display = 'none'; }

function handleRegister(event) {
    event.preventDefault();
    var nom = document.getElementById('regNom').value.trim(), prenom = document.getElementById('regPrenom').value.trim(), username = document.getElementById('regUsername').value.trim(), email = document.getElementById('regEmail').value.trim(), telephone = document.getElementById('regTelephone').value.trim(), role = document.getElementById('regRole').value, password = document.getElementById('regPassword').value, btn = document.getElementById('registerBtn');
    if (!nom || !prenom || !username || !email || !telephone || !role || !password) { alert('Tous les champs obligatoires'); return false; }
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';
    auth.createUserWithEmailAndPassword(email, password).then(function(userCredential) {
        return db.collection('users').doc(userCredential.user.uid).set({nom,prenom,username,email,telephone,role,authorized:'no',createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    }).then(function() { alert('Compte cree ! En attente de validation.'); document.getElementById('registerForm').reset(); showLogin(); }).catch(function(e) { alert(e.message); }).finally(function() { btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus"></i> Creer'; });
    return false;
}

function handleLogout() { auth.signOut().then(function() { localStorage.removeItem('currentUser'); currentUser=null; currentUserData=null; showAuthPage(); }); }
function updateSidebarUserInfo() { var el = document.getElementById('sidebarUserInfo'); if (el && currentUserData) el.innerHTML = '<i class="fas fa-user-circle"></i> '+currentUserData.prenom+' '+currentUserData.nom+' <small style="color:#f39c12;">('+currentUserData.role+')</small>'; }
function updateClientSidebarInfo() { var el = document.getElementById('clientSidebarInfo'); if (el && currentUserData) el.innerHTML = '<i class="fas fa-user-circle"></i> '+currentUserData.prenom+' '+currentUserData.nom; }
function loadDashboardStats() {
    db.collection('products').get().then(function(s) { var e = document.getElementById('productsCount'); if (e) e.textContent = s.size; }).catch(function() {});
    db.collection('clients').get().then(function(s) { var e = document.getElementById('clientsCount'); if (e) e.textContent = s.size; }).catch(function() {});
}

// ============================================
// CLIENT
// ============================================
function clientNavigate(page) {
    var items = document.querySelectorAll('#clientPage .nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    if (page === 'commander') items[0].classList.add('active');
    else if (page === 'historique') items[1].classList.add('active');
    else if (page === 'parametres') items[2].classList.add('active');
    var titles = {commander:'Commander',historique:'Historique',parametres:'Parametres'};
    document.getElementById('clientPageTitle').textContent = titles[page];
    var content = document.getElementById('clientDynamicContent');
    if (page === 'commander') content.innerHTML = '<div class="content-card"><h3>Commander en ligne</h3><p style="text-align:center;padding:40px;">Fonctionnalite a venir</p></div>';
    else if (page === 'historique') content.innerHTML = '<div class="content-card"><h3>Historique</h3><table class="data-table"><thead><tr><th>N</th><th>Date</th><th>Total</th></tr></thead><tbody id="clientOrdersTable"><tr><td colspan="3">Aucune</td></tr></tbody></table></div>';
    else if (page === 'parametres') content.innerHTML = '<div class="content-card"><h3>Parametres</h3><div id="profileMessage"></div><p>Email: '+currentUserData.email+'</p><p>Tel: '+(currentUserData.telephone||'N/A')+'</p><form onsubmit="return updateClientProfile(event)" style="margin-top:20px;"><div class="input-group"><i class="fas fa-phone"></i><input type="tel" id="clientTelephone" value="'+(currentUserData.telephone||'')+'"></div><div class="input-group"><i class="fas fa-lock"></i><input type="password" id="clientNewPassword" placeholder="Nouveau mot de passe"></div><div class="input-group"><i class="fas fa-lock"></i><input type="password" id="clientConfirmPassword" placeholder="Confirmer"></div><button type="submit" class="btn-add" style="width:100%;">Enregistrer</button></form></div>';
}

function updateClientProfile(event) {
    event.preventDefault();
    var newPhone = document.getElementById('clientTelephone').value.trim();
    var newPassword = document.getElementById('clientNewPassword').value;
    var confirmPassword = document.getElementById('clientConfirmPassword').value;
    var msgEl = document.getElementById('profileMessage');
    if (newPassword && (newPassword.length < 6 || newPassword !== confirmPassword)) { msgEl.style.display='block'; msgEl.style.background='#fee2e2'; msgEl.textContent='Mot de passe invalide'; return false; }
    var updates = {telephone: newPhone, updatedAt: firebase.firestore.FieldValue.serverTimestamp()};
    db.collection('users').doc(currentUser.uid).update(updates).then(function() {
        if (newPassword.length >= 6) return currentUser.updatePassword(newPassword);
    }).then(function() {
        msgEl.style.display='block'; msgEl.style.background='#dcfce7'; msgEl.textContent='Profil mis a jour !';
        currentUserData.telephone = newPhone;
    }).catch(function(e) { msgEl.style.display='block'; msgEl.style.background='#fee2e2'; msgEl.textContent = 'Erreur: '+e.message; });
    return false;
}

console.log('Ready - CRUD Firestore');
