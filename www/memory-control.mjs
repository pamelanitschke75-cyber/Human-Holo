const BACKEND_URL =
  globalThis.HumanHoloBackend?.baseUrl ||
  "https://human-holo-backend.invalid";
const MEMORY_DELETE_CONFIRMATION =
  "DIESE ERINNERUNG ENDGÜLTIG LÖSCHEN";

const state = {
  status: null,
  memories: [],
  busy: false
};

function selectedIdentity() {
  const identity = window.SolHoloIdentity?.selected?.();
  return identity?.ownerId && identity?.speakerId ? identity : null;
}

function setMessage(message, kind = "info") {
  const element = document.getElementById("personalMemoryControlStatus");
  if (!element) return;
  element.textContent = String(message || "");
  element.dataset.kind = kind;
}

function setBusy(busy) {
  state.busy = Boolean(busy);
  document
    .querySelectorAll("[data-personal-memory-action]")
    .forEach(button => {
      button.disabled = state.busy;
    });
  document.getElementById("personalMemoryControls")?.setAttribute(
    "aria-busy",
    String(state.busy)
  );
}

async function trustedIdentity({ interactive = true } = {}) {
  const identity = selectedIdentity();
  if (!identity) {
    window.SolHoloIdentity?.require?.();
    throw new Error("Die feste persönliche Holo-ID ist nicht verfügbar.");
  }
  const session = await window.SolHoloTrustedSession?.ensure?.({ interactive });
  if (!session?.trusted) {
    throw new Error("Die sichere App-Sitzung wurde nicht bestätigt.");
  }
  return identity;
}

async function postMemory(path, body = {}, options = {}) {
  const identity = await trustedIdentity(options);
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...window.SolHoloTrustedSession.headers()
    },
    body: JSON.stringify({
      selectedSpeakerId: identity.speakerId,
      ownerId: identity.ownerId,
      ...body
    }),
    cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      String(data?.error || "Die Gedächtnisverwaltung ist gerade nicht verfügbar.")
    );
  }
  return data;
}

function preferenceElements() {
  return {
    confirmedOnly: document.getElementById("memoryModeConfirmedOnly"),
    personalized: document.getElementById("memoryModePersonalized"),
    paused: document.getElementById("memoryPauseToggle"),
    acknowledgement: document.getElementById("memoryAutomaticAcknowledgement")
  };
}

function renderProfileStatus(preferences) {
  const profileState = document.getElementById("profileMemoryState");
  if (!profileState) return;
  if (preferences?.paused) {
    profileState.textContent = "Pausiert · nichts Neues dauerhaft";
  } else if (preferences?.mode === "personalized") {
    const count = Array.isArray(preferences.autoCategories)
      ? preferences.autoCategories.length
      : 0;
    profileState.textContent = `Persönlich · ${count} Kategorien freigegeben`;
  } else {
    profileState.textContent = "Nur auf Zuruf · Rohprotokolle aus";
  }
}

function renderPreferences() {
  const preferences = state.status?.preferences || {
    mode: "confirmed_only",
    paused: false,
    autoCategories: []
  };
  const elements = preferenceElements();
  if (elements.confirmedOnly) {
    elements.confirmedOnly.checked = preferences.mode !== "personalized";
  }
  if (elements.personalized) {
    elements.personalized.checked = preferences.mode === "personalized";
  }
  if (elements.paused) elements.paused.checked = preferences.paused === true;
  if (elements.acknowledgement) elements.acknowledgement.checked = false;

  const selected = new Set(preferences.autoCategories || []);
  document.querySelectorAll("[data-memory-category]").forEach(input => {
    input.checked = selected.has(input.dataset.memoryCategory);
    input.disabled = preferences.mode !== "personalized";
  });
  document.getElementById("memoryCategoryChoices")?.toggleAttribute(
    "data-disabled",
    preferences.mode !== "personalized"
  );
  renderProfileStatus(preferences);
}

function dateLabel(value) {
  const date = new Date(value || "");
  if (!Number.isFinite(date.getTime())) return "Zeitpunkt unbekannt";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function categoryLabel(id) {
  return state.status?.categories?.find(item => item.id === id)?.label ||
    "Sonstiges";
}

function memoryValue(memory, camel, snake) {
  return memory?.[camel] ?? memory?.[snake];
}

function actionButton(label, action, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `memoryItemAction ${className}`.trim();
  button.textContent = label;
  button.dataset.personalMemoryAction = action;
  return button;
}

function renderMemories() {
  const list = document.getElementById("personalMemoryList");
  if (!list) return;
  list.replaceChildren();
  if (!state.memories.length) {
    const empty = document.createElement("p");
    empty.className = "personalMemoryEmpty";
    empty.textContent =
      "Keine passenden strukturierten Erinnerungen gefunden. Bestehende alte Gesprächsverläufe bleiben davon getrennt erhalten.";
    list.appendChild(empty);
    return;
  }

  for (const memory of state.memories) {
    const id = Number(memory.id);
    const recallStatus = memoryValue(memory, "recallStatus", "recall_status") ||
      "active";
    const captureMode = memoryValue(memory, "captureMode", "capture_mode") ||
      "explicit";
    const category = memoryValue(memory, "memoryCategory", "memory_category") ||
      "other";
    const article = document.createElement("article");
    article.className = "personalMemoryItem";
    if (recallStatus === "blocked") article.dataset.blocked = "true";

    const content = document.createElement("p");
    content.className = "personalMemoryContent";
    content.textContent = String(memory.content || "");

    const meta = document.createElement("p");
    meta.className = "personalMemoryMeta";
    meta.textContent = [
      categoryLabel(category),
      captureMode === "automatic" ? "automatisch erkannt" :
        captureMode === "import" ? "importiert" : "ausdrücklich gemerkt",
      recallStatus === "blocked" ? "für Abruf gesperrt" : "für Abruf aktiv",
      dateLabel(memoryValue(memory, "confirmedAt", "confirmed_at"))
    ].join(" · ");

    const actions = document.createElement("div");
    actions.className = "personalMemoryItemActions";
    const visibilityButton = actionButton(
      recallStatus === "blocked" ? "Wieder einblenden" : "Ausblenden",
      "recall"
    );
    visibilityButton.addEventListener("click", () => {
      void setRecallStatus(id, recallStatus === "blocked" ? "active" : "blocked");
    });
    const correctionButton = actionButton("Korrigieren", "correct");
    correctionButton.addEventListener("click", () => void correctMemory(memory));
    const deleteButton = actionButton("Endgültig löschen", "delete", "danger");
    deleteButton.addEventListener("click", () => void deleteMemory(memory));
    actions.append(visibilityButton, correctionButton, deleteButton);
    article.append(content, meta, actions);
    list.appendChild(article);
  }
}

async function loadStatusAndMemories({ interactive = true } = {}) {
  setBusy(true);
  setMessage("Sichere Gedächtnisverwaltung wird geladen …");
  try {
    const searchText = document.getElementById("personalMemorySearch")?.value || "";
    const [status, list] = await Promise.all([
      postMemory("/memory/control/status", {}, { interactive }),
      postMemory(
        "/memory/control/list",
        { searchText, includeBlocked: true, limit: 100 },
        { interactive }
      )
    ]);
    state.status = status;
    state.memories = Array.isArray(list.memories) ? list.memories : [];
    renderCategoryChoices();
    renderPreferences();
    renderMemories();
    setMessage(
      `${state.memories.length} strukturierte Erinnerungen angezeigt · alte Rohverläufe bleiben getrennt und werden nicht verändert.`,
      "success"
    );
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    setBusy(false);
  }
}

function renderCategoryChoices() {
  const container = document.getElementById("memoryCategoryChoices");
  if (!container || container.childElementCount) return;
  for (const category of state.status?.categories || []) {
    if (category.automatic !== true) continue;
    const label = document.createElement("label");
    label.className = "memoryCategoryChoice";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.memoryCategory = category.id;
    const text = document.createElement("span");
    text.textContent = category.label;
    label.append(input, text);
    container.appendChild(label);
  }
}

async function savePreferences() {
  const elements = preferenceElements();
  const mode = elements.personalized?.checked ? "personalized" : "confirmed_only";
  const autoCategories = [...document.querySelectorAll("[data-memory-category]:checked")]
    .map(input => input.dataset.memoryCategory);
  if (mode === "personalized" && !autoCategories.length) {
    setMessage("Wähle mindestens eine persönliche Kategorie aus.", "error");
    return;
  }
  if (!elements.acknowledgement?.checked) {
    setMessage("Bitte bestätige die Erklärung zur dauerhaften Speicherung.", "error");
    return;
  }
  setBusy(true);
  try {
    const data = await postMemory("/memory/control/preferences", {
      mode,
      paused: elements.paused?.checked === true,
      autoCategories,
      acknowledged: true
    });
    state.status = { ...state.status, preferences: data.preferences };
    renderPreferences();
    setMessage(
      data.preferences.paused
        ? "Gedächtnis pausiert. Neue dauerhafte Erinnerungen werden nicht angelegt."
        : mode === "personalized"
          ? "Persönliches Gedächtnis gespeichert. Nur die gewählten Kategorien dürfen automatisch erkannt werden."
          : "Sicherer Standard aktiv: dauerhaft nur auf ausdrücklichen Zuruf.",
      "success"
    );
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function setRecallStatus(memoryId, status) {
  setBusy(true);
  try {
    await postMemory("/memory/control/recall-status", { memoryId, status });
    await loadStatusAndMemories({ interactive: false });
  } catch (error) {
    setMessage(error.message, "error");
    setBusy(false);
  }
}

async function correctMemory(memory) {
  const corrected = window.prompt(
    "Korrigiere die Erinnerung. Der alte Stand wird für den Abruf gesperrt und als Änderungshistorie erhalten:",
    String(memory.content || "")
  );
  if (corrected === null) return;
  const content = corrected.trim();
  if (!content || content === String(memory.content || "").trim()) {
    setMessage("Keine Änderung übernommen.");
    return;
  }
  setBusy(true);
  try {
    await postMemory("/memory/control/correct", {
      memoryId: memory.id,
      content,
      category: memoryValue(memory, "memoryCategory", "memory_category")
    });
    await loadStatusAndMemories({ interactive: false });
    setMessage("Erinnerung korrigiert · der frühere Stand bleibt gesperrt dokumentiert.", "success");
  } catch (error) {
    setMessage(error.message, "error");
    setBusy(false);
  }
}

async function deleteMemory(memory) {
  const confirmation = window.prompt(
    "Diese Löschung betrifft nur die strukturierte Erinnerung. Ein älterer Gesprächsverlauf kann denselben Inhalt weiterhin enthalten. Für alle Kopien nutze „Alle meine Daten löschen“.\n\nTippe exakt:\n" +
      MEMORY_DELETE_CONFIRMATION
  );
  if (confirmation !== MEMORY_DELETE_CONFIRMATION) {
    setMessage("Erinnerung nicht gelöscht: Bestätigung war nicht exakt.");
    return;
  }
  if (!window.confirm("Diese einzelne strukturierte Erinnerung jetzt unwiderruflich löschen?")) {
    return;
  }
  setBusy(true);
  try {
    await postMemory("/memory/control/delete", {
      memoryId: memory.id,
      confirmation,
      understandIrreversible: true
    });
    await loadStatusAndMemories({ interactive: false });
    setMessage("Die ausgewählte strukturierte Erinnerung wurde endgültig gelöscht.", "success");
  } catch (error) {
    setMessage(error.message, "error");
    setBusy(false);
  }
}

function installUi() {
  const intro = document.querySelector("#memoryView .memoryIntro");
  const actionList = document.querySelector("#memoryView .actionList");
  if (!intro || !actionList || document.getElementById("personalMemoryControls")) return;

  const controls = document.createElement("section");
  controls.id = "personalMemoryControls";
  controls.className = "personalMemoryControls glassCard";
  controls.setAttribute("aria-labelledby", "personalMemoryControlsTitle");
  controls.innerHTML = `
    <div class="personalMemoryControlHeader">
      <div>
        <p class="eyebrow">Du entscheidest</p>
        <h3 id="personalMemoryControlsTitle">Persönliches Gedächtnis</h3>
      </div>
      <button id="memoryControlsUnlock" class="memoryCompactButton" type="button"
        data-personal-memory-action="unlock">Sicher öffnen</button>
    </div>
    <div class="memoryArchitectureFacts">
      <p><strong>Bestehendes Gedächtnis</strong><span>bleibt erhalten und lesbar</span></p>
      <p><strong>Neue Rohprotokolle</strong><span>automatisch ausgeschaltet</span></p>
      <p><strong>Aktuelles Gespräch</strong><span>nur vorübergehender Kontext</span></p>
      <p><strong>Dauerhafte Fakten</strong><span>bestätigt oder granular freigegeben</span></p>
    </div>
    <fieldset class="memoryModeFieldset">
      <legend>Wie darf Human Holo künftig erinnern?</legend>
      <label class="memoryModeChoice">
        <input id="memoryModeConfirmedOnly" type="radio" name="personalMemoryMode"
          value="confirmed_only" checked>
        <span><strong>Nur auf Zuruf</strong>„Merk dir …“ speichert; normale Gespräche nicht.</span>
      </label>
      <label class="memoryModeChoice">
        <input id="memoryModePersonalized" type="radio" name="personalMemoryMode"
          value="personalized">
        <span><strong>Wichtige Erinnerungen automatisch</strong>Nur eindeutige eigene Fakten in einzeln gewählten Kategorien.</span>
      </label>
    </fieldset>
    <div id="memoryCategoryChoices" class="memoryCategoryChoices" data-disabled></div>
    <label class="memoryPauseChoice">
      <input id="memoryPauseToggle" type="checkbox">
      <span><strong>Gedächtnis pausieren</strong>Nichts Neues dauerhaft speichern – auch nicht auf Zuruf.</span>
    </label>
    <label class="memoryAcknowledgement">
      <input id="memoryAutomaticAcknowledgement" type="checkbox">
      <span>Ich habe verstanden, dass gewählte persönliche Angaben dauerhaft ownergebunden gespeichert werden, bis ich sie korrigiere oder lösche.</span>
    </label>
    <button id="memoryPreferencesSave" class="secondaryButton" type="button"
      data-personal-memory-action="save">Einstellung verbindlich speichern</button>
    <p class="memorySafetyNote">Sensible Angaben, Geheimnisse, Kontaktdaten und wiedergegebene Aussagen Dritter werden nie automatisch als persönliche Erinnerung übernommen.</p>
    <div class="personalMemoryManager">
      <h4>Gespeicherte Erinnerungen verwalten</h4>
      <form id="personalMemorySearchForm" class="personalMemorySearchForm">
        <label for="personalMemorySearch" class="visuallyHidden">Erinnerungen durchsuchen</label>
        <input id="personalMemorySearch" type="search" maxlength="240"
          placeholder="Erinnerungen durchsuchen …">
        <button type="submit" class="memoryCompactButton"
          data-personal-memory-action="search">Suchen</button>
      </form>
      <div id="personalMemoryList" class="personalMemoryList"></div>
      <p class="memoryDeletionBoundary">„Endgültig löschen“ entfernt genau diesen strukturierten Eintrag. Für sämtliche Server- und Gerätedaten gibt es unter Datenschutz &amp; Sicherheit eine getrennte Gesamtlöschung.</p>
    </div>
    <p id="personalMemoryControlStatus" class="personalMemoryControlStatus"
      role="status" aria-live="polite">Sicher öffnen, um Einstellungen und Erinnerungen zu laden.</p>`;
  actionList.before(controls);

  document.getElementById("memoryControlsUnlock")?.addEventListener("click", () => {
    void loadStatusAndMemories({ interactive: true });
  });
  document.getElementById("memoryPreferencesSave")?.addEventListener("click", () => {
    void savePreferences();
  });
  document.getElementById("personalMemorySearchForm")?.addEventListener("submit", event => {
    event.preventDefault();
    void loadStatusAndMemories({ interactive: true });
  });
  document.querySelectorAll('input[name="personalMemoryMode"]').forEach(input => {
    input.addEventListener("change", () => {
      const personalized = document.getElementById("memoryModePersonalized")?.checked === true;
      document.querySelectorAll("[data-memory-category]").forEach(category => {
        category.disabled = !personalized;
      });
      document.getElementById("memoryCategoryChoices")?.toggleAttribute(
        "data-disabled",
        !personalized
      );
    });
  });
}

installUi();

window.addEventListener("solholoidentitychange", () => {
  state.status = null;
  state.memories = [];
  renderMemories();
  setMessage("Identität gewechselt. Bitte sicher neu öffnen.");
});

window.addEventListener("solholo:trusted-session", () => {
  void loadStatusAndMemories({ interactive: false });
});

window.addEventListener("human-holo:automatic-memory", event => {
  if (event.detail?.saved === true) {
    void loadStatusAndMemories({ interactive: false });
  }
});

window.HumanHoloMemoryControl = Object.freeze({
  open: () => loadStatusAndMemories({ interactive: true }),
  refresh: () => loadStatusAndMemories({ interactive: false })
});
