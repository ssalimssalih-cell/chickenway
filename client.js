// ==================== CLIENT ====================
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

function loadClientCommanderPage() {
    var content = document.getElementById('clientDynamicContent');
    if (!content) return;
    content.innerHTML = '<div class="content-card"><h3><i class="fas fa-shopping-basket"></i> Commander</h3><p style="text-align:center;padding:40px;color:#94a3b8;">Fonctionnalite a venir - Interface de commande client</p></div>';
}

function loadClientHistoriquePage() {
    var content = document.getElementById('clientDynamicContent');
    if (!content) return;
    content.innerHTML = '<div class="content-card"><h3><i class="fas fa-history"></i> Historique des commandes</h3><p style="text-align:center;padding:40px;color:#94a3b8;">Fonctionnalite a venir</p></div>';
}

function loadClientParametresPage() {
    var content = document.getElementById('clientDynamicContent');
    if (!content) return;
    var userData = window.currentUserData ? window.currentUserData.userData : {};
    content.innerHTML = '<div class="content-card">' +
        '<div class="card-header"><h3><i class="fas fa-cog"></i> Parametres</h3></div>' +
        '<div style="padding:20px;">' +
        '<p><strong>Nom:</strong> ' + userData.nom + '</p>' +
        '<p><strong>Prenom:</strong> ' + userData.prenom + '</p>' +
        '<p><strong>Email:</strong> ' + userData.email + '</p>' +
        '<p><strong>Telephone:</strong> ' + userData.telephone + '</p>' +
        '<p><strong>Username:</strong> @' + userData.username + '</p>' +
        '</div></div>';
}

console.log('Client JS chargé');
