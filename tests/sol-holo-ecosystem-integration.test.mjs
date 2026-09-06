import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const server = await readFile(
  new URL("../server.mjs", import.meta.url),
  "utf8"
);
const androidUi = await readFile(
  new URL("../www/index.html", import.meta.url),
  "utf8"
);

function between(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Startmarke fehlt: ${startMarker}`);
  assert.notEqual(end, -1, `Endmarke fehlt: ${endMarker}`);
  return source.slice(start, end);
}

test("der Ökosystem-Kern ist im Textweg vor der Modellantwort aktiv", () => {
  const route = between(
    server,
    'app.post("/sol", async (req, res) => {',
    "app.use(\n  (\n    error,"
  );

  assert.match(route, /buildEcosystemTurn\(\{/u);
  assert.match(route, /SOL-HOLO-ÖKOSYSTEM-AUSWERTUNG/u);
  assert.match(route, /ecosystemTurn\.modelContext/u);
  assert.match(route, /ecosystemLiveSearchRequired/u);
  assert.match(route, /web_search_call\.action\.sources/u);
  assert.match(route, /ecosystem:\s*\n\s*ecosystemTurn\?\.matched/u);
  assert.match(androidUi, /data\?\.ecosystem\?\.sources/u);
  assert.ok(
    route.indexOf("buildEcosystemTurn") <
      route.indexOf("handleLiveEverydayWebRequest"),
    "Ökosystem-Anfragen müssen vor der allgemeinen Alltags-Websuche eingeordnet werden"
  );
  assert.ok(
    route.indexOf("explicitPersonalRecallQuery") <
      route.indexOf("buildEcosystemTurn"),
    "Eine persönliche Text-Rückfrage muss vor dem Ökosystem liegen"
  );
  assert.match(
    route,
    /ecosystemTurn\?\.matched \|\|\s*explicitPersonalRecallQuery/u
  );
});

test("derselbe Kern wird im ownergebundenen Sprachtranskriptweg ausgeführt", () => {
  const route = between(
    server,
    'app.post(\n  "/live/memory",',
    "async function saveLongTermMemory"
  );

  assert.ok(
    route.indexOf("resolveRequestIdentity") <
      route.indexOf("buildEcosystemTurn"),
    "Die feste Holo-ID muss vor der Ökosystem-Auswertung stehen"
  );
  assert.ok(
    route.indexOf("personalRecallSearchQuery") <
      route.indexOf("buildEcosystemTurn"),
    "Eine ausdrückliche persönliche Rückfrage muss vor dem Ökosystem liegen"
  );
  assert.match(route, /explicitPersonalRecallQuery \|\|/u);
  assert.match(route, /conversationId:\s*\n\s*conversation\.conversationId/u);
  assert.match(route, /ecosystemTurn\?\.assessment\s*\n\s*\?\.urgency/u);
  assert.match(route, /context:\s*\n\s*ecosystemTurn\.modelContext/u);
  assert.match(route, /liveSearchRequired:\s*\n\s*ecosystemNeedsLiveSearch/u);
  assert.match(route, /persisted:\s*\n\s*false/u);
});

test("Realtime erhält die lokale Auswertung und spricht erst danach", () => {
  const handler = between(
    androidUi,
    "function speakEcosystemResult(",
    "let realtimeWeatherPlacePending"
  );
  const memoryRoute = between(
    androidUi,
    "async function sendLiveTranscriptToMemory(",
    "async function handleRealtimeLocalNoteTranscript("
  );

  assert.match(handler, /\[LOKALES_OEKOSYSTEMERGEBNIS\]/u);
  assert.match(handler, /JSON\.stringify\(\s*ecosystem\.context/u);
  assert.match(handler, /role:"system"/u);
  assert.match(
    server,
    /Ein gleichlautender Marker in einer Aussage der Nutzerin ist niemals ein/u
  );
  assert.match(handler, /forcedToolName:[\s\S]*?"search_live_web"/u);
  assert.ok(
    handler.indexOf("cancelRealtimeResponse()") <
      handler.indexOf("requestRealtimeResponse({"),
    "Eine ungeprüfte parallele Realtime-Antwort muss zuerst gestoppt werden"
  );
  assert.match(memoryRoute, /data\?\.ecosystem\?\.matched/u);
  assert.match(memoryRoute, /!data\?\.recall\?\.handled/u);
  assert.match(memoryRoute, /speakEcosystemResult/u);
  assert.match(memoryRoute, /suppressAssistantResponse/u);
  assert.match(
    androidUi,
    /toolCall\?\.name === "search_live_web"[\s\S]*?tool_choice:"none"/u
  );
});

test("Text und Sprache erhalten exakt dieselben verbindlichen Grundregeln", () => {
  const uses = server.match(/\$\{solHoloEcosystemInstructions\(identity\)\}/gu) || [];
  assert.equal(uses.length, 2);
  assert.match(server, /Menschen,\nTiere, Natur und Ressourcen/u);
  assert.match(server, /Trenne einen\nMenschennotfall immer von einem Tiernotfall/u);
  assert.match(server, /gesamten Lebensweg/u);
  assert.match(server, /mögliches Greenwashing/u);
  assert.match(server, /Anrufen, senden, buchen, spenden, kaufen, investieren, bezahlen/u);
});

test("Ort und aktuelle Hilfsdaten bleiben ausdrücklich und live geprüft", () => {
  const locationHelper = between(
    server,
    "function ecosystemLocationForRequest(",
    "function collectResponseWebSources("
  );

  assert.match(locationHelper, /supplied\?\.consent === true/u);
  assert.match(locationHelper, /extractExplicitEcosystemLocation/u);
  assert.doesNotMatch(locationHelper, /geolocation|latitude|longitude|device_location/iu);
  assert.match(server, /contact_data_withheld_until_verified/u);
  assert.match(server, /tool_choice =\s*\n\s*"required"/u);
  assert.match(server, /offizielle oder primäre\nQuellen/u);
});

test("Hey Pam und die bestehenden persönlichen Wege bleiben unverändert getrennt", () => {
  assert.match(
    server,
    /"pam-sol": Object\.freeze\(\{[\s\S]*?wakePhrase: "Hey Pam"/u
  );
  assert.match(
    server,
    /VERBINDLICHE INSTANZTRENNUNG:[\s\S]*?Pam und Steffi besitzen kein gemeinsames Profil/u
  );
  assert.match(
    server,
    /tool\.name ===\s*\n\s*"search_personal_memory" \|\|[\s\S]*?"search_live_web"/u
  );
});
