var clientCart = [];
var clientCategoriesList = [];
var clientProductsList = [];
var clientSelectedCategory = 'all';
var clientCurrentProductId = null;

var clientSaucesList = ['Ketchup', 'Sauce Hot', 'Cheezy', 'Sauce Burger', 'Algérienne', 'Barbecue', 'Mayonnaise', 'Harissa', 'Samouraï', 'Andalouse', 'Biggy', 'Curry'];
var clientInterditsList = ['Oignon', 'Tomate', 'Cornichon', 'Olive', 'Fromage', 'Salade', 'Poivron', 'Champignon'];
var clientEpicesList = ['Normal', 'Moins épicé', 'Très épicé', 'Sans épice'];
var clientSelList = ['Normal', 'Moins de sel', 'Sans sel'];

function clientNavigate(page) {
    var items = document.querySelectorAll('#clientPage .nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    if (page === 'commander' && items[0]) items[0].classList.add('active');
    else if (page === 'historique' && items[1]) items[1].classList.add('active');
    else if (items[2]) items[2].classList.add('active');
    document.getElementById('clientPageTitle').textContent = page === 'commander' ? 'Commander' : page === 'historique' ? 'Mon historique' : 'Paramètres';
    if (page === 'commander') loadClientCommanderPage();
    else if (page === 'historique') loadClientHistoriquePage();
    else loadClientParametresPage();
}

// ==================== PAGE COMMANDER ====================
async function loadClientCommanderPage() {
    var c = document.getElementById('clientDynamicContent'); if (!c) return;
    clientCart = []; clientSelectedCategory = 'all';
    try {
        var cs = await db.collection('categories').get(); clientCategoriesList = []; cs.forEach(function(d) { clientCategoriesList.push({id: d.id, nom: d.data().nom, imageBase64: d.data().imageBase64}); });
        var ps = await db.collection('products').get(); clientProductsList = []; ps.forEach(function(d) { var dd = d.data(); if (dd.disponible !== false) { clientProductsList.push({id: d.id, nom: dd.nom, prixVente: dd.prixVente||0, prixPromo: dd.prixPromo||0, stock: dd.stock, categorie: dd.categorie||'', imageBase64: dd.imageBase64||''}); } });
    } catch(e) {}
    renderClientPOS();
}

function clientOpenOptionsModal(pid) {
    var p = clientProductsList.find(function(x) { return x.id === pid; });
    if (!p) return;
    if (p.stock !== undefined && p.stock <= 0) { alert('Rupture de stock'); return; }
    clientCurrentProductId = pid;
    var h = '<h4 style="margin-bottom:10px;">' + p.nom + '</h4>';
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🥫 Sauces :</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    clientSaucesList.forEach(function(s) { h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="checkbox" class="client-sauce-check" value="'+s+'"> '+s+'</label>'; });
    h += '</div></div>';
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🚫 Interdits :</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    clientInterditsList.forEach(function(s) { h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="checkbox" class="client-interdit-check" value="'+s+'"> '+s+'</label>'; });
    h += '</div></div>';
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🌶️ Épices :</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    clientEpicesList.forEach(function(s, idx) { h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="radio" name="client-epice" value="'+s+'" '+(idx===0?'checked':'')+'> '+s+'</label>'; });
    h += '</div></div>';
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🧂 Sel :</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    clientSelList.forEach(function(s, idx) { h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="radio" name="client-sel" value="'+s+'" '+(idx===0?'checked':'')+'> '+s+'</label>'; });
    h += '</div></div>';
    h += '<div style="text-align:right;"><button class="btn-cancel" onclick="closeModal()" style="float:none;margin-right:8px;">Annuler</button><button class="btn-save" onclick="clientConfirmOptions()" style="float:none;">Ajouter au panier</button></div>';
    openModal('Personnaliser - ' + p.nom, h);
}

function clientConfirmOptions() {
    var sauces = []; document.querySelectorAll('.client-sauce-check:checked').forEach(function(cb) { sauces.push(cb.value); });
    var interdits = []; document.querySelectorAll('.client-interdit-check:checked').forEach(function(cb) { interdits.push(cb.value); });
    var epice = document.querySelector('input[name="client-epice"]:checked'); epice = epice ? epice.value : 'Normal';
    var sel = document.querySelector('input[name="client-sel"]:checked'); sel = sel ? sel.value : 'Normal';
    var p = clientProductsList.find(function(x) { return x.id === clientCurrentProductId; });
    if (!p) { closeModal(); return; }
    var ex = clientCart.find(function(x) { return x.id === clientCurrentProductId; });
    if (ex) { if (p.stock !== undefined && ex.quantite >= p.stock) { alert('Stock insuffisant'); closeModal(); return; } ex.quantite += 1; }
    else { var pr = p.prixPromo && p.prixPromo > 0 ? p.prixPromo : p.prixVente; clientCart.push({id: p.id, nom: p.nom, prixUnitaire: pr, quantite: 1, categorie: p.categorie||'', sauces: sauces, interdits: interdits, epice: epice, sel: sel}); }
    if (interdits.length > 0 && window.currentUserData && window.currentUserData.uid) { saveClientPreferencesFromOrder(window.currentUserData.uid, interdits, sauces, epice, sel); }
    closeModal(); renderClientPOS();
}

async function saveClientPreferencesFromOrder(clientId, interdits, sauces, epice, sel) {
    try {
        var cr = await db.collection('clients').where('email', '==', window.currentUserData.userData.email).get();
        if (!cr.empty) {
            var clientDoc = cr.docs[0]; var cd = clientDoc.data();
            var existingInterdits = cd.interdits || []; var existingAime = cd.aime || [];
            interdits.forEach(function(i) { if (existingInterdits.indexOf(i) === -1) existingInterdits.push(i); });
            sauces.forEach(function(s) { if (existingAime.indexOf(s) === -1) existingAime.push(s); });
            await db.collection('clients').doc(clientDoc.id).update({ interdits: existingInterdits, aime: existingAime, epicePrefere: epice, selPrefere: sel, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
        }
    } catch(e) { console.error('Erreur sauvegarde préférences:', e); }
}

function renderClientPOS() {
    var c = document.getElementById('clientDynamicContent'); if (!c) return;
    var total = clientCalculateTotal();
    var h = '<div class="pos-container"><div class="pos-products-panel"><div class="pos-categories-bar"><button class="pos-cat-btn '+(clientSelectedCategory==='all'?'active':'')+'" onclick="clientFilterCategory(\'all\')"><i class="fas fa-th-large"></i> Tous</button>';
    for (var i = 0; i < clientCategoriesList.length; i++) { var ca = clientCategoriesList[i]; var ac = clientSelectedCategory===ca.nom?'active':''; var ih = ca.imageBase64?'<img src="'+ca.imageBase64+'" alt="'+ca.nom+'">':'<i class="fas fa-folder"></i>'; h += '<button class="pos-cat-btn '+ac+'" onclick="clientFilterCategory(\''+ca.nom.replace(/'/g,"\\'")+'\')">'+ih+' '+ca.nom+'</button>'; }
    h += '</div><div class="pos-products-grid">';
    var f = clientProductsList; if (clientSelectedCategory!=='all') f = clientProductsList.filter(function(p){return p.categorie===clientSelectedCategory;});
    if (f.length===0) { h += '<div style="grid-column:1/-1;text-align:center;padding:40px;">Aucun produit</div>'; }
    else { for (var j = 0; j < f.length; j++) { var p = f[j]; var pr = p.prixPromo&&p.prixPromo>0?p.prixPromo:p.prixVente; var hp = p.prixPromo&&p.prixPromo>0; h += '<div class="pos-product-card" onclick="clientOpenOptionsModal(\''+p.id+'\')">'; if (p.imageBase64) h += '<div class="pos-product-img"><img src="'+p.imageBase64+'" alt="'+p.nom+'"></div>'; else h += '<div class="pos-product-img pos-product-placeholder"><i class="fas fa-utensils"></i></div>'; h += '<div class="pos-product-info"><span class="pos-product-name">'+p.nom+'</span><span class="pos-product-price">'; if (hp) h += '<span class="pos-old-price">'+p.prixVente.toFixed(2)+'</span> <span class="pos-promo-price">'+pr.toFixed(2)+' MAD</span>'; else h += pr.toFixed(2)+' MAD'; h += '</span></div></div>'; } }
    h += '</div></div><div class="pos-cart-panel"><div class="pos-cart-header"><h3><i class="fas fa-shopping-cart"></i> Mon Panier <span class="pos-cart-badge">'+clientCart.length+'</span></h3><button class="pos-clear-btn" onclick="clientClearCart()"><i class="fas fa-trash-alt"></i> Vider</button></div><div class="pos-cart-items">';
    if (clientCart.length===0) { h += '<div class="pos-cart-empty"><i class="fas fa-shopping-basket"></i><p>Panier vide</p></div>'; }
    else { for (var k = 0; k < clientCart.length; k++) { var it = clientCart[k]; var opts = ''; if (it.sauces&&it.sauces.length>0) opts += ' <span style="color:#f39c12;font-size:0.6rem;">🥫'+it.sauces.join(',')+'</span>'; if (it.interdits&&it.interdits.length>0) opts += ' <span style="color:#ef4444;font-size:0.6rem;">🚫'+it.interdits.join(',')+'</span>'; if (it.epice&&it.epice!=='Normal') opts += ' <span style="color:#d97706;font-size:0.6rem;">🌶️'+it.epice+'</span>'; if (it.sel&&it.sel!=='Normal') opts += ' <span style="color:#4f46e5;font-size:0.6rem;">🧂'+it.sel+'</span>'; h += '<div class="pos-cart-item"><div class="pos-cart-item-info"><span class="pos-cart-item-name">'+it.nom+opts+'</span><span class="pos-cart-item-price">'+it.prixUnitaire.toFixed(2)+' MAD/u</span></div><div class="pos-cart-item-actions"><button class="pos-qty-btn" onclick="clientUpdateQty('+k+',-1)"><i class="fas fa-minus"></i></button><span class="pos-qty-value">'+it.quantite+'</span><button class="pos-qty-btn" onclick="clientUpdateQty('+k+',1)"><i class="fas fa-plus"></i></button><button class="pos-remove-btn" onclick="clientRemoveItem('+k+')"><i class="fas fa-times"></i></button></div><span class="pos-cart-item-total">'+(it.prixUnitaire*it.quantite).toFixed(2)+' MAD</span></div>'; } }
    h += '</div><div class="pos-cart-footer"><div class="pos-cart-total-row"><span>Total</span><span>'+total.toFixed(2)+' MAD</span></div><button class="pos-validate-btn" onclick="clientValidateOrder()" '+(clientCart.length===0?'disabled':'')+'><i class="fas fa-check-circle"></i> Commander</button></div></div></div>';
    c.innerHTML = h;
}

function clientFilterCategory(ca) { clientSelectedCategory = ca; renderClientPOS(); }
function clientUpdateQty(i, ch) { var it = clientCart[i]; if (!it) return; var p = clientProductsList.find(function(x) { return x.id === it.id; }); var nq = it.quantite + ch; if (nq <= 0) clientCart.splice(i, 1); else { if (p && p.stock !== undefined && nq > p.stock) { alert('Stock max: ' + p.stock); return; } it.quantite = nq; } renderClientPOS(); }
function clientRemoveItem(i) { clientCart.splice(i, 1); renderClientPOS(); }
function clientCalculateTotal() { var t = 0; for (var i = 0; i < clientCart.length; i++) t += clientCart[i].prixUnitaire * clientCart[i].quantite; return t; }
function clientClearCart() { clientCart = []; renderClientPOS(); }

async function clientValidateOrder() {
    if (clientCart.length === 0) { alert('Votre panier est vide'); return; }
    var total = clientCalculateTotal(); var ud = window.currentUserData ? window.currentUserData.userData : {};
    try {
        await db.collection('commandes').add({
            items: JSON.parse(JSON.stringify(clientCart)),
            total: total,
            clientId: window.currentUserData ? window.currentUserData.uid : null,
            clientName: ud.prenom + ' ' + ud.nom,
            clientEmail: ud.email,
            clientTelephone: ud.telephone,
            statut: 'en_attente',
            source: 'client',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('✅ Commande envoyée avec succès !\n\nTotal: ' + total.toFixed(2) + ' MAD\n\nVotre commande est en attente de validation.');
        clientCart = []; renderClientPOS();
    } catch(e) { console.error('Erreur commande:', e); alert('Erreur lors de l\'envoi de la commande.'); }
}

// ==================== PAGE HISTORIQUE (CORRIGÉE) ====================
async function loadClientHistoriquePage() {
    var c = document.getElementById('clientDynamicContent');
    if (!c) return;
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-history"></i> Mon historique</h3></div><div id="clientOrdersList" style="text-align:center;padding:20px;">Chargement...</div></div>';
    
    setTimeout(async function() {
        if (!window.currentUserData) {
            var cont = document.getElementById('clientOrdersList');
            if (cont) cont.innerHTML = '<p style="padding:40px;">Non connecté</p>';
            return;
        }
        var uid = window.currentUserData.uid;
        var uname = window.currentUserData.userData.prenom + ' ' + window.currentUserData.userData.nom;
        try {
            var cmdSnap = await db.collection('commandes').where('clientId','==',uid).orderBy('createdAt','desc').limit(30).get();
            var venteSnap = await db.collection('ventes').where('clientName','==',uname).orderBy('createdAt','desc').limit(30).get();
            var all = []; cmdSnap.forEach(function(d) { all.push({type:'commande', data:d.data(), date:d.data().createdAt}); }); venteSnap.forEach(function(d) { all.push({type:'vente', data:d.data(), date:d.data().createdAt}); });
            all.sort(function(a,b) { return (b.date?.seconds||0) - (a.date?.seconds||0); });
            var cont = document.getElementById('clientOrdersList');
            if (!cont) return;
            if (all.length===0) { cont.innerHTML = '<p style="padding:40px;color:#94a3b8;">Aucun historique</p>'; return; }
            var h = '<div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Type</th><th>Articles</th><th>Total</th><th>Vendeur</th><th>Statut</th></tr></thead><tbody>';
            all.forEach(function(item) {
                var d = item.data;
                var date = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleString('fr-FR') : '';
                var type = item.type==='commande' ? '🛒 Commande' : '💰 Vente';
                var arts = d.items ? d.items.length : 0;
                var vendeur = d.vendeur || d.createdBy || '-';
                var statut = item.type==='commande' ? (d.statut==='valide'?'✅ Validée':d.statut==='payé'?'💵 Payée':'⏳ En attente') : (d.paid?'✅ Payé':'❌ Impayé');
                var sc = (statut.includes('✅')||statut.includes('💵')) ? '#16a34a' : '#d97706';
                h += '<tr><td>'+date+'</td><td>'+type+'</td><td>'+arts+'</td><td><strong>'+(d.total||0).toFixed(2)+' MAD</strong></td><td>'+vendeur+'</td><td><span style="color:'+sc+';">'+statut+'</span></td></tr>';
            });
            h += '</tbody></table></div>'; cont.innerHTML = h;
        } catch(e) {
            var cont2 = document.getElementById('clientOrdersList');
            if (cont2) cont2.innerHTML = '<p style="padding:40px;color:#ef4444;">Erreur de chargement</p>';
        }
    }, 200);
}

function loadClientParametresPage() {
    var c = document.getElementById('clientDynamicContent'); if (!c) return;
    var u = window.currentUserData ? window.currentUserData.userData : {};
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-cog"></i> Paramètres</h3></div><div style="padding:20px;"><p><strong>Nom:</strong> '+u.nom+'</p><p><strong>Prénom:</strong> '+u.prenom+'</p><p><strong>Email:</strong> '+u.email+'</p><p><strong>Téléphone:</strong> '+(u.telephone||'-')+'</p><p><strong>Username:</strong> @'+u.username+'</p></div></div>';
}

console.log('Client JS OK');
