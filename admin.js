var editingId = null;
var currentCollection = '';
var selectedCategoryFilter = '';

// ==================== DASHBOARD ====================
function loadDashboardPage(content) {
    content.innerHTML = '<div class="stats-grid">' +
        '<div class="stat-card"><div class="stat-icon"><i class="fas fa-utensils"></i></div><div class="stat-info"><span class="stat-label">Produits</span><span class="stat-value" id="productsCount">0</span></div></div>' +
        '<div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value" id="clientsCount">0</span></div></div>' +
        '<div class="stat-card"><div class="stat-icon"><i class="fas fa-layer-group"></i></div><div class="stat-info"><span class="stat-label">Categories</span><span class="stat-value" id="categoriesCount">0</span></div></div>' +
        '<div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-cart"></i></div><div class="stat-info"><span class="stat-label">Ventes</span><span class="stat-value" id="ventesCount">0</span></div></div>' +
        '</div>' +
        '<div class="content-card">' +
        '<div class="card-header"><h3><i class="fas fa-bell"></i> Inscriptions en attente</h3></div>' +
        '<div id="pendingRegistrations" style="text-align:center;padding:10px;">Chargement...</div>' +
        '</div>';
    loadDashboardStats();
    loadPendingRegistrations();
}

function loadDashboardStats() {
    db.collection('products').get().then(function(s) { var e=document.getElementById('productsCount'); if(e)e.textContent=s.size; }).catch(function(){});
    db.collection('clients').get().then(function(s) { var e=document.getElementById('clientsCount'); if(e)e.textContent=s.size; }).catch(function(){});
    db.collection('categories').get().then(function(s) { var e=document.getElementById('categoriesCount'); if(e)e.textContent=s.size; }).catch(function(){});
    db.collection('ventes').get().then(function(s) { var e=document.getElementById('ventesCount'); if(e)e.textContent=s.size; }).catch(function(){});
}

function loadPendingRegistrations() {
    var div = document.getElementById('pendingRegistrations');
    if (!div) return;
    db.collection('users').where('authorized','==','no').orderBy('createdAt','desc').limit(5).get().then(function(snapshot) {
        if (snapshot.empty) {
            div.innerHTML = '<p style="color:#16a34a;padding:20px;"><i class="fas fa-check-circle"></i> Aucune inscription en attente</p>';
        } else {
            var html = '<div style="overflow-x:auto;"><table class="data-table" style="min-width:500px;"><thead><tr><th>Nom</th><th>Email</th><th>Role</th><th>Date</th><th>Actions</th></tr></thead><tbody>';
            snapshot.forEach(function(doc) {
                var u = doc.data();
                var date = u.createdAt ? new Date(u.createdAt.seconds*1000).toLocaleDateString('fr-FR') : 'N/A';
                html += '<tr><td><strong>' + u.prenom + ' ' + u.nom + '</strong> (@' + u.username + ')</td><td>' + u.email + '</td><td><span class="status-warning">' + u.role + '</span></td><td>' + date + '</td><td><button class="btn-add" style="padding:4px 10px;font-size:0.75rem;margin-right:5px;" onclick="approveUser(\'' + doc.id + '\')"><i class="fas fa-check"></i> Accepter</button><button class="btn-delete" style="padding:4px 10px;font-size:0.75rem;" onclick="rejectUser(\'' + doc.id + '\')"><i class="fas fa-times"></i> Refuser</button></td></tr>';
            });
            html += '</tbody></table></div>';
            div.innerHTML = html;
        }
    }).catch(function(err) {
        div.innerHTML = '<p style="color:#ef4444;">Erreur de chargement</p>';
    });
}

function approveUser(uid) {
    if (confirm('Accepter cette inscription ?')) {
        db.collection('users').doc(uid).update({
            authorized: 'yes',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: window.currentUserData ? window.currentUserData.userData.email : 'admin'
        }).then(function() {
            alert('Utilisateur accepte avec succes !');
            loadPendingRegistrations();
            if (typeof loadUsersList === 'function') loadUsersList();
        }).catch(function(err) {
            alert('Erreur: ' + err.message);
        });
    }
}

function rejectUser(uid) {
    if (confirm('Refuser cette inscription ? L\'utilisateur sera supprime.')) {
        db.collection('users').doc(uid).delete().then(function() {
            alert('Inscription refusee et utilisateur supprime.');
            loadPendingRegistrations();
            if (typeof loadUsersList === 'function') loadUsersList();
        }).catch(function(err) {
            alert('Erreur: ' + err.message);
        });
    }
}

// ==================== MODAL ====================
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

// ==================== IMAGE EN BASE64 ====================
function fileToBase64(file, callback) {
    if (!file) { callback(null); return; }
    var reader = new FileReader();
    reader.onload = function(e) { callback(e.target.result); };
    reader.onerror = function() { callback(null); };
    reader.readAsDataURL(file);
}

function previewImage(input, previewId) {
    var preview = document.getElementById(previewId);
    if (!preview) return;
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = '<img src="' + e.target.result + '" style="max-width:100px;margin-top:5px;border-radius:8px;">';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ==================== HELPERS ====================
function saveDocument(collectionName, data, callback) {
    if (editingId) {
        data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection(collectionName).doc(editingId).update(data).then(function() {
            if (callback) callback();
        }).catch(function(err) { alert('Erreur: ' + err.message); });
    } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection(collectionName).add(data).then(function() {
            if (callback) callback();
        }).catch(function(err) { alert('Erreur: ' + err.message); });
    }
}

function editDocument(collectionName, id) {
    db.collection(collectionName).doc(id).get().then(function(doc) {
        if (doc.exists) {
            editingId = id;
            currentCollection = collectionName;
            openEditForm(collectionName, doc.data());
        }
    });
}

function deleteDocument(collectionName, id) {
    if (confirm('Confirmer la suppression ?')) {
        db.collection(collectionName).doc(id).delete().then(function() {
            alert('Supprime');
            refreshCurrentPage();
        }).catch(function(err) { alert('Erreur: ' + err.message); });
    }
}

function refreshCurrentPage() {
    var title = document.getElementById('pageTitle').textContent;
    var map = {
        'Categories':'categories','Produits':'products','Clients':'clients',
        'Fournisseurs':'fournisseurs','Depenses':'depenses'
    };
    navigateTo(map[title] || 'dashboard');
}

// ==================== CATEGORIES ====================
function loadCategoriesPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-layer-group"></i> Categories</h3><button class="btn-add" onclick="openCategoryForm()"><i class="fas fa-plus"></i> Nouvelle</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Image</th><th>Nom</th><th>Description</th><th>CA</th><th>Profit</th><th>Stock</th><th>Nb Produits</th><th>Actions</th></tr></thead><tbody id="categoriesTable"></tbody></table></div></div>';
    loadCategories();
}

async function loadCategories() {
    var tbody = document.getElementById('categoriesTable');
    if (!tbody) return;
    try {
        var snapshot = await db.collection('categories').orderBy('createdAt','desc').get();
        tbody.innerHTML = '';
        if (snapshot.empty) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;">Aucune categorie</td></tr>'; return; }
        for (var i = 0; i < snapshot.docs.length; i++) {
            var doc = snapshot.docs[i], d = doc.data();
            var productsCount = 0;
            try { var ps = await db.collection('products').where('categorie','==',d.nom).get(); productsCount = ps.size; } catch(e) {}
            var imgHtml = d.imageBase64 ? '<img src="'+d.imageBase64+'" style="width:40px;height:40px;object-fit:cover;border-radius:8px;">' : '<i class="fas fa-folder fa-2x" style="color:#f39c12;"></i>';
            var profitColor = (d.profit||0) >= 0 ? '#16a34a' : '#dc2626';
            tbody.innerHTML += '<tr><td>'+imgHtml+'</td><td><strong>'+d.nom+'</strong></td><td>'+(d.description||'-')+'</td><td>'+(d.ca||0).toFixed(2)+' MAD</td><td><strong style="color:'+profitColor+';">'+(d.profit||0).toFixed(2)+' MAD</strong></td><td>'+(d.totalStock||0)+'</td><td><span class="status-success">'+productsCount+'</span></td><td><button class="btn-edit" onclick="editDocument(\'categories\',\''+doc.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'categories\',\''+doc.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';
        }
    } catch(e) { console.error(e); tbody.innerHTML = '<tr><td colspan="8">Erreur</td></tr>'; }
}

function openCategoryForm(data) {
    data = data || {};
    var imgPreview = data.imageBase64 ? '<img src="'+data.imageBase64+'" style="max-width:100px;margin-top:5px;">' : '';
    var html = '<div class="form-row"><div class="form-group"><label>Image</label><input type="file" id="catImage" accept="image/*" onchange="previewImage(this,\'catPreview\')"><div id="catPreview">'+imgPreview+'</div></div></div><div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="catNom" value="'+(data.nom||'')+'" required></div><div class="form-group"><label>Description</label><textarea id="catDesc">'+(data.description||'')+'</textarea></div></div><div class="form-row"><div class="form-group"><label>CA</label><input type="number" id="catCA" value="'+(data.ca||0)+'" step="0.01"></div><div class="form-group"><label>Profit</label><input type="number" id="catProfit" value="'+(data.profit||0)+'" step="0.01"></div></div><div class="form-row"><div class="form-group"><label>Stock Total</label><input type="number" id="catStock" value="'+(data.totalStock||0)+'"></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveCategory()">Enregistrer</button>';
    currentCollection = 'categories';
    openModal(editingId ? 'Modifier Categorie' : 'Nouvelle Categorie', html);
}

function saveCategory() {
    var nom = document.getElementById('catNom').value;
    if (!nom) { alert('Nom obligatoire'); return; }
    var imageFile = document.getElementById('catImage').files[0];
    var saveFn = function(img) {
        var data = { nom:nom, description:document.getElementById('catDesc').value, ca:parseFloat(document.getElementById('catCA').value)||0, profit:parseFloat(document.getElementById('catProfit').value)||0, totalStock:parseInt(document.getElementById('catStock').value)||0 };
        if (img) data.imageBase64 = img;
        saveDocument('categories', data, function() { closeModal(); refreshCurrentPage(); });
    };
    if (imageFile) { fileToBase64(imageFile, saveFn); } else { saveFn(null); }
}

// ==================== PRODUITS ====================
function loadProductsPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-utensils"></i> Produits</h3><div style="display:flex;gap:10px;"><select id="categoryFilter" class="role-select" style="width:auto;" onchange="filterProducts()"><option value="">Toutes categories</option></select><button class="btn-add" onclick="openProductForm()"><i class="fas fa-plus"></i> Nouveau</button></div></div><div class="table-container"><table class="data-table"><thead><tr><th>Image</th><th>Nom</th><th>Categorie</th><th>Prix Achat</th><th>Prix Vente</th><th>Profit</th><th>Prix Promo</th><th>Stock</th><th>Dispo</th><th>Actions</th></tr></thead><tbody id="productsTable"></tbody></table></div></div>';
    loadCategoriesInFilter(); loadProducts();
}

async function loadCategoriesInFilter() {
    var select = document.getElementById('categoryFilter'); if (!select) return;
    try { var snap = await db.collection('categories').get(); snap.forEach(function(doc) { select.innerHTML += '<option value="'+doc.data().nom+'">'+doc.data().nom+'</option>'; }); } catch(e) {}
}

function filterProducts() { selectedCategoryFilter = document.getElementById('categoryFilter').value; loadProducts(); }

function calculateProfit(data) {
    var pv = data.prixPromo && data.prixPromo > 0 ? data.prixPromo : (data.prixVente||0);
    return pv - (data.prixAchat||0);
}

async function loadProducts() {
    var tbody = document.getElementById('productsTable'); if (!tbody) return;
    try {
        var snap = await db.collection('products').orderBy('createdAt','desc').get();
        tbody.innerHTML = '';
        if (snap.empty) { tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;">Aucun produit</td></tr>'; return; }
        for (var i = 0; i < snap.docs.length; i++) {
            var doc = snap.docs[i], d = doc.data();
            if (selectedCategoryFilter && d.categorie !== selectedCategoryFilter) continue;
            var profit = calculateProfit(d);
            var imgHtml = d.imageBase64 ? '<img src="'+d.imageBase64+'" style="width:40px;height:40px;object-fit:cover;border-radius:8px;">' : '<div style="width:40px;height:40px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-utensils" style="color:#94a3b8;"></i></div>';
            var dispo = d.disponible !== false ? '<span class="status-success">Oui</span>' : '<span class="status-danger">Non</span>';
            var promo = d.prixPromo && d.prixPromo > 0 ? '<span style="color:#dc2626;">'+d.prixPromo.toFixed(2)+' MAD</span>' : '-';
            var profitColor = profit >= 0 ? '#16a34a' : '#dc2626';
            tbody.innerHTML += '<tr><td>'+imgHtml+'</td><td><strong>'+d.nom+'</strong></td><td>'+(d.categorie||'-')+'</td><td>'+(d.prixAchat||0).toFixed(2)+' MAD</td><td>'+(d.prixVente||0).toFixed(2)+' MAD</td><td><strong style="color:'+profitColor+';">'+profit.toFixed(2)+' MAD</strong></td><td>'+promo+'</td><td>'+(d.stock||0)+'</td><td>'+dispo+'</td><td><button class="btn-edit" onclick="editDocument(\'products\',\''+doc.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'products\',\''+doc.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';
        }
    } catch(e) { console.error(e); tbody.innerHTML = '<tr><td colspan="10">Erreur</td></tr>'; }
}

async function openProductForm(data) {
    data = data || {};
    var catOptions = '';
    try { var cs = await db.collection('categories').get(); cs.forEach(function(doc) { var sel = data.categorie===doc.data().nom?'selected':''; catOptions += '<option value="'+doc.data().nom+'" '+sel+'>'+doc.data().nom+'</option>'; }); } catch(e) {}
    var imgPreview = data.imageBase64 ? '<img src="'+data.imageBase64+'" style="max-width:100px;margin-top:5px;">' : '';
    var dispoYes = data.disponible !== false ? 'selected' : '';
    var dispoNo = data.disponible === false ? 'selected' : '';
    var html = '<div class="form-row"><div class="form-group"><label>Image</label><input type="file" id="prodImage" accept="image/*" onchange="previewImage(this,\'prodPreview\')"><div id="prodPreview">'+imgPreview+'</div></div></div><div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="prodNom" value="'+(data.nom||'')+'" required></div><div class="form-group"><label>Categorie</label><select id="prodCat"><option value="">-</option>'+catOptions+'</select></div></div><div class="form-row"><div class="form-group"><label>Prix Achat</label><input type="number" id="prodPA" value="'+(data.prixAchat||0)+'" step="0.01" onchange="calcP()"></div><div class="form-group"><label>Prix Vente</label><input type="number" id="prodPV" value="'+(data.prixVente||0)+'" step="0.01" onchange="calcP()"></div></div><div class="form-row"><div class="form-group"><label>Prix Promo</label><input type="number" id="prodPromo" value="'+(data.prixPromo||0)+'" step="0.01" onchange="calcP()"></div><div class="form-group"><label>Profit: <span id="profitPreview" style="color:#16a34a;">0.00 MAD</span></label></div></div><div class="form-row"><div class="form-group"><label>Stock</label><input type="number" id="prodStock" value="'+(data.stock||0)+'"></div><div class="form-group"><label>Temps Prep</label><input type="text" id="prodTemps" value="'+(data.tempsPrep||'')+'" placeholder="15 min"></div></div><div class="form-row"><div class="form-group"><label>Disponible</label><select id="prodDispo"><option value="1" '+dispoYes+'>Oui</option><option value="0" '+dispoNo+'>Non</option></select></div><div class="form-group"><label>Description</label><textarea id="prodDesc">'+(data.description||'')+'</textarea></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveProduct()">Enregistrer</button>';
    currentCollection = 'products';
    openModal(editingId ? 'Modifier Produit' : 'Nouveau Produit', html);
    setTimeout(calcP, 100);
}

function calcP() {
    var pa = parseFloat(document.getElementById('prodPA').value)||0, pv = parseFloat(document.getElementById('prodPV').value)||0, promo = parseFloat(document.getElementById('prodPromo').value)||0;
    var pf = promo > 0 ? promo : pv, profit = pf - pa;
    var el = document.getElementById('profitPreview'); if (el) { el.textContent = profit.toFixed(2)+' MAD'; el.style.color = profit>=0?'#16a34a':'#dc2626'; }
}

function saveProduct() {
    var nom = document.getElementById('prodNom').value; if (!nom) { alert('Nom obligatoire'); return; }
    var imageFile = document.getElementById('prodImage').files[0];
    var pa = parseFloat(document.getElementById('prodPA').value)||0, pv = parseFloat(document.getElementById('prodPV').value)||0, promo = parseFloat(document.getElementById('prodPromo').value)||0, pf = promo>0?promo:pv;
    var saveFn = function(img) {
        var data = { nom:nom, categorie:document.getElementById('prodCat').value, prixAchat:pa, prixVente:pv, prixPromo:promo, profit:pf-pa, stock:parseInt(document.getElementById('prodStock').value)||0, vendues:0, ca:0, tempsPrep:document.getElementById('prodTemps').value, disponible:document.getElementById('prodDispo').value==='1', description:document.getElementById('prodDesc').value };
        if (img) data.imageBase64 = img;
        saveDocument('products', data, function() { closeModal(); refreshCurrentPage(); });
    };
    if (imageFile) { fileToBase64(imageFile, saveFn); } else { saveFn(null); }
}

// ==================== CLIENTS ====================
function loadClientsPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-users"></i> Clients</h3><button class="btn-add" onclick="openClientForm()"><i class="fas fa-plus"></i> Ajouter</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Nom</th><th>Prenom</th><th>Tel</th><th>CA</th><th>Points</th><th>Actions</th></tr></thead><tbody id="clientsTable"></tbody></table></div></div>';
    db.collection('clients').orderBy('createdAt','desc').get().then(function(snap) {
        var tbody = document.getElementById('clientsTable'); tbody.innerHTML = '';
        if (snap.empty) { tbody.innerHTML = '<tr><td colspan="6">Aucun</td></tr>'; return; }
        snap.forEach(function(doc) { var d=doc.data(); tbody.innerHTML += '<tr><td><strong>'+d.nom+'</strong></td><td>'+d.prenom+'</td><td>'+(d.telephone||'-')+'</td><td>'+(d.ca||0).toFixed(2)+' MAD</td><td>'+(d.points||0)+'</td><td><button class="btn-edit" onclick="editDocument(\'clients\',\''+doc.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'clients\',\''+doc.id+'\')"><i class="fas fa-trash"></i></button></td></tr>'; });
    });
}

function openClientForm(data) {
    data = data || {};
    var html = '<div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="cliNom" value="'+(data.nom||'')+'" required></div><div class="form-group"><label>Prenom *</label><input type="text" id="cliPrenom" value="'+(data.prenom||'')+'" required></div></div><div class="form-row"><div class="form-group"><label>Tel</label><input type="text" id="cliTel" value="'+(data.telephone||'')+'"></div><div class="form-group"><label>CA</label><input type="number" id="cliCA" value="'+(data.ca||0)+'" step="0.01"></div></div><div class="form-row"><div class="form-group"><label>Points</label><input type="number" id="cliPoints" value="'+(data.points||0)+'"></div><div class="form-group"><label>Description</label><textarea id="cliDesc
