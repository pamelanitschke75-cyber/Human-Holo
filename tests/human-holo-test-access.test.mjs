import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  HumanHoloTestAccessError,
  createHumanHoloTestAccess,
  hashHumanHoloTestAccessCode
} from "../modules/human-holo-test-access.mjs";

const ACCESS_CODE = "Anwalt-Test-2026-sicher";
const SIGNING_SECRET = "human-holo-test-session-secret-32-bytes-minimum";
const START = Date.parse("2026-09-14T12:00:00.000Z");

function profilesJson(overrides = {}) {
  return JSON.stringify([
    {
      testerId: "legal-review-1",
      displayName: "Rechtstest",
      role: "legal-reviewer",
      accessCodeSha256: hashHumanHoloTestAccessCode(ACCESS_CODE),
      expiresAt: "2026-09-30T23:59:59.000Z",
      ...overrides
    }
  ]);
}

function createAccess(options = {}) {
  let now = START;
  const access = createHumanHoloTestAccess({
    profilesJson: profilesJson(),
    signingSecret: SIGNING_SECRET,
    clock: () => now,
    ...options
  });
  return {
    access,
    advance(milliseconds) {
      now += milliseconds;
    }
  };
}

test("ein gültiger Einladungscode erzeugt nur eine getrennte Testidentität", () => {
  const { access } = createAccess();
  const session = access.activate({
    testerId: "legal-review-1",
    accessCode: ACCESS_CODE,
    rateLimitKey: "127.0.0.1"
  });

  assert.equal(session.identity.ownerId, "human-test-legal-review-1");
  assert.equal(session.identity.speakerId, "tester-legal-review-1");
  assert.equal(session.identity.testOnly, true);
  assert.notEqual(session.identity.ownerId, "pam-sol");
  assert.doesNotMatch(JSON.stringify(session), new RegExp(ACCESS_CODE, "u"));

  const authenticated = access.authenticate(`Bearer ${session.token}`);
  assert.deepEqual(authenticated, session.identity);
});

test("falscher Code, manipuliertes Token und abgelaufene Sitzung scheitern geschlossen", () => {
  const { access, advance } = createAccess();

  assert.throws(
    () => access.activate({
      testerId: "legal-review-1",
      accessCode: "das-ist-eindeutig-falsch",
      rateLimitKey: "one"
    }),
    error =>
      error instanceof HumanHoloTestAccessError &&
      error.code === "TEST_ACCESS_DENIED"
  );

  const session = access.activate({
    testerId: "legal-review-1",
    accessCode: ACCESS_CODE,
    rateLimitKey: "two"
  });
  assert.throws(
    () => access.authenticate(`Bearer ${session.token}x`),
    error =>
      error instanceof HumanHoloTestAccessError &&
      error.code === "TEST_SESSION_INVALID"
  );

  advance(4 * 60 * 60 * 1000 + 1000);
  assert.throws(
    () => access.authenticate(`Bearer ${session.token}`),
    error =>
      error instanceof HumanHoloTestAccessError &&
      error.code === "TEST_SESSION_INVALID_OR_EXPIRED"
  );
});

test("fünf Fehlversuche sperren weitere Versuche im Zeitfenster", () => {
  const { access } = createAccess();
  for (let index = 0; index < 5; index += 1) {
    assert.throws(() => access.activate({
      testerId: "legal-review-1",
      accessCode: "weiterhin-falsch-123",
      rateLimitKey: "same-client"
    }));
  }
  assert.throws(
    () => access.activate({
      testerId: "legal-review-1",
      accessCode: ACCESS_CODE,
      rateLimitKey: "same-client"
    }),
    error =>
      error instanceof HumanHoloTestAccessError &&
      error.code === "TEST_ACCESS_RATE_LIMITED" &&
      error.statusCode === 429
  );
});

test("Pam und Steffi können nicht als Testprofil konfiguriert werden", () => {
  for (const testerId of ["pam", "pam-sol", "steffi", "steffi-sol"]) {
    assert.throws(
      () => createHumanHoloTestAccess({
        profilesJson: profilesJson({ testerId }),
        signingSecret: SIGNING_SECRET
      }),
      error =>
        error instanceof HumanHoloTestAccessError &&
        error.code === "TESTER_ID_INVALID"
    );
  }
});

test("Status verrät weder Testerprofile noch Zugangsdaten", () => {
  const { access } = createAccess();
  assert.deepEqual(access.status(), {
    accessMode: "invite-only-test",
    accessRequired: true,
    configured: true,
    marketReleaseApproved: false,
    testerCountDisclosed: false
  });
  assert.doesNotMatch(JSON.stringify(access.status()), /Rechtstest|legal-review-1/u);
});

test("Einladungswerkzeug erzeugt einen zufälligen Code und nur dessen Prüfwert im Profil", () => {
  const output = execFileSync(
    process.execPath,
    [
      new URL(
        "../scripts/create-human-holo-test-invite.mjs",
        import.meta.url
      ).pathname,
      "--tester-id",
      "example-reviewer",
      "--display-name",
      "Beispieltest",
      "--expires-at",
      "2026-09-30T23:59:59.000Z"
    ],
    { encoding: "utf8" }
  );
  const code = output.match(
    /nicht in Git speichern\):\n([^\n]+)\n/u
  )?.[1];
  const profileText = output.match(
    /HUMAN_HOLO_TESTER_PROFILES_JSON:\n([\s\S]*?)\n\nDer Zugang/u
  )?.[1];
  assert.ok(code);
  assert.ok(profileText);
  assert.ok(code.length >= 12);
  const profile = JSON.parse(profileText);
  assert.equal(profile.testerId, "example-reviewer");
  assert.equal(profile.accessCodeSha256, hashHumanHoloTestAccessCode(code));
  assert.doesNotMatch(JSON.stringify(profile), new RegExp(code, "u"));
});
