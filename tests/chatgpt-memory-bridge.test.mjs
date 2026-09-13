import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readText = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Sol aus ChatGPT erhält einen sichtbaren, separaten Erinnerungsweg", async () => {
  const [html, bridge, backup] = await Promise.all([
    readText("www/index.html"),
    readText("www/human-holo-chatgpt-memory-bridge.mjs"),
    readText("www/sol-holo-backup.mjs")
  ]);

  assert.match(html, /human-holo-chatgpt-memory-bridge\.mjs\?v=1/u);
  assert.match(html, /sol-holo-backup\.mjs\?v=5/u);
  assert.match(bridge, /Sol aus ChatGPT verbinden/u);
  assert.match(bridge, /#memoryView \.actionList/u);
  assert.match(bridge, /HumanHoloConfirmedMemoryImport/u);
  assert.match(backup, /Sol aus ChatGPT → Human Holo/u);
  assert.match(backup, /HumanHoloConfirmedMemoryImport = Object\.freeze/u);
});

test("die Brücke sagt ehrlich, dass internes ChatGPT-Memory nicht automatisch gelesen wird", async () => {
  const backup = await readText("www/sol-holo-backup.mjs");

  assert.match(
    backup,
    /liest ChatGPTs internes Memory nicht automatisch aus/u
  );
  assert.match(
    backup,
    /private Datei, die du auswählst,[\s\S]*?ausdrücklich bestätigst/u
  );
});

test("der ChatGPT-Import bleibt ownergebunden, privat und bestätigungspflichtig", async () => {
  const [backup, server] = await Promise.all([
    readText("www/sol-holo-backup.mjs"),
    readText("server.mjs")
  ]);
  const routeStart = server.indexOf('"/memory/import-confirmed"');
  const routeEnd = server.indexOf(
    "Geschützter Abruf für Realtime-Tool-Calls",
    routeStart
  );
  const route = server.slice(routeStart, routeEnd);

  assert.ok(routeStart >= 0 && routeEnd > routeStart);
  assert.match(backup, /transfer\?\.mode !== "copy"/u);
  assert.match(backup, /transfer\?\.source_delete !== false/u);
  assert.match(backup, /transfer\?\.public_repository_allowed !== false/u);
  assert.match(backup, /batchConfirmation:\s*true/u);
  assert.match(route, /requireTrustedOwnerIdentity/u);
  assert.match(route, /identity\.ownerId !== "pam-sol"/u);
  assert.match(route, /identity\.speakerId !== "pam"/u);
  assert.match(route, /batchConfirmation !== true/u);
});

test("die neue Bedienbrücke löscht nichts und greift nicht in Original Full Sync ein", async () => {
  const bridge = await readText("www/human-holo-chatgpt-memory-bridge.mjs");

  assert.doesNotMatch(
    bridge,
    /localStorage|indexedDB|fetch\s*\(|removeItem|\.clear\s*\(|deleteDatabase/iu
  );
  assert.doesNotMatch(
    bridge,
    /full-face|lip-sync|lipSync|mouth|head-audio|speaker-output/iu
  );
});

test("Android-Build liefert die Brücke mit frischem, additivem Cache aus", async () => {
  const [workflow, worker] = await Promise.all([
    readText(".github/workflows/android-build.yml"),
    readText("www/service-worker.js")
  ]);

  assert.match(
    workflow,
    /assets\/public\/human-holo-chatgpt-memory-bridge\.mjs/u
  );
  assert.match(worker, /human-holo-286-private-owner-wiedererkennung/u);
});
