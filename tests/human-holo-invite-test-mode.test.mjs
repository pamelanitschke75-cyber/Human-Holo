import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readText = path =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const html = readText("www/index.html");
const client = readText("www/human-holo-test-access.js");
const server = readText("server.mjs");

test("Human Holo lädt die Einladungstür vor seiner festen Testidentität", () => {
  assert.ok(
    html.indexOf("human-holo-test-access.js?v=1") <
      html.indexOf("const SOL_APP_IDENTITY")
  );
  assert.match(
    html,
    /const SOL_APP_IDENTITY = Object\.freeze\([\s\S]*?HumanHoloTestAccess\?\.identity/u
  );
  const identityBlock = html.match(
    /const SOL_APP_IDENTITY = Object\.freeze\([\s\S]*?\n\);/u
  )?.[0] ?? "";
  assert.doesNotMatch(identityBlock, /pam-sol|Pam’s Holo/u);
});

test("Testsitzung bleibt kurzlebig im Session-Speicher", () => {
  assert.match(client, /sessionStorage\.getItem\(SESSION_KEY\)/u);
  assert.match(client, /sessionStorage\.setItem/u);
  assert.doesNotMatch(client, /localStorage/u);
  assert.match(client, /expiresAtMillis <= Date\.now\(\)/u);
  assert.match(client, /startsWith\("human-test-"\)/u);
  assert.match(client, /startsWith\("tester-"\)/u);
  assert.match(client, /Test beenden/u);
});

test("Bearer-Sitzung wird nur an den getrennten Human-Server angefügt", () => {
  assert.match(client, /isHumanHoloBackendRequest/u);
  assert.match(client, /candidate\.origin === base\.origin/u);
  assert.match(client, /if \(!headers\.has\("Authorization"\)\)/u);
  assert.match(client, /Bearer \$\{activeSession\.token\}/u);
  assert.doesNotMatch(client, /sol-holo\.onrender\.com/u);
});

test("Server bindet jeden API-Aufruf an die signierte Testeridentität", () => {
  const accessMiddleware = server.indexOf(
    "humanHoloTestAccess.authenticate("
  );
  const chatRoute = server.indexOf('app.post("/sol"');
  assert.ok(accessMiddleware >= 0);
  assert.ok(chatRoute > accessMiddleware);
  assert.match(server, /TEST_SESSION_SCOPE_MISMATCH/u);
  assert.match(server, /req\.body\.ownerId = identity\.ownerId/u);
  assert.match(server, /req\.body\.selectedSpeakerId = identity\.speakerId/u);
  assert.match(
    server,
    /if \(req\.humanHoloTester\) \{[\s\S]*?return resolveRequestIdentity\(req, res\)/u
  );
  assert.ok(
    server.indexOf("humanHoloTestAccess.authenticate(") <
      server.indexOf('express.json({ limit: "32mb" })')
  );
  assert.match(
    server,
    /"\/test-access\/session",\s*express\.json\(\{ limit: "16kb" \}\)/u
  );
  assert.match(
    server,
    /const HUMAN_HOLO_REALTIME_TOKEN_PATHS[\s\S]*?"\/memory\/search"[\s\S]*?"\/realtime\/web-search"/u
  );
});

test("Backend liefert ausschließlich den Webordner und keinen Serverquelltext aus", () => {
  assert.match(server, /const humanHoloWebRoot =[\s\S]*?path\.join\(__dirname, "www"\)/u);
  assert.match(server, /express\.static\([\s\S]*?humanHoloWebRoot/u);
  assert.doesNotMatch(server, /express\.static\(__dirname\)/u);
  assert.match(server, /path\.join\(humanHoloWebRoot, "index\.html"\)/u);
});

test("Pam-Holo-Module sind auch bei direktem URL-Aufruf im Human-Test gesperrt", () => {
  assert.match(server, /const parkedPamHoloWebAssets = new Set/u);
  for (const asset of [
    "app-lock-bootstrap.mjs",
    "consent-ui-bootstrap.mjs",
    "file_000000009bf88246b8f682a46e1a429d.png",
    "human-holo-chatgpt-memory-bridge.mjs",
    "human-holo-animal-core.mjs",
    "human-holo-animal-holos.mjs",
    "original-full-sync.js",
    "sol-holo-backup-core.mjs",
    "sol-holo-backup.mjs",
    "sol-motion-profile.js"
  ]) {
    assert.match(
      server,
      new RegExp('"/' + asset.replaceAll(".", "\\.") + '"', "u")
    );
  }
  assert.match(
    server,
    /parkedPamHoloWebAssets\.has\(req\.path\)[\s\S]*?parkedPamHoloWebAssetPrefixes[\s\S]*?status\(404\)/u
  );
  assert.match(server, /"\/assets\/animals\/"/u);
  assert.doesNotMatch(html, /human-holo-animal-holos\.mjs/u);
  assert.doesNotMatch(html, /file_000000009bf88246b8f682a46e1a429d\.png/u);
  assert.match(html, /src="\.\/human-holo-logo\.png"/u);
});
