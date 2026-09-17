/*
 * Human Holo Animal Holos UI
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2026 Pamela Nitschke
 */
import {
  ANIMAL_HOLO_CONVERSATION_REPLY,
  ANIMAL_HOLO_SAFETY,
  addAnimalHoloObservation,
  addAnimalHoloProfile,
  animalHoloObservationFromFulltimeMessage,
  animalHoloProposalFromAssistantAnswer,
  animalHoloPromptContext,
  animalHoloStorageKey,
  classifyAnimalHoloConversationReply,
  markAnimalHoloObservationSynced,
  normalizeAnimalHoloProposal,
  normalizeAnimalHoloState,
  serializeAnimalHoloState
} from "./human-holo-animal-core.mjs";

const BACKEND_URL = "https://sol-holo.onrender.com";
const PENDING_CONVERSATION_TTL_MS = 30 * 60 * 1000;
const PENDING_CONVERSATION_STORAGE_PREFIX =
  "human-holo-animal-conversation-pending-v1";
const ANIMAL_PHOTO_DATABASE = "human-holo-private-animal-media-v1";
const ANIMAL_PHOTO_STORE = "profilePhotos";
const MAX_LOCAL_PHOTO_INPUT_BYTES = 18 * 1024 * 1024;
const PAM_PREVIOUS_ANIMAL_PHOTO_FILES = Object.freeze({
  "1000114664": "salt",
  "1000113888": "pepper",
  "1000115450": "tina",
  "1000114215": "gurke",
  "1000114211": "moehrchen"
});
const ANIMAL_HOLO_PRIMARY_NAVIGATION = Object.freeze([
  "salt",
  "pepper",
  "tina"
]);
const ANIMAL_HOLO_DEFAULT_PHOTOS = Object.freeze({
  salt: new URL("./assets/animals/salt.webp", import.meta.url).href,
  pepper: new URL("./assets/animals/peps.webp", import.meta.url).href,
  tina: new URL("./assets/animals/tina.webp", import.meta.url).href,
  gurke: new URL("./assets/animals/gurke.webp", import.meta.url).href,
  moehrchen: new URL("./assets/animals/moehrchen.webp", import.meta.url).href
});
const HOLO_ICON_SVGS = Object.freeze({
  paw: [
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
    '<ellipse cx="12" cy="16.1" rx="5.35" ry="4.25" transform="rotate(-4 12 16.1)"></ellipse>',
    '<ellipse cx="5.55" cy="10.4" rx="2.15" ry="2.75" transform="rotate(-28 5.55 10.4)"></ellipse>',
    '<ellipse cx="9.55" cy="6.85" rx="2.1" ry="2.75" transform="rotate(-8 9.55 6.85)"></ellipse>',
    '<ellipse cx="14.55" cy="6.85" rx="2.1" ry="2.75" transform="rotate(8 14.55 6.85)"></ellipse>',
    '<ellipse cx="18.45" cy="10.4" rx="2.15" ry="2.75" transform="rotate(28 18.45 10.4)"></ellipse>',
    '</svg>'
  ].join(""),
  dog: [
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
    '<path class="animalHoloIconFill" d="M7.1 8.1 4.2 5.2c-.55-.55-1.5-.16-1.5.62v4.5c0 1.25.7 2.4 1.82 2.96l1.3.65v4.45c0 .7.57 1.27 1.27 1.27h1.2v-3.1h7.42v3.1h1.2c.7 0 1.27-.57 1.27-1.27v-4.45l1.3-.65a3.31 3.31 0 0 0 1.82-2.96v-4.5c0-.78-.95-1.17-1.5-.62l-2.9 2.9A8.2 8.2 0 0 0 12 6.6a8.2 8.2 0 0 0-4.9 1.5Z"></path>',
    '<circle cx="9" cy="11.2" r=".8" class="animalHoloIconCutout"></circle>',
    '<circle cx="15" cy="11.2" r=".8" class="animalHoloIconCutout"></circle>',
    '<path d="M10.1 14.1c1.23 1.05 2.57 1.05 3.8 0" class="animalHoloIconLine"></path>',
    '</svg>'
  ].join(""),
  memories: [
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
    '<rect x="5" y="4.5" width="14" height="15" rx="2"></rect>',
    '<path d="M8.1 8.5h7.8M8.1 12h7.8M8.1 15.5h5.2"></path>',
    '</svg>'
  ].join(""),
  shieldHeart: [
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
    '<path d="M12 2.8 19 5.5v5.1c0 4.4-2.66 8.18-7 10.6-4.34-2.42-7-6.2-7-10.6V5.5L12 2.8Z"></path>',
    '<path d="M12 15.7s-3.35-1.85-3.35-4.15a1.95 1.95 0 0 1 3.35-1.33 1.95 1.95 0 0 1 3.35 1.33C15.35 13.85 12 15.7 12 15.7Z"></path>',
    '</svg>'
  ].join(""),
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.1S4 15.55 4 9.7a4.1 4.1 0 0 1 7.18-2.72L12 7.9l.82-.92A4.1 4.1 0 0 1 20 9.7c0 5.85-8 10.4-8 10.4Z"></path></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"></path></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m3.5 11.2 8.5-7.1 8.5 7.1v8.1H14.8v-5.2H9.2v5.2H3.5v-8.1Z"></path></svg>',
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4" y="4" width="6" height="6" rx="1"></rect><rect x="14" y="4" width="6" height="6" rx="1"></rect><rect x="4" y="14" width="6" height="6" rx="1"></rect><rect x="14" y="14" width="6" height="6" rx="1"></rect></svg>',
  camera: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7.5h3l1.35-2h7.3l1.35 2h3v11H4v-11Z"></path><circle cx="12" cy="13" r="3.2"></circle></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 5 7 7-7 7"></path></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"></path></svg>'
});
let animalState = null;
let selectedProfileId = "";
let syncing = false;
let syncingPhotos = false;
let restoringObservations = false;
let photoInputProfileId = "";
let photoRenderRevision = 0;
let moreProfilesOpen = false;

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

function currentConversationId() {
  return String(window.SolHoloIdentity?.conversationId?.() || "")
    .trim()
    .slice(0, 200);
}

function pendingConversationStorageKey(identity) {
  return (
    PENDING_CONVERSATION_STORAGE_PREFIX +
    ":" +
    String(identity?.ownerId || "")
      .toLocaleLowerCase("de-DE")
      .replace(/[^a-z0-9äöüß_-]+/gu, "-")
      .slice(0, 120)
  );
}

function clearPendingConversationProposal(identity = currentIdentity()) {
  if (!identity?.ownerId) return;
  localStorage.removeItem(pendingConversationStorageKey(identity));
}

function readPendingConversationProposal() {
  const identity = currentIdentity();
  if (!identity?.ownerId || !identity?.speakerId) return null;
  const key = pendingConversationStorageKey(identity);
  let pending;
  try {
    pending = JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    localStorage.removeItem(key);
    return null;
  }
  const proposal = normalizeAnimalHoloProposal(pending?.proposal);
  const createdAt = Number(pending?.createdAt || 0);
  const conversationId = currentConversationId();
  const valid =
    proposal &&
    pending?.ownerId === identity.ownerId &&
    pending?.speakerId === identity.speakerId &&
    pending?.conversationId === conversationId &&
    Number.isFinite(createdAt) &&
    createdAt > 0 &&
    Date.now() - createdAt <= PENDING_CONVERSATION_TTL_MS;
  if (!valid) {
    localStorage.removeItem(key);
    return null;
  }
  return { ...pending, proposal };
}

async function saveObservation({
  profileId = "",
  text = "",
  observedAt = "",
  source = "conversation_auto_save"
} = {}) {
  loadState();
  const proposal = normalizeAnimalHoloProposal(
    { profileId, text, observedAt },
    { profiles: animalState.profiles }
  );
  if (!proposal) {
    throw new Error(
      "Die Beobachtung braucht ein eindeutig zugeordnetes Tier und einen Text."
    );
  }

  const profile = animalState.profiles.find(
    (candidate) => candidate.id === proposal.profileId
  );
  if (!profile) {
    throw new Error("Das passende Tier-Holo wurde nicht gefunden.");
  }

  const destination = animalHoloDestination(profile);
  const result = addAnimalHoloObservation(
    animalState,
    profile.id,
    {
      text: proposal.text,
      observedAt: proposal.observedAt,
      source,
      syncState: "pending"
    }
  );

  if (result.duplicate) {
    const existingObservation = profile.observations.find(
      (observation) =>
        observation.text.toLocaleLowerCase("de-DE") ===
          proposal.text.toLocaleLowerCase("de-DE") &&
        observation.observedAt === proposal.observedAt
    );
    let synchronized = existingObservation?.syncState === "synced";
    if (!synchronized && existingObservation) {
      try {
        synchronized = await syncObservation(profile, existingObservation);
      } catch {
        synchronized = false;
      }
    }
    render();
    const answer = synchronized
      ? `Diese Beobachtung ist im ${destination} bereits sicher gespeichert ✅️: ${proposal.text}`
      : `Diese Beobachtung ist im ${destination} bereits lokal gespeichert ✅️. Der ownergebundene Abgleich wird automatisch nachgeholt: ${proposal.text}`;
    setStatus(answer, "success");
    return {
      handled: true,
      kind: "animal-holo",
      marker: "[LOKALES_TIER_HOLO_ERGEBNIS]",
      status: "Tier-Holo-Beobachtung bereits vorhanden.",
      answer,
      localSaved: true,
      synchronized,
      duplicate: true
    };
  }

  animalState = result.state;
  selectedProfileId = profile.id;
  persistState();
  render();

  let synchronized = false;
  try {
    synchronized = await syncObservation(profile, result.observation);
  } catch {
    synchronized = false;
  }
  render();

  const answer = synchronized
    ? `Gespeichert im ${destination} und ownergebunden im Vollzeitgedächtnis ✅️: ${proposal.text}`
    : `Sofort im ${destination} gespeichert ✅️. Die ownergebundene Vollzeit-Synchronisierung wird automatisch nachgeholt: ${proposal.text}`;
  setStatus(answer, "success");
  return {
    handled: true,
    kind: "animal-holo",
    marker: "[LOKALES_TIER_HOLO_ERGEBNIS]",
    status: "Tier-Holo-Beobachtung gespeichert.",
    answer,
    localSaved: true,
    synchronized,
    duplicate: false
  };
}

async function captureConversationProposal({
  proposal: suppliedProposal = null,
  answer = "",
  conversationId = "",
  autoSave = false
} = {}) {
  const identity = requireIdentity();
  const state = loadState();
  const proposal =
    normalizeAnimalHoloProposal(suppliedProposal, {
      profiles: state.profiles
    }) ||
    animalHoloProposalFromAssistantAnswer(answer, {
      profiles: state.profiles
    });
  if (!proposal) return { staged: false };

  const profile = state.profiles.find(
    (candidate) => candidate.id === proposal.profileId
  );
  if (!profile) return { staged: false };

  const activeConversationId = currentConversationId();
  const suppliedConversationId = String(conversationId || "").trim();
  if (
    activeConversationId &&
    suppliedConversationId &&
    suppliedConversationId !== activeConversationId
  ) {
    return { staged: false };
  }

  if (identity.ownerId === "pam-sol") {
    clearPendingConversationProposal(identity);
    return saveObservation({
      ...proposal,
      source: autoSave
        ? "conversation_auto_save"
        : "conversation_owner_auto_save"
    });
  }

  if (!activeConversationId) return { staged: false };

  const pending = {
    ownerId: identity.ownerId,
    speakerId: identity.speakerId,
    conversationId: activeConversationId,
    createdAt: Date.now(),
    proposal
  };
  localStorage.setItem(
    pendingConversationStorageKey(identity),
    JSON.stringify(pending)
  );
  return { staged: true, proposal };
}

function animalHoloDestination(profile) {
  const projectName = String(profile?.projectName || "").trim();
  if (projectName) {
    return /tier[\s‑-]*holo$/iu.test(projectName)
      ? projectName
      : projectName + " Tier-Holo";
  }
  return profileLabel(profile) + " Tier-Holo";
}

async function commitPendingConversationProposal(pending) {
  const proposal = pending.proposal;
  clearPendingConversationProposal();
  return saveObservation({
    ...proposal,
    source: "conversation_confirmation"
  });
}

async function handleConversationReply(message) {
  const pending = readPendingConversationProposal();
  if (!pending) return { handled: false };
  const reply = classifyAnimalHoloConversationReply(message);

  if (reply === ANIMAL_HOLO_CONVERSATION_REPLY.CANCEL) {
    const state = loadState();
    const profile = state.profiles.find(
      (candidate) => candidate.id === pending.proposal.profileId
    );
    clearPendingConversationProposal();
    return {
      handled: true,
      kind: "animal-holo",
      marker: "[LOKALES_TIER_HOLO_ERGEBNIS]",
      status: "Tier-Holo-Speicherung abgebrochen.",
      answer: `Alles klar. Im ${animalHoloDestination(profile)} wurde nichts hinzugefügt.`
    };
  }

  if (reply === ANIMAL_HOLO_CONVERSATION_REPLY.CONFIRM) {
    return commitPendingConversationProposal(pending);
  }

  return { handled: false };
}

function profileLabel(profile) {
  return profile.nicknames.length
    ? profile.name + " (" + profile.nicknames.join(", ") + ")"
    : profile.name;
}

function profileIconName(profile) {
  return profile.species.toLocaleLowerCase("de-DE").includes("hund")
    ? "dog"
    : "paw";
}

function createHoloIcon(name, className = "") {
  const icon = document.createElement("span");
  icon.className = ["animalHoloIcon", className].filter(Boolean).join(" ");
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = HOLO_ICON_SVGS[name] || HOLO_ICON_SVGS.paw;
  return icon;
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

function profileDisplayName(profile) {
  if (profile?.id === "pepper") return "Peps";
  return String(profile?.name || "Tier");
}

function profileAssignment(profile) {
  const reference = String(profile?.humanReference || "").trim();
  return reference ? "Zugeordnet: " + reference : "Ownergebunden gespeichert";
}

function profileMeta(profile) {
  if (profile?.id === "tina") return [profile.species, "Familie"];
  return [profile.species, profile.projectName].filter(Boolean);
}

function profileTagline(profile) {
  if (profile?.id === "tina") {
    return "Treue Begleiterin. Geliebt. Unvergessen. ♡";
  }
  if (profile?.id === "gurke" || profile?.id === "moehrchen") {
    return "Geliebt. Geborgen. Ein Teil der Familie. ♡";
  }
  return "Liebenswert. Neugierig. Einzigartig. ♡";
}

function profileFooter(profile) {
  return profile?.id === "tina"
    ? "🐾 Für immer im Herzen. ♡"
    : "🐾 Danke, dass es dich gibt. ♡";
}

function previousPhotoProfileId(fileName) {
  const baseName = String(fileName || "")
    .trim()
    .toLocaleLowerCase("de-DE")
    .replace(/\.[a-z0-9]+$/u, "")
    .replace(/\s*\(\d+\)$/u, "");
  return PAM_PREVIOUS_ANIMAL_PHOTO_FILES[baseName] || "";
}

function photoRecordKey(identity, profileId) {
  return [identity?.ownerId, identity?.speakerId, profileId]
    .map((value) => String(value || "").trim().toLocaleLowerCase("de-DE"))
    .join(":");
}

function openAnimalPhotoDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("Der private Bildspeicher ist auf diesem Gerät nicht verfügbar."));
      return;
    }
    const request = window.indexedDB.open(ANIMAL_PHOTO_DATABASE, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(ANIMAL_PHOTO_STORE)) {
        database.createObjectStore(ANIMAL_PHOTO_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Bildspeicher nicht verfügbar."));
    request.onblocked = () => reject(new Error("Der private Bildspeicher ist noch geöffnet."));
  });
}

async function readPhotoRecord(profileId) {
  const identity = requireIdentity();
  const database = await openAnimalPhotoDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(ANIMAL_PHOTO_STORE, "readonly");
      const request = transaction
        .objectStore(ANIMAL_PHOTO_STORE)
        .get(photoRecordKey(identity, profileId));
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error("Tierfoto nicht lesbar."));
    });
  } finally {
    database.close();
  }
}

async function writePhotoRecord(record) {
  const identity = requireIdentity();
  const normalized = {
    ...record,
    key: photoRecordKey(identity, record.profileId),
    ownerId: identity.ownerId,
    speakerId: identity.speakerId
  };
  const database = await openAnimalPhotoDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(ANIMAL_PHOTO_STORE, "readwrite");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Tierfoto nicht speicherbar."));
      transaction.onabort = () => reject(transaction.error || new Error("Tierfoto nicht speicherbar."));
      transaction.objectStore(ANIMAL_PHOTO_STORE).put(normalized);
    });
    return normalized;
  } finally {
    database.close();
  }
}

async function listPhotoRecords() {
  const identity = requireIdentity();
  const database = await openAnimalPhotoDatabase();
  try {
    const records = await new Promise((resolve, reject) => {
      const transaction = database.transaction(ANIMAL_PHOTO_STORE, "readonly");
      const request = transaction.objectStore(ANIMAL_PHOTO_STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error || new Error("Tierfotos nicht lesbar."));
    });
    return records.filter(
      (record) =>
        record.ownerId === identity.ownerId &&
        record.speakerId === identity.speakerId
    );
  } finally {
    database.close();
  }
}

function dataUrlFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Tierfoto nicht lesbar."));
    reader.readAsDataURL(blob);
  });
}

function imageElementFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Das ausgewählte Bild konnte nicht geöffnet werden."));
    };
    image.src = url;
  });
}

function animalPhotoSourceRect(source, profileId, fileName) {
  const width = source.naturalWidth;
  const height = source.naturalHeight;
  const previousProfileId = previousPhotoProfileId(fileName);
  if (
    profileId === "tina" &&
    previousProfileId === "tina" &&
    width > height
  ) {
    const x = Math.round(width * 0.5);
    const y = Math.round(height * 0.04);
    return {
      x,
      y,
      width: Math.max(1, width - x),
      height: Math.max(1, Math.round(height * 0.93))
    };
  }
  return { x: 0, y: 0, width, height };
}

async function prepareAnimalPhoto(file, { profileId = "" } = {}) {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!file || !allowed.has(file.type)) {
    throw new Error("Bitte wähle ein JPEG-, PNG- oder WebP-Bild aus.");
  }
  if (file.size > MAX_LOCAL_PHOTO_INPUT_BYTES) {
    throw new Error("Das ausgewählte Tierfoto ist größer als 18 MB.");
  }

  const source = await imageElementFromFile(file);
  const sourceRect = animalPhotoSourceRect(source, profileId, file.name);
  const longest = Math.max(sourceRect.width, sourceRect.height);
  const scale = Math.min(1, 1440 / Math.max(1, longest));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceRect.width * scale));
  canvas.height = Math.max(1, Math.round(sourceRect.height * scale));
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Das Tierfoto konnte nicht vorbereitet werden.");
  context.fillStyle = "#08142b";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    source,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  let quality = 0.86;
  let blob = null;
  while (quality >= 0.58) {
    blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (blob && blob.size <= 6 * 1024 * 1024) break;
    quality -= 0.08;
  }
  if (!blob || blob.size > 6 * 1024 * 1024) {
    throw new Error("Das Tierfoto konnte nicht sicher verkleinert werden.");
  }
  return dataUrlFromBlob(blob);
}

async function ensureTrustedSession(accessLevel = "owner_everyday") {
  const ensure = window.SolHoloTrustedSession?.ensure;
  if (typeof ensure !== "function") return null;
  try {
    const trusted = await ensure({
      interactive: false,
      accessLevel
    });
    return trusted?.trusted ? trusted : null;
  } catch {
    return null;
  }
}

async function savePhotoRemotely(record) {
  const identity = currentIdentity();
  if (
    !identity ||
    record.ownerId !== identity.ownerId ||
    record.speakerId !== identity.speakerId
  ) {
    return false;
  }
  if (!(await ensureTrustedSession("protected_media_documents_settings"))) {
    return false;
  }
  const response = await fetch(BACKEND_URL + "/animal-holos/profile-photo/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(window.SolHoloTrustedSession?.headers?.({
        minimumAccess: "protected_media_documents_settings"
      }) || {})
    },
    cache: "no-store",
    body: JSON.stringify({
      ownerId: identity.ownerId,
      selectedSpeakerId: identity.speakerId,
      profileId: record.profileId,
      dataUrl: record.dataUrl
    })
  });
  if (!response.ok) return false;
  const current = await readPhotoRecord(record.profileId);
  if (current?.updatedAt !== record.updatedAt) return true;
  await writePhotoRecord({ ...current, syncState: "synced" });
  return true;
}

async function storeProfilePhotoFile(
  file,
  profileId,
  { announce = true } = {}
) {
  const identity = requireIdentity();
  if (announce) setStatus("Das private Tierfoto wird vorbereitet …");
  const dataUrl = await prepareAnimalPhoto(file, { profileId });
  const record = await writePhotoRecord({
    profileId,
    dataUrl,
    updatedAt: new Date().toISOString(),
    syncState: "pending"
  });
  if (profileId === selectedProfileId) {
    const revision = ++photoRenderRevision;
    showRenderedPhoto(record, revision);
  }
  if (announce) {
    setStatus(
      "Foto privat auf diesem Gerät gespeichert. Der ownergebundene Abgleich läuft automatisch.",
      "success"
    );
  }
  const synchronized = await savePhotoRemotely({
    ...record,
    ownerId: identity.ownerId,
    speakerId: identity.speakerId
  });
  if (announce && synchronized) {
    setStatus("Tierfoto privat und ownergebunden gespeichert ✅️", "success");
  }
  return { record, synchronized };
}

async function flushPendingPhotos() {
  if (syncingPhotos) return;
  syncingPhotos = true;
  try {
    const records = await listPhotoRecords();
    for (const record of records) {
      if (record.syncState === "synced") continue;
      try {
        await savePhotoRemotely(record);
      } catch {
        // Das lokal gespeicherte Foto bleibt pending und wird später erneut versucht.
      }
    }
  } catch {
    // IndexedDB oder die sichere Sitzung ist vorübergehend nicht verfügbar.
  } finally {
    syncingPhotos = false;
  }
}

async function fetchRemotePhoto(profileId) {
  const identity = currentIdentity();
  if (
    !identity ||
    !(await ensureTrustedSession("protected_media_documents_settings"))
  ) {
    return null;
  }
  const response = await fetch(BACKEND_URL + "/animal-holos/profile-photo/get", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(window.SolHoloTrustedSession?.headers?.({
        minimumAccess: "protected_media_documents_settings"
      }) || {})
    },
    cache: "no-store",
    body: JSON.stringify({
      ownerId: identity.ownerId,
      selectedSpeakerId: identity.speakerId,
      profileId
    })
  });
  if (!response.ok) return null;
  const result = await response.json();
  if (!result?.found || !result?.photo?.dataUrl) return null;
  return writePhotoRecord({
    profileId,
    dataUrl: result.photo.dataUrl,
    updatedAt: result.photo.updatedAt || new Date().toISOString(),
    syncState: "synced"
  });
}

function showRenderedPhoto(record, revision) {
  if (revision !== photoRenderRevision || record?.profileId !== selectedProfileId) {
    return;
  }
  const image = document.getElementById("animalHoloProfilePhoto");
  const placeholder = document.getElementById("animalHoloPhotoPlaceholder");
  const frame = image?.closest(".animalHoloPhotoFrame");
  const buttonLabel = frame?.querySelector(".animalHoloPhotoButtonLabel");
  if (!image || !placeholder || !record?.dataUrl) return;
  image.onload = () => {
    if (revision !== photoRenderRevision) return;
    image.hidden = false;
    placeholder.hidden = true;
    if (frame) frame.dataset.hasPhoto = "true";
    if (buttonLabel) buttonLabel.textContent = "Foto ändern";
  };
  image.onerror = () => {
    image.hidden = true;
    placeholder.hidden = false;
    if (frame) frame.dataset.hasPhoto = "false";
    if (buttonLabel) buttonLabel.textContent = "Foto einsetzen";
  };
  image.src = record.dataUrl;
}

async function renderProfilePhoto(profileId) {
  const revision = ++photoRenderRevision;
  const bundledPhoto = ANIMAL_HOLO_DEFAULT_PHOTOS[profileId];
  if (bundledPhoto) {
    showRenderedPhoto(
      { profileId, dataUrl: bundledPhoto, source: "public_starter_photo" },
      revision
    );
  }
  try {
    let record = await readPhotoRecord(profileId);
    if (!record) record = await fetchRemotePhoto(profileId);
    if (record) showRenderedPhoto(record, revision);
  } catch {
    // Das freigegebene Startfoto oder der Platzhalter bleibt sichtbar.
  }
}

async function restoreRemoteObservations() {
  if (restoringObservations) return 0;
  restoringObservations = true;
  let additions = 0;
  try {
    loadState();
    const identity = currentIdentity();
    if (!identity || !(await ensureTrustedSession())) return 0;
    const response = await fetch(BACKEND_URL + "/animal-holos/observations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(window.SolHoloTrustedSession?.headers?.() || {})
      },
      cache: "no-store",
      body: JSON.stringify({
        ownerId: identity.ownerId,
        selectedSpeakerId: identity.speakerId
      })
    });
    if (!response.ok) return 0;
    const result = await response.json();
    for (const record of Array.isArray(result?.observations)
      ? result.observations
      : []) {
      const restored = animalHoloObservationFromFulltimeMessage(record, {
        profiles: animalState.profiles
      });
      if (!restored) continue;
      const profile = animalState.profiles.find(
        (candidate) => candidate.id === restored.profileId
      );
      if (
        !profile ||
        profile.observations.some(
          (item) =>
            item.text.toLocaleLowerCase("de-DE") ===
            restored.observation.text.toLocaleLowerCase("de-DE")
        )
      ) {
        continue;
      }
      const added = addAnimalHoloObservation(
        animalState,
        restored.profileId,
        restored.observation,
        restored.observation.recordedAt || new Date()
      );
      if (added.duplicate) continue;
      animalState = added.state;
      additions += 1;
    }
    if (additions > 0) {
      persistState();
      render();
      setStatus(
        additions +
          " bereits gespeicherte Beobachtung" +
          (additions === 1 ? "" : "en") +
          " wieder sichtbar gemacht.",
        "success"
      );
    }
    return additions;
  } catch {
    return 0;
  } finally {
    restoringObservations = false;
  }
}

function selectAnimalProfile(profileId) {
  selectedProfileId = profileId;
  moreProfilesOpen = false;
  render();
  document.getElementById("animalHoloOverlay")?.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function createDockButton({ iconName, label, selected = false, onClick }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "animalHoloDockButton";
  button.dataset.selected = String(selected);
  button.setAttribute("aria-pressed", String(selected));
  const iconElement = createHoloIcon(iconName, "animalHoloDockIcon");
  const labelElement = document.createElement("span");
  labelElement.className = "animalHoloDockLabel";
  labelElement.textContent = label;
  button.append(iconElement, labelElement);
  button.addEventListener("click", onClick);
  return button;
}

function renderMoreProfileButtons() {
  const menu = document.getElementById("animalHoloMoreMenu");
  const list = document.getElementById("animalHoloMoreProfiles");
  if (!menu || !list || !animalState) return;
  menu.hidden = !moreProfilesOpen;
  const importButton = document.getElementById(
    "animalHoloImportPreviousPhotos"
  );
  if (importButton) {
    importButton.hidden = currentIdentity()?.ownerId !== "pam-sol";
  }
  list.replaceChildren();
  for (const profile of animalState.profiles) {
    if (ANIMAL_HOLO_PRIMARY_NAVIGATION.includes(profile.id)) continue;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "animalHoloMoreProfileButton";
    button.dataset.selected = String(profile.id === selectedProfileId);
    button.append(
      createHoloIcon(profileIconName(profile), "animalHoloMoreProfileIcon"),
      document.createTextNode(profileDisplayName(profile))
    );
    button.addEventListener("click", () => selectAnimalProfile(profile.id));
    list.append(button);
  }
}

function renderProfileButtons() {
  const list = document.getElementById("animalHoloProfiles");
  if (!list || !animalState) return;
  list.replaceChildren();
  list.append(
    createDockButton({
      iconName: "home",
      label: "Start",
      onClick: closeAnimalHolos
    })
  );
  for (const profileId of ANIMAL_HOLO_PRIMARY_NAVIGATION) {
    const profile = animalState.profiles.find(
      (candidate) => candidate.id === profileId
    );
    if (!profile) continue;
    list.append(
      createDockButton({
        iconName: profileIconName(profile),
        label: profileDisplayName(profile).toLocaleUpperCase("de-DE"),
        selected: profile.id === selectedProfileId,
        onClick: () => selectAnimalProfile(profile.id)
      })
    );
  }
  const selectedInMore = !ANIMAL_HOLO_PRIMARY_NAVIGATION.includes(
    selectedProfileId
  );
  const moreButton = createDockButton({
    iconName: "grid",
    label: "Mehr",
    selected: selectedInMore || moreProfilesOpen,
    onClick: () => {
      moreProfilesOpen = !moreProfilesOpen;
      if (!moreProfilesOpen) {
        const profilePanel = document.getElementById("animalHoloNewProfile");
        if (profilePanel) profilePanel.hidden = true;
      }
      renderProfileButtons();
    }
  });
  moreButton.setAttribute("aria-expanded", String(moreProfilesOpen));
  moreButton.setAttribute("aria-controls", "animalHoloMoreMenu");
  list.append(moreButton);
  renderMoreProfileButtons();
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
  const form = document.getElementById("animalHoloObservationForm");
  const formParking = document.getElementById("animalHoloFormParking");
  if (!container || !animalState) return;
  if (form && formParking && form.parentElement !== formParking) {
    formParking.append(form);
  }
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
    if (form) form.hidden = true;
    return;
  }

  const hero = document.createElement("article");
  hero.className = "animalHoloHero";
  hero.dataset.profile = profile.id;

  const photoColumn = document.createElement("div");
  photoColumn.className = "animalHoloPhotoColumn";
  const photoFrame = document.createElement("div");
  photoFrame.className = "animalHoloPhotoFrame";
  const photo = document.createElement("img");
  photo.id = "animalHoloProfilePhoto";
  photo.alt = "Profilfoto von " + profileDisplayName(profile);
  photo.decoding = "async";
  photo.hidden = true;
  const photoPlaceholder = document.createElement("span");
  photoPlaceholder.id = "animalHoloPhotoPlaceholder";
  photoPlaceholder.className = "animalHoloPhotoPlaceholder";
  photoPlaceholder.append(
    createHoloIcon(profileIconName(profile), "animalHoloPhotoPlaceholderIcon")
  );
  photoFrame.append(photo, photoPlaceholder);
  const photoButton = document.createElement("button");
  photoButton.type = "button";
  photoButton.className = "animalHoloPhotoButton";
  photoButton.setAttribute(
    "aria-label",
    "Profilfoto von " + profileDisplayName(profile) + " ändern"
  );
  const photoButtonLabel = document.createElement("span");
  photoButtonLabel.className = "animalHoloPhotoButtonLabel";
  photoButtonLabel.textContent = "Foto einsetzen";
  photoButton.append(
    createHoloIcon("camera", "animalHoloPhotoButtonIcon"),
    photoButtonLabel
  );
  photoButton.addEventListener("click", () => {
    photoInputProfileId = profile.id;
    const input = document.getElementById("animalHoloPhotoInput");
    if (input) {
      input.value = "";
      input.click();
    }
  });
  photoFrame.append(photoButton);
  photoColumn.append(photoFrame);

  const identityCard = document.createElement("div");
  identityCard.className = "animalHoloIdentityCard";
  const paw = createHoloIcon(
    profileIconName(profile),
    "animalHoloIdentityPaw"
  );
  const title = document.createElement("h3");
  title.textContent = profileDisplayName(profile).toLocaleUpperCase("de-DE");
  const meta = document.createElement("p");
  meta.textContent = profileMeta(profile).join(" · ");
  const assignment = document.createElement("p");
  assignment.className = "animalHoloAssignment";
  assignment.textContent = "💚 " + profileAssignment(profile);
  const tagline = document.createElement("p");
  tagline.className = "animalHoloTagline";
  tagline.textContent = profileTagline(profile);
  const signature = document.createElement("p");
  signature.className = "animalHoloIdentitySignature";
  signature.textContent =
    profile.id === "tina"
      ? "Große Pfoten. Große Spuren."
      : "Kleine Pfoten. Große Spuren.";
  const family = createHoloIcon("heart", "animalHoloFamilyMark");
  identityCard.append(
    paw,
    title,
    meta,
    assignment,
    tagline,
    signature,
    family
  );
  hero.append(photoColumn, identityCard);
  container.append(hero);

  const detailElements = [];
  const createDetail = ({ iconName, titleText, subtitle, caption = "" }) => {
    const details = document.createElement("details");
    details.className = "animalHoloDetail";
    const summaryRow = document.createElement("summary");
    const summaryIcon = createHoloIcon(iconName, "animalHoloDetailIcon");
    const summaryCopy = document.createElement("span");
    summaryCopy.className = "animalHoloDetailCopy";
    const summaryTitle = document.createElement("strong");
    summaryTitle.textContent = titleText;
    const summarySubtitle = document.createElement("small");
    summarySubtitle.textContent = subtitle;
    summaryCopy.append(summaryTitle, summarySubtitle);
    if (caption) {
      const summaryCaption = document.createElement("small");
      summaryCaption.className = "animalHoloDetailCaption";
      summaryCaption.textContent = caption;
      summaryCopy.append(summaryCaption);
    }
    const watermark = createHoloIcon("paw", "animalHoloDetailWatermark");
    const chevron = createHoloIcon("chevron", "animalHoloDetailChevron");
    summaryRow.append(summaryIcon, summaryCopy, watermark, chevron);
    const body = document.createElement("div");
    body.className = "animalHoloDetailBody";
    details.append(summaryRow, body);
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      for (const other of detailElements) {
        if (other !== details) other.open = false;
      }
    });
    detailElements.push(details);
    container.append(details);
    return body;
  };

  const factsBody = createDetail({
    iconName: "paw",
    titleText: "Über " + profileDisplayName(profile),
    subtitle:
      profile.id === "tina"
        ? "Charakter · Leben · Besonderheiten"
        : "Charakter · Verhalten · Besonderheiten",
    caption: "Alles Wichtige auf einen Blick"
  });
  const facts = document.createElement("ul");
  facts.className = "animalHoloFactList";
  for (const fact of profile.baselineFacts) appendListItem(facts, fact);
  factsBody.append(facts);

  const observationCount = profile.observations.length;
  const observationsBody = createDetail({
    iconName: "memories",
    titleText: "Erinnerungen",
    subtitle:
      profile.id === "tina"
        ? "Gemeinsame Momente · Geschichten · Entwicklung"
        : "Gemeinsame Momente · Beobachtungen · Entwicklung",
    caption: "Was Holo über " + profileDisplayName(profile) + " weiß"
  });
  const observations = document.createElement("ol");
  observations.className = "animalHoloObservationList";
  if (!observationCount) {
    appendListItem(
      observations,
      "Noch keine Beobachtung hinterlegt.",
      "animalHoloEmpty"
    );
  } else {
    for (const observation of [...profile.observations].reverse()) {
      const suffix = observation.observedAt
        ? " · " + formatDate(observation.observedAt)
        : "";
      const sync =
        observation.syncState === "synced"
          ? " · sicher gespeichert"
          : " · lokal sicher, Abgleich läuft";
      appendListItem(observations, observation.text + suffix + sync);
    }
  }
  observationsBody.append(observations);

  const safetyBody = createDetail({
    iconName: "shieldHeart",
    titleText: "Sicherheit",
    subtitle:
      profile.id === "tina"
        ? "Tierwohl · Familie · wichtige Regeln"
        : "Tierwohl · Kinder · wichtige Regeln",
    caption: "Für ein sicheres Miteinander"
  });
  for (const safetyText of [
    ANIMAL_HOLO_SAFETY.childSafety,
    ANIMAL_HOLO_SAFETY.welfare,
    ANIMAL_HOLO_SAFETY.veterinaryBoundary
  ]) {
    const paragraph = document.createElement("p");
    paragraph.textContent = safetyText;
    safetyBody.append(paragraph);
  }

  const newMemoryBody = createDetail({
    iconName: "plus",
    titleText: "Neue Erinnerung",
    subtitle: "Foto · Text · Sprache",
    caption: "Jeder Moment zählt ♡"
  });
  if (form) {
    form.hidden = false;
    newMemoryBody.append(form);
  }

  const footer = document.createElement("p");
  footer.className = "animalHoloProfileFooter";
  footer.append(
    createHoloIcon("paw", "animalHoloProfileFooterIcon"),
    document.createTextNode(profileFooter(profile).replace(/^🐾\s*/u, ""))
  );
  container.append(footer);
  void renderProfilePhoto(profile.id);

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
  const formHint = document.getElementById("animalHoloFormHint");
  if (formHint) {
    formHint.textContent =
      currentIdentity()?.ownerId === "pam-sol"
        ? "Wird direkt gespeichert – ohne zusätzliche Zustimmungsfrage."
        : "Deine bestätigte Beobachtung wird direkt in deinem Tier-Holo gespeichert.";
  }
  const select = document.getElementById("animalHoloObservationProfile");
  if (select && animalState) {
    select.replaceChildren();
    for (const profile of animalState.profiles) {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profileDisplayName(profile);
      option.selected = profile.id === selectedProfileId;
      select.append(option);
    }
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
  moreProfilesOpen = false;
  const profilePanel = document.getElementById("animalHoloNewProfile");
  if (profilePanel) profilePanel.hidden = true;
  overlay.hidden = false;
  overlay.scrollTop = 0;
  document.body.classList.add("animalHoloOpen");
  render();
  document.getElementById("animalHoloClose")?.focus();
  void flushPendingObservations();
  void restoreRemoteObservations();
  void flushPendingPhotos();
}

function closeAnimalHolos() {
  const overlay = document.getElementById("animalHoloOverlay");
  if (!overlay) return;
  moreProfilesOpen = false;
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
    trusted = await ensure({
      interactive: false,
      accessLevel: "owner_everyday"
    });
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
    ".animalHoloOverlay{position:fixed;inset:0;z-index:2147481000;background:radial-gradient(circle at 12% 8%,rgba(139,68,255,.45),transparent 32%),radial-gradient(circle at 91% 25%,rgba(20,207,255,.34),transparent 37%),radial-gradient(circle at 50% 95%,rgba(232,91,255,.28),transparent 44%),#030927;backdrop-filter:blur(20px);padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);overflow:auto;-webkit-text-size-adjust:100%}",
    ".animalHoloOverlay[hidden]{display:none!important}",
    ".animalHoloDialog{position:relative;width:min(760px,100%);min-height:100dvh;box-sizing:border-box;margin:0 auto;padding:10px 12px calc(88px + env(safe-area-inset-bottom));border:1px solid rgba(155,224,255,.52);background:linear-gradient(155deg,rgba(34,38,124,.9),rgba(6,22,73,.96) 48%,rgba(28,17,91,.94));box-shadow:inset 0 0 42px rgba(95,219,255,.18),0 0 45px rgba(133,73,255,.35);color:#fbfaff;overflow:hidden}",
    ".animalHoloDialog:before{content:'';position:absolute;inset:-25%;pointer-events:none;background:conic-gradient(from 80deg,transparent,rgba(71,221,255,.15),transparent 29%,rgba(240,110,255,.16),transparent 63%);filter:blur(24px)}",
    ".animalHoloDialog>*{position:relative}",
    ".animalHoloHeader{display:grid;grid-template-columns:52px 1fr 52px;align-items:center;gap:8px;min-height:58px;margin-bottom:8px}",
    ".animalHoloBrandMark{display:grid;place-items:center;width:48px;height:48px;border:2px solid rgba(211,171,255,.88);border-radius:50% 50% 47% 53%;background:rgba(54,45,155,.6);box-shadow:inset 0 0 16px rgba(92,224,255,.22),0 0 24px rgba(196,112,255,.62);font-size:1.55rem}",
    ".animalHoloBrand{text-align:center}",
    ".animalHoloBrand h2{margin:0;font-size:clamp(19px,4.8vw,27px);font-weight:500;letter-spacing:.22em}",
    ".animalHoloEyebrow{margin:2px 0 0;color:#ead6ff;font-family:cursive;font-size:clamp(12px,3.1vw,16px);font-style:italic;letter-spacing:.04em}",
    ".animalHoloClose{display:grid;place-items:center;min-width:46px;min-height:46px;border-radius:50%;border:1px solid rgba(166,231,255,.54);background:rgba(6,13,47,.46);box-shadow:inset 0 0 14px rgba(92,216,255,.14),0 0 16px rgba(135,94,255,.18);color:white;font-size:27px;cursor:pointer}",
    ".animalHoloSelected{margin:0}",
    ".animalHoloHero{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);min-height:232px;margin-bottom:10px;padding:5px;border:1px solid rgba(184,226,255,.76);border-radius:25px;background:linear-gradient(135deg,rgba(217,170,255,.2),rgba(20,122,214,.2) 56%,rgba(246,122,255,.17));box-shadow:inset 0 0 30px rgba(111,206,255,.2),0 0 18px rgba(92,96,255,.23),0 0 7px rgba(255,145,238,.48);overflow:hidden}",
    ".animalHoloPhotoColumn{min-width:0;min-height:220px}",
    ".animalHoloPhotoFrame{position:relative;display:grid;place-items:center;width:100%;height:100%;min-height:220px;overflow:hidden;border-radius:20px;background:radial-gradient(circle,rgba(131,99,240,.46),rgba(11,28,76,.78));box-shadow:inset 0 0 24px rgba(145,220,255,.27)}",
    ".animalHoloPhotoFrame img{width:100%;height:100%;object-fit:cover}",
    ".animalHoloHero[data-profile=tina] .animalHoloPhotoFrame img{object-position:52% center}",
    ".animalHoloPhotoFrame img[hidden],.animalHoloPhotoPlaceholder[hidden]{display:none!important}",
    ".animalHoloPhotoPlaceholder{font-size:58px;filter:drop-shadow(0 0 16px rgba(100,230,255,.5))}",
    ".animalHoloPhotoButton{position:absolute;left:9px;bottom:9px;z-index:2;min-height:39px;padding:7px 12px;border:1px solid rgba(145,235,255,.77);border-radius:18px;background:linear-gradient(115deg,rgba(31,99,190,.91),rgba(61,55,147,.91));box-shadow:inset 0 0 12px rgba(255,255,255,.16),0 0 12px rgba(81,209,255,.35);color:#f7fdff;font-size:13px;font-weight:760;cursor:pointer}",
    ".animalHoloIdentityCard{position:relative;z-index:1;align-self:center;min-height:190px;margin:13px 7px 13px -27px;padding:15px 12px 12px 35px;border:1px solid rgba(168,222,255,.78);border-radius:23px;background:linear-gradient(145deg,rgba(23,67,164,.93),rgba(37,42,143,.91) 60%,rgba(101,50,167,.88));box-shadow:inset 0 0 24px rgba(117,224,255,.2),0 0 17px rgba(110,83,255,.35)}",
    ".animalHoloIdentityPaw{display:inline-block;font-size:30px;filter:drop-shadow(0 0 12px rgba(255,163,244,.68))}",
    ".animalHoloIdentityCard h3{margin:1px 0 3px;font-size:clamp(25px,6.3vw,39px);line-height:1;letter-spacing:.04em;background:linear-gradient(90deg,#fff,#a9ecff 55%,#e8b6ff);background-clip:text;-webkit-background-clip:text;color:transparent}",
    ".animalHoloIdentityCard>p{margin:6px 0;color:#d7d8ee;font-size:clamp(11px,2.8vw,15px);line-height:1.3}",
    ".animalHoloIdentityCard .animalHoloAssignment{margin:10px 0;color:#a1f8d2;font-weight:800}",
    ".animalHoloIdentityCard .animalHoloTagline{color:#f1edfb}",
    ".animalHoloFamilyMark{position:absolute;right:13px;top:12px;color:#fff;font-size:27px}",
    ".animalHoloDetail{margin:9px 0;border:1px solid rgba(190,199,255,.66);border-radius:20px;background:linear-gradient(110deg,rgba(252,218,255,.17),rgba(40,117,204,.25),rgba(184,78,225,.18));box-shadow:inset 0 0 22px rgba(128,210,255,.16),0 0 12px rgba(137,93,255,.2),0 0 5px rgba(255,157,233,.38);overflow:hidden}",
    ".animalHoloDetail summary{display:grid;grid-template-columns:54px 1fr 25px;align-items:center;gap:10px;min-height:76px;padding:7px 12px;list-style:none;cursor:pointer}",
    ".animalHoloDetail summary::-webkit-details-marker{display:none}",
    ".animalHoloDetailIcon{display:grid;place-items:center;width:50px;height:50px;border:1px solid rgba(126,236,255,.75);border-radius:50%;background:linear-gradient(145deg,rgba(45,80,177,.78),rgba(65,49,159,.72));box-shadow:inset 0 0 17px rgba(108,215,255,.32),0 0 15px rgba(90,204,255,.3);font-size:23px;color:#c6f9ff}",
    ".animalHoloDetailCopy{display:grid;gap:1px;min-width:0}",
    ".animalHoloDetailCopy strong{font-size:clamp(17px,4.5vw,24px);line-height:1.1;color:#fff}",
    ".animalHoloDetailCopy small{color:#d1d0e5;font-size:clamp(10px,2.65vw,14px);line-height:1.26;white-space:normal}",
    ".animalHoloDetailCopy .animalHoloDetailCaption{color:#bcecff}",
    ".animalHoloDetailChevron{font-size:31px;line-height:1;transform:rotate(0);transition:transform .2s ease}",
    ".animalHoloDetail[open] .animalHoloDetailChevron{transform:rotate(90deg)}",
    ".animalHoloDetailBody{padding:2px 14px 14px;border-top:1px solid rgba(186,206,255,.21);background:rgba(3,12,48,.22);color:#e9e6f6;font-size:14px;line-height:1.45}",
    ".animalHoloDetailBody p{margin:10px 0 0}",
    ".animalHoloFactList,.animalHoloObservationList{margin:10px 0 0;padding-left:20px;display:grid;gap:8px;line-height:1.43}",
    ".animalHoloObservationList li{padding:6px 0;border-bottom:1px solid rgba(122,207,255,.18)}",
    ".animalHoloObservationList li:last-child{border-bottom:0}",
    ".animalHoloEmpty{color:#aaa4c7;font-style:italic}",
    ".animalHoloProfileFooter{margin:11px 0 10px;padding:5px 8px;text-align:center;color:#edccff;font-family:cursive;font-size:clamp(16px,4.2vw,23px);font-style:italic}",
    ".animalHoloInlineForm{padding:8px 0 0;margin:0}",
    ".animalHoloInlineForm[hidden],.animalHoloFormParking[hidden]{display:none!important}",
    ".animalHoloFormHint{margin:0 0 8px;color:#a7ecd9;font-size:12px;line-height:1.4}",
    ".animalHoloInlineForm label,.animalHoloNewProfile label{display:grid;gap:4px;margin:8px 0;color:#f0ecfb;font-size:13px;font-weight:700}",
    ".animalHoloInlineForm textarea,.animalHoloInlineForm input,.animalHoloInlineForm select,.animalHoloNewProfile input{box-sizing:border-box;width:100%;border:1px solid rgba(143,195,255,.48);border-radius:13px;padding:10px 11px;background:rgba(2,7,31,.7);color:white;font:inherit;color-scheme:dark}",
    ".animalHoloProfileChooser{display:none!important}",
    ".animalHoloActions{display:flex;flex-wrap:wrap;gap:9px;margin-top:12px}",
    ".animalHoloActions button{flex:1 1 150px;min-height:43px;border-radius:15px;border:1px solid rgba(113,226,255,.58);background:linear-gradient(110deg,rgba(155,65,255,.66),rgba(35,184,255,.5));box-shadow:inset 0 0 14px rgba(255,255,255,.1),0 0 14px rgba(68,180,255,.14);color:white;font-size:13px;font-weight:800;padding:10px;cursor:pointer}",
    ".animalHoloActions .secondary{background:rgba(255,255,255,.06)}",
    ".animalHoloStatus{min-height:0;margin:6px 4px;white-space:pre-wrap;font-size:12px;line-height:1.4;color:#cfc9e7}",
    ".animalHoloStatus[data-kind=success]{color:#77f1d2}",
    ".animalHoloStatus[data-kind=error]{color:#ff9eaf}",
    ".animalHoloMoreMenu{position:fixed;z-index:7;left:50%;bottom:calc(80px + env(safe-area-inset-bottom));width:min(736px,calc(100% - 16px));box-sizing:border-box;transform:translateX(-50%);padding:10px;border:1px solid rgba(151,223,255,.63);border-radius:18px;background:linear-gradient(145deg,rgba(17,35,112,.98),rgba(43,27,111,.98));box-shadow:0 0 24px rgba(63,181,255,.25)}",
    ".animalHoloMoreMenu[hidden],.animalHoloNewProfile[hidden]{display:none!important}",
    ".animalHoloMoreProfiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}",
    ".animalHoloMoreProfileButton,.animalHoloMoreAction{min-height:42px;border:1px solid rgba(158,188,255,.5);border-radius:13px;background:rgba(255,255,255,.07);color:#fff;font-weight:750;cursor:pointer}",
    ".animalHoloMoreProfileButton[data-selected=true]{border-color:#68ebff;background:rgba(49,155,220,.25)}",
    ".animalHoloMoreActions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}",
    ".animalHoloNewProfile{margin-top:9px;padding:10px;border-top:1px solid rgba(151,223,255,.25)}",
    ".animalHoloNewProfile h3{margin:0 0 6px;font-size:16px}",
    ".animalHoloProfiles{position:fixed;z-index:8;left:50%;bottom:env(safe-area-inset-bottom);display:grid;grid-template-columns:repeat(5,minmax(0,1fr));width:min(760px,100%);min-height:78px;box-sizing:border-box;transform:translateX(-50%);border:1px solid rgba(166,224,255,.65);border-radius:20px 20px 0 0;background:linear-gradient(145deg,rgba(36,47,139,.97),rgba(18,46,120,.98) 55%,rgba(63,30,126,.97));box-shadow:inset 0 0 25px rgba(103,207,255,.17),0 -4px 20px rgba(11,8,58,.45);overflow:hidden}",
    ".animalHoloDockButton{display:grid;place-items:center;align-content:center;gap:2px;min-width:0;border:0;border-right:1px solid rgba(193,207,255,.25);background:transparent;color:#eceafa;font-size:10px;cursor:pointer}",
    ".animalHoloDockButton:last-child{border-right:0}",
    ".animalHoloDockIcon{font-size:24px;line-height:1;color:#d6f8ff;filter:drop-shadow(0 0 8px rgba(120,217,255,.45))}",
    ".animalHoloDockButton[data-selected=true]{background:linear-gradient(145deg,rgba(145,54,245,.68),rgba(24,196,237,.48));box-shadow:inset 0 0 18px rgba(255,255,255,.16),0 0 16px rgba(89,213,255,.42);color:#fff;font-weight:800}",
    ".animalHoloDialog button:focus-visible,.animalHoloDialog summary:focus-visible,.animalHoloDialog input:focus-visible,.animalHoloDialog textarea:focus-visible,.animalHoloDialog select:focus-visible{outline:2px solid #7cecff;outline-offset:2px}",
    "@media (max-width:520px){.animalHoloDialog{padding:7px 8px calc(80px + env(safe-area-inset-bottom))}.animalHoloHeader{grid-template-columns:46px 1fr 46px;min-height:52px;margin-bottom:6px}.animalHoloBrandMark{width:42px;height:42px;font-size:21px}.animalHoloClose{min-width:42px;min-height:42px;font-size:24px}.animalHoloHero{min-height:207px;border-radius:21px}.animalHoloPhotoColumn,.animalHoloPhotoFrame{min-height:197px}.animalHoloIdentityCard{min-height:166px;margin:13px 5px 13px -23px;padding:13px 8px 10px 29px;border-radius:20px}.animalHoloIdentityPaw{font-size:25px}.animalHoloIdentityCard h3{font-size:24px}.animalHoloIdentityCard>p{font-size:11px}.animalHoloFamilyMark{right:9px;top:8px;font-size:23px}.animalHoloDetail{margin:7px 0;border-radius:17px}.animalHoloDetail summary{grid-template-columns:48px 1fr 22px;gap:8px;min-height:68px;padding:6px 9px}.animalHoloDetailIcon{width:44px;height:44px;font-size:20px}.animalHoloDetailChevron{font-size:27px}.animalHoloPhotoButton{left:7px;bottom:7px;min-height:34px;padding:6px 9px;font-size:11px}.animalHoloActions button{flex-basis:100%}.animalHoloProfiles{min-height:70px}.animalHoloDockIcon{font-size:21px}.animalHoloDockButton{font-size:9px}.animalHoloMoreMenu{bottom:calc(73px + env(safe-area-inset-bottom))}}",
    "@media (max-width:360px){.animalHoloBrand h2{font-size:17px;letter-spacing:.16em}.animalHoloHero{grid-template-columns:minmax(0,1.04fr) minmax(0,.96fr)}.animalHoloIdentityCard{padding-left:26px}.animalHoloIdentityCard h3{font-size:21px}.animalHoloIdentityCard>p{font-size:10px}.animalHoloDetailCopy strong{font-size:16px}.animalHoloDetailCopy small{font-size:9px}}",
    "@media (prefers-reduced-motion:reduce){.animalHoloDetailChevron{transition:none}}",
    /* Build 291: Pams freigegebene leuchtende Holo-Glas-Ansicht. */
    ".animalHoloOverlay{--animal-cyan:#79efff;--animal-blue:#36a9ff;--animal-violet:#a763ff;--animal-pink:#ff92ef;--animal-bronze:#c8864a;isolation:isolate;font-family:Inter,Roboto,'Segoe UI',Arial,sans-serif;background:radial-gradient(circle at 12% 12%,rgba(101,91,255,.62),transparent 27%),radial-gradient(circle at 88% 16%,rgba(25,190,255,.44),transparent 31%),radial-gradient(circle at 72% 77%,rgba(180,66,255,.43),transparent 38%),radial-gradient(circle at 16% 88%,rgba(30,138,255,.36),transparent 34%),linear-gradient(165deg,#112b7a 0%,#061749 42%,#14083f 72%,#28106d 100%)}",
    ".animalHoloOverlay:before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.72;background-image:radial-gradient(circle at 8% 19%,rgba(255,255,255,.95) 0 1px,transparent 1.6px),radial-gradient(circle at 76% 9%,rgba(150,238,255,.9) 0 1px,transparent 1.7px),radial-gradient(circle at 41% 31%,rgba(255,196,247,.85) 0 1px,transparent 1.5px),radial-gradient(circle at 91% 55%,rgba(255,255,255,.75) 0 1px,transparent 1.5px),radial-gradient(circle at 22% 72%,rgba(138,225,255,.76) 0 1px,transparent 1.6px);background-size:91px 103px,127px 119px,149px 137px,173px 157px,211px 191px}",
    ".animalHoloOverlay:after{content:'';position:fixed;inset:-20%;z-index:0;pointer-events:none;background:conic-gradient(from 155deg at 46% 38%,transparent 0 16%,rgba(45,211,255,.12) 22%,transparent 31% 49%,rgba(230,96,255,.15) 57%,transparent 68%);filter:blur(36px)}",
    ".animalHoloDialog{z-index:1;border-color:rgba(167,231,255,.72);background:linear-gradient(160deg,rgba(27,48,139,.76),rgba(5,21,70,.86) 45%,rgba(30,13,91,.84));box-shadow:inset 0 0 56px rgba(85,219,255,.2),inset 0 0 110px rgba(129,73,255,.13),0 0 48px rgba(116,93,255,.46)}",
    ".animalHoloDialog:before{inset:-18%;background:radial-gradient(ellipse at 24% 28%,rgba(73,226,255,.16),transparent 39%),radial-gradient(ellipse at 76% 68%,rgba(245,112,255,.16),transparent 43%);filter:blur(18px)}",
    ".animalHoloIcon{display:inline-grid;place-items:center;flex:0 0 auto}",
    ".animalHoloIcon svg{display:block;width:1em;height:1em;overflow:visible;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}",
    ".animalHoloIcon svg ellipse,.animalHoloIcon svg .animalHoloIconFill{fill:currentColor;stroke:none}",
    ".animalHoloIcon svg .animalHoloIconCutout{fill:#183b91;stroke:none}",
    ".animalHoloIcon svg .animalHoloIconLine{fill:none;stroke:#183b91;stroke-width:1.35}",
    ".animalHoloHeader{margin-bottom:10px}",
    ".animalHoloBrandMark{box-sizing:border-box;border-color:rgba(225,180,255,.95);color:var(--animal-bronze);font-size:29px;background:linear-gradient(145deg,rgba(43,66,167,.72),rgba(83,38,146,.7));box-shadow:inset 0 0 20px rgba(100,227,255,.28),0 0 8px rgba(110,227,255,.42),0 0 23px rgba(212,101,255,.66)}",
    ".animalHoloBrand h2{font-weight:560;text-shadow:0 0 14px rgba(133,229,255,.38),0 0 26px rgba(212,132,255,.25)}",
    ".animalHoloEyebrow{font-family:'Segoe Script','Brush Script MT',cursive;color:#f1d8ff;text-shadow:0 0 9px rgba(228,138,255,.7)}",
    ".animalHoloClose{box-sizing:border-box;color:#fff;font-size:23px;background:linear-gradient(145deg,rgba(18,47,126,.64),rgba(25,20,87,.67));border-color:rgba(151,230,255,.68);box-shadow:inset 0 0 18px rgba(88,218,255,.22),0 0 18px rgba(100,210,255,.2)}",
    ".animalHoloClose svg{width:22px;height:22px;stroke-width:2.25}",
    ".animalHoloHero{position:relative;isolation:isolate;min-height:220px;padding:5px;border-color:rgba(182,239,255,.95);background:linear-gradient(135deg,rgba(155,102,255,.3),rgba(35,157,238,.24) 48%,rgba(227,89,255,.25));box-shadow:inset 0 0 34px rgba(126,232,255,.27),inset 0 0 76px rgba(139,68,255,.13),0 0 4px rgba(255,255,255,.75),0 0 12px rgba(76,224,255,.55),0 0 25px rgba(196,82,255,.45)}",
    ".animalHoloHero:before{content:'';position:absolute;inset:4px;z-index:-1;border:1px solid rgba(255,255,255,.16);border-radius:20px;pointer-events:none}",
    ".animalHoloHero:after{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;pointer-events:none;background:linear-gradient(115deg,rgba(255,255,255,.18),transparent 24% 67%,rgba(255,163,244,.13))}",
    ".animalHoloPhotoColumn,.animalHoloPhotoFrame{min-height:208px}",
    ".animalHoloPhotoFrame{border:1px solid rgba(142,229,255,.34);background:radial-gradient(circle at 48% 42%,rgba(99,122,255,.48),rgba(9,27,83,.82));box-shadow:inset 0 0 28px rgba(106,225,255,.24),inset 0 -38px 44px rgba(17,7,63,.34)}",
    ".animalHoloPhotoFrame:after{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;border-radius:inherit;background:linear-gradient(118deg,rgba(110,226,255,.13),transparent 34% 68%,rgba(237,124,255,.18));box-shadow:inset 0 0 18px rgba(166,235,255,.16)}",
    ".animalHoloPhotoFrame img{filter:saturate(1.07) contrast(1.025);transform:scale(1.002)}",
    ".animalHoloHero[data-profile=salt] .animalHoloPhotoFrame img{object-position:47% 43%}",
    ".animalHoloHero[data-profile=pepper] .animalHoloPhotoFrame img{object-position:50% 41%}",
    ".animalHoloHero[data-profile=tina] .animalHoloPhotoFrame img{object-position:57% 51%}",
    ".animalHoloHero[data-profile=gurke] .animalHoloPhotoFrame img{object-position:49% 47%}",
    ".animalHoloHero[data-profile=moehrchen] .animalHoloPhotoFrame img{object-position:46% 45%}",
    ".animalHoloPhotoPlaceholder{display:grid;place-items:center;color:var(--animal-bronze)}",
    ".animalHoloPhotoPlaceholderIcon{font-size:72px;filter:drop-shadow(0 0 9px rgba(255,167,97,.48)) drop-shadow(0 0 18px rgba(185,82,255,.62))}",
    ".animalHoloPhotoButton{z-index:3;display:flex;align-items:center;gap:6px;border-color:rgba(134,242,255,.95);background:linear-gradient(125deg,rgba(25,128,207,.94),rgba(72,46,165,.94));box-shadow:inset 0 0 12px rgba(255,255,255,.2),0 0 5px rgba(255,255,255,.65),0 0 15px rgba(69,221,255,.62)}",
    ".animalHoloPhotoButtonIcon{font-size:17px}",
    ".animalHoloIdentityCard{overflow:hidden;min-height:180px;margin:14px 7px 14px -27px;padding:14px 12px 34px 34px;border-color:rgba(164,235,255,.94);background:linear-gradient(145deg,rgba(22,79,179,.91),rgba(38,53,158,.91) 57%,rgba(116,43,174,.9));box-shadow:inset 0 0 30px rgba(119,229,255,.24),inset -14px -20px 30px rgba(231,111,255,.1),0 0 5px rgba(255,255,255,.65),0 0 17px rgba(75,220,255,.5),0 0 28px rgba(171,76,255,.4)}",
    ".animalHoloIdentityCard:before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(122deg,rgba(255,255,255,.14),transparent 31% 72%,rgba(255,159,242,.12))}",
    ".animalHoloIdentityPaw{position:relative;width:31px;height:31px;color:var(--animal-bronze);font-size:31px;filter:drop-shadow(0 0 8px rgba(255,168,91,.45))}",
    ".animalHoloIdentityCard h3{position:relative;margin:1px 0 4px;font-weight:800;text-shadow:0 0 17px rgba(138,233,255,.24)}",
    ".animalHoloIdentityCard>p{position:relative;color:#e7e6f5}",
    ".animalHoloIdentityCard .animalHoloAssignment{color:#8ff8c9;text-shadow:0 0 10px rgba(78,255,191,.25)}",
    ".animalHoloIdentityCard .animalHoloTagline{max-width:92%;color:#f7f1ff}",
    ".animalHoloIdentityCard .animalHoloIdentitySignature{position:absolute;right:11px;bottom:7px;max-width:91px;margin:0;color:#f5d9ff;font-family:'Segoe Script','Brush Script MT',cursive;font-size:10px;line-height:1.12;text-align:right;transform:rotate(-4deg);text-shadow:0 0 8px rgba(227,137,255,.72)}",
    ".animalHoloFamilyMark{right:12px;top:12px;width:24px;height:24px;color:#fff;font-size:24px;filter:drop-shadow(0 0 8px rgba(255,255,255,.5))}",
    ".animalHoloDetail{position:relative;isolation:isolate;margin:8px 0;border-color:rgba(174,229,255,.91);background:linear-gradient(112deg,rgba(112,66,198,.5),rgba(24,114,196,.46) 48%,rgba(126,52,187,.48));box-shadow:inset 0 0 24px rgba(127,224,255,.22),inset 0 0 48px rgba(155,77,255,.11),0 0 4px rgba(255,255,255,.7),0 0 12px rgba(69,219,255,.45),0 0 20px rgba(201,91,255,.32)}",
    ".animalHoloDetail:before{content:'';position:absolute;inset:1px;z-index:-1;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:linear-gradient(120deg,rgba(255,255,255,.11),transparent 29% 72%,rgba(255,139,236,.08));pointer-events:none}",
    ".animalHoloDetail summary{grid-template-columns:48px minmax(0,1fr) 31px 18px;gap:9px;min-height:68px;padding:6px 12px 6px 10px}",
    ".animalHoloDetailIcon{width:45px;height:45px;color:#bcf7ff;font-size:25px;border-color:rgba(114,240,255,.92);background:linear-gradient(145deg,rgba(31,109,199,.84),rgba(73,44,168,.8));box-shadow:inset 0 0 18px rgba(126,231,255,.36),0 0 5px rgba(255,255,255,.6),0 0 15px rgba(68,220,255,.55)}",
    ".animalHoloDetail:first-of-type .animalHoloDetailIcon{color:var(--animal-bronze)}",
    ".animalHoloDetailCopy{position:relative;z-index:1}",
    ".animalHoloDetailCopy strong{font-weight:790;text-shadow:0 0 11px rgba(129,229,255,.22)}",
    ".animalHoloDetailCopy small{color:#e1def0}",
    ".animalHoloDetailCopy .animalHoloDetailCaption{color:#bff2ff}",
    ".animalHoloDetailWatermark{width:29px;height:29px;color:#bb79d5;font-size:29px;opacity:.46;filter:drop-shadow(0 0 8px rgba(220,111,255,.55))}",
    ".animalHoloDetailChevron{width:18px;height:25px;color:#fff;font-size:21px;filter:drop-shadow(0 0 7px rgba(130,231,255,.68));transform:rotate(0);transition:transform .2s ease}",
    ".animalHoloDetail[open] .animalHoloDetailChevron{transform:rotate(90deg)}",
    ".animalHoloDetailBody{background:linear-gradient(180deg,rgba(3,13,51,.3),rgba(14,8,57,.5));border-top-color:rgba(166,230,255,.3)}",
    ".animalHoloProfileFooter{display:flex;align-items:center;justify-content:center;gap:7px;font-family:'Segoe Script','Brush Script MT',cursive;color:#f2d8ff;text-shadow:0 0 10px rgba(224,128,255,.66)}",
    ".animalHoloProfileFooterIcon{color:var(--animal-bronze);font-size:22px;filter:drop-shadow(0 0 8px rgba(255,167,91,.5))}",
    ".animalHoloMoreProfileButton{display:flex;align-items:center;justify-content:center;gap:7px}",
    ".animalHoloMoreProfileIcon{font-size:22px;color:var(--animal-bronze);filter:drop-shadow(0 0 7px rgba(255,166,88,.4))}",
    ".animalHoloProfiles{border-color:rgba(161,231,255,.92);background:linear-gradient(150deg,rgba(42,61,161,.97),rgba(20,68,157,.97) 51%,rgba(79,34,153,.97));box-shadow:inset 0 0 26px rgba(100,220,255,.22),0 -2px 6px rgba(255,255,255,.24),0 -7px 24px rgba(94,65,255,.46)}",
    ".animalHoloDockButton{position:relative;overflow:hidden;font-size:10px;text-shadow:0 0 8px rgba(146,226,255,.34)}",
    ".animalHoloDockButton:before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(145deg,rgba(255,255,255,.06),transparent 45%,rgba(255,128,239,.05))}",
    ".animalHoloDockIcon{width:25px;height:25px;color:#d1faff;font-size:25px}",
    ".animalHoloDockButton:nth-child(2) .animalHoloDockIcon,.animalHoloDockButton:nth-child(3) .animalHoloDockIcon{color:var(--animal-bronze)}",
    ".animalHoloDockButton[data-selected=true]{background:linear-gradient(145deg,rgba(129,50,237,.78),rgba(22,188,237,.63));box-shadow:inset 0 0 22px rgba(255,255,255,.2),0 0 6px rgba(255,255,255,.48),0 0 18px rgba(70,223,255,.58)}",
    ".memoryRowIcon svg{width:25px;height:25px;fill:currentColor}",
    "@media (max-width:520px){.animalHoloDialog{padding:7px 8px calc(76px + env(safe-area-inset-bottom))}.animalHoloHero{min-height:199px}.animalHoloPhotoColumn,.animalHoloPhotoFrame{min-height:187px}.animalHoloIdentityCard{min-height:158px;margin:13px 5px 13px -23px;padding:12px 8px 31px 28px}.animalHoloIdentityPaw{width:25px;height:25px;font-size:25px}.animalHoloIdentityCard h3{font-size:24px}.animalHoloIdentityCard>p{font-size:10.5px;margin:5px 0}.animalHoloIdentityCard .animalHoloAssignment{margin:8px 0}.animalHoloIdentityCard .animalHoloIdentitySignature{right:8px;bottom:6px;max-width:76px;font-size:8.5px}.animalHoloFamilyMark{right:9px;top:9px;width:21px;height:21px;font-size:21px}.animalHoloDetail{margin:7px 0}.animalHoloDetail summary{grid-template-columns:45px minmax(0,1fr) 26px 16px;gap:7px;min-height:62px;padding:5px 9px}.animalHoloDetailIcon{width:41px;height:41px;font-size:22px}.animalHoloDetailWatermark{width:25px;height:25px;font-size:25px}.animalHoloDetailChevron{width:16px;height:22px;font-size:19px}.animalHoloPhotoButton{left:7px;bottom:7px;min-height:34px;padding:6px 9px;font-size:11px}.animalHoloProfiles{min-height:68px}.animalHoloDockIcon{width:22px;height:22px;font-size:22px}.animalHoloMoreMenu{bottom:calc(71px + env(safe-area-inset-bottom))}}",
    "@media (max-width:360px){.animalHoloHero{grid-template-columns:minmax(0,1.06fr) minmax(0,.94fr)}.animalHoloIdentityCard{padding-left:26px}.animalHoloIdentityCard h3{font-size:21px}.animalHoloDetailCopy strong{font-size:16px}.animalHoloDetailCopy small{font-size:9px}.animalHoloDetailWatermark{opacity:.34}}",
    /* Build 292: Tier-Holos im verbindlichen Human-Holo-Glass-Design. */
    ".animalHoloOverlay{--human-holo-glass-text:#fbfcff;--human-holo-glass-copy:rgba(232,238,255,.82);--human-holo-glass-edge:rgba(211,232,255,.78);--human-holo-glass-violet:rgba(174,102,255,.72);--human-holo-glass-cyan:rgba(72,222,255,.8);color:var(--human-holo-glass-text);background:radial-gradient(circle at 11% 8%,rgba(151,89,255,.4),transparent 28%),radial-gradient(circle at 89% 16%,rgba(35,184,255,.34),transparent 31%),radial-gradient(circle at 52% 72%,rgba(94,76,240,.26),transparent 41%),linear-gradient(180deg,#102c83 0%,#241a83 35%,#09246d 69%,#03143f 100%);backdrop-filter:none}",
    ".animalHoloOverlay:before{opacity:.46}",
    ".animalHoloOverlay:after{opacity:.38;filter:blur(48px)}",
    ".animalHoloDialog{border:0;background:transparent;box-shadow:none;color:var(--human-holo-glass-text)}",
    ".animalHoloDialog:before{opacity:.45;filter:blur(34px)}",
    ".animalHoloHeader{margin:0 0 10px;padding:5px 4px 9px;border-bottom:1px solid rgba(211,232,255,.58);background:linear-gradient(180deg,rgba(65,75,180,.18),rgba(24,29,111,.05));box-shadow:0 12px 28px rgba(51,44,180,.16)}",
    ".animalHoloBrandMark,.animalHoloClose{border-color:rgba(205,226,255,.7);background:radial-gradient(circle at 30% 18%,rgba(255,255,255,.25),transparent 35%),linear-gradient(145deg,rgba(123,105,238,.56),rgba(60,63,183,.52));box-shadow:0 0 11px rgba(70,220,255,.38),0 0 23px rgba(161,78,255,.32),inset 0 1px 0 rgba(255,255,255,.2)}",
    ".animalHoloBrandMark{border-color:rgba(222,181,255,.86);box-shadow:0 0 11px rgba(70,220,255,.32),0 0 23px rgba(161,78,255,.4),inset 0 1px 0 rgba(255,255,255,.22)}",
    ".animalHoloBrand h2{color:#fbfcff;text-shadow:0 0 14px rgba(133,229,255,.24),0 0 26px rgba(212,132,255,.18)}",
    ".animalHoloEyebrow{color:rgba(239,218,255,.9);text-shadow:0 0 9px rgba(228,138,255,.42)}",
    ".animalHoloHero,.animalHoloIdentityCard,.animalHoloDetail{border:1px solid transparent;background:radial-gradient(circle at 28% 8%,rgba(255,255,255,.2),transparent 31%) padding-box,linear-gradient(145deg,rgba(91,116,231,.5),rgba(36,32,126,.58)) padding-box,linear-gradient(135deg,var(--human-holo-glass-edge),var(--human-holo-glass-violet) 48%,var(--human-holo-glass-cyan)) border-box;box-shadow:0 0 12px rgba(67,211,255,.28),0 0 27px rgba(143,79,255,.32),0 15px 35px rgba(0,6,55,.27),inset 0 1px 0 rgba(255,255,255,.22),inset 0 -12px 28px rgba(21,16,89,.21);backdrop-filter:blur(20px) saturate(1.3);-webkit-backdrop-filter:blur(20px) saturate(1.3)}",
    ".animalHoloHero:before{border-color:rgba(255,255,255,.11)}",
    ".animalHoloHero:after{background:linear-gradient(115deg,rgba(255,255,255,.14),transparent 27% 70%,rgba(255,163,244,.08))}",
    ".animalHoloPhotoFrame{border-color:rgba(211,232,255,.48);background:radial-gradient(circle at 48% 42%,rgba(99,122,255,.34),rgba(9,27,83,.72));box-shadow:inset 0 1px 0 rgba(255,255,255,.16),inset 0 -30px 42px rgba(17,7,63,.25)}",
    ".animalHoloPhotoFrame:after{background:linear-gradient(118deg,rgba(255,255,255,.08),transparent 36% 72%,rgba(237,124,255,.09));box-shadow:inset 0 0 18px rgba(166,235,255,.1)}",
    ".animalHoloPhotoFrame img{filter:saturate(1.03) contrast(1.015)}",
    ".animalHoloPhotoButton,.animalHoloActions button{border:1px solid transparent;background:radial-gradient(circle at 30% 12%,rgba(255,255,255,.18),transparent 35%) padding-box,linear-gradient(115deg,rgba(79,92,207,.72),rgba(53,58,164,.69)) padding-box,linear-gradient(120deg,rgba(205,226,255,.7),rgba(174,102,255,.66),rgba(72,222,255,.72)) border-box;box-shadow:0 0 10px rgba(70,220,255,.25),0 0 20px rgba(161,78,255,.2),inset 0 1px 0 rgba(255,255,255,.18)}",
    ".animalHoloIdentityCard:before{background:linear-gradient(122deg,rgba(255,255,255,.11),transparent 34% 75%,rgba(255,159,242,.07))}",
    ".animalHoloIdentityCard h3{color:#fff;text-shadow:0 0 13px rgba(138,233,255,.17)}",
    ".animalHoloIdentityCard>p{color:var(--human-holo-glass-copy)}",
    ".animalHoloIdentityCard .animalHoloAssignment{color:#91f0cb;text-shadow:0 0 9px rgba(78,255,191,.16)}",
    ".animalHoloIdentityCard .animalHoloTagline{color:rgba(247,241,255,.91)}",
    ".animalHoloIdentityCard .animalHoloIdentitySignature{color:rgba(245,217,255,.9);text-shadow:0 0 8px rgba(227,137,255,.42)}",
    ".animalHoloDetail:before{border-color:rgba(255,255,255,.08);background:linear-gradient(120deg,rgba(255,255,255,.07),transparent 32% 75%,rgba(255,139,236,.05))}",
    ".animalHoloDetailIcon{border-color:rgba(205,226,255,.7);color:#91e7ff;background:radial-gradient(circle at 30% 18%,rgba(255,255,255,.25),transparent 35%),linear-gradient(145deg,rgba(123,105,238,.56),rgba(60,63,183,.52));box-shadow:0 0 11px rgba(70,220,255,.52),0 0 23px rgba(161,78,255,.4),inset 0 1px 0 rgba(255,255,255,.2)}",
    ".animalHoloDetailCopy strong{color:#fbfcff;text-shadow:none}",
    ".animalHoloDetailCopy small{color:var(--human-holo-glass-copy)}",
    ".animalHoloDetailCopy .animalHoloDetailCaption{color:rgba(194,236,255,.88)}",
    ".animalHoloDetailWatermark{color:#bd7bd8;opacity:.34;filter:drop-shadow(0 0 7px rgba(220,111,255,.3))}",
    ".animalHoloDetailChevron{color:#ad61ff;filter:drop-shadow(0 0 7px rgba(174,102,255,.45))}",
    ".animalHoloDetailBody{border-top-color:rgba(211,232,255,.18);background:linear-gradient(180deg,rgba(33,42,135,.18),rgba(11,15,69,.32));color:var(--human-holo-glass-copy)}",
    ".animalHoloInlineForm textarea,.animalHoloInlineForm input,.animalHoloInlineForm select,.animalHoloNewProfile input{border-color:rgba(205,226,255,.48);background:linear-gradient(145deg,rgba(29,39,126,.58),rgba(15,20,78,.64));box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 0 14px rgba(89,157,255,.12)}",
    ".animalHoloActions .secondary{background:radial-gradient(circle at 30% 12%,rgba(255,255,255,.12),transparent 35%) padding-box,linear-gradient(145deg,rgba(64,74,175,.48),rgba(34,36,120,.52)) padding-box,linear-gradient(120deg,rgba(205,226,255,.55),rgba(174,102,255,.5),rgba(72,222,255,.56)) border-box}",
    ".animalHoloMoreMenu{border:1px solid transparent;background:radial-gradient(circle at 28% 8%,rgba(255,255,255,.18),transparent 31%) padding-box,linear-gradient(145deg,rgba(69,82,193,.91),rgba(27,27,106,.94)) padding-box,linear-gradient(135deg,var(--human-holo-glass-edge),var(--human-holo-glass-violet) 48%,var(--human-holo-glass-cyan)) border-box;box-shadow:0 0 12px rgba(67,211,255,.25),0 0 27px rgba(143,79,255,.3),0 15px 35px rgba(0,6,55,.34),inset 0 1px 0 rgba(255,255,255,.18);backdrop-filter:blur(20px) saturate(1.3);-webkit-backdrop-filter:blur(20px) saturate(1.3)}",
    ".animalHoloMoreProfileButton,.animalHoloMoreAction{border-color:rgba(205,226,255,.45);background:linear-gradient(145deg,rgba(112,102,223,.32),rgba(49,54,159,.36));box-shadow:inset 0 1px 0 rgba(255,255,255,.11)}",
    ".animalHoloMoreProfileButton[data-selected=true]{border-color:rgba(108,228,255,.76);background:linear-gradient(145deg,rgba(151,78,233,.54),rgba(48,91,197,.52));box-shadow:0 0 13px rgba(77,222,255,.24),0 0 25px rgba(164,77,255,.27),inset 0 1px 0 rgba(255,255,255,.15)}",
    ".animalHoloProfiles{border:1px solid transparent;background:radial-gradient(circle at 25% 0,rgba(255,255,255,.15),transparent 31%) padding-box,linear-gradient(145deg,rgba(53,66,167,.88),rgba(10,24,81,.93)) padding-box,linear-gradient(110deg,rgba(198,121,255,.68),rgba(88,108,255,.45),rgba(70,221,255,.68)) border-box;box-shadow:0 -4px 18px rgba(67,211,255,.18),0 -7px 28px rgba(143,79,255,.24),inset 0 1px 0 rgba(255,255,255,.18);backdrop-filter:blur(20px) saturate(1.3);-webkit-backdrop-filter:blur(20px) saturate(1.3)}",
    ".animalHoloDockButton{color:rgba(232,238,255,.78);text-shadow:none}",
    ".animalHoloDockButton:before{background:linear-gradient(145deg,rgba(255,255,255,.035),transparent 48%,rgba(255,128,239,.025))}",
    ".animalHoloDockIcon{color:#b9edff;filter:drop-shadow(0 0 7px rgba(120,217,255,.3))}",
    ".animalHoloDockButton[data-selected=true]{color:#fff;background:radial-gradient(circle at 50% 0,rgba(255,255,255,.2),transparent 38%),linear-gradient(145deg,rgba(151,78,233,.74),rgba(48,91,197,.67));box-shadow:0 0 13px rgba(77,222,255,.3),0 0 25px rgba(164,77,255,.37),inset 0 1px 0 rgba(255,255,255,.17)}",
    /* Build 293: unterer Tier-Holo-Bereich wie Holos schwebende Hauptnavigation. */
    ".animalHoloDialog{padding-bottom:calc(104px + env(safe-area-inset-bottom));scroll-padding-bottom:calc(104px + env(safe-area-inset-bottom))}",
    ".animalHoloProfileFooter{min-height:30px;margin:13px 0 15px;padding:3px 8px}",
    ".animalHoloProfiles{bottom:calc(8px + env(safe-area-inset-bottom));width:min(calc(100% - 20px),740px);min-height:0;padding:7px 5px;border-radius:23px;gap:3px;overflow:hidden;box-shadow:0 0 12px rgba(67,211,255,.28),0 0 27px rgba(143,79,255,.32),0 15px 35px rgba(0,6,55,.27),inset 0 1px 0 rgba(255,255,255,.22),inset 0 -12px 28px rgba(21,16,89,.21)}",
    ".animalHoloDockButton{position:relative;min-height:60px;gap:5px;border:0;border-right:0;border-radius:14px;color:rgba(232,238,255,.62);font-size:clamp(9px,2.65vw,11px);font-weight:650;transition:color .2s ease,background .2s ease,box-shadow .2s ease}",
    ".animalHoloDockButton:before{border-radius:inherit}",
    ".animalHoloDockButton[data-selected=true]{color:#fff;font-weight:800}",
    ".animalHoloDockButton[data-selected=true]:after{content:'';position:absolute;top:2px;left:50%;width:20px;height:2px;transform:translateX(-50%);border-radius:999px;background:linear-gradient(90deg,#a763ff,#48deff);box-shadow:0 0 10px rgba(102,226,255,.55)}",
    ".animalHoloMoreMenu{bottom:calc(92px + env(safe-area-inset-bottom));width:min(calc(100% - 20px),736px)}",
    "@media (max-width:520px){.animalHoloDialog{padding-bottom:calc(98px + env(safe-area-inset-bottom));scroll-padding-bottom:calc(98px + env(safe-area-inset-bottom))}.animalHoloProfiles{min-height:0}.animalHoloDockButton{min-height:56px;font-size:10px}.animalHoloMoreMenu{bottom:calc(88px + env(safe-area-inset-bottom))}}"
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
    `<header class="animalHoloHeader"><span class="animalHoloBrandMark animalHoloIcon" aria-hidden="true">${HOLO_ICON_SVGS.paw}</span>`,
    '<div class="animalHoloBrand"><h2 id="animalHoloTitle">HUMAN HOLO</h2>',
    '<p class="animalHoloEyebrow">Forever Together ∞</p></div>',
    `<button id="animalHoloClose" class="animalHoloClose animalHoloIcon" type="button" aria-label="Tier-Holos schließen">${HOLO_ICON_SVGS.close}</button></header>`,
    '<section id="animalHoloSelected" class="animalHoloSelected" aria-live="polite"></section>',
    '<input id="animalHoloPhotoInput" type="file" accept="image/jpeg,image/png,image/webp" hidden>',
    '<input id="animalHoloPreviousPhotosInput" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden>',
    '<div id="animalHoloFormParking" class="animalHoloFormParking" hidden>',
    '<form id="animalHoloObservationForm" class="animalHoloInlineForm" hidden>',
    '<p id="animalHoloFormHint" class="animalHoloFormHint">Wird direkt gespeichert – ohne zusätzliche Zustimmungsfrage.</p>',
    '<label class="animalHoloProfileChooser">Tier-Holo<select id="animalHoloObservationProfile" required></select></label>',
    '<label>Was hast du selbst beobachtet?<textarea id="animalHoloObservationText" rows="3" maxlength="2000" required placeholder="Zum Beispiel: Salt zieht sich zurück, wenn es ihr zu lebhaft wird."></textarea></label>',
    '<label>Datum, wenn bekannt<input id="animalHoloObservationDate" type="date"></label>',
    '<div class="animalHoloActions"><button type="submit">Direkt speichern</button>',
    '<button id="animalHoloAsk" class="secondary" type="button">Mit Pam’s Holo besprechen</button></div>',
    '</form></div>',
    '<section id="animalHoloMoreMenu" class="animalHoloMoreMenu" hidden>',
    '<div id="animalHoloMoreProfiles" class="animalHoloMoreProfiles"></div>',
    '<div class="animalHoloMoreActions">',
    '<button id="animalHoloImportPreviousPhotos" class="animalHoloMoreAction" type="button">📷 Vorherige Fotos übernehmen</button>',
    '<button id="animalHoloAddProfile" class="animalHoloMoreAction" type="button">＋ Weiteres Tier-Holo</button>',
    '</div>',
    '<section id="animalHoloNewProfile" class="animalHoloNewProfile" hidden>',
    '<h3>Weiteres Tier-Holo anlegen</h3>',
    '<form id="animalHoloProfileForm">',
    '<label>Name<input id="animalHoloProfileName" maxlength="120" required></label>',
    '<label>Tierart<input id="animalHoloProfileSpecies" maxlength="80" required placeholder="Hund, Katze …"></label>',
    '<label>Rasse, wenn bekannt<input id="animalHoloProfileBreed" maxlength="120"></label>',
    '<div class="animalHoloActions"><button type="submit">Tier-Holo anlegen</button>',
    '<button id="animalHoloCancelProfile" class="secondary" type="button">Abbrechen</button></div>',
    '</form></section></section>',
    '<p id="animalHoloStatus" class="animalHoloStatus" role="status" aria-live="polite"></p>',
    '<nav id="animalHoloProfiles" class="animalHoloProfiles" aria-label="Tier-Holo-Profile"></nav>',
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
        const profileId =
          document.getElementById("animalHoloObservationProfile")?.value || "";
        const content =
          document.getElementById("animalHoloObservationText")?.value || "";
        const date =
          document.getElementById("animalHoloObservationDate")?.value || "";
        await saveObservation({
          profileId,
          text: content,
          observedAt: date ? date + "T12:00:00.000Z" : "",
          source: "owner_observation"
        });
        event.currentTarget.reset();
        render();
      } catch (error) {
        setStatus(error.message, "error");
      }
    }
  );

  document.getElementById("animalHoloPhotoInput")?.addEventListener(
    "change",
    async (event) => {
      const input = event.currentTarget;
      const file = input.files?.[0] || null;
      const profileId = photoInputProfileId || selectedProfileId;
      if (!file || !profileId) return;
      try {
        await storeProfilePhotoFile(file, profileId);
      } catch (error) {
        setStatus(error.message, "error");
      } finally {
        input.value = "";
        photoInputProfileId = "";
      }
    }
  );

  const previousPhotosInput = document.getElementById(
    "animalHoloPreviousPhotosInput"
  );
  document.getElementById("animalHoloImportPreviousPhotos")?.addEventListener(
    "click",
    () => {
      if (!previousPhotosInput) return;
      previousPhotosInput.value = "";
      previousPhotosInput.click();
    }
  );
  previousPhotosInput?.addEventListener("change", async (event) => {
    if (currentIdentity()?.ownerId !== "pam-sol") {
      event.currentTarget.value = "";
      setStatus(
        "Dieser private Fotoimport gehört ausschließlich zu Pams Holo.",
        "error"
      );
      return;
    }
    const files = [...(event.currentTarget.files || [])];
    const assignments = new Map();
    for (const file of files) {
      const profileId = previousPhotoProfileId(file.name);
      if (profileId && !assignments.has(profileId)) {
        assignments.set(profileId, file);
      }
    }
    if (!assignments.size) {
      setStatus(
        "Die fünf früheren Originaldateien wurden in dieser Auswahl nicht erkannt.",
        "error"
      );
      event.currentTarget.value = "";
      return;
    }
    setStatus(
      assignments.size +
        " frühere" +
        (assignments.size === 1 ? "s Tierfoto wird" : " Tierfotos werden") +
        " privat übernommen …"
    );
    let stored = 0;
    let synchronized = 0;
    for (const [profileId, file] of assignments) {
      try {
        const result = await storeProfilePhotoFile(file, profileId, {
          announce: false
        });
        stored += 1;
        if (result.synchronized) synchronized += 1;
      } catch {
        // Andere korrekt erkannte Bilder werden weiterhin ownergebunden übernommen.
      }
    }
    event.currentTarget.value = "";
    render();
    setStatus(
      stored +
        " frühere" +
        (stored === 1 ? "s Tierfoto" : " Tierfotos") +
        " privat übernommen" +
        (synchronized === stored && stored > 0
          ? " und ownergebunden gespeichert ✅️"
          : ". Der sichere Abgleich läuft automatisch weiter."),
      stored > 0 ? "success" : "error"
    );
  });

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
        moreProfilesOpen = false;
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
  icon.innerHTML = HOLO_ICON_SVGS.paw;
  const textBlock = document.createElement("span");
  textBlock.className = "rowText";
  const title = document.createElement("span");
  title.className = "rowTitle";
  title.textContent = "Tier-Holos";
  const meta = document.createElement("span");
  meta.className = "rowMeta";
  meta.textContent = "Salt, Peps, Tina, Gurke und Möhrchen";
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
      void restoreRemoteObservations();
      void flushPendingPhotos();
    } catch {}
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    try {
      loadState();
      void flushPendingObservations();
      void restoreRemoteObservations();
      void flushPendingPhotos();
    } catch {}
  });
  window.HumanHoloAnimalHolos = Object.freeze({
    open: openAnimalHolos,
    state: () => (animalState ? JSON.parse(serializeAnimalHoloState(animalState)) : null),
    context: (profileId = "") =>
      animalHoloPromptContext(loadState(), profileId),
    flush: flushPendingObservations,
    saveObservation,
    captureConversationProposal,
    handleConversationReply,
    pendingConversationProposal: readPendingConversationProposal
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", install, { once: true });
} else {
  install();
}
