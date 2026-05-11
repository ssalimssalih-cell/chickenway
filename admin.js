var editingId = null;
var currentCollection = '';
var selectedCategoryFilter = '';

function loadDashboardPage(content) {
    content.innerHTML = '<div class="stats-grid"><div class="stat-card"><div class="stat-icon"><i class="fas fa-utensils"></i></div><div class="stat-info"><span class="stat-label">Produits</span><span class="stat-value" id="productsCount">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value" id="clientsCount">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-layer-group"></i></div><div class="stat-info"><span class="stat-label">Categories</span><span class="stat-value" id="categoriesCount">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-cart"></i></div><div class="stat-info"><span class="stat-label">Ventes</span><span class="stat-value" id="ventesCount">0</span></div></div></div>';
    loadDashboardStats();
}

function loadDashboardStats() {
    db.collection('products').get().then(function(s) { var e=document.getElementById('productsCount'); if(e)e.textContent=s.size; }).catch(function(){});
    db.collection('clients').get().then(function(s) { var e=document.getElementById('clientsCount'); if(e)e.textContent=s.size; }).catch(function(){});
    db.collection('categories').get().then(function(s) { var e=document.getElementById('categoriesCount'); if(e)e.textContent=s.size; }).catch(function(){});
    db.collection('ventes').get().then(function(s) { var e=document.getElementById('ventesCount'); if(e)e.textContent=s.size; }).catch(function(){});
}

function openModal(title, bodyHTML) { document.getElementById('modalTitle').textContent=title; document.getElementById('modalBody').innerHTML=bodyHTML; document.getElementById('modalOverlay').classList.remove('hidden'); }
function closeModal() { document.getElementById('modalOverlay').classList.add('hidden'); editingId=null; currentCollection=''; }

function fileToBase64(file, callback) {
    if(!file){callback(null);return;}
    var r=new FileReader(); r.onload=function(e){callback(e.target.result);}; r.onerror=function(){callback(null);}; r.readAsDataURL(file);
}
function previewImage(input, previewId) {
    var preview=document.getElementById(previewId); if(!preview)return;
    if(input.files&&input.files[0]){var r=new FileReader(); r.onload=function(e){preview.innerHTML='<img src="'+e.target.result+'" style="max-width:100px;margin-top:5px;border-radius:8px;">'}; r.readAsDataURL(input.files[0]);}
}

function saveDocument(collectionName, data, callback) {
    if(editingId){data.updatedAt=firebase.firestore.FieldValue.serverTimestamp(); db.collection(collectionName).doc(editingId).update(data).then(function(){if(callback)callback();}).catch(function(err){alert('Erreur: '+err.message);});}
    else{data.createdAt=firebase.firestore.FieldValue.serverTimestamp(); db.collection(collectionName).add(data).then(function(){if(callback)callback();}).catch(function(err){alert('Erreur: '+err.message);});}
}
function editDocument(collectionName, id) { db.collection(collectionName).doc(id).get().then(function(doc){if(doc.exists){editingId=id;currentCollection=collectionName;openEditForm(collectionName,doc.data());}}); }
function deleteDocument(collectionName, id) { if(confirm('Confirmer la suppression ?')){db.collection(collectionName).doc(id).delete().then(function(){alert('Supprime');refreshCurrentPage();}).catch(function(err){alert('Erreur: '+err.message);});} }
function refreshCurrentPage() { var t=document.getElementById('pageTitle').textContent; var m={'Categories':'categories','Produits':'products','Clients':'clients','Fournisseurs':'fournisseurs','Depenses':'depenses'}; navigateTo(m[t]||'dashboard'); }

function loadCategoriesPage(content) { content.innerHTML='<div class="content-card"><div class="card-header"><h3><i class="fas fa-layer-group"></i> Categories</h3><button class="btn-add" onclick="openCategoryForm()"><i class="fas fa-plus"></i> Nouvelle</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Image</th><th>Nom</th><th>Description</th><th>CA</th><th>Profit</th><th>Stock</th><th>Nb Produits</th><th>Actions</th></tr></thead><tbody id="categoriesTable"></tbody></table></div></div>'; loadCategories(); }
async function loadCategories(){ /* IDENTIQUE AU CODE PRÉCÉDENT - GARDER LE MÊME */ }
function openCategoryForm(data){ /* IDENTIQUE */ }
function saveCategory(){ /* IDENTIQUE */ }
function loadProductsPage(content){ /* IDENTIQUE */ }
async function loadCategoriesInFilter(){ /* IDENTIQUE */ }
function filterProducts(){ /* IDENTIQUE */ }
function calculateProfit(data){ /* IDENTIQUE */ }
async function loadProducts(){ /* IDENTIQUE */ }
async function openProductForm(data){ /* IDENTIQUE */ }
function calcP(){ /* IDENTIQUE */ }
function saveProduct(){ /* IDENTIQUE */ }
function loadClientsPage(content){ /* IDENTIQUE */ }
function openClientForm(data){ /* IDENTIQUE */ }
function saveClient(){ /* IDENTIQUE */ }
function loadFournisseursPage(content){ /* IDENTIQUE */ }
function openFournisseurForm(data){ /* IDENTIQUE */ }
function saveFournisseur(){ /* IDENTIQUE */ }
function loadDepensesPage(content){ /* IDENTIQUE */ }
function openDepenseForm(data){ /* IDENTIQUE */ }
function saveDepense(){ /* IDENTIQUE */ }
function openEditForm(collectionName, data){ /* IDENTIQUE */ }
function loadOptionsPage(content){ /* IDENTIQUE */ }
function loadUsersList(){ /* IDENTIQUE */ }
function authorizeUser(uid){ /* IDENTIQUE */ }
function deauthorizeUser(uid){ /* IDENTIQUE */ }
function deleteUser(uid){ /* IDENTIQUE */ }
