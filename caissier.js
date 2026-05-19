// ==================== CAISSIER.JS ====================
// Le caissier utilise les mêmes modules que l'admin (admin.js, pos.js)
// Ce fichier sert uniquement à initialiser des fonctions spécifiques
// et à vérifier que l'utilisateur a bien le rôle 'caissier'.

(function() {
    // Attendre que l'utilisateur soit chargé
    var checkUser = setInterval(function() {
        if (window.currentUserData) {
            clearInterval(checkUser);
            if (window.currentUserData.userData.role !== 'caissier') {
                console.warn('Ce fichier est réservé au caissier. Redirection...');
                if (window.currentUserData.userData.role === 'admin') {
                    showDashboard();
                } else if (window.currentUserData.userData.role === 'client') {
                    showClientPage();
                }
            } else {
                console.log('✅ Interface caissier chargée');
                // Optionnel : surcharger certaines fonctions pour restreindre l'accès
                // Par exemple, désactiver la modification des produits si nécessaire
                // Mais actuellement, le menu caissier ne donne pas accès à ces pages.
            }
        }
    }, 300);
})();

// Fonctions de chargement spécifiques au caissier (si besoin)
// Elles appellent les fonctions globales déjà définies dans admin.js et pos.js

function loadCaissierDashboard() {
    if (typeof loadDashboardPage === 'function') {
        loadDashboardPage(document.getElementById('dynamicContent'));
    } else {
        console.error('loadDashboardPage non définie');
    }
}

function loadCaissierPOS() {
    if (typeof loadPosPage === 'function') {
        loadPosPage(document.getElementById('dynamicContent'));
    } else {
        console.error('loadPosPage non définie');
    }
}

function loadCaissierCommandes() {
    if (typeof loadCommandesPage === 'function') {
        loadCommandesPage(document.getElementById('dynamicContent'));
    } else {
        console.error('loadCommandesPage non définie');
    }
}

function loadCaissierVentes() {
    if (typeof loadVentesPage === 'function') {
        loadVentesPage(document.getElementById('dynamicContent'));
    } else {
        console.error('loadVentesPage non définie');
    }
}

function loadCaissierCredits() {
    if (typeof loadCreditsPage === 'function') {
        loadCreditsPage(document.getElementById('dynamicContent'));
    } else {
        console.error('loadCreditsPage non définie');
    }
}

// Ces fonctions sont déjà appelées par navigateTo() via les noms génériques
// (loadPosPage, loadCommandesPage, loadVentesPage, loadCreditsPage)
// donc aucune redirection supplémentaire n'est nécessaire.

console.log('Caissier JS prêt - utilise les modules admin et pos');
