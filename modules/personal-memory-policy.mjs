import {
  prepareDurableMemoryContent
} from "../www/human-holo-durable-memory.mjs";

export const PERSONAL_MEMORY_POLICY_VERSION =
  "2026-09-14-structured-memory-1";

export const PERSONAL_MEMORY_MODES = Object.freeze([
  "confirmed_only",
  "personalized"
]);

export const PERSONAL_MEMORY_CATEGORIES = Object.freeze([
  Object.freeze({ id: "identity", label: "Über mich", automatic: true }),
  // Identifizierende Angaben über andere Menschen benötigen immer einen
  // ausdrücklichen Erinnerungsauftrag; sie werden nie automatisch übernommen.
  Object.freeze({ id: "relationships", label: "Menschen & Beziehungen", automatic: false }),
  Object.freeze({ id: "preferences", label: "Vorlieben", automatic: true }),
  Object.freeze({ id: "life_events", label: "Lebensereignisse", automatic: true }),
  Object.freeze({ id: "projects", label: "Projekte & Entscheidungen", automatic: true }),
  Object.freeze({ id: "animals", label: "Tiere", automatic: true }),
  Object.freeze({ id: "routines", label: "Gewohnheiten", automatic: true }),
  Object.freeze({ id: "organization", label: "Organisation", automatic: false }),
  Object.freeze({ id: "sensitive", label: "Sensible Angaben", automatic: false }),
  Object.freeze({ id: "other", label: "Sonstiges", automatic: false })
]);

const CATEGORY_IDS = new Set(
  PERSONAL_MEMORY_CATEGORIES.map(({ id }) => id)
);
const AUTOMATIC_CATEGORY_IDS = new Set(
  PERSONAL_MEMORY_CATEGORIES
    .filter(({ automatic }) => automatic)
    .map(({ id }) => id)
);

export const DEFAULT_PERSONAL_MEMORY_PREFERENCES = Object.freeze({
  policyVersion: PERSONAL_MEMORY_POLICY_VERSION,
  mode: "confirmed_only",
  paused: false,
  autoCategories: Object.freeze([]),
  consentRecordedAt: null,
  updatedAt: null
});

const CATEGORY_PATTERNS = Object.freeze([
  Object.freeze({
    category: "identity",
    pattern:
      /\b(?:ich\s+(?:hei(?:ß|ss)e|wohne|lebe|komme)|mein\s+(?:name|geburtstag|geburtsort)|ich\s+bin\s+am\s+\d{1,2}[.\/-])\b/iu
  }),
  Object.freeze({
    category: "relationships",
    pattern:
      /\b(?:mein(?:e|er)?\s+(?:partner(?:in)?|frau|mann|verlobte|verlobter|tochter|sohn|mutter|vater|schwester|bruder)|wir\s+(?:haben\s+uns|sind\s+seit|heiraten|haben\s+geheiratet)|kennengelernt|verlobt)\b/iu
  }),
  Object.freeze({
    category: "preferences",
    pattern:
      /\bich\s+(?:mag|liebe|bevorzuge|hasse|kann\s+.+?\s+nicht\s+leiden|möchte\s+am\s+liebsten|moechte\s+am\s+liebsten)\b/iu
  }),
  Object.freeze({
    category: "life_events",
    pattern:
      /\b(?:ich|wir)\s+(?:bin|sind|war|waren|wurde|wurden|habe|haben)\b[\s\S]{0,180}\b(?:geboren|umgezogen|verlobt|geheiratet|kennengelernt|abgeschlossen|begonnen|gestartet)\b/iu
  }),
  Object.freeze({
    category: "projects",
    pattern:
      /\b(?:(?:mein|unser)\s+projekt|human\s+holo)\b[\s\S]{0,220}\b(?:soll|muss|bleibt|heißt|heisst|ist|wird|startet|gehört|gehoert)\b/iu
  }),
  Object.freeze({
    category: "animals",
    pattern:
      /\b(?:mein(?:e|er)?|unser(?:e|er)?)\s+(?:haustier|tier|katze|kater|hund|hündin|huendin|vogel|pferd|kaninchen)\b/iu
  }),
  Object.freeze({
    category: "routines",
    pattern:
      /\bich\s+(?:mache|gehe|esse|trinke|lese|höre|hoere|stehe|schlafe)\b[\s\S]{0,120}\b(?:immer|meistens|gewöhnlich|gewoehnlich|jeden\s+(?:tag|morgen|abend|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag))\b/iu
  })
]);

const SENSITIVE_AUTOMATIC_PATTERN =
  /\b(?:diagnos(?:e|en)|krankheit|medikament(?:e|en)?|tablette(?:n)?|dosis|dosierung|therapie|behandlung|arzt|ärztin|aerztin|klinik|ambulanz|pflegegrad|behinderung|schwanger|sexual(?:ität|itaet)|sexuell|religion|glaube|partei|politisch|strafverfahren|vorstrafe|schulden|einkommen|konto|iban|kreditkarte|biometr(?:ie|isch)|fingerabdruck|gesichtserkennung)\b/iu;

const THIRD_PARTY_SPEECH_PATTERN =
  /[„““”"]|\b(?:hat\s+(?:mir\s+)?gesagt|sagte|schrieb|meinte|wörtlich|woertlich|zitat)\b/iu;

const CONTACT_DETAIL_PATTERN =
  /\b[\w.+-]+@[\w.-]+\.[\p{L}]{2,}\b|(?:\+\d{1,3}[\s/-]?)?(?:\d[\s/-]?){7,14}\d/iu;

const DO_NOT_REMEMBER_PATTERN =
  /\b(?:nicht\s+(?:merken|speichern|behalten)|vergiss\s+(?:das|es)|nur\s+für\s+jetzt|nur\s+fuer\s+jetzt|off\s+the\s+record)\b/iu;

const QUESTION_START_PATTERN =
  /^\s*(?:wer|was|wann|wo|wie|warum|wieso|weshalb|welch\w*|kannst|könntest|koenntest|soll|sollte|ist|sind|hast|hat|wei(?:ß|ss)t)\b/iu;

function normalizedText(value) {
  return String(value ?? "").normalize("NFKC").trim();
}

function normalizedCategory(value, fallback = "other") {
  const category = normalizedText(value).toLocaleLowerCase("de-DE");
  return CATEGORY_IDS.has(category) ? category : fallback;
}

function normalizedModalities(values, fallback) {
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    const modality = normalizedText(value).toLocaleLowerCase("de-DE");
    if (
      /^[a-z][a-z0-9_-]{1,39}$/u.test(modality) &&
      !result.includes(modality)
    ) {
      result.push(modality);
    }
    if (result.length >= 16) break;
  }
  return result.length ? result : [fallback === "voice" ? "voice" : "text"];
}

function candidateSentences(value) {
  return normalizedText(value)
    .split(/(?:\r?\n)+|(?<=[.!?])\s+/u)
    .map(sentence => sentence.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function normalizePersonalMemoryCategory(value, fallback = "other") {
  return normalizedCategory(value, fallback);
}

export function normalizeAutomaticMemoryCategories(values) {
  const categories = [];
  for (const value of Array.isArray(values) ? values : []) {
    const category = normalizedCategory(value, "");
    if (
      AUTOMATIC_CATEGORY_IDS.has(category) &&
      !categories.includes(category)
    ) {
      categories.push(category);
    }
  }
  return categories;
}

export function normalizePersonalMemoryPreferences(value = {}) {
  const mode = PERSONAL_MEMORY_MODES.includes(value?.mode)
    ? value.mode
    : DEFAULT_PERSONAL_MEMORY_PREFERENCES.mode;
  return Object.freeze({
    policyVersion: PERSONAL_MEMORY_POLICY_VERSION,
    mode,
    paused: value?.paused === true,
    autoCategories: Object.freeze(
      mode === "personalized"
        ? normalizeAutomaticMemoryCategories(value?.autoCategories)
        : []
    ),
    consentRecordedAt:
      value?.consentRecordedAt || value?.consent_recorded_at || null,
    updatedAt: value?.updatedAt || value?.updated_at || null
  });
}

export function classifyPersonalMemoryContent(value) {
  const content = normalizedText(value);
  if (!content) return "other";
  if (SENSITIVE_AUTOMATIC_PATTERN.test(content)) return "sensitive";
  for (const rule of CATEGORY_PATTERNS) {
    if (rule.pattern.test(content)) return rule.category;
  }
  if (/\b(?:termin|kalender|erinner(?:e|ung)|einkaufsliste|notiz)\b/iu.test(content)) {
    return "organization";
  }
  return "other";
}

/**
 * Erkennt bewusst nur klare autobiografische Einzelsätze. Unsichere Inhalte,
 * Fragen, sensible Angaben, Kontaktangaben und wiedergegebene Aussagen Dritter
 * werden niemals automatisch zu einer dauerhaften Erinnerung.
 */
export function detectAutomaticPersonalMemoryCandidate({
  content,
  source = "text",
  sourceModalities = []
} = {}) {
  const fullContent = normalizedText(content);
  if (
    fullContent.length < 4 ||
    fullContent.length > 2_000 ||
    DO_NOT_REMEMBER_PATTERN.test(fullContent)
  ) {
    return null;
  }

  for (const sentence of candidateSentences(fullContent)) {
    if (
      sentence.length < 4 ||
      sentence.length > 500 ||
      sentence.includes("?") ||
      QUESTION_START_PATTERN.test(sentence) ||
      SENSITIVE_AUTOMATIC_PATTERN.test(sentence) ||
      THIRD_PARTY_SPEECH_PATTERN.test(sentence) ||
      CONTACT_DETAIL_PATTERN.test(sentence)
    ) {
      continue;
    }

    const prepared = prepareDurableMemoryContent(sentence);
    if (prepared.changed || !prepared.content.trim()) continue;

    const category = classifyPersonalMemoryContent(sentence);
    if (!AUTOMATIC_CATEGORY_IDS.has(category)) continue;

    const sourceType = source === "voice" ? "voice" : "text";
    return Object.freeze({
      policyVersion: PERSONAL_MEMORY_POLICY_VERSION,
      category,
      content: prepared.content.trim(),
      sourceType,
      sourceModalities: Object.freeze(
        normalizedModalities(sourceModalities, sourceType)
      ),
      captureMode: "automatic",
      sensitive: false,
      thirdPartySpeechStored: false
    });
  }

  return null;
}

export function automaticPersonalMemoryAllowed(preferences, candidate) {
  const normalized = normalizePersonalMemoryPreferences(preferences);
  return Boolean(
    candidate &&
    normalized.mode === "personalized" &&
    normalized.paused === false &&
    normalized.autoCategories.includes(candidate.category)
  );
}

export function personalMemoryCategoryLabel(category) {
  return PERSONAL_MEMORY_CATEGORIES.find(
    item => item.id === normalizedCategory(category)
  )?.label || "Sonstiges";
}
