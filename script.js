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
    navigateTo('dashboard');
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
            <li class="nav-item active" onclick="navigateTo('dashboard')"><i class="fas fa-th-large"></i> Dashboard</li>
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
    
    if (currentUserData.role === 'caissier' && page !== 'pos') {
        return;
    }
    
    var items = document.querySelectorAll('#navMenu .nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    
    var pages = ['dashboard', 'pos', 'categories', 'products', 'clients', 'fournisseurs', 'ventes', 'credits', 'depenses', 'statistiques', 'options'];
    var index = pages.indexOf(page);
    if (index >= 0 && items[index]) items[index].classList.add('active');
    
    var titles = {
        'dashboard': 'Dashboard', 'pos': 'Point de Vente (POS)', 'categories': 'Categories',
        'products': 'Produits', 'clients': 'Clients', 'fournisseurs': 'Fournisseurs',
        'ventes': 'Ventes', 'credits': 'Credits', 'depenses': 'Depenses',
        'statistiques': 'Statistiques', 'options': 'Options'
    };
    
    document.getElementById('pageTitle').textContent = titles[page] || 'Page';
    
    var content = document.getElementById('dynamicContent');
    
    if (page === 'dashboard') {
        content.innerHTML = '<div class="stats-grid"><div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-bag"></i></div><div class="stat-info"><span class="stat-label">Commandes</span><span class="stat-value" id="todayOrders">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-euro-sign"></i></div><div class="stat-info"><span class="stat-label">Revenus</span><span class="stat-value" id="todayRevenue">0.00</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-utensils"></i></div><div class="stat-info"><span class="stat-label">Produits</span><span class="stat-value" id="productsCount">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value" id="clientsCount">0</span></div></div></div>';
        loadDashboardStats();
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
        content.innerHTML = `
            <div class="content-card">
                <div class="card-header"><h3><i class="fas fa-shopping-basket"></i> Commander en ligne</h3></div>
                <div style="text-align:center;padding:60px;">
                    <i class="fas fa-utensils" style="font-size:4rem;color:#f39c12;margin-bottom:20px;"></i>
                    <p style="font-size:1.3rem;font-weight:600;">Menu du restaurant</p>
                    <p style="color:#64748b;margin-top:10px;">Choisissez vos plats et passez commande</p>
                    <button class="btn-add" style="margin-top:20px;font-size:1rem;padding:12px 30px;" onclick="alert('Fonctionnalite a venir')">
                        <i class="fas fa-shopping-cart"></i> Voir le menu
                    </button>
                </div>
            </div>
        `;
    } else if (page === 'historique') {
        content.innerHTML = `
            <div class="content-card">
                <div class="card-header"><h3><i class="fas fa-history"></i> Historique des commandes</h3></div>
                <div class="table-container">
                    <table class="data-table">
                        <thead><tr><th>N</th><th>Date</th><th>Total</th><th>Statut</th></tr></thead>
                        <tbody id="clientOrdersTable">
                            <tr><td colspan="4" style="text-align:center;">Aucune commande</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        loadClientOrders();
    } else if (page === 'parametres') {
        content.innerHTML = `
            <div class="content-card">
                <div class="card-header"><h3><i class="fas fa-cog"></i> Parametres du compte</h3></div>
                <div id="profileMessage" style="display:none;padding:12px;border-radius:8px;margin-bottom:15px;"></div>
                <form onsubmit="return updateClientProfile(event)">
                    <p style="margin-bottom:15px;"><strong>Email actuel:</strong> ${currentUserData.email}</p>
                    <p style="margin-bottom:15px;"><strong>Telephone actuel:</strong> ${currentUserData.telephone || 'Non defini'}</p>
                    
                    <div class="input-group" style="margin-bottom:15px;">
                        <i class="fas fa-phone"></i>
                        <input type="tel" id="clientTelephone" value="${currentUserData.telephone || ''}" placeholder="Nouveau telephone">
                    </div>
                    <div class="input-group" style="margin-bottom:15px;">
                        <i class="fas fa-lock"></i>
                        <input type="password" id="clientNewPassword" placeholder="Nouveau mot de passe (min 6 caracteres)">
                    </div>
                    <div class="input-group" style="margin-bottom:15px;">
                        <i class="fas fa-lock"></i>
                        <input type="password" id="clientConfirmPassword" placeholder="Confirmer le mot de passe">
                    </div>
                    <button type="submit" class="btn-add" style="width:100%;justify-content:center;padding:12px;">
                        <i class="fas fa-save"></i> Enregistrer les modifications
                    </button>
                </form>
            </div>
        `;
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var btn = document.getElementById('loginBtn');
    
    if (!email || !password) {
        showLoginError('Remplissez tous les champs');
        return false;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    hideLoginError();
    
    auth.signInWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            return db.collection('users').doc(userCredential.user.uid).get()
                .then(function(doc) {
                    if (!doc.exists) {
                        throw new Error('NO_DOCUMENT');
                    }
                    
                    var userData = doc.data();
                    
                    if (userData.authorized !== 'yes') {
                        auth.signOut();
                        showLoginError('Compte en attente de validation.');
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
                        return;
                    }
                    
                    currentUserData = { uid: doc.id, ...userData };
                    localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                    
                    if (userData.role === 'client') {
                        showClientPage();
                    } else {
                        showDashboard();
                    }
                });
        })
        .catch(function(error) {
            var msg = 'Erreur';
            if (error.message === 'NO_DOCUMENT') msg = 'Erreur compte';
            else if (error.code === 'auth/user-not-found') msg = 'Email non trouve';
            else if (error.code === 'auth/wrong-password') msg = 'Mot de passe incorrect';
            else msg = error.message;
            showLoginError(msg);
        })
        .finally(function() {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
        });
    
    return false;
}

function showLoginError(message) {
    var errorEl = document.getElementById('loginError');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.id = 'loginError';
        errorEl.style.cssText = 'background:#fee2e2;color:#991b1b;padding:15px;border-radius:12px;margin-bottom:20px;font-size:0.9rem;text-align:center;border:2px solid #fecaca;';
        var form = document.getElementById('loginForm');
        form.parentNode.insertBefore(errorEl, form);
    }
    errorEl.innerHTML = 'X ' + message;
    errorEl.style.display = 'block';
}

function hideLoginError() {
    var errorEl = document.getElementById('loginError');
    if (errorEl) errorEl.style.display = 'none';
}

function handleRegister(event) {
    event.preventDefault();
    
    var nom = document.getElementById('regNom').value.trim();
    var prenom = document.getElementById('regPrenom').value.trim();
    var username = document.getElementById('regUsername').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var telephone = document.getElementById('regTelephone').value.trim();
    var role = document.getElementById('regRole').value;
    var password = document.getElementById('regPassword').value;
    var btn = document.getElementById('registerBtn');
    
    if (!nom || !prenom || !username || !email || !telephone || !role || !password) {
        alert('Tous les champs sont obligatoires');
        return false;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creation...';
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            return db.collection('users').doc(userCredential.user.uid).set({
                nom: nom, prenom: prenom, username: username,
                email: email, telephone: telephone, role: role,
                authorized: 'no',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(function() {
            alert('Compte cree ! En attente de validation.');
            document.getElementById('registerForm').reset();
            showLogin();
        })
        .catch(function(error) {
            alert('Erreur: ' + error.message);
        })
        .finally(function() {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Creer mon compte';
        });
    
    return false;
}

function handleLogout() {
    auth.signOut().then(function() {
        localStorage.removeItem('currentUser');
        currentUser = null;
        currentUserData = null;
        showAuthPage();
    });
}

function updateSidebarUserInfo() {
    var el = document.getElementById('sidebarUserInfo');
    if (el && currentUserData) {
        el.innerHTML = '<i class="fas fa-user-circle"></i> ' + currentUserData.prenom + ' ' + currentUserData.nom + ' <small style="color:#f39c12;">(' + currentUserData.role + ')</small>';
    }
}

function updateClientSidebarInfo() {
    var el = document.getElementById('clientSidebarInfo');
    if (el && currentUserData) {
        el.innerHTML = '<i class="fas fa-user-circle"></i> ' + currentUserData.prenom + ' ' + currentUserData.nom;
    }
}

function loadDashboardStats() {
    db.collection('products').get().then(function(s) { var e = document.getElementById('productsCount'); if (e) e.textContent = s.size; }).catch(function() {});
    db.collection('users').where('role','==','client').get().then(function(s) { var e = document.getElementById('clientsCount'); if (e) e.textContent = s.size; }).catch(function() {});
}

function loadOptionsPage(content) {
    if (!currentUserData || currentUserData.role !== 'admin') {
        content.innerHTML = '<div class="content-card"><p>Access Denied</p></div>';
        return;
    }
    content.innerHTML = '<div class="stats-grid"><div class="stat-card"><div class="stat-info"><span class="stat-label">En attente</span><span class="stat-value" id="pendingCount">0</span></div></div><div class="stat-card"><div class="stat-info"><span class="stat-label">Autorises</span><span class="stat-value" id="authorizedCount">0</span></div></div><div class="stat-card"><div class="stat-info"><span class="stat-label">Total</span><span class="stat-value" id="totalUsers">0</span></div></div></div><div class="content-card"><div class="card-header"><h3>Gestion utilisateurs</h3><button class="btn-add" onclick="refreshUsers()">Actualiser</button></div><table class="data-table"><thead><tr><th>Username</th><th>Nom</th><th>Email</th><th>Role</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="usersTableBody"></tbody></table></div>';
    loadUsersList();
}

function loadUsersList() {
    db.collection('users').orderBy('createdAt','desc').get().then(function(snapshot) {
        var pending=0, authorized=0, tbody=document.getElementById('usersTableBody');
        tbody.innerHTML='';
        if(snapshot.empty){tbody.innerHTML='<tr><td colspan="6">Aucun</td></tr>';return;}
        snapshot.forEach(function(doc){
            var u=doc.data(), id=doc.id;
            if(u.authorized==='no')pending++;else authorized++;
            var badge=u.authorized==='yes'?'Autorise':'En attente';
            var btn=u.authorized==='no'?'<button onclick="authorizeUser(\''+id+'\')">Autoriser</button> <button onclick="deleteUser(\''+id+'\')">Supprimer</button>':'<button onclick="deauthorizeUser(\''+id+'\')">Bloquer</button> <button onclick="deleteUser(\''+id+'\')">Supprimer</button>';
            tbody.innerHTML+='<tr><td>@'+u.username+'</td><td>'+u.prenom+' '+u.nom+'</td><td>'+u.email+'</td><td>'+u.role+'</td><td>'+badge+'</td><td>'+btn+'</td></tr>';
        });
        document.getElementById('pendingCount').textContent=pending;
        document.getElementById('authorizedCount').textContent=authorized;
        document.getElementById('totalUsers').textContent=snapshot.size;
    });
}

function authorizeUser(uid){
    if(confirm('Autoriser ?')){
        db.collection('users').doc(uid).update({
            authorized:'yes',
            updatedAt:firebase.firestore.FieldValue.serverTimestamp()
        }).then(function(){
            alert('Utilisateur autorise !');
            loadUsersList();
        }).catch(function(e){
            alert('Erreur: '+e.message);
        });
    }
}

function deauthorizeUser(uid){
    if(confirm('Bloquer ?')){
        db.collection('users').doc(uid).update({
            authorized:'no',
            updatedAt:firebase.firestore.FieldValue.serverTimestamp()
        }).then(function(){
            alert('Utilisateur bloque !');
            loadUsersList();
        }).catch(function(e){
            alert('Erreur: '+e.message);
        });
    }
}

function deleteUser(uid){
    if(confirm('Supprimer ?')){
        db.collection('users').doc(uid).delete().then(function(){
            alert('Supprime !');
            loadUsersList();
        }).catch(function(e){
            alert('Erreur: '+e.message);
        });
    }
}

function refreshUsers(){loadUsersList();}

function loadClientOrders() {
    if (!currentUser) return;
    
    db.collection('orders')
        .where('clientId','==',currentUser.uid)
        .orderBy('createdAt','desc')
        .get()
        .then(function(snapshot) {
            var tbody = document.getElementById('clientOrdersTable');
            if (!tbody) return;
            tbody.innerHTML = '';
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="4">Aucune commande</td></tr>';
                return;
            }
            snapshot.forEach(function(doc) {
                var o = doc.data();
                var d = o.createdAt ? new Date(o.createdAt.seconds*1000).toLocaleDateString() : 'N/A';
                tbody.innerHTML += '<tr><td>#'+doc.id.slice(-6)+'</td><td>'+d+'</td><td>'+(o.total||0).toFixed(2)+' EUR</td><td>'+o.status+'</td></tr>';
            });
        })
        .catch(function(e) {
            console.log('No orders yet');
        });
}

// ============================================
// UPDATE CLIENT PROFILE - CORRIGE
// ============================================
function updateClientProfile(event) {
    event.preventDefault();
    
    var newPhone = document.getElementById('clientTelephone').value.trim();
    var newPassword = document.getElementById('clientNewPassword').value;
    var confirmPassword = document.getElementById('clientConfirmPassword').value;
    var msgEl = document.getElementById('profileMessage');
    
    // Valider mot de passe
    if (newPassword.length > 0) {
        if (newPassword.length < 6) {
            msgEl.style.display = 'block';
            msgEl.style.background = '#fee2e2';
            msgEl.style.color = '#991b1b';
            msgEl.textContent = 'Le mot de passe doit contenir au moins 6 caracteres';
            return false;
        }
        if (newPassword !== confirmPassword) {
            msgEl.style.display = 'block';
            msgEl.style.background = '#fee2e2';
            msgEl.style.color = '#991b1b';
            msgEl.textContent = 'Les mots de passe ne correspondent pas';
            return false;
        }
    }
    
    // Mettre a jour Firestore
    var updates = {
        telephone: newPhone,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('users').doc(currentUser.uid).update(updates)
        .then(function() {
            // Mettre a jour mot de passe si fourni
            if (newPassword.length >= 6) {
                return currentUser.updatePassword(newPassword);
            }
        })
        .then(function() {
            msgEl.style.display = 'block';
            msgEl.style.background = '#dcfce7';
            msgEl.style.color = '#16a34a';
            msgEl.textContent = 'Profil mis a jour avec succes !';
            
            // Mettre a jour les donnees locales
            currentUserData.telephone = newPhone;
            localStorage.setItem('currentUser', JSON.stringify(currentUserData));
        })
        .catch(function(error) {
            console.error('Error:', error);
            msgEl.style.display = 'block';
            msgEl.style.background = '#fee2e2';
            msgEl.style.color = '#991b1b';
            
            if (error.code === 'auth/requires-recent-login') {
                msgEl.textContent = 'Veuillez vous reconnecter pour changer le mot de passe.';
            } else {
                msgEl.textContent = 'Erreur: ' + error.message;
            }
        });
    
    return false;
}

console.log('Ready');
