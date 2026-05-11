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
    var content = document.getElementById('clientDynamicContent');
    if (!content) return;
    
    if (page === 'commander') {
        content.innerHTML = '<div class="content-card"><h3><i class="fas fa-shopping-basket"></i> Commander</h3><p style="text-align:center;padding:40px;color:#94a3b8;">Interface de commande - A venir</p></div>';
    } else if (page === 'historique') {
        content.innerHTML = '<div class="content-card"><h3><i class="fas fa-history"></i> Historique</h3><p style="text-align:center;padding:40px;color:#94a3b8;">Historique des commandes - A venir</p></div>';
    } else if (page === 'parametres') {
        var u = window.currentUserData ? window.currentUserData.userData : {};
        content.innerHTML = '<div class="content-card"><div class="card-header"><h3><i class="fas fa-cog"></i> Parametres</h3></div><div style="padding:20px;"><p><strong>Nom:</strong> ' + u.nom + '</p><p><strong>Prenom:</strong> ' + u.prenom + '</p><p><strong>Email:</strong> ' + u.email + '</p><p><strong>Telephone:</strong> ' + (u.telephone || '-') + '</p><p><strong>Username:</strong> @' + u.username + '</p></div></div>';
    }
}

console.log('Client JS OK');
