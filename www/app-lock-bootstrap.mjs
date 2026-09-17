import {
  ensureTrustedAppSession
} from "./trusted-app-session.mjs";

const APP_OWNER_ID = "pam-sol";
const OWNER_EVERYDAY_ACCESS = "owner_everyday";
const PROTECTED_ACCESS = "protected_media_documents_settings";

const bootScreen = document.getElementById("solHoloBootScreen");
const app = document.getElementById("app");

let authenticationInProgress = false;
let unlocked = false;
let hiddenAtMillis = 0;

function securityPlugin() {
  return window.Capacitor?.Plugins?.SolAccessSecurity || null;
}

function speakerIdentityPlugin() {
  return window.Capacitor?.Plugins?.SolSpeakerIdentity || null;
}

function wakePlugin() {
  return window.Capacitor?.Plugins?.HeyHoSol || null;
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
  needsVoiceEnrollment = false,
  voiceSampleCount = 0,
  voiceRequiredSamples = 3,
  message = ""
} = {}) {
  const buttonLabel = needsRegistration
    ? "Gerät einmal sicher registrieren"
    : needsVoiceEnrollment
      ? `Pams Stimmprobe ${voiceSampleCount + 1}/${voiceRequiredSamples} aufnehmen`
      : "Nach „Hey Pam“ erneut öffnen";
  const status = message || (
    needsRegistration
      ? "Vor dem ersten Entsperren wird dieses Gerät fest mit pam-sol verbunden."
      : needsVoiceEnrollment
        ? "Vor dem ersten Holo-Zugang werden drei lokale Stimmproben von Pam eingerichtet."
        : "Sag „Hey Pam“. Sol öffnet deinen normalen Alltag nach deiner erkannten Stimme."
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
    if (needsVoiceEnrollment) {
      void enrollOwnerVoice();
      return;
    }
    void authenticateAndReveal({ needsRegistration });
  });

  const hint = document.createElement("span");
  hint.className = "solHoloLockHint";
  hint.textContent =
    "Gespräch, Wetter, Einkaufsliste und reine Text-WhatsApp sind danach offen. Bilder, Unterlagen, Geschäftliches und Systemeinstellungen benötigen zusätzlich Pams Fingerprint. Rohstimme und Fingerabdruckdaten werden nicht gespeichert.";

  bootScreen.append(logo, mission, statusNode, unlockButton, hint);
}

async function showVoiceEnrollment(message = "") {
  const plugin = speakerIdentityPlugin();
  if (!plugin) {
    showLocked({
      message:
        "Die lokale Pam-Stimmprüfung fehlt. Pam’s Holo bleibt geschlossen."
    });
    return;
  }
  try {
    const status = await plugin.getStatus();
    const sampleCount = Number(status?.sampleCount || 0);
    const requiredSamples = Number(status?.requiredSamples || 3);
    if (status?.profileReady === true) {
      showLocked({
        message:
          message || "Pams lokales Stimmprofil ist bereit. Sag einfach „Hey Pam“, um den Alltag zu öffnen."
      });
      return;
    }
    showLocked({
      needsVoiceEnrollment: true,
      voiceSampleCount: sampleCount,
      voiceRequiredSamples: requiredSamples,
      message:
        message ||
        `Lokale Stimmproben: ${sampleCount}/${requiredSamples}. Bitte den eingeblendeten Prüfsatz vollständig sprechen.`
    });
  } catch {
    showLocked({
      message:
        "Der lokale Stimmprofil-Status ist nicht verfügbar. Pam’s Holo bleibt geschlossen."
    });
  }
}

async function enrollOwnerVoice() {
  if (authenticationInProgress) return;
  const plugin = speakerIdentityPlugin();
  const statusNode = document.getElementById("solHoloAppLockStatus");
  const unlockButton = document.getElementById("solHoloAppUnlockButton");
  if (!plugin) {
    await showVoiceEnrollment();
    return;
  }
  authenticationInProgress = true;
  if (unlockButton) unlockButton.disabled = true;
  if (statusNode) {
    statusNode.textContent =
      "Mikrofon wird lokal vorbereitet. Bitte gleich sagen: „Hey Pam. Bitte prüfe jetzt genau meine Stimme.“";
  }
  try {
    await plugin.enrollSample();
    await showVoiceEnrollment();
  } catch (error) {
    await showVoiceEnrollment(
      String(error?.message || "Die Stimmprobe wurde nicht gespeichert.")
    );
  } finally {
    authenticationInProgress = false;
  }
}

async function freshOwnerVoiceProof(statusNode) {
  const plugin = speakerIdentityPlugin();
  if (!plugin) {
    throw Object.assign(new Error("OWNER_VOICE_PLUGIN_MISSING"), {
      code: "OWNER_VOICE_PLUGIN_MISSING"
    });
  }
  const status = await plugin.getStatus();
  if (status?.profileReady !== true) {
    throw Object.assign(new Error("OWNER_VOICE_PROFILE_REQUIRED"), {
      code: "OWNER_VOICE_PROFILE_REQUIRED"
    });
  }
  if (statusNode) {
    statusNode.textContent =
      "Der bereits erkannte „Hey Pam“-Stimmnachweis wird übernommen …";
  }
  if (typeof plugin.claimVerifiedWakeOwnerProof !== "function") {
    throw Object.assign(new Error("OWNER_WAKE_PROOF_UNAVAILABLE"), {
      code: "OWNER_WAKE_PROOF_UNAVAILABLE"
    });
  }
  const proof = await plugin.claimVerifiedWakeOwnerProof({
    ownerId: APP_OWNER_ID
  });
  if (
    proof?.accepted !== true ||
    proof?.decision !== "owner" ||
    !proof?.ownerPersonProofId
  ) {
    throw Object.assign(new Error("OWNER_WAKE_PROOF_REQUIRED"), {
      code: "OWNER_WAKE_PROOF_REQUIRED"
    });
  }
  return proof;
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
      : "Sols erkannter Hey-Pam-Stimmnachweis wird sicher übernommen …";
  }

  try {
    if (needsRegistration) {
      await plugin.registerCurrentDevice({ ownerId: APP_OWNER_ID });
      await showVoiceEnrollment(
        "Das Gerät ist registriert. Jetzt wird Pams persönliches Stimmprofil lokal eingerichtet."
      );
      return;
    }

    const voiceProof = await freshOwnerVoiceProof(statusNode);
    if (statusNode) {
      statusNode.textContent =
        "Pam wurde an ihrer Stimme erkannt. Der normale Alltag mit Sol wird geöffnet …";
    }

    const secureSession = await ensureTrustedAppSession({
      interactive: true,
      accessLevel: OWNER_EVERYDAY_ACCESS,
      ownerPersonProofId: voiceProof.ownerPersonProofId
    });
    if (secureSession?.trusted !== true) {
      throw new Error("TRUSTED_SESSION_NOT_ESTABLISHED");
    }
    revealApp();
  } catch (error) {
    const registrationRequired =
      needsRegistration ||
      error?.code === "REGISTERED_DEVICE_REQUIRED";
    if (error?.code === "OWNER_VOICE_PROFILE_REQUIRED") {
      await showVoiceEnrollment();
      return;
    }
    showLocked({
      needsRegistration: registrationRequired,
      message: registrationRequired
        ? error?.code === "BIOMETRIC_PROMPT_START_FAILED"
          ? "Das Android-Sicherheitsfenster konnte nicht geöffnet werden. Bitte Pam’s Holo vollständig im Vordergrund öffnen und erneut registrieren."
          : "Dieses Gerät muss zuerst einmal sicher für pam-sol registriert werden."
        : error?.code === "OWNER_WAKE_PROOF_REQUIRED" ||
            error?.code === "OWNER_WAKE_PROOF_UNAVAILABLE"
          ? "Bitte sage „Hey Pam“. Nach deiner erkannten Stimme öffnet Sol den normalen Alltag ohne Fingerprint."
          : "Nicht entsperrt. Deine persönlichen Inhalte bleiben vollständig verdeckt."
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

async function registerOwnerWakeUnlockListener() {
  const plugin = wakePlugin();
  if (!plugin?.addListener) return;
  try {
    await plugin.addListener("wakeDiagnostic", (event) => {
      if (event?.stage === "owner_accepted" && !unlocked) {
        void authenticateAndReveal();
      }
    });
  } catch {}
}

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
        "Pam’s Holo ist wieder gesperrt. Bitte sage „Hey Pam“, um den Alltag erneut zu öffnen."
    });
  }
});

void registerOwnerWakeUnlockListener();
void initializeAppLock();
