import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    limit,
    query,
    serverTimestamp,
    where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD_PzTMUhtk0dGh2X06dufw_NMAesMAZUE",
    authDomain: "convite65anos.firebaseapp.com",
    projectId: "convite65anos",
    storageBucket: "convite65anos.firebasestorage.app",
    messagingSenderId: "66072908061",
    appId: "1:66072908061:web:094debb8cf0340268891f4",
    measurementId: "G-86GT9VL0Y3"
};

const form = document.getElementById("inviteForm");
const fullNameGroup = document.getElementById("fullNameGroup");
const fullName = document.getElementById("fullName");
const personType = document.getElementById("personType");
const cpf = document.getElementById("cpf");
const cnpj = document.getElementById("cnpj");
const companyName = document.getElementById("companyName");
const phone = document.getElementById("phone");
const hasCompanion = document.getElementById("hasCompanion");
const companionSection = document.getElementById("companionSection");
const companionFullName = document.getElementById("companionFullName");
const companionPhone = document.getElementById("companionPhone");
const companionCpf = document.getElementById("companionCpf");
const companionEmail = document.getElementById("companionEmail");
const cpfGroup = document.getElementById("cpfGroup");
const cnpjGroup = document.getElementById("cnpjGroup");
const companyNameGroup = document.getElementById("companyNameGroup");
const personTypeGroup = document.getElementById("personTypeGroup");
const phoneGroup = document.getElementById("phoneGroup");
const emailGroup = document.getElementById("emailGroup");
const email = document.getElementById("email");
const hasCompanionGroup = document.getElementById("hasCompanionGroup");
const termsSection = document.getElementById("termsSection");
const feedback = document.getElementById("formFeedback");
const submitButton = document.getElementById("submitButton");
const termsDialog = document.getElementById("termsDialog");
const successDialog = document.getElementById("successDialog");
const duplicateDialog = document.getElementById("duplicateDialog");
const openTermsButton = document.getElementById("openTermsButton");
const closeTermsButton = document.getElementById("closeTermsButton");
const agreeTermsButton = document.getElementById("agreeTermsButton");
const closeSuccessButton = document.getElementById("closeSuccessButton");
const closeDuplicateButton = document.getElementById("closeDuplicateButton");
const successMessage = document.getElementById("successMessage");
const duplicateMessage = document.getElementById("duplicateMessage");
const termsAccepted = document.getElementById("termsAccepted");
const termsStatus = document.getElementById("termsStatus");

const hasFirebaseConfig = Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && !value.startsWith("COLOQUE_")
);

let db = null;
let previousPersonType = "";
let isFormBlocked = false;
let blockMessage = "O tempo de confirmação acabou :( A confirmação de presença foi encerrada. Caso tenha alguma dúvida, entre em contato com: 19 99246-2193";

// Configurações padrões
const DEFAULT_CONFIG = {
    eventTitle: "Celebração dos 65 anos da ACIA",
    eventDate: "2026-03-26",
    eventTime: "19:00",
    eventLocation: "Villa Americana",
    eventMapsUrl: "https://www.google.com/maps/place/Villa+Americana+Eventos/@-22.7390903,-47.3291581,18z/data=!4m10!1m2!2m1!1sVilla+Americana+Americana+SP!3m6!1s0x94c89a4c64890eef:0xf745d6a03ce059ed!8m2!3d-22.739139!4d-47.3269233!15sChxWaWxsYSBBbWVyaWNhbmEgQW1lcmljYW5hIFNQWh4iHHZpbGxhIGFtZXJpY2FuYSBhbWVyaWNhbmEgc3CSAQtldmVudF92ZW51ZZoBI0NoWkRTVWhOTUc5blMwVkpRMEZuU1VOUU5XWlVSMWgzRUFF4AEA-gEECAAQHg!16s%2Fg%2F11b6f03vjh?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D",
    headerImageUrl: "img/LOGO-ACIA_65_PRINCIPAL.png",
    blockDate: "2026-03-20",
    blockTime: "12:00",
    blockMessage: "O tempo de confirmação acabou :(\nA confirmação de presença foi encerrada.\n\nCaso tenha alguma dúvida, entre em contato com: 19 99246-2193",
    supportPhone: "19 99246-2193",
    successMessage: "Sua participação foi registrada. Vai ser uma noite inesquecível para celebrar essa história com a ACIA.",
    termsText: "Ao participar deste jantar, você confirma que as informações enviadas são verdadeiras, autoriza o uso dos dados exclusivamente para organização e contato sobre este evento, e se compromete a manter uma conduta respeitosa com todos os convidados e equipe organizadora.\n\nSe necessário, poderemos entrar em contato para ajustar detalhes logísticos. Seus dados não serão comercializados e serão tratados com confidencialidade.",
};

if (hasFirebaseConfig) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
}

async function loadPageConfig() {
    if (!db) {
        return DEFAULT_CONFIG;
    }

    try {
        const configDoc = await getDoc(doc(db, "config", "sistema"));
        if (configDoc.exists()) {
            return { ...DEFAULT_CONFIG, ...configDoc.data() };
        }
    } catch (error) {
        console.error("Erro ao carregar configurações:", error);
    }

    return DEFAULT_CONFIG;
}

async function updatePageConfig() {
    const config = await loadPageConfig();

    // Atualizar header
    const header = document.querySelector(".card-header");
    if (header) {
        const h1 = header.querySelector("h1");
        const subtitle = header.querySelector(".subtitle");
        const mapLink = header.querySelector(".map-link");
        const brandLogo = header.querySelector(".brand-logo");

        if (h1) h1.textContent = config.eventTitle;
        const [year, month, day] = config.eventDate.split("-");
        const formattedDate = new Date(+year, +month - 1, +day).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
        if (subtitle) subtitle.innerHTML = `${formattedDate}<br>às ${config.eventTime}<br>Local: ${config.eventLocation}`;
        if (mapLink) mapLink.href = config.eventMapsUrl;
        if (brandLogo && config.headerImageUrl) brandLogo.src = config.headerImageUrl;
    }

    // Atualizar dialog de termos
    const termsDialog = document.querySelector("#termsDialog article");
    if (termsDialog) {
        const p = termsDialog.querySelector("p:nth-of-type(1)");
        if (p) p.textContent = config.termsText;
    }

    blockMessage = config.blockMessage || DEFAULT_CONFIG.blockMessage;
    successMessage.textContent = config.successMessage || DEFAULT_CONFIG.successMessage;
}

async function checkFormBlockStatus() {
    if (!db) {
        return false;
    }

    try {
        const configDoc = await getDoc(doc(db, "config", "sistema"));
        if (configDoc.exists()) {
            const config = configDoc.data();
            const blockDate = config.blockDate;
            const blockTime = config.blockTime;

            if (blockDate && blockTime) {
                const now = new Date();
                const blockDateTime = new Date(blockDate + "T" + blockTime);
                return now > blockDateTime;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar configurações:", error);
    }

    return false;
}

function displayBlockMessage() {
    form.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <h2 style="color: #c0392b; font-size: 1.5em; margin-bottom: 20px;">Confirmação Encerrada</h2>
            <p style="font-size: 1.1em; line-height: 1.6; color: #555; margin-bottom: 20px;">
                ${blockMessage.replace(/\n/g, '<br>')}
            </p>
        </div>
    `;
}

function onlyDigits(value) {
    return value.replace(/\D/g, "");
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

    const calcDigit = (base, factors) => {
        const total = base
            .split("")
            .reduce((acc, num, index) => acc + Number(num) * factors[index], 0);
        const rest = total % 11;
        return rest < 2 ? 0 : 11 - rest;
    };

    const base = digits.slice(0, 12);
    const firstFactor = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const secondFactor = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const firstDigit = calcDigit(base, firstFactor);
    const secondDigit = calcDigit(base + firstDigit, secondFactor);

    return digits === `${base}${firstDigit}${secondDigit}`;
}

function isValidPhone(value) {
    const digits = onlyDigits(value);
    if (digits.length !== 11) {
        return false;
    }

    return digits[2] === "9";
}

function isValidFullName(value) {
    const parts = value
        .trim()
        .split(/\s+/)
        .filter((item) => item.length > 1);
    return parts.length >= 2;
}

function isValidCompanyName(value) {
    return value.trim().length >= 2;
}

function isValidEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
}

function generateSecureToken() {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex;
}

async function generateQrCodeForEmail(token) {
    const qrCodeUrl = `https://convite65anos.web.app/verify?token=${token}`;
    try {
        const QRCodeLib = await loadQRCodeLib();
        const qr = await QRCodeLib.toDataURL(qrCodeUrl, {
            width: 250,
            margin: 2,
            errorCorrectionLevel: 'M'
        });
        return qr;
    } catch (err) {
        console.error('Erro ao gerar QR code:', err);
        return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCodeUrl)}`;
    }
}

async function loadQRCodeLib(attempts = 0) {
    if (window.QRCode) return window.QRCode;
    if (attempts >= 3) {
        const fallbackSrc = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = fallbackSrc;
            script.onload = () => {
                const QRCodeLib = window.QRCode;
                window.QRCode = {
                    toDataURL: (text, opts) => {
                        return new Promise((resolve) => {
                            const canvas = document.createElement('canvas');
                            new QRCodeLib(canvas, { text, width: opts?.width || 250, margin: opts?.margin || 2 });
                            setTimeout(() => resolve(canvas.toDataURL('image/png')), 100);
                        });
                    },
                    toCanvas: (canvas, text, opts) => {
                        return new Promise((res) => {
                            new QRCodeLib(canvas, { text, width: opts?.width || 250, margin: opts?.margin || 2 });
                            setTimeout(res, 100);
                        });
                    }
                };
                resolve(window.QRCode);
            };
            script.onerror = () => reject(new Error('Falha ao carregar biblioteca QRCode'));
            document.head.appendChild(script);
        });
    }
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        script.onload = () => resolve(window.QRCode);
        script.onerror = () => {
            setTimeout(() => loadQRCodeLib(attempts + 1).then(resolve).catch(reject), 1000);
        };
        document.head.appendChild(script);
    });
}

async function sendEmailWithQRCode(email, guestName, token, qrCodeDataUrl, templateId = 'template_jn73jw2', extraParams = {}) {
    const emailData = {
        service_id: 'service_5wcz9it',
        template_id: templateId,
        user_id: 'kwKfo15VlYsFRuVhA',
        template_params: {
            to_email: email,
            to_name: guestName,
            qr_code_url: qrCodeDataUrl,
            ...extraParams
        }
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erro desconhecido');
        throw new Error(`EmailJS retornou erro ${response.status}: ${errorText}`);
    }
}

function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function hasSameCompanionDataAsMain() {
    if (hasCompanion.value !== "sim") {
        return false;
    }

    const sameName = normalizeText(companionFullName.value) === normalizeText(fullName.value);
    const samePhone = onlyDigits(companionPhone.value) === onlyDigits(phone.value);
    const sameCpf = personType.value === "PF" && onlyDigits(companionCpf.value) === onlyDigits(cpf.value);

    return sameName || samePhone || sameCpf;
}

function clearInputErrors() {
    const fields = form.querySelectorAll("input, select, button");
    fields.forEach((field) => field.classList.remove("input-error"));
    fields.forEach((field) => field.removeAttribute("aria-invalid"));

    const messages = form.querySelectorAll(".field-error");
    messages.forEach((message) => message.remove());
}

function getFieldErrorContainer(field) {
    if (field === openTermsButton) {
        return termsSection;
    }

    return field.closest(".field-group") || field.closest("fieldset") || field.parentElement;
}

function setFieldError(field, message) {
    const container = getFieldErrorContainer(field);
    if (!container) {
        return;
    }

    const key = field.id || field.name || "generic";
    const errorId = `error-${key}`;
    let errorElement = container.querySelector(`#${errorId}`);

    if (!errorElement) {
        const error = document.createElement("p");
        error.id = errorId;
        error.className = "field-error";
        error.textContent = message;
        container.appendChild(error);
    } else {
        errorElement.textContent = message;
    }

    field.classList.add("input-error");
    field.setAttribute("aria-invalid", "true");
}

function setFeedback(message, type) {
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showElement(element) {
    if (!element.classList.contains("hidden") && element.classList.contains("revealed")) {
        return;
    }

    element.classList.remove("hidden");
    element.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
        element.classList.add("revealed");
    });
}

function hideElement(element) {
    if (element.classList.contains("hidden")) {
        return;
    }

    element.classList.add("hidden");
    element.classList.remove("revealed");
    element.setAttribute("aria-hidden", "true");
}

function showSubmitButton(visible) {
    if (visible) {
        showElement(submitButton);
        return;
    }

    hideElement(submitButton);
}

function togglePersonDocumentFields() {
    const selected = personType.value;
    const personTypeChanged = selected !== previousPersonType;

    cpf.required = false;
    cnpj.required = false;
    companyName.required = false;

    if (selected === "PF") {
        showElement(cpfGroup);
        hideElement(cnpjGroup);
        hideElement(companyNameGroup);
        cpf.required = true;
        if (personTypeChanged) {
            cnpj.value = "";
            companyName.value = "";
        }
    }

    if (selected === "PJ") {
        showElement(cnpjGroup);
        hideElement(cpfGroup);
        showElement(companyNameGroup);
        cnpj.required = true;
        companyName.required = true;
        if (personTypeChanged) {
            cpf.value = "";
        }
    }

    if (!selected) {
        hideElement(cpfGroup);
        hideElement(cnpjGroup);
        hideElement(companyNameGroup);
        if (personTypeChanged) {
            cpf.value = "";
            cnpj.value = "";
            companyName.value = "";
        }
    }

    previousPersonType = selected;
}

function toggleCompanionFields() {
    const shouldShow = hasCompanion.value === "sim";

    if (shouldShow) {
        showElement(companionSection);
    } else {
        hideElement(companionSection);
        clearFieldError(companionFullName);
        clearFieldError(companionPhone);
        clearFieldError(companionCpf);
        clearFieldError(companionEmail);
    }

    companionFullName.required = shouldShow;
    companionPhone.required = shouldShow;
    companionCpf.required = shouldShow;
    companionEmail.required = shouldShow;

    if (!shouldShow) {
        companionFullName.value = "";
        companionPhone.value = "";
        companionCpf.value = "";
        companionEmail.value = "";
    }
}

function validateForm() {
    clearInputErrors();
    const invalidFields = [];

    if (!isValidFullName(fullName.value)) {
        invalidFields.push({ field: fullName, message: "Informe nome e sobrenome." });
    }

    if (personType.value === "PF" && !isValidCpf(cpf.value)) {
        invalidFields.push({ field: cpf, message: "CPF inválido." });
    }

    if (personType.value === "PJ" && !isValidCnpj(cnpj.value)) {
        invalidFields.push({ field: cnpj, message: "CNPJ inválido." });
    }

    if (personType.value === "PJ" && !isValidCompanyName(companyName.value)) {
        invalidFields.push({ field: companyName, message: "Informe o nome da empresa." });
    }

    if (!isValidPhone(phone.value)) {
        invalidFields.push({
            field: phone,
            message: "Celular inválido. Use um número com DDD e 9 dígitos.",
        });
    }

    if (!isValidEmail(email.value)) {
        invalidFields.push({
            field: email,
            message: "Informe um e-mail válido.",
        });
    }

    if (!personType.value) {
        invalidFields.push({ field: personType, message: "Selecione PF ou PJ." });
    }

    if (!hasCompanion.value) {
        invalidFields.push({
            field: hasCompanion,
            message: "Informe se terá acompanhante.",
        });
    }

    if (hasCompanion.value === "sim") {
        if (!isValidFullName(companionFullName.value)) {
            invalidFields.push({
                field: companionFullName,
                message: "Informe nome e sobrenome do acompanhante.",
            });
        }

        if (!isValidPhone(companionPhone.value)) {
            invalidFields.push({
                field: companionPhone,
                message: "Celular do acompanhante inválido.",
            });
        }

        if (!isValidCpf(companionCpf.value)) {
            invalidFields.push({
                field: companionCpf,
                message: "CPF do acompanhante inválido.",
            });
        }

        if (normalizeText(companionFullName.value) === normalizeText(fullName.value)) {
            invalidFields.push({
                field: companionFullName,
                message: "Nome do acompanhante não pode ser igual ao nome principal.",
            });
        }

        if (onlyDigits(companionPhone.value) === onlyDigits(phone.value)) {
            invalidFields.push({
                field: companionPhone,
                message: "Celular do acompanhante não pode ser igual ao celular principal.",
            });
        }

        if (personType.value === "PF" && onlyDigits(companionCpf.value) === onlyDigits(cpf.value)) {
            invalidFields.push({
                field: companionCpf,
                message: "CPF do acompanhante não pode ser igual ao CPF principal.",
            });
        }

        if (!isValidEmail(companionEmail.value)) {
            invalidFields.push({
                field: companionEmail,
                message: "E-mail do acompanhante inválido.",
            });
        }
    }

    if (termsAccepted.value !== "true") {
        invalidFields.push({
            field: openTermsButton,
            message: "Você precisa aceitar os termos antes de confirmar.",
        });
    }

    if (invalidFields.length > 0) {
        invalidFields.forEach(({ field, message }) => {
            setFieldError(field, message);
        });

        invalidFields[0].field.focus();
        setFeedback("Revise os campos destacados e corrija os dados.", "error");
        return false;
    }

    return true;
}

function clearFieldError(field) {
    field.classList.remove("input-error");
    field.removeAttribute("aria-invalid");
    const key = field.id || field.name || "generic";
    const errorId = `error-${key}`;
    const errorElement = document.querySelector(`#${errorId}`);
    if (errorElement) {
        errorElement.remove();
    }
}

function validateFieldRealtime(field) {
    if (field === fullName) {
        if (isValidFullName(field.value)) {
            clearFieldError(field);
        } else if (field.value.trim().length > 0) {
            setFieldError(field, "Informe nome e sobrenome.");
        } else {
            clearFieldError(field);
        }
        if (hasCompanion.value === "sim") {
            validateFieldRealtime(companionFullName);
        }
    } else if (field === cpf) {
        if (isValidCpf(field.value)) {
            clearFieldError(field);
            if (hasCompanion.value === "sim") {
                validateFieldRealtime(companionCpf);
            }
        } else if (onlyDigits(field.value).length > 0) {
            setFieldError(field, "CPF inválido.");
        } else {
            clearFieldError(field);
        }
    } else if (field === cnpj) {
        if (isValidCnpj(field.value)) {
            clearFieldError(field);
        } else if (onlyDigits(field.value).length > 0) {
            setFieldError(field, "CNPJ inválido.");
        } else {
            clearFieldError(field);
        }
    } else if (field === companyName) {
        if (isValidCompanyName(field.value)) {
            clearFieldError(field);
        } else if (field.value.trim().length > 0) {
            setFieldError(field, "Informe o nome da empresa.");
        } else {
            clearFieldError(field);
        }
    } else if (field === email) {
        if (isValidEmail(field.value)) {
            clearFieldError(field);
        } else if (field.value.trim().length > 0) {
            setFieldError(field, "E-mail inválido.");
        } else {
            clearFieldError(field);
        }
    } else if (field === phone) {
        if (isValidPhone(field.value)) {
            clearFieldError(field);
            validateCompanionPhone();
        } else if (onlyDigits(field.value).length > 0) {
            setFieldError(field, "Celular inválido. Use um número com DDD e 9 dígitos.");
        } else {
            clearFieldError(field);
        }
    } else if (field === companionFullName) {
        if (companionFullName.value.trim().length === 0) {
            clearFieldError(field);
        } else {
            if (!isValidFullName(field.value)) {
                setFieldError(field, "Informe nome e sobrenome do acompanhante.");
            } else if (normalizeText(field.value) === normalizeText(fullName.value)) {
                setFieldError(field, "Nome do acompanhante não pode ser igual ao nome principal.");
            } else {
                clearFieldError(field);
            }
        }
    } else if (field === companionPhone) {
        validateCompanionPhone();
    } else if (field === companionCpf) {
        if (companionCpf.value.trim().length === 0) {
            clearFieldError(field);
        } else {
            if (!isValidCpf(field.value)) {
                setFieldError(field, "CPF do acompanhante inválido.");
            } else if (personType.value === "PF" && onlyDigits(field.value) === onlyDigits(cpf.value)) {
                setFieldError(field, "CPF do acompanhante não pode ser igual ao CPF principal.");
            } else {
                clearFieldError(field);
            }
        }
    }
}

function validateCompanionPhone() {
    if (hasCompanion.value !== "sim") {
        clearFieldError(companionPhone);
        return;
    }

    if (companionPhone.value.trim().length === 0) {
        clearFieldError(companionPhone);
    } else {
        if (!isValidPhone(companionPhone.value)) {
            setFieldError(companionPhone, "Celular do acompanhante inválido.");
        } else if (onlyDigits(companionPhone.value) === onlyDigits(phone.value)) {
            setFieldError(companionPhone, "Celular do acompanhante não pode ser igual ao celular principal.");
        } else {
            clearFieldError(companionPhone);
        }
    }
}

function setupInputMasks() {
    cpf.addEventListener("input", () => {
        cpf.value = formatCpf(cpf.value);
        validateFieldRealtime(cpf);
    });

    cpf.addEventListener("blur", () => {
        validateFieldRealtime(cpf);
    });

    cnpj.addEventListener("input", () => {
        cnpj.value = formatCnpj(cnpj.value);
        validateFieldRealtime(cnpj);
    });

    cnpj.addEventListener("blur", () => {
        validateFieldRealtime(cnpj);
    });

    phone.addEventListener("input", () => {
        phone.value = formatPhone(phone.value);
        validateFieldRealtime(phone);
    });

    phone.addEventListener("blur", () => {
        validateFieldRealtime(phone);
    });

    companionCpf.addEventListener("input", () => {
        companionCpf.value = formatCpf(companionCpf.value);
        validateFieldRealtime(companionCpf);
    });

    companionCpf.addEventListener("blur", () => {
        validateFieldRealtime(companionCpf);
    });

    companionPhone.addEventListener("input", () => {
        companionPhone.value = formatPhone(companionPhone.value);
        validateFieldRealtime(companionPhone);
    });

    companionPhone.addEventListener("blur", () => {
        validateFieldRealtime(companionPhone);
    });

    fullName.addEventListener("blur", () => {
        validateFieldRealtime(fullName);
        if (hasCompanion.value === "sim") {
            validateFieldRealtime(companionFullName);
        }
    });

    companyName.addEventListener("blur", () => {
        validateFieldRealtime(companyName);
    });

    companionFullName.addEventListener("blur", () => {
        validateFieldRealtime(companionFullName);
    });
}

function setupTermsDialog() {
    openTermsButton.addEventListener("click", () => {
        if (typeof termsDialog.showModal === "function") {
            termsDialog.showModal();
            return;
        }

        termsDialog.setAttribute("open", "true");
    });

    closeTermsButton.addEventListener("click", () => {
        if (typeof termsDialog.close === "function") {
            termsDialog.close();
            return;
        }

        termsDialog.removeAttribute("open");
    });

    agreeTermsButton.addEventListener("click", () => {
        termsAccepted.value = "true";
        termsStatus.textContent = "Termos aceitos.";
        termsStatus.classList.add("agreed");
        if (typeof termsDialog.close === "function") {
            termsDialog.close();
        } else {
            termsDialog.removeAttribute("open");
        }
        setFeedback("", "");
        updateProgressiveFlow();
    });
}

function setupSuccessDialog() {
    closeSuccessButton.addEventListener("click", () => {
        if (typeof successDialog.close === "function") {
            successDialog.close();
            return;
        }

        successDialog.removeAttribute("open");
    });
}

function setupDuplicateDialog() {
    closeDuplicateButton.addEventListener("click", () => {
        if (typeof duplicateDialog.close === "function") {
            duplicateDialog.close();
            return;
        }

        duplicateDialog.removeAttribute("open");
    });
}

function openSuccessDialog(guestName, hasCompanionSelected) {
    const firstName = guestName.trim().split(/\s+/)[0] || "Convidado";
    const highlightedName = `<span class="guest-highlight">${escapeHtml(firstName)}</span>`;

    if (hasCompanionSelected) {
        successMessage.innerHTML = `${highlightedName}, sua presença e a dos seus convidados foi confirmada. Um QR Code foi enviado para o seu e-mail. Apresente-o na recepção para acesso ao evento.`;
    } else {
        successMessage.innerHTML = `${highlightedName}, sua presença foi confirmada. Um QR Code foi enviado para o seu e-mail. Apresente-o na recepção para acesso ao evento.`;
    }

    if (typeof successDialog.showModal === "function") {
        successDialog.showModal();
        return;
    }

    successDialog.setAttribute("open", "true");
}

function openDuplicateDialog(documentType) {
    duplicateMessage.textContent = `Ja existe uma confirmacao para este ${documentType}. Nao e necessario confirmar novamente.`;

    if (typeof duplicateDialog.showModal === "function") {
        duplicateDialog.showModal();
        return;
    }

    duplicateDialog.setAttribute("open", "true");
}

function updateProgressiveFlow() {
    showElement(fullNameGroup);

    const fullNameDone = isValidFullName(fullName.value);
    const personTypeDone = personType.value === "PF" || personType.value === "PJ";
    const documentDone =
        (personType.value === "PF" && isValidCpf(cpf.value)) ||
        (personType.value === "PJ" && isValidCnpj(cnpj.value));
    const companyDone = personType.value !== "PJ" || isValidCompanyName(companyName.value);
    const phoneDone = isValidPhone(phone.value);
    const emailDone = isValidEmail(email.value);
    const companionChoiceDone = hasCompanion.value === "sim" || hasCompanion.value === "nao";
    const companionDone =
        hasCompanion.value === "nao" ||
        (hasCompanion.value === "sim" &&
            isValidFullName(companionFullName.value) &&
            isValidPhone(companionPhone.value) &&
            isValidCpf(companionCpf.value) &&
            !hasSameCompanionDataAsMain());

    if (fullNameDone) {
        showElement(personTypeGroup);
    } else {
        hideElement(personTypeGroup);
    }

    if (personTypeDone) {
        togglePersonDocumentFields();
    } else {
        hideElement(cpfGroup);
        hideElement(cnpjGroup);
    }

    if (documentDone && companyDone) {
        showElement(phoneGroup);
    } else {
        hideElement(phoneGroup);
    }

    if (phoneDone) {
        showElement(emailGroup);
    } else {
        hideElement(emailGroup);
    }

    if (emailDone) {
        showElement(hasCompanionGroup);
    } else {
        hideElement(hasCompanionGroup);
        hideElement(companionSection);
    }

    if (companionChoiceDone) {
        toggleCompanionFields();
    } else {
        hideElement(companionSection);
    }

    if (companionChoiceDone && companionDone) {
        showElement(termsSection);
    } else {
        hideElement(termsSection);
        termsAccepted.value = "false";
        termsStatus.textContent = "Termos ainda não aceitos.";
        termsStatus.classList.remove("agreed");
    }

    showSubmitButton(companionChoiceDone && companionDone);
}

async function handleSubmit(event) {
    event.preventDefault();
    setFeedback("", "");

    if (!validateForm()) {
        return;
    }

    if (!db) {
        setFeedback(
            "Configure o Firebase em app.js antes de enviar os dados.",
            "error"
        );
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";

    const primaryDocument =
        personType.value === "PF" ? onlyDigits(cpf.value) : onlyDigits(cnpj.value);

    const duplicateQuery =
        personType.value === "PF"
            ? query(
                collection(db, "confirmacoes_jantar"),
                where("personType", "==", "PF"),
                where("cpf", "==", primaryDocument),
                limit(1)
            )
            : query(
                collection(db, "confirmacoes_jantar"),
                where("personType", "==", "PJ"),
                where("cnpj", "==", primaryDocument),
                limit(1)
            );

    try {
        const duplicateSnapshot = await getDocs(duplicateQuery);
        if (!duplicateSnapshot.empty) {
            openDuplicateDialog(personType.value === "PF" ? "CPF" : "CNPJ");
            setFeedback("", "");
            if (personType.value === "PF") {
                cpf.focus();
            } else {
                cnpj.focus();
            }
            return;
        }

        const guestToken = generateSecureToken();
        
        const payload = {
            fullName: fullName.value.trim(),
            personType: personType.value,
            cpf: personType.value === "PF" ? onlyDigits(cpf.value) : null,
            cnpj: personType.value === "PJ" ? onlyDigits(cnpj.value) : null,
            companyName: personType.value === "PJ" ? companyName.value.trim() : null,
            documentNumber: primaryDocument,
            phone: onlyDigits(phone.value),
            email: email.value.trim().toLowerCase(),
            qrCodeToken: guestToken,
            qrCodeUsed: false,
            qrCodeUsedAt: null,
            hasCompanion: hasCompanion.value === "sim",
            companion:
                hasCompanion.value === "sim"
                    ? {
                        fullName: companionFullName.value.trim(),
                        phone: onlyDigits(companionPhone.value),
                        cpf: onlyDigits(companionCpf.value),
                        email: companionEmail.value.trim().toLowerCase(),
                        qrCodeToken: generateSecureToken(),
                        qrCodeUsed: false,
                        qrCodeUsedAt: null,
                    }
                    : null,
            acceptedTerms: true,
            acceptedTermsAt: new Date().toISOString(),
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "confirmacoes_jantar"), payload);

        const savedFullName = fullName.value;
        const savedHasCompanion = hasCompanion.value === "sim";

        setFeedback("Confirmação enviada com sucesso.", "success");
        openSuccessDialog(savedFullName, savedHasCompanion);
        form.reset();
        termsAccepted.value = "false";
        termsStatus.textContent = "Termos ainda não aceitos.";
        termsStatus.classList.remove("agreed");
        togglePersonDocumentFields();
        toggleCompanionFields();
        updateProgressiveFlow();

        // Envia email em background (não bloqueia a tela de sucesso)
        try {
            // QR Code para o titular
            const qrCodeDataUrl = await generateQrCodeForEmail(guestToken);
            
            // Envia email para o titular
            await sendEmailWithQRCode(payload.email, payload.fullName, guestToken, qrCodeDataUrl);
            console.log('E-mail com QR Code enviado com sucesso para:', payload.email);

            // Envia email para o acompanhante - QR Code DIFERENTE
            if (payload.hasCompanion && payload.companion && payload.companion.email) {
                const companionQrCodeDataUrl = await generateQrCodeForEmail(payload.companion.qrCodeToken);
                await sendEmailWithQRCode(
                    payload.companion.email, 
                    payload.companion.fullName, 
                    payload.companion.qrCodeToken, 
                    companionQrCodeDataUrl,
                    'template_vb8gv09',  // Template específico para acompanhante
                    { nome_titular: payload.fullName }  // Variável extra para o template
                );
                console.log('E-mail com QR Code enviado com sucesso para o acompanhante:', payload.companion.email);
            }
        } catch (emailError) {
            console.error('Erro ao enviar e-mail com QR Code:', emailError);
        }
    } catch (error) {
        setFeedback("Não foi possível salvar no Firebase. Tente novamente.", "error");
        console.error(error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Confirmar";
    }
}

setupInputMasks();
setupTermsDialog();
setupSuccessDialog();
setupDuplicateDialog();
updateProgressiveFlow();

fullName.addEventListener("input", () => {
    updateProgressiveFlow();
    validateFieldRealtime(fullName);
});

fullName.addEventListener("blur", () => {
    validateFieldRealtime(fullName);
});

personType.addEventListener("change", updateProgressiveFlow);

cpf.addEventListener("input", updateProgressiveFlow);
cpf.addEventListener("blur", () => {
    validateFieldRealtime(cpf);
});

cnpj.addEventListener("input", updateProgressiveFlow);
cnpj.addEventListener("blur", () => {
    validateFieldRealtime(cnpj);
});

companyName.addEventListener("input", updateProgressiveFlow);

phone.addEventListener("input", updateProgressiveFlow);
phone.addEventListener("blur", () => {
    validateFieldRealtime(phone);
});

email.addEventListener("input", updateProgressiveFlow);
email.addEventListener("blur", () => {
    validateFieldRealtime(email);
});

hasCompanion.addEventListener("change", () => {
    updateProgressiveFlow();
    toggleCompanionFields();
});

companionFullName.addEventListener("input", updateProgressiveFlow);
companionFullName.addEventListener("blur", () => {
    validateFieldRealtime(companionFullName);
});

companionPhone.addEventListener("input", updateProgressiveFlow);
companionPhone.addEventListener("blur", () => {
    validateFieldRealtime(companionPhone);
});

companionCpf.addEventListener("input", updateProgressiveFlow);
companionCpf.addEventListener("blur", () => {
    validateFieldRealtime(companionCpf);
});

form.addEventListener("submit", handleSubmit);

// Carregar configurações e verificar bloqueio ao carregar a página
(async () => {
    await updatePageConfig();
    isFormBlocked = await checkFormBlockStatus();
    if (isFormBlocked) {
        displayBlockMessage();
    }
})();
