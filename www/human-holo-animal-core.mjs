/*
 * Human Holo Animal Core
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2026 Pamela Nitschke
 *
 * Open-build data structures and safety boundaries for owner-scoped animal
 * holos. Private photos, recordings and identity data are not part of this file.
 */

export const ANIMAL_HOLO_SCHEMA_VERSION = 2;
export const ANIMAL_HOLO_OWNER_ID = "pam-sol";
export const ANIMAL_HOLO_STORAGE_KEY = "human-holo-animal-memory-v1";
export const ANIMAL_HOLO_AUTO_SAVE_MARKER = "[TIER_HOLO_AUTOSAVE]";

export const ANIMAL_HOLO_CONVERSATION_REPLY = Object.freeze({
  CONFIRM: "confirm",
  CANCEL: "cancel",
  OTHER: "other"
});

const MAX_PROFILES = 50;
const MAX_OBSERVATIONS = 500;
const MAX_TEXT = 2_000;
const SYNC_STATES = new Set(["baseline", "local", "pending", "synced"]);

export const ANIMAL_HOLO_OPEN_BUILD = Object.freeze({
  license: "MIT",
  scope: "www/human-holo-animal-core.mjs",
  extensible: true,
  publicStarterPhotosIncluded: true,
  privateMediaIncluded: false
});

export const ANIMAL_HOLO_SAFETY = Object.freeze({
  identityBoundary:
    "Ein Tier-Holo bewahrt bestätigte Erinnerungen und Beobachtungen. Es ist niemals das wirkliche Tier und gibt nicht vor, dessen Gedanken oder Stimme zu kennen.",
  evidenceBoundary:
    "Nur bestätigte Beobachtungen werden als Tatsachen gespeichert. Vermutungen bleiben als Vermutungen gekennzeichnet.",
  childSafety:
    "Kinder und Tiere niemals allein oder unbeaufsichtigt lassen. Auch ein als gelassen erlebtes Tier braucht Rückzug, Schutz und eine aufmerksame erwachsene Begleitung.",
  welfare:
    "Wohlbefinden, Körpersprache, Rückzug und Grenzen des Tieres haben immer Vorrang. Ruhiges Verhalten ist keine Garantie für eine künftige Reaktion.",
  veterinaryBoundary:
    "Ein Tier-Holo ersetzt weder tierärztliche Untersuchung noch professionellen Rat bei Gesundheits- oder Verhaltensproblemen."
});

export const PAM_ANIMAL_HOLO_STARTERS = Object.freeze([
  Object.freeze({
    id: "salt",
    name: "Salt",
    nicknames: Object.freeze([]),
    species: "Katze",
    breed: "",
    projectName: "SALT & PEPS",
    humanReference: "Steffi",
    summary:
      "Salt gehört zum gemeinsamen Tier-Holo-Projekt SALT & PEPS und ist darin Steffi zugeordnet.",
    baselineFacts: Object.freeze([
      "Liebevoll großgezogen und kinderfreundlich sozialisiert."
    ]),
    observations: Object.freeze([
      Object.freeze({
        id: "salt_ruhiger_umgang_mit_kleinkindern",
        text:
          "Nach Pams Beobachtung geht Salt auch mit unkontrollierten Bewegungen sehr kleiner Kinder ruhig um.",
        observedAt: "",
        recordedAt: "2026-09-13T00:00:00.000Z",
        source: "owner_confirmed_starter",
        syncState: "synced"
      }),
      Object.freeze({
        id: "salt_rueckzug_bei_lebhaftigkeit",
        text: "Wenn es Salt zu lebhaft wird, zieht sie sich eher zurück.",
        observedAt: "",
        recordedAt: "2026-09-13T00:00:00.000Z",
        source: "owner_confirmed_starter",
        syncState: "synced"
      })
    ])
  }),
  Object.freeze({
    id: "pepper",
    name: "Pepper",
    nicknames: Object.freeze(["Peps"]),
    species: "Katze",
    breed: "",
    projectName: "SALT & PEPS",
    humanReference: "Pam",
    summary:
      "Pepper, genannt Peps, gehört zum gemeinsamen Tier-Holo-Projekt SALT & PEPS und ist darin Pam zugeordnet.",
    baselineFacts: Object.freeze([
      "Liebevoll großgezogen und kinderfreundlich sozialisiert.",
      "Nach Pams Beobachtung geht Peps auch mit unkontrollierten Bewegungen sehr kleiner Kinder ruhig um.",
      "Peps bleibt bei lebhaftem Familienalltag meist mitten im Geschehen."
    ]),
    observations: Object.freeze([])
  }),
  Object.freeze({
    id: "tina",
    name: "Tina",
    nicknames: Object.freeze([]),
    species: "Hund",
    breed: "Schäferhund",
    projectName: "Tinas Tier-Holo",
    humanReference: "Pam",
    summary:
      "Tina erhält ein eigenes Hund-Tier-Holo. Zu ihr werden ausschließlich von Pam bestätigte Erinnerungen und Beobachtungen gespeichert.",
    baselineFacts: Object.freeze([
      "Tina ist ein Schäferhund.",
      "Weitere Eigenschaften werden erst ergänzt, wenn Pam sie ausdrücklich bestätigt."
    ]),
    observations: Object.freeze([])
  }),
  Object.freeze({
    id: "gurke",
    name: "Gurke",
    nicknames: Object.freeze([]),
    species: "Katze",
    breed: "",
    projectName: "Gurke & Möhrchen",
    humanReference: "Pams Eltern",
    summary:
      "Gurke lebt gemeinsam mit Möhrchen bei Pams Eltern und gehört dort zur Familie.",
    baselineFacts: Object.freeze([
      "Gurke und Möhrchen leben bei Pams Eltern."
    ]),
    observations: Object.freeze([])
  }),
  Object.freeze({
    id: "moehrchen",
    name: "Möhrchen",
    nicknames: Object.freeze([]),
    species: "Katze",
    breed: "",
    projectName: "Gurke & Möhrchen",
    humanReference: "Pams Eltern",
    summary:
      "Möhrchen lebt gemeinsam mit Gurke bei Pams Eltern und gehört dort zur Familie.",
    baselineFacts: Object.freeze([
      "Gurke und Möhrchen leben bei Pams Eltern."
    ]),
    observations: Object.freeze([])
  })
]);

function text(value, max = MAX_TEXT) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu, "")
    .trim()
    .slice(0, max);
}

function unique(values, maxItems = 40, maxLength = 800) {
  const output = [];
  const seen = new Set();
  for (const value of Array.isArray(values) ? values : []) {
    const clean = text(value, maxLength);
    const key = clean.toLocaleLowerCase("de-DE");
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    output.push(clean);
    if (output.length >= maxItems) break;
  }
  return output;
}

function owner(value) {
  return text(value, 120).toLocaleLowerCase("de-DE");
}

function slug(value, fallback = "") {
  return (
    text(value, 120)
      .toLocaleLowerCase("de-DE")
      .replace(/[^a-z0-9äöüß_-]+/gu, "-")
      .replace(/^-+|-+$/gu, "")
      .slice(0, 80) || fallback
  );
}

function iso(value, fallback = "") {
  if (value === null || value === undefined || value === "") return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function parse(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
}

function hash(value) {
  let result = 2166136261;
  for (const character of String(value)) {
    result ^= character.codePointAt(0);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

function animalProfileId(value) {
  const candidate = slug(value);
  if (candidate === "peps") return "pepper";
  return candidate;
}

function comparableAnimalName(value) {
  return text(value, 240)
    .toLocaleLowerCase("de-DE")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function resolveAnimalProfileId(value, profiles) {
  const candidate = animalProfileId(value);
  const comparable = comparableAnimalName(value);
  const availableProfiles = Array.isArray(profiles) ? profiles : [];
  const matched = availableProfiles.find((profile) => {
    const names = [profile?.id, profile?.name, ...(profile?.nicknames || [])];
    return names.some(
      (name) =>
        animalProfileId(name) === candidate ||
        comparableAnimalName(name) === comparable
    );
  });
  if (matched) return animalProfileId(matched.id);

  const searchable = " " + comparable + " ";
  const contained = availableProfiles.filter((profile) =>
    [profile?.id, profile?.name, ...(profile?.nicknames || [])].some((name) => {
      const comparableName = comparableAnimalName(name);
      return comparableName && searchable.includes(" " + comparableName + " ");
    })
  );
  return contained.length === 1
    ? animalProfileId(contained[0].id)
    : candidate;
}

function normalizedConversationReply(value) {
  return text(value, 400)
    .toLocaleLowerCase("de-DE")
    .replace(
      /^(?:(?:hey\s+)?(?:human\s+holo|holo|sol(?:\s+holo)?|pam))\s*[,;:!.-]?\s*/iu,
      ""
    )
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D]/gu, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export function classifyAnimalHoloConversationReply(value) {
  const raw = text(value, 400);
  const reply = normalizedConversationReply(raw);
  const hasPositiveEmoji = /(?:👍|✅|☑)/u.test(raw);
  const hasNegativeEmoji = /(?:👎|❌|⛔)/u.test(raw);

  if (hasPositiveEmoji && hasNegativeEmoji) {
    return ANIMAL_HOLO_CONVERSATION_REPLY.OTHER;
  }

  if (
    hasNegativeEmoji ||
    /^(?:nein|nee|ne|nö|nope|doch nicht|lieber nicht|nicht speichern|nicht festhalten|abbrechen|abbruch|vergiss es|no|cancel|don t|do not|non|pas maintenant|no gracias)$/iu.test(
      reply
    )
  ) {
    return ANIMAL_HOLO_CONVERSATION_REPLY.CANCEL;
  }

  const politePositive =
    /^(?:ja(?: bitte| gern| gerne| klar| unbedingt| mach das| mach das bitte| speicher(?:e)? das)?|jaha|jawohl|jo|jop|jep|jup|yep|yes(?: please)?|sure|go ahead|ok|okay|okey|alles|alles klar|alles ok|klar|gern|gerne|passt|genau|richtig|unbedingt|bitte|bitte speichern|bitte festhalten|speicher(?:e)?(?: das| es)?|halt(?:e)? das fest|mach(?: das)?(?: bitte| ruhig)?|kannst du machen|von mir aus|meinetwegen|ohne zusatz|einfach ohne zusatz|si|sí|claro|vale|guardalo|guárdalo|oui|d accord|sì|va bene)(?: danke| dankeschön)?$/iu;

  if (politePositive.test(reply)) {
    return ANIMAL_HOLO_CONVERSATION_REPLY.CONFIRM;
  }

  if (
    hasPositiveEmoji &&
    (!reply || /^(?:ja|ok|okay|klar|gern|gerne|passt|genau|danke|bitte)$/iu.test(reply))
  ) {
    return ANIMAL_HOLO_CONVERSATION_REPLY.CONFIRM;
  }

  return ANIMAL_HOLO_CONVERSATION_REPLY.OTHER;
}

export function normalizeAnimalHoloProposal(
  value,
  { profiles = [] } = {}
) {
  const profileId = resolveAnimalProfileId(
    value?.profileId ?? value?.profile_id ?? value?.animalId ?? value?.animal_id,
    profiles
  );
  const observationText = text(
    value?.text ?? value?.observation ?? value?.content
  );
  if (!profileId || !observationText) return null;
  return {
    profileId,
    text: observationText,
    observedAt: iso(value?.observedAt ?? value?.observed_at, "")
  };
}

export function animalHoloAutoSaveProposalFromAssistantAnswer(
  value,
  { profiles = PAM_ANIMAL_HOLO_STARTERS } = {}
) {
  const answer = text(value, 10_000);
  const markerIndex = answer.lastIndexOf(ANIMAL_HOLO_AUTO_SAVE_MARKER);
  if (markerIndex < 0) return null;
  const markerLine = answer
    .slice(markerIndex + ANIMAL_HOLO_AUTO_SAVE_MARKER.length)
    .split(/\r?\n/u, 1)[0]
    .trim();
  if (!markerLine || markerLine.length > 4_000) return null;
  let candidate;
  try {
    candidate = JSON.parse(markerLine);
  } catch {
    return null;
  }
  const proposal = normalizeAnimalHoloProposal(candidate, { profiles });
  if (
    !proposal ||
    !(Array.isArray(profiles) ? profiles : []).some(
      (profile) => animalProfileId(profile?.id) === proposal.profileId
    )
  ) {
    return null;
  }
  return proposal;
}

export function stripAnimalHoloAutoSaveMarker(value) {
  const answer = text(value, 10_000);
  const markerIndex = answer.lastIndexOf(ANIMAL_HOLO_AUTO_SAVE_MARKER);
  if (markerIndex < 0) return answer;
  const suffix = answer.slice(markerIndex + ANIMAL_HOLO_AUTO_SAVE_MARKER.length);
  const markerLine = suffix.split(/\r?\n/u, 1)[0].trim();
  if (!markerLine || markerLine.length > 4_000) return answer;
  try {
    JSON.parse(markerLine);
  } catch {
    return answer;
  }
  return answer.slice(0, markerIndex).trim();
}

export function animalHoloObservationFromFulltimeMessage(
  value,
  { profiles = PAM_ANIMAL_HOLO_STARTERS } = {}
) {
  const content = text(value?.content ?? value?.text, 10_000);
  const match = content.match(
    /^Bestätigte Tier-Holo-Beobachtung zu\s+(.+?):\s+([\s\S]+)$/iu
  );
  if (!match) return null;
  const profileId = resolveAnimalProfileId(match[1], profiles);
  if (
    !profileId ||
    !(Array.isArray(profiles) ? profiles : []).some(
      (profile) => animalProfileId(profile?.id) === profileId
    )
  ) {
    return null;
  }
  const observationText = text(match[2]);
  if (!observationText) return null;
  const recordedAt = iso(value?.createdAt ?? value?.created_at, "");
  const suppliedId = slug(value?.observationId ?? value?.observation_id);
  const sourceId = slug(value?.sourceEventId ?? value?.source_event_id);
  return {
    profileId,
    observation: {
      id:
        suppliedId ||
        sourceId ||
        ("animal_" + profileId + "_" + hash(recordedAt + ":" + observationText)).slice(
          0,
          120
        ),
      text: observationText,
      observedAt: "",
      recordedAt,
      source: "owner_fulltime_restore",
      syncState: "synced"
    }
  };
}

export function animalHoloProposalFromAssistantAnswer(
  value,
  { profiles = PAM_ANIMAL_HOLO_STARTERS } = {}
) {
  const answer = text(value, 6000);
  if (
    !answer ||
    !/tier[\s‑-]*holo/iu.test(answer) ||
    !/(?:soll|möchtest|mochtest|darf)\b[\s\S]{0,180}\b(?:speicher|festhalt|hinterleg|hinzufüg|hinzufug)/iu.test(
      answer
    )
  ) {
    return null;
  }

  const quotedProposal = answer.match(
    /vorschlag\s*[:：]\s*(?:„([^“”]+)[“”]|“([^“”]+)[“”]|"([^"]+)"|'([^']+)')/iu
  );
  const lineProposal = answer.match(
    /vorschlag\s*[:：]\s*([^\r\n]{2,2000})/iu
  );
  const proposalText = text(
    quotedProposal?.slice(1).find(Boolean) ||
      lineProposal?.[1]?.replace(/\s+(?:drinnen|balkon|oder)\b[\s\S]*$/iu, "") ||
      ""
  ).replace(/[“”„"']+$/u, "").trim();
  if (!proposalText) return null;

  const availableProfiles = (Array.isArray(profiles) ? profiles : [])
    .map((profile) => ({
      id: animalProfileId(profile?.id || profile?.name),
      names: [profile?.name, ...(profile?.nicknames || []), profile?.id]
        .map(comparableAnimalName)
        .filter(Boolean)
    }))
    .filter((profile) => profile.id && profile.names.length);
  const matchingProfiles = (haystack) => {
    const searchable = " " + comparableAnimalName(haystack) + " ";
    return availableProfiles.filter((profile) =>
      profile.names.some((name) => searchable.includes(" " + name + " "))
    );
  };
  const proposalProfileMatches = matchingProfiles(proposalText);
  const profileMatches = matchingProfiles(answer);
  const selectedMatches = proposalProfileMatches.length
    ? proposalProfileMatches
    : profileMatches;
  if (selectedMatches.length !== 1) return null;

  return normalizeAnimalHoloProposal({
    profileId: selectedMatches[0].id,
    text: proposalText
  }, { profiles });
}

function cloneStarter(profile) {
  return {
    id: profile.id,
    name: profile.name,
    nicknames: [...profile.nicknames],
    species: profile.species,
    breed: profile.breed,
    projectName: profile.projectName,
    humanReference: profile.humanReference,
    summary: profile.summary,
    baselineFacts: [...profile.baselineFacts],
    observations: (profile.observations || []).map((observation) => ({
      ...observation
    }))
  };
}

function normalizedObservation(candidate, profileId, fallbackTime) {
  const content = text(candidate?.text ?? candidate?.content);
  if (!content) return null;
  const recordedAt = iso(candidate?.recordedAt, fallbackTime);
  const suppliedId = slug(candidate?.id);
  return {
    id:
      suppliedId ||
      ("animal_" + profileId + "_" + hash(recordedAt + ":" + content)).slice(
        0,
        120
      ),
    text: content,
    observedAt: iso(candidate?.observedAt, ""),
    recordedAt,
    source: text(candidate?.source, 80) || "owner_observation",
    syncState: SYNC_STATES.has(candidate?.syncState)
      ? candidate.syncState
      : "local"
  };
}

function normalizedProfile(candidate, index, now) {
  const name = text(candidate?.name, 120);
  if (!name) return null;
  const id = slug(candidate?.id ?? name, "tier-" + String(index + 1));
  const observations = [];
  const seen = new Set();
  for (const item of Array.isArray(candidate?.observations)
    ? candidate.observations
    : []) {
    const observation = normalizedObservation(item, id, now);
    if (!observation) continue;
    const key =
      observation.id + ":" + observation.text.toLocaleLowerCase("de-DE");
    if (seen.has(key)) continue;
    seen.add(key);
    observations.push(observation);
    if (observations.length >= MAX_OBSERVATIONS) break;
  }
  return {
    id,
    name,
    nicknames: unique(candidate?.nicknames, 12, 120),
    species: text(candidate?.species, 80),
    breed: text(candidate?.breed, 120),
    projectName: text(candidate?.projectName, 160),
    humanReference: text(candidate?.humanReference, 120),
    summary: text(candidate?.summary, 800),
    baselineFacts: unique(candidate?.baselineFacts),
    observations
  };
}

function applyStarter(starter, supplied) {
  if (!supplied) return cloneStarter(starter);
  const observations = supplied.observations.map((observation) => ({
    ...observation
  }));
  const observationIds = new Set(
    observations.map((observation) => observation.id)
  );
  const observationTexts = new Set(
    observations.map((observation) =>
      observation.text.toLocaleLowerCase("de-DE")
    )
  );
  for (const observation of starter.observations || []) {
    const observationText = observation.text.toLocaleLowerCase("de-DE");
    if (
      observationIds.has(observation.id) ||
      observationTexts.has(observationText)
    ) {
      continue;
    }
    observationIds.add(observation.id);
    observationTexts.add(observationText);
    observations.push({ ...observation });
  }
  return {
    ...supplied,
    name: supplied.name || starter.name,
    nicknames: unique([...starter.nicknames, ...supplied.nicknames], 12, 120),
    species: supplied.species || starter.species,
    breed: supplied.breed || starter.breed,
    projectName: supplied.projectName || starter.projectName,
    humanReference: supplied.humanReference || starter.humanReference,
    summary: supplied.summary || starter.summary,
    baselineFacts: unique([
      ...starter.baselineFacts,
      ...supplied.baselineFacts
    ]),
    observations: observations.slice(-MAX_OBSERVATIONS)
  };
}

export function createAnimalHoloState(
  ownerId = ANIMAL_HOLO_OWNER_ID,
  { includePamStarterProfiles = true } = {}
) {
  const ownerIdValue = owner(ownerId);
  if (!ownerIdValue) throw new Error("Für Tier-Holo-Daten fehlt die feste Owner-ID.");
  return {
    schemaVersion: ANIMAL_HOLO_SCHEMA_VERSION,
    ownerId: ownerIdValue,
    updatedAt: "",
    profiles:
      ownerIdValue === ANIMAL_HOLO_OWNER_ID && includePamStarterProfiles
        ? PAM_ANIMAL_HOLO_STARTERS.map(cloneStarter)
        : []
  };
}

export function normalizeAnimalHoloState(
  value,
  {
    ownerId = ANIMAL_HOLO_OWNER_ID,
    includePamStarterProfiles = true,
    rejectForeignOwner = true
  } = {}
) {
  const ownerIdValue = owner(ownerId);
  if (!ownerIdValue) throw new Error("Für Tier-Holo-Daten fehlt die feste Owner-ID.");
  const source = parse(value);
  if (
    source?.ownerId &&
    owner(source.ownerId) !== ownerIdValue &&
    rejectForeignOwner
  ) {
    throw new Error("Tier-Holo-Daten gehören zu einer anderen Owner-Instanz.");
  }
  const now = new Date().toISOString();
  const profiles = [];
  const ids = new Set();
  const suppliedProfiles = Array.isArray(source?.profiles) ? source.profiles : [];
  for (const [index, candidate] of suppliedProfiles.entries()) {
    const profile = normalizedProfile(candidate, index, now);
    if (!profile || ids.has(profile.id)) continue;
    ids.add(profile.id);
    profiles.push(profile);
    if (profiles.length >= MAX_PROFILES) break;
  }
  if (ownerIdValue === ANIMAL_HOLO_OWNER_ID && includePamStarterProfiles) {
    for (const starter of PAM_ANIMAL_HOLO_STARTERS) {
      const index = profiles.findIndex((profile) => profile.id === starter.id);
      if (index < 0) profiles.push(cloneStarter(starter));
      else profiles[index] = applyStarter(starter, profiles[index]);
    }
  }
  return {
    schemaVersion: ANIMAL_HOLO_SCHEMA_VERSION,
    ownerId: ownerIdValue,
    updatedAt: iso(source?.updatedAt, ""),
    profiles
  };
}

export function animalHoloStorageKey(ownerId = ANIMAL_HOLO_OWNER_ID) {
  const ownerIdValue = owner(ownerId);
  if (!ownerIdValue) throw new Error("Für Tier-Holo-Daten fehlt die feste Owner-ID.");
  return ownerIdValue === ANIMAL_HOLO_OWNER_ID
    ? ANIMAL_HOLO_STORAGE_KEY
    : ANIMAL_HOLO_STORAGE_KEY + ":" + slug(ownerIdValue, "owner");
}

export function addAnimalHoloProfile(stateValue, profileValue, now = new Date()) {
  const source = parse(stateValue);
  const state = normalizeAnimalHoloState(stateValue, {
    ownerId: source?.ownerId || ANIMAL_HOLO_OWNER_ID
  });
  if (state.profiles.length >= MAX_PROFILES) {
    throw new Error("Die maximale Anzahl an Tier-Holo-Profilen ist erreicht.");
  }
  const time = iso(now);
  if (!time) throw new Error("Der Speicherzeitpunkt ist ungültig.");
  const profile = normalizedProfile(profileValue, state.profiles.length, time);
  if (!profile) throw new Error("Das Tier-Holo braucht einen Namen.");
  if (state.profiles.some((item) => item.id === profile.id)) {
    throw new Error("Für dieses Tier besteht bereits ein Tier-Holo.");
  }
  return {
    ...state,
    updatedAt: time,
    profiles: [...state.profiles, profile]
  };
}

export function addAnimalHoloObservation(
  stateValue,
  profileId,
  observationValue,
  now = new Date()
) {
  const source = parse(stateValue);
  const state = normalizeAnimalHoloState(stateValue, {
    ownerId: source?.ownerId || ANIMAL_HOLO_OWNER_ID
  });
  const selectedId = slug(profileId);
  const profileIndex = state.profiles.findIndex(
    (profile) => profile.id === selectedId
  );
  if (profileIndex < 0) throw new Error("Das gewählte Tier-Holo wurde nicht gefunden.");
  const time = iso(now);
  if (!time) throw new Error("Der Speicherzeitpunkt ist ungültig.");
  const observation = normalizedObservation(
    {
      ...observationValue,
      syncState: observationValue?.syncState || "pending"
    },
    selectedId,
    time
  );
  if (!observation) throw new Error("Bitte beschreibe die bestätigte Beobachtung.");
  const profile = state.profiles[profileIndex];
  const duplicate = profile.observations.some(
    (item) =>
      item.text.toLocaleLowerCase("de-DE") ===
        observation.text.toLocaleLowerCase("de-DE") &&
      item.observedAt === observation.observedAt
  );
  if (duplicate) return { state, observation: null, duplicate: true };
  const profiles = [...state.profiles];
  profiles[profileIndex] = {
    ...profile,
    observations: [...profile.observations, observation].slice(-MAX_OBSERVATIONS)
  };
  return {
    state: { ...state, updatedAt: time, profiles },
    observation,
    duplicate: false
  };
}

export function markAnimalHoloObservationSynced(
  stateValue,
  profileId,
  observationId,
  now = new Date()
) {
  const source = parse(stateValue);
  const state = normalizeAnimalHoloState(stateValue, {
    ownerId: source?.ownerId || ANIMAL_HOLO_OWNER_ID
  });
  const targetProfileId = slug(profileId);
  const targetObservationId = slug(observationId);
  let changed = false;
  const profiles = state.profiles.map((profile) => ({
    ...profile,
    observations: profile.observations.map((observation) => {
      if (
        profile.id !== targetProfileId ||
        observation.id !== targetObservationId
      ) {
        return observation;
      }
      changed = true;
      return { ...observation, syncState: "synced" };
    })
  }));
  return changed
    ? { ...state, updatedAt: iso(now), profiles }
    : state;
}

function observationKey(observation) {
  return (
    observation.id +
    ":" +
    observation.text.toLocaleLowerCase("de-DE") +
    ":" +
    observation.observedAt
  );
}

export function mergeAnimalHoloStates(
  currentValue,
  incomingValue,
  { ownerId = ANIMAL_HOLO_OWNER_ID } = {}
) {
  const current = normalizeAnimalHoloState(currentValue, { ownerId });
  const incoming = normalizeAnimalHoloState(incomingValue, { ownerId });
  const profiles = current.profiles.map((profile) => ({
    ...profile,
    observations: profile.observations.map((item) => ({ ...item }))
  }));
  let profilesAdded = 0;
  let observationsAdded = 0;
  let observationsSkipped = 0;
  for (const incomingProfile of incoming.profiles) {
    const index = profiles.findIndex(
      (profile) => profile.id === incomingProfile.id
    );
    if (index < 0) {
      profiles.push({
        ...incomingProfile,
        observations: incomingProfile.observations.map((item) => ({ ...item }))
      });
      profilesAdded += 1;
      observationsAdded += incomingProfile.observations.length;
      continue;
    }
    const existing = profiles[index];
    const keys = new Set(existing.observations.map(observationKey));
    const additions = incomingProfile.observations.filter((observation) => {
      const key = observationKey(observation);
      if (keys.has(key)) {
        observationsSkipped += 1;
        return false;
      }
      keys.add(key);
      return true;
    });
    observationsAdded += additions.length;
    profiles[index] = {
      ...existing,
      nicknames: unique(
        [...existing.nicknames, ...incomingProfile.nicknames],
        12,
        120
      ),
      baselineFacts: unique([
        ...existing.baselineFacts,
        ...incomingProfile.baselineFacts
      ]),
      observations: [...existing.observations, ...additions].slice(
        -MAX_OBSERVATIONS
      )
    };
  }
  return {
    state: {
      ...current,
      updatedAt:
        iso(incoming.updatedAt, "") ||
        iso(current.updatedAt, "") ||
        new Date().toISOString(),
      profiles: profiles.slice(0, MAX_PROFILES)
    },
    profilesAdded,
    observationsAdded,
    observationsSkipped
  };
}

export function animalHoloPromptContext(stateValue, profileId = "") {
  const source = parse(stateValue);
  const state = normalizeAnimalHoloState(stateValue, {
    ownerId: source?.ownerId || ANIMAL_HOLO_OWNER_ID
  });
  const selectedId = slug(profileId);
  const profiles = selectedId
    ? state.profiles.filter((profile) => profile.id === selectedId)
    : state.profiles;
  const lines = [
    "TIER-HOLO-KONTEXT – nur bestätigte Angaben:",
    ANIMAL_HOLO_SAFETY.identityBoundary,
    ANIMAL_HOLO_SAFETY.childSafety,
    ANIMAL_HOLO_SAFETY.welfare
  ];
  for (const profile of profiles) {
    const aliases = profile.nicknames.length
      ? " (" + profile.nicknames.join(", ") + ")"
      : "";
    lines.push(
      "",
      profile.name +
        aliases +
        " · " +
        [profile.species, profile.breed].filter(Boolean).join(" · ")
    );
    if (profile.summary) lines.push("- " + profile.summary);
    for (const fact of profile.baselineFacts) lines.push("- " + fact);
    for (const observation of profile.observations) {
      lines.push("- Bestätigte Beobachtung: " + observation.text);
    }
  }
  return lines.join("\n");
}

export function serializeAnimalHoloState(stateValue) {
  const source = parse(stateValue);
  return JSON.stringify(
    normalizeAnimalHoloState(stateValue, {
      ownerId: source?.ownerId || ANIMAL_HOLO_OWNER_ID
    })
  );
}
