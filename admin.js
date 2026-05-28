// ==================== ADMIN.JS AVEC CACHE OFFLINE & TRI + FILTRES ====================
var editingId = null;
var currentCollection = '';
var selectedCategoryFilter = '';
var sortOrders = {};
var clientSearchQuery = '';

// Données triables + filtrables
var allCommandesData = [];   // données brutes
var commandesData = [];      // données filtrées/triées
var allVentesData = [];
var ventesData = [];
var allCreditsData = [];
var creditsData = [];

// Filtres actifs pour chaque liste
var ventesPeriod = 'all';
var ventesSearch = '';
var creditsPeriod = 'all';
var creditsSearch = '';
var commandesPeriod = 'all';
var commandesSearch = '';

// Listes pour les catégories (fournisseurs et dépenses)
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

// ==================== MODAL & CRUD (avec offline) ====================
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
    } catch (err) {
        alert('Erreur: ' + err.message);
    }
}

async function deleteDocument(cn, id) {
    if (confirm('Confirmer la suppression ?')) {
        await CacheDB.write(cn, id, null, 'delete');
        alert('Supprimé (synchronisé si en ligne)');
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
        if (doc.exists) {
            editingId = id;
            currentCollection = cn;
            openEditForm(cn, doc.data());
        }
    });
}

function openEditForm(cn, data) {
    if (cn === 'categories') openCategoryForm(data);
    else if (cn === 'products') openProductForm(data);
    else if (cn === 'clients') openClientForm(data);
    else if (cn === 'fournisseurs') openFournisseurForm(data);
    else if (cn === 'depenses') openDepenseForm(data);
}

// ==================== SYSTÈME DE TRI UNIVERSEL ====================
function sortTableData(tableName, field, loadFn) {
    if (!sortOrders[tableName]) sortOrders[tableName] = {};
    if (!sortOrders[tableName][field]) sortOrders[tableName][field] = 'asc';
    else sortOrders[tableName][field] = sortOrders[tableName][field] === 'asc' ? 'desc' : 'asc';
    Object.keys(sortOrders[tableName]).forEach(function(k) { if (k !== field) sortOrders[tableName][k] = null; });
    if (typeof loadFn === 'string') window[loadFn]();
    else if (typeof loadFn === 'function') loadFn();
}

function getSortIcon(tableName, field) {
    if (!sortOrders[tableName] || !sortOrders[tableName][field]) return '<i class="fas fa-sort" style="font-size:0.5rem;margin-left:2px;opacity:0.3;cursor:pointer;"></i>';
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

// ==================== FILTRES DATE ET RECHERCHE ====================
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
    var cutoff = now - days * 86400000; // ms
    return data.filter(function(d) {
        if (!d.createdAt || !d.createdAt.seconds) return false;
        var docTime = d.createdAt.seconds * 1000;
        return docTime >= cutoff;
    });
}

function filterBySearch(data, query, fields) {
    if (!query) return data;
    var q = query.toLowerCase().trim();
    return data.filter(function(d) {
        for (var i = 0; i < fields.length; i++) {
            var val = fields[i];
            // val peut être un chemin "items.nom" -> on regarde dans les items
            if (val.startsWith('items.')) {
                var itemField = val.split('.')[1]; // nom
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

// ==================== CATÉGORIES, PRODUITS, CLIENTS, FOURNISSEURS, DÉPENSES (inchangés) ====================
// ... (coller ici tout le code existant pour ces sections, je les omets pour ne pas surcharger, mais dans le fichier complet ils sont présents)
// Les fonctions pour catégories, produits, clients, fournisseurs, dépenses sont identiques à la version précédente avec tri.

// ==================== COMMANDES EN LIGNE (avec filtre et recherche) ====================
function loadCommandesPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-shopping-basket"></i> Commandes en ligne</h3>' +
        '<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">' +
        '<input type="text" id="commandesSearchInput" placeholder="🔍 Rechercher (client, email, tél, produit)..." style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px; width:250px;" onkeyup="commandesSearch = this.value; applyCommandesFilters();">' +
        '<select id="commandesPeriodSelect" style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px;" onchange="commandesPeriod = this.value; applyCommandesFilters();">' + getPeriodOptions('all') + '</select>' +
        '<button class="btn-add" onclick="loadCommandes()"><i class="fas fa-sync"></i> Actualiser</button>' +
        '</div></div><div id="commandesTableContainer"></div></div>';
    loadCommandes();
}

async function loadCommandes() {
    var cont = document.getElementById('commandesTableContainer');
    if (!cont) return;
    try {
        const snapshot = await db.collection('commandes').orderBy('createdAt', 'desc').limit(200).get();
        allCommandesData = [];
        snapshot.forEach(dc => {
            var d = dc.data();
            d.id = dc.id;
            allCommandesData.push(d);
        });
    } catch (e) { console.error(e); }
    applyCommandesFilters();
}

function applyCommandesFilters() {
    // Filtre période
    var filtered = filterByPeriod(allCommandesData, commandesPeriod);
    // Recherche
    filtered = filterBySearch(filtered, commandesSearch, ['clientName', 'clientEmail', 'clientTelephone', 'items.nom']);
    commandesData = filtered;
    renderCommandesTable();
}

function renderCommandesTable() {
    var cont = document.getElementById('commandesTableContainer');
    if (!cont) return;
    if (commandesData.length === 0) {
        cont.innerHTML = '<p style="text-align:center;padding:40px;">Aucune commande trouvée</p>';
        return;
    }
    var data = applySort('commandes', commandesData, 'createdAt');
    var h = '<div class="table-container"><table class="data-table" style="font-size:0.65rem;"><thead><tr>' +
        makeSortableHeader('commandes', 'createdAt', 'Date', 'renderCommandesTable') +
        makeSortableHeader('commandes', 'clientName', 'Client', 'renderCommandesTable') +
        makeSortableHeader('commandes', 'clientEmail', 'Email', 'renderCommandesTable') +
        makeSortableHeader('commandes', 'clientTelephone', 'Tél', 'renderCommandesTable') +
        '<th>Articles</th><th>Options</th>' +
        makeSortableHeader('commandes', 'total', 'Total', 'renderCommandesTable') +
        makeSortableHeader('commandes', 'statut', 'Statut', 'renderCommandesTable') +
        '<th>Actions</th></tr></thead><tbody>';

    data.forEach(function(d) {
        var dt = d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleString('fr-FR') : '';
        var arts = d.items ? d.items.map(function(it) { return '<strong>' + it.quantite + 'x</strong> ' + it.nom; }).join('<br>') : '';
        var opts = d.items ? d.items.map(function(it) {
            var o = [];
            if (it.sauces && it.sauces.length > 0) o.push('<span style="color:#f39c12;">🥫' + it.sauces.join(',') + '</span>');
            if (it.interdits && it.interdits.length > 0) o.push('<span style="color:#ef4444;">🚫' + it.interdits.join(',') + '</span>');
            if (it.epice && it.epice !== 'Normal') o.push('<span style="color:#d97706;">🌶️' + it.epice + '</span>');
            if (it.sel && it.sel !== 'Normal') o.push('<span style="color:#4f46e5;">🧂' + it.sel + '</span>');
            return o.length > 0 ? o.join(' | ') : '-';
        }).join('<br>') : '-';
        var sc = d.statut === 'payé' ? '#4f46e5' : d.statut === 'valide' ? '#16a34a' : '#d97706';
        var sl = d.statut === 'payé' ? '💵 Payée' : d.statut === 'valide' ? '✅ Validée' : '⏳ En attente';
        var act = '';
        if (d.statut === 'en_attente') {
            act = '<button class="btn-add" style="padding:4px 6px;font-size:0.65rem;margin-right:2px;" onclick="validateCommande(\'' + d.id + '\')"><i class="fas fa-check"></i> Valider</button>';
            act += '<button class="btn-save" style="padding:4px 6px;font-size:0.65rem;margin-right:2px;" onclick="payCommande(\'' + d.id + '\')"><i class="fas fa-money-bill-wave"></i> Payer</button>';
            act += '<button class="btn-delete" style="padding:4px 6px;font-size:0.65rem;" onclick="cancelCommande(\'' + d.id + '\')"><i class="fas fa-times"></i> Annuler</button>';
        } else if (d.statut === 'valide') {
            act = '<button class="btn-save" style="padding:4px 6px;font-size:0.65rem;" onclick="payCommande(\'' + d.id + '\')"><i class="fas fa-money-bill-wave"></i> Payer</button>';
        } else {
            act = '<small style="color:#4f46e5;">Payée</small>';
        }
        h += '<tr><td>' + dt + '</td><td><strong>' + (d.clientName || '') + '</strong></td><td>' + (d.clientEmail || '-') + '</td><td>' + (d.clientTelephone || '-') + '</td><td>' + arts + '</td><td>' + opts + '</td><td><strong>' + d.total.toFixed(2) + ' MAD</strong></td><td><span style="color:' + sc + ';">' + sl + '</span></td><td>' + act + '</td></tr>';
    });
    h += '</tbody></table></div>';
    cont.innerHTML = h;
}

// Les fonctions validateCommande, payCommande, cancelCommande restent inchangées (déjà présentes)

// ==================== VENTES (avec filtre et recherche) ====================
function loadVentesPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-shopping-cart"></i> Ventes</h3>' +
        '<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">' +
        '<input type="text" id="ventesSearchInput" placeholder="🔍 Rechercher (client, produit)..." style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px; width:250px;" onkeyup="ventesSearch = this.value; applyVentesFilters();">' +
        '<select id="ventesPeriodSelect" style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px;" onchange="ventesPeriod = this.value; applyVentesFilters();">' + getPeriodOptions('all') + '</select>' +
        '<button class="btn-add" onclick="loadVentes()"><i class="fas fa-sync"></i> Actualiser</button>' +
        '</div></div><div id="ventesTableContainer"></div></div>';
    loadVentes();
}

async function loadVentes() {
    var cont = document.getElementById('ventesTableContainer');
    if (!cont) return;
    var isAdmin = window.currentUserData && window.currentUserData.userData.role === 'admin';
    var vendeurCaissier = '';
    if (!isAdmin && window.currentUserData) { vendeurCaissier = window.currentUserData.userData.prenom + ' ' + window.currentUserData.userData.nom; }
    try {
        const snapshot = await db.collection('ventes').orderBy('createdAt', 'desc').limit(500).get();
        allVentesData = [];
        snapshot.forEach(dc => {
            var d = dc.data();
            d.id = dc.id;
            // Calculer achat/profit pour le tri
            var achat = 0, profit = 0;
            if (d.items) {
                d.items.forEach(function(it) {
                    var pa = it.prixAchat || 0, pv = it.prixVente || 0, pp = it.prixPromo || 0, pvr = (pp > 0) ? pp : pv, q = it.quantite || 1;
                    achat += pa * q; profit += (pvr - pa) * q;
                });
            }
            d.achat = achat;
            d.profit = profit;
            allVentesData.push(d);
        });
        if (!isAdmin) allVentesData = allVentesData.filter(function(d) { return d.vendeur === vendeurCaissier; });
    } catch(e) { console.error(e); }
    applyVentesFilters();
}

function applyVentesFilters() {
    var filtered = filterByPeriod(allVentesData, ventesPeriod);
    filtered = filterBySearch(filtered, ventesSearch, ['clientName', 'items.nom']);
    ventesData = filtered;
    renderVentesTable();
}

function renderVentesTable() {
    var cont = document.getElementById('ventesTableContainer');
    if (!cont) return;
    if (ventesData.length === 0) { cont.innerHTML = '<p style="text-align:center;padding:40px;">Aucune vente trouvée</p>'; return; }
    var isAdmin = window.currentUserData && window.currentUserData.userData.role === 'admin';
    var data = applySort('ventes', ventesData, 'createdAt');
    var tv = 0;
    var h = '<div class="table-container"><table class="data-table" style="font-size:0.55rem;"><thead><tr>' +
        makeSortableHeader('ventes', 'factureNum', 'Facture', 'renderVentesTable') +
        makeSortableHeader('ventes', 'createdAt', 'Date', 'renderVentesTable') +
        makeSortableHeader('ventes', 'clientName', 'Client/Table', 'renderVentesTable') +
        '<th>Articles</th><th>Options</th>' +
        (isAdmin ? makeSortableHeader('ventes', 'achat', 'Achat', 'renderVentesTable') + makeSortableHeader('ventes', 'profit', 'Profit', 'renderVentesTable') : '') +
        makeSortableHeader('ventes', 'total', 'Total', 'renderVentesTable') +
        makeSortableHeader('ventes', 'discountMAD', 'Remise', 'renderVentesTable') +
        makeSortableHeader('ventes', 'amountGiven', 'Donné', 'renderVentesTable') +
        makeSortableHeader('ventes', 'change', 'Rendu', 'renderVentesTable') +
        makeSortableHeader('ventes', 'vendeur', 'Vendeur', 'renderVentesTable') +
        makeSortableHeader('ventes', 'paymentMethod', 'Paiement', 'renderVentesTable') +
        makeSortableHeader('ventes', 'statutPaiement', 'Statut', 'renderVentesTable') +
        '<th>Actions</th></tr></thead><tbody>';

    data.forEach(function(d) {
        var dt = d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleString('fr-FR') : '';
        var cl = d.clientName || d.table || '-';
        var arts = d.items ? d.items.map(function(it) { return '<strong>' + it.quantite + 'x</strong> ' + it.nom; }).join('<br>') : '-';
        var opts = d.items ? d.items.map(function(it) {
            var o = [];
            if (it.sauces && it.sauces.length > 0) o.push('<span style="color:#f39c12;">🥫' + it.sauces.join(',') + '</span>');
            if (it.interdits && it.interdits.length > 0) o.push('<span style="color:#ef4444;">🚫' + it.interdits.join(',') + '</span>');
            if (it.epice && it.epice !== 'Normal') o.push('<span style="color:#d97706;">🌶️' + it.epice + '</span>');
            if (it.sel && it.sel !== 'Normal') o.push('<span style="color:#4f46e5;">🧂' + it.sel + '</span>');
            return o.length > 0 ? o.join(' | ') : '-';
        }).join('<br>') : '-';
        tv += d.total || 0;
        var amountGiven = d.amountGiven || 0;
        var change = d.change || 0;
        var statutLabel = d.statutPaiement || (d.paid ? 'payé' : 'impayé');
        var statutColor = statutLabel === 'payé' ? '#16a34a' : statutLabel === 'crédit' ? '#f39c12' : statutLabel === 'partiel' ? '#d97706' : '#ef4444';
        var actions = '<button class="btn-edit" onclick="printFacture(\'' + d.id + '\')"><i class="fas fa-print"></i></button> ';
        if (!d.paid) actions += '<button class="btn-add" style="padding:4px 6px;font-size:0.65rem;" onclick="payerVente(\'' + d.id + '\')"><i class="fas fa-check"></i> Payer</button> ';
        if (isAdmin) { actions += '<button class="btn-edit" onclick="editVente(\'' + d.id + '\')"><i class="fas fa-edit"></i></button> '; actions += '<button class="btn-delete" onclick="deleteVente(\'' + d.id + '\')"><i class="fas fa-trash"></i></button>'; }
        h += '<tr><td><strong>' + (d.factureNum || d.id.substring(0, 8)) + '</strong></td><td>' + dt + '</td><td>' + cl + '</td><td>' + arts + '</td><td>' + opts + '</td>' + (isAdmin ? '<td>' + d.achat.toFixed(2) + '</td><td style="color:#16a34a;">' + d.profit.toFixed(2) + '</td>' : '') + '<td><strong>' + (d.total || 0).toFixed(2) + '</strong></td><td>' + (d.discountMAD || 0).toFixed(2) + '</td><td>' + amountGiven.toFixed(2) + '</td><td>' + change.toFixed(2) + '</td><td>' + (d.vendeur || '-') + '</td><td>' + (d.paymentMethod || '-') + '</td><td><span style="color:' + statutColor + ';font-weight:600;">' + statutLabel + '</span></td><td>' + actions + '</td></tr>';
    });
    h += '</tbody></table></div><div style="margin-top:15px;padding:15px;background:#f0fdf4;border-radius:12px;text-align:center;"><strong>Total: ' + tv.toFixed(2) + ' MAD</strong></div>';
    cont.innerHTML = h;
}

// Les fonctions editVente, saveEditVente, deleteVente, payerVente, printFacture, imprimerFacture restent inchangées (copier depuis la version précédente)

// ==================== CRÉDITS (avec filtre et recherche) ====================
function loadCreditsPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-credit-card"></i> Crédits</h3>' +
        '<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">' +
        '<input type="text" id="creditsSearchInput" placeholder="🔍 Rechercher (client)..." style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px; width:250px;" onkeyup="creditsSearch = this.value; applyCreditsFilters();">' +
        '<select id="creditsPeriodSelect" style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px;" onchange="creditsPeriod = this.value; applyCreditsFilters();">' + getPeriodOptions('all') + '</select>' +
        '<button class="btn-add" onclick="loadCredits()"><i class="fas fa-sync"></i> Actualiser</button>' +
        '</div></div><div id="creditsTableContainer"></div></div>';
    loadCredits();
}

async function loadCredits() {
    var cont = document.getElementById('creditsTableContainer');
    if (!cont) return;
    var isAdmin = window.currentUserData && window.currentUserData.userData.role === 'admin';
    var vendeurCaissier = '';
    if (!isAdmin && window.currentUserData) { vendeurCaissier = window.currentUserData.userData.prenom + ' ' + window.currentUserData.userData.nom; }
    try {
        const snapshot = await db.collection('credits').orderBy('createdAt', 'desc').limit(500).get();
        allCreditsData = [];
        snapshot.forEach(dc => {
            var d = dc.data();
            d.id = dc.id;
            allCreditsData.push(d);
        });
        if (!isAdmin) allCreditsData = allCreditsData.filter(function(d) { return d.vendeur === vendeurCaissier; });
    } catch(e) { console.error(e); }
    applyCreditsFilters();
}

function applyCreditsFilters() {
    var filtered = filterByPeriod(allCreditsData, creditsPeriod);
    filtered = filterBySearch(filtered, creditsSearch, ['clientName']);
    creditsData = filtered;
    renderCreditsTable();
}

function renderCreditsTable() {
    var cont = document.getElementById('creditsTableContainer');
    if (!cont) return;
    if (creditsData.length === 0) { cont.innerHTML = '<p style="text-align:center;padding:40px;">Aucun crédit trouvé</p>'; return; }
    var data = applySort('credits', creditsData, 'createdAt');
    var tc = 0;
    var h = '<div class="table-container"><table class="data-table" style="font-size:0.55rem;"><thead><tr>' +
        makeSortableHeader('credits', 'factureNum', 'Facture', 'renderCreditsTable') +
        makeSortableHeader('credits', 'createdAt', 'Date', 'renderCreditsTable') +
        makeSortableHeader('credits', 'clientName', 'Client', 'renderCreditsTable') +
        makeSortableHeader('credits', 'total', 'Total', 'renderCreditsTable') +
        makeSortableHeader('credits', 'amountGiven', 'Payé', 'renderCreditsTable') +
        makeSortableHeader('credits', 'remainingAmount', 'Restant', 'renderCreditsTable') +
        makeSortableHeader('credits', 'paymentMethod', 'Mode', 'renderCreditsTable') +
        makeSortableHeader('credits', 'vendeur', 'Vendeur', 'renderCreditsTable') +
        '<th>Actions</th></tr></thead><tbody>';

    data.forEach(function(d) {
        var reste = d.remainingAmount || d.total || 0;
        if (!d.paid) tc += reste;
        var dt = d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleString('fr-FR') : '';
        var amountPaid = d.amountGiven || 0;
        var mode = d.paymentMethod || '-';
        var actions = '<button class="btn-edit" onclick="printFacture(\'' + d.id + '\')"><i class="fas fa-print"></i></button> ';
        if (!d.paid) actions += '<button class="btn-add" style="padding:4px 8px;font-size:0.65rem;" onclick="markCreditPaid(\'' + d.id + '\')">Payer</button> ';
        var isAdmin = window.currentUserData && window.currentUserData.userData.role === 'admin';
        if (isAdmin) {
            actions += '<button class="btn-edit" onclick="editCredit(\'' + d.id + '\')"><i class="fas fa-edit"></i></button> ';
            actions += '<button class="btn-delete" onclick="deleteCredit(\'' + d.id + '\')"><i class="fas fa-trash"></i></button>';
        }
        h += '<tr><td>' + (d.factureNum || d.id.substring(0, 8)) + '</td><td>' + dt + '</td><td>' + (d.clientName || d.table || '-') + '</td><td>' + d.total.toFixed(2) + '</td><td>' + amountPaid.toFixed(2) + '</td><td style="color:#ef4444;"><strong>' + reste.toFixed(2) + '</strong></td><td>' + mode + '</td><td>' + (d.vendeur || '-') + '</td><td>' + actions + '</td></tr>';
    });
    h += '</tbody></table></div><div style="margin-top:15px;padding:15px;background:#fef2f2;border-radius:12px;text-align:center;"><strong>Impayés: ' + tc.toFixed(2) + ' MAD</strong></div>';
    cont.innerHTML = h;
}

// Fonctions editCredit, saveEditCredit, deleteCredit, markCreditPaid inchangées (copier depuis version précédente)

// ==================== OPTIONS (inchangé) ====================
// ... (loadOptionsPage, loadUsersList, blockUser, deleteUserPermanently)

console.log('Admin JS avec tri, filtres période et recherche OK');
