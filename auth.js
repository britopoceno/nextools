import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

import { auth, db } from "./auth-init.js";

/* =======================================
 *  AUTH STATE OBSERVER (Global)
 * ======================================= */
onAuthStateChanged(auth, async (user) => {
    // If we're on a tool page or index, check if we need to apply Pro styles
    if (user) {
        // Only grant Pro features to verified accounts
        if (user.emailVerified) {
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && userDoc.data().isPro) {
                    document.body.classList.add('pro-user');
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
            }
        }

        // Update Header Actions
        const authBtn = document.getElementById('header-auth-btn');
        const loginLink = document.querySelector('.header-actions .nav-link.desktop-only');

        if (authBtn) {
            authBtn.textContent = "Dashboard";
            authBtn.href = "dashboard.html";
            authBtn.classList.remove('btn-primary');
            authBtn.classList.add('btn-secondary');
        }
        if (loginLink) {
            loginLink.style.display = 'none';
        }

        // Update Hero Button
        const heroSignupBtn = document.getElementById('hero-signup-btn');
        if (heroSignupBtn) {
            heroSignupBtn.textContent = "Meu Painel";
            heroSignupBtn.href = "dashboard.html";
        }

        // Update Dashboard Specifics
        const dashboardUpgradeBtn = document.getElementById('dashboard-upgrade-btn');
        if (dashboardUpgradeBtn) {
            const baseStripeLink = "https://buy.stripe.com/test_fZucN70PRffE5vOfwX1ck00";
            dashboardUpgradeBtn.href = `${baseStripeLink}?client_reference_id=${user.uid}`;
        }
    }
});

/* =======================================
 *  SIGN UP LOGIC (cadastro.html)
 * ======================================= */
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-signup');
        const errorDiv = document.getElementById('auth-error');

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        btn.disabled = true;
        btn.textContent = "Aguarde...";
        errorDiv.style.display = 'none';

        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Update Profile Name
            await updateProfile(user, { displayName: name });

            // 3. Create Firestore DB entry (Default: isPro = false)
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: email,
                isPro: false,
                createdAt: new Date()
            });

            // 4. Send verification email
            await sendEmailVerification(user);

            // 5. Show success state (email sent) instead of redirecting
            const signupForm = document.getElementById('signup-form');
            const successDiv = document.getElementById('signup-success');
            const emailSentEl = document.getElementById('signup-email-sent');
            if (signupForm && successDiv) {
                signupForm.style.display = 'none';
                if (emailSentEl) emailSentEl.textContent = email;
                successDiv.style.display = 'block';
            } else {
                window.location.href = "dashboard.html";
            }

        } catch (error) {
            errorDiv.textContent = getFriendlyErrorMessage(error.code);
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btn.textContent = "Cadastrar";
        }
    });
}

/* =======================================
 *  LOGIN LOGIC (login.html)
 * ======================================= */
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-login');
        const errorDiv = document.getElementById('auth-error');

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        btn.disabled = true;
        btn.textContent = "Aguarde...";
        errorDiv.style.display = 'none';

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                // Show the verification notice block
                const verifyNotice = document.getElementById('verify-notice');
                if (verifyNotice) verifyNotice.style.display = 'block';

                // Wire up the resend button (only once)
                const resendBtn = document.getElementById('btn-resend-email');
                if (resendBtn && !resendBtn.dataset.wired) {
                    resendBtn.dataset.wired = '1';
                    resendBtn.addEventListener('click', async () => {
                        try {
                            resendBtn.disabled = true;
                            resendBtn.textContent = 'Enviando...';
                            await sendEmailVerification(user);
                            resendBtn.textContent = 'E-mail reenviado!';
                        } catch {
                            resendBtn.textContent = 'Tente novamente mais tarde';
                            resendBtn.disabled = false;
                        }
                    });
                }

                btn.disabled = false;
                btn.textContent = "Entrar";
                return;
            }

            window.location.href = "dashboard.html";
        } catch (error) {
            errorDiv.textContent = getFriendlyErrorMessage(error.code);
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btn.textContent = "Entrar";
        }
    });
}

// Utility for Firebase Error Messages
function getFriendlyErrorMessage(code) {
    switch (code) {
        case 'auth/email-already-in-use': return 'Este e-mail já está em uso.';
        case 'auth/invalid-email': return 'E-mail inválido.';
        case 'auth/weak-password': return 'A senha deve ter pelo menos 6 caracteres.';
        case 'auth/user-not-found': return 'Usuário não encontrado.';
        case 'auth/wrong-password': return 'Senha incorreta.';
        case 'auth/invalid-credential': return 'Credenciais incorretas.';
        default: return 'Ocorreu um erro. Tente novamente: ' + code;
    }
}
