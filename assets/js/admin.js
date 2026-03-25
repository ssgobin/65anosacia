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
const totalGuestsCount = document.getElementById("totalGuestsCount");
const checkedInCount = document.getElementById("checkedInCount");
const pendingCount = document.getElementById("pendingCount");
const cargoAutoridadesCount = document.getElementById("cargoAutoridadesCount");
const cargoHomenageadosCount = document.getElementById("cargoHomenageadosCount");
const cargoExPresidentesCount = document.getElementById("cargoExPresidentesCount");
const cargoPatrocinadoresCount = document.getElementById("cargoPatrocinadoresCount");
const cargoDiretoriaCount = document.getElementById("cargoDiretoriaCount");
const cargoOutrasEntidadesCount = document.getElementById("cargoOutrasEntidadesCount");
const cargoAutoridadesCheckinCount = document.getElementById("cargoAutoridadesCheckinCount");
const cargoHomenageadosCheckinCount = document.getElementById("cargoHomenageadosCheckinCount");
const cargoExPresidentesCheckinCount = document.getElementById("cargoExPresidentesCheckinCount");
const cargoPatrocinadoresCheckinCount = document.getElementById("cargoPatrocinadoresCheckinCount");
const cargoDiretoriaCheckinCount = document.getElementById("cargoDiretoriaCheckinCount");
const cargoOutrasEntidadesCheckinCount = document.getElementById("cargoOutrasEntidadesCheckinCount");
const cargoStatsGrid = document.getElementById("cargoStatsGrid");
const searchInput = document.getElementById("searchInput");
const guestList = document.getElementById("guestList");
const adminFeedback = document.getElementById("adminFeedback");
const adminEmailBadge = document.getElementById("adminEmailBadge");
const logoutButton = document.getElementById("logoutButton");
const checkinDialog = document.getElementById("checkinDialog");
const checkinDialogConfirm = document.getElementById("checkinDialogConfirm");
const checkinDialogWithoutCompanion = document.getElementById("checkinDialogWithoutCompanion");
const checkinDialogCancel = document.getElementById("checkinDialogCancel");
const checkinDialogMessage = document.getElementById("checkinDialogMessage");
const detailsDialog = document.getElementById("detailsDialog");
const detailsDialogClose = document.getElementById("detailsDialogClose");
const detailsDialogOk = document.getElementById("detailsDialogOk");
const detailsDialogSubtitle = document.getElementById("detailsDialogSubtitle");
const detailsGrid = document.getElementById("detailsGrid");
const cargoGuestsDialog = document.getElementById("cargoGuestsDialog");
const cargoGuestsDialogTitle = document.getElementById("cargoGuestsDialogTitle");
const cargoGuestsDialogSubtitle = document.getElementById("cargoGuestsDialogSubtitle");
const cargoGuestsDialogList = document.getElementById("cargoGuestsDialogList");
const cargoGuestsDialogClose = document.getElementById("cargoGuestsDialogClose");
const cargoGuestsDialogOk = document.getElementById("cargoGuestsDialogOk");
const exportButton = document.getElementById("exportButton");
const exportOptionsDialog = document.getElementById("exportOptionsDialog");
const exportAllButton = document.getElementById("exportAllButton");
const exportAuthoritiesButton = document.getElementById("exportAuthoritiesButton");
const exportOptionsCancelButton = document.getElementById("exportOptionsCancelButton");
const editGuestDialog = document.getElementById("editGuestDialog");
const editGuestDialogClose = document.getElementById("editGuestDialogClose");
const editGuestDialogSubtitle = document.getElementById("editGuestDialogSubtitle");
const editGuestForm = document.getElementById("editGuestForm");
const editFullName = document.getElementById("editFullName");
const editCargo = document.getElementById("editCargo");
const editPersonType = document.getElementById("editPersonType");
const editCpfField = document.getElementById("editCpfField");
const editCnpjField = document.getElementById("editCnpjField");
const editCpf = document.getElementById("editCpf");
const editCnpj = document.getElementById("editCnpj");
const editCompanyField = document.getElementById("editCompanyField");
const editCompanyName = document.getElementById("editCompanyName");
const editPhone = document.getElementById("editPhone");
const editHasCompanion = document.getElementById("editHasCompanion");
const editCompanionSection = document.getElementById("editCompanionSection");
const editCompanionFullName = document.getElementById("editCompanionFullName");
const editCompanionPhone = document.getElementById("editCompanionPhone");
const editCompanionCpf = document.getElementById("editCompanionCpf");
const editGuestFeedback = document.getElementById("editGuestFeedback");
const editGuestCancel = document.getElementById("editGuestCancel");
const editGuestSave = document.getElementById("editGuestSave");

let pendingCheckin = null;
let pendingEditGuestId = null;

const ALLOWED_ADMIN_EMAILS = [
    "admin@acia.com.br",
];

const CARGO_META = {
    convidado: { label: "Convidado", className: "cargo-convidado" },
    autoridades: { label: "Autoridades", className: "cargo-autoridades" },
    homenageados: { label: "Homenageados", className: "cargo-homenageados" },
    ex_presidentes: { label: "Ex-presidentes", className: "cargo-ex_presidentes" },
    patrocinadores: { label: "Patrocinadores", className: "cargo-patrocinadores" },
    diretoria: { label: "Diretoria", className: "cargo-diretoria" },
    outras_entidades: { label: "Outras entidades", className: "cargo-outras_entidades" },
};

const EXPORT_AUTHORITIES_CARGOS = new Set([
    "autoridades",
    "homenageados",
    "diretoria",
    "patrocinadores",
    "ex_presidentes",
    "outras_entidades",
]);

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

function maskCpf(value) {
    const digits = onlyDigits(value).slice(0, 11);
    return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskCnpj(value) {
    const digits = onlyDigits(value).slice(0, 14);
    return digits
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskPhone(value) {
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

function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function isValidPhone(phone) {
    const digits = onlyDigits(phone);
    return digits.length === 10 || digits.length === 11;
}

function isValidFullName(value) {
    const cleaned = String(value || "").trim();
    return cleaned.length >= 5 && cleaned.split(/\s+/).length >= 2;
}

function isValidCpf(value) {
    const digits = onlyDigits(value);

    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
        return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i += 1) {
        sum += Number(digits[i]) * (10 - i);
    }

    let firstDigit = (sum * 10) % 11;
    if (firstDigit === 10) {
        firstDigit = 0;
    }

    if (firstDigit !== Number(digits[9])) {
        return false;
    }

    sum = 0;
    for (let i = 0; i < 10; i += 1) {
        sum += Number(digits[i]) * (11 - i);
    }

    let secondDigit = (sum * 10) % 11;
    if (secondDigit === 10) {
        secondDigit = 0;
    }

    return secondDigit === Number(digits[10]);
}

function isValidCnpj(value) {
    const digits = onlyDigits(value);

    if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) {
        return false;
    }

    const calcDigit = (base, multipliers) => {
        const sum = base
            .split("")
            .reduce((acc, char, index) => acc + Number(char) * multipliers[index], 0);
        const rest = sum % 11;
        return rest < 2 ? 0 : 11 - rest;
    };

    const base = digits.slice(0, 12);
    const firstDigit = calcDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const secondDigit = calcDigit(base + firstDigit, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

    return digits.endsWith(`${firstDigit}${secondDigit}`);
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
    const totalPeople = guests.reduce(
        (total, guest) => total + 1 + (guest.hasCompanion && guest.companion ? 1 : 0),
        0
    );

    const checkedPeople = guests.reduce((total, guest) => {
        if (!guest.checkedIn) {
            return total;
        }

        const companionCame = guest.hasCompanion && guest.companion && guest.companionCheckedIn !== false;
        return total + 1 + (companionCame ? 1 : 0);
    }, 0);

    totalCount.textContent = String(totalPeople);
    totalGuestsCount.textContent = String(guests.length);
    checkedInCount.textContent = String(checkedPeople);
    pendingCount.textContent = String(totalPeople - checkedPeople);

    const cargoCounts = guests.reduce((acc, guest) => {
        const cargo = guest.cargo;
        if (cargo && acc[cargo] !== undefined) {
            acc[cargo] += 1;
        }

        const companionCargo = guest.companion?.cargo;
        if (companionCargo && acc[companionCargo] !== undefined) {
            acc[companionCargo] += 1;
        }

        return acc;
    }, {
        autoridades: 0,
        homenageados: 0,
        ex_presidentes: 0,
        patrocinadores: 0,
        diretoria: 0,
        outras_entidades: 0,
    });

    const cargoCheckinCounts = guests.reduce((acc, guest) => {
        const cargo = guest.cargo;
        if (cargo && acc[cargo] !== undefined && guest.checkedIn) {
            acc[cargo] += 1;
        }

        const companionCargo = guest.companion?.cargo;
        const companionDidCheckin = guest.checkedIn && guest.companionCheckedIn !== false;
        if (companionCargo && acc[companionCargo] !== undefined && companionDidCheckin) {
            acc[companionCargo] += 1;
        }

        return acc;
    }, {
        autoridades: 0,
        homenageados: 0,
        ex_presidentes: 0,
        patrocinadores: 0,
        diretoria: 0,
        outras_entidades: 0,
    });

    if (cargoAutoridadesCount) cargoAutoridadesCount.textContent = String(cargoCounts.autoridades);
    if (cargoHomenageadosCount) cargoHomenageadosCount.textContent = String(cargoCounts.homenageados);
    if (cargoExPresidentesCount) cargoExPresidentesCount.textContent = String(cargoCounts.ex_presidentes);
    if (cargoPatrocinadoresCount) cargoPatrocinadoresCount.textContent = String(cargoCounts.patrocinadores);
    if (cargoDiretoriaCount) cargoDiretoriaCount.textContent = String(cargoCounts.diretoria);
    if (cargoOutrasEntidadesCount) cargoOutrasEntidadesCount.textContent = String(cargoCounts.outras_entidades);
    if (cargoAutoridadesCheckinCount) cargoAutoridadesCheckinCount.textContent = String(cargoCheckinCounts.autoridades);
    if (cargoHomenageadosCheckinCount) cargoHomenageadosCheckinCount.textContent = String(cargoCheckinCounts.homenageados);
    if (cargoExPresidentesCheckinCount) cargoExPresidentesCheckinCount.textContent = String(cargoCheckinCounts.ex_presidentes);
    if (cargoPatrocinadoresCheckinCount) cargoPatrocinadoresCheckinCount.textContent = String(cargoCheckinCounts.patrocinadores);
    if (cargoDiretoriaCheckinCount) cargoDiretoriaCheckinCount.textContent = String(cargoCheckinCounts.diretoria);
    if (cargoOutrasEntidadesCheckinCount) cargoOutrasEntidadesCheckinCount.textContent = String(cargoCheckinCounts.outras_entidades);
}

function cargoBadge(cargo) {
    const meta = CARGO_META[cargo] || CARGO_META.convidado;

    return `<span class="cargo-pill ${meta.className}">${meta.label}</span>`;
}

function cargoLabel(cargo) {
    return CARGO_META[cargo]?.label || CARGO_META.convidado.label;
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
    const companionCargo = guest.hasCompanion && guest.companion
        ? cargoLabel(guest.companion.cargo)
        : "Sem acompanhante";

    detailsDialogSubtitle.textContent = guest.fullName || "Convidado";

    detailsGrid.innerHTML = [
        detailsItem("Nome completo", guest.fullName || "-"),
        detailsItem("Cargo", CARGO_META[guest.cargo]?.label || "Convidado"),
        detailsItem("Tipo", guest.personType || "-"),
        detailsItem(documentLabel, documentValue),
        detailsItem("Nome da empresa", companyValue),
        detailsItem("WhatsApp", formatPhone(guest.phone)),
        detailsItem("Acompanhante", companionSummary),
        detailsItem("Cargo do acompanhante", companionCargo),
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

function setEditFeedback(message = "", isSuccess = false) {
    editGuestFeedback.textContent = message;
    editGuestFeedback.classList.toggle("success", isSuccess);
}

function toggleEditDocumentFields() {
    const isPF = editPersonType.value === "PF";

    editCpfField.hidden = !isPF;
    editCnpjField.hidden = isPF;
    editCompanyField.hidden = isPF;

    editCpf.required = isPF;
    editCnpj.required = !isPF;
    editCompanyName.required = !isPF;

    if (isPF) {
        editCnpj.value = "";
        editCompanyName.value = "";
    } else {
        editCpf.value = "";
    }
}

function toggleEditCompanionFields() {
    const hasCompanion = editHasCompanion.value === "sim";

    editCompanionSection.hidden = !hasCompanion;
    editCompanionFullName.required = hasCompanion;
    editCompanionPhone.required = hasCompanion;
    editCompanionCpf.required = hasCompanion;

    if (!hasCompanion) {
        editCompanionFullName.value = "";
        editCompanionPhone.value = "";
        editCompanionCpf.value = "";
    }
}

function openEditDialog(guest) {
    pendingEditGuestId = guest.id;
    editGuestDialogSubtitle.textContent = `Editando: ${guest.fullName || "Convidado"}`;

    editFullName.value = guest.fullName || "";
    editCargo.value = guest.cargo || "convidado";
    editPersonType.value = guest.personType === "PJ" ? "PJ" : "PF";
    editCpf.value = maskCpf(guest.cpf || "");
    editCnpj.value = maskCnpj(guest.cnpj || "");
    editCompanyName.value = guest.companyName || "";
    editPhone.value = maskPhone(guest.phone || "");

    const hasCompanion = !!(guest.hasCompanion && guest.companion);
    editHasCompanion.value = hasCompanion ? "sim" : "nao";
    editCompanionFullName.value = hasCompanion ? (guest.companion.fullName || "") : "";
    editCompanionPhone.value = hasCompanion ? maskPhone(guest.companion.phone || "") : "";
    editCompanionCpf.value = hasCompanion ? maskCpf(guest.companion.cpf || "") : "";

    toggleEditDocumentFields();
    toggleEditCompanionFields();
    setEditFeedback("");

    if (typeof editGuestDialog.showModal === "function") {
        editGuestDialog.showModal();
    } else {
        editGuestDialog.setAttribute("open", "true");
    }
}

function closeEditDialog() {
    pendingEditGuestId = null;
    editGuestForm.reset();
    toggleEditDocumentFields();
    toggleEditCompanionFields();
    setEditFeedback("");

    if (typeof editGuestDialog.close === "function") {
        editGuestDialog.close();
    } else {
        editGuestDialog.removeAttribute("open");
    }
}

function validateEditForm() {
    if (!pendingEditGuestId) {
        return { ok: false, message: "Convidado não identificado para edição." };
    }

    if (!isValidFullName(editFullName.value)) {
        return { ok: false, message: "Informe nome e sobrenome do convidado." };
    }

    if (!isValidPhone(editPhone.value)) {
        return { ok: false, message: "Informe um WhatsApp válido do convidado." };
    }

    const personTypeValue = editPersonType.value;
    const cpfDigits = onlyDigits(editCpf.value);
    const cnpjDigits = onlyDigits(editCnpj.value);
    const documentDigits = personTypeValue === "PF" ? cpfDigits : cnpjDigits;

    if (personTypeValue === "PF") {
        if (!isValidCpf(cpfDigits)) {
            return { ok: false, message: "CPF inválido." };
        }
    } else {
        if (!isValidCnpj(cnpjDigits)) {
            return { ok: false, message: "CNPJ inválido." };
        }

        if (String(editCompanyName.value || "").trim().length < 2) {
            return { ok: false, message: "Informe o nome da empresa." };
        }
    }

    const duplicated = allGuests.find((guest) => {
        if (guest.id === pendingEditGuestId || guest.personType !== personTypeValue) {
            return false;
        }

        const guestDocument = onlyDigits(personTypeValue === "PF" ? guest.cpf : guest.cnpj);
        return guestDocument && guestDocument === documentDigits;
    });

    if (duplicated) {
        return {
            ok: false,
            message: `Já existe um convidado com este documento: ${duplicated.fullName || "Sem nome"}.`,
        };
    }

    const hasCompanion = editHasCompanion.value === "sim";
    if (hasCompanion) {
        if (!isValidFullName(editCompanionFullName.value)) {
            return { ok: false, message: "Informe nome e sobrenome do acompanhante." };
        }

        if (!isValidPhone(editCompanionPhone.value)) {
            return { ok: false, message: "Informe um WhatsApp válido para o acompanhante." };
        }

        if (!isValidCpf(editCompanionCpf.value)) {
            return { ok: false, message: "CPF do acompanhante inválido." };
        }

        if (normalizeText(editCompanionFullName.value) === normalizeText(editFullName.value)) {
            return { ok: false, message: "Nome do acompanhante não pode ser igual ao do convidado." };
        }

        if (onlyDigits(editCompanionPhone.value) === onlyDigits(editPhone.value)) {
            return { ok: false, message: "WhatsApp do acompanhante não pode ser igual ao principal." };
        }

        if (personTypeValue === "PF" && onlyDigits(editCompanionCpf.value) === cpfDigits) {
            return { ok: false, message: "CPF do acompanhante não pode ser igual ao do convidado." };
        }
    }

    return { ok: true };
}

function getEditPayload(baseGuest) {
    const personTypeValue = editPersonType.value;
    const hasCompanion = editHasCompanion.value === "sim";

    const payload = {
        fullName: editFullName.value.trim(),
        cargo: editCargo.value || "convidado",
        personType: personTypeValue,
        cpf: personTypeValue === "PF" ? onlyDigits(editCpf.value) : null,
        cnpj: personTypeValue === "PJ" ? onlyDigits(editCnpj.value) : null,
        companyName: personTypeValue === "PJ" ? editCompanyName.value.trim() : null,
        documentNumber: personTypeValue === "PF" ? onlyDigits(editCpf.value) : onlyDigits(editCnpj.value),
        phone: onlyDigits(editPhone.value),
        hasCompanion,
        companion: hasCompanion
            ? {
                fullName: editCompanionFullName.value.trim(),
                phone: onlyDigits(editCompanionPhone.value),
                cpf: onlyDigits(editCompanionCpf.value),
                cargo: baseGuest.companion?.cargo || "convidado",
            }
            : null,
        updatedAt: serverTimestamp(),
    };

    if (!hasCompanion || !baseGuest.checkedIn) {
        payload.companionCheckedIn = false;
    }

    return payload;
}

async function handleEditSubmit(event) {
    event.preventDefault();

    if (!db) {
        setEditFeedback("Firebase não configurado para administração.");
        return;
    }

    if (!pendingEditGuestId) {
        setEditFeedback("Nenhum convidado selecionado para edição.");
        return;
    }

    const validation = validateEditForm();
    if (!validation.ok) {
        setEditFeedback(validation.message);
        return;
    }

    const baseGuest = getGuestById(pendingEditGuestId);
    if (!baseGuest) {
        setEditFeedback("Convidado não encontrado para edição.");
        return;
    }

    editGuestSave.disabled = true;
    editGuestSave.textContent = "Salvando...";
    setEditFeedback("");

    try {
        const reference = doc(db, "confirmacoes_jantar", pendingEditGuestId);
        await updateDoc(reference, getEditPayload(baseGuest));

        setFeedback("Dados do convidado atualizados com sucesso.");
        closeEditDialog();
    } catch (error) {
        console.error(error);
        setEditFeedback("Não foi possível salvar as alterações. Tente novamente.");
    } finally {
        editGuestSave.disabled = false;
        editGuestSave.textContent = "Salvar alterações";
    }
}

function openCargoGuestsDialog(cargoKey) {
    const cargoMeta = CARGO_META[cargoKey];
    if (!cargoMeta) {
        return;
    }

    const guestsByCargo = allGuests.flatMap((guest) => {
        const entries = [];

        if (guest.cargo === cargoKey) {
            entries.push({
                fullName: guest.fullName || "Sem nome",
                phone: guest.phone,
                checkedIn: !!guest.checkedIn,
            });
        }

        if (guest.hasCompanion && guest.companion?.cargo === cargoKey) {
            entries.push({
                fullName: `${guest.companion.fullName || "Acompanhante"} (acomp. de ${guest.fullName || "Sem nome"})`,
                phone: guest.companion.phone,
                checkedIn: !!guest.checkedIn && guest.companionCheckedIn !== false,
            });
        }

        return entries;
    });

    const checkedGuestsByCargo = guestsByCargo.filter((guest) => guest.checkedIn);

    cargoGuestsDialogTitle.textContent = `Confirmados: ${cargoMeta.label}`;
    cargoGuestsDialogSubtitle.textContent = `${checkedGuestsByCargo.length} de ${guestsByCargo.length} fez/fizeram check-in neste cargo`;

    if (guestsByCargo.length === 0) {
        cargoGuestsDialogList.innerHTML = '<div class="empty-state">Nenhum confirmado neste cargo até agora.</div>';
    } else {
        cargoGuestsDialogList.innerHTML = guestsByCargo
            .map((guest) => `
                <article class="cargo-guest-item">
                    <strong>
                        ${escapeHtml(guest.fullName || "Sem nome")}
                        <span class="checkin-label ${guest.checkedIn ? "checkin-done" : "checkin-pending"}">
                            ${guest.checkedIn ? "Fez check-in" : "Não fez check-in"}
                        </span>
                    </strong>
                    <span>${escapeHtml(formatPhone(guest.phone))}</span>
                </article>
            `)
            .join("");
    }

    if (typeof cargoGuestsDialog.showModal === "function") {
        cargoGuestsDialog.showModal();
    } else {
        cargoGuestsDialog.setAttribute("open", "true");
    }
}

function closeCargoGuestsDialog() {
    if (typeof cargoGuestsDialog.close === "function") {
        cargoGuestsDialog.close();
    } else {
        cargoGuestsDialog.removeAttribute("open");
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
            const hasCompanion = !!(guest.hasCompanion && guest.companion);
            const companionInfo = hasCompanion
                ? `${escapeHtml(guest.companion.fullName || "Acompanhante")} | ${formatPhone(guest.companion.phone)} | CPF ${formatCpf(guest.companion.cpf)}`
                : "Sem acompanhante";
            const companionCargoBadge = hasCompanion ? cargoBadge(guest.companion.cargo) : "";

            const companionStatusBadge = hasCompanion && guest.checkedIn
                ? (guest.companionCheckedIn === false
                    ? ' <span class="companion-absent">— acompanhante não veio</span>'
                    : ' <span class="companion-present">— acompanhante presente</span>')
                : "";

            return `
        <article class="guest-card">
          <div class="guest-main">
                        <h3 class="guest-name">${escapeHtml(guest.fullName || "Sem nome")} ${cargoBadge(guest.cargo)}</h3>
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
                        <strong>Acompanhante:</strong>
                        <span class="companion-inline">${companionInfo} ${companionCargoBadge}</span>${companionStatusBadge}
          </div>

                    <div class="guest-actions">
                        <button
                            class="edit-button"
                            data-action="edit"
                            data-id="${guest.id}"
                            type="button"
                        >
                            Editar cadastro
                        </button>

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
                            data-has-companion="${hasCompanion ? "1" : "0"}"
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
            guest.cargo || "",
            guest.companion?.fullName || "",
            guest.companion?.phone || "",
            guest.companion?.cpf || "",
            guest.companion?.cargo || "",
        ]
            .join(" ")
            .toLowerCase();

        return searchBase.includes(term);
    });

    updateStats(filtered);
    renderGuests(filtered);
}

async function toggleCheckIn(guestId, currentChecked, companionCame = true) {
    if (!db) {
        setFeedback("Firebase não configurado para administração.");
        return;
    }

    try {
        const reference = doc(db, "confirmacoes_jantar", guestId);
        await updateDoc(reference, {
            checkedIn: !currentChecked,
            checkedInAt: !currentChecked ? serverTimestamp() : null,
            companionCheckedIn: !currentChecked ? companionCame : false,
            updatedAt: serverTimestamp(),
        });

        setFeedback(!currentChecked ? "Check-in confirmado." : "Check-in removido.");
    } catch (error) {
        console.error(error);
        setFeedback("Não foi possível atualizar o check-in. Tente novamente.");
    }
}

function openCheckinDialog(guestId, currentChecked, guestName, hasCompanion) {
    pendingCheckin = { guestId, currentChecked };

    if (currentChecked) {
        checkinDialogMessage.textContent = `Deseja remover o check-in de ${guestName}?`;
        checkinDialogConfirm.textContent = "Sim, remover check-in";
        checkinDialogConfirm.className = "secondary-button";
        checkinDialogWithoutCompanion.hidden = true;
    } else if (hasCompanion) {
        checkinDialogMessage.textContent = `O acompanhante de ${guestName} veio ao evento?`;
        checkinDialogConfirm.textContent = "Chegou com acompanhante";
        checkinDialogConfirm.className = "primary-button";
        checkinDialogWithoutCompanion.hidden = false;
    } else {
        checkinDialogMessage.textContent = `Confirmar chegada de ${guestName}?`;
        checkinDialogConfirm.textContent = "Sim, confirmar chegada";
        checkinDialogConfirm.className = "primary-button";
        checkinDialogWithoutCompanion.hidden = true;
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

function openExportOptionsDialog() {
    if (typeof exportOptionsDialog.showModal === "function") {
        exportOptionsDialog.showModal();
    } else {
        exportOptionsDialog.setAttribute("open", "true");
    }
}

function closeExportOptionsDialog() {
    if (typeof exportOptionsDialog.close === "function") {
        exportOptionsDialog.close();
    } else {
        exportOptionsDialog.removeAttribute("open");
    }
}

async function exportXlsx(mode = "all") {
    if (!allGuests || allGuests.length === 0) {
        setFeedback("Nenhum convidado para exportar.");
        return;
    }

    const guestsToExport = mode === "authorities"
        ? allGuests.filter((guest) => EXPORT_AUTHORITIES_CARGOS.has(guest.cargo))
        : allGuests;

    if (guestsToExport.length === 0) {
        if (mode === "authorities") {
            setFeedback("Nenhum convidado dos cargos de autoridades para exportar.");
            return;
        }
        setFeedback("Nenhum convidado para exportar.");
        return;
    }

    const XLSXLib = window.ExcelJS;
    if (!XLSXLib) {
        setFeedback("Biblioteca de exportação não carregada. Recarregue a página.");
        return;
    }

    const workbook = new XLSXLib.Workbook();
    workbook.creator = "ACIA 65 Anos Admin";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Convidados", {
        views: [{ state: "frozen", ySplit: 10 }],
        pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
    });

    const TOTAL_COLS = 13;

    sheet.columns = [
        { key: "num", width: 5 },
        { key: "name", width: 32 },
        { key: "cargo", width: 18 },
        { key: "type", width: 8 },
        { key: "document", width: 20 },
        { key: "company", width: 26 },
        { key: "phone", width: 18 },
        { key: "companion", width: 30 },
        { key: "companionCpf", width: 18 },
        { key: "companionPhone", width: 18 },
        { key: "status", width: 20 },
        { key: "checkinAt", width: 22 },
        { key: "confirmedAt", width: 22 },
    ];

    // ── Linha 1: Título ──────────────────────────────────────────────────────
    sheet.mergeCells(1, 1, 1, TOTAL_COLS);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = mode === "authorities"
        ? "ACIA 65 Anos — Lista de Autoridades"
        : "ACIA 65 Anos — Lista de Convidados";
    titleCell.font = { name: "Calibri", bold: true, size: 20, color: { argb: "FF1E3A8A" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1E3FF" } };
    sheet.getRow(1).height = 42;

    // ── Linha 2: Data de exportação ──────────────────────────────────────────
    sheet.mergeCells(2, 1, 2, TOTAL_COLS);
    const dateCell = sheet.getCell(2, 1);
    dateCell.value = `Exportado em: ${new Date().toLocaleString("pt-BR")}`;
    dateCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF64748B" } };
    dateCell.alignment = { horizontal: "center", vertical: "middle" };
    dateCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1E3FF" } };
    sheet.getRow(2).height = 18;

    // ── Linha 3: Espaçador ───────────────────────────────────────────────────
    sheet.getRow(3).height = 6;

    // ── Linha 4: Cabeçalho do resumo ─────────────────────────────────────────
    sheet.mergeCells(4, 1, 4, TOTAL_COLS);
    const statsHeader = sheet.getCell(4, 1);
    statsHeader.value = "RESUMO DO EVENTO";
    statsHeader.font = { name: "Calibri", bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    statsHeader.alignment = { horizontal: "center", vertical: "middle" };
    statsHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
    sheet.getRow(4).height = 22;

    // ── Linhas 5-8: Dados do resumo ──────────────────────────────────────────
    const totalPeople = guestsToExport.reduce(
        (acc, g) => acc + 1 + (g.hasCompanion && g.companion ? 1 : 0), 0
    );
    const checkedPeople = guestsToExport.reduce((acc, g) => {
        if (!g.checkedIn) return acc;
        const cpCame = g.hasCompanion && g.companion && g.companionCheckedIn !== false;
        return acc + 1 + (cpCame ? 1 : 0);
    }, 0);

    const stats = [
        ["Total de Pessoas (com acompanhantes)", totalPeople],
        ["Total de Convidados cadastrados", guestsToExport.length],
        ["Check-in Realizado", checkedPeople],
        ["Aguardando Chegada", totalPeople - checkedPeople],
    ];

    stats.forEach(([label, value], i) => {
        const rowNum = 5 + i;
        sheet.getRow(rowNum).height = 20;

        sheet.mergeCells(rowNum, 1, rowNum, 9);
        const lCell = sheet.getCell(rowNum, 1);
        lCell.value = label;
        lCell.font = { name: "Calibri", size: 11 };
        lCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F6FF" } };
        lCell.alignment = { vertical: "middle", indent: 1 };
        lCell.border = { bottom: { style: "thin", color: { argb: "FFCBD5E1" } } };

        sheet.mergeCells(rowNum, 10, rowNum, TOTAL_COLS);
        const vCell = sheet.getCell(rowNum, 10);
        vCell.value = value;
        vCell.font = { name: "Calibri", bold: true, size: 14, color: { argb: "FF1D4ED8" } };
        vCell.alignment = { horizontal: "center", vertical: "middle" };
        vCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F6FF" } };
        vCell.border = { bottom: { style: "thin", color: { argb: "FFCBD5E1" } } };
    });

    // ── Linha 9: Espaçador ───────────────────────────────────────────────────
    sheet.getRow(9).height = 6;

    // ── Linha 10: Cabeçalhos das colunas ─────────────────────────────────────
    const HEADER_LABELS = [
        "#", "Nome Completo", "Cargo", "Tipo", "Documento", "Empresa",
        "WhatsApp", "Acompanhante", "CPF Acompanhante", "WhatsApp Acomp.",
        "Status", "Check-in em", "Confirmado em",
    ];

    const headerRow = sheet.getRow(10);
    headerRow.height = 26;
    HEADER_LABELS.forEach((label, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = label;
        cell.font = { name: "Calibri", bold: true, size: 11, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
            top: { style: "thin", color: { argb: "FF1E40AF" } },
            bottom: { style: "medium", color: { argb: "FF1E40AF" } },
            left: { style: "thin", color: { argb: "FF1E40AF" } },
            right: { style: "thin", color: { argb: "FF1E40AF" } },
        };
    });

    // ── Linhas de dados ───────────────────────────────────────────────────────
    guestsToExport.forEach((guest, i) => {
        const isChecked = !!guest.checkedIn;
        const hasCp = !!(guest.hasCompanion && guest.companion);
        const docValue = guest.personType === "PF" ? formatCpf(guest.cpf) : formatCnpj(guest.cnpj);
        const bgColor = isChecked ? "FFECFDF5" : "FFFEFCE8";
        const statusColor = isChecked ? "FF166534" : "FFB45309";
        const statusText = isChecked ? "Chegou" : "Aguardando";

        const dataRow = sheet.addRow({
            num: i + 1,
            name: guest.fullName || "-",
            cargo: CARGO_META[guest.cargo]?.label || "Convidado",
            type: guest.personType || "-",
            document: docValue,
            company: guest.personType === "PJ" ? (guest.companyName || "-") : "",
            phone: formatPhone(guest.phone),
            companion: hasCp ? (guest.companion.fullName || "Acompanhante") : "-",
            companionCpf: hasCp ? formatCpf(guest.companion.cpf) : "-",
            companionPhone: hasCp ? formatPhone(guest.companion.phone) : "-",
            status: statusText,
            checkinAt: guest.checkedInAt ? formatDateTime(guest.checkedInAt) : "-",
            confirmedAt: guest.createdAt ? formatDateTime(guest.createdAt) : "-",
        });

        dataRow.height = 18;
        dataRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
            cell.font = { name: "Calibri", size: 10 };
            cell.alignment = { vertical: "middle" };
            cell.border = {
                bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
                right: { style: "thin", color: { argb: "FFE5E7EB" } },
            };
            if ([1, 4, 11, 12, 13].includes(colNum)) {
                cell.alignment = { horizontal: "center", vertical: "middle" };
            }
            if (colNum === 11) {
                cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: statusColor } };
            }
        });
    });

    // ── Gerar e baixar o arquivo ──────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const exportDate = new Date().toISOString().slice(0, 10);
    anchor.download = mode === "authorities"
        ? `autoridades_acia65_${exportDate}.xlsx`
        : `convidados_acia65_${exportDate}.xlsx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    setFeedback(mode === "authorities"
        ? "Planilha de autoridades exportada com sucesso!"
        : "Planilha exportada com sucesso!");
    setTimeout(() => setFeedback(""), 3000);
}


function setupInteractions() {
    searchInput.addEventListener("input", applyFilterAndRender);
    exportButton.addEventListener("click", openExportOptionsDialog);

    exportAllButton.addEventListener("click", async () => {
        closeExportOptionsDialog();
        await exportXlsx("all");
    });

    exportAuthoritiesButton.addEventListener("click", async () => {
        closeExportOptionsDialog();
        await exportXlsx("authorities");
    });

    exportOptionsCancelButton.addEventListener("click", closeExportOptionsDialog);

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

        if (action === "edit") {
            const guest = getGuestById(guestId);
            if (guest) {
                openEditDialog(guest);
            }
            return;
        }

        const currentChecked = button.dataset.checked === "1";
        const hasCompanion = button.dataset.hasCompanion === "1";

        const card = button.closest(".guest-card");
        const guestName = card ? card.querySelector(".guest-name")?.textContent.trim() : "este convidado";
        openCheckinDialog(guestId, currentChecked, guestName || "este convidado", hasCompanion);
    });

    checkinDialogConfirm.addEventListener("click", async () => {
        if (!pendingCheckin) {
            return;
        }

        const { guestId, currentChecked } = pendingCheckin;
        closeCheckinDialog();
        await toggleCheckIn(guestId, currentChecked, true);
    });

    checkinDialogWithoutCompanion.addEventListener("click", async () => {
        if (!pendingCheckin) {
            return;
        }

        const { guestId, currentChecked } = pendingCheckin;
        closeCheckinDialog();
        await toggleCheckIn(guestId, currentChecked, false);
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

    editGuestDialogClose.addEventListener("click", closeEditDialog);
    editGuestCancel.addEventListener("click", closeEditDialog);
    editGuestForm.addEventListener("submit", handleEditSubmit);

    editPersonType.addEventListener("change", () => {
        toggleEditDocumentFields();
        setEditFeedback("");
    });

    editHasCompanion.addEventListener("change", () => {
        toggleEditCompanionFields();
        setEditFeedback("");
    });

    editCpf.addEventListener("input", () => {
        editCpf.value = maskCpf(editCpf.value);
    });

    editCnpj.addEventListener("input", () => {
        editCnpj.value = maskCnpj(editCnpj.value);
    });

    editPhone.addEventListener("input", () => {
        editPhone.value = maskPhone(editPhone.value);
    });

    editCompanionCpf.addEventListener("input", () => {
        editCompanionCpf.value = maskCpf(editCompanionCpf.value);
    });

    editCompanionPhone.addEventListener("input", () => {
        editCompanionPhone.value = maskPhone(editCompanionPhone.value);
    });

    cargoStatsGrid.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const button = target.closest("button[data-action='view-cargo'][data-cargo]");
        if (!button) {
            return;
        }

        const cargoKey = button.dataset.cargo;
        if (!cargoKey) {
            return;
        }

        openCargoGuestsDialog(cargoKey);
    });

    cargoGuestsDialogClose.addEventListener("click", closeCargoGuestsDialog);
    cargoGuestsDialogOk.addEventListener("click", closeCargoGuestsDialog);
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
