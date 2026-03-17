import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    doc,
    getDoc,
    getFirestore,
    setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD_PzTMUhtk0dGh2X06dufw_NMAesMAZUE",
    authDomain: "convite65anos.firebaseapp.com",
    projectId: "convite65anos",
    storageBucket: "convite65anos.firebasestorage.app",
    messagingSenderId: "66072908061",
    appId: "1:66072908061:web:094debb8cf0340268891f4",
    measurementId: "G-86GT9VL0Y3",
};

// DOM Elements
const loginContainer = document.getElementById("loginContainer");
const configContainer = document.getElementById("configContainer");
const adminEmailBadge = document.getElementById("adminEmailBadge");
const logoutButton = document.getElementById("logoutButton");
const tabButtons = document.querySelectorAll(".tab-button");
const configSections = document.querySelectorAll(".config-section");

// Evento
const eventTitle = document.getElementById("eventTitle");
const eventDate = document.getElementById("eventDate");
const eventTime = document.getElementById("eventTime");
const eventLocation = document.getElementById("eventLocation");
const eventMapsUrl = document.getElementById("eventMapsUrl");

// Bloqueio
const blockDate = document.getElementById("blockDate");
const blockTime = document.getElementById("blockTime");
const blockMessage = document.getElementById("blockMessage");
const currentBlockDateTime = document.getElementById("currentBlockDateTime");

// Contato
const supportPhone = document.getElementById("supportPhone");

// Admin
const adminEmails = document.getElementById("adminEmails");

// Mensagens
const successMessage = document.getElementById("successMessage");
const termsText = document.getElementById("termsText");

// Info
const currentDateTime = document.getElementById("currentDateTime");
const formStatus = document.getElementById("formStatus");
const authStatus = document.getElementById("authStatus");

const hasFirebaseConfig = Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && !value.startsWith("COLOQUE_")
);

let db = null;
let auth = null;

// Configurações padrões
const DEFAULT_CONFIG = {
    eventTitle: "Celebração dos 65 anos da ACIA",
    eventDate: "2026-03-26",
    eventTime: "19:00",
    eventLocation: "Villa Americana",
    eventMapsUrl: "https://www.google.com/maps/place/Villa+Americana+Eventos/@-22.7390903,-47.3291581,18z/data=!4m10!1m2!2m1!1sVilla+Americana+Americana+SP!3m6!1s0x94c89a4c64890eef:0xf745d6a03ce059ed!8m2!3d-22.739139!4d-47.3269233!15sChxWaWxsYSBBbWVyaWNhbmEgQW1lcmljYW5hIFNQWh4iHHZpbGxhIGFtZXJpY2FuYSBhbWVyaWNhbmEgc3CSAQtldmVudF92ZW51ZZoBI0NoWkRTVWhOTUc5blMwVkpRMEZuU1VOUU5XWlVSMWgzRUFF4AEA-gEECAAQHg!16s%2Fg%2F11b6f03vjh?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D",
    blockDate: "2026-03-20",
    blockTime: "12:00",
    blockMessage: "O tempo de confirmação acabou :(\nA confirmação de presença foi encerrada.\n\nCaso tenha alguma dúvida, entre em contato com: 19 99246-2193",
    supportPhone: "19 99246-2193",
    allowedAdminEmails: ["admin@acia.com.br"],
    successMessage: "Sua participação foi registrada. Vai ser uma noite inesquecível para celebrar essa história com a ACIA.",
    termsText: "Ao participar deste jantar, você confirma que as informações enviadas são verdadeiras, autoriza o uso dos dados exclusivamente para organização e contato sobre este evento, e se compromete a manter uma conduta respeitosa com todos os convidados e equipe organizadora.\n\nSe necessário, poderemos entrar em contato para ajustar detalhes logísticos. Seus dados não serão comercializados e serão tratados com confidencialidade.",
};

if (hasFirebaseConfig) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
}

function setFeedback(element, message, type) {
    const feedback = element.closest(".config-section")?.querySelector(".config-feedback") || element;
    feedback.textContent = message;
    feedback.className = `config-feedback feedback ${type}`;
}

function showLoginContainer(show) {
    if (show) {
        loginContainer.classList.remove("hidden");
        configContainer.classList.add("hidden");
    } else {
        loginContainer.classList.add("hidden");
        configContainer.classList.remove("hidden");
    }
}

function formatDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) return "--/--/---- --:--";
    const [year, month, day] = dateStr.split("-");
    const [hour, minute] = timeStr.split(":");
    return `${day}/${month}/${year} ${hour}:${minute}`;
}

function updateCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    currentDateTime.textContent = `${day}/${month}/${year} ${hours}:${minutes}`;
}

async function loadCurrentConfig() {
    if (!db) {
        return;
    }

    try {
        const configDoc = await getDoc(doc(db, "config", "sistema"));
        let config = DEFAULT_CONFIG;

        if (configDoc.exists()) {
            config = { ...DEFAULT_CONFIG, ...configDoc.data() };
        }

        // Preencher formulário
        eventTitle.value = config.eventTitle || DEFAULT_CONFIG.eventTitle;
        eventDate.value = config.eventDate || DEFAULT_CONFIG.eventDate;
        eventTime.value = config.eventTime || DEFAULT_CONFIG.eventTime;
        eventLocation.value = config.eventLocation || DEFAULT_CONFIG.eventLocation;
        eventMapsUrl.value = config.eventMapsUrl || DEFAULT_CONFIG.eventMapsUrl;
        blockDate.value = config.blockDate || DEFAULT_CONFIG.blockDate;
        blockTime.value = config.blockTime || DEFAULT_CONFIG.blockTime;
        blockMessage.value = config.blockMessage || DEFAULT_CONFIG.blockMessage;
        supportPhone.value = config.supportPhone || DEFAULT_CONFIG.supportPhone;
        successMessage.value = config.successMessage || DEFAULT_CONFIG.successMessage;
        termsText.value = config.termsText || DEFAULT_CONFIG.termsText;

        // Emails de admin
        const emailsArray = Array.isArray(config.allowedAdminEmails)
            ? config.allowedAdminEmails
            : DEFAULT_CONFIG.allowedAdminEmails;
        adminEmails.value = emailsArray.join("\n");

        currentBlockDateTime.textContent = formatDateTime(blockDate.value, blockTime.value);

        // Update form status
        const now = new Date();
        const blockDateTime = new Date(blockDate.value + "T" + blockTime.value);
        if (now > blockDateTime) {
            formStatus.textContent = "🔒 Bloqueado";
            formStatus.style.color = "#c0392b";
        } else {
            formStatus.textContent = "✓ Ativo";
            formStatus.style.color = "#27ae60";
        }
    } catch (error) {
        console.error("Erro ao carregar configurações:", error);
    }
}

async function saveEventConfig() {
    if (!eventTitle.value || !eventDate.value || !eventTime.value || !eventLocation.value) {
        setFeedback(eventTitle, "Preencha todos os campos do evento", "error");
        return;
    }

    eventTitle.closest(".config-section").querySelector(".save-btn").disabled = true;

    try {
        const configData = {
            eventTitle: eventTitle.value,
            eventDate: eventDate.value,
            eventTime: eventTime.value,
            eventLocation: eventLocation.value,
            eventMapsUrl: eventMapsUrl.value || DEFAULT_CONFIG.eventMapsUrl,
            updatedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, "config", "sistema"), configData, { merge: true });

        setFeedback(eventTitle, "Evento salvo com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao salvar evento:", error);
        setFeedback(eventTitle, "Erro ao salvar. Tente novamente.", "error");
    } finally {
        eventTitle.closest(".config-section").querySelector(".save-btn").disabled = false;
    }
}

async function saveBlockConfig() {
    if (!blockDate.value || !blockTime.value) {
        setFeedback(blockDate, "Preencha data e hora de bloqueio", "error");
        return;
    }

    blockDate.closest(".config-section").querySelector(".save-btn").disabled = true;

    try {
        const configData = {
            blockDate: blockDate.value,
            blockTime: blockTime.value,
            blockMessage: blockMessage.value || DEFAULT_CONFIG.blockMessage,
            updatedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, "config", "sistema"), configData, { merge: true });

        setFeedback(blockDate, "Bloqueio salvo com sucesso!", "success");
        currentBlockDateTime.textContent = formatDateTime(blockDate.value, blockTime.value);

        // Update form status
        const now = new Date();
        const blockDateTime = new Date(blockDate.value + "T" + blockTime.value);
        if (now > blockDateTime) {
            formStatus.textContent = "🔒 Bloqueado";
            formStatus.style.color = "#c0392b";
        } else {
            formStatus.textContent = "✓ Ativo";
            formStatus.style.color = "#27ae60";
        }
    } catch (error) {
        console.error("Erro ao salvar bloqueio:", error);
        setFeedback(blockDate, "Erro ao salvar. Tente novamente.", "error");
    } finally {
        blockDate.closest(".config-section").querySelector(".save-btn").disabled = false;
    }
}

async function saveContactConfig() {
    if (!supportPhone.value) {
        setFeedback(supportPhone, "Preencha o telefone de suporte", "error");
        return;
    }

    supportPhone.closest(".config-section").querySelector(".save-btn").disabled = true;

    try {
        const configData = {
            supportPhone: supportPhone.value,
            updatedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, "config", "sistema"), configData, { merge: true });

        setFeedback(supportPhone, "Contato salvo com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao salvar contato:", error);
        setFeedback(supportPhone, "Erro ao salvar. Tente novamente.", "error");
    } finally {
        supportPhone.closest(".config-section").querySelector(".save-btn").disabled = false;
    }
}

async function saveAdminConfig() {
    const emails = adminEmails.value
        .split("\n")
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0 && email.includes("@"));

    if (emails.length === 0) {
        setFeedback(adminEmails, "Adicione pelo menos um email válido", "error");
        return;
    }

    adminEmails.closest(".config-section").querySelector(".save-btn").disabled = true;

    try {
        const configData = {
            allowedAdminEmails: emails,
            updatedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, "config", "sistema"), configData, { merge: true });

        setFeedback(adminEmails, "Emails de administrador salvos com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao salvar emails:", error);
        setFeedback(adminEmails, "Erro ao salvar. Tente novamente.", "error");
    } finally {
        adminEmails.closest(".config-section").querySelector(".save-btn").disabled = false;
    }
}

async function saveMessagesConfig() {
    if (!successMessage.value || !termsText.value) {
        setFeedback(successMessage, "Preencha todas as mensagens", "error");
        return;
    }

    successMessage.closest(".config-section").querySelector(".save-btn").disabled = true;

    try {
        const configData = {
            successMessage: successMessage.value,
            termsText: termsText.value,
            updatedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, "config", "sistema"), configData, { merge: true });

        setFeedback(successMessage, "Mensagens salvas com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao salvar mensagens:", error);
        setFeedback(successMessage, "Erro ao salvar. Tente novamente.", "error");
    } finally {
        successMessage.closest(".config-section").querySelector(".save-btn").disabled = false;
    }
}

async function resetToDefaults() {
    if (!confirm("Tem certeza que deseja restaurar TODAS as configurações padrões?")) {
        return;
    }

    try {
        await setDoc(doc(db, "config", "sistema"), DEFAULT_CONFIG);
        await loadCurrentConfig();
        setFeedback(blockDate, "Configurações restauradas com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao restaurar:", error);
        setFeedback(blockDate, "Erro ao restaurar. Tente novamente.", "error");
    }
}

function setupTabNavigation() {
    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            // Remove active class de todos os botões e seções
            tabButtons.forEach((btn) => btn.classList.remove("active"));
            configSections.forEach((section) => section.classList.remove("active-tab"));

            // Adiciona active apenas ao selecionado
            button.classList.add("active");
            const tabName = button.getAttribute("data-tab");
            const section = document.getElementById(tabName);
            if (section) {
                section.classList.add("active-tab");
            }
        });
    });
}

function setupEventListeners() {
    // Evento
    document.querySelector("#evento .save-btn").addEventListener("click", saveEventConfig);

    // Bloqueio
    document.querySelector("#bloqueio .save-btn").addEventListener("click", saveBlockConfig);
    document.querySelector("#bloqueio .reset-btn").addEventListener("click", resetToDefaults);

    // Contato
    document.querySelector("#contato .save-btn").addEventListener("click", saveContactConfig);

    // Admin
    document.querySelector("#admin .save-btn").addEventListener("click", saveAdminConfig);

    // Mensagens
    document.querySelector("#mensagens .save-btn").addEventListener("click", saveMessagesConfig);

    logoutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "admin-login.html";
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
    });
}

function setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Carregar configuração para verificar emails
            let allowedEmails = DEFAULT_CONFIG.allowedAdminEmails;
            try {
                const configDoc = await getDoc(doc(db, "config", "sistema"));
                if (configDoc.exists() && configDoc.data().allowedAdminEmails) {
                    allowedEmails = configDoc.data().allowedAdminEmails;
                }
            } catch (error) {
                console.error("Erro ao verificar emails:", error);
            }

            if (allowedEmails.includes(String(user.email || "").toLowerCase())) {
                adminEmailBadge.textContent = user.email;
                authStatus.textContent = "✓ Autenticado";
                authStatus.style.color = "#27ae60";
                showLoginContainer(false);
                setupTabNavigation();
                setupEventListeners();
                await loadCurrentConfig();

                // Update time every minute
                updateCurrentDateTime();
                setInterval(updateCurrentDateTime, 60000);
            } else {
                await signOut(auth);
                window.location.href = "admin-login.html";
            }
        } else {
            authStatus.textContent = "✗ Não autenticado";
            authStatus.style.color = "#c0392b";
            showLoginContainer(true);
        }
    });
}

// Initialize
if (hasFirebaseConfig) {
    setupAuthListener();
}
