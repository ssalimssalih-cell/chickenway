var clientCart = [];
var clientCategoriesList = [];
var clientProductsList = [];
var clientSelectedCategory = 'all';

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

async function loadClientCommanderPage() {
    var c = document.getElementById('clientDynamicContent');
    if (!c) return;
    clientCart = [];
    clientSelectedCategory = 'all';
    try {
        var catSnap = await db.collection('categories').get();
        clientCategoriesList = [];
        catSnap.forEach(function(d) { clientCategoriesList.push({id: d.id, nom: d.data().nom, imageBase64: d.data().imageBase64}); });
        
        var prodSnap = await db.collection('products').get();
        clientProductsList = [];
        prodSnap.forEach(function(d) {
            var dd = d.data();
            if (dd.disponible !== false) {
                clientProductsList.push({id: d.id, nom: dd.nom, prixVente: dd.prixVente||0, prixPromo: dd.prixPromo||0, stock: dd.stock, categorie: dd.categorie||'', imageBase64: dd.imageBase64||''});
            }
        });
    } catch(e) { console.error('Erreur chargement:', e); }
    renderClientPOS();
}

function renderClientPOS() {
    var c = document.getElementById('clientDynamicContent');
    if (!c) return;
    var total = clientCalculateTotal();
    
    var h = '<div class="pos-container"><div class="pos-products-panel"><div class="pos-categories-bar">';
    h += '<button class="pos-cat-btn ' + (clientSelectedCategory==='all'?'active':'') + '" onclick="clientFilterCategory(\'all\')"><i class="fas fa-th-large"></i> Tous</button>';
    for (var i = 0; i < clientCategoriesList.length; i++) {
        var cat = clientCategoriesList[i];
        var ac = clientSelectedCategory===cat.nom?'active':'';
        var ih = cat.imageBase64?'<img src="'+cat.imageBase64+'" alt="'+cat.nom+'">':'<i class="fas fa-folder"></i>';
        h += '<button class="pos-cat-btn '+ac+'" onclick="clientFilterCategory(\''+cat.nom.replace(/'/g,"\\'")+'\')">'+ih+' '+cat.nom+'</button>';
    }
    h += '</div><div class="pos-products-grid">';
    
    var filtered = clientProductsList;
    if (clientSelectedCategory!=='all') filtered = clientProductsList.filter(function(p){return p.categorie===clientSelectedCategory;});
    
    if (filtered.length===0) {
        h += '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8;">Aucun produit</div>';
    } else {
        for (var j = 0; j < filtered.length; j++) {
            var p = filtered[j];
            var pr = p.prixPromo&&p.prixPromo>0?p.prixPromo:p.prixVente;
            var hp = p.prixPromo&&p.prixPromo>0;
            h += '<div class="pos-product-card" onclick="clientAddToCart(\''+p.id+'\')">';
            if (p.imageBase64) h += '<div class="pos-product-img"><img src="'+p.imageBase64+'" alt="'+p.nom+'"></div>';
            else h += '<div class="pos-product-img pos-product-placeholder"><i class="fas fa-utensils"></i></div>';
            h += '<div class="pos-product-info"><span class="pos-product-name">'+p.nom+'</span><span class="pos-product-price">';
            if (hp) h += '<span class="pos-old-price">'+p.prixVente.toFixed(2)+'</span> <span class="pos-promo-price">'+pr.toFixed(2)+' MAD</span>';
            else h += pr.toFixed(2)+' MAD';
            h += '</span></div></div>';
        }
    }
    h += '</div></div>';
    
    h += '<div class="pos-cart-panel"><div class="pos-cart-header"><h3><i class="fas fa-shopping-cart"></i> Mon Panier <span class="pos-cart-badge">'+clientCart.length+'</span></h3><button class="pos-clear-btn" onclick="clientClearCart()"><i class="fas fa-trash-alt"></i> Vider</button></div><div class="pos-cart-items">';
    if (clientCart.length===0) {
        h += '<div class="pos-cart-empty"><i class="fas fa-shopping-basket"></i><p>Panier vide</p><span>Ajoutez des produits</span></div>';
    } else {
        for (var k = 0; k < clientCart.length; k++) {
            var it = clientCart[k];
            h += '<div class="pos-cart-item"><div class="pos-cart-item-info"><span class="pos-cart-item-name">'+it.nom+'</span><span class="pos-cart-item-price">'+it.prixUnitaire.toFixed(2)+' MAD/u</span></div><div class="pos-cart-item-actions"><button class="pos-qty-btn" onclick="clientUpdateQty('+k+',-1)"><i class="fas fa-minus"></i></button><span class="pos-qty-value">'+it.quantite+'</span><button class="pos-qty-btn" onclick="clientUpdateQty('+k+',1)"><i class="fas fa-plus"></i></button><button class="pos-remove-btn" onclick="clientRemoveItem('+k+')"><i class="fas fa-times"></i></button></div><span class="pos-cart-item-total">'+(it.prixUnitaire*it.quantite).toFixed(2)+' MAD</span></div>';
        }
    }
    h += '</div><div class="pos-cart-footer"><div class="pos-cart-total-row"><span>Total</span><span>'+total.toFixed(2)+' MAD</span></div><button class="pos-validate-btn" onclick="clientValidateOrder()" '+(clientCart.length===0?'disabled':'')+'><i class="fas fa-check-circle"></i> Commander</button></div></div></div>';
    c.innerHTML = h;
}

function clientFilterCategory(ca) { clientSelectedCategory = ca; renderClientPOS(); }
function clientAddToCart(pid) { var p = clientProductsList.find(function(x){return x.id===pid;}); if(!p)return; if(p.stock!==undefined&&p.stock<=0){alert('Rupture de stock');return;} var ex = clientCart.find(function(x){return x.id===pid;}); if(ex){if(p.stock!==undefined&&ex.quantite>=p.stock){alert('Stock insuffisant');return;}ex.quantite+=1;} else { var pr = p.prixPromo&&p.prixPromo>0?p.prixPromo:p.prixVente; clientCart.push({id:p.id,nom:p.nom,prixUnitaire:pr,quantite:1,categorie:p.categorie||''}); } renderClientPOS(); }
function clientUpdateQty(i,ch) { var it = clientCart[i]; if(!it)return; var p = clientProductsList.find(function(x){return x.id===it.id;}); var nq = it.quantite+ch; if(nq<=0){clientCart.splice(i,1);} else { if(p&&p.stock!==undefined&&nq>p.stock){alert('Stock max: '+p.stock);return;} it.quantite=nq; } renderClientPOS(); }
function clientRemoveItem(i) { clientCart.splice(i,1); renderClientPOS(); }
function clientCalculateTotal() { var t=0; for(var i=0;i<clientCart.length;i++)t+=clientCart[i].prixUnitaire*clientCart[i].quantite; return t; }
function clientClearCart() { clientCart = []; renderClientPOS(); }

async function clientValidateOrder() {
    if (clientCart.length===0) { alert('Votre panier est vide'); return; }
    var total = clientCalculateTotal();
    var ud = window.currentUserData ? window.currentUserData.userData : {};
    try {
        await db.collection('commandes').add({
            items: JSON.parse(JSON.stringify(clientCart)),
            total: total,
            clientId: window.currentUserData ? window.currentUserData.uid : null,
            clientName: ud.prenom + ' ' + ud.nom,
            clientEmail: ud.email,
            clientTelephone: ud.telephone,
            statut: 'en_attente',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('✅ Commande envoyée avec succès !\n\nTotal: ' + total.toFixed(2) + ' MAD\n\nVotre commande est en attente de validation.');
        clientCart = [];
        renderClientPOS();
    } catch(e) {
        console.error('Erreur commande:', e);
        alert('Erreur lors de l\'envoi de la commande. Veuillez réessayer.');
    }
}

async function loadClientHistoriquePage() {
    var c = document.getElementById('clientDynamicContent');
    if (!c) return;
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-history"></i> Mon historique</h3></div><div id="clientOrdersList" style="text-align:center;padding:20px;">Chargement...</div></div>';
    
    if (!window.currentUserData) {
        document.getElementById('clientOrdersList').innerHTML = '<p style="padding:40px;">Non connecté</p>';
        return;
    }
    
    var uid = window.currentUserData.uid;
    var uname = window.currentUserData.userData.prenom + ' ' + window.currentUserData.userData.nom;
    
    try {
        var cmdSnap = await db.collection('commandes').where('clientId','==',uid).orderBy('createdAt','desc').limit(30).get();
        var venteSnap = await db.collection('ventes').where('clientName','==',uname).orderBy('createdAt','desc').limit(30).get();
        
        var all = [];
        cmdSnap.forEach(function(d) { all.push({type:'commande', data:d.data(), date:d.data().createdAt}); });
        venteSnap.forEach(function(d) { all.push({type:'vente', data:d.data(), date:d.data().createdAt}); });
        all.sort(function(a,b) { return (b.date?.seconds||0) - (a.date?.seconds||0); });
        
        var cont = document.getElementById('clientOrdersList');
        if (all.length===0) { cont.innerHTML = '<p style="padding:40px;color:#94a3b8;">Aucun historique</p>'; return; }
        
        var h = '<div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Type</th><th>Articles</th><th>Total</th><th>Vendeur</th><th>Statut</th></tr></thead><tbody>';
        all.forEach(function(item) {
            var d = item.data;
            var date = d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleString('fr-FR') : '';
            var type = item.type==='commande' ? '🛒 Commande' : '💰 Vente';
            var arts = d.items ? d.items.length : 0;
            var vendeur = d.vendeur || d.createdBy || '-';
            var statut = item.type==='commande' ? (d.statut==='valide'?'✅ Validée':'⏳ En attente') : (d.paid?'✅ Payé':'❌ Impayé');
            var sc = (statut.includes('✅')) ? '#16a34a' : '#d97706';
            h += '<tr><td>'+date+'</td><td>'+type+'</td><td>'+arts+'</td><td><strong>'+d.total.toFixed(2)+' MAD</strong></td><td>'+vendeur+'</td><td><span style="color:'+sc+';">'+statut+'</span></td></tr>';
        });
        h += '</tbody></table></div>';
        cont.innerHTML = h;
    } catch(e) {
        document.getElementById('clientOrdersList').innerHTML = '<p style="padding:40px;color:#ef4444;">Erreur de chargement</p>';
    }
}

function loadClientParametresPage() {
    var c = document.getElementById('clientDynamicContent');
    if (!c) return;
    var u = window.currentUserData ? window.currentUserData.userData : {};
    c.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-cog"></i> Paramètres</h3></div><div style="padding:20px;"><p><strong>Nom:</strong> '+u.nom+'</p><p><strong>Prénom:</strong> '+u.prenom+'</p><p><strong>Email:</strong> '+u.email+'</p><p><strong>Téléphone:</strong> '+(u.telephone||'-')+'</p><p><strong>Username:</strong> @'+u.username+'</p></div></div>';
}

console.log('Client JS OK');
