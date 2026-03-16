import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection,
    doc,
    getFirestore,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
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

const totalCount = document.getElementById("totalCount");
const checkedInCount = document.getElementById("checkedInCount");
const pendingCount = document.getElementById("pendingCount");
const searchInput = document.getElementById("searchInput");
const guestList = document.getElementById("guestList");
const adminFeedback = document.getElementById("adminFeedback");
const adminEmailBadge = document.getElementById("adminEmailBadge");
const logoutButton = document.getElementById("logoutButton");
const checkinDialog = document.getElementById("checkinDialog");
const checkinDialogConfirm = document.getElementById("checkinDialogConfirm");
const checkinDialogCancel = document.getElementById("checkinDialogCancel");
const checkinDialogMessage = document.getElementById("checkinDialogMessage");
const detailsDialog = document.getElementById("detailsDialog");
const detailsDialogClose = document.getElementById("detailsDialogClose");
const detailsDialogOk = document.getElementById("detailsDialogOk");
const detailsDialogSubtitle = document.getElementById("detailsDialogSubtitle");
const detailsGrid = document.getElementById("detailsGrid");

let pendingCheckin = null;

const ALLOWED_ADMIN_EMAILS = [
    "admin@acia.com.br",
];

const hasFirebaseConfig = Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && !value.startsWith("COLOQUE_")
);

let db = null;
let auth = null;
let allGuests = [];
let guestUnsubscribe = null;

if (hasFirebaseConfig) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
}

function isAllowedAdmin(email) {
    return ALLOWED_ADMIN_EMAILS.includes(String(email || "").toLowerCase());
}

function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
}

function formatCpf(cpf) {
    const digits = onlyDigits(cpf);
    if (digits.length !== 11) {
        return "-";
    }

    return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{2})$/, "$1-$2");
}

function formatCnpj(cnpj) {
    const digits = onlyDigits(cnpj);
    if (digits.length !== 14) {
        return "-";
    }

    return digits
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPhone(phone) {
    const digits = onlyDigits(phone);
    if (digits.length === 11) {
        return digits
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2");
    }

    if (digits.length === 10) {
        return digits
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return "-";
}

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    try {
        if (typeof value.toDate === "function") {
            return value.toDate().toLocaleString("pt-BR");
        }

        return new Date(value).toLocaleString("pt-BR");
    } catch {
        return "-";
    }
}

function setFeedback(message = "") {
    adminFeedback.textContent = message;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function updateStats(guests) {
    const checkedCount = guests.filter((guest) => guest.checkedIn).length;
    totalCount.textContent = String(guests.length);
    checkedInCount.textContent = String(checkedCount);
    pendingCount.textContent = String(guests.length - checkedCount);
}

function getGuestById(guestId) {
    return allGuests.find((guest) => guest.id === guestId) || null;
}

function detailsItem(label, value) {
    return `
      <div class="details-item">
        <strong>${escapeHtml(label)}</strong>
        <span>${escapeHtml(value || "-")}</span>
      </div>
    `;
}

function openDetailsDialog(guest) {
    const documentLabel = guest.personType === "PF" ? "CPF" : "CNPJ";
    const documentValue = guest.personType === "PF" ? formatCpf(guest.cpf) : formatCnpj(guest.cnpj);
    const companyValue = guest.personType === "PJ" ? (guest.companyName || "-") : "Não se aplica";
    const companionSummary = guest.hasCompanion && guest.companion
        ? `${guest.companion.fullName || "Acompanhante"} | ${formatPhone(guest.companion.phone)} | CPF ${formatCpf(guest.companion.cpf)}`
        : "Sem acompanhante";

    detailsDialogSubtitle.textContent = guest.fullName || "Convidado";

    detailsGrid.innerHTML = [
        detailsItem("Nome completo", guest.fullName || "-"),
        detailsItem("Tipo", guest.personType || "-"),
        detailsItem(documentLabel, documentValue),
        detailsItem("Nome da empresa", companyValue),
        detailsItem("WhatsApp", formatPhone(guest.phone)),
        detailsItem("Acompanhante", companionSummary),
        detailsItem("Termos aceitos em", formatDateTime(guest.acceptedTermsAt)),
        detailsItem("Confirmado em", formatDateTime(guest.createdAt)),
        detailsItem("Status de check-in", guest.checkedIn ? "Chegou no evento" : "Aguardando check-in"),
        detailsItem("Check-in em", formatDateTime(guest.checkedInAt)),
    ].join("");

    if (typeof detailsDialog.showModal === "function") {
        detailsDialog.showModal();
    } else {
        detailsDialog.setAttribute("open", "true");
    }
}

function closeDetailsDialog() {
    if (typeof detailsDialog.close === "function") {
        detailsDialog.close();
    } else {
        detailsDialog.removeAttribute("open");
    }
}

function renderGuests(guests) {
    if (guests.length === 0) {
        guestList.innerHTML = '<div class="empty-state">Nenhum convidado encontrado para este filtro.</div>';
        return;
    }

    guestList.innerHTML = guests
        .map((guest) => {
            const documentLabel = guest.personType === "PF" ? "CPF" : "CNPJ";
            const documentValue =
                guest.personType === "PF" ? formatCpf(guest.cpf) : formatCnpj(guest.cnpj);
            const companionText =
                guest.hasCompanion && guest.companion
                    ? `${escapeHtml(guest.companion.fullName || "Acompanhante")} | ${formatPhone(guest.companion.phone)} | CPF ${formatCpf(guest.companion.cpf)}`
                    : "Sem acompanhante";

            return `
        <article class="guest-card">
          <div class="guest-main">
            <h3 class="guest-name">${escapeHtml(guest.fullName || "Sem nome")}</h3>
            <span class="status-pill ${guest.checkedIn ? "checked" : "pending"}">
              ${guest.checkedIn ? "Chegou no evento" : "Aguardando check-in"}
            </span>
          </div>

          <div class="guest-meta">
            <div class="meta-item">
              <strong>${documentLabel}</strong>
              <span>${documentValue}</span>
            </div>
            <div class="meta-item">
              <strong>WhatsApp</strong>
              <span>${formatPhone(guest.phone)}</span>
            </div>
            <div class="meta-item">
              <strong>Check-in em</strong>
              <span>${formatDateTime(guest.checkedInAt)}</span>
            </div>
          </div>

          <div class="companion-note">
            <strong>Acompanhante:</strong> ${companionText}
          </div>

                    <div class="guest-actions">
                        <button
                            class="details-button"
                            data-action="details"
                            data-id="${guest.id}"
                            type="button"
                        >
                            Ver detalhes
                        </button>

                        <button
                            class="checkin-button ${guest.checkedIn ? "undo" : "mark"}"
                            data-action="checkin"
                            data-id="${guest.id}"
                            data-checked="${guest.checkedIn ? "1" : "0"}"
                            type="button"
                        >
                            ${guest.checkedIn ? "Desfazer check-in" : "Confirmar check-in"}
                        </button>
                    </div>
        </article>
      `;
        })
        .join("");
}

function applyFilterAndRender() {
    const term = searchInput.value.trim().toLowerCase();

    const filtered = allGuests.filter((guest) => {
        const docValue = onlyDigits(guest.cpf || guest.cnpj || guest.documentNumber || "");
        const searchBase = [
            guest.fullName || "",
            guest.phone || "",
            docValue,
            guest.companion?.fullName || "",
            guest.companion?.phone || "",
            guest.companion?.cpf || "",
        ]
            .join(" ")
            .toLowerCase();

        return searchBase.includes(term);
    });

    updateStats(filtered);
    renderGuests(filtered);
}

async function toggleCheckIn(guestId, currentChecked) {
    if (!db) {
        setFeedback("Firebase não configurado para administração.");
        return;
    }

    try {
        const reference = doc(db, "confirmacoes_jantar", guestId);
        await updateDoc(reference, {
            checkedIn: !currentChecked,
            checkedInAt: !currentChecked ? serverTimestamp() : null,
            updatedAt: serverTimestamp(),
        });

        setFeedback(!currentChecked ? "Check-in confirmado." : "Check-in removido.");
    } catch (error) {
        console.error(error);
        setFeedback("Não foi possível atualizar o check-in. Tente novamente.");
    }
}

function openCheckinDialog(guestId, currentChecked, guestName) {
    pendingCheckin = { guestId, currentChecked };

    if (currentChecked) {
        checkinDialogMessage.textContent = `Deseja remover o check-in de ${guestName}?`;
        checkinDialogConfirm.textContent = "Sim, remover check-in";
        checkinDialogConfirm.className = "secondary-button";
    } else {
        checkinDialogMessage.textContent = `Confirmar chegada de ${guestName}?`;
        checkinDialogConfirm.textContent = "Sim, confirmar chegada";
        checkinDialogConfirm.className = "primary-button";
    }

    if (typeof checkinDialog.showModal === "function") {
        checkinDialog.showModal();
    } else {
        checkinDialog.setAttribute("open", "true");
    }
}

function closeCheckinDialog() {
    pendingCheckin = null;
    if (typeof checkinDialog.close === "function") {
        checkinDialog.close();
    } else {
        checkinDialog.removeAttribute("open");
    }
}

function setupInteractions() {
    searchInput.addEventListener("input", applyFilterAndRender);

    guestList.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const button = target.closest("button[data-id]");
        if (!button) {
            return;
        }

        const guestId = button.dataset.id;
        if (!guestId) {
            return;
        }

        const action = button.dataset.action;

        if (action === "details") {
            const guest = getGuestById(guestId);
            if (guest) {
                openDetailsDialog(guest);
            }
            return;
        }

        const currentChecked = button.dataset.checked === "1";

        const card = button.closest(".guest-card");
        const guestName = card ? card.querySelector(".guest-name")?.textContent.trim() : "este convidado";
        openCheckinDialog(guestId, currentChecked, guestName || "este convidado");
    });

    checkinDialogConfirm.addEventListener("click", async () => {
        if (!pendingCheckin) {
            return;
        }

        const { guestId, currentChecked } = pendingCheckin;
        closeCheckinDialog();
        await toggleCheckIn(guestId, currentChecked);
    });

    checkinDialogCancel.addEventListener("click", () => {
        closeCheckinDialog();
    });

    detailsDialogClose.addEventListener("click", () => {
        closeDetailsDialog();
    });

    detailsDialogOk.addEventListener("click", () => {
        closeDetailsDialog();
    });
}

function subscribeGuestList() {
    if (!db) {
        setFeedback("Configure o Firebase no arquivo admin.js para usar a área administrativa.");
        return;
    }

    const guestsQuery = query(collection(db, "confirmacoes_jantar"), orderBy("createdAt", "desc"));

    if (guestUnsubscribe) {
        guestUnsubscribe();
    }

    guestUnsubscribe = onSnapshot(
        guestsQuery,
        (snapshot) => {
            allGuests = snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data(),
            }));

            applyFilterAndRender();
            setFeedback("");
        },
        (error) => {
            console.error(error);
            setFeedback("Falha ao carregar convidados. Verifique regras e conexão com Firestore.");
        }
    );
}

function setupAdminAuthGuard() {
    if (!auth) {
        setFeedback("Firebase Auth não configurado.");
        return;
    }

    onAuthStateChanged(auth, (user) => {
        if (!user || !isAllowedAdmin(user.email)) {
            window.location.href = "admin-login.html";
            return;
        }

        adminEmailBadge.textContent = user.email;
        subscribeGuestList();
    });
}

function setupLogout() {
    logoutButton.addEventListener("click", async () => {
        if (!auth) {
            return;
        }

        try {
            await signOut(auth);
            window.location.href = "admin-login.html";
        } catch (error) {
            console.error(error);
            setFeedback("Não foi possível encerrar a sessão.");
        }
    });
}

setupInteractions();
setupLogout();
setupAdminAuthGuard();
