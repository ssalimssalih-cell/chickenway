var editingId = null;
var currentCollection = '';
var selectedCategoryFilter = '';

// ==================== DASHBOARD ====================
function loadDashboardPage(content) {
    content.innerHTML = 
        '<div class="stats-grid">' +
        '<div class="stat-card"><div class="stat-icon"><i class="fas fa-utensils"></i></div><div class="stat-info"><span class="stat-label">Produits</span><span class="stat-value" id="productsCount">0</span></div></div>' +
        '<div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value" id="clientsCount">0</span></div></div>' +
        '<div class="stat-card"><div class="stat-icon"><i class="fas fa-layer-group"></i></div><div class="stat-info"><span class="stat-label">Categories</span><span class="stat-value" id="categoriesCount">0</span></div></div>' +
        '<div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-cart"></i></div><div class="stat-info"><span class="stat-label">Ventes</span><span class="stat-value" id="ventesCount">0</span></div></div>' +
        '</div>' +
        '<div class="content-card"><div class="card-header"><h3><i class="fas fa-bell"></i> Inscriptions en attente</h3><button class="btn-add" onclick="loadPendingRegistrations()"><i class="fas fa-sync"></i> Actualiser</button></div><div id="pendingRegistrations">Chargement...</div></div>';
    loadDashboardStats();
    loadPendingRegistrations();
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
        users.forEach(function(u){var d=u.data, date=d.createdAt?new Date(d.createdAt.seconds*1000).toLocaleDateString('fr-FR'):'N/A';
            html+='<tr><td><strong>'+d.prenom+' '+d.nom+'</strong> (@'+d.username+')</td><td>'+d.email+'</td><td><span class="status-warning">'+d.role+'</span></td><td>'+date+'</td><td><button class="btn-add" style="padding:4px 10px;font-size:0.75rem;margin-right:5px;" onclick="approveUser(\''+u.id+'\')"><i class="fas fa-check"></i> Accepter</button><button class="btn-delete" style="padding:4px 10px;font-size:0.75rem;" onclick="rejectUser(\''+u.id+'\')"><i class="fas fa-times"></i> Refuser</button></td></tr>';});
        html += '</tbody></table></div>'; div.innerHTML = html;
    }).catch(function(err){div.innerHTML='<div style="padding:20px;color:#ef4444;">Erreur: '+err.message+'</div>';});
}

function approveUser(uid) {
    if(confirm('Accepter cette inscription ?')){db.collection('users').doc(uid).update({authorized:'yes',approvedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){alert('Utilisateur accepte !');loadPendingRegistrations();if(typeof loadUsersList==='function')loadUsersList();}).catch(function(err){alert('Erreur: '+err.message);});}
}
function rejectUser(uid) {
    if(confirm('Refuser et supprimer ?')){db.collection('users').doc(uid).delete().then(function(){alert('Utilisateur supprime.');loadPendingRegistrations();if(typeof loadUsersList==='function')loadUsersList();}).catch(function(err){alert('Erreur: '+err.message);});}
}

// ==================== MODAL ====================
function openModal(title, bodyHTML) { document.getElementById('modalTitle').textContent=title; document.getElementById('modalBody').innerHTML=bodyHTML; document.getElementById('modalOverlay').classList.remove('hidden'); }
function closeModal() { document.getElementById('modalOverlay').classList.add('hidden'); editingId=null; currentCollection=''; }

// ==================== IMAGE ====================
function fileToBase64(file, callback) { if(!file){callback(null);return;} var r=new FileReader(); r.onload=function(e){callback(e.target.result);}; r.onerror=function(){callback(null);}; r.readAsDataURL(file); }
function previewImage(input, previewId) { var p=document.getElementById(previewId); if(!p)return; if(input.files&&input.files[0]){var r=new FileReader(); r.onload=function(e){p.innerHTML='<img src="'+e.target.result+'" style="max-width:100px;margin-top:5px;border-radius:8px;">'}; r.readAsDataURL(input.files[0]);} }

// ==================== HELPERS ====================
function saveDocument(cn, data, cb) {
    if(editingId){data.updatedAt=firebase.firestore.FieldValue.serverTimestamp(); db.collection(cn).doc(editingId).update(data).then(function(){if(cb)cb();}).catch(function(err){alert('Erreur: '+err.message);});}
    else{data.createdAt=firebase.firestore.FieldValue.serverTimestamp(); db.collection(cn).add(data).then(function(){if(cb)cb();}).catch(function(err){alert('Erreur: '+err.message);});}
}
function editDocument(cn, id) { db.collection(cn).doc(id).get().then(function(doc){if(doc.exists){editingId=id;currentCollection=cn;openEditForm(cn,doc.data());}}); }
function deleteDocument(cn, id) { if(confirm('Confirmer la suppression ?')){db.collection(cn).doc(id).delete().then(function(){alert('Supprime');refreshCurrentPage();}).catch(function(err){alert('Erreur: '+err.message);});} }
function refreshCurrentPage() { var t=document.getElementById('pageTitle').textContent; var m={'Categories':'categories','Produits':'products','Clients':'clients','Fournisseurs':'fournisseurs','Depenses':'depenses','Ventes':'ventes','Credits':'credits'}; navigateTo(m[t]||'dashboard'); }

// ==================== COMMANDES EN LIGNE ====================
// ==================== COMMANDES EN LIGNE ====================
function loadCommandesPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-shopping-basket"></i> Commandes en ligne</h3><button class="btn-add" onclick="loadCommandes()"><i class="fas fa-sync"></i> Actualiser</button></div><div id="commandesTableContainer">Chargement...</div></div>';
    loadCommandes();
}

function loadCommandes() {
    var container = document.getElementById('commandesTableContainer');
    if (!container) return;
    
    db.collection('commandes').orderBy('createdAt', 'desc').limit(50).get().then(function(snapshot) {
        if (snapshot.empty) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;"><i class="fas fa-inbox" style="font-size:3rem;display:block;margin-bottom:15px;"></i><p>Aucune commande en ligne</p></div>';
            return;
        }
        
        var html = '<div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Client</th><th>Contact</th><th>Articles</th><th>Détail</th><th>Total</th><th>Statut</th><th>Actions</th></tr></thead><tbody>';
        
        snapshot.forEach(function(doc) {
            var d = doc.data();
            var date = d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleString('fr-FR') : 'N/A';
            var articles = d.items ? d.items.length : 0;
            
            // Détail des articles
            var detailArticles = '';
            if (d.items) {
                detailArticles = d.items.map(function(item) {
                    return item.quantite + 'x ' + item.nom;
                }).join(', ');
            }
            
            var statutColor = d.statut === 'valide' ? '#16a34a' : d.statut === 'en_attente' ? '#d97706' : '#94a3b8';
            var statutLabel = d.statut === 'valide' ? 'Validée' : d.statut === 'en_attente' ? 'En attente' : d.statut || 'Inconnu';
            
            var actions = '';
            if (d.statut === 'en_attente') {
                actions = '<button class="btn-add" style="padding:4px 10px;font-size:0.75rem;margin-right:5px;" onclick="validateCommande(\'' + doc.id + '\')"><i class="fas fa-check"></i> Valider</button>' +
                          '<button class="btn-delete" style="padding:4px 10px;font-size:0.75rem;" onclick="cancelCommande(\'' + doc.id + '\')"><i class="fas fa-times"></i> Annuler</button>';
            } else {
                actions = '<span style="font-size:0.8rem;">' + (d.validatedBy || '') + '</span>';
            }
            
            html += '<tr>' +
                '<td>' + date + '</td>' +
                '<td><strong>' + (d.clientName || 'N/A') + '</strong></td>' +
                '<td><small>' + (d.clientTelephone || '') + '<br>' + (d.clientEmail || '') + '</small></td>' +
                '<td>' + articles + '</td>' +
                '<td><small>' + detailArticles + '</small></td>' +
                '<td><strong style="color:#f39c12;">' + d.total.toFixed(2) + ' MAD</strong></td>' +
                '<td><span style="color:' + statutColor + ';font-weight:600;">' + statutLabel + '</span></td>' +
                '<td>' + actions + '</td>' +
                '</tr>';
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    }).catch(function(err) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:#ef4444;">Erreur: ' + err.message + '</p>';
    });
}

// Valider une commande en ligne (la transformer en vente)
async function validateCommande(commandeId) {
    if (!confirm('Valider cette commande ? Elle sera transformee en vente.')) return;
    
    try {
        var doc = await db.collection('commandes').doc(commandeId).get();
        if (!doc.exists) { alert('Commande introuvable'); return; }
        
        var commande = doc.data();
        
        // Créer la vente
        var venteData = {
            items: commande.items,
            total: commande.total,
            clientId: commande.clientId,
            clientName: commande.clientName,
            paymentMethod: 'espece',
            amountGiven: commande.total,
            change: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: window.currentUserData ? window.currentUserData.userData.prenom + ' ' + window.currentUserData.userData.nom : 'Admin',
            paid: true,
            remainingAmount: 0,
            source: 'commande_en_ligne'
        };
        
        await db.collection('ventes').add(venteData);
        
        // Mettre à jour les stocks
        if (commande.items) {
            for (var item of commande.items) {
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
        }
        
        // Marquer la commande comme validée
        await db.collection('commandes').doc(commandeId).update({
            statut: 'valide',
            validatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            validatedBy: window.currentUserData ? window.currentUserData.userData.prenom + ' ' + window.currentUserData.userData.nom : 'Admin'
        });
        
        alert('Commande validee et transformee en vente !');
        loadCommandes();
    } catch(e) {
        console.error('Erreur validation:', e);
        alert('Erreur: ' + e.message);
    }
}

// Annuler une commande
function cancelCommande(commandeId) {
    if (!confirm('Annuler cette commande ?')) return;
    db.collection('commandes').doc(commandeId).update({
        statut: 'annule',
        cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function() {
        alert('Commande annulee.');
        loadCommandes();
    }).catch(function(err) {
        alert('Erreur: ' + err.message);
    });
}

// ==================== VENTES ====================
function loadVentesPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-shopping-cart"></i> Historique des ventes</h3><button class="btn-add" onclick="loadVentesPage(document.getElementById(\'dynamicContent\'))"><i class="fas fa-sync"></i> Actualiser</button></div><div id="ventesTableContainer">Chargement...</div></div>';
    loadVentes();
}

function loadVentes() {
    var container = document.getElementById('ventesTableContainer'); if (!container) return;
    db.collection('ventes').orderBy('createdAt','desc').limit(50).get().then(function(snapshot) {
        if (snapshot.empty) { container.innerHTML = '<p style="text-align:center;padding:40px;color:#94a3b8;">Aucune vente</p>'; return; }
        var totalVentes = 0;
        var html = '<div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Client/Table</th><th>Articles</th><th>Total</th><th>Paiement</th><th>Caissier</th></tr></thead><tbody>';
        snapshot.forEach(function(doc) {
            var d = doc.data();
            var date = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleString('fr-FR') : 'N/A';
            var client = d.clientName || d.table || 'N/A';
            var articles = d.items ? d.items.length : 0;
            totalVentes += d.total || 0;
            html += '<tr><td>'+date+'</td><td>'+client+'</td><td>'+articles+'</td><td><strong style="color:#16a34a;">'+d.total.toFixed(2)+' MAD</strong></td><td>'+(d.paymentMethod==='espece'?'Espèces':'Crédit')+'</td><td>'+d.createdBy+'</td></tr>';
        });
        html += '</tbody></table></div>';
        html += '<div style="margin-top:15px;padding:15px;background:#f0fdf4;border-radius:12px;text-align:center;"><strong style="color:#16a34a;font-size:1.2rem;">Total des ventes: '+totalVentes.toFixed(2)+' MAD</strong></div>';
        container.innerHTML = html;
    }).catch(function(){ container.innerHTML = '<p style="text-align:center;padding:40px;color:#ef4444;">Erreur de chargement</p>'; });
}

// ==================== CREDITS ====================
function loadCreditsPage(content) {
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-credit-card"></i> Credits</h3><button class="btn-add" onclick="loadCreditsPage(document.getElementById(\'dynamicContent\'))"><i class="fas fa-sync"></i> Actualiser</button></div><div id="creditsTableContainer">Chargement...</div></div>';
    loadCredits();
}

function loadCredits() {
    var container = document.getElementById('creditsTableContainer'); if (!container) return;
    db.collection('credits').orderBy('createdAt','desc').limit(50).get().then(function(snapshot) {
        if (snapshot.empty) { container.innerHTML = '<p style="text-align:center;padding:40px;color:#94a3b8;">Aucun credit</p>'; return; }
        var totalCredits = 0;
        var html = '<div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Client</th><th>Total</th><th>Reste à payer</th><th>Statut</th><th>Actions</th></tr></thead><tbody>';
        snapshot.forEach(function(doc) {
            var d = doc.data();
            var date = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleString('fr-FR') : 'N/A';
            var reste = d.remainingAmount || d.total || 0;
            if (!d.paid) totalCredits += reste;
            var statut = d.paid ? '<span class="status-success">Payé</span>' : '<span class="status-warning">En cours</span>';
            html += '<tr><td>'+date+'</td><td>'+(d.clientName||d.table||'N/A')+'</td><td>'+d.total.toFixed(2)+' MAD</td><td><strong style="color:#ef4444;">'+reste.toFixed(2)+' MAD</strong></td><td>'+statut+'</td><td>'+(d.paid?'':'<button class="btn-add" style="padding:4px 8px;font-size:0.7rem;" onclick="markCreditPaid(\''+doc.id+'\')"><i class="fas fa-check"></i> Payer</button>')+'</td></tr>';
        });
        html += '</tbody></table></div>';
        html += '<div style="margin-top:15px;padding:15px;background:#fef2f2;border-radius:12px;text-align:center;"><strong style="color:#ef4444;font-size:1.2rem;">Total credits impayés: '+totalCredits.toFixed(2)+' MAD</strong></div>';
        container.innerHTML = html;
    }).catch(function(){ container.innerHTML = '<p style="text-align:center;padding:40px;color:#ef4444;">Erreur de chargement</p>'; });
}

function markCreditPaid(creditId) {
    if (confirm('Marquer ce credit comme paye ?')) {
        db.collection('credits').doc(creditId).update({paid:true,remainingAmount:0,paidAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){alert('Credit paye !');loadCredits();}).catch(function(err){alert('Erreur: '+err.message);});
    }
}

// ==================== CATEGORIES ====================
function loadCategoriesPage(content) { content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-layer-group"></i> Categories</h3><button class="btn-add" onclick="openCategoryForm()"><i class="fas fa-plus"></i> Nouvelle</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Image</th><th>Nom</th><th>Description</th><th>CA</th><th>Profit</th><th>Stock</th><th>Nb Produits</th><th>Actions</th></tr></thead><tbody id="categoriesTable"></tbody></table></div></div>'; loadCategories(); }

async function loadCategories() {
    var tbody = document.getElementById('categoriesTable'); if(!tbody)return;
    try{
        var snap = await db.collection('categories').orderBy('createdAt','desc').get();
        tbody.innerHTML = '';
        if(snap.empty){tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:30px;">Aucune categorie</td></tr>';return;}
        for(var i=0;i<snap.docs.length;i++){var doc=snap.docs[i],d=doc.data();var pc=0;try{var ps=await db.collection('products').where('categorie','==',d.nom).get();pc=ps.size;}catch(e){}var img=d.imageBase64?'<img src="'+d.imageBase64+'" style="width:40px;height:40px;object-fit:cover;border-radius:8px;">':'<i class="fas fa-folder fa-2x" style="color:#f39c12;"></i>';var pc2=(d.profit||0)>=0?'#16a34a':'#dc2626';tbody.innerHTML+='<tr><td>'+img+'</td><td><strong>'+d.nom+'</strong></td><td>'+(d.description||'-')+'</td><td>'+(d.ca||0).toFixed(2)+' MAD</td><td><strong style="color:'+pc2+';">'+(d.profit||0).toFixed(2)+' MAD</strong></td><td>'+(d.totalStock||0)+'</td><td><span class="status-success">'+pc+'</span></td><td><button class="btn-edit" onclick="editDocument(\'categories\',\''+doc.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'categories\',\''+doc.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';}
    }catch(e){tbody.innerHTML='<tr><td colspan="8">Erreur</td></tr>';}
}

function openCategoryForm(data) {
    data=data||{};var imgP=data.imageBase64?'<img src="'+data.imageBase64+'" style="max-width:100px;margin-top:5px;">':'';
    var html='<div class="form-row"><div class="form-group"><label>Image</label><input type="file" id="catImage" accept="image/*" onchange="previewImage(this,\'catPreview\')"><div id="catPreview">'+imgP+'</div></div></div><div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="catNom" value="'+(data.nom||'')+'" required></div><div class="form-group"><label>Description</label><textarea id="catDesc">'+(data.description||'')+'</textarea></div></div><div class="form-row"><div class="form-group"><label>CA</label><input type="number" id="catCA" value="'+(data.ca||0)+'" step="0.01"></div><div class="form-group"><label>Profit</label><input type="number" id="catProfit" value="'+(data.profit||0)+'" step="0.01"></div></div><div class="form-row"><div class="form-group"><label>Stock Total</label><input type="number" id="catStock" value="'+(data.totalStock||0)+'"></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveCategory()">Enregistrer</button>';
    currentCollection='categories';openModal(editingId?'Modifier Categorie':'Nouvelle Categorie',html);
}

function saveCategory() {
    var nom=document.getElementById('catNom').value;if(!nom){alert('Nom obligatoire');return;}
    var imgF=document.getElementById('catImage').files[0];
    var sf=function(img){var data={nom:nom,description:document.getElementById('catDesc').value,ca:parseFloat(document.getElementById('catCA').value)||0,profit:parseFloat(document.getElementById('catProfit').value)||0,totalStock:parseInt(document.getElementById('catStock').value)||0};if(img)data.imageBase64=img;saveDocument('categories',data,function(){closeModal();refreshCurrentPage();});};
    if(imgF){fileToBase64(imgF,sf);}else{sf(null);}
}

// ==================== PRODUITS ====================
function loadProductsPage(content) { content.innerHTML='<div class="content-card"><div class="card-header"><h3><i class="fas fa-utensils"></i> Produits</h3><div style="display:flex;gap:10px;"><select id="categoryFilter" class="role-select" style="width:auto;" onchange="filterProducts()"><option value="">Toutes categories</option></select><button class="btn-add" onclick="openProductForm()"><i class="fas fa-plus"></i> Nouveau</button></div></div><div class="table-container"><table class="data-table"><thead><tr><th>Image</th><th>Nom</th><th>Categorie</th><th>Prix Achat</th><th>Prix Vente</th><th>Profit</th><th>Prix Promo</th><th>Stock</th><th>Dispo</th><th>Actions</th></tr></thead><tbody id="productsTable"></tbody></table></div></div>';loadCategoriesInFilter();loadProducts(); }
async function loadCategoriesInFilter(){var s=document.getElementById('categoryFilter');if(!s)return;try{var sn=await db.collection('categories').get();sn.forEach(function(d){s.innerHTML+='<option value="'+d.data().nom+'">'+d.data().nom+'</option>';});}catch(e){}}
function filterProducts(){selectedCategoryFilter=document.getElementById('categoryFilter').value;loadProducts();}
function calculateProfit(data){var pv=data.prixPromo&&data.prixPromo>0?data.prixPromo:(data.prixVente||0);return pv-(data.prixAchat||0);}

async function loadProducts(){
    var tbody=document.getElementById('productsTable');if(!tbody)return;
    try{var snap=await db.collection('products').orderBy('createdAt','desc').get();tbody.innerHTML='';if(snap.empty){tbody.innerHTML='<tr><td colspan="10" style="text-align:center;padding:30px;">Aucun produit</td></tr>';return;}
        for(var i=0;i<snap.docs.length;i++){var doc=snap.docs[i],d=doc.data();if(selectedCategoryFilter&&d.categorie!==selectedCategoryFilter)continue;
            var profit=calculateProfit(d);var img=d.imageBase64?'<img src="'+d.imageBase64+'" style="width:40px;height:40px;object-fit:cover;border-radius:8px;">':'<div style="width:40px;height:40px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-utensils" style="color:#94a3b8;"></i></div>';
            var dispo=d.disponible!==false?'<span class="status-success">Oui</span>':'<span class="status-danger">Non</span>';var promo=d.prixPromo&&d.prixPromo>0?'<span style="color:#dc2626;">'+d.prixPromo.toFixed(2)+' MAD</span>':'-';var pc=profit>=0?'#16a34a':'#dc2626';
            tbody.innerHTML+='<tr><td>'+img+'</td><td><strong>'+d.nom+'</strong></td><td>'+(d.categorie||'-')+'</td><td>'+(d.prixAchat||0).toFixed(2)+' MAD</td><td>'+(d.prixVente||0).toFixed(2)+' MAD</td><td><strong style="color:'+pc+';">'+profit.toFixed(2)+' MAD</strong></td><td>'+promo+'</td><td>'+(d.stock||0)+'</td><td>'+dispo+'</td><td><button class="btn-edit" onclick="editDocument(\'products\',\''+doc.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'products\',\''+doc.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';}
    }catch(e){tbody.innerHTML='<tr><td colspan="10">Erreur</td></tr>';}
}

async function openProductForm(data){
    data=data||{};var catOpt='';try{var cs=await db.collection('categories').get();cs.forEach(function(d){var sel=data.categorie===d.data().nom?'selected':'';catOpt+='<option value="'+d.data().nom+'" '+sel+'>'+d.data().nom+'</option>';});}catch(e){}
    var imgP=data.imageBase64?'<img src="'+data.imageBase64+'" style="max-width:100px;margin-top:5px;">':'';var dy=data.disponible!==false?'selected':'',dn=data.disponible===false?'selected':'';
    var html='<div class="form-row"><div class="form-group"><label>Image</label><input type="file" id="prodImage" accept="image/*" onchange="previewImage(this,\'prodPreview\')"><div id="prodPreview">'+imgP+'</div></div></div><div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="prodNom" value="'+(data.nom||'')+'" required></div><div class="form-group"><label>Categorie</label><select id="prodCat"><option value="">-</option>'+catOpt+'</select></div></div><div class="form-row"><div class="form-group"><label>Prix Achat</label><input type="number" id="prodPA" value="'+(data.prixAchat||0)+'" step="0.01" onchange="calcP()"></div><div class="form-group"><label>Prix Vente</label><input type="number" id="prodPV" value="'+(data.prixVente||0)+'" step="0.01" onchange="calcP()"></div></div><div class="form-row"><div class="form-group"><label>Prix Promo</label><input type="number" id="prodPromo" value="'+(data.prixPromo||0)+'" step="0.01" onchange="calcP()"></div><div class="form-group"><label>Profit: <span id="profitPreview" style="color:#16a34a;">0.00 MAD</span></label></div></div><div class="form-row"><div class="form-group"><label>Stock</label><input type="number" id="prodStock" value="'+(data.stock||0)+'"></div><div class="form-group"><label>Temps Prep</label><input type="text" id="prodTemps" value="'+(data.tempsPrep||'')+'" placeholder="15 min"></div></div><div class="form-row"><div class="form-group"><label>Disponible</label><select id="prodDispo"><option value="1" '+dy+'>Oui</option><option value="0" '+dn+'>Non</option></select></div><div class="form-group"><label>Description</label><textarea id="prodDesc">'+(data.description||'')+'</textarea></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveProduct()">Enregistrer</button>';
    currentCollection='products';openModal(editingId?'Modifier Produit':'Nouveau Produit',html);setTimeout(calcP,100);
}

function calcP(){var pa=parseFloat(document.getElementById('prodPA').value)||0,pv=parseFloat(document.getElementById('prodPV').value)||0,pr=parseFloat(document.getElementById('prodPromo').value)||0;var pf=pr>0?pr:pv,profit=pf-pa;var el=document.getElementById('profitPreview');if(el){el.textContent=profit.toFixed(2)+' MAD';el.style.color=profit>=0?'#16a34a':'#dc2626';}}

function saveProduct(){
    var nom=document.getElementById('prodNom').value;if(!nom){alert('Nom obligatoire');return;}
    var imgF=document.getElementById('prodImage').files[0],pa=parseFloat(document.getElementById('prodPA').value)||0,pv=parseFloat(document.getElementById('prodPV').value)||0,pr=parseFloat(document.getElementById('prodPromo').value)||0,pf=pr>0?pr:pv;
    var sf=function(img){var data={nom:nom,categorie:document.getElementById('prodCat').value,prixAchat:pa,prixVente:pv,prixPromo:pr,profit:pf-pa,stock:parseInt(document.getElementById('prodStock').value)||0,vendues:0,ca:0,tempsPrep:document.getElementById('prodTemps').value,disponible:document.getElementById('prodDispo').value==='1',description:document.getElementById('prodDesc').value};if(img)data.imageBase64=img;saveDocument('products',data,function(){closeModal();refreshCurrentPage();});};
    if(imgF){fileToBase64(imgF,sf);}else{sf(null);}
}

// ==================== CLIENTS ====================
function loadClientsPage(content){content.innerHTML='<div class="content-card"><div class="card-header"><h3><i class="fas fa-users"></i> Clients</h3><button class="btn-add" onclick="openClientForm()"><i class="fas fa-plus"></i> Ajouter</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Nom</th><th>Prenom</th><th>Tel</th><th>CA</th><th>Points</th><th>Actions</th></tr></thead><tbody id="clientsTable"></tbody></table></div></div>';db.collection('clients').orderBy('createdAt','desc').get().then(function(sn){var tb=document.getElementById('clientsTable');tb.innerHTML='';if(sn.empty){tb.innerHTML='<tr><td colspan="6">Aucun</td></tr>';return;}sn.forEach(function(dc){var d=dc.data();tb.innerHTML+='<tr><td><strong>'+d.nom+'</strong></td><td>'+d.prenom+'</td><td>'+(d.telephone||'-')+'</td><td>'+(d.ca||0).toFixed(2)+' MAD</td><td>'+(d.points||0)+'</td><td><button class="btn-edit" onclick="editDocument(\'clients\',\''+dc.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'clients\',\''+dc.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';});});}
function openClientForm(data){data=data||{};var html='<div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="cliNom" value="'+(data.nom||'')+'" required></div><div class="form-group"><label>Prenom *</label><input type="text" id="cliPrenom" value="'+(data.prenom||'')+'" required></div></div><div class="form-row"><div class="form-group"><label>Tel</label><input type="text" id="cliTel" value="'+(data.telephone||'')+'"></div><div class="form-group"><label>CA</label><input type="number" id="cliCA" value="'+(data.ca||0)+'" step="0.01"></div></div><div class="form-row"><div class="form-group"><label>Points</label><input type="number" id="cliPoints" value="'+(data.points||0)+'"></div><div class="form-group"><label>Description</label><textarea id="cliDesc">'+(data.description||'')+'</textarea></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveClient()">Enregistrer</button>';currentCollection='clients';openModal(editingId?'Modifier Client':'Nouveau Client',html);}
function saveClient(){var n=document.getElementById('cliNom').value,p=document.getElementById('cliPrenom').value;if(!n||!p){alert('Nom et Prenom obligatoires');return;}saveDocument('clients',{nom:n,prenom:p,telephone:document.getElementById('cliTel').value,ca:parseFloat(document.getElementById('cliCA').value)||0,points:parseInt(document.getElementById('cliPoints').value)||0,description:document.getElementById('cliDesc').value},function(){closeModal();refreshCurrentPage();});}

// ==================== FOURNISSEURS ====================
function loadFournisseursPage(content){content.innerHTML='<div class="content-card"><div class="card-header"><h3><i class="fas fa-truck"></i> Fournisseurs</h3><button class="btn-add" onclick="openFournisseurForm()"><i class="fas fa-plus"></i> Ajouter</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Nom</th><th>Prenom</th><th>Tel</th><th>Actions</th></tr></thead><tbody id="fournisseursTable"></tbody></table></div></div>';db.collection('fournisseurs').orderBy('createdAt','desc').get().then(function(sn){var tb=document.getElementById('fournisseursTable');tb.innerHTML='';if(sn.empty){tb.innerHTML='<tr><td colspan="4">Aucun</td></tr>';return;}sn.forEach(function(dc){var d=dc.data();tb.innerHTML+='<tr><td><strong>'+d.nom+'</strong></td><td>'+d.prenom+'</td><td>'+(d.telephone||'-')+'</td><td><button class="btn-edit" onclick="editDocument(\'fournisseurs\',\''+dc.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'fournisseurs\',\''+dc.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';});});}
function openFournisseurForm(data){data=data||{};var html='<div class="form-row"><div class="form-group"><label>Nom *</label><input type="text" id="fourNom" value="'+(data.nom||'')+'" required></div><div class="form-group"><label>Prenom *</label><input type="text" id="fourPrenom" value="'+(data.prenom||'')+'" required></div></div><div class="form-row"><div class="form-group"><label>Tel</label><input type="text" id="fourTel" value="'+(data.telephone||'')+'"></div><div class="form-group"><label>Description</label><textarea id="fourDesc">'+(data.description||'')+'</textarea></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveFournisseur()">Enregistrer</button>';currentCollection='fournisseurs';openModal(editingId?'Modifier Fournisseur':'Nouveau Fournisseur',html);}
function saveFournisseur(){var n=document.getElementById('fourNom').value,p=document.getElementById('fourPrenom').value;if(!n||!p){alert('Nom et Prenom obligatoires');return;}saveDocument('fournisseurs',{nom:n,prenom:p,telephone:document.getElementById('fourTel').value,description:document.getElementById('fourDesc').value},function(){closeModal();refreshCurrentPage();});}

// ==================== DEPENSES ====================
function loadDepensesPage(content){content.innerHTML='<div class="content-card"><div class="card-header"><h3><i class="fas fa-money-bill-wave"></i> Depenses</h3><button class="btn-add" onclick="openDepenseForm()"><i class="fas fa-plus"></i> Ajouter</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Description</th><th>Montant</th><th>Actions</th></tr></thead><tbody id="depensesTable"></tbody></table></div></div>';db.collection('depenses').orderBy('createdAt','desc').get().then(function(sn){var tb=document.getElementById('depensesTable');tb.innerHTML='';if(sn.empty){tb.innerHTML='<tr><td colspan="4">Aucune</td></tr>';return;}sn.forEach(function(dc){var d=dc.data();tb.innerHTML+='<tr><td>'+(d.date||'-')+'</td><td>'+(d.description||'-')+'</td><td><strong style="color:#ef4444;">'+(d.montant||0).toFixed(2)+' MAD</strong></td><td><button class="btn-edit" onclick="editDocument(\'depenses\',\''+dc.id+'\')"><i class="fas fa-edit"></i></button> <button class="btn-delete" onclick="deleteDocument(\'depenses\',\''+dc.id+'\')"><i class="fas fa-trash"></i></button></td></tr>';});});}
function openDepenseForm(data){data=data||{};var html='<div class="form-row"><div class="form-group"><label>Date</label><input type="date" id="depDate" value="'+(data.date||new Date().toISOString().split('T')[0])+'"></div><div class="form-group"><label>Montant *</label><input type="number" id="depMontant" value="'+(data.montant||0)+'" step="0.01" required></div></div><div class="form-row"><div class="form-group"><label>Description</label><textarea id="depDesc">'+(data.description||'')+'</textarea></div></div><button class="btn-cancel" onclick="closeModal()">Annuler</button><button class="btn-save" onclick="saveDepense()">Enregistrer</button>';currentCollection='depenses';openModal(editingId?'Modifier Depense':'Nouvelle Depense',html);}
function saveDepense(){var m=parseFloat(document.getElementById('depMontant').value)||0;if(!m){alert('Montant obligatoire');return;}saveDocument('depenses',{date:document.getElementById('depDate').value,montant:m,description:document.getElementById('depDesc').value},function(){closeModal();refreshCurrentPage();});}

function openEditForm(cn,data){if(cn==='categories')openCategoryForm(data);else if(cn==='products')openProductForm(data);else if(cn==='clients')openClientForm(data);else if(cn==='fournisseurs')openFournisseurForm(data);else if(cn==='depenses')openDepenseForm(data);}

// ==================== OPTIONS ====================
function loadOptionsPage(content){
    if(!window.currentUserData||window.currentUserData.userData.role!=='admin'){content.innerHTML='<div class="content-card"><p>Acces refuse</p></div>';return;}
    content.innerHTML='<div class="stats-grid" style="margin-bottom:20px;"><div class="stat-card"><div class="stat-icon" style="background:#fef3c7;"><i class="fas fa-clock" style="color:#d97706;"></i></div><div class="stat-info"><span class="stat-label">En attente</span><span class="stat-value" id="pendingCount">0</span></div></div><div class="stat-card"><div class="stat-icon" style="background:#dcfce7;"><i class="fas fa-check-circle" style="color:#16a34a;"></i></div><div class="stat-info"><span class="stat-label">Autorises</span><span class="stat-value" id="authorizedCount">0</span></div></div><div class="stat-card"><div class="stat-icon" style="background:#e0e7ff;"><i class="fas fa-users" style="color:#4f46e5;"></i></div><div class="stat-info"><span class="stat-label">Total</span><span class="stat-value" id="totalUsers">0</span></div></div></div><div class="content-card"><div class="card-header"><h3>Tous les utilisateurs</h3><button class="btn-add" onclick="loadUsersList()">Actualiser</button></div><div class="table-container"><table class="data-table"><thead><tr><th>Username</th><th>Nom</th><th>Email</th><th>Role</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="usersTableBody"></tbody></table></div></div>';
    loadUsersList();
}

function loadUsersList(){
    db.collection('users').get().then(function(sn){
        var pending=0,authorized=0;var tb=document.getElementById('usersTableBody');tb.innerHTML='';
        if(sn.empty){tb.innerHTML='<tr><td colspan="6">Aucun</td></tr>';}
        var users=[];sn.forEach(function(dc){users.push({id:dc.id,data:dc.data()});});
        users.sort(function(a,b){return(b.data.createdAt?.seconds||0)-(a.data.createdAt?.seconds||0);});
        users.forEach(function(u){var d=u.data,id=u.id;if(d.authorized==='no')pending++;else authorized++;
            var badge=d.authorized==='yes'?'<span class="status-success">Autorise</span>':'<span class="status-warning">En attente</span>';
            var actions=d.authorized==='no'?'<button class="btn-add" style="padding:4px 8px;font-size:0.7rem;margin-right:5px;" onclick="approveUser(\''+id+'\')">Accepter</button><button class="btn-delete" style="padding:4px 8px;font-size:0.7rem;" onclick="rejectUser(\''+id+'\')">Refuser</button>':'<button style="padding:4px 8px;font-size:0.7rem;margin-right:5px;color:#d97706;border:none;cursor:pointer;background:#fef3c7;border-radius:6px;" onclick="blockUser(\''+id+'\')">Bloquer</button><button class="btn-delete" style="padding:4px 8px;font-size:0.7rem;" onclick="deleteUserPermanently(\''+id+'\')">Supprimer</button>';
            tb.innerHTML+='<tr><td>@'+d.username+'</td><td>'+d.prenom+' '+d.nom+'</td><td>'+d.email+'</td><td>'+d.role+'</td><td>'+badge+'</td><td>'+actions+'</td></tr>';
        });
        document.getElementById('pendingCount').textContent=pending;
        document.getElementById('authorizedCount').textContent=authorized;
        document.getElementById('totalUsers').textContent=sn.size;
    });
}

function blockUser(uid){if(confirm('Bloquer ?')){db.collection('users').doc(uid).update({authorized:'no'}).then(function(){alert('Bloque');loadUsersList();loadPendingRegistrations();});}}
function deleteUserPermanently(uid){if(confirm('Supprimer definitivement ?')){db.collection('users').doc(uid).delete().then(function(){alert('Supprime');loadUsersList();loadPendingRegistrations();});}}

console.log('Admin JS OK');
