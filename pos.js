// ==================== POS SYSTEM (OPTIMISÉ AVEC CACHE) ====================
var posCart = [], posStep = 1, posCategoriesList = [], posProductsList = [], posSelectedCategory = 'all';
var posCurrentClient = null, posCurrentTable = '', posPaymentMethod = 'espece', posAmountGiven = 0, posDiscountMAD = 0;
var posAllClients = [], posFilteredClients = [], posCurrentProductId = null;
var posSaucesList = ['Ketchup','Sauce Hot','Cheezy','Sauce Burger','Algérienne','Barbecue','Mayonnaise','Harissa','Samouraï','Andalouse'];
var posInterditsList = ['Oignon','Tomate','Cornichon','Olive','Fromage','Salade'];
var posEpicesList = ['Normal','Moins épicé','Très épicé','Sans épice'];
var posSelList = ['Normal','Moins de sel','Sans sel'];
var posCommandesTables = [], posCommandesTablesCount = 0;

// Cache des données
var posDataLoaded = false;
var posDataLoading = false;

async function loadPosPage(c) {
    // Afficher immédiatement l'interface avec un loader
    if (!posDataLoaded) {
        document.getElementById('dynamicContent').innerHTML = '<div style="text-align:center;padding:60px;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#f39c12;"></i><p style="margin-top:10px;color:#64748b;">Chargement du POS...</p></div>';
    }
    
    posResetCart(); posStep = 1;
    
    // Charger les données seulement si pas déjà en cache
    if (!posDataLoaded && !posDataLoading) {
        posDataLoading = true;
        try {
            var [catSnap, prodSnap, clientSnap] = await Promise.all([
                db.collection('categories').get(),
                db.collection('products').get(),
                db.collection('clients').orderBy('nom').get()
            ]);
            
            posCategoriesList = [];
            catSnap.forEach(function(d) { posCategoriesList.push({id:d.id, nom:d.data().nom, imageBase64:d.data().imageBase64}); });
            
            posProductsList = [];
            prodSnap.forEach(function(d) { var dd = d.data(); if (dd.disponible !== false) { posProductsList.push({id:d.id, nom:dd.nom, prixVente:dd.prixVente||0, prixPromo:dd.prixPromo||0, prixAchat:dd.prixAchat||0, stock:dd.stock, categorie:dd.categorie||'', imageBase64:dd.imageBase64||''}); } });
            
            posAllClients = [];
            clientSnap.forEach(function(d) { posAllClients.push({id:d.id, nom:d.data().nom, prenom:d.data().prenom, telephone:d.data().telephone}); });
            posFilteredClients = posAllClients.slice();
            
            posDataLoaded = true;
        } catch(e) { console.error('Erreur POS:', e); }
        posDataLoading = false;
    }
    
    // Vérifier les données de commande/vente
    var commandeData = localStorage.getItem('posCommandeData');
    var payerVenteData = localStorage.getItem('posPayerVente');
    
    if (commandeData) {
        var cmd = JSON.parse(commandeData); localStorage.removeItem('posCommandeData'); posCart = [];
        if (cmd.items) { cmd.items.forEach(function(item) { posCart.push({id:item.id,nom:item.nom,prixUnitaire:item.prixVente||item.prixUnitaire||0,prixAchat:item.prixAchat||0,prixPromo:item.prixPromo||0,prixVente:item.prixVente||item.prixUnitaire||0,quantite:item.quantite||1,categorie:item.categorie||'',imageBase64:item.imageBase64||'',sauces:item.sauces||[],interdits:item.interdits||[],epice:item.epice||'Normal',sel:item.sel||'Normal'}); }); }
        if (cmd.clientId && cmd.clientName) { posCurrentClient = {id: cmd.clientId, name: cmd.clientName}; }
        posCurrentTable = cmd.table || ''; posStep = 2; posDiscountMAD = 0; posPaymentMethod = 'espece'; window.posCommandeId = cmd.commandeId; renderPOS(); return;
    }
    
    if (payerVenteData) {
        var v = JSON.parse(payerVenteData); localStorage.removeItem('posPayerVente'); posCart = [];
        if (v.items) { v.items.forEach(function(item) { posCart.push({id:item.id,nom:item.nom,prixUnitaire:item.prixVente||0,prixAchat:item.prixAchat||0,prixPromo:item.prixPromo||0,prixVente:item.prixVente||0,quantite:item.quantite||1,categorie:'',imageBase64:'',sauces:item.sauces||[],interdits:item.interdits||[],epice:item.epice||'Normal',sel:item.sel||'Normal'}); }); }
        if (v.clientId && v.clientName) { posCurrentClient = {id: v.clientId, name: v.clientName}; }
        posCurrentTable = v.table || ''; posStep = 2; posDiscountMAD = 0; posPaymentMethod = 'espece'; window.posVenteId = v.venteId; renderPOS(); return;
    }
    
    // Charger les commandes tables (toujours frais)
    posChargerCommandesTables();
    renderPOS();
}

async function posChargerCommandesTables() {
    try {
        var snap = await db.collection('commandes').where('statut','==','en_attente').where('source','==','menu_tactile').get();
        posCommandesTables = [];
        snap.forEach(function(doc) { var d = doc.data(); d.id = doc.id; posCommandesTables.push(d); });
        posCommandesTablesCount = posCommandesTables.length;
    } catch(e) { posCommandesTablesCount = 0; }
}

// Forcer le rechargement des données (après une vente par exemple)
function posRefreshData() {
    posDataLoaded = false;
    posDataLoading = false;
}

function posResetCart() {
    posCart = []; posStep = 1; posSelectedCategory = 'all';
    posCurrentClient = null; posCurrentTable = '';
    posPaymentMethod = 'espece'; posAmountGiven = 0; posDiscountMAD = 0;
    posFilteredClients = posAllClients.slice();
    delete window.posCommandeId; delete window.posVenteId;
}

// Le reste du code reste IDENTIQUE (posSearchClient, renderPOS, posAfficherCommandesTables, etc.)
// ... (gardez toutes les autres fonctions de votre pos.js actuel)
