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
    console.log("📁 Project ID:", window.firebaseConfig.projectId);
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

console.log("📦 Collections configurées:", Object.keys(COLLECTIONS));

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
                console.log(`✅ Collection '${collectionName}' créée`);
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
        
        console.log("✅ Toutes les collections sont prêtes");
        return true;
    } catch (error) {
        console.error("❌ Erreur vérification collections:", error);
        return false;
    }
}

// ========= FONCTIONS GÉNÉRIQUES =========
async function saveToFirebase(collectionName, id, data) {
    try {
        if (!window.db) return false;
        await window.db.collection(collectionName).doc(id.toString()).set({
            ...data,
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ ${collectionName} ${id} sauvegardé`);
        return true;
    } catch (error) {
        console.error(`Erreur sauvegarde ${collectionName}:`, error);
        return false;
    }
}

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
        console.log(`✅ ${items.length} ${collectionName} chargés`);
        return items;
    } catch (error) {
        console.error(`Erreur chargement ${collectionName}:`, error);
        return [];
    }
}

async function deleteFromFirebase(collectionName, id) {
    try {
        if (!window.db) return false;
        await window.db.collection(collectionName).doc(id.toString()).delete();
        console.log(`✅ ${collectionName} ${id} supprimé`);
        return true;
    } catch (error) {
        console.error(`Erreur suppression ${collectionName}:`, error);
        return false;
    }
}

async function syncAllToFirebase(collectionName, localStorageKey, dataArray) {
    try {
        if (!window.db) return false;
        
        const items = dataArray || JSON.parse(localStorage.getItem(localStorageKey) || '[]');
        if (items.length === 0) {
            console.log(`⚠️ Aucune donnée à synchroniser pour ${collectionName}`);
            return false;
        }
        
        await ensureCollectionsExist();
        
        let compteur = 0;
        for (const item of items) {
            if (item.id || item.username) {
                const docId = item.id || item.username;
                await window.db.collection(collectionName).doc(docId.toString()).set({
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

// ========= 1. PRODUITS =========
async function loadProductsFromFirebase() { return loadFromFirebase(COLLECTIONS.PRODUCTS); }
async function saveProductToFirebase(product) { return saveToFirebase(COLLECTIONS.PRODUCTS, product.id, product); }
async function deleteProductFromFirebase(productId) { return deleteFromFirebase(COLLECTIONS.PRODUCTS, productId); }
async function syncAllProductsToFirebase() { return syncAllToFirebase(COLLECTIONS.PRODUCTS, 'chickenway_produits', window.produits); }
async function mergeProductsFromFirebase() { return mergeFromFirebase(COLLECTIONS.PRODUCTS, 'chickenway_produits', 'produits'); }

// ========= 2. CATÉGORIES =========
async function loadCategoriesFromFirebase() { return loadFromFirebase(COLLECTIONS.CATEGORIES); }
async function saveCategoryToFirebase(category) { return saveToFirebase(COLLECTIONS.CATEGORIES, category.id, category); }
async function deleteCategoryFromFirebase(categoryId) { return deleteFromFirebase(COLLECTIONS.CATEGORIES, categoryId); }
async function syncAllCategoriesToFirebase() { return syncAllToFirebase(COLLECTIONS.CATEGORIES, 'chickenway_categories', window.categories); }
async function mergeCategoriesFromFirebase() { return mergeFromFirebase(COLLECTIONS.CATEGORIES, 'chickenway_categories', 'categories'); }

// ========= 3. VENTES =========
async function loadVentesFromFirebase() { return loadFromFirebase(COLLECTIONS.VENTES); }
async function saveVenteToFirebase(vente) { return saveToFirebase(COLLECTIONS.VENTES, vente.id, vente); }
async function deleteVenteFromFirebase(venteId) { return deleteFromFirebase(COLLECTIONS.VENTES, venteId); }
async function syncAllVentesToFirebase() { return syncAllToFirebase(COLLECTIONS.VENTES, 'chickenway_ventes', window.ventes); }
async function mergeVentesFromFirebase() { return mergeFromFirebase(COLLECTIONS.VENTES, 'chickenway_ventes', 'ventes'); }

// ========= 4. CRÉDITS =========
async function loadCreditsFromFirebase() { return loadFromFirebase(COLLECTIONS.CREDITS); }
async function saveCreditToFirebase(credit) { return saveToFirebase(COLLECTIONS.CREDITS, credit.id, credit); }
async function deleteCreditFromFirebase(creditId) { return deleteFromFirebase(COLLECTIONS.CREDITS, creditId); }
async function syncAllCreditsToFirebase() { return syncAllToFirebase(COLLECTIONS.CREDITS, 'chickenway_credits', window.credits); }
async function mergeCreditsFromFirebase() { return mergeFromFirebase(COLLECTIONS.CREDITS, 'chickenway_credits', 'credits'); }

// ========= 5. DÉPENSES =========
async function loadDepensesFromFirebase() { return loadFromFirebase(COLLECTIONS.DEPENSES); }
async function saveDepenseToFirebase(depense) { return saveToFirebase(COLLECTIONS.DEPENSES, depense.id, depense); }
async function deleteDepenseFromFirebase(depenseId) { return deleteFromFirebase(COLLECTIONS.DEPENSES, depenseId); }
async function syncAllDepensesToFirebase() { return syncAllToFirebase(COLLECTIONS.DEPENSES, 'chickenway_depenses', window.depenses); }
async function mergeDepensesFromFirebase() { return mergeFromFirebase(COLLECTIONS.DEPENSES, 'chickenway_depenses', 'depenses'); }

// ========= 6. CLIENTS =========
async function loadClientsFromFirebase() { return loadFromFirebase(COLLECTIONS.CLIENTS); }
async function saveClientToFirebase(client) { return saveToFirebase(COLLECTIONS.CLIENTS, client.id, client); }
async function deleteClientFromFirebase(clientId) { return deleteFromFirebase(COLLECTIONS.CLIENTS, clientId); }
async function syncAllClientsToFirebase() { return syncAllToFirebase(COLLECTIONS.CLIENTS, 'chickenway_clients', window.clients); }
async function mergeClientsFromFirebase() { return mergeFromFirebase(COLLECTIONS.CLIENTS, 'chickenway_clients', 'clients'); }

// ========= 7. FOURNISSEURS =========
async function loadFournisseursFromFirebase() { return loadFromFirebase(COLLECTIONS.FOURNISSEURS); }
async function saveFournisseurToFirebase(fournisseur) { return saveToFirebase(COLLECTIONS.FOURNISSEURS, fournisseur.id, fournisseur); }
async function deleteFournisseurFromFirebase(fournisseurId) { return deleteFromFirebase(COLLECTIONS.FOURNISSEURS, fournisseurId); }
async function syncAllFournisseursToFirebase() { return syncAllToFirebase(COLLECTIONS.FOURNISSEURS, 'chickenway_fournisseurs', window.fournisseurs); }
async function mergeFournisseursFromFirebase() { return mergeFromFirebase(COLLECTIONS.FOURNISSEURS, 'chickenway_fournisseurs', 'fournisseurs'); }

// ========= 8. USERS =========
async function loadUsersFromFirebase() { return loadFromFirebase(COLLECTIONS.USERS); }
async function saveUserToFirebase(user) { return saveToFirebase(COLLECTIONS.USERS, user.username, user); }
async function deleteUserFromFirebase(username) { return deleteFromFirebase(COLLECTIONS.USERS, username); }
async function syncAllUsersToFirebase() { return syncAllToFirebase(COLLECTIONS.USERS, 'chickenway_users', window.users); }
async function mergeUsersFromFirebase() { return mergeFromFirebase(COLLECTIONS.USERS, 'chickenway_users', 'users'); }

// ========= 9. COMMANDES EN LIGNE =========
async function saveOnlineOrderToFirebase(order) {
    try {
        if (!window.db) return null;
        await ensureCollectionsExist();
        const docRef = await window.db.collection(COLLECTIONS.ONLINE_ORDERS).add({
            ...order,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Commande ${order.numero} enregistrée (ID: ${docRef.id})`);
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
        console.log(`✅ ${orders.length} commandes en attente`);
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
            .orderBy('timestamp', 'desc')
            .get();
        const orders = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data._init) orders.push({ id: doc.id, firestoreId: doc.id, ...data });
        });
        console.log(`✅ ${orders.length} commandes totales`);
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
        console.log(`✅ Commande ${orderId} mis à jour: ${newStatus}`);
        return true;
    } catch (error) {
        console.error("Erreur mise à jour:", error);
        return false;
    }
}

async function deleteOrderFromFirebase(orderId) {
    try {
        if (!window.db) return false;
        await window.db.collection(COLLECTIONS.ONLINE_ORDERS).doc(orderId).delete();
        console.log(`✅ Commande ${orderId} supprimée`);
        return true;
    } catch (error) {
        console.error("Erreur suppression commande:", error);
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
            if (collectionName !== COLLECTIONS.ONLINE_ORDERS) {
                items.sort((a, b) => (a.id || 0) - (b.id || 0));
            } else {
                items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            }
            
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
    console.log("🔄 Démarrage des écoutes temps réel...");
    
    startRealtimeListener(COLLECTIONS.PRODUCTS, (items) => {
        if (typeof window.renderProductsTable === 'function') window.renderProductsTable();
        if (typeof window.loadPOSCategories === 'function') window.loadPOSCategories();
        if (typeof window.chargerProduitsEnLigne === 'function') window.chargerProduitsEnLigne();
        if (typeof window.updateStats === 'function') window.updateStats();
    }, 'chickenway_produits', 'produits');
    
    startRealtimeListener(COLLECTIONS.CATEGORIES, (items) => {
        if (typeof window.renderCategoriesTable === 'function') window.renderCategoriesTable();
        if (typeof window.loadPOSCategories === 'function') window.loadPOSCategories();
        if (typeof window.chargerCategoriesEnLigne === 'function') window.chargerCategoriesEnLigne();
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
    
    // Écoute spéciale pour les commandes en ligne
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
                if (typeof window.afficherCommandesEnLigneList === 'function') {
                    const modal = document.getElementById('commandesEnLigneListModal');
                    if (modal && !modal.classList.contains('hidden')) {
                        window.afficherCommandesEnLigneList();
                    }
                }
                console.log(`📢 ${orders.length} commandes en attente (temps réel)`);
            });
    }
    
    console.log("✅ Toutes les écoutes temps réel sont actives");
}

function stopAllRealtimeListeners() {
    for (const [key, unsubscribe] of Object.entries(unsubscribeListeners)) {
        if (unsubscribe) {
            unsubscribe();
            console.log(`🔇 Écoute ${key} arrêtée`);
        }
    }
    unsubscribeListeners = {};
}

// ========= SYNCHRONISATION TOTALE =========
async function syncAllDataToFirebase() {
    console.log("🔄 SYNCHRONISATION TOTALE VERS FIREBASE...");
    console.log("=====================================");
    
    await syncAllProductsToFirebase();
    await syncAllCategoriesToFirebase();
    await syncAllClientsToFirebase();
    await syncAllFournisseursToFirebase();
    await syncAllVentesToFirebase();
    await syncAllCreditsToFirebase();
    await syncAllDepensesToFirebase();
    await syncAllUsersToFirebase();
    
    console.log("=====================================");
    console.log("✅ SYNCHRONISATION TOTALE TERMINÉE !");
    if (typeof window.showToastMessage === 'function') {
        window.showToastMessage("✅ Toutes les données synchronisées avec Firebase !");
    }
}

async function mergeAllDataFromFirebase() {
    console.log("🔄 FUSION TOTALE DEPUIS FIREBASE...");
    console.log("=====================================");
    
    await mergeProductsFromFirebase();
    await mergeCategoriesFromFirebase();
    await mergeClientsFromFirebase();
    await mergeFournisseursFromFirebase();
    await mergeVentesFromFirebase();
    await mergeCreditsFromFirebase();
    await mergeDepensesFromFirebase();
    await mergeUsersFromFirebase();
    
    console.log("=====================================");
    console.log("✅ FUSION TOTALE TERMINÉE !");
    
    if (typeof window.renderAllTables === 'function') window.renderAllTables();
    if (typeof window.updateStats === 'function') window.updateStats();
    if (typeof window.loadPOSCategories === 'function') window.loadPOSCategories();
}

// ========= SAUVEGARDE PÉRIODIQUE =========
let autoSyncInterval = null;

function startAutoSync(intervalMinutes = 5) {
    if (autoSyncInterval) clearInterval(autoSyncInterval);
    autoSyncInterval = setInterval(() => {
        console.log("⏰ Sauvegarde automatique périodique vers Firebase...");
        syncAllDataToFirebase();
    }, intervalMinutes * 60 * 1000);
    console.log(`✅ Sauvegarde automatique activée toutes les ${intervalMinutes} minutes`);
}

function stopAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
        console.log("🔇 Sauvegarde automatique arrêtée");
    }
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

// ========= STATISTIQUES FIREBASE =========
async function getFirebaseStats() {
    console.log("📊 STATISTIQUES FIREBASE...");
    const stats = {};
    
    for (const [key, collectionName] of Object.entries(COLLECTIONS)) {
        const items = await loadFromFirebase(collectionName);
        stats[collectionName] = items.length;
    }
    
    console.table(stats);
    return stats;
}

// ========= MENU EN LIGNE (CACHE) =========
let cachedProducts = null;
let cachedCategories = null;
let lastProductsFetch = 0;
let lastCategoriesFetch = 0;
const CACHE_DURATION = 60000; // 1 minute

async function getProductsForOnlineMenu(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedProducts && (now - lastProductsFetch) < CACHE_DURATION) {
        console.log("📦 Utilisation du cache produits (menu en ligne)");
        return cachedProducts;
    }
    const products = await loadProductsFromFirebase();
    if (products.length > 0) {
        cachedProducts = products;
        lastProductsFetch = now;
    }
    return products;
}

async function getCategoriesForOnlineMenu(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedCategories && (now - lastCategoriesFetch) < CACHE_DURATION) {
        console.log("📦 Utilisation du cache catégories (menu en ligne)");
        return cachedCategories;
    }
    const categories = await loadCategoriesFromFirebase();
    if (categories.length > 0) {
        cachedCategories = categories;
        lastCategoriesFetch = now;
    }
    return categories;
}

function clearCache() {
    cachedProducts = null;
    cachedCategories = null;
    lastProductsFetch = 0;
    lastCategoriesFetch = 0;
    console.log("🗑️ Cache vidé");
}

// ========= INITIALISATION COMPLÈTE =========
async function initFirebaseComplete() {
    console.log("🔄 INITIALISATION FIREBASE COMPLÈTE...");
    console.log("=====================================");
    
    if (typeof firebase === 'undefined') {
        console.warn("⚠️ Firebase SDK non chargé, nouvelle tentative dans 1s...");
        setTimeout(initFirebaseComplete, 1000);
        return;
    }
    
    try {
        if (firebase.apps.length === 0) {
            firebase.initializeApp(window.firebaseConfig);
            console.log("🔥 Firebase initialisé");
        }
        if (!window.db) {
            window.db = firebase.firestore();
            console.log("📁 Firestore initialisé");
        }
        
        await ensureCollectionsExist();
        const isConnected = await testFirebaseConnection();
        
        if (isConnected) {
            console.log("✅ Firebase connecté et opérationnel !");
            
            // Fusionner toutes les données
            await mergeAllDataFromFirebase();
            
            // Démarrer les écoutes en temps réel
            startAllRealtimeListeners();
            
            // Démarrer la sauvegarde automatique
            startAutoSync(5);
        } else {
            console.warn("⚠️ Firebase non connecté, mode offline uniquement");
        }
        
        console.log("=====================================");
        console.log("✅ FIREBASE PRÊT - Synchronisation complète activée !");
        console.log("📦 Collections disponibles:", Object.keys(COLLECTIONS).join(", "));
        
        // Afficher un toast de bienvenue
        if (typeof window.showToastMessage === 'function') {
            window.showToastMessage("🔥 Firebase connecté - Synchronisation en temps réel activée !");
        }
        
    } catch (error) {
        console.error("❌ Erreur initialisation Firebase:", error);
    }
}

// ========= FONCTIONS POUR CLIENTS (COMPATIBILITÉ) =========
function demarrerEcoutesCommandesEnLigne() {
    console.log("📱 Écoute commandes en ligne active");
}

function arreterEcoutesCommandesEnLigne() {
    if (unsubscribeListeners[COLLECTIONS.ONLINE_ORDERS]) {
        unsubscribeListeners[COLLECTIONS.ONLINE_ORDERS]();
        unsubscribeListeners[COLLECTIONS.ONLINE_ORDERS] = null;
    }
}

// ========= EXPOSER TOUTES LES FONCTIONS =========
// Collections
window.COLLECTIONS = COLLECTIONS;

// Génériques
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
window.deleteOrderFromFirebase = deleteOrderFromFirebase;

// Utilitaires
window.syncAllDataToFirebase = syncAllDataToFirebase;
window.mergeAllDataFromFirebase = mergeAllDataFromFirebase;
window.testFirebaseConnection = testFirebaseConnection;
window.startRealtimeListener = startRealtimeListener;
window.startAllRealtimeListeners = startAllRealtimeListeners;
window.stopAllRealtimeListeners = stopAllRealtimeListeners;
window.startAutoSync = startAutoSync;
window.stopAutoSync = stopAutoSync;
window.getFirebaseStats = getFirebaseStats;
window.clearCache = clearCache;
window.initFirebase = initFirebaseComplete;
window.demarrerEcoutesCommandesEnLigne = demarrerEcoutesCommandesEnLigne;
window.arreterEcoutesCommandesEnLigne = arreterEcoutesCommandesEnLigne;

// Menu en ligne
window.getProductsForOnlineMenu = getProductsForOnlineMenu;
window.getCategoriesForOnlineMenu = getCategoriesForOnlineMenu;

// Démarrer l'initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebaseComplete);
} else {
    initFirebaseComplete();
}

console.log("✅ firebase-config.js chargé - Synchronisation COMPLÈTE activée !");
console.log("📦 9 collections configurées:", Object.keys(COLLECTIONS).join(", "));
console.log("🔧 Fonctions disponibles: syncAllDataToFirebase, mergeAllDataFromFirebase, getFirebaseStats, startAutoSync, stopAutoSync");
