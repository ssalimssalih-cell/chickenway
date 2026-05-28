// ==================== ADMIN.JS AVEC CACHE OFFLINE, TRI, FILTRES, PAGINATION ====================
var editingId = null;
var currentCollection = '';
var selectedCategoryFilter = '';
var sortOrders = {};
var clientSearchQuery = '';

// Données complètes (pour filtrage)
var allCategoriesData = [];
var allProductsData = [];
var allClientsData = [];
var allFournisseursData = [];
var allDepensesData = [];
var allCommandesData = [];
var allVentesData = [];
var allCreditsData = [];

// Pagination
var currentPages = {
    categories: 1,
    products: 1,
    clients: 1,
    fournisseurs: 1,
    depenses: 1,
    commandes: 1,
    ventes: 1,
    credits: 1
};
var itemsPerPage = 20;

// Filtres actifs
var ventesPeriod = 'all', ventesSearch = '';
var creditsPeriod = 'all', creditsSearch = '';
var commandesPeriod = 'all', commandesSearch = '';

// Listes pour les catégories
var fournisseurCategoriesList = ['Alimentaire', 'Boissons', 'Emballage', 'Entretien', 'Viandes', 'Légumes', 'Sauces', 'Autre'];
var depenseCategoriesList = ['Électricité', 'Internet', 'Publicité', 'Viande', 'Poulet', 'Fruits', 'Légumes', 'Boissons', 'Emballage', 'Entretien', 'Loyer', 'Salaire', 'Transport', 'Autre'];

// ==================== DASHBOARD ====================
function loadDashboardPage(c) {
    c.innerHTML = '<div class="stats-grid"><div class="stat-card"><div class="stat-icon"><i class="fas fa-utensils"></i></div><div class="stat-info"><span class="stat-label">Produits</span><span class="stat-value" id="productsCount">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value" id="clientsCount">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-layer-group"></i></div><div class="stat-info"><span class="stat-label">Catégories</span><span class="stat-value" id="categoriesCount">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-cart"></i></div><div class="stat-info"><span class="stat-label">Ventes</span><span class="stat-value" id="ventesCount">0</span></div></div></div><div class="content-card"><div class="card-header"><h3><i class="fas fa-bell"></i> Inscriptions en attente</h3><button class="btn-add" onclick="loadPendingRegistrations()"><i class="fas fa-sync"></i> Actualiser</button></div><div id="pendingRegistrations">Chargement...</div></div>';
    loadDashboardStats(); loadPendingRegistrations();
}

function loadDashboardStats() {
    db.collection('products').get().then(function(s){var e=document.getElementById('productsCount');if(e)e.textContent=s.size;});
    db.collection('clients').get().then(function(s){var e=document.getElementById('clientsCount');if(e)e.textContent=s.size;});
    db.collection('categories').get().then(function(s){var e=document.getElementById('categoriesCount');if(e)e.textContent=s.size;});
    db.collection('ventes').get().then(function(s){var e=document.getElementById('ventesCount');if(e)e.textContent=s.size;});
}

function loadPendingRegistrations() {
    var d = document.getElementById('pendingRegistrations'); if (!d) return;
    db.collection('users').where('authorized', '==', 'no').get().then(function(s) {
        if (s.empty) { d.innerHTML = '<p style="padding:30px;color:#16a34a;">Aucune inscription en attente</p>'; return; }
        var u = []; s.forEach(function(dc) { u.push({ id: dc.id, data: dc.data() }); });
        u.sort(function(a, b) { return (b.data.createdAt?.seconds || 0) - (a.data.createdAt?.seconds || 0); });
        var h = '<div class="table-container"><table class="data-table"><thead><tr><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>Date</th><th>Actions</th></table></thead><tbody>';
        u.forEach(function(x) {
            var dd = x.data;
            var dt = dd.createdAt ? new Date(dd.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : 'N/A';
            h += '<tr><td><strong>' + dd.prenom + ' ' + dd.nom + '</strong> (@' + dd.username + ')</td><td>' + dd.email + '</td><td>' + dd.role + '</td><td>' + dt + '</td><td><button class="btn-add" style="padding:4px 10px;font-size:0.7rem;margin-right:5px;" onclick="approveUser(\'' + x.id + '\')"><i class="fas fa-check"></i> Accepter</button><button class="btn-delete" style="padding:4px 10px;font-size:0.7rem;" onclick="rejectUser(\'' + x.id + '\')"><i class="fas fa-times"></i> Refuser</button></td></tr>';
        });
        h += '</tbody></table></div>';
        d.innerHTML = h;
    });
}

async function approveUser(uid) {
    if (confirm('Accepter ?')) {
        await CacheDB.write('users', uid, { authorized: 'yes', approvedAt: firebase.firestore.FieldValue.serverTimestamp() }, 'update');
        alert('Accepté');
        loadPendingRegistrations();
        if (typeof loadUsersList === 'function') loadUsersList();
        CacheDB.sync();
    }
}

async function rejectUser(uid) {
    if (confirm('Refuser et supprimer ?')) {
        await CacheDB.write('users', uid, null, 'delete');
        alert('Supprimé');
        loadPendingRegistrations();
        if (typeof loadUsersList === 'function') loadUsersList();
        CacheDB.sync();
    }
}

// ==================== MODAL & CRUD ====================
function openModal(t, b) {
    document.getElementById('modalTitle').textContent = t;
    document.getElementById('modalBody').innerHTML = b;
    document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
    editingId = null;
    currentCollection = '';
}

function fileToBase64(f, cb) {
    if (!f) { cb(null); return; }
    var r = new FileReader();
    r.onload = function(e) { cb(e.target.result); };
    r.readAsDataURL(f);
}

function previewImage(inp, pid) {
    var p = document.getElementById(pid);
    if (!p) return;
    if (inp.files && inp.files[0]) {
        var r = new FileReader();
        r.onload = function(e) { p.innerHTML = '<img src="' + e.target.result + '" style="max-width:100px;margin-top:5px;border-radius:8px;">'; };
        r.readAsDataURL(inp.files[0]);
    }
}

async function saveDocument(cn, data, cb) {
    try {
        let resultId;
        if (editingId) {
            data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            resultId = await CacheDB.write(cn, editingId, data, 'update');
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            resultId = await CacheDB.write(cn, null, data, 'add');
        }
        if (cb) cb();
        refreshCurrentPage();
        CacheDB.sync();
    } catch (err) { alert('Erreur: ' + err.message); }
}

async function deleteDocument(cn, id) {
    if (confirm('Confirmer la suppression ?')) {
        await CacheDB.write(cn, id, null, 'delete');
        alert('Supprimé');
        refreshCurrentPage();
        CacheDB.sync();
    }
}

function refreshCurrentPage() {
    var t = document.getElementById('pageTitle').textContent;
    var m = { 'Catégories': 'categories', 'Produits': 'products', 'Clients': 'clients', 'Fournisseurs': 'fournisseurs', 'Dépenses': 'depenses', 'Ventes': 'ventes', 'Crédits': 'credits', 'Commandes en ligne': 'commandes' };
    navigateTo(m[t] || 'dashboard');
}

function editDocument(cn, id) {
    db.collection(cn).doc(id).get().then(function(doc) {
        if (doc.exists) { editingId = id; currentCollection = cn; openEditForm(cn, doc.data()); }
    });
}

function openEditForm(cn, data) {
    if (cn === 'categories') openCategoryForm(data);
    else if (cn === 'products') openProductForm(data);
    else if (cn === 'clients') openClientForm(data);
    else if (cn === 'fournisseurs') openFournisseurForm(data);
    else if (cn === 'depenses') openDepenseForm(data);
}

// ==================== TRI UNIVERSEL ====================
function sortTableData(tableName, field, loadFn) {
    if (!sortOrders[tableName]) sortOrders[tableName] = {};
    if (!sortOrders[tableName][field]) sortOrders[tableName][field] = 'asc';
    else sortOrders[tableName][field] = sortOrders[tableName][field] === 'asc' ? 'desc' : 'asc';
    Object.keys(sortOrders[tableName]).forEach(function(k) { if (k !== field) sortOrders[tableName][k] = null; });
    if (typeof loadFn === 'string') window[loadFn]();
    else if (typeof loadFn === 'function') loadFn();
}

function getSortIcon(tableName, field) {
    if (!sortOrders[tableName] || !sortOrders[tableName][field]) return '<i class="fas fa-sort" style="font-size:0.5rem;margin-left:2px;opacity:0.3;"></i>';
    return sortOrders[tableName][field] === 'asc' ? '<i class="fas fa-sort-up" style="font-size:0.55rem;margin-left:2px;color:#f39c12;"></i>' : '<i class="fas fa-sort-down" style="font-size:0.55rem;margin-left:2px;color:#f39c12;"></i>';
}

function applySort(tableName, data, defaultField) {
    if (!sortOrders[tableName]) sortOrders[tableName] = {};
    var activeField = Object.keys(sortOrders[tableName]).find(function(k) { return sortOrders[tableName][k]; });
    if (!activeField) activeField = defaultField;
    var order = sortOrders[tableName][activeField] || 'asc';
    return data.sort(function(a, b) {
        var va = a[activeField], vb = b[activeField];
        if (va === undefined || va === null) va = '';
        if (vb === undefined || vb === null) vb = '';
        if (typeof va === 'number' && typeof vb === 'number') return order === 'asc' ? va - vb : vb - va;
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
        if (order === 'asc') return va > vb ? 1 : (va < vb ? -1 : 0);
        else return va < vb ? 1 : (va > vb ? -1 : 0);
    });
}

function makeSortableHeader(tableName, field, label, loadFnName) {
    return '<th onclick="sortTableData(\'' + tableName + '\',\'' + field + '\', \'' + loadFnName + '\')" style="cursor:pointer;white-space:nowrap;">' + label + ' ' + getSortIcon(tableName, field) + '</th>';
}

// ==================== PAGINATION GENERIQUE ====================
function getPaginationHTML(tableName, totalItems) {
    var totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return '';
    var page = currentPages[tableName] || 1;
    var html = '<div style="display:flex; justify-content:center; align-items:center; gap:10px; margin-top:15px; flex-wrap:wrap;">';
    html += '<button onclick="changePage(\'' + tableName + '\', ' + (page-1) + ')" ' + (page <= 1 ? 'disabled' : '') + ' style="padding:8px 16px; border:1px solid #e2e8f0; border-radius:8px; background:white; cursor:pointer;">« Précédent</button>';
    html += '<span style="font-weight:600;">Page ' + page + ' / ' + totalPages + '</span>';
    html += '<button onclick="changePage(\'' + tableName + '\', ' + (page+1) + ')" ' + (page >= totalPages ? 'disabled' : '') + ' style="padding:8px 16px; border:1px solid #e2e8f0; border-radius:8px; background:white; cursor:pointer;">Suivant »</button>';
    html += '</div>';
    return html;
}

function changePage(tableName, newPage) {
    var totalPages = Math.ceil(getCurrentDataCount(tableName) / itemsPerPage);
    if (newPage < 1 || newPage > totalPages) return;
    currentPages[tableName] = newPage;
    // Déclencher le re-rendu de la table correspondante
    var renderFunctions = {
        categories: renderCategoriesTable,
        products: renderProductsTable,
        clients: renderClientsTable,
        fournisseurs: renderFournisseursTable,
        depenses: renderDepensesTable,
        commandes: renderCommandesTable,
        ventes: renderVentesTable,
        credits: renderCreditsTable
    };
    if (renderFunctions[tableName]) {
        // Réinitialiser le tri pour éviter de garder un ordre précédent (optionnel)
        // On peut simplement rappeler la fonction de rendu qui va utiliser la page mise à jour
        renderFunctions[tableName]();
    }
}

function getCurrentDataCount(tableName) {
    var dataArrays = {
        categories: allCategoriesData,
        products: allProductsData,
        clients: allClientsData,
        fournisseurs: allFournisseursData,
        depenses: allDepensesData,
        commandes: allCommandesData,
        ventes: allVentesData,
        credits: allCreditsData
    };
    return (dataArrays[tableName] || []).length;
}

function getPageData(tableName, dataArray) {
    var page = currentPages[tableName] || 1;
    var start = (page - 1) * itemsPerPage;
    return dataArray.slice(start, start + itemsPerPage);
}

// ==================== FILTRES DATE / RECHERCHE ====================
function getPeriodOptions(selected) {
    var periods = [
        {value:'all', text:'Toutes les dates'},
        {value:'1', text:'Aujourd\'hui'},
        {value:'3', text:'3 jours'},
        {value:'7', text:'7 jours'},
        {value:'15', text:'15 jours'},
        {value:'30', text:'1 mois'},
        {value:'90', text:'3 mois'},
        {value:'365', text:'1 an'}
    ];
    return periods.map(p => '<option value="'+p.value+'" '+ (selected==p.value?'selected':'') +'>'+p.text+'</option>').join('');
}

function filterByPeriod(data, period) {
    if (!period || period === 'all') return data;
    var now = Date.now();
    var days = parseInt(period);
    if (isNaN(days)) return data;
    var cutoff = now - days * 86400000;
    return data.filter(function(d) {
        if (!d.createdAt || !d.createdAt.seconds) return false;
        return d.createdAt.seconds * 1000 >= cutoff;
    });
}

function filterBySearch(data, query, fields) {
    if (!query) return data;
    var q = query.toLowerCase().trim();
    return data.filter(function(d) {
        for (var i = 0; i < fields.length; i++) {
            var val = fields[i];
            if (val.startsWith('items.')) {
                var itemField = val.split('.')[1];
                if (d.items && Array.isArray(d.items)) {
                    for (var j = 0; j < d.items.length; j++) {
                        var it = d.items[j];
                        if (it[itemField] && String(it[itemField]).toLowerCase().indexOf(q) !== -1) return true;
                    }
                }
            } else {
                var fieldVal = d[val];
                if (fieldVal && String(fieldVal).toLowerCase().indexOf(q) !== -1) return true;
            }
        }
        return false;
    });
}

// ==================== CATÉGORIES ====================
function loadCategoriesPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-layer-group"></i> Catégories</h3><button class="btn-add" onclick="openCategoryForm()"><i class="fas fa-plus"></i> Nouvelle</button></div><div class="table-container"><table class="data-table" id="categoriesTable"><thead><tr><th>Image</th>' + makeSortableHeader('categories', 'nom', 'Nom', 'loadCategories') + makeSortableHeader('categories', 'description', 'Description', 'loadCategories') + makeSortableHeader('categories', 'ca', 'CA', 'loadCategories') + makeSortableHeader('categories', 'profit', 'Profit', 'loadCategories') + '<th>Nb Produits</th><th>Actions</th></tr></thead><tbody></tbody></table></div><div id="categoriesPagination"></div></div>';
    loadCategories();
}

async function loadCategories() {
    var tb = document.querySelector('#categoriesTable tbody');
    if (!tb) return;
    try {
        const cached = await CacheDB.getAll('categories');
        if (cached.length) allCategoriesData = cached;
        const snapshot = await db.collection('categories').get();
        allCategoriesData = [];
        snapshot.forEach(d => { allCategoriesData.push({ id: d.id, ...d.data() }); });
        for (let doc of allCategoriesData) await CacheDB.set('categories', doc.id, doc);
    } catch(e) { console.error(e); }
    currentPages.categories = 1;
    renderCategoriesTable();
}

async function renderCategoriesTable() {
    var tb = document.querySelector('#categoriesTable tbody');
    if (!tb) return;
    var data = applySort('categories', allCategoriesData.slice(), 'nom');
    var pageData = getPageData('categories', data);
    tb.innerHTML = '';
    if (pageData.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;">Aucune catégorie</td></tr>';
        document.getElementById('categoriesPagination').innerHTML = '';
        return;
    }
    for (var i = 0; i < pageData.length; i++) {
        var d = pageData[i];
        var pc = 0;
        try { var ps = await db.collection('products').where('categorie', '==', d.nom).get(); pc = ps.size; } catch(e){}
        var im = d.imageBase64 ? '<img src="' + d.imageBase64 + '" style="width:35px;height:35px;object-fit:cover;border-radius:6px;">' : '<i class="fas fa-folder fa-2x" style="color:#f39c12;"></i>';
        var pcol = (d.profit || 0) >= 0 ? '#16a34a' : '#dc2626';
        tb.innerHTML += '<tr><td>' + im + '</td><td><strong>' + (d.nom||'') + '</strong></td><td>' + (d.description||'-') + '</td><td>' + (d.ca||0).toFixed(2)+' MAD</td><td style="color:'+pcol+';">'+(d.profit||0).toFixed(2)+' MAD</td><td>'+pc+'</td><td><button class="btn-edit" onclick="editDocument(\'categories\',\''+d.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'categories\',\''+d.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';
    }
    document.getElementById('categoriesPagination').innerHTML = getPaginationHTML('categories', data.length);
}

function openCategoryForm(data) {
    data = data || {};
    var h = '<div class="form-row"><div class="form-group"><label>Image</label><input type="file" id="catImage" onchange="previewImage(this,\'catPreview\')"><div id="catPreview">'+(data.imageBase64?'<img src="'+data.imageBase64+'" style="max-width:100px;">':'')+'</div></div></div><div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="catNom" value="'+(data.nom||'')+'" required></div><div class="form-group"><label>Description</label><textarea id="catDesc">'+(data.description||'')+'</textarea></div></div><div class="form-row"><div class="form-group"><label>CA</label><input type="number" id="catCA" value="'+(data.ca||0)+'" step="0.01"></div><div class="form-group"><label>Profit</label><input type="number" id="catProfit" value="'+(data.profit||0)+'" step="0.01"></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveCategory()">Enregistrer</button>';
    currentCollection = 'categories';
    openModal(editingId?'Modifier Catégorie':'Nouvelle Catégorie', h);
}

function saveCategory() {
    var n = document.getElementById('catNom').value;
    if (!n) { alert('Nom obligatoire'); return; }
    var f = document.getElementById('catImage').files[0];
    var sf = function(img) {
        var d = { nom: n, description: document.getElementById('catDesc').value, ca: parseFloat(document.getElementById('catCA').value)||0, profit: parseFloat(document.getElementById('catProfit').value)||0 };
        if (img) d.imageBase64 = img;
        saveDocument('categories', d, function() { closeModal(); refreshCurrentPage(); });
    };
    if (f) fileToBase64(f, sf); else sf(null);
}

// ==================== PRODUITS ====================
function loadProductsPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-utensils"></i> Produits</h3><div style="display:flex;gap:10px;flex-wrap:wrap;"><select id="categoryFilter" onchange="filterProducts()"><option value="">Toutes catégories</option></select><button class="btn-add" onclick="openProductForm()"><i class="fas fa-plus"></i> Nouveau</button></div></div><div class="table-container"><table class="data-table" id="productsTable" style="font-size:0.7rem;"><thead><tr><th>Img</th>'+makeSortableHeader('products','nom','Nom','loadProducts')+makeSortableHeader('products','categorie','Catégorie','loadProducts')+makeSortableHeader('products','prixAchat','Achat','loadProducts')+makeSortableHeader('products','prixVente','Vente','loadProducts')+makeSortableHeader('products','prixPromo','Promo','loadProducts')+makeSortableHeader('products','profit','Profit','loadProducts')+makeSortableHeader('products','stock','Stock','loadProducts')+makeSortableHeader('products','vendues','Vendues','loadProducts')+makeSortableHeader('products','ca','CA','loadProducts')+makeSortableHeader('products','disponible','Dispo','loadProducts')+'<th>Temps</th><th>Desc</th><th>Actions</th></tr></thead><tbody></tbody></table></div><div id="productsPagination"></div></div>';
    loadCategoriesInFilter(); loadProducts();
}

async function loadCategoriesInFilter() {
    var s = document.getElementById('categoryFilter');
    if (!s) return;
    try {
        var sn = await db.collection('categories').get();
        s.innerHTML = '<option value="">Toutes catégories</option>';
        sn.forEach(function(d) { s.innerHTML += '<option value="'+d.data().nom+'">'+d.data().nom+'</option>'; });
    } catch(e){}
}

function filterProducts() {
    selectedCategoryFilter = document.getElementById('categoryFilter').value;
    currentPages.products = 1;
    renderProductsTable();
}

async function loadProducts() {
    try {
        const cached = await CacheDB.getAll('products');
        if (cached.length) allProductsData = cached;
        const snapshot = await db.collection('products').get();
        allProductsData = [];
        snapshot.forEach(d => {
            let dd = d.data();
            dd.id = d.id;
            let prix = (dd.prixPromo && dd.prixPromo > 0) ? dd.prixPromo : (dd.prixVente||0);
            dd.profit = (prix - (dd.prixAchat||0));
            allProductsData.push(dd);
        });
        for (let doc of allProductsData) await CacheDB.set('products', doc.id, doc);
    } catch(e){ console.error(e); }
    currentPages.products = 1;
    renderProductsTable();
}

function renderProductsTable() {
    var tb = document.querySelector('#productsTable tbody');
    if (!tb) return;
    var data = allProductsData.slice();
    if (selectedCategoryFilter) data = data.filter(function(d) { return d.categorie === selectedCategoryFilter; });
    data = applySort('products', data, 'nom');
    var pageData = getPageData('products', data);
    tb.innerHTML = '';
    if (pageData.length === 0) {
        tb.innerHTML = '<tr><td colspan="14" style="text-align:center;padding:30px;">Aucun produit</td></tr>';
        document.getElementById('productsPagination').innerHTML = '';
        return;
    }
    for (var i = 0; i < pageData.length; i++) {
        var d = pageData[i];
        var im = d.imageBase64 ? '<img src="'+d.imageBase64+'" style="width:30px;height:30px;object-fit:cover;border-radius:4px;">' : '<i class="fas fa-utensils" style="color:#94a3b8;"></i>';
        var disp = d.disponible !== false ? '<span class="status-success">Oui</span>' : '<span class="status-danger">Non</span>';
        var profitVal = (d.profit !== undefined && !isNaN(d.profit)) ? d.profit : 0;
        var pc = profitVal >= 0 ? '#16a34a' : '#dc2626';
        tb.innerHTML += '<tr><td>'+im+'</td><td><strong>'+(d.nom||'')+'</strong></td><td>'+(d.categorie||'-')+'</td><td>'+((d.prixAchat||0).toFixed(2))+'</td><td>'+((d.prixVente||0).toFixed(2))+'</td><td>'+((d.prixPromo||0).toFixed(2))+'</td><td style="color:'+pc+';">'+profitVal.toFixed(2)+'</td><td>'+(d.stock||0)+'</td><td>'+(d.vendues||0)+'</td><td>'+((d.ca||0).toFixed(2))+'</td><td>'+disp+'</td><td>'+(d.tempsPrep||'-')+'</td><td>'+(d.description||'-')+'</td><td><button class="btn-edit" onclick="editDocument(\'products\',\''+d.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'products\',\''+d.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';
    }
    document.getElementById('productsPagination').innerHTML = getPaginationHTML('products', data.length);
}

// Les fonctions openProductForm, saveProduct restent identiques (copier du code précédent)

// ==================== CLIENTS ====================
function loadClientsPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-users"></i> Clients</h3><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;"><div class="input-group" style="width:300px;min-width:200px;margin-bottom:0;background:#fff;border:2px solid var(--border);border-radius:12px;"><i class="fas fa-search" style="color:#94a3b8;"></i><input type="text" id="clientSearchInput" placeholder="Rechercher..." onkeyup="clientSearch(this.value)" style="border:none;padding:12px;"></div><button class="btn-add" onclick="openClientForm()"><i class="fas fa-plus"></i> Ajouter</button></div></div><div class="table-container"><table class="data-table" id="clientsTable" style="font-size:0.6rem;"><thead><tr>'+makeSortableHeader('clients','id','ID','loadClients')+makeSortableHeader('clients','nom','Nom','loadClients')+makeSortableHeader('clients','prenom','Prénom','loadClients')+makeSortableHeader('clients','username','Username','loadClients')+makeSortableHeader('clients','genre','Genre','loadClients')+makeSortableHeader('clients','adresse','Adresse','loadClients')+makeSortableHeader('clients','email','Email','loadClients')+makeSortableHeader('clients','telephone','Tél','loadClients')+makeSortableHeader('clients','whatsapp','WhatsApp','loadClients')+makeSortableHeader('clients','facebook','Facebook','loadClients')+makeSortableHeader('clients','instagram','Instagram','loadClients')+makeSortableHeader('clients','ca','CA','loadClients')+makeSortableHeader('clients','profit','Profit','loadClients')+makeSortableHeader('clients','pointsFidelite','Points Fid','loadClients')+makeSortableHeader('clients','allergies','Allergies','loadClients')+makeSortableHeader('clients','aime','Aime','loadClients')+makeSortableHeader('clients','deteste','Déteste','loadClients')+makeSortableHeader('clients','createdAt','Date créé','loadClients')+'<th>Actions</th></tr></thead><tbody></tbody></table></div><div id="clientsPagination"></div></div>';
    loadClients();
}

function clientSearch(query) { clientSearchQuery = query.toLowerCase().trim(); currentPages.clients = 1; renderClientsTable(); }

async function loadClients() {
    try {
        const cached = await CacheDB.getAll('clients');
        if (cached.length) allClientsData = cached;
        const snapshot = await db.collection('clients').get();
        allClientsData = [];
        snapshot.forEach(d => { let dd = d.data(); dd.id = d.id; allClientsData.push(dd); });
        for (let doc of allClientsData) await CacheDB.set('clients', doc.id, doc);
    } catch(e){ console.error(e); }
    currentPages.clients = 1;
    renderClientsTable();
}

function renderClientsTable() {
    var tb = document.querySelector('#clientsTable tbody');
    if (!tb) return;
    var data = allClientsData.slice();
    if (clientSearchQuery) {
        data = data.filter(function(d) {
            return (d.nom||'').toLowerCase().indexOf(clientSearchQuery)!==-1 || (d.prenom||'').toLowerCase().indexOf(clientSearchQuery)!==-1 || (d.username||'').toLowerCase().indexOf(clientSearchQuery)!==-1 || (d.email||'').toLowerCase().indexOf(clientSearchQuery)!==-1 || (d.telephone||'').toLowerCase().indexOf(clientSearchQuery)!==-1;
        });
    }
    data = applySort('clients', data, 'nom');
    var pageData = getPageData('clients', data);
    tb.innerHTML = '';
    if (pageData.length === 0) {
        tb.innerHTML = '<tr><td colspan="19" style="text-align:center;padding:30px;">Aucun client</td></tr>';
        document.getElementById('clientsPagination').innerHTML = '';
        return;
    }
    for (var i = 0; i < pageData.length; i++) {
        var d = pageData[i];
        var dateCreated = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleDateString('fr-FR')+' '+new Date(d.createdAt.seconds*1000).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '-';
        var row = '<tr>';
        row += '<td><small>'+(d.id||'').substring(0,6)+'</small></td>';
        row += '<td><strong>'+(d.nom||'')+'</strong></td>';
        row += '<td>'+(d.prenom||'')+'</td>';
        row += '<td>@'+(d.username||'')+'</td>';
        row += '<td>'+(d.genre||'-')+'</td>';
        row += '<td><small>'+(d.adresse||'-')+'</small></td>';
        row += '<td><small>'+(d.email||'-')+'</small></td>';
        row += '<td>'+(d.telephone||'-')+'</td>';
        row += '<td>'+(d.whatsapp||'-')+'</td>';
        row += '<td>'+(d.facebook||'-')+'</td>';
        row += '<td>'+(d.instagram||'-')+'</td>';
        row += '<td style="color:#16a34a;font-weight:600;">'+(d.ca||0).toFixed(2)+'</td>';
        row += '<td style="color:#16a34a;">'+(d.profit||0).toFixed(2)+'</td>';
        row += '<td style="color:#f39c12;font-weight:600;">'+(d.pointsFidelite||0)+'</td>';
        row += '<td><small>'+(d.allergies?d.allergies.join(', '):'-')+'</small></td>';
        row += '<td><small>'+(d.aime?d.aime.join(', '):'-')+'</small></td>';
        row += '<td><small>'+(d.deteste?d.deteste.join(', '):'-')+'</small></td>';
        row += '<td><small>'+dateCreated+'</small></td>';
        row += '<td><button class="btn-edit" onclick="editClient(\''+d.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteClient(\''+d.id+'\')"><i class="fas fa-trash"></i></button></td>';
        row += '</tr>';
        tb.innerHTML += row;
    }
    document.getElementById('clientsPagination').innerHTML = getPaginationHTML('clients', data.length);
}

// Les fonctions openClientForm, saveClient, editClient, deleteClient restent identiques

// ==================== FOURNISSEURS ====================
function loadFournisseursPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-truck"></i> Fournisseurs</h3><button class="btn-add" onclick="openFournisseurForm()"><i class="fas fa-plus"></i> Ajouter</button></div><div class="table-container"><table class="data-table" id="fournisseursTable" style="font-size:0.6rem;"><thead><tr>'+makeSortableHeader('fournisseurs','id','ID','loadFournisseurs')+makeSortableHeader('fournisseurs','nom','Nom','loadFournisseurs')+makeSortableHeader('fournisseurs','prenom','Prénom','loadFournisseurs')+makeSortableHeader('fournisseurs','societe','Société','loadFournisseurs')+makeSortableHeader('fournisseurs','telephone','Tél','loadFournisseurs')+makeSortableHeader('fournisseurs','whatsapp','WhatsApp','loadFournisseurs')+makeSortableHeader('fournisseurs','email','Email','loadFournisseurs')+makeSortableHeader('fournisseurs','adresse','Adresse','loadFournisseurs')+makeSortableHeader('fournisseurs','description','Description','loadFournisseurs')+makeSortableHeader('fournisseurs','ca','CA','loadFournisseurs')+'<th>Catégories</th>'+makeSortableHeader('fournisseurs','createdAt','Date créé','loadFournisseurs')+'<th>Actions</th></tr></thead><tbody></tbody></table></div><div id="fournisseursPagination"></div></div>';
    loadFournisseurs();
}

async function loadFournisseurs() {
    try {
        const cached = await CacheDB.getAll('fournisseurs');
        if (cached.length) allFournisseursData = cached;
        const snapshot = await db.collection('fournisseurs').get();
        allFournisseursData = [];
        snapshot.forEach(d => { let dd = d.data(); dd.id = d.id; allFournisseursData.push(dd); });
        for (let doc of allFournisseursData) await CacheDB.set('fournisseurs', doc.id, doc);
    } catch(e){ console.error(e); }
    currentPages.fournisseurs = 1;
    renderFournisseursTable();
}

function renderFournisseursTable() {
    var tb = document.querySelector('#fournisseursTable tbody');
    if (!tb) return;
    var data = applySort('fournisseurs', allFournisseursData.slice(), 'nom');
    var pageData = getPageData('fournisseurs', data);
    tb.innerHTML = '';
    if (pageData.length === 0) {
        tb.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:30px;">Aucun fournisseur</td></tr>';
        document.getElementById('fournisseursPagination').innerHTML = '';
        return;
    }
    for (var i = 0; i < pageData.length; i++) {
        var d = pageData[i];
        var dateCreated = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleDateString('fr-FR')+' '+new Date(d.createdAt.seconds*1000).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '-';
        var categories = d.categories ? d.categories.join(', ') : '-';
        tb.innerHTML += '<tr><td><small>'+(d.id||'').substring(0,6)+'</small></td><td><strong>'+(d.nom||'')+'</strong></td><td>'+(d.prenom||'')+'</td><td>'+(d.societe||'-')+'</td><td>'+(d.telephone||'-')+'</td><td>'+(d.whatsapp||'-')+'</td><td><small>'+(d.email||'-')+'</small></td><td><small>'+(d.adresse||'-')+'</small></td><td><small>'+(d.description||'-')+'</small></td><td>'+(d.ca||0).toFixed(2)+' MAD</td><td><small>'+categories+'</small></td><td><small>'+dateCreated+'</small></td><td><button class="btn-edit" onclick="editFournisseur(\''+d.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteFournisseur(\''+d.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';
    }
    document.getElementById('fournisseursPagination').innerHTML = getPaginationHTML('fournisseurs', data.length);
}

// Fonctions openFournisseurForm, saveFournisseur, editFournisseur, deleteFournisseur (inchangées)

// ==================== DÉPENSES ====================
function loadDepensesPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-money-bill-wave"></i> Dépenses</h3><button class="btn-add" onclick="openDepenseForm()"><i class="fas fa-plus"></i> Nouvelle</button></div><div class="table-container"><table class="data-table" id="depensesTable" style="font-size:0.65rem;"><thead><tr>'+makeSortableHeader('depenses','id','ID','loadDepenses')+makeSortableHeader('depenses','titre','Titre','loadDepenses')+'<th>Catégorie</th>'+makeSortableHeader('depenses','montant','Montant','loadDepenses')+makeSortableHeader('depenses','description','Description','loadDepenses')+makeSortableHeader('depenses','createdAt','Date','loadDepenses')+'<th>Actions</th></tr></thead><tbody></tbody></table></div><div id="depensesPagination"></div></div>';
    loadDepenses();
}

async function loadDepenses() {
    try {
        const cached = await CacheDB.getAll('depenses');
        if (cached.length) allDepensesData = cached;
        const snapshot = await db.collection('depenses').get();
        allDepensesData = [];
        snapshot.forEach(d => { let dd = d.data(); dd.id = d.id; allDepensesData.push(dd); });
        for (let doc of allDepensesData) await CacheDB.set('depenses', doc.id, doc);
    } catch(e){ console.error(e); }
    currentPages.depenses = 1;
    renderDepensesTable();
}

function renderDepensesTable() {
    var tb = document.querySelector('#depensesTable tbody');
    if (!tb) return;
    var data = applySort('depenses', allDepensesData.slice(), 'createdAt');
    var pageData = getPageData('depenses', data);
    tb.innerHTML = '';
    if (pageData.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;">Aucune dépense</td></tr>';
        document.getElementById('depensesPagination').innerHTML = '';
        return;
    }
    for (var i = 0; i < pageData.length; i++) {
        var d = pageData[i];
        var dateCreated = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleDateString('fr-FR')+' '+new Date(d.createdAt.seconds*1000).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '-';
        var categories = d.categories ? d.categories.join(', ') : '-';
        tb.innerHTML += '<tr><td><small>'+(d.id||'').substring(0,6)+'</small></td><td><strong>'+(d.titre||d.description||'-')+'</strong></td><td><small>'+categories+'</small></td><td style="color:#ef4444;font-weight:700;">'+(d.montant||0).toFixed(2)+' MAD</td><td><small>'+(d.description||'-')+'</small></td><td><small>'+dateCreated+'</small></td><td><button class="btn-edit" onclick="editDepense(\''+d.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDepense(\''+d.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';
    }
    document.getElementById('depensesPagination').innerHTML = getPaginationHTML('depenses', data.length);
}

// openDepenseForm, saveDepense, editDepense, deleteDepense inchangées

// ==================== COMMANDES EN LIGNE ====================
function loadCommandesPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-shopping-basket"></i> Commandes en ligne</h3><div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">'+
        '<input type="text" id="commandesSearchInput" placeholder="🔍 Rechercher (client, email, tél, produit)..." style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px; width:250px;" onkeyup="commandesSearch = this.value; currentPages.commandes=1; applyCommandesFilters();">'+
        '<select id="commandesPeriodSelect" style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px;" onchange="commandesPeriod = this.value; currentPages.commandes=1; applyCommandesFilters();">'+getPeriodOptions('all')+'</select>'+
        '<button class="btn-add" onclick="loadCommandes()"><i class="fas fa-sync"></i> Actualiser</button>'+
    '</div></div><div id="commandesTableContainer"></div><div id="commandesPagination" style="margin-top:10px;"></div></div>';
    loadCommandes();
}

async function loadCommandes() {
    try {
        const snapshot = await db.collection('commandes').orderBy('createdAt','desc').limit(500).get();
        allCommandesData = [];
        snapshot.forEach(dc => { var d = dc.data(); d.id = dc.id; allCommandesData.push(d); });
    } catch(e){ console.error(e); }
    currentPages.commandes = 1;
    applyCommandesFilters();
}

function applyCommandesFilters() {
    var filtered = filterByPeriod(allCommandesData, commandesPeriod);
    filtered = filterBySearch(filtered, commandesSearch, ['clientName','clientEmail','clientTelephone','items.nom']);
    allCommandesData = filtered; // Temporaire, on stocke le résultat filtré dans une variable séparée pour pagination
    // On va stocker le résultat filtré dans une variable dédiée
    window.filteredCommandes = filtered;
    renderCommandesTable();
}

function renderCommandesTable() {
    var cont = document.getElementById('commandesTableContainer');
    if (!cont) return;
    var data = applySort('commandes', (window.filteredCommandes || allCommandesData).slice(), 'createdAt');
    var pageData = getPageData('commandes', data);
    if (pageData.length === 0) {
        cont.innerHTML = '<p style="text-align:center;padding:40px;">Aucune commande trouvée</p>';
        document.getElementById('commandesPagination').innerHTML = '';
        return;
    }
    var h = '<div class="table-container"><table class="data-table" style="font-size:0.65rem;"><thead><tr>'+
        makeSortableHeader('commandes','createdAt','Date','renderCommandesTable')+
        makeSortableHeader('commandes','clientName','Client','renderCommandesTable')+
        makeSortableHeader('commandes','clientEmail','Email','renderCommandesTable')+
        makeSortableHeader('commandes','clientTelephone','Tél','renderCommandesTable')+
        '<th>Articles</th><th>Options</th>'+makeSortableHeader('commandes','total','Total','renderCommandesTable')+
        makeSortableHeader('commandes','statut','Statut','renderCommandesTable')+'<th>Actions</th></tr></thead><tbody>';

    pageData.forEach(function(d) {
        var dt = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleString('fr-FR') : '';
        var arts = d.items ? d.items.map(function(it){ return '<strong>'+it.quantite+'x</strong> '+it.nom; }).join('<br>') : '';
        var opts = d.items ? d.items.map(function(it){
            var o = [];
            if(it.sauces && it.sauces.length) o.push('<span style="color:#f39c12;">🥫'+it.sauces.join(',')+'</span>');
            if(it.interdits && it.interdits.length) o.push('<span style="color:#ef4444;">🚫'+it.interdits.join(',')+'</span>');
            if(it.epice && it.epice!=='Normal') o.push('<span style="color:#d97706;">🌶️'+it.epice+'</span>');
            if(it.sel && it.sel!=='Normal') o.push('<span style="color:#4f46e5;">🧂'+it.sel+'</span>');
            return o.length ? o.join(' | ') : '-';
        }).join('<br>') : '-';
        var sc = d.statut==='payé'?'#4f46e5':d.statut==='valide'?'#16a34a':'#d97706';
        var sl = d.statut==='payé'?'💵 Payée':d.statut==='valide'?'✅ Validée':'⏳ En attente';
        var act = '';
        if(d.statut==='en_attente'){
            act = '<button class="btn-add" style="padding:4px 6px;font-size:0.65rem;margin-right:2px;" onclick="validateCommande(\''+d.id+'\')"><i class="fas fa-check"></i> Valider</button>';
            act += '<button class="btn-save" style="padding:4px 6px;font-size:0.65rem;margin-right:2px;" onclick="payCommande(\''+d.id+'\')"><i class="fas fa-money-bill-wave"></i> Payer</button>';
            act += '<button class="btn-delete" style="padding:4px 6px;font-size:0.65rem;" onclick="cancelCommande(\''+d.id+'\')"><i class="fas fa-times"></i> Annuler</button>';
        } else if(d.statut==='valide'){
            act = '<button class="btn-save" style="padding:4px 6px;font-size:0.65rem;" onclick="payCommande(\''+d.id+'\')"><i class="fas fa-money-bill-wave"></i> Payer</button>';
        } else {
            act = '<small style="color:#4f46e5;">Payée</small>';
        }
        h += '<tr><td>'+dt+'</td><td><strong>'+(d.clientName||'')+'</strong></td><td>'+(d.clientEmail||'-')+'</td><td>'+(d.clientTelephone||'-')+'</td><td>'+arts+'</td><td>'+opts+'</td><td><strong>'+d.total.toFixed(2)+' MAD</strong></td><td><span style="color:'+sc+';">'+sl+'</span></td><td>'+act+'</td></tr>';
    });
    h += '</tbody></table></div>';
    cont.innerHTML = h;
    document.getElementById('commandesPagination').innerHTML = getPaginationHTML('commandes', data.length);
}

// Fonctions validateCommande, payCommande, cancelCommande (inchangées)

// ==================== VENTES (avec filtre, recherche, pagination) ====================
function loadVentesPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-shopping-cart"></i> Ventes</h3><div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">'+
        '<input type="text" id="ventesSearchInput" placeholder="🔍 Rechercher (client, produit)..." style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px; width:250px;" onkeyup="ventesSearch = this.value; currentPages.ventes=1; applyVentesFilters();">'+
        '<select id="ventesPeriodSelect" style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px;" onchange="ventesPeriod = this.value; currentPages.ventes=1; applyVentesFilters();">'+getPeriodOptions('all')+'</select>'+
        '<button class="btn-add" onclick="loadVentes()"><i class="fas fa-sync"></i> Actualiser</button>'+
    '</div></div><div id="ventesTableContainer"></div><div id="ventesPagination" style="margin-top:10px;"></div></div>';
    loadVentes();
}

async function loadVentes() {
    var isAdmin = window.currentUserData && window.currentUserData.userData.role === 'admin';
    var vendeurCaissier = '';
    if (!isAdmin && window.currentUserData) vendeurCaissier = window.currentUserData.userData.prenom+' '+window.currentUserData.userData.nom;
    try {
        const snapshot = await db.collection('ventes').orderBy('createdAt','desc').limit(1000).get();
        allVentesData = [];
        snapshot.forEach(dc => {
            var d = dc.data(); d.id = dc.id;
            var achat = 0, profit = 0;
            if(d.items) {
                d.items.forEach(function(it){
                    var pa = it.prixAchat||0, pv = it.prixVente||0, pp = it.prixPromo||0, pvr = (pp>0)?pp:pv, q = it.quantite||1;
                    achat += pa*q; profit += (pvr-pa)*q;
                });
            }
            d.achat = achat; d.profit = profit;
            allVentesData.push(d);
        });
        if (!isAdmin) allVentesData = allVentesData.filter(function(d){ return d.vendeur === vendeurCaissier; });
    } catch(e){ console.error(e); }
    currentPages.ventes = 1;
    applyVentesFilters();
}

function applyVentesFilters() {
    var filtered = filterByPeriod(allVentesData, ventesPeriod);
    filtered = filterBySearch(filtered, ventesSearch, ['clientName','items.nom']);
    window.filteredVentes = filtered;
    renderVentesTable();
}

function renderVentesTable() {
    var cont = document.getElementById('ventesTableContainer');
    if (!cont) return;
    var isAdmin = window.currentUserData && window.currentUserData.userData.role === 'admin';
    var data = applySort('ventes', (window.filteredVentes || allVentesData).slice(), 'createdAt');
    var pageData = getPageData('ventes', data);
    if (pageData.length === 0) {
        cont.innerHTML = '<p style="text-align:center;padding:40px;">Aucune vente trouvée</p>';
        document.getElementById('ventesPagination').innerHTML = '';
        return;
    }
    var tv = 0;
    var h = '<div class="table-container"><table class="data-table" style="font-size:0.55rem;"><thead><tr>'+
        makeSortableHeader('ventes','factureNum','Facture','renderVentesTable')+
        makeSortableHeader('ventes','createdAt','Date','renderVentesTable')+
        makeSortableHeader('ventes','clientName','Client/Table','renderVentesTable')+
        '<th>Articles</th><th>Options</th>'+
        (isAdmin ? makeSortableHeader('ventes','achat','Achat','renderVentesTable')+makeSortableHeader('ventes','profit','Profit','renderVentesTable') : '')+
        makeSortableHeader('ventes','total','Total','renderVentesTable')+
        makeSortableHeader('ventes','discountMAD','Remise','renderVentesTable')+
        makeSortableHeader('ventes','amountGiven','Donné','renderVentesTable')+
        makeSortableHeader('ventes','change','Rendu','renderVentesTable')+
        makeSortableHeader('ventes','vendeur','Vendeur','renderVentesTable')+
        makeSortableHeader('ventes','paymentMethod','Paiement','renderVentesTable')+
        makeSortableHeader('ventes','statutPaiement','Statut','renderVentesTable')+
        '<th>Actions</th></tr></thead><tbody>';

    pageData.forEach(function(d){
        var dt = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleString('fr-FR') : '';
        var cl = d.clientName || d.table || '-';
        var arts = d.items ? d.items.map(function(it){ return '<strong>'+it.quantite+'x</strong> '+it.nom; }).join('<br>') : '-';
        var opts = d.items ? d.items.map(function(it){
            var o = [];
            if(it.sauces && it.sauces.length) o.push('<span style="color:#f39c12;">🥫'+it.sauces.join(',')+'</span>');
            if(it.interdits && it.interdits.length) o.push('<span style="color:#ef4444;">🚫'+it.interdits.join(',')+'</span>');
            if(it.epice && it.epice!=='Normal') o.push('<span style="color:#d97706;">🌶️'+it.epice+'</span>');
            if(it.sel && it.sel!=='Normal') o.push('<span style="color:#4f46e5;">🧂'+it.sel+'</span>');
            return o.length ? o.join(' | ') : '-';
        }).join('<br>') : '-';
        tv += d.total || 0;
        var amountGiven = d.amountGiven || 0;
        var change = d.change || 0;
        var statutLabel = d.statutPaiement || (d.paid?'payé':'impayé');
        var statutColor = statutLabel==='payé'?'#16a34a':statutLabel==='crédit'?'#f39c12':statutLabel==='partiel'?'#d97706':'#ef4444';
        var actions = '<button class="btn-edit" onclick="printFacture(\''+d.id+'\')"><i class="fas fa-print"></i></button> ';
        if(!d.paid) actions += '<button class="btn-add" style="padding:4px 6px;font-size:0.65rem;" onclick="payerVente(\''+d.id+'\')"><i class="fas fa-check"></i> Payer</button> ';
        if(isAdmin){ actions += '<button class="btn-edit" onclick="editVente(\''+d.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteVente(\''+d.id+'\')"><i class="fas fa-trash"></i></button>'; }
        h += '<tr><td><strong>'+(d.factureNum||d.id.substring(0,8))+'</strong></td><td>'+dt+'</td><td>'+cl+'</td><td>'+arts+'</td><td>'+opts+'</td>'+(isAdmin?'<td>'+d.achat.toFixed(2)+'</td><td style="color:#16a34a;">'+d.profit.toFixed(2)+'</td>':'')+'<td><strong>'+(d.total||0).toFixed(2)+'</strong></td><td>'+(d.discountMAD||0).toFixed(2)+'</td><td>'+amountGiven.toFixed(2)+'</td><td>'+change.toFixed(2)+'</td><td>'+(d.vendeur||'-')+'</td><td>'+(d.paymentMethod||'-')+'</td><td><span style="color:'+statutColor+';font-weight:600;">'+statutLabel+'</span></td><td>'+actions+'</td></tr>';
    });
    h += '</tbody></table></div>';
    h += '<div style="margin-top:15px;padding:15px;background:#f0fdf4;border-radius:12px;text-align:center;"><strong>Total: '+tv.toFixed(2)+' MAD</strong></div>';
    cont.innerHTML = h;
    document.getElementById('ventesPagination').innerHTML = getPaginationHTML('ventes', data.length);
}

// Fonctions editVente, saveEditVente, deleteVente, payerVente, printFacture, imprimerFacture (inchangées)

// ==================== CRÉDITS (avec filtre, recherche, pagination) ====================
function loadCreditsPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-credit-card"></i> Crédits</h3><div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">'+
        '<input type="text" id="creditsSearchInput" placeholder="🔍 Rechercher (client)..." style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px; width:250px;" onkeyup="creditsSearch = this.value; currentPages.credits=1; applyCreditsFilters();">'+
        '<select id="creditsPeriodSelect" style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px;" onchange="creditsPeriod = this.value; currentPages.credits=1; applyCreditsFilters();">'+getPeriodOptions('all')+'</select>'+
        '<button class="btn-add" onclick="loadCredits()"><i class="fas fa-sync"></i> Actualiser</button>'+
    '</div></div><div id="creditsTableContainer"></div><div id="creditsPagination" style="margin-top:10px;"></div></div>';
    loadCredits();
}

async function loadCredits() {
    var isAdmin = window.currentUserData && window.currentUserData.userData.role === 'admin';
    var vendeurCaissier = '';
    if (!isAdmin && window.currentUserData) vendeurCaissier = window.currentUserData.userData.prenom+' '+window.currentUserData.userData.nom;
    try {
        const snapshot = await db.collection('credits').orderBy('createdAt','desc').limit(1000).get();
        allCreditsData = [];
        snapshot.forEach(dc => { var d = dc.data(); d.id = dc.id; allCreditsData.push(d); });
        if (!isAdmin) allCreditsData = allCreditsData.filter(function(d){ return d.vendeur === vendeurCaissier; });
    } catch(e){ console.error(e); }
    currentPages.credits = 1;
    applyCreditsFilters();
}

function applyCreditsFilters() {
    var filtered = filterByPeriod(allCreditsData, creditsPeriod);
    filtered = filterBySearch(filtered, creditsSearch, ['clientName']);
    window.filteredCredits = filtered;
    renderCreditsTable();
}

function renderCreditsTable() {
    var cont = document.getElementById('creditsTableContainer');
    if (!cont) return;
    var data = applySort('credits', (window.filteredCredits || allCreditsData).slice(), 'createdAt');
    var pageData = getPageData('credits', data);
    if (pageData.length === 0) {
        cont.innerHTML = '<p style="text-align:center;padding:40px;">Aucun crédit trouvé</p>';
        document.getElementById('creditsPagination').innerHTML = '';
        return;
    }
    var tc = 0;
    var h = '<div class="table-container"><table class="data-table" style="font-size:0.55rem;"><thead><tr>'+
        makeSortableHeader('credits','factureNum','Facture','renderCreditsTable')+
        makeSortableHeader('credits','createdAt','Date','renderCreditsTable')+
        makeSortableHeader('credits','clientName','Client','renderCreditsTable')+
        makeSortableHeader('credits','total','Total','renderCreditsTable')+
        makeSortableHeader('credits','amountGiven','Payé','renderCreditsTable')+
        makeSortableHeader('credits','remainingAmount','Restant','renderCreditsTable')+
        makeSortableHeader('credits','paymentMethod','Mode','renderCreditsTable')+
        makeSortableHeader('credits','vendeur','Vendeur','renderCreditsTable')+
        '<th>Actions</th></tr></thead><tbody>';

    pageData.forEach(function(d){
        var reste = d.remainingAmount || d.total || 0;
        if (!d.paid) tc += reste;
        var dt = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleString('fr-FR') : '';
        var amountPaid = d.amountGiven || 0;
        var mode = d.paymentMethod || '-';
        var actions = '<button class="btn-edit" onclick="printFacture(\''+d.id+'\')"><i class="fas fa-print"></i></button> ';
        if (!d.paid) actions += '<button class="btn-add" style="padding:4px 8px;font-size:0.65rem;" onclick="markCreditPaid(\''+d.id+'\')">Payer</button> ';
        var isAdmin = window.currentUserData && window.currentUserData.userData.role === 'admin';
        if (isAdmin) {
            actions += '<button class="btn-edit" onclick="editCredit(\''+d.id+'\')"><i class="fas fa-edit"></i></button> ';
            actions += '<button class="btn-delete" onclick="deleteCredit(\''+d.id+'\')"><i class="fas fa-trash"></i></button>';
        }
        h += '<tr><td>'+(d.factureNum||d.id.substring(0,8))+'</td><td>'+dt+'</td><td>'+(d.clientName||d.table||'-')+'</td><td>'+d.total.toFixed(2)+'</td><td>'+amountPaid.toFixed(2)+'</td><td style="color:#ef4444;"><strong>'+reste.toFixed(2)+'</strong></td><td>'+mode+'</td><td>'+(d.vendeur||'-')+'</td><td>'+actions+'</td></tr>';
    });
    h += '</tbody></table></div><div style="margin-top:15px;padding:15px;background:#fef2f2;border-radius:12px;text-align:center;"><strong>Impayés: '+tc.toFixed(2)+' MAD</strong></div>';
    cont.innerHTML = h;
    document.getElementById('creditsPagination').innerHTML = getPaginationHTML('credits', data.length);
}

// Fonctions editCredit, saveEditCredit, deleteCredit, markCreditPaid (inchangées)

// ==================== OPTIONS (inchangé) ====================
function loadOptionsPage(c) {
    if (!window.currentUserData || window.currentUserData.userData.role !== 'admin') { c.innerHTML = '<p>Accès refusé</p>'; return; }
    c.innerHTML = '<div class="stats-grid"><div class="stat-card"><div class="stat-icon" style="background:#fef3c7;"><i class="fas fa-clock" style="color:#d97706;"></i></div><div class="stat-info"><span>En attente</span><span class="stat-value" id="pendingCount">0</span></div></div><div class="stat-card"><div class="stat-icon" style="background:#dcfce7;"><i class="fas fa-check-circle" style="color:#16a34a;"></i></div><div class="stat-info"><span>Autorisés</span><span class="stat-value" id="authorizedCount">0</span></div></div><div class="stat-card"><div class="stat-icon" style="background:#e0e7ff;"><i class="fas fa-users" style="color:#4f46e5;"></i></div><div class="stat-info"><span>Total</span><span class="stat-value" id="totalUsers">0</span></div></div></div><div class="content-card"><div class="card-header"><h3>Utilisateurs</h3><button class="btn-add" onclick="loadUsersList()">Actualiser</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Username</th><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="usersTableBody"></tbody></table></div></div>';
    loadUsersList();
}

function loadUsersList() {
    db.collection('users').get().then(function(sn) {
        var p = 0, a = 0; var tb = document.getElementById('usersTableBody'); tb.innerHTML = '';
        if (sn.empty) { tb.innerHTML = '<tr><td colspan="6">Aucun</td></tr>'; }
        var us = []; sn.forEach(function(dc) { us.push({ id: dc.id, data: dc.data() }); });
        us.sort(function(x, y) { return (y.data.createdAt?.seconds || 0) - (x.data.createdAt?.seconds || 0); });
        us.forEach(function(u) {
            var d = u.data, id = u.id;
            if (d.authorized === 'no') p++; else a++;
            var badge = d.authorized === 'yes' ? '<span class="status-success">OK</span>' : '<span class="status-warning">En attente</span>';
            var act = d.authorized === 'no' ? '<button class="btn-add" style="padding:4px 8px;font-size:0.7rem;margin-right:5px;" onclick="approveUser(\'' + id + '\')">Accepter</button><button class="btn-delete" style="padding:4px 8px;font-size:0.7rem;" onclick="rejectUser(\'' + id + '\')">Refuser</button>' : '<button style="padding:4px 8px;font-size:0.7rem;margin-right:5px;color:#d97706;border:none;background:#fef3c7;border-radius:6px;cursor:pointer;" onclick="blockUser(\'' + id + '\')">Bloquer</button><button class="btn-delete" style="padding:4px 8px;font-size:0.7rem;" onclick="deleteUserPermanently(\'' + id + '\')">Supprimer</button>';
            tb.innerHTML += '<tr><td>@' + d.username + '</td><td>' + d.prenom + ' ' + d.nom + '</td><td>' + d.email + '</td><td>' + d.role + '</td><td>' + badge + '</td><td>' + act + '</td></tr>';
        });
        document.getElementById('pendingCount').textContent = p;
        document.getElementById('authorizedCount').textContent = a;
        document.getElementById('totalUsers').textContent = sn.size;
    });
}

function blockUser(uid) {
    if (confirm('Bloquer ?')) {
        CacheDB.write('users', uid, { authorized: 'no' }, 'update').then(function() { loadUsersList(); loadPendingRegistrations(); CacheDB.sync(); });
    }
}

function deleteUserPermanently(uid) {
    if (confirm('Supprimer ?')) {
        CacheDB.write('users', uid, null, 'delete').then(function() { loadUsersList(); loadPendingRegistrations(); CacheDB.sync(); });
    }
}

console.log('Admin JS complet avec pagination, tri et filtres OK');
