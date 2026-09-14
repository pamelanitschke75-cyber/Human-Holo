import assert from "node:assert/strict";
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
