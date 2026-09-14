import {
  HUMAN_HOLO_TEST_EXPORT_MIN_PASSWORD_LENGTH,
  createHumanHoloTestDataSnapshot,
  encryptHumanHoloTestData,
  humanHoloTestExportFileName
} from "./human-holo-test-export-core.mjs";
import {
  collectHumanHoloOwnerLocalData
} from "./human-holo-local-owner-data.mjs";

const BACKEND_URL =
  globalThis.HumanHoloBackend?.baseUrl ||
  "https://human-holo-backend.invalid";

function selectedIdentity() {
  const identity = window.SolHoloIdentity?.selected?.();
  return identity?.testOnly === true &&
    String(identity?.ownerId || "").startsWith("human-test-") &&
    String(identity?.speakerId || "").startsWith("tester-")
    ? identity
    : null;
}

function setStatus(message, kind = "info") {
  const status = document.getElementById("humanHoloTestExportStatus");
  if (!status) return;
  status.textContent = String(message || "");
  status.dataset.kind = kind;
}

function setBusy(busy) {
  document
    .querySelectorAll("[data-human-holo-test-export-action]")
    .forEach(button => {
      button.disabled = Boolean(busy);
    });
  document.getElementById("humanHoloTestExportDialog")?.setAttribute(
    "aria-busy",
    String(Boolean(busy))
  );
}

function clearPasswords() {
  for (const id of [
    "humanHoloTestExportPassword",
    "humanHoloTestExportPasswordConfirm"
  ]) {
    const input = document.getElementById(id);
    if (input) input.value = "";
  }
}

async function post(path, identity) {
  const session = await window.SolHoloTrustedSession?.ensure?.({
    interactive: true
  });
  if (!session?.trusted || session?.ownerId !== identity.ownerId) {
    throw new Error("Die sichere Human-Holo-Testsitzung ist nicht mehr gültig.");
  }
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(window.SolHoloTrustedSession?.headers?.() || {})
    },
    body: JSON.stringify({
      ownerId: identity.ownerId,
      selectedSpeakerId: identity.speakerId
    }),
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(
      data?.error || "Die ownergebundenen Testdaten konnten nicht geladen werden."
    ));
  }
  return data;
}

function browserDownload(fileName, contents) {
  const blob = new Blob([contents], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

async function saveEncryptedExport(fileName, contents) {
  const plugin = window.Capacitor?.Plugins?.SolBackup;
  if (plugin?.saveEncryptedBackup) {
    const result = await plugin.saveEncryptedBackup({ fileName, contents });
    if (result?.saved !== true) {
      throw new Error("Android hat die Exportdatei nicht bestätigt.");
    }
    return;
  }
  browserDownload(fileName, contents);
}

function openDialog() {
  const identity = selectedIdentity();
  if (!identity) {
    window.SolHoloIdentity?.require?.();
    return false;
  }
  const overlay = document.getElementById("humanHoloTestExportOverlay");
  if (!overlay) return false;
  document.getElementById("humanHoloTestExportOwner").textContent =
    `${identity.instanceName} · ${identity.ownerId}`;
  overlay.hidden = false;
  document.body.classList.add("solBackupOpen");
  document.getElementById("humanHoloTestExportPassword")?.focus();
  return true;
}

function closeDialog() {
  const overlay = document.getElementById("humanHoloTestExportOverlay");
  if (!overlay) return;
  overlay.hidden = true;
  document.body.classList.remove("solBackupOpen");
  clearPasswords();
  setStatus("");
}

async function createEncryptedExport() {
  const identity = selectedIdentity();
  if (!identity) {
    throw new Error("Die aktive Human-Holo-Testidentität fehlt.");
  }
  const password =
    document.getElementById("humanHoloTestExportPassword")?.value || "";
  const confirmation =
    document.getElementById("humanHoloTestExportPasswordConfirm")?.value || "";
  if (password !== confirmation) {
    throw new Error("Die beiden Exportpasswörter stimmen nicht überein.");
  }
  if (password.length < HUMAN_HOLO_TEST_EXPORT_MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Das Exportpasswort braucht mindestens ${HUMAN_HOLO_TEST_EXPORT_MIN_PASSWORD_LENGTH} Zeichen.`
    );
  }

  setBusy(true);
  setStatus("Nur deine Testdaten werden zusammengestellt und lokal verschlüsselt …");
  try {
    const [memoryResponse, statusResponse, localData] = await Promise.all([
      post("/memory/backup/export", identity),
      post("/memory/control/status", identity),
      collectHumanHoloOwnerLocalData({ identity })
    ]);
    if (
      memoryResponse?.exported !== true ||
      memoryResponse?.complete !== true ||
      !memoryResponse?.backup ||
      memoryResponse?.identity?.ownerId !== identity.ownerId ||
      statusResponse?.identity?.ownerId !== identity.ownerId
    ) {
      throw new Error("Der Server hat keinen vollständigen ownergebundenen Export bestätigt.");
    }
    const createdAt = new Date();
    const snapshot = createHumanHoloTestDataSnapshot({
      identity,
      serverMemory: memoryResponse.backup,
      memoryPreferences: statusResponse.preferences || null,
      localData,
      createdAt
    });
    const encrypted = await encryptHumanHoloTestData(snapshot, password);
    const fileName = humanHoloTestExportFileName(identity, createdAt);
    await saveEncryptedExport(fileName, encrypted);
    clearPasswords();
    const counts = memoryResponse.backup.integrity?.counts || {};
    const memoryCount = Object.values(counts).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );
    const localCount = Object.values(localData.indexedDB || {})
      .filter(Array.isArray)
      .reduce((sum, rows) => sum + rows.length, 0);
    setStatus(
      `Verschlüsselter Testexport gespeichert: ${memoryCount} Server-Gedächtniseinträge und ${localCount} lokale Datenbankeinträge. Das Passwort wurde nicht gespeichert.`,
      "success"
    );
  } finally {
    setBusy(false);
  }
}

function markup() {
  return `
    <div id="humanHoloTestExportOverlay" class="solBackupOverlay" hidden>
      <section id="humanHoloTestExportDialog" class="solBackupDialog glassCard"
        role="dialog" aria-modal="true" aria-labelledby="humanHoloTestExportTitle">
        <header class="solBackupHeader">
          <div>
            <p class="eyebrow">Human Holo · nur Testdaten</p>
            <h2 id="humanHoloTestExportTitle">Verschlüsselter Datenexport</h2>
          </div>
          <button id="humanHoloTestExportClose" class="iconButton" type="button"
            aria-label="Datenexport schließen"
            data-human-holo-test-export-action>×</button>
        </header>
        <p id="humanHoloTestExportOwner" class="solBackupFileName"></p>
        <p class="solBackupLead">
          Exportiert das ownergebundene Servergedächtnis, die
          Gedächtniseinstellung sowie bekannte lokale Notizen, Tier-Holo-Daten,
          Medien und noch nicht übertragene Testeinträge. Der Export wird erst
          auf diesem Gerät verschlüsselt.
        </p>
        <section class="solBackupCard">
          <label for="humanHoloTestExportPassword">
            Eigenes Exportpasswort (mindestens ${HUMAN_HOLO_TEST_EXPORT_MIN_PASSWORD_LENGTH} Zeichen)
          </label>
          <input id="humanHoloTestExportPassword" type="password"
            minlength="${HUMAN_HOLO_TEST_EXPORT_MIN_PASSWORD_LENGTH}"
            maxlength="1024" autocomplete="new-password" spellcheck="false">
          <label for="humanHoloTestExportPasswordConfirm">Passwort wiederholen</label>
          <input id="humanHoloTestExportPasswordConfirm" type="password"
            minlength="${HUMAN_HOLO_TEST_EXPORT_MIN_PASSWORD_LENGTH}"
            maxlength="1024" autocomplete="new-password" spellcheck="false">
          <button id="humanHoloTestExportCreate" class="primaryButton" type="button"
            data-human-holo-test-export-action>Verschlüsselten Testexport speichern</button>
          <p class="solBackupHint">
            Das Passwort wird weder gespeichert noch übertragen. Ohne dieses
            Passwort kann die Datei nicht geöffnet werden.
          </p>
        </section>
        <details class="solBackupExclusions">
          <summary>Bewusst nicht enthalten</summary>
          <ul>
            <li>Einladungs-Zugangscode und Sitzungstoken</li>
            <li>OAuth-Zugangs- und Aktualisierungstoken</li>
            <li>Server- und Signiergeheimnisse</li>
            <li>flüchtiger RAM-Gesprächskontext</li>
          </ul>
          <p>Eine Wiederherstellung ist im Legal-Review-Test technisch geparkt.</p>
        </details>
        <p id="humanHoloTestExportStatus" class="solBackupStatus" role="status"
          aria-live="polite"></p>
      </section>
    </div>`;
}

function installUi() {
  if (document.getElementById("humanHoloTestExportOverlay")) return;
  document.body.insertAdjacentHTML("beforeend", markup());
  document.getElementById("humanHoloTestExportClose")?.addEventListener(
    "click",
    closeDialog
  );
  document.getElementById("humanHoloTestExportCreate")?.addEventListener(
    "click",
    () => void createEncryptedExport().catch(error => {
      setStatus(error?.message || "Der Testexport ist fehlgeschlagen.", "error");
    })
  );
  document.getElementById("humanHoloTestExportOverlay")?.addEventListener(
    "click",
    event => {
      if (event.target.id === "humanHoloTestExportOverlay") closeDialog();
    }
  );
  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      !document.getElementById("humanHoloTestExportOverlay")?.hidden
    ) {
      closeDialog();
    }
  });
}

installUi();

window.HumanHoloTestExport = Object.freeze({
  open: openDialog,
  encryptedOnly: true,
  restoreAvailableInTest: false
});
