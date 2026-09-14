import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const server = await readFile(
  new URL("../server.mjs", import.meta.url),
  "utf8"
);
const html = await readFile(
  new URL("../www/index.html", import.meta.url),
  "utf8"
);

function between(startMarker, endMarker) {
  const start = server.indexOf(startMarker);
  assert.notEqual(start, -1, `missing ${startMarker}`);
  const end = server.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing ${endMarker}`);
  return server.slice(start, end);
}

test("ein gemeinsames Memory-Budget gilt für Text Sprache und Gebärde", () => {
  assert.match(server, /const PERSONAL_MEMORY_MODALITY_PARITY_LIMITS = Object\.freeze/u);
  assert.match(server, /confirmed: 36/u);
  assert.match(server, /fulltime: 60/u);
  assert.match(server, /legacy: 40/u);
  assert.match(server, /legacyLongTerm: 30/u);

  const recall = between(
    "async function buildPersonalRecallResult(",
    "PRIVATES VOLLZEITGEDÄCHTNIS"
  );
  const tool = between(
    'app.post(\n  "/memory/search",',
    'app.post(\n  "/realtime/web-search",'
  );
  const textRoute = between(
    'app.post("/sol", async (req, res) => {',
    "app.use(\n  (\n    error,"
  );

  for (const block of [recall, tool, textRoute]) {
    assert.match(block, /PERSONAL_MEMORY_MODALITY_PARITY_LIMITS/u);
  }
});

test("Realtime wartet auf serverseitigen Kontext bevor die Antwort erzeugt wird", () => {
  assert.match(html, /manualResponseRouting:\s*\n\s*true/u);
  assert.match(html, /await sendLiveTranscriptToMemory/u);
  assert.match(html, /LOKALES_ERINNERUNGSERGEBNIS/u);
  assert.match(html, /LOKALER_DAUERKONTEXT/u);
});

test("bewusst ausgewähltes Gebärdensprachvideo nutzt denselben Memory-Kern", () => {
  assert.match(server, /sign_language/u);
  assert.match(server, /gesprochene, geschriebene und bewusst gesendete gebärdensprachliche persönliche Fragen/u);
  assert.match(html, /accept="image\/\*,video\/\*"/u);
  assert.match(
    html,
    /fortlaufende Kamera- und Gebärdensprachmodus ist im Legal-Review-Build deaktiviert/u
  );
  assert.doesNotMatch(html, /GEBAERDENSPRACHE_(?:FRAME|SEQUENZ_START)/u);
  assert.match(server, /name:\s*\n\s*"search_personal_memory"/u);
  assert.match(server, /Neue Sprachtranskripte, Texte,[\s\S]*nicht automatisch wortwörtlich/u);
});
