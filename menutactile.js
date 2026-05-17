// ==================== MENU TACTILE CLIENT (QR CODE TABLE) ====================
var menuTableNum = null;        // numéro de table (depuis l'URL)
var menuCart = [];              // panier local
var menuCategories = [];        // catégories chargées
var menuProducts = [];          // produits disponibles
var menuSelectedCategory = 'all';
var menuCurrentProductId = null;

// Listes d'options (reprises du POS)
var menuSauces = ['Ketchup','Sauce Hot','Cheezy','Sauce Burger','Algérienne','Barbecue','Mayonnaise','Harissa','Samouraï','Andalouse'];
var menuInterdits = ['Oignon','Tomate','Cornichon','Olive','Fromage','Salade'];
var menuEpices = ['Normal','Moins épicé','Très épicé','Sans épice'];
var menuSel = ['Normal','Moins de sel','Sans sel'];

// Initialisation depuis l'URL
function initMenuTactile(tableNum) {
    menuTableNum = tableNum;
    console.log('Menu tactile activé pour la table', tableNum);
    loadMenuData();
}

async function loadMenuData() {
    try {
        var catSnap = await db.collection('categories').get();
        menuCategories = [];
        catSnap.forEach(function(d) { menuCategories.push({id:d.id, nom:d.data().nom, imageBase64:d.data().imageBase64}); });

        var prodSnap = await db.collection('products').get();
        menuProducts = [];
        prodSnap.forEach(function(d) {
            var dd = d.data();
            if (dd.disponible !== false) {
                menuProducts.push({
                    id: d.id,
                    nom: dd.nom,
                    prixVente: dd.prixVente||0,
                    prixPromo: dd.prixPromo||0,
                    stock: dd.stock,
                    categorie: dd.categorie||'',
                    imageBase64: dd.imageBase64||''
                });
            }
        });
    } catch(e) { console.error('Erreur chargement menu tactile', e); }
    renderMenuTactile();
}

// Rendu de l'interface menu tactile (plein écran, mobile first)
function renderMenuTactile() {
    var content = document.getElementById('menuTactileContent');
    if (!content) return;
    var total = menuCalcTotal();
    var h = '<div style="max-width:800px;margin:0 auto;padding:10px;">';
    // En-tête
    h += '<div style="text-align:center;margin-bottom:15px;">';
    h += '<h2 style="color:#f39c12;margin:0;">🐔 Chicken Way</h2>';
    h += '<p style="color:#64748b;font-size:0.9rem;">Table n° ' + menuTableNum + '</p>';
    h += '</div>';

    // Barre de catégories (scroll horizontal)
    h += '<div class="pos-categories-bar" style="justify-content:center;">';
    h += '<button class="pos-cat-btn '+(menuSelectedCategory==='all'?'active':'')+'" onclick="menuFilterCategory(\'all\')"><i class="fas fa-th-large"></i> Tous</button>';
    for (var i=0; i<menuCategories.length; i++) {
        var cat = menuCategories[i];
        var ac = menuSelectedCategory===cat.nom?'active':'';
        var ih = cat.imageBase64?'<img src="'+cat.imageBase64+'" alt="">':'<i class="fas fa-folder"></i>';
        h += '<button class="pos-cat-btn '+ac+'" onclick="menuFilterCategory(\''+cat.nom.replace(/'/g,"\\'")+'\')">'+ih+' '+cat.nom+'</button>';
    }
    h += '</div>';

    // Grille produits
    h += '<div class="pos-products-grid" style="max-height:50vh;overflow-y:auto;">';
    var filtered = menuProducts;
    if (menuSelectedCategory!=='all') filtered = menuProducts.filter(function(p){return p.categorie===menuSelectedCategory;});
    if (filtered.length===0) {
        h += '<div style="grid-column:1/-1;text-align:center;padding:20px;">Aucun produit</div>';
    } else {
        for (var j=0; j<filtered.length; j++) {
            var p = filtered[j];
            var price = p.prixPromo&&p.prixPromo>0?p.prixPromo:p.prixVente;
            var hasPromo = p.prixPromo&&p.prixPromo>0;
            var sc='', st='';
            if (p.stock!==undefined) {
                if (p.stock<=0) { sc='pos-out-of-stock'; st=' (Rupture)'; }
                else if (p.stock<=5) { st=' ('+p.stock+' rest.)'; }
            }
            h += '<div class="pos-product-card '+sc+'" onclick="menuOpenOptions(\''+p.id+'\')">';
            if (p.imageBase64) h += '<div class="pos-product-img"><img src="'+p.imageBase64+'" alt=""></div>';
            else h += '<div class="pos-product-img pos-product-placeholder"><i class="fas fa-utensils"></i></div>';
            h += '<div class="pos-product-info"><span class="pos-product-name">'+p.nom+st+'</span><span class="pos-product-price">';
            if (hasPromo) h += '<span class="pos-old-price">'+p.prixVente.toFixed(2)+'</span> <span class="pos-promo-price">'+price.toFixed(2)+' MAD</span>';
            else h += price.toFixed(2)+' MAD';
            h += '</span></div></div>';
        }
    }
    h += '</div>';

    // Panier (toujours visible en bas)
    h += '<div style="position:sticky;bottom:0;background:#fff;padding:10px;border-radius:16px;box-shadow:0 -4px 12px rgba(0,0,0,0.1);margin-top:10px;">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
    h += '<strong>Mon panier</strong> <span class="pos-cart-badge">'+menuCart.length+' article(s)</span>';
    h += '</div>';
    if (menuCart.length===0) {
        h += '<p style="color:#94a3b8;text-align:center;margin:5px 0;">Appuyez sur un produit pour l\'ajouter</p>';
    } else {
        for (var k=0; k<menuCart.length; k++) {
            var it = menuCart[k];
            var opts = '';
            if (it.sauces&&it.sauces.length>0) opts += ' <span style="color:#f39c12;font-size:0.65rem;">🥫'+it.sauces.join(',')+'</span>';
            if (it.interdits&&it.interdits.length>0) opts += ' <span style="color:#ef4444;font-size:0.65rem;">🚫'+it.interdits.join(',')+'</span>';
            if (it.epice&&it.epice!=='Normal') opts += ' <span style="color:#d97706;font-size:0.65rem;">🌶️'+it.epice+'</span>';
            if (it.sel&&it.sel!=='Normal') opts += ' <span style="color:#4f46e5;font-size:0.65rem;">🧂'+it.sel+'</span>';
            h += '<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.85rem;border-bottom:1px solid #f1f5f9;padding:4px 0;">';
            h += '<span>'+it.nom+opts+'</span>';
            h += '<span style="font-weight:600;">'+(it.prixUnitaire*it.quantite).toFixed(2)+' MAD</span>';
            h += '</div>';
        }
    }
    h += '<div style="display:flex;justify-content:space-between;font-weight:700;margin-top:8px;">';
    h += '<span>Total</span><span style="color:#e67e22;">'+total.toFixed(2)+' MAD</span>';
    h += '</div>';
    h += '<button class="pos-validate-btn" onclick="menuValiderCommande()" '+(menuCart.length===0?'disabled':'')+' style="margin-top:10px;">';
    h += '<i class="fas fa-check-circle"></i> Commander</button>';
    h += '</div>';

    h += '</div>'; // fin container
    content.innerHTML = h;
}

// Filtre catégorie
function menuFilterCategory(cat) {
    menuSelectedCategory = cat;
    renderMenuTactile();
}

// Ouvre la modale d'options (identique au POS)
function menuOpenOptions(pid) {
    var p = menuProducts.find(function(x){return x.id===pid;});
    if (!p) return;
    if (p.stock!==undefined&&p.stock<=0) { alert('Rupture de stock'); return; }
    menuCurrentProductId = pid;
    var h = '<h4>'+p.nom+'</h4>';
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;">🥫 Sauces:</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    menuSauces.forEach(function(s){ h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="checkbox" class="menu-sauce-check" value="'+s+'"> '+s+'</label>'; });
    h += '</div></div>';
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;">🚫 Interdits:</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    menuInterdits.forEach(function(s){ h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="checkbox" class="menu-interdit-check" value="'+s+'"> '+s+'</label>'; });
    h += '</div></div>';
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;">🌶️ Épices:</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    menuEpices.forEach(function(s,idx){ h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="radio" name="menu-epice" value="'+s+'" '+(idx===0?'checked':'')+'> '+s+'</label>'; });
    h += '</div></div>';
    h += '<div style="margin-bottom:12px;"><label style="font-weight:600;">🧂 Sel:</label><div style="display:flex;flex-wrap:wrap;gap:5px;">';
    menuSel.forEach(function(s,idx){ h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:0.75rem;"><input type="radio" name="menu-sel" value="'+s+'" '+(idx===0?'checked':'')+'> '+s+'</label>'; });
    h += '</div></div>';
    h += '<div style="text-align:right;"><button class="btn-cancel" onclick="closeModal()" style="float:none;margin-right:8px;">Annuler</button><button class="btn-save" onclick="menuConfirmOptions()" style="float:none;">Ajouter au panier</button></div>';
    openModal('Personnaliser', h);
}

// Ajouter au panier depuis la modale
function menuConfirmOptions() {
    var sauces = []; document.querySelectorAll('.menu-sauce-check:checked').forEach(function(cb){sauces.push(cb.value);});
    var interdits = []; document.querySelectorAll('.menu-interdit-check:checked').forEach(function(cb){interdits.push(cb.value);});
    var epice = document.querySelector('input[name="menu-epice"]:checked'); epice = epice?epice.value:'Normal';
    var sel = document.querySelector('input[name="menu-sel"]:checked'); sel = sel?sel.value:'Normal';
    var p = menuProducts.find(function(x){return x.id===menuCurrentProductId;});
    if (!p) { closeModal(); return; }
    var ex = menuCart.find(function(x){return x.id===menuCurrentProductId;});
    if (ex) {
        if (p.stock!==undefined && ex.quantite>=p.stock) { alert('Stock insuffisant'); closeModal(); return; }
        ex.quantite += 1;
    } else {
        var price = p.prixPromo&&p.prixPromo>0?p.prixPromo:p.prixVente;
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
}

// Calcul du total
function menuCalcTotal() {
    var t = 0;
    for (var i=0; i<menuCart.length; i++) t += menuCart[i].prixUnitaire * menuCart[i].quantite;
    return t;
}

// Validation de la commande → envoi dans "commandes"
async function menuValiderCommande() {
    if (menuCart.length===0) { alert('Votre panier est vide'); return; }
    var total = menuCalcTotal();
    try {
        await db.collection('commandes').add({
            items: JSON.parse(JSON.stringify(menuCart)),
            total: total,
            table: menuTableNum,
            clientName: 'Table ' + menuTableNum,
            statut: 'en_attente',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            source: 'menu_tactile'
        });
        alert('✅ Commande envoyée !\nTable n° ' + menuTableNum + '\nTotal : ' + total.toFixed(2) + ' MAD\n\nVotre commande est en attente de validation.');
        menuCart = [];
        renderMenuTactile();
    } catch(e) {
        console.error(e);
        alert('Erreur lors de l\'envoi de la commande.');
    }
}

console.log('Menu Tactile prêt');
