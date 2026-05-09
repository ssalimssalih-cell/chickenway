let currentUser = null;
let currentUserData = null;

window.addEventListener('DOMContentLoaded', function() {
    console.log('Chicken Way Started');
    
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('clientPage').classList.add('hidden');
    
    auth.onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            
            db.collection('users').doc(user.uid).get()
                .then(function(doc) {
                    if (!doc.exists) {
                        alert('Account error');
                        auth.signOut();
                        showAuthPage();
                        return;
                    }
                    
                    var userData = doc.data();
                    
                    if (userData.authorized !== 'yes') {
                        auth.signOut();
                        showAuthPage();
                        setTimeout(function() {
                            showLoginError('Your account is not authorized yet.');
                        }, 300);
                        return;
                    }
                    
                    currentUserData = { uid: doc.id, ...userData };
                    localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                    
                    if (userData.role === 'client') {
                        showClientPage();
                    } else {
                        showDashboard();
                    }
                })
                .catch(function(error) {
                    console.error('Error:', error);
                    auth.signOut();
                    showAuthPage();
                });
        } else {
            currentUser = null;
            currentUserData = null;
            localStorage.removeItem('currentUser');
            showAuthPage();
        }
    });
});

function showAuthPage() {
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('clientPage').classList.add('hidden');
    document.getElementById('authPage').classList.remove('hidden');
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('registerContainer').classList.add('hidden');
    hideLoginError();
}

function showDashboard() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('clientPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    buildMenu();
    updateSidebarUserInfo();
    
    // FORCER la bonne page au démarrage
    if (currentUserData.role === 'caissier') {
        navigateTo('pos');
    } else {
        navigateTo('dashboard');
    }
}

function showClientPage() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('clientPage').classList.remove('hidden');
    updateClientSidebarInfo();
    clientNavigate('commander');
}

function showLogin() {
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('registerContainer').classList.add('hidden');
    hideLoginError();
}

function showRegister() {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('registerContainer').classList.remove('hidden');
    hideLoginError();
}

function buildMenu() {
    var menu = document.getElementById('navMenu');
    
    if (currentUserData.role === 'admin') {
        menu.innerHTML = `
            <li class="nav-item" onclick="navigateTo('dashboard')"><i class="fas fa-th-large"></i> Dashboard</li>
            <li class="nav-item" onclick="navigateTo('pos')"><i class="fas fa-cash-register"></i> POS</li>
            <li class="nav-item" onclick="navigateTo('categories')"><i class="fas fa-layer-group"></i> Categories</li>
            <li class="nav-item" onclick="navigateTo('products')"><i class="fas fa-utensils"></i> Produits</li>
            <li class="nav-item" onclick="navigateTo('clients')"><i class="fas fa-users"></i> Clients</li>
            <li class="nav-item" onclick="navigateTo('fournisseurs')"><i class="fas fa-truck"></i> Fournisseurs</li>
            <li class="nav-item" onclick="navigateTo('ventes')"><i class="fas fa-shopping-cart"></i> Ventes</li>
            <li class="nav-item" onclick="navigateTo('credits')"><i class="fas fa-credit-card"></i> Credits</li>
            <li class="nav-item" onclick="navigateTo('depenses')"><i class="fas fa-money-bill-wave"></i> Depenses</li>
            <li class="nav-item" onclick="navigateTo('statistiques')"><i class="fas fa-chart-bar"></i> Statistiques</li>
            <li class="nav-item" onclick="navigateTo('options')"><i class="fas fa-cog"></i> Options</li>
        `;
        document.getElementById('sidebarRole').textContent = 'Admin';
        
    } else if (currentUserData.role === 'caissier') {
        menu.innerHTML = `
            <li class="nav-item active" onclick="navigateTo('pos')"><i class="fas fa-cash-register"></i> POS</li>
        `;
        document.getElementById('sidebarRole').textContent = 'Caissier - POS';
    }
}

function navigateTo(page) {
    if (!currentUserData || currentUserData.authorized !== 'yes') {
        auth.signOut();
        showAuthPage();
        return;
    }
    
    // BLOQUER caissier sur tout sauf POS
    if (currentUserData.role === 'caissier' && page !== 'pos') {
        return;
    }
    
    var items = document.querySelectorAll('#navMenu .nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    
    // Trouver l'index du bon élément
    var adminPages = ['dashboard', 'pos', 'categories', 'products', 'clients', 'fournisseurs', 'ventes', 'credits', 'depenses', 'statistiques', 'options'];
    var caissierPages = ['pos'];
    var pages = (currentUserData.role === 'caissier') ? caissierPages : adminPages;
    var index = pages.indexOf(page);
    
    if (index >= 0 && items[index]) {
        items[index].classList.add('active');
    }
    
    var titles = {
        'dashboard': 'Dashboard', 'pos': 'Point de Vente (POS)', 'categories': 'Categories',
        'products': 'Produits', 'clients': 'Clients', 'fournisseurs': 'Fournisseurs',
        'ventes': 'Ventes', 'credits': 'Credits', 'depenses': 'Depenses',
        'statistiques': 'Statistiques', 'options': 'Options'
    };
    
    document.getElementById('pageTitle').textContent = titles[page] || 'Page';
    var hi = document.querySelector('.header-title i');
    var icons = {'dashboard':'fa-th-large','pos':'fa-cash-register','categories':'fa-layer-group','products':'fa-utensils','clients':'fa-users','fournisseurs':'fa-truck','ventes':'fa-shopping-cart','credits':'fa-credit-card','depenses':'fa-money-bill-wave','statistiques':'fa-chart-bar','options':'fa-cog'};
    if (hi && icons[page]) hi.className = 'fas ' + icons[page];
    
    var content = document.getElementById('dynamicContent');
    
    if (page === 'dashboard') {
        content.innerHTML = '<div class="stats-grid"><div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-bag"></i></div><div class="stat-info"><span class="stat-label">Commandes</span><span class="stat-value" id="todayOrders">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-euro-sign"></i></div><div class="stat-info"><span class="stat-label">Revenus</span><span class="stat-value" id="todayRevenue">0.00</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-utensils"></i></div><div class="stat-info"><span class="stat-label">Produits</span><span class="stat-value" id="productsCount">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value" id="clientsCount">0</span></div></div></div>';
        loadDashboardStats();
    } else if (page === 'pos') {
        content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-cash-register"></i> Point de Vente (POS)</h3></div><div style="text-align:center;padding:60px;"><p>Interface POS en developpement</p></div></div>';
    } else if (page === 'options') {
        loadOptionsPage(content);
    } else {
        content.innerHTML = '<div class="content-card"><div class="card-header"><h3>' + titles[page] + '</h3></div><div style="text-align:center;padding:60px;"><p>' + titles[page] + ' - En developpement</p></div></div>';
    }
}

function clientNavigate(page) {
    var items = document.querySelectorAll('#clientPage .nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    
    var pages = ['commander', 'historique', 'parametres'];
    var index = pages.indexOf(page);
    if (index >= 0 && items[index]) items[index].classList.add('active');
    
    var titles = {
        'commander': 'Commander en ligne',
        'historique': 'Historique des commandes',
        'parametres': 'Parametres du compte'
    };
    
    document.getElementById('clientPageTitle').textContent = titles[page];
    var content = document.getElementById('clientDynamicContent');
    
    if (page === 'commander') {
        content.innerHTML = '<div class="content-card"><div class="card-header"><h3>Commander en ligne</h3></div><div style="text-align:center;padding:60px;"><button class="btn-add" onclick="alert(\'A venir\')">Voir le menu</button></div></div>';
    } else if (page === 'historique') {
        content.innerHTML = '<div class="content-card"><div class="card-header"><h3>Historique</h3></div><table class="data-table"><thead><tr><th>N</th><th>Date</th><th>Total</th><th>Statut</th></tr></thead><tbody id="clientOrdersTable"><tr><td colspan="4">Aucune</td></tr></tbody></table></div>';
        loadClientOrders();
    } else if (page === 'parametres') {
        content.innerHTML = '<div class="content-card"><div class="card-header"><h3>Parametres</h3></div><div id="profileMessage"></div><form onsubmit="return updateClientProfile(event)"><div class="input-group"><i class="fas fa-phone"></i><input type="tel" id="clientTelephone" value="'+(currentUserData.telephone||'')+'"></div><div class="input-group"><i class="fas fa-lock"></i><input type="password" id="clientNewPassword" placeholder="Nouveau mot de passe"></div><div class="input-group"><i class="fas fa-lock"></i><input type="password" id="clientConfirmPassword" placeholder="Confirmer"></div><button type="submit" class="btn-add" style="width:100%;">Enregistrer</button></form></div>';
    }
}

// ... (le reste des fonctions : handleLogin, handleRegister, handleLogout, etc. - IDENTIQUE)
// Gardez toutes les autres fonctions telles quelles
