// ==================== ADMIN.JS AVEC CACHE OFFLINE & TRI SUR TOUTES LES LISTES ====================
var editingId = null;
var currentCollection = '';
var selectedCategoryFilter = '';
var sortOrders = {};
var clientSearchQuery = '';

// Données triables pour les listes
var commandesData = [];
var ventesData = [];
var creditsData = [];

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

function loadPendingRegistrations() { /* ... inchangé ... */ }
async function approveUser(uid) { /* ... inchangé ... */ }
async function rejectUser(uid) { /* ... inchangé ... */ }

// ==================== MODAL & CRUD (avec offline) ====================
function openModal(t, b) { /* ... */ }
function closeModal() { /* ... */ }
function fileToBase64(f, cb) { /* ... */ }
function previewImage(inp, pid) { /* ... */ }
async function saveDocument(cn, data, cb) { /* ... */ }
async function deleteDocument(cn, id) { /* ... */ }
function refreshCurrentPage() { /* ... */ }
function editDocument(cn, id) { /* ... */ }
function openEditForm(cn, data) { /* ... */ }

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

// ==================== CATÉGORIES (inchangé, déjà triable) ====================
// ... (loadCategoriesPage, loadCategories, renderCategoriesTable, openCategoryForm, saveCategory)

// ==================== PRODUITS (inchangé, déjà triable) ====================
// ... (loadProductsPage, loadProducts, renderProductsTable, ...)

// ==================== CLIENTS (inchangé, déjà triable) ====================
// ... (loadClientsPage, loadClients, renderClientsTable, ...)

// ==================== FOURNISSEURS (inchangé, déjà triable) ====================
// ... (loadFournisseursPage, loadFournisseurs, renderFournisseursTable, ...)

// ==================== DÉPENSES (inchangé, déjà triable) ====================
// ... (loadDepensesPage, loadDepenses, renderDepensesTable, ...)

// ==================== COMMANDES EN LIGNE (avec tri) ====================
function loadCommandesPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-shopping-basket"></i> Commandes en ligne</h3><button class="btn-add" onclick="loadCommandes()"><i class="fas fa-sync"></i> Actualiser</button></div><div id="commandesTableContainer"></div></div>';
    loadCommandes();
}

async function loadCommandes() {
    var cont = document.getElementById('commandesTableContainer');
    if (!cont) return;
    try {
        const snapshot = await db.collection('commandes').orderBy('createdAt', 'desc').limit(50).get();
        commandesData = [];
        snapshot.forEach(dc => {
            var d = dc.data();
            d.id = dc.id;
            commandesData.push(d);
        });
    } catch (e) { console.error(e); }
    renderCommandesTable();
}

function renderCommandesTable() {
    var cont = document.getElementById('commandesTableContainer');
    if (!cont) return;
    if (commandesData.length === 0) {
        cont.innerHTML = '<p style="text-align:center;padding:40px;">Aucune commande</p>';
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

async function validateCommande(cid) { /* ... */ }
async function payCommande(cid) { /* ... */ }
function cancelCommande(cid) { /* ... */ }

// ==================== VENTES (avec tri) ====================
function loadVentesPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-shopping-cart"></i> Ventes</h3><button class="btn-add" onclick="loadVentes()"><i class="fas fa-sync"></i> Actualiser</button></div><div id="ventesTableContainer"></div></div>';
    loadVentes();
}

async function loadVentes() {
    var cont = document.getElementById('ventesTableContainer');
    if (!cont) return;
    var isAdmin = window.currentUserData && window.currentUserData.userData.role === 'admin';
    var vendeurCaissier = '';
    if (!isAdmin && window.currentUserData) { vendeurCaissier = window.currentUserData.userData.prenom + ' ' + window.currentUserData.userData.nom; }
    try {
        const snapshot = await db.collection('ventes').orderBy('createdAt', 'desc').limit(100).get();
        ventesData = [];
        snapshot.forEach(dc => { var d = dc.data(); d.id = dc.id; ventesData.push(d); });
        if (!isAdmin) ventesData = ventesData.filter(function(d) { return d.vendeur === vendeurCaissier; });
    } catch(e) { console.error(e); }
    renderVentesTable();
}

function renderVentesTable() {
    var cont = document.getElementById('ventesTableContainer');
    if (!cont) return;
    if (ventesData.length === 0) { cont.innerHTML = '<p style="text-align:center;padding:40px;">Aucune vente</p>'; return; }
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
        var achat = 0, profit = 0;
        if (d.items) {
            d.items.forEach(function(it) {
                var pa = it.prixAchat || 0, pv = it.prixVente || 0, pp = it.prixPromo || 0, pvr = (pp > 0) ? pp : pv, q = it.quantite || 1;
                achat += pa * q; profit += (pvr - pa) * q;
            });
        }
        d.achat = achat;
        d.profit = profit;
        tv += d.total || 0;
        var amountGiven = d.amountGiven || 0;
        var change = d.change || 0;
        var statutLabel = d.statutPaiement || (d.paid ? 'payé' : 'impayé');
        var statutColor = statutLabel === 'payé' ? '#16a34a' : statutLabel === 'crédit' ? '#f39c12' : statutLabel === 'partiel' ? '#d97706' : '#ef4444';
        var actions = '<button class="btn-edit" onclick="printFacture(\'' + d.id + '\')"><i class="fas fa-print"></i></button> ';
        if (!d.paid) actions += '<button class="btn-add" style="padding:4px 6px;font-size:0.65rem;" onclick="payerVente(\'' + d.id + '\')"><i class="fas fa-check"></i> Payer</button> ';
        if (isAdmin) { actions += '<button class="btn-edit" onclick="editVente(\'' + d.id + '\')"><i class="fas fa-edit"></i></button> '; actions += '<button class="btn-delete" onclick="deleteVente(\'' + d.id + '\')"><i class="fas fa-trash"></i></button>'; }
        h += '<tr><td><strong>' + (d.factureNum || d.id.substring(0, 8)) + '</strong></td><td>' + dt + '</td><td>' + cl + '</td><td>' + arts + '</td><td>' + opts + '</td>' + (isAdmin ? '<td>' + achat.toFixed(2) + '</td><td style="color:#16a34a;">' + profit.toFixed(2) + '</td>' : '') + '<td><strong>' + (d.total || 0).toFixed(2) + '</strong></td><td>' + (d.discountMAD || 0).toFixed(2) + '</td><td>' + amountGiven.toFixed(2) + '</td><td>' + change.toFixed(2) + '</td><td>' + (d.vendeur || '-') + '</td><td>' + (d.paymentMethod || '-') + '</td><td><span style="color:' + statutColor + ';font-weight:600;">' + statutLabel + '</span></td><td>' + actions + '</td></tr>';
    });
    h += '</tbody></table></div><div style="margin-top:15px;padding:15px;background:#f0fdf4;border-radius:12px;text-align:center;"><strong>Total: ' + tv.toFixed(2) + ' MAD</strong></div>';
    cont.innerHTML = h;
}

// Fonctions d'édition/suppression des ventes (inchangées)
function editVente(did) { /* ... */ }
function saveEditVente() { /* ... */ }
function deleteVente(did) { /* ... */ }
async function payerVente(did) { /* ... */ }
function printFacture(did) { /* ... */ }
function imprimerFacture(d, id) { /* ... */ }

// ==================== CRÉDITS (avec tri) ====================
function loadCreditsPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-credit-card"></i> Crédits</h3><button class="btn-add" onclick="loadCredits()"><i class="fas fa-sync"></i> Actualiser</button></div><div id="creditsTableContainer"></div></div>';
    loadCredits();
}

async function loadCredits() {
    var cont = document.getElementById('creditsTableContainer');
    if (!cont) return;
    var isAdmin = window.currentUserData && window.currentUserData.userData.role === 'admin';
    var vendeurCaissier = '';
    if (!isAdmin && window.currentUserData) { vendeurCaissier = window.currentUserData.userData.prenom + ' ' + window.currentUserData.userData.nom; }
    try {
        const snapshot = await db.collection('credits').orderBy('createdAt', 'desc').limit(100).get();
        creditsData = [];
        snapshot.forEach(dc => { var d = dc.data(); d.id = dc.id; creditsData.push(d); });
        if (!isAdmin) creditsData = creditsData.filter(function(d) { return d.vendeur === vendeurCaissier; });
    } catch(e) { console.error(e); }
    renderCreditsTable();
}

function renderCreditsTable() {
    var cont = document.getElementById('creditsTableContainer');
    if (!cont) return;
    if (creditsData.length === 0) { cont.innerHTML = '<p style="text-align:center;padding:40px;">Aucun crédit</p>'; return; }
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

function editCredit(did) { /* ... */ }
function saveEditCredit() { /* ... */ }
function deleteCredit(did) { /* ... */ }
async function markCreditPaid(cid) { /* ... */ }

// ==================== OPTIONS (inchangé) ====================
// ... (loadOptionsPage, loadUsersList, blockUser, deleteUserPermanently)

console.log('Admin JS avec tri sur toutes les listes OK');
