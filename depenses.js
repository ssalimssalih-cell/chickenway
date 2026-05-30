// ==================== GESTION DES DÉPENSES (HIÉRARCHIQUE + SAISIE AUTRE) ====================

// Structure des catégories et sous‑catégories
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

// ==================== PAGE PRINCIPALE ====================
function loadDepensesPage(c) {
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-money-bill-wave"></i> Dépenses</h3><button class="btn-add" onclick="openDepenseForm()"><i class="fas fa-plus"></i> Nouvelle</button></div><div class="table-container"><table class="data-table" id="depensesTable" style="font-size:0.65rem;"><thead><tr>'+
        makeSortableHeader('depenses','id','ID','loadDepenses')+
        makeSortableHeader('depenses','titre','Titre','loadDepenses')+
        '<th>Catégorie</th><th>Sous‑catégorie</th>'+
        makeSortableHeader('depenses','montant','Montant','loadDepenses')+
        makeSortableHeader('depenses','description','Description','loadDepenses')+
        makeSortableHeader('depenses','createdAt','Date','loadDepenses')+
        '<th>Actions</th></tr></thead><tbody></tbody></table></div><div id="depensesPagination"></div></div>';
    loadDepenses();
}

// ==================== CHARGEMENT DES DONNÉES ====================
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

// ==================== AFFICHAGE DU TABLEAU ====================
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

// ==================== FORMULAIRE (CATÉGORIE → SOUS‑CATÉGORIES + CHAMP MANUEL) ====================
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
    h += '<div class="form-row"><div class="form-group"><label>Autre sous‑catégorie (manuelle)</label><input type="text" id="depAutreSousCat" placeholder="Ajouter une sous‑catégorie non listée" style="width:100%;"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Date</label><input type="date" id="depDate" value="' + (data.date || new Date().toISOString().split('T')[0]) + '"></div></div>';
    h += '<div class="form-row"><div class="form-group"><label>Description</label><textarea id="depDesc">' + (data.description || '') + '</textarea></div></div>';
    h += '<button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveDepense()">Enregistrer</button>';

    currentCollection = 'depenses';
    openModal(editingId ? 'Modifier Dépense' : 'Nouvelle Dépense', h);

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
    document.querySelectorAll('.dep-sous-cat-check:checked').forEach(function(cb) {
        sousCategories.push(cb.value);
    });
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
