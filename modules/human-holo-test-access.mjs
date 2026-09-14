import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual
} from "node:crypto";

export const HUMAN_HOLO_TEST_ACCESS_MODE = "invite-only-test";
export const HUMAN_HOLO_TEST_SESSION_TTL_MS = 4 * 60 * 60 * 1000;
export const HUMAN_HOLO_TEST_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
export const HUMAN_HOLO_TEST_MAX_FAILED_ATTEMPTS = 5;

const TESTER_ID_PATTERN = /^[a-z0-9][a-z0-9-]{2,39}$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const RESERVED_TESTER_IDS = new Set([
  "pam",
  "pam-sol",
  "steffi",
  "steffi-sol"
]);
const TOKEN_AUDIENCE = "human-holo-legal-review";

export class HumanHoloTestAccessError extends Error {
  constructor(code, statusCode = 401) {
    super("Der Human-Holo-Testzugang wurde abgelehnt.");
    this.name = "HumanHoloTestAccessError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function clean(value) {
  return String(value ?? "").normalize("NFKC").trim();
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function parseBase64UrlJson(value) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    throw new HumanHoloTestAccessError("TEST_SESSION_INVALID");
  }
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function hashHumanHoloTestAccessCode(value) {
  const accessCode = clean(value);
  if (accessCode.length < 12 || accessCode.length > 200) {
    throw new HumanHoloTestAccessError("TEST_ACCESS_CODE_INVALID", 400);
  }
  return sha256(accessCode);
}

function safeEqualText(left, right) {
  const leftBytes = Buffer.from(String(left), "utf8");
  const rightBytes = Buffer.from(String(right), "utf8");
  return (
    leftBytes.length === rightBytes.length &&
    timingSafeEqual(leftBytes, rightBytes)
  );
}

function normalizedProfile(rawProfile) {
  const testerId = clean(rawProfile?.testerId).toLowerCase();
  const displayName = clean(rawProfile?.displayName);
  const accessCodeSha256 = clean(
    rawProfile?.accessCodeSha256
  ).toLowerCase();
  const expiresAtMillis = Date.parse(clean(rawProfile?.expiresAt));

  if (
    !TESTER_ID_PATTERN.test(testerId) ||
    RESERVED_TESTER_IDS.has(testerId)
  ) {
    throw new HumanHoloTestAccessError("TESTER_ID_INVALID", 500);
  }
  if (!displayName || displayName.length > 80) {
    throw new HumanHoloTestAccessError("TESTER_DISPLAY_NAME_INVALID", 500);
  }
  if (!SHA256_PATTERN.test(accessCodeSha256)) {
    throw new HumanHoloTestAccessError("TESTER_ACCESS_HASH_INVALID", 500);
  }
  if (!Number.isFinite(expiresAtMillis)) {
    throw new HumanHoloTestAccessError("TESTER_EXPIRY_INVALID", 500);
  }

  const ownerId = `human-test-${testerId}`;
  const speakerId = `tester-${testerId}`;

  return Object.freeze({
    testerId,
    displayName,
    accessCodeSha256,
    expiresAt: new Date(expiresAtMillis).toISOString(),
    expiresAtMillis,
    ownerId,
    speakerId,
    cloneId: `${ownerId}-001`,
    instanceName: `Human Holo · ${displayName}`,
    role: clean(rawProfile?.role) || "tester"
  });
}

function parseProfiles(profilesJson) {
  let rawProfiles;
  try {
    rawProfiles = JSON.parse(clean(profilesJson) || "[]");
  } catch {
    throw new HumanHoloTestAccessError("TESTER_PROFILES_JSON_INVALID", 500);
  }
  if (!Array.isArray(rawProfiles) || rawProfiles.length > 100) {
    throw new HumanHoloTestAccessError("TESTER_PROFILES_INVALID", 500);
  }

  const profiles = rawProfiles.map(normalizedProfile);
  const ids = new Set();
  for (const profile of profiles) {
    if (ids.has(profile.testerId)) {
      throw new HumanHoloTestAccessError("TESTER_ID_DUPLICATE", 500);
    }
    ids.add(profile.testerId);
  }
  return profiles;
}

function publicIdentity(profile) {
  return Object.freeze({
    testerId: profile.testerId,
    displayName: profile.displayName,
    ownerId: profile.ownerId,
    speakerId: profile.speakerId,
    cloneId: profile.cloneId,
    instanceName: profile.instanceName,
    role: profile.role,
    testOnly: true
  });
}

export function createHumanHoloTestAccess({
  profilesJson = "[]",
  signingSecret,
  clock = () => Date.now(),
  sessionTtlMs = HUMAN_HOLO_TEST_SESSION_TTL_MS,
  attemptWindowMs = HUMAN_HOLO_TEST_ATTEMPT_WINDOW_MS,
  maxFailedAttempts = HUMAN_HOLO_TEST_MAX_FAILED_ATTEMPTS
} = {}) {
  const secret = clean(signingSecret);
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new HumanHoloTestAccessError("TEST_SESSION_SECRET_TOO_SHORT", 500);
  }
  if (
    !Number.isSafeInteger(sessionTtlMs) ||
    sessionTtlMs < 5 * 60 * 1000 ||
    sessionTtlMs > HUMAN_HOLO_TEST_SESSION_TTL_MS
  ) {
    throw new HumanHoloTestAccessError("TEST_SESSION_TTL_INVALID", 500);
  }

  const profiles = parseProfiles(profilesJson);
  const profilesById = new Map(
    profiles.map(profile => [profile.testerId, profile])
  );
  const profilesByOwner = new Map(
    profiles.map(profile => [profile.ownerId, profile])
  );
  const failedAttempts = new Map();
  const profileVersion = sha256(
    JSON.stringify(
      profiles.map(profile => ({
        testerId: profile.testerId,
        accessCodeSha256: profile.accessCodeSha256,
        expiresAt: profile.expiresAt,
        role: profile.role
      }))
    )
  ).slice(0, 24);

  function sign(unsignedToken) {
    return createHmac("sha256", secret)
      .update(unsignedToken, "utf8")
      .digest("base64url");
  }

  function ensureActiveProfile(profile, now = clock()) {
    if (!profile || profile.expiresAtMillis <= now) {
      throw new HumanHoloTestAccessError("TEST_INVITE_EXPIRED_OR_UNKNOWN");
    }
    return profile;
  }

  function activationKey(rateLimitKey, testerId) {
    return `${clean(rateLimitKey).slice(0, 160)}:${testerId}`;
  }

  function assertAttemptAllowed(key, now) {
    const attempt = failedAttempts.get(key);
    if (!attempt || now - attempt.startedAt >= attemptWindowMs) {
      failedAttempts.delete(key);
      return;
    }
    if (attempt.count >= maxFailedAttempts) {
      throw new HumanHoloTestAccessError("TEST_ACCESS_RATE_LIMITED", 429);
    }
  }

  function recordFailure(key, now) {
    const previous = failedAttempts.get(key);
    const current =
      !previous || now - previous.startedAt >= attemptWindowMs
        ? { count: 0, startedAt: now }
        : previous;
    current.count += 1;
    failedAttempts.set(key, current);
  }

  function issueSession(profile, now) {
    const expiresAtMillis = Math.min(
      profile.expiresAtMillis,
      now + sessionTtlMs
    );
    const header = base64UrlJson({ alg: "HS256", typ: "HH-TEST" });
    const payload = base64UrlJson({
      aud: TOKEN_AUDIENCE,
      exp: Math.floor(expiresAtMillis / 1000),
      iat: Math.floor(now / 1000),
      jti: randomUUID(),
      pv: profileVersion,
      sub: profile.ownerId,
      testerId: profile.testerId
    });
    const unsignedToken = `${header}.${payload}`;
    return {
      token: `${unsignedToken}.${sign(unsignedToken)}`,
      expiresAt: new Date(expiresAtMillis).toISOString(),
      identity: publicIdentity(profile),
      testOnly: true
    };
  }

  function activate({ testerId, accessCode, rateLimitKey = "unknown" } = {}) {
    const normalizedTesterId = clean(testerId).toLowerCase();
    const now = clock();
    const key = activationKey(rateLimitKey, normalizedTesterId);
    assertAttemptAllowed(key, now);

    const profile = profilesById.get(normalizedTesterId);
    let presentedHash = "";
    try {
      presentedHash = hashHumanHoloTestAccessCode(accessCode);
    } catch {
      recordFailure(key, now);
      throw new HumanHoloTestAccessError("TEST_ACCESS_DENIED");
    }

    if (
      !profile ||
      profile.expiresAtMillis <= now ||
      !safeEqualText(profile.accessCodeSha256, presentedHash)
    ) {
      recordFailure(key, now);
      throw new HumanHoloTestAccessError("TEST_ACCESS_DENIED");
    }

    failedAttempts.delete(key);
    return issueSession(profile, now);
  }

  function authenticate(authorizationHeader) {
    const match = clean(authorizationHeader).match(/^Bearer\s+([^\s]+)$/u);
    if (!match) {
      throw new HumanHoloTestAccessError("TEST_SESSION_REQUIRED");
    }
    const parts = match[1].split(".");
    if (parts.length !== 3) {
      throw new HumanHoloTestAccessError("TEST_SESSION_INVALID");
    }
    const unsignedToken = `${parts[0]}.${parts[1]}`;
    if (!safeEqualText(sign(unsignedToken), parts[2])) {
      throw new HumanHoloTestAccessError("TEST_SESSION_INVALID");
    }

    const header = parseBase64UrlJson(parts[0]);
    const payload = parseBase64UrlJson(parts[1]);
    if (
      header?.alg !== "HS256" ||
      header?.typ !== "HH-TEST" ||
      payload?.aud !== TOKEN_AUDIENCE ||
      payload?.pv !== profileVersion ||
      !Number.isSafeInteger(payload?.exp) ||
      payload.exp * 1000 <= clock()
    ) {
      throw new HumanHoloTestAccessError("TEST_SESSION_INVALID_OR_EXPIRED");
    }

    const profile = ensureActiveProfile(
      profilesById.get(clean(payload?.testerId).toLowerCase())
    );
    if (payload.sub !== profile.ownerId) {
      throw new HumanHoloTestAccessError("TEST_SESSION_SCOPE_MISMATCH", 403);
    }
    return publicIdentity(profile);
  }

  return Object.freeze({
    mode: HUMAN_HOLO_TEST_ACCESS_MODE,
    configuredTesterCount: profiles.length,
    identityDefinitions: Object.freeze(
      profiles.map(profile =>
        Object.freeze({
          speakerId: profile.speakerId,
          displayName: profile.displayName,
          canonicalOwnerId: profile.ownerId,
          speakerAliases: Object.freeze([]),
          ownerAliases: Object.freeze([])
        })
      )
    ),
    activate,
    authenticate,
    profileForOwner(ownerId) {
      const profile = profilesByOwner.get(clean(ownerId).toLowerCase());
      return profile ? publicIdentity(profile) : null;
    },
    status() {
      return Object.freeze({
        accessMode: HUMAN_HOLO_TEST_ACCESS_MODE,
        accessRequired: true,
        configured: profiles.length > 0,
        marketReleaseApproved: false,
        testerCountDisclosed: false
      });
    }
  });
}
