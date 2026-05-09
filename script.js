let currentUser = null;
let currentUserData = null;

window.addEventListener('DOMContentLoaded', function() {
    console.log('Chicken Way Started');
    
    document.getElementById('dashboardPage').classList.add('hidden');
    
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log('User connected:', user.email);
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
                        console.log('Not authorized');
                        auth.signOut();
                        showAuthPage();
                        setTimeout(function() {
                            showLoginError('Your account is not authorized yet. Please wait for admin approval.');
                        }, 300);
                        return;
                    }
                    
                    console.log('Authorized');
                    currentUserData = { uid: doc.id, ...userData };
                    localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                    showDashboard();
                })
                .catch(function(error) {
                    console.error('Error:', error);
                    auth.signOut();
                    showAuthPage();
                });
        } else {
            console.log('No user');
            currentUser = null;
            currentUserData = null;
            localStorage.removeItem('currentUser');
            showAuthPage();
        }
    });
});

function showAuthPage() {
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('authPage').classList.remove('hidden');
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('registerContainer').classList.add('hidden');
    hideLoginError();
}

function showDashboard() {
    if (!currentUserData || currentUserData.authorized !== 'yes') {
        auth.signOut();
        showAuthPage();
        return;
    }
    
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
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    hideLoginError();
    
    auth.signInWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            var user = userCredential.user;
            
            return db.collection('users').doc(user.uid).get()
                .then(function(doc) {
                    if (!doc.exists) {
                        throw new Error('NO_DOCUMENT');
                    }
                    
                    var userData = doc.data();
                    
                    if (userData.authorized !== 'yes') {
                        auth.signOut();
                        showLoginError('Your account is pending admin approval.');
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
                        return;
                    }
                    
                    currentUserData = { uid: doc.id, ...userData };
                    localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                    showDashboard();
                });
        })
        .catch(function(error) {
            console.error('Error:', error.code);
            
            if (error.message === 'NO_DOCUMENT') {
                showLoginError('Account error');
            } else if (error.code === 'auth/user-not-found') {
                showLoginError('Email not found');
            } else if (error.code === 'auth/wrong-password') {
                showLoginError('Wrong password');
            } else if (error.code === 'auth/too-many-requests') {
                showLoginError('Too many attempts');
            } else {
                showLoginError(error.message);
            }
            
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

function showLoginError(message) {
    var errorEl = document.getElementById('loginError');
    
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.id = 'loginError';
        errorEl.style.background = '#fee2e2';
        errorEl.style.color = '#991b1b';
        errorEl.style.padding = '15px';
        errorEl.style.borderRadius = '12px';
        errorEl.style.marginBottom = '20px';
        errorEl.style.fontSize = '0.9rem';
        errorEl.style.fontWeight = '500';
        errorEl.style.textAlign = 'center';
        errorEl.style.border = '2px solid #fecaca';
        errorEl.style.lineHeight = '1.5';
        
        var form = document.getElementById('loginForm');
        form.parentNode.insertBefore(errorEl, form);
    }
    
    errorEl.innerHTML = 'X ' + message;
    errorEl.style.display = 'block';
}

function hideLoginError() {
    var errorEl = document.getElementById('loginError');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
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
        alert('All fields are required');
        return false;
    }
    
    if (password.length < 6) {
        alert('Password minimum 6 characters');
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
            alert('Account created! Waiting for admin approval.');
            document.getElementById('registerForm').reset();
            showLogin();
        })
        .catch(function(error) {
            var msg = 'Error';
            if (error.code === 'auth/email-already-in-use') msg = 'Email already in use';
            else msg = error.message;
            alert(msg);
        })
        .finally(function() {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        });
    
    return false;
}

function handleLogout() {
    auth.signOut()
        .then(function() {
            localStorage.removeItem('currentUser');
            currentUser = null;
            currentUserData = null;
            showAuthPage();
        });
}

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
            console.error('Error:', error);
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
        'pos': 'POS',
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
        content.innerHTML = '<div class="stats-grid"><div class="stat-card"><div class="stat-icon"><i class="fas fa-shopping-bag"></i></div><div class="stat-info"><span class="stat-label">Orders</span><span class="stat-value" id="todayOrders">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-euro-sign"></i></div><div class="stat-info"><span class="stat-label">Revenue</span><span class="stat-value" id="todayRevenue">0.00</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-utensils"></i></div><div class="stat-info"><span class="stat-label">Products</span><span class="stat-value" id="productsCount">0</span></div></div><div class="stat-card"><div class="stat-icon"><i class="fas fa-users"></i></div><div class="stat-info"><span class="stat-label">Clients</span><span class="stat-value" id="clientsCount">0</span></div></div></div><div class="content-card"><div class="card-header"><h3>Recent Orders</h3></div><table class="data-table"><thead><tr><th>N</th><th>Client</th><th>Total</th><th>Date</th></tr></thead><tbody id="recentOrdersTable"><tr><td colspan="4">No orders</td></tr></tbody></table></div>';
        loadDashboardStats();
    } else if (page === 'options') {
        loadOptionsPage();
    } else {
        content.innerHTML = '<div class="content-card"><div class="card-header"><h3>' + titles[page] + '</h3></div><div style="text-align:center;padding:60px;"><p>' + titles[page] + ' - Under development</p></div></div>';
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

function loadOptionsPage() {
    var content = document.getElementById('dynamicContent');
    if (!currentUserData || currentUserData.role !== 'admin') {
        content.innerHTML = '<div class="content-card"><div style="text-align:center;padding:60px;"><p>Access Denied</p></div></div>';
        return;
    }
    content.innerHTML = '<div class="stats-grid"><div class="stat-card"><div class="stat-info"><span class="stat-label">Pending</span><span class="stat-value" id="pendingCount">0</span></div></div><div class="stat-card"><div class="stat-info"><span class="stat-label">Authorized</span><span class="stat-value" id="authorizedCount">0</span></div></div><div class="stat-card"><div class="stat-info"><span class="stat-label">Total</span><span class="stat-value" id="totalUsers">0</span></div></div></div><div class="content-card"><div class="card-header"><h3>User Management</h3><button class="btn-add" onclick="refreshUsers()">Refresh</button></div><table class="data-table"><thead><tr><th>Username</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody id="usersTableBody"></tbody></table></div>';
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
            var badge=u.authorized==='yes'?'Authorized':'Pending';
            var d=u.createdAt?new Date(u.createdAt.seconds*1000).toLocaleDateString():'N/A';
            var btn=u.authorized==='no'?'<button onclick="authorizeUser(\''+id+'\')">Authorize</button> <button onclick="deleteUser(\''+id+'\')">Delete</button>':'<button onclick="deauthorizeUser(\''+id+'\')">Deauthorize</button> <button onclick="deleteUser(\''+id+'\')">Delete</button>';
            var r=document.createElement('tr');
            r.innerHTML='<td>@'+u.username+'</td><td>'+u.prenom+' '+u.nom+'</td><td>'+u.email+'</td><td>'+u.role+'</td><td>'+badge+'</td><td>'+d+'</td><td>'+btn+'</td>';
            tbody.appendChild(r);
        });
        document.getElementById('pendingCount').textContent=pending;
        document.getElementById('authorizedCount').textContent=authorized;
        document.getElementById('totalUsers').textContent=snapshot.size;
    });
}

function authorizeUser(uid){
    if(confirm('Authorize this user?')){
        db.collection('users').doc(uid).update({authorized:'yes',updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){loadUsersList();});
    }
}

function deauthorizeUser(uid){
    if(confirm('Deauthorize this user?')){
        db.collection('users').doc(uid).update({authorized:'no',updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){loadUsersList();});
    }
}

function deleteUser(uid){
    if(confirm('Delete this user permanently?')){
        db.collection('users').doc(uid).delete().then(function(){loadUsersList();});
    }
}

function refreshUsers(){loadUsersList();}
