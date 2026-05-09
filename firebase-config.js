<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chicken Way - Restaurant Management</title>
    
    <!-- Google Font -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- Font Awesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    
    <!-- Styles -->
    <link rel="stylesheet" href="style.css">
</head>
<body>
    
    <!-- ==================== PAGE LOGIN/REGISTER ==================== -->
    <div id="authPage" class="login-wrapper">
        
        <!-- LOGIN CONTAINER -->
        <div id="loginContainer" class="login-container">
            <!-- Partie gauche : Brand -->
            <div class="login-brand">
                <div class="brand-icon">
                    <img src="logo.png" alt="Chicken Way Logo" class="brand-logo">
                </div>
                <h1>Chicken <span>Way</span></h1>
                <p style="color: rgba(255,255,255,0.7); margin-top: 10px; font-size: 0.9rem;">
                    Restaurant Management System
                </p>
            </div>
            
            <!-- Partie droite : Formulaire Login -->
            <div class="login-form">
                <h2 style="color: white; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-sign-in-alt"></i> Connexion
                </h2>
                
                <form id="loginForm" onsubmit="handleLogin(event)">
                    <div class="input-group">
                        <i class="fas fa-envelope"></i>
                        <input type="email" id="loginEmail" placeholder="Votre email" required>
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-lock"></i>
                        <input type="password" id="loginPassword" placeholder="Mot de passe" required>
                    </div>
                    
                    <button type="submit" class="btn-login" id="loginBtn">
                        <i class="fas fa-sign-in-alt"></i> Se connecter
                    </button>
                </form>
                
                <p class="register-link">
                    Pas encore de compte ? 
                    <strong onclick="showRegister()" style="cursor: pointer;">
                        Créer un compte
                    </strong>
                </p>
            </div>
        </div>

        <!-- REGISTER CONTAINER (caché par défaut) -->
        <div id="registerContainer" class="register-container hidden">
            <!-- Partie gauche : Brand -->
            <div class="register-brand">
                <div class="brand-icon">
                    <img src="logo.png" alt="Chicken Way Logo" class="brand-logo">
                </div>
                <h1>Chicken <span>Way</span></h1>
                <p style="color: rgba(255,255,255,0.7); margin-top: 10px; font-size: 0.9rem;">
                    Créez votre compte
                </p>
            </div>
            
            <!-- Partie droite : Formulaire Register -->
            <div class="register-form">
                <h2 style="color: white; margin-bottom: 20px; text-align: center;">
                    <i class="fas fa-user-plus"></i> Inscription
                </h2>
                
                <form id="registerForm" onsubmit="handleRegister(event)">
                    <div style="display: flex; gap: 10px;">
                        <div class="input-group" style="flex: 1;">
                            <i class="fas fa-user"></i>
                            <input type="text" id="regNom" placeholder="Nom" required>
                        </div>
                        <div class="input-group" style="flex: 1;">
                            <i class="fas fa-user"></i>
                            <input type="text" id="regPrenom" placeholder="Prénom" required>
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-id-badge"></i>
                        <input type="text" id="regUsername" placeholder="Nom d'utilisateur" required>
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-envelope"></i>
                        <input type="email" id="regEmail" placeholder="Email" required>
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-phone"></i>
                        <input type="tel" id="regTelephone" placeholder="Téléphone" required>
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-user-tag"></i>
                        <select id="regRole" class="role-select" required style="width: 100%;">
                            <option value="">Sélectionnez un rôle</option>
                            <option value="admin">Admin</option>
                            <option value="caissier">Caissier</option>
                            <option value="client">Client</option>
                        </select>
                    </div>
                    
                    <div class="input-group">
                        <i class="fas fa-lock"></i>
                        <input type="password" id="regPassword" placeholder="Mot de passe (6+ caractères)" required minlength="6">
                    </div>
                    
                    <button type="submit" class="btn-login" id="registerBtn">
                        <i class="fas fa-user-plus"></i> Créer mon compte
                    </button>
                </form>
                
                <p class="register-link">
                    Déjà un compte ? 
                    <strong onclick="showLogin()" style="cursor: pointer;">
                        Se connecter
                    </strong>
                </p>
            </div>
        </div>
    </div>

    <!-- ==================== PAGE DASHBOARD (cachée par défaut) ==================== -->
    <div id="dashboardPage" class="dashboard hidden">
        
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    <img src="logo.png" alt="Logo" class="sidebar-logo-img">
                </div>
                <h2>Chicken <span>Way</span></h2>
                <p class="sidebar-subtitle">Restaurant Management</p>
            </div>
            
            <nav class="sidebar-nav">
                <ul>
                    <li class="nav-item active" onclick="navigateTo('dashboard')">
                        <i class="fas fa-th-large"></i> Dashboard
                    </li>
                    <li class="nav-item" onclick="navigateTo('pos')">
                        <i class="fas fa-cash-register"></i> Point de vente
                    </li>
                    <li class="nav-item" onclick="navigateTo('categories')">
                        <i class="fas fa-layer-group"></i> Catégories
                    </li>
                    <li class="nav-item" onclick="navigateTo('products')">
                        <i class="fas fa-utensils"></i> Produits
                    </li>
                    <li class="nav-item" onclick="navigateTo('clients')">
                        <i class="fas fa-users"></i> Clients
                    </li>
                    <li class="nav-item" onclick="navigateTo('fournisseurs')">
                        <i class="fas fa-truck"></i> Fournisseurs
                    </li>
                    <li class="nav-item" onclick="navigateTo('ventes')">
                        <i class="fas fa-shopping-cart"></i> Ventes
                    </li>
                    <li class="nav-item" onclick="navigateTo('credits')">
                        <i class="fas fa-credit-card"></i> Crédits
                    </li>
                    <li class="nav-item" onclick="navigateTo('depenses')">
                        <i class="fas fa-money-bill-wave"></i> Dépenses
                    </li>
                    <li class="nav-item" onclick="navigateTo('statistiques')">
                        <i class="fas fa-chart-bar"></i> Statistiques
                    </li>
                </ul>
            </nav>
            
            <div class="sidebar-footer">
                <div class="user-info" id="sidebarUserInfo">
                    <i class="fas fa-user-circle"></i>
                    <span>Chargement...</span>
                </div>
                <button class="logout-item nav-item" onclick="handleLogout()" style="width: 100%; border: none; margin-top: 10px;">
                    <i class="fas fa-sign-out-alt"></i> Déconnexion
                </button>
            </div>
        </aside>
        
        <!-- Main Content -->
        <main class="main-content" id="mainContent">
            <div class="page-header">
                <div class="header-title">
                    <i class="fas fa-th-large"></i>
                    <h2 id="pageTitle">Dashboard</h2>
                </div>
                <div class="header-stats" id="headerStats"></div>
            </div>
            
            <!-- Contenu dynamique -->
            <div id="dynamicContent">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-shopping-bag"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">Ventes aujourd'hui</span>
                            <span class="stat-value">0</span>
                            <span class="stat-unit">commandes</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-euro-sign"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">Revenus aujourd'hui</span>
                            <span class="stat-value">0.00</span>
                            <span class="stat-unit">€</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-utensils"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">Produits</span>
                            <span class="stat-value">0</span>
                            <span class="stat-unit">articles</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-users"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">Clients</span>
                            <span class="stat-value">0</span>
                            <span class="stat-unit">inscrits</span>
                        </div>
                    </div>
                </div>
                
                <div class="content-card">
                    <div class="card-header">
                        <h3><i class="fas fa-clock"></i> Commandes récentes</h3>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>N°</th>
                                    <th>Client</th>
                                    <th>Total</th>
                                    <th>Statut</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody id="recentOrdersTable">
                                <tr>
                                    <td colspan="5" style="text-align: center;">Aucune commande</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js"></script>
    
    <!-- Scripts -->
    <script src="firebase-config.js"></script>
    <script src="script.js"></script>
</body>
</html>
