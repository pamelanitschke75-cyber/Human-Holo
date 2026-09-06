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

const HELP_AREA_IDS = new Set([
  "lebensmittel_versorgung",
  "menschen_in_not",
  "tiere_in_not",
  "medizinische_versorgung",
  "lokale_anlaufstellen"
]);

const LOCAL_LOOKUP_TERMS = Object.freeze([
  "in der naehe",
  "wohin",
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
  "hund",
  "katze",
  "vogel",
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

const CITY_ALIASES = deepFreeze({
  munchen: "Muenchen",
  muenchen: "Muenchen",
  munich: "Muenchen"
});

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
  const normalized = normalizeEcosystemText(message);
  const animalSignals = matchedTerms(
    normalized,
    ecosystemManifest.emergency_signals.animal
  );
  const humanSignals = matchedTerms(
    normalized,
    ecosystemManifest.emergency_signals.human
  );
  const animalContext = hasAnimalContext(normalized);
  const humanContext = hasHumanContext(normalized);

  if (animalSignals.length > 0 || (animalContext && humanSignals.length > 0 && !humanContext)) {
    return {
      level: "emergency",
      subject: "animal",
      matched_signals: [...new Set([...animalSignals, ...humanSignals])]
    };
  }

  if (humanSignals.length > 0) {
    return {
      level: "emergency",
      subject: "human",
      matched_signals: humanSignals
    };
  }

  const supportSignals = matchedTerms(normalized, [
    "obdachlos",
    "wohnungslos",
    "notunterkunft",
    "hunger",
    "hungrig",
    "friert",
    "existenznot",
    "tier in not",
    "verletztes tier",
    "verletzte katze",
    "verletzter hund",
    "ausgesetzt",
    "fundtier"
  ]);

  return {
    level: supportSignals.length > 0 ? "support-needed" : "information",
    subject: animalContext ? "animal" : humanContext ? "human" : "general",
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

function needsLocalLookup(normalizedMessage, areas, urgency) {
  if (urgency.level !== "information") return true;
  if (matchedTerms(normalizedMessage, LOCAL_LOOKUP_TERMS).length > 0) return true;
  return areas.some(area => HELP_AREA_IDS.has(area.id));
}

function sourceMatchesLocation(source, country, city) {
  if (source.scope === "global") return true;
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
  urgency = null
} = {}) {
  const selectedAreas = new Set(areaIds);
  const resolvedCountry = canonicalCountry(country);
  const resolvedCity = canonicalCity(city);
  const subject = urgency?.subject || "general";
  const specificAreas = new Set(
    [...selectedAreas].filter(area => area !== "lokale_anlaufstellen")
  );

  return ecosystemManifest.help_sources
    .filter(source => {
      const areaMatch = source.areas.some(area => specificAreas.has(area));
      const emergencyMatch =
        urgency?.level === "emergency" &&
        ((subject === "human" && source.id === "de_emergency_112") ||
          (subject === "animal" && source.id === "munich_animal_rescue"));
      return areaMatch || emergencyMatch;
    })
    .filter(source => sourceMatchesLocation(source, resolvedCountry, resolvedCity))
    .map(source => ({
      ...source,
      verification_required_before_use: source.must_live_verify === true
    }));
}

function projectPositionsFor(areas) {
  const selected = new Set(areas.map(area => area.id));
  return ecosystemManifest.areas
    .filter(area => selected.has(area.id) && area.project_target)
    .map(area => ({ area: area.id, statement: area.project_target }));
}

function examplesFor(areas) {
  const selected = new Set(areas.map(area => area.id));
  return ecosystemManifest.areas
    .filter(area => selected.has(area.id))
    .flatMap(area => area.examples || [])
    .filter((value, index, values) => values.indexOf(value) === index)
    .slice(0, 8);
}

function immediateGuidance(urgency, country, city) {
  if (urgency.level === "information") return [];

  if (urgency.subject === "human" && urgency.level === "emergency") {
    if (country === "DE") {
      return [
        "Bei akuter oder lebensbedrohlicher Gefahr jetzt den Notruf 112 waehlen.",
        "Wenn es ohne Eigengefahr moeglich ist: bei der Person bleiben und den Anweisungen der Leitstelle folgen."
      ];
    }
    return [
      "Bei akuter oder lebensbedrohlicher Gefahr jetzt den oertlichen Notruf waehlen.",
      "Die richtige lokale Nummer muss fuer den aktuellen Ort aus einer offiziellen Quelle geprueft werden."
    ];
  }

  if (urgency.subject !== "animal") return [];

  const guidance = [
    "Eigene Sicherheit zuerst; ein verletztes oder panisches Tier nicht ungesichert anfassen.",
    "Tierart, beobachteten Zustand und genauen Fundort fuer Tierrettung oder Tierklinik bereithalten."
  ];
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

  if (urgency?.subject === "human" && urgency.level === "emergency") {
    requests.push(`${location} offizieller Notruf akute Lebensgefahr`);
  }
  if (urgency?.subject === "animal" && urgency.level === "emergency") {
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
  const areas = detectEcosystemAreas(message);
  const urgency = classifyEcosystemUrgency(message);
  const resolvedCountry = canonicalCountry(country);
  const resolvedCity = canonicalCity(city);
  const localLookup = needsLocalLookup(normalizedMessage, areas, urgency);
  const locationAvailable = Boolean(resolvedCountry && resolvedCity && locationConsent);
  const helpSources = selectEcosystemHelpSources({
    areaIds: areas.map(area => area.id),
    country: locationAvailable ? resolvedCountry : "",
    city: locationAvailable ? resolvedCity : "",
    urgency
  });

  return {
    schema_version: ecosystemManifest.schema_version,
    matched: areas.length > 0 || urgency.level !== "information",
    areas,
    urgency,
    scope: ecosystemManifest.scope,
    project_positions: projectPositionsFor(areas),
    practical_steps: examplesFor(areas),
    immediate_guidance: immediateGuidance(
      urgency,
      locationAvailable ? resolvedCountry : "",
      locationAvailable ? resolvedCity : ""
    ),
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
      human_review_required: urgency.level !== "information",
      medical_diagnosis_performed: false,
      legal_claim_performed: false,
      external_action_performed: false,
      payment_or_investment_performed: false,
      data_written: false
    }
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
