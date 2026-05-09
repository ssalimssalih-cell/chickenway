// ============================================
// CHICKEN WAY - COMPLETE SCRIPT
// VÉRIFICATION AVANT D'AFFICHER LE DASHBOARD
// ============================================

let currentUser = null;
let currentUserData = null;

// ============================================
// INITIALIZATION
// ============================================
window.addEventListener('DOMContentLoaded', function() {
    console.log('🍗 Chicken Way - Started');
    
    // ==========================================
    // DÉSACTIVER L'AFFICHAGE DU DASHBOARD PAR DÉFAUT
    // ==========================================
    document.getElementById('dashboardPage').classList.add('hidden');
    
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log('🔍 Checking authorization for:', user.email);
            currentUser = user;
            
            // ==========================================
            // VÉRIFIER AVANT D'AFFICHER QUOI QUE CE SOIT
            // ==========================================
            db.collection('users').doc(user.uid).get()
                .then(function(doc) {
                    if (!doc.exists) {
                        // Document Firestore non trouvé
                        console.log('❌ No Firestore document');
                        alert('❌ Account error. Please contact admin.');
                        auth.signOut();
                        showAuthPage();
                        return;
                    }
                    
                    var userData = doc.data();
                    console.log('📄 Authorized status:', userData.authorized);
                    
                    // ==========================================
                    // SI NON AUTORISÉ → RESTER SUR LOGIN
                    // ==========================================
                    if (userData.authorized !== 'yes') {
                        console.log('⏳ NOT AUTHORIZED - Staying on login page');
                        
                        // Déconnecter
                        auth.signOut();
                        
                        // Afficher page login avec message
                        showAuthPage();
                        
                        // Afficher erreur sur le formulaire login
                        setTimeout(function() {
                            showLoginError('⏳ Your account is not authorized yet.<br>Please wait for admin approval.');
                        }, 300);
                        
                        return; // ← STOP ! Ne pas continuer
                    }
                    
                    // ==========================================
                    // AUTORISÉ → AFFICHER DASHBOARD
                    // ==========================================
                    console.log('✅ AUTHORIZED - Loading dashboard');
                    currentUserData = { uid: doc.id, ...userData };
                    localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                    showDashboard();
                })
                .catch(function(error) {
                    console.error('❌ Error checking authorization:', error);
                    auth.signOut();
                    showAuthPage();
                });
        } else {
            console.log('👋 No user - Showing login page');
            currentUser = null;
            currentUserData = null;
            localStorage.removeItem('currentUser');
            showAuthPage();
        }
    });
});

// ============================================
// PAGE DISPLAY
// ============================================
function showAuthPage() {
    // Cacher dashboard, montrer auth
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('authPage').classList.remove('hidden');
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('registerContainer').classList.add('hidden');
    hideLoginError();
}

function showDashboard() {
    // VÉRIFICATION FINALE
    if (!currentUserData || currentUserData.authorized !== 'yes') {
        console.log('⏳ Blocked at showDashboard');
        auth.signOut();
        showAuthPage();
        return;
    }
    
    // Afficher dashboard, cacher auth
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    updateSidebarUserInfo();
    navigateTo('dashboard');
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

// ============================================
// AUTHENTICATION
// ============================================

// LOGIN
function handleLogin(event) {
    event.preventDefault();
    
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var btn = document.getElementById('loginBtn');
    
    if (!email || !password) {
        showLoginError('Please fill all fields');
        return false;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    hideLoginError();
    
    auth.signInWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            var user = userCredential.user;
            console.log('🔑 Auth OK, checking Firestore...');
            
            // Vérifier dans Firestore AVANT de continuer
            return db.collection('users').doc(user.uid).get()
                .then(function(doc) {
                    if (!doc.exists) {
                        throw new Error('NO_DOCUMENT');
                    }
                    
                    var userData = doc.data();
                    
                    // ==========================================
                    // NON AUTORISÉ → ERREUR SUR PLACE
                    // ==========================================
                    if (userData.authorized !== 'yes') {
                        // Déconnecter immédiatement
                        auth.signOut();
                        
                        // Afficher erreur sur le formulaire
                        showLoginError('⏳ Your account is pending admin approval.<br><br>You will be able to login once an administrator authorizes your account.');
                        
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
                        
                        return; // ← STOP
                    }
                    
                    // ==========================================
                    // AUTORISÉ → DASHBOARD
                    // ==========================================
                    currentUserData = { uid: doc.id, ...userData };
                    localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                    showDashboard();
                });
        })
        .catch(function(error) {
            console.error('❌ Error:', error.code);
            
            if (error.message === 'NO_DOCUMENT') {
                showLoginError('Account error. Contact admin.');
            } else if (error.code === 'auth/user-not-found') {
                showLoginError('No account found with this email.');
            } else if (error.code === 'auth/wrong-password') {
                showLoginError('Incorrect password.');
            } else if (error.code === 'auth/too-many-requests') {
                showLoginError('Too many attempts. Try again later.');
            } else if (error.code === 'auth/invalid-email') {
                showLoginError('Invalid email format.');
            } else {
                showLoginError(error.message);
            }
            
            // S'assurer que l'utilisateur est déconnecté
            if (auth.currentUser) {
                auth.signOut();
            }
        })
        .finally(function() {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        });
    
    return false;
}

// ============================================
// AFFICHER ERREUR SUR LE FORMULAIRE LOGIN
// ============================================
function showLoginError(message) {
    // Chercher ou créer l'élément d'erreur
    var errorEl = document.getElementById('loginError');
    
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.id = 'loginError';
        errorEl.style.cssText = `
            background: #fee2e2;
            color: #991b1b;
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 20px;
            font-size: 0.9rem;
            font-weight: 500;
            text-align: center;
            border: 2px solid #fecaca;
            animation: shakeError 0.5s ease;
            line-height: 1.5;
        `;
        
        // Insérer avant le formulaire
        var form = document.getElementById('loginForm');
        form.parentNode.insertBefore(errorEl, form);
    }
    
    errorEl.innerHTML = '❌ ' + message;
    errorEl.style.display = 'block';
    
    // Animation
    errorEl.style.animation = 'none';
    errorEl.offsetHeight;
    errorEl.style.animation = 'shakeError 0.5s ease';
}

function hideLoginError() {
    var errorEl = document.getElementById('loginError');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

// REGISTER
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
        alert('❌ All fields are required');
        return false;
    }
    
    if (password.length < 6) {
        alert('❌ Password: minimum 6 characters');
        return false;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    
    auth.createUserWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            var user = userCredential.user;
            
            return db.collection('users').doc(user.uid).set({
                nom: nom,
                prenom: prenom,
                username: username,
                email: email,
                telephone: telephone,
                role: role,
                authorized: 'no',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(function() {
            alert('✅ Account created successfully!\n\n⏳ Waiting for admin authorization.\n\nYou will not be able to login until an administrator approves your account.');
            document.getElementById('registerForm').reset();
            showLogin();
        })
        .catch(function(error) {
            var msg = 'Error';
            if (error.code === 'auth/email-already-in-use') msg = 'Email already in use';
            else msg = error.message;
            alert('❌ ' + msg);
        })
        .finally(function() {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        });
    
    return false;
}

// LOGOUT
function handleLogout() {
    auth.signOut()
        .then(function() {
            localStorage.removeItem('currentUser');
            currentUser = null;
            currentUserData = null;
            showAuthPage();
        });
}

// ============================================
// USER DATA
// ============================================
function loadUserData(uid) {
    db.collection('users').doc(uid).get()
        .then(function(doc) {
            if (doc.exists) {
                currentUserData = { uid: doc.id, ...doc.data() };
                localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                updateSidebarUserInfo();
            }
        })
        .catch(function(error) {
            console.error('❌ Error:', error);
        });
}

function updateSidebarUserInfo() {
    var el = document.getElementById('sidebarUserInfo');
    if (el && currentUserData) {
        el.innerHTML = '<i class="fas fa-user-circle"></i> ' + 
            currentUserData.prenom + ' ' + currentUserData.nom + 
            ' <small style="color:#f39c12;">(' + currentUserData.role + ')</small>';
    }
}

// ============================================
// NAVIGATION
// ============================================
function navigateTo(page) {
    if (!currentUserData || currentUserData.authorized !== 'yes') {
        auth.signOut();
        showAuthPage();
        return;
    }
    
    var items = document.querySelectorAll('.nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    
    var pages = [
        'dashboard', 'pos', 'categories', 'products',
        'clients', 'fournisseurs', 'ventes', 'credits', 'depenses',
        'statistiques', 'options'
    ];
    
    var index = pages.indexOf(page);
    if (index >= 0 && items[index]) items[index].classList.add('active');
    
    var titles = {
        'dashboard': 'Dashboard',
        'pos': 'Point of Sale',
        'categories': 'Categories',
        'products': 'Products',
        'clients': 'Clients',
        'fournisseurs': 'Suppliers',
        'ventes': 'Sales',
        'credits': 'Credits',
        'depenses': 'Expenses',
        'statistiques': 'Statistics',
        'options': 'Options'
    };
    
    var icons = {
        'dashboard': 'fa-th-large',
        'pos': 'fa-cash-register',
        'categories': 'fa-layer-group',
        'products': 'fa-utensils',
        'clients': 'fa-users',
        'fournisseurs': 'fa-truck',
        'ventes': 'fa-shopping-cart',
        'credits': 'fa-credit-card',
        'depenses': 'fa-money-bill-wave',
        'statistiques': 'fa-chart-bar',
        'options': 'fa-cog'
    };
    
    document.getElementById('pageTitle').textContent = titles[page] || 'Page';
    var hi = document.querySelector('.header-title i');
    if (hi && icons[page]) hi.className = 'fas ' + icons[page];
    
    var content = document.getElementById('dynamicContent');
    
    if (page === 'dashboard') {
        content.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-bag"></i></div><div class="stat-info"><span class="stat-label">Orders</span><span class="stat-value" id="todayOrders">0</span></div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-euro-sign"></i></div><div class="stat-info"><span class="stat-label">Revenue</span><span class="stat-value" id="todayRevenue">0.00</span></div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-utensils"></i></div><div class="stat-info"><span class="stat-label">Products</span><span class="stat-value" id="productsCount">0</span></div></div>
                <div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value" id="clientsCount">0</span></div></div>
            </div>
            <div class="content-card"><div class="card-header"><h3><i class="fas fa-clock"></i> Recent Orders</h3></div><table class="data-table"><thead><tr><th>N°</th><th>Client</th><th>Total</th><th>Date</th></tr></thead><tbody id="recentOrdersTable"><tr><td colspan="4" style="text-align:center;">No orders</td></tr></tbody></table></div>
        `;
        loadDashboardStats();
    } else if (page === 'options') {
        loadOptionsPage();
    } else {
        content.innerHTML = `<div class="content-card"><div class="card-header"><h3><i class="fas ${icons[page]}"></i> ${titles[page]}</h3></div><div style="text-align:center;padding:60px;color:#94a3b8;"><i class="fas ${icons[page]}" style="font-size:4rem;margin-bottom:20px;display:block;"></i><p style="font-size:1.3rem;font-weight:600;">${titles[page]}</p><p>Under development</p></div></div>`;
    }
}

function loadDashboardStats() {
    db.collection('products').get().then(function(s) { var e = document.getElementById('productsCount'); if (e) e.textContent = s.size; }).catch(function() {});
    db.collection('users').where('role','==','client').get().then(function(s) { var e = document.getElementById('clientsCount'); if (e) e.textContent = s.size; }).catch(function() {});
    var today = new Date(); today.setHours(0,0,0,0);
    db.collection('orders').where('createdAt','>=',today).get().then(function(s) {
        var e = document.getElementById('todayOrders'); if (e) e.textContent = s.size;
        var t = 0; s.forEach(function(d) { t += d.data().total || 0; });
        var r = document.getElementById('todayRevenue'); if (r) r.textContent = t.toFixed(2);
    }).catch(function() {});
}

// ============================================
// OPTIONS
// ============================================
function loadOptionsPage() {
    var content = document.getElementById('dynamicContent');
    if (!currentUserData || currentUserData.role !== 'admin') {
        content.innerHTML = '<div class="content-card"><div style="text-align:center;padding:60px;color:#ef4444;"><i class="fas fa-lock" style="font-size:4rem;margin-bottom:20px;"></i><p style="font-size:1.3rem;font-weight:600;">Access Denied</p></div></div>';
        return;
    }
    content.innerHTML = `
        <div class="stats-grid" style="margin-bottom:20px;">
            <div class="stat-card"><div class="stat-icon" style="background:#fef3c7;"><i class="fas fa-clock" style="color:#d97706;"></i></div><div class="stat-info"><span class="stat-label">Pending</span><span class="stat-value" id="pendingCount">0</span></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#dcfce7;"><i class="fas fa-check-circle" style="color:#16a34a;"></i></div><div class="stat-info"><span class="stat-label">Authorized</span><span class="stat-value" id="authorizedCount">0</span></div></div>
            <div class="stat-card"><div class="stat-icon" style="background:#e0e7ff;"><i class="fas fa-users" style="color:#4f46e5;"></i></div><div class="stat-info"><span class="stat-label">Total</span><span class="stat-value" id="totalUsers">0</span></div></div>
        </div>
        <div class="content-card">
            <div class="card-header"><h3><i class="fas fa-users-cog"></i> User Management</h3><button class="btn-add" onclick="refreshUsers()"><i class="fas fa-sync-alt"></i> Refresh</button></div>
            <div class="table-container"><table class="data-table"><thead><tr><th>Username</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody id="usersTableBody"></tbody></table></div>
        </div>`;
    loadUsersList();
}

function loadUsersList() {
    db.collection('users').orderBy('createdAt','desc').get().then(function(snapshot) {
        var pending=0, authorized=0, tbody=document.getElementById('usersTableBody');
        tbody.innerHTML='';
        if(snapshot.empty){tbody.innerHTML='<tr><td colspan="7">No users</td></tr>';return;}
        snapshot.forEach(function(doc){
            var u=doc.data(), id=doc.id;
            if(u.authorized==='no')pending++;else authorized++;
            var badge=u.authorized==='yes'?'<span class="status-success">✅ Authorized</span>':'<span class="status-warning">⏳ Pending</span>';
            var d=u.createdAt?new Date(u.createdAt.seconds*1000).toLocaleDateString('fr-FR'):'N/A';
            var btn=u.authorized==='no'?
                '<button class="btn-add" style="padding:6px 10px;font-size:0.7rem;margin-right:5px;" onclick="authorizeUser(\''+id+'\')"><i class="fas fa-check"></i> Authorize</button><button class="btn-delete" style="padding:6px 10px;font-size:0.7rem;" onclick="deleteUser(\''+id+'\')"><i class="fas fa-trash"></i> Delete</button>':
                '<button class="btn-edit" style="padding:6px 10px;font-size:0.7rem;margin-right:5px;color:#d97706;" onclick="deauthorizeUser(\''+id+'\')"><i class="fas fa-ban"></i> Deauthorize</button><button class="btn-delete" style="padding:6px 10px;font-size:0.7rem;" onclick="deleteUser(\''+id+'\')"><i class="fas fa-trash"></i> Delete</button>';
            var r=document.createElement('tr');
            r.innerHTML='<td><strong>@'+u.username+'</strong></td><td>'+u.prenom+' '+u.nom+'</td><td>'+u.email+'</td><td>'+u.role+'</td><td>'+badge+'</td><td>'+d+'</td><td>'+btn+'</td>';
            tbody.appendChild(r);
        });
        document.getElementById('pendingCount').textContent=pending;
        document.getElementById('authorizedCount').textContent=authorized;
        document.getElementById('totalUsers').textContent=snapshot.size;
    });
}

function authorizeUser(uid){if(confirm('Authorize?')){db.collection('users').doc(uid).update({authorized:'yes',updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){alert('✅ Done!');loadUsersList();});}}
function deauthorizeUser(uid){if(confirm('Deauthorize?')){db.collection('users').doc(uid).update({authorized:'no',updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){alert('✅ Done!');loadUsersList();});}}
function deleteUser(uid){if(confirm('DELETE?')){db.collection('users').doc(uid).delete().then(function(){alert('✅ Deleted!');loadUsersList();});}}
function refreshUsers(){loadUsersList();}

console.log('✅ Ready');
