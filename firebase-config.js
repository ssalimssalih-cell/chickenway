// ========= CONFIGURATION FIREBASE =========
if (typeof window.firebaseConfig === 'undefined') {
    window.firebaseConfig = {
        apiKey: "AIzaSyDBtroF6W2tgAmJeGwtSCjNGeYcG77IfsU",
        authDomain: "chickenway2026.firebaseapp.com",
        projectId: "chickenway2026",
        storageBucket: "chickenway2026.firebasestorage.app",
        messagingSenderId: "734739564037",
        appId: "1:734739564037:web:649d31ff5d5b561ae93e6c"
    };
}

// Initialiser Firebase si ce n'est pas déjà fait
if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
    firebase.initializeApp(window.firebaseConfig);
    console.log("🔥 Firebase initialisé avec succès !");
}

// Déclarer db globalement
if (typeof firebase !== 'undefined' && !window.db) {
    window.db = firebase.firestore();
    console.log("📁 Firestore initialisé");
}

// ========= COLLECTIONS =========
const COLLECTIONS = {
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    VENTES: 'ventes',
    CREDITS: 'credits',
    DEPENSES: 'depenses',
    CLIENTS: 'clients',
    FOURNISSEURS: 'fournisseurs',
    USERS: 'users',
    ONLINE_ORDERS: 'online_orders'
};

// ========= VÉRIFIER ET CRÉER LES COLLECTIONS =========
async function ensureCollectionsExist() {
    try {
        if (!window.db) return false;
        
        for (const [key, collectionName] of Object.entries(COLLECTIONS)) {
            const snapshot = await window.db.collection(collectionName).limit(1).get();
            if (snapshot.empty) {
                console.log(`📦 Création de la collection '${collectionName}'...`);
                await window.db.collection(collectionName).doc('_init_').set({
                    _init: true,
                    createdAt: new Date().toISOString()
                });
            }
        }
        
        // Supprimer les documents d'initialisation
        for (const [key, collectionName] of Object.entries(COLLECTIONS)) {
            try {
                const initDoc = await window.db.collection(collectionName).doc('_init_').get();
                if (initDoc.exists && initDoc.data()._init) {
                    await window.db.collection(collectionName).doc('_init_').delete();
                }
            } catch(e) {}
        }
        
        return true;
    } catch (error) {
        console.error("❌ Erreur vérification collections:", error);
        return false;
    }
}

// ========= FONCTION GÉNÉRIQUE POUR SAUVEGARDER =========
async function saveToFirebase(collectionName, id, data) {
    try {
        if (!window.db) return false;
        await window.db.collection(collectionName).doc(id.toString()).set({
            ...data,
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ ${collectionName} ${id} synchronisé`);
        return true;
    } catch (error) {
        console.error(`Erreur sauvegarde ${collectionName}:`, error);
        return false;
    }
}

// ========= FONCTION GÉNÉRIQUE POUR CHARGER =========
async function loadFromFirebase(collectionName) {
    try {
        if (!window.db) return [];
        const snapshot = await window.db.collection(collectionName).get();
        const items = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data._init) {
                items.push(data);
            }
        });
        items.sort((a, b) => (a.id || 0) - (b.id || 0));
        console.log(`✅ ${items.length} ${collectionName} chargés depuis Firebase`);
        return items;
    } catch (error) {
        console.error(`Erreur chargement ${collectionName}:`, error);
        return [];
    }
}

// ========= FONCTION GÉNÉRIQUE POUR SUPPRIMER =========
async function deleteFromFirebase(collectionName, id) {
    try {
        if (!window.db) return false;
        await window.db.collection(collectionName).doc(id.toString()).delete();
        console.log(`✅ ${collectionName} ${id} supprimé de Firebase`);
        return true;
    } catch (error) {
        console.error(`Erreur suppression ${collectionName}:`, error);
        return false;
    }
}

// ========= FONCTION GÉNÉRIQUE POUR SYNC ALL =========
async function syncAllToFirebase(collectionName, localStorageKey, dataArray) {
    try {
        if (!window.db) return false;
        
        const items = dataArray || JSON.parse(localStorage.getItem(localStorageKey) || '[]');
        if (items.length === 0) return false;
        
        await ensureCollectionsExist();
        
        let compteur = 0;
        for (const item of items) {
            if (item.id) {
                await window.db.collection(collectionName).doc(item.id.toString()).set({
                    ...item,
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                });
                compteur++;
            }
        }
        
        console.log(`✅ ${compteur} ${collectionName} synchronisés vers Firebase`);
        if (typeof window.showToastMessage === 'function') {
            window.showToastMessage(`✅ ${compteur} ${collectionName} synchronisés !`);
        }
        return true;
    } catch (error) {
        console.error(`Erreur sync ${collectionName}:`, error);
        return false;
    }
}

// ========= FONCTION GÉNÉRIQUE POUR MERGER =========
async function mergeFromFirebase(collectionName, localStorageKey, globalVariableName) {
    console.log(`🔄 Fusion des ${collectionName} depuis Firebase...`);
    
    try {
        const firebaseItems = await loadFromFirebase(collectionName);
        
        if (firebaseItems.length > 0) {
            localStorage.setItem(localStorageKey, JSON.stringify(firebaseItems));
            if (typeof window[globalVariableName] !== 'undefined') {
                window[globalVariableName] = firebaseItems;
            }
            console.log(`📦 ${firebaseItems.length} ${collectionName} fusionnés depuis Firebase`);
            return true;
        } else {
            const localItems = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
            if (localItems.length > 0) {
                await syncAllToFirebase(collectionName, localStorageKey, localItems);
            }
            return true;
        }
    } catch (error) {
        console.error(`Erreur fusion ${collectionName}:`, error);
        return false;
    }
}

// ========= PRODUITS =========
async function loadProductsFromFirebase() { return loadFromFirebase(COLLECTIONS.PRODUCTS); }
async function saveProductToFirebase(product) { return saveToFirebase(COLLECTIONS.PRODUCTS, product.id, product); }
async function deleteProductFromFirebase(productId) { return deleteFromFirebase(COLLECTIONS.PRODUCTS, productId); }
async function syncAllProductsToFirebase() { return syncAllToFirebase(COLLECTIONS.PRODUCTS, 'chickenway_produits', window.produits); }
async function mergeProductsFromFirebase() { return mergeFromFirebase(COLLECTIONS.PRODUCTS, 'chickenway_produits', 'produits'); }

// ========= CATÉGORIES =========
async function loadCategoriesFromFirebase() { return loadFromFirebase(COLLECTIONS.CATEGORIES); }
async function saveCategoryToFirebase(category) { return saveToFirebase(COLLECTIONS.CATEGORIES, category.id, category); }
async function deleteCategoryFromFirebase(categoryId) { return deleteFromFirebase(COLLECTIONS.CATEGORIES, categoryId); }
async function syncAllCategoriesToFirebase() { return syncAllToFirebase(COLLECTIONS.CATEGORIES, 'chickenway_categories', window.categories); }
async function mergeCategoriesFromFirebase() { return mergeFromFirebase(COLLECTIONS.CATEGORIES, 'chickenway_categories', 'categories'); }

// ========= VENTES =========
async function loadVentesFromFirebase() { return loadFromFirebase(COLLECTIONS.VENTES); }
async function saveVenteToFirebase(vente) { return saveToFirebase(COLLECTIONS.VENTES, vente.id, vente); }
async function deleteVenteFromFirebase(venteId) { return deleteFromFirebase(COLLECTIONS.VENTES, venteId); }
async function syncAllVentesToFirebase() { return syncAllToFirebase(COLLECTIONS.VENTES, 'chickenway_ventes', window.ventes); }
async function mergeVentesFromFirebase() { return mergeFromFirebase(COLLECTIONS.VENTES, 'chickenway_ventes', 'ventes'); }

// ========= CRÉDITS =========
async function loadCreditsFromFirebase() { return loadFromFirebase(COLLECTIONS.CREDITS); }
async function saveCreditToFirebase(credit) { return saveToFirebase(COLLECTIONS.CREDITS, credit.id, credit); }
async function deleteCreditFromFirebase(creditId) { return deleteFromFirebase(COLLECTIONS.CREDITS, creditId); }
async function syncAllCreditsToFirebase() { return syncAllToFirebase(COLLECTIONS.CREDITS, 'chickenway_credits', window.credits); }
async function mergeCreditsFromFirebase() { return mergeFromFirebase(COLLECTIONS.CREDITS, 'chickenway_credits', 'credits'); }

// ========= DÉPENSES =========
async function loadDepensesFromFirebase() { return loadFromFirebase(COLLECTIONS.DEPENSES); }
async function saveDepenseToFirebase(depense) { return saveToFirebase(COLLECTIONS.DEPENSES, depense.id, depense); }
async function deleteDepenseFromFirebase(depenseId) { return deleteFromFirebase(COLLECTIONS.DEPENSES, depenseId); }
async function syncAllDepensesToFirebase() { return syncAllToFirebase(COLLECTIONS.DEPENSES, 'chickenway_depenses', window.depenses); }
async function mergeDepensesFromFirebase() { return mergeFromFirebase(COLLECTIONS.DEPENSES, 'chickenway_depenses', 'depenses'); }

// ========= CLIENTS =========
async function loadClientsFromFirebase() { return loadFromFirebase(COLLECTIONS.CLIENTS); }
async function saveClientToFirebase(client) { return saveToFirebase(COLLECTIONS.CLIENTS, client.id, client); }
async function deleteClientFromFirebase(clientId) { return deleteFromFirebase(COLLECTIONS.CLIENTS, clientId); }
async function syncAllClientsToFirebase() { return syncAllToFirebase(COLLECTIONS.CLIENTS, 'chickenway_clients', window.clients); }
async function mergeClientsFromFirebase() { return mergeFromFirebase(COLLECTIONS.CLIENTS, 'chickenway_clients', 'clients'); }

// ========= FOURNISSEURS =========
async function loadFournisseursFromFirebase() { return loadFromFirebase(COLLECTIONS.FOURNISSEURS); }
async function saveFournisseurToFirebase(fournisseur) { return saveToFirebase(COLLECTIONS.FOURNISSEURS, fournisseur.id, fournisseur); }
async function deleteFournisseurFromFirebase(fournisseurId) { return deleteFromFirebase(COLLECTIONS.FOURNISSEURS, fournisseurId); }
async function syncAllFournisseursToFirebase() { return syncAllToFirebase(COLLECTIONS.FOURNISSEURS, 'chickenway_fournisseurs', window.fournisseurs); }
async function mergeFournisseursFromFirebase() { return mergeFromFirebase(COLLECTIONS.FOURNISSEURS, 'chickenway_fournisseurs', 'fournisseurs'); }

// ========= USERS =========
async function loadUsersFromFirebase() { return loadFromFirebase(COLLECTIONS.USERS); }
async function saveUserToFirebase(user) { return saveToFirebase(COLLECTIONS.USERS, user.username, user); }
async function deleteUserFromFirebase(username) { return deleteFromFirebase(COLLECTIONS.USERS, username); }
async function syncAllUsersToFirebase() { return syncAllToFirebase(COLLECTIONS.USERS, 'chickenway_users', window.users); }
async function mergeUsersFromFirebase() { return mergeFromFirebase(COLLECTIONS.USERS, 'chickenway_users', 'users'); }

// ========= COMMANDES EN LIGNE =========
async function saveOnlineOrderToFirebase(order) {
    try {
        if (!window.db) return null;
        await ensureCollectionsExist();
        const docRef = await window.db.collection(COLLECTIONS.ONLINE_ORDERS).add({
            ...order,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Commande ${order.numero} enregistrée dans Firebase avec ID: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error("Erreur enregistrement commande:", error);
        return null;
    }
}

async function loadOnlineOrdersFromFirebase() {
    try {
        if (!window.db) return [];
        const snapshot = await window.db.collection(COLLECTIONS.ONLINE_ORDERS)
            .where('statut', '==', 'en_attente')
            .orderBy('timestamp', 'desc')
            .get();
        const orders = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data._init) orders.push({ id: doc.id, firestoreId: doc.id, ...data });
        });
        return orders;
    } catch (error) {
        console.error("Erreur chargement commandes:", error);
        return [];
    }
}

async function getAllOnlineOrders() {
    try {
        if (!window.db) return [];
        const snapshot = await window.db.collection(COLLECTIONS.ONLINE_ORDERS)
            .orderBy('timestamp', 'desc').get();
        const orders = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data._init) orders.push({ id: doc.id, firestoreId: doc.id, ...data });
        });
        return orders;
    } catch (error) {
        console.error("Erreur chargement toutes commandes:", error);
        return [];
    }
}

async function updateOrderStatusInFirebase(orderId, newStatus) {
    try {
        if (!window.db) return false;
        await window.db.collection(COLLECTIONS.ONLINE_ORDERS).doc(orderId).update({
            statut: newStatus,
            dateTraitement: new Date().toLocaleString(),
            traitePar: window.currentUser || 'POS'
        });
        return true;
    } catch (error) {
        console.error("Erreur mise à jour:", error);
        return false;
    }
}

// ========= ÉCOUTE EN TEMPS RÉEL =========
let unsubscribeListeners = {};

function startRealtimeListener(collectionName, callback, localStorageKey, globalVariableName) {
    if (!window.db) return null;
    
    if (unsubscribeListeners[collectionName]) {
        unsubscribeListeners[collectionName]();
    }
    
    unsubscribeListeners[collectionName] = window.db.collection(collectionName)
        .onSnapshot((snapshot) => {
            const items = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (!data._init) items.push(data);
            });
            items.sort((a, b) => (a.id || 0) - (b.id || 0));
            
            if (localStorageKey && items.length > 0) {
                localStorage.setItem(localStorageKey, JSON.stringify(items));
            }
            if (globalVariableName && typeof window[globalVariableName] !== 'undefined') {
                window[globalVariableName] = items;
            }
            if (callback) callback(items);
            console.log(`📢 ${items.length} ${collectionName} (temps réel)`);
        }, (error) => console.error(`Erreur écoute ${collectionName}:`, error));
    
    return unsubscribeListeners[collectionName];
}

function startAllRealtimeListeners() {
    startRealtimeListener(COLLECTIONS.PRODUCTS, (items) => {
        if (typeof window.renderProductsTable === 'function') window.renderProductsTable();
        if (typeof window.loadPOSCategories === 'function') window.loadPOSCategories();
        if (typeof window.chargerProduitsEnLigne === 'function') window.chargerProduitsEnLigne();
        if (typeof window.updateStats === 'function') window.updateStats();
    }, 'chickenway_produits', 'produits');
    
    startRealtimeListener(COLLECTIONS.CATEGORIES, (items) => {
        if (typeof window.renderCategoriesTable === 'function') window.renderCategoriesTable();
        if (typeof window.loadPOSCategories === 'function') window.loadPOSCategories();
    }, 'chickenway_categories', 'categories');
    
    startRealtimeListener(COLLECTIONS.CLIENTS, (items) => {
        if (typeof window.renderClientsTable === 'function') window.renderClientsTable();
        const totalSpan = document.getElementById('totalClients');
        if(totalSpan) totalSpan.textContent = items.length;
    }, 'chickenway_clients', 'clients');
    
    startRealtimeListener(COLLECTIONS.FOURNISSEURS, (items) => {
        if (typeof window.renderFournisseursTable === 'function') window.renderFournisseursTable();
        const totalSpan = document.getElementById('totalFournisseurs');
        if(totalSpan) totalSpan.textContent = items.length;
    }, 'chickenway_fournisseurs', 'fournisseurs');
    
    startRealtimeListener(COLLECTIONS.VENTES, (items) => {
        if (typeof window.renderVentesHistory === 'function') window.renderVentesHistory();
        if (typeof window.updateStats === 'function') window.updateStats();
    }, 'chickenway_ventes', 'ventes');
    
    startRealtimeListener(COLLECTIONS.CREDITS, (items) => {
        if (typeof window.renderCreditsTable === 'function') window.renderCreditsTable();
    }, 'chickenway_credits', 'credits');
    
    startRealtimeListener(COLLECTIONS.DEPENSES, (items) => {
        if (typeof window.renderDepensesTable === 'function') window.renderDepensesTable();
        if (typeof window.updateStats === 'function') window.updateStats();
    }, 'chickenway_depenses', 'depenses');
    
    startRealtimeListener(COLLECTIONS.USERS, null, 'chickenway_users', 'users');
    
    // Écoute des commandes en ligne
    if (!unsubscribeListeners[COLLECTIONS.ONLINE_ORDERS]) {
        unsubscribeListeners[COLLECTIONS.ONLINE_ORDERS] = window.db.collection(COLLECTIONS.ONLINE_ORDERS)
            .where('statut', '==', 'en_attente')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                const orders = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (!data._init) orders.push({ id: doc.id, firestoreId: doc.id, ...data });
                });
                const badge = document.getElementById('notifBadge');
                if (badge) badge.textContent = orders.length;
                if (typeof window.mettreAJourBadgeCommandes === 'function') window.mettreAJourBadgeCommandes();
                console.log(`📢 ${orders.length} commandes en attente (temps réel)`);
            });
    }
}

// ========= SYNCHRONISATION TOTALE =========
async function syncAllDataToFirebase() {
    console.log("🔄 Synchronisation totale vers Firebase...");
    await syncAllProductsToFirebase();
    await syncAllCategoriesToFirebase();
    await syncAllClientsToFirebase();
    await syncAllFournisseursToFirebase();
    await syncAllVentesToFirebase();
    await syncAllCreditsToFirebase();
    await syncAllDepensesToFirebase();
    await syncAllUsersToFirebase();
    console.log("✅ Synchronisation totale terminée !");
    if (typeof window.showToastMessage === 'function') {
        window.showToastMessage("✅ Toutes les données synchronisées avec Firebase !");
    }
}

async function mergeAllDataFromFirebase() {
    console.log("🔄 Fusion totale depuis Firebase...");
    await mergeProductsFromFirebase();
    await mergeCategoriesFromFirebase();
    await mergeClientsFromFirebase();
    await mergeFournisseursFromFirebase();
    await mergeVentesFromFirebase();
    await mergeCreditsFromFirebase();
    await mergeDepensesFromFirebase();
    await mergeUsersFromFirebase();
    console.log("✅ Fusion totale terminée !");
    if (typeof window.renderAllTables === 'function') window.renderAllTables();
    if (typeof window.updateStats === 'function') window.updateStats();
}

// ========= TEST CONNEXION =========
async function testFirebaseConnection() {
    try {
        if (!window.db) return false;
        const testDoc = await window.db.collection('test').add({ test: true, timestamp: new Date().toISOString() });
        await window.db.collection('test').doc(testDoc.id).delete();
        console.log("✅ Firebase connecté et opérationnel !");
        return true;
    } catch (error) {
        console.error("❌ Test Firebase échoué:", error);
        return false;
    }
}

// ========= INITIALISATION COMPLÈTE =========
async function initFirebaseComplete() {
    console.log("🔄 Initialisation Firebase complète...");
    
    if (typeof firebase === 'undefined') {
        setTimeout(initFirebaseComplete, 1000);
        return;
    }
    
    try {
        if (firebase.apps.length === 0) firebase.initializeApp(window.firebaseConfig);
        if (!window.db) window.db = firebase.firestore();
        
        await ensureCollectionsExist();
        await testFirebaseConnection();
        
        // Fusionner toutes les données
        await mergeAllDataFromFirebase();
        
        // Démarrer les écoutes en temps réel
        startAllRealtimeListeners();
        
        console.log("✅ Firebase initialisé avec succès - Synchronisation complète activée !");
    } catch (error) {
        console.error("❌ Erreur initialisation Firebase:", error);
    }
}

// ========= CRÉDITS/CATÉGORIES POUR MENU EN LIGNE =========
let cachedProducts = null;
let lastProductsFetch = 0;
const CACHE_DURATION = 60000;

async function getProductsForOnlineMenu(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedProducts && (now - lastProductsFetch) < CACHE_DURATION) {
        return cachedProducts;
    }
    const products = await loadProductsFromFirebase();
    if (products.length > 0) {
        cachedProducts = products;
        lastProductsFetch = now;
    }
    return products;
}

async function getCategoriesForOnlineMenu() {
    return loadCategoriesFromFirebase();
}

// ========= EXPOSER TOUTES LES FONCTIONS =========
window.COLLECTIONS = COLLECTIONS;
window.saveToFirebase = saveToFirebase;
window.loadFromFirebase = loadFromFirebase;
window.deleteFromFirebase = deleteFromFirebase;
window.syncAllToFirebase = syncAllToFirebase;
window.mergeFromFirebase = mergeFromFirebase;

// Produits
window.loadProductsFromFirebase = loadProductsFromFirebase;
window.saveProductToFirebase = saveProductToFirebase;
window.deleteProductFromFirebase = deleteProductFromFirebase;
window.syncAllProductsToFirebase = syncAllProductsToFirebase;
window.mergeProductsFromFirebase = mergeProductsFromFirebase;

// Catégories
window.loadCategoriesFromFirebase = loadCategoriesFromFirebase;
window.saveCategoryToFirebase = saveCategoryToFirebase;
window.deleteCategoryFromFirebase = deleteCategoryFromFirebase;
window.syncAllCategoriesToFirebase = syncAllCategoriesToFirebase;
window.mergeCategoriesFromFirebase = mergeCategoriesFromFirebase;

// Ventes
window.loadVentesFromFirebase = loadVentesFromFirebase;
window.saveVenteToFirebase = saveVenteToFirebase;
window.deleteVenteFromFirebase = deleteVenteFromFirebase;
window.syncAllVentesToFirebase = syncAllVentesToFirebase;
window.mergeVentesFromFirebase = mergeVentesFromFirebase;

// Crédits
window.loadCreditsFromFirebase = loadCreditsFromFirebase;
window.saveCreditToFirebase = saveCreditToFirebase;
window.deleteCreditFromFirebase = deleteCreditFromFirebase;
window.syncAllCreditsToFirebase = syncAllCreditsToFirebase;
window.mergeCreditsFromFirebase = mergeCreditsFromFirebase;

// Dépenses
window.loadDepensesFromFirebase = loadDepensesFromFirebase;
window.saveDepenseToFirebase = saveDepenseToFirebase;
window.deleteDepenseFromFirebase = deleteDepenseFromFirebase;
window.syncAllDepensesToFirebase = syncAllDepensesToFirebase;
window.mergeDepensesFromFirebase = mergeDepensesFromFirebase;

// Clients
window.loadClientsFromFirebase = loadClientsFromFirebase;
window.saveClientToFirebase = saveClientToFirebase;
window.deleteClientFromFirebase = deleteClientFromFirebase;
window.syncAllClientsToFirebase = syncAllClientsToFirebase;
window.mergeClientsFromFirebase = mergeClientsFromFirebase;

// Fournisseurs
window.loadFournisseursFromFirebase = loadFournisseursFromFirebase;
window.saveFournisseurToFirebase = saveFournisseurToFirebase;
window.deleteFournisseurFromFirebase = deleteFournisseurFromFirebase;
window.syncAllFournisseursToFirebase = syncAllFournisseursToFirebase;
window.mergeFournisseursFromFirebase = mergeFournisseursFromFirebase;

// Users
window.loadUsersFromFirebase = loadUsersFromFirebase;
window.saveUserToFirebase = saveUserToFirebase;
window.deleteUserFromFirebase = deleteUserFromFirebase;
window.syncAllUsersToFirebase = syncAllUsersToFirebase;
window.mergeUsersFromFirebase = mergeUsersFromFirebase;

// Commandes en ligne
window.saveOnlineOrderToFirebase = saveOnlineOrderToFirebase;
window.loadOnlineOrdersFromFirebase = loadOnlineOrdersFromFirebase;
window.getAllOnlineOrders = getAllOnlineOrders;
window.updateOrderStatusInFirebase = updateOrderStatusInFirebase;

// Utilitaires
window.syncAllDataToFirebase = syncAllDataToFirebase;
window.mergeAllDataFromFirebase = mergeAllDataFromFirebase;
window.testFirebaseConnection = testFirebaseConnection;
window.startRealtimeListener = startRealtimeListener;
window.startAllRealtimeListeners = startAllRealtimeListeners;
window.initFirebase = initFirebaseComplete;
window.getProductsForOnlineMenu = getProductsForOnlineMenu;
window.getCategoriesForOnlineMenu = getCategoriesForOnlineMenu;

// Démarrer l'initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebaseComplete);
} else {
    initFirebaseComplete();
}

console.log("✅ firebase-config.js chargé - Synchronisation COMPLÈTE activée !");
console.log("📦 Collections disponibles:", Object.keys(COLLECTIONS));
