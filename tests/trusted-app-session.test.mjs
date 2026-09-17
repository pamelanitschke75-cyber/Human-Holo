import assert from "node:assert/strict";
import {
  generateKeyPairSync,
  sign
} from "node:crypto";
import test from "node:test";

import {
  TRUSTED_APP_OWNER_PERSON_PROOF,
  TrustedAppSessionError,
  createTrustedAppSessionManager,
  trustedSessionCanonicalPayload
} from "../modules/trusted-app-session.mjs";

function databaseStub() {
  let device = null;
  const challenges = new Map();
  const sessions = new Map();
  return {
    async query(sql, values = []) {
      if (/CREATE (?:TABLE|INDEX)/u.test(sql)) return { rows: [] };
      if (/INSERT INTO sol_trusted_app_devices/u.test(sql)) {
        device = {
          owner_id: values[0],
          registration_id: values[1],
          package_name: values[2],
          public_key_x509_base64url: values[3],
          certificate_sha256: values[4]
        };
        return { rows: [] };
      }
      if (
        /DELETE FROM sol_trusted_app_challenges\s+WHERE expires_at_millis/u.test(sql)
      ) {
        for (const [id, challenge] of challenges) {
          if (Number(challenge.expires_at_millis) <= Number(values[0])) {
            challenges.delete(id);
          }
        }
        return { rows: [] };
      }
      if (
        /DELETE FROM sol_trusted_app_sessions\s+WHERE expires_at_millis/u.test(sql)
      ) {
        for (const [hash, session] of sessions) {
          if (Number(session.expires_at_millis) <= Number(values[0])) {
            sessions.delete(hash);
          }
        }
        return { rows: [] };
      }
      if (/DELETE FROM sol_trusted_app_challenges WHERE owner_id/u.test(sql)) {
        for (const [id, challenge] of challenges) {
          if (challenge.owner_id === values[0]) challenges.delete(id);
        }
        return { rows: [] };
      }
      if (/DELETE FROM sol_trusted_app_sessions WHERE owner_id/u.test(sql)) {
        for (const [hash, session] of sessions) {
          if (session.owner_id === values[0]) sessions.delete(hash);
        }
        return { rows: [] };
      }
      if (/SELECT[\s\S]*FROM sol_trusted_app_devices/u.test(sql)) {
        return {
          rows:
            device &&
            device.owner_id === values[0] &&
            device.registration_id === values[1]
              ? [{ ...device }]
              : []
        };
      }
      if (/INSERT INTO sol_trusted_app_challenges/u.test(sql)) {
        challenges.set(values[0], {
          challenge_id: values[0],
          owner_id: values[1],
          registration_id: values[2],
          package_name: values[3],
          nonce_base64url: values[4],
          issued_at_millis: values[5],
          expires_at_millis: values[6],
          access_level: values[7],
          owner_person_proof: values[8]
        });
        return { rows: [] };
      }
      if (/DELETE FROM sol_trusted_app_challenges[\s\S]*challenge_id = \$1/u.test(sql)) {
        const challenge = challenges.get(values[0]);
        challenges.delete(values[0]);
        return { rows: challenge ? [{ ...challenge }] : [] };
      }
      if (/INSERT INTO sol_trusted_app_sessions/u.test(sql)) {
        sessions.set(values[0], {
          token_hash: values[0],
          owner_id: values[1],
          registration_id: values[2],
          access_level: values[3],
          owner_person_proof: values[4],
          issued_at_millis: values[5],
          expires_at_millis: values[6]
        });
        return { rows: [] };
      }
      if (/FROM sol_trusted_app_sessions AS trusted_session/u.test(sql)) {
        const session = sessions.get(values[0]);
        const valid =
          session &&
          device &&
          session.owner_id === device.owner_id &&
          session.registration_id === device.registration_id &&
          Number(session.expires_at_millis) > Number(values[1]);
        return { rows: valid ? [{ ...session }] : [] };
      }
      if (/UPDATE sol_trusted_app_devices/u.test(sql)) return { rows: [] };
      throw new Error(`Unexpected SQL: ${sql}`);
    }
  };
}

function assertSessionError(code) {
  return (error) => {
    assert.ok(error instanceof TrustedAppSessionError);
    assert.equal(error.code, code);
    return true;
  };
}

function fixture() {
  const keyPair = generateKeyPairSync("ec", {
    namedCurve: "prime256v1"
  });
  const device = {
    ownerId: "pam-sol",
    registrationId: "11111111-1111-4111-8111-111111111111",
    packageName: "com.solholo.app",
    publicKeyX509Base64Url: keyPair.publicKey
      .export({ format: "der", type: "spki" })
      .toString("base64url"),
    certificateSha256: "a".repeat(64)
  };
  return { device, keyPair };
}

test("only an owner-verified device can create a signed trusted session", async () => {
  let currentTime = 1_800_000_000_000;
  let idCounter = 1;
  const database = databaseStub();
  const manager = createTrustedAppSessionManager({
    database,
    now: () => currentTime,
    randomId: () =>
      `00000000-0000-4000-8000-${String(idCounter++).padStart(12, "0")}`
  });
  const { device, keyPair } = fixture();
  await manager.initialize();

  await assert.rejects(
    manager.registerDevice(device),
    assertSessionError("TRUSTED_SESSION_OWNER_PROOF_REQUIRED")
  );
  await manager.registerDevice(device, { googleAccountVerified: true });

  const challenge = await manager.createChallenge(device);
  assert.equal(typeof challenge.issuedAtMillis, "string");
  assert.equal(typeof challenge.expiresAtMillis, "string");
  assert.equal(Number(challenge.issuedAtMillis), currentTime);
  assert.equal(Number(challenge.expiresAtMillis), currentTime + 120_000);
  assert.equal(
    challenge.ownerPersonProof,
    TRUSTED_APP_OWNER_PERSON_PROOF
  );
  assert.throws(
    () => trustedSessionCanonicalPayload({
      ...challenge,
      ownerPersonProof: "fingerprint_or_pin_only"
    }),
    assertSessionError("TRUSTED_SESSION_PERSON_PROOF_INVALID")
  );
  const canonical = trustedSessionCanonicalPayload(challenge);
  const signatureBase64Url = sign(
    "sha256",
    Buffer.from(canonical, "utf8"),
    keyPair.privateKey
  ).toString("base64url");
  const session = await manager.completeChallenge({
    ...device,
    challengeId: challenge.challengeId,
    signatureBase64Url
  });

  assert.equal(session.trusted, true);
  assert.equal(
    session.ownerPersonProof,
    TRUSTED_APP_OWNER_PERSON_PROOF
  );
  const validated = await manager.validateRequest({
    headers: {
      "x-sol-holo-trusted-session": session.sessionToken
    },
    body: { ownerId: "pam-sol" }
  });
  assert.equal(
    validated?.ownerPersonProof,
    TRUSTED_APP_OWNER_PERSON_PROOF
  );
  assert.equal(
    validated?.ownerId,
    "pam-sol"
  );
  assert.equal(
    await manager.validateRequest({
      headers: {
        "x-sol-holo-trusted-session": session.sessionToken
      },
      body: { ownerId: "steffi-sol" }
    }),
    null
  );

  await assert.rejects(
    manager.completeChallenge({
      ...device,
      challengeId: challenge.challengeId,
      signatureBase64Url
    }),
    assertSessionError("TRUSTED_SESSION_CHALLENGE_EXPIRED")
  );

  currentTime = session.expiresAtMillis + 1;
  assert.equal(
    await manager.validateRequest({
      headers: {
        "x-sol-holo-trusted-session": session.sessionToken
      },
      body: { ownerId: "pam-sol" }
    }),
    null
  );
});

test("a wrong signature fails closed and consumes the one-time challenge", async () => {
  const manager = createTrustedAppSessionManager({
    database: databaseStub(),
    randomId: () => "22222222-2222-4222-8222-222222222222"
  });
  const { device } = fixture();
  const wrongKeys = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  await manager.registerDevice(device, { googleAccountVerified: true });
  const challenge = await manager.createChallenge(device);
  const signatureBase64Url = sign(
    "sha256",
    Buffer.from(trustedSessionCanonicalPayload(challenge), "utf8"),
    wrongKeys.privateKey
  ).toString("base64url");

  await assert.rejects(
    manager.completeChallenge({
      ...device,
      challengeId: challenge.challengeId,
      signatureBase64Url
    }),
    assertSessionError("TRUSTED_SESSION_SIGNATURE_INVALID")
  );
  await assert.rejects(
    manager.completeChallenge({
      ...device,
      challengeId: challenge.challengeId,
      signatureBase64Url
    }),
    assertSessionError("TRUSTED_SESSION_CHALLENGE_EXPIRED")
  );
});

test("rebinding the owner device revokes every older shared session", async () => {
  let idCounter = 10;
  const manager = createTrustedAppSessionManager({
    database: databaseStub(),
    randomId: () =>
      `00000000-0000-4000-8000-${String(idCounter++).padStart(12, "0")}`
  });
  const first = fixture();
  await manager.registerDevice(first.device, { googleAccountVerified: true });
  const challenge = await manager.createChallenge(first.device);
  const session = await manager.completeChallenge({
    ...first.device,
    challengeId: challenge.challengeId,
    signatureBase64Url: sign(
      "sha256",
      Buffer.from(trustedSessionCanonicalPayload(challenge), "utf8"),
      first.keyPair.privateKey
    ).toString("base64url")
  });
  assert.ok(
    await manager.validateRequest({
      headers: { "x-sol-holo-trusted-session": session.sessionToken },
      body: { ownerId: "pam-sol" }
    })
  );

  const replacement = fixture();
  replacement.device.registrationId =
    "33333333-3333-4333-8333-333333333333";
  replacement.device.certificateSha256 = "b".repeat(64);
  await manager.registerDevice(replacement.device, {
    googleAccountVerified: true
  });
  assert.equal(
    await manager.validateRequest({
      headers: { "x-sol-holo-trusted-session": session.sessionToken },
      body: { ownerId: "pam-sol" }
    }),
    null
  );
});

test("challenge completion and session validation survive an instance switch", async () => {
  const database = databaseStub();
  const firstInstance = createTrustedAppSessionManager({
    database,
    randomId: () => "44444444-4444-4444-8444-444444444444"
  });
  const secondInstance = createTrustedAppSessionManager({ database });
  const { device, keyPair } = fixture();

  await firstInstance.initialize();
  await secondInstance.initialize();
  await firstInstance.registerDevice(device, { googleAccountVerified: true });

  const challenge = await firstInstance.createChallenge(device);
  const session = await secondInstance.completeChallenge({
    ...device,
    challengeId: challenge.challengeId,
    signatureBase64Url: sign(
      "sha256",
      Buffer.from(trustedSessionCanonicalPayload(challenge), "utf8"),
      keyPair.privateKey
    ).toString("base64url")
  });

  for (const instance of [firstInstance, secondInstance]) {
    const validated = await instance.validateRequest({
      headers: { "x-sol-holo-trusted-session": session.sessionToken },
      body: { ownerId: device.ownerId }
    });
    assert.equal(validated?.ownerId, device.ownerId);
    assert.equal(validated?.registrationId, device.registrationId);
  }
});

test("device registration rejects a non-P-256 public key", async () => {
  const manager = createTrustedAppSessionManager({
    database: databaseStub()
  });
  const wrongCurve = generateKeyPairSync("ec", { namedCurve: "secp384r1" });
  const device = fixture().device;
  device.publicKeyX509Base64Url = wrongCurve.publicKey
    .export({ format: "der", type: "spki" })
    .toString("base64url");
  await assert.rejects(
    manager.registerDevice(device, { googleAccountVerified: true }),
    assertSessionError("TRUSTED_SESSION_PUBLIC_KEY_INVALID")
  );
});
