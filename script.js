var currentUser = null;
var currentUserData = null;

window.addEventListener('load', function() {
    setTimeout(function() { initApp(); }, 300);
});

function initApp() {
    console.log('Chicken Way Started');

    // ----- MENU TACTILE : si ?table=XX est dans l'URL -----
    var urlParams = new URLSearchParams(window.location.search);
    var tableParam = urlParams.get('table');
    if (tableParam) {
        // Afficher directement le menu tactile
        document.getElementById('authPage').classList.add('hidden');
        document.getElementById('dashboardPage').classList.add('hidden');
        document.getElementById('clientPage').classList.add('hidden');
        document.getElementById('menuTactilePage').classList.remove('hidden');
        if (typeof initMenuTactile === 'function') {
            initMenuTactile(tableParam);
        }
        return;
    }

    var authPage = document.getElementById('authPage'),
        dashboardPage = document.getElementById('dashboardPage'),
        clientPage = document.getElementById('clientPage');

    if (!authPage || !dashboardPage || !clientPage) {
        console.error('Elements manquants');
        return;
    }

    dashboardPage.classList.add('hidden');
    clientPage.classList.add('hidden');
    authPage.classList.remove('hidden');

    auth.onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            db.collection('users').doc(user.uid).get().then(function(doc) {
                if (!doc.exists) { auth.signOut(); showAuthPage(); return; }
                var userData = doc.data();
                if (userData.authorized !== 'yes') { auth.signOut(); showAuthPage(); return; }
                window.currentUserData = { uid: doc.id, userData: userData };
                localStorage.setItem('currentUser', JSON.stringify(window.currentUserData));
                if (userData.role === 'client') showClientPage();
                else showDashboard();
            }).catch(function(err) { console.error(err); auth.signOut(); showAuthPage(); });
        } else {
            window.currentUserData = null;
            localStorage.removeItem('currentUser');
            showAuthPage();
        }
    });

    showLogin();
}

function toggleSidebar() { var s=document.getElementById('sidebar'),o=document.getElementById('sidebarOverlay'); if(s)s.classList.toggle('open'); if(o)o.classList.toggle('active'); }
function toggleClientSidebar() { var s=document.getElementById('clientSidebar'),o=document.getElementById('clientSidebarOverlay'); if(s)s.classList.toggle('open'); if(o)o.classList.toggle('active'); }
function showAuthPage() { document.getElementById('authPage').classList.remove('hidden'); document.getElementById('dashboardPage').classList.add('hidden'); document.getElementById('clientPage').classList.add('hidden'); }

function showDashboard() {
    document.getElementById('authPage').classList.add('hidden'); document.getElementById('dashboardPage').classList.remove('hidden'); document.getElementById('clientPage').classList.add('hidden');
    buildMenu(); updateSidebarUserInfo();
    if (window.currentUserData && window.currentUserData.userData.role === 'caissier') navigateTo('pos');
    else navigateTo('dashboard');
}

function showClientPage() {
    document.getElementById('authPage').classList.add('hidden'); document.getElementById('dashboardPage').classList.add('hidden'); document.getElementById('clientPage').classList.remove('hidden');
    updateClientSidebarInfo();
    if (typeof clientNavigate === 'function') clientNavigate('commander');
}

function buildMenu() {
    var menu = document.getElementById('navMenu'); if (!menu) return; menu.innerHTML = ''; var items = [];
    if (window.currentUserData && window.currentUserData.userData.role === 'admin') {
        items = [{p:'dashboard',i:'fa-th-large',l:'Dashboard'},{p:'pos',i:'fa-cash-register',l:'POS'},{p:'commandes',i:'fa-shopping-basket',l:'Commandes en ligne'},{p:'categories',i:'fa-layer-group',l:'Catégories'},{p:'products',i:'fa-utensils',l:'Produits'},{p:'clients',i:'fa-users',l:'Clients'},{p:'fournisseurs',i:'fa-truck',l:'Fournisseurs'},{p:'ventes',i:'fa-shopping-cart',l:'Ventes'},{p:'credits',i:'fa-credit-card',l:'Crédits'},{p:'depenses',i:'fa-money-bill-wave',l:'Dépenses'},{p:'options',i:'fa-cog',l:'Options'}];
        document.getElementById('sidebarRole').textContent = 'Admin';
    } else if (window.currentUserData && window.currentUserData.userData.role === 'caissier') {
        items = [{p:'pos',i:'fa-cash-register',l:'POS'},{p:'commandes',i:'fa-shopping-basket',l:'Commandes en ligne'},{p:'ventes',i:'fa-shopping-cart',l:'Ventes'},{p:'credits',i:'fa-credit-card',l:'Crédits'}];
        document.getElementById('sidebarRole').textContent = 'Caissier';
    }
    items.forEach(function(item) { var li=document.createElement('li'); li.className='nav-item'; li.onclick=function(){navigateTo(item.p);}; li.innerHTML='<i class="fas '+item.i+'"></i> '+item.l; menu.appendChild(li); });
}

function navigateTo(page) {
    if (!window.currentUserData || window.currentUserData.userData.authorized !== 'yes') { auth.signOut(); showAuthPage(); return; }
    var items = document.querySelectorAll('#navMenu .nav-item'); items.forEach(function(item) { item.classList.remove('active'); });
    var pages = ['dashboard','pos','commandes','categories','products','clients','fournisseurs','ventes','credits','depenses','options'];
    var index = pages.indexOf(page); if (index >= 0 && items[index]) items[index].classList.add('active');
    var titles = {dashboard:'Dashboard',pos:'POS',commandes:'Commandes en ligne',categories:'Catégories',products:'Produits',clients:'Clients',fournisseurs:'Fournisseurs',ventes:'Ventes',credits:'Crédits',depenses:'Dépenses',options:'Options'};
    var icons = {dashboard:'fa-th-large',pos:'fa-cash-register',commandes:'fa-shopping-basket',categories:'fa-layer-group',products:'fa-utensils',clients:'fa-users',fournisseurs:'fa-truck',ventes:'fa-shopping-cart',credits:'fa-credit-card',depenses:'fa-money-bill-wave',options:'fa-cog'};
    document.getElementById('pageTitle').textContent = titles[page] || '';
    var hi = document.querySelector('.header-title i'); if (hi && icons[page]) hi.className = 'fas ' + icons[page];
    var content = document.getElementById('dynamicContent'); if (!content) return;
    if (page==='pos') loadPosPage(content);
    else if (page==='commandes') loadCommandesPage(content);
    else if (page==='categories') loadCategoriesPage(content);
    else if (page==='products') loadProductsPage(content);
    else if (page==='clients') loadClientsPage(content);
    else if (page==='fournisseurs') loadFournisseursPage(content);
    else if (page==='ventes') loadVentesPage(content);
    else if (page==='credits') loadCreditsPage(content);
    else if (page==='depenses') loadDepensesPage(content);
    else if (page==='options') loadOptionsPage(content);
    else if (page==='dashboard') loadDashboardPage(content);
    else content.innerHTML = '<div class="content-card"><h3>'+(titles[page]||'Page')+'</h3><p style="text-align:center;padding:40px;">En développement</p></div>';
}

function updateSidebarUserInfo() { var el=document.getElementById('sidebarUserInfo'); if(el&&window.currentUserData){el.innerHTML='<i class="fas fa-user-circle"></i> '+window.currentUserData.userData.prenom+' '+window.currentUserData.userData.nom+' <small style="color:#f39c12;">('+window.currentUserData.userData.role+')</small>';} }
function updateClientSidebarInfo() { var el=document.getElementById('clientSidebarInfo'); if(el&&window.currentUserData){el.innerHTML='<i class="fas fa-user-circle"></i> '+window.currentUserData.userData.prenom+' '+window.currentUserData.userData.nom;} }

console.log('Script JS OK');
