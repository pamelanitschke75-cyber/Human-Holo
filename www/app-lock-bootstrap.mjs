import {
  ensureTrustedAppSession
} from "./trusted-app-session.mjs?v=11";

const APP_OWNER_ID = "pam-sol";
const OWNER_EVERYDAY_ACCESS = "owner_everyday";
const PROTECTED_ACCESS = "protected_media_documents_settings";

const bootScreen = document.getElementById("solHoloBootScreen");
const app = document.getElementById("app");

let authenticationInProgress = false;
let unlocked = false;
let hiddenAtMillis = 0;
let everydaySessionRefreshPromise = null;

function securityPlugin() {
  return window.Capacitor?.Plugins?.SolAccessSecurity || null;
}

function isNativeAndroidApp() {
  try {
    return window.Capacitor?.getPlatform?.() === "android" ||
      Boolean(securityPlugin());
  } catch {
    return false;
  }
}

function boundIdentity() {
  const identity = window.SolHoloIdentity?.bound?.();
  return identity?.ownerId === APP_OWNER_ID ? identity : null;
}

function lockMarkup({
  needsRegistration = false,
  message = ""
} = {}) {
  const buttonLabel = needsRegistration
    ? "Gerät einmal sicher registrieren"
    : "Mit Fingerprint öffnen";
  const status = message || (
    needsRegistration
      ? "Vor dem ersten Öffnen wird dieses Gerät fest mit pam-sol verbunden."
      : "Pam’s Holo bleibt verdeckt, bis Pams starker Android-Fingerprint bestätigt wurde."
  );

  bootScreen.innerHTML = "";
  const logo = document.createElement("img");
  logo.className = "solHoloLockLogo";
  logo.src = "./human-holo-logo.png";
  logo.alt = "Human Holo – Forever Together";
  logo.decoding = "async";

  const mission = document.createElement("span");
  mission.className = "humanHoloMission";
  mission.textContent = "HSG – HUMANS SECOND GENERATION!";

  const statusNode = document.createElement("span");
  statusNode.id = "solHoloAppLockStatus";
  statusNode.setAttribute("role", "status");
  statusNode.setAttribute("aria-live", "polite");
  statusNode.textContent = status;

  const unlockButton = document.createElement("button");
  unlockButton.id = "solHoloAppUnlockButton";
  unlockButton.className = "solHoloLockButton";
  unlockButton.type = "button";
  unlockButton.textContent = buttonLabel;
  unlockButton.addEventListener("click", () => {
    void authenticateAndReveal({ needsRegistration });
  });

  const hint = document.createElement("span");
  hint.className = "solHoloLockHint";
  hint.textContent =
    "„Hey Pam“ ist ausschließlich der Weckruf und niemals eine Entsperrung. Vor jeder App-Sichtbarkeit ist Pams starker Android-Fingerprint nötig; Bilder, Unterlagen, Geschäftliches, medizinische Daten und Systemeinstellungen verlangen danach eine eigene neue Freigabe. Rohstimme und Fingerabdruckdaten werden nicht gespeichert.";

  bootScreen.append(logo, mission, statusNode, unlockButton, hint);
}

function showLocked(options = {}) {
  unlocked = false;
  document.documentElement.classList.add("solholo-booting");
  bootScreen.hidden = false;
  bootScreen.removeAttribute("aria-hidden");
  app?.setAttribute("aria-hidden", "true");
  lockMarkup(options);
}

function revealApp() {
  unlocked = true;
  hiddenAtMillis = 0;
  document.documentElement.classList.remove("solholo-booting");
  bootScreen.hidden = true;
  bootScreen.setAttribute("aria-hidden", "true");
  app?.removeAttribute("aria-hidden");
}

function refreshEverydaySessionInBackground({
  authorizationId = "",
  authorizationExpiresAtMillis = 0
} = {}) {
  if (everydaySessionRefreshPromise) {
    return everydaySessionRefreshPromise;
  }
  const hasFingerprintGrant =
    typeof authorizationId === "string" &&
    authorizationId.length > 0 &&
    Number(authorizationExpiresAtMillis) > Date.now();
  everydaySessionRefreshPromise = ensureTrustedAppSession({
    interactive: !hasFingerprintGrant,
    accessLevel: OWNER_EVERYDAY_ACCESS,
    allowBootstrap: false,
    authorizationId: hasFingerprintGrant ? authorizationId : "",
    authorizationExpiresAtMillis: hasFingerprintGrant
      ? Number(authorizationExpiresAtMillis)
      : 0
  })
    .catch(() => ({ trusted: false }))
    .finally(() => {
      everydaySessionRefreshPromise = null;
    });
  return everydaySessionRefreshPromise;
}

function lockAfterBackground() {
  if (!unlocked || authenticationInProgress) return;
  showLocked({
    message:
      "Pam’s Holo wurde nach dem Verlassen der App wieder sicher gesperrt."
  });
  window.SolHoloTrustedSession?.clear?.();
  try {
    if (typeof window.stopLiveConversation === "function") {
      window.stopLiveConversation();
    }
  } catch {}
}

async function authenticateAndReveal({ needsRegistration = false } = {}) {
  if (authenticationInProgress) return;
  const identity = boundIdentity();
  const plugin = securityPlugin();
  const statusNode = document.getElementById("solHoloAppLockStatus");
  const unlockButton = document.getElementById("solHoloAppUnlockButton");

  if (!identity || !plugin) {
    showLocked({
      message:
        "Die feste pam-sol-Sicherheitsbindung ist nicht verfügbar. Die App bleibt gesperrt."
    });
    return;
  }

  authenticationInProgress = true;
  if (unlockButton) unlockButton.disabled = true;
  if (statusNode) {
    statusNode.textContent = needsRegistration
      ? "Android registriert dieses Gerät jetzt sicher für pam-sol …"
      : "Pams starker Android-Fingerprint wird lokal geprüft …";
  }

  try {
    if (needsRegistration) {
      await plugin.registerCurrentDevice({ ownerId: APP_OWNER_ID });
    }
    const status = await plugin.getStatus({ ownerId: APP_OWNER_ID });
    if (
      status?.ownerId !== APP_OWNER_ID ||
      status?.device?.registered !== true
    ) {
      throw Object.assign(new Error("REGISTERED_DEVICE_REQUIRED"), {
        code: "REGISTERED_DEVICE_REQUIRED"
      });
    }

    const authorization = await plugin.authorizeAppAccess({
      ownerId: APP_OWNER_ID,
      useRegisteredWatch: false
    });
    if (
      authorization?.allowed !== true ||
      authorization?.ownerId !== APP_OWNER_ID ||
      authorization?.action !== "unlock_app" ||
      authorization?.authenticationType !== "system_strong_biometric" ||
      !authorization?.authorizationId
    ) {
      throw Object.assign(new Error("STRONG_BIOMETRIC_REQUIRED"), {
        code: "STRONG_BIOMETRIC_REQUIRED"
      });
    }

    const consumed = await plugin.consumeCriticalAuthorization({
      ownerId: APP_OWNER_ID,
      authorizationId: authorization.authorizationId,
      action: "unlock_app"
    });
    if (
      consumed?.allowed !== true ||
      consumed?.consumed !== true ||
      consumed?.ownerId !== APP_OWNER_ID ||
      consumed?.action !== "unlock_app"
    ) {
      throw Object.assign(new Error("APP_ACCESS_GRANT_INVALID"), {
        code: "APP_ACCESS_GRANT_INVALID"
      });
    }

    revealApp();
    void refreshEverydaySessionInBackground({
      authorizationId:
        authorization.ownerEverydayAuthorizationId || "",
      authorizationExpiresAtMillis:
        authorization.ownerEverydayAuthorizationExpiresAtMillis || 0
    });
  } catch (error) {
    const registrationRequired =
      error?.code === "REGISTERED_DEVICE_REQUIRED";
    showLocked({
      needsRegistration: registrationRequired,
      message: registrationRequired
        ? "Dieses Gerät muss zuerst einmal sicher für pam-sol registriert werden."
        : error?.code === "BIOMETRIC_PROMPT_START_FAILED"
          ? "Das Android-Fingerprintfenster konnte nicht geöffnet werden. Bitte Pam’s Holo vollständig im Vordergrund öffnen und erneut versuchen."
          : "Nicht entsperrt. Pam’s Holo bleibt bis zu Pams bestätigtem Fingerprint vollständig verdeckt."
    });
  } finally {
    authenticationInProgress = false;
  }
}

async function ensureProtectedPamHoloAccess() {
  if (!unlocked) {
    throw Object.assign(new Error("OWNER_EVERYDAY_SESSION_REQUIRED"), {
      code: "OWNER_EVERYDAY_SESSION_REQUIRED"
    });
  }
  if (
    !window.SolHoloTrustedSession?.hasAccess?.(OWNER_EVERYDAY_ACCESS)
  ) {
    const everydaySession = await ensureTrustedAppSession({
      interactive: true,
      accessLevel: OWNER_EVERYDAY_ACCESS,
      allowBootstrap: true
    });
    if (everydaySession?.trusted !== true) {
      throw Object.assign(new Error("OWNER_EVERYDAY_SESSION_REQUIRED"), {
        code: "OWNER_EVERYDAY_SESSION_REQUIRED"
      });
    }
  }
  const session = await ensureTrustedAppSession({
    interactive: true,
    accessLevel: PROTECTED_ACCESS
  });
  if (session?.trusted !== true) {
    throw Object.assign(new Error("PAM_HOLO_FINGERPRINT_REQUIRED"), {
      code: "PAM_HOLO_FINGERPRINT_REQUIRED"
    });
  }
  return session;
}

window.SolHoloProtectedAccess = Object.freeze({
  ensure: ensureProtectedPamHoloAccess,
  requiredFor: Object.freeze([
    "images",
    "videos",
    "documents",
    "attachments",
    "business_matters",
    "system_settings",
    "security_settings",
    "account_connection_settings",
    "permission_settings",
    "medical_data",
    "medical_permission_settings",
    "backup_and_restore"
  ]),
  status: () => ({
    unlocked,
    protected: Boolean(
      window.SolHoloTrustedSession?.hasAccess?.(PROTECTED_ACCESS)
    )
  })
});

let protectedControlReplay = false;
document.addEventListener("click", (event) => {
  if (protectedControlReplay || !unlocked) return;
  const target = event.target instanceof Element
    ? event.target.closest(
      'input[type="file"], #imageButton, #chatGalleryButton, ' +
      '#medicationCameraButton, #medicationGalleryButton, #liveCameraButton'
    )
    : null;
  if (
    !target ||
    window.SolHoloTrustedSession?.hasAccess?.(PROTECTED_ACCESS)
  ) {
    return;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
  void ensureProtectedPamHoloAccess()
    .then(() => {
      protectedControlReplay = true;
      try {
        target.click();
      } finally {
        protectedControlReplay = false;
      }
    })
    .catch(() => {});
}, true);

async function initializeAppLock() {
  if (!isNativeAndroidApp()) {
    showLocked({
      message:
        "Pam’s Holo ist ausschließlich in Pams registrierter Android-App zugänglich. Diese Browseransicht bleibt geschlossen."
    });
    return;
  }

  const identity = boundIdentity();
  const plugin = securityPlugin();
  if (!identity || !plugin) {
    showLocked({
      message:
        "Die Android-Sicherheitskomponente oder die feste pam-sol-ID fehlt. Die App bleibt gesperrt."
    });
    return;
  }

  showLocked({ message: "Sicherheitsstatus wird lokal geprüft …" });
  try {
    const status = await plugin.getStatus({ ownerId: APP_OWNER_ID });
    if (status?.ownerId !== APP_OWNER_ID) {
      throw new Error("OWNER_SCOPE_MISMATCH");
    }
    if (status?.device?.registered !== true) {
      showLocked({ needsRegistration: true });
      return;
    }
    await authenticateAndReveal();
  } catch {
    showLocked({
      message:
        "Der persönliche Sicherheitsstatus konnte nicht bestätigt werden. Die App bleibt gesperrt."
    });
  }
}

document.addEventListener("visibilitychange", () => {
  if (!isNativeAndroidApp() || authenticationInProgress) return;
  if (document.visibilityState === "hidden") {
    hiddenAtMillis = Date.now();
    lockAfterBackground();
    return;
  }
  if (
    document.visibilityState === "visible" &&
    !unlocked &&
    hiddenAtMillis > 0
  ) {
    showLocked({
      message:
        "Pam’s Holo ist wieder gesperrt. Pams Fingerprint wird erneut benötigt …"
    });
    void initializeAppLock();
  }
});

void initializeAppLock();
