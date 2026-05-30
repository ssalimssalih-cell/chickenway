// ==================== ADMIN.JS COMPLET AVEC DÉPENSES HIÉRARCHIQUES + SAISIE AUTRE ====================
var editingId = null;
var currentCollection = '';
var selectedCategoryFilter = '';
var sortOrders = {};
var clientSearchQuery = '';
var pendingUsersData = [];

// Données complètes pour les listes
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

// Listes pour les catégories
var fournisseurCategoriesList = ['Alimentaire', 'Boissons', 'Emballage', 'Entretien', 'Viandes', 'Légumes', 'Sauces', 'Autre'];

// Nouvelle structure des dépenses (catégorie → sous‑catégories)
var depenseCategories = {
    "Achats matières premières": ["Viande", "Poulet", "Poisson", "Légumes", "Fruits", "Produits laitiers", "Épices", "Huile"],
    "Boissons": ["Eau", "Sodas", "Jus", "Café", "Thé"],
    "Emballages": ["Sacs", "Boîtes", "Gobelets", "Serviettes"],
    "Personnel": ["Salaires", "Avances", "Primes", "CNSS"],
    "Charges du local": ["Loyer", "Eau", "Électricité", "Gaz", "Internet", "Téléphone"],
    "Maintenance": ["Réparation cuisine", "Climatisation", "Plomberie", "Matériel"],
    "Marketing": ["Publicité Facebook", "Publicité Instagram", "Flyers", "Promotions"],
    "Administratif": ["Comptable", "Logiciel POS", "Frais bancaires", "Assurances"],
    "Transport et livraison": ["Carburant", "Entretien véhicule", "Frais de livraison"],
    "Taxes et impôts": ["Taxes", "Impôts"]
};

// ==================== DASHBOARD ====================
function loadDashboardPage(c) {
    c.innerHTML = '<div class="stats-grid">...'; // inchangé
    // ... tout le code existant du dashboard, inscriptions, etc.
}
// (Tout le code précédent pour dashboard, inscriptions, modal, tri, pagination, catégories, produits, clients, fournisseurs, reste inchangé)

// ... (je ne répète pas les fonctions déjà présentes dans ton fichier actuel, elles sont toutes conservées)

// ==================== DÉPENSES (NOUVELLE VERSION) ====================
function loadDepensesPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-money-bill-wave"></i> Dépenses</h3><button class="btn-add" onclick="openDepenseForm()"><i class="fas fa-plus"></i> Nouvelle</button></div><div class="table-container"><table class="data-table" id="depensesTable" style="font-size:0.65rem;"><thead><tr>'+makeSortableHeader('depenses','id','ID','loadDepenses')+makeSortableHeader('depenses','titre','Titre','loadDepenses')+'<th>Catégorie</th><th>Sous‑catégorie</th>'+makeSortableHeader('depenses','montant','Montant','loadDepenses')+makeSortableHeader('depenses','description','Description','loadDepenses')+makeSortableHeader('depenses','createdAt','Date','loadDepenses')+'<th>Actions</th></tr></thead><tbody></tbody></table></div><div id="depensesPagination"></div></div>';
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
        tb.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;">Aucune dépense</td></tr>';
        document.getElementById('depensesPagination').innerHTML = '';
        return;
    }
    for (var i = 0; i < pageData.length; i++) {
        var d = pageData[i];
        var dateCreated = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleDateString('fr-FR')+' '+new Date(d.createdAt.seconds*1000).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '-';
        var sousCategories = d.sousCategories ? d.sousCategories.join(', ') : '-';
        tb.innerHTML += '<tr><td><small>'+(d.id||'').substring(0,6)+'</small></td><td><strong>'+(d.titre||d.description||'-')+'</strong></td><td><small>'+(d.categorie||'-')+'</small></td><td><small>'+sousCategories+'</small></td><td style="color:#ef4444;font-weight:700;">'+(d.montant||0).toFixed(2)+' MAD</td><td><small>'+(d.description||'-')+'</small></td><td><small>'+dateCreated+'</small></td><td><button class="btn-edit" onclick="editDepense(\''+d.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDepense(\''+d.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';
    }
    document.getElementById('depensesPagination').innerHTML = getPaginationHTML('depenses', data.length);
}

function openDepenseForm(data) {
    data = data || {};
    var selectedCategorie = data.categorie || '';
    var selectedSousCategories = data.sousCategories || [];

    var catOptions = '<option value="">-- Choisir --</option>';
    Object.keys(depenseCategories).forEach(function(cat) {
        var sel = selectedCategorie === cat ? 'selected' : '';
        catOptions += '<option value="' + cat + '" ' + sel + '>' + cat + '</option>';
    });

    var h = '';
    h += '<div class="form-row"><div class="form-group"><label>Titre *</label><input type="text" id="depTitre" value="' + (data.titre || '') + '" required></div><div class="form-group"><label>Montant *</label><input type="number" id="depMontant" value="' + (data.montant || 0) + '" step="0.01" required></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Catégorie</label><select id="depCategorie" onchange="updateDepSousCategories()" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;">' + catOptions + '</select></div></div>';
    h += '<div class="form-row"><div class="form-group" style="min-width:100%;"><label>Sous‑catégories</label><div id="depSousCategories" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:5px;"></div></div></div>';
    // Champ pour sous‑catégorie manuelle
    h += '<div class="form-row"><div class="form-group"><label>Autre sous‑catégorie (manuelle)</label><input type="text" id="depAutreSousCat" placeholder="Ajouter une sous‑catégorie non listée" style="width:100%;"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Date</label><input type="date" id="depDate" value="' + (data.date || new Date().toISOString().split('T')[0]) + '"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Description</label><textarea id="depDesc">' + (data.description || '') + '</textarea></div></div>';
    h += '<button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveDepense()">Enregistrer</button>';

    currentCollection = 'depenses';
    openModal(editingId ? 'Modifier Dépense' : 'Nouvelle Dépense', h);

    setTimeout(function() {
        updateDepSousCategories();
        // Cocher les sous‑catégories déjà sélectionnées
        if (selectedSousCategories.length > 0) {
            selectedSousCategories.forEach(function(sc) {
                var cb = document.querySelector('.dep-sous-cat-check[value="' + sc.replace(/"/g, '&quot;') + '"]');
                if (cb) cb.checked = true;
                else {
                    // Si non trouvé, c'est une sous‑catégorie personnalisée : pré-remplir le champ manuel
                    document.getElementById('depAutreSousCat').value = sc;
                }
            });
        }
    }, 100);
}

// Met à jour les cases à cocher des sous‑catégories selon la catégorie sélectionnée
function updateDepSousCategories() {
    var cat = document.getElementById('depCategorie').value;
    var container = document.getElementById('depSousCategories');
    if (!container) return;
    container.innerHTML = '';
    if (cat && depenseCategories[cat]) {
        depenseCategories[cat].forEach(function(sc) {
            container.innerHTML += '<label style="display:flex;align-items:center;gap:4px;padding:5px 10px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.8rem;">' +
                '<input type="checkbox" class="dep-sous-cat-check" value="' + sc + '"> ' + sc + '</label>';
        });
    }
}

function saveDepense() {
    var titre = document.getElementById('depTitre').value.trim();
    var montant = parseFloat(document.getElementById('depMontant').value) || 0;
    if (!titre || !montant) { alert('Titre et montant obligatoires'); return; }

    var categorie = document.getElementById('depCategorie').value;
    var sousCategories = [];
    document.querySelectorAll('.dep-sous-cat-check:checked').forEach(function(cb) {
        sousCategories.push(cb.value);
    });
    // Ajouter la sous‑catégorie manuelle si renseignée
    var autre = document.getElementById('depAutreSousCat').value.trim();
    if (autre) sousCategories.push(autre);

    var d = {
        titre: titre,
        montant: montant,
        categorie: categorie,
        sousCategories: sousCategories,
        date: document.getElementById('depDate').value,
        description: document.getElementById('depDesc').value
    };
    if (!editingId) d.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    saveDocument('depenses', d, function() { closeModal(); loadDepenses(); });
}

function editDepense(id) {
    db.collection('depenses').doc(id).get().then(function(doc) {
        if (doc.exists) { editingId = id; currentCollection = 'depenses'; openDepenseForm(doc.data()); }
    });
}

function deleteDepense(id) {
    if (confirm('Supprimer cette dépense ?')) {
        CacheDB.write('depenses', id, null, 'delete').then(function() { alert('Supprimée'); loadDepenses(); CacheDB.sync(); });
    }
}

// ... (tout le reste du code : commandes, ventes, crédits, options, etc. reste inchangé)
// Assurez-vous que les fonctions suivantes sont bien présentes dans votre fichier, elles n'ont pas changé :
// loadCommandesPage, loadCommandes, renderCommandesTable, validateCommande, payCommande, cancelCommande
// loadVentesPage, loadVentes, renderVentesTable, editVente, saveEditVente, deleteVente, payerVente, printFacture, imprimerFacture
// loadCreditsPage, loadCredits, renderCreditsTable, editCredit, saveEditCredit, deleteCredit, markCreditPaid
// loadOptionsPage, loadUsersList, blockUser, deleteUserPermanently
// Et toutes les fonctions de tri, pagination, etc.

console.log('Admin JS avec dépenses hiérarchiques OK');
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

async function validateCommande(cid) {
    if (!confirm('Valider cette commande ? Le statut passera à "Validée".')) return;
    await CacheDB.write('commandes', cid, { statut: 'valide', validatedAt: firebase.firestore.FieldValue.serverTimestamp(), validatedBy: window.currentUserData ? window.currentUserData.userData.prenom + ' ' + window.currentUserData.userData.nom : 'Admin' }, 'update');
    alert('✅ Validée !'); loadCommandes(); CacheDB.sync();
}

async function payCommande(cid) {
    if (!confirm('Payer cette commande ? Redirection vers le POS...')) return;
    var dc = await db.collection('commandes').doc(cid).get(); if (!dc.exists) { alert('Introuvable'); return; }
    var cmd = dc.data();
    localStorage.setItem('posCommandeData', JSON.stringify({ commandeId: cid, clientId: cmd.clientId, clientName: cmd.clientName, items: cmd.items, total: cmd.total, table: cmd.table || '' }));
    navigateTo('pos');
}

function cancelCommande(cid) {
    if (confirm('Annuler ?')) {
        CacheDB.write('commandes', cid, { statut: 'annule' }, 'update').then(function() { alert('❌ Annulée'); loadCommandes(); CacheDB.sync(); });
    }
}

// ==================== VENTES ====================
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
        const snapshot = await db.collection('ventes').orderBy('createdAt','desc').limit(2000).get();
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
    h += '</tbody></table></div><div style="margin-top:15px;padding:15px;background:#f0fdf4;border-radius:12px;text-align:center;"><strong>Total: '+tv.toFixed(2)+' MAD</strong></div>';
    cont.innerHTML = h;
    document.getElementById('ventesPagination').innerHTML = getPaginationHTML('ventes', data.length);
}

function editVente(did) {
    db.collection('ventes').doc(did).get().then(function(doc) {
        if (doc.exists) {
            editingId = did; currentCollection = 'ventes';
            var d = doc.data();
            var h = '<div class="form-row"><div class="form-group"><label>Statut paiement</label><select id="editStatut"><option value="payé" ' + (d.statutPaiement === 'payé' ? 'selected' : '') + '>Payé</option><option value="crédit" ' + (d.statutPaiement === 'crédit' ? 'selected' : '') + '>Crédit</option><option value="partiel" ' + (d.statutPaiement === 'partiel' ? 'selected' : '') + '>Partiel</option><option value="en_attente" ' + (d.statutPaiement === 'en_attente' ? 'selected' : '') + '>En attente</option></select></div><div class="form-group"><label>Montant donné</label><input type="number" id="editAmountGiven" value="' + (d.amountGiven || 0) + '" step="0.01"></div></div>';
            h += '<div class="form-row"><div class="form-group"><label>Montant rendu</label><input type="number" id="editChange" value="' + (d.change || 0) + '" step="0.01"></div><div class="form-group"><label>Reste à payer</label><input type="number" id="editRemaining" value="' + (d.remainingAmount || 0) + '" step="0.01"></div></div>';
            h += '<button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveEditVente()">Enregistrer</button>';
            openModal('Modifier vente ' + d.factureNum, h);
        }
    });
}

function saveEditVente() {
    var statut = document.getElementById('editStatut').value;
    var amountGiven = parseFloat(document.getElementById('editAmountGiven').value) || 0;
    var change = parseFloat(document.getElementById('editChange').value) || 0;
    var remaining = parseFloat(document.getElementById('editRemaining').value) || 0;
    var paid = (statut === 'payé');
    var data = { statutPaiement: statut, amountGiven: amountGiven, change: change, remainingAmount: paid ? 0 : remaining, paid: paid, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    saveDocument('ventes', data, function() { closeModal(); loadVentes(); });
}

function deleteVente(did) {
    if (confirm('Supprimer définitivement cette vente ? Les stocks ne seront pas restaurés.')) {
        CacheDB.write('ventes', did, null, 'delete').then(function() { alert('Supprimé'); loadVentes(); CacheDB.sync(); });
    }
}

async function payerVente(did) {
    if (!confirm('Payer cette vente ? Redirection vers le POS...')) return;
    var dc = await db.collection('ventes').doc(did).get(); if (!dc.exists) { alert('Introuvable'); return; }
    var d = dc.data();
    localStorage.setItem('posPayerVente', JSON.stringify({ venteId: did, clientId: d.clientId, clientName: d.clientName, items: d.items, total: d.total, table: d.table || '' }));
    navigateTo('pos');
}

function printFacture(did) {
    db.collection('ventes').doc(did).get().then(function(dc) { if (dc.exists) imprimerFacture(dc.data(), dc.id); else { db.collection('credits').doc(did).get().then(function(cd) { if (cd.exists) imprimerFacture(cd.data(), cd.id); }); } });
}

function imprimerFacture(d, id) {
    var ih = '';
    if (d.items) {
        d.items.forEach(function(it) {
            var o = '';
            if (it.interdits && it.interdits.length > 0) o += ' 🚫' + it.interdits.join(',');
            if (it.permis && it.permis.length > 0) o += ' ✅' + it.permis.join(',');
            if (it.epice && it.epice !== 'Normal') o += ' 🌶️' + it.epice;
            ih += '<tr><td>' + it.nom + o + '</td><td>' + it.quantite + '</td><td>' + (it.prixVente || 0).toFixed(2) + '</td><td>' + ((it.prixVente || 0) * it.quantite).toFixed(2) + '</td></tr>';
        });
    }
    var w = window.open('', '_blank', 'width=400,height=600');
    w.document.write('<html><head><title>Facture</title><style>body{font-family:Arial;padding:20px;}h2{text-align:center;}table{width:100%;border-collapse:collapse;}th,td{padding:5px;border-bottom:1px solid #ddd;}.total{font-size:16px;font-weight:bold;text-align:right;}</style></head><body><h2>🐔 Chicken Way</h2><p>Facture: ' + (d.factureNum || id.substring(0, 8)) + '</p><p>Date: ' + (d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleString('fr-FR') : '') + '</p><p>Client: ' + (d.clientName || d.table || '') + '</p><p>Vendeur: ' + (d.vendeur || '-') + '</p><table><tr><th>Article</th><th>Qté</th><th>Prix</th><th>Total</th></tr>' + ih + '</table>' + (d.discountMAD > 0 ? '<p>Remise: ' + d.discountMAD.toFixed(2) + ' MAD</p>' : '') + '<p class="total">Total: ' + d.total.toFixed(2) + ' MAD</p></body></html>');
    w.document.close();
    setTimeout(function() { w.print(); }, 500);
}

// ==================== CRÉDITS ====================
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
        const snapshot = await db.collection('credits').orderBy('createdAt','desc').limit(2000).get();
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

function editCredit(did) {
    db.collection('credits').doc(did).get().then(function(doc) {
        if (doc.exists) {
            editingId = did; currentCollection = 'credits';
            var d = doc.data();
            var h = '<div class="form-row"><div class="form-group"><label>Statut</label><select id="editCreditPaid"><option value="1" ' + (d.paid ? 'selected' : '') + '>Payé</option><option value="0" ' + (!d.paid ? 'selected' : '') + '>Impayé</option></select></div><div class="form-group"><label>Montant payé</label><input type="number" id="editAmountGiven" value="' + (d.amountGiven || 0) + '" step="0.01"></div></div>';
            h += '<div class="form-row"><div class="form-group"><label>Reste à payer</label><input type="number" id="editRemaining" value="' + (d.remainingAmount || d.total || 0) + '" step="0.01"></div><div class="form-group"><label>Mode de paiement</label><input type="text" id="editPaymentMethod" value="' + (d.paymentMethod || '') + '"></div></div>';
            h += '<button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveEditCredit()">Enregistrer</button>';
            openModal('Modifier crédit ' + (d.factureNum || did), h);
        }
    });
}

function saveEditCredit() {
    var paid = document.getElementById('editCreditPaid').value === '1';
    var amountGiven = parseFloat(document.getElementById('editAmountGiven').value) || 0;
    var remaining = parseFloat(document.getElementById('editRemaining').value) || 0;
    var paymentMethod = document.getElementById('editPaymentMethod').value.trim();
    var data = { paid: paid, amountGiven: amountGiven, remainingAmount: paid ? 0 : remaining, paymentMethod: paymentMethod, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    saveDocument('credits', data, function() { closeModal(); loadCredits(); });
}

function deleteCredit(did) {
    if (confirm('Supprimer ce crédit ?')) {
        CacheDB.write('credits', did, null, 'delete').then(function() { alert('Supprimé'); loadCredits(); CacheDB.sync(); });
    }
}

async function markCreditPaid(cid) {
    if (confirm('Marquer ce crédit comme totalement payé ?')) {
        await CacheDB.write('credits', cid, { paid: true, remainingAmount: 0, paidAt: firebase.firestore.FieldValue.serverTimestamp() }, 'update');
        alert('✅ Payé'); loadCredits(); CacheDB.sync();
    }
}

// ==================== OPTIONS ====================
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

// ==================== STATISTIQUES ====================
function loadStatistiquesPage(c) {
    var html = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-chart-bar"></i> Statistiques du restaurant</h3>' +
        '<div style="display:flex; gap:10px; align-items:center;">' +
        '<select id="statPeriodSelect" style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px;" onchange="loadStatistiques()">' +
        '<option value="1">Aujourd\'hui</option>' +
        '<option value="7" selected>7 derniers jours</option>' +
        '<option value="30">30 derniers jours</option>' +
        '<option value="all">Tout</option>' +
        '</select>' +
        '<button class="btn-add" onclick="loadStatistiques()"><i class="fas fa-sync"></i> Actualiser</button>' +
        '</div></div>' +
        '<div id="statsContent" style="text-align:center;padding:40px;">Chargement...</div></div>';
    c.innerHTML = html;
    loadStatistiques();
}

async function loadStatistiques() {
    var period = document.getElementById('statPeriodSelect')?.value || '7';
    var now = new Date();
    var startDate = null;
    if (period !== 'all') {
        var days = parseInt(period);
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
    }

    try {
        var [ventesSnap, creditsSnap, depensesSnap, commandesSnap, produitsSnap, categoriesSnap, clientsSnap] = await Promise.all([
            db.collection('ventes').orderBy('createdAt', 'desc').limit(2000).get(),
            db.collection('credits').orderBy('createdAt', 'desc').limit(2000).get(),
            db.collection('depenses').orderBy('createdAt', 'desc').limit(2000).get(),
            db.collection('commandes').orderBy('createdAt', 'desc').limit(2000).get(),
            db.collection('products').get(),
            db.collection('categories').get(),
            db.collection('clients').get()
        ]);

        var ventes = [];
        ventesSnap.forEach(d => { var dd = d.data(); dd.id = d.id; if (!startDate || (dd.createdAt && dd.createdAt.toDate() >= startDate)) ventes.push(dd); });

        var credits = [];
        creditsSnap.forEach(d => { var dd = d.data(); dd.id = d.id; if (!startDate || (dd.createdAt && dd.createdAt.toDate() >= startDate)) credits.push(dd); });

        var depenses = [];
        depensesSnap.forEach(d => { var dd = d.data(); dd.id = d.id; if (!startDate || (dd.createdAt && dd.createdAt.toDate() >= startDate)) depenses.push(dd); });

        var commandes = [];
        commandesSnap.forEach(d => { var dd = d.data(); dd.id = d.id; if (!startDate || (dd.createdAt && dd.createdAt.toDate() >= startDate)) commandes.push(dd); });

        var produits = [];
        produitsSnap.forEach(d => { produits.push({ id: d.id, ...d.data() }); });
        var categories = [];
        categoriesSnap.forEach(d => { categories.push({ id: d.id, ...d.data() }); });
        var clients = [];
        clientsSnap.forEach(d => { clients.push({ id: d.id, ...d.data() }); });

        var totalVentes = ventes.reduce((sum, v) => sum + (v.total || 0), 0);
        var totalProfit = ventes.reduce((sum, v) => {
            var profit = 0;
            if (v.items) {
                v.items.forEach(it => {
                    var pa = it.prixAchat || 0, pv = it.prixVente || 0, pp = it.prixPromo || 0, pvr = (pp > 0) ? pp : pv, q = it.quantite || 1;
                    profit += (pvr - pa) * q;
                });
            }
            return sum + profit;
        }, 0);
        var totalDepenses = depenses.reduce((sum, d) => sum + (d.montant || 0), 0);
        var totalCreditsImpayes = credits.filter(c => !c.paid).reduce((sum, c) => sum + (c.remainingAmount || c.total || 0), 0);
        var nbVentes = ventes.length;
        var panierMoyen = nbVentes > 0 ? totalVentes / nbVentes : 0;
        var nbClients = clients.length;
        var nbProduits = produits.length;
        var nbCommandes = commandes.length;

        var productSales = {};
        ventes.forEach(v => {
            if (v.items) {
                v.items.forEach(it => {
                    var nom = it.nom || 'Sans nom';
                    if (!productSales[nom]) productSales[nom] = 0;
                    productSales[nom] += (it.quantite || 0);
                });
            }
        });
        var topProduits = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);

        var categoryCA = {};
        ventes.forEach(v => {
            if (v.items) {
                v.items.forEach(it => {
                    var cat = produits.find(p => p.nom === it.nom)?.categorie || 'Sans catégorie';
                    if (!categoryCA[cat]) categoryCA[cat] = 0;
                    categoryCA[cat] += (it.prixVente || it.prixUnitaire || 0) * (it.quantite || 0);
                });
            }
        });
        var topCategories = Object.entries(categoryCA).sort((a, b) => b[1] - a[1]).slice(0, 5);

        var dailySales = {};
        var daysToShow = period === 'all' ? 30 : parseInt(period);
        var today = new Date();
        for (var i = daysToShow - 1; i >= 0; i--) {
            var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            var key = d.toISOString().split('T')[0];
            dailySales[key] = 0;
        }
        ventes.forEach(v => {
            if (v.createdAt) {
                var dateKey = v.createdAt.toDate().toISOString().split('T')[0];
                if (dailySales[dateKey] !== undefined) {
                    dailySales[dateKey] += v.total || 0;
                }
            }
        });

        var statsHTML = '<div class="stats-grid" style="margin-bottom:20px;">' +
            '<div class="stat-card"><div class="stat-icon"><i class="fas fa-money-bill-wave" style="color:#16a34a;"></i></div><div class="stat-info"><span class="stat-label">Chiffre d\'affaires</span><span class="stat-value">' + totalVentes.toFixed(2) + ' MAD</span></div></div>' +
            '<div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-cart"></i></div><div class="stat-info"><span class="stat-label">Ventes</span><span class="stat-value">' + nbVentes + '</span></div></div>' +
            '<div class="stat-card"><div class="stat-icon"><i class="fas fa-chart-line" style="color:#f39c12;"></i></div><div class="stat-info"><span class="stat-label">Profit</span><span class="stat-value" style="color:'+(totalProfit>=0?'#16a34a':'#ef4444')+';">' + totalProfit.toFixed(2) + ' MAD</span></div></div>' +
            '<div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-basket"></i></div><div class="stat-info"><span class="stat-label">Panier moyen</span><span class="stat-value">' + panierMoyen.toFixed(2) + ' MAD</span></div></div>' +
            '<div class="stat-card"><div class="stat-icon"><i class="fas fa-coins" style="color:#ef4444;"></i></div><div class="stat-info"><span class="stat-label">Dépenses</span><span class="stat-value">' + totalDepenses.toFixed(2) + ' MAD</span></div></div>' +
            '<div class="stat-card"><div class="stat-icon"><i class="fas fa-credit-card"></i></div><div class="stat-info"><span class="stat-label">Crédits impayés</span><span class="stat-value">' + totalCreditsImpayes.toFixed(2) + ' MAD</span></div></div>' +
            '<div class="stat-card"><div class="stat-icon"><i class="fas fa-balance-scale" style="color:#4f46e5;"></i></div><div class="stat-info"><span class="stat-label">Bénéfice net</span><span class="stat-value" style="color:'+(totalProfit - totalDepenses >=0?'#16a34a':'#ef4444')+';">' + (totalProfit - totalDepenses).toFixed(2) + ' MAD</span></div></div>' +
            '<div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value">' + nbClients + '</span></div></div>' +
            '</div>';

        statsHTML += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">';
        statsHTML += '<div class="content-card"><h4 style="margin-bottom:10px;">🏆 Top 5 produits</h4><table class="data-table"><thead><tr><th>Produit</th><th>Quantité vendue</th></tr></thead><tbody>';
        topProduits.forEach(p => {
            statsHTML += '<tr><td>' + p[0] + '</td><td>' + p[1] + '</td></tr>';
        });
        statsHTML += '</tbody></table></div>';

        statsHTML += '<div class="content-card"><h4 style="margin-bottom:10px;">📊 Top 5 catégories</h4><table class="data-table"><thead><tr><th>Catégorie</th><th>CA (MAD)</th></tr></thead><tbody>';
        topCategories.forEach(cat => {
            statsHTML += '<tr><td>' + cat[0] + '</td><td>' + cat[1].toFixed(2) + '</td></tr>';
        });
        statsHTML += '</tbody></table></div>';
        statsHTML += '</div>';

        statsHTML += '<div class="content-card"><h4 style="margin-bottom:10px;">📈 Ventes par jour</h4><canvas id="salesChart" width="600" height="300" style="max-width:100%;"></canvas></div>';

        document.getElementById('statsContent').innerHTML = statsHTML;

        setTimeout(function() {
            var ctx = document.getElementById('salesChart')?.getContext('2d');
            if (!ctx) return;
            var labels = Object.keys(dailySales);
            var values = Object.values(dailySales);
            var maxVal = Math.max(...values, 1);
            var width = ctx.canvas.width;
            var height = ctx.canvas.height;
            var padding = 40;
            var chartWidth = width - 2 * padding;
            var chartHeight = height - 2 * padding;

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, width, height);

            ctx.beginPath();
            ctx.strokeStyle = '#cbd5e1';
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding, height - padding);
            ctx.lineTo(width - padding, height - padding);
            ctx.stroke();

            var barWidth = chartWidth / labels.length * 0.7;
            var gap = chartWidth / labels.length * 0.3;
            for (var i = 0; i < labels.length; i++) {
                var barHeight = (values[i] / maxVal) * chartHeight;
                var x = padding + i * (chartWidth / labels.length) + gap / 2;
                var y = height - padding - barHeight;
                ctx.fillStyle = '#f39c12';
                ctx.fillRect(x, y, barWidth, barHeight);

                if (i % Math.ceil(labels.length / 10) === 0) {
                    ctx.fillStyle = '#64748b';
                    ctx.font = '10px Inter';
                    ctx.fillText(labels[i].substr(5), x + barWidth/2 - 15, height - padding + 15);
                }
            }

            ctx.fillStyle = '#64748b';
            ctx.font = '10px Inter';
            ctx.fillText(maxVal.toFixed(0) + ' MAD', padding + 5, padding - 5);

        }, 100);

    } catch(e) {
        console.error(e);
        document.getElementById('statsContent').innerHTML = '<p style="text-align:center;color:#ef4444;">Erreur lors du chargement des statistiques.</p>';
    }
}

console.log('Admin JS complet avec Statistiques OK');
