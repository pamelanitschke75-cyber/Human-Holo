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
const ANIMAL_HOLO_PRIMARY_NAVIGATION = Object.freeze(["salt", "pepper"]);
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

function profileIcon(profile) {
  return profile.species.toLocaleLowerCase("de-DE").includes("hund")
    ? "🐕"
    : "🐾";
}

function animalIconSvg(name) {
  const icons = {
    paw: '<svg class="animalHoloSvg animalHoloSvgPaw" viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="13" cy="14" rx="5" ry="7"/><ellipse cx="25" cy="10" rx="5" ry="7"/><ellipse cx="36" cy="15" rx="5" ry="7"/><ellipse cx="40" cy="27" rx="4.5" ry="6"/><path d="M12 32c1-7 7-12 14-12 8 0 14 6 14 13 0 6-5 10-11 8-3-1-5-1-8 0-6 2-10-2-9-9Z"/></svg>',
    home: '<svg class="animalHoloSvg" viewBox="0 0 48 48" aria-hidden="true"><path d="m7 23 17-15 17 15"/><path d="M11 21v20h26V21M20 41V29h8v12"/></svg>',
    heart: '<svg class="animalHoloSvg animalHoloSvgHeart" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 41S7 31 7 18.5C7 10 17 6 24 14c7-8 17-4 17 4.5C41 31 24 41 24 41Z"/></svg>',
    grid: '<svg class="animalHoloSvg" viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="7" width="13" height="13" rx="2"/><rect x="28" y="7" width="13" height="13" rx="2"/><rect x="7" y="28" width="13" height="13" rx="2"/><rect x="28" y="28" width="13" height="13" rx="2"/></svg>',
    list: '<svg class="animalHoloSvg" viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="6" width="32" height="36" rx="4"/><path d="M15 16h18M15 24h18M15 32h13"/></svg>',
    shield: '<svg class="animalHoloSvg" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5 40 11v11c0 10-6 17-16 22C14 39 8 32 8 22V11l16-6Z"/><path d="M24 33s-8-5-8-11c0-5 6-7 8-2 2-5 8-3 8 2 0 6-8 11-8 11Z"/></svg>',
    plus: '<svg class="animalHoloSvg" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 8v32M8 24h32"/></svg>',
    camera: '<svg class="animalHoloSvg" viewBox="0 0 48 48" aria-hidden="true"><path d="M7 16h9l3-5h10l3 5h9v25H7V16Z"/><circle cx="24" cy="28" r="8"/></svg>',
    menu: '<svg class="animalHoloSvg" viewBox="0 0 48 48" aria-hidden="true"><path d="M7 13h34M7 24h34M7 35h34"/></svg>',
    search: '<svg class="animalHoloSvg" viewBox="0 0 48 48" aria-hidden="true"><circle cx="21" cy="21" r="13"/><path d="m31 31 10 10"/></svg>',
    settings: '<svg class="animalHoloSvg" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="8"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l5 5M33 33l5 5M38 10l-5 5M15 33l-5 5"/></svg>'
  };
  return icons[name] || icons.paw;
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
    ? "Für immer im Herzen. ♡"
    : "Danke, dass es dich gibt. ♡";
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

async function ensureTrustedSession() {
  const ensure = window.SolHoloTrustedSession?.ensure;
  if (typeof ensure !== "function") return null;
  try {
    const trusted = await ensure({ interactive: false });
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
  if (!(await ensureTrustedSession())) return false;
  const response = await fetch(BACKEND_URL + "/animal-holos/profile-photo/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(window.SolHoloTrustedSession?.headers?.() || {})
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
  if (!identity || !(await ensureTrustedSession())) return null;
  const response = await fetch(BACKEND_URL + "/animal-holos/profile-photo/get", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(window.SolHoloTrustedSession?.headers?.() || {})
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
  if (!image || !placeholder || !record?.dataUrl) return;
  image.onload = () => {
    if (revision !== photoRenderRevision) return;
    image.hidden = false;
    placeholder.hidden = true;
  };
  image.onerror = () => {
    image.hidden = true;
    placeholder.hidden = false;
  };
  image.src = record.dataUrl;
}

async function renderProfilePhoto(profileId) {
  const revision = ++photoRenderRevision;
  try {
    let record = await readPhotoRecord(profileId);
    if (!record) record = await fetchRemotePhoto(profileId);
    if (record) showRenderedPhoto(record, revision);
  } catch {
    // Der Profilplatzhalter bleibt sichtbar; Textdaten funktionieren unabhängig.
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

function createDockButton({ icon, label, selected = false, onClick }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "animalHoloDockButton";
  button.dataset.selected = String(selected);
  button.setAttribute("aria-pressed", String(selected));
  const iconElement = document.createElement("span");
  iconElement.className = "animalHoloDockIcon";
  iconElement.innerHTML = animalIconSvg(icon);
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
    const icon = document.createElement("span");
    icon.className = "animalHoloMoreProfileIcon";
    icon.innerHTML = animalIconSvg(profile.id === "tina" ? "heart" : "paw");
    const label = document.createElement("span");
    label.textContent = profileDisplayName(profile);
    button.append(icon, label);
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
      icon: "home",
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
        icon: "paw",
        label: profileDisplayName(profile).toLocaleUpperCase("de-DE"),
        selected: profile.id === selectedProfileId,
        onClick: () => selectAnimalProfile(profile.id)
      })
    );
  }
  const selectedProfile = animalState.profiles.find(
    (profile) => profile.id === selectedProfileId
  );
  const saltPepsSelected = ANIMAL_HOLO_PRIMARY_NAVIGATION.includes(
    selectedProfileId
  );
  if (saltPepsSelected) {
    list.append(
      createDockButton({
        icon: "heart",
        label: "SALT & PEPS",
        onClick: () => {
          const askButton = document.getElementById("animalHoloAsk");
          if (!askButton) return;
          askButton.dataset.solPrompt =
            "Zeig mir das gemeinsame Tier-Holo von Salt und Peps. Nutze nur bestätigte Beobachtungen.";
          askButton.click();
        }
      })
    );
  } else if (selectedProfile) {
    list.append(
      createDockButton({
        icon: selectedProfile.id === "tina" ? "heart" : "paw",
        label: profileDisplayName(selectedProfile).toLocaleUpperCase("de-DE"),
        selected: true,
        onClick: () => selectAnimalProfile(selectedProfile.id)
      })
    );
  }
  const moreButton = createDockButton({
    icon: "grid",
    label: "Mehr",
    selected: moreProfilesOpen,
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
  photo.alt = "Privates Profilfoto von " + profileDisplayName(profile);
  photo.hidden = true;
  const photoPlaceholder = document.createElement("span");
  photoPlaceholder.id = "animalHoloPhotoPlaceholder";
  photoPlaceholder.className = "animalHoloPhotoPlaceholder";
  photoPlaceholder.innerHTML =
    animalIconSvg("paw") +
    '<small>Privates Tierfoto hinzufügen</small>';
  photoFrame.append(photo, photoPlaceholder);
  const photoButton = document.createElement("button");
  photoButton.type = "button";
  photoButton.className = "animalHoloPhotoButton";
  photoButton.innerHTML =
    animalIconSvg("camera") + "<span>Foto ändern</span>";
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
  const heading = document.createElement("div");
  heading.className = "animalHoloIdentityHeading";
  const paw = document.createElement("span");
  paw.className = "animalHoloIdentityPaw";
  paw.innerHTML = animalIconSvg("paw");
  const title = document.createElement("h3");
  title.textContent = profileDisplayName(profile).toLocaleUpperCase("de-DE");
  heading.append(paw, title);
  const meta = document.createElement("p");
  meta.textContent = profileMeta(profile).join(" · ");
  const assignment = document.createElement("p");
  assignment.className = "animalHoloAssignment";
  assignment.textContent = "💚 " + profileAssignment(profile);
  const tagline = document.createElement("p");
  tagline.className = "animalHoloTagline";
  tagline.textContent = profileTagline(profile);
  const family = document.createElement("span");
  family.className = "animalHoloFamilyMark";
  family.innerHTML = animalIconSvg("heart");
  family.setAttribute("aria-hidden", "true");
  const familyNote = document.createElement("span");
  familyNote.className = "animalHoloFamilyNote";
  familyNote.textContent = "Ein Teil unserer Familie ♡";
  const heartNote = document.createElement("span");
  heartNote.className = "animalHoloHeartNote";
  heartNote.textContent =
    profile.id === "tina"
      ? "Große Pfoten. Größte Spuren. ♡"
      : "Kleine Pfoten. Großes Herz. ♡";
  const identityWatermark = document.createElement("span");
  identityWatermark.className = "animalHoloIdentityWatermark";
  identityWatermark.innerHTML = animalIconSvg("paw");
  identityCard.append(
    heading,
    meta,
    assignment,
    tagline,
    family,
    familyNote,
    heartNote,
    identityWatermark
  );
  hero.append(photoColumn, identityCard);
  container.append(hero);

  const detailElements = [];
  const createDetail = ({
    icon,
    kind,
    titleText,
    subtitle,
    caption = ""
  }) => {
    const details = document.createElement("details");
    details.className = "animalHoloDetail";
    details.dataset.kind = kind;
    const summaryRow = document.createElement("summary");
    const summaryIcon = document.createElement("span");
    summaryIcon.className = "animalHoloDetailIcon";
    summaryIcon.innerHTML = animalIconSvg(icon);
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
    const chevron = document.createElement("span");
    chevron.className = "animalHoloDetailChevron";
    chevron.textContent = "›";
    const watermark = document.createElement("span");
    watermark.className = "animalHoloDetailWatermark";
    watermark.innerHTML = animalIconSvg("paw");
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
    icon: "paw",
    kind: "about",
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
    icon: "list",
    kind: "memories",
    titleText: "Erinnerungen",
    subtitle:
      profile.id === "tina"
        ? "Gemeinsame Momente · Geschichten · Entwicklung"
        : "Gemeinsame Momente · Beobachtungen · Entwicklung",
    caption: "Was Holo über " + profileDisplayName(profile) + " weiß"
  });
  const observationHeading = document.createElement("p");
  observationHeading.className = "animalHoloObservationCount";
  observationHeading.textContent =
    observationCount +
    " gespeicherte Beobachtung" +
    (observationCount === 1 ? "" : "en");
  observationsBody.append(observationHeading);
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
    icon: "shield",
    kind: "safety",
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
    icon: "plus",
    kind: "new-memory",
    titleText: "Neue Erinnerung",
    subtitle: "Foto · Text · Sprache",
    caption: "Jeder Moment zählt ♡"
  });
  if (form) {
    form.hidden = false;
    newMemoryBody.append(form);
  }

  const footer = document.createElement("div");
  footer.className = "animalHoloProfileFooter";
  const footerPaw = document.createElement("span");
  footerPaw.className = "animalHoloFooterPaw";
  footerPaw.innerHTML = animalIconSvg("paw");
  const footerText = document.createElement("span");
  footerText.className = "animalHoloFooterText";
  footerText.textContent = profileFooter(profile);
  const footerProject = document.createElement("span");
  footerProject.className = "animalHoloFooterProject";
  footerProject.textContent =
    (profile.id === "tina"
      ? "TINA"
      : profile.projectName || profileDisplayName(profile).toLocaleUpperCase("de-DE")) +
    "  ∞";
  footer.append(footerPaw, footerText, footerProject);
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
  document.getElementById("animalHoloMenu")?.focus();
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
  style.textContent = `
    body.animalHoloOpen{overflow:hidden}
    .animalHoloOverlay{position:fixed;inset:0;z-index:2147481000;box-sizing:border-box;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);overflow:auto;background:radial-gradient(circle at 8% 9%,rgba(165,73,255,.68),transparent 28%),radial-gradient(circle at 88% 16%,rgba(35,205,255,.55),transparent 31%),radial-gradient(circle at 55% 47%,rgba(65,95,255,.42),transparent 38%),radial-gradient(circle at 16% 75%,rgba(237,78,255,.42),transparent 32%),radial-gradient(circle at 92% 88%,rgba(41,220,255,.38),transparent 30%),linear-gradient(165deg,#07124a 0%,#121764 34%,#08195b 62%,#251060 100%);-webkit-text-size-adjust:100%;font-family:Inter,"Segoe UI",Roboto,Arial,sans-serif}
    .animalHoloOverlay[hidden]{display:none!important}
    .animalHoloDialog{position:relative;width:min(760px,100%);min-height:100dvh;box-sizing:border-box;margin:0 auto;padding:5px 8px calc(96px + env(safe-area-inset-bottom));overflow:hidden;color:#fbfaff;background:radial-gradient(circle at 48% 2%,rgba(45,185,255,.28),transparent 23%),radial-gradient(circle at 78% 23%,rgba(255,98,242,.25),transparent 25%),radial-gradient(circle at 22% 53%,rgba(61,197,255,.18),transparent 24%),linear-gradient(160deg,rgba(20,31,111,.72),rgba(4,18,70,.9) 52%,rgba(31,15,91,.87));box-shadow:inset 0 0 58px rgba(84,221,255,.22),0 0 46px rgba(125,69,255,.42)}
    .animalHoloDialog:before,.animalHoloDialog:after{content:"";position:absolute;pointer-events:none}
    .animalHoloDialog:before{inset:0;opacity:.68;background-image:radial-gradient(circle,rgba(255,255,255,.94) 0 1px,transparent 1.6px),radial-gradient(circle,rgba(91,222,255,.85) 0 1px,transparent 1.7px),radial-gradient(circle,rgba(255,146,246,.72) 0 1.2px,transparent 1.9px);background-size:43px 47px,71px 67px,97px 89px;background-position:7px 11px,19px 31px,51px 13px;mix-blend-mode:screen}
    .animalHoloDialog:after{inset:-12%;background:conic-gradient(from 70deg,transparent 0 9%,rgba(69,219,255,.18) 18%,transparent 29% 45%,rgba(237,96,255,.2) 57%,transparent 70%);filter:blur(28px)}
    .animalHoloDialog>*{position:relative;z-index:1}
    .animalHoloSvg{display:block;width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
    .animalHoloSvgPaw{fill:currentColor;stroke:none}
    .animalHoloHeader{display:grid;grid-template-columns:34px 49px minmax(0,1fr) 34px 34px;align-items:center;gap:5px;min-height:62px;padding:1px 3px 5px;margin:0 0 5px}
    .animalHoloHeaderButton{display:grid;place-items:center;width:34px;height:40px;padding:5px;border:0;background:transparent;color:#f8fbff;filter:drop-shadow(0 0 7px rgba(101,222,255,.7));cursor:pointer}
    .animalHoloHeaderButton .animalHoloSvg{stroke-width:3}
    .animalHoloBrandMark{display:grid;place-items:center;width:49px;height:54px;filter:drop-shadow(0 0 6px #53dfff) drop-shadow(0 0 10px #b866ff)}
    .animalHoloBrandMark svg{width:100%;height:100%;overflow:visible}
    .animalHoloLogoHeart{fill:rgba(42,72,193,.36);stroke:#efb0ff;stroke-width:2.1}
    .animalHoloLogoPaw{fill:#8eeeff;stroke:none;filter:drop-shadow(0 0 4px #34d8ff)}
    .animalHoloBrand{text-align:center;min-width:0}
    .animalHoloBrand h2{margin:0;white-space:nowrap;font-size:clamp(16px,4.7vw,25px);font-weight:500;line-height:1.05;letter-spacing:.17em;text-shadow:0 0 10px rgba(118,226,255,.46)}
    .animalHoloEyebrow{margin:3px 0 0;white-space:nowrap;color:#f1d9ff;font-family:"Segoe Script","Brush Script MT",cursive;font-size:clamp(12px,3.6vw,18px);font-style:italic;line-height:1;letter-spacing:.02em;text-shadow:0 0 7px rgba(224,149,255,.65)}
    .animalHoloSelected{margin:0}
    .animalHoloHero{position:relative;height:clamp(214px,62vw,310px);margin-bottom:8px;border:1.5px solid rgba(208,238,255,.94);border-radius:24px;background:radial-gradient(circle at 21% 24%,rgba(255,192,247,.2),transparent 30%),linear-gradient(128deg,rgba(183,142,255,.25),rgba(25,153,224,.21) 55%,rgba(230,100,255,.18));box-shadow:0 0 2px #fff,0 0 9px rgba(78,226,255,.92),0 0 16px rgba(216,100,255,.66),inset 0 0 28px rgba(112,216,255,.26);backdrop-filter:blur(15px) saturate(1.35);overflow:hidden}
    .animalHoloPhotoColumn{position:absolute;inset:4px auto 4px 4px;width:63%;min-width:0}
    .animalHoloPhotoFrame{position:relative;display:grid;place-items:center;width:100%;height:100%;overflow:hidden;border-radius:20px;background:radial-gradient(circle at 50% 38%,rgba(116,98,232,.65),rgba(10,31,88,.93) 74%);box-shadow:inset 0 0 28px rgba(122,222,255,.3)}
    .animalHoloPhotoFrame:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 56%,rgba(20,40,133,.48) 82%,rgba(35,28,116,.74));mix-blend-mode:screen}
    .animalHoloPhotoFrame img{width:100%;height:100%;object-fit:cover}
    .animalHoloHero[data-profile=tina] .animalHoloPhotoFrame img{object-position:50% center}
    .animalHoloPhotoFrame img[hidden],.animalHoloPhotoPlaceholder[hidden]{display:none!important}
    .animalHoloPhotoPlaceholder{display:grid;place-items:center;gap:8px;width:78px;color:#afdcff;text-align:center;filter:drop-shadow(0 0 13px rgba(104,222,255,.62))}
    .animalHoloPhotoPlaceholder .animalHoloSvg{height:62px;color:#c58cff}
    .animalHoloPhotoPlaceholder small{font-size:10px;line-height:1.2;color:#e7e2fa}
    .animalHoloPhotoButton{position:absolute;left:9px;bottom:9px;z-index:3;display:flex;align-items:center;gap:6px;min-height:35px;padding:6px 12px;border:1.4px solid rgba(181,245,255,.95);border-radius:18px;background:linear-gradient(115deg,rgba(31,100,193,.94),rgba(62,49,159,.95));box-shadow:0 0 2px #fff,0 0 10px rgba(71,220,255,.74),inset 0 0 12px rgba(255,255,255,.18);color:#faffff;font-size:12px;font-weight:760;cursor:pointer}
    .animalHoloPhotoButton .animalHoloSvg{width:23px;height:23px;stroke-width:2.4}
    .animalHoloIdentityCard{position:absolute;z-index:2;top:13px;right:8px;bottom:13px;width:55%;box-sizing:border-box;padding:15px 25px 10px 28px;border:1.5px solid rgba(191,231,255,.96);border-radius:22px;background:radial-gradient(circle at 84% 17%,rgba(195,91,255,.23),transparent 32%),linear-gradient(145deg,rgba(22,75,179,.95),rgba(31,41,142,.94) 58%,rgba(101,45,170,.92));box-shadow:0 0 2px #fff,0 0 10px rgba(76,218,255,.8),0 0 16px rgba(207,92,255,.55),inset 0 0 24px rgba(115,224,255,.24);overflow:hidden}
    .animalHoloIdentityHeading{display:flex;align-items:center;gap:6px;max-width:88%;margin:1px 0 5px}
    .animalHoloIdentityPaw{flex:0 0 30px;width:30px;height:30px;color:#ffc2ef;filter:drop-shadow(0 0 8px rgba(255,161,237,.9))}
    .animalHoloIdentityCard h3{min-width:0;margin:0;white-space:nowrap;font-size:clamp(24px,6.6vw,42px);font-weight:800;line-height:1;letter-spacing:.035em;background:linear-gradient(90deg,#fff 0%,#a9f0ff 57%,#efb6ff 100%);background-clip:text;-webkit-background-clip:text;color:transparent;text-shadow:0 0 16px rgba(138,211,255,.15)}
    .animalHoloIdentityCard>p{position:relative;z-index:2;max-width:78%;margin:6px 0;color:#e5e1f4;font-size:clamp(10px,2.65vw,15px);line-height:1.28}
    .animalHoloIdentityCard .animalHoloAssignment{max-width:85%;margin:9px 0;color:#dffbf0;font-weight:780}
    .animalHoloIdentityCard .animalHoloTagline{max-width:75%;color:#f4effc}
    .animalHoloFamilyMark{position:absolute;right:10px;top:9px;width:23px;height:23px;color:#fff;filter:drop-shadow(0 0 7px rgba(227,181,255,.7))}
    .animalHoloFamilyNote,.animalHoloHeartNote{position:absolute;z-index:2;right:7px;width:46px;color:#f3dbff;font-family:"Segoe Script","Brush Script MT",cursive;font-size:9px;font-style:italic;line-height:1.12;text-align:center;transform:rotate(-5deg);text-shadow:0 0 6px rgba(229,158,255,.72)}
    .animalHoloFamilyNote{top:41px}
    .animalHoloHeartNote{right:12px;bottom:14px;width:92px;font-size:10px;transform:rotate(-7deg)}
    .animalHoloIdentityWatermark{position:absolute;left:20px;bottom:-8px;width:55px;height:55px;color:rgba(115,140,235,.37);transform:rotate(-8deg)}
    .animalHoloDetail{position:relative;margin:7px 0;border:1.5px solid rgba(208,226,255,.91);border-radius:19px;background:radial-gradient(circle at 87% 18%,rgba(247,147,255,.26),transparent 25%),radial-gradient(circle at 31% 95%,rgba(36,211,255,.22),transparent 35%),linear-gradient(112deg,rgba(222,194,255,.25),rgba(37,116,209,.38) 50%,rgba(139,68,203,.28));box-shadow:0 0 2px #fff,0 0 8px rgba(70,218,255,.7),0 0 13px rgba(223,97,255,.46),inset 0 0 22px rgba(141,218,255,.2);backdrop-filter:blur(16px) saturate(1.35);overflow:hidden}
    .animalHoloDetail:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(120deg,rgba(255,255,255,.16),transparent 24% 72%,rgba(255,170,249,.12));opacity:.8}
    .animalHoloDetail summary{position:relative;z-index:1;display:grid;grid-template-columns:50px minmax(0,1fr) 22px;align-items:center;gap:9px;min-height:70px;padding:6px 10px;list-style:none;cursor:pointer}
    .animalHoloDetail summary::-webkit-details-marker{display:none}
    .animalHoloDetailIcon{display:grid;place-items:center;width:46px;height:46px;padding:10px;box-sizing:border-box;border:1.4px solid rgba(151,242,255,.95);border-radius:50%;background:radial-gradient(circle at 34% 25%,rgba(255,255,255,.22),transparent 24%),linear-gradient(145deg,rgba(54,91,194,.92),rgba(65,43,161,.9));box-shadow:0 0 2px #fff,0 0 11px rgba(66,224,255,.78),inset 0 0 14px rgba(105,224,255,.36);color:#bdf7ff}
    .animalHoloDetail[data-kind=about] .animalHoloDetailIcon{color:#ffd1f4}
    .animalHoloDetail[data-kind=safety] .animalHoloDetailIcon{color:#a2fff0}
    .animalHoloDetail[data-kind=new-memory] .animalHoloDetailIcon{color:#f4c5ff;border-color:#eea8ff;box-shadow:0 0 2px #fff,0 0 12px rgba(229,96,255,.8),inset 0 0 14px rgba(255,160,245,.3)}
    .animalHoloDetailCopy{display:grid;gap:1px;min-width:0}
    .animalHoloDetailCopy strong{font-size:clamp(17px,4.8vw,26px);font-weight:790;line-height:1.05;color:#fff;text-shadow:0 0 8px rgba(196,225,255,.35)}
    .animalHoloDetailCopy small{min-width:0;overflow:hidden;color:#e0dced;font-size:clamp(9px,2.55vw,14px);line-height:1.25;white-space:nowrap;text-overflow:clip}
    .animalHoloDetailCopy .animalHoloDetailCaption{color:#c4f1ff}
    .animalHoloDetail[data-kind=new-memory] .animalHoloDetailCaption{position:absolute;right:42px;top:24px;width:105px;overflow:visible;color:#f4d8ff;font-family:"Segoe Script","Brush Script MT",cursive;font-size:12px;font-style:italic;text-align:center;transform:rotate(-5deg);white-space:normal;text-shadow:0 0 7px rgba(222,135,255,.7)}
    .animalHoloDetailWatermark{position:absolute;right:44px;top:13px;width:43px;height:43px;color:rgba(145,160,239,.34);transform:rotate(8deg)}
    .animalHoloDetail[data-kind=new-memory] .animalHoloDetailWatermark{display:none}
    .animalHoloDetailChevron{font-size:30px;line-height:1;color:#fff;transform:rotate(0);transition:transform .2s ease;text-shadow:0 0 7px rgba(147,225,255,.8)}
    .animalHoloDetail[open] .animalHoloDetailChevron{transform:rotate(90deg)}
    .animalHoloDetailBody{position:relative;z-index:1;padding:2px 13px 13px;border-top:1px solid rgba(203,224,255,.28);background:rgba(3,13,55,.34);color:#f0edf8;font-size:13px;line-height:1.45}
    .animalHoloDetailBody p{margin:9px 0 0}
    .animalHoloFactList,.animalHoloObservationList{display:grid;gap:7px;margin:9px 0 0;padding-left:20px;line-height:1.43}
    .animalHoloObservationCount{color:#93f2de;font-size:12px;font-weight:760}
    .animalHoloObservationList li{padding:5px 0;border-bottom:1px solid rgba(122,207,255,.2)}
    .animalHoloObservationList li:last-child{border-bottom:0}
    .animalHoloEmpty{color:#bbb5d3;font-style:italic}
    .animalHoloProfileFooter{display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:8px;min-height:52px;box-sizing:border-box;margin:8px 0 11px;padding:5px 10px;border:1.4px solid rgba(204,231,255,.85);border-radius:19px;background:linear-gradient(110deg,rgba(93,59,176,.3),rgba(28,119,196,.32),rgba(101,48,177,.28));box-shadow:0 0 2px #fff,0 0 9px rgba(68,218,255,.62),0 0 13px rgba(218,91,255,.43),inset 0 0 18px rgba(139,219,255,.16)}
    .animalHoloFooterPaw{width:30px;height:30px;color:#ffd0ef;filter:drop-shadow(0 0 7px rgba(255,141,228,.72))}
    .animalHoloFooterText{min-width:0;color:#f0d6ff;font-family:"Segoe Script","Brush Script MT",cursive;font-size:clamp(14px,4vw,22px);font-style:italic;white-space:nowrap;text-shadow:0 0 7px rgba(225,145,255,.6)}
    .animalHoloFooterProject{min-width:86px;padding:7px 12px;border:1px solid rgba(171,241,255,.86);border-radius:18px;background:linear-gradient(110deg,rgba(42,116,199,.75),rgba(70,50,165,.77));box-shadow:0 0 10px rgba(74,223,255,.58),inset 0 0 10px rgba(255,255,255,.13);color:#fff;font-size:11px;text-align:center;white-space:nowrap}
    .animalHoloInlineForm{padding:8px 0 0;margin:0}
    .animalHoloInlineForm[hidden],.animalHoloFormParking[hidden]{display:none!important}
    .animalHoloFormHint{margin:0 0 8px;color:#a7ecd9;font-size:12px;line-height:1.4}
    .animalHoloInlineForm label,.animalHoloNewProfile label{display:grid;gap:4px;margin:8px 0;color:#f0ecfb;font-size:13px;font-weight:700}
    .animalHoloInlineForm textarea,.animalHoloInlineForm input,.animalHoloInlineForm select,.animalHoloNewProfile input{box-sizing:border-box;width:100%;border:1px solid rgba(143,220,255,.6);border-radius:13px;padding:10px 11px;background:rgba(2,7,31,.72);color:white;font:inherit;color-scheme:dark}
    .animalHoloProfileChooser{display:none!important}
    .animalHoloActions{display:flex;flex-wrap:wrap;gap:9px;margin-top:12px}
    .animalHoloActions button{flex:1 1 150px;min-height:43px;border:1px solid rgba(124,234,255,.7);border-radius:15px;background:linear-gradient(110deg,rgba(155,65,255,.7),rgba(35,184,255,.55));box-shadow:inset 0 0 14px rgba(255,255,255,.1),0 0 14px rgba(68,180,255,.18);color:white;font-size:13px;font-weight:800;padding:10px;cursor:pointer}
    .animalHoloActions .secondary{background:rgba(255,255,255,.07)}
    .animalHoloStatus{min-height:0;margin:5px 4px;white-space:pre-wrap;font-size:11px;line-height:1.35;color:#d6d0e8}
    .animalHoloStatus[data-kind=success]{color:#77f1d2}
    .animalHoloStatus[data-kind=error]{color:#ff9eaf}
    .animalHoloMoreMenu{position:fixed;z-index:7;left:50%;bottom:calc(86px + env(safe-area-inset-bottom));width:min(736px,calc(100% - 16px));box-sizing:border-box;transform:translateX(-50%);padding:10px;border:1.5px solid rgba(176,237,255,.9);border-radius:19px;background:radial-gradient(circle at 80% 10%,rgba(205,80,255,.25),transparent 35%),linear-gradient(145deg,rgba(19,52,145,.98),rgba(48,25,121,.98));box-shadow:0 0 3px #fff,0 0 17px rgba(62,211,255,.7),0 0 22px rgba(203,84,255,.46),inset 0 0 22px rgba(111,212,255,.15)}
    .animalHoloMoreMenu[hidden],.animalHoloNewProfile[hidden]{display:none!important}
    .animalHoloMoreProfiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
    .animalHoloMoreProfileButton,.animalHoloMoreAction{display:flex;align-items:center;justify-content:center;gap:7px;min-height:42px;border:1px solid rgba(158,221,255,.65);border-radius:13px;background:rgba(255,255,255,.08);color:#fff;font-weight:750;cursor:pointer}
    .animalHoloMoreProfileIcon{width:23px;height:23px;color:#dcbcff}
    .animalHoloMoreProfileButton[data-selected=true]{border-color:#75efff;background:rgba(49,155,220,.3);box-shadow:0 0 10px rgba(83,221,255,.45)}
    .animalHoloMoreActions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}
    .animalHoloNewProfile{margin-top:9px;padding:10px;border-top:1px solid rgba(151,223,255,.25)}
    .animalHoloNewProfile h3{margin:0 0 6px;font-size:16px}
    .animalHoloProfiles{position:fixed;z-index:8;left:50%;bottom:env(safe-area-inset-bottom);display:grid;grid-template-columns:repeat(5,minmax(0,1fr));width:min(744px,calc(100% - 16px));height:78px;box-sizing:border-box;transform:translateX(-50%);border:1.5px solid rgba(207,234,255,.92);border-radius:21px 21px 4px 4px;background:radial-gradient(circle at 47% 15%,rgba(164,72,255,.3),transparent 34%),linear-gradient(145deg,rgba(35,62,157,.97),rgba(17,66,151,.98) 52%,rgba(69,31,137,.97));box-shadow:0 0 3px #fff,0 0 13px rgba(62,217,255,.78),0 0 19px rgba(208,84,255,.55),inset 0 0 25px rgba(109,215,255,.22);overflow:hidden}
    .animalHoloDockButton{display:grid;place-items:center;align-content:center;gap:3px;min-width:0;padding:5px 2px;border:0;border-right:1px solid rgba(203,218,255,.28);background:linear-gradient(180deg,rgba(255,255,255,.05),transparent);color:#eeebfa;font-size:10px;cursor:pointer}
    .animalHoloDockButton:last-child{border-right:0}
    .animalHoloDockIcon{display:block;width:27px;height:27px;color:#e9edff;filter:drop-shadow(0 0 7px rgba(121,218,255,.58))}
    .animalHoloDockButton:nth-child(2) .animalHoloDockIcon{color:#d7eaff}
    .animalHoloDockButton:nth-child(3) .animalHoloDockIcon{color:#ffd1ef}
    .animalHoloDockLabel{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .animalHoloDockButton[data-selected=true]{position:relative;z-index:1;border:1px solid rgba(217,226,255,.8);border-radius:18px;background:radial-gradient(circle at 50% 8%,rgba(226,127,255,.46),transparent 42%),linear-gradient(145deg,rgba(143,53,240,.82),rgba(23,198,238,.67));box-shadow:0 0 3px #fff,0 0 12px rgba(91,222,255,.86),0 0 16px rgba(218,89,255,.6),inset 0 0 19px rgba(255,255,255,.2);color:#fff;font-weight:800}
    .animalHoloDialog button:focus-visible,.animalHoloDialog summary:focus-visible,.animalHoloDialog input:focus-visible,.animalHoloDialog textarea:focus-visible,.animalHoloDialog select:focus-visible{outline:2px solid #8ef3ff;outline-offset:2px}
    @media (max-width:520px){
      .animalHoloDialog{padding-left:7px;padding-right:7px}
      .animalHoloHero{height:clamp(208px,61vw,254px)}
      .animalHoloIdentityCard{padding:13px 22px 9px 25px}
      .animalHoloIdentityPaw{flex-basis:27px;width:27px;height:27px}
      .animalHoloIdentityCard h3{font-size:clamp(22px,6.5vw,31px)}
      .animalHoloIdentityCard>p{font-size:clamp(9.5px,2.65vw,12px)}
      .animalHoloDetailCopy strong{font-size:clamp(17px,4.7vw,22px)}
      .animalHoloFooterProject{min-width:78px;padding:7px 9px;font-size:10px}
    }
    @media (max-width:380px){
      .animalHoloHeader{grid-template-columns:31px 45px minmax(0,1fr) 31px 31px;gap:3px}
      .animalHoloHeaderButton{width:31px;height:36px;padding:4px}
      .animalHoloBrandMark{width:45px;height:49px}
      .animalHoloBrand h2{font-size:15px;letter-spacing:.14em}
      .animalHoloEyebrow{font-size:12px}
      .animalHoloIdentityCard{right:6px;width:56%;padding-left:23px}
      .animalHoloIdentityHeading{gap:4px}
      .animalHoloIdentityPaw{flex-basis:24px;width:24px;height:24px}
      .animalHoloFamilyNote{display:none}
      .animalHoloHeartNote{right:8px;width:82px;font-size:9px}
      .animalHoloDetail summary{grid-template-columns:47px minmax(0,1fr) 20px;gap:7px;padding-left:8px;padding-right:8px}
      .animalHoloDetailIcon{width:43px;height:43px;padding:9px}
      .animalHoloDetailCopy small{font-size:9px}
      .animalHoloDetailWatermark{right:38px;width:39px;height:39px}
      .animalHoloFooterText{font-size:14px}
      .animalHoloFooterProject{min-width:72px;padding:6px 7px;font-size:9px}
      .animalHoloDockLabel{font-size:9px}
    }
    @media (prefers-reduced-motion:reduce){.animalHoloDetailChevron{transition:none}}
  `;
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
    `<header class="animalHoloHeader"><button id="animalHoloMenu" class="animalHoloHeaderButton" type="button" aria-label="Tier-Holo-Menü öffnen">${animalIconSvg("menu")}</button>`,
    `<span class="animalHoloBrandMark" aria-hidden="true"><svg viewBox="0 0 64 60"><path class="animalHoloLogoHeart" d="M32 56S6 40 6 20C6 6 23 2 32 15 41 2 58 6 58 20c0 20-26 36-26 36Z"/><g class="animalHoloLogoPaw" transform="translate(17 13) scale(.62)"><ellipse cx="13" cy="14" rx="5" ry="7"/><ellipse cx="25" cy="10" rx="5" ry="7"/><ellipse cx="36" cy="15" rx="5" ry="7"/><ellipse cx="40" cy="27" rx="4.5" ry="6"/><path d="M12 32c1-7 7-12 14-12 8 0 14 6 14 13 0 6-5 10-11 8-3-1-5-1-8 0-6 2-10-2-9-9Z"/></g></svg></span>`,
    '<div class="animalHoloBrand"><h2 id="animalHoloTitle">HUMAN HOLO</h2>',
    '<p class="animalHoloEyebrow">Forever Together ∞</p></div>',
    `<button id="animalHoloSearch" class="animalHoloHeaderButton" type="button" aria-label="Mit Holo über dieses Tier sprechen">${animalIconSvg("search")}</button>`,
    `<button id="animalHoloSettings" class="animalHoloHeaderButton" type="button" aria-label="Einstellungen öffnen">${animalIconSvg("settings")}</button></header>`,
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

  document.getElementById("animalHoloMenu")?.addEventListener("click", () => {
    moreProfilesOpen = !moreProfilesOpen;
    renderProfileButtons();
  });
  document.getElementById("animalHoloSearch")?.addEventListener("click", () => {
    document.getElementById("animalHoloAsk")?.click();
  });
  document.getElementById("animalHoloSettings")?.addEventListener(
    "click",
    () => {
      closeAnimalHolos();
      document.getElementById("homeSettingsButton")?.click();
    }
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
  icon.textContent = "🐾";
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
