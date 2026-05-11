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
        catSnap.forEach(function(doc) { posCategoriesList.push({id: doc.id, nom: doc.data().nom, imageBase64: doc.data().imageBase64}); });
        var prodSnap = await db.collection('products').get();
        posProductsList = [];
        prodSnap.forEach(function(doc) {
            var d = doc.data();
            if (d.disponible !== false) { posProductsList.push({id: doc.id, nom: d.nom, prixVente: d.prixVente||0, prixPromo: d.prixPromo||0, prixAchat: d.prixAchat||0, stock: d.stock, categorie: d.categorie||'', imageBase64: d.imageBase64||''}); }
        });
    } catch(e) { console.error('Erreur chargement POS:', e); }
    renderPOS();
}

function posResetCart() { posCart = []; posStep = 1; posSelectedCategory = 'all'; posCurrentClient = null; posCurrentTable = ''; posPaymentMethod = 'espece'; posAmountGiven = 0; }

function renderPOS() {
    var content = document.getElementById('dynamicContent');
    if (!content) return;
    var total = posCalculateTotal();
    var html = '<div class="pos-container"><div class="pos-products-panel"><div class="pos-categories-bar"><button class="pos-cat-btn ' + (posSelectedCategory==='all'?'active':'') + '" onclick="posFilterCategory(\'all\')"><i class="fas fa-th-large"></i> Tous</button>';
    for (var i = 0; i < posCategoriesList.length; i++) {
        var cat = posCategoriesList[i];
        var activeClass = posSelectedCategory===cat.nom?'active':'';
        var iconHtml = cat.imageBase64?'<img src="'+cat.imageBase64+'" alt="'+cat.nom+'">':'<i class="fas fa-folder"></i>';
        html += '<button class="pos-cat-btn '+activeClass+'" onclick="posFilterCategory(\''+cat.nom.replace(/'/g,"\\'")+'\')">'+iconHtml+' '+cat.nom+'</button>';
    }
    html += '</div><div class="pos-products-grid">';
    var filtered = posProductsList;
    if (posSelectedCategory!=='all') { filtered = posProductsList.filter(function(p){return p.categorie===posSelectedCategory;}); }
    if (filtered.length===0) { html += '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8;">Aucun produit</div>'; }
    else {
        for (var j = 0; j < filtered.length; j++) {
            var p = filtered[j];
            var price = p.prixPromo&&p.prixPromo>0?p.prixPromo:p.prixVente;
            var hasPromo = p.prixPromo&&p.prixPromo>0;
            var sc = '', st = '';
            if (p.stock!==undefined) { if(p.stock<=0){sc='pos-out-of-stock';st=' (Rupture)';} else if(p.stock<=5){st=' ('+p.stock+' rest.)';} }
            html += '<div class="pos-product-card '+sc+'" onclick="posAddToCart(\''+p.id+'\')">';
            if (p.imageBase64) { html += '<div class="pos-product-img"><img src="'+p.imageBase64+'" alt="'+p.nom+'"></div>'; }
            else { html += '<div class="pos-product-img pos-product-placeholder"><i class="fas fa-utensils"></i></div>'; }
            html += '<div class="pos-product-info"><span class="pos-product-name">'+p.nom+st+'</span><span class="pos-product-price">';
            if (hasPromo) { html += '<span class="pos-old-price">'+p.prixVente.toFixed(2)+'</span> <span class="pos-promo-price">'+price.toFixed(2)+' MAD</span>'; }
            else { html += price.toFixed(2)+' MAD'; }
            html += '</span></div></div>';
        }
    }
    html += '</div></div><div class="pos-cart-panel">';
    if (posStep===1) {
        html += '<div class="pos-cart-header"><h3><i class="fas fa-shopping-cart"></i> Panier <span id="posCartCount" class="pos-cart-badge">'+posCart.length+'</span></h3><button class="pos-clear-btn" onclick="posResetCart()"><i class="fas fa-trash-alt"></i> Vider</button></div><div class="pos-cart-items">';
        if (posCart.length===0) { html += '<div class="pos-cart-empty"><i class="fas fa-shopping-basket"></i><p>Panier vide</p><span>Cliquez sur les produits</span></div>'; }
        else { for (var k = 0; k < posCart.length; k++) { var it = posCart[k]; html += '<div class="pos-cart-item"><div class="pos-cart-item-info"><span class="pos-cart-item-name">'+it.nom+'</span><span class="pos-cart-item-price">'+it.prixUnitaire.toFixed(2)+' MAD/u</span></div><div class="pos-cart-item-actions"><button class="pos-qty-btn" onclick="posUpdateQty('+k+',-1)"><i class="fas fa-minus"></i></button><span class="pos-qty-value">'+it.quantite+'</span><button class="pos-qty-btn" onclick="posUpdateQty('+k+',1)"><i class="fas fa-plus"></i></button><button class="pos-remove-btn" onclick="posRemoveItem('+k+')"><i class="fas fa-times"></i></button></div><span class="pos-cart-item-total">'+(it.prixUnitaire*it.quantite).toFixed(2)+' MAD</span></div>'; } }
        html += '</div><div class="pos-cart-footer"><div class="pos-cart-total-row"><span>Total</span><span>'+total.toFixed(2)+' MAD</span></div><button class="pos-validate-btn" onclick="posGoToStep2()" '+(posCart.length===0?'disabled':'')+'><i class="fas fa-check-circle"></i> Valider</button></div>';
    } else if (posStep===2) {
        html += '<div class="pos-cart-header"><h3><i class="fas fa-credit-card"></i> Paiement</h3><button class="pos-back-btn" onclick="posGoToStep1()"><i class="fas fa-arrow-left"></i> Retour</button></div><div class="pos-payment-form"><div class="pos-payment-section"><label>Client</label><div class="pos-client-search"><input type="text" id="posClientSearch" placeholder="Rechercher..." onkeyup="posSearchClients(this.value)" autocomplete="off"><div id="posClientResults" class="pos-client-dropdown"></div></div><div class="pos-or-divider">— OU —</div><label>Table</label><input type="text" id="posTableNum" placeholder="Ex: Table 5" value="'+posCurrentTable+'" onchange="posSetTable(this.value)"></div><div class="pos-payment-section"><div class="pos-summary-box"><div class="pos-summary-row"><span>Articles</span><span>'+posCart.length+'</span></div><div class="pos-summary-total"><span>Total</span><span>'+total.toFixed(2)+' MAD</span></div></div></div><div class="pos-payment-section"><label>Paiement</label><div class="pos-payment-methods"><button class="pos-payment-btn '+(posPaymentMethod==='espece'?'active':'')+'" onclick="posSetPaymentMethod(\'espece\')"><i class="fas fa-money-bill-wave"></i> Especes</button><button class="pos-payment-btn '+(posPaymentMethod==='credit'?'active':'')+'" onclick="posSetPaymentMethod(\'credit\')"><i class="fas fa-credit-card"></i> Credit</button></div></div>';
        if (posPaymentMethod==='espece') { html += '<div class="pos-payment-section"><label>Montant donne</label><input type="number" id="posAmountGiven" placeholder="0.00" value="'+(posAmountGiven>0?posAmountGiven:'')+'" onkeyup="posCalculateChange()"><div id="posChangeDisplay"></div></div>'; }
        html += '<button class="pos-finalize-btn" onclick="posFinalizeSale()"><i class="fas fa-check-circle"></i> Finaliser</button></div>';
    }
    html += '</div></div>';
    content.innerHTML = html;
    if (posStep===2) setTimeout(posCalculateChange, 200);
}

function posFilterCategory(c) { posSelectedCategory = c; renderPOS(); }

function posAddToCart(pid) {
    var p = posProductsList.find(function(x){return x.id===pid;}); if(!p)return;
    if(p.stock!==undefined&&p.stock<=0){alert('Rupture de stock');return;}
    var ex = posCart.find(function(x){return x.id===pid;});
    if(ex){if(p.stock!==undefined&&ex.quantite>=p.stock){alert('Stock insuffisant');return;}ex.quantite+=1;}
    else{var pr=p.prixPromo&&p.prixPromo>0?p.prixPromo:p.prixVente;posCart.push({id:p.id,nom:p.nom,prixUnitaire:pr,prixAchat:p.prixAchat||0,quantite:1,categorie:p.categorie||'',imageBase64:p.imageBase64||''});}
    renderPOS();
}

function posUpdateQty(i, ch) {
    var it = posCart[i]; if(!it)return;
    var p = posProductsList.find(function(x){return x.id===it.id;});
    var nq = it.quantite + ch;
    if(nq<=0){posCart.splice(i,1);}else{if(p&&p.stock!==undefined&&nq>p.stock){alert('Stock max: '+p.stock);return;}it.quantite=nq;}
    renderPOS();
}

function posRemoveItem(i) { posCart.splice(i,1); renderPOS(); }
function posCalculateTotal() { var t=0; for(var i=0;i<posCart.length;i++)t+=posCart[i].prixUnitaire*posCart[i].quantite; return t; }
function posGoToStep2() { if(posCart.length===0){alert('Panier vide');return;} posStep=2; renderPOS(); }
function posGoToStep1() { posStep=1; renderPOS(); }

async function posSearchClients(q) {
    var d = document.getElementById('posClientResults'); if(!d)return;
    if(!q||q.length<1){d.innerHTML='';d.style.display='none';posCurrentClient=null;return;}
    try {
        var s = await db.collection('clients').orderBy('nom').startAt(q.toUpperCase()).endAt(q.toUpperCase()+'\uf8ff').limit(10).get();
        var cl=[]; var seen={};
        s.forEach(function(dc){if(!seen[dc.id]){cl.push({id:dc.id,nom:dc.data().nom,prenom:dc.data().prenom,telephone:dc.data().telephone});seen[dc.id]=true;}});
        if(cl.length===0){d.innerHTML='<div class="pos-client-item" style="color:#94a3b8;">Aucun</div>';}
        else{d.innerHTML='';cl.forEach(function(c){d.innerHTML+='<div class="pos-client-item" onclick="posSelectClient(\''+c.id+'\',\''+c.nom.replace(/'/g,"\\'")+' '+c.prenom.replace(/'/g,"\\'")+'\')"><i class="fas fa-user"></i> <strong>'+c.nom+' '+c.prenom+'</strong>'+(c.telephone?' <span class="pos-client-phone">('+c.telephone+')</span>':'')+'</div>';});}
        d.style.display='block';
    } catch(e) {}
}

function posSelectClient(id, name) { posCurrentClient={id:id,name:name}; posCurrentTable=''; document.getElementById('posClientSearch').value=name; document.getElementById('posTableNum').value=''; document.getElementById('posClientResults').style.display='none'; }
function posSetTable(v) { posCurrentTable=v; if(v){posCurrentClient=null;document.getElementById('posClientSearch').value='';} }
function posSetPaymentMethod(m) { posPaymentMethod=m; posAmountGiven=0; renderPOS(); }

function posCalculateChange() {
    var ai=document.getElementById('posAmountGiven'), cd=document.getElementById('posChangeDisplay');
    if(!ai||!cd)return;
    var t=posCalculateTotal(); posAmountGiven=parseFloat(ai.value)||0; var c=posAmountGiven-t;
    if(posAmountGiven>0){cd.innerHTML=c>=0?'<div class="pos-change-positive"><span>Rendu</span><span>'+c.toFixed(2)+' MAD</span></div>':'<div class="pos-change-negative"><span>Manquant</span><span>'+Math.abs(c).toFixed(2)+' MAD</span></div>';}
    else{cd.innerHTML='';}
}

async function posFinalizeSale() {
    var t=posCalculateTotal();
    if(!posCurrentClient&&!posCurrentTable){alert('Selectionnez un client ou une table');return;}
    if(posPaymentMethod==='espece'){posAmountGiven=parseFloat(document.getElementById('posAmountGiven').value)||0;if(posAmountGiven<t){alert('Montant insuffisant');return;}}
    try {
        var sd={items:posCart.slice(),total:t,clientId:posCurrentClient?posCurrentClient.id:null,clientName:posCurrentClient?posCurrentClient.name:null,table:posCurrentTable||null,paymentMethod:posPaymentMethod,amountGiven:posPaymentMethod==='espece'?posAmountGiven:t,change:posPaymentMethod==='espece'?(posAmountGiven-t):0,createdAt:firebase.firestore.FieldValue.serverTimestamp(),createdBy:window.currentUserData?window.currentUserData.userData.prenom+' '+window.currentUserData.userData.nom:'Inconnu',paid:posPaymentMethod!=='credit',remainingAmount:posPaymentMethod==='credit'?t:0};
        if(posPaymentMethod==='credit') await db.collection('credits').add(sd); else await db.collection('ventes').add(sd);
        for(var i=0;i<posCart.length;i++){
            var it=posCart[i];
            try{var pr=await db.collection('products').doc(it.id).get();if(pr.exists){var pd=pr.data();await db.collection('products').doc(it.id).update({stock:Math.max(0,(pd.stock||0)-it.quantite),vendues:(pd.vendues||0)+it.quantite,ca:(pd.ca||0)+(it.prixUnitaire*it.quantite),profit:(pd.profit||0)+((it.prixUnitaire-(it.prixAchat||0))*it.quantite),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});}}catch(e){}
        }
        if(posCurrentClient&&posCurrentClient.id){try{var cr=await db.collection('clients').doc(posCurrentClient.id).get();if(cr.exists){await db.collection('clients').doc(posCurrentClient.id).update({ca:(cr.data().ca||0)+t,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});}}catch(e){}}
        var msg='Vente enregistree !';
        if(posPaymentMethod==='espece'&&posAmountGiven>t) msg+='\nRendu: '+(posAmountGiven-t).toFixed(2)+' MAD';
        else if(posPaymentMethod==='credit') msg+='\nCredit enregistre.';
        alert(msg); posResetCart(); renderPOS();
    } catch(e) { console.error(e); alert('Erreur: '+e.message); }
}

console.log('Caissier JS OK');
