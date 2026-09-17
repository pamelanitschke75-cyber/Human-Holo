import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  DEFAULT_IDENTITY_REGISTRY,
  MEMORY_DECISION,
  MEMORY_PERSISTENCE_CONTRACT,
  evaluateIdentityMemoryWrite,
  resolveMemoryIdentity
} from "../modules/identity-memory.mjs";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

function routeBlock(server, marker) {
  const start = server.indexOf(marker);
  assert.notEqual(start, -1, `Route fehlt: ${marker}`);
  const nextRoute = server.indexOf("\napp.", start + marker.length);
  return server.slice(start, nextRoute === -1 ? server.length : nextRoute);
}

test("persönliche Chat-, Sprach-, Medien- und Google-Wege verlangen die Owner-Sitzung", async () => {
  const server = await source("server.mjs");

  for (const marker of [
    'app.post("/sol"',
    'app.post("/realtime/token"',
    'app.post("/auth/smartthings/start"',
    '  "/live/memory",',
    '  "/sol/video-transcript",',
    '  "/calendar/action",',
    '  "/gmail/action",'
  ]) {
    assert.match(
      routeBlock(server, marker),
      /requireTrustedOwnerIdentity\s*\(/u,
      marker
    );
  }

  assert.match(
    server,
    /async function handleGooglePersonalRead[\s\S]*?const identity = requireTrustedOwnerIdentity\(req, res\)/u
  );

  for (const marker of [
    '  "/auth/google",',
    '  "/google/status",',
    'app.get("/auth/smartthings"',
    'app.get("/smartthings/status"',
    '  "/calendar/status",'
  ]) {
    assert.match(
      routeBlock(server, marker),
      /requireTrustedOwnerQueryIdentity\s*\(/u,
      marker
    );
  }
});

test("Pam-App bestätigt die Sitzung vor Text, Sprache und Video", async () => {
  const html = await source("www/index.html");
  const media = await source("www/media-tools.js");

  const sendStart = html.indexOf("async function sendMessage(");
  const liveStart = html.indexOf("async function startLiveConversation(");
  assert.ok(sendStart >= 0 && liveStart > sendStart);
  const sendBlock = html.slice(sendStart, liveStart);
  const liveBlock = html.slice(liveStart);

  assert.match(sendBlock, /ensureFulltimeHistorySession\(\s*true\s*\)/u);
  assert.ok(
    sendBlock.indexOf("ensureFulltimeHistorySession") <
      sendBlock.indexOf("`${BACKEND_URL}/sol`")
  );
  assert.match(liveBlock, /ensureFulltimeHistorySession\(\s*true\s*\)/u);
  assert.ok(
    liveBlock.indexOf("ensureFulltimeHistorySession") <
      liveBlock.indexOf("`${BACKEND_URL}/realtime/token`")
  );
  assert.match(
    media,
    /request\.setRequestHeader\(\s*"X-Sol-Holo-Trusted-Session",\s*trustedSessionToken\s*\)/u
  );
  assert.match(media, /Die sichere persönliche Holo-Sitzung fehlt/u);
  assert.match(html, /auth\/smartthings\/start/u);
  assert.match(
    html,
    /SolHoloTrustedSession\?\.ensure\?\.\([\s\S]*?auth\/smartthings\/start/u
  );
});

test("Pams private Familienerinnerung erzeugt kein Profil der genannten Person", () => {
  assert.equal(
    MEMORY_PERSISTENCE_CONTRACT.privateRelationshipFactsBelongToTheRememberingOwner,
    true
  );
  assert.equal(
    MEMORY_PERSISTENCE_CONTRACT.mentionedPeopleAreNeverAutoEnrolled,
    true
  );
  assert.equal(
    MEMORY_PERSISTENCE_CONTRACT.newPersonalIdentityRequiresThatPersonsOwnConsent,
    true
  );

  const decision = evaluateIdentityMemoryWrite({
    source: "text",
    role: "user",
    selectedSpeakerId: "pam",
    ownerId: "pam-sol",
    content: "Sol, merke dir dauerhaft: Meine Tochter heißt Beispielname."
  });

  assert.equal(decision.kind, MEMORY_DECISION.PERSIST);
  assert.equal(decision.memory.ownerId, "pam-sol");
  assert.equal(
    decision.memory.content,
    "Meine Tochter heißt Beispielname."
  );
  assert.equal(DEFAULT_IDENTITY_REGISTRY.getIdentity("tochter"), null);
  assert.notEqual(
    resolveMemoryIdentity({ selectedSpeakerId: "tochter" }).kind,
    "resolved"
  );
});
