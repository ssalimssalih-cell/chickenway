// ========= STORAGE & GLOBAL =========
let currentUser = null;
let currentUserRole = null;
let cart = [];

let users = [];
let orders = [];
let ventes = [];
let categories = [];
let produits = [];
let clients = [];
let fournisseurs = [];
let depenses = [];
let credits = [];

// Variables pour les images
let tempProductImageBase64 = null;
let currentProductImageMode = 'url';

let tempCategoryIconBase64 = null;
let currentCategoryIconMode = 'emoji';
let tempCategoryIconValue = '🍔';

// Variables pour le tri des colonnes
let sortColumnVentes = 'date';
let sortDirectionVentes = 'desc';

let sortColumnCredits = 'date';
let sortDirectionCredits = 'desc';

let sortColumnDepenses = 'date';
let sortDirectionDepenses = 'desc';

// ========= COMMANDE EN LIGNE =========
let onlineCart = [];
let currentOnlineCategory = 'all';
let onlineProducts = [];
let onlineCategories = [];

// ========= LOCALSTORAGE (FALLBACK) =========
function saveUsersToLocal() { localStorage.setItem('chickenway_users', JSON.stringify(users)); }
function saveOrdersToLocal() { localStorage.setItem('chickenway_orders', JSON.stringify(orders)); }
function saveVentesToLocal() { localStorage.setItem('chickenway_ventes', JSON.stringify(ventes)); }
function saveCategoriesToLocal() { localStorage.setItem('chickenway_categories', JSON.stringify(categories)); }
function saveProduitsToLocal() { localStorage.setItem('chickenway_produits', JSON.stringify(produits)); }
function saveClientsToLocal() { localStorage.setItem('chickenway_clients', JSON.stringify(clients)); }
function saveFournisseursToLocal() { localStorage.setItem('chickenway_fournisseurs', JSON.stringify(fournisseurs)); }
function saveDepensesToLocal() { localStorage.setItem('chickenway_depenses', JSON.stringify(depenses)); }
function saveCreditsToLocal() { localStorage.setItem('chickenway_credits', JSON.stringify(credits)); }

function loadAllData() {
  users = JSON.parse(localStorage.getItem('chickenway_users')) || [];
  orders = JSON.parse(localStorage.getItem('chickenway_orders')) || [];
  ventes = JSON.parse(localStorage.getItem('chickenway_ventes')) || [];
  categories = JSON.parse(localStorage.getItem('chickenway_categories')) || [];
  produits = JSON.parse(localStorage.getItem('chickenway_produits')) || [];
  clients = JSON.parse(localStorage.getItem('chickenway_clients')) || [];
  fournisseurs = JSON.parse(localStorage.getItem('chickenway_fournisseurs')) || [];
  depenses = JSON.parse(localStorage.getItem('chickenway_depenses')) || [];
  credits = JSON.parse(localStorage.getItem('chickenway_credits')) || [];
}

// ========= SYNCHRONISATION INDEXEDDB =========
async function sauvegarderDansIndexedDB() {
    if (typeof addUser !== 'undefined') {
        try {
            if (typeof clearAllStores === 'function') await clearAllStores();
            
            for (const user of users) if (typeof addUser === 'function') await addUser(user);
            for (const cat of categories) if (typeof addCategory === 'function') await addCategory(cat);
            for (const prod of produits) if (typeof addProduct === 'function') await addProduct(prod);
            for (const client of clients) if (typeof addClient === 'function') await addClient(client);
            for (const four of fournisseurs) if (typeof addFournisseur === 'function') await addFournisseur(four);
            for (const vente of ventes) if (typeof addVente === 'function') await addVente(vente);
            for (const dep of depenses) if (typeof addDepense === 'function') await addDepense(dep);
            for (const credit of credits) if (typeof addCredit === 'function') await addCredit(credit);
            for (const order of orders) if (typeof addOrder === 'function') await addOrder(order);
            
            console.log("✅ Données synchronisées vers IndexedDB");
        } catch(e) { console.error("Erreur synchro IndexedDB:", e); }
    }
}

async function chargerDepuisIndexedDB() {
    if (typeof getAllCategories !== 'undefined') {
        try {
            const categoriesDB = await getAllCategories();
            const produitsDB = await getAllProducts();
            const clientsDB = await getAllClients();
            const fournisseursDB = await getAllFournisseurs();
            const ventesDB = await getAllVentes();
            const depensesDB = await getAllDepenses();
            const creditsDB = await getAllCredits();
            const ordersDB = await getAllOrders();
            const usersDB = await getAllUsers();
            
            if (categoriesDB.length > 0) categories = categoriesDB;
            if (produitsDB.length > 0) produits = produitsDB;
            if (clientsDB.length > 0) clients = clientsDB;
            if (fournisseursDB.length > 0) fournisseurs = fournisseursDB;
            if (ventesDB.length > 0) ventes = ventesDB;
            if (depensesDB.length > 0) depenses = depensesDB;
            if (creditsDB.length > 0) credits = creditsDB;
            if (ordersDB.length > 0) orders = ordersDB;
            if (usersDB.length > 0) users = usersDB;
            
            sauvegarderDansLocalStorage();
            console.log("✅ Données chargées depuis IndexedDB");
            return true;
        } catch(e) { console.error("Erreur chargement IndexedDB:", e); return false; }
    }
    return false;
}

function sauvegarderDansLocalStorage() {
    saveUsersToLocal();
    saveCategoriesToLocal();
    saveProduitsToLocal();
    saveClientsToLocal();
    saveFournisseursToLocal();
    saveVentesToLocal();
    saveDepensesToLocal();
    saveCreditsToLocal();
    saveOrdersToLocal();
    console.log("💾 Données sauvegardées dans localStorage");
}

async function forceSaveAllData() {
    sauvegarderDansLocalStorage();
    await sauvegarderDansIndexedDB();
    console.log("💾 Force save - Données sauvegardées");
}

// ========= AUTH =========
function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if(!username || !password) { alert("Veuillez remplir tous les champs"); return; }
  const found = users.find(u => u.username === username && u.password === password);
  if(found) {
    currentUser = username;
    currentUserRole = found.role;
    window.currentUser = username;
    document.getElementById('currentUserDisplay').innerHTML = `${username} (${found.role === 'admin' ? 'Admin' : 'Caissier'})`;
    document.getElementById('userRoleDisplay').innerHTML = found.role === 'admin' ? 'Administrateur' : 'Caissier';
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    showPage('pos');
    refreshCartDisplay();
    renderAllTables();
    mettreAJourBadgeCommandes();
  } else { alert("Identifiants incorrects"); }
}

function register() {
  const newUser = document.getElementById('newUser').value.trim();
  const newRole = document.getElementById('newRole').value;
  const newPass = document.getElementById('newPass').value;
  const confirmPass = document.getElementById('confirmPass').value;
  if(!newUser || !newPass) { alert("Remplissez tous les champs"); return; }
  if(newPass !== confirmPass) { alert("Mots de passe différents"); return; }
  if(users.find(u => u.username === newUser)) { alert("Nom déjà utilisé"); return; }
  users.push({ username: newUser, password: newPass, role: newRole, dateCreation: new Date().toLocaleString() });
  forceSaveAllData();
  alert("Compte créé !");
  showLogin();
}

function showRegister() { document.getElementById('loginPage').classList.add('hidden'); document.getElementById('registerPage').classList.remove('hidden'); }
function showLogin() { document.getElementById('registerPage').classList.add('hidden'); document.getElementById('loginPage').classList.remove('hidden'); }
function logout() { currentUser = null; window.currentUser = null; currentUserRole = null; cart = []; document.getElementById('dashboard').classList.add('hidden'); document.getElementById('loginPage').classList.remove('hidden'); }

// ========= NAVIGATION =========
function showPage(page) {
  ['posPage','categoriesPage','produitsPage','clientsPage','fournisseursPage','ventesPage','creditsPage','depensesPage','statsPage'].forEach(p => {
    const el = document.getElementById(p); if(el) el.classList.add('hidden');
  });
  const map = { 'pos':'posPage','categories':'categoriesPage','produits':'produitsPage','clients':'clientsPage','fournisseurs':'fournisseursPage','ventes':'ventesPage','credits':'creditsPage','depenses':'depensesPage','stats':'statsPage' };
  const target = document.getElementById(map[page]); if(target) target.classList.remove('hidden');
  if(page === 'ventes') { renderVentesHistory(); updateSortIndicatorsVentes(); }
  if(page === 'stats') updateStats();
  if(page === 'categories') renderCategoriesTable();
  if(page === 'produits') renderProductsTable();
  if(page === 'clients') renderClientsTable();
  if(page === 'fournisseurs') renderFournisseursTable();
  if(page === 'depenses') { renderDepensesTable(); updateSortIndicatorsDepenses(); }
  if(page === 'credits') { renderCreditsTable(); updateSortIndicatorsCredits(); }
  if(page === 'pos') loadPOSCategories();
  updateActiveNav(page);
}

function updateActiveNav(page) { document.querySelectorAll('.nav-item').forEach(item => { item.classList.remove('active'); if(item.dataset.page === page) item.classList.add('active'); }); }
function renderAllTables() { renderCategoriesTable(); renderProductsTable(); renderClientsTable(); renderFournisseursTable(); renderDepensesTable(); renderCreditsTable(); renderVentesHistory(); updateStats(); }

// ========= POS =========
function loadPOSCategories() {
  const container = document.getElementById('posCategoriesTabs');
  if(!container) return;
  if(categories.length === 0) { 
    container.innerHTML = '<div class="cat-btn active">Aucune catégorie</div>'; 
    document.getElementById('posProductsGrid').innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">Ajoutez des catégories et produits</div>'; 
    return; 
  }
  container.innerHTML = categories.map((cat, i) => {
    const iconDisplay = displayCategoryIcon(cat.icon);
    return `<button class="cat-btn ${i===0?'active':''}" data-cat-id="${cat.id}" onclick="filterPOSProducts(${cat.id})">
      <span style="font-size:1.5rem;">${iconDisplay}</span> ${escapeHtml(cat.nom)}
    </button>`;
  }).join('');
  if(categories.length > 0) filterPOSProducts(categories[0].id);
}

function filterPOSProducts(categoryId) {
  document.querySelectorAll('.cat-btn').forEach(btn => { 
    btn.classList.remove('active'); 
    if(parseInt(btn.dataset.catId) === categoryId) btn.classList.add('active'); 
  });
  const filtered = produits.filter(p => p.categorieId === categoryId && p.disponibilite === 'disponible');
  const container = document.getElementById('posProductsGrid');
  if(filtered.length === 0) { 
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">Aucun produit disponible dans cette catégorie</div>'; 
    return; 
  }
  container.innerHTML = filtered.map(p => {
    const prixAffiche = p.prixPromo > 0 ? p.prixPromo : p.prixVente;
    return `
    <div class="product-card">
      <div class="product-card-image" onclick="openProductOptions('${escapeHtml(p.nom)}', ${prixAffiche})">
        ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.nom)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
        <div class="no-image" style="${p.image ? 'display:none;' : 'display:flex;'} align-items:center; justify-content:center; width:100%; height:100%; font-size:3rem;">🍗</div>
      </div>
      <div class="product-card-body">
        <div class="product-title">${escapeHtml(p.nom)}</div>
        ${p.prixPromo > 0 ? `<div style="text-decoration:line-through;color:#94a3b8;font-size:0.75rem;">${p.prixVente.toFixed(2)} MAD</div><div class="product-price" style="color:#ef4444;">${p.prixPromo.toFixed(2)} MAD</div>` : `<div class="product-price">${p.prixVente.toFixed(2)} MAD</div>`}
        <button class="product-add" onclick="event.stopPropagation(); openProductOptions('${escapeHtml(p.nom)}', ${prixAffiche})">
          <i class="fas fa-plus-circle"></i> Ajouter
        </button>
      </div>
    </div>`;
  }).join('');
}

// ========= OPTIONS PRODUIT =========
function openProductOptions(name, price) {
  document.getElementById('productOptionsModal').classList.remove('hidden');
  document.getElementById('selectedProductName').value = name;
  document.getElementById('selectedProductPrice').value = price;
  document.getElementById('optionsProductName').innerText = name;
  document.getElementById('optionsProductPrice').innerText = price.toFixed(2) + ' MAD';
  
  document.querySelectorAll('#saucesAvoidOptions input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('#garnituresAvoidOptions input[type="checkbox"]').forEach(cb => cb.checked = false);
  
  const selNormal = document.querySelector('input[name="degreSel"][value="Normal"]');
  if(selNormal) selNormal.checked = true;
  const epicesNormal = document.querySelector('input[name="degreEpices"][value="Normal"]');
  if(epicesNormal) epicesNormal.checked = true;
  
  const summary = document.getElementById('optionsSummary');
  if(summary) summary.style.display = 'none';
  const summaryText = document.getElementById('optionsSummaryText');
  if(summaryText) summaryText.innerHTML = '';
}

function closeProductOptionsModal() {
  document.getElementById('productOptionsModal').classList.add('hidden');
}

function updateOptionsSummary() {
  const saucesEvitees = [];
  const garnituresEvitees = [];
  
  document.querySelectorAll('#saucesAvoidOptions input[type="checkbox"]:checked').forEach(cb => saucesEvitees.push(cb.value));
  document.querySelectorAll('#garnituresAvoidOptions input[type="checkbox"]:checked').forEach(cb => garnituresEvitees.push(cb.value));
  
  const degreSel = document.querySelector('input[name="degreSel"]:checked')?.value || 'Normal';
  const degreEpices = document.querySelector('input[name="degreEpices"]:checked')?.value || 'Normal';
  
  const summary = document.getElementById('optionsSummary');
  const summaryText = document.getElementById('optionsSummaryText');
  
  let text = '';
  if(saucesEvitees.length > 0) text += `<strong>❌ Sans sauces :</strong> ${saucesEvitees.join(', ')}<br>`;
  if(garnituresEvitees.length > 0) text += `<strong>❌ Sans garnitures :</strong> ${garnituresEvitees.join(', ')}<br>`;
  text += `<strong>Sel :</strong> ${degreSel}<br>`;
  text += `<strong>Épices :</strong> ${degreEpices}`;
  
  if(summary && summaryText) {
    if(saucesEvitees.length > 0 || garnituresEvitees.length > 0 || degreSel !== 'Normal' || degreEpices !== 'Normal') {
      summary.style.display = 'block';
      summaryText.innerHTML = text;
    } else {
      summary.style.display = 'none';
    }
  }
}

function confirmAddToCart() {
  const name = document.getElementById('selectedProductName').value;
  const price = parseFloat(document.getElementById('selectedProductPrice').value);
  
  const saucesEvitees = [];
  const garnituresEvitees = [];
  
  document.querySelectorAll('#saucesAvoidOptions input[type="checkbox"]:checked').forEach(cb => saucesEvitees.push(cb.value));
  document.querySelectorAll('#garnituresAvoidOptions input[type="checkbox"]:checked').forEach(cb => garnituresEvitees.push(cb.value));
  
  const degreSel = document.querySelector('input[name="degreSel"]:checked')?.value || 'Normal';
  const degreEpices = document.querySelector('input[name="degreEpices"]:checked')?.value || 'Normal';
  
  const options = {
    saucesEvitees: saucesEvitees,
    garnituresEvitees: garnituresEvitees,
    degreSel: degreSel,
    degreEpices: degreEpices
  };
  
  const optionsParts = [];
  if(saucesEvitees.length > 0) optionsParts.push('❌ ' + saucesEvitees.join(', '));
  if(garnituresEvitees.length > 0) optionsParts.push('❌ ' + garnituresEvitees.join(', '));
  if(degreSel !== 'Normal') optionsParts.push('🧂 ' + degreSel);
  if(degreEpices !== 'Normal') optionsParts.push('🌶️ ' + degreEpices);
  
  cart.push({ 
    name, 
    price, 
    options,
    optionsText: optionsParts.join(' | ')
  });
  
  closeProductOptionsModal();
  refreshCartDisplay();
}

function refreshCartDisplay() {
  const cartList = document.getElementById('cartList');
  if(cart.length === 0) { 
    if(cartList) cartList.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Votre panier est vide</p></div>'; 
    const totalEl = document.getElementById('total');
    if(totalEl) totalEl.innerText = '0,00'; 
    const cartCountEl = document.getElementById('cartCount');
    if(cartCountEl) cartCountEl.textContent = '0'; 
    return; 
  }
  let total = 0;
  if(cartList) {
    cartList.innerHTML = cart.map((item, idx) => { 
      total += item.price; 
      return `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(item.name)}</div>
          ${item.optionsText ? `<div class="cart-item-options">${escapeHtml(item.optionsText)}</div>` : ''}
        </div>
        <span class="cart-item-price">${item.price.toFixed(2)} MAD</span>
        <button onclick="removeCartItem(${idx})" title="Supprimer" style="background:none; border:none; cursor:pointer; color:#ef4444;">
          <i class="fas fa-trash"></i>
        </button>
      </div>`;
    }).join('');
  }
  const totalEl = document.getElementById('total');
  if(totalEl) totalEl.innerText = total.toFixed(2);
  const cartCountEl = document.getElementById('cartCount');
  if(cartCountEl) cartCountEl.textContent = cart.length;
}

function removeCartItem(index) { cart.splice(index,1); refreshCartDisplay(); }
function clearCart() { cart = []; refreshCartDisplay(); }

// ========= PAIEMENT =========
function openPaymentModal() {
  if(cart.length === 0) { alert("Panier vide"); return; }
  
  const totalCart = cart.reduce((s,i) => s + i.price, 0);
  const paymentCartTotal = document.getElementById('paymentCartTotal');
  if(paymentCartTotal) paymentCartTotal.value = totalCart;
  
  const clientSearch = document.getElementById('clientSearch');
  if(clientSearch) clientSearch.value = '';
  const selectedClientId = document.getElementById('selectedClientId');
  if(selectedClientId) selectedClientId.value = '';
  const selectedClientName = document.getElementById('selectedClientName');
  if(selectedClientName) selectedClientName.value = '';
  const remiseMontant = document.getElementById('remiseMontant');
  if(remiseMontant) remiseMontant.value = 0;
  const monnaieDonnee = document.getElementById('monnaieDonnee');
  if(monnaieDonnee) monnaieDonnee.value = 0;
  const monnaieRendue = document.getElementById('monnaieRendue');
  if(monnaieRendue) monnaieRendue.value = '0,00';
  const resteAPayer = document.getElementById('resteAPayer');
  if(resteAPayer) resteAPayer.value = '0,00';
  const typeVenteDetecte = document.getElementById('typeVenteDetecte');
  if(typeVenteDetecte) typeVenteDetecte.value = '💵 Espèce';
  
  const clientResultsList = document.getElementById('clientResultsList');
  if(clientResultsList) clientResultsList.style.display = 'none';
  const clientSelectedInfo = document.getElementById('clientSelectedInfo');
  if(clientSelectedInfo) clientSelectedInfo.style.display = 'none';
  const monnaieRendueGroup = document.getElementById('monnaieRendueGroup');
  if(monnaieRendueGroup) monnaieRendueGroup.style.display = 'block';
  const resteAPayerGroup = document.getElementById('resteAPayerGroup');
  if(resteAPayerGroup) resteAPayerGroup.style.display = 'none';
  
  calculatePayment();
  const paymentModal = document.getElementById('paymentModal');
  if(paymentModal) paymentModal.classList.remove('hidden');
}

function closePaymentModal() { 
  const modal = document.getElementById('paymentModal');
  if(modal) modal.classList.add('hidden'); 
}

function searchClients(query) {
  const resultsList = document.getElementById('clientResultsList');
  const clientSelectedInfo = document.getElementById('clientSelectedInfo');
  
  if (!query || query.trim() === '') {
    if(resultsList) resultsList.style.display = 'none';
    const selectedClientId = document.getElementById('selectedClientId');
    if(selectedClientId && !selectedClientId.value && clientSelectedInfo) {
      clientSelectedInfo.style.display = 'none';
    }
    return;
  }
  
  const searchTerm = query.toLowerCase().trim();
  const filtered = clients.filter(c => {
    const nomComplet = `${c.nom} ${c.prenom || ''}`.toLowerCase();
    const nom = (c.nom || '').toLowerCase();
    const prenom = (c.prenom || '').toLowerCase();
    return nomComplet.includes(searchTerm) || nom.startsWith(searchTerm) || prenom.startsWith(searchTerm);
  });
  
  if(resultsList) {
    if (filtered.length === 0) {
      resultsList.innerHTML = '<div style="padding:10px;color:#94a3b8;text-align:center;">Aucun client trouvé</div>';
      resultsList.style.display = 'block';
      return;
    }
    
    resultsList.innerHTML = filtered.map(c => `
      <div class="client-result-item" onclick="selectClient(${c.id}, '${escapeHtml(c.nom)}', '${escapeHtml(c.prenom || '')}')" style="padding:10px; cursor:pointer; border-bottom:1px solid #e2e8f0;">
        <strong>${escapeHtml(c.nom)} ${escapeHtml(c.prenom || '')}</strong>
        <span style="color:#64748b;font-size:0.75rem;margin-left:8px;">${escapeHtml(c.telephone || '')}</span>
      </div>
    `).join('');
    resultsList.style.display = 'block';
  }
}

function selectClient(id, nom, prenom) {
  const selectedClientId = document.getElementById('selectedClientId');
  if(selectedClientId) selectedClientId.value = id;
  const selectedClientName = document.getElementById('selectedClientName');
  if(selectedClientName) selectedClientName.value = nom + ' ' + prenom;
  const clientSearch = document.getElementById('clientSearch');
  if(clientSearch) clientSearch.value = nom + ' ' + prenom;
  const resultsList = document.getElementById('clientResultsList');
  if(resultsList) resultsList.style.display = 'none';
  const clientSelectedInfo = document.getElementById('clientSelectedInfo');
  if(clientSelectedInfo) clientSelectedInfo.style.display = 'block';
  const clientSelectedText = document.getElementById('clientSelectedText');
  if(clientSelectedText) clientSelectedText.innerText = nom + ' ' + prenom;
  calculatePayment();
}

document.addEventListener('click', function(e) {
  const resultsList = document.getElementById('clientResultsList');
  const clientSearch = document.getElementById('clientSearch');
  if (resultsList && clientSearch && e.target !== clientSearch && !resultsList.contains(e.target)) {
    resultsList.style.display = 'none';
  }
});

function calculatePayment() {
  const paymentCartTotal = document.getElementById('paymentCartTotal');
  const totalCart = paymentCartTotal ? (parseFloat(paymentCartTotal.value) || 0) : 0;
  const remiseInput = document.getElementById('remiseMontant');
  const remise = remiseInput ? (parseFloat(remiseInput.value) || 0) : 0;
  const netAPayer = Math.max(0, totalCart - remise);
  const monnaieDonneeInput = document.getElementById('monnaieDonnee');
  const monnaieDonnee = monnaieDonneeInput ? (parseFloat(monnaieDonneeInput.value) || 0) : 0;
  const clientIdInput = document.getElementById('selectedClientId');
  const clientId = clientIdInput ? clientIdInput.value : '';
  
  const paymentTotalDisplay = document.getElementById('paymentTotalDisplay');
  if(paymentTotalDisplay) paymentTotalDisplay.innerText = totalCart.toFixed(2) + ' MAD';
  const paymentRemiseDisplay = document.getElementById('paymentRemiseDisplay');
  if(paymentRemiseDisplay) paymentRemiseDisplay.innerText = '-' + remise.toFixed(2) + ' MAD';
  const paymentNetDisplay = document.getElementById('paymentNetDisplay');
  if(paymentNetDisplay) paymentNetDisplay.innerText = netAPayer.toFixed(2) + ' MAD';
  
  const monnaieRendueGroup = document.getElementById('monnaieRendueGroup');
  const resteAPayerGroup = document.getElementById('resteAPayerGroup');
  const typeVenteDetecte = document.getElementById('typeVenteDetecte');
  
  if (monnaieDonnee >= netAPayer) {
    const monnaieRendueValue = monnaieDonnee - netAPayer;
    const monnaieRendueInput = document.getElementById('monnaieRendue');
    if(monnaieRendueInput) monnaieRendueInput.value = monnaieRendueValue.toFixed(2);
    const resteAPayerInput = document.getElementById('resteAPayer');
    if(resteAPayerInput) resteAPayerInput.value = '0,00';
    if(monnaieRendueGroup) monnaieRendueGroup.style.display = 'block';
    if(resteAPayerGroup) resteAPayerGroup.style.display = 'none';
    if(typeVenteDetecte) typeVenteDetecte.value = '💵 Espèce';
  } else {
    const reste = netAPayer - monnaieDonnee;
    const monnaieRendueInput = document.getElementById('monnaieRendue');
    if(monnaieRendueInput) monnaieRendueInput.value = '0,00';
    const resteAPayerInput = document.getElementById('resteAPayer');
    if(resteAPayerInput) resteAPayerInput.value = reste.toFixed(2);
    if(monnaieRendueGroup) monnaieRendueGroup.style.display = 'none';
    if(resteAPayerGroup) resteAPayerGroup.style.display = 'block';
    if(typeVenteDetecte) {
      if (clientId) {
        typeVenteDetecte.value = '💳 Crédit (client sélectionné)';
      } else {
        typeVenteDetecte.value = '⚠️ Crédit - Veuillez sélectionner un client !';
      }
    }
  }
}

// ========= CONFIRMATION PAIEMENT =========
function confirmPayment() {
  const paymentCartTotal = document.getElementById('paymentCartTotal');
  const totalCart = paymentCartTotal ? (parseFloat(paymentCartTotal.value) || 0) : 0;
  const remiseInput = document.getElementById('remiseMontant');
  const remise = remiseInput ? (parseFloat(remiseInput.value) || 0) : 0;
  const netAPayer = Math.max(0, totalCart - remise);
  const monnaieDonneeInput = document.getElementById('monnaieDonnee');
  const monnaieDonnee = monnaieDonneeInput ? (parseFloat(monnaieDonneeInput.value) || 0) : 0;
  const clientIdInput = document.getElementById('selectedClientId');
  const clientId = clientIdInput ? clientIdInput.value : '';
  const clientNameInput = document.getElementById('selectedClientName');
  const clientName = clientNameInput ? clientNameInput.value : '';
  
  let typeVente;
  if (monnaieDonnee >= netAPayer) {
    typeVente = 'espece';
  } else {
    typeVente = 'credit';
    if (!clientId) {
      alert("⚠️ La monnaie donnée est inférieure au total.\nVeuillez sélectionner un client pour enregistrer le crédit.");
      return;
    }
  }
  
  const monnaieRendue = typeVente === 'espece' ? monnaieDonnee - netAPayer : 0;
  const resteAPayer = typeVente === 'credit' ? netAPayer - monnaieDonnee : 0;
  
  let profitVente = 0;
  cart.forEach(item => {
    const product = produits.find(p => p.nom === item.name);
    if (product) {
      const prixEffectif = (product.prixPromo > 0) ? product.prixPromo : product.prixVente;
      const prixAchat = product.prixAchat || 0;
      profitVente += (prixEffectif - prixAchat);
    }
  });
  
  const venteData = {
    id: Date.now(), 
    client: currentUser, 
    clientCrediteur: clientName || null,
    clientCrediteurId: clientId || null, 
    montant: netAPayer, 
    remise: remise,
    totalBrut: totalCart, 
    date: new Date().toLocaleString(), 
    items: cart.length,
    type: typeVente, 
    monnaieDonnee: monnaieDonnee, 
    monnaieRendue: monnaieRendue,
    resteAPayer: resteAPayer,
    profitVente: profitVente,
    statutPaiement: (typeVente === 'espece' || resteAPayer === 0) ? 'payé' : 'non payé'
  };
  
  ventes.push(venteData); 
  
  if (typeVente === 'credit' && resteAPayer > 0) {
    const newCreditId = credits.length > 0 ? Math.max(...credits.map(c => c.id)) + 1 : 1;
    credits.push({ 
      id: newCreditId, 
      client: clientName, 
      clientId: parseInt(clientId), 
      montant: resteAPayer,
      montantInitial: resteAPayer,
      paye: 0,
      dateEcheance: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('fr-FR'),
      statut: 'en attente', 
      dateCreation: new Date().toLocaleString(), 
      venteId: venteData.id 
    });
  }
  
  if (clientId) {
    const client = clients.find(c => c.id == clientId);
    if (client) {
      client.chiffreAffaire = (client.chiffreAffaire || 0) + netAPayer;
      client.profit = (client.profit || 0) + profitVente;
      const pointsGagnes = Math.floor(netAPayer / 10);
      client.pointsFidelite = (client.pointsFidelite || 0) + pointsGagnes;
      
      if (client.chiffreAffaire >= 10000) client.niveau = 'Platinum';
      else if (client.chiffreAffaire >= 5000) client.niveau = 'Gold';
      else if (client.chiffreAffaire >= 2000) client.niveau = 'Silver';
      
      const platsCommandes = cart.map(item => item.name);
      const platsExistants = (client.platsPreferes || '').split(',').map(p => p.trim()).filter(p => p);
      platsCommandes.forEach(plat => {
        if (!platsExistants.includes(plat)) platsExistants.push(plat);
      });
      client.platsPreferes = platsExistants.join(', ');
    }
  }
  
  cart.forEach(item => {
    const product = produits.find(p => p.nom === item.name);
    if(product) { 
      product.quantiteVendue = (product.quantiteVendue || 0) + 1;
      const prixEffectif = (product.prixPromo > 0) ? product.prixPromo : product.prixVente;
      product.chiffreAffaire = (product.chiffreAffaire || 0) + prixEffectif; 
    }
  });
  
  const newOrder = { 
    id: Date.now(), 
    user: currentUser, 
    items: [...cart], 
    total: netAPayer,
    totalBrut: totalCart, 
    remise: remise, 
    type: typeVente, 
    client: clientName || null,
    profitVente: profitVente, 
    date: new Date().toLocaleString() 
  };
  orders.push(newOrder); 
  
  cart = []; 
  forceSaveAllData();
  refreshCartDisplay(); 
  renderVentesHistory(); 
  renderCreditsTable(); 
  renderClientsTable(); 
  updateStats(); 
  closePaymentModal();
  
  const typeMsg = typeVente === 'espece' ? 'en espèces 💵' : 'à crédit 💳';
  const renduMsg = typeVente === 'espece' ? `\nMonnaie rendue : ${monnaieRendue.toFixed(2)} MAD` : '';
  const creditMsg = typeVente === 'credit' ? `\nCrédit enregistré : ${resteAPayer.toFixed(2)} MAD pour ${clientName}` : '';
  const pointsMsg = clientId ? `\nPoints fidélité gagnés : ${Math.floor(netAPayer / 10)} pts` : '';
  alert(`✅ Commande validée ${typeMsg} !\nTotal : ${netAPayer.toFixed(2)} MAD${pointsMsg}${renduMsg}${creditMsg}`);
}

// ========= CATEGORIES ICON HANDLING =========
function displayCategoryIcon(icon) {
  if(!icon) return '📁';
  if(icon.startsWith('data:image')) return `<img src="${icon}" class="cat-btn-img" alt="icone" style="width:24px;height:24px;object-fit:contain;">`;
  if(icon.startsWith('http')) return `<img src="${icon}" class="cat-btn-img" alt="icone" style="width:24px;height:24px;object-fit:contain;" onerror="this.style.display='none';this.parentElement.innerHTML='📁';">`;
  if(icon.startsWith('fa-')) return `<i class="fas ${icon}"></i>`;
  return icon;
}

function displayCategoryIconSmall(icon) {
  if(!icon) return '📁';
  if(icon.startsWith('data:image') || icon.startsWith('http')) return `<img src="${icon}" class="category-icon-img" alt="icone" style="width:20px;height:20px;object-fit:contain;" onerror="this.style.display='none';this.parentElement.innerHTML='📁';">`;
  if(icon.startsWith('fa-')) return `<i class="fas ${icon}"></i>`;
  return icon;
}

function switchCategoryIconMode(mode) {
  currentCategoryIconMode = mode;
  const emojiMode = document.getElementById('catIconEmojiMode');
  const urlMode = document.getElementById('catIconUrlMode');
  const fileMode = document.getElementById('catIconFileMode');
  const btnEmoji = document.getElementById('btnEmojiMode');
  const btnUrl = document.getElementById('btnCatUrlMode');
  const btnFile = document.getElementById('btnCatFileMode');
  
  if(emojiMode) emojiMode.classList.add('hidden');
  if(urlMode) urlMode.classList.add('hidden');
  if(fileMode) fileMode.classList.add('hidden');
  if(btnEmoji) btnEmoji.classList.remove('active');
  if(btnUrl) btnUrl.classList.remove('active');
  if(btnFile) btnFile.classList.remove('active');
  
  if(mode === 'emoji') {
    if(emojiMode) emojiMode.classList.remove('hidden');
    if(btnEmoji) btnEmoji.classList.add('active');
    const iconInput = document.getElementById('categoryIcon');
    updateCategoryIconPreview(iconInput ? iconInput.value : '🍔');
  } else if(mode === 'url') {
    if(urlMode) urlMode.classList.remove('hidden');
    if(btnUrl) btnUrl.classList.add('active');
    const urlInput = document.getElementById('categoryIconUrl');
    updateCategoryIconPreview(urlInput ? urlInput.value : '');
  } else if(mode === 'file') {
    if(fileMode) fileMode.classList.remove('hidden');
    if(btnFile) btnFile.classList.add('active');
    if(tempCategoryIconBase64) updateCategoryIconPreview(tempCategoryIconBase64);
  }
}

function updateCategoryIconPreview(value) {
  const preview = document.getElementById('iconPreview');
  if(!preview) return;
  if(!value) { preview.innerHTML = '🍔'; return; }
  if(value.startsWith('data:image') || value.startsWith('http')) {
    preview.innerHTML = `<img src="${value}" style="width:50px;height:50px;object-fit:contain;border-radius:4px;" onerror="this.style.display='none';this.parentElement.innerHTML='🍔';">`;
  } else if(value.startsWith('fa-')) {
    preview.innerHTML = `<i class="fas ${value}" style="font-size:2rem;"></i>`;
  } else {
    preview.innerHTML = value;
  }
}

function setCategoryEmoji(emoji) { 
  const iconInput = document.getElementById('categoryIcon');
  if(iconInput) iconInput.value = emoji; 
  updateCategoryIconPreview(emoji); 
}

function handleCategoryIconFileSelect(event) {
  const file = event.target.files[0];
  if(!file) return;
  if(!file.type.match('image.*')) { alert('Veuillez sélectionner une image'); return; }
  if(file.size > 500 * 1024) { alert('L\'image ne doit pas dépasser 500KB'); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    tempCategoryIconBase64 = e.target.result;
    const previewDiv = document.getElementById('catIconFilePreview');
    if(previewDiv) {
      previewDiv.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:10px;background:#f1f5f9;border-radius:8px;">
          <img src="${tempCategoryIconBase64}" style="width:40px;height:40px;object-fit:contain;border-radius:4px;">
          <div style="flex:1;"><p style="font-weight:600;color:#1e293b;margin-bottom:2px;">${file.name}</p><small style="color:#64748b;">${(file.size/1024).toFixed(1)} KB</small></div>
          <button onclick="removeCategoryIconFile(event)" style="background:none;border:none;color:#ef4444;cursor:pointer;padding:5px;"><i class="fas fa-times"></i></button>
        </div>`;
    }
    updateCategoryIconPreview(tempCategoryIconBase64);
  };
  reader.readAsDataURL(file);
}

function removeCategoryIconFile(event) {
  if(event) event.stopPropagation();
  tempCategoryIconBase64 = null;
  const previewDiv = document.getElementById('catIconFilePreview');
  if(previewDiv) previewDiv.innerHTML = '';
  const fileInput = document.getElementById('categoryIconFile');
  if(fileInput) fileInput.value = '';
  const preview = document.getElementById('iconPreview');
  if(preview) preview.innerHTML = '🍔';
}

// ========= CATEGORIES CRUD =========
function openCategoryModal(editMode=false, cat=null) {
  const modal = document.getElementById('categoryModal');
  if(modal) modal.classList.remove('hidden');
  tempCategoryIconBase64 = null;
  const previewDiv = document.getElementById('catIconFilePreview');
  if(previewDiv) previewDiv.innerHTML = '';
  const fileInput = document.getElementById('categoryIconFile');
  if(fileInput) fileInput.value = '';
  const iconInput = document.getElementById('categoryIcon');
  if(iconInput) {
    iconInput.oninput = function() { updateCategoryIconPreview(this.value); };
  }
  const iconUrlInput = document.getElementById('categoryIconUrl');
  if(iconUrlInput) {
    iconUrlInput.oninput = function() { updateCategoryIconPreview(this.value); };
  }
  
  const title = document.getElementById('modalTitle');
  const catId = document.getElementById('categoryId');
  const catName = document.getElementById('categoryName');
  const catDesc = document.getElementById('categoryDesc');
  
  if(editMode && cat) {
    if(title) title.innerText = 'Modifier catégorie';
    if(catId) catId.value = cat.id;
    if(catName) catName.value = cat.nom;
    if(catDesc) catDesc.value = cat.description || '';
    if(cat.icon && cat.icon.startsWith('data:image')) {
      tempCategoryIconBase64 = cat.icon;
      switchCategoryIconMode('file');
      const previewDivFile = document.getElementById('catIconFilePreview');
      if(previewDivFile) {
        previewDivFile.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;padding:10px;background:#f1f5f9;border-radius:8px;">
            <img src="${cat.icon}" style="width:40px;height:40px;object-fit:contain;border-radius:4px;">
            <div style="flex:1;"><p style="font-weight:600;color:#1e293b;">Image enregistrée</p></div>
            <button onclick="removeCategoryIconFile(event)" style="background:none;border:none;color:#ef4444;cursor:pointer;padding:5px;"><i class="fas fa-times"></i></button>
          </div>`;
      }
      updateCategoryIconPreview(cat.icon);
    } else if(cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('fa-'))) {
      if(cat.icon.startsWith('fa-')) { 
        switchCategoryIconMode('emoji'); 
        if(iconInput) iconInput.value = cat.icon; 
      } else { 
        switchCategoryIconMode('url'); 
        if(iconUrlInput) iconUrlInput.value = cat.icon; 
      }
      updateCategoryIconPreview(cat.icon);
    } else {
      switchCategoryIconMode('emoji');
      if(iconInput) iconInput.value = cat.icon || '🍔';
      updateCategoryIconPreview(cat.icon || '🍔');
    }
  } else {
    if(title) title.innerText = 'Ajouter catégorie';
    if(catId) catId.value = '';
    if(catName) catName.value = '';
    if(catDesc) catDesc.value = '';
    switchCategoryIconMode('emoji');
    if(iconInput) iconInput.value = '🍔';
    if(iconUrlInput) iconUrlInput.value = '';
    updateCategoryIconPreview('🍔');
  }
}

function closeCategoryModal() { 
  const modal = document.getElementById('categoryModal');
  if(modal) modal.classList.add('hidden'); 
}

function saveCategory() {
  const id = document.getElementById('categoryId')?.value;
  const nom = document.getElementById('categoryName')?.value.trim();
  const description = document.getElementById('categoryDesc')?.value.trim();
  if(!nom) { alert("Nom requis"); return; }
  let iconValue = '🍔';
  if(currentCategoryIconMode === 'emoji') { 
    iconValue = document.getElementById('categoryIcon')?.value.trim() || '🍔'; 
  } else if(currentCategoryIconMode === 'url') { 
    iconValue = document.getElementById('categoryIconUrl')?.value.trim() || '🍔'; 
  } else if(currentCategoryIconMode === 'file' && tempCategoryIconBase64) { 
    iconValue = tempCategoryIconBase64; 
  }
  
  if(id) { 
    const idx = categories.findIndex(c => c.id == id); 
    if(idx !== -1) categories[idx] = { ...categories[idx], icon: iconValue, nom, description }; 
  } else { 
    const newId = categories.length > 0 ? Math.max(...categories.map(c=>c.id)) + 1 : 1; 
    categories.push({ id: newId, icon: iconValue, nom, description, dateCreation: getNowDateTime() }); 
  }
  forceSaveAllData();
  
  // 🔥 Synchroniser vers Firebase
  setTimeout(async () => {
    if (typeof window.syncAllDataToFirebase === 'function') {
      await window.syncAllDataToFirebase();
      console.log("✅ Catégories synchronisées vers Firebase");
    }
  }, 500);
  
  closeCategoryModal(); 
  renderCategoriesTable(); 
  loadPOSCategories();
  chargerCategoriesEnLigne();
}

function editCategory(id) { 
  const cat = categories.find(c=>c.id==id); 
  if(cat) openCategoryModal(true, cat); 
}

function deleteCategory(id) { 
  if(confirm("⚠️ Supprimer cette catégorie ?\nLes produits de cette catégorie ne seront pas affectés.")) { 
    const idNumber = Number(id);
    const avant = categories.length;
    categories = categories.filter(c => Number(c.id) !== idNumber); 
    if(avant !== categories.length) {
      forceSaveAllData();
      
      // 🔥 Supprimer aussi dans Firebase
      if (typeof window.deleteCategoryFromFirebase === 'function') {
        window.deleteCategoryFromFirebase(idNumber);
      }
      
      renderCategoriesTable(); 
      loadPOSCategories();
      chargerCategoriesEnLigne();
      alert("✅ Catégorie supprimée avec succès !");
    } else {
      alert("❌ Catégorie non trouvée");
    }
  } 
}

function renderCategoriesTable() {
  const tbody = document.getElementById('categoriesList');
  if(!tbody) return;
  if(categories.length===0) { 
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">Aucune catégorie</td></tr>'; 
    return; 
  }
  tbody.innerHTML = categories.map(c => `
    <tr>
      <td>${c.id}</td>
      <td class="category-icon-display" style="font-size:24px;">${displayCategoryIconSmall(c.icon)}</td>
      <td><b>${escapeHtml(c.nom)}</b></td>
      <td>${escapeHtml(c.description||'-')}</td>
      <td>${c.dateCreation||'-'}</td>
      <td>
        <button class="btn-edit" onclick="editCategory(${c.id})"><i class="fas fa-edit"></i></button>
        <button class="btn-delete" onclick="deleteCategory(${c.id})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

// ========= PRODUCT IMAGE HANDLING =========
function switchProductImageMode(mode) {
  currentProductImageMode = mode;
  const urlMode = document.getElementById('productImageUrlMode');
  const fileMode = document.getElementById('productImageFileMode');
  const btnUrl = document.getElementById('btnUrlMode');
  const btnFile = document.getElementById('btnFileMode');
  
  if(urlMode) urlMode.classList.add('hidden');
  if(fileMode) fileMode.classList.add('hidden');
  if(btnUrl) btnUrl.classList.remove('active');
  if(btnFile) btnFile.classList.remove('active');
  
  if(mode === 'url') {
    if(urlMode) urlMode.classList.remove('hidden');
    if(btnUrl) btnUrl.classList.add('active');
    const urlInput = document.getElementById('productImage');
    if(urlInput && urlInput.value) { 
      const preview = document.getElementById('productImagePreview');
      if(preview) preview.innerHTML = `<img src="${urlInput.value}" style="max-width:150px;max-height:150px;border-radius:8px;" onerror="this.style.display='none'">`; 
    } else { 
      const preview = document.getElementById('productImagePreview');
      if(preview) preview.innerHTML = ''; 
    }
  } else {
    if(fileMode) fileMode.classList.remove('hidden');
    if(btnFile) btnFile.classList.add('active');
    if(tempProductImageBase64) { 
      const preview = document.getElementById('productImagePreview');
      if(preview) preview.innerHTML = `<img src="${tempProductImageBase64}" style="max-width:150px;max-height:150px;border-radius:8px;">`; 
    } else { 
      const preview = document.getElementById('productImagePreview');
      if(preview) preview.innerHTML = ''; 
    }
  }
}

function resizeImage(file, maxWidth = 400, maxHeight = 400) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        let width = img.width; 
        let height = img.height;
        if (width > height) { 
          if (width > maxWidth) { 
            height *= maxWidth / width; 
            width = maxWidth; 
          } 
        } else { 
          if (height > maxHeight) { 
            width *= maxHeight / height; 
            height = maxHeight; 
          } 
        }
        const canvas = document.createElement('canvas'); 
        canvas.width = width; 
        canvas.height = height;
        const ctx = canvas.getContext('2d'); 
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleProductImageFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.match('image.*')) { alert('Veuillez sélectionner une image (JPG, PNG, GIF)'); return; }
  if (file.size > 2 * 1024 * 1024) { alert('L\'image ne doit pas dépasser 2MB'); return; }
  tempProductImageBase64 = await resizeImage(file);
  const previewFile = document.getElementById('productFileImagePreview');
  if(previewFile) {
    previewFile.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;padding:10px;background:#f1f5f9;border-radius:8px;">
        <img src="${tempProductImageBase64}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;">
        <div style="flex:1;"><p style="font-weight:600;color:#1e293b;margin-bottom:2px;">${file.name}</p><small style="color:#64748b;">Redimensionnée</small></div>
        <button onclick="removeProductImageFile(event)" style="background:none;border:none;color:#ef4444;cursor:pointer;padding:5px;"><i class="fas fa-times"></i></button>
      </div>`;
  }
  const preview = document.getElementById('productImagePreview');
  if(preview) preview.innerHTML = `<img src="${tempProductImageBase64}" style="max-width:150px;max-height:150px;border-radius:8px;">`;
}

function removeProductImageFile(event) {
  if(event) event.stopPropagation();
  tempProductImageBase64 = null;
  const previewFile = document.getElementById('productFileImagePreview');
  if(previewFile) previewFile.innerHTML = '';
  const preview = document.getElementById('productImagePreview');
  if(preview) preview.innerHTML = '';
  const fileInput = document.getElementById('productImageFile');
  if(fileInput) fileInput.value = '';
}

// ========= PRODUITS CRUD =========
function calculateProfit() {
  const achat = parseFloat(document.getElementById('productAchat')?.value) || 0;
  const vente = parseFloat(document.getElementById('productVente')?.value) || 0;
  const promo = parseFloat(document.getElementById('productPromo')?.value) || 0;
  const prixEffectif = (promo > 0) ? promo : vente;
  const profit = prixEffectif - achat;
  const profitInput = document.getElementById('productProfit');
  if(profitInput) profitInput.value = profit.toFixed(2);
  const vendue = parseFloat(document.getElementById('productVendue')?.value) || 0;
  const caInput = document.getElementById('productCA');
  if(caInput) caInput.value = (prixEffectif * vendue).toFixed(2);
}

function openProductModal(editMode = false, product = null) {
  const select = document.getElementById('productCategory');
  if(select) {
    select.innerHTML = '<option value="">Sélectionner une catégorie</option>' + 
      categories.map(cat => `<option value="${cat.id}">${displayCategoryIconSmall(cat.icon)} ${escapeHtml(cat.nom)}</option>`).join('');
  }
  const modal = document.getElementById('productModal');
  if(modal) modal.classList.remove('hidden');
  tempProductImageBase64 = null;
  const previewFile = document.getElementById('productFileImagePreview');
  if(previewFile) previewFile.innerHTML = '';
  const fileInput = document.getElementById('productImageFile');
  if(fileInput) fileInput.value = '';
  switchProductImageMode('url');
  const imgInput = document.getElementById('productImage');
  if(imgInput) {
    imgInput.oninput = function() {
      if (imgInput.value) { 
        tempProductImageBase64 = null; 
        const preview = document.getElementById('productImagePreview');
        if(preview) preview.innerHTML = `<img src="${imgInput.value}" style="max-width:150px;max-height:150px;border-radius:8px;" onerror="this.style.display='none'">`; 
      } else { 
        const preview = document.getElementById('productImagePreview');
        if(preview) preview.innerHTML = ''; 
      }
    };
  }
  
  const achatInput = document.getElementById('productAchat');
  if(achatInput) achatInput.oninput = calculateProfit;
  const venteInput = document.getElementById('productVente');
  if(venteInput) venteInput.oninput = calculateProfit;
  const promoInput = document.getElementById('productPromo');
  if(promoInput) promoInput.oninput = calculateProfit;
  const vendueInput = document.getElementById('productVendue');
  if(vendueInput) vendueInput.oninput = calculateProfit;
  
  const title = document.getElementById('productModalTitle');
  const prodId = document.getElementById('productId');
  const prodDate = document.getElementById('productDateCreation');
  const prodName = document.getElementById('productName');
  const prodCategory = document.getElementById('productCategory');
  const prodDesc = document.getElementById('productDesc');
  const prodAchat = document.getElementById('productAchat');
  const prodVente = document.getElementById('productVente');
  const prodPromo = document.getElementById('productPromo');
  const prodStock = document.getElementById('productStock');
  const prodVendue = document.getElementById('productVendue');
  const prodTemps = document.getElementById('productTemps');
  const prodDispo = document.getElementById('productDispo');
  const prodImage = document.getElementById('productImage');
  
  if(editMode && product) {
    if(title) title.innerText = 'Modifier le produit';
    if(prodId) prodId.value = product.id;
    if(prodDate) prodDate.value = product.dateCreation || '';
    if(prodName) prodName.value = product.nom;
    if(prodCategory) prodCategory.value = product.categorieId;
    if (product.image && product.image.startsWith('data:image')) {
      tempProductImageBase64 = product.image; 
      switchProductImageMode('file');
      const preview = document.getElementById('productImagePreview');
      if(preview) preview.innerHTML = `<img src="${product.image}" style="max-width:150px;max-height:150px;border-radius:8px;">`;
      const previewFileDiv = document.getElementById('productFileImagePreview');
      if(previewFileDiv) {
        previewFileDiv.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;padding:10px;background:#f1f5f9;border-radius:8px;">
            <img src="${product.image}" style="width:50px;height:50px;object-fit:cover;border-radius:6px;">
            <div style="flex:1;"><p style="font-weight:600;color:#1e293b;">Image enregistrée</p></div>
            <button onclick="removeProductImageFile(event)" style="background:none;border:none;color:#ef4444;cursor:pointer;padding:5px;"><i class="fas fa-times"></i></button>
          </div>`;
      }
    } else {
      if(prodImage) prodImage.value = product.image || '';
      if (product.image) { 
        const preview = document.getElementById('productImagePreview');
        if(preview) preview.innerHTML = `<img src="${product.image}" style="max-width:150px;max-height:150px;border-radius:8px;" onerror="this.style.display='none'">`; 
      }
    }
    if(prodDesc) prodDesc.value = product.description || '';
    if(prodAchat) prodAchat.value = product.prixAchat || 0;
    if(prodVente) prodVente.value = product.prixVente || 0;
    if(prodPromo) prodPromo.value = product.prixPromo || 0;
    if(prodStock) prodStock.value = product.stock || 0;
    if(prodVendue) prodVendue.value = product.quantiteVendue || 0;
    if(prodTemps) prodTemps.value = product.tempsPreparation || 5;
    if(prodDispo) prodDispo.value = product.disponibilite || 'disponible';
    calculateProfit();
  } else {
    if(title) title.innerText = 'Ajouter un produit';
    if(prodId) prodId.value = '';
    if(prodDate) prodDate.value = '';
    if(prodName) prodName.value = ''; 
    if(prodCategory) prodCategory.value = '';
    if(prodImage) prodImage.value = ''; 
    if(prodDesc) prodDesc.value = '';
    if(prodAchat) prodAchat.value = ''; 
    if(prodVente) prodVente.value = '';
    if(prodPromo) prodPromo.value = 0; 
    if(prodStock) prodStock.value = 0;
    if(prodVendue) prodVendue.value = 0; 
    if(prodTemps) prodTemps.value = 5;
    if(prodDispo) prodDispo.value = 'disponible';
    const preview = document.getElementById('productImagePreview');
    if(preview) preview.innerHTML = '';
    calculateProfit();
  }
}

function closeProductModal() { 
  const modal = document.getElementById('productModal');
  if(modal) modal.classList.add('hidden'); 
}

function saveProduct() {
  const id = document.getElementById('productId')?.value;
  const nom = document.getElementById('productName')?.value.trim();
  const categorieId = document.getElementById('productCategory')?.value;
  if(!nom) { alert("Nom requis"); return; }
  if(!categorieId) { alert("Catégorie requise"); return; }
  let imageValue = '';
  if (currentProductImageMode === 'file' && tempProductImageBase64) { 
    imageValue = tempProductImageBase64; 
  } else { 
    imageValue = document.getElementById('productImage')?.value || ''; 
  }
  
  const existingDate = document.getElementById('productDateCreation')?.value;
  const dateCreation = existingDate || getNowDateTime();
  
  const prixAchat = parseFloat(document.getElementById('productAchat')?.value) || 0;
  const prixVente = parseFloat(document.getElementById('productVente')?.value) || 0;
  const prixPromo = parseFloat(document.getElementById('productPromo')?.value) || 0;
  const quantiteVendue = parseInt(document.getElementById('productVendue')?.value) || 0;
  const prixEffectif = (prixPromo > 0) ? prixPromo : prixVente;
  
  const newId = id ? parseInt(id) : (produits.length > 0 ? Math.max(...produits.map(p=>p.id)) + 1 : 1);
  const product = {
    id: newId, 
    nom: nom, 
    categorieId: parseInt(categorieId), 
    image: imageValue,
    description: document.getElementById('productDesc')?.value || '',
    prixAchat: prixAchat,
    prixVente: prixVente,
    prixPromo: prixPromo,
    stock: parseInt(document.getElementById('productStock')?.value) || 0,
    quantiteVendue: quantiteVendue,
    tempsPreparation: parseInt(document.getElementById('productTemps')?.value) || 5,
    disponibilite: document.getElementById('productDispo')?.value || 'disponible',
    chiffreAffaire: prixEffectif * quantiteVendue,
    dateCreation: dateCreation
  };
  
  if(id) { 
    const idx = produits.findIndex(p => p.id == id); 
    if(idx !== -1) { 
      produits[idx] = { ...product, dateCreation: existingDate || produits[idx].dateCreation || getNowDateTime() }; 
    } 
  } else { 
    produits.push(product); 
  }
  
  // Sauvegarde locale
  forceSaveAllData();
  
  // 🔥 SYNCHRONISATION AUTOMATIQUE VERS FIREBASE 🔥
  setTimeout(async () => {
    if (typeof window.syncAllDataToFirebase === 'function') {
      await window.syncAllDataToFirebase();
      console.log(`✅ Produit "${nom}" synchronisé vers Firebase`);
      showToastMessage(`✅ Produit "${nom}" synchronisé !`);
    } else if (typeof window.saveProductToFirebase === 'function') {
      await window.saveProductToFirebase(product);
    }
  }, 500);
  
  closeProductModal(); 
  renderProductsTable(); 
  loadPOSCategories();
  chargerProduitsEnLigne();
  if(categories.length > 0) filterPOSProducts(categories[0].id);
}

function editProduct(id) { 
  const p = produits.find(p=>p.id==id); 
  if(p) openProductModal(true, p); 
}

function deleteProduct(id) { 
  if(confirm("⚠️ Supprimer ce produit ? Cette action est irréversible.")) { 
    const idNumber = Number(id);
    const avant = produits.length;
    produits = produits.filter(p => Number(p.id) !== idNumber); 
    if(avant !== produits.length) {
      forceSaveAllData();
      renderProductsTable(); 
      loadPOSCategories();
      chargerProduitsEnLigne();
      if(categories.length > 0) filterPOSProducts(categories[0].id);
      
      // 🔥 Supprimer aussi dans Firebase
      if (typeof window.deleteProductFromFirebase === 'function') {
        window.deleteProductFromFirebase(idNumber);
      }
      
      alert("✅ Produit supprimé avec succès !");
    } else {
      alert("❌ Produit non trouvé");
    }
  } 
}

function renderProductsTable() {
  const tbody = document.getElementById('productsList');
  if(!tbody) return;
  
  const searchInput = document.getElementById('searchProduits');
  const searchTerm = searchInput ? (searchInput.value || '').toLowerCase().trim() : '';
  let filteredProduits = [...produits];
  if (searchTerm !== '') {
    filteredProduits = filteredProduits.filter(p => 
      (p.nom || '').toLowerCase().includes(searchTerm) || 
      (p.description || '').toLowerCase().includes(searchTerm) || 
      (categories.find(c=>c.id==p.categorieId)?.nom || '').toLowerCase().includes(searchTerm)
    );
  }
  
  if(filteredProduits.length===0) { 
    tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:20px;color:#94a3b8;">Aucun produit trouvé</td></tr>'; 
    return; 
  }
  
  tbody.innerHTML = filteredProduits.map(p => {
    const prixEffectif = (p.prixPromo > 0) ? p.prixPromo : p.prixVente;
    const profitUnitaire = prixEffectif - (p.prixAchat || 0);
    const dispoClass = p.disponibilite === 'disponible' ? 'status-success' : (p.disponibilite === 'indisponible' ? 'status-danger' : 'status-warning');
    const dispoText = p.disponibilite === 'disponible' ? '✅' : (p.disponibilite === 'indisponible' ? '❌' : '⚠️');
    const catName = categories.find(c=>c.id==p.categorieId)?.nom || '-';
    
    let prixAffichage = '';
    if (p.prixPromo > 0) {
      prixAffichage = `<div><span style="text-decoration:line-through;color:#94a3b8;font-size:0.7rem;">${p.prixVente.toFixed(2)} MAD</span><br><span style="color:#ef4444;font-weight:700;">${p.prixPromo.toFixed(2)} MAD</span></div>`;
    } else {
      prixAffichage = `<div>${p.prixVente.toFixed(2)} MAD</div>`;
    }
    
    return `
    <tr>
      <td>${p.id}</td>
      <td>${p.image ? `<img src="${p.image}" class="product-img" style="width:40px;height:40px;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'">` : '📷'}</td>
      <td><b>${escapeHtml(p.nom)}</b><br><small>${escapeHtml((p.description || '').substring(0,30))}</small></td>
      <td>${displayCategoryIconSmall(categories.find(c=>c.id==p.categorieId)?.icon)} ${catName}</td>
      <td>${(p.prixAchat || 0).toFixed(2)} MAD</td>
      <td>${prixAffichage}</td>
      <td style="color:${profitUnitaire>=0?'#16a34a':'#ef4444'};font-weight:600;">${profitUnitaire.toFixed(2)} MAD</td>
      <td>${p.prixPromo > 0 ? p.prixPromo.toFixed(2)+' MAD' : '-'}</td>
      <td>${p.stock || 0}</td>
      <td>${p.quantiteVendue || 0}</td>
      <td>${((prixEffectif * (p.quantiteVendue || 0))).toFixed(2)} MAD</td>
      <td>${p.tempsPreparation || 5} min</td>
      <td><span class="${dispoClass}">${dispoText}</span></td>
      <td><small>${p.dateCreation||'-'}</small></td>
      <td>
        <button class="btn-edit" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
        <button class="btn-delete" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
    `;
  }).join('');
}

// ========= CLIENTS (Version simplifiée - garder vos fonctions existantes) =========
// ... (garder vos fonctions client existantes)

// ========= FOURNISSEURS (Version simplifiée) =========
// ... (garder vos fonctions fournisseur existantes)

// ========= FONCTION UTILITAIRE =========
function getNowDateTime() {
  const now = new Date();
  return now.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ========= VENTES =========
function renderVentesHistory() {
  const tbody = document.getElementById('ventesList');
  if(!tbody) return;
  
  if(ventes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="18" style="text-align:center;padding:20px;color:#94a3b8;">Aucune vente</td></tr>';
    return;
  }
  
  tbody.innerHTML = ventes.slice().reverse().map(v => `
    <tr>
      <td><b>#${v.id.toString().slice(-6)}</b></td>
      <td><small>${v.date}</small></td>
      <td>${escapeHtml(v.client || '-')}</td>
      <td>${(v.montant || 0).toFixed(2)} MAD</td>
      <td>${v.type === 'espece' ? '💵 Espèce' : '💳 Crédit'}</td>
      <td>${v.statutPaiement === 'payé' ? '✅ Payé' : '⏳ En attente'}</td>
      <td>
        <button class="btn-edit" onclick="viewVente(${v.id})"><i class="fas fa-eye"></i></button>
      </td>
    </tr>
  `).join('');
}

function viewVente(id) {
  const vente = ventes.find(v => v.id == id);
  if(vente) {
    alert(`Détail de la vente #${id}\nTotal: ${vente.montant} MAD\nType: ${vente.type}\nDate: ${vente.date}`);
  }
}

// ========= CREDITS =========
function renderCreditsTable() {
  const tbody = document.getElementById('creditsList');
  if(!tbody) return;
  
  const creditsActifs = credits.filter(c => c.statut !== 'payé');
  
  if(creditsActifs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:20px;color:#94a3b8;">Aucun crédit actif</td></tr>';
    return;
  }
  
  tbody.innerHTML = creditsActifs.map(c => {
    const paye = c.paye || 0;
    const reste = (c.montant || 0) - paye;
    return `
    <tr>
      <td>#${c.id}</td>
      <td>${escapeHtml(c.client || '-')}</td>
      <td>${(c.montant || 0).toFixed(2)} MAD</td>
      <td>${paye.toFixed(2)} MAD</td>
      <td>${reste.toFixed(2)} MAD</td>
      <td>${c.statut === 'payé' ? '✅ Payé' : '⏳ En attente'}</td>
      <td>
        ${reste > 0 ? `<button class="btn-edit" onclick="payCredit(${c.id})">💵 Payer</button>` : ''}
      </td>
    </tr>
    `;
  }).join('');
}

function payCredit(id) {
  const credit = credits.find(c => c.id == id);
  if(credit) {
    const reste = (credit.montant || 0) - (credit.paye || 0);
    const montant = prompt(`Montant à payer pour ${credit.client}? (Reste: ${reste.toFixed(2)} MAD)`);
    if(montant && parseFloat(montant) > 0) {
      credit.paye = (credit.paye || 0) + parseFloat(montant);
      if((credit.montant || 0) - (credit.paye || 0) <= 0) {
        credit.statut = 'payé';
      }
      forceSaveAllData();
      renderCreditsTable();
      alert(`Paiement de ${montant} MAD enregistré`);
    }
  }
}

// ========= DÉPENSES =========
function openDepenseModal(editMode = false, depense = null) {
  const modal = document.getElementById('depenseModal');
  if(modal) modal.classList.remove('hidden');
  
  if (editMode && depense) {
    const title = document.getElementById('depenseModalTitle');
    const depId = document.getElementById('depenseId');
    const depDate = document.getElementById('depenseDate');
    const depCategorie = document.getElementById('depenseCategorie');
    const depDescription = document.getElementById('depenseDescription');
    const depMontant = document.getElementById('depenseMontant');
    
    if(title) title.innerText = 'Modifier la dépense';
    if(depId) depId.value = depense.id;
    if(depDate) depDate.value = depense.dateISO || '';
    if(depCategorie) depCategorie.value = depense.categorie || '';
    if(depDescription) depDescription.value = depense.description || '';
    if(depMontant) depMontant.value = depense.montant || '';
  } else {
    const title = document.getElementById('depenseModalTitle');
    const depId = document.getElementById('depenseId');
    const depDate = document.getElementById('depenseDate');
    const depCategorie = document.getElementById('depenseCategorie');
    const depDescription = document.getElementById('depenseDescription');
    const depMontant = document.getElementById('depenseMontant');
    
    if(title) title.innerText = 'Ajouter une dépense';
    if(depId) depId.value = '';
    if(depDate) depDate.value = new Date().toISOString().split('T')[0];
    if(depCategorie) depCategorie.value = '';
    if(depDescription) depDescription.value = '';
    if(depMontant) depMontant.value = '';
  }
}

function closeDepenseModal() { 
  const modal = document.getElementById('depenseModal');
  if(modal) modal.classList.add('hidden'); 
}

function saveDepense() {
  const id = document.getElementById('depenseId')?.value;
  const categorie = document.getElementById('depenseCategorie')?.value;
  const montant = parseFloat(document.getElementById('depenseMontant')?.value);
  const dateValue = document.getElementById('depenseDate')?.value;
  
  if (!categorie) { alert("Catégorie requise"); return; }
  if (!montant || montant <= 0) { alert("Montant valide requis"); return; }
  if (!dateValue) { alert("Date requise"); return; }
  
  const depenseData = {
    dateISO: dateValue,
    date: new Date(dateValue).toLocaleDateString('fr-FR'),
    categorie: categorie,
    montant: montant,
    description: document.getElementById('depenseDescription')?.value || '',
    dateCreation: new Date().toLocaleString()
  };
  
  if (id) { 
    const idx = depenses.findIndex(d => d.id == id); 
    if (idx !== -1) { 
      depenseData.id = parseInt(id); 
      depenses[idx] = depenseData; 
    } 
  } else { 
    const newId = depenses.length > 0 ? Math.max(...depenses.map(d => d.id)) + 1 : 1; 
    depenseData.id = newId; 
    depenses.push(depenseData); 
  }
  
  forceSaveAllData();
  closeDepenseModal();
  renderDepensesTable();
  updateStats();
}

function editDepense(id) { 
  const depense = depenses.find(d => d.id == id); 
  if(depense) openDepenseModal(true, depense); 
}

function deleteDepense(id) { 
  if (confirm("Supprimer cette dépense ?")) { 
    depenses = depenses.filter(d => d.id != id); 
    forceSaveAllData(); 
    renderDepensesTable(); 
    updateStats(); 
  } 
}

function renderDepensesTable() {
  const tbody = document.getElementById('depensesList');
  if(!tbody) return;
  
  if(depenses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:20px;color:#94a3b8;">Aucune dépense</td></tr>';
    return;
  }
  
  const totalGeneral = depenses.reduce((s, d) => s + (d.montant || 0), 0);
  const totalDepensesEl = document.getElementById('totalDepenses');
  if(totalDepensesEl) totalDepensesEl.textContent = totalGeneral.toFixed(2) + ' MAD';
  
  const maintenant = new Date();
  const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  const totalMois = depenses.filter(d => d.dateISO && new Date(d.dateISO) >= debutMois).reduce((s, d) => s + (d.montant || 0), 0);
  const depensesCeMoisEl = document.getElementById('depensesCeMois');
  if(depensesCeMoisEl) depensesCeMoisEl.textContent = totalMois.toFixed(2) + ' MAD';
  
  tbody.innerHTML = depenses.slice().reverse().map(d => `
    <tr>
      <td>${d.id}</td>
      <td><small>${d.date || '-'}</small></td>
      <td>${d.categorie}</td>
      <td>${escapeHtml(d.description || '-')}</td>
      <td style="color:#ef4444; font-weight:600;">${d.montant.toFixed(2)} MAD</td>
      <td>
        <button class="btn-edit" onclick="editDepense(${d.id})"><i class="fas fa-edit"></i></button>
        <button class="btn-delete" onclick="deleteDepense(${d.id})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

// ========= STATISTIQUES =========
function updateStats() {
  const totalCA = ventes.reduce((s,v) => s + v.montant, 0);
  const totalSalesEl = document.getElementById('totalSales');
  if(totalSalesEl) totalSalesEl.innerText = totalCA.toFixed(2);
  
  const totalOrdersEl = document.getElementById('totalOrders');
  if(totalOrdersEl) totalOrdersEl.innerText = ventes.length;
  
  const totalProfit = produits.reduce((s,p) => s + ((p.prixPromo > 0 ? p.prixPromo : p.prixVente) - p.prixAchat) * (p.quantiteVendue || 0), 0);
  const totalProfitEl = document.getElementById('totalProfit');
  if(totalProfitEl) totalProfitEl.innerText = totalProfit.toFixed(2);
}

// ========= UTILITAIRES =========
function escapeHtml(str) { 
  if(!str) return ''; 
  return str.replace(/[&<>]/g, function(m) { 
    if(m==='&') return '&amp;'; 
    if(m==='<') return '&lt;'; 
    if(m==='>') return '&gt;'; 
    return m; 
  }); 
}

function seedDemoData() {
  if(users.length === 0) { 
    users.push({ username: 'admin', password: 'admin', role: 'admin', dateCreation: getNowDateTime() }); 
    users.push({ username: 'caissier', password: 'caissier', role: 'caissier', dateCreation: getNowDateTime() }); 
    saveUsersToLocal(); 
  }
  
  if(categories.length === 0) { 
    const now = getNowDateTime(); 
    categories.push({ id: 1, icon: '🍔', nom: 'Burgers', description: 'Nos meilleurs burgers', dateCreation: now }); 
    categories.push({ id: 2, icon: '🍗', nom: 'Poulets', description: 'Poulets grillés', dateCreation: now }); 
    categories.push({ id: 3, icon: '🍟', nom: 'Accompagnements', description: 'Frites, sauces', dateCreation: now }); 
    categories.push({ id: 4, icon: '🥤', nom: 'Boissons', description: 'Boissons fraîches', dateCreation: now }); 
    saveCategoriesToLocal(); 
  }
  
  if(produits.length === 0) { 
    const now = getNowDateTime();
    produits.push({ id:1, nom:'Poulet Grillé', categorieId:2, prixAchat:25, prixVente:45, prixPromo:0, stock:100, quantiteVendue:0, tempsPreparation:10, disponibilite:'disponible', description:'Poulet mariné grillé', dateCreation:now });
    produits.push({ id:2, nom:'Tacos Mixte', categorieId:1, prixAchat:18, prixVente:35, prixPromo:0, stock:100, quantiteVendue:0, tempsPreparation:8, disponibilite:'disponible', description:'Tacos sauce blanche', dateCreation:now });
    produits.push({ id:3, nom:'Frites Maison', categorieId:3, prixAchat:5, prixVente:15, prixPromo:12, stock:200, quantiteVendue:0, tempsPreparation:5, disponibilite:'disponible', description:'Frites fraîches', dateCreation:now });
    produits.push({ id:4, nom:'Coca-Cola', categorieId:4, prixAchat:3, prixVente:8, prixPromo:0, stock:500, quantiteVendue:0, tempsPreparation:1, disponibilite:'disponible', description:'Canette 33cl', dateCreation:now });
    saveProduitsToLocal();
  }
}

function showToastMessage(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#22c55e;color:white;padding:12px 20px;border-radius:8px;z-index:10000;font-weight:bold;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ========= COMMANDE EN LIGNE AVEC FIREBASE =========
async function chargerCategoriesEnLigne() {
  const container = document.getElementById('onlineCategoriesTabs');
  if(!container) return;
  
  let categoriesData = [];
  
  // Essayer de charger depuis Firebase en priorité
  if (typeof window.getCategoriesForOnlineMenu === 'function') {
    try {
      categoriesData = await window.getCategoriesForOnlineMenu();
      if (categoriesData.length > 0) {
        console.log(`📦 ${categoriesData.length} catégories depuis Firebase pour le menu`);
      }
    } catch(e) {
      console.error("Erreur chargement catégories Firebase:", e);
    }
  }
  
  // Fallback localStorage
  if (categoriesData.length === 0) {
    categoriesData = categories;
  }
  
  let html = `<button class="cat-btn ${currentOnlineCategory === 'all' ? 'active' : ''}" onclick="filtrerProduitsEnLigne('all')">
    <span style="font-size:1.2rem;">🍽️</span> Tout
  </button>`;
  
  categoriesData.forEach(cat => {
    const iconDisplay = cat.icon ? 
      (cat.icon.startsWith('data:image') || cat.icon.startsWith('http') ? 
        `<img src="${cat.icon}" style="width:20px;height:20px;object-fit:contain;">` : 
        cat.icon) : '📁';
    html += `<button class="cat-btn ${currentOnlineCategory === cat.id ? 'active' : ''}" onclick="filtrerProduitsEnLigne(${cat.id})">
      <span style="font-size:1.2rem;">${iconDisplay}</span> ${escapeHtml(cat.nom)}
    </button>`;
  });
  
  container.innerHTML = html;
}

async function chargerProduitsEnLigne() {
  const container = document.getElementById('onlineProductsGrid');
  if(!container) return;
  
  container.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Chargement des produits...</div>';
  
  let produitsDisponibles = [];
  
  // Essayer de charger depuis Firebase en priorité
  if (typeof window.getProductsForOnlineMenu === 'function') {
    try {
      const firebaseProducts = await window.getProductsForOnlineMenu();
      produitsDisponibles = firebaseProducts.filter(p => p.disponibilite === 'disponible');
      if (produitsDisponibles.length > 0) {
        console.log(`📦 ${produitsDisponibles.length} produits depuis Firebase pour le menu`);
      }
    } catch(e) {
      console.error("Erreur chargement Firebase pour menu:", e);
    }
  }
  
  // Fallback localStorage
  if (produitsDisponibles.length === 0) {
    produitsDisponibles = produits.filter(p => p.disponibilite === 'disponible');
  }
  
  // Filtrer par catégorie
  let filtered = produitsDisponibles;
  if(currentOnlineCategory !== 'all') {
    filtered = filtered.filter(p => p.categorieId === currentOnlineCategory);
  }
  
  if(filtered.length === 0) { 
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">🍽️ Aucun produit disponible dans cette catégorie</div>'; 
    return; 
  }
  
  container.innerHTML = filtered.map(p => {
    const prix = p.prixPromo > 0 ? p.prixPromo : p.prixVente;
    const imageHtml = p.image ? 
      `<img src="${p.image}" alt="${escapeHtml(p.nom)}" style="width:60px;height:60px;object-fit:cover;border-radius:12px;" onerror="this.style.display='none'">` :
      `<div style="width:60px;height:60px;background:#f1f5f9;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;">🍔</div>`;
    
    return `
      <div class="online-product-card" onclick="ajouterAuPanierEnLigne(${p.id}, '${escapeHtml(p.nom)}', ${prix})">
        <div class="online-product-image">
          ${imageHtml}
        </div>
        <div class="online-product-info">
          <div class="online-product-title">${escapeHtml(p.nom)}</div>
          ${p.prixPromo > 0 ? 
            `<div style="display:flex;gap:8px;align-items:center;">
              <span style="text-decoration:line-through;color:#94a3b8;font-size:0.7rem;">${p.prixVente.toFixed(2)} MAD</span>
              <span class="online-product-price">${p.prixPromo.toFixed(2)} MAD</span>
            </div>` : 
            `<span class="online-product-price">${prix.toFixed(2)} MAD</span>`
          }
          <button class="online-add-btn">+ Ajouter</button>
        </div>
      </div>
    `;
  }).join('');
}

function filtrerProduitsEnLigne(catId) {
  currentOnlineCategory = catId;
  chargerProduitsEnLigne();
  chargerCategoriesEnLigne();
}

function ajouterAuPanierEnLigne(id, nom, prix) {
  const existing = onlineCart.find(item => item.id === id);
  if(existing) {
    existing.quantite++;
  } else {
    onlineCart.push({ id, nom, prix, quantite: 1 });
  }
  afficherPanierEnLigne();
  showToastMessage(`${nom} ajouté au panier !`);
}

function afficherPanierEnLigne() {
  const container = document.getElementById('onlineCartList');
  let total = 0;
  
  if(onlineCart.length === 0) { 
    if(container) container.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Votre panier est vide</p></div>'; 
    const totalSpan = document.getElementById('onlineCartTotal');
    if(totalSpan) totalSpan.innerText = '0.00 MAD';
    return; 
  }
  
  if(container) {
    container.innerHTML = onlineCart.map((item, idx) => {
      total += item.prix * item.quantite;
      return `
        <div class="online-cart-item">
          <div class="online-cart-item-info">
            <div class="online-cart-item-name">${escapeHtml(item.nom)}</div>
            <div class="online-cart-item-price">${item.prix.toFixed(2)} MAD</div>
          </div>
          <div class="online-cart-item-actions">
            <button class="quantity-btn" onclick="modifierQuantiteEnLigne(${idx}, -1)">-</button>
            <span class="online-cart-quantite">${item.quantite}</span>
            <button class="quantity-btn" onclick="modifierQuantiteEnLigne(${idx}, 1)">+</button>
            <button class="remove-btn" onclick="supprimerDuPanierEnLigne(${idx})">🗑️</button>
          </div>
          <div class="online-cart-item-total">${(item.prix * item.quantite).toFixed(2)} MAD</div>
        </div>
      `;
    }).join('');
  }
  
  const totalSpan = document.getElementById('onlineCartTotal');
  if(totalSpan) totalSpan.innerText = total.toFixed(2) + ' MAD';
}

function modifierQuantiteEnLigne(index, delta) {
  if(onlineCart[index].quantite + delta <= 0) {
    onlineCart.splice(index,1);
  } else {
    onlineCart[index].quantite += delta;
  }
  afficherPanierEnLigne();
}

function supprimerDuPanierEnLigne(index) { 
  onlineCart.splice(index,1); 
  afficherPanierEnLigne(); 
}

async function openOnlineOrderModal() {
  const modal = document.getElementById('onlineOrderModal');
  if(modal) modal.classList.remove('hidden');
  
  // Recharger les produits depuis Firebase à chaque ouverture
  await chargerCategoriesEnLigne();
  await chargerProduitsEnLigne();
  afficherPanierEnLigne();
}

function closeOnlineOrderModal() {
  const modal = document.getElementById('onlineOrderModal');
  if(modal) modal.classList.add('hidden');
}

function openCommandesEnLigneList() {
  const modal = document.getElementById('commandesEnLigneListModal');
  if(modal) modal.classList.remove('hidden');
  afficherCommandesEnLigneList();
}

function closeCommandesEnLigneList() {
  const modal = document.getElementById('commandesEnLigneListModal');
  if(modal) modal.classList.add('hidden');
}

async function validerCommandeEnLigne() {
  const clientName = document.getElementById('onlineClientName')?.value.trim();
  const clientPhone = document.getElementById('onlineClientPhone')?.value.trim();
  
  if(onlineCart.length === 0) {
    alert("Votre panier est vide !");
    return;
  }
  
  if(!clientName) {
    alert("Veuillez entrer votre nom");
    return;
  }
  
  const commandeData = {
    numero: `CMD-${Date.now().toString().slice(-6)}`,
    client: clientName,
    telephone: clientPhone || '',
    items: onlineCart.map(item => ({
      productId: item.id,
      name: item.nom,
      price: item.prix,
      quantite: item.quantite,
      total: item.prix * item.quantite
    })),
    total: onlineCart.reduce((sum, item) => sum + (item.prix * item.quantite), 0),
    statut: 'en_attente',
    date: new Date().toLocaleString()
  };
  
  if (typeof window.saveOnlineOrderToFirebase === 'function') {
    try {
      const firebaseId = await window.saveOnlineOrderToFirebase(commandeData);
      if (firebaseId) {
        console.log("✅ Commande enregistrée dans Firebase");
      }
    } catch(e) {
      console.error("❌ Erreur Firebase:", e);
    }
  }
  
  let commandesEnLigne = JSON.parse(localStorage.getItem('chickenway_commandes_en_ligne') || '[]');
  commandesEnLigne.push(commandeData);
  localStorage.setItem('chickenway_commandes_en_ligne', JSON.stringify(commandesEnLigne));
  
  let recap = `✅ Commande confirmée !\n\n`;
  recap += `📋 Numéro: ${commandeData.numero}\n`;
  recap += `👤 Client: ${clientName}\n`;
  recap += `📅 Date: ${commandeData.date}\n`;
  recap += `💰 Total: ${commandeData.total.toFixed(2)} MAD\n\n`;
  recap += `⏳ Votre commande sera préparée dans quelques minutes.`;
  
  alert(recap);
  
  onlineCart = [];
  if(document.getElementById('onlineClientName')) document.getElementById('onlineClientName').value = '';
  if(document.getElementById('onlineClientPhone')) document.getElementById('onlineClientPhone').value = '';
  afficherPanierEnLigne();
  closeOnlineOrderModal();
  
  mettreAJourBadgeCommandes();
}

async function afficherCommandesEnLigneList() {
  const container = document.getElementById('commandesEnLigneListContainer');
  if(!container) return;
  
  container.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Chargement des commandes...</div>';
  
  let commandesEnAttente = [];
  
  if (typeof window.loadOnlineOrdersFromFirebase === 'function') {
    try {
      commandesEnAttente = await window.loadOnlineOrdersFromFirebase();
      console.log(`📦 ${commandesEnAttente.length} commandes depuis Firebase`);
    } catch(e) {
      console.error("Erreur chargement Firebase:", e);
    }
  }
  
  if (commandesEnAttente.length === 0) {
    const commandes = JSON.parse(localStorage.getItem('chickenway_commandes_en_ligne') || '[]');
    commandesEnAttente = commandes.filter(c => c.statut === 'en_attente');
  }
  
  if(commandesEnAttente.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">🎉 Aucune commande en attente</div>';
    return;
  }
  
  container.innerHTML = commandesEnAttente.map(cmd => {
    const cmdId = cmd.id || cmd.firestoreId || cmd.numero;
    return `
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:12px;margin-bottom:15px;padding:15px;">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:10px;">
          <div>
            <strong>📱 ${cmd.numero}</strong>
            <div style="font-size:0.8rem;color:#64748b;">👤 ${escapeHtml(cmd.client)}</div>
            <div style="font-size:0.7rem;color:#64748b;">📅 ${cmd.date}</div>
            ${cmd.telephone ? `<div style="font-size:0.7rem;color:#64748b;">📞 ${escapeHtml(cmd.telephone)}</div>` : ''}
          </div>
          <span style="background:#f59e0b;padding:4px 12px;border-radius:20px;color:white;font-size:0.75rem;">⏳ En attente</span>
        </div>
        <div style="margin:12px 0;padding:10px 0;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
          ${cmd.items.map(item => `
            <div style="display:flex;justify-content:space-between;padding:6px 0;">
              <div>
                <strong>${escapeHtml(item.name)}</strong>
                <div style="font-size:0.65rem;color:#64748b;">${item.quantite}x ${item.price.toFixed(2)} MAD</div>
              </div>
              <span style="font-weight:600;color:#e67e22;">${(item.price * item.quantite).toFixed(2)} MAD</span>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <strong>Total: ${cmd.total.toFixed(2)} MAD</strong>
          <div style="display:flex;gap:8px;">
            <button onclick="accepterCommandeEnLigne('${cmdId}')" style="background:#22c55e;border:none;padding:8px 20px;border-radius:8px;color:white;cursor:pointer;">
              ✅ Accepter
            </button>
            <button onclick="ajouterCommandeAuPanierPOS('${cmdId}')" style="background:#8b5cf6;border:none;padding:8px 20px;border-radius:8px;color:white;cursor:pointer;">
              🛒 Ajouter au panier
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}

async function accepterCommandeEnLigne(id) {
  if (typeof window.updateOrderStatusInFirebase === 'function') {
    try {
      await window.updateOrderStatusInFirebase(id, 'terminee');
    } catch(e) {
      console.error("Erreur mise à jour Firebase:", e);
    }
  }
  
  let commandes = JSON.parse(localStorage.getItem('chickenway_commandes_en_ligne') || '[]');
  commandes = commandes.map(c => {
    if (c.id === id || c.firestoreId === id || c.numero === id) {
      return { ...c, statut: 'terminee' };
    }
    return c;
  });
  localStorage.setItem('chickenway_commandes_en_ligne', JSON.stringify(commandes));
  
  await afficherCommandesEnLigneList();
  mettreAJourBadgeCommandes();
  showToastMessage(`✅ Commande acceptée !`);
}

async function ajouterCommandeAuPanierPOS(id) {
  let commande = null;
  
  if (typeof window.getAllOnlineOrders === 'function') {
    try {
      const allOrders = await window.getAllOnlineOrders();
      commande = allOrders.find(c => c.id === id || c.firestoreId === id || c.numero === id);
    } catch(e) {
      console.error("Erreur recherche Firebase:", e);
    }
  }
  
  if (!commande) {
    const commandes = JSON.parse(localStorage.getItem('chickenway_commandes_en_ligne') || '[]');
    commande = commandes.find(c => c.id === id || c.firestoreId === id || c.numero === id);
  }
  
  if (commande && commande.items) {
    commande.items.forEach(item => {
      for(let i = 0; i < item.quantite; i++) {
        cart.push({ 
          name: item.name, 
          price: item.price, 
          optionsText: '',
          options: {}
        });
      }
    });
    
    refreshCartDisplay();
    await accepterCommandeEnLigne(commande.id || commande.firestoreId || commande.numero);
    showToastMessage(`🛒 Article(s) ajouté(s) au panier POS`);
    showPage('pos');
    closeCommandesEnLigneList();
  }
}

function mettreAJourBadgeCommandes() {
  const commandes = JSON.parse(localStorage.getItem('chickenway_commandes_en_ligne') || '[]');
  const enAttente = commandes.filter(c => c.statut === 'en_attente').length;
  const badge = document.getElementById('notifBadge');
  if(badge) badge.textContent = enAttente;
}

// ========= FONCTIONS DE TRI =========
function updateSortIndicatorsVentes() {
    document.querySelectorAll('#ventesPage .sortable .sort-icon').forEach(icon => icon.innerHTML = '');
    const sortIcon = document.querySelector(`#ventesPage .sortable[data-sort="${sortColumnVentes}"] .sort-icon`);
    if(sortIcon) sortIcon.innerHTML = sortDirectionVentes === 'desc' ? ' ↓' : ' ↑';
}

function sortVentesByColumn(column) {
    if(sortColumnVentes === column) {
        sortDirectionVentes = sortDirectionVentes === 'desc' ? 'asc' : 'desc';
    } else {
        sortColumnVentes = column;
        sortDirectionVentes = 'desc';
    }
    renderVentesHistory();
    updateSortIndicatorsVentes();
}

function updateSortIndicatorsCredits() {
    document.querySelectorAll('#creditsPage .sortable .sort-icon').forEach(icon => icon.innerHTML = '');
    const sortIcon = document.querySelector(`#creditsPage .sortable[data-sort="${sortColumnCredits}"] .sort-icon`);
    if(sortIcon) sortIcon.innerHTML = sortDirectionCredits === 'desc' ? ' ↓' : ' ↑';
}

function sortCreditsByColumn(column) {
    if(sortColumnCredits === column) {
        sortDirectionCredits = sortDirectionCredits === 'desc' ? 'asc' : 'desc';
    } else {
        sortColumnCredits = column;
        sortDirectionCredits = 'desc';
    }
    renderCreditsTable();
    updateSortIndicatorsCredits();
}

function updateSortIndicatorsDepenses() {
    document.querySelectorAll('#depensesPage .sortable .sort-icon').forEach(icon => icon.innerHTML = '');
    const sortIcon = document.querySelector(`#depensesPage .sortable[data-sort="${sortColumnDepenses}"] .sort-icon`);
    if(sortIcon) sortIcon.innerHTML = sortDirectionDepenses === 'desc' ? ' ↓' : ' ↑';
}

function sortDepensesByColumn(column) {
    if(sortColumnDepenses === column) {
        sortDirectionDepenses = sortDirectionDepenses === 'desc' ? 'asc' : 'desc';
    } else {
        sortColumnDepenses = column;
        sortDirectionDepenses = 'desc';
    }
    renderDepensesTable();
    updateSortIndicatorsDepenses();
}

// ========= INITIALISATION =========
document.addEventListener('DOMContentLoaded', async function() {
  console.log("🚀 Initialisation de l'application...");
  
  loadAllData();
  seedDemoData();
  
  // Attendre que Firebase soit prêt
  if (typeof window.mergeProductsFromFirebase === 'function') {
    await window.mergeProductsFromFirebase();
  }
  
  renderAllTables();
  
  if (typeof window.listenToOnlineOrders === 'function') {
      window.listenToOnlineOrders((orders) => {
          console.log(`📢 ${orders.length} commandes en attente (temps réel)`);
          const badge = document.getElementById('notifBadge');
          if (badge) {
              badge.textContent = orders.length;
          }
          const modal = document.getElementById('commandesEnLigneListModal');
          if (modal && !modal.classList.contains('hidden')) {
              afficherCommandesEnLigneList();
          }
      });
      console.log("🔔 Écoute Firebase démarrée");
  }
  
  const sidebarNav = document.querySelector('.sidebar-nav ul');
  if(sidebarNav && !document.getElementById('openCommandesBtn')) {
    const li = document.createElement('li');
    li.innerHTML = `<button id="openCommandesBtn" onclick="openCommandesEnLigneList()" style="background: #e67e22; color: white; border: none; padding: 10px 15px; border-radius: 8px; width: 100%; text-align: left; cursor: pointer; margin-bottom: 10px;">
      <i class="fas fa-bell"></i> 📱 Commandes en ligne
      <span id="notifBadge" style="background:#ef4444; padding: 2px 8px; border-radius: 20px; margin-left: 10px; font-size: 0.7rem;">0</span>
    </button>`;
    sidebarNav.insertBefore(li, sidebarNav.firstChild);
  }
  
  mettreAJourBadgeCommandes();
  setInterval(mettreAJourBadgeCommandes, 5000);
  setInterval(forceSaveAllData, 10000);
  
  console.log("✅ Application prête !");
});

// ========= CLIENTS (Fonctions minimales - à remplacer par vos fonctions existantes) =========
function openClientModal(edit, client) { alert("Fonction client à implémenter"); }
function closeClientModal() {}
function saveClient() {}
function editClient(id) {}
function deleteClient(id) {}
function renderClientsTable() { const tbody = document.getElementById('clientsList'); if(tbody) tbody.innerHTML = '<td><td colspan="10">Clients</td></tr>'; }

// ========= FOURNISSEURS (Fonctions minimales) =========
function openFournisseurModal(edit, fournisseur) { alert("Fonction fournisseur à implémenter"); }
function closeFournisseurModal() {}
function saveFournisseur() {}
function editFournisseur(id) {}
function deleteFournisseur(id) {}
function renderFournisseursTable() { const tbody = document.getElementById('fournisseursList'); if(tbody) tbody.innerHTML = '<td><td colspan="10">Fournisseurs</td></tr>'; }

// ========= CLIENTS (Version complète - à conserver) =========
// Si vous avez des fonctions client complètes, remplacez les fonctions minimales ci-dessus par vos fonctions existantes.

// Exposer toutes les fonctions globalement
window.openOnlineOrderModal = openOnlineOrderModal;
window.closeOnlineOrderModal = closeOnlineOrderModal;
window.openCommandesEnLigneList = openCommandesEnLigneList;
window.closeCommandesEnLigneList = closeCommandesEnLigneList;
window.filtrerProduitsEnLigne = filtrerProduitsEnLigne;
window.ajouterAuPanierEnLigne = ajouterAuPanierEnLigne;
window.modifierQuantiteEnLigne = modifierQuantiteEnLigne;
window.supprimerDuPanierEnLigne = supprimerDuPanierEnLigne;
window.validerCommandeEnLigne = validerCommandeEnLigne;
window.accepterCommandeEnLigne = accepterCommandeEnLigne;
window.ajouterCommandeAuPanierPOS = ajouterCommandeAuPanierPOS;
window.afficherCommandesEnLigneList = afficherCommandesEnLigneList;
window.mettreAJourBadgeCommandes = mettreAJourBadgeCommandes;
window.showPage = showPage;
window.login = login;
window.logout = logout;
window.showRegister = showRegister;
window.showLogin = showLogin;
window.register = register;
window.openProductOptions = openProductOptions;
window.closeProductOptionsModal = closeProductOptionsModal;
window.confirmAddToCart = confirmAddToCart;
window.removeCartItem = removeCartItem;
window.clearCart = clearCart;
window.openPaymentModal = openPaymentModal;
window.closePaymentModal = closePaymentModal;
window.searchClients = searchClients;
window.selectClient = selectClient;
window.calculatePayment = calculatePayment;
window.confirmPayment = confirmPayment;
window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.saveCategory = saveCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.switchCategoryIconMode = switchCategoryIconMode;
window.setCategoryEmoji = setCategoryEmoji;
window.handleCategoryIconFileSelect = handleCategoryIconFileSelect;
window.removeCategoryIconFile = removeCategoryIconFile;
window.switchProductImageMode = switchProductImageMode;
window.handleProductImageFileSelect = handleProductImageFileSelect;
window.removeProductImageFile = removeProductImageFile;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.calculateProfit = calculateProfit;
window.openClientModal = openClientModal;
window.closeClientModal = closeClientModal;
window.saveClient = saveClient;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.openFournisseurModal = openFournisseurModal;
window.closeFournisseurModal = closeFournisseurModal;
window.saveFournisseur = saveFournisseur;
window.editFournisseur = editFournisseur;
window.deleteFournisseur = deleteFournisseur;
window.viewVente = viewVente;
window.payCredit = payCredit;
window.openDepenseModal = openDepenseModal;
window.closeDepenseModal = closeDepenseModal;
window.saveDepense = saveDepense;
window.editDepense = editDepense;
window.deleteDepense = deleteDepense;
window.sortVentesByColumn = sortVentesByColumn;
window.sortCreditsByColumn = sortCreditsByColumn;
window.sortDepensesByColumn = sortDepensesByColumn;
window.filterPOSProducts = filterPOSProducts;
window.loadPOSCategories = loadPOSCategories;
window.chargerCategoriesEnLigne = chargerCategoriesEnLigne;
window.chargerProduitsEnLigne = chargerProduitsEnLigne;
window.afficherPanierEnLigne = afficherPanierEnLigne;
window.refreshCartDisplay = refreshCartDisplay;
window.updateStats = updateStats;
window.renderAllTables = renderAllTables;
window.renderCategoriesTable = renderCategoriesTable;
window.renderProductsTable = renderProductsTable;
window.renderClientsTable = renderClientsTable;
window.renderFournisseursTable = renderFournisseursTable;
window.renderDepensesTable = renderDepensesTable;
window.renderCreditsTable = renderCreditsTable;
window.renderVentesHistory = renderVentesHistory;
window.forceSaveAllData = forceSaveAllData;
window.sauvegarderDansLocalStorage = sauvegarderDansLocalStorage;
window.getNowDateTime = getNowDateTime;
window.escapeHtml = escapeHtml;
window.showToastMessage = showToastMessage;

console.log("✅ script.js chargé avec succès - Synchronisation Firebase activée !");
