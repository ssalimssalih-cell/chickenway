var editingId = null;
var currentCollection = '';
var selectedCategoryFilter = '';

// ==================== DASHBOARD ====================
function loadDashboardPage(content) {
    content.innerHTML = '<div class="stats-grid"><div class="stat-card"><div class="stat-icon"><i class="fas fa-utensils"></i></div><div class="stat-info"><span class="stat-label">Produits</span><span class="stat-value" id="productsCount">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value" id="clientsCount">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-layer-group"></i></div><div class="stat-info"><span class="stat-label">Categories</span><span class="stat-value" id="categoriesCount">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-cart"></i></div><div class="stat-info"><span class="stat-label">Ventes</span><span class="stat-value" id="ventesCount">0</span></div></div></div><div class="content-card"><div class="card-header"><h3><i class="fas fa-bell"></i> Inscriptions en attente</h3><button class="btn-add" onclick="loadPendingRegistrations()"><i class="fas fa-sync"></i> Actualiser</button></div><div id="pendingRegistrations">Chargement...</div></div>';
    loadDashboardStats(); loadPendingRegistrations();
}

function loadDashboardStats() {
    db.collection('products').get().then(function(s){var e=document.getElementById('productsCount');if(e)e.textContent=s.size;}).catch(function(){});
    db.collection('clients').get().then(function(s){var e=document.getElementById('clientsCount');if(e)e.textContent=s.size;}).catch(function(){});
    db.collection('categories').get().then(function(s){var e=document.getElementById('categoriesCount');if(e)e.textContent=s.size;}).catch(function(){});
    db.collection('ventes').get().then(function(s){var e=document.getElementById('ventesCount');if(e)e.textContent=s.size;}).catch(function(){});
}

function loadPendingRegistrations() {
    var div = document.getElementById('pendingRegistrations'); if (!div) return;
    db.collection('users').where('authorized','==','no').get().then(function(snapshot) {
        if (snapshot.empty) { div.innerHTML = '<div style="padding:30px;color:#16a34a;"><i class="fas fa-check-circle" style="font-size:2rem;"></i><p>Aucune inscription en attente</p></div>'; return; }
        var users = []; snapshot.forEach(function(doc){users.push({id:doc.id,data:doc.data()});});
        users.sort(function(a,b){return (b.data.createdAt?.seconds||0)-(a.data.createdAt?.seconds||0);});
        var html = '<div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>Utilisateur</th><th>Email</th><th>Role</th><th>Date</th><th>Actions</th></tr></thead><tbody>';
        users.forEach(function(u){var d=u.data,date=d.createdAt?new Date(d.createdAt.seconds*1000).toLocaleDateString('fr-FR'):'N/A';html+='<tr><td><strong>'+d.prenom+' '+d.nom+'</strong> (@'+d.username+')</td><td>'+d.email+'</td><td><span class="status-warning">'+d.role+'</span></td><td>'+date+'</td><td><button class="btn-add" style="padding:4px 10px;font-size:0.75rem;margin-right:5px;" onclick="approveUser(\''+u.id+'\')"><i class="fas fa-check"></i> Accepter</button><button class="btn-delete" style="padding:4px 10px;font-size:0.75rem;" onclick="rejectUser(\''+u.id+'\')"><i class="fas fa-times"></i> Refuser</button></td></tr>';});
        html += '</tbody></table></div>'; div.innerHTML = html;
    }).catch(function(err){div.innerHTML='<div style="padding:20px;color:#ef4444;">Erreur: '+err.message+'</div>';});
}

function approveUser(uid){if(confirm('Accepter ?')){db.collection('users').doc(uid).update({authorized:'yes',approvedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){alert('Accepte !');loadPendingRegistrations();if(typeof loadUsersList==='function')loadUsersList();}).catch(function(err){alert('Erreur: '+err.message);});}}
function rejectUser(uid){if(confirm('Refuser et supprimer ?')){db.collection('users').doc(uid).delete().then(function(){alert('Supprime.');loadPendingRegistrations();if(typeof loadUsersList==='function')loadUsersList();}).catch(function(err){alert('Erreur: '+err.message);});}}

// ==================== MODAL ====================
function openModal(title, bodyHTML) { document.getElementById('modalTitle').textContent=title; document.getElementById('modalBody').innerHTML=bodyHTML; document.getElementById('modalOverlay').classList.remove('hidden'); }
function closeModal() { document.getElementById('modalOverlay').classList.add('hidden'); editingId=null; currentCollection=''; }

// ==================== IMAGE ====================
function fileToBase64(file, callback) { if(!file){callback(null);return;} var r=new FileReader(); r.onload=function(e){callback(e.target.result);}; r.onerror=function(){callback(null);}; r.readAsDataURL(file); }
function previewImage(input, previewId) { var p=document.getElementById(previewId); if(!p)return; if(input.files&&input.files[0]){var r=new FileReader(); r.onload=function(e){p.innerHTML='<img src="'+e.target.result+'" style="max-width:100px;margin-top:5px;border-radius:8px;">'}; r.readAsDataURL(input.files[0]);} }

// ==================== HELPERS ====================
function saveDocument(cn, data, cb) { if(editingId){data.updatedAt=firebase.firestore.FieldValue.serverTimestamp(); db.collection(cn).doc(editingId).update(data).then(function(){if(cb)cb();}).catch(function(err){alert('Erreur: '+err.message);});} else{data.createdAt=firebase.firestore.FieldValue.serverTimestamp(); db.collection(cn).add(data).then(function(){if(cb)cb();}).catch(function(err){alert('Erreur: '+err.message);});} }
function editDocument(cn, id) { db.collection(cn).doc(id).get().then(function(doc){if(doc.exists){editingId=id;currentCollection=cn;openEditForm(cn,doc.data());}}); }
function deleteDocument(cn, id) { if(confirm('Supprimer ?')){db.collection(cn).doc(id).delete().then(function(){alert('Supprime');refreshCurrentPage();}).catch(function(err){alert('Erreur: '+err.message);});} }
function refreshCurrentPage() { var t=document.getElementById('pageTitle').textContent; var m={'Categories':'categories','Produits':'products','Clients':'clients','Fournisseurs':'fournisseurs','Depenses':'depenses','Ventes':'ventes','Credits':'credits'}; navigateTo(m[t]||'dashboard'); }

// ==================== COMMANDES EN LIGNE ====================
function loadCommandesPage(content) { content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-shopping-basket"></i> Commandes en ligne</h3><button class="btn-add" onclick="loadCommandes()"><i class="fas fa-sync"></i> Actualiser</button></div><div id="commandesTableContainer">Chargement...</div></div>'; loadCommandes(); }

function loadCommandes() {
    var container = document.getElementById('commandesTableContainer'); if (!container) return;
    db.collection('commandes').orderBy('createdAt','desc').limit(50).get().then(function(snapshot) {
        if (snapshot.empty) { container.innerHTML = '<p style="text-align:center;padding:40px;color:#94a3b8;">Aucune command
