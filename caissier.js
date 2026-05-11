// ==================== POS SYSTEM ====================
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
        catSnap.forEach(function(doc) { posCategoriesList.push({id:doc.id, nom:doc.data().nom, imageBase64:doc.data().imageBase64}); });
        var prodSnap = await db.collection('products').get();
        posProductsList = [];
        prodSnap.forEach(function(doc) {
            var d = doc.data();
            if (d.disponible !== false) { posProductsList.push({id:doc.id, nom:d.nom, prixVente:d.prixVente||0, prixPromo:d.prixPromo||0, prixAchat:d.prixAchat||0, stock:d.stock, categorie:d.categorie||'', imageBase64:d.imageBase64||''}); }
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
    var filteredProducts = posProductsList;
    if (posSelectedCategory!=='all') { filteredProducts = posProductsList.filter(function(p){return p.categorie===posSelectedCategory;}); }
    if (filteredProducts.length===0) { html += '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8;">Aucun produit dans cette categorie</div>'; }
    else {
        for (var j = 0; j < filteredProducts.length; j++) {
            var product = filteredProducts[j];
            var price = product.prixPromo && product.prixPromo>0 ? product.prixPromo : product.prixVente;
            var hasPromo = product.prixPromo && product.prixPromo>0;
            var stockClass = '', stockText = '';
            if (product.stock!==undefined) { if (product.stock<=0){stockClass='pos-out-of-stock';stockText=' (Rupture)';} else if(product.stock<=5){stockText=' ('+product.stock+' rest.)';} }
            html += '<div class="pos-product-card '+stockClass+'" onclick="posAddToCart(\''+product.id+'\')">';
            if (product.imageBase64) { html += '<div class="pos-product-img"><img src="'+product.imageBase64+'" alt="'+product.nom+'"></div>'; }
            else { html += '<div class="pos-product-img pos-product-placeholder"><i class="fas fa-utensils"></i></div>'; }
            html += '<div class="pos-product-info"><span class="pos-product-name">'+product.nom+stockText+'</span><span class="pos-product-price">';
            if (hasPromo) { html += '<span class="pos-old-price">'+product.prixVente.toFixed(2)+'</span> <span class="pos-promo-price">'+price.toFixed(2)+' MAD</span>'; }
            else { html += price.toFixed(2)+' MAD'; }
            html += '</span></div></div>';
        }
    }
    html += '</div></div><div class="pos-cart-panel">';
    if (posStep===1) {
        html += '<div class="pos-cart-header"><h3><i class="fas fa-shopping-cart"></i> Panier <span id="posCartCount" class="pos-cart-badge">'+posCart.length+'</span></h3><button class="pos-clear-btn" onclick="posResetCart()"><i class="fas fa-trash-alt"></i> Vider</button></div><div class="pos-cart-items" id="posCartItems">';
        if (posCart.length===0) { html += '<div class="pos-cart-empty"><i class="fas fa-shopping-basket"></i><p>Panier vide</p><span>Cliquez sur les produits</span></div>'; }
        else {
            for (var k = 0; k < posCart.length; k++) {
                var item = posCart[k];
                html += '<div class="pos-cart-item"><div class="pos-cart-item-info"><span class="pos-cart-item-name">'+item.nom+'</span><span class="pos-cart-item-price">'+item.prixUnitaire.toFixed(2)+' MAD/u</span></div><div class="pos-cart-item-actions"><button class="pos-qty-btn" onclick="posUpdateQty('+k+',-1)"><i class="fas fa-minus"></i></button><span class="pos-qty-value">'+item.quantite+'</span><button class="pos-qty-btn" onclick="posUpdateQty('+k+',1)"><i class="fas fa-plus"></i></button><button class="pos-remove-btn" onclick="posRemoveItem('+k+')"><i class="fas fa-times"></i></button></div><span class="pos-cart-item-total">'+(item.prixUnitaire*item.quantite).toFixed(2)+' MAD</span></div>';
            }
        }
        html += '</div><div class="pos-cart-footer"><div class="pos-cart-total-row"><span>Total</span><span id="posTotal">'+total.toFixed(2)+' MAD</span></div><button class="pos-validate-btn" onclick="posGoToStep2()" '+(posCart.length===0?'disabled':'')+'><i class="fas fa-check-circle"></i> Valider la commande</button></div>';
    } else if (posStep===2) {
        html += '<div class="pos-cart-header"><h3><i class="fas fa-credit-card"></i> Paiement</h3><button class="pos-back-btn" onclick="posGoToStep1()"><i class="fas fa-arrow-left"></i> Retour</button></div><div class="pos-payment-form"><div class="pos-payment-section"><label>Client</label><div class="pos-client-search"><input type="text" id="posClientSearch" placeholder="Rechercher un client..." onkeyup="posSearchClients(this.value)" autocomplete="off"><div id="posClientResults" class="pos-client-dropdown"></div></div><div class="pos-or-divider">— OU —</div><label>Numero de table</label><input type="text" id="posTableNum" placeholder="Ex: Table 5" value="'+posCurrentTable+'" onchange="posSetTable(this.value)"></div><div class="pos-payment-section"><div class="pos-summary-box"><div class="pos-summary-row"><span>Articles</span><span>'+posCart.length+'</span></div><div class="pos-summary-total"><span>Total</span><span>'+total.toFixed(2)+' MAD</span></div></div></div><div class="pos-payment-section"><label>Methode de paiement</label><div class="pos-payment-methods"><button class="pos-payment-btn '+(posPaymentMethod==='espece'?'active':'')+'" onclick="posSetPaymentMethod(\'espece\')"><i class="fas fa-money-bill-wave"></i> Especes</button><button class="pos-payment-btn '+(posPaymentMethod==='credit'?'active':'')+'" onclick="posSetPaymentMethod(\'credit\')"><i class="fas fa-credit-card"></i> Credit</button></div></div>';
        if (posPaymentMethod==='espece') { html += '<div class="pos-payment-section"><label>Montant donne</label><input type="number" id="posAmountGiven" placeholder="0.00" value="'+(posAmountGiven>0?posAmountGiven:'')+'" onkeyup="posCalculateChange()"><div id="posChangeDisplay"></div></div>'; }
        html += '<button class="pos-finalize-btn" onclick="posFinalizeSale()"><i class="fas fa-check-circle"></i> Finaliser la vente</button></div>';
    }
    html += '</div></div>';
    content.innerHTML = html;
    if (posStep===2) { setTimeout(posCalculateChange, 200); }
}

function posFilterCategory(category) { posSelectedCategory = category; renderPOS(); }

function posAddToCart(productId) {
    var product = posProductsList.find(function(p){return p.id===productId;});
    if (!product) return;
    if (product.stock!==undefined && product.stock<=0) { alert('Produit en rupture de stock'); return; }
    var existingItem = posCart.find(function(item){return item.id===productId;});
    if (existingItem) { if (product.stock!==undefined && existingItem.quantite>=product.stock) { alert('Stock insuffisant'); return; } existingItem.quantite += 1; }
    else { var price = product.prixPromo && product.prixPromo>0 ? product.prixPromo : product.prixVente; posCart.push({id:product.id, nom:product.nom, prixUnitaire:price, prixAchat:product.prixAchat||0, quantite:1, categorie:product.categorie||'', imageBase64:product.imageBase64||''}); }
    renderPOS();
}

function posUpdateQty(index, change) {
    var item = posCart[index]; if (!item) return;
    var product = posProductsList.find(function(p){return p.id===item.id;});
    var newQty = item.quantite + change;
    if (newQty<=0) { posCart.splice(index,1); }
    else { if (product && product.stock!==undefined && newQty>product.stock) { alert('Stock insuffisant. Maximum: '+product.stock); return; } item.quantite = newQty; }
    renderPOS();
}

function posRemoveItem(index) { posCart.splice(index,1); renderPOS(); }

function posCalculateTotal() { var total = 0; for (var i = 0; i < posCart.length; i++) { total += posCart[i].prixUnitaire * posCart[i].quantite; } return total; }

function updateCartCount() { var badge = document.getElementById('posCartCount'); if (badge) badge.textContent = posCart.length; }

function posGoToStep2() { if (posCart.length===0) { alert('Le panier est vide'); return; } posStep = 2; renderPOS(); }
function posGoToStep1() { posStep = 1; renderPOS(); }

async function posSearchClients(query) {
    var resultsDiv = document.getElementById('posClientResults'); if (!resultsDiv) return;
    if (!query || query.length<1) { resultsDiv.innerHTML = ''; resultsDiv.style.display = 'none'; posCurrentClient = null; return; }
    try {
        var queryUpper = query.toUpperCase();
        var snapshot = await db.collection('clients').orderBy('nom').startAt(queryUpper).endAt(queryUpper+'\uf8ff').limit(10).get();
        var clients = []; var seenIds = {};
        snapshot.forEach(function(doc) { if (!seenIds[doc.id]) { clients.push({id:doc.id, nom:doc.data().nom, prenom:doc.data().prenom, telephone:doc.data().telephone}); seenIds[doc.id]=true; } });
        if (clients.length===0) { resultsDiv.innerHTML = '<div class="pos-client-item" style="color:#94a3b8;cursor:default;">Aucun client trouve</div>'; }
        else { resultsDiv.innerHTML = ''; clients.forEach(function(client) { resultsDiv.innerHTML += '<div class="pos-client-item" onclick="posSelectClient(\''+client.id+'\',\''+client.nom.replace(/'/g,"\\'")+' '+client.prenom.replace(/'/g,"\\'")+'\')"><i class="fas fa-user"></i> <strong>'+client.nom+' '+client.prenom+'</strong>'+(client.telephone?' <span class="pos-client-phone">('+client.telephone+')</span>':'')+'</div>'; }); }
        resultsDiv.style.display = 'block';
    } catch(e) { console.error('Erreur recherche clients:', e); }
}

function posSelectClient(id, name) {
    posCurrentClient = {id:id, name:name}; posCurrentTable = '';
    var searchInput = document.getElementById('posClientSearch'); var tableInput = document.getElementById('posTableNum');
    if (searchInput) searchInput.value = name; if (tableInput) tableInput.value = '';
    var resultsDiv = document.getElementById('posClientResults'); if (resultsDiv) resultsDiv.style.display = 'none';
}

function posSetTable(value) { posCurrentTable = value; if (value) { posCurrentClient = null; var searchInput = document.getElementById('posClientSearch'); if (searchInput) searchInput.value = ''; } }
function posSetPaymentMethod(method) { posPaymentMethod = method; posAmountGiven = 0; renderPOS(); }

function posCalculateChange() {
    var amountInput = document.getElementById('posAmountGiven'); var changeDisplay = document.getElementById('posChangeDisplay');
    if (!amountInput || !changeDisplay) return;
    var total = posCalculateTotal(); posAmountGiven = parseFloat(amountInput.value)||0; var change = posAmountGiven - total;
    if (posAmountGiven>0) { if (change>=0) { changeDisplay.innerHTML = '<div class="pos-change-positive"><span>Rendu</span><span>'+change.toFixed(2)+' MAD</span></div>'; } else { changeDisplay.innerHTML = '<div class="pos-change-negative"><span>Manquant</span><span>'+Math.abs(change).toFixed(2)+' MAD</span></div>'; } }
    else { changeDisplay.innerHTML = ''; }
}

async function posFinalizeSale() {
    var total = posCalculateTotal();
    if (!posCurrentClient && !posCurrentTable) { alert('Veuillez selectionner un client ou entrer un numero de table'); return; }
    if (posPaymentMethod==='espece') { posAmountGiven = parseFloat(document.getElementById('posAmountGiven').value)||0; if (posAmountGiven<total) { alert('Le montant donne est insuffisant'); return; } }
    try {
        var saleData = { items:posCart.slice(), total:total, clientId:posCurrentClient?posCurrentClient.id:null, clientName:posCurrentClient?posCurrentClient.name:null, table:posCurrentTable||null, paymentMethod:posPaymentMethod, amountGiven:posPaymentMethod==='espece'?posAmountGiven:total, change:posPaymentMethod==='espece'?(posAmountGiven-total):0, createdAt:firebase.firestore.FieldValue.serverTimestamp(), createdBy:window.currentUserData?window.currentUserData.userData.prenom+' '+window.currentUserData.userData.nom:'Inconnu', paid:posPaymentMethod!=='credit', remainingAmount:posPaymentMethod==='credit'?total:0 };
        if (posPaymentMethod==='credit') { await db.collection('credits').add(saleData); } else { await db.collection('ventes').add(saleData); }
        for (var i = 0; i < posCart.length; i++) {
            var item = posCart[i];
            try {
                var productRef = await db.collection('products').doc(item.id).get();
                if (productRef.exists) { var productData = productRef.data(); var newStock = Math.max(0,(productData.stock||0)-item.quantite); var newVendues = (productData.vendues||0)+item.quantite; var newCA = (productData.ca||0)+(item.prixUnitaire*item.quantite); var newProfit = (productData.profit||0)+((item.prixUnitaire-(item.prixAchat||0))*item.quantite); await db.collection('products').doc(item.id).update({stock:newStock,vendues:newVendues,ca:newCA,profit:newProfit,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}); }
            } catch(e) {}
        }
        if (posCurrentClient && posCurrentClient.id) { try { var clientRef = await db.collection('clients').doc(posCurrentClient.id).get(); if (clientRef.exists) { var clientData = clientRef.data(); await db.collection('clients').doc(posCurrentClient.id).update({ca:(clientData.ca||0)+total,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}); } } catch(e) {} }
        var message = 'Vente enregistree avec succes !';
        if (posPaymentMethod==='espece' && posAmountGiven>total) { message += '\nRendu: '+(posAmountGiven-total).toFixed(2)+' MAD'; }
        else if (posPaymentMethod==='credit') { message += '\nCredit enregistre.'; }
        alert(message); posResetCart(); renderPOS();
    } catch(e) { console.error('Erreur lors de la vente:', e); alert('Erreur: '+e.message); }
}
