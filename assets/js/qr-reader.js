import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection,
    doc,
    getDocs,
    getFirestore,
    limit,
    query,
    serverTimestamp,
    updateDoc,
    where,
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ── Elementos DOM ─────────────────────────────────────────────────────────────
const adminEmailBadge = document.getElementById("adminEmailBadge");
const logoutButton = document.getElementById("logoutButton");
const startCameraButton = document.getElementById("startCameraButton");
const stopCameraButton = document.getElementById("stopCameraButton");
const qrVideo = document.getElementById("qrVideo");
const qrCanvas = document.getElementById("qrCanvas");
const qrStatus = document.getElementById("qrStatus");
const qrResult = document.getElementById("qrResult");
const manualTokenInput = document.getElementById("manualTokenInput");
const verifyTokenButton = document.getElementById("verifyTokenButton");

let cameraStream = null;
let scanAnimationFrame = null;
let lastProcessedToken = null;
let processingCooldown = false;
let pendingGuestDoc = null;
let pendingGuestData = null;

let checkinDialog = null;
let modalGuestName = null;
let modalGuestCargo = null;
let companionInfoSection = null;
let modalCompanionName = null;
let modalCompanionCargo = null;
let checkinMainGuestBtn = null;
let checkinCompanionOnlyBtn = null;
let checkinBothBtn = null;
let cancelCheckinBtn = null;

const CARGO_LABELS = {
    "diretoria": "Diretoria",
    "ex_diretoria": "Ex-Diretoria",
    "funcionario": "Funcionário",
    "socio": "Sócio",
    "convidado": "Convidado",
    "fornecedor": "Fornecedor",
    "imprensa": "Imprensa",
    "autoridades": "Autoridades",
    "outras_entidades": "Outras Entidades"
};

function getCargoLabel(cargo) {
    return CARGO_LABELS[cargo] || cargo || "Convidado";
}

// ── Auth guard ────────────────────────────────────────────────────────────────
function isAllowedAdmin(email) {
    return ALLOWED_ADMIN_EMAILS.includes(String(email || "").toLowerCase());
}

onAuthStateChanged(auth, (user) => {
    if (!user || !isAllowedAdmin(user.email)) {
        window.location.href = "admin-login.html";
        return;
    }

    adminEmailBadge.textContent = user.email;
});

logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "admin-login.html";
    } catch (error) {
        console.error(error);
    }
});

// ── Formatadores ──────────────────────────────────────────────────────────────
function formatDateTime(value) {
    if (!value) return "-";
    try {
        if (typeof value.toDate === "function") {
            return value.toDate().toLocaleString("pt-BR");
        }
        return new Date(value).toLocaleString("pt-BR");
    } catch {
        return "-";
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ── Processamento do QR Code ──────────────────────────────────────────────────
function extractTokenFromUrl(rawValue) {
    if (!rawValue || typeof rawValue !== "string") return null;

    // Se for uma URL com ?token=, extrai o token
    try {
        const url = new URL(rawValue);
        const token = url.searchParams.get("token");
        if (token) return token;
    } catch {
        // Não é uma URL, trata como token direto
    }

    return rawValue.trim();
}

function setStatus(message, type = "") {
    qrStatus.textContent = message;
    qrStatus.className = "qr-status" + (type ? ` ${type}` : "");
}

function showResult(html, type) {
    qrResult.innerHTML = html;
    qrResult.className = "qr-result " + type;
}

function clearResult() {
    qrResult.innerHTML = "";
    qrResult.className = "qr-result";
}

async function processQrCode(rawValue) {
    const token = extractTokenFromUrl(rawValue);

    if (!token) {
        showResult(
            `<span class="result-icon">✗</span>
             <span class="result-name">Token não detectado</span>`,
            "error"
        );
        setStatus("Token inválido", "error");
        return;
    }

    // Evita processar o mesmo token duas vezes seguidas
    if (processingCooldown && token === lastProcessedToken) {
        return;
    }

    lastProcessedToken = token;
    processingCooldown = true;

    setStatus("Verificando token...", "scanning");
    clearResult();

    try {
        // Primeiro, procura pelo token do titular
        let snapshot = await getDocs(query(
            collection(db, "confirmacoes_jantar"),
            where("qrCodeToken", "==", token),
            limit(1)
        ));

        let isCompanionToken = false;
        let guestDoc = null;
        let guestData = null;

        // Se não encontrou pelo token do titular, procura pelo token do acompanhante
        if (snapshot.empty) {
            snapshot = await getDocs(query(
                collection(db, "confirmacoes_jantar"),
                where("companion.qrCodeToken", "==", token),
                limit(1)
            ));
            
            if (!snapshot.empty) {
                isCompanionToken = true;
            }
        }

        if (snapshot.empty) {
            setStatus("QR Code inválido", "error");
            showResult(
                `<span class="result-icon">✗</span>
                 <span class="result-name">QR Code não encontrado</span>
                 <span class="result-detail">Nenhum convidado corresponde a este QR Code</span>`,
                "error"
            );
            scheduleCooldownReset(5000);
            return;
        }

        guestDoc = snapshot.docs[0];
        guestData = guestDoc.data();
        
        const hasCompanion = guestData.hasCompanion && guestData.companion;
        const mainCheckedIn = guestData.checkedIn;
        const companionCheckedIn = guestData.companionCheckedIn;

        // Se é token do acompanhante
        if (isCompanionToken) {
            if (!hasCompanion) {
                setStatus("QR Code inválido", "error");
                showResult(
                    `<span class="result-icon">✗</span>
                     <span class="result-name">QR Code não encontrado</span>
                     <span class="result-detail">Este QR Code não corresponde a nenhum convidado</span>`,
                    "error"
                );
                scheduleCooldownReset(5000);
                return;
            }

            // Verifica se o QR Code do acompanhante já foi usado
            if (guestData.companion?.qrCodeUsed) {
                setStatus("QR Code já utilizado", "error");
                showResult(
                    `<span class="result-icon">✗</span>
                     <span class="result-name">${escapeHtml(guestData.companion.fullName || "Acompanhante")}</span>
                     <span class="result-detail">QR Code do acompanhante já utilizado em: ${formatDateTime(guestData.companion.qrCodeUsedAt)}</span>`,
                    "error"
                );
                scheduleCooldownReset(5000);
                return;
            }

            // Verifica se o acompanhante já fez check-in
            if (companionCheckedIn) {
                setStatus("Check-in já realizado!", "success");
                showResult(
                    `<span class="result-icon">✓</span>
                     <span class="result-name">${escapeHtml(guestData.companion.fullName || "Acompanhante")}</span>
                     <span class="result-detail">Check-in já realizado!</span>`,
                    "success"
                );
                scheduleCooldownReset(4000);
                return;
            }

            // Faz check-in do acompanhante diretamente
            await updateDoc(doc(db, "confirmacoes_jantar", guestDoc.id), {
                companionCheckedIn: true,
                companionCheckedInAt: serverTimestamp(),
                'companion.qrCodeUsed': true,
                'companion.qrCodeUsedAt': serverTimestamp(),
                checkinMethod: "qrcode"
            });

            setStatus("Check-in realizado!", "success");
            showResult(
                `<span class="result-icon">✓</span>
                 <span class="result-name">${escapeHtml(guestData.companion.fullName || "Acompanhante")}</span>
                 <span class="result-detail">Entrada do acompanhante registrada!</span>`,
                "success"
            );
            
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
            
            scheduleCooldownReset(4000);
            return;
        }

        // Se é token do titular (lógica original)
        if (guestData.qrCodeUsed) {
            setStatus("QR Code já utilizado", "error");
            showResult(
                `<span class="result-icon">✗</span>
                 <span class="result-name">${escapeHtml(guestData.fullName)}</span>
                 <span class="result-detail">QR Code já utilizado em: ${formatDateTime(guestData.qrCodeUsedAt)}</span>`,
                "error"
            );
            scheduleCooldownReset(5000);
            return;
        }
        
        if (!hasCompanion && mainCheckedIn) {
            setStatus("Check-in já realizado!", "success");
            showResult(
                `<span class="result-icon">✓</span>
                 <span class="result-name">${escapeHtml(guestData.fullName)}</span>
                 <span class="result-detail">Check-in já realizado!</span>`,
                "success"
            );
            scheduleCooldownReset(4000);
            return;
        }

        pendingGuestDoc = guestDoc;
        pendingGuestData = guestData;
        
        showCheckinModal(guestData);
        setStatus("Aguardando confirmação...", "scanning");
        clearResult();
    } catch (error) {
        console.error("Erro ao verificar QR Code:", error);
        setStatus("Erro na verificação", "error");
        showResult(
            `<span class="result-icon">✗</span>
             <span class="result-name">Erro ao verificar</span>
             <span class="result-detail">Tente novamente</span>`,
            "error"
        );
        scheduleCooldownReset(3000);
    }
}

function showCheckinModal(guestData) {
    if (!checkinDialog || !modalGuestName) return;
    
    checkinDialog.classList.remove("hidden");
    
    modalGuestName.textContent = guestData.fullName;
    modalGuestCargo.textContent = getCargoLabel(guestData.cargo);
    
    const hasCompanion = guestData.hasCompanion && guestData.companion;
    const companionAlreadyCheckedIn = guestData.companionCheckedIn;
    const mainGuestAlreadyCheckedIn = guestData.checkedIn;
    
    if (hasCompanion) {
        companionInfoSection.classList.remove("hidden");
        modalCompanionName.textContent = guestData.companion.fullName || "Acompanhante";
        modalCompanionCargo.textContent = getCargoLabel(guestData.companion.cargo);
        
        checkinMainGuestBtn.classList.remove("hidden");
        checkinCompanionOnlyBtn.classList.remove("hidden");
        checkinBothBtn.classList.remove("hidden");
        
        if (mainGuestAlreadyCheckedIn && !companionAlreadyCheckedIn) {
            checkinMainGuestBtn.classList.add("hidden");
            checkinCompanionOnlyBtn.classList.remove("hidden");
            checkinBothBtn.classList.add("hidden");
        } else if (!mainGuestAlreadyCheckedIn && companionAlreadyCheckedIn) {
            checkinMainGuestBtn.classList.remove("hidden");
            checkinCompanionOnlyBtn.classList.add("hidden");
            checkinBothBtn.classList.add("hidden");
        } else if (mainGuestAlreadyCheckedIn && companionAlreadyCheckedIn) {
            checkinMainGuestBtn.classList.add("hidden");
            checkinCompanionOnlyBtn.classList.add("hidden");
            checkinBothBtn.classList.add("hidden");
            
            setStatus("Check-in já realizado!", "success");
            showResult(
                `<span class="result-icon">✓</span>
                 <span class="result-name">${escapeHtml(guestData.fullName)}</span>
                 <span class="result-detail">Todos já fizeram check-in!</span>`,
                "success"
            );
            return;
        }
    } else {
        companionInfoSection.classList.add("hidden");
        checkinMainGuestBtn.classList.remove("hidden");
        checkinCompanionOnlyBtn.classList.add("hidden");
        checkinBothBtn.classList.add("hidden");
    }
    
    checkinDialog.showModal();
}

async function performCheckin(type) {
    if (!checkinDialog) return;
    
    checkinDialog.classList.add("hidden");
    
    const updates = {
        checkinMethod: "qrcode"
    };
    
    if (type === "main" || type === "both") {
        updates.checkedIn = true;
        updates.checkedInAt = serverTimestamp();
        updates.qrCodeUsed = true;
        updates.qrCodeUsedAt = serverTimestamp();
    }
    
    if (type === "companion" || type === "both") {
        updates.companionCheckedIn = true;
        updates.companionCheckedInAt = serverTimestamp();
        updates['companion.qrCodeUsed'] = true;
        updates['companion.qrCodeUsedAt'] = serverTimestamp();
    }
    
    try {
        await updateDoc(doc(db, "confirmacoes_jantar", pendingGuestDoc.id), updates);
        
        let message = "";
        if (type === "main") {
            message = `${pendingGuestData.fullName} - Check-in realizado!`;
        } else if (type === "companion") {
            message = `${pendingGuestData.companion?.fullName || "Acompanhante"} - Check-in realizado!`;
        } else {
            message = `${pendingGuestData.fullName} e acompanhante - Check-in realizado!`;
        }
        
        setStatus("Check-in realizado!", "success");
        showResult(
            `<span class="result-icon">✓</span>
             <span class="result-name">${escapeHtml(message)}</span>
             <span class="result-detail">Entrada registrada com sucesso!</span>`,
            "success"
        );
        
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        
        pendingGuestDoc = null;
        pendingGuestData = null;
        scheduleCooldownReset(4000);
    } catch (error) {
        console.error("Erro ao realizar check-in:", error);
        setStatus("Erro ao realizar check-in", "error");
        pendingGuestDoc = null;
        pendingGuestData = null;
        scheduleCooldownReset(3000);
    }
}

function scheduleCooldownReset(ms) {
    setTimeout(() => {
        processingCooldown = false;
        lastProcessedToken = null;
        setStatus("Aguardando QR Code...");
    }, ms);
}

// ── Câmera ────────────────────────────────────────────────────────────────────
function startCamera() {
    setStatus("Iniciando câmera...");

    navigator.mediaDevices
        .getUserMedia({
            video: {
                facingMode: "environment",
                width: { ideal: 640 },
                height: { ideal: 480 },
            },
        })
        .then((stream) => {
            cameraStream = stream;
            qrVideo.srcObject = stream;
            qrVideo.setAttribute("playsinline", "true");
            qrVideo.play();

            startCameraButton.classList.add("hidden");
            stopCameraButton.classList.remove("hidden");
            setStatus("Aguardando QR Code...");

            requestAnimationFrame(scanFrame);
        })
        .catch((err) => {
            console.error("Erro ao acessar câmera:", err);
            setStatus("Erro ao acessar câmera", "error");
            showResult(
                `<span class="result-icon">📷</span>
                 <span class="result-name">Câmera indisponível</span>
                 <span class="result-detail">Verifique as permissões do navegador</span>`,
                "error"
            );
        });
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        cameraStream = null;
    }

    if (scanAnimationFrame) {
        cancelAnimationFrame(scanAnimationFrame);
        scanAnimationFrame = null;
    }

    startCameraButton.classList.remove("hidden");
    stopCameraButton.classList.add("hidden");
    qrVideo.srcObject = null;
    setStatus("Câmera parada");
}

function scanFrame() {
    if (!cameraStream || cameraStream.active === false) {
        return;
    }

    const context = qrCanvas.getContext("2d", { willReadFrequently: true });

    if (qrVideo.readyState === qrVideo.HAVE_ENOUGH_DATA) {
        qrCanvas.width = qrVideo.videoWidth;
        qrCanvas.height = qrVideo.videoHeight;

        context.drawImage(qrVideo, 0, 0, qrCanvas.width, qrCanvas.height);

        const imageData = context.getImageData(0, 0, qrCanvas.width, qrCanvas.height);

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code && code.data && code.data.length > 0) {
            processQrCode(code.data);
        }
    }

    scanAnimationFrame = requestAnimationFrame(scanFrame);
}

// ── Event listeners ───────────────────────────────────────────────────────────
startCameraButton.addEventListener("click", startCamera);
stopCameraButton.addEventListener("click", stopCamera);

verifyTokenButton.addEventListener("click", () => {
    const token = manualTokenInput.value.trim();
    if (token) {
        processQrCode(token);
        manualTokenInput.value = "";
    }
});

manualTokenInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        const token = manualTokenInput.value.trim();
        if (token) {
            processQrCode(token);
            manualTokenInput.value = "";
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    checkinDialog = document.getElementById("checkinDialog");
    modalGuestName = document.getElementById("modalGuestName");
    modalGuestCargo = document.getElementById("modalGuestCargo");
    companionInfoSection = document.getElementById("companionInfoSection");
    modalCompanionName = document.getElementById("modalCompanionName");
    modalCompanionCargo = document.getElementById("modalCompanionCargo");
    checkinMainGuestBtn = document.getElementById("checkinMainGuestBtn");
    checkinCompanionOnlyBtn = document.getElementById("checkinCompanionOnlyBtn");
    checkinBothBtn = document.getElementById("checkinBothBtn");
    cancelCheckinBtn = document.getElementById("cancelCheckinBtn");
    
    if (checkinDialog) {
        checkinDialog.addEventListener("click", (e) => {
            if (e.target === checkinDialog) {
                checkinDialog.classList.add("hidden");
                pendingGuestDoc = null;
                pendingGuestData = null;
                scheduleCooldownReset(2000);
            }
        });
    }
    
    if (checkinMainGuestBtn) {
        checkinMainGuestBtn.addEventListener("click", async () => {
            console.log("Clique em confirmar principal");
            if (!pendingGuestDoc || !pendingGuestData) {
                console.log("Sem dados pendentes");
                return;
            }
            await performCheckin("main");
        });
    }

    if (checkinCompanionOnlyBtn) {
        checkinCompanionOnlyBtn.addEventListener("click", async () => {
            if (!pendingGuestDoc || !pendingGuestData) return;
            await performCheckin("companion");
        });
    }

    if (checkinBothBtn) {
        checkinBothBtn.addEventListener("click", async () => {
            if (!pendingGuestDoc || !pendingGuestData) return;
            await performCheckin("both");
        });
    }

    if (cancelCheckinBtn) {
        cancelCheckinBtn.addEventListener("click", () => {
            if (checkinDialog) checkinDialog.classList.add("hidden");
            pendingGuestDoc = null;
            pendingGuestData = null;
            scheduleCooldownReset(2000);
        });
    }
});
