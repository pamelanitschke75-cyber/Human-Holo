import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createExternalAttackGuard,
  humanHoloAllowedOrigins,
  isPrivateProjectPath
} from "../modules/external-attack-guard.mjs";

const root = new URL("../", import.meta.url);
const serverSource = await readFile(new URL("server.mjs", root), "utf8");

function request({
  method = "GET",
  url = "/ai/provider-policy",
  origin = "https://sol-holo.onrender.com",
  ip = "203.0.113.20",
  headers = {}
} = {}) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries({ origin, ...headers })
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([name, value]) => [name.toLowerCase(), String(value)])
  );
  return {
    method,
    originalUrl: url,
    ip,
    headers: normalizedHeaders,
    get(name) {
      return normalizedHeaders[String(name).toLowerCase()] || "";
    },
    socket: { remoteAddress: ip }
  };
}

function response() {
  const headers = new Map();
  return {
    statusCode: 200,
    body: "",
    ended: false,
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), String(value));
    },
    getHeader(name) {
      return headers.get(String(name).toLowerCase());
    },
    end(body = "") {
      this.body = String(body);
      this.ended = true;
    }
  };
}

function run(guard, req) {
  const res = response();
  let nextCalled = false;
  guard.middleware(req, res, () => {
    nextCalled = true;
  });
  return { res, nextCalled };
}

test("nur feste Holo-, Render- und App-Herkünfte werden zugelassen", () => {
  const allowed = humanHoloAllowedOrigins({
    RENDER_EXTERNAL_URL: "https://human-holo.example",
    HOLO_ALLOWED_ORIGINS: "https://api.human-holo.example"
  });
  assert.equal(allowed.has("https://sol-holo.onrender.com"), true);
  assert.equal(allowed.has("http://localhost"), true);
  assert.equal(allowed.has("capacitor://localhost"), true);
  assert.equal(allowed.has("https://human-holo.example"), true);
  assert.equal(allowed.has("https://api.human-holo.example"), true);
  assert.equal(allowed.has("https://evil.example"), false);
  assert.throws(
    () => humanHoloAllowedOrigins({ HOLO_ALLOWED_ORIGINS: "*" }),
    /ungültige Herkunft/u
  );
  assert.throws(
    () => humanHoloAllowedOrigins({ HOLO_ALLOWED_ORIGINS: "http://evil.example" }),
    /HTTPS-Origins/u
  );
});

test("fremde Browser-Herkünfte scheitern vor jeder Route geschlossen", () => {
  const guard = createExternalAttackGuard({ environment: {} });
  const { res, nextCalled } = run(
    guard,
    request({ method: "POST", url: "/sol", origin: "https://evil.example" })
  );
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.getHeader("cache-control"), "no-store, max-age=0");
  assert.doesNotMatch(res.body, /sol-holo\.onrender\.com/u);
});

test("Sicherheitsheader schützen beide Holo-Oberflächen ohne Funktionsroute zu ändern", () => {
  const guard = createExternalAttackGuard({ environment: {} });
  const { res, nextCalled } = run(guard, request());
  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
  assert.equal(res.getHeader("x-frame-options"), "DENY");
  assert.equal(res.getHeader("x-human-holo-guard"), "active-v1");
  assert.equal(res.getHeader("x-content-type-options"), "nosniff");
  assert.equal(res.getHeader("referrer-policy"), "no-referrer");
  assert.match(res.getHeader("content-security-policy"), /frame-ancestors 'none'/u);
  assert.match(res.getHeader("permissions-policy"), /geolocation=\(\)/u);
  assert.equal(res.getHeader("ratelimit-limit"), "240");
  assert.deepEqual(
    guard.corsOptions.allowedHeaders,
    [
      "Authorization",
      "Content-Type",
      "X-Sol-Holo-Trusted-Session",
      "X-Sol-Child-Safety-Context",
      "X-Sol-Child-Safety-Risk",
      "X-Sol-Video-Confirmation",
      "X-Sol-Video-Duration",
      "X-Voice-Setup-Secret"
    ]
  );
});

test("Projektquellen, Geheimnisdateien und Traversal bleiben von außen unsichtbar", () => {
  for (const path of [
    "/server.mjs",
    "/package-lock.json",
    "/modules/trusted-app-session.mjs",
    "/data/human-holo-lifecycle-contract.de.json",
    "/SECURITY.md",
    "/.git/config"
  ]) {
    assert.equal(isPrivateProjectPath(path), true, path);
    const guard = createExternalAttackGuard({ environment: {} });
    const { res, nextCalled } = run(guard, request({ url: path }));
    assert.equal(nextCalled, false, path);
    assert.equal(res.statusCode, 404, path);
  }

  const traversal = run(
    createExternalAttackGuard({ environment: {} }),
    request({ url: "/assets/%2e%2e/server.mjs" })
  );
  assert.equal(traversal.nextCalled, false);
  assert.equal(traversal.res.statusCode, 400);

  for (const encodedPath of [
    "/assets/%2e%2e/server.mjs",
    "/assets/.%2e/server.mjs",
    "/assets/%252e%252e/server.mjs",
    "/assets%2fserver.mjs",
    "/assets%5cserver.mjs"
  ]) {
    const encoded = run(
      createExternalAttackGuard({ environment: {} }),
      request({ url: encodedPath })
    );
    assert.equal(encoded.nextCalled, false, encodedPath);
    assert.equal(encoded.res.statusCode, 400, encodedPath);
  }
});

test("Pam-Holo-Ursprungsschutz sperrt direkte Zugriffe konstant und fail-closed", () => {
  const missingConfiguration = run(
    createExternalAttackGuard({
      environment: { PAM_HOLO_ORIGIN_SECRET_REQUIRED: "true" }
    }),
    request()
  );
  assert.equal(missingConfiguration.nextCalled, false);
  assert.equal(missingConfiguration.res.statusCode, 503);

  const guard = createExternalAttackGuard({
    environment: {
      PAM_HOLO_ORIGIN_SECRET_REQUIRED: "true",
      PAM_HOLO_ORIGIN_SECRET: "server-only-pam-secret"
    }
  });
  const direct = run(guard, request());
  assert.equal(direct.nextCalled, false);
  assert.equal(direct.res.statusCode, 403);

  const spoofed = run(
    guard,
    request({ headers: { "x-pam-holo-origin-guard": "wrong-secret" } })
  );
  assert.equal(spoofed.nextCalled, false);
  assert.equal(spoofed.res.statusCode, 403);

  const edge = run(
    guard,
    request({
      headers: { "x-pam-holo-origin-guard": "server-only-pam-secret" }
    })
  );
  assert.equal(edge.nextCalled, true);
  assert.equal(guard.originSecretRequired, true);
  assert.equal(guard.originSecretConfigured, true);
});

test("nur die beiden Render-Gesundheitsprüfungen bleiben ohne Ursprungsschlüssel lesbar", () => {
  const guard = createExternalAttackGuard({
    environment: {
      PAM_HOLO_ORIGIN_SECRET_REQUIRED: "true",
      PAM_HOLO_ORIGIN_SECRET: "server-only-pam-secret"
    }
  });

  for (const path of ["/health/live", "/health/ready"]) {
    const getCheck = run(
      guard,
      request({ method: "GET", url: path, origin: undefined })
    );
    assert.equal(getCheck.nextCalled, true, path);

    const headCheck = run(
      guard,
      request({ method: "HEAD", url: path, origin: undefined })
    );
    assert.equal(headCheck.nextCalled, true, path);
  }

  const protectedSol = run(
    guard,
    request({ method: "GET", url: "/sol", origin: undefined })
  );
  assert.equal(protectedSol.nextCalled, false);
  assert.equal(protectedSol.res.statusCode, 403);

  const writeToHealth = run(
    guard,
    request({ method: "POST", url: "/health/live", origin: undefined })
  );
  assert.equal(writeToHealth.nextCalled, false);
  assert.equal(writeToHealth.res.statusCode, 403);
});

test("Methoden und komprimierte Anfragekörper werden eng begrenzt", () => {
  const guard = createExternalAttackGuard({ environment: {} });
  const method = run(guard, request({ method: "TRACE" }));
  assert.equal(method.nextCalled, false);
  assert.equal(method.res.statusCode, 405);
  assert.match(method.res.getHeader("allow"), /POST/u);

  const compressed = run(
    guard,
    request({ method: "POST", url: "/sol", headers: { "content-encoding": "gzip" } })
  );
  assert.equal(compressed.nextCalled, false);
  assert.equal(compressed.res.statusCode, 415);
});

test("zu viele externe Versuche werden ohne rohe IP-Speicherung gedrosselt", () => {
  let currentMillis = 1_000;
  const guard = createExternalAttackGuard({
    environment: {},
    now: () => currentMillis,
    limits: {
      sensitive: { maximum: 2, windowMillis: 1_000 }
    }
  });
  const first = run(guard, request({ method: "POST", url: "/sol" }));
  const second = run(guard, request({ method: "POST", url: "/sol" }));
  const blocked = run(guard, request({ method: "POST", url: "/sol" }));
  assert.equal(first.nextCalled, true);
  assert.equal(second.nextCalled, true);
  assert.equal(blocked.nextCalled, false);
  assert.equal(blocked.res.statusCode, 429);
  assert.equal(blocked.res.getHeader("retry-after"), "1");
  assert.doesNotMatch(blocked.res.body, /203\.0\.113\.20/u);

  currentMillis += 1_001;
  const recovered = run(guard, request({ method: "POST", url: "/sol" }));
  assert.equal(recovered.nextCalled, true);
});

test("Server bindet den Wächter vor CORS, JSON und öffentlichen Dateien ein", () => {
  const guardIndex = serverSource.indexOf("app.use(externalAttackGuard.middleware)");
  const corsIndex = serverSource.indexOf("app.use(cors(externalAttackGuard.corsOptions))");
  const jsonIndex = serverSource.indexOf("app.use(express.json");
  const staticIndex = serverSource.indexOf("app.use(express.static");
  assert.ok(guardIndex >= 0);
  assert.ok(guardIndex < corsIndex);
  assert.ok(corsIndex < jsonIndex);
  assert.ok(jsonIndex < staticIndex);
  assert.doesNotMatch(serverSource, /app\.use\(cors\(\)\)/u);
  assert.match(serverSource, /app\.disable\("x-powered-by"\)/u);
  assert.match(serverSource, /httpServer\.headersTimeout = 15 \* 1000/u);
  assert.match(serverSource, /httpServer\.maxHeadersCount = 100/u);
  assert.match(serverSource, /app\.get\("\/security\/guard-status"/u);
  assert.match(serverSource, /scope:\s*\["Pam’s Holo"\]/u);
  assert.match(serverSource, /serviceBoundary:\s*"separate-from-human-holo"/u);
  assert.doesNotMatch(
    serverSource,
    /scope:\s*\["Pam’s Holo",\s*"Human Holo"\]/u
  );
  assert.match(serverSource, /cloudflareEdgeGuard:/u);
});
