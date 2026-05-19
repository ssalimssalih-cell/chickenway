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

// ==================== FERMETURE ====================
function closeMenuTactile() {
    window.location.href = window.location.pathname;
}

// ==================== PLEIN ÉCRAN + CHARGEMENT ====================
function requestFullscreenAndLoad() {
    const elem = document.documentElement;
    const requestMethod = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.msRequestFullscreen;
    if (requestMethod) {
        requestMethod.call(elem).then(() => {
            // Une fois le plein écran activé, on charge le menu
            loadMenuData();
        }).catch(err => {
            console.warn("Erreur plein écran:", err);
            // Même si le plein écran échoue, on charge quand même
            loadMenuData();
        });
    } else {
        loadMenuData();
    }
}

// ==================== INITIALISATION ====================
function initMenuTactile(tableNum) {
    menuTableNum = tableNum;
    console.log('🍽️ Menu tactile - Table', tableNum);
    
    // Afficher un écran de bienvenue avec bouton pour passer en plein écran
    var content = document.getElementById('menuTactileContent');
    if (content) {
        content.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:80vh; text-align:center; padding:20px;">
                <img src="logo.png" alt="Chicken Way" style="width:100px; height:100px; border-radius:50%; margin-bottom:20px;">
                <h1 style="color:#f39c12;">Chicken Way</h1>
                <p style="margin:10px 0; color:#1e293b;">Table n° ${menuTableNum}</p>
                <button onclick="requestFullscreenAndLoad()" style="margin-top:30px; padding:15px 30px; background:linear-gradient(135deg,#f39c12,#e67e22); color:white; border:none; border-radius:50px; font-size:1.2rem; font-weight:bold; cursor:pointer;">📱 Plein écran & Commander</button>
            </div>
        `;
    }
}

// ==================== CHARGEMENT DEPUIS FIREBASE ====================
async function loadMenuData() {
    try {
        var content = document.getElementById('menuTactileContent');
        if (content) {
            content.innerHTML = '<div style="text-align:center;padding:60px 20px;"><i class="fas fa-spinner fa-spin" style="font-size:3rem;color:#f39c12;"></i><p style="margin-top:15px;">Chargement du menu...</p></div>';
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

        renderMenuTactile();
    } catch(e) {
        console.error(e);
        var content = document.getElementById('menuTactileContent');
        if (content) {
            content.innerHTML = '<div style="text-align:center;padding:50px;"><i class="fas fa-exclamation-circle" style="font-size:3rem;color:#ef4444;"></i><p>Erreur de chargement</p><button onclick="loadMenuData()" style="margin-top:20px;padding:10px 20px;background:#f39c12;border:none;border-radius:8px;">Réessayer</button></div>';
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
    html += '<button onclick="closeMenuTactile()" style="position:absolute; top:10px; right:15px; background:rgba(0,0,0,0.3); border:none; color:white; font-size:1.8rem; cursor:pointer; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center;">&times;</button>';
    html += '<div style="display:flex; justify-content:center; margin-bottom:12px;"><img src="logo.png" style="width:80px; height:80px; border-radius:50%; border:4px solid #fff; object-fit:cover;"></div>';
    html += '<h1 style="margin:0; font-size:1.5rem;">Chicken <span style="color:#fff;">Way</span></h1>';
    html += '<p style="margin:8px 0 0;">🍽️ Table n° ' + menuTableNum + '</p>';
    html += '</div>';
    
    // Catégories
    html += '<div style="overflow-x:auto; white-space:nowrap; padding:10px;">';
    html += '<button onclick="menuFilterCategory(\'all\')" style="display:inline-block; padding:10px 18px; margin:0 4px; border-radius:50px; border:2px solid ' + (menuSelectedCategory==='all'?'#f39c12':'#e2e8f0') + '; background:' + (menuSelectedCategory==='all'?'#f39c12':'#fff') + '; color:' + (menuSelectedCategory==='all'?'#fff':'#1e293b') + ';">📋 Tous</button>';
    for (var i=0; i<menuCategories.length; i++) {
        var cat = menuCategories[i];
        var active = menuSelectedCategory === cat.nom;
        html += '<button onclick="menuFilterCategory(\''+cat.nom.replace(/'/g,"\\'")+'\')" style="display:inline-block; padding:10px 18px; margin:0 4px; border-radius:50px; border:2px solid '+(active?'#f39c12':'#e2e8f0')+'; background:'+(active?'#f39c12':'#fff')+'; color:'+(active?'#fff':'#1e293b')+';">'+cat.nom+'</button>';
    }
    html += '</div>';
    
    // Produits
    var filtered = menuProducts;
    if (menuSelectedCategory !== 'all') filtered = menuProducts.filter(p => p.categorie === menuSelectedCategory);
    html += '<div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:10px; padding:10px;">';
    if (filtered.length === 0) {
        html += '<div style="grid-column:1/-1; text-align:center; padding:30px;">Aucun produit</div>';
    } else {
        for (var j=0; j<filtered.length; j++) {
            var p = filtered[j];
            var price = (p.prixPromo && p.prixPromo>0) ? p.prixPromo : p.prixVente;
            var out = p.stock !== undefined && p.stock <= 0;
            html += '<div onclick="'+(out?'':'menuOpenOptions(\''+p.id+'\')')+'" style="background:#fff; border:2px solid '+(out?'#fecaca':'#e2e8f0')+'; border-radius:16px; padding:12px; cursor:'+(out?'not-allowed':'pointer')+'; opacity:'+(out?'0.5':'1')+'; text-align:center;">';
            if (p.imageBase64) html += '<div style="height:100px; border-radius:12px; overflow:hidden; margin-bottom:8px;"><img src="'+p.imageBase64+'" style="width:100%; height:100%; object-fit:cover;"></div>';
            else html += '<div style="height:100px; border-radius:12px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; font-size:2rem;">🍗</div>';
            html += '<div style="font-weight:600;">'+p.nom+'</div><div style="font-weight:700; color:#e67e22;">'+price.toFixed(2)+' MAD</div>';
            if (out) html += '<div style="font-size:0.7rem; color:#ef4444;">Rupture</div>';
            html += '</div>';
        }
    }
    html += '</div>';
    
    // Panier sticky
    html += '<div style="position:sticky; bottom:0; background:#fff; padding:15px; border-radius:20px 20px 0 0; box-shadow:0 -4px 20px rgba(0,0,0,0.1); margin-top:10px;">';
    html += '<div style="display:flex; justify-content:space-between;"><strong>🛒 Mon panier</strong><span style="background:#f39c12; color:#fff; padding:2px 10px; border-radius:20px;">'+menuCart.length+' article(s)</span></div>';
    if (menuCart.length === 0) {
        html += '<p style="text-align:center; color:#94a3b8; margin:10px 0;">👆 Appuyez sur un produit</p>';
    } else {
        html += '<div style="max-height:150px; overflow-y:auto;">';
        for (var k=0; k<menuCart.length; k++) {
            var it = menuCart[k];
            html += '<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid #eee;">';
            html += '<span>'+it.quantite+'x '+it.nom+'</span>';
            html += '<div><button onclick="menuUpdateQty('+k+',-1)" style="width:26px;height:26px;border-radius:50%;border:1px solid #ccc;">-</button> <span style="min-width:24px;text-align:center;">'+it.quantite+'</span> <button onclick="menuUpdateQty('+k+',1)" style="width:26px;height:26px;border-radius:50%;border:1px solid #ccc;">+</button> <span style="min-width:60px;text-align:right;display:inline-block;">'+(it.prixUnitaire*it.quantite).toFixed(2)+'</span></div>';
            html += '</div>';
        }
        html += '</div>';
    }
    html += '<div style="display:flex; justify-content:space-between; font-weight:700; margin:10px 0;"><span>Total</span><span style="color:#e67e22;">'+total.toFixed(2)+' MAD</span></div>';
    html += '<button onclick="menuValiderCommande()" '+(menuCart.length===0?'disabled':'')+' style="width:100%; padding:12px; border:none; border-radius:12px; background:'+(menuCart.length===0?'#cbd5e1':'linear-gradient(135deg,#f39c12,#e67e22)')+'; color:#fff; font-weight:bold;">✅ Commander</button>';
    if (menuCart.length>0) html += '<button onclick="menuClearCart()" style="width:100%; margin-top:8px; padding:8px; border:1px solid #ccc; background:#fff; border-radius:12px;">🗑️ Vider</button>';
    html += '</div>';
    
    content.innerHTML = html;
}

function menuFilterCategory(cat) { menuSelectedCategory = cat; renderMenuTactile(); }
function menuUpdateQty(idx, delta) { 
    if (!menuCart[idx]) return;
    var newQ = menuCart[idx].quantite + delta;
    if (newQ <= 0) menuCart.splice(idx,1);
    else menuCart[idx].quantite = newQ;
    renderMenuTactile();
}
function menuClearCart() { if (confirm('Vider le panier ?')) { menuCart = []; renderMenuTactile(); } }
function menuCalcTotal() { return menuCart.reduce((s,i)=>s+(i.prixUnitaire*i.quantite),0); }

// Options produits (similaire à avant, mais plus concise)
function menuOpenOptions(pid) {
    var p = menuProducts.find(x=>x.id===pid);
    if (!p || (p.stock!==undefined && p.stock<=0)) { alert('Produit indisponible'); return; }
    var h = '<h4>'+p.nom+'</h4>';
    h += '<div><label>🥫 Sauces</label><div>';
    menuSauces.forEach(s=>{h+='<label style="margin:5px;"><input type="checkbox" class="menu-sauce" value="'+s+'"> '+s+'</label>';});
    h += '</div></div><div><label>🚫 Interdits</label><div>';
    menuInterdits.forEach(s=>{h+='<label style="margin:5px;"><input type="checkbox" class="menu-interdit" value="'+s+'"> '+s+'</label>';});
    h += '</div></div><div><label>🌶️ Épices</label><div>';
    menuEpices.forEach((s,i)=>{h+='<label><input type="radio" name="epice" value="'+s+'" '+(i===0?'checked':'')+'> '+s+'</label>';});
    h += '</div></div><div><label>🧂 Sel</label><div>';
    menuSel.forEach((s,i)=>{h+='<label><input type="radio" name="sel" value="'+s+'" '+(i===0?'checked':'')+'> '+s+'</label>';});
    h += '</div></div><button class="btn-save" onclick="menuAddToCart(\''+pid+'\')">Ajouter</button>';
    openModal('Personnaliser', h);
}
function menuAddToCart(pid) {
    var sauces = Array.from(document.querySelectorAll('.menu-sauce:checked')).map(cb=>cb.value);
    var interdits = Array.from(document.querySelectorAll('.menu-interdit:checked')).map(cb=>cb.value);
    var epice = document.querySelector('input[name="epice"]:checked')?.value || 'Normal';
    var sel = document.querySelector('input[name="sel"]:checked')?.value || 'Normal';
    var p = menuProducts.find(x=>x.id===pid);
    if (!p) { closeModal(); return; }
    var existing = menuCart.find(x=>x.id===pid);
    if (existing) existing.quantite++;
    else menuCart.push({id:p.id, nom:p.nom, prixUnitaire: (p.prixPromo&&p.prixPromo>0?p.prixPromo:p.prixVente), quantite:1, sauces, interdits, epice, sel});
    closeModal();
    renderMenuTactile();
}

async function menuValiderCommande() {
    if (menuCart.length===0) { alert('Panier vide'); return; }
    var total = menuCalcTotal();
    if (!confirm(`Confirmer la commande ?\nTable ${menuTableNum}\nTotal: ${total.toFixed(2)} MAD`)) return;
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
        alert('✅ Commande envoyée !');
        menuCart = [];
        renderMenuTactile();
    } catch(e) { alert('Erreur : '+e.message); }
}
