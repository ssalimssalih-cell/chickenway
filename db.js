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
      }
      
      if (!db.objectStoreNames.contains("fournisseurs")) {
        const fournisseurStore = db.createObjectStore("fournisseurs", { keyPath: "id", autoIncrement: true });
        fournisseurStore.createIndex("nom", "nom", { unique: false });
      }
      
      if (!db.objectStoreNames.contains("depenses")) {
        const depenseStore = db.createObjectStore("depenses", { keyPath: "id", autoIncrement: true });
        depenseStore.createIndex("date", "date", { unique: false });
      }
      
      if (!db.objectStoreNames.contains("credits")) {
        const creditStore = db.createObjectStore("credits", { keyPath: "id", autoIncrement: true });
        creditStore.createIndex("client", "client", { unique: false });
        creditStore.createIndex("statut", "statut", { unique: false });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      console.log("Base de données IndexedDB initialisée avec succès");
      resolve();
    };

    request.onerror = (e) => {
      console.error("Erreur d'ouverture de la base de données:", e.target.error);
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

async function updateClient(client) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("clients", "readwrite");
    const req = tx.objectStore("clients").put(client);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la mise à jour du client");
  });
}

function deleteClient(id) {
  if (confirm("Supprimer ce client ? Cette action est irréversible.")) {
    clients = clients.filter(c => String(c.id) !== String(id));
    saveClientsToLocal();
    renderClientsTable();
    updateStats();
  }
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

async function updateFournisseur(fournisseur) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("fournisseurs", "readwrite");
    const req = tx.objectStore("fournisseurs").put(fournisseur);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la mise à jour du fournisseur");
  });
}

function deleteFournisseur(id) {
  if (confirm("Supprimer ce fournisseur ? Cette action est irréversible.")) {
    fournisseurs = fournisseurs.filter(f => String(f.id) !== String(id));
    saveFournisseursToLocal();
    renderFournisseursTable();
  }
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

async function updateDepense(depense) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("depenses", "readwrite");
    const req = tx.objectStore("depenses").put(depense);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la mise à jour de la dépense");
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

async function updateCredit(credit) {
  await waitForDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("credits", "readwrite");
    const req = tx.objectStore("credits").put(credit);
    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erreur lors de la mise à jour du crédit");
  });
}

function deleteCredit(id) {
  if (confirm("Supprimer ce crédit ?")) {
    credits = credits.filter(c => String(c.id) !== String(id));
    saveCreditsToLocal();
    renderCreditsTable();
  }
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

// Export des fonctions si nécessaire (pour module)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initDB,
    addUser, getUser, getAllUsers, updateUser, deleteUser,
    addOrder, getAllOrders, getOrdersByUser,
    addVente, getAllVentes, getVentesByDate,
    addCategory, getAllCategories, updateCategory, deleteCategory,
    addProduct, getAllProducts, getProductById, getProductsByCategory, updateProduct, deleteProduct, updateProductStock, incrementProductSales,
    addClient, getAllClients, updateClient, deleteClient,
    addFournisseur, getAllFournisseurs, updateFournisseur, deleteFournisseur,
    addDepense, getAllDepenses, updateDepense, deleteDepense,
    addCredit, getAllCredits, updateCredit, deleteCredit, getCreditsByClient,
    getTotalSales, getTotalProfit, getTopProducts
  };
}