var currentUser = null;
var currentUserData = null;
var editingId = null;
var currentCollection = '';

// ============================================
// INITIALISATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Chicken Way Started');
    
    auth.onAuthStateChanged(function(user) {
        if (user) {
            currentUser = user;
            db.collection('users').doc(user.uid).get().then(function(doc) {
                if (!doc.exists) { auth.signOut(); showLoginPage(); return; }
                var userData = doc.data();
                if (userData.authorized !== 'yes') {
                    auth.signOut(); showLoginPage();
                    setTimeout(function() { showLoginError('Compte en attente de validation.'); }, 300);
                    return;
                }
                currentUserData = { uid: doc.id, userData: userData };
                localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                if (userData.role === 'client') { showClientPage(); } else { showDashboard(); }
            }).catch(function() { auth.signOut(); showLoginPage(); });
        } else {
            currentUser = null; currentUserData = null;
            localStorage.removeItem('currentUser'); showLoginPage();
        }
    });
});

// ============================================
// AFFICHAGE PAGES
// ============================================
function showLoginPage() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('registerPage').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    hideLoginError();
}

function showRegisterPage() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('registerPage').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('registerPage').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('currentUserDisplay').textContent = currentUserData.userData.prenom + ' ' + currentUserData.userData.nom;
    document.getElementById('userRoleDisplay').textContent = currentUserData.userData.role === 'admin' ? 'Administrateur' : 'Caissier - POS';
    buildMenu();
    if (typeof showPage === 'function') {
        if (currentUserData.userData.role === 'caissier') { showPage('pos'); } else { showPage('pos'); }
    }
}

function showClientPage() {
    alert('Espace client en developpement');
}

// ============================================
// MENU
// ============================================
function buildMenu() {
    var menu = document.getElementById('navMenu');
    menu.innerHTML = '';
    var items = [];
    
    if (currentUserData.userData.role === 'admin') {
        items = [
            {onclick:"showPage('pos')",icon:'fa-shopping-cart',label:'POS'},
            {onclick:"showPage('categories')",icon:'fa-tags',label:'Categories'},
            {onclick:"showPage('produits')",icon:'fa-hamburger',label:'Produits'},
            {onclick:"showPage('clients')",icon:'fa-users',label:'Clients'},
            {onclick:"showPage('fournisseurs')",icon:'fa-truck',label:'Fournisseurs'},
            {onclick:"showPage('ventes')",icon:'fa-chart-simple',label:'Ventes'},
            {onclick:"showPage('credits')",icon:'fa-credit-card',label:'Credits'},
            {onclick:"showPage('depenses')",icon:'fa-chart-line',label:'Depenses'},
            {onclick:"showPage('stats')",icon:'fa-chart-pie',label:'Statistiques'},
            {onclick:"showOptionsPage()",icon:'fa-cog',label:'Options'}
        ];
    } else if (currentUserData.userData.role === 'caissier') {
        items = [
            {onclick:"showPage('pos')",icon:'fa-shopping-cart',label:'POS'}
        ];
    }
    
    items.forEach(function(item) {
        var li = document.createElement('li');
        li.className = 'nav-item';
        li.setAttribute('onclick', item.onclick);
        li.innerHTML = '<i class="fas ' + item.icon + '"></i><span>' + item.label + '</span>';
        menu.appendChild(li);
    });
    
    // Bouton logout
    var logoutLi = document.createElement('li');
    logoutLi.className = 'nav-item logout-item';
    logoutLi.setAttribute('onclick', 'handleLogout()');
    logoutLi.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>Logout</span>';
    menu.appendChild(logoutLi);
    
    document.getElementById('userRoleDisplay').textContent = currentUserData.userData.role === 'admin' ? 'Administrateur' : 'Caissier - POS';
}

// ============================================
// PAGE OPTIONS
// ============================================
function showOptionsPage() {
    if (!currentUserData || currentUserData.userData.role !== 'admin') { alert('Acces refuse'); return; }
    
    var mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="page-header"><div class="header-title"><i class="fas fa-cog"></i><h2>Options - Gestion utilisateurs</h2></div></div>
        <div class="stats-grid" style="margin-bottom:20px;">
            <div class="stat-card"><div class="stat-icon" style="background:#fef3c7;"><i class="fas fa-clock" style="color:#d97706;"></i></div><div class="stat-info"><span class="stat-label">En attente</span><span class="stat-value" id="pendingCount">0</span></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#dcfce7;"><i class="fas fa-check-circle" style="color:#16a34a;"></i></div><div class="stat-info"><span class="stat-label">Autorises</span><span class="stat-value" id="authorizedCount">0</span></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#e0e7ff;"><i class="fas fa-users" style="color:#4f46e5;"></i></div><div class="stat-info"><span class="stat-label">Total</span><span class="stat-value" id="totalUsers">0</span></div></div>
        </div>
        <div class="content-card">
            <div class="card-header"><h3>Gestion des utilisateurs</h3><button class="btn-add" onclick="loadUsersList()"><i class="fas fa-sync-alt"></i> Actualiser</button></div>
            <div class="table-container"><table class="data-table"><thead><tr><th>Username</th><th>Nom</th><th>Email</th><th>Role</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="usersTableBody"></tbody></table></div>
        </div>
    `;
    loadUsersList();
    
    // Activer le menu
    var items = document.querySelectorAll('#navMenu .nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    var lastItem = document.querySelector('#navMenu .nav-item:nth-last-child(2)');
    if (lastItem) lastItem.classList.add('active');
}

function loadUsersList() {
    db.collection('users').orderBy('createdAt','desc').get().then(function(snapshot) {
        var pending=0, authorized=0, tbody=document.getElementById('usersTableBody');
        if (!tbody) return;
        tbody.innerHTML='';
        if(snapshot.empty){tbody.innerHTML='<tr><td colspan="6">Aucun utilisateur</td></tr>';return;}
        snapshot.forEach(function(doc){
            var u=doc.data(), id=doc.id;
            if(u.authorized==='no')pending++;else authorized++;
            var badge=u.authorized==='yes'?'<span class="status-success">Autorise</span>':'<span class="status-warning">En attente</span>';
            var btn=u.authorized==='no'?'<button class="btn-add" style="padding:4px 8px;font-size:0.7rem;margin-right:5px;" onclick="authorizeUser(\''+id+'\')">Autoriser</button><button class="btn-delete" onclick="deleteUser(\''+id+'\')">Supprimer</button>':'<button class="btn-edit" style="padding:4px 8px;font-size:0.7rem;margin-right:5px;color:#d97706;" onclick="deauthorizeUser(\''+id+'\')">Bloquer</button><button class="btn-delete" onclick="deleteUser(\''+id+'\')">Supprimer</button>';
            tbody.innerHTML+='<tr><td>@'+u.username+'</td><td>'+u.prenom+' '+u.nom+'</td><td>'+u.email+'</td><td>'+u.role+'</td><td>'+badge+'</td><td>'+btn+'</td></tr>';
        });
        document.getElementById('pendingCount').textContent=pending;
        document.getElementById('authorizedCount').textContent=authorized;
        document.getElementById('totalUsers').textContent=snapshot.size;
    });
}

function authorizeUser(uid){if(confirm('Autoriser cet utilisateur ?')){db.collection('users').doc(uid).update({authorized:'yes',updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){loadUsersList();});}}
function deauthorizeUser(uid){if(confirm('Bloquer cet utilisateur ?')){db.collection('users').doc(uid).update({authorized:'no',updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){loadUsersList();});}}
function deleteUser(uid){if(confirm('Supprimer definitivement ?')){db.collection('users').doc(uid).delete().then(function(){loadUsersList();});}}

// ============================================
// LOGIN / REGISTER / LOGOUT
// ============================================
function handleLogin() {
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var btn = document.getElementById('loginBtn');
    
    if (!email || !password) { showLoginError('Remplissez tous les champs'); return; }
    
    btn.disabled = true;
    btn.innerHTML = '<span>Connexion...</span><i class="fas fa-spinner fa-spin"></i>';
    hideLoginError();
    
    auth.signInWithEmailAndPassword(email, password).then(function(userCredential) {
        return db.collection('users').doc(userCredential.user.uid).get().then(function(doc) {
            if (!doc.exists) { auth.signOut(); showLoginError('Compte introuvable'); return; }
            var userData = doc.data();
            if (userData.authorized !== 'yes') { auth.signOut(); showLoginError('Compte en attente de validation.'); return; }
            currentUserData = { uid: doc.id, userData: userData };
            localStorage.setItem('currentUser', JSON.stringify(currentUserData));
            showDashboard();
        });
    }).catch(function(error) {
        var msg = error.code === 'auth/user-not-found' ? 'Email non trouve' : error.code === 'auth/wrong-password' ? 'Mot de passe incorrect' : error.message;
        showLoginError(msg);
    }).finally(function() {
        btn.disabled = false;
        btn.innerHTML = '<span>Se connecter</span><i class="fas fa-arrow-right"></i>';
    });
}

function handleRegister() {
    var nom = document.getElementById('regNom').value.trim();
    var prenom = document.getElementById('regPrenom').value.trim();
    var username = document.getElementById('regUsername').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var telephone = document.getElementById('regTelephone').value.trim();
    var role = document.getElementById('regRole').value;
    var password = document.getElementById('regPassword').value;
    var btn = document.getElementById('registerBtn');
    
    if (!nom || !prenom || !username || !email || !telephone || !role || !password) {
        alert('Tous les champs sont obligatoires'); return;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<span>Creation...</span><i class="fas fa-spinner fa-spin"></i>';
    
    auth.createUserWithEmailAndPassword(email, password).then(function(userCredential) {
        return db.collection('users').doc(userCredential.user.uid).set({
            nom:nom,prenom:prenom,username:username,email:email,telephone:telephone,role:role,
            authorized:'no',createdAt:firebase.firestore.FieldValue.serverTimestamp()
        });
    }).then(function() {
        alert('Compte cree ! En attente de validation par l\'administrateur.');
        showLoginPage();
    }).catch(function(e) {
        alert('Erreur: ' + e.message);
    }).finally(function() {
        btn.disabled = false;
        btn.innerHTML = '<span>S\'inscrire</span><i class="fas fa-check"></i>';
    });
}

function handleLogout() {
    auth.signOut().then(function() {
        localStorage.removeItem('currentUser');
        currentUser = null; currentUserData = null;
        showLoginPage();
    });
}

function showLoginError(msg) {
    var el = document.getElementById('loginError');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function hideLoginError() {
    var el = document.getElementById('loginError');
    if (el) el.style.display = 'none';
}

console.log('Chicken Way Ready');
