from pathlib import Path

server_path = Path("server.mjs")
server = server_path.read_text(encoding="utf-8")

helper_marker = "\nfunction ecosystemRequestScope(\n"
if "function weatherDefaultPlacePreference(" not in server:
    if helper_marker not in server:
        raise SystemExit("Weather helper insertion marker not found")

    helpers = r'''

function cleanWeatherPreferencePlace(value) {
  let place = String(value || "")
    .split(/[\n.!?;]/u)[0]
    .replace(
      /,?\s*\b(?:außer|ausser|falls|wenn|solange|bis)\b[\s\S]*$/iu,
      ""
    )
    .replace(/^[„“"'’]+|[„“"'’]+$/gu, "")
    .replace(/\s+/gu, " ")
    .trim();

  if (!place || place.length > 70) {
    return "";
  }

  const normalized = place
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .toLowerCase();

  if (
    /^(?:mir|uns|hier|heute|morgen|jetzt|spater|spaeter)$/u.test(
      normalized
    )
  ) {
    return "";
  }

  return place;
}

function weatherDefaultPlacePreference(message) {
  const original = String(message || "")
    .normalize("NFKC")
    .replace(/\s+/gu, " ")
    .trim();

  if (
    !original ||
    !/\bwetter(?:bericht|vorhersage)?\b/iu.test(original)
  ) {
    return {
      action: "none",
      place: ""
    };
  }

  const normalized = original
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .toLowerCase();

  const clearPreference =
    /\b(?:vergiss|nicht\s+mehr)\b[\s\S]{0,80}\bwetter(?:bericht|vorhersage)?\b/u.test(
      normalized
    ) ||
    /\bwetter(?:bericht|vorhersage)?\b[\s\S]{0,80}\b(?:nicht\s+mehr|kein(?:e[nrms]?)?\s+standard(?:ort|einstellung)?)\b/u.test(
      normalized
    );

  if (clearPreference) {
    return {
      action: "clear",
      place: ""
    };
  }

  const hasPreferenceSignal =
    /\b(?:merk(?:e)?\s+dir|fur\s+immer|fuer\s+immer|kunftig|ab\s+jetzt|immer|standard(?:massig|maessig|ort)?|nur)\b/u.test(
      normalized
    );

  if (!hasPreferenceSignal) {
    return {
      action: "none",
      place: ""
    };
  }

  const patterns = [
    /\bwetter(?:bericht|vorhersage)?\b[\s\S]{0,100}?\b(?:für|fuer|in)\s+([\p{L}][\p{L}\p{M} .,'’()-]{1,70})/iu,
    /\b(?:für|fuer|in)\s+([\p{L}][\p{L}\p{M} .,'’()-]{1,70})[\s\S]{0,100}?\bwetter(?:bericht|vorhersage)?\b/iu
  ];

  for (const pattern of patterns) {
    const match = original.match(pattern);
    const place = cleanWeatherPreferencePlace(
      match?.[1]
    );

    if (place) {
      return {
        action: "set",
        place
      };
    }
  }

  return {
    action: "none",
    place: ""
  };
}

async function loadOwnerWeatherDefaultPlace(identity) {
  const result = await db.query(
    `
      SELECT
        content
      FROM sol_fulltime_memory
      WHERE clone_id = $1
        AND role = 'user'
        AND content ILIKE '%wetter%'
      ORDER BY id DESC
      LIMIT 80
    `,
    [
      cloneIdForOwner(
        identity.ownerId
      )
    ]
  );

  for (const row of result.rows) {
    const preference =
      weatherDefaultPlacePreference(
        row.content
      );

    if (preference.action === "clear") {
      return "";
    }

    if (
      preference.action === "set" &&
      preference.place
    ) {
      return preference.place;
    }
  }

  return "";
}
'''
    server = server.replace(helper_marker, helpers + helper_marker, 1)

old_effective = '''  const effectiveMessage =
    explicitWeatherRequest
      ? cleanMessage
      : `${pending.message} in ${cleanMessage}`;

  if (!weatherRequestHasPlace(effectiveMessage)) {
'''
new_effective = '''  let effectiveMessage =
    explicitWeatherRequest
      ? cleanMessage
      : `${pending.message} in ${cleanMessage}`;

  if (
    explicitWeatherRequest &&
    !weatherRequestHasPlace(
      effectiveMessage
    )
  ) {
    try {
      const defaultPlace =
        await loadOwnerWeatherDefaultPlace(
          identity
        );

      if (defaultPlace) {
        effectiveMessage =
          `${effectiveMessage} in ${defaultPlace}`;
      }
    } catch (error) {
      console.error(
        "Wetter-Standardort aus Vollzeitgedächtnis:",
        error?.code ||
        error?.name ||
        "Fehler"
      );
    }
  }

  if (!weatherRequestHasPlace(effectiveMessage)) {
'''

if old_effective in server:
    server = server.replace(old_effective, new_effective, 1)
elif "await loadOwnerWeatherDefaultPlace(" not in server:
    raise SystemExit("Weather handler patch marker not found")

old_instruction = "Bleib kompakt und erfinde keine Messwerte. Gib keine rohen URLs im Antworttext aus."
new_instruction = "Antworte kurz auf Deutsch. Erfinde keine Messwerte. Gib keine Links oder rohen URLs im sichtbaren Antworttext aus und mache keine Werbung."
if old_instruction in server:
    server = server.replace(old_instruction, new_instruction, 1)

server_path.write_text(server, encoding="utf-8")

test_path = Path("tests/weather-default-memory.test.mjs")
test_path.write_text(r'''import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const server = fs.readFileSync(
  new URL("../server.mjs", import.meta.url),
  "utf8"
);

function sourceBetween(startMarker, endMarker) {
  const start = server.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`);
  const end = server.indexOf(endMarker, start);
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);
  return server.slice(start, end);
}

const preferenceSource = sourceBetween(
  "function cleanWeatherPreferencePlace",
  "async function loadOwnerWeatherDefaultPlace"
);
const weatherDefaultPlacePreference = new Function(
  `${preferenceSource}\nreturn weatherDefaultPlacePreference;`
)();

test("weather default place is read from a durable user preference", () => {
  assert.deepEqual(
    weatherDefaultPlacePreference(
      "Dann merk dir jetzt bitte für immer. Wetter nur für München. Ausser ich frage einen anderen Ort."
    ),
    {
      action: "set",
      place: "München"
    }
  );

  assert.deepEqual(
    weatherDefaultPlacePreference(
      "Künftig Wetter immer für Hamburg."
    ),
    {
      action: "set",
      place: "Hamburg"
    }
  );
});

test("ordinary weather questions do not become a stored default", () => {
  assert.deepEqual(
    weatherDefaultPlacePreference(
      "Wie wird das Wetter morgen in Berlin?"
    ),
    {
      action: "none",
      place: ""
    }
  );
});

test("a later reset stops using an older default", () => {
  assert.deepEqual(
    weatherDefaultPlacePreference(
      "Wetter bitte nicht mehr mit einem Standardort verwenden."
    ),
    {
      action: "clear",
      place: ""
    }
  );
});

test("weather handler resolves owner memory before asking for a place", () => {
  const handler = sourceBetween(
    "async function handleLiveWeatherRequest",
    "/*\n  ==========================================================\n  KALENDER-BEFEHL SCHNELL ERKENNEN"
  );

  const memoryLookup = handler.indexOf(
    "await loadOwnerWeatherDefaultPlace"
  );
  const placeQuestion = handler.indexOf(
    "needsPlace: true"
  );

  assert.ok(memoryLookup >= 0);
  assert.ok(placeQuestion >= 0);
  assert.ok(memoryLookup < placeQuestion);
  assert.match(
    handler,
    /`\$\{effectiveMessage\} in \$\{defaultPlace\}`/
  );
});
''', encoding="utf-8")
