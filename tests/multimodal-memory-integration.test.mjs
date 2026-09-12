import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readText = path =>
  readFileSync(
    new URL(`../${path}`, import.meta.url),
    "utf8"
  );

const server = readText("server.mjs");
const html = readText("www/index.html");

function routeBlock(path, nextPath) {
  const start = server.indexOf(path);
  const end = nextPath
    ? server.indexOf(nextPath, start + path.length)
    : server.length;

  assert.ok(start >= 0, `${path} route missing`);
  assert.ok(end > start, `${path} route boundary missing`);
  return server.slice(start, end);
}

test("die Migration ergänzt nur Ereignis-ID und Modalitäten", () => {
  assert.match(
    server,
    /ADD COLUMN IF NOT EXISTS memory_event_id TEXT/u
  );
  assert.match(
    server,
    /ADD COLUMN IF NOT EXISTS source_modalities TEXT\[\]/u
  );
  assert.match(
    server,
    /sol_fulltime_memory_multimodal_event_idx/u
  );
  assert.doesNotMatch(
    server,
    /(?:DROP\s+TABLE|TRUNCATE(?:\s+TABLE)?|DELETE\s+FROM)\s+sol_fulltime_memory\b/iu
  );
});

test("Foto und Video verbinden Nutzerbeitrag und semantische Holo-Antwort", () => {
  const solRoute = routeBlock(
    'app.post("/sol"',
    "const PORT ="
  );

  assert.match(
    solRoute,
    /turnSourceModalities[\s\S]*?"text"[\s\S]*?"image"[\s\S]*?"video"[\s\S]*?"voice"/u
  );
  assert.match(
    solRoute,
    /saveFulltimeMemory\([\s\S]*?"user"[\s\S]*?memoryEventId:[\s\S]*?memoryEventId/u
  );
  assert.match(
    solRoute,
    /saveFulltimeMemory\([\s\S]*?"assistant"[\s\S]*?memoryEventId:[\s\S]*?memoryEventId/u
  );
  assert.match(
    solRoute,
    /const userMemoryMessage[\s\S]*?originalMessage \|\| message[\s\S]*?mediaMemoryLabel/u
  );
  assert.doesNotMatch(
    server,
    /(?:BYTEA|data:image[^\n]*INSERT INTO sol_fulltime_memory)/iu
  );
});

test("spätere Ergänzungen bleiben auch nach vielen Nachrichten am Ereignis", () => {
  assert.match(
    server,
    /matching\.event_key IS NOT NULL[\s\S]*?history\.memory_event_id[\s\S]*?= matching\.event_key/u
  );
  assert.match(
    server,
    /loadMultimodalReferenceContext\([\s\S]*?selectReferencedMultimodalEventId/u
  );
  assert.match(
    server,
    /const memoryEventId =[\s\S]*?multimodalReference\.eventId \|\|[\s\S]*?fulltimeEventId/u
  );
});

test("Live-Bild, Sprache und Holos Antwort teilen dieselbe Turn-ID", () => {
  const liveRoute = routeBlock(
    '"/live/memory"',
    "LANGZEITGEDÄCHTNIS"
  );

  assert.match(
    liveRoute,
    /sourceModalities[\s\S]*?loadExistingTurnMemoryAssociation/u
  );
  assert.match(
    liveRoute,
    /existingAssociation[\s\S]*?memory_event_id/u
  );
  assert.match(
    html,
    /const transcriptModalities =[\s\S]*?liveCameraIsActive\(\)[\s\S]*?"live_image"/u
  );
  assert.match(
    html,
    /const sourceTurnEventId =[\s\S]*?currentRealtimeMemoryEventId[\s\S]*?sendLiveTranscriptToMemory\([\s\S]*?"assistant",[\s\S]*?sourceTurnEventId/u
  );
});

test("Gedächtnisregel gilt ausdrücklich ohne Themenbegrenzung", () => {
  assert.match(
    server,
    /Das gilt ohne\s+Themenbegrenzung für Essen,[\s\S]*?Tiere, Menschen, Haushalt, Reisen, Dokumente und\s+jedes andere Thema/u
  );
  assert.match(
    server,
    /jüngste Aussage Vorrang/u
  );
  assert.match(
    server,
    /Wenn der Bezug[\s\S]*?nicht\s+eindeutig ist, frage kurz nach/u
  );
});

test("Gebärdensprache ist eine eigene sichere Modalität für Kinder und Erwachsene", () => {
  assert.match(
    server,
    /ARRAY\['image', 'video', 'live_image', 'sign_language'\]::TEXT\[\]/u
  );
  assert.match(
    server,
    /Gebärdensprache ist eine visuelle Sprache und kann bei Kindern wie Erwachsenen/u
  );
  assert.match(
    server,
    /Verwechsle sie nicht mit alltäglicher Gestik/u
  );
  assert.match(
    server,
    /frage bei fehlender Bewegung, verdeckten Händen oder anderer Unsicherheit[\s\S]*?statt eine Übersetzung zu erfinden/u
  );
  assert.match(
    server,
    /mentionsSignLanguage\(answer\)[\s\S]*?"sign_language"/u
  );
});
