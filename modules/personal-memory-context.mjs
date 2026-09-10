function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("de-DE")
    .replace(/[?!.,;:]+$/u, "")
    .replace(/\s+/gu, " ")
    .trim();
}

export function personalRecallFollowUpKind(value) {
  const text = normalize(value);

  if (!text || text.length > 64) {
    return "";
  }

  const patterns = [
    [
      "place",
      /^(?:und\s+)?(?:wo(?:\s+genau)?|an\s+welchem\s+ort)(?:\s+(?:ist|war)\s+(?:das|es))?$/u
    ],
    [
      "time",
      /^(?:und\s+)?(?:wann(?:\s+genau)?|an\s+welchem\s+tag|zu\s+welchem\s+datum)(?:\s+(?:ist|war)\s+(?:das|es))?$/u
    ],
    [
      "person",
      /^(?:und\s+)?wer(?:\s+genau)?(?:\s+(?:ist|war)\s+(?:das|es))?$/u
    ],
    [
      "detail",
      /^(?:und\s+)?(?:wie(?:\s+genau)?|was(?:\s+noch)?)(?:\s+(?:ist|war)\s+(?:das|es))?$/u
    ]
  ];

  for (const [kind, pattern] of patterns) {
    if (pattern.test(text)) {
      return kind;
    }
  }

  return "";
}

export function resolvePersonalRecallContextQuery({
  message,
  rows,
  directQueryFromMessage
}) {
  const getDirectQuery =
    typeof directQueryFromMessage === "function"
      ? directQueryFromMessage
      : () => "";
  const directQuery = String(getDirectQuery(message) || "").trim();

  if (directQuery) {
    return {
      query: directQuery.slice(0, 240),
      contextual: false,
      followUpKind: "",
      sourceMessage: String(message || "").trim()
    };
  }

  const followUpKind = personalRecallFollowUpKind(message);
  if (!followUpKind) {
    return {
      query: "",
      contextual: false,
      followUpKind: "",
      sourceMessage: ""
    };
  }

  const normalizedCurrent = normalize(message);
  const history = Array.isArray(rows) ? rows.slice(-10) : [];

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const row = history[index] || {};
    if (String(row.role || "") !== "user") {
      continue;
    }

    const content = String(row.content || "").trim();
    if (!content || normalize(content) === normalizedCurrent) {
      continue;
    }

    const previousQuery = String(getDirectQuery(content) || "").trim();
    if (!previousQuery) {
      break;
    }

    return {
      query: previousQuery.slice(0, 240),
      contextual: true,
      followUpKind,
      sourceMessage: content
    };
  }

  return {
    query: "",
    contextual: false,
    followUpKind,
    sourceMessage: ""
  };
}

export function isAssistantHistoryRecallRequest(value) {
  const text = normalize(value);
  if (!text) {
    return false;
  }

  const mentionsPriorAssistantAction =
    /\b(?:empfohlen|vorgeschlagen|geraten|gesagt|erzahlt|geschrieben|geantwortet|gemeint|ausgesucht)\b/u.test(
      text
    );
  const identifiesAssistant =
    /\b(?:du|ihr|sie|sol|holo|assistenz)\b/u.test(text) ||
    /\bdein(?:e|er|en|em|es)?\s+(?:antwort|empfehlung|vorschlag)\b/u.test(
      text
    );

  return mentionsPriorAssistantAction && identifiesAssistant;
}

export function personalMemoryRelativeDayOffset(value) {
  const text = normalize(value);
  if (/\bvorgestern\b/u.test(text)) return -2;
  if (/\bgestern\b/u.test(text)) return -1;
  if (/\bheute\b/u.test(text)) return 0;
  return null;
}
