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
let animalState = null;
let selectedProfileId = "";
let syncing = false;
let syncingPhotos = false;
let restoringObservations = false;
let photoInputProfileId = "";
let photoRenderRevision = 0;

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

async function prepareAnimalPhoto(file) {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!file || !allowed.has(file.type)) {
    throw new Error("Bitte wähle ein JPEG-, PNG- oder WebP-Bild aus.");
  }
  if (file.size > MAX_LOCAL_PHOTO_INPUT_BYTES) {
    throw new Error("Das ausgewählte Tierfoto ist größer als 18 MB.");
  }

  const source = await imageElementFromFile(file);
  const longest = Math.max(source.naturalWidth, source.naturalHeight);
  const scale = Math.min(1, 1440 / Math.max(1, longest));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Das Tierfoto konnte nicht vorbereitet werden.");
  context.fillStyle = "#08142b";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

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
    label.textContent = profileDisplayName(profile);
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

  const hero = document.createElement("article");
  hero.className = "animalHoloHero";

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
  photoPlaceholder.textContent = profileIcon(profile);
  photoFrame.append(photo, photoPlaceholder);
  const photoButton = document.createElement("button");
  photoButton.type = "button";
  photoButton.className = "animalHoloPhotoButton";
  photoButton.textContent = "📷 Foto ändern";
  photoButton.addEventListener("click", () => {
    photoInputProfileId = profile.id;
    const input = document.getElementById("animalHoloPhotoInput");
    if (input) {
      input.value = "";
      input.click();
    }
  });
  photoColumn.append(photoFrame, photoButton);

  const identityCard = document.createElement("div");
  identityCard.className = "animalHoloIdentityCard";
  const paw = document.createElement("span");
  paw.className = "animalHoloIdentityPaw";
  paw.textContent = "🐾";
  const title = document.createElement("h3");
  title.textContent = profileDisplayName(profile).toLocaleUpperCase("de-DE");
  const meta = document.createElement("p");
  const canonicalName =
    profile.id === "pepper" && profile.name !== profileDisplayName(profile)
      ? profile.name
      : "";
  meta.textContent = [profile.species, profile.breed, canonicalName, profile.projectName]
    .filter(Boolean)
    .join(" · ");
  const assignment = document.createElement("p");
  assignment.className = "animalHoloAssignment";
  assignment.textContent = "💚 " + profileAssignment(profile);
  const summary = document.createElement("p");
  summary.className = "animalHoloSummary";
  summary.textContent = profile.summary || "Nur bestätigte Erinnerungen dieses Tier-Holos.";
  identityCard.append(paw, title, meta, assignment, summary);
  hero.append(photoColumn, identityCard);
  container.append(hero);

  const createDetail = ({ icon, titleText, subtitle, open = false }) => {
    const details = document.createElement("details");
    details.className = "animalHoloDetail";
    details.open = open;
    const summaryRow = document.createElement("summary");
    const summaryIcon = document.createElement("span");
    summaryIcon.className = "animalHoloDetailIcon";
    summaryIcon.textContent = icon;
    const summaryCopy = document.createElement("span");
    summaryCopy.className = "animalHoloDetailCopy";
    const summaryTitle = document.createElement("strong");
    summaryTitle.textContent = titleText;
    const summarySubtitle = document.createElement("small");
    summarySubtitle.textContent = subtitle;
    summaryCopy.append(summaryTitle, summarySubtitle);
    const chevron = document.createElement("span");
    chevron.className = "animalHoloDetailChevron";
    chevron.textContent = "›";
    summaryRow.append(summaryIcon, summaryCopy, chevron);
    const body = document.createElement("div");
    body.className = "animalHoloDetailBody";
    details.append(summaryRow, body);
    container.append(details);
    return body;
  };

  const factsBody = createDetail({
    icon: "🐾",
    titleText: "Über " + profileDisplayName(profile),
    subtitle: "Charakter · Verhalten · Besonderheiten"
  });
  const facts = document.createElement("ul");
  facts.className = "animalHoloFactList";
  for (const fact of profile.baselineFacts) appendListItem(facts, fact);
  factsBody.append(facts);

  const observationCount = profile.observations.length;
  const observationsBody = createDetail({
    icon: "▤",
    titleText: "Erinnerungen",
    subtitle:
      observationCount +
      " gespeicherte Beobachtung" +
      (observationCount === 1 ? "" : "en"),
    open: observationCount > 0
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
    icon: "♡",
    titleText: "Sicherheit",
    subtitle: "Tierwohl · Kinder · wichtige Regeln"
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

  const footer = document.createElement("p");
  footer.className = "animalHoloProfileFooter";
  footer.textContent =
    profile.id === "tina"
      ? "🐾 Für immer im Herzen ♡"
      : "🐾 Danke, dass es dich gibt ♡";
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
  const count = animalState?.profiles.reduce(
    (total, profile) => total + profile.observations.length,
    0
  ) || 0;
  const badge = document.getElementById("animalHoloMemoryBadge");
  if (badge) {
    badge.textContent =
      "∞ Always-on · " +
      count +
      " Beobachtung" +
      (count === 1 ? "" : "en") +
      " gespeichert";
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
  void restoreRemoteObservations();
  void flushPendingPhotos();
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
    ".animalHoloOverlay{position:fixed;inset:0;z-index:2147481000;background:radial-gradient(circle at 15% 12%,rgba(128,69,255,.35),transparent 34%),radial-gradient(circle at 88% 28%,rgba(21,202,255,.3),transparent 38%),radial-gradient(circle at 50% 100%,rgba(232,91,255,.24),transparent 42%),rgba(1,5,25,.92);backdrop-filter:blur(20px);padding:calc(env(safe-area-inset-top) + 8px) 10px calc(env(safe-area-inset-bottom) + 8px);overflow:auto}",
    ".animalHoloOverlay[hidden]{display:none!important}",
    ".animalHoloDialog{position:relative;width:min(760px,100%);min-height:calc(100dvh - 20px);box-sizing:border-box;margin:2px auto;padding:16px;border:1px solid rgba(155,224,255,.65);border-radius:30px;background:linear-gradient(155deg,rgba(39,42,128,.78),rgba(7,19,62,.93) 48%,rgba(26,15,83,.9));box-shadow:inset 0 0 34px rgba(95,219,255,.15),0 24px 85px rgba(0,0,0,.6),0 0 42px rgba(133,73,255,.38);color:#fbfaff;overflow:hidden}",
    ".animalHoloDialog:before{content:'';position:absolute;inset:-30%;pointer-events:none;background:conic-gradient(from 80deg,transparent,rgba(71,221,255,.12),transparent 30%,rgba(240,110,255,.13),transparent 64%);filter:blur(25px)}",
    ".animalHoloDialog>*{position:relative}",
    ".animalHoloHeader{display:grid;grid-template-columns:48px 1fr 48px;align-items:center;gap:10px;margin-bottom:4px}",
    ".animalHoloBrandMark{display:grid;place-items:center;width:45px;height:45px;border:1px solid rgba(201,165,255,.75);border-radius:50% 50% 47% 53%;background:rgba(58,39,143,.55);box-shadow:0 0 22px rgba(196,112,255,.55);font-size:1.45rem}",
    ".animalHoloBrand{text-align:center}",
    ".animalHoloBrand h2{margin:0;font-size:clamp(1.25rem,5vw,1.72rem);font-weight:500;letter-spacing:.22em}",
    ".animalHoloEyebrow{margin:.15rem 0 0;color:#e2cfff;font-size:.78rem;font-style:italic;letter-spacing:.06em}",
    ".animalHoloClose{display:grid;place-items:center;min-width:44px;min-height:44px;border-radius:50%;border:1px solid rgba(166,231,255,.48);background:rgba(6,13,47,.42);box-shadow:inset 0 0 14px rgba(92,216,255,.12);color:white;font-size:1.65rem;cursor:pointer}",
    ".animalHoloLead{margin:.45rem auto .75rem;max-width:630px;text-align:center;color:#d9d8ed;line-height:1.45;font-size:.9rem}",
    ".animalHoloMemoryBadge{display:flex;width:max-content;max-width:100%;box-sizing:border-box;margin:.25rem auto .8rem;padding:.48rem .85rem;border-radius:999px;background:linear-gradient(110deg,rgba(62,235,192,.14),rgba(75,176,255,.13));border:1px solid rgba(83,236,214,.48);box-shadow:0 0 18px rgba(54,221,222,.13);color:#8ef6df;font-weight:750;font-size:.79rem}",
    ".animalHoloProfiles{display:flex;gap:7px;overflow:auto;padding:4px 1px 12px;scrollbar-width:none}",
    ".animalHoloProfiles::-webkit-scrollbar{display:none}",
    ".animalHoloProfileButton{flex:0 0 auto;display:flex;align-items:center;gap:6px;border:1px solid rgba(170,145,255,.5);border-radius:16px;padding:.58rem .78rem;background:linear-gradient(145deg,rgba(255,255,255,.11),rgba(83,79,188,.08));box-shadow:inset 0 0 16px rgba(174,116,255,.09);color:#eeeaff;font-weight:760;cursor:pointer}",
    ".animalHoloProfileButton[data-selected=true]{border-color:#63e5ff;background:linear-gradient(115deg,rgba(183,74,255,.43),rgba(34,194,255,.31));box-shadow:inset 0 0 17px rgba(255,255,255,.13),0 0 20px rgba(92,209,255,.29)}",
    ".animalHoloSelected{margin:0 0 13px}",
    ".animalHoloHero{display:grid;grid-template-columns:minmax(160px,.9fr) minmax(0,1.15fr);gap:14px;padding:13px;border:1px solid rgba(166,223,255,.56);border-radius:25px;background:linear-gradient(140deg,rgba(225,173,255,.17),rgba(20,122,214,.15) 55%,rgba(250,129,255,.12));box-shadow:inset 0 0 26px rgba(111,206,255,.14),0 0 24px rgba(92,96,255,.17)}",
    ".animalHoloPhotoColumn{display:grid;align-content:start;gap:8px}",
    ".animalHoloPhotoFrame{position:relative;display:grid;place-items:center;aspect-ratio:4/3;overflow:hidden;border:1px solid rgba(214,206,255,.62);border-radius:18px;background:radial-gradient(circle,rgba(131,99,240,.46),rgba(11,28,76,.78));box-shadow:inset 0 0 20px rgba(145,220,255,.25),0 0 18px rgba(116,126,255,.22)}",
    ".animalHoloPhotoFrame img{width:100%;height:100%;object-fit:cover}",
    ".animalHoloPhotoFrame img[hidden],.animalHoloPhotoPlaceholder[hidden]{display:none!important}",
    ".animalHoloPhotoPlaceholder{font-size:3.8rem;filter:drop-shadow(0 0 16px rgba(100,230,255,.48))}",
    ".animalHoloPhotoButton{min-height:40px;border:1px solid rgba(99,229,255,.48);border-radius:13px;background:rgba(8,29,80,.58);color:#eafdff;font:inherit;font-weight:750;cursor:pointer}",
    ".animalHoloIdentityCard{position:relative;align-self:stretch;padding:8px 6px 4px}",
    ".animalHoloIdentityPaw{display:inline-block;font-size:1.85rem;filter:drop-shadow(0 0 12px rgba(255,163,244,.65))}",
    ".animalHoloIdentityCard h3{margin:.2rem 0;font-size:clamp(1.65rem,7vw,2.35rem);letter-spacing:.045em;background:linear-gradient(90deg,#fff,#a9ecff 55%,#e8b6ff);background-clip:text;-webkit-background-clip:text;color:transparent}",
    ".animalHoloIdentityCard>p{margin:.38rem 0;color:#cbc9e8;line-height:1.35}",
    ".animalHoloIdentityCard .animalHoloAssignment{margin:.72rem 0;color:#9df5cd;font-weight:780}",
    ".animalHoloIdentityCard .animalHoloSummary{color:#f0ecfb;line-height:1.46}",
    ".animalHoloDetail{margin:10px 0;border:1px solid rgba(182,174,255,.43);border-radius:19px;background:linear-gradient(110deg,rgba(255,255,255,.12),rgba(47,98,188,.12),rgba(178,79,226,.1));box-shadow:inset 0 0 20px rgba(128,183,255,.11),0 0 17px rgba(137,93,255,.1);overflow:hidden}",
    ".animalHoloDetail summary{display:grid;grid-template-columns:50px 1fr 28px;align-items:center;gap:10px;min-height:70px;padding:7px 12px;list-style:none;cursor:pointer}",
    ".animalHoloDetail summary::-webkit-details-marker{display:none}",
    ".animalHoloDetailIcon{display:grid;place-items:center;width:44px;height:44px;border:1px solid rgba(104,232,255,.6);border-radius:50%;background:rgba(38,70,160,.55);box-shadow:inset 0 0 14px rgba(108,215,255,.27),0 0 14px rgba(90,204,255,.21);font-size:1.35rem;color:#b7f6ff}",
    ".animalHoloDetailCopy{display:grid;gap:2px}",
    ".animalHoloDetailCopy strong{font-size:1.09rem;color:#fff}",
    ".animalHoloDetailCopy small{color:#c7c4df;font-size:.78rem;line-height:1.3}",
    ".animalHoloDetailChevron{font-size:2rem;line-height:1;transform:rotate(0);transition:transform .2s ease}",
    ".animalHoloDetail[open] .animalHoloDetailChevron{transform:rotate(90deg)}",
    ".animalHoloDetailBody{padding:0 14px 14px;border-top:1px solid rgba(186,206,255,.16);color:#e9e6f6;line-height:1.45}",
    ".animalHoloDetailBody p{margin:.75rem 0 0}",
    ".animalHoloFactList,.animalHoloObservationList{margin:.75rem 0 0;padding-left:1.25rem;display:grid;gap:.55rem;line-height:1.43}",
    ".animalHoloObservationList li{padding:.58rem .7rem;border:1px solid rgba(122,207,255,.18);border-radius:12px;background:rgba(3,11,39,.35)}",
    ".animalHoloEmpty{color:#aaa4c7;font-style:italic}",
    ".animalHoloProfileFooter{margin:13px 0 4px;text-align:center;color:#e6cafa;font-size:1.03rem;font-style:italic}",
    ".animalHoloFormCard{border:1px solid rgba(176,150,255,.36);border-radius:22px;background:linear-gradient(135deg,rgba(255,255,255,.095),rgba(49,79,176,.1));box-shadow:inset 0 0 20px rgba(104,187,255,.08);padding:15px;margin:0 0 14px}",
    ".animalHoloFormCard h3{margin:.1rem 0 .35rem;font-size:1.15rem}",
    ".animalHoloFormHint{margin:.2rem 0 .8rem;color:#a7ecd9;font-size:.82rem;line-height:1.4}",
    ".animalHoloFormCard label{display:grid;gap:.35rem;margin:.7rem 0;color:#e9e5f7;font-weight:700}",
    ".animalHoloFormCard textarea,.animalHoloFormCard input,.animalHoloFormCard select{box-sizing:border-box;width:100%;border:1px solid rgba(143,195,255,.42);border-radius:13px;padding:.78rem .85rem;background:rgba(2,7,31,.67);color:white;font:inherit;color-scheme:dark}",
    ".animalHoloActions{display:flex;flex-wrap:wrap;gap:9px;margin-top:12px}",
    ".animalHoloActions button{flex:1 1 190px;min-height:46px;border-radius:15px;border:1px solid rgba(113,226,255,.55);background:linear-gradient(110deg,rgba(155,65,255,.62),rgba(35,184,255,.46));box-shadow:inset 0 0 14px rgba(255,255,255,.1),0 0 14px rgba(68,180,255,.12);color:white;font-weight:800;padding:.75rem;cursor:pointer}",
    ".animalHoloActions .secondary{background:rgba(255,255,255,.06)}",
    ".animalHoloStatus{min-height:1.4rem;white-space:pre-wrap;line-height:1.4;color:#cfc9e7}",
    ".animalHoloStatus[data-kind=success]{color:#77f1d2}",
    ".animalHoloStatus[data-kind=error]{color:#ff9eaf}",
    ".animalHoloNewProfile[hidden]{display:none!important}",
    ".animalHoloDialog button:focus-visible,.animalHoloDialog summary:focus-visible,.animalHoloDialog input:focus-visible,.animalHoloDialog textarea:focus-visible,.animalHoloDialog select:focus-visible{outline:2px solid #7cecff;outline-offset:2px}",
    "@media (max-width:520px){.animalHoloOverlay{padding-left:5px;padding-right:5px}.animalHoloDialog{padding:12px;border-radius:24px}.animalHoloHero{grid-template-columns:minmax(120px,.8fr) minmax(0,1.2fr);gap:9px;padding:9px}.animalHoloIdentityCard{padding:3px 2px}.animalHoloIdentityCard h3{font-size:1.55rem}.animalHoloIdentityCard>p{font-size:.78rem}.animalHoloPhotoButton{font-size:.78rem}.animalHoloLead{font-size:.8rem}.animalHoloActions button{flex-basis:100%}}",
    "@media (max-width:360px){.animalHoloHero{grid-template-columns:1fr}.animalHoloPhotoFrame{max-height:220px}.animalHoloHeader{grid-template-columns:44px 1fr 44px}.animalHoloBrand h2{font-size:1rem;letter-spacing:.14em}}",
    "@media (prefers-reduced-motion:reduce){.animalHoloDetailChevron{transition:none}}"
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
    '<header class="animalHoloHeader"><span class="animalHoloBrandMark" aria-hidden="true">🐾</span>',
    '<div class="animalHoloBrand"><h2 id="animalHoloTitle">HUMAN HOLO</h2>',
    '<p class="animalHoloEyebrow">Forever Together ∞</p></div>',
    '<button id="animalHoloClose" class="animalHoloClose" type="button" aria-label="Tier-Holos schließen">×</button></header>',
    '<p class="animalHoloLead">Private Tierprofile, Fotos und bestätigte Erinnerungen – fest an dein Holo gebunden.</p>',
    '<div id="animalHoloMemoryBadge" class="animalHoloMemoryBadge">Always-on aktiv</div>',
    '<nav id="animalHoloProfiles" class="animalHoloProfiles" aria-label="Tier-Holo-Profile"></nav>',
    '<section id="animalHoloSelected" class="animalHoloSelected" aria-live="polite"></section>',
    '<input id="animalHoloPhotoInput" type="file" accept="image/jpeg,image/png,image/webp" hidden>',
    '<form id="animalHoloObservationForm" class="animalHoloFormCard">',
    '<h3>＋ Neue Erinnerung</h3>',
    '<p id="animalHoloFormHint" class="animalHoloFormHint">Wird direkt gespeichert – ohne zusätzliche Zustimmungsfrage.</p>',
    '<label>Tier-Holo<select id="animalHoloObservationProfile" required></select></label>',
    '<label>Was hast du selbst beobachtet?<textarea id="animalHoloObservationText" rows="3" maxlength="2000" required placeholder="Zum Beispiel: Salt zieht sich zurück, wenn es ihr zu lebhaft wird."></textarea></label>',
    '<label>Datum, wenn bekannt<input id="animalHoloObservationDate" type="date"></label>',
    '<div class="animalHoloActions"><button type="submit">Direkt speichern</button>',
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
        const identity = requireIdentity();
        setStatus("Das private Tierfoto wird vorbereitet …");
        const dataUrl = await prepareAnimalPhoto(file);
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
        setStatus(
          "Foto privat auf diesem Gerät gespeichert. Der ownergebundene Abgleich läuft automatisch.",
          "success"
        );
        const synchronized = await savePhotoRemotely({
          ...record,
          ownerId: identity.ownerId,
          speakerId: identity.speakerId
        });
        if (synchronized) {
          setStatus("Tierfoto privat und ownergebunden gespeichert ✅️", "success");
        }
      } catch (error) {
        setStatus(error.message, "error");
      } finally {
        input.value = "";
        photoInputProfileId = "";
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
