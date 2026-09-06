const BIRTHDAY_SUBJECTS = Object.freeze({
  father: Object.freeze({
    label: "Vater Geburtstag",
    terms: Object.freeze(["vater", "papa", "vati"])
  }),
  mother: Object.freeze({
    label: "Mutter Geburtstag",
    terms: Object.freeze(["mutter", "mama", "mutti"])
  })
});

const BIRTHDAY_TERMS = Object.freeze([
  "geburtstag",
  "geburtsdatum",
  "geboren"
]);

const MONTHS = Object.freeze({
  januar: 1,
  jan: 1,
  februar: 2,
  feb: 2,
  marz: 3,
  maerz: 3,
  april: 4,
  apr: 4,
  mai: 5,
  juni: 6,
  jun: 6,
  juli: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  oktober: 10,
  okt: 10,
  november: 11,
  nov: 11,
  dezember: 12,
  dez: 12
});

const CALENDAR_QUERY_NOISE = new Set([
  "auch", "bitte", "eintragen", "eintrag", "kalender", "kannst",
  "kann", "mach", "machen", "meinen", "meinem", "meiner", "seinen",
  "seinem", "seiner", "termin", "trag", "trage", "schreib", "schreibe"
]);

function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("de-DE");
}

function birthdaySubject(value) {
  const text = normalize(value);

  for (const [key, subject] of Object.entries(BIRTHDAY_SUBJECTS)) {
    if (
      subject.terms.some(
        term => new RegExp(`\\b${term}(?:s)?\\b`, "u").test(text)
      )
    ) {
      return { key, ...subject };
    }
  }

  return null;
}

function mentionsBirthday(value) {
  const text = normalize(value);
  return BIRTHDAY_TERMS.some(
    term => new RegExp(`\\b${term}\\w*\\b`, "u").test(text)
  );
}

function validDayMonth(day, month) {
  if (!Number.isInteger(day) || !Number.isInteger(month)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }
  const maximum = new Date(Date.UTC(2024, month, 0)).getUTCDate();
  return day <= maximum;
}

function dateReferences(value) {
  const text = normalize(value);
  const references = [];
  const seen = new Set();

  const remember = (dayValue, monthValue) => {
    const day = Number(dayValue);
    const month = Number(monthValue);
    const key = `${month}-${day}`;
    if (!validDayMonth(day, month) || seen.has(key)) {
      return;
    }
    seen.add(key);
    references.push({ day, month });
  };

  const monthNames = Object.keys(MONTHS).join("|");
  const writtenPattern = new RegExp(
    `\\b([0-3]?\\d)\\.?\\s+(?:am\\s+)?(${monthNames})(?:\\s+\\d{2,4})?\\b`,
    "gu"
  );
  for (const match of text.matchAll(writtenPattern)) {
    remember(match[1], MONTHS[match[2]]);
  }

  const numericPattern = /\b([0-3]?\d)[./-]([01]?\d)(?:[./-]\d{2,4})?\b/gu;
  for (const match of text.matchAll(numericPattern)) {
    remember(match[1], match[2]);
  }

  return references;
}

function isoDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function nextOccurrence(day, month, todayIso) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(String(todayIso || ""))) {
    throw new TypeError("todayIso must use YYYY-MM-DD");
  }

  const today = String(todayIso);
  const currentYear = Number(today.slice(0, 4));
  for (let offset = 0; offset <= 8; offset += 1) {
    const candidate = isoDate(currentYear + offset, month, day);
    if (candidate && candidate >= today) {
      return candidate;
    }
  }

  return "";
}

function nextDay(iso) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function calendarMemorySearchQuery(message) {
  const subject = birthdaySubject(message);
  if (subject && mentionsBirthday(message)) {
    return [...subject.terms, ...BIRTHDAY_TERMS].join(" ");
  }

  const words = normalize(message).match(/[\p{L}\p{N}][\p{L}\p{N}_-]*/gu) || [];
  return [...new Set(words.filter(word => word.length >= 2 && !CALENDAR_QUERY_NOISE.has(word)))]
    .slice(0, 12)
    .join(" ");
}

export function resolveGroundedBirthdayCalendarCommand({
  message,
  rows,
  todayIso
}) {
  const subject = birthdaySubject(message);
  if (!subject || !mentionsBirthday(message)) {
    return {
      matched: false,
      resolved: false,
      reason: "not_birthday_request",
      command: null
    };
  }

  const history = Array.isArray(rows) ? rows : [];
  let latestCandidate = null;

  for (let index = 0; index < history.length; index += 1) {
    const row = history[index] || {};
    if (String(row.role || "") !== "user") {
      continue;
    }

    const dates = dateReferences(row.content);
    if (dates.length === 0) {
      continue;
    }

    const directSubject = birthdaySubject(row.content)?.key === subject.key;
    const priorContext = history
      .slice(Math.max(0, index - 2), index)
      .some(previous =>
        String(previous?.role || "") === "assistant" &&
        birthdaySubject(previous?.content)?.key === subject.key &&
        mentionsBirthday(previous?.content)
      );

    if (!directSubject && !priorContext) {
      continue;
    }

    const distinctDates = new Map(
      dates.map(date => [`${date.month}-${date.day}`, date])
    );
    if (distinctDates.size > 1) {
      return {
        matched: true,
        resolved: false,
        reason: "conflicting_dates",
        command: null
      };
    }

    [latestCandidate] = distinctDates.values();
  }

  if (!latestCandidate) {
    return {
      matched: true,
      resolved: false,
      reason: "missing_date",
      command: null
    };
  }

  const { day, month } = latestCandidate;
  const start = nextOccurrence(day, month, todayIso);
  if (!start) {
    return {
      matched: true,
      resolved: false,
      reason: "invalid_date",
      command: null
    };
  }

  return {
    matched: true,
    resolved: true,
    reason: "owner_history",
    command: {
      action: "create",
      summary: subject.label,
      start,
      end: nextDay(start),
      description: "",
      reminderMinutes: null,
      allDay: true,
      recurrence: "yearly",
      memoryGrounded: true
    }
  };
}
