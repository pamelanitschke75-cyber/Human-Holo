/**
 * Human Holo - modality-uebergreifende Ereigniserinnerungen
 *
 * Rohbilder, Videodateien und Audiostreams gehoeren nicht in das
 * Vollzeitgedaechtnis. Gespeichert werden nur der ownergebundene Dialog,
 * die verwendeten Modalitaeten und Holos damalige sprachliche Auswertung.
 */

export const MEMORY_MODALITY = Object.freeze({
  TEXT: "text",
  VOICE: "voice",
  IMAGE: "image",
  VIDEO: "video",
  LIVE_IMAGE: "live_image",
  SIGN_LANGUAGE: "sign_language"
});

const MODALITY_ALIASES = new Map([
  ["text", MEMORY_MODALITY.TEXT],
  ["typed", MEMORY_MODALITY.TEXT],
  ["keyboard", MEMORY_MODALITY.TEXT],
  ["voice", MEMORY_MODALITY.VOICE],
  ["speech", MEMORY_MODALITY.VOICE],
  ["audio", MEMORY_MODALITY.VOICE],
  ["transcript", MEMORY_MODALITY.VOICE],
  ["image", MEMORY_MODALITY.IMAGE],
  ["photo", MEMORY_MODALITY.IMAGE],
  ["foto", MEMORY_MODALITY.IMAGE],
  ["picture", MEMORY_MODALITY.IMAGE],
  ["video", MEMORY_MODALITY.VIDEO],
  ["movie", MEMORY_MODALITY.VIDEO],
  ["live_image", MEMORY_MODALITY.LIVE_IMAGE],
  ["live-image", MEMORY_MODALITY.LIVE_IMAGE],
  ["live_camera", MEMORY_MODALITY.LIVE_IMAGE],
  ["live-camera", MEMORY_MODALITY.LIVE_IMAGE],
  ["sign_language", MEMORY_MODALITY.SIGN_LANGUAGE],
  ["sign-language", MEMORY_MODALITY.SIGN_LANGUAGE],
  ["sign language", MEMORY_MODALITY.SIGN_LANGUAGE],
  ["gebardensprache", MEMORY_MODALITY.SIGN_LANGUAGE],
  ["gebaerdensprache", MEMORY_MODALITY.SIGN_LANGUAGE],
  ["dgs", MEMORY_MODALITY.SIGN_LANGUAGE]
]);

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("de-DE")
    .replace(/\s+/gu, " ")
    .trim();
}

export function mentionsSignLanguage(value) {
  const text = normalizeText(value);

  return /\b(?:dgs|geb(?:a|ae)rd(?:e|en|et|ete|eten|end|ensprache|ensprachlich)|sign[ -]?language)\b/u.test(
    text
  );
}

export function normalizeMemoryModalities(
  value,
  {
    fallback = MEMORY_MODALITY.TEXT
  } = {}
) {
  const supplied = Array.isArray(value)
    ? value
    : value == null
      ? []
      : [value];
  const result = [];

  for (const item of supplied) {
    const modality = MODALITY_ALIASES.get(normalizeText(item));

    if (modality && !result.includes(modality)) {
      result.push(modality);
    }
  }

  if (result.length === 0 && fallback) {
    const normalizedFallback =
      MODALITY_ALIASES.get(normalizeText(fallback));

    if (normalizedFallback) {
      result.push(normalizedFallback);
    }
  }

  return result;
}

export function memoryEventIdFromRow(row) {
  const direct = String(row?.memory_event_id || "").trim();

  if (direct) {
    return direct;
  }

  return String(row?.source_event_id || "")
    .trim()
    .replace(/:(?:\d+:)?(?:user|assistant)$/u, "");
}

export function memoryModalitiesFromRow(row) {
  const modalities = normalizeMemoryModalities(
    row?.source_modalities,
    {
      fallback: null
    }
  );
  const content = String(row?.content || "");

  if (/\[Foto gesendet\]/iu.test(content)) {
    modalities.push(MEMORY_MODALITY.IMAGE);
  }

  if (/\[Video gesendet(?:\s|·|\])/iu.test(content)) {
    modalities.push(MEMORY_MODALITY.VIDEO);
  }

  if (/\[Live-Kamerabild\]/iu.test(content)) {
    modalities.push(MEMORY_MODALITY.LIVE_IMAGE);
  }

  if (/\[Gebärdensprache\]/iu.test(content)) {
    modalities.push(MEMORY_MODALITY.SIGN_LANGUAGE);
  }

  return [...new Set(modalities)];
}

export function memoryRowHasVisualContext(row) {
  return memoryModalitiesFromRow(row).some(
    modality =>
      modality === MEMORY_MODALITY.IMAGE ||
      modality === MEMORY_MODALITY.VIDEO ||
      modality === MEMORY_MODALITY.LIVE_IMAGE ||
      modality === MEMORY_MODALITY.SIGN_LANGUAGE
  );
}

/**
 * Erkennt allgemeine Anschlussformulierungen. Es werden keine Themenlisten
 * gepflegt: Die Regel gilt fuer Essen genauso wie fuer Tiere, Haushalt,
 * Reisen oder jedes andere persoenliche Ereignis.
 */
export function mayReferToRecentMultimodalEvent(value) {
  const text = normalizeText(value);

  if (!text) {
    return false;
  }

  if (
    /\b(?:foto|bild|aufnahme|kamera|video|film|clip|tonspur|audio|dgs|geb(?:a|ae)rd(?:e|en|et|ete|eten|end|ensprache)|sign[ -]?language)\b/u.test(
      text
    ) ||
    /\b(?:gestern|vorgestern|vorhin|damals|neulich|letzt(?:e|en|er|es))\b/u.test(
      text
    ) ||
    /\b(?:erinner(?:e|st|t|n)|weisst du noch|weißt du noch)\b/u.test(
      text
    )
  ) {
    return true;
  }

  if (
    /^(?:und\s+)?(?:es|das|dies(?:e|er|es)?|dabei|dazu|damit|davon)\b/u.test(
      text
    )
  ) {
    return true;
  }

  return (
    /\b(?:es|das|ihn|sie|dazu|dabei)\b/u.test(text) &&
    /\b(?:dauerte|gedauert|funktioniert|geklappt|war|wurde|wollten|mochten|wollte|besser|schlechter|langer|kurzer|krosser|knuspriger)\b/u.test(
      text
    )
  );
}

/**
 * Engere Regel fuer eine echte Ereignis-Verknuepfung. Ein blosses Datum wie
 * „Gestern war ich einkaufen“ darf nicht versehentlich an das letzte Foto
 * geheftet werden. Deiktische Ergaenzungen und ausdrueckliche Medienbezuege
 * werden dagegen als Fortsetzung behandelt.
 */
export function shouldAssociateWithRecentMultimodalEvent(value) {
  const text = normalizeText(value);

  if (!text) {
    return false;
  }

  if (
    /\b(?:foto|bild|aufnahme|kamera|video|film|clip|tonspur|audio|dgs|geb(?:a|ae)rd(?:e|en|et|ete|eten|end|ensprache)|sign[ -]?language)\b/u.test(
      text
    )
  ) {
    return true;
  }

  if (
    /\b(?:dazu|dabei|damit|davon|darauf|hierzu)\b/u.test(text)
  ) {
    return true;
  }

  if (
    /^(?:und\s+)?(?:es|das|dies(?:e|er|es)?|ihn|sie)\b/u.test(text) &&
    /\b(?:dauerte|gedauert|funktioniert|geklappt|war|wurde|ist|sah|aussah|wollten|wollte|mochten|mochte|besser|schlechter|langer|kurzer|krosser|knuspriger|schneller|langsamer)\b/u.test(
      text
    )
  ) {
    return true;
  }

  return (
    /\b(?:sagen|erzahlen|erganzen|korrigieren)\b/u.test(text) &&
    /\b(?:es|das|dazu|dabei|damit|davon)\b/u.test(text)
  );
}

const GENERIC_REFERENCE_TERMS = new Set([
  "audio",
  "aufnahme",
  "bild",
  "clip",
  "dabei",
  "damals",
  "damit",
  "dazu",
  "davon",
  "dies",
  "diese",
  "dieser",
  "dieses",
  "film",
  "foto",
  "gebarde",
  "gebarden",
  "gebardensprache",
  "gestern",
  "heute",
  "kamera",
  "neulich",
  "tonspur",
  "video",
  "vorgestern"
]);

function referenceTerms(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9\u00df]+/gu, " ")
    .split(/\s+/u)
    .filter(
      term =>
        term.length >= 3 &&
        !GENERIC_REFERENCE_TERMS.has(term)
    );
}

/**
 * Waehlt aus bereits ownergebunden geladenen Ereignissen den besten Bezug.
 * Fachthemen sind absichtlich nicht eingebaut: „Fisch“, „Katze“, „Rechnung“
 * oder jedes kuenftige Thema werden identisch ueber ihren Text bewertet.
 */
export function selectReferencedMultimodalEventId(
  rows,
  message
) {
  if (
    !shouldAssociateWithRecentMultimodalEvent(message)
  ) {
    return "";
  }

  const groups = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
    const eventId = memoryEventIdFromRow(row);

    if (!eventId) {
      continue;
    }

    const group = groups.get(eventId) || {
      eventId,
      hasVisualContext: false,
      latestId: 0,
      text: ""
    };

    group.hasVisualContext =
      group.hasVisualContext ||
      memoryRowHasVisualContext(row);
    group.latestId = Math.max(
      group.latestId,
      Number(row?.id || 0)
    );
    group.text += ` ${normalizeText(row?.content)}`;
    groups.set(eventId, group);
  }

  const candidates = [...groups.values()]
    .filter(group => group.hasVisualContext)
    .sort((first, second) => second.latestId - first.latestId);

  if (candidates.length === 0) {
    return "";
  }

  const terms = referenceTerms(message);
  let best = null;

  for (const candidate of candidates) {
    const matchingTerms = terms.filter(term =>
      candidate.text.includes(term)
    ).length;

    if (
      matchingTerms > 0 &&
      (
        !best ||
        matchingTerms > best.matchingTerms ||
        (
          matchingTerms === best.matchingTerms &&
          candidate.latestId > best.latestId
        )
      )
    ) {
      best = {
        ...candidate,
        matchingTerms
      };
    }
  }

  return best?.eventId || candidates[0].eventId;
}

function modalityLabel(modalities) {
  const labels = {
    [MEMORY_MODALITY.TEXT]: "Text",
    [MEMORY_MODALITY.VOICE]: "Sprache",
    [MEMORY_MODALITY.IMAGE]: "Foto",
    [MEMORY_MODALITY.VIDEO]: "Video",
    [MEMORY_MODALITY.LIVE_IMAGE]: "Live-Bild",
    [MEMORY_MODALITY.SIGN_LANGUAGE]: "Gebärdensprache"
  };

  return modalities
    .map(modality => labels[modality])
    .filter(Boolean)
    .join(" + ");
}

function timestampLabel(value) {
  const timestamp = new Date(value || "");

  if (Number.isNaN(timestamp.getTime())) {
    return "Zeitpunkt unbekannt";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin"
  }).format(timestamp);
}

export function formatMultimodalEventRows(
  rows,
  {
    displayName = "Pam",
    assistantName = "Human Holo",
    maximumCharacters = 8_000
  } = {}
) {
  const groups = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
    const content = String(row?.content || "").trim();

    if (!content) {
      continue;
    }

    const eventId =
      memoryEventIdFromRow(row) || `row-${String(row?.id || groups.size)}`;
    const group = groups.get(eventId) || {
      createdAt: row?.created_at,
      modalities: new Set(),
      rows: []
    };

    for (const modality of memoryModalitiesFromRow(row)) {
      group.modalities.add(modality);
    }

    group.rows.push({
      content,
      id: Number(row?.id || 0),
      role: row?.role === "assistant" ? "assistant" : "user"
    });
    groups.set(eventId, group);
  }

  const sections = [];

  for (const group of groups.values()) {
    const modalities = [...group.modalities];

    if (
      !modalities.some(
        modality =>
          modality === MEMORY_MODALITY.IMAGE ||
          modality === MEMORY_MODALITY.VIDEO ||
          modality === MEMORY_MODALITY.LIVE_IMAGE ||
          modality === MEMORY_MODALITY.SIGN_LANGUAGE
      )
    ) {
      continue;
    }

    const lines = group.rows
      .sort((first, second) => first.id - second.id)
      .map(row =>
        row.role === "assistant"
          ? `${assistantName} (damalige Auswertung/Antwort, kein eigenständiger Beleg): ${row.content}`
          : `${displayName} (damaliger Beitrag): ${row.content}`
      );

    sections.push(
      `Ereignis · ${modalityLabel(modalities)} · ${timestampLabel(group.createdAt)}\n${lines.join("\n")}`
    );
  }

  return sections.join("\n\n").slice(0, maximumCharacters);
}
