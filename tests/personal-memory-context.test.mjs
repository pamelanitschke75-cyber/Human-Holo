import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  isAssistantHistoryRecallRequest,
  personalMemoryRelativeDayOffset,
  personalRecallFollowUpKind,
  resolvePersonalRecallContextQuery
} from "../modules/personal-memory-context.mjs";

const ui = fs.readFileSync(
  new URL("../www/sol-holo-ui.js", import.meta.url),
  "utf8"
);

const directQueryFromMessage = value => {
  const text = String(value || "").toLocaleLowerCase("de-DE");
  if (text.includes("sommerfest")) return "wann ist unser sommerfest";
  if (text.includes("hochzeitsfeier")) {
    return "wann ist unsere hochzeitsfeier";
  }
  if (text.includes("saugroboter")) return "saugroboter";
  return "";
};

test("Wann ist unsere Hochzeitsfeier? → Und wo? behält dasselbe Erinnerungsthema", () => {
  const result = resolvePersonalRecallContextQuery({
    message: "Und wo?",
    rows: [
      { role: "user", content: "Wann ist unsere Hochzeitsfeier?" },
      { role: "assistant", content: "Am 18. Juli." }
    ],
    directQueryFromMessage
  });

  assert.deepEqual(result, {
    query: "wann ist unsere hochzeitsfeier",
    contextual: true,
    followUpKind: "place",
    sourceMessage: "Wann ist unsere Hochzeitsfeier?"
  });
});

test("eine neue Nutzerfrage verhindert den Rücksprung zu einem älteren Thema", () => {
  const result = resolvePersonalRecallContextQuery({
    message: "Und wo?",
    rows: [
      { role: "user", content: "Wann ist unser Sommerfest?" },
      { role: "assistant", content: "Am 18. Juli." },
      { role: "user", content: "Wie wird morgen das Wetter?" },
      { role: "assistant", content: "Sonnig." }
    ],
    directQueryFromMessage
  });

  assert.equal(result.query, "");
  assert.equal(result.contextual, false);
  assert.equal(result.followUpKind, "place");
});

test("Assistentenantworten dürfen das persönliche Thema nicht selbst erzeugen", () => {
  const result = resolvePersonalRecallContextQuery({
    message: "Und wann?",
    rows: [
      { role: "assistant", content: "Der Saugroboter kommt am Freitag." }
    ],
    directQueryFromMessage
  });

  assert.equal(result.query, "");
  assert.equal(result.followUpKind, "time");
});

test("substantielle Ortsfragen gelten nicht versehentlich als elliptische Rückfrage", () => {
  assert.equal(personalRecallFollowUpKind("Und wo kann ich Pizza kaufen?"), "");
  assert.equal(personalRecallFollowUpKind("Wo genau?"), "place");
  assert.equal(personalRecallFollowUpKind("Und was noch?"), "detail");
});

test("frühere Essensempfehlungen werden als Holo-Verlauf erkannt", () => {
  assert.equal(
    isAssistantHistoryRecallRequest(
      "Was hast du uns gestern zum Essen empfohlen?"
    ),
    true
  );
  assert.equal(
    isAssistantHistoryRecallRequest(
      "Was habe ich dir gestern über den Saugroboter erzählt?"
    ),
    false
  );
  assert.equal(
    personalMemoryRelativeDayOffset(
      "Was hast du uns gestern zum Essen empfohlen?"
    ),
    -1
  );
  assert.equal(personalMemoryRelativeDayOffset("Und vorgestern?"), -2);
  assert.equal(personalMemoryRelativeDayOffset("Was weißt du noch?"), null);
});

test("die App erkennt Datum-zu-Ort-Folgefragen auch im Sprachweg", () => {
  const start = ui.indexOf("function normalizeNoteSearchText");
  const end = ui.indexOf("function googleMapsDestinationFromMessage", start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);

  const detector = new Function(
    "let personalRecallAnchorQuery = '';\n" +
    "let personalRecallAnchorAt = 0;\n" +
    `${ui.slice(start, end)}\n` +
    "return contextualPersonalRecallQueryFromMessage;"
  )();

  assert.equal(
    detector("Wann ist unser Sommerfest?"),
    "wann ist unser sommerfest"
  );
  assert.equal(
    detector("Und wo?"),
    "wann ist unser sommerfest"
  );
  assert.equal(detector("Wie wird morgen das Wetter?"), "");
  assert.equal(
    detector("Und wo?"),
    "",
    "Ein dazwischenliegendes neues Thema muss den alten Bezug aufheben."
  );
});
