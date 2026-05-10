var currentUser = null;
var currentUserData = null;
var editingId = null;
var currentCollection = '';
var selectedCategoryFilter = '';

// Initialisation
setTimeout(function() {
    initApp();
}, 300);

function initApp() {
    console.log('Chicken Way Started');
    
    var authPage = document.getElementById('authPage');
    var dashboardPage = document.getElementById('dashboardPage');
    var clientPage = document.getElementById('clientPage');
    
    if (!authPage || !dashboardPage || !clientPage) {
        console.error('Elements manquants');
        return;
    }
    
    dashboardPage.classList.add('hidden');
    clientPage.classList.add('hidden');
    authPage.classList.remove('hidden');
    
    auth.onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            db.collection('users').doc(user.uid).get().then(function(doc) {
                if (!doc.exists) {
                    auth.signOut();
                    showAuthPage();
                    return;
                }
                var userData = doc.data();
                if (userData.authorized !== 'yes') {
                    auth.signOut();
                    showAuthPage();
                    setTimeout(function() {
                        showLoginError('Compte en attente de validation.');
                    }, 300);
                    return;
                }
                currentUserData = { uid: doc.id, userData: userData };
                localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                if (userData.role === 'client') {
                    showClientPage();
                } else {
                    showDashboard();
                }
            }).catch(function(err) {
                console.error('Erreur user:', err);
                auth.signOut();
                showAuthPage();
            });
        } else {
            currentUser = null;
            currentUserData = null;
            localStorage.removeItem('currentUser');
            showAuthPage();
        }
    });
    
    showLogin();
}

function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
}

function toggleClientSidebar() {
    var sidebar = document.getElementById('clientSidebar');
    var overlay = document.getElementById('clientSidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
}

function showAuthPage() {
    document.getElementById('authPage').classList.remove('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('clientPage').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    document.getElementById('clientPage').classList.add('hidden');
    buildMenu();
    updateSidebarUserInfo();
    if (currentUserData && currentUserData.userData.role === 'caissier') {
        navigateTo('pos');
    } else {
        navigateTo('dashboard');
    }
}

function showClientPage() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('clientPage').classList.remove('hidden');
    updateClientSidebarInfo();
    clientNavigate('commander');
}

function showLogin() {
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('registerContainer').classList.add('hidden');
    hideLoginError();
}

function showRegister() {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('registerContainer').classList.remove('hidden');
    hideLoginError();
}

function buildMenu() {
    var menu = document.getElementById('navMenu');
    if (!menu) return;
    menu.innerHTML = '';
    var items = [];
    
    if (currentUserData && currentUserData.userData.role === 'admin') {
        items = [
            {p:'dashboard',i:'fa-th-large',l:'Dashboard'},
            {p:'pos',i:'fa-cash-register',l:'POS'},
            {p:'categories',i:'fa-layer-group',l:'Categories'},
            {p:'products',i:'fa-utensils',l:'Produits'},
            {p:'clients',i:'fa-users',l:'Clients'},
            {p:'fournisseurs',i:'fa-truck',l:'Fournisseurs'},
            {p:'depenses',i:'fa-money-bill-wave',l:'Depenses'},
            {p:'options',i:'fa-cog',l:'Options'}
        ];
        document.getElementById('sidebarRole').textContent = 'Admin';
    } else if (currentUserData && currentUserData.userData.role === 'caissier') {
        items = [{p:'pos',i:'fa-cash-register',l:'POS'}];
        document.getElementById('sidebarRole').textContent = 'Caissier';
    }
    
    items.forEach(function(item) {
        var li = document.createElement('li');
        li.className = 'nav-item';
        li.onclick = function() { navigateTo(item.p); };
        li.innerHTML = '<i class="fas ' + item.i + '"></i> ' + item.l;
        menu.appendChild(li);
    });
}

function navigateTo(page) {
    if (!currentUserData || currentUserData.userData.authorized !== 'yes') {
        auth.signOut();
        showAuthPage();
        return;
    }
    
    var items = document.querySelectorAll('#navMenu .nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    
    var pages = ['dashboard','pos','categories','products','clients','fournisseurs','ventes','credits','depenses','statistiques','options'];
    var index = pages.indexOf(page);
    if (index >= 0 && items[index]) items[index].classList.add('active');
    
    var titles = {
        dashboard:'Dashboard',pos:'Point de Vente',categories:'Categories',products:'Produits',
        clients:'Clients',fournisseurs:'Fournisseurs',ventes:'Ventes',credits:'Credits',
        depenses:'Depenses',statistiques:'Statistiques',options:'Options'
    };
    var icons = {
        dashboard:'fa-th-large',pos:'fa-cash-register',categories:'fa-layer-group',
        products:'fa-utensils',clients:'fa-users',fournisseurs:'fa-truck',
        ventes:'fa-shopping-cart',credits:'fa-credit-card',depenses:'fa-money-bill-wave',
        statistiques:'fa-chart-bar',options:'fa-cog'
    };
    
    document.getElementById('pageTitle').textContent = titles[page] || 'Page';
    var hi = document.querySelector('.header-title i');
    if (hi && icons[page]) hi.className = 'fas ' + icons[page];
    
    var content = document.getElementById('dynamicContent');
    if (!content) return;
    
    selectedCategoryFilter = '';
    
    if (page === 'pos') loadPosPage(content);
    else if (page === 'categories') loadCategoriesPage(content);
    else if (page === 'products') loadProductsPage(content);
    else if (page === 'clients') loadClientsPage(content);
    else if (page === 'fournisseurs') loadFournisseursPage(content);
    else if (page === 'depenses') loadDepensesPage(content);
    else if (page === 'options') loadOptionsPage(content);
    else if (page === 'dashboard') loadDashboardPage(content);
    else content.innerHTML = '<div class="content-card"><h3>' + (titles[page] || 'Page') + '</h3><p style="text-align:center;padding:40px;">En developpement</p></div>';
}

// ==================== DASHBOARD ====================
function loadDashboardPage(content) {
    content.innerHTML = '<div class="stats-grid">' +
        '<div class="stat-card"><div class="stat-icon"><i class="fas fa-utensils"></i></div><div class="stat-info"><span class="stat-label">Produits</span><span class="stat-value" id="productsCount">0</span></div></div>' +
        '<div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value" id="clientsCount">0</span></div></div>' +
        '<div class="stat-card"><div class="stat-icon"><i class="fas fa-layer-group"></i></div><div class="stat-info"><span class="stat-label">Categories</span><span class="stat-value" id="categoriesCount">0</span></div></div>' +
        '<div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-cart"></i></div><div class="stat-info"><span class="stat-label">Ventes</span><span class="stat-value" id="ventesCount">0</span></div></div>' +
        '</div>';
    loadDashboardStats();
}

function loadDashboardStats() {
    db.collection('products').get().then(function(s) {
        var e = document.getElementById('productsCount');
        if (e) e.textContent = s.size;
    }).catch(function() {});
    db.collection('clients').get().then(function(s) {
        var e = document.getElementById('clientsCount');
        if (e) e.textContent = s.size;
    }).catch(function() {});
    db.collection('categories').get().then(function(s) {
        var e = document.getElementById('categoriesCount');
        if (e) e.textContent = s.size;
    }).catch(function() {});
    db.collection('ventes').get().then(function(s) {
        var e = document.getElementById('ventesCount');
        if (e) e.textContent = s.size;
    }).catch(function() {});
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
    if (!file) {
        callback(null);
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        callback(e.target.result);
    };
    reader.onerror = function() {
        callback(null);
    };
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
        }).catch(function(err) {
            alert('Erreur: ' + err.message);
        });
    } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        db.collection(collectionName).add(data).then(function() {
            if (callback) callback();
        }).catch(function(err) {
            alert('Erreur: ' + err.message);
        });
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
        }).catch(function(err) {
            alert('Erreur: ' + err.message);
        });
    }
}

function refreshCurrentPage() {
    var title = document.getElementById('pageTitle').textContent;
    var map = {
        'Categories':'categories',
        'Produits':'products',
        'Clients':'clients',
        'Fournisseurs':'fournisseurs',
        'Depenses':'depenses'
    };
    navigateTo(map[title] || 'dashboard');
}

// ==================== CATEGORIES ====================
function loadCategoriesPage(content) {
    content.innerHTML = '<div class="content-card">' +
        '<div class="card-header"><h3><i class="fas fa-layer-group"></i> Categories</h3><button class="btn-add" onclick="openCategoryForm()"><i class="fas fa-plus"></i> Nouvelle</button></div>' +
        '<div class="table-container"><table class="data-table"><thead><tr><th>Image</th><th>Nom</th><th>Description</th><th>CA</th><th>Profit</th><th>Stock</th><th>Nb Produits</th><th>Actions</th></tr></thead><tbody id="categoriesTable"></tbody></table></div></div>';
    loadCategories();
}

async function loadCategories() {
    var tbody = document.getElementById('categoriesTable');
    if (!tbody) return;
    
    try {
        var snapshot = await db.collection('categories').orderBy('createdAt','desc').get();
        tbody.innerHTML = '';
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;">Aucune categorie</td></tr>';
            return;
        }
        
        for (var i = 0; i < snapshot.docs.length; i++) {
            var doc = snapshot.docs[i];
            var d = doc.data();
            var productsCount = 0;
            try {
                var ps = await db.collection('products').where('categorie', '==', d.nom).get();
                productsCount = ps.size;
            } catch(e) {}
            
            var imgHtml = d.imageBase64 
                ? '<img src="' + d.imageBase64 + '" style="width:40px;height:40px;object-fit:cover;border-radius:8px;">'
                : '<i class="fas fa-folder fa-2x" style="color:#f39c12;"></i>';
            
            var profitColor = (d.profit || 0) >= 0 ? '#16a34a' : '#dc2626';
            
            var row = '<tr>';
            row += '<td>' + imgHtml + '</td>';
            row += '<td><strong>' + d.nom + '</strong></td>';
            row += '<td>' + (d.description || '-') + '</td>';
            row += '<td>' + (d.ca || 0).toFixed(2) + ' MAD</td>';
            row += '<td><strong style="color:' + profitColor + ';">' + (d.profit || 0).toFixed(2) + ' MAD</strong></td>';
            row += '<td>' + (d.totalStock || 0) + '</td>';
            row += '<td><span class="status-success">' + productsCount + '</span></td>';
            row += '<td><button class="btn-edit" onclick="editDocument(\'categories\',\'' + doc.id + '\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'categories\',\'' + doc.id + '\')"><i class="fas fa-trash"></i></button></td>';
            row += '</tr>';
            tbody.innerHTML += row;
        }
    } catch(e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Erreur</td></tr>';
    }
}

function openCategoryForm(data) {
    data = data || {};
    var imgPreview = data.imageBase64 ? '<img src="' + data.imageBase64 + '" style="max-width:100px;margin-top:5px;">' : '';
    
    var html = '<div class="form-row">' +
        '<div class="form-group"><label>Image</label><input type="file" id="catImage" accept="image/*" onchange="previewImage(this,\'catPreview\')"><div id="catPreview">' + imgPreview + '</div></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Nom *</label><input type="text" id="catNom" value="' + (data.nom || '') + '" required></div>' +
        '<div class="form-group"><label>Description</label><textarea id="catDesc">' + (data.description || '') + '</textarea></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>CA</label><input type="number" id="catCA" value="' + (data.ca || 0) + '" step="0.01"></div>' +
        '<div class="form-group"><label>Profit</label><input type="number" id="catProfit" value="' + (data.profit || 0) + '" step="0.01"></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Stock Total</label><input type="number" id="catStock" value="' + (data.totalStock || 0) + '"></div>' +
        '</div>' +
        '<button class="btn-cancel" onclick="closeModal()">Annuler</button>' +
        '<button class="btn-save" onclick="saveCategory()">Enregistrer</button>';
    
    currentCollection = 'categories';
    openModal(editingId ? 'Modifier Categorie' : 'Nouvelle Categorie', html);
}

function saveCategory() {
    var nom = document.getElementById('catNom').value;
    if (!nom) { alert('Nom obligatoire'); return; }
    
    var imageFile = document.getElementById('catImage').files[0];
    
    var saveData = function(imageBase64) {
        var data = {
            nom: nom,
            description: document.getElementById('catDesc').value,
            ca: parseFloat(document.getElementById('catCA').value) || 0,
            profit: parseFloat(document.getElementById('catProfit').value) || 0,
            totalStock: parseInt(document.getElementById('catStock').value) || 0
        };
        if (imageBase64) data.imageBase64 = imageBase64;
        
        saveDocument('categories', data, function() {
            closeModal();
            refreshCurrentPage();
        });
    };
    
    if (imageFile) {
        fileToBase64(imageFile, saveData);
    } else {
        saveData(null);
    }
}

// ==================== PRODUITS ====================
function loadProductsPage(content) {
    content.innerHTML = '<div class="content-card">' +
        '<div class="card-header"><h3><i class="fas fa-utensils"></i> Produits</h3>' +
        '<div style="display:flex;gap:10px;"><select id="categoryFilter" class="role-select" style="width:auto;" onchange="filterProducts()"><option value="">Toutes categories</option></select>' +
        '<button class="btn-add" onclick="openProductForm()"><i class="fas fa-plus"></i> Nouveau</button></div></div>' +
        '<div class="table-container"><table class="data-table"><thead><tr><th>Image</th><th>Nom</th><th>Categorie</th><th>Prix Achat</th><th>Prix Vente</th><th>Profit</th><th>Prix Promo</th><th>Stock</th><th>Dispo</th><th>Actions</th></tr></thead><tbody id="productsTable"></tbody></table></div></div>';
    loadCategoriesInFilter();
    loadProducts();
}

async function loadCategoriesInFilter() {
    var select = document.getElementById('categoryFilter');
    if (!select) return;
    try {
        var snapshot = await db.collection('categories').get();
        snapshot.forEach(function(doc) {
            select.innerHTML += '<option value="' + doc.data().nom + '">' + doc.data().nom + '</option>';
        });
    } catch(e) {}
}

function filterProducts() {
    selectedCategoryFilter = document.getElementById('categoryFilter').value;
    loadProducts();
}

function calculateProfit(data) {
    var pv = data.prixPromo && data.prixPromo > 0 ? data.prixPromo : (data.prixVente || 0);
    return pv - (data.prixAchat || 0);
}

async function loadProducts() {
    var tbody = document.getElementById('productsTable');
    if (!tbody) return;
    
    try {
        var snapshot = await db.collection('products').orderBy('createdAt','desc').get();
        tbody.innerHTML = '';
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;">Aucun produit</td></tr>';
            return;
        }
        
        for (var i = 0; i < snapshot.docs.length; i++) {
            var doc = snapshot.docs[i];
            var d = doc.data();
            if (selectedCategoryFilter && d.categorie !== selectedCategoryFilter) continue;
            
            var profit = calculateProfit(d);
            var imgHtml = d.imageBase64 
                ? '<img src="' + d.imageBase64 + '" style="width:40px;height:40px;object-fit:cover;border-radius:8px;">'
                : '<div style="width:40px;height:40px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-utensils" style="color:#94a3b8;"></i></div>';
            
            var dispo = d.disponible !== false ? '<span class="status-success">Oui</span>' : '<span class="status-danger">Non</span>';
            var promo = d.prixPromo && d.prixPromo > 0 ? '<span style="color:#dc2626;">' + d.prixPromo.toFixed(2) + ' MAD</span>' : '-';
            var profitColor = profit >= 0 ? '#16a34a' : '#dc2626';
            
            var row = '<tr>';
            row += '<td>' + imgHtml + '</td>';
            row += '<td><strong>' + d.nom + '</strong></td>';
            row += '<td>' + (d.categorie || '-') + '</td>';
            row += '<td>' + (d.prixAchat || 0).toFixed(2) + ' MAD</td>';
            row += '<td>' + (d.prixVente || 0).toFixed(2) + ' MAD</td>';
            row += '<td><strong style="color:' + profitColor + ';">' + profit.toFixed(2) + ' MAD</strong></td>';
            row += '<td>' + promo + '</td>';
            row += '<td>' + (d.stock || 0) + '</td>';
            row += '<td>' + dispo + '</td>';
            row += '<td><button class="btn-edit" onclick="editDocument(\'products\',\'' + doc.id + '\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'products\',\'' + doc.id + '\')"><i class="fas fa-trash"></i></button></td>';
            row += '</tr>';
            tbody.innerHTML += row;
        }
    } catch(e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Erreur</td></tr>';
    }
}

async function openProductForm(data) {
    data = data || {};
    var catOptions = '';
    try {
        var cs = await db.collection('categories').get();
        cs.forEach(function(doc) {
            var sel = data.categorie === doc.data().nom ? 'selected' : '';
            catOptions += '<option value="' + doc.data().nom + '" ' + sel + '>' + doc.data().nom + '</option>';
        });
    } catch(e) {}
    
    var imgPreview = data.imageBase64 ? '<img src="' + data.imageBase64 + '" style="max-width:100px;margin-top:5px;">' : '';
    var dispoYes = data.disponible !== false ? 'selected' : '';
    var dispoNo = data.disponible === false ? 'selected' : '';
    
    var html = '<div class="form-row"><div class="form-group"><label>Image</label><input type="file" id="prodImage" accept="image/*" onchange="previewImage(this,\'prodPreview\')"><div id="prodPreview">' + imgPreview + '</div></div></div>' +
        '<div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="prodNom" value="' + (data.nom || '') + '" required></div>' +
        '<div class="form-group"><label>Categorie</label><select id="prodCat"><option value="">-</option>' + catOptions + '</select></div></div>' +
        '<div class="form-row"><div class="form-group"><label>Prix Achat</label><input type="number" id="prodPA" value="' + (data.prixAchat || 0) + '" step="0.01" onchange="calcP()"></div>' +
        '<div class="form-group"><label>Prix Vente</label><input type="number" id="prodPV" value="' + (data.prixVente || 0) + '" step="0.01" onchange="calcP()"></div></div>' +
        '<div class="form-row"><div class="form-group"><label>Prix Promo</label><input type="number" id="prodPromo" value="' + (data.prixPromo || 0) + '" step="0.01" onchange="calcP()"></div>' +
        '<div class="form-group"><label>Profit: <span id="profitPreview" style="color:#16a34a;">0.00 MAD</span></label></div></div>' +
        '<div class="form-row"><div class="form-group"><label>Stock</label><input type="number" id="prodStock" value="' + (data.stock || 0) + '"></div>' +
        '<div class="form-group"><label>Temps Prep</label><input type="text" id="prodTemps" value="' + (data.tempsPrep || '') + '" placeholder="15 min"></div></div>' +
        '<div class="form-row"><div class="form-group"><label>Disponible</label><select id="prodDispo"><option value="1" ' + dispoYes + '>Oui</option><option value="0" ' + dispoNo + '>Non</option></select></div>' +
        '<div class="form-group"><label>Description</label><textarea id="prodDesc">' + (data.description || '') + '</textarea></div></div>' +
        '<button class="btn-cancel" onclick="closeModal()">Annuler</button>' +
        '<button class="btn-save" onclick="saveProduct()">Enregistrer</button>';
    
    currentCollection = 'products';
    openModal(editingId ? 'Modifier Produit' : 'Nouveau Produit', html);
    setTimeout(calcP, 100);
}

function calcP() {
    var pa = parseFloat(document.getElementById('prodPA').value) || 0;
    var pv = parseFloat(document.getElementById('prodPV').value) || 0;
    var promo = parseFloat(document.getElementById('prodPromo').value) || 0;
    var pf = promo > 0 ? promo : pv;
    var profit = pf - pa;
    var el = document.getElementById('profitPreview');
    if (el) {
        el.textContent = profit.toFixed(2) + ' MAD';
        el.style.color = profit >= 0 ? '#16a34a' : '#dc2626';
    }
}

function saveProduct() {
    var nom = document.getElementById('prodNom').value;
    if (!nom) { alert('Nom obligatoire'); return; }
    
    var imageFile = document.getElementById('prodImage').files[0];
    var pa = parseFloat(document.getElementById('prodPA').value) || 0;
    var pv = parseFloat(document.getElementById('prodPV').value) || 0;
    var promo = parseFloat(document.getElementById('prodPromo').value) || 0;
    var pf = promo > 0 ? promo : pv;
    
    var saveFn = function(imageBase64) {
        var data = {
            nom: nom,
            categorie: document.getElementById('prodCat').value,
            prixAchat: pa,
            prixVente: pv,
            prixPromo: promo,
            profit: pf - pa,
            stock: parseInt(document.getElementById('prodStock').value) || 0,
            vendues: 0,
            ca: 0,
            tempsPrep: document.getElementById('prodTemps').value,
            disponible: document.getElementById('prodDispo').value === '1',
            description: document.getElementById('prodDesc').value
        };
        if (imageBase64) data.imageBase64 = imageBase64;
        
        saveDocument('products', data, function() {
            closeModal();
            refreshCurrentPage();
        });
    };
    
    if (imageFile) {
        fileToBase64(imageFile, saveFn);
    } else {
        saveFn(null);
    }
}

// ==================== CLIENTS ====================
function loadClientsPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-users"></i> Clients</h3><button class="btn-add" onclick="openClientForm()"><i class="fas fa-plus"></i> Ajouter</button></div>' +
        '<div class="table-container"><table class="data-table"><thead><tr><th>Nom</th><th>Prenom</th><th>Tel</th><th>CA</th><th>Points</th><th>Actions</th></tr></thead><tbody id="clientsTable"></tbody></table></div></div>';
    
    db.collection('clients').orderBy('createdAt','desc').get().then(function(snapshot) {
        var tbody = document.getElementById('clientsTable');
        tbody.innerHTML = '';
        if (snapshot.empty) { tbody.innerHTML = '<tr><td colspan="6">Aucun</td></tr>'; return; }
        snapshot.forEach(function(doc) {
            var d = doc.data();
            tbody.innerHTML += '<tr><td><strong>' + d.nom + '</strong></td><td>' + d.prenom + '</td><td>' + (d.telephone || '-') + '</td><td>' + (d.ca || 0).toFixed(2) + ' MAD</td><td>' + (d.points || 0) + '</td><td><button class="btn-edit" onclick="editDocument(\'clients\',\'' + doc.id + '\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'clients\',\'' + doc.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
        });
    });
}

function openClientForm(data) {
    data = data || {};
    var html = '<div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="cliNom" value="' + (data.nom || '') + '" required></div><div class="form-group"><label>Prenom *</label><input type="text" id="cliPrenom" value="' + (data.prenom || '') + '" required></div></div>' +
        '<div class="form-row"><div class="form-group"><label>Tel</label><input type="text" id="cliTel" value="' + (data.telephone || '') + '"></div><div class="form-group"><label>CA</label><input type="number" id="cliCA" value="' + (data.ca || 0) + '" step="0.01"></div></div>' +
        '<div class="form-row"><div class="form-group"><label>Points</label><input type="number" id="cliPoints" value="' + (data.points || 0) + '"></div><div class="form-group"><label>Description</label><textarea id="cliDesc">' + (data.description || '') + '</textarea></div></div>' +
        '<button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveClient()">Enregistrer</button>';
    currentCollection = 'clients';
    openModal(editingId ? 'Modifier Client' : 'Nouveau Client', html);
}

function saveClient() {
    var nom = document.getElementById('cliNom').value;
    var prenom = document.getElementById('cliPrenom').value;
    if (!nom || !prenom) { alert('Nom et Prenom obligatoires'); return; }
    var data = {
        nom: nom, prenom: prenom,
        telephone: document.getElementById('cliTel').value,
        ca: parseFloat(document.getElementById('cliCA').value) || 0,
        points: parseInt(document.getElementById('cliPoints').value) || 0,
        description: document.getElementById('cliDesc').value
    };
    saveDocument('clients', data, function() { closeModal(); refreshCurrentPage(); });
}

// ==================== FOURNISSEURS ====================
function loadFournisseursPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-truck"></i> Fournisseurs</h3><button class="btn-add" onclick="openFournisseurForm()"><i class="fas fa-plus"></i> Ajouter</button></div>' +
        '<div class="table-container"><table class="data-table"><thead><tr><th>Nom</th><th>Prenom</th><th>Tel</th><th>Actions</th></tr></thead><tbody id="fournisseursTable"></tbody></table></div></div>';
    db.collection('fournisseurs').orderBy('createdAt','desc').get().then(function(snapshot) {
        var tbody = document.getElementById('fournisseursTable');
        tbody.innerHTML = '';
        if (snapshot.empty) { tbody.innerHTML = '<tr><td colspan="4">Aucun</td></tr>'; return; }
        snapshot.forEach(function(doc) {
            var d = doc.data();
            tbody.innerHTML += '<tr><td><strong>' + d.nom + '</strong></td><td>' + d.prenom + '</td><td>' + (d.telephone || '-') + '</td><td><button class="btn-edit" onclick="editDocument(\'fournisseurs\',\'' + doc.id + '\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'fournisseurs\',\'' + doc.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
        });
    });
}

function openFournisseurForm(data) {
    data = data || {};
    var html = '<div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="fourNom" value="' + (data.nom || '') + '" required></div><div class="form-group"><label>Prenom *</label><input type="text" id="fourPrenom" value="' + (data.prenom || '') + '" required></div></div>' +
        '<div class="form-row"><div class="form-group"><label>Tel</label><input type="text" id="fourTel" value="' + (data.telephone || '') + '"></div><div class="form-group"><label>Description</label><textarea id="fourDesc">' + (data.description || '') + '</textarea></div></div>' +
        '<button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveFournisseur()">Enregistrer</button>';
    currentCollection = 'fournisseurs';
    openModal(editingId ? 'Modifier Fournisseur' : 'Nouveau Fournisseur', html);
}

function saveFournisseur() {
    var nom = document.getElementById('fourNom').value;
    var prenom = document.getElementById('fourPrenom').value;
    if (!nom || !prenom) { alert('Nom et Prenom obligatoires'); return; }
    var data = {
        nom: nom, prenom: prenom,
        telephone: document.getElementById('fourTel').value,
        description: document.getElementById('fourDesc').value
    };
    saveDocument('fournisseurs', data, function() { closeModal(); refreshCurrentPage(); });
}

// ==================== DEPENSES ====================
function loadDepensesPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-money-bill-wave"></i> Depenses</h3><button class="btn-add" onclick="openDepenseForm()"><i class="fas fa-plus"></i> Ajouter</button></div>' +
        '<div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Description</th><th>Montant</th><th>Actions</th></tr></thead><tbody id="depensesTable"></tbody></table></div></div>';
    db.collection('depenses').orderBy('createdAt','desc').get().then(function(snapshot) {
        var tbody = document.getElementById('depensesTable');
        tbody.innerHTML = '';
        if (snapshot.empty) { tbody.innerHTML = '<tr><td colspan="4">Aucune</td></tr>'; return; }
        snapshot.forEach(function(doc) {
            var d = doc.data();
            tbody.innerHTML += '<tr><td>' + (d.date || '-') + '</td><td>' + (d.description || '-') + '</td><td><strong style="color:#ef4444;">' + (d.montant || 0).toFixed(2) + ' MAD</strong></td><td><button class="btn-edit" onclick="editDocument(\'depenses\',\'' + doc.id + '\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'depenses\',\'' + doc.id + '\')"><i class="fas fa-trash"></i></button></td></tr>';
        });
    });
}

function openDepenseForm(data) {
    data = data || {};
    var html = '<div class="form-row"><div class="form-group"><label>Date</label><input type="date" id="depDate" value="' + (data.date || new Date().toISOString().split('T')[0]) + '"></div><div class="form-group"><label>Montant *</label><input type="number" id="depMontant" value="' + (data.montant || 0) + '" step="0.01" required></div></div>' +
        '<div class="form-row"><div class="form-group"><label>Description</label><textarea id="depDesc">' + (data.description || '') + '</textarea></div></div>' +
        '<button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveDepense()">Enregistrer</button>';
    currentCollection = 'depenses';
    openModal(editingId ? 'Modifier Depense' : 'Nouvelle Depense', html);
}

function saveDepense() {
    var montant = parseFloat(document.getElementById('depMontant').value) || 0;
    if (!montant) { alert('Montant obligatoire'); return; }
    var data = {
        date: document.getElementById('depDate').value,
        montant: montant,
        description: document.getElementById('depDesc').value
    };
    saveDocument('depenses', data, function() { closeModal(); refreshCurrentPage(); });
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
    if (!currentUserData || currentUserData.userData.role !== 'admin') {
        content.innerHTML = '<div class="content-card"><p>Acces refuse</p></div>';
        return;
    }
    content.innerHTML = '<div class="stats-grid" style="margin-bottom:20px;">' +
        '<div class="stat-card"><div class="stat-icon" style="background:#fef3c7;"><i class="fas fa-clock" style="color:#d97706;"></i></div><div class="stat-info"><span class="stat-label">En attente</span><span class="stat-value" id="pendingCount">0</span></div></div>' +
        '<div class="stat-card"><div class="stat-icon" style="background:#dcfce7;"><i class="fas fa-check-circle" style="color:#16a34a;"></i></div><div class="stat-info"><span class="stat-label">Autorises</span><span class="stat-value" id="authorizedCount">0</span></div></div>' +
        '<div class="stat-card"><div class="stat-icon" style="background:#e0e7ff;"><i class="fas fa-users" style="color:#4f46e5;"></i></div><div class="stat-info"><span class="stat-label">Total</span><span class="stat-value" id="totalUsers">0</span></div></div>' +
        '</div><div class="content-card"><div class="card-header"><h3>Utilisateurs</h3><button class="btn-add" onclick="loadUsersList()">Actualiser</button></div>' +
        '<div class="table-container"><table class="data-table"><thead><tr><th>Username</th><th>Nom</th><th>Email</th><th>Role</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="usersTableBody"></tbody></table></div></div>';
    loadUsersList();
}

function loadUsersList() {
    db.collection('users').orderBy('createdAt','desc').get().then(function(snapshot) {
        var pending = 0, authorized = 0;
        var tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';
        if (snapshot.empty) { tbody.innerHTML = '<tr><td colspan="6">Aucun</td></tr>'; return; }
        snapshot.forEach(function(doc) {
            var u = doc.data(), id = doc.id;
            if (u.authorized === 'no') pending++; else authorized++;
            var badge = u.authorized === 'yes' ? '<span class="status-success">Autorise</span>' : '<span class="status-warning">En attente</span>';
            var btn = u.authorized === 'no' ? '<button class="btn-add" style="padding:4px 8px;font-size:0.7rem;margin-right:5px;" onclick="authorizeUser(\'' + id + '\')">Autoriser</button><button class="btn-delete" onclick="deleteUser(\'' + id + '\')">Supprimer</button>' : '<button style="padding:4px 8px;font-size:0.7rem;margin-right:5px;color:#d97706;border:none;cursor:pointer;" onclick="deauthorizeUser(\'' + id + '\')">Bloquer</button><button class="btn-delete" onclick="deleteUser(\'' + id + '\')">Supprimer</button>';
            tbody.innerHTML += '<tr><td>@' + u.username + '</td><td>' + u.prenom + ' ' + u.nom + '</td><td>' + u.email + '</td><td>' + u.role + '</td><td>' + badge + '</td><td>' + btn + '</td></tr>';
        });
        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('authorizedCount').textContent = authorized;
        document.getElementById('totalUsers').textContent = snapshot.size;
    });
}

function authorizeUser(uid) {
    if (confirm('Autoriser ?')) {
        db.collection('users').doc(uid).update({authorized:'yes',updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function() { loadUsersList(); });
    }
}
function deauthorizeUser(uid) {
    if (confirm('Bloquer ?')) {
        db.collection('users').doc(uid).update({authorized:'no',updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function() { loadUsersList(); });
    }
}
function deleteUser(uid) {
    if (confirm('Supprimer ?')) {
        db.collection('users').doc(uid).delete().then(function() { loadUsersList(); });
    }
}

// ==================== AUTH ====================
function handleLogin(event) {
    event.preventDefault();
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var btn = document.getElementById('loginBtn');
    
    if (!email || !password) { showLoginError('Remplissez tous les champs'); return false; }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    hideLoginError();
    
    auth.signInWithEmailAndPassword(email, password).then(function(userCredential) {
        return db.collection('users').doc(userCredential.user.uid).get().then(function(doc) {
            if (!doc.exists) { auth.signOut(); showLoginError('Compte introuvable'); return; }
            var userData = doc.data();
            if (userData.authorized !== 'yes') { auth.signOut(); showLoginError('Compte en attente de validation.'); return; }
            currentUserData = { uid: doc.id, userData: userData };
            localStorage.setItem('currentUser', JSON.stringify(currentUserData));
            if (userData.role === 'client') showClientPage();
            else showDashboard();
        });
    }).catch(function(error) {
        var msg = error.code === 'auth/user-not-found' ? 'Email non trouve' : error.code === 'auth/wrong-password' ? 'Mot de passe incorrect' : error.message;
        showLoginError(msg);
    }).finally(function() {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
    });
    return false;
}

function showLoginError(msg) {
    var el = document.getElementById('loginError');
    if (!el) {
        el = document.createElement('div');
        el.id = 'loginError';
        el.style.cssText = 'background:#fee2e2;color:#991b1b;padding:15px;border-radius:12px;margin-bottom:20px;font-size:0.9rem;text-align:center;border:2px solid #fecaca;';
        var loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.parentNode.insertBefore(el, loginForm);
    }
    el.innerHTML = msg;
    el.style.display = 'block';
}

function hideLoginError() {
    var e = document.getElementById('loginError');
    if (e) e.style.display = 'none';
}

function handleRegister(event) {
    event.preventDefault();
    var nom = document.getElementById('regNom').value.trim();
    var prenom = document.getElementById('regPrenom').value.trim();
    var username = document.getElementById('regUsername').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var telephone = document.getElementById('regTelephone').value.trim();
    var role = document.getElementById('regRole').value;
    var password = document.getElementById('regPassword').value;
    var btn = document.getElementById('registerBtn');
    
    if (!nom || !prenom || !username || !email || !telephone || !role || !password) {
        alert('Tous les champs obligatoires');
        return false;
    }
    if (password.length < 6) { alert('Mot de passe: 6 caracteres minimum'); return false; }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creation...';
    
    auth.createUserWithEmailAndPassword(email, password).then(function(userCredential) {
        return db.collection('users').doc(userCredential.user.uid).set({
            nom:nom,prenom:prenom,username:username,email:email,telephone:telephone,role:role,
            authorized:'no',createdAt:firebase.firestore.FieldValue.serverTimestamp()
        });
    }).then(function() {
        alert('Compte cree ! Attendez la validation.');
        document.getElementById('registerForm').reset();
        showLogin();
    }).catch(function(e) {
        alert('Erreur: ' + e.message);
    }).finally(function() {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Creer mon compte';
    });
    return false;
}

function handleLogout() {
    auth.signOut().then(function() {
        localStorage.removeItem('currentUser');
        currentUser = null;
        currentUserData = null;
        showAuthPage();
    });
}

function updateSidebarUserInfo() {
    var el = document.getElementById('sidebarUserInfo');
    if (el && currentUserData) {
        el.innerHTML = '<i class="fas fa-user-circle"></i> ' + currentUserData.userData.prenom + ' ' + currentUserData.userData.nom + ' <small style="color:#f39c12;">(' + currentUserData.userData.role + ')</small>';
    }
}

function updateClientSidebarInfo() {
    var el = document.getElementById('clientSidebarInfo');
    if (el && currentUserData) {
        el.innerHTML = '<i class="fas fa-user-circle"></i> ' + currentUserData.userData.prenom + ' ' + currentUserData.userData.nom;
    }
}

function clientNavigate(page) {
    var items = document.querySelectorAll('#clientPage .nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    if (page === 'commander' && items[0]) items[0].classList.add('active');
    else if (page === 'historique' && items[1]) items[1].classList.add('active');
    else if (items[2]) items[2].classList.add('active');
    
    document.getElementById('clientPageTitle').textContent = page === 'commander' ? 'Commander' : page === 'historique' ? 'Historique' : 'Parametres';
    document.getElementById('clientDynamicContent').innerHTML = '<div class="content-card"><h3>' + (page === 'commander' ? 'Commander' : page === 'historique' ? 'Historique' : 'Parametres') + '</h3><p style="text-align:center;padding:40px;">A venir</p></div>';
}

// ==================== POS SYSTEM COMPLET ====================
var posCart = [];
var posStep = 1;
var posCategoriesList = [];
var posProductsList = [];
var posSelectedCategory = 'all';
var posCurrentClient = null;
var posCurrentTable = '';
var posPaymentMethod = 'espece';
var posAmountGiven = 0;

async function loadPosPage(content) {
    posResetCart();
    posStep = 1;
    
    try {
        var catSnap = await db.collection('categories').get();
        posCategoriesList = [];
        catSnap.forEach(function(doc) {
            posCategoriesList.push({id: doc.id, nom: doc.data().nom, imageBase64: doc.data().imageBase64});
        });
        
        var prodSnap = await db.collection('products').get();
        posProductsList = [];
        prodSnap.forEach(function(doc) {
            var d = doc.data();
            if (d.disponible !== false) {
                posProductsList.push({
                    id: doc.id,
                    nom: d.nom,
                    prixVente: d.prixVente || 0,
                    prixPromo: d.prixPromo || 0,
                    prixAchat: d.prixAchat || 0,
                    stock: d.stock,
                    categorie: d.categorie || '',
                    imageBase64: d.imageBase64 || ''
                });
            }
        });
    } catch(e) {
        console.error('Erreur chargement POS:', e);
    }
    
    renderPOS();
}

function posResetCart() {
    posCart = [];
    posStep = 1;
    posSelectedCategory = 'all';
    posCurrentClient = null;
    posCurrentTable = '';
    posPaymentMethod = 'espece';
    posAmountGiven = 0;
}

function renderPOS() {
    var content = document.getElementById('dynamicContent');
    if (!content) return;
    
    var total = posCalculateTotal();
    var html = '<div class="pos-container">';
    
    // Colonne gauche - Produits
    html += '<div class="pos-products-panel">';
    html += '<div class="pos-categories-bar">';
    html += '<button class="pos-cat-btn ' + (posSelectedCategory === 'all' ? 'active' : '') + '" onclick="posFilterCategory(\'all\')"><i class="fas fa-th-large"></i> Tous</button>';
    
    for (var i = 0; i < posCategoriesList.length; i++) {
        var cat = posCategoriesList[i];
        var activeClass = posSelectedCategory === cat.nom ? 'active' : '';
        var iconHtml = cat.imageBase64 ? '<img src="' + cat.imageBase64 + '" alt="' + cat.nom + '">' : '<i class="fas fa-folder"></i>';
        html += '<button class="pos-cat-btn ' + activeClass + '" onclick="posFilterCategory(\'' + cat.nom.replace(/'/g, "\\'") + '\')">' + iconHtml + ' ' + cat.nom + '</button>';
    }
    html += '</div>';
    
    // Grille produits
    html += '<div class="pos-products-grid">';
    var filteredProducts = posProductsList;
    if (posSelectedCategory !== 'all') {
        filteredProducts = posProductsList.filter(function(p) { return p.categorie === posSelectedCategory; });
    }
    
    if (filteredProducts.length === 0) {
        html += '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8;">Aucun produit dans cette categorie</div>';
    } else {
        for (var j = 0; j < filteredProducts.length; j++) {
            var product = filteredProducts[j];
            var price = product.prixPromo && product.prixPromo > 0 ? product.prixPromo : product.prixVente;
            var hasPromo = product.prixPromo && product.prixPromo > 0;
            var stockClass = '';
            var stockText = '';
            if (product.stock !== undefined) {
                if (product.stock <= 0) { stockClass = 'pos-out-of-stock'; stockText = ' (Rupture)'; }
                else if (product.stock <= 5) { stockText = ' (' + product.stock + ' rest.)'; }
            }
            
            html += '<div class="pos-product-card ' + stockClass + '" onclick="posAddToCart(\'' + product.id + '\')">';
            if (product.imageBase64) {
                html += '<div class="pos-product-img"><img src="' + product.imageBase64 + '" alt="' + product.nom + '"></div>';
            } else {
                html += '<div class="pos-product-img pos-product-placeholder"><i class="fas fa-utensils"></i></div>';
            }
            html += '<div class="pos-product-info">';
            html += '<span class="pos-product-name">' + product.nom + stockText + '</span>';
            html += '<span class="pos-product-price">';
            if (hasPromo) {
                html += '<span class="pos-old-price">' + product.prixVente.toFixed(2) + '</span> ';
                html += '<span class="pos-promo-price">' + price.toFixed(2) + ' MAD</span>';
            } else {
                html += price.toFixed(2) + ' MAD';
            }
            html += '</span></div></div>';
        }
    }
    html += '</div></div>';
    
    // Colonne droite - Panier
    html += '<div class="pos-cart-panel">';
    
    if (posStep === 1) {
        html += '<div class="pos-cart-header">';
        html += '<h3><i class="fas fa-shopping-cart"></i> Panier <span id="posCartCount" class="pos-cart-badge">' + posCart.length + '</span></h3>';
        html += '<button class="pos-clear-btn" onclick="posResetCart()"><i class="fas fa-trash-alt"></i> Vider</button>';
        html += '</div>';
        html += '<div class="pos-cart-items" id="posCartItems">';
        if (posCart.length === 0) {
            html += '<div class="pos-cart-empty"><i class="fas fa-shopping-basket"></i><p>Panier vide</p><span>Cliquez sur les produits</span></div>';
        } else {
            for (var k = 0; k < posCart.length; k++) {
                var item = posCart[k];
                html += '<div class="pos-cart-item">';
                html += '<div class="pos-cart-item-info">';
                html += '<span class="pos-cart-item-name">' + item.nom + '</span>';
                html += '<span class="pos-cart-item-price">' + item.prixUnitaire.toFixed(2) + ' MAD/u</span>';
                html += '</div>';
                html += '<div class="pos-cart-item-actions">';
                html += '<button class="pos-qty-btn" onclick="posUpdateQty(' + k + ', -1)"><i class="fas fa-minus"></i></button>';
                html += '<span class="pos-qty-value">' + item.quantite + '</span>';
                html += '<button class="pos-qty-btn" onclick="posUpdateQty(' + k + ', 1)"><i class="fas fa-plus"></i></button>';
                html += '<button class="pos-remove-btn" onclick="posRemoveItem(' + k + ')"><i class="fas fa-times"></i></button>';
                html += '</div>';
                html += '<span class="pos-cart-item-total">' + (item.prixUnitaire * item.quantite).toFixed(2) + ' MAD</span>';
                html += '</div>';
            }
        }
        html += '</div>';
        html += '<div class="pos-cart-footer">';
        html += '<div class="pos-cart-total-row"><span>Total</span><span id="posTotal">' + total.toFixed(2) + ' MAD</span></div>';
        html += '<button class="pos-validate-btn" onclick="posGoToStep2()" ' + (posCart.length === 0 ? 'disabled' : '') + '><i class="fas fa-check-circle"></i> Valider la commande</button>';
        html += '</div>';
    } else if (posStep === 2) {
        html += '<div class="pos-cart-header">';
        html += '<h3><i class="fas fa-credit-card"></i> Paiement</h3>';
        html += '<button class="pos-back-btn" onclick="posGoToStep1()"><i class="fas fa-arrow-left"></i> Retour</button>';
        html += '</div>';
        html += '<div class="pos-payment-form">';
        html += '<div class="pos-payment-section"><label>Client</label><div class="pos-client-search">';
        html += '<input type="text" id="posClientSearch" placeholder="Rechercher un client..." onkeyup="posSearchClients(this.value)" autocomplete="off">';
        html += '<div id="posClientResults" class="pos-client-dropdown"></div></div>';
        html += '<div class="pos-or-divider">— OU —</div><label>Numero de table</label>';
        html += '<input type="text" id="posTableNum" placeholder="Ex: Table 5" value="' + posCurrentTable + '" onchange="posSetTable(this.value)">';
        html += '</div>';
        html += '<div class="pos-payment-section"><div class="pos-summary-box">';
        html += '<div class="pos-summary-row"><span>Articles</span><span>' + posCart.length + '</span></div>';
        html += '<div class="pos-summary-total"><span>Total</span><span>' + total.toFixed(2) + ' MAD</span></div>';
        html += '</div></div>';
        html += '<div class="pos-payment-section"><label>Methode de paiement</label><div class="pos-payment-methods">';
        html += '<button class="pos-payment-btn ' + (posPaymentMethod === 'espece' ? 'active' : '') + '" onclick="posSetPaymentMethod(\'espece\')"><i class="fas fa-money-bill-wave"></i> Especes</button>';
        html += '<button class="pos-payment-btn ' + (posPaymentMethod === 'credit' ? 'active' : '') + '" onclick="posSetPaymentMethod(\'credit\')"><i class="fas fa-credit-card"></i> Credit</button>';
        html += '</div></div>';
        if (posPaymentMethod === 'espece') {
            html += '<div class="pos-payment-section"><label>Montant donne</label>';
            html += '<input type="number" id="posAmountGiven" placeholder="0.00" value="' + (posAmountGiven > 0 ? posAmountGiven : '') + '" onkeyup="posCalculateChange()">';
            html += '<div id="posChangeDisplay"></div></div>';
        }
        html += '<button class="pos-finalize-btn" onclick="posFinalizeSale()"><i class="fas fa-check-circle"></i> Finaliser la vente</button>';
        html += '</div>';
    }
    html += '</div></div>';
    
    content.innerHTML = html;
    if (posStep === 2) { setTimeout(posCalculateChange, 200); }
}

function posFilterCategory(category) {
    posSelectedCategory = category;
    renderPOS();
}

function posAddToCart(productId) {
    var product = posProductsList.find(function(p) { return p.id === productId; });
    if (!product) return;
    if (product.stock !== undefined && product.stock <= 0) { alert('Produit en rupture de stock'); return; }
    
    var existingItem = posCart.find(function(item) { return item.id === productId; });
    if (existingItem) {
        if (product.stock !== undefined && existingItem.quantite >= product.stock) { alert('Stock insuffisant'); return; }
        existingItem.quantite += 1;
    } else {
        var price = product.prixPromo && product.prixPromo > 0 ? product.prixPromo : product.prixVente;
        posCart.push({
            id: product.id,
            nom: product.nom,
            prixUnitaire: price,
            prixAchat: product.prixAchat || 0,
            quantite: 1,
            categorie: product.categorie || '',
            imageBase64: product.imageBase64 || ''
        });
    }
    renderPOS();
}

function posUpdateQty(index, change) {
    var item = posCart[index];
    if (!item) return;
    var product = posProductsList.find(function(p) { return p.id === item.id; });
    var newQty = item.quantite + change;
    if (newQty <= 0) { posCart.splice(index, 1); }
    else {
        if (product && product.stock !== undefined && newQty > product.stock) { alert('Stock insuffisant. Maximum: ' + product.stock); return; }
        item.quantite = newQty;
    }
    renderPOS();
}

function posRemoveItem(index) {
    posCart.splice(index, 1);
    renderPOS();
}

function posCalculateTotal() {
    var total = 0;
    for (var i = 0; i < posCart.length; i++) {
        total += posCart[i].prixUnitaire * posCart[i].quantite;
    }
    return total;
}

function updateCartCount() {
    var badge = document.getElementById('posCartCount');
    if (badge) badge.textContent = posCart.length;
}

function posGoToStep2() {
    if (posCart.length === 0) { alert('Le panier est vide'); return; }
    posStep = 2;
    renderPOS();
}

function posGoToStep1() {
    posStep = 1;
    renderPOS();
}

async function posSearchClients(query) {
    var resultsDiv = document.getElementById('posClientResults');
    if (!resultsDiv) return;
    if (!query || query.length < 1) {
        resultsDiv.innerHTML = '';
        resultsDiv.style.display = 'none';
        posCurrentClient = null;
        return;
    }
    
    try {
        var queryUpper = query.toUpperCase();
        var snapshot = await db.collection('clients').orderBy('nom').startAt(queryUpper).endAt(queryUpper + '\uf8ff').limit(10).get();
        var clients = [];
        var seenIds = {};
        snapshot.forEach(function(doc) {
            if (!seenIds[doc.id]) { clients.push({id: doc.id, nom: doc.data().nom, prenom: doc.data().prenom, telephone: doc.data().telephone}); seenIds[doc.id] = true; }
        });
        
        if (clients.length === 0) {
            resultsDiv.innerHTML = '<div class="pos-client-item" style="color:#94a3b8;cursor:default;">Aucun client trouve</div>';
        } else {
            resultsDiv.innerHTML = '';
            clients.forEach(function(client) {
                resultsDiv.innerHTML += '<div class="pos-client-item" onclick="posSelectClient(\'' + client.id + '\', \'' + client.nom.replace(/'/g, "\\'") + ' ' + client.prenom.replace(/'/g, "\\'") + '\')"><i class="fas fa-user"></i> <strong>' + client.nom + ' ' + client.prenom + '</strong>' + (client.telephone ? ' <span class="pos-client-phone">(' + client.telephone + ')</span>' : '') + '</div>';
            });
        }
        resultsDiv.style.display = 'block';
    } catch(e) { console.error('Erreur recherche clients:', e); }
}

function posSelectClient(id, name) {
    posCurrentClient = {id: id, name: name};
    posCurrentTable = '';
    var searchInput = document.getElementById('posClientSearch');
    var tableInput = document.getElementById('posTableNum');
    if (searchInput) searchInput.value = name;
    if (tableInput) tableInput.value = '';
    var resultsDiv = document.getElementById('posClientResults');
    if (resultsDiv) resultsDiv.style.display = 'none';
}

function posSetTable(value) {
    posCurrentTable = value;
    if (value) {
        posCurrentClient = null;
        var searchInput = document.getElementById('posClientSearch');
        if (searchInput) searchInput.value = '';
    }
}

function posSetPaymentMethod(method) {
    posPaymentMethod = method;
    posAmountGiven = 0;
    renderPOS();
}

function posCalculateChange() {
    var amountInput = document.getElementById('posAmountGiven');
    var changeDisplay = document.getElementById('posChangeDisplay');
    if (!amountInput || !changeDisplay) return;
    var total = posCalculateTotal();
    posAmountGiven = parseFloat(amountInput.value) || 0;
    var change = posAmountGiven - total;
    if (posAmountGiven > 0) {
        if (change >= 0) {
            changeDisplay.innerHTML = '<div class="pos-change-positive"><span>Rendu</span><span>' + change.toFixed(2) + ' MAD</span></div>';
        } else {
            changeDisplay.innerHTML = '<div class="pos-change-negative"><span>Manquant</span><span>' + Math.abs(change).toFixed(2) + ' MAD</span></div>';
        }
    } else { changeDisplay.innerHTML = ''; }
}

async function posFinalizeSale() {
    var total = posCalculateTotal();
    if (!posCurrentClient && !posCurrentTable) { alert('Veuillez selectionner un client ou entrer un numero de table'); return; }
    if (posPaymentMethod === 'espece') {
        posAmountGiven = parseFloat(document.getElementById('posAmountGiven').value) || 0;
        if (posAmountGiven < total) { alert('Le montant donne est insuffisant'); return; }
    }
    
    try {
        var saleData = {
            items: posCart.slice(),
            total: total,
            clientId: posCurrentClient ? posCurrentClient.id : null,
            clientName: posCurrentClient ? posCurrentClient.name : null,
            table: posCurrentTable || null,
            paymentMethod: posPaymentMethod,
            amountGiven: posPaymentMethod === 'espece' ? posAmountGiven : total,
            change: posPaymentMethod === 'espece' ? (posAmountGiven - total) : 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUserData ? currentUserData.userData.prenom + ' ' + currentUserData.userData.nom : 'Inconnu',
            paid: posPaymentMethod !== 'credit',
            remainingAmount: posPaymentMethod === 'credit' ? total : 0
        };
        
        if (posPaymentMethod === 'credit') { await db.collection('credits').add(saleData); }
        else { await db.collection('ventes').add(saleData); }
        
        for (var i = 0; i < posCart.length; i++) {
            var item = posCart[i];
            try {
                var productRef = await db.collection('products').doc(item.id).get();
                if (productRef.exists) {
                    var productData = productRef.data();
                    var newStock = Math.max(0, (productData.stock || 0) - item.quantite);
                    var newVendues = (productData.vendues || 0) + item.quantite;
                    var newCA = (productData.ca || 0) + (item.prixUnitaire * item.quantite);
                    var newProfit = (productData.profit || 0) + ((item.prixUnitaire - (item.prixAchat || 0)) * item.quantite);
                    await db.collection('products').doc(item.id).update({
                        stock: newStock, vendues: newVendues, ca: newCA, profit: newProfit,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            } catch(e) { console.error('Erreur update produit:', e); }
        }
        
        if (posCurrentClient && posCurrentClient.id) {
            try {
                var clientRef = await db.collection('clients').doc(posCurrentClient.id).get();
                if (clientRef.exists) {
                    var clientData = clientRef.data();
                    var newClientCA = (clientData.ca || 0) + total;
                    await db.collection('clients').doc(posCurrentClient.id).update({
                        ca: newClientCA, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            } catch(e) { console.error('Erreur update client:', e); }
        }
        
        var message = 'Vente enregistree avec succes !';
        if (posPaymentMethod === 'espece' && posAmountGiven > total) { message += '\nRendu: ' + (posAmountGiven - total).toFixed(2) + ' MAD'; }
        else if (posPaymentMethod === 'credit') { message += '\nCredit enregistre.'; }
        alert(message);
        posResetCart();
        renderPOS();
    } catch(e) { console.error('Erreur lors de la vente:', e); alert('Erreur: ' + e.message); }
}

console.log('Chicken Way Pro - Ready');
