// Switch between Login/Register tabs
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.tab');
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        tabs[1].classList.add('active');
        tabs[0].classList.remove('active');
    }
}

// REGISTER
function register(event) {
    event.preventDefault();
    
    const nom = document.getElementById('nom').value;
    const prenom = document.getElementById('prenom').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const telephone = document.getElementById('telephone').value;
    const role = document.getElementById('role').value;
    const password = document.getElementById('password').value;

    // Créer utilisateur dans Firebase Auth
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Sauvegarder dans Firestore
            return db.collection('users').doc(user.uid).set({
                nom: nom,
                prenom: prenom,
                username: username,
                email: email,
                telephone: telephone,
                role: role,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            alert('✅ Compte créé avec succès!');
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            alert('❌ Erreur: ' + error.message);
        });
}

// LOGIN
function login(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Vérifier si l'utilisateur existe dans Firestore
            return db.collection('users').doc(user.uid).get();
        })
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                alert('✅ Bienvenue ' + userData.prenom + ' ' + userData.nom + '!');
                
                // Sauvegarder les infos dans localStorage
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Rediriger vers le dashboard
                window.location.href = 'dashboard.html';
            } else {
                alert('❌ Utilisateur non trouvé');
                auth.signOut();
            }
        })
        .catch((error) => {
            alert('❌ Erreur: ' + error.message);
        });
}

// Vérifier si déjà connecté
auth.onAuthStateChanged((user) => {
    if (user && window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
    }
});
