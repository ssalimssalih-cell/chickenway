async function loadMenuData() {
    try {
        var content = document.getElementById('menuTactileContent');
        content.innerHTML = '<div style="text-align:center;padding:60px 20px;"><i class="fas fa-spinner fa-spin" style="font-size:3rem;color:#f39c12;"></i><p style="margin-top:15px;color:#64748b;font-weight:500;">Chargement du menu...</p></div>';

        let cachedCategories = await CacheDB.getAll('categories');
        let cachedProducts = await CacheDB.getAll('products');
        if (cachedCategories.length) menuCategories = cachedCategories;
        if (cachedProducts.length) menuProducts = cachedProducts.filter(p => p.disponible !== false);
        renderMenuTactile();

        const [catSnap, prodSnap] = await Promise.all([
            db.collection('categories').get(),
            db.collection('products').get()
        ]);
        menuCategories = [];
        catSnap.forEach(d => { let cat = { id: d.id, nom: d.data().nom, imageBase64: d.data().imageBase64 || '' }; menuCategories.push(cat); CacheDB.set('categories', d.id, cat); });
        menuProducts = [];
        prodSnap.forEach(d => {
            const dd = d.data();
            if (dd.disponible !== false) {
                let prod = { id: d.id, nom: dd.nom, prixVente: dd.prixVente||0, prixPromo: dd.prixPromo||0, stock: dd.stock, categorie: dd.categorie||'', description: dd.description||'', imageBase64: dd.imageBase64||'' };
                menuProducts.push(prod);
                CacheDB.set('products', d.id, prod);
            }
        });
        renderMenuTactile();
    } catch(e) {
        console.error(e);
        var content = document.getElementById('menuTactileContent');
        content.innerHTML = '<div style="text-align:center;padding:50px 20px;"><i class="fas fa-exclamation-circle" style="font-size:3rem;color:#ef4444;"></i><p style="margin-top:15px;color:#ef4444;">Erreur de chargement</p><button onclick="loadMenuData()" style="margin-top:20px;padding:12px 30px;background:#f39c12;color:#fff;border:none;border-radius:12px;">Réessayer</button></div>';
    }
}
