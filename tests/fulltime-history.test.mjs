import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(
  new URL("../server.mjs", import.meta.url),
  "utf8"
);

const html = fs.readFileSync(
  new URL("../www/index.html", import.meta.url),
  "utf8"
);
const ui = fs.readFileSync(
  new URL("../www/sol-holo-ui.js", import.meta.url),
  "utf8"
);
const backup = fs.readFileSync(
  new URL("../www/sol-holo-backup.mjs", import.meta.url),
  "utf8"
);
const identityStore = fs.readFileSync(
  new URL("../modules/identity-memory-store.mjs", import.meta.url),
  "utf8"
);

function routeBlock(path, nextPath) {
  const start = server.indexOf(path);
  const end = nextPath
    ? server.indexOf(nextPath, start + path.length)
    : server.length;

  assert.ok(start >= 0, `${path} route missing`);
  assert.ok(end > start, `${path} route boundary missing`);
  return server.slice(start, end);
}

test("Vollzeitgedächtnis bleibt additiv und idempotent", () => {
  assert.match(
    server,
    /ALTER TABLE sol_fulltime_memory[\s\S]*?ADD COLUMN IF NOT EXISTS source_event_id TEXT/u
  );
  assert.match(
    server,
    /CREATE UNIQUE INDEX IF NOT EXISTS sol_fulltime_memory_event_uidx[\s\S]*?WHERE source_event_id IS NOT NULL/u
  );
  assert.match(
    server,
    /INSERT INTO sol_fulltime_memory[\s\S]*?ON CONFLICT DO NOTHING[\s\S]*?RETURNING id/u
  );
  assert.doesNotMatch(
    server,
    /DROP TABLE\s+sol_fulltime_memory|TRUNCATE\s+sol_fulltime_memory/u
  );
});

test("geschützte Erinnerungen werden durch Updates niemals destruktiv migriert", () => {
  const protectedMemorySources = `${server}\n${identityStore}`;

  assert.doesNotMatch(
    protectedMemorySources,
    /(?:DROP\s+TABLE(?:\s+IF\s+EXISTS)?|TRUNCATE(?:\s+TABLE)?|DELETE\s+FROM)\s+(?:sol_fulltime_memory|sol_identity_memory|sol_identity_memory_supersession)\b/iu
  );
  assert.match(identityStore, /SET recall_status = 'blocked'/u);
  assert.match(identityStore, /sol_identity_memory_supersession/u);
});

test("Text und Sol-Antwort werden Wort für Wort ownergebunden gespeichert", () => {
  const solRoute = routeBlock(
    'app.post("/sol"',
    "const PORT ="
  );

  assert.match(solRoute, /resolveRequestIdentity\(/u);
  assert.match(
    solRoute,
    /saveFulltimeMemory\(\s*"user",\s*userMemoryMessage/u
  );
  assert.match(
    solRoute,
    /const saveFulltimeAssistant\s*=[\s\S]*?saveFulltimeMemory\(\s*"assistant"/u
  );
  assert.match(solRoute, /await saveFulltimeAssistant\(\s*answer/u);
  assert.match(
    solRoute,
    /Der vollständige Dialog[\s\S]*?Wort für Wort ownergebunden gespeichert/u
  );
});

test("Sprachtranskripte beider Rollen landen im Vollzeitgedächtnis", () => {
  const liveRoute = routeBlock(
    '"/live/memory"',
    "LANGZEITGEDÄCHTNIS"
  );

  assert.match(liveRoute, /resolveRequestIdentity\(/u);
  assert.match(
    liveRoute,
    /saveFulltimeMemory\(\s*role,\s*transcript/u
  );
  assert.match(liveRoute, /fulltimeSaved/u);
  assert.match(
    liveRoute,
    /fulltimeStoredRoles:\s*\[\s*"user",\s*"assistant"\s*\]/u
  );
  assert.match(liveRoute, /alwaysOn:\s*\n\s*true/u);
});

test("privater Verlauf wird nur der signierten App-Sitzung paginiert geliefert", () => {
  const historyRoute = routeBlock(
    '"/fulltime/history"',
    '"/fulltime/history/append"'
  );

  assert.match(historyRoute, /requireTrustedOwnerIdentity\(/u);
  assert.match(historyRoute, /loadOwnerFulltimeHistoryPage\(/u);
  assert.match(historyRoute, /Cache-Control/u);
  assert.match(
    server,
    /WHERE clone_id = \$1[\s\S]*?id < \$2::bigint[\s\S]*?ORDER BY id DESC/u
  );
});

test("App lädt sämtliche Seiten chronologisch zurück in den sichtbaren Chat", () => {
  assert.match(html, /async function loadFulltimeHistory\(\)/u);
  assert.match(
    html,
    /while\(true\)[\s\S]*?\/fulltime\/history[\s\S]*?beforeId[\s\S]*?limit:500/u
  );
  assert.match(html, /messages\.sort\(/u);
  assert.match(html, /chat\.replaceChildren\(\)/u);
  assert.match(html, /entry\?\.role ===[\s\S]*?"assistant"/u);
  assert.match(html, /solholo:trusted-session/u);
});

test("lokale App-Antworten warten verlustfrei auf die sichere Synchronisierung", () => {
  assert.match(html, /SOL_FULLTIME_PENDING_KEY/u);
  assert.match(html, /queueFulltimeDialog\(/u);
  assert.match(html, /flushPendingFulltimeDialogs\(/u);
  assert.match(html, /\/fulltime\/history\/append/u);
  assert.doesNotMatch(html, /localStorage\.clear\s*\(/u);
  assert.doesNotMatch(html, /indexedDB\.deleteDatabase\s*\(/u);
});

test("persönliche Rückfragen durchsuchen bestätigte und vollständige Historie", () => {
  const searchRoute = routeBlock(
    '"/memory/search"',
    "REALTIME →"
  );

  assert.match(searchRoute, /identityMemoryStore\.searchConfirmed/u);
  assert.match(searchRoute, /loadRelevantOwnerRecallHistory/u);
  assert.match(searchRoute, /assistantHistory/u);
  assert.match(searchRoute, /contextualPersonalRecallSearch/u);
  assert.match(server, /loadOwnerRelativeDayFulltimeRows/u);
  assert.match(server, /AT TIME ZONE 'Europe\/Berlin'/u);
  assert.match(server, /matching_term_count DESC/u);
  assert.match(server, /latest_current_row/u);
  assert.match(
    server,
    /PASSENDE EINTRÄGE AUS BESTÄTIGTEN ERINNERUNGEN UND VOLLZEITGEDÄCHTNIS/u
  );
});

test("Holo-Antworten bleiben abrufbar, gelten aber niemals als persönliche Fakten", () => {
  assert.match(
    server,
    /function ownerGroundedPersonalMemoryRows[\s\S]*?row\?\.role === "user" \|\| row\?\.role === "memory"/u
  );
  assert.match(
    server,
    /return ownerGroundedPersonalMemoryRows\([\s\S]*?rows[\s\S]*?\)\.slice/u
  );
  assert.match(
    server,
    /Frühere Antworten der Assistenz sind niemals\nBelege/u
  );
  assert.match(
    server,
    /Frühere Holo-Antworten \(nur als Gesprächsverlauf, nicht als bestätigte persönliche Fakten\)/u
  );
  assert.match(server, /row\?\.role ===\s*\n\s*"assistant"/u);
  assert.match(server, /jüngste Korrektur/u);
  assert.match(server, /standesamtliche Trauung von einer späteren Hochzeitsfeier/u);
});

test("alter ungebundener Bestand wird ausschließlich Pam lesend wieder angebunden", () => {
  assert.match(
    server,
    /async function loadLegacyPamMemoryEvidence[\s\S]*?identity\?\.ownerId !== "pam-sol"[\s\S]*?identity\?\.speakerId !== "pam"[\s\S]*?return \[\]/u
  );
  assert.match(
    server,
    /loadLegacyPamMemoryEvidence\(\s*tokenIdentity/u
  );
  assert.match(
    server,
    /loadLegacyPamMemoryEvidence\(\s*identity/u
  );
  assert.match(
    server,
    /async function loadLegacyPamLongTermMemoryEvidence[\s\S]*?identity\?\.ownerId !== "pam-sol"[\s\S]*?identity\?\.speakerId !== "pam"[\s\S]*?return \[\]/u
  );
  assert.match(
    server,
    /loadLegacyPamLongTermMemoryEvidence\(\s*tokenIdentity/u
  );
  assert.match(
    server,
    /loadLegacyPamLongTermMemoryEvidence\(\s*identity/u
  );
});

test("vollständiger privater Erinnerungsimport ist ownergebunden und updatefest", () => {
  const importRoute = routeBlock(
    '"/memory/import-confirmed"',
    "Geschützter Abruf für Realtime-Tool-Calls"
  );

  assert.match(importRoute, /requireTrustedOwnerIdentity/u);
  assert.match(importRoute, /identity\.ownerId !== "pam-sol"/u);
  assert.match(importRoute, /identity\.speakerId !== "pam"/u);
  assert.match(importRoute, /batchConfirmation !== true/u);
  assert.match(importRoute, /identityMemoryStore\.importConfirmedBatch/u);
  assert.match(importRoute, /alwaysOn:\s*true/u);
  assert.match(importRoute, /updateSafe:\s*true/u);
  assert.match(backup, /Alle Erinnerungen übernehmen/u);
  assert.match(backup, /humanHoloMemoryImportList/u);
  assert.match(backup, /SolHoloTrustedSession\?\.ensure/u);
  assert.match(backup, /\/memory\/import-confirmed/u);
  assert.match(
    backup,
    /batchConfirmation:\s*true[\s\S]*?selectedSpeakerId:\s*identity\.speakerId[\s\S]*?ownerId:\s*identity\.ownerId/u
  );
  assert.match(ui, /Immer aktiv · updatefest/u);
  assert.match(ui, /Vollzeitgedächtnis ist immer aktiv/u);
  assert.match(
    ui,
    /bei allen künftigen App-, Design-, Namens-, Funktions- und Datenbankänderungen erhalten/u
  );
});

test("signierte Bestands-App darf ihre Identität sicher aus der Sitzung ableiten", () => {
  const trustedIdentityGate = server.slice(
    server.indexOf("function requireTrustedOwnerIdentity"),
    server.indexOf("OPENCLAW –", server.indexOf("function requireTrustedOwnerIdentity"))
  );

  assert.match(trustedIdentityGate, /trustedAppSessions[\s\S]*?validateRequest/u);
  assert.match(trustedIdentityGate, /personalHoloProfile\([\s\S]*?trustedSession\.ownerId/u);
  assert.match(
    trustedIdentityGate,
    /resolveMemoryIdentity\(\{[\s\S]*?selectedSpeakerId:[\s\S]*?trustedProfile\.speakerId[\s\S]*?ownerId:[\s\S]*?trustedSession\.ownerId/u
  );
  assert.match(trustedIdentityGate, /TRUSTED_SESSION_OWNER_UNKNOWN/u);
  assert.match(
    trustedIdentityGate,
    /trustedSession\.ownerId\s*!==[\s\S]*?identity\.ownerId/u
  );
});
