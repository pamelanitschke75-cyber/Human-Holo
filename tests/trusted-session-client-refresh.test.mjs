import assert from "node:assert/strict";
import test from "node:test";

const OWNER_ID = "pam-sol";
const REGISTRATION_ID = "11111111-1111-4111-8111-111111111111";
const EVERYDAY_ACCESS = "owner_everyday";
const PROTECTED_ACCESS = "protected_media_documents_settings";
const ACTION = Object.freeze({
  [EVERYDAY_ACCESS]: "bind_owner_everyday_session",
  [PROTECTED_ACCESS]: "bind_trusted_app_session"
});
const PERSON_PROOF = Object.freeze({
  [EVERYDAY_ACCESS]: "pam_registered_owner_device_everyday_v1",
  [PROTECTED_ACCESS]: "pam_voice_or_registered_watch_v1"
});

let moduleSequence = 0;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function fixture({
  protectedSignatureFailures = 0,
  deviceBound = true
} = {}) {
  const events = [];
  const requestedUrls = [];
  const challengeAccess = new Map();
  let authorizationCount = 0;
  let challengeCount = 0;
  let remainingProtectedFailures = protectedSignatureFailures;

  const plugin = {
    async getTrustedSessionDevice() {
      events.push({ type: "device" });
      return {
        ownerId: OWNER_ID,
        registrationId: REGISTRATION_ID,
        packageName: "com.solholo.app",
        hardwareBacked: true
      };
    },
    async authorizeOwnerEverydayAccess(request) {
      authorizationCount += 1;
      events.push({
        type: "device_authorize",
        request,
        number: authorizationCount
      });
      return {
        allowed: true,
        ownerId: OWNER_ID,
        action: ACTION[EVERYDAY_ACCESS],
        authorizationId: `authorization-${authorizationCount}`
      };
    },
    async authorizeCriticalAction() {
      authorizationCount += 1;
      events.push({
        type: "fingerprint_authorize",
        number: authorizationCount
      });
      return {
        allowed: true,
        ownerId: OWNER_ID,
        action: ACTION[PROTECTED_ACCESS],
        authorizationId: `authorization-${authorizationCount}`
      };
    },
    async signTrustedSessionChallenge(challenge) {
      events.push({
        type: "sign",
        accessLevel: challenge.accessLevel,
        authorizationId: challenge.authorizationId,
        issuedAtType: typeof challenge.issuedAtMillis,
        expiresAtType: typeof challenge.expiresAtMillis
      });
      if (
        challenge.accessLevel === PROTECTED_ACCESS &&
        remainingProtectedFailures > 0
      ) {
        remainingProtectedFailures -= 1;
        const error = new Error("Challenge ungültig");
        error.code = "TRUSTED_SESSION_CHALLENGE_INVALID";
        throw error;
      }
      return {
        ok: true,
        ownerId: OWNER_ID,
        registrationId: REGISTRATION_ID,
        challengeId: challenge.challengeId,
        signatureBase64Url: "signed"
      };
    }
  };

  globalThis.CustomEvent = class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  };
  globalThis.document = {
    visibilityState: "visible",
    addEventListener() {}
  };
  globalThis.window = {
    Capacitor: { Plugins: { SolAccessSecurity: plugin } },
    PamHoloNetwork: {
      apiRequest: (path, options) => {
        const url =
          `https://pam-holo-edge-guard.pamela-nitschke75.workers.dev${path}`;
        requestedUrls.push(url);
        return globalThis.fetch(url, options);
      }
    },
    SolHoloIdentity: {
      selected: () => ({ ownerId: OWNER_ID, speakerId: "pam" })
    },
    addEventListener() {},
    dispatchEvent() {},
    open() {
      events.push({ type: "owner_proof_window" });
      return { opener: null };
    },
    setTimeout
  };

  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path === "/app-session/challenge") {
      challengeCount += 1;
      const body = JSON.parse(options.body);
      const accessLevel = body.accessLevel;
      if (!deviceBound) {
        events.push({ type: "challenge_rejected", accessLevel });
        return jsonResponse({
          error: "TRUSTED_SESSION_DEVICE_NOT_BOUND",
          message: "Gerät ist serverseitig noch nicht gebunden."
        }, 403);
      }
      const challengeId =
        `00000000-0000-4000-8000-${String(challengeCount).padStart(12, "0")}`;
      challengeAccess.set(challengeId, accessLevel);
      const now = Date.now();
      events.push({ type: "challenge", accessLevel });
      return jsonResponse({
        ownerId: OWNER_ID,
        registrationId: REGISTRATION_ID,
        packageName: "com.solholo.app",
        challengeId,
        nonceBase64Url: "A".repeat(43),
        issuedAtMillis: now,
        expiresAtMillis: now + 120_000,
        purpose: "owner_personal_services",
        accessLevel,
        action: ACTION[accessLevel],
        ownerPersonProof: PERSON_PROOF[accessLevel]
      });
    }
    if (path === "/app-session/complete") {
      const body = JSON.parse(options.body);
      const accessLevel = challengeAccess.get(body.challengeId);
      events.push({ type: "complete", accessLevel });
      return jsonResponse({
        trusted: true,
        ownerId: OWNER_ID,
        accessLevel,
        ownerPersonProof: PERSON_PROOF[accessLevel],
        sessionToken: `session-${challengeCount}`,
        expiresAtMillis: Date.now() + 30 * 60_000
      });
    }
    throw new Error(`Unerwarteter Testpfad: ${path}`);
  };

  moduleSequence += 1;
  const client = await import(
    `../www/trusted-app-session.mjs?refresh-test=${moduleSequence}`
  );
  return { client, events, requestedUrls };
}

async function openEveryday(client) {
  return client.ensureTrustedAppSession({
    interactive: true,
    accessLevel: EVERYDAY_ACCESS
  });
}

test("registriertes Gerät öffnet Alltag ohne Fingerprint; Schutzstufe fragt Fingerprint", async () => {
  const { client, events, requestedUrls } = await fixture();
  const everyday = await openEveryday(client);

  assert.equal(everyday.trusted, true);
  assert.deepEqual(
    events.map(event => event.type),
    ["device", "device_authorize", "challenge", "sign", "complete"]
  );
  assert.deepEqual(events[1].request, { ownerId: OWNER_ID });
  assert.equal(events[3].issuedAtType, "string");
  assert.equal(events[3].expiresAtType, "string");

  events.length = 0;
  const protectedSession = await client.ensureTrustedAppSession({
    interactive: true,
    accessLevel: PROTECTED_ACCESS
  });
  assert.equal(protectedSession.trusted, true);
  assert.deepEqual(
    events.map(event => event.type),
    ["device", "fingerprint_authorize", "challenge", "sign", "complete"]
  );
  assert.ok(requestedUrls.length >= 4);
  assert.ok(requestedUrls.every(url =>
    url.startsWith(
      "https://pam-holo-edge-guard.pamela-nitschke75.workers.dev/"
    )
  ));
  assert.ok(requestedUrls.every(url => !url.includes(".onrender.com")));
});

test("App-Start erzwingt bei fehlender Serverbindung kein Online-Bootstrap", async () => {
  const { client, events } = await fixture({ deviceBound: false });
  const result = await client.ensureTrustedAppSession({
    interactive: true,
    accessLevel: EVERYDAY_ACCESS,
    allowBootstrap: false
  });

  assert.equal(result.trusted, false);
  assert.equal(result.needsBootstrap, true);
  assert.deepEqual(
    events.map(event => event.type),
    ["device", "device_authorize", "challenge_rejected"]
  );
  assert.equal(
    events.some(event => event.type === "owner_proof_window"),
    false
  );
});

test("verwirft eine ungültige geschützte Challenge und fragt genau einmal neu", async () => {
  const { client, events } = await fixture({ protectedSignatureFailures: 1 });
  await openEveryday(client);
  events.length = 0;

  const result = await client.ensureTrustedAppSession({
    interactive: true,
    accessLevel: PROTECTED_ACCESS
  });

  assert.equal(result.trusted, true);
  assert.deepEqual(
    events.map(event => event.type),
    [
      "device",
      "fingerprint_authorize",
      "challenge",
      "sign",
      "fingerprint_authorize",
      "challenge",
      "sign",
      "complete"
    ]
  );
  assert.notEqual(events[3].authorizationId, events[6].authorizationId);
});

test("wiederholt eine weiterhin ungültige geschützte Challenge kein drittes Mal", async () => {
  const { client, events } = await fixture({ protectedSignatureFailures: 2 });
  await openEveryday(client);
  events.length = 0;

  await assert.rejects(
    client.ensureTrustedAppSession({
      interactive: true,
      accessLevel: PROTECTED_ACCESS
    }),
    error => error?.code === "TRUSTED_SESSION_CHALLENGE_INVALID"
  );
  assert.equal(
    events.filter(event => event.type === "fingerprint_authorize").length,
    2
  );
  assert.equal(
    events.filter(event => event.type === "challenge").length,
    2
  );
});
