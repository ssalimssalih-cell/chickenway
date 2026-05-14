var posCart = [], posStep = 1, posCategoriesList = [], posProductsList = [], posSelectedCategory = 'all';
var posCurrentClient = null, posCurrentTable = '', posPaymentMethod = 'espece', posAmountGiven = 0, posDiscountMAD = 0;
var posAllClients = [], posFilteredClients = [], posCurrentProductId = null;
var posSaucesList = ['Ketchup','Sauce Hot','Cheezy','Sauce Burger','Algérienne','Barbecue','Mayonnaise','Harissa','Samouraï','Andalouse'];
var posInterditsList = ['Oignon','Tomate','Cornichon','Olive','Fromage','Salade'];
var posEpicesList = ['Normal','Moins épicé','Très épicé','Sans épice'];
var posSelList = ['Normal','Moins de sel','Sans sel'];

async function loadPosPage(c) {
    posResetCart(); posStep = 1;
    try {
        var cs = await db.collection('categories').get(); posCategoriesList = []; cs.forEach(function(d) { posCategoriesList.push({id:d.id,nom:d.data().nom,imageBase64:d.data().imageBase64}); });
        var ps = await db.collection('products').get(); posProductsList = []; ps.forEach(function(d) { var dd = d.data(); if (dd.disponible !== false) { posProductsList.push({id:d.id,nom:dd.nom,prixVente:dd.prixVente||0,prixPromo:dd.prixPromo||0,prixAchat:dd.prixAchat||0,stock:dd.stock,categorie:dd.categorie||'',imageBase64:dd.imageBase64||''}); } });
        var cl = await db.collection('clients').orderBy('nom').get(); posAllClients = []; posFilteredClients = []; cl.forEach(function(d) { posAllClients.push({id:d.id,nom:d.data().nom,prenom:d.data().prenom,telephone:d.data().telephone}); }); posFilteredClients = posAllClients.slice();
    } catch(e) { console.error('Erreur POS:', e); }
    renderPOS();
}

function posResetCart() { posCart=[]; posStep=1; posSelectedCategory='all'; posCurrentClient=null; posCurrentTable=''; posPaymentMethod='espece'; posAmountGiven=0; posDiscountMAD=0; posFilteredClients = posAllClients.slice(); }

// ==================== RECHERCHE CLIENT DYNAMIQUE ====================
function posSearchClient(query) {
    var q = query.toLowerCase().trim();
    posCurrentClient = null; // Réinitialiser le client sélectionné
    
    if (!q) { 
        posFilteredClients = posAllClients.slice();
        document.getElementById('posClientDropdown').style.display = 'none';
    } else {
        posFilteredClients = posAllClients.filter(function(c) {
            return (c.nom||'').toLowerCase().indexOf(q) !== -1 || 
                   (c.prenom||'').toLowerCase().indexOf(q) !== -1 || 
                   (c.telephone||'').toLowerCase().indexOf(q) !== -1;
        });
        renderClientDropdown();
    }
}

function renderClientDropdown() {
    var dropdown = document.getElementById('posClientDropdown');
    if (!dropdown) return;
    
    if (posFilteredClients.length === 0) {
        dropdown.innerHTML = '<div style="padding:10px;color:#94a3b8;text-align:center;font-size:0.8rem;">Aucun client trouvé</div>';
    } else {
        var ddHtml = '';
        posFilteredClients.forEach(function(cl) {
            ddHtml += '<div class="pos-client-item" onclick="posSelectClientFromDropdown(\''+cl.id+'\', \''+cl.nom.replace(/'/g,"\\'")+' '+cl.prenom.replace(/'/g,"\\'")+'\')" style="padding:10px 12px;cursor:pointer;border-bottom:1px solid #f1f5f9;font-size:0.85rem;">'+cl.nom+' '+cl.prenom+' <span style="color:#94a3b8;font-size:0.7rem;">('+(cl.telephone||'N/A')+')</span></div>';
        });
        dropdown.innerHTML = ddHtml;
    }
    dropdown.style.display = 'block';
}

function posSelectClientFromDropdown(clientId, clientName) {
    posCurrentClient = {id: clientId, name: clientName};
    posCurrentTable = '';
    
    var searchInput = document.getElementById('posClientSearchInput');
    var tableInput = document.getElementById('posTableNum');
    var dropdown = document.getElementById('posClientDropdown');
    
    if (searchInput) searchInput.value = clientName;
    if (tableInput) tableInput.value = '';
    if (dropdown) dropdown.style.display = 'none'; // FERMER la liste
    
    // Mettre à jour les boutons de paiement
    updatePaymentButtons();
}

// Fermer le dropdown quand on clique ailleurs
document.addEventListener('click', function(event) {
    var dropdown = document.getElementById('posClientDropdown');
    var searchInput = document.getElementById('posClientSearchInput');
    if (dropdown && searchInput && !searchInput.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

function updatePaymentButtons() {
    setTimeout(function() {
        var creditBtn = document.getElementById('posCreditBtn');
        var partielBtn = document.getElementById('posPartielBtn');
        var canCredit = posCurrentClient && posCurrentClient.id;
        if (creditBtn) {
            creditBtn.disabled = !canCredit;
            creditBtn.style.opacity = canCredit ? '1' : '0.4';
            creditBtn.style.cursor = canCredit ? 'pointer' : 'not-allowed';
        }
        if (partielBtn) {
            partielBtn.disabled = !canCredit;
            partielBtn.style.opacity = canCredit ? '1' : '0.4';
            partielBtn.style.cursor = canCredit ? 'pointer' : 'not-allowed';
        }
    }, 300);
}

function posSetTable(value) {
    posCurrentTable = value.trim();
    if (posCurrentTable) {
        posCurrentClient = null;
        posPaymentMethod = 'espece';
        var searchInput = document.getElementById('posClientSearchInput');
        if (searchInput) searchInput.value = '';
    }
}

// ==================== OPTIONS PRODUIT ====================
function posOpenOptionsModal(pid) {
    var p = posProductsList.find(function(x){return x.id===pid;}); if (!p) return; if (p.stock!==undefined&&p.stock<=0) { alert('Rupture de stock'); return; }
    posCurrentProductId = pid;
    var h = '<h4 style="margin-bottom:10px;">'+p.nom+'</h4>';
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🥫 Sauces:</label><div style="display:flex;flex-wrap:wrap;gap:5px;">'; posSaucesList.forEach(function(s) { h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="checkbox" class="pos-sauce-check" value="'+s+'"> '+s+'</label>'; }); h += '</div></div>';
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🚫 Interdits:</label><div style="display:flex;flex-wrap:wrap;gap:5px;">'; posInterditsList.forEach(function(s) { h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="checkbox" class="pos-interdit-check" value="'+s+'"> '+s+'</label>'; }); h += '</div></div>';
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🌶️ Épices:</label><div style="display:flex;flex-wrap:wrap;gap:5px;">'; posEpicesList.forEach(function(s,idx) { h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="radio" name="pos-epice" value="'+s+'" '+(idx===0?'checked':'')+'> '+s+'</label>'; }); h += '</div></div>';
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🧂 Sel:</label><div style="display:flex;flex-wrap:wrap;gap:5px;">'; posSelList.forEach(function(s,idx) { h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="radio" name="pos-sel" value="'+s+'" '+(idx===0?'checked':'')+'> '+s+'</label>'; }); h += '</div></div>';
    h += '<div style="text-align:right;"><button class="btn-cancel" onclick="closeModal()" style="float:none;margin-right:8px;">Annuler</button><button class="btn-save" onclick="posConfirmOptions()" style="float:none;">Ajouter</button></div>';
    openModal('Personnaliser', h);
}

function posConfirmOptions() {
    var sauces=[]; document.querySelectorAll('.pos-sauce-check:checked').forEach(function(cb){sauces.push(cb.value);});
    var interdits=[]; document.querySelectorAll('.pos-interdit-check:checked').forEach(function(cb){interdits.push(cb.value);});
    var epice=document.querySelector('input[name="pos-epice"]:checked');epice=epice?epice.value:'Normal';
    var sel=document.querySelector('input[name="pos-sel"]:checked');sel=sel?sel.value:'Normal';
    var p=posProductsList.find(function(x){return x.id===posCurrentProductId;});if(!p){closeModal();return;}
    var ex=posCart.find(function(x){return x.id===posCurrentProductId;});
    if(ex){if(p.stock!==undefined&&ex.quantite>=p.stock){alert('Stock insuffisant');closeModal();return;}ex.quantite+=1;}
    else{var pr=p.prixPromo&&p.prixPromo>0?p.prixPromo:p.prixVente;posCart.push({id:p.id,nom:p.nom,prixUnitaire:pr,prixAchat:p.prixAchat||0,prixPromo:p.prixPromo||0,prixVente:p.prixVente||0,quantite:1,categorie:p.categorie||'',imageBase64:p.imageBase64||'',sauces:sauces,interdits:interdits,epice:epice,sel:sel});}
    closeModal();renderPOS();
}

// ==================== RENDU POS ====================
function renderPOS() {
    var c=document.getElementById('dynamicContent');if(!c)return;var st=posCalculateTotal();var t=st-posDiscountMAD;
    var h='<div class="pos-container"><div class="pos-products-panel"><div class="pos-categories-bar"><button class="pos-cat-btn '+(posSelectedCategory==='all'?'active':'')+'" onclick="posFilterCategory(\'all\')"><i class="fas fa-th-large"></i> Tous</button>';
    for(var i=0;i<posCategoriesList.length;i++){var ca=posCategoriesList[i];var ac=posSelectedCategory===ca.nom?'active':'';var ih=ca.imageBase64?'<img src="'+ca.imageBase64+'" alt="">':'<i class="fas fa-folder"></i>';h+='<button class="pos-cat-btn '+ac+'" onclick="posFilterCategory(\''+ca.nom.replace(/'/g,"\\'")+'\')">'+ih+' '+ca.nom+'</button>';}
    h+='</div><div class="pos-products-grid">';var f=posProductsList;if(posSelectedCategory!=='all')f=posProductsList.filter(function(p){return p.categorie===posSelectedCategory;});
    if(f.length===0){h+='<div style="grid-column:1/-1;text-align:center;padding:40px;">Aucun</div>';}else{for(var j=0;j<f.length;j++){var p=f[j];var pr=p.prixPromo&&p.prixPromo>0?p.prixPromo:p.prixVente;var hp=p.prixPromo&&p.prixPromo>0;var sc='',stt='';if(p.stock!==undefined){if(p.stock<=0){sc='pos-out-of-stock';stt=' (Rupture)';}else if(p.stock<=5){stt=' ('+p.stock+' rest.)';}}h+='<div class="pos-product-card '+sc+'" onclick="posOpenOptionsModal(\''+p.id+'\')">';if(p.imageBase64)h+='<div class="pos-product-img"><img src="'+p.imageBase64+'" alt=""></div>';else h+='<div class="pos-product-img pos-product-placeholder"><i class="fas fa-utensils"></i></div>';h+='<div class="pos-product-info"><span class="pos-product-name">'+p.nom+stt+'</span><span class="pos-product-price">';if(hp)h+='<span class="pos-old-price">'+p.prixVente.toFixed(2)+'</span> <span class="pos-promo-price">'+pr.toFixed(2)+' MAD</span>';else h+=pr.toFixed(2)+' MAD';h+='</span></div></div>';}}
    h+='</div></div><div class="pos-cart-panel">';
    
    if(posStep===1){
        h+='<div class="pos-cart-header"><h3><i class="fas fa-shopping-cart"></i> Panier <span class="pos-cart-badge">'+posCart.length+'</span></h3><button class="pos-clear-btn" onclick="posResetCart()"><i class="fas fa-trash-alt"></i> Vider</button></div><div class="pos-cart-items">';
        if(posCart.length===0){h+='<div class="pos-cart-empty"><i class="fas fa-shopping-basket"></i><p>Vide</p></div>';}else{for(var k=0;k<posCart.length;k++){var it=posCart[k];var opts='';if(it.sauces&&it.sauces.length>0)opts+=' <span style="color:#f39c12;font-size:0.6rem;">🥫'+it.sauces.join(',')+'</span>';if(it.interdits&&it.interdits.length>0)opts+=' <span style="color:#ef4444;font-size:0.6rem;">🚫'+it.interdits.join(',')+'</span>';if(it.epice&&it.epice!=='Normal')opts+=' <span style="color:#d97706;font-size:0.6rem;">🌶️'+it.epice+'</span>';if(it.sel&&it.sel!=='Normal')opts+=' <span style="color:#4f46e5;font-size:0.6rem;">🧂'+it.sel+'</span>';h+='<div class="pos-cart-item"><div class="pos-cart-item-info"><span class="pos-cart-item-name">'+it.nom+opts+'</span><span class="pos-cart-item-price">'+it.prixUnitaire.toFixed(2)+' MAD/u</span></div><div class="pos-cart-item-actions"><button class="pos-qty-btn" onclick="posUpdateQty('+k+',-1)"><i class="fas fa-minus"></i></button><span class="pos-qty-value">'+it.quantite+'</span><button class="pos-qty-btn" onclick="posUpdateQty('+k+',1)"><i class="fas fa-plus"></i></button><button class="pos-remove-btn" onclick="posRemoveItem('+k+')"><i class="fas fa-times"></i></button></div><span class="pos-cart-item-total">'+(it.prixUnitaire*it.quantite).toFixed(2)+' MAD</span></div>';}}
        h+='</div>';
        h+='<div style="padding:10px 0;display:flex;gap:10px;align-items:center;"><label>Remise (MAD):</label><input type="number" id="posDiscountMAD" value="'+posDiscountMAD+'" min="0" step="0.01" onchange="posUpdateDiscountMAD(this.value)" style="width:100px;padding:8px;border:2px solid #e2e8f0;border-radius:8px;"></div>';
        h+='<div class="pos-cart-footer">';
        if(posDiscountMAD>0)h+='<div style="display:flex;justify-content:space-between;font-size:0.85rem;"><span>Sous-total</span><span>'+st.toFixed(2)+'</span></div><div style="display:flex;justify-content:space-between;font-size:0.85rem;color:#ef4444;"><span>Remise</span><span>-'+posDiscountMAD.toFixed(2)+'</span></div>';
        h+='<div class="pos-cart-total-row"><span>Total</span><span>'+t.toFixed(2)+' MAD</span></div><button class="pos-validate-btn" onclick="posGoToStep2()" '+(posCart.length===0?'disabled':'')+'><i class="fas fa-check-circle"></i> Valider</button></div>';
    }
    else if(posStep===2){
        var canCredit = posCurrentClient && posCurrentClient.id;
        h+='<div class="pos-cart-header"><h3><i class="fas fa-credit-card"></i> Paiement</h3><button class="pos-back-btn" onclick="posGoToStep1()"><i class="fas fa-arrow-left"></i> Retour</button></div><div class="pos-payment-form">';
        
        // CLIENT - CHAMP TEXTE AVEC DROPDOWN CACHÉ AU DÉBUT
        h+='<div class="pos-payment-section"><label>Client</label>';
        h+='<div style="position:relative;">';
        h+='<input type="text" id="posClientSearchInput" placeholder="🔍 Tapez pour rechercher un client..." onkeyup="posSearchClient(this.value)" autocomplete="off" value="'+(posCurrentClient?posCurrentClient.name:'')+'" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:12px;font-size:0.9rem;box-sizing:border-box;">';
        h+='<div id="posClientDropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:2px solid #e2e8f0;border-radius:0 0 12px 12px;max-height:200px;overflow-y:auto;z-index:50;box-shadow:0 10px 30px rgba(0,0,0,0.15);"></div>';
        h+='</div></div>';
        
        h+='<div class="pos-or-divider">— OU —</div>';
        h+='<div class="pos-payment-section"><label>Table</label><input type="text" id="posTableNum" value="'+posCurrentTable+'" onchange="posSetTable(this.value)" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:12px;"></div>';
        
        // Résumé
        h+='<div class="pos-payment-section"><div class="pos-summary-box"><div class="pos-summary-row"><span>Articles</span><span>'+posCart.length+'</span></div>';if(posDiscountMAD>0)h+='<div class="pos-summary-row"><span>Remise</span><span style="color:#ef4444;">-'+posDiscountMAD.toFixed(2)+'</span></div>';h+='<div class="pos-summary-total"><span>Total</span><span>'+t.toFixed(2)+' MAD</span></div></div></div>';
        
        // Vendeur
        h+='<div class="pos-payment-section"><label>Vendeur</label><input type="text" id="posVendeur" value="'+(window.currentUserData?window.currentUserData.userData.prenom+' '+window.currentUserData.userData.nom:'')+'" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:12px;"></div>';
        
        // Méthodes de paiement
        h+='<div class="pos-payment-section"><label>Paiement</label><div class="pos-payment-methods">';
        h+='<button class="pos-payment-btn '+(posPaymentMethod==='espece'?'active':'')+'" onclick="posSetPaymentMethod(\'espece\')"><i class="fas fa-money-bill-wave"></i> Espèces</button>';
        h+='<button class="pos-payment-btn '+(posPaymentMethod==='credit'?'active':'')+'" onclick="posSetPaymentMethod(\'credit\')" id="posCreditBtn" '+(canCredit?'':'disabled style="opacity:0.4;cursor:not-allowed;"')+'><i class="fas fa-credit-card"></i> Crédit</button>';
        h+='<button class="pos-payment-btn '+(posPaymentMethod==='partiel'?'active':'')+'" onclick="posSetPaymentMethod(\'partiel\')" id="posPartielBtn" '+(canCredit?'':'disabled style="opacity:0.4;cursor:not-allowed;"')+'><i class="fas fa-hand-holding-usd"></i> Partiel</button>';
        h+='</div></div>';
        
        if(posPaymentMethod==='espece'||posPaymentMethod==='partiel')h+='<div class="pos-payment-section"><label>Montant donné</label><input type="number" id="posAmountGiven" placeholder="0.00" value="'+(posAmountGiven>0?posAmountGiven:'')+'" onkeyup="posCalculateChange()"><div id="posChangeDisplay"></div></div>';
        
        h+='<button class="pos-finalize-btn" onclick="posFinalizeSale()"><i class="fas fa-check-circle"></i> Finaliser</button></div>';
    }
    h+='</div></div>';c.innerHTML=h;
    if(posStep===2)setTimeout(posCalculateChange,200);
}

// ==================== FONCTIONS AUXILIAIRES ====================
function posFilterCategory(ca){posSelectedCategory=ca;renderPOS();}
function posUpdateDiscountMAD(v){posDiscountMAD=parseFloat(v)||0;if(posDiscountMAD<0)posDiscountMAD=0;renderPOS();}
function posUpdateQty(i,ch){var it=posCart[i];if(!it)return;var p=posProductsList.find(function(x){return x.id===it.id;});var nq=it.quantite+ch;if(nq<=0)posCart.splice(i,1);else{if(p&&p.stock!==undefined&&nq>p.stock){alert('Max: '+p.stock);return;}it.quantite=nq;}renderPOS();}
function posRemoveItem(i){posCart.splice(i,1);renderPOS();}
function posCalculateTotal(){var t=0;for(var i=0;i<posCart.length;i++)t+=posCart[i].prixUnitaire*posCart[i].quantite;return t;}
function posGoToStep2(){if(posCart.length===0){alert('Panier vide');return;}posStep=2;renderPOS();}
function posGoToStep1(){posStep=1;renderPOS();}
function posSetPaymentMethod(m){
    if((m==='credit'||m==='partiel')&&(!posCurrentClient||!posCurrentClient.id)){alert('Client requis pour crédit/partiel.');return;}
    posPaymentMethod=m;posAmountGiven=0;renderPOS();
}
function posCalculateChange(){var ai=document.getElementById('posAmountGiven'),cd=document.getElementById('posChangeDisplay');if(!ai||!cd)return;var st=posCalculateTotal();var t=st-posDiscountMAD;posAmountGiven=parseFloat(ai.value)||0;var c=posAmountGiven-t;if(posAmountGiven>0){cd.innerHTML=c>=0?'<div class="pos-change-positive"><span>Rendu</span><span>'+c.toFixed(2)+' MAD</span></div>':'<div class="pos-change-negative"><span>Manquant</span><span>'+Math.abs(c).toFixed(2)+' MAD</span></div>';}else{cd.innerHTML='';}}

async function posFinalizeSale() {
    var st=posCalculateTotal();var t=st-posDiscountMAD;
    if(!posCurrentClient&&!posCurrentTable){alert('Veuillez sélectionner un client ou entrer une table.');return;}
    if(posCurrentTable&&(posPaymentMethod==='credit'||posPaymentMethod==='partiel')){alert('Pour une table, seul le paiement espèces est autorisé.');return;}
    if((posPaymentMethod==='credit'||posPaymentMethod==='partiel')&&!posCurrentClient){alert('Client requis pour crédit/partiel.');return;}
    if(posPaymentMethod==='espece'){posAmountGiven=parseFloat(document.getElementById('posAmountGiven').value)||0;if(posAmountGiven<t){alert('Montant insuffisant.');return;}}
    var vendeur=document.getElementById('posVendeur').value.trim()||(window.currentUserData?window.currentUserData.userData.prenom+' '+window.currentUserData.userData.nom:'');
    try{
        var fcs=await db.collection('ventes').get();var fn='FACT-'+new Date().getFullYear()+'-'+String(fcs.size+1).padStart(5,'0');
        var remaining=0,paid=true,statutPaiement='payé',change=0;
        if(posPaymentMethod==='credit'){paid=false;remaining=t;statutPaiement='crédit';}
        else if(posPaymentMethod==='partiel'){posAmountGiven=parseFloat(document.getElementById('posAmountGiven').value)||0;remaining=t-posAmountGiven;paid=false;statutPaiement='partiel';change=Math.max(0,posAmountGiven-t);}
        else{posAmountGiven=parseFloat(document.getElementById('posAmountGiven').value)||0;change=posAmountGiven-t;paid=true;statutPaiement='payé';}
        if(posCurrentTable&&!posCurrentClient){paid=false;statutPaiement='en_attente';remaining=t;}
        var profitTotal=0;
        var itemsDetail=posCart.map(function(it){var pa=it.prixAchat||0,pvn=it.prixVente||0,pp=it.prixPromo||0,pvr=(pp>0)?pp:pvn;var prof=(pvr-pa)*it.quantite;profitTotal+=prof;return{id:it.id,nom:it.nom,quantite:it.quantite,prixVente:pvr,prixAchat:pa,prixPromo:pp,profit:prof,sauces:it.sauces||[],interdits:it.interdits||[],epice:it.epice||'Normal',sel:it.sel||'Normal'};});
        var sd={factureNum:fn,items:itemsDetail,subtotal:st,discountMAD:posDiscountMAD,total:t,clientId:posCurrentClient?posCurrentClient.id:null,clientName:posCurrentClient?posCurrentClient.name:null,table:posCurrentTable||null,vendeur:vendeur,paymentMethod:posPaymentMethod,statutPaiement:statutPaiement,amountGiven:posAmountGiven,change:change,paid:paid,remainingAmount:remaining,profitTotal:profitTotal,createdAt:firebase.firestore.FieldValue.serverTimestamp()};
        if(!paid)await db.collection('credits').add(sd);
        await db.collection('ventes').add(sd);
        for(var i=0;i<posCart.length;i++){var it=posCart[i];try{var pr=await db.collection('products').doc(it.id).get();if(pr.exists){var pd=pr.data();await db.collection('products').doc(it.id).update({stock:Math.max(0,(pd.stock||0)-it.quantite),vendues:(pd.vendues||0)+it.quantite,ca:(pd.ca||0)+(it.prixUnitaire*it.quantite),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});}}catch(e){}}
        if(posCurrentClient&&posCurrentClient.id&&paid){try{var cr=await db.collection('clients').doc(posCurrentClient.id).get();if(cr.exists){var cd=cr.data();await db.collection('clients').doc(posCurrentClient.id).update({ca:(cd.ca||0)+t,profit:(cd.profit||0)+profitTotal,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});}}catch(e){}}
        var msg='✅ Vente: '+fn+'\n💰 Total: '+t.toFixed(2)+' MAD';
        if(posPaymentMethod==='espece'&&posAmountGiven>t)msg+='\n💵 Rendu: '+change.toFixed(2)+' MAD';
        if(statutPaiement==='crédit')msg+='\n📋 Crédit enregistré.';
        if(statutPaiement==='partiel')msg+='\n📋 Reste: '+remaining.toFixed(2)+' MAD';
        if(statutPaiement==='en_attente')msg+='\n⏳ En attente de paiement.';
        alert(msg);posResetCart();renderPOS();
    }catch(e){alert('Erreur: '+e.message);}
}
function posSearchClients(q){}
function posAddToCart(pid){posOpenOptionsModal(pid);}
console.log('Caissier JS OK');
