import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    addDoc,
    collection,
    doc,
    getFirestore,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
    getDocs,
    limit,
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

const ALLOWED_ADMIN_EMAILS = [
    "admin@acia.com.br",
];

const CARGO_OPTIONS = {
    convidado: { label: "Convidado", className: "cargo-convidado" },
    autoridades: { label: "Autoridades", className: "cargo-autoridades" },
    homenageados: { label: "Homenageados", className: "cargo-homenageados" },
    ex_presidentes: { label: "Ex-presidentes", className: "cargo-ex_presidentes" },
    patrocinadores: { label: "Patrocinadores", className: "cargo-patrocinadores" },
    diretoria: { label: "Diretoria", className: "cargo-diretoria" },
};

const adminEmailBadge = document.getElementById("adminEmailBadge");
const logoutButton = document.getElementById("logoutButton");
const searchInput = document.getElementById("searchInput");
const confirmedList = document.getElementById("confirmedList");
const cargoFeedback = document.getElementById("cargoFeedback");
const openCreateButton = document.getElementById("openCreateButton");

const cargoDialog = document.getElementById("cargoDialog");
const cargoDialogSubtitle = document.getElementById("cargoDialogSubtitle");
const cargoSelect = document.getElementById("cargoSelect");
const saveCargoButton = document.getElementById("saveCargoButton");
const removeCargoButton = document.getElementById("removeCargoButton");
const cancelCargoButton = document.getElementById("cancelCargoButton");

const createDialog = document.getElementById("createDialog");
const createDialogClose = document.getElementById("createDialogClose");
const createCancelButton = document.getElementById("createCancelButton");
const createGuestForm = document.getElementById("createGuestForm");
const createFeedback = document.getElementById("createFeedback");
const createSaveButton = document.getElementById("createSaveButton");

const newFullName = document.getElementById("newFullName");
const newPersonType = document.getElementById("newPersonType");
const newCargo = document.getElementById("newCargo");
const newCpf = document.getElementById("newCpf");
const newCnpj = document.getElementById("newCnpj");
const newCompanyName = document.getElementById("newCompanyName");
const newPhone = document.getElementById("newPhone");
const newHasCompanion = document.getElementById("newHasCompanion");
const newCompanionSection = document.getElementById("newCompanionSection");
const newCompanionFullName = document.getElementById("newCompanionFullName");
const newCompanionPhone = document.getElementById("newCompanionPhone");
const newCompanionCpf = document.getElementById("newCompanionCpf");

const newCpfGroup = document.getElementById("newCpfGroup");
const newCnpjGroup = document.getElementById("newCnpjGroup");
const newCompanyGroup = document.getElementById("newCompanyGroup");

const hasFirebaseConfig = Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && !value.startsWith("COLOQUE_")
);

let db = null;
let auth = null;
let allGuests = [];
let pendingCargoTarget = null;
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

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatCpf(value) {
    const digits = onlyDigits(value).slice(0, 11);
    return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatCnpj(value) {
    const digits = onlyDigits(value).slice(0, 14);
    return digits
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPhone(value) {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 10) {
        return digits
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return digits
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
}

function setFeedback(message = "", isError = true, target = cargoFeedback) {
    target.textContent = message;
    target.style.color = isError ? "#b91c1c" : "#166534";
}

function getCargoMeta(cargo) {
    return CARGO_OPTIONS[cargo] || null;
}

function cargoBadge(cargo) {
    const meta = getCargoMeta(cargo) || CARGO_OPTIONS.convidado;

    return `<span class="cargo-pill ${meta.className}">${meta.label}</span>`;
}

function toggleCreateDocumentFields() {
    if (newPersonType.value === "PJ") {
        newCpfGroup.classList.add("hidden");
        newCnpjGroup.classList.remove("hidden");
        newCompanyGroup.classList.remove("hidden");
    } else {
        newCpfGroup.classList.remove("hidden");
        newCnpjGroup.classList.add("hidden");
        newCompanyGroup.classList.add("hidden");
    }
}

function toggleCompanionFields() {
    if (newHasCompanion.value === "sim") {
        newCompanionSection.classList.remove("hidden");
        newCompanionSection.hidden = false;
        newCompanionSection.setAttribute("aria-hidden", "false");
        return;
    }

    newCompanionSection.classList.add("hidden");
    newCompanionSection.hidden = true;
    newCompanionSection.setAttribute("aria-hidden", "true");
    newCompanionFullName.value = "";
    newCompanionPhone.value = "";
    newCompanionCpf.value = "";
}

function renderConfirmed(list) {
    if (list.length === 0) {
        confirmedList.innerHTML = '<div class="empty-state">Nenhum confirmado encontrado para este filtro.</div>';
        return;
    }

    confirmedList.innerHTML = list.map((guest) => {
        const documentLabel = guest.personType === "PF" ? "CPF" : "CNPJ";
        const documentValue = guest.personType === "PF" ? formatCpf(guest.cpf) : formatCnpj(guest.cnpj);

        return `
            <article class="guest-card">
                <div class="guest-main with-cargo">
                    <h3 class="guest-name">${escapeHtml(guest.fullName || "Sem nome")}</h3>
                    ${cargoBadge(guest.cargo)}
                </div>

                <div class="guest-meta">
                    <div class="meta-item">
                        <strong>${documentLabel}</strong>
                        <span>${escapeHtml(documentValue || "-")}</span>
                    </div>
                    <div class="meta-item">
                        <strong>WhatsApp</strong>
                        <span>${escapeHtml(formatPhone(guest.phone))}</span>
                    </div>
                    <div class="meta-item">
                        <strong>Tipo</strong>
                        <span>${escapeHtml(guest.personType === "PF" ? "Pessoa Física" : guest.personType === "PJ" ? "Pessoa Jurídica" : "-")}</span>
                    </div>
                </div>

                <div class="guest-actions">
                    <button class="apply-cargo-button" type="button" data-action="apply-cargo" data-target="guest" data-id="${guest.id}">Aplicar cargo</button>
                    <button class="remove-cargo-button" type="button" data-action="remove-cargo" data-target="guest" data-id="${guest.id}">Remover cargo</button>
                </div>

                ${guest.hasCompanion && guest.companion ? `
                    <div class="companion-note">
                        <strong>Acompanhante:</strong> ${escapeHtml(guest.companion.fullName || "Sem nome")}
                        ${cargoBadge(guest.companion.cargo)}
                    </div>
                    <div class="guest-actions">
                        <button class="apply-cargo-button" type="button" data-action="apply-cargo" data-target="companion" data-id="${guest.id}">Aplicar cargo do acompanhante</button>
                        <button class="remove-cargo-button" type="button" data-action="remove-cargo" data-target="companion" data-id="${guest.id}">Remover cargo do acompanhante</button>
                    </div>
                ` : ""}
            </article>
        `;
    }).join("");
}

function applyFilterAndRender() {
    const term = searchInput.value.trim().toLowerCase();

    const filtered = allGuests.filter((guest) => {
        const searchBase = [
            guest.fullName || "",
            guest.phone || "",
            guest.cpf || "",
            guest.cnpj || "",
            guest.companyName || "",
            guest.cargo || "",
            guest.companion?.fullName || "",
            guest.companion?.cargo || "",
        ].join(" ").toLowerCase();

        return searchBase.includes(term);
    });

    renderConfirmed(filtered);
}

function openDialog(dialog) {
    if (typeof dialog.showModal === "function") {
        dialog.showModal();
    } else {
        dialog.setAttribute("open", "true");
    }
}

function closeDialog(dialog) {
    if (typeof dialog.close === "function") {
        dialog.close();
    } else {
        dialog.removeAttribute("open");
    }
}

async function saveCargo() {
    if (!pendingCargoTarget?.guestId) {
        return;
    }

    if (!cargoSelect.value) {
        setFeedback("Selecione um cargo para salvar.");
        return;
    }

    try {
        if (pendingCargoTarget.target === "companion") {
            await updateDoc(doc(db, "confirmacoes_jantar", pendingCargoTarget.guestId), {
                "companion.cargo": cargoSelect.value,
                updatedAt: serverTimestamp(),
            });
        } else {
            await updateDoc(doc(db, "confirmacoes_jantar", pendingCargoTarget.guestId), {
                cargo: cargoSelect.value,
                updatedAt: serverTimestamp(),
            });
        }

        closeDialog(cargoDialog);
        pendingCargoTarget = null;
        setFeedback("Cargo aplicado com sucesso.", false);
    } catch (error) {
        console.error(error);
        setFeedback("Nao foi possivel aplicar o cargo.");
    }
}

async function removeCargo() {
    if (!pendingCargoTarget?.guestId) {
        return;
    }

    try {
        if (pendingCargoTarget.target === "companion") {
            await updateDoc(doc(db, "confirmacoes_jantar", pendingCargoTarget.guestId), {
                "companion.cargo": null,
                updatedAt: serverTimestamp(),
            });
        } else {
            await updateDoc(doc(db, "confirmacoes_jantar", pendingCargoTarget.guestId), {
                cargo: null,
                updatedAt: serverTimestamp(),
            });
        }

        closeDialog(cargoDialog);
        pendingCargoTarget = null;
        setFeedback("Cargo removido com sucesso.", false);
    } catch (error) {
        console.error(error);
        setFeedback("Não foi possível remover o cargo.");
    }
}

async function validateDuplicate(personType, docValue) {
    const duplicateQuery = personType === "PF"
        ? query(
            collection(db, "confirmacoes_jantar"),
            where("personType", "==", "PF"),
            where("cpf", "==", docValue),
            limit(1)
        )
        : query(
            collection(db, "confirmacoes_jantar"),
            where("personType", "==", "PJ"),
            where("cnpj", "==", docValue),
            limit(1)
        );

    const duplicateSnapshot = await getDocs(duplicateQuery);
    return !duplicateSnapshot.empty;
}

function validateCreateForm() {
    if (!newFullName.value.trim()) {
        setFeedback("Informe o nome completo.", true, createFeedback);
        newFullName.focus();
        return false;
    }

    if (!newPersonType.value) {
        setFeedback("Selecione o tipo de pessoa.", true, createFeedback);
        newPersonType.focus();
        return false;
    }

    if (!newCargo.value) {
        setFeedback("Selecione um cargo.", true, createFeedback);
        newCargo.focus();
        return false;
    }

    if (!onlyDigits(newPhone.value)) {
        setFeedback("Informe o WhatsApp do convidado.", true, createFeedback);
        newPhone.focus();
        return false;
    }

    if (newPersonType.value === "PF" && onlyDigits(newCpf.value).length !== 11) {
        setFeedback("Informe um CPF válido.", true, createFeedback);
        newCpf.focus();
        return false;
    }

    if (newPersonType.value === "PJ" && onlyDigits(newCnpj.value).length !== 14) {
        setFeedback("Informe um CNPJ válido.", true, createFeedback);
        newCnpj.focus();
        return false;
    }

    if (newPersonType.value === "PJ" && !newCompanyName.value.trim()) {
        setFeedback("Informe o nome da empresa.", true, createFeedback);
        newCompanyName.focus();
        return false;
    }

    if (newHasCompanion.value === "sim") {
        if (!newCompanionFullName.value.trim()) {
            setFeedback("Informe o nome do acompanhante.", true, createFeedback);
            newCompanionFullName.focus();
            return false;
        }

        if (onlyDigits(newCompanionPhone.value).length !== 11) {
            setFeedback("Informe um WhatsApp válido para o acompanhante.", true, createFeedback);
            newCompanionPhone.focus();
            return false;
        }

        if (onlyDigits(newCompanionCpf.value).length !== 11) {
            setFeedback("Informe um CPF válido para o acompanhante.", true, createFeedback);
            newCompanionCpf.focus();
            return false;
        }
    }

    return true;
}

async function createNewGuest(event) {
    event.preventDefault();
    setFeedback("", true, createFeedback);

    if (!validateCreateForm()) {
        return;
    }

    const documentNumber = newPersonType.value === "PF" ? onlyDigits(newCpf.value) : onlyDigits(newCnpj.value);

    try {
        const duplicated = await validateDuplicate(newPersonType.value, documentNumber);
        if (duplicated) {
            setFeedback("Já existe confirmação para este CPF/CNPJ.", true, createFeedback);
            return;
        }

        createSaveButton.disabled = true;
        createSaveButton.textContent = "Salvando...";

        const payload = {
            fullName: newFullName.value.trim(),
            personType: newPersonType.value,
            cpf: newPersonType.value === "PF" ? onlyDigits(newCpf.value) : null,
            cnpj: newPersonType.value === "PJ" ? onlyDigits(newCnpj.value) : null,
            companyName: newPersonType.value === "PJ" ? newCompanyName.value.trim() : null,
            documentNumber,
            phone: onlyDigits(newPhone.value),
            hasCompanion: newHasCompanion.value === "sim",
            companion: newHasCompanion.value === "sim"
                ? {
                    fullName: newCompanionFullName.value.trim(),
                    phone: onlyDigits(newCompanionPhone.value),
                    cpf: onlyDigits(newCompanionCpf.value),
                }
                : null,
            cargo: newCargo.value,
            acceptedTerms: true,
            acceptedTermsAt: new Date().toISOString(),
            checkedIn: false,
            companionCheckedIn: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, "confirmacoes_jantar"), payload);
        setFeedback("Convidado cadastrado com sucesso.", false, createFeedback);
        createGuestForm.reset();
        newHasCompanion.value = "nao";
        toggleCreateDocumentFields();
        toggleCompanionFields();

        setTimeout(() => {
            closeDialog(createDialog);
            setFeedback("", true, createFeedback);
        }, 700);
    } catch (error) {
        console.error(error);
        setFeedback("Não foi possível cadastrar o convidado.", true, createFeedback);
    } finally {
        createSaveButton.disabled = false;
        createSaveButton.textContent = "Salvar confirmado";
    }
}

function subscribeGuestList() {
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
        },
        (error) => {
            console.error(error);
            setFeedback("Falha ao carregar confirmados.");
        }
    );
}

function setupInteractions() {
    searchInput.addEventListener("input", applyFilterAndRender);

    confirmedList.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const button = target.closest("button[data-action][data-id]");
        if (!button) {
            return;
        }

        const guestId = button.dataset.id;
        if (!guestId) {
            return;
        }

        const guest = allGuests.find((item) => item.id === guestId);
        if (!guest) {
            return;
        }

        const targetType = button.dataset.target === "companion" ? "companion" : "guest";
        if (targetType === "companion" && !(guest.hasCompanion && guest.companion)) {
            setFeedback("Este convidado não possui acompanhante.");
            return;
        }

        if (button.dataset.action === "remove-cargo") {
            pendingCargoTarget = { guestId: guest.id, target: targetType };
            removeCargo();
            return;
        }

        pendingCargoTarget = { guestId: guest.id, target: targetType };
        if (targetType === "companion") {
            cargoSelect.value = guest.companion?.cargo || "";
            cargoDialogSubtitle.textContent = `Selecione o cargo para o acompanhante de ${guest.fullName || "este confirmado"}.`;
        } else {
            cargoSelect.value = guest.cargo || "";
            cargoDialogSubtitle.textContent = `Selecione o cargo para ${guest.fullName || "este confirmado"}.`;
        }
        openDialog(cargoDialog);
    });

    saveCargoButton.addEventListener("click", saveCargo);
    removeCargoButton.addEventListener("click", removeCargo);
    cancelCargoButton.addEventListener("click", () => {
        pendingCargoTarget = null;
        closeDialog(cargoDialog);
    });

    openCreateButton.addEventListener("click", () => {
        setFeedback("", true, createFeedback);
        createGuestForm.reset();
        newHasCompanion.value = "nao";
        toggleCreateDocumentFields();
        toggleCompanionFields();
        openDialog(createDialog);
    });

    createDialogClose.addEventListener("click", () => closeDialog(createDialog));
    createCancelButton.addEventListener("click", () => closeDialog(createDialog));

    createGuestForm.addEventListener("submit", createNewGuest);

    newPersonType.addEventListener("change", toggleCreateDocumentFields);
    newHasCompanion.addEventListener("change", toggleCompanionFields);

    newCpf.addEventListener("input", () => {
        newCpf.value = formatCpf(newCpf.value);
    });

    newCnpj.addEventListener("input", () => {
        newCnpj.value = formatCnpj(newCnpj.value);
    });

    newPhone.addEventListener("input", () => {
        newPhone.value = formatPhone(newPhone.value);
    });

    newCompanionPhone.addEventListener("input", () => {
        newCompanionPhone.value = formatPhone(newCompanionPhone.value);
    });

    newCompanionCpf.addEventListener("input", () => {
        newCompanionCpf.value = formatCpf(newCompanionCpf.value);
    });

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

function setupAuthGuard() {
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

setupInteractions();
toggleCreateDocumentFields();
toggleCompanionFields();
setupAuthGuard();
