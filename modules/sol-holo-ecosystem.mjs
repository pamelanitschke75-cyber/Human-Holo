import { readFileSync } from "node:fs";

const manifestUrl = new URL(
  "../data/sol-holo-ecosystem.de.json",
  import.meta.url
);

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const child of Object.values(value)) {
    deepFreeze(child);
  }

  return Object.freeze(value);
}

export const ecosystemManifest = deepFreeze(
  JSON.parse(readFileSync(manifestUrl, "utf8"))
);

const LOCAL_LOOKUP_TERMS = Object.freeze([
  "in der naehe",
  "wohin",
  "wo finde ich",
  "suche hilfe",
  "brauche hilfe",
  "adresse",
  "telefon",
  "notruf",
  "anlaufstelle",
  "hilfsbus",
  "tafel",
  "notunterkunft",
  "tierrettung",
  "tierklinik"
]);

const ANIMAL_CONTEXT_TERMS = Object.freeze([
  "tier",
  "tiere",
  "hund",
  "hunde",
  "katze",
  "katzen",
  "vogel",
  "voegel",
  "wildtier",
  "pferd",
  "tierarzt",
  "tierklinik",
  "tierrettung",
  "fundtier"
]);

const HUMAN_CONTEXT_TERMS = Object.freeze([
  "mensch",
  "person",
  "frau",
  "mann",
  "kind",
  "baby",
  "jemand",
  "ich",
  "mir",
  "mein"
]);

const HUMAN_ONLY_HELP_SOURCE_IDS = new Set([
  "de_emergency_112",
  "de_police_110",
  "de_medical_116117",
  "munich_homeless_support",
  "munich_tafel",
  "de_tafel_search",
  "msf_global"
]);

const ANIMAL_ONLY_HELP_SOURCE_IDS = new Set([
  "munich_animal_rescue"
]);

const HOMELESS_HELP_TERMS = Object.freeze([
  "obdachlos",
  "wohnungslos",
  "wohnungslosigkeit",
  "notunterkunft",
  "streetwork",
  "waermebus",
  "hilfsbus",
  "hilfsbusse"
]);

const CITY_ALIASES = deepFreeze({
  munchen: "Muenchen",
  muenchen: "Muenchen",
  munich: "Muenchen"
});

const LOCATION_REPLY_REJECT =
  /^(?:ja|nein|okay|ok|abbrechen|abbruch|danke|dankeschoen)[.!?]*$/u;

const TEST_MODE_TERMS = Object.freeze([
  "nur ein test",
  "systemtest",
  "testfrage",
  "testszenario",
  "kein echter notfall",
  "kein realer notfall",
  "fiktiver notfall",
  "fiktives beispiel"
]);

const URGENT_MEDICAL_TERMS = Object.freeze([
  "ohrenschmerzen",
  "halsschmerzen",
  "rueckenschmerzen",
  "bauchschmerzen",
  "schmerzen",
  "starke schmerzen",
  "fieber",
  "erkaeltung",
  "brechdurchfall",
  "harnwegsinfekt",
  "krank",
  "beschwerden",
  "medizinische hilfe",
  "aerztliche hilfe",
  "arzt",
  "aerztin",
  "bereitschaftsdienst",
  "116117"
]);

const URGENT_MEDICAL_CONTEXT_TERMS = Object.freeze([
  "ich habe",
  "ich brauche",
  "brauche hilfe",
  "dringend",
  "stark",
  "heute",
  "sonntag",
  "wochenende",
  "nachts",
  "praxis geschlossen",
  "nicht lebensbedrohlich",
  "keine lebensgefahr",
  "wen soll ich anrufen",
  "was soll ich tun",
  "116117"
]);

const POLICE_EMERGENCY_TERMS = Object.freeze([
  "bedroht",
  "bedrohung",
  "messer",
  "waffe",
  "ueberfall",
  "einbruch",
  "bricht ein",
  "eingebrochen",
  "einbrecher",
  "raub",
  "angriff",
  "taeter",
  "verfolgt",
  "in gefahr"
]);

const POLICE_IMMEDIACY_TERMS = Object.freeze([
  "akut",
  "gerade",
  "jetzt",
  "sofort",
  "hilfe",
  "notfall",
  "in gefahr"
]);

export function normalizeEcosystemText(value) {
  return String(value || "")
    .replace(/[Ää]/gu, "ae")
    .replace(/[Öö]/gu, "oe")
    .replace(/[Üü]/gu, "ue")
    .replace(/ß/gu, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("de-DE")
    .replace(/\s+/gu, " ")
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function containsTerm(normalizedText, rawTerm) {
  const term = normalizeEcosystemText(rawTerm);
  if (!term) return false;

  const pattern = new RegExp(
    `(?:^|[^\\p{L}\\p{N}])${escapeRegExp(term)}(?:$|[^\\p{L}\\p{N}])`,
    "u"
  );
  return pattern.test(normalizedText);
}

function matchedTerms(normalizedText, terms) {
  return terms.filter(term => containsTerm(normalizedText, term));
}

export function isEcosystemTestMode(message) {
  const normalized = normalizeEcosystemText(message);
  return matchedTerms(normalized, TEST_MODE_TERMS).length > 0;
}

function scenarioTextForUrgency(message) {
  let normalized = normalizeEcosystemText(message);
  for (const term of TEST_MODE_TERMS) {
    normalized = normalized.replace(
      new RegExp(
        `(?:^|[^\\p{L}\\p{N}])${escapeRegExp(term)}(?:$|[^\\p{L}\\p{N}])`,
        "gu"
      ),
      " "
    );
  }
  return normalized.replace(/\s+/gu, " ").trim();
}

function isHumanEmergencySignalNegated(normalizedText, rawSignal) {
  const signal = normalizeEcosystemText(rawSignal);
  const directNegation = new RegExp(
    `(?:kein(?:e|en|er|es)?|ohne|nicht)\\s+(?:akute[nrms]?\\s+)?${escapeRegExp(signal)}`,
    "u"
  );
  if (directNegation.test(normalizedText)) return true;

  const signalSpecificNegations = {
    bewusstlos: ["bei bewusstsein", "ist ansprechbar", "ist wach"],
    "atmet nicht": ["atmet normal", "normale atmung"],
    "keine atmung": ["atmet normal", "normale atmung"],
    atemnot: ["keine atemnot", "ohne atemnot", "atmet normal", "normale atmung"],
    brustschmerzen: ["keine brustschmerzen", "ohne brustschmerzen"],
    schlaganfalls: [
      "keine anzeichen eines schlaganfalls",
      "kein verdacht auf einen schlaganfall"
    ],
    lebensgefahr: [
      "keine lebensgefahr",
      "ohne lebensgefahr",
      "nicht lebensbedrohlich",
      "keine lebensbedrohliche gefahr"
    ],
    "blutet stark": ["blutet nicht stark", "keine starke blutung"],
    "schwere verletzung": ["keine schwere verletzung", "nicht schwer verletzt"],
    "akuter notfall": ["kein akuter notfall", "nicht akut"]
  };

  return (signalSpecificNegations[signal] || [])
    .some(negation => containsTerm(normalizedText, negation));
}

function activeHumanEmergencySignals(normalizedText) {
  return matchedTerms(
    normalizedText,
    ecosystemManifest.emergency_signals.human
  ).filter(signal => !isHumanEmergencySignalNegated(normalizedText, signal));
}

export function detectEcosystemAreas(message) {
  const normalized = normalizeEcosystemText(message);

  return ecosystemManifest.areas
    .map(area => {
      const matches = matchedTerms(normalized, area.keywords || []);
      return {
        id: area.id,
        title: area.title,
        score: matches.length,
        matched_terms: matches
      };
    })
    .filter(area => area.score > 0)
    .sort((left, right) =>
      right.score - left.score || left.id.localeCompare(right.id, "de")
    );
}

function hasAnimalContext(normalizedText) {
  return matchedTerms(normalizedText, ANIMAL_CONTEXT_TERMS).length > 0;
}

function hasHumanContext(normalizedText) {
  return matchedTerms(normalizedText, HUMAN_CONTEXT_TERMS).length > 0;
}

export function classifyEcosystemUrgency(message) {
  const testMode = isEcosystemTestMode(message);
  const normalized = scenarioTextForUrgency(message);
  const animalSignals = matchedTerms(
    normalized,
    ecosystemManifest.emergency_signals.animal
  );
  const humanSignals = activeHumanEmergencySignals(normalized);
  const animalContext = hasAnimalContext(normalized);
  const humanContext = hasHumanContext(normalized);
  const activeBreakIn =
    /\b(?:bricht|dringt|steigt)\b[\s\S]{0,60}\bein\b/u.test(normalized) &&
    /\b(?:bei mir|wohnung|haus|zimmer|gebaeude|geschaeft|laden|buero|tuer|fenster)\b/u.test(
      normalized
    );
  const policeSignals = [
    ...matchedTerms(normalized, POLICE_EMERGENCY_TERMS),
    ...(activeBreakIn ? ["aktiver einbruch"] : [])
  ];
  const policeImmediacy = matchedTerms(normalized, POLICE_IMMEDIACY_TERMS);
  const bothContext =
    /\b(?:mensch|menschen)\b[\s\S]{0,60}\b(?:tier|tiere)\b/u.test(
      normalized
    ) ||
    /\b(?:tier|tiere)\b[\s\S]{0,60}\b(?:mensch|menschen)\b/u.test(
      normalized
    );

  if (
    animalSignals.length > 0 ||
    (
      animalContext &&
      humanSignals.length > 0 &&
      !bothContext
    )
  ) {
    return {
      level: "emergency",
      subject: "animal",
      route: "animal",
      test_mode: testMode,
      matched_signals: [...new Set([...animalSignals, ...humanSignals])]
    };
  }

  const specificMedicalEmergencySignals = humanSignals.filter(
    signal => normalizeEcosystemText(signal) !== "akuter notfall"
  );
  if (
    policeSignals.length > 0 &&
    policeImmediacy.length > 0 &&
    specificMedicalEmergencySignals.length === 0 &&
    !animalContext
  ) {
    return {
      level: "emergency",
      subject: "human",
      route: "police",
      test_mode: testMode,
      matched_signals: [...new Set([...policeSignals, ...policeImmediacy])]
    };
  }

  if (humanSignals.length > 0) {
    return {
      level: "emergency",
      subject: bothContext ? "both" : "human",
      route: "medical",
      test_mode: testMode,
      matched_signals: humanSignals
    };
  }

  const urgentMedicalSignals = matchedTerms(normalized, URGENT_MEDICAL_TERMS);
  const urgentMedicalContext = matchedTerms(
    normalized,
    URGENT_MEDICAL_CONTEXT_TERMS
  );
  if (
    urgentMedicalSignals.length > 0 &&
    urgentMedicalContext.length > 0 &&
    !animalContext
  ) {
    return {
      level: "urgent",
      subject: "human",
      route: "medical",
      test_mode: testMode,
      matched_signals: [...new Set([
        ...urgentMedicalSignals,
        ...urgentMedicalContext
      ])]
    };
  }

  const supportSignals = matchedTerms(normalized, [
    "obdachlos",
    "wohnungslos",
    "wohnungslosigkeit",
    "notunterkunft",
    "hunger",
    "hungrig",
    "friert",
    "existenznot",
    "mensch in not",
    "menschen in not",
    "braucht hilfe",
    "brauchen hilfe",
    "tier in not",
    "verletztes tier",
    "verletzte katze",
    "verletzter hund",
    "ausgesetzt",
    "fundtier"
  ]);

  return {
    level: supportSignals.length > 0 ? "support-needed" : "information",
    subject: bothContext
      ? "both"
      : animalContext
        ? "animal"
        : humanContext
          ? "human"
          : "general",
    route: supportSignals.length > 0 ? "support" : "information",
    test_mode: testMode,
    matched_signals: supportSignals
  };
}

function canonicalCountry(value) {
  const normalized = normalizeEcosystemText(value);
  if (["de", "deutschland", "germany"].includes(normalized)) return "DE";
  return String(value || "").trim().toUpperCase();
}

function canonicalCity(value) {
  const normalized = normalizeEcosystemText(value);
  return CITY_ALIASES[normalized] || String(value || "").trim();
}

export function extractExplicitEcosystemLocation(
  message,
  { allowStandalone = false } = {}
) {
  const original = String(message || "").trim();
  const normalized = normalizeEcosystemText(original);

  if (!original || LOCATION_REPLY_REJECT.test(normalized)) {
    return {
      country: "",
      city: "",
      explicit: false,
      source: null
    };
  }

  let country =
    /(?:^|[^\p{L}\p{N}])(?:de|deutschland|germany)(?:$|[^\p{L}\p{N}])/u.test(
      normalized
    )
      ? "DE"
      : "";
  let city = "";

  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    if (containsTerm(normalized, alias)) {
      city = canonical;
      break;
    }
  }

  if (!city && !allowStandalone) {
    const explicitCity = original.match(
      /\b(?:in|bei|nahe|nähe\s+von)\s+([A-ZÄÖÜ][\p{L}'’-]*(?:\s+[A-ZÄÖÜ][\p{L}'’-]*){0,2})/u
    )?.[1];
    city = String(explicitCity || "").trim();
  }

  if (!city && allowStandalone) {
    const withoutCountry = original
      .replace(/(?:^|[,\s])(?:DE|Deutschland|Germany)(?=$|[,\s])/giu, " ")
      .replace(/^[\s,]+|[\s,.!?]+$/gu, "")
      .replace(/\s+/gu, " ")
      .trim();

    if (
      withoutCountry.length >= 2 &&
      withoutCountry.length <= 80 &&
      withoutCountry.split(/\s+/u).length <= 5 &&
      /^[\p{L}][\p{L} .,'’\-]*$/u.test(withoutCountry)
    ) {
      city = canonicalCity(withoutCountry);
    }
  }

  if (!country && city === "Muenchen") {
    country = "DE";
  }

  return {
    country,
    city,
    explicit: Boolean(country && city),
    source: country && city ? "explicit_message" : null
  };
}

export function looksLikeEcosystemLocationReply(message) {
  const original = String(message || "").trim();
  const normalized = normalizeEcosystemText(original);

  if (
    !original ||
    original.length > 100 ||
    LOCATION_REPLY_REJECT.test(normalized) ||
    /[?]/u.test(original) ||
    original.split(/\s+/u).length > 4 ||
    /\b(?:ich|du|er|sie|es|wir|ihr|brauche|suche|finde|liegt|stehen|gehoert|gehört|ist|sind|war|waren)\b/iu.test(
      original
    )
  ) {
    return false;
  }

  const location = extractExplicitEcosystemLocation(
    original,
    { allowStandalone: true }
  );
  return Boolean(location.city);
}

function needsLocalLookup(normalizedMessage, urgency) {
  if (
    ["human", "both"].includes(urgency?.subject) &&
    ["medical", "police"].includes(urgency?.route) &&
    ["emergency", "urgent"].includes(urgency?.level)
  ) {
    return false;
  }
  if (urgency.level !== "information") return true;
  if (matchedTerms(normalizedMessage, LOCAL_LOOKUP_TERMS).length > 0) return true;
  return false;
}

function sourceMatchesLocation(source, country, city) {
  if (source.scope === "global") return true;
  if (source.national_service === true) {
    return !country || source.country === country;
  }
  if (source.country && country && source.country !== country) return false;
  if (source.country && !country) return false;
  if (source.city && !city) return false;
  if (source.city && normalizeEcosystemText(source.city) !== normalizeEcosystemText(city)) {
    return false;
  }
  return true;
}

export function selectEcosystemHelpSources({
  areaIds = [],
  country = "",
  city = "",
  urgency = null,
  matchedRequestTerms = []
} = {}) {
  const selectedAreas = new Set(areaIds);
  const resolvedCountry = canonicalCountry(country);
  const resolvedCity = canonicalCity(city);
  const subject = urgency?.subject || "general";
  const requestTerms = new Set(
    matchedRequestTerms.map(term => normalizeEcosystemText(term))
  );
  const specificAreas = new Set(
    [...selectedAreas].filter(area => area !== "lokale_anlaufstellen")
  );

  return ecosystemManifest.help_sources
    .filter(source => {
      if (
        subject === "animal" &&
        HUMAN_ONLY_HELP_SOURCE_IDS.has(source.id)
      ) {
        return false;
      }
      if (
        subject === "human" &&
        ANIMAL_ONLY_HELP_SOURCE_IDS.has(source.id)
      ) {
        return false;
      }

      if (source.id === "de_emergency_112") {
        return (
          urgency?.level === "emergency" &&
          urgency?.route === "medical" &&
          ["human", "both"].includes(subject)
        );
      }
      if (source.id === "de_police_110") {
        return (
          urgency?.level === "emergency" &&
          urgency?.route === "police" &&
          subject === "human"
        );
      }
      if (source.id === "de_medical_116117") {
        return (
          urgency?.level === "urgent" &&
          urgency?.route === "medical" &&
          ["human", "both", "general"].includes(subject) &&
          selectedAreas.has("medizinische_versorgung")
        );
      }
      if (source.id === "munich_homeless_support") {
        return (
          selectedAreas.has("menschen_in_not") &&
          HOMELESS_HELP_TERMS.some(term => requestTerms.has(term))
        );
      }
      if (["munich_tafel", "de_tafel_search"].includes(source.id)) {
        return selectedAreas.has("lebensmittel_versorgung");
      }
      if (source.id === "munich_animal_rescue") {
        return selectedAreas.has("tiere_in_not");
      }
      if (source.id === "msf_global") {
        return requestTerms.has("aerzte ohne grenzen");
      }

      return source.areas.some(area => specificAreas.has(area));
    })
    .filter(source => sourceMatchesLocation(source, resolvedCountry, resolvedCity))
    .map(source => {
      const verificationRequired =
        source.must_live_verify === true;
      const selectedSource = {
        ...source,
        verification_required_before_use:
          verificationRequired
      };

      if (verificationRequired && selectedSource.phone) {
        delete selectedSource.phone;
        selectedSource.contact_data_withheld_until_verified = true;
      }

      return selectedSource;
    });
}

function areasWithUrgencyContext(areas, urgency) {
  if (urgency.level === "information") return areas;

  const subjectAreaIds =
    urgency.subject === "animal"
      ? ["tiere_in_not"]
      : urgency.subject === "human"
        ? ["menschen_in_not"]
        : urgency.subject === "both"
          ? ["menschen_in_not", "tiere_in_not"]
          : [];
  const requiredIds =
    urgency.level === "emergency" && urgency.route === "medical"
      ? [...subjectAreaIds, "medizinische_versorgung"]
      : urgency.level === "emergency"
        ? [...subjectAreaIds, "lokale_anlaufstellen"]
      : urgency.level === "urgent"
        ? [...subjectAreaIds, "medizinische_versorgung"]
        : subjectAreaIds;
  const existingIds = new Set(areas.map(area => area.id));
  const additions = ecosystemManifest.areas
    .filter(area => requiredIds.includes(area.id) && !existingIds.has(area.id))
    .map(area => ({
      id: area.id,
      title: area.title,
      score: 1,
      matched_terms: urgency.matched_signals
    }));

  return [...areas, ...additions].sort((left, right) =>
    right.score - left.score || left.id.localeCompare(right.id, "de")
  );
}

function projectPositionsFor(areas) {
  const selected = new Set(areas.map(area => area.id));
  return ecosystemManifest.areas
    .filter(area => selected.has(area.id) && area.project_target)
    .map(area => ({ area: area.id, statement: area.project_target }));
}

function assessmentCriteriaFor(areas) {
  const selected = new Set(areas.map(area => area.id));
  return ecosystemManifest.areas
    .filter(area => selected.has(area.id))
    .flatMap(area =>
      (area.required_assessment || []).map(criterion => ({
        area: area.id,
        criterion
      }))
    );
}

function limitsFor(areas) {
  const selected = new Set(areas.map(area => area.id));
  return ecosystemManifest.areas
    .filter(area => selected.has(area.id))
    .flatMap(area =>
      (area.limits || []).map(limit => ({
        area: area.id,
        limit
      }))
    );
}

function systemGapsFor(areas) {
  const selected = new Set(areas.map(area => area.id));
  if (!selected.has("tiere_in_not")) {
    return [];
  }
  return ecosystemManifest.system_gaps;
}

function examplesFor(areas) {
  const selected = new Set(areas.map(area => area.id));
  return ecosystemManifest.areas
    .filter(area => selected.has(area.id))
    .flatMap(area => area.examples || [])
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 8);
}

function priorityContactFor(urgency, country = "") {
  if (country && country !== "DE") return null;

  let sourceId = "";
  let label = "";
  if (
    ["human", "both"].includes(urgency?.subject) &&
    urgency?.route === "medical" &&
    urgency?.level === "emergency"
  ) {
    sourceId = "de_emergency_112";
    label = "Notruf für Feuerwehr und Rettungsdienst";
  } else if (
    urgency?.subject === "human" &&
    urgency?.route === "police" &&
    urgency?.level === "emergency"
  ) {
    sourceId = "de_police_110";
    label = "Polizeinotruf";
  } else if (
    urgency?.subject === "human" &&
    urgency?.route === "medical" &&
    urgency?.level === "urgent"
  ) {
    sourceId = "de_medical_116117";
    label = "Ärztlicher Bereitschaftsdienst";
  } else {
    return null;
  }

  const source = ecosystemManifest.help_sources.find(
    candidate => candidate.id === sourceId
  );
  if (!source?.phone) return null;

  return {
    type: "phone",
    number: source.phone,
    label,
    country: source.country,
    purpose: source.use_for,
    official_url: source.official_url,
    test_mode: urgency.test_mode === true,
    open_dialer_allowed: urgency.test_mode !== true,
    automatic_call: false,
    final_phone_confirmation_required: true
  };
}

export function ensurePriorityContactPrefix(answer, priorityContact) {
  const cleanAnswer = String(answer || "").trim();
  if (!cleanAnswer || !priorityContact?.number) return cleanAnswer;

  const firstLine = cleanAnswer.split(/\r?\n/u)[0] || "";
  if (firstLine.includes(priorityContact.number)) return cleanAnswer;

  const prefix = priorityContact.test_mode
    ? `Nur als Test: In Deutschland wäre hier die ${priorityContact.number} (${priorityContact.label}) richtig.`
    : `${priorityContact.number} – ${priorityContact.label} in Deutschland.`;
  return `${prefix}\n\n${cleanAnswer}`;
}

function immediateGuidance(urgency, country, city, priorityContact) {
  if (urgency.level === "information") return [];

  const guidance = [];

  if (priorityContact) {
    if (priorityContact.test_mode) {
      guidance.push(
        `Nur als Test: In Deutschland waere hier die ${priorityContact.number} (${priorityContact.label}) richtig. Es wird kein Waehler geoeffnet.`
      );
    } else {
      guidance.push(
        `${priorityContact.number} – ${priorityContact.label} in Deutschland. Der Anruf wird nie automatisch gestartet.`
      );
    }
  }

  if (
    (urgency.subject === "human" || urgency.subject === "both") &&
    urgency.level === "emergency" &&
    urgency.route === "medical"
  ) {
    guidance.push(
      "Wenn es ohne Eigengefahr moeglich ist: bei der Person bleiben und den Anweisungen der Leitstelle folgen."
    );

    if (urgency.subject === "human") return guidance;
  }

  if (urgency.subject === "human") return guidance;

  if (
    urgency.subject !== "animal" &&
    urgency.subject !== "both"
  ) {
    return guidance;
  }

  guidance.push(
    "Eigene Sicherheit zuerst; ein verletztes oder panisches Tier nicht ungesichert anfassen.",
    "Tierart, beobachteten Zustand und genauen Fundort fuer Tierrettung oder Tierklinik bereithalten."
  );
  if (country === "DE" && city === "Muenchen") {
    guidance.push(
      "Die aktuellen Angaben der Tierrettung Muenchen vor dem Anruf auf der offiziellen Notfallseite pruefen."
    );
  } else {
    guidance.push(
      "Die zustaendige Tierrettung, Tierklinik oder Behoerde fuer den aktuellen Ort offiziell pruefen."
    );
  }
  return guidance;
}

export function buildOfficialLookupRequests({
  areas = [],
  country = "",
  city = "",
  urgency = null
} = {}) {
  const location = [canonicalCity(city), canonicalCountry(country)]
    .filter(Boolean)
    .join(" ");
  const ids = new Set(areas.map(area => area.id));
  const requests = [];

  if (
    ["human", "both"].includes(urgency?.subject) &&
    urgency.level === "emergency" &&
    urgency.route === "medical"
  ) {
    requests.push(`${location} offizieller Notruf akute Lebensgefahr`);
  }
  if (
    urgency?.subject === "human" &&
    urgency.level === "emergency" &&
    urgency.route === "police"
  ) {
    requests.push(`${location} offizieller Polizeinotruf akute Gefahr`);
  }
  if (
    urgency?.subject === "human" &&
    urgency.level === "urgent" &&
    urgency.route === "medical"
  ) {
    requests.push(`${location} offizieller aerztlicher Bereitschaftsdienst 116117`);
  }
  if (
    ["animal", "both"].includes(urgency?.subject) &&
    urgency.level === "emergency"
  ) {
    requests.push(`${location} offizielle Tierrettung Tierklinik Notfall`);
  }
  if (ids.has("menschen_in_not")) {
    requests.push(`${location} offizielle Wohnungslosenhilfe Notunterkunft Streetwork Hilfsbus`);
  }
  if (ids.has("lebensmittel_versorgung")) {
    requests.push(`${location} offizielle Tafel Lebensmittelhilfe Essensausgabe`);
  }
  if (ids.has("tiere_in_not")) {
    requests.push(`${location} offizielle Tierrettung Tierheim Tierklinik`);
  }
  if (ids.has("wasser_abwasser") || ids.has("abfall_haushalt")) {
    requests.push(`${location} offizielle Abfallberatung Abwasser Entsorgung`);
  }

  return [...new Set(requests.map(value => value.trim()))];
}

export function buildEcosystemAssessment({
  message,
  country = "",
  city = "",
  locationConsent = false
} = {}) {
  const normalizedMessage = normalizeEcosystemText(message);
  const urgency = classifyEcosystemUrgency(message);
  const areas = areasWithUrgencyContext(
    detectEcosystemAreas(message),
    urgency
  );
  const resolvedCountry = canonicalCountry(country);
  const resolvedCity = canonicalCity(city);
  const localLookup = needsLocalLookup(normalizedMessage, urgency);
  const locationAvailable = Boolean(resolvedCountry && resolvedCity && locationConsent);
  const priorityContact = priorityContactFor(
    urgency,
    locationAvailable ? resolvedCountry : ""
  );
  const helpSources = selectEcosystemHelpSources({
    areaIds: areas.map(area => area.id),
    country: locationAvailable ? resolvedCountry : "",
    city: locationAvailable ? resolvedCity : "",
    urgency,
    matchedRequestTerms: areas.flatMap(area => area.matched_terms)
  });

  return {
    schema_version: ecosystemManifest.schema_version,
    matched: areas.length > 0 || urgency.level !== "information",
    areas,
    urgency,
    scope: ecosystemManifest.scope,
    principles: ecosystemManifest.principles,
    project_positions: projectPositionsFor(areas),
    assessment_criteria: assessmentCriteriaFor(areas),
    limits: limitsFor(areas),
    system_gaps: systemGapsFor(areas),
    practical_steps: examplesFor(areas),
    immediate_guidance: immediateGuidance(
      urgency,
      locationAvailable ? resolvedCountry : "",
      locationAvailable ? resolvedCity : "",
      priorityContact
    ),
    priority_contact: priorityContact,
    location: {
      requested_for_lookup: localLookup,
      consent_given: locationConsent === true,
      country: locationAvailable ? resolvedCountry : null,
      city: locationAvailable ? resolvedCity : null,
      clarification_required: localLookup && !locationAvailable,
      passive_device_location_used: false
    },
    help_sources: helpSources,
    official_lookup_requests: buildOfficialLookupRequests({
      areas,
      country: locationAvailable ? resolvedCountry : "",
      city: locationAvailable ? resolvedCity : "",
      urgency
    }),
    controls: {
      official_source_verification_required: helpSources.some(
        source => source.verification_required_before_use
      ) || localLookup,
      current_evidence_required:
        areas.some(area => area.id === "investieren_beschaffen") ||
        helpSources.some(source => source.verification_required_before_use),
      human_review_required: urgency.level !== "information",
      medical_diagnosis_performed: false,
      legal_claim_performed: false,
      external_action_performed: false,
      payment_or_investment_performed: false,
      data_written: false
    }
  };
}

export function ecosystemModelContext(assessment) {
  if (!assessment?.matched) return null;

  return {
    schema_version: assessment.schema_version,
    areas: assessment.areas,
    urgency: assessment.urgency,
    scope: assessment.scope,
    principles: assessment.principles,
    project_positions: assessment.project_positions,
    assessment_criteria: assessment.assessment_criteria,
    limits: assessment.limits,
    system_gaps: assessment.system_gaps,
    practical_steps: assessment.practical_steps,
    immediate_guidance: assessment.immediate_guidance,
    priority_contact: assessment.priority_contact,
    location: assessment.location,
    help_sources: assessment.help_sources,
    official_lookup_requests: assessment.official_lookup_requests,
    controls: assessment.controls
  };
}

export function renderGermanEcosystemAssessment(assessment) {
  if (!assessment?.matched) {
    return "Dazu habe ich noch keinen eindeutigen Oekosystem-Bezug erkannt.";
  }

  const lines = [];
  if (assessment.immediate_guidance.length > 0) {
    lines.push(...assessment.immediate_guidance);
  }
  if (assessment.areas.length > 0) {
    lines.push(
      `Betroffene Bereiche: ${assessment.areas.map(area => area.title).join(", ")}.`
    );
  }
  if (assessment.practical_steps.length > 0) {
    lines.push(...assessment.practical_steps);
  }
  if (assessment.location.clarification_required) {
    lines.push(
      "Fuer eine passende Anlaufstelle brauche ich deinen aktuellen Ort oder deine ausdrueckliche Freigabe, ihn dafuer zu verwenden."
    );
  } else if (assessment.help_sources.length > 0) {
    lines.push(
      "Passende Stellen werden vor der Ausgabe noch einmal ueber ihre offiziellen Seiten auf Aktualitaet geprueft."
    );
  }

  return lines.join("\n");
}
