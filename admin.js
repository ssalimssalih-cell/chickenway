// ==================== ADMIN.JS COMPLET (DÉPENSES DÉPLACÉES DANS depenses.js) ====================
var editingId = null;
var currentCollection = '';
var selectedCategoryFilter = '';
var sortOrders = {};
var clientSearchQuery = '';
var pendingUsersData = [];

// Données complètes pour les listes (les données dépenses sont utilisées par depenses.js)
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

// Filtres
var ventesPeriod = 'all', ventesSearch = '';
var creditsPeriod = 'all', creditsSearch = '';
var commandesPeriod = 'all', commandesSearch = '';

// Liste pour les fournisseurs (inchangée)
var fournisseurCategoriesList = ['Alimentaire', 'Boissons', 'Emballage', 'Entretien', 'Viandes', 'Légumes', 'Sauces', 'Autre'];

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

// ==================== INSCRIPTIONS EN ATTENTE (AVEC TRI) ====================
function loadPendingRegistrations() {
    var d = document.getElementById('pendingRegistrations'); if (!d) return;
    d.innerHTML = '<div class="table-container"><table class="data-table" id="pendingTable"><thead><tr>' +
        makeSortableHeader('pending', 'prenom', 'Utilisateur', 'renderPendingTable') +
        makeSortableHeader('pending', 'email', 'Email', 'renderPendingTable') +
        makeSortableHeader('pending', 'role', 'Rôle', 'renderPendingTable') +
        makeSortableHeader('pending', 'createdAt', 'Date', 'renderPendingTable') +
        '<th>Actions</th></tr></thead><tbody></tbody></table></div>';

    db.collection('users').where('authorized', '==', 'no').get().then(function(s) {
        pendingUsersData = [];
        if (!s.empty) {
            s.forEach(function(dc) {
                var userData = dc.data();
                pendingUsersData.push({
                    id: dc.id,
                    prenom: userData.prenom + ' ' + userData.nom,
                    email: userData.email,
                    role: userData.role,
                    createdAt: userData.createdAt,
                    data: userData
                });
            });
        }
        renderPendingTable();
    }).catch(function(err) {
        console.error(err);
        pendingUsersData = [];
        renderPendingTable();
    });
}

function renderPendingTable() {
    var tb = document.querySelector('#pendingTable tbody');
    if (!tb) return;
    
    var data = applySort('pending', pendingUsersData.slice(), 'createdAt');
    
    tb.innerHTML = '';
    if (data.length === 0) {
        tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:#16a34a;">Aucune inscription en attente</td></tr>';
        return;
    }
    
    data.forEach(function(x) {
        var dt = x.createdAt ? new Date(x.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : 'N/A';
        var row = '<tr>';
        row += '<td><strong>' + x.prenom + '</strong> (@' + x.data.username + ')</td>';
        row += '<td>' + x.email + '</td>';
        row += '<td>' + x.role + '</td>';
        row += '<td>' + dt + '</td>';
        row += '<td><button class="btn-add" style="padding:4px 10px;font-size:0.7rem;margin-right:5px;" onclick="approveUser(\'' + x.id + '\')"><i class="fas fa-check"></i> Accepter</button><button class="btn-delete" style="padding:4px 10px;font-size:0.7rem;" onclick="rejectUser(\'' + x.id + '\')"><i class="fas fa-times"></i> Refuser</button></td>';
        row += '</tr>';
        tb.innerHTML += row;
    });
}

// ==================== APPROBATION / REJET ====================
async function approveUser(uid) {
    if (!confirm('Accepter cet utilisateur ?')) return;

    let userDoc;
    try {
        userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            alert('Utilisateur introuvable');
            return;
        }
    } catch(e) {
        alert('Erreur lors de la récupération des données utilisateur');
        return;
    }

    const userData = userDoc.data();

    await CacheDB.write('users', uid, {
        authorized: 'yes',
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, 'update');

    if (userData.role === 'client') {
        const clientData = {
            nom: userData.nom || '',
            prenom: userData.prenom || '',
            email: userData.email || '',
            telephone: userData.telephone || '',
            username: userData.username || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const existingClient = await db.collection('clients').doc(uid).get();
        if (existingClient.exists) {
            await CacheDB.write('clients', uid, clientData, 'update');
        } else {
            await CacheDB.write('clients', uid, clientData, 'set');
        }
    }

    alert('✅ Utilisateur accepté avec succès');
    loadPendingRegistrations();
    if (typeof loadUsersList === 'function') loadUsersList();
    if (typeof loadClients === 'function') loadClients();
    CacheDB.sync();
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

// ==================== PAGINATION ====================
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
    var dataArrays = {
        categories: allCategoriesData,
        products: allProductsData,
        clients: allClientsData,
        fournisseurs: allFournisseursData,
        depenses: allDepensesData,
        commandes: window.filteredCommandes || allCommandesData,
        ventes: window.filteredVentes || allVentesData,
        credits: window.filteredCredits || allCreditsData
    };
    var totalItems = (dataArrays[tableName] || []).length;
    var totalPages = Math.ceil(totalItems / itemsPerPage);
    if (newPage < 1 || newPage > totalPages) return;
    currentPages[tableName] = newPage;
    if (renderFunctions[tableName]) renderFunctions[tableName]();
}

function getPageData(tableName, dataArray) {
    var page = currentPages[tableName] || 1;
    var start = (page - 1) * itemsPerPage;
    return dataArray.slice(start, start + itemsPerPage);
}

// ==================== FILTRES DATE/RECHERCHE ====================
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
// [Ton code existant pour les catégories, produits, clients, fournisseurs, commandes, ventes, crédits reste inchangé]

// ==================== OPTIONS (avec Programme de fidélité) ====================
function loadOptionsPage(c) {
    if (!window.currentUserData || window.currentUserData.userData.role !== 'admin') { c.innerHTML = '<p>Accès refusé</p>'; return; }
    c.innerHTML = 
    '<div class="stats-grid">'+
        '<div class="stat-card"><div class="stat-icon" style="background:#fef3c7;"><i class="fas fa-clock" style="color:#d97706;"></i></div><div class="stat-info"><span>En attente</span><span class="stat-value" id="pendingCount">0</span></div></div>'+
        '<div class="stat-card"><div class="stat-icon" style="background:#dcfce7;"><i class="fas fa-check-circle" style="color:#16a34a;"></i></div><div class="stat-info"><span>Autorisés</span><span class="stat-value" id="authorizedCount">0</span></div></div>'+
        '<div class="stat-card"><div class="stat-icon" style="background:#e0e7ff;"><i class="fas fa-users" style="color:#4f46e5;"></i></div><div class="stat-info"><span>Total</span><span class="stat-value" id="totalUsers">0</span></div></div>'+
    '</div>'+
    '<div class="content-card">'+
        '<div class="card-header"><h3><i class="fas fa-lock"></i> Sécurité</h3>'+
        '<button class="btn-add" onclick="toggleChangePasswordForm()"><i class="fas fa-key"></i> Changer le mot de passe</button></div>'+
        '<div id="changePasswordForm" class="hidden" style="margin-top:15px;">'+
            '<div class="form-row">'+
                '<div class="form-group"><label>Mot de passe actuel</label><input type="password" id="currentPassword" placeholder="Mot de passe actuel"></div>'+
            '</div>'+
            '<div class="form-row">'+
                '<div class="form-group"><label>Nouveau mot de passe</label><input type="password" id="newPassword" placeholder="6 caractères minimum"></div>'+
                '<div class="form-group"><label>Confirmer le mot de passe</label><input type="password" id="confirmPassword" placeholder="Confirmer"></div>'+
            '</div>'+
            '<button class="btn-save" onclick="changeAdminPassword()" style="float:left;margin-top:10px;"><i class="fas fa-save"></i> Changer le mot de passe</button>'+
        '</div>'+
    '</div>'+
    '<div class="content-card">'+
        '<div class="card-header"><h3><i class="fas fa-star"></i> Programme de fidélité</h3></div>'+
        '<div style="display:flex; align-items:flex-end; gap:20px; flex-wrap:wrap;">'+
            '<div class="form-group">'+
                '<label>Activer le programme</label>'+
                '<select id="fideliteActifSelect"><option value="1">✅ Actif</option><option value="0">❌ Inactif</option></select>'+
            '</div>'+
            '<div class="form-group">'+
                '<label>Points par vente</label>'+
                '<input type="number" id="fidelitePointsInput" value="1" min="1" step="1" style="width:100px;">'+
            '</div>'+
            '<button class="btn-save" onclick="saveFideliteSettings()" style="float:none;margin:0;height:44px;"><i class="fas fa-save"></i> Enregistrer</button>'+
        '</div>'+
    '</div>'+
    '<div class="content-card">'+
        '<div class="card-header"><h3>Utilisateurs</h3><button class="btn-add" onclick="loadUsersList()">Actualiser</button></div>'+
        '<div class="table-container"><table class="data-table"><thead><tr><th>Username</th><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="usersTableBody"></tbody></table></div>'+
    '</div>';
    loadUsersList();
    loadFideliteSettings();
}

function loadUsersList() {
    // [Ton code existant pour loadUsersList]
}

function blockUser(uid) {
    // [Ton code existant]
}

function deleteUserPermanently(uid) {
    // [Ton code existant]
}

// ==================== AFFICHAGE / MASQUAGE FORMULAIRE MOT DE PASSE ====================
function toggleChangePasswordForm() {
    var form = document.getElementById('changePasswordForm');
    if (form) {
        if (form.classList.contains('hidden')) {
            form.classList.remove('hidden');
        } else {
            form.classList.add('hidden');
        }
    }
}

// ==================== CHANGEMENT DE MOT DE PASSE ADMIN ====================
async function changeAdminPassword() {
    var currentPass = document.getElementById('currentPassword').value.trim();
    var newPass = document.getElementById('newPassword').value.trim();
    var confirmPass = document.getElementById('confirmPassword').value.trim();

    if (!currentPass || !newPass || !confirmPass) {
        alert('Tous les champs sont obligatoires.');
        return;
    }
    if (newPass.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères.');
        return;
    }
    if (newPass !== confirmPass) {
        alert('Les mots de passe ne correspondent pas.');
        return;
    }

    var user = auth.currentUser;
    if (!user) {
        alert('Aucun utilisateur connecté.');
        return;
    }

    var credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPass);
    try {
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPass);
        alert('✅ Mot de passe changé avec succès !');
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        // Refermer le formulaire
        toggleChangePasswordForm();
    } catch (error) {
        console.error(error);
        if (error.code === 'auth/wrong-password') {
            alert('❌ Mot de passe actuel incorrect.');
        } else {
            alert('Erreur : ' + error.message);
        }
    }
}

// ==================== NOUVELLES FONCTIONS FIDÉLITÉ ====================
async function loadFideliteSettings() {
    let active = true;
    let points = 1;
    try {
        const doc = await db.collection('settings').doc('fidelite').get();
        if (doc.exists) {
            active = doc.data().active === true;
            points = doc.data().pointsParVente || 1;
        }
    } catch(e) {
        // fallback localStorage
        active = localStorage.getItem('fidelite_active') === 'true';
        points = parseInt(localStorage.getItem('fidelite_points')) || 1;
    }
    document.getElementById('fideliteActifSelect').value = active ? '1' : '0';
    document.getElementById('fidelitePointsInput').value = points;
}

async function saveFideliteSettings() {
    var active = document.getElementById('fideliteActifSelect').value === '1';
    var points = parseInt(document.getElementById('fidelitePointsInput').value) || 1;
    try {
        await db.collection('settings').doc('fidelite').set({ active: active, pointsParVente: points }, { merge: true });
    } catch(e) {
        console.warn('Firestore inaccessible, sauvegarde locale');
    }
    localStorage.setItem('fidelite_active', active);
    localStorage.setItem('fidelite_points', points);
    alert('✅ Paramètres de fidélité enregistrés');
}

console.log('Admin JS (dépenses déplacées dans depenses.js) prêt.');
