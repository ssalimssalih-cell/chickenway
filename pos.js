// ==================== POS.JS AVEC CACHE OFFLINE ====================
var posCart = [], posStep = 1, posCategoriesList = [], posProductsList = [], posSelectedCategory = 'all';
var posCurrentClient = null, posCurrentTable = '', posPaymentMethod = 'espece', posAmountGiven = 0, posDiscountMAD = 0;
var posAllClients = [], posFilteredClients = [], posCurrentProductId = null;
var posSaucesList = ['Ketchup','Sauce Hot','Cheezy','Sauce Burger','Algérienne','Barbecue','Mayonnaise','Harissa','Samouraï','Andalouse'];
var posInterditsList = ['Oignon','Tomate','Cornichon','Olive','Fromage','Salade'];
var posEpicesList = ['Normal','Moins épicé','Très épicé','Sans épice'];
var posSelList = ['Normal','Moins de sel','Sans sel'];

var posCommandesTables = [];
var posCommandesTablesCount = 0;
var posCommandesEnLigneCount = 0;  // Pour le badge "Commandes en ligne"

async function loadPosPage(c) {
    posResetCart(); posStep = 1;

    // Chargement depuis le cache
    let cachedCategories = await CacheDB.getAll('categories');
    let cachedProducts = await CacheDB.getAll('products');
    let cachedClients = await CacheDB.getAll('clients');
    if (cachedCategories.length) posCategoriesList = cachedCategories;
    if (cachedProducts.length) posProductsList = cachedProducts.filter(p => p.disponible !== false);
    if (cachedClients.length) {
        posAllClients = cachedClients.map(c => ({ id: c.id, nom: c.nom, prenom: c.prenom, telephone: c.telephone }));
        posFilteredClients = [...posAllClients];
    }
    renderPOS();

    // Mise à jour depuis Firestore en arrière-plan
    try {
        const [cs, ps, cl] = await Promise.all([
            db.collection('categories').get(),
            db.collection('products').get(),
            db.collection('clients').limit(500).get()
        ]);
        posCategoriesList = [];
        cs.forEach(d => { let cat = { id: d.id, nom: d.data().nom, imageBase64: d.data().imageBase64 }; posCategoriesList.push(cat); CacheDB.set('categories', d.id, cat); });
        posProductsList = [];
        ps.forEach(d => {
            const dd = d.data();
            if (dd.disponible !== false) {
                let prod = { id: d.id, nom: dd.nom, prixVente: dd.prixVente||0, prixPromo: dd.prixPromo||0, prixAchat: dd.prixAchat||0, stock: dd.stock, categorie: dd.categorie||'', imageBase64: dd.imageBase64||'' };
                posProductsList.push(prod);
                CacheDB.set('products', d.id, prod);
            }
        });
        posAllClients = [];
        cl.forEach(d => {
            let cli = { id: d.id, nom: d.data().nom, prenom: d.data().prenom, telephone: d.data().telephone };
            posAllClients.push(cli);
            CacheDB.set('clients', d.id, cli);
        });
        posFilteredClients = [...posAllClients];
        renderPOS();
    } catch(e) { console.error('Erreur mise à jour POS', e); }

    // Vérifier si une commande en ligne ou un paiement de vente est demandé
    var commandeData = localStorage.getItem('posCommandeData');
    var payerVenteData = localStorage.getItem('posPayerVente');
    if (commandeData) {
        var cmd = JSON.parse(commandeData);
        localStorage.removeItem('posCommandeData');
        posCart = [];
        if (cmd.items) { cmd.items.forEach(function(item) { posCart.push({id:item.id,nom:item.nom,prixUnitaire:item.prixVente||item.prixUnitaire||0,prixAchat:item.prixAchat||0,prixPromo:item.prixPromo||0,prixVente:item.prixVente||item.prixUnitaire||0,quantite:item.quantite||1,categorie:item.categorie||'',imageBase64:item.imageBase64||'',sauces:item.sauces||[],interdits:item.interdits||[],epice:item.epice||'Normal',sel:item.sel||'Normal'}); }); }
        if (cmd.clientId && cmd.clientName) { posCurrentClient = {id: cmd.clientId, name: cmd.clientName}; }
        posCurrentTable = cmd.table || '';
        posStep = 2; posDiscountMAD = 0; posPaymentMethod = 'espece';
        window.posCommandeId = cmd.commandeId;
        renderPOS();
        return;
    }
    if (payerVenteData) {
        var v = JSON.parse(payerVenteData);
        localStorage.removeItem('posPayerVente');
        posCart = [];
        if (v.items) { v.items.forEach(function(item) { posCart.push({id:item.id,nom:item.nom,prixUnitaire:item.prixVente||0,prixAchat:item.prixAchat||0,prixPromo:item.prixPromo||0,prixVente:item.prixVente||0,quantite:item.quantite||1,categorie:'',imageBase64:'',sauces:item.sauces||[],interdits:item.interdits||[],epice:item.epice||'Normal',sel:item.sel||'Normal'}); }); }
        if (v.clientId && v.clientName) { posCurrentClient = {id: v.clientId, name: v.clientName}; }
        posCurrentTable = v.table || '';
        posStep = 2; posDiscountMAD = 0; posPaymentMethod = 'espece';
        window.posVenteId = v.venteId;
        renderPOS();
        return;
    }

    await posChargerCommandesTables();
    await posChargerCommandesEnLigneCount();  // ← chargement du compteur
    renderPOS();
}

async function posChargerCommandesTables() {
    try {
        var snap = await db.collection('commandes')
            .where('statut', '==', 'en_attente')
            .where('source', '==', 'menu_tactile')
            .get();
        posCommandesTables = [];
        snap.forEach(function(doc) { var data = doc.data(); data.id = doc.id; posCommandesTables.push(data); });
        posCommandesTablesCount = posCommandesTables.length;
    } catch(e) { console.error('Erreur chargement commandes tables', e); posCommandesTablesCount = 0; }
}

async function posChargerCommandesEnLigneCount() {
    try {
        var snap = await db.collection('commandes')
            .where('statut', '==', 'en_attente')
            .where('source', '==', 'client')
            .get();
        posCommandesEnLigneCount = snap.size;
    } catch(e) { posCommandesEnLigneCount = 0; }
}

function posResetCart() {
    posCart = []; posStep = 1; posSelectedCategory = 'all';
    posCurrentClient = null; posCurrentTable = '';
    posPaymentMethod = 'espece'; posAmountGiven = 0; posDiscountMAD = 0;
    posFilteredClients = posAllClients.slice();
    delete window.posCommandeId; delete window.posVenteId;
}

function posSearchClient(query) { /* inchangé */ }
function renderClientDropdown() { /* inchangé */ }
function posSelectClientFromDropdown(cid,cn){ /* inchangé */ }
document.addEventListener('click',function(e){ /* inchangé */ });
function updatePaymentButtons(){ /* inchangé */ }
function posSetTable(v){ /* inchangé */ }

function posOpenOptionsModal(pid){ /* inchangé */ }
function posConfirmOptions(){ /* inchangé */ }

function renderPOS() {
    var c = document.getElementById('dynamicContent'); if (!c) return;
    var st = posCalculateTotal(); var t = st - posDiscountMAD;
    var h = '<div class="pos-container"><div class="pos-products-panel">';
    h += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap;">';
    h += '<div class="pos-categories-bar" style="margin-bottom:0;">';
    h += '<button class="pos-cat-btn ' + (posSelectedCategory === 'all' ? 'active' : '') + '" onclick="posFilterCategory(\'all\')"><i class="fas fa-th-large"></i> Tous</button>';
    for (var i = 0; i < posCategoriesList.length; i++) {
        var ca = posCategoriesList[i];
        var ac = posSelectedCategory === ca.nom ? 'active' : '';
        var ih = ca.imageBase64 ? '<img src="' + ca.imageBase64 + '" alt="">' : '<i class="fas fa-folder"></i>';
        h += '<button class="pos-cat-btn ' + ac + '" onclick="posFilterCategory(\'' + ca.nom.replace(/'/g, "\\'") + '\')">' + ih + ' ' + ca.nom + '</button>';
    }
    h += '</div>';
    // Boutons Commandes Tables et Commandes en Ligne
    h += '<div style="display:flex; gap:6px; margin-left:10px;">';
    h += '<button onclick="posAfficherCommandesTables()" style="position:relative; background:#fff; border:2px solid #e2e8f0; border-radius:50px; padding:8px 16px; cursor:pointer; font-weight:600; color:#1e293b; display:flex; align-items:center; gap:6px; white-space:nowrap;">';
    h += '<i class="fas fa-utensils"></i> Tables';
    if (posCommandesTablesCount > 0) h += '<span style="background:#ef4444; color:#fff; border-radius:20px; padding:2px 8px; font-size:0.7rem; margin-left:4px;">' + posCommandesTablesCount + '</span>';
    h += '</button>';
    h += '<button onclick="posAfficherCommandesEnLigne()" style="position:relative; background:#fff; border:2px solid #e2e8f0; border-radius:50px; padding:8px 16px; cursor:pointer; font-weight:600; color:#1e293b; display:flex; align-items:center; gap:6px; white-space:nowrap;">';
    h += '<i class="fas fa-globe"></i> En ligne';
    if (posCommandesEnLigneCount > 0) h += '<span style="background:#ef4444; color:#fff; border-radius:20px; padding:2px 8px; font-size:0.7rem; margin-left:4px;">' + posCommandesEnLigneCount + '</span>';
    h += '</button>';
    h += '</div>';
    h += '</div>';
    h += '<div class="pos-products-grid">';
    var f = posProductsList; if (posSelectedCategory !== 'all') f = posProductsList.filter(function(p) { return p.categorie === posSelectedCategory; });
    if (f.length === 0) { h += '<div style="grid-column:1/-1;text-align:center;padding:40px;">Aucun</div>'; }
    else {
        for (var j = 0; j < f.length; j++) {
            var p = f[j];
            var pr = p.prixPromo && p.prixPromo > 0 ? p.prixPromo : p.prixVente;
            var hp = p.prixPromo && p.prixPromo > 0;
            var sc = '', stt = '';
            if (p.stock !== undefined) { if (p.stock <= 0) { sc = 'pos-out-of-stock'; stt = ' (Rupture)'; } else if (p.stock <= 5) { stt = ' (' + p.stock + ' rest.)'; } }
            h += '<div class="pos-product-card ' + sc + '" onclick="posOpenOptionsModal(\'' + p.id + '\')">';
            if (p.imageBase64) h += '<div class="pos-product-img"><img src="' + p.imageBase64 + '" alt=""></div>';
            else h += '<div class="pos-product-img pos-product-placeholder"><i class="fas fa-utensils"></i></div>';
            h += '<div class="pos-product-info"><span class="pos-product-name">' + p.nom + stt + '</span><span class="pos-product-price">';
            if (hp) h += '<span class="pos-old-price">' + p.prixVente.toFixed(2) + '</span> <span class="pos-promo-price">' + pr.toFixed(2) + ' MAD</span>';
            else h += pr.toFixed(2) + ' MAD';
            h += '</span></div></div>';
        }
    }
    h += '</div></div>';
    // Panier (inchangé)
    h += '<div class="pos-cart-panel">';
    if (posStep === 1) {
        h += '<div class="pos-cart-header"><h3><i class="fas fa-shopping-cart"></i> Panier <span class="pos-cart-badge">' + posCart.length + '</span></h3><button class="pos-clear-btn" onclick="posResetCart()"><i class="fas fa-trash-alt"></i> Vider</button></div><div class="pos-cart-items">';
        if (posCart.length === 0) { h += '<div class="pos-cart-empty"><i class="fas fa-shopping-basket"></i><p>Vide</p></div>'; }
        else {
            for (var k = 0; k < posCart.length; k++) {
                var it = posCart[k];
                var opts = '';
                if (it.sauces && it.sauces.length > 0) opts += ' <span style="color:#f39c12;font-size:0.6rem;">🥫' + it.sauces.join(',') + '</span>';
                if (it.interdits && it.interdits.length > 0) opts += ' <span style="color:#ef4444;font-size:0.6rem;">🚫' + it.interdits.join(',') + '</span>';
                if (it.epice && it.epice !== 'Normal') opts += ' <span style="color:#d97706;font-size:0.6rem;">🌶️' + it.epice + '</span>';
                if (it.sel && it.sel !== 'Normal') opts += ' <span style="color:#4f46e5;font-size:0.6rem;">🧂' + it.sel + '</span>';
                h += '<div class="pos-cart-item"><div class="pos-cart-item-info"><span class="pos-cart-item-name">' + it.nom + opts + '</span><span class="pos-cart-item-price">' + it.prixUnitaire.toFixed(2) + ' MAD/u</span></div><div class="pos-cart-item-actions"><button class="pos-qty-btn" onclick="posUpdateQty(' + k + ',-1)"><i class="fas fa-minus"></i></button><span class="pos-qty-value">' + it.quantite + '</span><button class="pos-qty-btn" onclick="posUpdateQty(' + k + ',1)"><i class="fas fa-plus"></i></button><button class="pos-remove-btn" onclick="posRemoveItem(' + k + ')"><i class="fas fa-times"></i></button></div><span class="pos-cart-item-total">' + (it.prixUnitaire * it.quantite).toFixed(2) + ' MAD</span></div>';
            }
        }
        h += '</div>';
        h += '<div style="padding:10px 0;display:flex;gap:10px;align-items:center;"><label>Remise (MAD):</label><input type="number" id="posDiscountMAD" value="' + posDiscountMAD + '" min="0" step="0.01" onchange="posUpdateDiscountMAD(this.value)" style="width:100px;padding:8px;border:2px solid #e2e8f0;border-radius:8px;"></div>';
        h += '<div class="pos-cart-footer">';
        if (posDiscountMAD > 0) h += '<div style="display:flex;justify-content:space-between;font-size:0.85rem;"><span>Sous-total</span><span>' + st.toFixed(2) + '</span></div><div style="display:flex;justify-content:space-between;font-size:0.85rem;color:#ef4444;"><span>Remise</span><span>-' + posDiscountMAD.toFixed(2) + '</span></div>';
        h += '<div class="pos-cart-total-row"><span>Total</span><span>' + t.toFixed(2) + ' MAD</span></div><button class="pos-validate-btn" onclick="posGoToStep2()" ' + (posCart.length === 0 ? 'disabled' : '') + '><i class="fas fa-check-circle"></i> Valider</button></div>';
    }
    else if (posStep === 2) {
        // ... (paiement inchangé)
        var canCredit = posCurrentClient && posCurrentClient.id;
        h += '<div class="pos-cart-header"><h3><i class="fas fa-credit-card"></i> Paiement</h3><button class="pos-back-btn" onclick="posGoToStep1()"><i class="fas fa-arrow-left"></i> Retour</button></div><div class="pos-payment-form">';
        h += '<div class="pos-payment-section"><label>Client</label><div style="position:relative;"><input type="text" id="posClientSearchInput" placeholder="🔍 Cliquez et tapez pour rechercher..." onkeyup="posSearchClient(this.value)" onfocus="if(this.value)posSearchClient(this.value)" autocomplete="off" value="' + (posCurrentClient ? posCurrentClient.name : '') + '" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:12px;"><div id="posClientDropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:2px solid #e2e8f0;border-radius:0 0 12px 12px;max-height:200px;overflow-y:auto;z-index:50;box-shadow:0 10px 30px rgba(0,0,0,0.15);"></div></div></div>';
        h += '<div class="pos-or-divider">— OU —</div>';
        h += '<div class="pos-payment-section"><label>Table</label><input type="text" id="posTableNum" value="' + posCurrentTable + '" onchange="posSetTable(this.value)" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:12px;"></div>';
        h += '<div class="pos-payment-section"><div class="pos-summary-box"><div class="pos-summary-row"><span>Articles</span><span>' + posCart.length + '</span></div>'; if (posDiscountMAD > 0) h += '<div class="pos-summary-row"><span>Remise</span><span style="color:#ef4444;">-' + posDiscountMAD.toFixed(2) + '</span></div>'; h += '<div class="pos-summary-total"><span>Total</span><span>' + t.toFixed(2) + ' MAD</span></div></div></div>';
        h += '<div class="pos-payment-section"><label>Vendeur</label><input type="text" id="posVendeur" value="' + (window.currentUserData ? window.currentUserData.userData.prenom + ' ' + window.currentUserData.userData.nom : '') + '" style="width:100%;padding:12px;border:2px solid #e2e8f0;border-radius:12px;"></div>';
        h += '<div class="pos-payment-section"><label>Paiement</label><div class="pos-payment-methods"><button class="pos-payment-btn ' + (posPaymentMethod === 'espece' ? 'active' : '') + '" onclick="posSetPaymentMethod(\'espece\')"><i class="fas fa-money-bill-wave"></i> Espèces</button><button class="pos-payment-btn ' + (posPaymentMethod === 'credit' ? 'active' : '') + '" onclick="posSetPaymentMethod(\'credit\')" id="posCreditBtn" ' + (canCredit ? '' : 'disabled style="opacity:0.4;cursor:not-allowed;"') + '><i class="fas fa-credit-card"></i> Crédit</button><button class="pos-payment-btn ' + (posPaymentMethod === 'partiel' ? 'active' : '') + '" onclick="posSetPaymentMethod(\'partiel\')" id="posPartielBtn" ' + (canCredit ? '' : 'disabled style="opacity:0.4;cursor:not-allowed;"') + '><i class="fas fa-hand-holding-usd"></i> Partiel</button></div></div>';
        if (posPaymentMethod === 'espece' || posPaymentMethod === 'partiel') h += '<div class="pos-payment-section"><label>Montant donné</label><input type="number" id="posAmountGiven" placeholder="0.00" value="' + (posAmountGiven > 0 ? posAmountGiven : '') + '" onkeyup="posCalculateChange()"><div id="posChangeDisplay"></div></div>';
        h += '<button class="pos-finalize-btn" onclick="posFinalizeSale()"><i class="fas fa-check-circle"></i> Finaliser</button></div>';
    }
    h += '</div></div>';
    c.innerHTML = h;
    if (posStep === 2) setTimeout(posCalculateChange, 200);
}

// --- Affichage des commandes tables (inchangé) ---
function posAfficherCommandesTables() { /* ... identique ... */ }

// --- NOUVEAU : Affichage des commandes en ligne ---
async function posAfficherCommandesEnLigne() {
    var commandes = [];
    try {
        var snap = await db.collection('commandes')
            .where('statut', '==', 'en_attente')
            .where('source', '==', 'client')
            .orderBy('createdAt', 'desc')
            .get();
        snap.forEach(doc => {
            var d = doc.data();
            d.id = doc.id;
            commandes.push(d);
        });
    } catch(e) { alert('Erreur chargement commandes en ligne'); return; }

    if (commandes.length === 0) {
        alert('Aucune commande en ligne en attente.');
        return;
    }

    var html = '<div style="max-height:70vh;overflow-y:auto;"><table class="data-table" style="width:100%;font-size:0.75rem;"><thead><tr><th>Date</th><th>Client</th><th>Email</th><th>Tél</th><th>Articles</th><th>Options</th><th>Total</th><th>Actions</th></tr></thead><tbody>';
    commandes.forEach(function(cmd) {
        var dt = cmd.createdAt ? new Date(cmd.createdAt.seconds * 1000).toLocaleString('fr-FR') : '';
        var client = cmd.clientName || '-';
        var email = cmd.clientEmail || '-';
        var tel = cmd.clientTelephone || '-';
        var arts = cmd.items ? cmd.items.map(it => '<strong>' + it.quantite + 'x</strong> ' + it.nom).join('<br>') : '-';
        var opts = cmd.items ? cmd.items.map(it => {
            var o = [];
            if (it.sauces && it.sauces.length > 0) o.push('<span style="color:#f39c12;">🥫 ' + it.sauces.join(', ') + '</span>');
            if (it.interdits && it.interdits.length > 0) o.push('<span style="color:#ef4444;">🚫 ' + it.interdits.join(', ') + '</span>');
            if (it.epice && it.epice !== 'Normal') o.push('<span style="color:#d97706;">🌶️ ' + it.epice + '</span>');
            if (it.sel && it.sel !== 'Normal') o.push('<span style="color:#4f46e5;">🧂 ' + it.sel + '</span>');
            return o.length > 0 ? o.join(' | ') : '-';
        }).join('<br>') : '-';
        var total = cmd.total.toFixed(2) + ' MAD';
        var actions = '<button class="btn-add" style="padding:4px 8px;font-size:0.7rem;margin-right:4px;" onclick="validateCommande(\'' + cmd.id + '\'); closeModal();">✅ Valider</button>';
        actions += '<button class="btn-save" style="padding:4px 8px;font-size:0.7rem;" onclick="payCommande(\'' + cmd.id + '\'); closeModal();">💰 Payer</button>';
        html += '<tr><td><small>' + dt + '</small></td><td><strong>' + client + '</strong></td><td>' + email + '</td><td>' + tel + '</td><td>' + arts + '</td><td><small>' + opts + '</small></td><td><strong>' + total + '</strong></td><td>' + actions + '</td></tr>';
    });
    html += '</tbody></table></div>';
    openModal('🛒 Commandes en ligne en attente (' + commandes.length + ')', html);
}

// --- Fonctions de manipulation du panier (inchangées) ---
function posFilterCategory(ca){posSelectedCategory=ca;renderPOS();}
function posUpdateDiscountMAD(v){posDiscountMAD=parseFloat(v)||0;if(posDiscountMAD<0)posDiscountMAD=0;renderPOS();}
function posUpdateQty(i,ch){var it=posCart[i];if(!it)return;var p=posProductsList.find(function(x){return x.id===it.id;});var nq=it.quantite+ch;if(nq<=0)posCart.splice(i,1);else{if(p&&p.stock!==undefined&&nq>p.stock){alert('Max: '+p.stock);return;}it.quantite=nq;}renderPOS();}
function posRemoveItem(i){posCart.splice(i,1);renderPOS();}
function posCalculateTotal(){var t=0;for(var i=0;i<posCart.length;i++)t+=posCart[i].prixUnitaire*posCart[i].quantite;return t;}
function posGoToStep2(){if(posCart.length===0){alert('Panier vide');return;}posStep=2;renderPOS();}
function posGoToStep1(){posStep=1;delete window.posCommandeId;delete window.posVenteId;renderPOS();}
function posSetPaymentMethod(m){if((m==='credit'||m==='partiel')&&(!posCurrentClient||!posCurrentClient.id)){alert('Client requis pour crédit/partiel.');return;}posPaymentMethod=m;posAmountGiven=0;renderPOS();}
function posCalculateChange(){var ai=document.getElementById('posAmountGiven'),cd=document.getElementById('posChangeDisplay');if(!ai||!cd)return;var st=posCalculateTotal();var t=st-posDiscountMAD;posAmountGiven=parseFloat(ai.value)||0;var c=posAmountGiven-t;if(posAmountGiven>0){cd.innerHTML=c>=0?'<div class="pos-change-positive"><span>Rendu</span><span>'+c.toFixed(2)+' MAD</span></div>':'<div class="pos-change-negative"><span>Manquant</span><span>'+Math.abs(c).toFixed(2)+' MAD</span></div>';}else{cd.innerHTML='';}}

// Finalisation de la vente (inchangée)
async function posFinalizeSale() {
    var st=posCalculateTotal();var t=st-posDiscountMAD;
    if(!posCurrentClient&&!posCurrentTable){alert('Client ou table requis.');return;}
    if(posCurrentTable&&(posPaymentMethod==='credit'||posPaymentMethod==='partiel')){alert('Table = espèces uniquement.');return;}
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
        await CacheDB.write('ventes', null, sd, 'add');
        if(!paid) await CacheDB.write('credits', null, sd, 'add');
        if(window.posCommandeId){
            await CacheDB.write('commandes', window.posCommandeId, {statut:'payé',paidAt:firebase.firestore.FieldValue.serverTimestamp(),factureNum:fn}, 'update');
            delete window.posCommandeId;
        }
        if(window.posVenteId){
            await CacheDB.write('ventes', window.posVenteId, {paid:true,statutPaiement:'payé',remainingAmount:0,paidAt:firebase.firestore.FieldValue.serverTimestamp()}, 'update');
            var venteDoc = await db.collection('ventes').doc(window.posVenteId).get();
            if(venteDoc.exists){
                var creditSnap = await db.collection('credits').where('factureNum','==',venteDoc.data().factureNum).get();
                creditSnap.forEach(function(cd){ CacheDB.write('credits', cd.id, {paid:true,remainingAmount:0}, 'update'); });
            }
            delete window.posVenteId;
        }
        for(var i=0;i<posCart.length;i++){var it=posCart[i];try{var pr=await db.collection('products').doc(it.id).get();if(pr.exists){var pd=pr.data();await CacheDB.write('products',it.id,{stock:Math.max(0,(pd.stock||0)-it.quantite),vendues:(pd.vendues||0)+it.quantite,ca:(pd.ca||0)+(it.prixUnitaire*it.quantite),updatedAt:firebase.firestore.FieldValue.serverTimestamp()},'update');}}catch(e){}}
        if(posCurrentClient&&posCurrentClient.id&&paid){try{var cr=await db.collection('clients').doc(posCurrentClient.id).get();if(cr.exists){var cd=cr.data();await CacheDB.write('clients',posCurrentClient.id,{ca:(cd.ca||0)+t,profit:(cd.profit||0)+profitTotal,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},'update');}}catch(e){}}
        var msg='✅ Vente: '+fn+'\n💰 Total: '+t.toFixed(2)+' MAD';
        if(posPaymentMethod==='espece'&&posAmountGiven>t)msg+='\n💵 Rendu: '+change.toFixed(2)+' MAD';
        if(statutPaiement==='crédit')msg+='\n📋 Crédit enregistré.';
        if(statutPaiement==='partiel')msg+='\n📋 Reste: '+remaining.toFixed(2)+' MAD';
        if(statutPaiement==='en_attente')msg+='\n⏳ En attente de paiement.';
        alert(msg);posResetCart();renderPOS();CacheDB.sync();
    }catch(e){alert('Erreur: '+e.message);}
}

// Fonctions pour les commandes tables (inchangées) – à conserver telles quelles
function posChargerCommandeTable(commandeId) {
    var cmd = posCommandesTables.find(function(c) { return c.id === commandeId; });
    if (!cmd) return;
    posCart = [];
    cmd.items.forEach(function(item) {
        posCart.push({
            id: item.id, nom: item.nom,
            prixUnitaire: item.prixUnitaire || item.prixVente || 0,
            prixAchat: item.prixAchat || 0, prixPromo: item.prixPromo || 0,
            prixVente: item.prixVente || item.prixUnitaire || 0,
            quantite: item.quantite || 1,
            categorie: item.categorie || '', imageBase64: item.imageBase64 || '',
            sauces: item.sauces || [], interdits: item.interdits || [],
            epice: item.epice || 'Normal', sel: item.sel || 'Normal'
        });
    });
    posCurrentTable = 'Table ' + (cmd.table || '?');
    posCurrentClient = null;
    posPaymentMethod = 'espece';
    posDiscountMAD = 0;
    window.posCommandeId = commandeId;
    closeModal();
    posStep = 2;
    renderPOS();
}

async function posPayerCommandeTable(commandeId) {
    if (!confirm('Marquer cette commande comme payée ?')) return;
    try {
        await CacheDB.write('commandes', commandeId, { statut: 'payé', paidAt: firebase.firestore.FieldValue.serverTimestamp() }, 'update');
        alert('✅ Commande table marquée comme payée !');
        await posChargerCommandesTables();
        closeModal();
        renderPOS();
        CacheDB.sync();
    } catch(e) { alert('❌ Erreur: ' + e.message); }
}

console.log('POS JS avec commandes en ligne et tables dans le POS');
