// ==================== MENU TACTILE CLIENT (QR CODE TABLE) ====================
var menuTableNum = null;
var menuCart = [];
var menuCategories = [];
var menuProducts = [];
var menuSelectedCategory = 'all';
var menuCurrentProductId = null;

// Listes d'options
var menuSauces = ['Ketchup','Sauce Hot','Cheezy','Sauce Burger','Algérienne','Barbecue','Mayonnaise','Harissa','Samouraï','Andalouse'];
var menuInterdits = ['Oignon','Tomate','Cornichon','Olive','Fromage','Salade'];
var menuEpices = ['Normal','Moins épicé','Très épicé','Sans épice'];
var menuSel = ['Normal','Moins de sel','Sans sel'];

// ==================== INITIALISATION ====================
function initMenuTactile(tableNum) {
    menuTableNum = tableNum;
    console.log('🍽️ Menu tactile - Table', tableNum);
    
    if (typeof db === 'undefined') {
        console.log('⏳ Attente Firebase...');
        setTimeout(function() { initMenuTactile(tableNum); }, 500);
        return;
    }
    
    loadMenuData();
}

// ==================== CHARGEMENT DEPUIS FIREBASE ====================
async function loadMenuData() {
    try {
        var content = document.getElementById('menuTactileContent');
        if (content) {
            content.innerHTML = '<div style="text-align:center;padding:60px 20px;">' +
                '<i class="fas fa-spinner fa-spin" style="font-size:3rem;color:#f39c12;"></i>' +
                '<p style="margin-top:15px;color:#64748b;font-weight:500;">Chargement du menu...</p>' +
                '</div>';
        }

        // Charger les catégories
        var catSnap = await db.collection('categories').get();
        menuCategories = [];
        catSnap.forEach(function(d) {
            menuCategories.push({
                id: d.id,
                nom: d.data().nom || 'Sans nom',
                imageBase64: d.data().imageBase64 || ''
            });
        });
        console.log('✅ Catégories chargées:', menuCategories.length);

        // Charger les produits disponibles
        var prodSnap = await db.collection('products').get();
        menuProducts = [];
        prodSnap.forEach(function(d) {
            var dd = d.data();
            if (dd.disponible !== false) {
                menuProducts.push({
                    id: d.id,
                    nom: dd.nom || 'Sans nom',
                    prixVente: dd.prixVente || 0,
                    prixPromo: dd.prixPromo || 0,
                    stock: dd.stock,
                    categorie: dd.categorie || '',
                    description: dd.description || '',
                    imageBase64: dd.imageBase64 || ''
                });
            }
        });
        console.log('✅ Produits chargés:', menuProducts.length);

        renderMenuTactile();
        
    } catch(e) {
        console.error('❌ Erreur:', e);
        var content = document.getElementById('menuTactileContent');
        if (content) {
            content.innerHTML = '<div style="text-align:center;padding:50px 20px;">' +
                '<i class="fas fa-exclamation-circle" style="font-size:3rem;color:#ef4444;"></i>' +
                '<p style="margin-top:15px;color:#ef4444;font-weight:600;">Erreur de chargement</p>' +
                '<p style="color:#64748b;font-size:0.85rem;">' + e.message + '</p>' +
                '<button onclick="loadMenuData()" style="margin-top:20px;padding:12px 30px;background:#f39c12;color:#fff;border:none;border-radius:12px;font-weight:700;font-size:0.9rem;cursor:pointer;">🔄 Réessayer</button>' +
                '</div>';
        }
    }
}

// ==================== RENDU PRINCIPAL ====================
function renderMenuTactile() {
    var content = document.getElementById('menuTactileContent');
    if (!content) return;
    
    var total = menuCalcTotal();
    var html = '';
    
    // ========== EN-TÊTE AVEC LOGO CENTRÉ ==========
    html += '<div style="text-align:center;padding:25px 15px 20px 15px;background:linear-gradient(135deg,#f39c12,#e67e22);color:#fff;border-radius:0 0 24px 24px;margin-bottom:15px;box-shadow:0 4px 20px rgba(0,0,0,0.15);display:flex;flex-direction:column;align-items:center;justify-content:center;">';
    
    // Logo centré dans son conteneur
    html += '<div style="display:flex;justify-content:center;align-items:center;width:100%;margin-bottom:12px;">';
    html += '<img src="logo.png" alt="Chicken Way" style="width:80px;height:80px;border-radius:50%;border:4px solid #fff;box-shadow:0 4px 15px rgba(0,0,0,0.3);object-fit:cover;background:#fff;display:block;" onerror="this.style.display=\'none\'">';
    html += '</div>';
    
    html += '<h1 style="margin:0;font-size:1.5rem;font-weight:800;">Chicken <span style="color:#fff;">Way</span></h1>';
    html += '<p style="margin:8px 0 0 0;font-size:0.9rem;opacity:0.9;">🍽️ Table n° ' + menuTableNum + '</p>';
    html += '</div>';
    
    // ========== BARRE DE CATÉGORIES ==========
    html += '<div style="overflow-x:auto;white-space:nowrap;padding:10px;-webkit-overflow-scrolling:touch;margin-bottom:10px;">';
    html += '<button onclick="menuFilterCategory(\'all\')" style="display:inline-block;padding:10px 18px;margin:0 4px;border:2px solid ' + (menuSelectedCategory === 'all' ? '#f39c12' : '#e2e8f0') + ';border-radius:50px;background:' + (menuSelectedCategory === 'all' ? '#f39c12' : '#fff') + ';color:' + (menuSelectedCategory === 'all' ? '#fff' : '#1e293b') + ';font-weight:600;font-size:0.85rem;cursor:pointer;">📋 Tous</button>';
    
    for (var i = 0; i < menuCategories.length; i++) {
        var cat = menuCategories[i];
        var isActive = menuSelectedCategory === cat.nom;
        var catIcon = cat.imageBase64 ? '<img src="' + cat.imageBase64 + '" style="width:18px;height:18px;border-radius:4px;vertical-align:middle;margin-right:4px;object-fit:cover;">' : '📁 ';
        html += '<button onclick="menuFilterCategory(\'' + cat.nom.replace(/'/g, "\\'") + '\')" style="display:inline-block;padding:10px 18px;margin:0 4px;border:2px solid ' + (isActive ? '#f39c12' : '#e2e8f0') + ';border-radius:50px;background:' + (isActive ? '#f39c12' : '#fff') + ';color:' + (isActive ? '#fff' : '#1e293b') + ';font-weight:600;font-size:0.85rem;cursor:pointer;">' + catIcon + ' ' + cat.nom + '</button>';
    }
    html += '</div>';
    
    // ========== GRILLE DE PRODUITS ==========
    var filtered = menuProducts;
    if (menuSelectedCategory !== 'all') {
        filtered = menuProducts.filter(function(p) { return p.categorie === menuSelectedCategory; });
    }
    
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:10px;">';
    
    if (filtered.length === 0) {
        html += '<div style="grid-column:1/-1;text-align:center;padding:30px;color:#94a3b8;">Aucun produit dans cette catégorie</div>';
    } else {
        for (var j = 0; j < filtered.length; j++) {
            var p = filtered[j];
            var price = p.prixPromo && p.prixPromo > 0 ? p.prixPromo : p.prixVente;
            var hasPromo = p.prixPromo && p.prixPromo > 0;
            var outOfStock = p.stock !== undefined && p.stock <= 0;
            var lowStock = p.stock !== undefined && p.stock > 0 && p.stock <= 5;
            
            html += '<div onclick="' + (outOfStock ? '' : 'menuOpenOptions(\'' + p.id + '\')') + '" style="background:#fff;border:2px solid ' + (outOfStock ? '#fecaca' : '#e2e8f0') + ';border-radius:16px;padding:12px;cursor:' + (outOfStock ? 'not-allowed' : 'pointer') + ';opacity:' + (outOfStock ? '0.5' : '1') + ';text-align:center;">';
            
            // Image produit
            if (p.imageBase64) {
                html += '<div style="width:100%;height:100px;border-radius:12px;overflow:hidden;margin-bottom:8px;background:#f1f5f9;"><img src="' + p.imageBase64 + '" alt="' + p.nom + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML=\'<div style=width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;>🍗</div>\'"></div>';
            } else {
                html += '<div style="width:100%;height:100px;border-radius:12px;margin-bottom:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:2.5rem;">🍗</div>';
            }
            
            // Nom
            html += '<div style="font-weight:600;font-size:0.85rem;color:#1e293b;margin-bottom:4px;">' + p.nom + '</div>';
            
            // Prix
            html += '<div style="font-weight:700;font-size:0.9rem;">';
            if (hasPromo) {
                html += '<span style="text-decoration:line-through;color:#94a3b8;font-size:0.7rem;">' + p.prixVente.toFixed(2) + '</span> ';
                html += '<span style="color:#dc2626;">' + price.toFixed(2) + ' MAD</span>';
            } else {
                html += '<span style="color:#e67e22;">' + price.toFixed(2) + ' MAD</span>';
            }
            html += '</div>';
            
            // Stock
            if (outOfStock) {
                html += '<div style="font-size:0.65rem;color:#ef4444;margin-top:4px;">⚠️ Rupture</div>';
            } else if (lowStock) {
                html += '<div style="font-size:0.65rem;color:#d97706;margin-top:4px;">⚠️ Plus que ' + p.stock + '</div>';
            }
            
            html += '</div>';
        }
    }
    html += '</div>';
    
    // ========== PANIER STICKY ==========
    html += '<div style="position:sticky;bottom:0;background:#fff;padding:15px;border-radius:20px 20px 0 0;box-shadow:0 -4px 20px rgba(0,0,0,0.1);margin-top:10px;">';
    
    // Titre panier
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">';
    html += '<strong>🛒 Mon panier</strong>';
    html += '<span style="background:#f39c12;color:#fff;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">' + menuCart.length + ' article(s)</span>';
    html += '</div>';
    
    if (menuCart.length === 0) {
        html += '<p style="color:#94a3b8;text-align:center;margin:10px 0;font-size:0.85rem;">👆 Appuyez sur un produit pour l\'ajouter</p>';
    } else {
        // Liste des articles
        html += '<div style="max-height:150px;overflow-y:auto;margin-bottom:10px;">';
        for (var k = 0; k < menuCart.length; k++) {
            var it = menuCart[k];
            var opts = '';
            if (it.sauces && it.sauces.length > 0) opts += ' 🥫';
            if (it.interdits && it.interdits.length > 0) opts += ' 🚫';
            if (it.epice && it.epice !== 'Normal') opts += ' 🌶️';
            if (it.sel && it.sel !== 'Normal') opts += ' 🧂';
            
            html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:0.85rem;">';
            html += '<span>' + it.quantite + 'x ' + it.nom + ' <span style="font-size:0.65rem;color:#64748b;">' + opts + '</span></span>';
            html += '<div style="display:flex;align-items:center;gap:8px;">';
            html += '<button onclick="menuUpdateQty(' + k + ',-1)" style="width:24px;height:24px;border-radius:50%;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font-size:0.7rem;display:flex;align-items:center;justify-content:center;">−</button>';
            html += '<span style="font-weight:600;min-width:20px;text-align:center;">' + it.quantite + '</span>';
            html += '<button onclick="menuUpdateQty(' + k + ',1)" style="width:24px;height:24px;border-radius:50%;border:1px solid #e2e8f0;background:#fff;cursor:pointer;font-size:0.7rem;display:flex;align-items:center;justify-content:center;">+</button>';
            html += '<span style="font-weight:600;color:#e67e22;min-width:60px;text-align:right;">' + (it.prixUnitaire * it.quantite).toFixed(2) + ' MAD</span>';
            html += '</div>';
            html += '</div>';
        }
        html += '</div>';
    }
    
    // Total
    html += '<div style="display:flex;justify-content:space-between;font-weight:700;font-size:1.1rem;margin-bottom:10px;padding-top:8px;border-top:2px solid #f1f5f9;">';
    html += '<span>Total</span>';
    html += '<span style="color:#e67e22;">' + total.toFixed(2) + ' MAD</span>';
    html += '</div>';
    
    // Bouton Commander
    html += '<button onclick="menuValiderCommande()" ' + (menuCart.length === 0 ? 'disabled' : '') + ' style="width:100%;padding:14px;border:none;border-radius:12px;background:' + (menuCart.length === 0 ? '#cbd5e1' : 'linear-gradient(135deg,#f39c12,#e67e22)') + ';color:#fff;font-weight:700;font-size:1rem;cursor:' + (menuCart.length === 0 ? 'not-allowed' : 'pointer') + ';">';
    html += '✅ Commander</button>';
    
    // Bouton vider
    if (menuCart.length > 0) {
        html += '<button onclick="menuClearCart()" style="width:100%;padding:10px;margin-top:8px;border:2px solid #e2e8f0;border-radius:12px;background:#fff;color:#64748b;font-size:0.85rem;cursor:pointer;">🗑️ Vider le panier</button>';
    }
    
    html += '</div>';
    
    content.innerHTML = html;
}

// ==================== FONCTIONS ====================
function menuFilterCategory(cat) { 
    menuSelectedCategory = cat; 
    renderMenuTactile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function menuOpenOptions(pid) {
    var p = menuProducts.find(function(x) { return x.id === pid; });
    if (!p) return;
    if (p.stock !== undefined && p.stock <= 0) { alert('⚠️ Rupture de stock.'); return; }
    menuCurrentProductId = pid;
    
    var h = '<h4>' + p.nom + '</h4>';
    
    // Sauces
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🥫 Sauces :</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    menuSauces.forEach(function(s) {
        h += '<label style="display:flex;align-items:center;gap:4px;padding:6px 10px;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;font-size:0.8rem;"><input type="checkbox" class="menu-sauce-check" value="' + s + '"> ' + s + '</label>';
    });
    h += '</div></div>';
    
    // Interdits
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🚫 Interdits :</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    menuInterdits.forEach(function(s) {
        h += '<label style="display:flex;align-items:center;gap:4px;padding:6px 10px;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;font-size:0.8rem;"><input type="checkbox" class="menu-interdit-check" value="' + s + '"> ' + s + '</label>';
    });
    h += '</div></div>';
    
    // Épices
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🌶️ Épices :</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    menuEpices.forEach(function(s, idx) {
        h += '<label style="display:flex;align-items:center;gap:4px;padding:6px 10px;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;font-size:0.8rem;"><input type="radio" name="menu-epice" value="' + s + '" ' + (idx === 0 ? 'checked' : '') + '> ' + s + '</label>';
    });
    h += '</div></div>';
    
    // Sel
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;display:block;margin-bottom:5px;">🧂 Sel :</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    menuSel.forEach(function(s, idx) {
        h += '<label style="display:flex;align-items:center;gap:4px;padding:6px 10px;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;font-size:0.8rem;"><input type="radio" name="menu-sel" value="' + s + '" ' + (idx === 0 ? 'checked' : '') + '> ' + s + '</label>';
    });
    h += '</div></div>';
    
    h += '<div style="text-align:right;margin-top:15px;">';
    h += '<button class="btn-cancel" onclick="closeModal()" style="float:none;margin-right:8px;">Annuler</button>';
    h += '<button class="btn-save" onclick="menuConfirmOptions()" style="float:none;">Ajouter au panier</button>';
    h += '</div>';
    
    openModal('Personnaliser - ' + p.nom, h);
}

function menuConfirmOptions() {
    var sauces = []; document.querySelectorAll('.menu-sauce-check:checked').forEach(function(cb) { sauces.push(cb.value); });
    var interdits = []; document.querySelectorAll('.menu-interdit-check:checked').forEach(function(cb) { interdits.push(cb.value); });
    var epice = document.querySelector('input[name="menu-epice"]:checked'); epice = epice ? epice.value : 'Normal';
    var sel = document.querySelector('input[name="menu-sel"]:checked'); sel = sel ? sel.value : 'Normal';
    
    var p = menuProducts.find(function(x) { return x.id === menuCurrentProductId; });
    if (!p) { closeModal(); return; }
    
    var ex = menuCart.find(function(x) { return x.id === menuCurrentProductId; });
    if (ex) {
        if (p.stock !== undefined && ex.quantite >= p.stock) { alert('⚠️ Stock insuffisant'); closeModal(); return; }
        ex.quantite += 1;
    } else {
        var price = p.prixPromo && p.prixPromo > 0 ? p.prixPromo : p.prixVente;
        menuCart.push({
            id: p.id, nom: p.nom, prixUnitaire: price, quantite: 1,
            sauces: sauces, interdits: interdits, epice: epice, sel: sel
        });
    }
    
    closeModal();
    renderMenuTactile();
    
    // Animation panier
    setTimeout(function() {
        var cart = document.querySelector('[style*="sticky"]');
        if (cart) { cart.style.transform = 'scale(1.03)'; setTimeout(function() { cart.style.transform = 'scale(1)'; }, 150); }
    }, 100);
}

function menuUpdateQty(index, change) {
    var item = menuCart[index]; if (!item) return;
    var p = menuProducts.find(function(x) { return x.id === item.id; });
    var newQty = item.quantite + change;
    if (newQty <= 0) { menuCart.splice(index, 1); }
    else { if (p && p.stock !== undefined && newQty > p.stock) { alert('⚠️ Stock max: ' + p.stock); return; } item.quantite = newQty; }
    renderMenuTactile();
}

function menuClearCart() { if (confirm('Vider votre panier ?')) { menuCart = []; renderMenuTactile(); } }
function menuCalcTotal() { var t = 0; for (var i = 0; i < menuCart.length; i++) t += menuCart[i].prixUnitaire * menuCart[i].quantite; return t; }

async function menuValiderCommande() {
    if (menuCart.length === 0) { alert('⚠️ Panier vide.'); return; }
    var total = menuCalcTotal();
    if (!confirm('📋 Confirmer votre commande ?\n\n🍽️ Table n° ' + menuTableNum + '\n📦 ' + menuCart.length + ' article(s)\n💰 Total : ' + total.toFixed(2) + ' MAD\n\nVotre commande sera envoyée en cuisine.')) return;
    
    try {
        await db.collection('commandes').add({
            items: JSON.parse(JSON.stringify(menuCart)),
            total: total,
            table: menuTableNum,
            clientName: 'Table ' + menuTableNum,
            statut: 'en_attente',
            source: 'menu_tactile',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('✅ Commande envoyée avec succès !\n\n🍽️ Table n° ' + menuTableNum + '\n💰 Total : ' + total.toFixed(2) + ' MAD\n\nVotre commande est en cours de préparation.\nBon appétit ! 🎉');
        menuCart = [];
        renderMenuTactile();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(e) {
        console.error('❌ Erreur:', e);
        alert('❌ Erreur lors de l\'envoi de la commande.\nVeuillez réessayer.');
    }
}

console.log('🍽️ Menu Tactile Chicken Way - Prêt');
