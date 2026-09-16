const GUARD_NAME = "human-holo-edge-guard";
const GUARD_VERSION = "separated-v2";

function securityHeaders(headers = new Headers()) {
  headers.set("cache-control", "no-store, private, max-age=0");
  headers.set("cloudflare-cdn-cache-control", "no-store");
  headers.set("content-security-policy", "base-uri 'none'; object-src 'none'; frame-ancestors 'none'");
  headers.set("cross-origin-opener-policy", "same-origin");
  headers.set("origin-agent-cluster", "?1");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=(), browsing-topics=()");
  headers.set("referrer-policy", "no-referrer");
  headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("x-human-holo-edge-guard", GUARD_VERSION);
  return headers;
}

function json(status, body) {
  const headers = securityHeaders();
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

export function createHumanHoloEdgeGuard() {
  return async function handleHumanHoloEdgeRequest(request) {
    let url;
    try {
      url = new URL(request.url);
    } catch {
      return json(400, { error: "Ungültige Anfrageadresse." });
    }

    if (url.pathname === "/edge-guard/status") {
      return json(200, {
        scope: ["Human Holo"],
        serviceBoundary: "separate-from-pam-holo",
        edgeGuard: GUARD_VERSION,
        deploymentStage: "blocked-until-separate-origin-exists",
        originConfigured: false,
        productionTrafficProtected: false
      });
    }

    return json(503, {
      error: "Human Holo bleibt geschlossen, bis der getrennte Server sicher konfiguriert ist."
    });
  };
}

const handleHumanHoloEdgeRequest = createHumanHoloEdgeGuard();

export default {
  fetch(request) {
    return handleHumanHoloEdgeRequest(request);
  }
};

export const HUMAN_HOLO_EDGE_GUARD = Object.freeze({
  name: GUARD_NAME,
  version: GUARD_VERSION,
  defaultOrigin: null,
  failClosed: true
});
