export const HUMAN_HOLO_SERVICE_ID = "human-holo";
export const HUMAN_HOLO_DATABASE_BOUNDARY =
  "human-holo-dedicated-v1";
export const HUMAN_HOLO_REQUIRED_ACCESS_MODE =
  "invite-only-test";
export const PAM_HOLO_PROTECTED_BACKEND_ORIGIN =
  "https://sol-holo.onrender.com";

function clean(value) {
  return String(value || "").trim();
}

function parseDatabaseName(connectionString) {
  try {
    return decodeURIComponent(
      new URL(connectionString).pathname.replace(/^\/+/, "")
    );
  } catch {
    return "";
  }
}

function parsePublicBaseUrl(value) {
  try {
    const url = new URL(value);
    const localDevelopment =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1";

    if (url.protocol !== "https:" && !localDevelopment) {
      return null;
    }
    if (url.username || url.password || url.search || url.hash) {
      return null;
    }

    return Object.freeze({
      baseUrl: url.origin + url.pathname.replace(/\/+$/, ""),
      origin: url.origin,
      localDevelopment
    });
  } catch {
    return null;
  }
}

function callbackMatchesPublicBase(value, publicBaseUrl, expectedPath) {
  const configured = clean(value);
  if (!configured) return true;

  try {
    const url = new URL(configured);
    return (
      url.toString() ===
      new URL(expectedPath, `${publicBaseUrl}/`).toString()
    );
  } catch {
    return false;
  }
}

export function inspectHumanHoloDeploymentBoundary(environment = {}) {
  const serviceId = clean(environment.HUMAN_HOLO_SERVICE_ID);
  const databaseBoundary = clean(
    environment.HUMAN_HOLO_DATABASE_BOUNDARY
  );
  const separateDatabaseConfirmed =
    clean(environment.HUMAN_HOLO_SEPARATE_DATABASE_CONFIRMED)
      .toLowerCase() === "true";
  const databaseUrl = clean(environment.DATABASE_URL);
  const expectedDatabaseName = clean(
    environment.HUMAN_HOLO_EXPECTED_DATABASE_NAME
  );
  const actualDatabaseName = parseDatabaseName(databaseUrl);
  const publicBase = parsePublicBaseUrl(
    clean(environment.HUMAN_HOLO_PUBLIC_BASE_URL)
  );
  const accessMode = clean(environment.HUMAN_HOLO_ACCESS_MODE);
  const testSessionSecret = clean(
    environment.HUMAN_HOLO_TEST_SESSION_SECRET
  );
  let testerProfilesValid = false;
  try {
    const testerProfiles = JSON.parse(
      clean(environment.HUMAN_HOLO_TESTER_PROFILES_JSON) || "[]"
    );
    testerProfilesValid =
      Array.isArray(testerProfiles) && testerProfiles.length > 0;
  } catch {}
  const errors = [];

  if (serviceId !== HUMAN_HOLO_SERVICE_ID) {
    errors.push("HUMAN_HOLO_SERVICE_ID_MISMATCH");
  }
  if (databaseBoundary !== HUMAN_HOLO_DATABASE_BOUNDARY) {
    errors.push("HUMAN_HOLO_DATABASE_BOUNDARY_MISMATCH");
  }
  if (!separateDatabaseConfirmed) {
    errors.push("SEPARATE_DATABASE_NOT_CONFIRMED");
  }
  if (!databaseUrl || !actualDatabaseName) {
    errors.push("DATABASE_URL_MISSING_OR_INVALID");
  }
  if (!expectedDatabaseName) {
    errors.push("EXPECTED_DATABASE_NAME_MISSING");
  } else if (actualDatabaseName !== expectedDatabaseName) {
    errors.push("DATABASE_NAME_MISMATCH");
  }
  if (
    expectedDatabaseName &&
    !/human[_-]?holo/i.test(expectedDatabaseName)
  ) {
    errors.push("DATABASE_NAME_NOT_HUMAN_HOLO_SCOPED");
  }
  if (accessMode !== HUMAN_HOLO_REQUIRED_ACCESS_MODE) {
    errors.push("TEST_ACCESS_MODE_MISMATCH");
  }
  if (Buffer.byteLength(testSessionSecret, "utf8") < 32) {
    errors.push("TEST_SESSION_SECRET_MISSING_OR_SHORT");
  }
  if (!testerProfilesValid) {
    errors.push("TESTER_PROFILES_MISSING_OR_INVALID");
  }
  if (!publicBase) {
    errors.push("PUBLIC_BASE_URL_MISSING_OR_INVALID");
  } else if (
    publicBase.origin === PAM_HOLO_PROTECTED_BACKEND_ORIGIN
  ) {
    errors.push("PAM_HOLO_BACKEND_FORBIDDEN");
  }
  if (
    publicBase &&
    !callbackMatchesPublicBase(
      environment.GOOGLE_REDIRECT_URI,
      publicBase.baseUrl,
      "auth/google/callback"
    )
  ) {
    errors.push("GOOGLE_REDIRECT_URI_OUTSIDE_HUMAN_HOLO");
  }
  if (
    publicBase &&
    !callbackMatchesPublicBase(
      environment.SMARTTHINGS_REDIRECT_URI,
      publicBase.baseUrl,
      "auth/smartthings/callback"
    )
  ) {
    errors.push("SMARTTHINGS_REDIRECT_URI_OUTSIDE_HUMAN_HOLO");
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    serviceId,
    databaseBoundary,
    separateDatabaseConfirmed,
    expectedDatabaseName,
    actualDatabaseName,
    accessMode,
    testerProfilesConfigured: testerProfilesValid,
    publicBaseUrl: publicBase?.baseUrl || "",
    publicOrigin: publicBase?.origin || "",
    localDevelopment: publicBase?.localDevelopment === true
  });
}

export function requireHumanHoloDeploymentBoundary(environment = {}) {
  const result = inspectHumanHoloDeploymentBoundary(environment);
  if (!result.ok) {
    throw new Error(
      "[HUMAN_HOLO_DEPLOYMENT_BLOCKED] " +
        result.errors.join(",")
    );
  }
  return result;
}
