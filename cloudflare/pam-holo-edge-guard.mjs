const GUARD_NAME = "pam-holo-edge-guard";
const GUARD_VERSION = "staged-v2";
const DEFAULT_ORIGIN = "https://sol-holo.onrender.com";
const MAX_REQUEST_TARGET_LENGTH = 8 * 1024;
const MAX_DECLARED_BODY_BYTES = 20 * 1024 * 1024;

const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST", "OPTIONS"]);
const ALLOWED_BROWSER_ORIGINS = new Set([
  "https://sol-holo.onrender.com",
  "http://localhost",
  "https://localhost",
  "capacitor://localhost",
  "ionic://localhost"
]);
const PRIVATE_PATH_PREFIXES = Object.freeze([
  "/.git",
  "/.github",
  "/.sol-holo-private",
  "/android",
  "/android-native",
  "/data",
  "/docs",
  "/licenses",
  "/modules",
  "/node_modules",
  "/openclaw-lab",
  "/scripts",
  "/tests"
]);
const PRIVATE_EXACT_PATHS = new Set([
  "/.gitignore",
  "/capacitor.config.json",
  "/package-lock.json",
  "/package.json",
  "/server-vollzeit.mjs",
  "/server.mjs",
  "/sign.sh",
  "/video-upload-security.mjs",
  "/voice-id-test.mjs"
]);
const PRIVATE_FILE_SUFFIXES = Object.freeze([
  ".bak",
  ".db",
  ".gradle",
  ".java",
  ".jks",
  ".keystore",
  ".lock",
  ".markdown",
  ".md",
  ".p12",
  ".pem",
  ".properties",
  ".sh",
  ".sql",
  ".sqlite"
]);

function jsonResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "cache-control": "no-store, max-age=0",
      "content-type": "application/json; charset=utf-8",
      ...headers
    }
  });
}

function applyGuardHeaders(headers) {
  headers.set("x-pam-holo-edge-guard", GUARD_VERSION);
  headers.set("cache-control", "no-store, private, max-age=0");
  headers.set("cloudflare-cdn-cache-control", "no-store");
  headers.set(
    "content-security-policy",
    "base-uri 'self'; object-src 'none'; frame-ancestors 'none'"
  );
  headers.set("cross-origin-opener-policy", "same-origin");
  headers.set("origin-agent-cluster", "?1");
  headers.set(
    "permissions-policy",
    "camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=(), browsing-topics=()"
  );
  headers.set("referrer-policy", "no-referrer");
  headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-dns-prefetch-control", "off");
  headers.set("x-download-options", "noopen");
  headers.set("x-frame-options", "DENY");
  headers.set("x-permitted-cross-domain-policies", "none");
  headers.delete("x-powered-by");
  headers.delete("server");
  return headers;
}

function guardedJson(status, error, extraHeaders = {}) {
  const response = jsonResponse(status, { error }, extraHeaders);
  applyGuardHeaders(response.headers);
  return response;
}

function configuredOrigin(environment) {
  const raw = String(environment?.PAM_HOLO_ORIGIN_URL || DEFAULT_ORIGIN).trim();
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("invalid-origin-configuration");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("invalid-origin-configuration");
  }
  return url.origin;
}

function requestPath(url) {
  const target = `${url.pathname}${url.search}`;
  if (target.length > MAX_REQUEST_TARGET_LENGTH) {
    return { errorStatus: 414, pathname: "" };
  }
  const rawPath = url.pathname || "/";
  if (
    rawPath.includes("\\") ||
    /%(?:00|2e|2f|5c|25)/iu.test(rawPath)
  ) {
    return { errorStatus: 400, pathname: "" };
  }
  let pathname;
  try {
    pathname = decodeURIComponent(rawPath);
  } catch {
    return { errorStatus: 400, pathname: "" };
  }
  if (pathname.includes("\0") || pathname.split("/").includes("..")) {
    return { errorStatus: 400, pathname: "" };
  }
  return { errorStatus: 0, pathname };
}

export function isPrivateEdgePath(pathnameValue) {
  const pathname = String(pathnameValue || "/").toLowerCase();
  if (
    pathname
      .split("/")
      .filter(Boolean)
      .some((segment) => segment.startsWith("."))
  ) {
    return true;
  }
  if (PRIVATE_EXACT_PATHS.has(pathname)) return true;
  if (
    PRIVATE_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }
  return PRIVATE_FILE_SUFFIXES.some((suffix) => pathname.endsWith(suffix));
}

function browserOriginAllowed(request) {
  const origin = String(request.headers.get("origin") || "").trim();
  let requestOrigin = "";
  try {
    requestOrigin = new URL(request.url).origin;
  } catch {
    return false;
  }
  return !origin || origin === requestOrigin || ALLOWED_BROWSER_ORIGINS.has(origin);
}

function declaredBodyTooLarge(request) {
  const raw = String(request.headers.get("content-length") || "").trim();
  if (!raw) return false;
  if (!/^\d+$/u.test(raw)) return true;
  const length = Number(raw);
  return !Number.isSafeInteger(length) || length > MAX_DECLARED_BODY_BYTES;
}

async function boundedRequestBody(request) {
  if (request.method === "GET" || request.method === "HEAD" || !request.body) {
    return undefined;
  }
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_DECLARED_BODY_BYTES) {
      await reader.cancel("request-body-too-large");
      throw new RangeError("request-body-too-large");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function upstreamRequest(request, upstreamUrl, environment, body) {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.delete("forwarded");
  headers.delete("x-forwarded-for");
  headers.delete("x-real-ip");
  headers.delete("x-client-ip");
  headers.delete("true-client-ip");
  headers.delete("x-pam-holo-origin-guard");
  headers.delete("x-human-holo-origin-guard");
  headers.set("x-pam-holo-edge-guard", GUARD_VERSION);

  const secret = String(environment?.PAM_HOLO_ORIGIN_SECRET || "").trim();
  if (secret) headers.set("x-pam-holo-origin-guard", secret);

  const init = {
    method: request.method,
    headers,
    redirect: "manual"
  };
  if (body !== undefined) {
    init.body = body;
    init.duplex = "half";
  }
  return new Request(upstreamUrl, init);
}

export function createPamHoloEdgeGuard({ fetchImpl = fetch } = {}) {
  return async function handlePamHoloEdgeRequest(request, environment = {}) {
    let incomingUrl;
    try {
      incomingUrl = new URL(request.url);
    } catch {
      return guardedJson(400, "Ungültige Anfrageadresse.");
    }

    if (incomingUrl.pathname === "/edge-guard/status") {
      const response = jsonResponse(200, {
        stagingPathProtected: true,
        productionTrafficProtected: false,
        scope: ["Pam’s Holo"],
        serviceBoundary: "separate-from-human-holo",
        edgeGuard: GUARD_VERSION,
        deploymentStage: "separate-staging-worker",
        existingTrafficMigrated: false,
        renderOriginLocked: false
      });
      applyGuardHeaders(response.headers);
      return response;
    }

    const method = String(request.method || "GET").toUpperCase();
    if (!ALLOWED_METHODS.has(method)) {
      return guardedJson(405, "Anfragemethode nicht erlaubt.", {
        allow: [...ALLOWED_METHODS].join(", ")
      });
    }

    const pathResult = requestPath(incomingUrl);
    if (pathResult.errorStatus) {
      return guardedJson(
        pathResult.errorStatus,
        pathResult.errorStatus === 414
          ? "Anfrageadresse zu lang."
          : "Ungültige Anfrageadresse."
      );
    }
    if (isPrivateEdgePath(pathResult.pathname)) {
      return guardedJson(404, "Nicht gefunden.");
    }
    if (!browserOriginAllowed(request)) {
      return guardedJson(403, "Externe Herkunft nicht freigegeben.");
    }

    const encoding = String(request.headers.get("content-encoding") || "")
      .trim()
      .toLowerCase();
    if (encoding && encoding !== "identity") {
      return guardedJson(415, "Komprimierte Anfragekörper sind nicht freigegeben.");
    }
    if (declaredBodyTooLarge(request)) {
      return guardedJson(413, "Anfragekörper zu groß.");
    }

    const secretRequired =
      String(environment?.PAM_HOLO_ORIGIN_SECRET_REQUIRED || "") === "true";
    const secret = String(environment?.PAM_HOLO_ORIGIN_SECRET || "").trim();
    if (secretRequired && !secret) {
      return guardedJson(503, "Türsteher-Konfiguration unvollständig.");
    }

    let origin;
    try {
      origin = configuredOrigin(environment);
    } catch {
      return guardedJson(503, "Türsteher-Konfiguration unvollständig.");
    }
    const upstreamUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, origin);

    let body;
    try {
      body = await boundedRequestBody(request);
    } catch (error) {
      if (error instanceof RangeError && error.message === "request-body-too-large") {
        return guardedJson(413, "Anfragekörper zu groß.");
      }
      return guardedJson(400, "Anfragekörper konnte nicht sicher gelesen werden.");
    }

    let upstreamResponse;
    try {
      upstreamResponse = await fetchImpl(
        upstreamRequest(request, upstreamUrl, environment, body)
      );
    } catch {
      return guardedJson(502, "Geschützter Ursprung vorübergehend nicht erreichbar.");
    }

    const responseHeaders = applyGuardHeaders(
      new Headers(upstreamResponse.headers)
    );
    const requestOrigin = String(request.headers.get("origin") || "").trim();
    if (requestOrigin) {
      responseHeaders.set("access-control-allow-origin", requestOrigin);
      const vary = responseHeaders.get("vary");
      responseHeaders.set(
        "vary",
        vary ? `${vary}, Origin` : "Origin"
      );
    }
    const location = responseHeaders.get("location");
    if (location) {
      try {
        const redirectUrl = new URL(location, origin);
        if (redirectUrl.origin === origin) {
          redirectUrl.protocol = incomingUrl.protocol;
          redirectUrl.host = incomingUrl.host;
          responseHeaders.set("location", redirectUrl.toString());
        }
      } catch {
        responseHeaders.delete("location");
      }
    }
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders
    });
  };
}

const handlePamHoloEdgeRequest = createPamHoloEdgeGuard();

export default {
  fetch(request, environment) {
    return handlePamHoloEdgeRequest(request, environment);
  }
};

export const PAM_HOLO_EDGE_GUARD = Object.freeze({
  name: GUARD_NAME,
  version: GUARD_VERSION,
  defaultOrigin: DEFAULT_ORIGIN,
  maxDeclaredBodyBytes: MAX_DECLARED_BODY_BYTES
});
