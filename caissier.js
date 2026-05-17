var posCart = [], posStep = 1, posCategoriesList = [], posProductsList = [], posSelectedCategory = 'all';
var posCurrentClient = null, posCurrentTable = '', posPaymentMethod = 'espece', posAmountGiven = 0, posDiscountMAD = 0;
var posAllClients = [], posFilteredClients = [], posCurrentProductId = null;
var posSaucesList = ['Ketchup','Sauce Hot','Cheezy','Sauce Burger','Algérienne','Barbecue','Mayonnaise','Harissa','Samouraï','Andalouse'];
var posInterditsList = ['Oignon','Tomate','Cornichon','Olive','Fromage','Salade'];
var posEpicesList = ['Normal','Moins épicé','Très épicé','Sans épice'];
var posSelList = ['Normal','Moins de sel','Sans sel'];

// Commandes des tables (menu tactile)
var posCommandesTables = [];
var posCommandesTablesCount = 0;

async function loadPosPage(c) {
    posResetCart(); posStep = 1;
    // Charger catégories, produits et clients
    try {
        var cs = await db.collection('categories').get(); posCategoriesList = []; cs.forEach(function(d) { posCategoriesList.push({id:d.id,nom:d.data().nom,imageBase64:d.data().imageBase64}); });
        var ps = await db.collection('products').get(); posProductsList = []; ps.forEach(function(d) { var dd = d.data(); if (dd.disponible !== false) { posProductsList.push({id:d.id,nom:dd.nom,prixVente:dd.prixVente||0,prixPromo:dd.prixPromo||0,prixAchat:dd.prixAchat||0,stock:dd.stock,categorie:dd.categorie||'',imageBase64:dd.imageBase64||''}); } });
        var cl = await db.collection('clients').orderBy('nom').get(); posAllClients = []; posFilteredClients = []; cl.forEach(function(d) { posAllClients.push({id:d.id,nom:d.data().nom,prenom:d.data().prenom,telephone:d.data().telephone}); }); posFilteredClients = posAllClients.slice();
    } catch(e) { console.error('Erreur POS:', e); }

    // Charger les commandes tables en attente
    await posChargerCommandesTables();
    renderPOS();
}

async function posChargerCommandesTables() {
    try {
        var snap = await db.collection('commandes')
            .where('statut', '==', 'en_attente')
            .where('source', '==', 'menu_tactile')   // uniquement celles du menu tactile
            .get();
        posCommandesTables = [];
        snap.forEach(function(doc) {
            var data = doc.data();
            data.id = doc.id;
            posCommandesTables.push(data);
        });
        posCommandesTablesCount = posCommandesTables.length;
    } catch(e) {
        console.error('Erreur chargement commandes tables', e);
        posCommandesTablesCount = 0;
    }
}

function posResetCart() {
    posCart = []; posStep = 1; posSelectedCategory = 'all';
    posCurrentClient = null; posCurrentTable = '';
    posPaymentMethod = 'espece'; posAmountGiven = 0; posDiscountMAD = 0;
    posFilteredClients = posAllClients.slice();
    delete window.posCommandeId; delete window.posVenteId;
}

// ==================== RECHERCHE CLIENT DYNAMIQUE ====================
function posSearchClient(query) { /* ... (inchangé) ... */ }
function posSelectClientFromDropdown(clientId, clientName) { /* ... */ }
function posSetTable(value) { /* ... */ }
// ... (toutes les fonctions existantes de la recherche client restent inchangées)

// ==================== OPTIONS PRODUIT (inchangé) ====================
function posOpenOptionsModal(pid) { /* ... */ }
function posConfirmOptions() { /* ... */ }

// ==================== RENDU POS ====================
function renderPOS() {
    var c = document.getElementById('dynamicContent'); if (!c) return;
    var st = posCalculateTotal(); var t = st - posDiscountMAD;
    var h = '<div class="pos-container"><div class="pos-products-panel">';

    // --- Barre supérieure avec le bouton Commandes tables ---
    h += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">';
    h += '<div class="pos-categories-bar" style="margin-bottom:0;">'; // on garde la barre de catégories ici
    h += '<button class="pos-cat-btn ' + (posSelectedCategory === 'all' ? 'active' : '') + '" onclick="posFilterCategory(\'all\')"><i class="fas fa-th-large"></i> Tous</button>';
    for (var i = 0; i < posCategoriesList.length; i++) {
        var ca = posCategoriesList[i];
        var ac = posSelectedCategory === ca.nom ? 'active' : '';
        var ih = ca.imageBase64 ? '<img src="' + ca.imageBase64 + '" alt="">' : '<i class="fas fa-folder"></i>';
        h += '<button class="pos-cat-btn ' + ac + '" onclick="posFilterCategory(\'' + ca.nom.replace(/'/g, "\\'") + '\')">' + ih + ' ' + ca.nom + '</button>';
    }
    h += '</div>'; // fin barre catégories

    // Bouton Commandes tables avec badge
    h += '<button onclick="posAfficherCommandesTables()" style="position:relative; background:#fff; border:2px solid #e2e8f0; border-radius:50px; padding:8px 16px; cursor:pointer; font-weight:600; color:#1e293b; display:flex; align-items:center; gap:6px; white-space:nowrap;">';
    h += '<i class="fas fa-utensils"></i> Commandes tables';
    if (posCommandesTablesCount > 0) {
        h += '<span style="background:#ef4444; color:#fff; border-radius:20px; padding:2px 8px; font-size:0.7rem; margin-left:4px;">' + posCommandesTablesCount + '</span>';
    }
    h += '</button>';
    h += '</div>'; // fin barre supérieure

    // Grille produits
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
    h += '</div></div>'; // fin panneau produits

    // Panneau panier
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
    else if (posStep === 2) { /* ... tout le code existant de l'étape 2, inchangé ... */ }

    h += '</div></div>'; // fin pos-container
    c.innerHTML = h;
    if (posStep === 2) setTimeout(posCalculateChange, 200);
}

// ==================== AFFICHAGE COMMANDES TABLES ====================
function posAfficherCommandesTables() {
    if (posCommandesTables.length === 0) {
        alert('Aucune commande table en attente.');
        return;
    }

    var html = '<div style="max-height:70vh;overflow-y:auto;">';
    html += '<table class="data-table" style="width:100%;font-size:0.8rem;">';
    html += '<thead><tr><th>Table</th><th>Produits</th><th>Total</th><th>Action</th></tr></thead><tbody>';

    posCommandesTables.forEach(function(cmd) {
        var table = cmd.table || '?';
        var articles = cmd.items ? cmd.items.map(function(it) {
            var opt = '';
            if (it.sauces && it.sauces.length > 0) opt += ' 🥫' + it.sauces.join(',');
            if (it.interdits && it.interdits.length > 0) opt += ' 🚫' + it.interdits.join(',');
            if (it.epice && it.epice !== 'Normal') opt += ' 🌶️' + it.epice;
            if (it.sel && it.sel !== 'Normal') opt += ' 🧂' + it.sel;
            return it.quantite + 'x ' + it.nom + (opt ? ' <small>(' + opt + ')</small>' : '');
        }).join('<br>') : '-';

        html += '<tr>';
        html += '<td><strong>Table ' + table + '</strong></td>';
        html += '<td>' + articles + '</td>';
        html += '<td>' + cmd.total.toFixed(2) + ' MAD</td>';
        html += '<td><button class="btn-add" style="padding:4px 10px;font-size:0.75rem;" onclick="posChargerCommandeTable(\'' + cmd.id + '\')"><i class="fas fa-arrow-right"></i> Charger</button></td>';
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    openModal('🛎️ Commandes tables en attente', html);
}

function posChargerCommandeTable(commandeId) {
    var cmd = posCommandesTables.find(function(c) { return c.id === commandeId; });
    if (!cmd) return;

    // Placer les articles dans le panier
    posCart = [];
    cmd.items.forEach(function(item) {
        posCart.push({
            id: item.id,
            nom: item.nom,
            prixUnitaire: item.prixUnitaire || item.prixVente || 0,
            prixAchat: item.prixAchat || 0,
            prixPromo: item.prixPromo || 0,
            prixVente: item.prixVente || item.prixUnitaire || 0,
            quantite: item.quantite || 1,
            categorie: item.categorie || '',
            imageBase64: item.imageBase64 || '',
            sauces: item.sauces || [],
            interdits: item.interdits || [],
            epice: item.epice || 'Normal',
            sel: item.sel || 'Normal'
        });
    });

    // Définir la table comme client
    posCurrentTable = 'Table ' + (cmd.table || '?');
    posCurrentClient = null; // pas de client nommé
    posPaymentMethod = 'espece';
    posDiscountMAD = 0;

    // Stocker l'ID de la commande pour mise à jour après paiement
    window.posCommandeId = commandeId;

    closeModal();
    posStep = 2;
    renderPOS();
}

// ==================== FONCTIONS EXISTANTES (inchangées) ====================
// Toutes les autres fonctions (posFilterCategory, posUpdateQty, posRemoveItem, posCalculateTotal, posGoToStep2, posGoToStep1, posSetPaymentMethod, posCalculateChange, posFinalizeSale, etc.) restent identiques à votre version précédente.
// Assurez-vous simplement que posFinalizeSale gère window.posCommandeId (déjà présent dans la version précédente) pour marquer la commande comme payée.

console.log('Caissier JS OK');
