// ============================================
// CHICKEN WAY - COMPLETE SCRIPT
// ============================================

let currentUser = null;
let currentUserData = null;

// ============================================
// INITIALIZATION
// ============================================
window.addEventListener('DOMContentLoaded', function() {
    console.log('🍗 Chicken Way - Started');
    
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log('✅ User connected:', user.email);
            currentUser = user;
            loadUserData(user.uid);
            showDashboard();
        } else {
            console.log('👋 No user connected');
            currentUser = null;
            currentUserData = null;
            showAuthPage();
        }
    });
});

// ============================================
// PAGE DISPLAY
// ============================================
function showAuthPage() {
    document.getElementById('authPage').classList.remove('hidden');
    document.getElementById('dashboardPage').classList.add('hidden');
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('registerContainer').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('authPage').classList.add('hidden');
    document.getElementById('dashboardPage').classList.remove('hidden');
    updateSidebarUserInfo();
    navigateTo('dashboard');
}

function showLogin() {
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('registerContainer').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('registerContainer').classList.remove('hidden');
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
        alert('❌ Please fill all fields');
        return false;
    }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    
    auth.signInWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            return db.collection('users').doc(userCredential.user.uid).get();
        })
        .then(function(doc) {
            if (doc.exists) {
                var userData = doc.data();
                
                // CHECK IF AUTHORIZED
                if (userData.authorized !== 'yes') {
                    alert('⏳ Your account has not been authorized yet.\n\nPlease wait for admin approval.');
                    auth.signOut();
                    return;
                }
                
                // AUTHORIZED - LOGIN SUCCESS
                currentUserData = { uid: doc.id, ...userData };
                localStorage.setItem('currentUser', JSON.stringify(currentUserData));
                alert('✅ Welcome ' + currentUserData.prenom + ' !');
                showDashboard();
            } else {
                alert('❌ Profile not found');
                auth.signOut();
            }
        })
        .catch(function(error) {
            console.error('❌ Login error:', error.code);
            var msg = 'Error';
            if (error.code === 'auth/user-not-found') msg = '❌ Email not found';
            else if (error.code === 'auth/wrong-password') msg = '❌ Wrong password';
            else if (error.code === 'auth/too-many-requests') msg = '❌ Too many attempts. Try later.';
            else msg = '❌ ' + error.message;
            alert(msg);
        })
        .finally(function() {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        });
    
    return false;
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
    
    // Validation
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
    
    // Create user - ALWAYS authorized = "no"
    auth.createUserWithEmailAndPassword(email, password)
        .then(function(userCredential) {
            var user = userCredential.user;
            
            // Save to Firestore
            return db.collection('users').doc(user.uid).set({
                nom: nom,
                prenom: prenom,
                username: username,
                email: email,
                telephone: telephone,
                role: role,
                authorized: 'no', // ALWAYS "no" - waiting for admin approval
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(function() {
            alert('✅ Account created successfully!\n\n⏳ Waiting for admin authorization.\n\nYou will be able to login once approved.');
            document.getElementById('registerForm').reset();
            showLogin();
        })
        .catch(function(error) {
            console.error('❌ Register error:', error.code);
            var msg = 'Error';
            if (error.code === 'auth/email-already-in-use') msg = '❌ Email already in use';
            else if (error.code === 'auth/weak-password') msg = '❌ Password too weak';
            else if (error.code === 'auth/operation-not-allowed') msg = '❌ Email/Password signup not enabled in Firebase Console';
            else msg = '❌ ' + error.message;
            alert(msg);
        })
        .finally(function() {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        });
    
    return false;
}

// LOGOUT
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.signOut()
            .then(function() {
                localStorage.removeItem('currentUser');
                currentUser = null;
                currentUserData = null;
                showAuthPage();
            })
            .catch(function(error) {
                console.error('❌ Logout error:', error);
            });
    }
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
            console.error('❌ Error loading user:', error);
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
    // Update active menu item
    var items = document.querySelectorAll('.nav-item');
    items.forEach(function(item) { item.classList.remove('active'); });
    
    var pages = [
        'dashboard', 'pos', 'categories', 'products',
        'clients', 'fournisseurs', 'ventes', 'credits', 'depenses',
        'statistiques', 'options'
    ];
    
    var index = pages.indexOf(page);
    if (index >= 0 && items[index]) {
        items[index].classList.add('active');
    }
    
    // Page titles
    var titles = {
        'dashboard': 'Dashboard',
        'pos': 'Point of Sale (POS)',
        'categories': 'Categories',
        'products': 'Products',
        'clients': 'Clients',
        'fournisseurs': 'Suppliers',
        'ventes': 'Sales',
        'credits': 'Credits',
        'depenses': 'Expenses',
        'statistiques': 'Statistics',
        'options': 'Options - User Management'
    };
    
    // Page icons
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
    
    // Update page title
    document.getElementById('pageTitle').textContent = titles[page] || 'Page';
    
    // Update header icon
    var headerIcon = document.querySelector('.header-title i');
    if (headerIcon && icons[page]) {
        headerIcon.className = 'fas ' + icons[page];
    }
    
    var content = document.getElementById('dynamicContent');
    
    // Load page content
    if (page === 'dashboard') {
        loadDashboardPage(content);
    } else if (page === 'options') {
        loadOptionsPage();
    } else {
        // Placeholder for other pages
        content.innerHTML = `
            <div class="content-card">
                <div class="card-header">
                    <h3><i class="fas ${icons[page] || 'fa-file'}"></i> ${titles[page]}</h3>
                </div>
                <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                    <i class="fas ${icons[page] || 'fa-tools'}" style="font-size: 4rem; margin-bottom: 20px; display: block;"></i>
                    <p style="font-size: 1.3rem; font-weight: 600;">${titles[page]}</p>
                    <p style="margin-top: 10px;">This page is under development</p>
                </div>
            </div>
        `;
    }
}

// ============================================
// DASHBOARD PAGE
// ============================================
function loadDashboardPage(content) {
    content.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-shopping-bag"></i></div>
                <div class="stat-info">
                    <span class="stat-label">Today's Orders</span>
                    <span class="stat-value" id="todayOrders">0</span>
                    <span class="stat-unit">orders</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-euro-sign"></i></div>
                <div class="stat-info">
                    <span class="stat-label">Today's Revenue</span>
                    <span class="stat-value" id="todayRevenue">0.00</span>
                    <span class="stat-unit">€</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-utensils"></i></div>
                <div class="stat-info">
                    <span class="stat-label">Products</span>
                    <span class="stat-value" id="productsCount">0</span>
                    <span class="stat-unit">items</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><i class="fas fa-users"></i></div>
                <div class="stat-info">
                    <span class="stat-label">Clients</span>
                    <span class="stat-value" id="clientsCount">0</span>
                    <span class="stat-unit">registered</span>
                </div>
            </div>
        </div>
        
        <div class="content-card">
            <div class="card-header">
                <h3><i class="fas fa-clock"></i> Recent Orders</h3>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Client</th>
                            <th>Total</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody id="recentOrdersTable">
                        <tr>
                            <td colspan="4" style="text-align: center;">No orders yet</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    loadDashboardStats();
}

function loadDashboardStats() {
    // Count products
    db.collection('products').get()
        .then(function(snap) {
            var el = document.getElementById('productsCount');
            if (el) el.textContent = snap.size;
        })
        .catch(function() {});
    
    // Count clients
    db.collection('users').where('role', '==', 'client').get()
        .then(function(snap) {
            var el = document.getElementById('clientsCount');
            if (el) el.textContent = snap.size;
        })
        .catch(function() {});
    
    // Today's orders
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    
    db.collection('orders').where('createdAt', '>=', today).get()
        .then(function(snap) {
            var el = document.getElementById('todayOrders');
            if (el) el.textContent = snap.size;
            
            var total = 0;
            snap.forEach(function(doc) {
                total += doc.data().total || 0;
            });
            
            var revEl = document.getElementById('todayRevenue');
            if (revEl) revEl.textContent = total.toFixed(2);
        })
        .catch(function() {});
}

// ============================================
// OPTIONS PAGE - USER MANAGEMENT
// ============================================
function loadOptionsPage() {
    var content = document.getElementById('dynamicContent');
    
    // Check if current user is admin
    if (!currentUserData || currentUserData.role !== 'admin') {
        content.innerHTML = `
            <div class="content-card">
                <div style="text-align: center; padding: 60px; color: #ef4444;">
                    <i class="fas fa-lock" style="font-size: 4rem; margin-bottom: 20px;"></i>
                    <p style="font-size: 1.3rem; font-weight: 600;">Access Denied</p>
                    <p>Only administrators can access this page</p>
                </div>
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <!-- Stats -->
        <div class="stats-grid" style="margin-bottom: 20px;">
            <div class="stat-card">
                <div class="stat-icon" style="background: #fef3c7;">
                    <i class="fas fa-clock" style="color: #d97706;"></i>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Pending</span>
                    <span class="stat-value" id="pendingCount">0</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: #dcfce7;">
                    <i class="fas fa-check-circle" style="color: #16a34a;"></i>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Authorized</span>
                    <span class="stat-value" id="authorizedCount">0</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: #e0e7ff;">
                    <i class="fas fa-users" style="color: #4f46e5;"></i>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Total Users</span>
                    <span class="stat-value" id="totalUsers">0</span>
                </div>
            </div>
        </div>
        
        <!-- Users Table -->
        <div class="content-card">
            <div class="card-header">
                <h3><i class="fas fa-users-cog"></i> User Authorization Management</h3>
                <button class="btn-add" onclick="refreshUsers()">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr>
                            <td colspan="7" style="text-align: center;">Loading...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    loadUsersList();
}

function loadUsersList() {
    db.collection('users').orderBy('createdAt', 'desc').get()
        .then(function(snapshot) {
            var pending = 0, authorized = 0;
            var tbody = document.getElementById('usersTableBody');
            tbody.innerHTML = '';
            
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No users found</td></tr>';
                document.getElementById('pendingCount').textContent = '0';
                document.getElementById('authorizedCount').textContent = '0';
                document.getElementById('totalUsers').textContent = '0';
                return;
            }
            
            snapshot.forEach(function(doc) {
                var user = doc.data();
                var userId = doc.id;
                
                if (user.authorized === 'no') pending++;
                else authorized++;
                
                var statusBadge = user.authorized === 'yes' ? 
                    '<span class="status-success">✅ Authorized</span>' : 
                    '<span class="status-warning">⏳ Pending</span>';
                
                var dateStr = user.createdAt ? 
                    new Date(user.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : 'N/A';
                
                // Action buttons
                var actionBtns = '';
                
                if (user.authorized === 'no') {
                    actionBtns = `
                        <button class="btn-add" style="padding:6px 10px;font-size:0.7rem;margin-right:5px;" 
                            onclick="authorizeUser('${userId}')" title="Authorize">
                            <i class="fas fa-check"></i> Authorize
                        </button>
                        <button class="btn-delete" style="padding:6px 10px;font-size:0.7rem;" 
                            onclick="deleteUser('${userId}')" title="Delete">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    `;
                } else {
                    actionBtns = `
                        <button class="btn-edit" style="padding:6px 10px;font-size:0.7rem;margin-right:5px;color:#d97706;" 
                            onclick="deauthorizeUser('${userId}')" title="Deauthorize">
                            <i class="fas fa-ban"></i> Deauthorize
                        </button>
                        <button class="btn-delete" style="padding:6px 10px;font-size:0.7rem;" 
                            onclick="deleteUser('${userId}')" title="Delete">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    `;
                }
                
                var row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>@${user.username}</strong></td>
                    <td>${user.prenom} ${user.nom}</td>
                    <td>${user.email}</td>
                    <td><span style="text-transform:capitalize;">${user.role}</span></td>
                    <td>${statusBadge}</td>
                    <td>${dateStr}</td>
                    <td>${actionBtns}</td>
                `;
                tbody.appendChild(row);
            });
            
            document.getElementById('pendingCount').textContent = pending;
            document.getElementById('authorizedCount').textContent = authorized;
            document.getElementById('totalUsers').textContent = snapshot.size;
        })
        .catch(function(error) {
            console.error('❌ Error:', error);
            document.getElementById('usersTableBody').innerHTML = 
                '<tr><td colspan="7" style="text-align:center;color:#ef4444;">Error loading users</td></tr>';
        });
}

// Authorize user
function authorizeUser(uid) {
    if (confirm('✅ Authorize this user? They will be able to login.')) {
        db.collection('users').doc(uid).update({
            authorized: 'yes',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(function() {
            alert('✅ User authorized successfully!');
            loadUsersList();
        })
        .catch(function(error) {
            alert('❌ Error: ' + error.message);
        });
    }
}

// Deauthorize user
function deauthorizeUser(uid) {
    if (confirm('⏳ Deauthorize this user? They will not be able to login.')) {
        db.collection('users').doc(uid).update({
            authorized: 'no',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(function() {
            alert('✅ User deauthorized!');
            loadUsersList();
        })
        .catch(function(error) {
            alert('❌ Error: ' + error.message);
        });
    }
}

// Delete user
function deleteUser(uid) {
    if (confirm('⚠️ WARNING!\n\nAre you sure you want to DELETE this user?\n\nThis action cannot be undone!')) {
        db.collection('users').doc(uid).delete()
            .then(function() {
                alert('✅ User deleted from database!');
                loadUsersList();
                console.log('⚠️ Note: To completely remove the user, also delete from Firebase Auth Console');
            })
            .catch(function(error) {
                alert('❌ Error: ' + error.message);
            });
    }
}

function refreshUsers() {
    loadUsersList();
}

console.log('✅ Chicken Way - Script loaded successfully');
