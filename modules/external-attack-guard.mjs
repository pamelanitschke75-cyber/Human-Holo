import { createHash, timingSafeEqual } from "node:crypto";

const DEFAULT_ALLOWED_ORIGINS = Object.freeze([
  "https://sol-holo.onrender.com",
  "http://localhost",
  "https://localhost",
  "capacitor://localhost",
  "ionic://localhost"
]);

const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST", "OPTIONS"]);
const ALLOWED_REQUEST_HEADERS = Object.freeze([
  "Authorization",
  "Content-Type",
  "X-Sol-Holo-Trusted-Session",
  "X-Sol-Child-Safety-Context",
  "X-Sol-Child-Safety-Risk",
  "X-Sol-Video-Confirmation",
  "X-Sol-Video-Duration",
  "X-Voice-Setup-Secret"
]);
const EXPOSED_RESPONSE_HEADERS = Object.freeze([
  "X-Human-Holo-Guard",
  "RateLimit-Limit",
  "RateLimit-Remaining",
  "RateLimit-Reset",
  "Retry-After"
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
const SENSITIVE_API_PREFIXES = Object.freeze([
  "/animal-holos/",
  "/calendar/action",
  "/fulltime/",
  "/gmail/action",
  "/google/",
  "/live/",
  "/memory/",
  "/openclaw/",
  "/personal-clone/calls/",
  "/realtime/",
  "/sol",
  "/smartthings/",
  "/voice/"
]);
const SESSION_API_PREFIX = "/app-session/";
const PUBLIC_HEALTH_PATHS = new Set([
  "/health/live",
  "/health/ready"
]);
const MAX_REQUEST_TARGET_LENGTH = 8 * 1024;
const MAX_BUCKETS = 10_000;

const DEFAULT_LIMITS = Object.freeze({
  session: Object.freeze({ maximum: 60, windowMillis: 5 * 60 * 1000 }),
  sensitive: Object.freeze({ maximum: 90, windowMillis: 60 * 1000 }),
  general: Object.freeze({ maximum: 240, windowMillis: 60 * 1000 })
});

function header(req, name) {
  if (typeof req?.get === "function") {
    return String(req.get(name) || "");
  }
  return String(req?.headers?.[name.toLowerCase()] || "");
}

function normalizeConfiguredOrigin(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new Error("HOLO_ALLOWED_ORIGINS enthält eine ungültige Herkunft.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "Zusätzliche Human-Holo-Herkünfte müssen vollständige HTTPS-Origins sein."
    );
  }
  return url.origin;
}

export function humanHoloAllowedOrigins(environment = process.env) {
  const allowed = new Set(DEFAULT_ALLOWED_ORIGINS);
  const renderOrigin = String(environment.RENDER_EXTERNAL_URL || "").trim();
  if (renderOrigin) {
    allowed.add(normalizeConfiguredOrigin(renderOrigin));
  }
  for (const value of String(environment.HOLO_ALLOWED_ORIGINS || "").split(",")) {
    const origin = normalizeConfiguredOrigin(value);
    if (origin) allowed.add(origin);
  }
  return allowed;
}

function requestPath(req) {
  const rawTarget = String(req?.originalUrl || req?.url || "/");
  if (rawTarget.length > MAX_REQUEST_TARGET_LENGTH) {
    return { errorStatus: 414, rawTarget, pathname: "" };
  }
  const rawPath = rawTarget.split("?", 1)[0] || "/";
  if (
    rawPath.includes("\\") ||
    /%(?:00|2e|2f|5c|25)/iu.test(rawPath)
  ) {
    return { errorStatus: 400, rawTarget, pathname: "" };
  }
  let pathname;
  try {
    pathname = decodeURIComponent(rawPath);
  } catch {
    return { errorStatus: 400, rawTarget, pathname: "" };
  }
  if (pathname.includes("\0") || pathname.split("/").includes("..")) {
    return { errorStatus: 400, rawTarget, pathname: "" };
  }
  return { errorStatus: 0, rawTarget, pathname };
}

function configuredOriginSecret(environment) {
  return String(environment.PAM_HOLO_ORIGIN_SECRET || "").trim();
}

function originSecretRequired(environment) {
  return String(environment.PAM_HOLO_ORIGIN_SECRET_REQUIRED || "") === "true";
}

function secretsMatch(receivedValue, expectedValue) {
  const received = Buffer.from(String(receivedValue || ""), "utf8");
  const expected = Buffer.from(String(expectedValue || ""), "utf8");
  return (
    received.length > 0 &&
    received.length === expected.length &&
    timingSafeEqual(received, expected)
  );
}

export function isPrivateProjectPath(pathnameValue) {
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

function requestClass(pathname) {
  if (pathname.startsWith(SESSION_API_PREFIX)) return "session";
  if (
    SENSITIVE_API_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix)
    )
  ) {
    return "sensitive";
  }
  return "general";
}

function safeLimit(value, fallback) {
  const maximum = Number(value?.maximum);
  const windowMillis = Number(value?.windowMillis);
  if (
    Number.isSafeInteger(maximum) &&
    maximum > 0 &&
    maximum <= 10_000 &&
    Number.isSafeInteger(windowMillis) &&
    windowMillis >= 1_000 &&
    windowMillis <= 24 * 60 * 60 * 1000
  ) {
    return Object.freeze({ maximum, windowMillis });
  }
  return fallback;
}

function clientKey(req) {
  const address = String(
    req?.ip || req?.socket?.remoteAddress || "unresolved-client"
  );
  return createHash("sha256").update(address, "utf8").digest("hex");
}

function setSecurityHeaders(res) {
  res.setHeader("X-Human-Holo-Guard", "active-v1");
  res.setHeader(
    "Content-Security-Policy",
    "base-uri 'self'; object-src 'none'; frame-ancestors 'none'"
  );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Origin-Agent-Cluster", "?1");
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=(), browsing-topics=()"
  );
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
}

function endJson(res, status, error) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(JSON.stringify({ error }));
}

export function createExternalAttackGuard({
  environment = process.env,
  now = () => Date.now(),
  limits = {}
} = {}) {
  const allowedOrigins = humanHoloAllowedOrigins(environment);
  const rateLimits = Object.freeze({
    session: safeLimit(limits.session, DEFAULT_LIMITS.session),
    sensitive: safeLimit(limits.sensitive, DEFAULT_LIMITS.sensitive),
    general: safeLimit(limits.general, DEFAULT_LIMITS.general)
  });
  const buckets = new Map();
  let lastCleanupMillis = 0;
  const expectedOriginSecret = configuredOriginSecret(environment);
  const requireOriginSecret = originSecretRequired(environment);

  function originAllowed(originValue) {
    const origin = String(originValue || "").trim();
    return !origin || allowedOrigins.has(origin);
  }

  function cleanBuckets(currentMillis) {
    if (
      currentMillis - lastCleanupMillis < 60_000 &&
      buckets.size <= MAX_BUCKETS
    ) {
      return;
    }
    lastCleanupMillis = currentMillis;
    for (const [key, bucket] of buckets) {
      if (bucket.resetAtMillis <= currentMillis) buckets.delete(key);
    }
    while (buckets.size > MAX_BUCKETS) {
      buckets.delete(buckets.keys().next().value);
    }
  }

  function applyRateLimit(req, res, pathname) {
    if (String(req.method || "GET").toUpperCase() === "OPTIONS") return true;
    const currentMillis = now();
    cleanBuckets(currentMillis);
    const category = requestClass(pathname);
    const limit = rateLimits[category];
    const key = `${category}:${clientKey(req)}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAtMillis <= currentMillis) {
      bucket = {
        count: 0,
        resetAtMillis: currentMillis + limit.windowMillis
      };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    const remaining = Math.max(0, limit.maximum - bucket.count);
    const resetSeconds = Math.max(
      1,
      Math.ceil((bucket.resetAtMillis - currentMillis) / 1000)
    );
    res.setHeader("RateLimit-Limit", String(limit.maximum));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(resetSeconds));
    if (bucket.count <= limit.maximum) return true;
    res.setHeader("Retry-After", String(resetSeconds));
    endJson(res, 429, "Zu viele Anfragen. Bitte später erneut versuchen.");
    return false;
  }

  function middleware(req, res, next) {
    setSecurityHeaders(res);
    const method = String(req.method || "GET").toUpperCase();
    if (!ALLOWED_METHODS.has(method)) {
      res.setHeader("Allow", [...ALLOWED_METHODS].join(", "));
      endJson(res, 405, "Anfragemethode nicht erlaubt.");
      return;
    }

    const pathResult = requestPath(req);
    if (pathResult.errorStatus) {
      endJson(
        res,
        pathResult.errorStatus,
        pathResult.errorStatus === 414
          ? "Anfrageadresse zu lang."
          : "Ungültige Anfrageadresse."
      );
      return;
    }
    if (isPrivateProjectPath(pathResult.pathname)) {
      endJson(res, 404, "Nicht gefunden.");
      return;
    }

    const publicHealthCheck =
      (method === "GET" || method === "HEAD") &&
      PUBLIC_HEALTH_PATHS.has(
        pathResult.pathname
      );

    if (requireOriginSecret && !publicHealthCheck) {
      if (!expectedOriginSecret) {
        endJson(res, 503, "Ursprungsschutz ist nicht vollständig konfiguriert.");
        return;
      }
      if (!secretsMatch(header(req, "X-Pam-Holo-Origin-Guard"), expectedOriginSecret)) {
        endJson(res, 403, "Direkter Ursprungszugriff ist nicht freigegeben.");
        return;
      }
    }

    const origin = header(req, "Origin");
    if (!originAllowed(origin)) {
      endJson(res, 403, "Externe Herkunft nicht freigegeben.");
      return;
    }

    const contentEncoding = header(req, "Content-Encoding")
      .trim()
      .toLowerCase();
    if (contentEncoding && contentEncoding !== "identity") {
      endJson(res, 415, "Komprimierte Anfragekörper sind nicht freigegeben.");
      return;
    }

    if (!applyRateLimit(req, res, pathResult.pathname)) return;
    next();
  }

  const corsOptions = Object.freeze({
    origin(origin, callback) {
      callback(null, originAllowed(origin));
    },
    methods: [...ALLOWED_METHODS],
    allowedHeaders: [...ALLOWED_REQUEST_HEADERS],
    exposedHeaders: [...EXPOSED_RESPONSE_HEADERS],
    credentials: false,
    maxAge: 600,
    optionsSuccessStatus: 204
  });

  const configuredTrustProxyHops = Number(environment.HOLO_TRUST_PROXY_HOPS);
  const trustProxyHops = Number.isSafeInteger(configuredTrustProxyHops) &&
    configuredTrustProxyHops >= 0 &&
    configuredTrustProxyHops <= 3
    ? configuredTrustProxyHops
    : environment.RENDER_EXTERNAL_URL
      ? 1
      : 0;

  return Object.freeze({
    allowedOrigins: Object.freeze([...allowedOrigins]),
    corsOptions,
    middleware,
    originSecretRequired: requireOriginSecret,
    originSecretConfigured: requireOriginSecret && Boolean(expectedOriginSecret),
    originAllowed,
    trustProxyHops
  });
}
