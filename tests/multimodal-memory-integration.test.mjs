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

test("Foto und Video bleiben im RAM-Turn und erzeugen keinen neuen Rohverlauf", () => {
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
    /const userMemoryMessage[\s\S]*?originalMessage \|\| message[\s\S]*?mediaMemoryLabel/u
  );
  assert.match(solRoute, /const saveFulltimeAssistant = async \(\) => false/u);
  assert.match(solRoute, /evaluateIdentityMemoryWrite/u);
  assert.match(solRoute, /identityMemoryStore[\s\S]*?\.saveConfirmed/u);
  assert.doesNotMatch(solRoute, /await saveFulltimeMemory\(/u);
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

test("Sprachturns teilen ihre RAM-Turn-ID ohne Live-Bild oder Rohtranskript", () => {
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
  assert.match(liveRoute, /const fulltimeSaved = false/u);
  assert.match(liveRoute, /keinen[\s\S]*?Rohverlauf-Speicher/u);
  assert.match(liveRoute, /evaluateIdentityMemoryWrite/u);
  assert.match(
    html,
    /const cleanSourceModalities =[\s\S]*?"sign_language"[\s\S]*?\.includes\(modality\)/u
  );
  assert.doesNotMatch(html, /"live_image"/u);
  assert.match(
    html,
    /const sourceTurnEventId =[\s\S]*?currentRealtimeMemoryEventId[\s\S]*?sendLiveTranscriptToMemory\([\s\S]*?"assistant",[\s\S]*?sourceTurnEventId/u
  );
});

test("Gedächtnisregel trennt RAM, Altbestand und bestätigte Erinnerungen", () => {
  assert.match(
    server,
    /Du besitzt drei klar getrennte Kontextbereiche/u
  );
  assert.match(server, /Neue Nachrichten, Antworten,[\s\S]*?nicht automatisch als[\s\S]*?wortwörtlicher Dauerverlauf/u);
  assert.match(server, /Dauerhaft sind nur Inhalte,[\s\S]*?ausdrücklich mit[\s\S]*?Speicherbefehl bestätigt/u);
  assert.match(
    server,
    /im Abruf gilt die jüngste\s*\n\s*aktive Fassung/u
  );
  assert.match(
    server,
    /Erfinde keine Erinnerungen/u
  );
});

test("Gebärdensprache ist eine eigene sichere Modalität für Kinder und Erwachsene", () => {
  assert.match(
    server,
    /hasVisualMedia &&[\s\S]*?mentionsSignLanguage\(message\)[\s\S]*?"sign_language"/u
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
    /bei fehlenden Bewegungsphasen, verdeckten Händen oder Unsicherheit nach,[\s\S]*?statt Inhalt zu erfinden/u
  );
  assert.match(
    server,
    /mentionsSignLanguage\(transcript\)[\s\S]*?"sign_language"/u
  );
});
