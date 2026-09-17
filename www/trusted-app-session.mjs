const OWNER_ID = "pam-sol";
const SESSION_HEADER = "x-sol-holo-trusted-session";
const ACCESS_LEVEL = Object.freeze({
  OWNER_EVERYDAY: "owner_everyday",
  PROTECTED: "protected_media_documents_settings"
});
const SESSION_ACTION = Object.freeze({
  [ACCESS_LEVEL.OWNER_EVERYDAY]: "bind_owner_everyday_session",
  [ACCESS_LEVEL.PROTECTED]: "bind_trusted_app_session"
});
const OWNER_PERSON_PROOF = Object.freeze({
  [ACCESS_LEVEL.OWNER_EVERYDAY]: "pam_registered_owner_device_everyday_v1",
  [ACCESS_LEVEL.PROTECTED]: "pam_voice_or_registered_watch_v1"
});
const RETRYABLE_CHALLENGE_ERRORS = new Set([
  "TRUSTED_SESSION_CHALLENGE_INVALID",
  "TRUSTED_SESSION_CHALLENGE_EXPIRED"
]);

const sessions = {
  [ACCESS_LEVEL.OWNER_EVERYDAY]: {
    token: "",
    expiresAtMillis: 0
  },
  [ACCESS_LEVEL.PROTECTED]: {
    token: "",
    expiresAtMillis: 0
  }
};
let ensurePromise = null;
let ensurePromiseAccessLevel = "";
let ensurePromiseAuthorizationId = "";
let sessionGeneration = 0;

class TrustedSessionClientError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "TrustedSessionClientError";
    this.code = code;
    this.status = status;
  }
}

function selectedIdentity() {
  const identity = window.SolHoloIdentity?.selected?.();
  return identity?.ownerId === OWNER_ID ? identity : null;
}

function securityPlugin() {
  return window.Capacitor?.Plugins?.SolAccessSecurity || null;
}

function normalizedAccessLevel(value, fallback = ACCESS_LEVEL.PROTECTED) {
  return Object.values(ACCESS_LEVEL).includes(value) ? value : fallback;
}

function exactSessionIsFresh(accessLevel) {
  const state = sessions[normalizedAccessLevel(accessLevel)];
  return Boolean(
    state?.token &&
    state.expiresAtMillis > Date.now() + 15_000
  );
}

function sessionIsFresh(minimumAccess = ACCESS_LEVEL.OWNER_EVERYDAY) {
  const required = normalizedAccessLevel(
    minimumAccess,
    ACCESS_LEVEL.OWNER_EVERYDAY
  );
  if (required === ACCESS_LEVEL.PROTECTED) {
    return exactSessionIsFresh(ACCESS_LEVEL.PROTECTED);
  }
  return exactSessionIsFresh(ACCESS_LEVEL.PROTECTED) ||
    exactSessionIsFresh(ACCESS_LEVEL.OWNER_EVERYDAY);
}

function selectedSession(minimumAccess = ACCESS_LEVEL.OWNER_EVERYDAY) {
  if (exactSessionIsFresh(ACCESS_LEVEL.PROTECTED)) {
    return sessions[ACCESS_LEVEL.PROTECTED];
  }
  if (
    minimumAccess !== ACCESS_LEVEL.PROTECTED &&
    exactSessionIsFresh(ACCESS_LEVEL.OWNER_EVERYDAY)
  ) {
    return sessions[ACCESS_LEVEL.OWNER_EVERYDAY];
  }
  return null;
}

export function trustedAppSessionHeaders({
  minimumAccess = ACCESS_LEVEL.OWNER_EVERYDAY
} = {}) {
  const session = selectedSession(minimumAccess);
  return session
    ? { [SESSION_HEADER]: session.token }
    : {};
}

async function postJson(
  path,
  body,
  {
    includeSession = false,
    minimumAccess = ACCESS_LEVEL.OWNER_EVERYDAY
  } = {}
) {
  const apiRequest = window.PamHoloNetwork?.apiRequest;
  if (typeof apiRequest !== "function") {
    throw new TrustedSessionClientError(
      "PAM_HOLO_EDGE_GUARD_UNAVAILABLE",
      "Der geschützte Pam-Holo-Türsteher ist nicht verfügbar. Es wurden keine persönlichen Daten übertragen."
    );
  }
  const response = await apiRequest(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(includeSession
        ? trustedAppSessionHeaders({ minimumAccess })
        : {})
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!response.ok) {
    throw new TrustedSessionClientError(
      String(data?.error || "TRUSTED_SESSION_REQUEST_FAILED"),
      String(
        data?.message ||
        "Die sichere App-Sitzung konnte nicht hergestellt werden."
      ),
      response.status
    );
  }
  return data;
}

function identityBody(identity) {
  return {
    ownerId: identity.ownerId,
    selectedSpeakerId: identity.speakerId
  };
}

async function registeredDevice(plugin) {
  const device = await plugin.getTrustedSessionDevice({
    ownerId: OWNER_ID
  });
  if (
    device?.ownerId !== OWNER_ID ||
    device?.packageName !== "com.solholo.app" ||
    device?.hardwareBacked !== true ||
    !device?.registrationId
  ) {
    throw new TrustedSessionClientError(
      "TRUSTED_SESSION_DEVICE_INVALID",
      "Die lokale S23-Geräteregistrierung ist nicht vollständig."
    );
  }
  return device;
}

async function requestChallenge(identity, device, accessLevel) {
  const normalized = normalizedAccessLevel(accessLevel);
  return postJson(
    "/app-session/challenge",
    {
      ...identityBody(identity),
      registrationId: device.registrationId,
      accessLevel: normalized
    },
    {
      includeSession: normalized === ACCESS_LEVEL.PROTECTED,
      minimumAccess: ACCESS_LEVEL.OWNER_EVERYDAY
    }
  );
}

async function freshAuthorization(
  plugin,
  { accessLevel }
) {
  const normalized = normalizedAccessLevel(accessLevel);
  let grant;
  if (normalized === ACCESS_LEVEL.OWNER_EVERYDAY) {
    grant = await plugin.authorizeOwnerEverydayAccess({
      ownerId: OWNER_ID
    });
  } else {
    if (!sessionIsFresh(ACCESS_LEVEL.OWNER_EVERYDAY)) {
      throw new TrustedSessionClientError(
        "OWNER_EVERYDAY_SESSION_REQUIRED",
        "Vor dem Fingerprint muss Pams gerätegebundene Alltagssitzung bereit sein."
      );
    }
    grant = await plugin.authorizeCriticalAction({
      ownerId: OWNER_ID,
      action: SESSION_ACTION[ACCESS_LEVEL.PROTECTED],
      requireRegisteredWatch: false
    });
  }
  if (
    grant?.allowed !== true ||
    grant?.ownerId !== OWNER_ID ||
    grant?.action !== SESSION_ACTION[normalized] ||
    !grant?.authorizationId
  ) {
    throw new TrustedSessionClientError(
      "TRUSTED_SESSION_AUTHORIZATION_INVALID",
      "Android hat die sichere Sitzungsfreigabe nicht bestätigt."
    );
  }
  return grant.authorizationId;
}

function challengeForNative(challenge, accessLevel) {
  const normalized = normalizedAccessLevel(accessLevel);
  const issuedAtMillis = Number(challenge?.issuedAtMillis);
  const expiresAtMillis = Number(challenge?.expiresAtMillis);
  if (
    !Number.isSafeInteger(issuedAtMillis) ||
    !Number.isSafeInteger(expiresAtMillis) ||
    issuedAtMillis <= 0 ||
    expiresAtMillis <= issuedAtMillis
  ) {
    throw new TrustedSessionClientError(
      "TRUSTED_SESSION_CHALLENGE_INVALID",
      "Die neue Server-Challenge für die sichere App-Sitzung ist ungültig."
    );
  }
  if (
    challenge?.accessLevel !== normalized ||
    challenge?.action !== SESSION_ACTION[normalized] ||
    challenge?.ownerPersonProof !== OWNER_PERSON_PROOF[normalized]
  ) {
    throw new TrustedSessionClientError(
      "TRUSTED_SESSION_PERSON_PROOF_INVALID",
      "Die persönliche Schutzanforderung der Server-Challenge ist ungültig."
    );
  }

  // Decimal strings cross the Capacitor bridge without Android turning an
  // epoch-millisecond value into a different numeric wrapper or precision.
  return {
    ...challenge,
    issuedAtMillis: String(issuedAtMillis),
    expiresAtMillis: String(expiresAtMillis)
  };
}

function isRetryableChallengeError(error) {
  return Boolean(
    RETRYABLE_CHALLENGE_ERRORS.has(String(error?.code || "")) ||
    Number(error?.status) === 410
  );
}

async function completeChallenge({
  identity,
  device,
  challenge,
  authorizationId,
  plugin,
  accessLevel
}) {
  const normalized = normalizedAccessLevel(accessLevel);
  const expectedGeneration = sessionGeneration;
  const signed = await plugin.signTrustedSessionChallenge({
    ...challengeForNative(challenge, normalized),
    ownerId: identity.ownerId,
    registrationId: device.registrationId,
    authorizationId
  });
  if (
    signed?.ok !== true ||
    signed?.ownerId !== identity.ownerId ||
    signed?.registrationId !== device.registrationId ||
    signed?.challengeId !== challenge.challengeId ||
    !signed?.signatureBase64Url
  ) {
    throw new TrustedSessionClientError(
      "TRUSTED_SESSION_SIGNATURE_INVALID",
      "Der registrierte Geräteschlüssel hat keine gültige Antwort geliefert."
    );
  }

  const session = await postJson("/app-session/complete", {
    ...identityBody(identity),
    registrationId: device.registrationId,
    challengeId: challenge.challengeId,
    signatureBase64Url: signed.signatureBase64Url
  });
  if (
    session?.trusted !== true ||
    session?.ownerId !== identity.ownerId ||
    session?.accessLevel !== normalized ||
    session?.ownerPersonProof !== OWNER_PERSON_PROOF[normalized] ||
    !session?.sessionToken ||
    !Number.isFinite(Number(session?.expiresAtMillis))
  ) {
    throw new TrustedSessionClientError(
      "TRUSTED_SESSION_RESPONSE_INVALID",
      "Das Backend hat die sichere App-Sitzung nicht bestätigt."
    );
  }
  if (
    expectedGeneration !== sessionGeneration ||
    document.visibilityState === "hidden"
  ) {
    return { trusted: false, discardedAfterLock: true };
  }
  sessions[normalized].token = String(session.sessionToken);
  sessions[normalized].expiresAtMillis = Number(session.expiresAtMillis);
  window.dispatchEvent(new CustomEvent("solholo:trusted-session", {
    detail: {
      trusted: true,
      accessLevel: normalized,
      expiresAtMillis: sessions[normalized].expiresAtMillis
    }
  }));
  return {
    trusted: true,
    accessLevel: normalized,
    expiresAtMillis: sessions[normalized].expiresAtMillis
  };
}

function openOwnerProof(authUrl) {
  const authWindow = window.open(authUrl, "_blank");
  if (!authWindow) {
    throw new TrustedSessionClientError(
      "GOOGLE_OWNER_PROOF_WINDOW_BLOCKED",
      "Die Google-Bestätigung konnte nicht geöffnet werden."
    );
  }
  try {
    authWindow.opener = null;
  } catch {}
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function bootstrapDevice(identity, device) {
  const start = await postJson("/app-session/bootstrap/start", {
    ...identityBody(identity),
    device
  });
  if (!start?.attemptId || !start?.authUrl) {
    throw new TrustedSessionClientError(
      "TRUSTED_SESSION_BOOTSTRAP_INVALID",
      "Die einmalige S23-Bestätigung konnte nicht gestartet werden."
    );
  }
  openOwnerProof(start.authUrl);

  const deadline = Math.min(
    Number(start.expiresAtMillis) || Date.now() + 10 * 60_000,
    Date.now() + 10 * 60_000
  );
  while (Date.now() < deadline) {
    await wait(1_500);
    const status = await postJson("/app-session/bootstrap/status", {
      ...identityBody(identity),
      attemptId: start.attemptId,
      registrationId: device.registrationId
    });
    if (status?.status === "authorized" && status?.registered === true) {
      return;
    }
    if (status?.status === "failed" || status?.status === "expired") {
      throw new TrustedSessionClientError(
        String(status?.error || "TRUSTED_SESSION_BOOTSTRAP_FAILED"),
        String(
          status?.message ||
          "Die einmalige S23-Bestätigung wurde nicht abgeschlossen."
        )
      );
    }
  }
  throw new TrustedSessionClientError(
    "TRUSTED_SESSION_BOOTSTRAP_EXPIRED",
    "Die einmalige S23-Bestätigung ist abgelaufen."
  );
}

async function establishTrustedAppSession({
  interactive = false,
  accessLevel = ACCESS_LEVEL.PROTECTED,
  allowBootstrap = true,
  authorizationId = "",
  authorizationExpiresAtMillis = 0
} = {}) {
  const normalized = normalizedAccessLevel(accessLevel);
  if (sessionIsFresh(normalized)) {
    const session = selectedSession(normalized);
    return {
      trusted: true,
      accessLevel: normalized,
      expiresAtMillis: session.expiresAtMillis
    };
  }
  const identity = selectedIdentity();
  const plugin = securityPlugin();
  if (!identity || !plugin) {
    return { trusted: false, unavailable: true };
  }
  const device = await registeredDevice(plugin);
  if (
    normalized === ACCESS_LEVEL.PROTECTED &&
    !sessionIsFresh(ACCESS_LEVEL.OWNER_EVERYDAY)
  ) {
    return {
      trusted: false,
      needsOwnerEverydaySession: true,
      accessLevel: normalized
    };
  }
  if (!authorizationId) {
    if (!interactive) {
      return {
        trusted: false,
        needsAuthorization: true,
        accessLevel: normalized
      };
    }
    authorizationId = await freshAuthorization(plugin, {
      accessLevel: normalized
    });
  }

  let bootstrapPerformed = false;
  let challengeRetryCount = 0;
  while (true) {
    try {
      // A challenge is deliberately requested only after a usable Android
      // authorization exists. It is kept inside this single attempt and can
      // therefore never be replayed from an earlier click or app unlock.
      const challenge = await requestChallenge(
        identity,
        device,
        normalized
      );
      return await completeChallenge({
        identity,
        device,
        challenge,
        authorizationId,
        plugin,
        accessLevel: normalized
      });
    } catch (error) {
      if (
        error?.code === "TRUSTED_SESSION_DEVICE_NOT_BOUND" &&
        !bootstrapPerformed
      ) {
        if (!interactive || !allowBootstrap) {
          return { trusted: false, needsBootstrap: true };
        }
        bootstrapPerformed = true;
        await bootstrapDevice(identity, device);
        // The bootstrap may outlive the short one-time grant. Issue a new
        // owner-everyday capability after the confirmed binding instead of
        // replaying or trusting the earlier grant.
        authorizationId = await freshAuthorization(plugin, {
          accessLevel: normalized
        });
        continue;
      }

      if (
        normalized === ACCESS_LEVEL.PROTECTED &&
        interactive &&
        challengeRetryCount === 0 &&
        isRetryableChallengeError(error)
      ) {
        challengeRetryCount += 1;
        // The failed attempt and its one-time grant are never reused. Android
        // confirms a new grant first; only then is a new challenge requested.
        authorizationId = await freshAuthorization(plugin, {
          accessLevel: normalized
        });
        continue;
      }
      throw error;
    }
  }
}

export async function ensureTrustedAppSession(options = {}) {
  const accessLevel = normalizedAccessLevel(options?.accessLevel);
  const suppliedAuthorizationId = String(
    options?.authorizationId || ""
  ).trim();
  const suppliedAuthorizationExpiresAtMillis = Number(
    options?.authorizationExpiresAtMillis || 0
  );
  if (sessionIsFresh(accessLevel)) {
    const session = selectedSession(accessLevel);
    return {
      trusted: true,
      accessLevel,
      expiresAtMillis: session.expiresAtMillis
    };
  }
  if (ensurePromise) {
    const waitingForAccessLevel = ensurePromiseAccessLevel;
    const waitingForAuthorizationId = ensurePromiseAuthorizationId;
    const existingResult = await ensurePromise;
    if (sessionIsFresh(accessLevel)) {
      return ensureTrustedAppSession({ ...options, interactive: false });
    }
    if (
      suppliedAuthorizationId &&
      suppliedAuthorizationId !== waitingForAuthorizationId &&
      suppliedAuthorizationExpiresAtMillis > Date.now()
    ) {
      // The app-start history check can already be running when Android
      // returns the one-time everyday grant from the successful fingerprint.
      // That earlier check never received this grant, so retry it immediately
      // instead of dropping the capability and leaving the visible app shell
      // without chat, voice, memories or services.
      return ensureTrustedAppSession({
        ...options,
        authorizationId: suppliedAuthorizationId,
        authorizationExpiresAtMillis:
          suppliedAuthorizationExpiresAtMillis
      });
    }
    if (
      waitingForAccessLevel === accessLevel &&
      options?.interactive !== true
    ) {
      return existingResult;
    }
    // A user-initiated write or voice request must retry after a noninteractive
    // background refresh failed; it must never inherit that silent failure.
    return ensureTrustedAppSession({
      ...options,
      authorizationId: "",
      authorizationExpiresAtMillis: 0
    });
  }
  ensurePromiseAccessLevel = accessLevel;
  ensurePromiseAuthorizationId = suppliedAuthorizationId;
  ensurePromise = establishTrustedAppSession({
    ...options,
    accessLevel
  })
    .catch((error) => {
      if (options?.interactive) throw error;
      console.info(
        "Sichere App-Sitzung noch nicht aktiv:",
        error?.code || error?.name || "unbekannt"
      );
      return { trusted: false, error: error?.code || "unavailable" };
    })
    .finally(() => {
      ensurePromise = null;
      ensurePromiseAccessLevel = "";
      ensurePromiseAuthorizationId = "";
    });
  return ensurePromise;
}

export function clearTrustedAppSession() {
  sessionGeneration += 1;
  for (const session of Object.values(sessions)) {
    session.token = "";
    session.expiresAtMillis = 0;
  }
  ensurePromiseAuthorizationId = "";
}

window.SolHoloTrustedSession = Object.freeze({
  ensure: ensureTrustedAppSession,
  ensureProtected: (options = {}) => ensureTrustedAppSession({
    ...options,
    accessLevel: ACCESS_LEVEL.PROTECTED,
    interactive: options?.interactive !== false
  }),
  headers: trustedAppSessionHeaders,
  clear: clearTrustedAppSession,
  accessLevels: ACCESS_LEVEL,
  hasAccess: (accessLevel) => sessionIsFresh(accessLevel),
  status: () => ({
    trusted: sessionIsFresh(ACCESS_LEVEL.OWNER_EVERYDAY),
    ownerEveryday: exactSessionIsFresh(ACCESS_LEVEL.OWNER_EVERYDAY),
    protected: exactSessionIsFresh(ACCESS_LEVEL.PROTECTED),
    ownerEverydayExpiresAtMillis:
      sessions[ACCESS_LEVEL.OWNER_EVERYDAY].expiresAtMillis,
    protectedExpiresAtMillis:
      sessions[ACCESS_LEVEL.PROTECTED].expiresAtMillis
  })
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    clearTrustedAppSession();
  }
});
