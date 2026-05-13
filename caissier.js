var posCart = [], posStep = 1, posCategoriesList = [], posProductsList = [], posSelectedCategory = 'all';
var posCurrentClient = null, posCurrentTable = '', posPaymentMethod = 'espece', posAmountGiven = 0, posDiscount = 0;
var posAllClients = [], posCurrentProductId = null;
var posSaucesList = ['Ketchup','Sauce Hot','Cheezy','Sauce Burger','Algérienne','Barbecue','Mayonnaise','Harissa','Samouraï','Andalouse'];
var posInterditsList = ['Oignon','Tomate','Cornichon','Olive','Fromage','Salade'];
var posEpicesList = ['Normal','Moins épicé','Très épicé','Sans épice'];

async function loadPosPage(c) {
    posResetCart();
    posStep = 1;
    try {
        var cs = await db.collection('categories').get();
        posCategoriesList = [];
        cs.forEach(function(d) { posCategoriesList.push({id:d.id,nom:d.data().nom,imageBase64:d.data().imageBase64}); });
        
        var ps = await db.collection('products').get();
        posProductsList = [];
        ps.forEach(function(d) {
            var dd = d.data();
            if (dd.disponible !== false) {
                posProductsList.push({id:d.id,nom:dd.nom,prixVente:dd.prixVente||0,prixPromo:dd.prixPromo||0,prixAchat:dd.prixAchat||0,stock:dd.stock,categorie:dd.categorie||'',imageBase64:dd.imageBase64||''});
            }
        });
        
        var cl = await db.collection('clients').orderBy('nom').get();
        posAllClients = [];
        cl.forEach(function(d) { posAllClients.push({id:d.id,nom:d.data().nom,prenom:d.data().prenom,telephone:d.data().telephone}); });
    } catch(e) { console.error('Erreur POS:', e); }
    renderPOS();
}

function posResetCart() { posCart=[]; posStep=1; posSelectedCategory='all'; posCurrentClient=null; posCurrentTable=''; posPaymentMethod='espece'; posAmountGiven=0; posDiscount=0; }

function posOpenOptionsModal(pid) {
    var p = posProductsList.find(function(x){return x.id===pid;});
    if (!p) return;
    if (p.stock!==undefined&&p.stock<=0) { alert('Rupture de stock'); return; }
    posCurrentProductId = pid;
    
    var h = '<h4 style="margin-bottom:10px;">'+p.nom+'</h4>';
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🥫 Sauces:</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    posSaucesList.forEach(function(s) { h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="checkbox" class="pos-sauce-check" value="'+s+'"> '+s+'</label>'; });
    h += '</div></div>';
    
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🚫 Interdits:</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    posInterditsList.forEach(function(s) { h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="checkbox" class="pos-interdit-check" value="'+s+'"> '+s+'</label>'; });
    h += '</div></div>';
    
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🌶️ Épices:</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    posEpicesList.forEach(function(s,idx) { h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="radio" name="pos-epice" value="'+s+'" '+(idx===0?'checked':'')+'> '+s+'</label>'; });
    h += '</div></div>';
    
    h += '<div style="text-align:right;"><button class="btn-cancel" onclick="closeModal()" style="float:none;margin-right:8px;">Annuler</button><button class="btn-save" onclick="posConfirmOptions()" style="float:none;">Ajouter</button></div>';
    openModal('Personnaliser', h);
}

function posConfirmOptions() {
    var sauces = []; document.querySelectorAll('.pos-sauce-check:checked').forEach(function(cb){sauces.push(cb.value);});
    var interdits = []; document.querySelectorAll('.pos-interdit-check:checked').forEach(function(cb){interdits.push(cb.value);});
    var epice = document.querySelector('input[name="pos-epice"]:checked'); epice = epice ? epice.value : 'Normal';
    
    var p = posProductsList.find(function(x){return x.id===posCurrentProductId;});
    if (!p) { closeModal(); return; }
    
    var ex = posCart.find(function(x){return x.id===posCurrentProductId;});
    if (ex) {
        if (p.stock!==undefined&&ex.quantite>=p.stock) { alert('Stock insuffisant'); closeModal(); return; }
        ex.quantite += 1;
    } else {
        var pr = p.prixPromo&&p.prixPromo>0 ? p.prixPromo : p.prixVente;
        posCart.push({id:p.id,nom:p.nom,prixUnitaire:pr,prixAchat:p.prixAchat||0,quantite:1,categorie:p.categorie||'',imageBase64:p.imageBase64||'',sauces:sauces,interdits:interdits,epice:epice});
    }
    closeModal();
    renderPOS();
}

function renderPOS() {
    var c = document.getElementById('dynamicContent'); if (!c) return;
    var st = posCalculateTotal(); var da = st*(posDiscount/100); var t = st-da;
    
    var h = '<div class="pos-container"><div class="pos-products-panel"><div class="pos-categories-bar">';
    h += '<button class="pos-cat-btn '+(posSelectedCategory==='all'?'active':'')+'" onclick="posFilterCategory(\'all\')"><i class="fas fa-th-large"></i> Tous</button>';
    for (var i=0;i<posCategoriesList.length;i++) { var ca=posCategoriesList[i]; var ac=posSelectedCategory===ca.nom?'active':''; var ih=ca.imageBase64?'<img src="'+ca.imageBase64+'" alt="">':'<i class="fas fa-folder"></i>'; h+='<button class="pos-cat-btn '+ac+'" onclick="posFilterCategory(\''+ca.nom.replace(/'/g,"\\'")+'\')">'+ih+' '+ca.nom+'</button>'; }
    h += '</div><div class="pos-products-grid">';
    var f = posProductsList; if (posSelectedCategory!=='all') f = posProductsList.filter(function(p){return p.categorie===posSelectedCategory;});
    if (f.length===0) { h += '<div style="grid-column:1/-1;text-align:center;padding:40px;">Aucun produit</div>'; }
    else { for (var j=0;j<f.length;j++) { var p=f[j]; var pr=p.prixPromo&&p.prixPromo>0?p.prixPromo:p.prixVente; var hp=p.prixPromo&&p.prixPromo>0; var sc='',stt=''; if(p.stock!==undefined){if(p.stock<=0){sc='pos-out-of-stock';stt=' (Rupture)';}else if(p.stock<=5){stt=' ('+p.stock+' rest.)';}} h+='<div class="pos-product-card '+sc+'" onclick="posOpenOptionsModal(\''+p.id+'\')">'; if(p.imageBase64)h+='<div class="pos-product-img"><img src="'+p.imageBase64+'" alt=""></div>';else h+='<div class="pos-product-img pos-product-placeholder"><i class="fas fa-utensils"></i></div>'; h+='<div class="pos-product-info"><span class="pos-product-name">'+p.nom+stt+'</span><span class="pos-product-price">'; if(hp)h+='<span class="pos-old-price">'+p.prixVente.toFixed(2)+'</span> <span class="pos-promo-price">'+pr.toFixed(2)+' MAD</span>';else h+=pr.toFixed(2)+' MAD'; h+='</span></div></div>'; } }
    h += '</div></div><div class="pos-cart-panel">';
    
    if (posStep===1) {
        h += '<div class="pos-cart-header"><h3><i class="fas fa-shopping-cart"></i> Panier <span class="pos-cart-badge">'+posCart.length+'</span></h3><button class="pos-clear-btn" onclick="posResetCart()"><i class="fas fa-trash-alt"></i> Vider</button></div><div class="pos-cart-items">';
        if (posCart.length===0) { h += '<div class="pos-cart-empty"><i class="fas fa-shopping-basket"></i><p>Panier vide</p></div>'; }
        else { for (var k=0;k<posCart.length;k++) { var it=posCart[k]; var opts=''; if(it.sauces&&it.sauces.length>0)opts+=' <span style="color:#f39c12;font-size:0.6rem;">🥫'+it.sauces.join(',')+'</span>'; if(it.interdits&&it.interdits.length>0)opts+=' <span style="color:#ef4444;font-size:0.6rem;">🚫'+it.interdits.join(',')+'</span>'; if(it.epice&&it.epice!=='Normal')opts+=' <span style="color:#d97706;font-size:0.6rem;">🌶️'+it.epice+'</span>'; h+='<div class="pos-cart-item"><div class="pos-cart-item-info"><span class="pos-cart-item-name">'+it.nom+opts+'</span><span class="pos-cart-item-price">'+it.prixUnitaire.toFixed(2)+' MAD/u</span></div><div class="pos-cart-item-actions"><button class="pos-qty-btn" onclick="posUpdateQty('+k+',-1)"><i class="fas fa-minus"></i></button><span class="pos-qty-value">'+it.quantite+'</span><button class="pos-qty-btn" onclick="posUpdateQty('+k+',1)"><i class="fas fa-plus"></i></button><button class="pos-remove-btn" onclick="posRemoveItem('+k+')"><i class="fas fa-times"></i></button></div><span class="pos-cart-item-total">'+(it.prixUnitaire*it.quantite).toFixed(2)+' MAD</span></div>'; } }
        h += '</div><div style="padding:10px 0;display:flex;gap:10px;align-items:center;"><label>Remise (%):</label><input type="number" id="posDiscount" value="'+posDiscount+'" min="0" max="100" onchange="posUpdateDiscount(this.value)" style="width:80px;padding:8px;border:2px solid #e2e8f0;border-radius:8px;"></div><div class="pos-cart-footer">';
        if (posDiscount>0) h += '<div style="display:flex;justify-content:space-between;font-size:0.85rem;"><span>Sous-total</span><span>'+st.toFixed(2)+'</span></div><div style="display:flex;justify-content:space-between;font-size:0.85rem;color:#ef4444;"><span>Remise</span><span>-'+da.toFixed(2)+'</span></div>';
        h += '<div class="pos-cart-total-row"><span>Total</span><span>'+t.toFixed(2)+' MAD</span></div><button class="pos-validate-btn" onclick="posGoToStep2()" '+(posCart.length===0?'disabled':'')+'><i class="fas fa-check-circle"></i> Valider</button></div>';
    } else if (posStep===2) {
        h += '<div class="pos-cart-header"><h3><i class="fas fa-credit-card"></i> Paiement</h3><button class="pos-back-btn" onclick="posGoToStep1()"><i class="fas fa-arrow-left"></i> Retour</button></div><div class="pos-payment-form">';
        h += '<div class="pos-payment-section"><label>Client</label><select id="posClientSelect" onchange="posSelectClientFromList(this.value)" style="width:100%;padding:10px;border:2px solid #e2e8f0;border-radius:12px;"><option value="">— Aucun —</option>';
        for (var x=0;x<posAllClients.length;x++) { var cl=posAllClients[x]; h+='<option value="'+cl.id+'">'+cl.nom+' '+cl.prenom+(cl.telephone?' ('+cl.telephone+')':'')+'</option>'; }
        h += '</select></div><div class="pos-or-divider">— OU —</div><div class="pos-payment-section"><label>Table</label><input type="text" id="posTableNum" value="'+posCurrentTable+'" onchange="posSetTable(this.value)"></div>';
        h += '<div class="pos-payment-section"><div class="pos-summary-box"><div class="pos-summary-row"><span>Articles</span><span>'+posCart.length+'</span></div>'; if(posDiscount>0)h+='<div class="pos-summary-row"><span>Remise</span><span style="color:#ef4444;">-'+da.toFixed(2)+'</span></div>'; h+='<div class="pos-summary-total"><span>Total</span><span>'+t.toFixed(2)+' MAD</span></div></div></div>';
        h += '<div class="pos-payment-section"><label>Vendeur</label><input type="text" id="posVendeur" value="'+(window.currentUserData?window.currentUserData.userData.prenom+' '+window.currentUserData.userData.nom:'')+'"></div>';
        h += '<div class="pos-payment-section"><label>Paiement</label><div class="pos-payment-methods"><button class="pos-payment-btn '+(posPaymentMethod==='espece'?'active':'')+'" onclick="posSetPaymentMethod(\'espece\')"><i class="fas fa-money-bill-wave"></i> Espèces</button><button class="pos-payment-btn '+(posPaymentMethod==='credit'?'active':'')+'" onclick="posSetPaymentMethod(\'credit\')"><i class="fas fa-credit-card"></i> Crédit</button><button class="pos-payment-btn '+(posPaymentMethod==='partiel'?'active':'')+'" onclick="posSetPaymentMethod(\'partiel\')"><i class="fas fa-hand-holding-usd"></i> Partiel</button></div></div>';
        if (posPaymentMethod==='espece'||posPaymentMethod==='partiel') h += '<div class="pos-payment-section"><label>Montant donné</label><input type="number" id="posAmountGiven" placeholder="0.00" value="'+(posAmountGiven>0?posAmountGiven:'')+'" onkeyup="posCalculateChange()"><div id="posChangeDisplay"></div></div>';
        h += '<button class="pos-finalize-btn" onclick="posFinalizeSale()"><i class="fas fa-check-circle"></i> Finaliser</button></div>';
    }
    h += '</div></div>';
    c.innerHTML = h;
    if (posStep===2) setTimeout(posCalculateChange, 200);
}

function posFilterCategory(ca) { posSelectedCategory=ca; renderPOS(); }
function posUpdateDiscount(v) { posDiscount=parseFloat(v)||0; if(posDiscount<0)posDiscount=0; if(posDiscount>100)posDiscount=100; renderPOS(); }
function posSelectClientFromList(cid) { if(!cid){posCurrentClient=null;return;} var cl=posAllClients.find(function(x){return x.id===cid;}); if(cl){posCurrentClient={id:cl.id,name:cl.nom+' '+cl.prenom};posCurrentTable='';document.getElementById('posTableNum').value='';} }
function posUpdateQty(i,ch) { var it=posCart[i];if(!it)return;var p=posProductsList.find(function(x){return x.id===it.id;});var nq=it.quantite+ch;if(nq<=0)posCart.splice(i,1);else{if(p&&p.stock!==undefined&&nq>p.stock){alert('Max: '+p.stock);return;}it.quantite=nq;}renderPOS(); }
function posRemoveItem(i) { posCart.splice(i,1); renderPOS(); }
function posCalculateTotal() { var t=0;for(var i=0;i<posCart.length;i++)t+=posCart[i].prixUnitaire*posCart[i].quantite;return t; }
function posGoToStep2() { if(posCart.length===0){alert('Panier vide');return;}posStep=2;renderPOS(); }
function posGoToStep1() { posStep=1;renderPOS(); }
function posSetTable(v) { posCurrentTable=v;if(v){posCurrentClient=null;document.getElementById('posClientSelect').value='';} }
function posSetPaymentMethod(m) { posPaymentMethod=m;posAmountGiven=0;renderPOS(); }
function posCalculateChange() { var ai=document.getElementById('posAmountGiven'),cd=document.getElementById('posChangeDisplay');if(!ai||!cd)return;var st=posCalculateTotal();var t=st-(st*(posDiscount/100));posAmountGiven=parseFloat(ai.value)||0;var c=posAmountGiven-t;if(posAmountGiven>0){cd.innerHTML=c>=0?'<div class="pos-change-positive"><span>Rendu</span><span>'+c.toFixed(2)+' MAD</span></div>':'<div class="pos-change-negative"><span>Manquant</span><span>'+Math.abs(c).toFixed(2)+' MAD</span></div>';}else{cd.innerHTML='';} }

async function posFinalizeSale() {
    var st=posCalculateTotal();var t=st-(st*(posDiscount/100));
    if(!posCurrentClient&&!posCurrentTable){alert('Client ou table obligatoire');return;}
    if(posPaymentMethod==='espece'){posAmountGiven=parseFloat(document.getElementById('posAmountGiven').value)||0;if(posAmountGiven<t){alert('Montant insuffisant');return;}}
    var vendeur=document.getElementById('posVendeur').value.trim()||(window.currentUserData?window.currentUserData.userData.prenom+' '+window.currentUserData.userData.nom:'');
    try{
        var fcs=await db.collection('ventes').get();var fn='FACT-'+new Date().getFullYear()+'-'+String(fcs.size+1).padStart(5,'0');
        var remaining=posPaymentMethod==='credit'?t:(posPaymentMethod==='partiel'?t-posAmountGiven:0);
        var paid=posPaymentMethod==='espece';
        var change=(posPaymentMethod==='espece'||posPaymentMethod==='partiel')?Math.max(0,posAmountGiven-t):0;
        var itemsDetail=posCart.map(function(it){return{id:it.id,nom:it.nom,quantite:it.quantite,prixVente:it.prixUnitaire,prixAchat:it.prixAchat||0,sauces:it.sauces||[],interdits:it.interdits||[],epice:it.epice||'Normal'};});
        var sd={factureNum:fn,items:itemsDetail,subtotal:st,discount:posDiscount,total:t,clientId:posCurrentClient?posCurrentClient.id:null,clientName:posCurrentClient?posCurrentClient.name:null,table:posCurrentTable||null,vendeur:vendeur,paymentMethod:posPaymentMethod,amountGiven:(posPaymentMethod==='espece'||posPaymentMethod==='partiel')?posAmountGiven:t,change:change,paid:paid,remainingAmount:remaining,createdAt:firebase.firestore.FieldValue.serverTimestamp()};
        if(posPaymentMethod==='credit'||posPaymentMethod==='partiel')await db.collection('credits').add(sd);
        await db.collection('ventes').add(sd);
        for(var i=0;i<posCart.length;i++){var it=posCart[i];try{var pr=await db.collection('products').doc(it.id).get();if(pr.exists){var pd=pr.data();await db.collection('products').doc(it.id).update({stock:Math.max(0,(pd.stock||0)-it.quantite),vendues:(pd.vendues||0)+it.quantite,ca:(pd.ca||0)+(it.prixUnitaire*it.quantite),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});}}catch(e){}}
        if(posCurrentClient&&posCurrentClient.id){try{var cr=await db.collection('clients').doc(posCurrentClient.id).get();if(cr.exists){await db.collection('clients').doc(posCurrentClient.id).update({ca:(cr.data().ca||0)+t,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});}}catch(e){}}
        alert('✅ Vente: '+fn+'\n💰 Total: '+t.toFixed(2)+' MAD'+(posAmountGiven>t?'\n💵 Rendu: '+change.toFixed(2)+' MAD':''));
        posResetCart();renderPOS();
    }catch(e){alert('Erreur: '+e.message);}
}
console.log('Caissier JS OK');
