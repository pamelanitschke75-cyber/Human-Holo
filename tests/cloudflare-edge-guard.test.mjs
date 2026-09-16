import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  HUMAN_HOLO_EDGE_GUARD,
  createHumanHoloEdgeGuard,
  isPrivateEdgePath
} from "../cloudflare/human-holo-edge-guard.mjs";

const root = new URL("../", import.meta.url);

test("der neue Türsteher bleibt getrennt von beiden vorhandenen Workern", async () => {
  const config = await readFile(new URL("cloudflare/wrangler.jsonc", root), "utf8");
  const guide = await readFile(new URL("cloudflare/README.md", root), "utf8");
  assert.equal(HUMAN_HOLO_EDGE_GUARD.name, "human-holo-edge-guard");
  assert.match(config, /"name": "human-holo-edge-guard"/u);
  assert.doesNotMatch(config, /dark-wind-6dd8/u);
  assert.match(guide, /sol-holo-api/u);
  assert.match(guide, /weder\s+überschrieben noch gelöscht/u);
});

test("Status nennt die getrennte Teststufe ohne falsche Aktivbehauptung", async () => {
  const handler = createHumanHoloEdgeGuard({
    fetchImpl: async () => {
      throw new Error("Status darf den Ursprung nicht aufrufen");
    }
  });
  const response = await handler(
    new Request("https://human-holo-edge-guard.example/edge-guard/status")
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-human-holo-edge-guard"), "staged-v1");
  const body = await response.json();
  assert.equal(body.deploymentStage, "separate-staging-worker");
  assert.equal(body.existingTrafficMigrated, false);
  assert.equal(body.renderOriginLocked, false);
});

test("zulässige Anfragen werden pfadtreu zum festen Render-Ursprung geleitet", async () => {
  let forwarded;
  const handler = createHumanHoloEdgeGuard({
    fetchImpl: async (request) => {
      forwarded = request;
      return new Response(JSON.stringify({ ok: true }), {
        status: 201,
        headers: { "content-type": "application/json", "x-powered-by": "hidden" }
      });
    }
  });
  const response = await handler(
    new Request("https://edge.example/sol?mode=test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "capacitor://localhost",
        "x-human-holo-origin-guard": "spoofed"
      },
      body: JSON.stringify({ text: "Hallo" })
    }),
    { HUMAN_HOLO_ORIGIN_SECRET: "server-only-secret" }
  );
  assert.equal(response.status, 201);
  assert.equal(forwarded.url, "https://sol-holo.onrender.com/sol?mode=test");
  assert.equal(
    forwarded.headers.get("x-human-holo-origin-guard"),
    "server-only-secret"
  );
  assert.equal(forwarded.headers.get("x-human-holo-edge-guard"), "staged-v1");
  assert.equal(await forwarded.text(), JSON.stringify({ text: "Hallo" }));
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.equal(response.headers.get("x-frame-options"), "DENY");
});

test("fremde Herkunft, gefährliche Methoden und komprimierte Körper scheitern geschlossen", async () => {
  let fetchCalls = 0;
  const handler = createHumanHoloEdgeGuard({
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response("unexpected");
    }
  });
  const foreign = await handler(
    new Request("https://edge.example/sol", {
      method: "POST",
      headers: { origin: "https://evil.example" },
      body: "{}"
    })
  );
  const method = await handler(
    new Request("https://edge.example/sol", { method: "PUT" })
  );
  const compressed = await handler(
    new Request("https://edge.example/sol", {
      method: "POST",
      headers: { "content-encoding": "gzip" },
      body: "compressed"
    })
  );
  assert.equal(foreign.status, 403);
  assert.equal(method.status, 405);
  assert.equal(compressed.status, 415);
  assert.equal(fetchCalls, 0);
});

test("Projektquellen und übergroß erklärte Körper erreichen Render nicht", async () => {
  assert.equal(isPrivateEdgePath("/server.mjs"), true);
  assert.equal(isPrivateEdgePath("/.git/config"), true);
  assert.equal(isPrivateEdgePath("/modules/private.mjs"), true);

  let fetchCalls = 0;
  const handler = createHumanHoloEdgeGuard({
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response("unexpected");
    }
  });
  const privateFile = await handler(
    new Request("https://edge.example/server.mjs")
  );
  const tooLarge = await handler(
    new Request("https://edge.example/sol", {
      method: "POST",
      headers: { "content-length": String(20 * 1024 * 1024 + 1) },
      body: "x"
    })
  );
  assert.equal(privateFile.status, 404);
  assert.equal(tooLarge.status, 413);
  assert.equal(fetchCalls, 0);
});

test("die spätere Ursprungssperre schließt bei fehlendem Secret sicher", async () => {
  const handler = createHumanHoloEdgeGuard({
    fetchImpl: async () => new Response("unexpected")
  });
  const response = await handler(
    new Request("https://edge.example/security/guard-status"),
    { HUMAN_HOLO_ORIGIN_SECRET_REQUIRED: "true" }
  );
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /sol-holo\.onrender\.com/u);
});

test("Ursprungsfehler geben keine internen Einzelheiten preis", async () => {
  const handler = createHumanHoloEdgeGuard({
    fetchImpl: async () => {
      throw new Error("private upstream detail");
    }
  });
  const response = await handler(
    new Request("https://edge.example/security/guard-status")
  );
  assert.equal(response.status, 502);
  const body = await response.text();
  assert.doesNotMatch(body, /private upstream detail/u);
  assert.doesNotMatch(body, /sol-holo\.onrender\.com/u);
});
