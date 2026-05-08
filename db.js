// db.js - Gestion de la base de données IndexedDB pour Chicken Way

let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ChickenWayDB", 3);

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      
      // Création des object stores s'ils n'existent pas
      if (!db.objectStoreNames.contains("users")) {
        const userStore = db.createObjectStore("users", { keyPath: "username" });
        userStore.createIndex("role", "role", { unique: false });
      }
      
      if (!db.objectStoreNames.contains("orders")) {
        const orderStore = db.createObjectStore("orders", { keyPath: "id", autoIncrement: true });
        orderStore.createIndex("date", "date", { unique: false });
        orderStore.createIndex("user", "user", { unique: false });
      }
      
      if (!db.objectStoreNames.contains("ventes")) {
        const venteStore = db.createObjectStore("ventes", { keyPath: "id", autoIncrement: true });
        venteStore.createIndex("date", "date", { unique: false });
        venteStore.createIndex("client", "client", { unique: false });
      }
      
      if (!db.objectStoreNames.contains("categories")) {
        const categoryStore = db.createObjectStore("categories", { keyPath: "id", autoIncrement: true });
        categoryStore.createIndex("nom", "nom", { unique: false });
      }
      
      if (!db.objectStoreNames.contains("produits")) {
        const productStore = db.createObjectStore("produits", { keyPath: "id", autoIncrement: true });
        productStore.createIndex("nom", "nom", { unique: false });
        productStore.createIndex("categorieId", "categorieId", { unique: false });
        productStore.createIndex("disponibilite", "disponibilite", { unique: false });
      }
      
      if (!db.objectStoreNames.contains("clients")) {
        const clientStore = db.createObjectStore("clients", { keyPath: "id", autoIncrement: true });
        clientStore.createIndex("nom", "nom", { unique: false });
        clientStore.createIndex("email", "email", { unique: false });
        clientStore.createIndex("telephone", "telephone", { unique: false });
      }
      
      if (!db.objectStoreNames.contains("fournisseurs")) {
        const fournisseurStore = db.createObjectStore("fournisseurs", { keyPath: "id", autoIncrement: true });
        fournisseurStore.createIndex("nom", "nom", { unique: false });
        fournisseurStore.createIndex("entreprise", "entreprise", { unique: false });
      }
      
      if (!db.objectStoreNames.contains("depenses")) {
        const depenseStore = db.createObjectStore("depenses", { keyPath: "id", autoIncrement: true });
        depenseStore.createIndex("date", "date", { unique: false });
        depenseStore.createIndex("categorie", "categorie", { unique: false });
      }
      
      if (!db.objectStoreNames.contains("credits")) {
        const creditStore = db.createObjectStore("credits", { keyPath: "id", autoIncrement: true });
        creditStore.createIndex("client", "client", { unique: false });
        creditStore.createIndex("statut", "statut", { unique: false });
        creditStore.createIndex("dateCreation", "dateCreation", { unique: false });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      console.log("✅ Base de données IndexedDB initialisée avec succès");
      resolve();
    };

    request.onerror = (e) => {
      console.error("❌ Erreur d'ouverture de la base de données:", e.target.error);
      reject("DB error: " + e.target.error);
    };
  });
}

// ========= UTILITAIRES =========
function waitForDB() {
  return new Promise((resolve) => {
    if (db) {
      resolve();
    } else {
      const interval = setInterval(() => {
        if (db) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    }
  });
}

async function clearAllStores() {
  await waitForDB();
  const stores = ["users", "orders", "ventes", "categories", "produits", "clients", "fournisseurs", "depenses", "credits"];
  for (const store of stores) {
    if (db.objectStoreNames.contains(store)) {
      const tx = db.transaction(store, "readwrite");
      const req = tx.objectStore(store).clear();
      await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve();
        req.onerror = () => reject();
      });
    }
  }
  console.log("🗑️ Tous les stores vidés");
}

// ========= USERS =========
async function addUser(user) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readwrite");
    const req = tx.objectStore("users").add(user);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erreur lors de l'ajout de l'utilisateur");
  });
}

async function getUser(username) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readonly");
    const req = tx.objectStore("users").get(username);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erreur lors de la récupération de l'utilisateur");
  });
}

async function getAllUsers() {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readonly");
    const req = tx.objectStore("users").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des utilisateurs");
  });
}

async function updateUser(user) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readwrite");
    const req = tx.objectStore("users").put(user);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la mise à jour de l'utilisateur");
  });
}

async function deleteUser(username) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("users", "readwrite");
    const req = tx.objectStore("users").delete(username);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la suppression de l'utilisateur");
  });
}

// ========= ORDERS =========
async function addOrder(order) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("orders", "readwrite");
    const req = tx.objectStore("orders").add(order);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erreur lors de l'ajout de la commande");
  });
}

async function getAllOrders() {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("orders", "readonly");
    const req = tx.objectStore("orders").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des commandes");
  });
}

async function getOrdersByUser(username) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("orders", "readonly");
    const index = tx.objectStore("orders").index("user");
    const req = index.getAll(username);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des commandes par utilisateur");
  });
}

async function updateOrder(order) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("orders", "readwrite");
    const req = tx.objectStore("orders").put(order);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la mise à jour de la commande");
  });
}

async function deleteOrder(id) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("orders", "readwrite");
    const req = tx.objectStore("orders").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la suppression de la commande");
  });
}

// ========= VENTES =========
async function addVente(vente) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("ventes", "readwrite");
    const req = tx.objectStore("ventes").add(vente);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erreur lors de l'ajout de la vente");
  });
}

async function getAllVentes() {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("ventes", "readonly");
    const req = tx.objectStore("ventes").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des ventes");
  });
}

async function getVentesByDate(date) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("ventes", "readonly");
    const index = tx.objectStore("ventes").index("date");
    const req = index.getAll(date);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des ventes par date");
  });
}

async function updateVente(vente) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("ventes", "readwrite");
    const req = tx.objectStore("ventes").put(vente);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la mise à jour de la vente");
  });
}

async function deleteVente(id) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("ventes", "readwrite");
    const req = tx.objectStore("ventes").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la suppression de la vente");
  });
}

// ========= CATEGORIES =========
async function addCategory(category) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("categories", "readwrite");
    const req = tx.objectStore("categories").add(category);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erreur lors de l'ajout de la catégorie");
  });
}

async function getAllCategories() {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("categories", "readonly");
    const req = tx.objectStore("categories").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des catégories");
  });
}

async function updateCategory(category) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("categories", "readwrite");
    const req = tx.objectStore("categories").put(category);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la mise à jour de la catégorie");
  });
}

async function deleteCategory(id) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("categories", "readwrite");
    const req = tx.objectStore("categories").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la suppression de la catégorie");
  });
}

// ========= PRODUITS (CRUD COMPLET) =========
async function addProduct(product) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("produits", "readwrite");
    const req = tx.objectStore("produits").add(product);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erreur lors de l'ajout du produit");
  });
}

async function getAllProducts() {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("produits", "readonly");
    const req = tx.objectStore("produits").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des produits");
  });
}

async function getProductById(id) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("produits", "readonly");
    const req = tx.objectStore("produits").get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erreur lors de la récupération du produit");
  });
}

async function getProductsByCategory(categorieId) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("produits", "readonly");
    const index = tx.objectStore("produits").index("categorieId");
    const req = index.getAll(categorieId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des produits par catégorie");
  });
}

async function getProductsByDisponibilite(disponibilite) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("produits", "readonly");
    const index = tx.objectStore("produits").index("disponibilite");
    const req = index.getAll(disponibilite);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des produits par disponibilité");
  });
}

async function updateProduct(product) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("produits", "readwrite");
    const req = tx.objectStore("produits").put(product);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la mise à jour du produit");
  });
}

async function deleteProduct(id) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("produits", "readwrite");
    const req = tx.objectStore("produits").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la suppression du produit");
  });
}

async function updateProductStock(id, quantity) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("produits", "readwrite");
    const store = tx.objectStore("produits");
    const req = store.get(id);
    req.onsuccess = () => {
      const product = req.result;
      if (product) {
        product.stock = quantity;
        const updateReq = store.put(product);
        updateReq.onsuccess = () => resolve();
        updateReq.onerror = () => reject("Erreur lors de la mise à jour du stock");
      } else {
        reject("Produit non trouvé");
      }
    };
    req.onerror = () => reject("Erreur lors de la récupération du produit");
  });
}

async function incrementProductSales(id, quantity = 1) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("produits", "readwrite");
    const store = tx.objectStore("produits");
    const req = store.get(id);
    req.onsuccess = () => {
      const product = req.result;
      if (product) {
        product.quantiteVendue = (product.quantiteVendue || 0) + quantity;
        product.chiffreAffaire = (product.chiffreAffaire || 0) + (product.prixVente * quantity);
        if (product.stock) product.stock -= quantity;
        const updateReq = store.put(product);
        updateReq.onsuccess = () => resolve();
        updateReq.onerror = () => reject("Erreur lors de la mise à jour des ventes");
      } else {
        reject("Produit non trouvé");
      }
    };
    req.onerror = () => reject("Erreur lors de la récupération du produit");
  });
}

// ========= CLIENTS =========
async function addClient(client) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("clients", "readwrite");
    const req = tx.objectStore("clients").add(client);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erreur lors de l'ajout du client");
  });
}

async function getAllClients() {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("clients", "readonly");
    const req = tx.objectStore("clients").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des clients");
  });
}

async function getClientById(id) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("clients", "readonly");
    const req = tx.objectStore("clients").get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erreur lors de la récupération du client");
  });
}

async function getClientByTelephone(telephone) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("clients", "readonly");
    const index = tx.objectStore("clients").index("telephone");
    const req = index.get(telephone);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erreur lors de la récupération du client par téléphone");
  });
}

async function updateClient(client) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("clients", "readwrite");
    const req = tx.objectStore("clients").put(client);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la mise à jour du client");
  });
}

async function deleteClient(id) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("clients", "readwrite");
    const req = tx.objectStore("clients").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la suppression du client");
  });
}

// ========= FOURNISSEURS =========
async function addFournisseur(fournisseur) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("fournisseurs", "readwrite");
    const req = tx.objectStore("fournisseurs").add(fournisseur);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erreur lors de l'ajout du fournisseur");
  });
}

async function getAllFournisseurs() {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("fournisseurs", "readonly");
    const req = tx.objectStore("fournisseurs").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des fournisseurs");
  });
}

async function getFournisseurById(id) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("fournisseurs", "readonly");
    const req = tx.objectStore("fournisseurs").get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erreur lors de la récupération du fournisseur");
  });
}

async function updateFournisseur(fournisseur) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("fournisseurs", "readwrite");
    const req = tx.objectStore("fournisseurs").put(fournisseur);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la mise à jour du fournisseur");
  });
}

async function deleteFournisseur(id) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("fournisseurs", "readwrite");
    const req = tx.objectStore("fournisseurs").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la suppression du fournisseur");
  });
}

// ========= DEPENSES =========
async function addDepense(depense) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("depenses", "readwrite");
    const req = tx.objectStore("depenses").add(depense);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erreur lors de l'ajout de la dépense");
  });
}

async function getAllDepenses() {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("depenses", "readonly");
    const req = tx.objectStore("depenses").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des dépenses");
  });
}

async function getDepensesByDate(date) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("depenses", "readonly");
    const index = tx.objectStore("depenses").index("date");
    const req = index.getAll(date);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des dépenses par date");
  });
}

async function getDepensesByCategorie(categorie) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("depenses", "readonly");
    const index = tx.objectStore("depenses").index("categorie");
    const req = index.getAll(categorie);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des dépenses par catégorie");
  });
}

async function updateDepense(depense) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("depenses", "readwrite");
    const req = tx.objectStore("depenses").put(depense);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la mise à jour de la dépense");
  });
}

async function deleteDepense(id) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("depenses", "readwrite");
    const req = tx.objectStore("depenses").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la suppression de la dépense");
  });
}

// ========= CREDITS =========
async function addCredit(credit) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("credits", "readwrite");
    const req = tx.objectStore("credits").add(credit);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erreur lors de l'ajout du crédit");
  });
}

async function getAllCredits() {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("credits", "readonly");
    const req = tx.objectStore("credits").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des crédits");
  });
}

async function getCreditById(id) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("credits", "readonly");
    const req = tx.objectStore("credits").get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject("Erreur lors de la récupération du crédit");
  });
}

async function updateCredit(credit) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("credits", "readwrite");
    const req = tx.objectStore("credits").put(credit);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la mise à jour du crédit");
  });
}

async function deleteCredit(id) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("credits", "readwrite");
    const req = tx.objectStore("credits").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la suppression du crédit");
  });
}

async function getCreditsByClient(clientName) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("credits", "readonly");
    const index = tx.objectStore("credits").index("client");
    const req = index.getAll(clientName);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des crédits par client");
  });
}

async function getCreditsByStatut(statut) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("credits", "readonly");
    const index = tx.objectStore("credits").index("statut");
    const req = index.getAll(statut);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject("Erreur lors de la récupération des crédits par statut");
  });
}

// ========= FONCTIONS STATISTIQUES =========
async function getTotalSales() {
  const ventes = await getAllVentes();
  return ventes.reduce((total, vente) => total + vente.montant, 0);
}

async function getTotalProfit() {
  const produits = await getAllProducts();
  return produits.reduce((total, produit) => total + ((produit.prixVente - produit.prixAchat) * (produit.quantiteVendue || 0)), 0);
}

async function getTopProducts(limit = 5) {
  const produits = await getAllProducts();
  return produits
    .filter(p => p.quantiteVendue > 0)
    .sort((a, b) => (b.quantiteVendue || 0) - (a.quantiteVendue || 0))
    .slice(0, limit);
}

async function getTotalClients() {
  const clients = await getAllClients();
  return clients.length;
}

async function getTotalFournisseurs() {
  const fournisseurs = await getAllFournisseurs();
  return fournisseurs.length;
}

async function getTotalCreditsEnAttente() {
  const credits = await getAllCredits();
  return credits.filter(c => c.statut === 'en attente').reduce((total, c) => total + (c.montant - (c.paye || 0)), 0);
}

// ========= FONCTIONS DE NETTOYAGE =========
async function clearAllData() {
  await clearAllStores();
  console.log("🗑️ Toutes les données IndexedDB ont été effacées");
}

async function getDatabaseSize() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    console.log(`💾 Espace utilisé: ${(estimate.usage / 1024 / 1024).toFixed(2)} MB`);
    return estimate.usage;
  }
  return null;
}

// ========= SYNC VERS LOCALSTORAGE =========
async function syncAllDataToLocalStorage() {
  const categories = await getAllCategories();
  const produits = await getAllProducts();
  const clients = await getAllClients();
  const fournisseurs = await getAllFournisseurs();
  const ventes = await getAllVentes();
  const depenses = await getAllDepenses();
  const credits = await getAllCredits();
  const users = await getAllUsers();
  const orders = await getAllOrders();
  
  localStorage.setItem('chickenway_categories', JSON.stringify(categories));
  localStorage.setItem('chickenway_produits', JSON.stringify(produits));
  localStorage.setItem('chickenway_clients', JSON.stringify(clients));
  localStorage.setItem('chickenway_fournisseurs', JSON.stringify(fournisseurs));
  localStorage.setItem('chickenway_ventes', JSON.stringify(ventes));
  localStorage.setItem('chickenway_depenses', JSON.stringify(depenses));
  localStorage.setItem('chickenway_credits', JSON.stringify(credits));
  localStorage.setItem('chickenway_users', JSON.stringify(users));
  localStorage.setItem('chickenway_orders', JSON.stringify(orders));
  
  console.log("💾 Données synchronisées vers localStorage");
}

// ========= EXPORT DES FONCTIONS =========
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initDB,
    waitForDB,
    clearAllStores,
    clearAllData,
    getDatabaseSize,
    syncAllDataToLocalStorage,
    
    // Users
    addUser, getUser, getAllUsers, updateUser, deleteUser,
    
    // Orders
    addOrder, getAllOrders, getOrdersByUser, updateOrder, deleteOrder,
    
    // Ventes
    addVente, getAllVentes, getVentesByDate, updateVente, deleteVente,
    
    // Categories
    addCategory, getAllCategories, updateCategory, deleteCategory,
    
    // Produits
    addProduct, getAllProducts, getProductById, getProductsByCategory, getProductsByDisponibilite, 
    updateProduct, deleteProduct, updateProductStock, incrementProductSales,
    
    // Clients
    addClient, getAllClients, getClientById, getClientByTelephone, updateClient, deleteClient,
    
    // Fournisseurs
    addFournisseur, getAllFournisseurs, getFournisseurById, updateFournisseur, deleteFournisseur,
    
    // Depenses
    addDepense, getAllDepenses, getDepensesByDate, getDepensesByCategorie, updateDepense, deleteDepense,
    
    // Credits
    addCredit, getAllCredits, getCreditById, updateCredit, deleteCredit, getCreditsByClient, getCreditsByStatut,
    
    // Statistiques
    getTotalSales, getTotalProfit, getTopProducts, getTotalClients, getTotalFournisseurs, getTotalCreditsEnAttente
  };
}

console.log("✅ db.js chargé - IndexedDB prêt à l'emploi");
