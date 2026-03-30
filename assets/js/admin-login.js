import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    browserSessionPersistence,
    getAuth,
    onAuthStateChanged,
    setPersistence,
    signInWithEmailAndPassword,
    signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyD_PzTMUhtk0dGh2X06dufw_NMAesMAZUE",
    authDomain: "convite65anos.firebaseapp.com",
    projectId: "convite65anos",
    storageBucket: "convite65anos.firebasestorage.app",
    messagingSenderId: "66072908061",
    appId: "1:66072908061:web:094debb8cf0340268891f4",
    measurementId: "G-86GT9VL0Y3",
};

const ALLOWED_ADMIN_EMAILS = [
    "admin@acia.com.br",
];

const adminLoginForm = document.getElementById("adminLoginForm");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const loginFeedback = document.getElementById("loginFeedback");
const loginButton = document.getElementById("loginButton");

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function isAllowedAdmin(email) {
    return ALLOWED_ADMIN_EMAILS.includes(String(email || "").toLowerCase());
}

function setFeedback(message) {
    loginFeedback.textContent = message;
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        return;
    }

    if (isAllowedAdmin(user.email)) {
        window.location.href = "admin.html";
        return;
    }

    await signOut(auth);
    setFeedback("Este e-mail não tem permissão para acessar o painel.");
});

adminLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFeedback("");

    const email = adminEmail.value.trim().toLowerCase();
    const password = adminPassword.value;

    if (!email || !password) {
        setFeedback("Preencha e-mail e senha para continuar.");
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Entrando...";

    try {
        await setPersistence(auth, browserSessionPersistence);
        const credential = await signInWithEmailAndPassword(auth, email, password);

        if (!isAllowedAdmin(credential.user.email)) {
            await signOut(auth);
            setFeedback("Este e-mail não está autorizado para a administração.");
            return;
        }

        window.location.href = "admin.html";
    } catch (error) {
        console.error(error);
        setFeedback("Login inválido. Verifique e-mail e senha.");
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Entrar no painel";
    }
});
