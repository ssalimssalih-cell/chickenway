// ==================== MENU TACTILE CLIENT (QR CODE TABLE) ====================
var menuTableNum = null;
var menuCart = [];
var menuCategories = [];
var menuProducts = [];
var menuSelectedCategory = 'all';
var menuCurrentProductId = null;

var menuSauces = ['Ketchup','Sauce Hot','Cheezy','Sauce Burger','Algérienne','Barbecue','Mayonnaise','Harissa','Samouraï','Andalouse'];
var menuInterdits = ['Oignon','Tomate','Cornichon','Olive','Fromage','Salade'];
var menuEpices = ['Normal','Moins épicé','Très épicé','Sans épice'];
var menuSel = ['Normal','Moins de sel','Sans sel'];

// ==================== PLEIN ÉCRAN FORCÉ POUR IOS ====================
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function hideAddressBar() {
    // Force le scroll en haut pour cacher la barre d'adresse
    window.scrollTo(0, 1);
}

function fixLayoutForIOS() {
    if (!isIOS()) return;

    // Appliquer les styles à la page complète
    const page = document.getElementById('menuTactilePage');
    if (page) {
        page.style.position = 'fixed';
        page.style.top = '0';
        page.style.left = '0';
        page.style.width = '100%';
        page.style.height = '100%';
        page.style.overflow = 'hidden';
        page.style.backgroundColor = '#f8fafc';
    }

    // Conteneur principal défilable
    const container = document.getElementById('menuTactileContent');
    if (container) {
        container.style.overflowY = 'auto';
        container.style.webkitOverflowScrolling = 'touch';
        container.style.height = '100%';
        container.style.position = 'relative';
    }

    // Cacher la barre d'adresse immédiatement et à chaque réorientation
    hideAddressBar();
    window.addEventListener('resize', () => setTimeout(hideAddressBar, 50));
    window.addEventListener('orientationchange', () => setTimeout(hideAddressBar, 50));
    
    // Petit délai pour être sûr que la hauteur est recalculée
    setTimeout(hideAddressBar, 100);
}

// ==================== FERMETURE ====================
function closeMenuTactile() {
    window.location.href = window.location.pathname;
}

// ==================== INITIALISATION ====================
function initMenuTactile(tableNum) {
    menuTableNum = tableNum;
    console.log('🍽️ Menu tactile - Table', tableNum);
    
    // Appliquer la correction de mise en page pour iOS
    fixLayoutForIOS();
    
    if (typeof db === 'undefined' || typeof CacheDB === 'undefined') {
        setTimeout(() => initMenuTactile(tableNum), 500);
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
                '<p style="margin-top:15px;">Chargement du menu...</p>' +
                '</div>';
        }

        var catSnap = await db.collection('categories').get();
        menuCategories = [];
        catSnap.forEach(d => {
            menuCategories.push({
                id: d.id,
                nom: d.data().nom || 'Sans nom',
                imageBase64: d.data().imageBase64 || ''
            });
        });

        var prodSnap = await db.collection('products').get();
        menuProducts = [];
        prodSnap.forEach(d => {
            var dd = d.data();
            if (dd.disponible !== false) {
                menuProducts.push({
                    id: d.id,
                    nom: dd.nom || 'Sans nom',
                    prixVente: dd.prixVente || 0,
                    prixPromo: dd.prixPromo || 0,
                    stock: dd.stock,
                    categorie: dd.categorie || '',
                    imageBase64: dd.imageBase64 || ''
                });
            }
        });

        renderMenuTactile();
        // Re-cacher la barre après l'affichage du contenu
        hideAddressBar();
    } catch(e) {
        console.error(e);
        var content = document.getElementById('menuTactileContent');
        if (content) {
            content.innerHTML = '<div style="text-align:center;padding:50px;"><i class="fas fa-exclamation-circle" style="font-size:3rem;color:#ef4444;"></i><p>Erreur de chargement</p><button onclick="loadMenuData()" style="padding:10px 20px;background:#f39c12;border:none;border-radius:8px;">Réessayer</button></div>';
        }
    }
}

// ==================== RENDU PRINCIPAL ====================
function renderMenuTactile() {
    var content = document.getElementById('menuTactileContent');
    if (!content) return;
    
    var total = menuCalcTotal();
    var html = '';
    
    // En-tête avec bouton X
    html += '<div style="position:relative; text-align:center; padding:25px 15px 20px 15px; background:linear-gradient(135deg,#f39c12,#e67e22); color:#fff; border-radius:0 0 24px 24px; margin-bottom:15px;">';
    html += '<button onclick="closeMenuTactile()" style="position:absolute; top:10px; right:15px; background:rgba(0,0,0,0.3); border:none; color:white; font-size:1.8rem; cursor:pointer; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; z-index:10;">&times;</button>';
    html += '<div style="display:flex; justify-content:center; margin-bottom:12px;"><img src="logo.png" style="width:80px; height:80px; border-radius:50%; border:4px solid #fff; object-fit:cover;"></div>';
    html += '<h1 style="margin:0; font-size:1.5rem;">Chicken <span style="color:#fff;">Way</span></h1>';
    html += '<p style="margin:8px 0 0;">🍽️ Table n° ' + menuTableNum + '</p>';
    html += '</div>';
    
    // Barre de catégories
    html += '<div style="overflow-x:auto; white-space:nowrap; padding:10px; -webkit-overflow-scrolling:touch;">';
    html += '<button onclick="menuFilterCategory(\'all\')" style="display:inline-block; padding:10px 18px; margin:0 4px; border-radius:50px; border:2px solid ' + (menuSelectedCategory==='all'?'#f39c12':'#e2e8f0') + '; background:' + (menuSelectedCategory==='all'?'#f39c12':'#fff') + '; color:' + (menuSelectedCategory==='all'?'#fff':'#1e293b') + '; font-weight:600;">📋 Tous</button>';
    for (var i=0; i<menuCategories.length; i++) {
        var cat = menuCategories[i];
        var active = menuSelectedCategory === cat.nom;
        html += '<button onclick="menuFilterCategory(\''+cat.nom.replace(/'/g,"\\'")+'\')" style="display:inline-block; padding:10px 18px; margin:0 4px; border-radius:50px; border:2px solid '+(active?'#f39c12':'#e2e8f0')+'; background:'+(active?'#f39c12':'#fff')+'; color:'+(active?'#fff':'#1e293b')+'; font-weight:600;">'+cat.nom+'</button>';
    }
    html += '</div>';
    
    // Grille produits
    var filtered = menuProducts;
    if (menuSelectedCategory !== 'all') filtered = menuProducts.filter(p => p.categorie === menuSelectedCategory);
    html += '<div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:10px; padding:10px;">';
    if (filtered.length === 0) {
        html += '<div style="grid-column:1/-1; text-align:center; padding:30px;">Aucun produit dans cette catégorie</div>';
    } else {
        for (var j=0; j<filtered.length; j++) {
            var p = filtered[j];
            var price = (p.prixPromo && p.prixPromo>0) ? p.prixPromo : p.prixVente;
            var outOfStock = p.stock !== undefined && p.stock <= 0;
            html += '<div onclick="'+(outOfStock?'':'menuOpenOptions(\''+p.id+'\')')+'" style="background:#fff; border:2px solid '+(outOfStock?'#fecaca':'#e2e8f0')+'; border-radius:16px; padding:12px; cursor:'+(outOfStock?'not-allowed':'pointer')+'; opacity:'+(outOfStock?'0.5':'1')+'; text-align:center;">';
            if (p.imageBase64) html += '<div style="height:100px; border-radius:12px; overflow:hidden; margin-bottom:8px;"><img src="'+p.imageBase64+'" style="width:100%; height:100%; object-fit:cover;"></div>';
            else html += '<div style="height:100px; border-radius:12px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; font-size:2rem;">🍗</div>';
            html += '<div style="font-weight:600; margin:4px 0;">'+p.nom+'</div>';
            html += '<div style="font-weight:700; color:#e67e22;">'+price.toFixed(2)+' MAD</div>';
            if (outOfStock) html += '<div style="font-size:0.7rem; color:#ef4444;">⚠️ Rupture</div>';
            html += '</div>';
        }
    }
    html += '</div>';
    
    // Panier sticky
    html += '<div style="position:sticky; bottom:0; background:#fff; padding:15px; border-radius:20px 20px 0 0; box-shadow:0 -4px 20px rgba(0,0,0,0.1); margin-top:10px;">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;"><strong>🛒 Mon panier</strong><span style="background:#f39c12; color:#fff; padding:3px 10px; border-radius:20px;">'+menuCart.length+' article(s)</span></div>';
    if (menuCart.length === 0) {
        html += '<p style="text-align:center; color:#94a3b8; margin:10px 0;">👆 Appuyez sur un produit pour ajouter</p>';
    } else {
        html += '<div style="max-height:150px; overflow-y:auto; margin-bottom:10px;">';
        for (var k=0; k<menuCart.length; k++) {
            var it = menuCart[k];
            html += '<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid #f1f5f9;">';
            html += '<span style="flex:2;">'+it.quantite+'x '+it.nom+'</span>';
            html += '<div style="display:flex; align-items:center; gap:8px;">';
            html += '<button onclick="menuUpdateQty('+k+',-1)" style="width:26px;height:26px;border-radius:50%; border:1px solid #e2e8f0; background:#fff;">-</button>';
            html += '<span style="min-width:24px; text-align:center;">'+it.quantite+'</span>';
            html += '<button onclick="menuUpdateQty('+k+',1)" style="width:26px;height:26px;border-radius:50%; border:1px solid #e2e8f0; background:#fff;">+</button>';
            html += '<span style="min-width:65px; text-align:right; font-weight:600;">'+(it.prixUnitaire*it.quantite).toFixed(2)+' MAD</span>';
            html += '</div></div>';
        }
        html += '</div>';
    }
    html += '<div style="display:flex; justify-content:space-between; font-weight:700; font-size:1.1rem; margin-bottom:10px;"><span>Total</span><span style="color:#e67e22;">'+total.toFixed(2)+' MAD</span></div>';
    html += '<button onclick="menuValiderCommande()" '+(menuCart.length===0?'disabled':'')+' style="width:100%; padding:12px; border:none; border-radius:12px; background:'+(menuCart.length===0?'#cbd5e1':'linear-gradient(135deg,#f39c12,#e67e22)')+'; color:#fff; font-weight:700; font-size:1rem;">✅ Commander</button>';
    if (menuCart.length>0) html += '<button onclick="menuClearCart()" style="width:100%; margin-top:8px; padding:8px; border:2px solid #e2e8f0; border-radius:12px; background:#fff; color:#64748b;">🗑️ Vider le panier</button>';
    html += '</div>';
    
    content.innerHTML = html;
}

// ==================== FONCTIONS UTILITAIRES ====================
function menuFilterCategory(cat) {
    menuSelectedCategory = cat;
    renderMenuTactile();
    // Forcer le scroll en haut après avoir changé de catégorie
    window.scrollTo(0, 1);
}

function menuUpdateQty(idx, delta) {
    if (!menuCart[idx]) return;
    var newQ = menuCart[idx].quantite + delta;
    if (newQ <= 0) menuCart.splice(idx,1);
    else menuCart[idx].quantite = newQ;
    renderMenuTactile();
}

function menuClearCart() {
    if (confirm('Vider votre panier ?')) {
        menuCart = [];
        renderMenuTactile();
    }
}

function menuCalcTotal() {
    return menuCart.reduce((sum, item) => sum + (item.prixUnitaire * item.quantite), 0);
}

// ==================== OPTIONS PRODUITS ====================
function menuOpenOptions(pid) {
    var p = menuProducts.find(x => x.id === pid);
    if (!p) return;
    if (p.stock !== undefined && p.stock <= 0) {
        alert('⚠️ Rupture de stock.');
        return;
    }
    menuCurrentProductId = pid;
    var h = '<h4>'+p.nom+'</h4>';
    
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;">🥫 Sauces :</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    menuSauces.forEach(s => {
        h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;"><input type="checkbox" class="menu-sauce-check" value="'+s+'"> '+s+'</label>';
    });
    h += '</div></div>';
    
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;">🚫 Interdits :</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    menuInterdits.forEach(s => {
        h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;"><input type="checkbox" class="menu-interdit-check" value="'+s+'"> '+s+'</label>';
    });
    h += '</div></div>';
    
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;">🌶️ Épices :</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    menuEpices.forEach((s, idx) => {
        h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;"><input type="radio" name="menu-epice" value="'+s+'" '+(idx===0?'checked':'')+'> '+s+'</label>';
    });
    h += '</div></div>';
    
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;">🧂 Sel :</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    menuSel.forEach((s, idx) => {
        h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;"><input type="radio" name="menu-sel" value="'+s+'" '+(idx===0?'checked':'')+'> '+s+'</label>';
    });
    h += '</div></div>';
    
    h += '<div style="text-align:right; margin-top:15px;"><button class="btn-cancel" onclick="closeModal()">Annuler</button> <button class="btn-save" onclick="menuConfirmOptions()">Ajouter</button></div>';
    openModal('Personnaliser - '+p.nom, h);
}

function menuConfirmOptions() {
    var sauces = Array.from(document.querySelectorAll('.menu-sauce-check:checked')).map(cb => cb.value);
    var interdits = Array.from(document.querySelectorAll('.menu-interdit-check:checked')).map(cb => cb.value);
    var epice = document.querySelector('input[name="menu-epice"]:checked')?.value || 'Normal';
    var sel = document.querySelector('input[name="menu-sel"]:checked')?.value || 'Normal';
    var p = menuProducts.find(x => x.id === menuCurrentProductId);
    if (!p) { closeModal(); return; }
    
    var existing = menuCart.find(x => x.id === p.id);
    if (existing) {
        if (p.stock !== undefined && existing.quantite >= p.stock) {
            alert('Stock insuffisant');
            closeModal();
            return;
        }
        existing.quantite++;
    } else {
        var price = (p.prixPromo && p.prixPromo > 0) ? p.prixPromo : p.prixVente;
        menuCart.push({
            id: p.id,
            nom: p.nom,
            prixUnitaire: price,
            quantite: 1,
            sauces: sauces,
            interdits: interdits,
            epice: epice,
            sel: sel
        });
    }
    closeModal();
    renderMenuTactile();
    setTimeout(() => {
        var cart = document.querySelector('[style*="sticky"]');
        if (cart) cart.style.transform = 'scale(1.02)';
        setTimeout(() => { if (cart) cart.style.transform = ''; }, 150);
    }, 50);
}

// ==================== VALIDATION COMMANDE ====================
async function menuValiderCommande() {
    if (menuCart.length === 0) {
        alert('⚠️ Panier vide.');
        return;
    }
    var total = menuCalcTotal();
    if (!confirm('📋 Confirmer votre commande ?\n\n🍽️ Table n° '+menuTableNum+'\n📦 '+menuCart.length+' article(s)\n💰 Total : '+total.toFixed(2)+' MAD\n\nVotre commande sera envoyée en cuisine.')) return;
    
    try {
        await db.collection('commandes').add({
            items: JSON.parse(JSON.stringify(menuCart)),
            total: total,
            table: menuTableNum,
            clientName: 'Table '+menuTableNum,
            statut: 'en_attente',
            source: 'menu_tactile',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('✅ Commande envoyée avec succès !\n\n🍽️ Table n° '+menuTableNum+'\n💰 Total : '+total.toFixed(2)+' MAD\n\nVotre commande est en cours de préparation.\nBon appétit ! 🎉');
        menuCart = [];
        renderMenuTactile();
        window.scrollTo(0, 1);
    } catch(e) {
        console.error(e);
        alert('❌ Erreur lors de l\'envoi de la commande.\nVeuillez réessayer.');
    }
}

console.log('🍽️ Menu tactile - Technique plein écran forcée iOS (fix position)');
