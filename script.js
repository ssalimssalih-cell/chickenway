var currentUser = null;
var currentUserData = null;
var editingId = null;
var currentCollection = '';
var selectedCategoryFilter = '';

window.addEventListener('DOMContentLoaded', function() {
    console.log('Chicken Way Started - Version Pro');
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
    selectedCategoryFilter = '';
    
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

async function uploadImage(file, path) {
    return new Promise(function(resolve, reject) {
        if (!file) { resolve(null); return; }
        var storageRef = firebase.storage().ref(path + '/' + Date.now() + '_' + file.name);
        var uploadTask = storageRef.put(file);
        uploadTask.on('state_changed', null, reject, function() {
            uploadTask.snapshot.ref.getDownloadURL().then(resolve);
        });
    });
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
    if (confirm('Supprimer ?')) { 
        db.collection(collectionName).doc(id).get().then(function(doc) {
            if (doc.exists && doc.data().imageUrl) {
                firebase.storage().refFromURL(doc.data().imageUrl).delete().catch(function(){});
            }
        });
        db.collection(collectionName).doc(id).delete().then(function() { 
            alert('Supprime'); 
            refreshCurrentPage(); 
        }); 
    }
}

function refreshCurrentPage() {
    var title = document.getElementById('pageTitle').textContent;
    var map = {Categories:'categories',Produits:'products',Clients:'clients',Fournisseurs:'fournisseurs',Depenses:'depenses'};
    navigateTo(map[title] || 'dashboard');
}

// ==================== CATEGORIES ====================
function loadCategoriesPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-layer-group"></i> Categories</h3><button class="btn-add" onclick="openCategoryForm()"><i class="fas fa-plus"></i> Nouvelle Categorie</button></div><div class="table-container"><table class="data-table"><thead><tr><th>ID</th><th>Icone</th><th>Nom</th><th>Description</th><th>CA</th><th>Profit</th><th>Stock Total</th><th>Nb Produits</th><th>Date Creation</th><th>Actions</th></tr></thead><tbody id="categoriesTable"></tbody></table></div></div>';
    loadCategories();
}

async function loadCategories() {
    try {
        var snapshot = await db.collection('categories').orderBy('createdAt','desc').get();
        var tbody = document.getElementById('categoriesTable');
        tbody.innerHTML = '';
        if (snapshot.empty) { 
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;">Aucune categorie</td></tr>'; 
            return; 
        }
        
        for (var doc of snapshot.docs) {
            var d = doc.data();
            var productsCount = await db.collection('products').where('categorie', '==', d.nom).get().then(function(s) { return s.size; });
            
            var iconHtml = d.imageUrl ? '<img src="' + d.imageUrl + '" style="width:40px;height:40px;object-fit:cover;border-radius:8px;">' : '<i class="fas ' + (d.icon || 'fa-folder') + ' fa-2x" style="color:#f39c12;"></i>';
            var date = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleDateString('fr-FR', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : 'N/A';
            
            tbody.innerHTML += '<tr><td><span style="background:#f1f5f9;padding:2px 8px;border-radius:10px;font-weight:600;">' + doc.id.substring(0,6) + '</span></td><td>' + iconHtml + '</td><td><strong>' + d.nom + '</strong></td><td>' + (d.description || '-') + '</td><td><strong>' + (d.ca || 0).toFixed(2) + ' MAD</strong></td><td><strong style="color:' + ((d.profit || 0) >= 0 ? '#16a34a' : '#dc2626') + ';">' + (d.profit || 0).toFixed(2) + ' MAD</strong></td><td>' + (d.totalStock || 0) + '</td><td><span class="status-success">' + productsCount + ' produits</span></td><td>' + date + '</td><td><button class="btn-edit" onclick="editDocument(\'categories\',\'' + doc.id + '\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'categories\',\'' + doc.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
        }
    } catch(e) {
        console.error('Erreur categories:', e);
    }
}

function openCategoryForm(data) {
    data = data || {};
    var html = '<div class="form-row"><div class="form-group"><label>Photo/Icone</label><input type="file" id="catImage" accept="image/*" onchange="previewImage(this, \'catImagePreview\')"><div id="catImagePreview">' + (data.imageUrl ? '<img src="'+data.imageUrl+'" style="max-width:100px;margin-top:5px;">' : '') + '</div></div><div class="form-group"><label>Icone FontAwesome (si pas d\'image)</label><input type="text" id="catIcon" value="' + (data.icon || 'fa-folder') + '" placeholder="fa-folder"></div></div><div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="catNom" value="' + (data.nom || '') + '" required></div><div class="form-group"><label>Description</label><textarea id="catDesc">' + (data.description || '') + '</textarea></div></div><div class="form-row"><div class="form-group"><label>CA</label><input type="number" id="catCA" value="' + (data.ca || 0) + '" step="0.01"></div><div class="form-group"><label>Profit</label><input type="number" id="catProfit" value="' + (data.profit || 0) + '" step="0.01"></div></div><div class="form-row"><div class="form-group"><label>Stock Total</label><input type="number" id="catStock" value="' + (data.totalStock || 0) + '"></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveCategory()">Enregistrer</button>';
    currentCollection = 'categories';
    openModal(editingId ? 'Modifier Categorie' : 'Nouvelle Categorie', html);
}

async function saveCategory() {
    var nom = document.getElementById('catNom').value;
    if (!nom) { alert('Nom obligatoire'); return; }
    
    var imageFile = document.getElementById('catImage').files[0];
    var imageUrl = null;
    
    if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'categories');
    }
    
    var data = {
        nom: nom, 
        icon: document.getElementById('catIcon').value, 
        description: document.getElementById('catDesc').value, 
        ca: parseFloat(document.getElementById('catCA').value) || 0, 
        profit: parseFloat(document.getElementById('catProfit').value) || 0,
        totalStock: parseInt(document.getElementById('catStock').value) || 0,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (imageUrl) data.imageUrl = imageUrl;
    
    if (editingId) {
        await db.collection('categories').doc(editingId).update(data);
    } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('categories').add(data);
    }
    
    closeModal(); 
    refreshCurrentPage();
}

// ==================== PRODUITS ====================
function loadProductsPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-utensils"></i> Produits</h3><div style="display:flex;gap:10px;"><select id="categoryFilter" class="role-select" style="width:auto;" onchange="filterProducts()"><option value="">Toutes categories</option></select><button class="btn-add" onclick="openProductForm()"><i class="fas fa-plus"></i> Nouveau Produit</button></div></div><div class="table-container"><table class="data-table"><thead><tr><th>ID</th><th>Image</th><th>Nom</th><th>Categorie</th><th>Prix Achat</th><th>Prix Vente</th><th>Profit</th><th>Prix Promo</th><th>Stock</th><th>Vendues</th><th>CA</th><th>Temps Prep</th><th>Dispo</th><th>Date Creation</th><th>Actions</th></tr></thead><tbody id="productsTable"></tbody></table></div></div>';
    loadCategoriesInFilter();
    loadProducts();
}

async function loadCategoriesInFilter() {
    try {
        var snapshot = await db.collection('categories').get();
        var select = document.getElementById('categoryFilter');
        snapshot.forEach(function(doc) {
            select.innerHTML += '<option value="' + doc.data().nom + '">' + doc.data().nom + '</option>';
        });
    } catch(e) {}
}

function filterProducts() {
    selectedCategoryFilter = document.getElementById('categoryFilter').value;
    loadProducts();
}

async function loadProducts() {
    try {
        var query = db.collection('products').orderBy('createdAt','desc');
        var snapshot = await query.get();
        var tbody = document.getElementById('productsTable');
        tbody.innerHTML = '';
        
        if (snapshot.empty) { 
            tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:30px;">Aucun produit</td></tr>'; 
            return; 
        }
        
        for (var doc of snapshot.docs) {
            var d = doc.data();
            if (selectedCategoryFilter && d.categorie !== selectedCategoryFilter) continue;
            
            var profit = calculateProfit(d);
            var imageHtml = d.imageUrl ? '<img src="' + d.imageUrl + '" style="width:50px;height:50px;object-fit:cover;border-radius:8px;">' : '<div style="width:50px;height:50px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-utensils" style="color:#94a3b8;"></i></div>';
            var date = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleDateString('fr-FR', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : 'N/A';
            var dispo = d.disponible !== false ? '<span class="status-success">Oui</span>' : '<span class="status-danger">Non</span>';
            var promoDisplay = d.prixPromo && d.prixPromo > 0 ? '<span style="color:#dc2626;font-weight:700;">' + d.prixPromo.toFixed(2) + ' MAD</span>' : '-';
            
            tbody.innerHTML += '<tr><td><span style="background:#f1f5f9;padding:2px 8px;border-radius:10px;font-weight:600;">' + doc.id.substring(0,6) + '</span></td><td>' + imageHtml + '</td><td><strong>' + d.nom + '</strong></td><td>' + (d.categorie || '-') + '</td><td>' + (d.prixAchat || 0).toFixed(2) + ' MAD</td><td>' + (d.prixVente || 0).toFixed(2) + ' MAD</td><td><strong style="color:' + (profit >= 0 ? '#16a34a' : '#dc2626') + ';">' + profit.toFixed(2) + ' MAD</strong></td><td>' + promoDisplay + '</td><td>' + (d.stock || 0) + '</td><td>' + (d.vendues || 0) + '</td><td>' + (d.ca || 0).toFixed(2) + ' MAD</td><td>' + (d.tempsPrep || 'N/A') + '</td><td>' + dispo + '</td><td>' + date + '</td><td><button class="btn-edit" onclick="editDocument(\'products\',\'' + doc.id + '\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'products\',\'' + doc.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
        }
    } catch(e) {
        console.error('Erreur produits:', e);
    }
}

function calculateProfit(data) {
    var prixVente = data.prixPromo && data.prixPromo > 0 ? data.prixPromo : (data.prixVente || 0);
    return prixVente - (data.prixAchat || 0);
}

async function openProductForm(data) {
    data = data || {};
    
    var categoriesOptions = '';
    try {
        var catSnapshot = await db.collection('categories').get();
        catSnapshot.forEach(function(doc) {
            var selected = data.categorie === doc.data().nom ? 'selected' : '';
            categoriesOptions += '<option value="' + doc.data().nom + '" ' + selected + '>' + doc.data().nom + '</option>';
        });
    } catch(e) {}
    
    var html = '<div class="form-row"><div class="form-group"><label>Image du produit</label><input type="file" id="prodImage" accept="image/*" onchange="previewImage(this, \'prodImagePreview\')"><div id="prodImagePreview">' + (data.imageUrl ? '<img src="'+data.imageUrl+'" style="max-width:100px;margin-top:5px;">' : '') + '</div></div></div><div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="prodNom" value="' + (data.nom || '') + '" required></div><div class="form-group"><label>Categorie</label><select id="prodCat"><option value="">Selectionner</option>' + categoriesOptions + '</select></div></div><div class="form-row"><div class="form-group"><label>Prix Achat (MAD)</label><input type="number" id="prodPA" value="' + (data.prixAchat || 0) + '" step="0.01" onchange="calculateProfitPreview()"></div><div class="form-group"><label>Prix Vente (MAD)</label><input type="number" id="prodPV" value="' + (data.prixVente || 0) + '" step="0.01" onchange="calculateProfitPreview()"></div></div><div class="form-row"><div class="form-group"><label>Prix Promo (MAD)</label><input type="number" id="prodPromo" value="' + (data.prixPromo || 0) + '" step="0.01" onchange="calculateProfitPreview()"></div><div class="form-group"><label>Profit: <span id="profitPreview" style="color:#16a34a;font-weight:700;">0.00 MAD</span></label></div></div><div class="form-row"><div class="form-group"><label>Stock</label><input type="number" id="prodStock" value="' + (data.stock || 0) + '"></div><div class="form-group"><label>Temps Preparation</label><input type="text" id="prodTemps" value="' + (data.tempsPrep || '') + '" placeholder="ex: 15 min"></div></div><div class="form-row"><div class="form-group"><label>Disponible</label><select id="prodDispo"><option value="1" ' + (data.disponible !== false ? 'selected' : '') + '>Oui</option><option value="0" ' + (!data.disponible ? 'selected' : '') + '>Non</option></select></div><div class="form-group"><label>Description</label><textarea id="prodDesc">' + (data.description || '') + '</textarea></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveProduct()">Enregistrer</button>';
    currentCollection = 'products';
    openModal(editingId ? 'Modifier Produit' : 'Nouveau Produit', html);
    setTimeout(calculateProfitPreview, 100);
}

function calculateProfitPreview() {
    var pa = parseFloat(document.getElementById('prodPA')?.value) || 0;
    var pv = parseFloat(document.getElementById('prodPV')?.value) || 0;
    var promo = parseFloat(document.getElementById('prodPromo')?.value) || 0;
    var prixVente = promo > 0 ? promo : pv;
    var profit = prixVente - pa;
    var el = document.getElementById('profitPreview');
    if (el) {
        el.textContent = profit.toFixed(2) + ' MAD';
        el.style.color = profit >= 0 ? '#16a34a' : '#dc2626';
    }
}

async function saveProduct() {
    var nom = document.getElementById('prodNom').value;
    if (!nom) { alert('Nom obligatoire'); return; }
    
    var imageFile = document.getElementById('prodImage').files[0];
    var imageUrl = null;
    
    if (imageFile) {
        imageUrl = await uploadImage(imageFile, 'products');
    }
    
    var prixAchat = parseFloat(document.getElementById('prodPA').value) || 0;
    var prixVente = parseFloat(document.getElementById('prodPV').value) || 0;
    var prixPromo = parseFloat(document.getElementById('prodPromo').value) || 0;
    var stock = parseInt(document.getElementById('prodStock').value) || 0;
    
    var prixFinal = prixPromo > 0 ? prixPromo : prixVente;
    var profit = prixFinal - prixAchat;
    
    var data = {
        nom: nom, 
        categorie: document.getElementById('prodCat').value, 
        prixAchat: prixAchat, 
        prixVente: prixVente, 
        prixPromo: prixPromo,
        profit: profit,
        stock: stock, 
        vendues: 0,
        ca: 0,
        tempsPrep: document.getElementById('prodTemps').value,
        disponible: document.getElementById('prodDispo').value === '1', 
        description: document.getElementById('prodDesc').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (imageUrl) data.imageUrl = imageUrl;
    
    if (editingId) {
        await db.collection('products').doc(editingId).update(data);
    } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('products').add(data);
    }
    
    closeModal(); 
    refreshCurrentPage();
}

// Preview image upload
function previewImage(input, previewId) {
    var preview = document.getElementById(previewId);
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = '<img src="' + e.target.result + '" style="max-width:100px;margin-top:5px;border-radius:8px;">';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ==================== CLIENTS ====================
function loadClientsPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-users"></i> Clients</h3><button class="btn-add" onclick="openClientForm()"><i class="fas fa-plus"></i> Ajouter</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Nom</th><th>Prenom</th><th>Tel</th><th>CA</th><th>Points</th><th>Actions</th></tr></thead><tbody id="clientsTable"></tbody></table></div></div>';
    loadCollection('clients', 'clientsTable', function(id, d) {
        return '<tr><td><strong>' + d.nom + '</strong></td><td>' + d.prenom + '</td><td>' + (d.telephone || '-') + '</td><td>' + (d.ca || 0) + '</td><td>' + (d.points || 0) + '</td><td><button class="btn-edit" onclick="editDocument(\'clients\',\'' + id + '\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'clients\',\'' + id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
    });
}

function openClientForm(data) {
    data = data || {};
    var html = '<div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="cliNom" value="' + (data.nom || '') + '" required></div><div class="form-group"><label>Prenom *</label><input type="text" id="cliPrenom" value="' + (data.prenom || '') + '" required></div></div><div class="form-row"><div class="form-group"><label>Telephone</label><input type="text" id="cliTel" value="' + (data.telephone || '') + '"></div><div class="form-group"><label>CA</label><input type="number" id="cliCA" value="' + (data.ca || 0) + '" step="0.01"></div></div><div class="form-row"><div class="form-group"><label>Points</label><input type="number" id="cliPoints" value="' + (data.points || 0) + '"></div><div class="form-group"><label>Description</label><textarea id="cliDesc">' + (data.description || '') + '</textarea></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveClient()">Enregistrer</button>';
    currentCollection = 'clients';
    openModal(editingId ? 'Modifier Client' : 'Nouveau Client', html);
}

function saveClient() {
    var data = {nom: document.getElementById('cliNom').value, prenom: document.getElementById('cliPrenom').value, telephone: document.getElementById('cliTel').value, ca: parseFloat(document.getElementById('cliCA').value) || 0, points: parseInt(document.getElementById('cliPoints').value) || 0, description: document.getElementById('cliDesc').value};
    if (!data.nom || !data.prenom) { alert('Nom et Prenom obligatoires'); return; }
    saveDocument('clients', data).then(function() { closeModal(); refreshCurrentPage(); });
}

// ==================== FOURNISSEURS ====================
function loadFournisseursPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-truck"></i> Fournisseurs</h3><button class="btn-add" onclick="openFournisseurForm()"><i class="fas fa-plus"></i> Ajouter</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Nom</th><th>Prenom</th><th>Tel</th><th>Actions</th></tr></thead><tbody id="fournisseursTable"></tbody></table></div></div>';
    loadCollection('fournisseurs', 'fournisseursTable', function(id, d) {
        return '<tr><td><strong>' + d.nom + '</strong></td><td>' + d.prenom + '</td><td>' + (d.telephone || '-') + '</td><td><button class="btn-edit" onclick="editDocument(\'fournisseurs\',\'' + id + '\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'fournisseurs\',\'' + id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
    });
}

function openFournisseurForm(data) {
    data = data || {};
    var html = '<div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="fourNom" value="' + (data.nom || '') + '" required></div><div class="form-group"><label>Prenom *</label><input type="text" id="fourPrenom" value="' + (data.prenom || '') + '" required></div></div><div class="form-row"><div class="form-group"><label>Telephone</label><input type="text" id="fourTel" value="' + (data.telephone || '') + '"></div><div class="form-group"><label>Description</label><textarea id="fourDesc">' + (data.description || '') + '</textarea></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveFournisseur()">Enregistrer</button>';
    currentCollection = 'fournisseurs';
    openModal(editingId ? 'Modifier Fournisseur' : 'Nouveau Fournisseur', html);
}

function saveFournisseur() {
    var data = {nom: document.getElementById('fourNom').value, prenom: document.getElementById('fourPrenom').value, telephone: document.getElementById('fourTel').value, description: document.getElementById('fourDesc').value};
    if (!data.nom || !data.prenom) { alert('Nom et Prenom obligatoires'); return; }
    saveDocument('fournisseurs', data).then(function() { closeModal(); refreshCurrentPage(); });
}

// ==================== DEPENSES ====================
function loadDepensesPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-money-bill-wave"></i> Depenses</h3><button class="btn-add" onclick="openDepenseForm()"><i class="fas fa-plus"></i> Ajouter</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Description</th><th>Montant</th><th>Actions</th></tr></thead><tbody id="depensesTable"></tbody></table></div></div>';
    loadCollection('depenses', 'depensesTable', function(id, d) {
        var date = d.date || 'N/A';
        return '<tr><td>' + date + '</td><td>' + (d.description || '-') + '</td><td><strong style="color:#ef4444;">' + (d.montant || 0).toFixed(2) + ' MAD</strong></td><td><button class="btn-edit" onclick="editDocument(\'depenses\',\'' + id + '\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'depenses\',\'' + id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
    });
}

function openDepenseForm(data) {
    data = data || {};
    var html = '<div class="form-row"><div class="form-group"><label>Date</label><input type="date" id="depDate" value="' + (data.date || new Date().toISOString().split('T')[0]) + '"></div><div class="form-group"><label>Montant *</label><input type="number" id="depMontant" value="' + (data.montant || 0) + '" step="0.01" required></div></div><div class="form-row"><div class="form-group"><label>Description</label><textarea id="depDesc">' + (data.description || '') + '</textarea></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveDepense()">Enregistrer</button>';
    currentCollection = 'depenses';
    openModal(editingId ? 'Modifier Depense' : 'Nouvelle Depense', html);
}

function saveDepense() {
    var data = {date: document.getElementById('depDate').value, montant: parseFloat(document.getElementById('depMontant').value) || 0, description: document.getElementById('depDesc').value};
    if (!data.montant) { alert('Montant obligatoire'); return; }
    saveDocument('depenses', data).then(function() { closeModal(); refreshCurrentPage(); });
}

function openEditForm(collectionName, data) {
    if (collectionName === 'categories') openCategoryForm(data);
    else if (collectionName === 'products') openProductForm(data);
    else if (collectionName === 'clients') openClientForm(data);
    else if (collectionName === 'fournisseurs') openFournisseurForm(data);
    else if (collectionName === 'depenses') openDepenseForm(data);
}

// ==================== OPTIONS ====================
function loadOptionsPage(content) {
    if (!currentUserData || currentUserData.userData.role !== 'admin') { content.innerHTML = '<div class="content-card"><p>Acces refuse</p></div>'; return; }
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
            var btn=u.authorized==='no'?'<button class="btn-add" style="padding:4px 8px;font-size:0.7rem;margin-right:5px;" onclick="authorizeUser(\''+id+'\')">Autoriser</button><button class="btn-delete" onclick="deleteUser(\''+id+'\')">Supprimer</button>':'<button class="btn-edit" style="padding:4px 8px;font-size:0.7rem;margin-right:5px;color:#d97706;" onclick="deauthorizeUser(\''+id+'\')">Bloquer</button><button class="btn-delete" onclick="deleteUser(\''+id+'\')">Supprimer</button>';
            tbody.innerHTML+='<tr><td>@'+u.username+'</td><td>'+u.prenom+' '+u.nom+'</td><td>'+u.email+'</td><td>'+u.role+'</td><td>'+badge+'</td><td>'+btn+'</td></tr>';
        });
        document.getElementById('pendingCount').textContent=pending;
        document.getElementById('authorizedCount').textContent=authorized;
        document.getElementById('totalUsers').textContent=snapshot.size;
    });
}

function authorizeUser(uid){if(confirm('Autoriser ?')){db.collection('users').doc(uid).update({authorized:'yes',updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){loadUsersList();});}}
function deauthorizeUser(uid){if(confirm('Bloquer ?')){db.collection('users').doc(uid).update({authorized:'no',updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){loadUsersList();});}}
function deleteUser(uid){if(confirm('Supprimer ?')){db.collection('users').doc(uid).delete().then(function(){loadUsersList();});}}

// ==================== AUTH ====================
function handleLogin(event) {
    event.preventDefault();
    var email = document.getElementById('loginEmail').value.trim(), password = document.getElementById('loginPassword').value, btn = document.getElementById('loginBtn');
    if (!email || !password) { showLoginError('Remplissez tous les champs'); return false; }
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';
    hideLoginError();
    auth.signInWithEmailAndPassword(email, password).then(function(userCredential) {
        return db.collection('users').doc(userCredential.user.uid).get().then(function(doc) {
            if (!doc.exists) { auth.signOut(); showLoginError('Compte introuvable'); return; }
            var userData = doc.data();
            if (userData.authorized !== 'yes') { auth.signOut(); showLoginError('Compte en attente de validation.'); return; }
            currentUserData = { uid: doc.id, userData: userData };
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
    el.innerHTML = msg; el.style.display = 'block';
}

function hideLoginError() { var e = document.getElementById('loginError'); if (e) e.style.display = 'none'; }

function handleRegister(event) {
    event.preventDefault();
    var nom = document.getElementById('regNom').value.trim(), prenom = document.getElementById('regPrenom').value.trim(), username = document.getElementById('regUsername').value.trim(), email = document.getElementById('regEmail').value.trim(), telephone = document.getElementById('regTelephone').value.trim(), role = document.getElementById('regRole').value, password = document.getElementById('regPassword').value, btn = document.getElementById('registerBtn');
    if (!nom || !prenom || !username || !email || !telephone || !role || !password) { alert('Tous les champs obligatoires'); return false; }
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';
    auth.createUserWithEmailAndPassword(email, password).then(function(userCredential) {
        return db.collection('users').doc(userCredential.user.uid).set({nom:nom,prenom:prenom,username:username,email:email,telephone:telephone,role:role,authorized:'no',createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    }).then(function() { alert('Compte cree ! Veuillez attendre la validation par un administrateur.'); document.getElementById('registerForm').reset(); showLogin(); }).catch(function(e) { alert(e.message); }).finally(function() { btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus"></i> Creer'; });
    return false;
}

function handleLogout() { auth.signOut().then(function() { localStorage.removeItem('currentUser'); currentUser=null; currentUserData=null; showAuthPage(); }); }

function updateSidebarUserInfo() {
    var el = document.getElementById('sidebarUserInfo');
    if (el && currentUserData) { el.innerHTML = '<i class="fas fa-user-circle"></i> ' + currentUserData.userData.prenom + ' ' + currentUserData.userData.nom + ' <small style="color:#f39c12;">(' + currentUserData.userData.role + ')</small>'; }
}

function updateClientSidebarInfo() {
    var el = document.getElementById('clientSidebarInfo');
    if (el && currentUserData) { el.innerHTML = '<i class="fas fa-user-circle"></i> ' + currentUserData.userData.prenom + ' ' + currentUserData.userData.nom; }
}

function clientNavigate(page) {
    var items = document.querySelectorAll('#clientPage .nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    if (page === 'commander') items[0].classList.add('active');
    else if (page === 'historique') items[1].classList.add('active');
    else items[2].classList.add('active');
    document.getElementById('clientPageTitle').textContent = page === 'commander' ? 'Commander' : page === 'historique' ? 'Historique' : 'Parametres';
    document.getElementById('clientDynamicContent').innerHTML = '<div class="content-card"><h3>' + (page === 'commander' ? 'Commander en ligne' : page === 'historique' ? 'Historique' : 'Parametres') + '</h3><p style="text-align:center;padding:40px;">Fonctionnalite a venir</p></div>';
}

console.log('Chicken Way Pro - Ready');
