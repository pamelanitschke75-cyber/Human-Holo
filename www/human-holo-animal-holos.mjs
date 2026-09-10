/*
 * Human Holo Animal Holos UI
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2026 Pamela Nitschke
 */
import {
  ANIMAL_HOLO_SAFETY,
  addAnimalHoloObservation,
  addAnimalHoloProfile,
  animalHoloPromptContext,
  animalHoloStorageKey,
  markAnimalHoloObservationSynced,
  normalizeAnimalHoloState,
  serializeAnimalHoloState
} from "./human-holo-animal-core.mjs";

const BACKEND_URL = "https://sol-holo.onrender.com";
let animalState = null;
let selectedProfileId = "";
let syncing = false;

function currentIdentity() {
  return window.SolHoloIdentity?.selected?.() || null;
}

function requireIdentity() {
  const identity = currentIdentity();
  if (!identity?.ownerId || !identity?.speakerId) {
    window.SolHoloIdentity?.require?.();
    throw new Error("Die feste persönliche Holo-ID ist noch nicht verfügbar.");
  }
  return identity;
}

function loadState() {
  const identity = requireIdentity();
  const key = animalHoloStorageKey(identity.ownerId);
  animalState = normalizeAnimalHoloState(localStorage.getItem(key), {
    ownerId: identity.ownerId,
    includePamStarterProfiles: identity.ownerId === "pam-sol"
  });
  if (
    !selectedProfileId ||
    !animalState.profiles.some((profile) => profile.id === selectedProfileId)
  ) {
    selectedProfileId = animalState.profiles[0]?.id || "";
  }
  persistState();
  return animalState;
}

function persistState() {
  if (!animalState) return;
  const identity = currentIdentity();
  if (!identity?.ownerId || animalState.ownerId !== identity.ownerId) {
    throw new Error("Tier-Holo-Speicher und Owner-ID stimmen nicht überein.");
  }
  localStorage.setItem(
    animalHoloStorageKey(identity.ownerId),
    serializeAnimalHoloState(animalState)
  );
  window.dispatchEvent(
    new CustomEvent("human-holo:animal-memory-saved", {
      detail: { ownerId: identity.ownerId }
    })
  );
}

function profileLabel(profile) {
  return profile.nicknames.length
    ? profile.name + " (" + profile.nicknames.join(", ") + ")"
    : profile.name;
}

function profileIcon(profile) {
  return profile.species.toLocaleLowerCase("de-DE").includes("hund")
    ? "🐕"
    : "🐾";
}

function setStatus(message, kind = "info") {
  const status = document.getElementById("animalHoloStatus");
  if (!status) return;
  status.textContent = String(message || "");
  status.dataset.kind = kind;
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "medium"
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function renderProfileButtons() {
  const list = document.getElementById("animalHoloProfiles");
  if (!list || !animalState) return;
  list.replaceChildren();
  for (const profile of animalState.profiles) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "animalHoloProfileButton";
    button.dataset.selected = String(profile.id === selectedProfileId);
    button.setAttribute(
      "aria-pressed",
      String(profile.id === selectedProfileId)
    );
    const icon = document.createElement("span");
    icon.className = "animalHoloProfileIcon";
    icon.textContent = profileIcon(profile);
    const label = document.createElement("span");
    label.textContent = profileLabel(profile);
    button.append(icon, label);
    button.addEventListener("click", () => {
      selectedProfileId = profile.id;
      render();
    });
    list.append(button);
  }
}

function appendListItem(list, textValue, className = "") {
  const item = document.createElement("li");
  if (className) item.className = className;
  item.textContent = textValue;
  list.append(item);
}

function renderSelectedProfile() {
  const container = document.getElementById("animalHoloSelected");
  const askButton = document.getElementById("animalHoloAsk");
  if (!container || !animalState) return;
  container.replaceChildren();
  const profile = animalState.profiles.find(
    (candidate) => candidate.id === selectedProfileId
  );
  if (!profile) {
    const empty = document.createElement("p");
    empty.className = "animalHoloEmpty";
    empty.textContent =
      "Lege dein erstes Tier-Holo an. Es werden nur deine bestätigten Beobachtungen gespeichert.";
    container.append(empty);
    if (askButton) askButton.hidden = true;
    return;
  }

  const heading = document.createElement("div");
  heading.className = "animalHoloHeading";
  const icon = document.createElement("span");
  icon.className = "animalHoloLargeIcon";
  icon.textContent = profileIcon(profile);
  const titleBlock = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = profileLabel(profile);
  const meta = document.createElement("p");
  meta.textContent = [profile.species, profile.breed, profile.projectName]
    .filter(Boolean)
    .join(" · ");
  titleBlock.append(title, meta);
  heading.append(icon, titleBlock);
  container.append(heading);

  if (profile.summary) {
    const summary = document.createElement("p");
    summary.className = "animalHoloSummary";
    summary.textContent = profile.summary;
    container.append(summary);
  }

  const factsTitle = document.createElement("h4");
  factsTitle.textContent = "Bestätigte Grundlagen";
  const facts = document.createElement("ul");
  facts.className = "animalHoloFactList";
  for (const fact of profile.baselineFacts) appendListItem(facts, fact);
  container.append(factsTitle, facts);

  const observationsTitle = document.createElement("h4");
  observationsTitle.textContent = "Gespeicherte Beobachtungen";
  const observations = document.createElement("ol");
  observations.className = "animalHoloObservationList";
  if (!profile.observations.length) {
    appendListItem(
      observations,
      "Noch keine zusätzliche Beobachtung hinterlegt.",
      "animalHoloEmpty"
    );
  } else {
    for (const observation of [...profile.observations].reverse()) {
      const suffix = observation.observedAt
        ? " · " + formatDate(observation.observedAt)
        : "";
      const sync =
        observation.syncState === "synced"
          ? " · im Vollzeitgedächtnis"
          : " · lokal gespeichert, Synchronisierung vorgemerkt";
      appendListItem(observations, observation.text + suffix + sync);
    }
  }
  container.append(observationsTitle, observations);

  if (askButton) {
    askButton.hidden = false;
    askButton.dataset.solPrompt =
      "Was weißt du über das Tier-Holo von " +
      profileLabel(profile) +
      "? Nutze nur bestätigte Beobachtungen und beachte die Tier-Holo-Sicherheitsgrenzen.";
  }
}

function render() {
  renderProfileButtons();
  renderSelectedProfile();
  const select = document.getElementById("animalHoloObservationProfile");
  if (select && animalState) {
    select.replaceChildren();
    for (const profile of animalState.profiles) {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profileLabel(profile);
      option.selected = profile.id === selectedProfileId;
      select.append(option);
    }
  }
  const count = animalState?.profiles.reduce(
    (total, profile) => total + profile.observations.length,
    0
  ) || 0;
  const badge = document.getElementById("animalHoloMemoryBadge");
  if (badge) {
    badge.textContent =
      "Always-on: " +
      count +
      " Beobachtung" +
      (count === 1 ? "" : "en") +
      " automatisch gespeichert";
  }
}

function openAnimalHolos() {
  try {
    loadState();
  } catch (error) {
    setStatus(error.message, "error");
    return;
  }
  const overlay = document.getElementById("animalHoloOverlay");
  if (!overlay) return;
  overlay.hidden = false;
  document.body.classList.add("animalHoloOpen");
  render();
  document.getElementById("animalHoloClose")?.focus();
  void flushPendingObservations();
}

function closeAnimalHolos() {
  const overlay = document.getElementById("animalHoloOverlay");
  if (!overlay) return;
  overlay.hidden = true;
  document.body.classList.remove("animalHoloOpen");
  setStatus("");
  document.getElementById("openAnimalHolosButton")?.focus();
}

function sourceEventId(profile, observation) {
  return (
    "animal_holo_" + profile.id + "_" + observation.id + "_memory"
  )
    .replace(/[^a-zA-Z0-9:_-]/gu, "_")
    .slice(0, 160);
}

async function syncObservation(profile, observation) {
  if (observation.syncState === "synced") return true;
  const identity = currentIdentity();
  if (!identity || identity.ownerId !== animalState?.ownerId) return false;
  const ensure = window.SolHoloTrustedSession?.ensure;
  if (typeof ensure !== "function") return false;

  let trusted;
  try {
    trusted = await ensure({ interactive: false });
  } catch {
    return false;
  }
  if (!trusted?.trusted) return false;

  const response = await fetch(BACKEND_URL + "/fulltime/history/append", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(window.SolHoloTrustedSession?.headers?.() || {})
    },
    cache: "no-store",
    body: JSON.stringify({
      selectedSpeakerId: identity.speakerId,
      ownerId: identity.ownerId,
      sourceEventId: sourceEventId(profile, observation),
      messages: [
        {
          role: "user",
          content:
            "Bestätigte Tier-Holo-Beobachtung zu " +
            profileLabel(profile) +
            ": " +
            observation.text
        }
      ]
    })
  });
  if (!response.ok) return false;
  animalState = markAnimalHoloObservationSynced(
    animalState,
    profile.id,
    observation.id
  );
  persistState();
  return true;
}

async function flushPendingObservations() {
  if (syncing || !animalState) return;
  syncing = true;
  let synchronized = 0;
  try {
    for (const profile of animalState.profiles) {
      for (const observation of profile.observations) {
        if (observation.syncState === "synced") continue;
        try {
          if (await syncObservation(profile, observation)) synchronized += 1;
        } catch {
          // Lokal gespeicherte Beobachtungen bleiben zur sicheren Wiederholung
          // als pending erhalten. Es gibt keinen stillen Datenverlust.
        }
      }
    }
    if (synchronized > 0) {
      setStatus(
        synchronized +
          " Beobachtung" +
          (synchronized === 1 ? "" : "en") +
          " zusätzlich ins ownergebundene Vollzeitgedächtnis übernommen.",
        "success"
      );
      render();
    }
  } finally {
    syncing = false;
  }
}

function installStyle() {
  if (document.getElementById("animalHoloStyles")) return;
  const style = document.createElement("style");
  style.id = "animalHoloStyles";
  style.textContent = [
    "body.animalHoloOpen{overflow:hidden}",
    ".animalHoloOverlay{position:fixed;inset:0;z-index:2147481000;background:rgba(2,7,20,.82);backdrop-filter:blur(18px);padding:env(safe-area-inset-top) 12px env(safe-area-inset-bottom);overflow:auto}",
    ".animalHoloOverlay[hidden]{display:none!important}",
    ".animalHoloDialog{width:min(720px,100%);min-height:calc(100dvh - 24px);margin:12px auto;padding:18px;border:1px solid rgba(116,232,255,.45);border-radius:30px;background:linear-gradient(155deg,rgba(30,30,95,.97),rgba(8,16,51,.98));box-shadow:0 22px 80px rgba(0,0,0,.55),0 0 36px rgba(127,75,255,.25);color:#f8f6ff}",
    ".animalHoloHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}",
    ".animalHoloHeader h2{margin:.15rem 0 0;font-size:clamp(1.55rem,6vw,2rem)}",
    ".animalHoloEyebrow{margin:0;color:#72ecff;font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:.75rem}",
    ".animalHoloClose{min-width:44px;min-height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:white;font-size:1.6rem}",
    ".animalHoloLead{color:#d9d5ef;line-height:1.55}",
    ".animalHoloMemoryBadge{display:inline-flex;margin:.25rem 0 1rem;padding:.55rem .8rem;border-radius:999px;background:rgba(57,222,194,.15);border:1px solid rgba(57,222,194,.45);color:#78f4d6;font-weight:750;font-size:.82rem}",
    ".animalHoloProfiles{display:flex;gap:8px;overflow:auto;padding:4px 0 12px;scrollbar-width:none}",
    ".animalHoloProfileButton{flex:0 0 auto;display:flex;align-items:center;gap:7px;border:1px solid rgba(151,125,255,.42);border-radius:999px;padding:.65rem .9rem;background:rgba(255,255,255,.06);color:#ece8ff;font-weight:750}",
    ".animalHoloProfileButton[data-selected=true]{border-color:#60e9ff;background:linear-gradient(110deg,rgba(171,72,255,.4),rgba(43,196,255,.28));box-shadow:0 0 20px rgba(92,209,255,.2)}",
    ".animalHoloSelected,.animalHoloFormCard,.animalHoloSafety{border:1px solid rgba(176,150,255,.25);border-radius:22px;background:rgba(255,255,255,.055);padding:15px;margin:0 0 14px}",
    ".animalHoloHeading{display:flex;align-items:center;gap:12px}",
    ".animalHoloLargeIcon{font-size:2.5rem;filter:drop-shadow(0 0 12px rgba(97,231,255,.35))}",
    ".animalHoloHeading h3{margin:0;font-size:1.35rem}",
    ".animalHoloHeading p{margin:.25rem 0 0;color:#bcb6dc}",
    ".animalHoloSummary{line-height:1.5;color:#e7e3f7}",
    ".animalHoloSelected h4{margin:1rem 0 .45rem;color:#7eeeff}",
    ".animalHoloFactList,.animalHoloObservationList{margin:.2rem 0 0;padding-left:1.3rem;display:grid;gap:.55rem;line-height:1.42}",
    ".animalHoloObservationList li{padding:.55rem .65rem;border-radius:12px;background:rgba(4,9,31,.38)}",
    ".animalHoloEmpty{color:#aaa4c7;font-style:italic}",
    ".animalHoloSafety{border-color:rgba(255,194,87,.38);background:rgba(255,155,48,.08);line-height:1.48}",
    ".animalHoloSafety strong{display:block;color:#ffd889;margin-bottom:.35rem}",
    ".animalHoloFormCard h3{margin:.1rem 0 .8rem}",
    ".animalHoloFormCard label{display:grid;gap:.35rem;margin:.7rem 0;color:#e9e5f7;font-weight:700}",
    ".animalHoloFormCard textarea,.animalHoloFormCard input,.animalHoloFormCard select{box-sizing:border-box;width:100%;border:1px solid rgba(151,125,255,.42);border-radius:13px;padding:.78rem .85rem;background:rgba(2,7,24,.66);color:white;font:inherit}",
    ".animalHoloConfirm{grid-template-columns:auto 1fr!important;align-items:start;font-weight:500!important;line-height:1.4}",
    ".animalHoloConfirm input{width:20px!important;height:20px;margin-top:.05rem}",
    ".animalHoloActions{display:flex;flex-wrap:wrap;gap:9px;margin-top:12px}",
    ".animalHoloActions button{flex:1 1 190px;min-height:46px;border-radius:15px;border:1px solid rgba(113,226,255,.48);background:linear-gradient(110deg,rgba(155,65,255,.55),rgba(35,184,255,.4));color:white;font-weight:800;padding:.75rem}",
    ".animalHoloActions .secondary{background:rgba(255,255,255,.06)}",
    ".animalHoloStatus{min-height:1.4rem;white-space:pre-wrap;line-height:1.4;color:#cfc9e7}",
    ".animalHoloStatus[data-kind=success]{color:#77f1d2}",
    ".animalHoloStatus[data-kind=error]{color:#ff9eaf}",
    ".animalHoloNewProfile[hidden]{display:none!important}",
    "@media (max-width:480px){.animalHoloOverlay{padding-left:6px;padding-right:6px}.animalHoloDialog{margin:6px auto;padding:14px;border-radius:24px}.animalHoloActions button{flex-basis:100%}}"
  ].join("\n");
  document.head.append(style);
}

function installMarkup() {
  if (document.getElementById("animalHoloOverlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "animalHoloOverlay";
  overlay.className = "animalHoloOverlay";
  overlay.hidden = true;
  overlay.innerHTML = [
    '<section class="animalHoloDialog" role="dialog" aria-modal="true" aria-labelledby="animalHoloTitle">',
    '<header class="animalHoloHeader"><div>',
    '<p class="animalHoloEyebrow">Human Holo · Erinnerungen</p>',
    '<h2 id="animalHoloTitle">Tier-Holos 🐾💚</h2>',
    '</div><button id="animalHoloClose" class="animalHoloClose" type="button" aria-label="Tier-Holos schließen">×</button></header>',
    '<p class="animalHoloLead">Eigene Profile für Tiere, ihre Geschichten und bestätigte Beobachtungen. Jeder Eintrag wird sofort ownergebunden auf diesem Gerät gespeichert und bei verfügbarer sicherer App-Sitzung zusätzlich ins Vollzeitgedächtnis übernommen.</p>',
    '<div id="animalHoloMemoryBadge" class="animalHoloMemoryBadge">Always-on aktiv</div>',
    '<nav id="animalHoloProfiles" class="animalHoloProfiles" aria-label="Tier-Holo-Profile"></nav>',
    '<section id="animalHoloSelected" class="animalHoloSelected" aria-live="polite"></section>',
    '<aside class="animalHoloSafety"><strong>Unverrückbare Sicherheitsgrenze ☝️</strong>',
    '<span>Kinder und Tiere niemals allein oder unbeaufsichtigt lassen. Auch Salt und Peps’ gelassener Umgang mit unkontrollierten Bewegungen sehr kleiner Kinder ist eine bestätigte Beobachtung, aber niemals eine Sicherheitsgarantie. Rückzug und Tierwohl haben Vorrang.</span></aside>',
    '<form id="animalHoloObservationForm" class="animalHoloFormCard">',
    '<h3>Beobachtung hinterlegen</h3>',
    '<label>Tier-Holo<select id="animalHoloObservationProfile" required></select></label>',
    '<label>Was hast du selbst beobachtet?<textarea id="animalHoloObservationText" rows="3" maxlength="2000" required placeholder="Zum Beispiel: Salt zieht sich zurück, wenn es ihr zu lebhaft wird."></textarea></label>',
    '<label>Datum, wenn bekannt<input id="animalHoloObservationDate" type="date"></label>',
    '<label class="animalHoloConfirm"><input id="animalHoloObservationConfirmed" type="checkbox" required><span>Ich bestätige, dass dies meine Beobachtung ist. Keine erfundenen Gedanken oder Aussagen des Tieres.</span></label>',
    '<div class="animalHoloActions"><button type="submit">Sofort speichern</button>',
    '<button id="animalHoloAsk" class="secondary" type="button">Mit Pam’s Holo besprechen</button></div>',
    '</form>',
    '<section id="animalHoloNewProfile" class="animalHoloNewProfile animalHoloFormCard" hidden>',
    '<h3>Weiteres Tier-Holo anlegen</h3>',
    '<form id="animalHoloProfileForm">',
    '<label>Name<input id="animalHoloProfileName" maxlength="120" required></label>',
    '<label>Tierart<input id="animalHoloProfileSpecies" maxlength="80" required placeholder="Hund, Katze …"></label>',
    '<label>Rasse, wenn bekannt<input id="animalHoloProfileBreed" maxlength="120"></label>',
    '<div class="animalHoloActions"><button type="submit">Tier-Holo anlegen</button>',
    '<button id="animalHoloCancelProfile" class="secondary" type="button">Abbrechen</button></div>',
    '</form></section>',
    '<div class="animalHoloActions"><button id="animalHoloAddProfile" class="secondary" type="button">+ Weiteres Tier-Holo</button></div>',
    '<p id="animalHoloStatus" class="animalHoloStatus" role="status" aria-live="polite"></p>',
    '</section>'
  ].join("");
  document.body.append(overlay);

  document.getElementById("animalHoloClose")?.addEventListener(
    "click",
    closeAnimalHolos
  );
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeAnimalHolos();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeAnimalHolos();
  });

  document.getElementById("animalHoloAsk")?.addEventListener("click", () => {
    closeAnimalHolos();
  });

  document.getElementById("animalHoloObservationProfile")?.addEventListener(
    "change",
    (event) => {
      selectedProfileId = event.target.value;
      render();
    }
  );

  document.getElementById("animalHoloObservationForm")?.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();
      try {
        loadState();
        const profileId =
          document.getElementById("animalHoloObservationProfile")?.value || "";
        const content =
          document.getElementById("animalHoloObservationText")?.value || "";
        const date =
          document.getElementById("animalHoloObservationDate")?.value || "";
        const confirmed =
          document.getElementById("animalHoloObservationConfirmed")?.checked;
        if (!confirmed) {
          throw new Error("Bitte bestätige zuerst, dass dies deine Beobachtung ist.");
        }
        const result = addAnimalHoloObservation(
          animalState,
          profileId,
          {
            text: content,
            observedAt: date ? date + "T12:00:00.000Z" : "",
            source: "owner_observation",
            syncState: "pending"
          }
        );
        if (result.duplicate) {
          setStatus("Diese Beobachtung ist bereits gespeichert.");
          return;
        }
        animalState = result.state;
        selectedProfileId = profileId;
        persistState();
        event.currentTarget.reset();
        render();
        setStatus(
          "Sofort lokal gespeichert. Die verschlüsselte Sicherung nimmt den Eintrag mit; die ownergebundene Vollzeit-Synchronisierung läuft.",
          "success"
        );
        const profile = animalState.profiles.find(
          (candidate) => candidate.id === profileId
        );
        if (profile) await syncObservation(profile, result.observation);
        render();
      } catch (error) {
        setStatus(error.message, "error");
      }
    }
  );

  const profilePanel = document.getElementById("animalHoloNewProfile");
  document.getElementById("animalHoloAddProfile")?.addEventListener(
    "click",
    () => {
      profilePanel.hidden = false;
      document.getElementById("animalHoloProfileName")?.focus();
    }
  );
  document.getElementById("animalHoloCancelProfile")?.addEventListener(
    "click",
    () => {
      profilePanel.hidden = true;
    }
  );
  document.getElementById("animalHoloProfileForm")?.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      try {
        loadState();
        animalState = addAnimalHoloProfile(animalState, {
          name: document.getElementById("animalHoloProfileName")?.value,
          species: document.getElementById("animalHoloProfileSpecies")?.value,
          breed: document.getElementById("animalHoloProfileBreed")?.value,
          summary:
            "Dieses Tier-Holo enthält ausschließlich bestätigte Beobachtungen seines Menschen."
        });
        selectedProfileId = animalState.profiles.at(-1)?.id || "";
        persistState();
        event.currentTarget.reset();
        profilePanel.hidden = true;
        render();
        setStatus("Neues Tier-Holo ownergebunden angelegt.", "success");
      } catch (error) {
        setStatus(error.message, "error");
      }
    }
  );
}

function installOpenButton() {
  if (document.getElementById("openAnimalHolosButton")) return;
  const actionList = document.querySelector("#memoryView .actionList");
  if (!actionList) return;
  const button = document.createElement("button");
  button.id = "openAnimalHolosButton";
  button.className = "actionRow";
  button.type = "button";

  const icon = document.createElement("span");
  icon.className = "rowIcon memoryRowIcon";
  icon.textContent = "🐾";
  const textBlock = document.createElement("span");
  textBlock.className = "rowText";
  const title = document.createElement("span");
  title.className = "rowTitle";
  title.textContent = "Tier-Holos";
  const meta = document.createElement("span");
  meta.className = "rowMeta";
  meta.textContent = "Salt, Pepper (Peps), Tina und weitere Tiere";
  textBlock.append(title, meta);
  const chevron = document.createElement("span");
  chevron.className = "rowChevron";
  chevron.textContent = "›";
  button.append(icon, textBlock, chevron);
  button.addEventListener("click", openAnimalHolos);
  actionList.append(button);
}

function install() {
  installStyle();
  installMarkup();
  installOpenButton();
  window.addEventListener("online", () => {
    try {
      loadState();
      void flushPendingObservations();
    } catch {}
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    try {
      loadState();
      void flushPendingObservations();
    } catch {}
  });
  window.HumanHoloAnimalHolos = Object.freeze({
    open: openAnimalHolos,
    state: () => (animalState ? JSON.parse(serializeAnimalHoloState(animalState)) : null),
    context: (profileId = "") =>
      animalHoloPromptContext(loadState(), profileId),
    flush: flushPendingObservations
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", install, { once: true });
} else {
  install();
}
