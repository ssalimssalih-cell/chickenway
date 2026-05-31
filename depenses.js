// ==================== GESTION DU STOCK & DES DÉPENSES ====================

// ----- Stock : catégories (réutilisées pour le stock) -----
var stockCategories = [
    "Viande", "Poulet", "Poisson", "Légumes", "Fruits",
    "Produits laitiers", "Épices", "Huile", "Farine", "Sucre",
    "Emballages", "Sacs", "Boîtes", "Gobelets", "Serviettes",
    "Autre"
];

// ----- Variables globales pour le stock -----
var allStockData = [];
var stockSearchQuery = '';

// ----- Pagination du stock (indépendante) -----
var stockCurrentPage = 1;
var stockItemsPerPage = 15;

// ==================== PAGE PRINCIPALE (STOCK + DÉPENSES) ====================
function loadDepensesPage(c) {
    // Construction du HTML avec deux cartes : Stock, puis Dépenses
    var html = '';

    // ---------- SECTION STOCK ----------
    html += '<div class="content-card" style="margin-bottom:30px;">';
    html += '<div class="card-header">';
    html += '<h3><i class="fas fa-boxes"></i> Stock (matières premières, emballages…)</h3>';
    html += '<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">';
    html += '<input type="text" id="stockSearchInput" placeholder="🔍 Rechercher un produit..." style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px; width:200px;" onkeyup="stockSearchQuery = this.value.trim().toLowerCase(); stockCurrentPage=1; renderStockTable();">';
    html += '<button class="btn-add" onclick="openStockForm()"><i class="fas fa-plus"></i> Ajouter</button>';
    html += '<button class="btn-add" onclick="loadStock()"><i class="fas fa-sync"></i> Actualiser</button>';
    html += '</div>';
    html += '</div>'; // card-header
    html += '<div class="table-container"><table class="data-table" id="stockTable" style="font-size:0.7rem;">';
    html += '<thead><tr>';
    html += '<th>Nom</th><th>Catégorie</th><th>Prix achat (MAD)</th><th>Quantité</th><th>Unité</th><th>Qté base</th><th>Actions</th>';
    html += '</tr></thead><tbody></tbody></table></div>';
    html += '<div id="stockPagination"></div>';
    html += '</div>'; // content-card

    // ---------- SECTION DÉPENSES (existante) ----------
    var catOptions = '<option value="">Toutes les catégories</option>';
    Object.keys(depenseCategories).forEach(function(cat) {
        catOptions += '<option value="' + cat + '">' + cat + '</option>';
    });

    html += '<div class="content-card">';
    html += '<div class="card-header">';
    html += '<h3><i class="fas fa-money-bill-wave"></i> Dépenses <span id="depensesTotalDisplay" style="font-size:0.9rem;color:#16a34a;"></span></h3>';
    html += '<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">';
    html += '<input type="text" id="depensesSearchInput" placeholder="🔍 Rechercher..." style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px; width:200px;" onkeyup="depensesSearch = this.value; currentPages.depenses=1; applyDepensesFilters();">';
    html += '<select id="depensesPeriodSelect" style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px;" onchange="depensesPeriod = this.value; currentPages.depenses=1; applyDepensesFilters();">' + getPeriodOptions('all') + '</select>';
    html += '<select id="depensesCategorySelect" style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px;" onchange="depensesCategoryFilter = this.value; currentPages.depenses=1; applyDepensesFilters();">' + catOptions + '</select>';
    html += '<button class="btn-add" onclick="openDepenseForm()"><i class="fas fa-plus"></i> Nouvelle</button>';
    html += '<button class="btn-add" onclick="loadDepenses()"><i class="fas fa-sync"></i> Actualiser</button>';
    html += '</div>';
    html += '</div>'; // card-header
    html += '<div class="table-container"><table class="data-table" id="depensesTable" style="font-size:0.65rem;"><thead><tr>';
    html += '<th>ID</th><th>Titre</th><th>Catégorie</th><th>Sous‑catégorie</th><th>Montant</th><th>Description</th><th>Date</th><th>Actions</th>';
    html += '</tr></thead><tbody></tbody></table></div>';
    html += '<div id="depensesPagination"></div>';
    html += '</div>'; // content-card

    c.innerHTML = html;

    // Charger les deux sections
    loadStock();
    loadDepenses();
}

// ==================== STOCK : CHARGEMENT, AFFICHAGE, CRUD ====================
async function loadStock() {
    try {
        const snapshot = await db.collection('stock').orderBy('nom').get();
        allStockData = [];
        snapshot.forEach(d => { let dd = d.data(); dd.id = d.id; allStockData.push(dd); });
        // Mise à jour du cache
        for (let doc of allStockData) await CacheDB.set('stock', doc.id, doc);
    } catch(e) { console.error(e); }
    stockCurrentPage = 1;
    renderStockTable();
}

function renderStockTable() {
    var tb = document.querySelector('#stockTable tbody');
    if (!tb) return;

    var data = allStockData.slice();
    if (stockSearchQuery) {
        data = data.filter(function(d) {
            return (d.nom||'').toLowerCase().indexOf(stockSearchQuery) !== -1 ||
                   (d.categorie||'').toLowerCase().indexOf(stockSearchQuery) !== -1;
        });
    }

    // Pagination
    var totalPages = Math.ceil(data.length / stockItemsPerPage);
    var start = (stockCurrentPage - 1) * stockItemsPerPage;
    var pageData = data.slice(start, start + stockItemsPerPage);

    tb.innerHTML = '';
    if (pageData.length === 0) {
        tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;">Aucun produit en stock</td></tr>';
        document.getElementById('stockPagination').innerHTML = '';
        return;
    }

    for (var i = 0; i < pageData.length; i++) {
        var d = pageData[i];
        var qteBase = convertirQuantiteBase(d.quantite, d.unite);
        tb.innerHTML += '<tr>' +
            '<td><strong>' + (d.nom||'') + '</strong></td>' +
            '<td>' + (d.categorie||'-') + '</td>' +
            '<td>' + (d.prixAchat||0).toFixed(2) + '</td>' +
            '<td>' + (d.quantite||0) + '</td>' +
            '<td>' + (d.unite||'') + '</td>' +
            '<td><small>' + qteBase + '</small></td>' +
            '<td><button class="btn-edit" onclick="editStock(\'' + d.id + '\')"><i class="fas fa-edit"></i></button> ' +
            '<button class="btn-delete" onclick="deleteStock(\'' + d.id + '\')"><i class="fas fa-trash"></i></button></td>' +
            '</tr>';
    }

    // Pagination HTML
    var pagHTML = '';
    if (totalPages > 1) {
        pagHTML += '<div style="display:flex; justify-content:center; align-items:center; gap:10px; margin-top:15px; flex-wrap:wrap;">';
        pagHTML += '<button onclick="stockCurrentPage = Math.max(1, stockCurrentPage-1); renderStockTable();" ' + (stockCurrentPage <= 1 ? 'disabled' : '') + ' style="padding:8px 16px; border:1px solid #e2e8f0; border-radius:8px; background:white; cursor:pointer;">« Précédent</button>';
        pagHTML += '<span style="font-weight:600;">Page ' + stockCurrentPage + ' / ' + totalPages + '</span>';
        pagHTML += '<button onclick="stockCurrentPage = Math.min(totalPages, stockCurrentPage+1); renderStockTable();" ' + (stockCurrentPage >= totalPages ? 'disabled' : '') + ' style="padding:8px 16px; border:1px solid #e2e8f0; border-radius:8px; background:white; cursor:pointer;">Suivant »</button>';
        pagHTML += '</div>';
    }
    document.getElementById('stockPagination').innerHTML = pagHTML;
}

function openStockForm(data) {
    data = data || {};
    var selectedCategorie = data.categorie || '';

    var catOptions = '<option value="">-- Choisir --</option>';
    stockCategories.forEach(function(cat) {
        catOptions += '<option value="' + cat + '" ' + (selectedCategorie === cat ? 'selected' : '') + '>' + cat + '</option>';
    });

    var h = '';
    h += '<div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="stockNom" value="' + (data.nom || '') + '" required></div>';
    h += '<div class="form-group"><label>Catégorie</label><select id="stockCat" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;">' + catOptions + '</select></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Prix d\'achat (MAD)</label><input type="number" id="stockPA" value="' + (data.prixAchat || 0) + '" step="0.01"></div>';
    h += '<div class="form-group"><label>Quantité</label><input type="number" id="stockQte" value="' + (data.quantite || 0) + '" step="any"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Unité</label><select id="stockUnite" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:8px;">';
    var unites = ['kg', 'g', 'L', 'mL', 'pièce', 'unité', 'sac', 'carton'];
    unites.forEach(function(u) {
        h += '<option value="' + u + '" ' + (data.unite === u ? 'selected' : '') + '>' + u + '</option>';
    });
    h += '</select></div></div>';
    h += '<button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveStock()">Enregistrer</button>';

    openModal(editingId ? 'Modifier Produit Stock' : 'Nouveau Produit Stock', h);
    currentCollection = 'stock';
}

function saveStock() {
    var nom = document.getElementById('stockNom').value.trim();
    if (!nom) { alert('Nom obligatoire'); return; }
    var d = {
        nom: nom,
        categorie: document.getElementById('stockCat').value,
        prixAchat: parseFloat(document.getElementById('stockPA').value) || 0,
        quantite: parseFloat(document.getElementById('stockQte').value) || 0,
        unite: document.getElementById('stockUnite').value
    };
    if (editingId) {
        CacheDB.write('stock', editingId, d, 'update').then(function() {
            var idx = allStockData.findIndex(function(x) { return x.id === editingId; });
            if (idx !== -1) allStockData[idx] = Object.assign({}, allStockData[idx], d, { id: editingId });
            closeModal();
            renderStockTable();
            CacheDB.sync();
        });
    } else {
        CacheDB.write('stock', null, d, 'add').then(function(newId) {
            d.id = newId;
            allStockData.push(d);
            closeModal();
            renderStockTable();
            CacheDB.sync();
        });
    }
}

function editStock(id) {
    db.collection('stock').doc(id).get().then(function(doc) {
        if (doc.exists) { editingId = id; currentCollection = 'stock'; openStockForm(doc.data()); }
    });
}

async function deleteStock(id) {
    if (confirm('Supprimer ce produit du stock ?')) {
        await CacheDB.write('stock', id, null, 'delete');
        allStockData = allStockData.filter(function(x) { return x.id !== id; });
        renderStockTable();
        CacheDB.sync();
    }
}

// ----- Conversion d'unité vers une unité de base (affichage indicatif) -----
function convertirQuantiteBase(quantite, unite) {
    if (!unite) return quantite;
    switch(unite) {
        case 'kg': return (quantite * 1000).toFixed(0) + ' g';
        case 'L': return (quantite * 1000).toFixed(0) + ' mL';
        case 'g': return quantite + ' g';
        case 'mL': return quantite + ' mL';
        default: return quantite + ' ' + unite;
    }
}

// ==================== DÉPENSES (REPRISE DE L'ANCIEN CODE, LÉGÈREMENT ADAPTÉ) ====================
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

// Variables (déjà déclarées plus haut ou dans admin.js)
// depensesPeriod, depensesSearch, depensesCategoryFilter, allDepensesData, currentPages.depenses

async function loadDepenses() {
    try {
        const snapshot = await db.collection('depenses').orderBy('createdAt','desc').get();
        allDepensesData = [];
        snapshot.forEach(d => { let dd = d.data(); dd.id = d.id; allDepensesData.push(dd); });
        for (let doc of allDepensesData) await CacheDB.set('depenses', doc.id, doc);
    } catch(e) { console.error(e); }
    currentPages.depenses = 1;
    applyDepensesFilters();
}

function applyDepensesFilters() {
    var filtered = filterByPeriod(allDepensesData, depensesPeriod);
    if (depensesSearch) filtered = filterBySearch(filtered, depensesSearch, ['titre','description','categorie','sousCategories']);
    if (depensesCategoryFilter) filtered = filtered.filter(function(d){ return d.categorie === depensesCategoryFilter; });
    window.filteredDepenses = filtered;
    renderDepensesTable();
}

function renderDepensesTable() {
    var tb = document.querySelector('#depensesTable tbody');
    if (!tb) return;
    var data = (window.filteredDepenses || allDepensesData).slice();
    var total = data.reduce(function(sum, d){ return sum + (d.montant||0); }, 0);

    // Pagination
    var totalPages = Math.ceil(data.length / itemsPerPage);
    var start = (currentPages.depenses - 1) * itemsPerPage;
    var pageData = data.slice(start, start + itemsPerPage);

    tb.innerHTML = '';
    if (pageData.length === 0) {
        tb.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;">Aucune dépense</td></tr>';
        document.getElementById('depensesPagination').innerHTML = '';
        document.getElementById('depensesTotalDisplay').textContent = '';
        return;
    }

    for (var i = 0; i < pageData.length; i++) {
        var d = pageData[i];
        var dateCreated = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleDateString('fr-FR')+' '+new Date(d.createdAt.seconds*1000).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '-';
        var sousCategories = d.sousCategories ? d.sousCategories.join(', ') : '-';
        tb.innerHTML += '<tr><td><small>'+(d.id||'').substring(0,6)+'</small></td><td><strong>'+(d.titre||d.description||'-')+'</strong></td><td><small>'+(d.categorie||'-')+'</small></td><td><small>'+sousCategories+'</small></td><td style="color:#ef4444;font-weight:700;">'+(d.montant||0).toFixed(2)+' MAD</td><td><small>'+(d.description||'-')+'</small></td><td><small>'+dateCreated+'</small></td><td><button class="btn-edit" onclick="editDepense(\''+d.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDepense(\''+d.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';
    }

    document.getElementById('depensesTotalDisplay').textContent = '(Total : ' + total.toFixed(2) + ' MAD)';

    // Pagination HTML
    var pagHTML = '';
    if (totalPages > 1) {
        pagHTML += '<div style="display:flex; justify-content:center; align-items:center; gap:10px; margin-top:15px; flex-wrap:wrap;">';
        pagHTML += '<button onclick="changePage(\'depenses\', ' + (currentPages.depenses-1) + ')" ' + (currentPages.depenses <= 1 ? 'disabled' : '') + ' style="padding:8px 16px; border:1px solid #e2e8f0; border-radius:8px; background:white; cursor:pointer;">« Précédent</button>';
        pagHTML += '<span style="font-weight:600;">Page ' + currentPages.depenses + ' / ' + totalPages + '</span>';
        pagHTML += '<button onclick="changePage(\'depenses\', ' + (currentPages.depenses+1) + ')" ' + (currentPages.depenses >= totalPages ? 'disabled' : '') + ' style="padding:8px 16px; border:1px solid #e2e8f0; border-radius:8px; background:white; cursor:pointer;">Suivant »</button>';
        pagHTML += '</div>';
    }
    document.getElementById('depensesPagination').innerHTML = pagHTML;
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
    h += '<div class="form-row"><div class="form-group"><label>Autre sous‑catégorie</label><input type="text" id="depAutreSousCat" placeholder="Ajouter une sous‑catégorie non listée" style="width:100%;"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Date</label><input type="date" id="depDate" value="' + (data.date || new Date().toISOString().split('T')[0]) + '"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Description</label><textarea id="depDesc">' + (data.description || '') + '</textarea></div></div>';
    h += '<button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveDepense()">Enregistrer</button>';

    openModal(editingId ? 'Modifier Dépense' : 'Nouvelle Dépense', h);
    currentCollection = 'depenses';

    setTimeout(function() {
        updateDepSousCategories();
        if (selectedSousCategories.length > 0) {
            selectedSousCategories.forEach(function(sc) {
                var cb = document.querySelector('.dep-sous-cat-check[value="' + sc.replace(/"/g, '&quot;') + '"]');
                if (cb) cb.checked = true;
                else document.getElementById('depAutreSousCat').value = sc;
            });
        }
    }, 100);
}

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
    document.querySelectorAll('.dep-sous-cat-check:checked').forEach(function(cb) { sousCategories.push(cb.value); });
    var autre = document.getElementById('depAutreSousCat').value.trim();
    if (autre) sousCategories.push(autre);

    var d = {
        titre: titre, montant: montant, categorie: categorie,
        sousCategories: sousCategories,
        date: document.getElementById('depDate').value,
        description: document.getElementById('depDesc').value
    };

    if (editingId) {
        CacheDB.write('depenses', editingId, d, 'update').then(function() {
            closeModal();
            loadDepenses();
            CacheDB.sync();
        });
    } else {
        d.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        CacheDB.write('depenses', null, d, 'add').then(function() {
            closeModal();
            loadDepenses();
            CacheDB.sync();
        });
    }
}

function editDepense(id) {
    db.collection('depenses').doc(id).get().then(function(doc) {
        if (doc.exists) { editingId = id; currentCollection = 'depenses'; openDepenseForm(doc.data()); }
    });
}

function deleteDepense(id) {
    if (confirm('Supprimer cette dépense ?')) {
        CacheDB.write('depenses', id, null, 'delete').then(function() {
            alert('Supprimée');
            loadDepenses();
            CacheDB.sync();
        });
    }
}

console.log('Dépenses + Stock prêt');
