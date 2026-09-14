import {
  eraseHumanHoloOwnerLocalData
} from "./human-holo-local-owner-data.mjs";

const BACKEND_URL =
  globalThis.HumanHoloBackend?.baseUrl ||
  "https://human-holo-backend.invalid";
const OWNER_ERASURE_CONFIRMATION =
  "MEINE HUMAN HOLO DATEN ENDGÜLTIG LÖSCHEN";

function selectedIdentity() {
  const identity = window.SolHoloIdentity?.selected?.();
  return identity?.testOnly === true &&
    String(identity?.ownerId || "").startsWith("human-test-") &&
    String(identity?.speakerId || "").startsWith("tester-")
    ? identity
    : null;
}

function setStatus(message, kind = "info") {
  const node = document.getElementById("dataRightsStatus");
  if (!node) return;
  node.textContent = String(message || "");
  node.dataset.kind = kind;
}

function setBusy(busy) {
  document.querySelectorAll("[data-rights-action]").forEach(button => {
    button.disabled = Boolean(busy);
  });
  document.getElementById("dataRightsPanel")?.setAttribute(
    "aria-busy",
    String(Boolean(busy))
  );
}

async function post(path, body = {}) {
  const identity = selectedIdentity();
  if (!identity) throw new Error("Die feste persönliche Holo-ID fehlt.");
  const session = await window.SolHoloTrustedSession?.ensure?.({ interactive: true });
  if (!session?.trusted) throw new Error("Die sichere App-Sitzung wurde nicht bestätigt.");
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...window.SolHoloTrustedSession.headers()
    },
    body: JSON.stringify({
      ...body,
      ownerId: identity.ownerId,
      selectedSpeakerId: identity.speakerId
    }),
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(data?.error || "Die Datenrechte-Aktion ist fehlgeschlagen."));
  }
  return data;
}

async function eraseLocalOwnerData() {
  const identity = selectedIdentity();
  if (!identity) {
    throw new Error("Die aktive Testidentität ist nicht verfügbar.");
  }
  const ownerScoped = await eraseHumanHoloOwnerLocalData({ identity });
  try {
    window.sessionStorage.removeItem("sol-holo-conversation-session-v1");
  } catch {}
  window.SolHoloTrustedSession?.clear?.();
  return {
    ownerScoped,
    webStorageErased: ownerScoped.localStorage.complete,
    indexedDatabasesErased: ownerScoped.indexedDB.complete,
    complete: ownerScoped.complete,
    foreignOwnerDataDeleted: false
  };
}

function openBackup() {
  if (typeof window.HumanHoloTestExport?.open === "function") {
    window.HumanHoloTestExport.open();
    return;
  }
  setStatus("Der getrennte Human-Holo-Testexport ist nicht verfügbar.", "error");
}

async function previewErasure() {
  setBusy(true);
  setStatus("Löschumfang wird sicher ermittelt …");
  try {
    const data = await post("/data-rights/erasure/preview");
    const preview = document.getElementById("dataErasurePreview");
    const total = Number(data?.preview?.totalRows || 0);
    if (preview) {
      preview.hidden = false;
      document.getElementById("dataErasureCount").textContent =
        `${total} ownergebundene Servereinträge sind aktuell umfasst. Hinzu kommen lokale App-Daten auf diesem Gerät.`;
    }
    setStatus("Löschumfang geladen. Sichere vorher auf Wunsch eine verschlüsselte Kopie.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    setBusy(false);
    updateDeleteButton();
  }
}

function updateDeleteButton() {
  const phrase = document.getElementById("dataErasurePhrase")?.value || "";
  const understood = document.getElementById("dataErasureIrreversible")?.checked === true;
  const button = document.getElementById("dataErasureExecute");
  if (button) button.disabled = phrase !== OWNER_ERASURE_CONFIRMATION || !understood;
}

async function executeErasure() {
  const phrase = document.getElementById("dataErasurePhrase")?.value || "";
  const understood = document.getElementById("dataErasureIrreversible")?.checked === true;
  if (phrase !== OWNER_ERASURE_CONFIRMATION || !understood) {
    setStatus("Die exakte Löschbestätigung fehlt.", "error");
    return;
  }
  if (!window.confirm(
    "Letzte Bestätigung: Alle ownergebundenen Human-Holo-Daten auf dem Server und anschließend auf diesem Gerät unwiderruflich löschen?"
  )) return;

  setBusy(true);
  let serverErased = false;
  setStatus("Serverdaten werden in einer vollständigen Transaktion gelöscht …");
  try {
    const result = await post("/data-rights/erasure/execute", {
      confirmation: phrase,
      understandIrreversible: true,
      exportOffered: true
    });
    if (result?.erased !== true) {
      throw new Error("Die vollständige Serverlöschung wurde nicht bestätigt.");
    }
    serverErased = true;
    setStatus("Serverlöschung bestätigt · lokale ownergebundene Daten werden entfernt …");
    const local = await eraseLocalOwnerData();
    document.getElementById("dataErasurePreview")?.setAttribute("hidden", "");
    setStatus(
      local.complete
        ? "Alle erfassten Server- und Gerätedaten wurden gelöscht. Zugriffe bei Google und SmartThings müssen zusätzlich beim jeweiligen Anbieter widerrufen werden."
        : "Serverdaten wurden gelöscht. Mindestens ein lokaler Speicher war noch geöffnet; bitte die App vollständig schließen und die App-Daten in Android löschen. Anbieterzugriffe zusätzlich widerrufen.",
      local.complete ? "success" : "warning"
    );
  } catch (error) {
    setStatus(
      serverErased
        ? `Die Serverdaten wurden gelöscht, aber die lokale Löschung war nicht vollständig: ${error.message} Bitte App-Daten in Android löschen.`
        : `${error.message} Lokale Daten wurden nicht automatisch gelöscht.`,
      "error"
    );
  } finally {
    setBusy(false);
    updateDeleteButton();
  }
}

function installUi() {
  const privacy = document.getElementById("privacySecuritySettings");
  const links = privacy?.querySelector(".privacySecurityLinks");
  if (!privacy || !links || document.getElementById("dataRightsPanel")) return;

  const backup = document.createElement("button");
  backup.type = "button";
  backup.className = "actionRow";
  backup.dataset.rightsAction = "export";
  backup.dataset.dataRightsAction = "export";
  backup.innerHTML = `
    <span class="rowIcon" aria-hidden="true">⇩</span>
    <span class="rowText"><span class="rowTitle">Meine Daten exportieren</span>
    <span class="rowMeta">Vor einer Löschung verschlüsselt sichern</span></span>
    <span class="rowChevron" aria-hidden="true">›</span>`;
  backup.addEventListener("click", openBackup);

  const previewButton = document.createElement("button");
  previewButton.type = "button";
  previewButton.className = "actionRow dangerRow";
  previewButton.dataset.rightsAction = "preview";
  previewButton.dataset.dataRightsAction = "preview";
  previewButton.innerHTML = `
    <span class="rowIcon" aria-hidden="true">⌫</span>
    <span class="rowText"><span class="rowTitle">Alle meine Daten löschen</span>
    <span class="rowMeta">Umfang zuerst prüfen · danach doppelt bestätigen</span></span>
    <span class="rowChevron" aria-hidden="true">›</span>`;
  previewButton.addEventListener("click", () => void previewErasure());
  links.append(backup, previewButton);

  const panel = document.createElement("section");
  panel.id = "dataRightsPanel";
  panel.className = "dataRightsPanel";
  panel.innerHTML = `
    <div id="dataErasurePreview" class="dataErasurePreview" hidden>
      <h4>Unwiderrufliche Gesamtlöschung</h4>
      <p id="dataErasureCount"></p>
      <p>Die Löschung umfasst das ownergebundene Servergedächtnis, Tokens, Freigaben und – nach bestätigter Serverlöschung – die bekannten lokalen Holo-Speicher. Kopien bei externen Anbietern können nur dort widerrufen oder gelöscht werden.</p>
      <button id="dataErasureBackup" class="memoryCompactButton" type="button"
        data-rights-action="export">Zuerst verschlüsselte Kopie speichern</button>
      <label for="dataErasurePhrase">Tippe zur Bestätigung exakt:</label>
      <code>${OWNER_ERASURE_CONFIRMATION}</code>
      <input id="dataErasurePhrase" type="text" autocomplete="off"
        spellcheck="false" aria-describedby="dataErasureCount">
      <label class="memoryAcknowledgement">
        <input id="dataErasureIrreversible" type="checkbox">
        <span>Ich verstehe, dass diese Daten nicht wiederhergestellt werden können.</span>
      </label>
      <button id="dataErasureExecute" class="dataErasureExecute" type="button"
        data-rights-action="erase" disabled>Jetzt alle Daten endgültig löschen</button>
    </div>
    <p id="dataRightsStatus" class="dataRightsStatus" role="status"
      aria-live="polite"></p>`;
  privacy.appendChild(panel);
  document.getElementById("dataErasureBackup")?.addEventListener("click", openBackup);
  document.getElementById("dataErasurePhrase")?.addEventListener("input", updateDeleteButton);
  document.getElementById("dataErasureIrreversible")?.addEventListener("change", updateDeleteButton);
  document.getElementById("dataErasureExecute")?.addEventListener("click", () => {
    void executeErasure();
  });
}

installUi();

window.HumanHoloDataRights = Object.freeze({
  previewErasure,
  confirmationPhrase: OWNER_ERASURE_CONFIRMATION
});
