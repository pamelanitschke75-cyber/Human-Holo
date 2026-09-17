import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const readText = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const html = readText("www/index.html");
const webHtml = readText("index.html");
const network = readText("www/pam-holo-network-resilience.js");
const serviceWorker = readText("www/service-worker.js");
const ui = readText("www/sol-holo-ui.js");
const webUi = readText("sol-holo-ui.js");
const trustedSession = readText("www/trusted-app-session.mjs");
const animalHolos = readText("www/human-holo-animal-holos.mjs");
const backup = readText("www/sol-holo-backup.mjs");
const server = readText("server.mjs");
const documentation = readText(
  "PAM-HOLO-NETZWERK-RENDER-OPENAI-ABSICHERUNG-17-09-2026.md"
);

function installNetworkHelper(
  fetchImplementation,
  online = true,
  location = {
    hostname: "localhost",
    origin: "capacitor://localhost",
    protocol: "capacitor:"
  },
  capacitor = undefined
) {
  const window = {
    AbortController,
    Capacitor: capacitor,
    document: {
      getElementById: () => null,
      querySelectorAll: () => []
    },
    fetch: fetchImplementation,
    location,
    navigator: { onLine: online },
    addEventListener: () => {},
    clearTimeout,
    setTimeout
  };
  vm.runInNewContext(network, { AbortController, Error, Promise, URL, window });
  return window.PamHoloNetwork;
}

test("Capacitors Android-Ursprung https://localhost geht zwingend zum Cloudflare-Türsteher", () => {
  const helper = installNetworkHelper(
    async () => new Response("{}", { status: 200 }),
    true,
    {
      hostname: "localhost",
      origin: "https://localhost",
      protocol: "https:"
    },
    {
      isNativePlatform: () => true,
      getPlatform: () => "android"
    }
  );

  assert.equal(
    helper.backendUrl,
    "https://pam-holo-edge-guard.pamela-nitschke75.workers.dev"
  );
  assert.equal(
    helper.apiEndpoint("/app-session/challenge"),
    "https://pam-holo-edge-guard.pamela-nitschke75.workers.dev/app-session/challenge"
  );
});

test("eine veröffentlichte HTTPS-Weboberfläche darf ihren eigenen Ursprung verwenden", () => {
  const helper = installNetworkHelper(
    async () => new Response("{}", { status: 200 }),
    true,
    {
      hostname: "pam-holo.example",
      origin: "https://pam-holo.example",
      protocol: "https:"
    }
  );

  assert.equal(helper.backendUrl, "https://pam-holo.example");
});

test("die echte Pam-Holo-App nutzt Cloudflare statt eines direkten Render-Ursprungs", () => {
  const helperScriptIndex = html.indexOf(
    '<script src="./pam-holo-network-resilience.js?v=3"></script>'
  );
  const backendSelectionIndex = html.indexOf("const BACKEND_URL =");

  assert.ok(helperScriptIndex >= 0);
  assert.ok(backendSelectionIndex > helperScriptIndex);
  assert.match(
    html.slice(backendSelectionIndex, backendSelectionIndex + 120),
    /window\.PamHoloNetwork\s*\n\s*\.backendUrl/u
  );
  assert.match(network, /pam-holo-edge-guard\.pamela-nitschke75\.workers\.dev/u);
  assert.doesNotMatch(html, /https:\/\/sol-holo\.onrender\.com/u);
  assert.doesNotMatch(ui, /https:\/\/sol-holo\.onrender\.com/u);
  assert.doesNotMatch(webUi, /https:\/\/sol-holo\.onrender\.com/u);
  assert.doesNotMatch(trustedSession, /https:\/\/sol-holo\.onrender\.com/u);
  assert.doesNotMatch(animalHolos, /https:\/\/sol-holo\.onrender\.com/u);
  assert.doesNotMatch(backup, /https:\/\/sol-holo\.onrender\.com/u);
  assert.match(html, /pamHoloFetch\(\s*`\$\{BACKEND_URL\}\/sol`/u);
  assert.match(trustedSession, /PamHoloNetwork\?\.apiRequest/u);
  assert.match(animalHolos, /PamHoloNetwork\?\.apiRequest/u);
  assert.match(backup, /PamHoloNetwork\?\.apiRequest/u);
  assert.match(webHtml, /pam-holo-edge-guard\.pamela-nitschke75\.workers\.dev/u);
  assert.match(webHtml, /data\?\.message \|\|\s*\n\s*data\?\.error/u);
});

test("schreibende Anfragen werden bei Verbindungsfehlern niemals automatisch wiederholt", async () => {
  let attempts = 0;
  const helper = installNetworkHelper(async () => {
    attempts += 1;
    throw new Error("network interrupted");
  });

  await assert.rejects(
    helper.request("https://example.invalid/sol", {
      method: "POST",
      body: "{}"
    }),
    (error) => {
      assert.equal(error.code, "PAM_HOLO_NETWORK_INTERRUPTED");
      assert.equal(error.deliveryUncertain, true);
      return true;
    }
  );
  assert.equal(attempts, 1);
  assert.match(network, /method === "GET" \|\| method === "HEAD"/u);
  assert.match(network, /: 1;/u);
});

test("geschützte Sitzungs- und Medienpfade bleiben am Cloudflare-Türsteher", () => {
  const helper = installNetworkHelper(async () =>
    new Response("{}", { status: 200 })
  );

  assert.equal(
    helper.apiEndpoint("/app-session/challenge"),
    "https://pam-holo-edge-guard.pamela-nitschke75.workers.dev/app-session/challenge"
  );
  assert.equal(
    helper.apiEndpoint("/animal-holos/profile-photo/save"),
    "https://pam-holo-edge-guard.pamela-nitschke75.workers.dev/animal-holos/profile-photo/save"
  );
  assert.throws(
    () => helper.apiEndpoint("//example.invalid/steal"),
    error => error?.code === "PAM_HOLO_API_PATH_INVALID"
  );
  assert.throws(
    () => helper.apiEndpoint("/app-session/../steal"),
    error => error?.code === "PAM_HOLO_API_PATH_INVALID"
  );
  assert.throws(
    () => helper.apiEndpoint("/app-session/%2e%2e/steal"),
    error => error?.code === "PAM_HOLO_API_PATH_INVALID"
  );
});

test("offline bleibt der Entwurf sicher und die Zustellung gilt nicht als erfolgt", async () => {
  const helper = installNetworkHelper(async () => {
    throw new Error("fetch must not run while offline");
  }, false);

  await assert.rejects(
    helper.request("https://example.invalid/sol", { method: "POST" }),
    (error) => {
      assert.equal(error.code, "PAM_HOLO_OFFLINE");
      assert.equal(error.deliveryUncertain, false);
      assert.match(error.message, /Entwurf bleibt erhalten/u);
      return true;
    }
  );
});

test("die Chatoberfläche erhält Entwürfe und entfernt sicher blockierte Inhalte aus der Warteschlange", () => {
  assert.match(html, /error\?\.persisted ===\s*\n\s*false[\s\S]*?discardPendingFulltimeDialog/u);
  assert.match(html, /!messageInput\.value &&\s*\n\s*message[\s\S]*?messageInput\.value =\s*\n\s*message/u);
  assert.match(html, /Die Nachricht wird nicht automatisch erneut gesendet/u);
  assert.match(html, /data\?\.message \|\|\s*\n\s*data\?\.error/u);
  assert.doesNotMatch(html, /"Text-\/Medienchat Fehler:",\s*\n\s*error\s*\n/u);
});

test("der Offline-Cache enthält nur die feste App-Hülle und niemals persönliche API-Daten", () => {
  assert.match(serviceWorker, /if \(event\.request\.method !== "GET"\) return;/u);
  assert.match(serviceWorker, /!APP_SHELL_PATHS\.has\(requestUrl\.pathname\)/u);
  assert.match(serviceWorker, /API-, Erinnerungs-, Kontakt- und Gesundheitsantworten werden nie gecacht/u);
  for (const privatePath of [
    "/sol",
    "/memory",
    "/contacts",
    "/health/ready"
  ]) {
    assert.equal(serviceWorker.includes(`".${privatePath}"`), false, privatePath);
  }
});

test("Render erhält getrennte Live- und Bereitschaftsprüfungen sowie kontrolliertes SIGTERM", () => {
  assert.match(server, /app\.get\("\/health\/live"/u);
  assert.match(server, /app\.get\("\/health\/ready"/u);
  assert.match(server, /SELECT 1 AS ready/u);
  assert.match(server, /runtimeReadiness\.shuttingDown = true/u);
  assert.match(server, /httpServer\.closeIdleConnections\?\.\(\)/u);
  assert.match(server, /process\.once\(\s*\n\s*"SIGTERM"/u);
  assert.match(server, /25_000/u);
});

test("Dokumentation trennt Pam Holo, Render-Aktivierung und schrittweise OpenAI-Migration", () => {
  assert.match(documentation, /„Ich, ich und ich!“/u);
  assert.match(documentation, /Human Holo für alle:[*]* vollständig im anwaltlichen Hold/u);
  assert.match(documentation, /Responses API/u);
  assert.match(documentation, /kurzlebige Realtime-Sitzungen/u);
  assert.match(documentation, /keine ungesicherte\n\s*Komplettmigration/u);
  assert.match(documentation, /Nie übertragen werden Pams Erinnerungen/u);
});
