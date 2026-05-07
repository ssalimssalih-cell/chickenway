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

// Collections
const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'online_orders';

// ========= VÉRIFIER ET CRÉER LES COLLECTIONS =========
async function ensureCollectionsExist() {
    try {
        if (!window.db) {
            console.error("❌ Firestore non initialisé");
            return false;
        }
        
        // Vérifier la collection products
        const productsSnapshot = await window.db.collection(PRODUCTS_COLLECTION).limit(1).get();
        if (productsSnapshot.empty) {
            console.log("📦 Création de la collection 'products'...");
            await window.db.collection(PRODUCTS_COLLECTION).doc('_init_').set({
                _init: true,
                createdAt: new Date().toISOString()
            });
            console.log("✅ Collection 'products' créée");
        }
        
        // Vérifier la collection online_orders
        const ordersSnapshot = await window.db.collection(ORDERS_COLLECTION).limit(1).get();
        if (ordersSnapshot.empty) {
            console.log("📦 Création de la collection 'online_orders'...");
            await window.db.collection(ORDERS_COLLECTION).doc('_init_').set({
                _init: true,
                createdAt: new Date().toISOString()
            });
            console.log("✅ Collection 'online_orders' créée");
        }
        
        // Supprimer les documents d'initialisation après création
        try {
            const initProduct = await window.db.collection(PRODUCTS_COLLECTION).doc('_init_').get();
            if (initProduct.exists && initProduct.data()._init) {
                await window.db.collection(PRODUCTS_COLLECTION).doc('_init_').delete();
            }
        } catch(e) {}
        
        try {
            const initOrder = await window.db.collection(ORDERS_COLLECTION).doc('_init_').get();
            if (initOrder.exists && initOrder.data()._init) {
                await window.db.collection(ORDERS_COLLECTION).doc('_init_').delete();
            }
        } catch(e) {}
        
        return true;
    } catch (error) {
        console.error("❌ Erreur vérification collections:", error);
        return false;
    }
}

// ========= SYNCHRONISATION DES PRODUITS =========
async function syncProductsToFirebase() {
    try {
        if (!window.db) {
            alert("Firebase non disponible");
            return false;
        }
        
        const produits = JSON.parse(localStorage.getItem('chickenway_produits')) || [];
        
        if (produits.length === 0) {
            alert("Aucun produit à synchroniser");
            return false;
        }
        
        await ensureCollectionsExist();
        
        let compteur = 0;
        for (const produit of produits) {
            if (produit.id) {
                await window.db.collection(PRODUCTS_COLLECTION).doc(produit.id.toString()).set({
                    id: produit.id,
                    nom: produit.nom,
                    categorieId: produit.categorieId,
                    image: produit.image || '',
                    description: produit.description || '',
                    prixAchat: produit.prixAchat || 0,
                    prixVente: produit.prixVente || 0,
                    prixPromo: produit.prixPromo || 0,
                    stock: produit.stock || 0,
                    quantiteVendue: produit.quantiteVendue || 0,
                    tempsPreparation: produit.tempsPreparation || 5,
                    disponibilite: produit.disponibilite || 'disponible',
                    dateCreation: produit.dateCreation || new Date().toISOString()
                });
                compteur++;
            }
        }
        
        alert(`✅ ${compteur} produits synchronisés vers Firebase !`);
        return true;
    } catch (error) {
        console.error("Erreur sync Firebase:", error);
        alert("❌ Erreur de synchronisation: " + error.message);
        return false;
    }
}

// ========= COMMANDES EN LIGNE =========
async function saveOnlineOrderToFirebase(order) {
    try {
        if (!window.db) {
            console.error("Firestore non disponible");
            return null;
        }
        
        await ensureCollectionsExist();
        
        const docRef = await window.db.collection(ORDERS_COLLECTION).add({
            numero: order.numero,
            client: order.client,
            telephone: order.telephone || '',
            items: order.items,
            total: order.total,
            statut: 'en_attente',
            date: order.date,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            source: 'client_mobile'
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
        if (!window.db) {
            console.error("Firestore non disponible");
            return [];
        }
        
        const snapshot = await window.db.collection(ORDERS_COLLECTION)
            .where('statut', '==', 'en_attente')
            .orderBy('timestamp', 'desc')
            .get();
        
        const orders = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data._init) {
                orders.push({
                    id: doc.id,
                    firestoreId: doc.id,
                    ...data
                });
            }
        });
        
        console.log(`✅ ${orders.length} commandes en attente depuis Firebase`);
        return orders;
    } catch (error) {
        console.error("Erreur chargement commandes:", error);
        return [];
    }
}

async function getAllOnlineOrders() {
    try {
        if (!window.db) return [];
        
        const snapshot = await window.db.collection(ORDERS_COLLECTION)
            .orderBy('timestamp', 'desc')
            .get();
        
        const orders = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data._init) {
                orders.push({
                    id: doc.id,
                    firestoreId: doc.id,
                    ...data
                });
            }
        });
        
        console.log(`✅ ${orders.length} commandes totales depuis Firebase`);
        return orders;
    } catch (error) {
        console.error("Erreur chargement toutes commandes:", error);
        return [];
    }
}

async function updateOrderStatusInFirebase(orderId, newStatus) {
    try {
        if (!window.db) return false;
        
        await window.db.collection(ORDERS_COLLECTION).doc(orderId).update({
            statut: newStatus,
            dateTraitement: new Date().toLocaleString(),
            traitePar: window.currentUser || 'POS'
        });
        console.log(`✅ Commande ${orderId} mise à jour: ${newStatus}`);
        return true;
    } catch (error) {
        console.error("Erreur mise à jour:", error);
        return false;
    }
}

async function deleteOrder(orderId) {
    try {
        if (!window.db) return false;
        
        await window.db.collection(ORDERS_COLLECTION).doc(orderId).delete();
        console.log(`✅ Commande ${orderId} supprimée de Firebase`);
        return true;
    } catch (error) {
        console.error("Erreur suppression:", error);
        return false;
    }
}

// ========= ÉCOUTE EN TEMPS RÉEL =========
let unsubscribeListener = null;

function listenToOnlineOrders(callback) {
    if (!window.db) {
        console.error("Firestore non disponible pour l'écoute");
        return null;
    }
    
    if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
    }
    
    unsubscribeListener = window.db.collection(ORDERS_COLLECTION)
        .where('statut', '==', 'en_attente')
        .orderBy('timestamp', 'desc')
        .onSnapshot((snapshot) => {
            const orders = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (!data._init) {
                    orders.push({
                        id: doc.id,
                        firestoreId: doc.id,
                        ...data
                    });
                }
            });
            
            if (callback) callback(orders);
            
            // Mettre à jour le badge
            const badge = document.getElementById('notifBadge');
            if (badge) {
                badge.textContent = orders.length;
            }
            
            console.log(`📢 ${orders.length} commandes en attente (temps réel)`);
        }, (error) => {
            console.error("Erreur écoute Firebase:", error);
        });
    
    return unsubscribeListener;
}

function demarrerEcoutesCommandesEnLigne() {
    if (!window.db) {
        console.error("Firestore non disponible - écoute impossible");
        return;
    }
    
    listenToOnlineOrders((orders) => {
        console.log(`📱 ${orders.length} commandes en ligne en attente`);
        
        // Rafraîchir l'affichage si le modal est ouvert
        const modal = document.getElementById('commandesEnLigneListModal');
        if (modal && !modal.classList.contains('hidden')) {
            if (typeof window.afficherCommandesEnLigneList === 'function') {
                window.afficherCommandesEnLigneList();
            }
        }
        
        if (typeof window.mettreAJourBadgeCommandes === 'function') {
            window.mettreAJourBadgeCommandes();
        }
    });
}

function arreterEcoutesCommandesEnLigne() {
    if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
        console.log("🔇 Écoute Firebase arrêtée");
    }
}

// ========= FONCTIONS POUR LES CLIENTS (OPTIONNEL) =========
async function saveClientToFirebase(client) {
    try {
        if (!window.db) return null;
        
        await window.db.collection('clients').doc(client.id.toString()).set(client);
        console.log(`✅ Client ${client.nom} synchronisé`);
        return client.id;
    } catch (error) {
        console.error("Erreur sauvegarde client:", error);
        return null;
    }
}

async function loadClientsFromFirebase() {
    try {
        if (!window.db) return [];
        
        const snapshot = await window.db.collection('clients').get();
        const clients = [];
        snapshot.forEach(doc => {
            clients.push(doc.data());
        });
        return clients;
    } catch (error) {
        console.error("Erreur chargement clients:", error);
        return [];
    }
}

// ========= FONCTION POUR TESTER LA CONNEXION =========
async function testFirebaseConnection() {
    try {
        if (!window.db) {
            console.error("❌ Firestore non disponible");
            return false;
        }
        
        // Tester l'écriture
        const testDoc = await window.db.collection('test').add({
            test: true,
            timestamp: new Date().toISOString()
        });
        
        console.log("✅ Test écriture réussi, ID:", testDoc.id);
        
        // Supprimer le document test
        await window.db.collection('test').doc(testDoc.id).delete();
        console.log("✅ Test suppression réussi");
        
        return true;
    } catch (error) {
        console.error("❌ Test Firebase échoué:", error);
        return false;
    }
}

// ========= INITIALISATION =========
async function initFirebase() {
    console.log("🔄 Initialisation Firebase...");
    
    // Attendre que Firebase soit chargé
    if (typeof firebase === 'undefined') {
        console.warn("⚠️ Firebase SDK non chargé, nouvelle tentative dans 1s...");
        setTimeout(initFirebase, 1000);
        return;
    }
    
    try {
        if (firebase.apps.length === 0) {
            firebase.initializeApp(window.firebaseConfig);
            console.log("🔥 Firebase initialisé tardivement");
        }
        
        if (!window.db) {
            window.db = firebase.firestore();
            console.log("📁 Firestore initialisé");
        }
        
        await ensureCollectionsExist();
        
        // Tester la connexion
        const isConnected = await testFirebaseConnection();
        if (isConnected) {
            console.log("✅ Firebase connecté et opérationnel !");
        } else {
            console.warn("⚠️ Firebase connecté mais les opérations peuvent échouer");
        }
        
        // Démarrer l'écoute des commandes
        demarrerEcoutesCommandesEnLigne();
        
    } catch (error) {
        console.error("❌ Erreur initialisation Firebase:", error);
    }
}

// Exposer les fonctions globalement
window.syncProductsToFirebase = syncProductsToFirebase;
window.saveOnlineOrderToFirebase = saveOnlineOrderToFirebase;
window.loadOnlineOrdersFromFirebase = loadOnlineOrdersFromFirebase;
window.getAllOnlineOrders = getAllOnlineOrders;
window.updateOrderStatusInFirebase = updateOrderStatusInFirebase;
window.deleteOrder = deleteOrder;
window.listenToOnlineOrders = listenToOnlineOrders;
window.demarrerEcoutesCommandesEnLigne = demarrerEcoutesCommandesEnLigne;
window.arreterEcoutesCommandesEnLigne = arreterEcoutesCommandesEnLigne;
window.saveClientToFirebase = saveClientToFirebase;
window.loadClientsFromFirebase = loadClientsFromFirebase;
window.testFirebaseConnection = testFirebaseConnection;

// Démarrer l'initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
} else {
    initFirebase();
}

console.log("📁 firebase-config.js chargé");
// ========= FONCTIONS POUR LA SYNCHRONISATION DES PRODUITS (AJOUTER CECI À LA FIN) =========

// Charger tous les produits depuis Firebase
async function loadProductsFromFirebase() {
    try {
        if (!window.db) {
            console.error("Firestore non disponible");
            return [];
        }
        
        const snapshot = await window.db.collection(PRODUCTS_COLLECTION).get();
        const products = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.id && !data._init) {
                products.push(data);
            }
        });
        
        products.sort((a, b) => a.id - b.id);
        console.log(`✅ ${products.length} produits chargés depuis Firebase`);
        return products;
    } catch (error) {
        console.error("Erreur chargement produits:", error);
        return [];
    }
}

// Sauvegarder un seul produit dans Firebase
async function saveProductToFirebase(product) {
    try {
        if (!window.db) {
            console.error("Firestore non disponible");
            return false;
        }
        
        if (!product.id) {
            console.error("Produit sans ID");
            return false;
        }
        
        await window.db.collection(PRODUCTS_COLLECTION).doc(product.id.toString()).set({
            id: product.id,
            nom: product.nom,
            categorieId: product.categorieId,
            image: product.image || '',
            description: product.description || '',
            prixAchat: product.prixAchat || 0,
            prixVente: product.prixVente || 0,
            prixPromo: product.prixPromo || 0,
            stock: product.stock || 0,
            quantiteVendue: product.quantiteVendue || 0,
            tempsPreparation: product.tempsPreparation || 5,
            disponibilite: product.disponibilite || 'disponible',
            chiffreAffaire: product.chiffreAffaire || 0,
            dateCreation: product.dateCreation || new Date().toISOString(),
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Produit "${product.nom}" (ID: ${product.id}) synchronisé vers Firebase`);
        return true;
    } catch (error) {
        console.error("Erreur sauvegarde produit:", error);
        return false;
    }
}

// Supprimer un produit de Firebase
async function deleteProductFromFirebase(productId) {
    try {
        if (!window.db) return false;
        
        await window.db.collection(PRODUCTS_COLLECTION).doc(productId.toString()).delete();
        console.log(`✅ Produit ${productId} supprimé de Firebase`);
        return true;
    } catch (error) {
        console.error("Erreur suppression produit:", error);
        return false;
    }
}

// Synchroniser TOUS les produits vers Firebase
async function syncAllDataToFirebase() {
    try {
        if (!window.db) {
            console.error("Firestore non disponible");
            return false;
        }
        
        const produits = JSON.parse(localStorage.getItem('chickenway_produits')) || [];
        
        if (produits.length === 0) {
            console.log("Aucun produit à synchroniser");
            return false;
        }
        
        await ensureCollectionsExist();
        
        let compteur = 0;
        for (const produit of produits) {
            if (produit.id) {
                await window.db.collection(PRODUCTS_COLLECTION).doc(produit.id.toString()).set({
                    id: produit.id,
                    nom: produit.nom,
                    categorieId: produit.categorieId,
                    image: produit.image || '',
                    description: produit.description || '',
                    prixAchat: produit.prixAchat || 0,
                    prixVente: produit.prixVente || 0,
                    prixPromo: produit.prixPromo || 0,
                    stock: produit.stock || 0,
                    quantiteVendue: produit.quantiteVendue || 0,
                    tempsPreparation: produit.tempsPreparation || 5,
                    disponibilite: produit.disponibilite || 'disponible',
                    chiffreAffaire: produit.chiffreAffaire || 0,
                    dateCreation: produit.dateCreation || new Date().toISOString(),
                    lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
                });
                compteur++;
            }
        }
        
        console.log(`✅ ${compteur} produits synchronisés vers Firebase`);
        
        // Afficher un toast si disponible
        if (typeof window.showToastMessage === 'function') {
            window.showToastMessage(`✅ ${compteur} produits synchronisés !`);
        }
        
        return true;
    } catch (error) {
        console.error("Erreur sync Firebase:", error);
        return false;
    }
}

// Fusionner les produits depuis Firebase (priorité à Firebase)
async function mergeProductsFromFirebase() {
    console.log("🔄 Fusion des produits depuis Firebase...");
    
    try {
        const firebaseProducts = await loadProductsFromFirebase();
        
        if (firebaseProducts.length > 0) {
            // Sauvegarder dans localStorage
            localStorage.setItem('chickenway_produits', JSON.stringify(firebaseProducts));
            
            // Mettre à jour la variable globale si elle existe
            if (typeof window.produits !== 'undefined') {
                window.produits = firebaseProducts;
            }
            
            console.log(`📦 ${firebaseProducts.length} produits fusionnés depuis Firebase`);
            return true;
        } else {
            // Si Firebase est vide, synchroniser les produits locaux
            console.log("📤 Firebase vide, synchronisation des produits locaux...");
            await syncAllDataToFirebase();
            return true;
        }
    } catch (error) {
        console.error("Erreur fusion produits:", error);
        return false;
    }
}

// ========= FONCTIONS POUR LES CATÉGORIES =========

// Collection des catégories
const CATEGORIES_COLLECTION = 'categories';

async function loadCategoriesFromFirebase() {
    try {
        if (!window.db) return [];
        
        const snapshot = await window.db.collection(CATEGORIES_COLLECTION).get();
        const categories = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.id && !data._init) {
                categories.push(data);
            }
        });
        
        categories.sort((a, b) => a.id - b.id);
        console.log(`✅ ${categories.length} catégories chargées depuis Firebase`);
        return categories;
    } catch (error) {
        console.error("Erreur chargement catégories:", error);
        return [];
    }
}

async function saveCategoryToFirebase(category) {
    try {
        if (!window.db) return false;
        
        await window.db.collection(CATEGORIES_COLLECTION).doc(category.id.toString()).set({
            id: category.id,
            nom: category.nom,
            icon: category.icon,
            description: category.description || '',
            dateCreation: category.dateCreation || new Date().toISOString(),
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Catégorie "${category.nom}" synchronisée vers Firebase`);
        return true;
    } catch (error) {
        console.error("Erreur sauvegarde catégorie:", error);
        return false;
    }
}

async function deleteCategoryFromFirebase(categoryId) {
    try {
        if (!window.db) return false;
        
        await window.db.collection(CATEGORIES_COLLECTION).doc(categoryId.toString()).delete();
        console.log(`✅ Catégorie ${categoryId} supprimée de Firebase`);
        return true;
    } catch (error) {
        console.error("Erreur suppression catégorie:", error);
        return false;
    }
}

async function syncAllCategoriesToFirebase() {
    try {
        if (!window.db) return false;
        
        const categories = JSON.parse(localStorage.getItem('chickenway_categories')) || [];
        
        for (const category of categories) {
            if (category.id) {
                await saveCategoryToFirebase(category);
            }
        }
        
        console.log(`✅ ${categories.length} catégories synchronisées vers Firebase`);
        return true;
    } catch (error) {
        console.error("Erreur sync catégories:", error);
        return false;
    }
}

async function mergeCategoriesFromFirebase() {
    console.log("🔄 Fusion des catégories depuis Firebase...");
    
    try {
        const firebaseCategories = await loadCategoriesFromFirebase();
        
        if (firebaseCategories.length > 0) {
            localStorage.setItem('chickenway_categories', JSON.stringify(firebaseCategories));
            
            if (typeof window.categories !== 'undefined') {
                window.categories = firebaseCategories;
            }
            
            console.log(`📦 ${firebaseCategories.length} catégories fusionnées depuis Firebase`);
            return true;
        } else {
            await syncAllCategoriesToFirebase();
            return true;
        }
    } catch (error) {
        console.error("Erreur fusion catégories:", error);
        return false;
    }
}

// ========= FONCTIONS POUR LE MENU EN LIGNE (AVEC CACHING) =========
let cachedProducts = null;
let lastProductsFetch = 0;
const CACHE_DURATION = 60000; // 1 minute

async function getProductsForOnlineMenu(forceRefresh = false) {
    const now = Date.now();
    
    if (!forceRefresh && cachedProducts && (now - lastProductsFetch) < CACHE_DURATION) {
        console.log("📦 Utilisation du cache produits (menu en ligne)");
        return cachedProducts;
    }
    
    try {
        const products = await loadProductsFromFirebase();
        
        if (products.length > 0) {
            cachedProducts = products;
            lastProductsFetch = now;
            console.log(`✅ ${products.length} produits pour le menu en ligne`);
        }
        
        return products;
    } catch (error) {
        console.error("Erreur chargement produits menu:", error);
        return [];
    }
}

async function getCategoriesForOnlineMenu() {
    try {
        const categories = await loadCategoriesFromFirebase();
        console.log(`✅ ${categories.length} catégories pour le menu en ligne`);
        return categories;
    } catch (error) {
        console.error("Erreur chargement catégories menu:", error);
        return [];
    }
}

// ========= ÉCOUTE EN TEMPS RÉEL DES PRODUITS =========
let unsubscribeProductsListener = null;

function listenToProducts(callback) {
    if (!window.db) {
        console.error("Firestore non disponible pour l'écoute des produits");
        return null;
    }
    
    if (unsubscribeProductsListener) {
        unsubscribeProductsListener();
        unsubscribeProductsListener = null;
    }
    
    unsubscribeProductsListener = window.db.collection(PRODUCTS_COLLECTION)
        .onSnapshot((snapshot) => {
            const products = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.id && !data._init) {
                    products.push(data);
                }
            });
            
            products.sort((a, b) => a.id - b.id);
            
            if (callback) callback(products);
            console.log(`📢 ${products.length} produits chargés (temps réel)`);
        }, (error) => {
            console.error("Erreur écoute produits Firebase:", error);
        });
    
    return unsubscribeProductsListener;
}

function startProductsListener() {
    if (!window.db) {
        console.error("Firestore non disponible - écoute produits impossible");
        return;
    }
    
    listenToProducts((products) => {
        if (products.length > 0) {
            localStorage.setItem('chickenway_produits', JSON.stringify(products));
            
            if (typeof window.produits !== 'undefined') {
                window.produits = products;
            }
            
            if (typeof window.renderProductsTable === 'function') {
                window.renderProductsTable();
            }
            if (typeof window.loadPOSCategories === 'function') {
                window.loadPOSCategories();
            }
            if (typeof window.chargerProduitsEnLigne === 'function') {
                window.chargerProduitsEnLigne();
            }
            if (typeof window.updateStats === 'function') {
                window.updateStats();
            }
        }
    });
}

// ========= INITIALISATION AMÉLIORÉE =========
async function initFirebaseComplete() {
    console.log("🔄 Initialisation Firebase complète...");
    
    if (typeof firebase === 'undefined') {
        console.warn("⚠️ Firebase SDK non chargé, nouvelle tentative dans 1s...");
        setTimeout(initFirebaseComplete, 1000);
        return;
    }
    
    try {
        if (firebase.apps.length === 0) {
            firebase.initializeApp(window.firebaseConfig);
            console.log("🔥 Firebase initialisé tardivement");
        }
        
        if (!window.db) {
            window.db = firebase.firestore();
            console.log("📁 Firestore initialisé");
        }
        
        await ensureCollectionsExist();
        
        const isConnected = await testFirebaseConnection();
        if (isConnected) {
            console.log("✅ Firebase connecté et opérationnel !");
        }
        
        // Fusionner les données
        await mergeProductsFromFirebase();
        await mergeCategoriesFromFirebase();
        
        // Démarrer l'écoute en temps réel
        startProductsListener();
        demarrerEcoutesCommandesEnLigne();
        
        console.log("✅ Firebase initialisé avec succès - Écoute temps réel activée !");
        
    } catch (error) {
        console.error("❌ Erreur initialisation Firebase:", error);
    }
}

// Exposer toutes les nouvelles fonctions
window.loadProductsFromFirebase = loadProductsFromFirebase;
window.saveProductToFirebase = saveProductToFirebase;
window.deleteProductFromFirebase = deleteProductFromFirebase;
window.syncAllDataToFirebase = syncAllDataToFirebase;
window.mergeProductsFromFirebase = mergeProductsFromFirebase;
window.loadCategoriesFromFirebase = loadCategoriesFromFirebase;
window.saveCategoryToFirebase = saveCategoryToFirebase;
window.deleteCategoryFromFirebase = deleteCategoryFromFirebase;
window.syncAllCategoriesToFirebase = syncAllCategoriesToFirebase;
window.mergeCategoriesFromFirebase = mergeCategoriesFromFirebase;
window.getProductsForOnlineMenu = getProductsForOnlineMenu;
window.getCategoriesForOnlineMenu = getCategoriesForOnlineMenu;
window.listenToProducts = listenToProducts;
window.startProductsListener = startProductsListener;

// Remplacer l'initialisation
window.initFirebase = initFirebaseComplete;

// Démarrer l'initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebaseComplete);
} else {
    initFirebaseComplete();
}

console.log("✅ firebase-config.js mis à jour - Synchronisation complète activée !");
