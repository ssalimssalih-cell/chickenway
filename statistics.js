// ==================== STATISTIQUES PROFESSIONNELLES (ADMIN UNIQUEMENT) ====================
var statsCharts = {};

function toDate(val) {
    if (!val) return null;
    if (val.toDate && typeof val.toDate === 'function') return val.toDate();
    if (val.seconds) return new Date(val.seconds * 1000);
    if (typeof val === 'string') return new Date(val);
    if (val instanceof Date) return val;
    return null;
}

function loadStatistiquesPage(c) {
    if (!window.currentUserData || window.currentUserData.userData.role !== 'admin') {
        c.innerHTML = '<div class="content-card"><p style="text-align:center;padding:40px;color:#ef4444;"><i class="fas fa-lock" style="font-size:2rem;display:block;margin-bottom:10px;"></i>Accès réservé à l\'administrateur</p></div>';
        return;
    }

    var html = `
    <div class="content-card" style="margin-bottom:15px;">
        <div class="card-header">
            <h3><i class="fas fa-chart-bar"></i> Tableau de bord - Statistiques</h3>
            <div style="display:flex; gap:8px; align-items:center;">
                <select id="statPeriodSelect" style="padding:8px 12px; border:2px solid #e2e8f0; border-radius:8px;" onchange="loadStatistiques()">
                    <option value="1">Aujourd'hui</option>
                    <option value="7" selected>7 derniers jours</option>
                    <option value="30">30 derniers jours</option>
                    <option value="90">3 mois</option>
                    <option value="365">1 an</option>
                    <option value="all">Tout</option>
                </select>
                <button class="btn-add" onclick="loadStatistiques()"><i class="fas fa-sync"></i> Actualiser</button>
            </div>
        </div>
    </div>
    <div id="statsContent" style="text-align:center;padding:40px;">
        <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#f39c12;"></i>
        <p style="margin-top:10px;">Chargement des données...</p>
    </div>
    `;
    c.innerHTML = html;
    loadStatistiques();
}

async function loadStatistiques() {
    // Détruire les anciens graphiques
    Object.values(statsCharts).forEach(chart => chart.destroy());
    statsCharts = {};

    var period = document.getElementById('statPeriodSelect')?.value || '7';
    var now = new Date();
    var startDate = null;
    if (period !== 'all') {
        var days = parseInt(period);
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
    }

    try {
        const [ventesSnap, creditsSnap, depensesSnap, commandesSnap, produitsSnap, categoriesSnap, clientsSnap] = await Promise.all([
            db.collection('ventes').orderBy('createdAt', 'desc').limit(5000).get(),
            db.collection('credits').orderBy('createdAt', 'desc').limit(2000).get(),
            db.collection('depenses').orderBy('createdAt', 'desc').limit(2000).get(),
            db.collection('commandes').orderBy('createdAt', 'desc').limit(2000).get(),
            db.collection('products').get(),
            db.collection('categories').get(),
            db.collection('clients').get()
        ]);

        // Filtrer par période
        var ventes = [];
        ventesSnap.forEach(d => { 
            var dd = d.data(); dd.id = d.id; 
            var docDate = toDate(dd.createdAt);
            if (!startDate || (docDate && docDate >= startDate)) ventes.push(dd); 
        });
        var credits = [];
        creditsSnap.forEach(d => { 
            var dd = d.data(); dd.id = d.id; 
            var docDate = toDate(dd.createdAt);
            if (!startDate || (docDate && docDate >= startDate)) credits.push(dd); 
        });
        var depenses = [];
        depensesSnap.forEach(d => { 
            var dd = d.data(); dd.id = d.id; 
            var docDate = toDate(dd.createdAt);
            if (!startDate || (docDate && docDate >= startDate)) depenses.push(dd); 
        });
        var commandes = [];
        commandesSnap.forEach(d => { 
            var dd = d.data(); dd.id = d.id; 
            var docDate = toDate(dd.createdAt);
            if (!startDate || (docDate && docDate >= startDate)) commandes.push(dd); 
        });

        var produits = [];
        produitsSnap.forEach(d => { produits.push({ id: d.id, ...d.data() }); });
        var categories = [];
        categoriesSnap.forEach(d => { categories.push({ id: d.id, ...d.data() }); });
        var clients = [];
        clientsSnap.forEach(d => { clients.push({ id: d.id, ...d.data() }); });

        // KPI
        var totalVentes = ventes.reduce((sum, v) => sum + (v.total || 0), 0);
        var totalProfit = ventes.reduce((sum, v) => {
            var profit = 0;
            if (v.items) {
                v.items.forEach(it => {
                    var pa = it.prixAchat || 0, pv = it.prixVente || 0, pp = it.prixPromo || 0, pvr = (pp > 0) ? pp : pv, q = it.quantite || 1;
                    profit += (pvr - pa) * q;
                });
            }
            return sum + profit;
        }, 0);
        var totalDepenses = depenses.reduce((sum, d) => sum + (d.montant || 0), 0);
        var totalCreditsImpayes = credits.filter(c => !c.paid).reduce((sum, c) => sum + (c.remainingAmount || c.total || 0), 0);
        var nbVentes = ventes.length;
        var panierMoyen = nbVentes > 0 ? totalVentes / nbVentes : 0;
        var nbClients = clients.length;
        var nbProduits = produits.length;
        var nbCommandes = commandes.length;
        var tauxConversion = nbCommandes > 0 ? (nbVentes / nbCommandes * 100) : 0;

        // Top 5 produits
        var productSales = {};
        ventes.forEach(v => {
            if (v.items) {
                v.items.forEach(it => {
                    var nom = it.nom || 'Sans nom';
                    if (!productSales[nom]) productSales[nom] = 0;
                    productSales[nom] += (it.quantite || 0);
                });
            }
        });
        var topProduits = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);

        // Top 5 catégories
        var categoryCA = {};
        ventes.forEach(v => {
            if (v.items) {
                v.items.forEach(it => {
                    var cat = produits.find(p => p.nom === it.nom)?.categorie || 'Sans catégorie';
                    if (!categoryCA[cat]) categoryCA[cat] = 0;
                    categoryCA[cat] += (it.prixVente || it.prixUnitaire || 0) * (it.quantite || 0);
                });
            }
        });
        var topCategories = Object.entries(categoryCA).sort((a, b) => b[1] - a[1]).slice(0, 5);

        // Méthodes de paiement
        var paymentMethods = {};
        ventes.forEach(v => {
            var method = v.paymentMethod || 'espece';
            if (!paymentMethods[method]) paymentMethods[method] = 0;
            paymentMethods[method] += 1;
        });

        // Ventes par jour
        var dailySales = {};
        var daysToShow = period === 'all' ? 30 : parseInt(period);
        var today = new Date();
        for (var i = daysToShow - 1; i >= 0; i--) {
            var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            var key = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            dailySales[key] = 0;
        }
        ventes.forEach(v => {
            var vDate = toDate(v.createdAt);
            if (vDate) {
                var dateKey = vDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                if (dailySales[dateKey] !== undefined) {
                    dailySales[dateKey] += v.total || 0;
                }
            }
        });

        // Dépenses par catégorie
        var depensesByCat = {};
        depenses.forEach(d => {
            var cats = d.categories || ['Autre'];
            cats.forEach(cat => {
                if (!depensesByCat[cat]) depensesByCat[cat] = 0;
                depensesByCat[cat] += d.montant || 0;
            });
        });

        var statsHTML = `
        <div class="stats-grid" style="margin-bottom:20px;">
            <div class="stat-card"><div class="stat-icon" style="background:#dcfce7;"><i class="fas fa-money-bill-wave" style="color:#16a34a;"></i></div><div class="stat-info"><span class="stat-label">Chiffre d'affaires</span><span class="stat-value">${totalVentes.toFixed(2)} MAD</span></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#e0e7ff;"><i class="fas fa-shopping-cart" style="color:#4f46e5;"></i></div><div class="stat-info"><span class="stat-label">Ventes</span><span class="stat-value">${nbVentes}</span></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#fef3c7;"><i class="fas fa-chart-line" style="color:#f39c12;"></i></div><div class="stat-info"><span class="stat-label">Profit brut</span><span class="stat-value" style="color:${totalProfit>=0?'#16a34a':'#ef4444'};">${totalProfit.toFixed(2)} MAD</span></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#fce7f3;"><i class="fas fa-shopping-basket" style="color:#ec4899;"></i></div><div class="stat-info"><span class="stat-label">Panier moyen</span><span class="stat-value">${panierMoyen.toFixed(2)} MAD</span></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#fee2e2;"><i class="fas fa-coins" style="color:#ef4444;"></i></div><div class="stat-info"><span class="stat-label">Dépenses</span><span class="stat-value">${totalDepenses.toFixed(2)} MAD</span></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#fef3c7;"><i class="fas fa-credit-card" style="color:#d97706;"></i></div><div class="stat-info"><span class="stat-label">Crédits impayés</span><span class="stat-value">${totalCreditsImpayes.toFixed(2)} MAD</span></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#e0e7ff;"><i class="fas fa-balance-scale" style="color:#4f46e5;"></i></div><div class="stat-info"><span class="stat-label">Bénéfice net</span><span class="stat-value" style="color:${(totalProfit - totalDepenses) >= 0 ? '#16a34a' : '#ef4444'};">${(totalProfit - totalDepenses).toFixed(2)} MAD</span></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#dcfce7;"><i class="fas fa-users" style="color:#16a34a;"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value">${nbClients}</span></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#f0fdf4;"><i class="fas fa-utensils" style="color:#16a34a;"></i></div><div class="stat-info"><span class="stat-label">Produits</span><span class="stat-value">${nbProduits}</span></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#fef3c7;"><i class="fas fa-chart-pie" style="color:#f39c12;"></i></div><div class="stat-info"><span class="stat-label">Taux conversion</span><span class="stat-value">${tauxConversion.toFixed(1)}%</span></div></div>
        </div>
        `;

        statsHTML += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">';
        statsHTML += '<div class="content-card"><h4 style="margin-bottom:10px;">📈 Évolution du CA</h4><canvas id="salesChart" style="max-height:250px;"></canvas></div>';
        statsHTML += '<div class="content-card"><h4 style="margin-bottom:10px;">💳 Méthodes de paiement</h4><canvas id="paymentChart" style="max-height:250px;"></canvas></div>';
        statsHTML += '</div>';

        statsHTML += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">';
        statsHTML += '<div class="content-card"><h4 style="margin-bottom:10px;">🏆 Top 5 Produits</h4><table class="data-table"><thead><tr><th>Produit</th><th>Qté vendue</th></tr></thead><tbody>';
        topProduits.forEach(p => { statsHTML += `<tr><td>${p[0]}</td><td>${p[1]}</td></tr>`; });
        statsHTML += '</tbody></table></div>';
        statsHTML += '<div class="content-card"><h4 style="margin-bottom:10px;">📊 Top 5 Catégories</h4><table class="data-table"><thead><tr><th>Catégorie</th><th>CA (MAD)</th></tr></thead><tbody>';
        topCategories.forEach(cat => { statsHTML += `<tr><td>${cat[0]}</td><td>${cat[1].toFixed(2)}</td></tr>`; });
        statsHTML += '</tbody></table></div>';
        statsHTML += '</div>';

        statsHTML += '<div class="content-card" style="margin-bottom:20px;"><h4 style="margin-bottom:10px;">💸 Dépenses par catégorie</h4><canvas id="depensesChart" style="max-height:250px;"></canvas></div>';

        document.getElementById('statsContent').innerHTML = statsHTML;

        setTimeout(() => {
            var ctx1 = document.getElementById('salesChart')?.getContext('2d');
            if (ctx1) {
                statsCharts.sales = new Chart(ctx1, {
                    type: 'line',
                    data: {
                        labels: Object.keys(dailySales),
                        datasets: [{
                            label: 'CA (MAD)',
                            data: Object.values(dailySales),
                            borderColor: '#f39c12',
                            backgroundColor: 'rgba(243,156,18,0.1)',
                            fill: true,
                            tension: 0.3,
                            pointRadius: 3,
                            pointBackgroundColor: '#f39c12'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, ticks: { callback: v => v + ' MAD' } } }
                    }
                });
            }

            var ctx2 = document.getElementById('paymentChart')?.getContext('2d');
            if (ctx2) {
                statsCharts.payment = new Chart(ctx2, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(paymentMethods),
                        datasets: [{
                            data: Object.values(paymentMethods),
                            backgroundColor: ['#f39c12', '#4f46e5', '#16a34a', '#ef4444', '#d97706']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } }
                    }
                });
            }

            var ctx3 = document.getElementById('depensesChart')?.getContext('2d');
            if (ctx3) {
                var depCatLabels = Object.keys(depensesByCat);
                var depCatData = Object.values(depensesByCat);
                statsCharts.depenses = new Chart(ctx3, {
                    type: 'bar',
                    data: {
                        labels: depCatLabels,
                        datasets: [{
                            label: 'Dépenses (MAD)',
                            data: depCatData,
                            backgroundColor: '#ef4444',
                            borderRadius: 5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, ticks: { callback: v => v + ' MAD' } } }
                    }
                });
            }
        }, 100);

    } catch(e) {
        console.error(e);
        // Affiche l'erreur complète dans la page
        document.getElementById('statsContent').innerHTML = `
        <div style="text-align:center; padding:40px;">
            <i class="fas fa-exclamation-triangle" style="font-size:2rem; color:#ef4444;"></i>
            <p style="color:#ef4444; margin-top:10px;">Erreur lors du chargement des statistiques</p>
            <p style="color:#64748b; font-size:0.85rem; margin-top:5px;">${e.message}</p>
        </div>`;
    }
}
