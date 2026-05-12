// ==================== CLIENT ====================
var clientCart = [];
var clientCategoriesList = [];
var clientProductsList = [];
var clientSelectedCategory = 'all';

function clientNavigate(page) {
    var items = document.querySelectorAll('#clientPage .nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    
    if (page === 'commander' && items[0]) {
        items[0].classList.add('active');
    } else if (page === 'historique' && items[1]) {
        items[1].classList.add('active');
    } else if (items[2]) {
        items[2].classList.add('active');
    }
    
    var title = page === 'commander' ? 'Commander' : page === 'historique' ? 'Historique' : 'Parametres';
    document.getElementById('clientPageTitle').textContent = title;
    
    if (page === 'commander') {
        loadClientCommanderPage();
    } else if (page === 'historique') {
        loadClientHistoriquePage();
    } else if (page === 'parametres') {
        loadClientParametresPage();
    }
}

// ==================== PAGE COMMANDER (COMME UN POS CLIENT) ====================
async function loadClientCommanderPage() {
    var content = document.getElementById('clientDynamicContent');
    if (!content) return;
    
    clientCart = [];
    clientSelectedCategory = 'all';
    
    // Charger catégories et produits
    try {
        var catSnap = await db.collection('categories').get();
        clientCategoriesList = [];
        catSnap.forEach(function(doc) {
            clientCategoriesList.push({id: doc.id, nom: doc.data().nom, imageBase64: doc.data().imageBase64});
        });
        
        var prodSnap = await db.collection('products').get();
        clientProductsList = [];
        prodSnap.forEach(function(doc) {
            var d = doc.data();
            if (d.disponible !== false) {
                clientProductsList.push({
                    id: doc.id, nom: d.nom,
                    prixVente: d.prixVente || 0,
                    prixPromo: d.prixPromo || 0,
                    stock: d.stock,
                    categorie: d.categorie || '',
                    imageBase64: d.imageBase64 || ''
                });
            }
        });
    } catch(e) {
        console.error('Erreur chargement:', e);
    }
    
    renderClientPOS();
}

function renderClientPOS() {
    var content = document.getElementById('clientDynamicContent');
    if (!content) return;
    
    var total = clientCalculateTotal();
    
    var html = '<div class="pos-container">';
    
    // Colonne gauche - Produits
    html += '<div class="pos-products-panel">';
    html += '<div class="pos-categories-bar">';
    html += '<button class="pos-cat-btn ' + (clientSelectedCategory === 'all' ? 'active' : '') + '" onclick="clientFilterCategory(\'all\')"><i class="fas fa-th-large"></i> Tous</button>';
    
    for (var i = 0; i < clientCategoriesList.length; i++) {
        var cat = clientCategoriesList[i];
        var activeClass = clientSelectedCategory === cat.nom ? 'active' : '';
        var iconHtml = cat.imageBase64 ? '<img src="' + cat.imageBase64 + '" alt="' + cat.nom + '">' : '<i class="fas fa-folder"></i>';
        html += '<button class="pos-cat-btn ' + activeClass + '" onclick="clientFilterCategory(\'' + cat.nom.replace(/'/g, "\\'") + '\')">' + iconHtml + ' ' + cat.nom + '</button>';
    }
    html += '</div>';
    
    // Grille produits
    html += '<div class="pos-products-grid">';
    var filtered = clientProductsList;
    if (clientSelectedCategory !== 'all') {
        filtered = clientProductsList.filter(function(p) { return p.categorie === clientSelectedCategory; });
    }
    
    if (filtered.length === 0) {
        html += '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8;">Aucun produit dans cette categorie</div>';
    } else {
        for (var j = 0; j < filtered.length; j++) {
            var p = filtered[j];
            var price = p.prixPromo && p.prixPromo > 0 ? p.prixPromo : p.prixVente;
            var hasPromo = p.prixPromo && p.prixPromo > 0;
            var stockClass = '', stockText = '';
            if (p.stock !== undefined) {
                if (p.stock <= 0) { stockClass = 'pos-out-of-stock'; stockText = ' (Rupture)'; }
                else if (p.stock <= 5) { stockText = ' (' + p.stock + ' rest.)'; }
            }
            
            html += '<div class="pos-product-card ' + stockClass + '" onclick="clientAddToCart(\'' + p.id + '\')">';
            if (p.imageBase64) {
                html += '<div class="pos-product-img"><img src="' + p.imageBase64 + '" alt="' + p.nom + '"></div>';
            } else {
                html += '<div class="pos-product-img pos-product-placeholder"><i class="fas fa-utensils"></i></div>';
            }
            html += '<div class="pos-product-info">';
            html += '<span class="pos-product-name">' + p.nom + stockText + '</span>';
            html += '<span class="pos-product-price">';
            if (hasPromo) {
                html += '<span class="pos-old-price">' + p.prixVente.toFixed(2) + '</span> ';
                html += '<span class="pos-promo-price">' + price.toFixed(2) + ' MAD</span>';
            } else {
                html += price.toFixed(2) + ' MAD';
            }
            html += '</span></div></div>';
        }
    }
    html += '</div></div>';
    
    // Colonne droite - Panier
    html += '<div class="pos-cart-panel">';
    html += '<div class="pos-cart-header">';
    html += '<h3><i class="fas fa-shopping-cart"></i> Mon Panier <span class="pos-cart-badge">' + clientCart.length + '</span></h3>';
    html += '<button class="pos-clear-btn" onclick="clientClearCart()"><i class="fas fa-trash-alt"></i> Vider</button>';
    html += '</div>';
    
    html += '<div class="pos-cart-items">';
    if (clientCart.length === 0) {
        html += '<div class="pos-cart-empty"><i class="fas fa-shopping-basket"></i><p>Panier vide</p><span>Ajoutez des produits</span></div>';
    } else {
        for (var k = 0; k < clientCart.length; k++) {
            var it = clientCart[k];
            html += '<div class="pos-cart-item">';
            html += '<div class="pos-cart-item-info"><span class="pos-cart-item-name">' + it.nom + '</span><span class="pos-cart-item-price">' + it.prixUnitaire.toFixed(2) + ' MAD/u</span></div>';
            html += '<div class="pos-cart-item-actions">';
            html += '<button class="pos-qty-btn" onclick="clientUpdateQty(' + k + ',-1)"><i class="fas fa-minus"></i></button>';
            html += '<span class="pos-qty-value">' + it.quantite + '</span>';
            html += '<button class="pos-qty-btn" onclick="clientUpdateQty(' + k + ',1)"><i class="fas fa-plus"></i></button>';
            html += '<button class="pos-remove-btn" onclick="clientRemoveItem(' + k + ')"><i class="fas fa-times"></i></button>';
            html += '</div>';
            html += '<span class="pos-cart-item-total">' + (it.prixUnitaire * it.quantite).toFixed(2) + ' MAD</span>';
            html += '</div>';
        }
    }
    html += '</div>';
    
    html += '<div class="pos-cart-footer">';
    html += '<div class="pos-cart-total-row"><span>Total</span><span>' + total.toFixed(2) + ' MAD</span></div>';
    html += '<button class="pos-validate-btn" onclick="clientValidateOrder()" ' + (clientCart.length === 0 ? 'disabled' : '') + '>';
    html += '<i class="fas fa-check-circle"></i> Commander</button>';
    html += '</div>';
    
    html += '</div></div>';
    
    content.innerHTML = html;
}

function clientFilterCategory(cat) {
    clientSelectedCategory = cat;
    renderClientPOS();
}

function clientAddToCart(pid) {
    var p = clientProductsList.find(function(x) { return x.id === pid; });
    if (!p) return;
    if (p.stock !== undefined && p.stock <= 0) { alert('Produit en rupture de stock'); return; }
    
    var ex = clientCart.find(function(x) { return x.id === pid; });
    if (ex) {
        if (p.stock !== undefined && ex.quantite >= p.stock) { alert('Stock insuffisant'); return; }
        ex.quantite += 1;
    } else {
        var pr = p.prixPromo && p.prixPromo > 0 ? p.prixPromo : p.prixVente;
        clientCart.push({id: p.id, nom: p.nom, prixUnitaire: pr, quantite: 1, categorie: p.categorie || ''});
    }
    renderClientPOS();
}

function clientUpdateQty(i, ch) {
    var it = clientCart[i];
    if (!it) return;
    var p = clientProductsList.find(function(x) { return x.id === it.id; });
    var nq = it.quantite + ch;
    if (nq <= 0) { clientCart.splice(i, 1); }
    else {
        if (p && p.stock !== undefined && nq > p.stock) { alert('Stock max: ' + p.stock); return; }
        it.quantite = nq;
    }
    renderClientPOS();
}

function clientRemoveItem(i) { clientCart.splice(i, 1); renderClientPOS(); }

function clientCalculateTotal() {
    var t = 0;
    for (var i = 0; i < clientCart.length; i++) { t += clientCart[i].prixUnitaire * clientCart[i].quantite; }
    return t;
}

function clientClearCart() { clientCart = []; renderClientPOS(); }

async function clientValidateOrder() {
    if (clientCart.length === 0) { alert('Votre panier est vide'); return; }
    
    var total = clientCalculateTotal();
    var userData = window.currentUserData ? window.currentUserData.userData : {};
    
    try {
        // Enregistrer dans la collection "commandes"
        await db.collection('commandes').add({
            items: JSON.parse(JSON.stringify(clientCart)),
            total: total,
            clientId: window.currentUserData ? window.currentUserData.uid : null,
            clientName: userData.prenom + ' ' + userData.nom,
            clientEmail: userData.email,
            clientTelephone: userData.telephone,
            statut: 'en_attente',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: 'client'
        });
        
        alert('Commande envoyee avec succes !\n\nTotal: ' + total.toFixed(2) + ' MAD\n\nVotre commande est en attente de validation par le restaurant.');
        clientCart = [];
        renderClientPOS();
    } catch(e) {
        console.error('Erreur commande:', e);
        alert('Erreur lors de l\'envoi de la commande: ' + e.message);
    }
}

// ==================== PAGE HISTORIQUE ====================
async function loadClientHistoriquePage() {
    var content = document.getElementById('clientDynamicContent');
    if (!content) return;
    
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-history"></i> Mes commandes</h3></div><div id="clientOrdersList">Chargement...</div></div>';
    
    if (!window.currentUserData) {
        document.getElementById('clientOrdersList').innerHTML = '<p style="text-align:center;padding:40px;">Non connecte</p>';
        return;
    }
    
    var userId = window.currentUserData.uid;
    
    try {
        var snapshot = await db.collection('commandes')
            .where('clientId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        
        var container = document.getElementById('clientOrdersList');
        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center;padding:40px;color:#94a3b8;">Aucune commande</p>';
            return;
        }
        
        var html = '<div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Articles</th><th>Total</th><th>Statut</th></tr></thead><tbody>';
        snapshot.forEach(function(doc) {
            var d = doc.data();
            var date = d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleString('fr-FR') : 'N/A';
            var articles = d.items ? d.items.length : 0;
            var statutColor = d.statut === 'valide' ? '#16a34a' : d.statut === 'en_attente' ? '#d97706' : '#94a3b8';
            var statutLabel = d.statut === 'valide' ? 'Validée' : d.statut === 'en_attente' ? 'En attente' : d.statut || 'Inconnu';
            html += '<tr><td>' + date + '</td><td>' + articles + '</td><td><strong>' + d.total.toFixed(2) + ' MAD</strong></td><td><span style="color:' + statutColor + ';font-weight:600;">' + statutLabel + '</span></td></tr>';
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
    } catch(e) {
        document.getElementById('clientOrdersList').innerHTML = '<p style="text-align:center;padding:40px;color:#ef4444;">Erreur de chargement</p>';
    }
}

function loadClientParametresPage() {
    var content = document.getElementById('clientDynamicContent');
    if (!content) return;
    var u = window.currentUserData ? window.currentUserData.userData : {};
    content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-cog"></i> Parametres</h3></div><div style="padding:20px;"><p><strong>Nom:</strong> ' + u.nom + '</p><p><strong>Prenom:</strong> ' + u.prenom + '</p><p><strong>Email:</strong> ' + u.email + '</p><p><strong>Telephone:</strong> ' + (u.telephone || '-') + '</p><p><strong>Username:</strong> @' + u.username + '</p></div></div>';
}

console.log('Client JS OK');
