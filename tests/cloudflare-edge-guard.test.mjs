import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  PAM_HOLO_EDGE_GUARD,
  createPamHoloEdgeGuard,
  isPrivateEdgePath
} from "../cloudflare/pam-holo-edge-guard.mjs";
import {
  HUMAN_HOLO_EDGE_GUARD,
  createHumanHoloEdgeGuard
} from "../cloudflare/human-holo-edge-guard.mjs";

const root = new URL("../", import.meta.url);

test("Pam-Holo und Human Holo besitzen getrennte, fail-closed Türsteher", async () => {
  const humanConfig = await readFile(new URL("cloudflare/wrangler.jsonc", root), "utf8");
  const pamConfig = await readFile(new URL("cloudflare/wrangler.pam-holo.jsonc", root), "utf8");
  const guide = await readFile(new URL("cloudflare/README.md", root), "utf8");
  assert.equal(PAM_HOLO_EDGE_GUARD.name, "pam-holo-edge-guard");
  assert.equal(HUMAN_HOLO_EDGE_GUARD.name, "human-holo-edge-guard");
  assert.match(pamConfig, /"name": "pam-holo-edge-guard"/u);
  assert.match(pamConfig, /https:\/\/sol-holo\.onrender\.com/u);
  assert.match(humanConfig, /"name": "human-holo-edge-guard"/u);
  assert.doesNotMatch(humanConfig, /sol-holo\.onrender\.com/u);
  assert.doesNotMatch(`${humanConfig}\n${pamConfig}`, /dark-wind-6dd8/u);
  assert.match(guide, /sol-holo-api/u);
  assert.match(guide, /weder\s+überschrieben noch gelöscht/u);
});

test("Pam-Holo-Status nennt die getrennte Teststufe ohne Produktionsbehauptung", async () => {
  const handler = createPamHoloEdgeGuard({
    fetchImpl: async () => {
      throw new Error("Status darf den Ursprung nicht aufrufen");
    }
  });
  const response = await handler(
    new Request("https://pam-holo-edge-guard.example/edge-guard/status")
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-pam-holo-edge-guard"), "staged-v2");
  const body = await response.json();
  assert.deepEqual(body.scope, ["Pam’s Holo"]);
  assert.equal(body.serviceBoundary, "separate-from-human-holo");
  assert.equal(body.deploymentStage, "separate-staging-worker");
  assert.equal(body.existingTrafficMigrated, false);
  assert.equal(body.productionTrafficProtected, false);
  assert.equal(body.renderOriginLocked, false);
});

test("Human-Holo-Türsteher leitet niemals versehentlich zu Pam-Holo", async () => {
  const handler = createHumanHoloEdgeGuard();
  const status = await handler(
    new Request("https://human-holo-edge-guard.example/edge-guard/status")
  );
  assert.equal(status.status, 200);
  assert.deepEqual((await status.json()).scope, ["Human Holo"]);

  const blocked = await handler(
    new Request("https://human-holo-edge-guard.example/sol", { method: "POST", body: "{}" })
  );
  assert.equal(blocked.status, 503);
  assert.doesNotMatch(await blocked.text(), /sol-holo\.onrender\.com/u);
});

test("zulässige Anfragen werden pfadtreu zum festen Render-Ursprung geleitet", async () => {
  let forwarded;
  const handler = createPamHoloEdgeGuard({
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
        "x-pam-holo-origin-guard": "spoofed"
      },
      body: JSON.stringify({ text: "Hallo" })
    }),
    { PAM_HOLO_ORIGIN_SECRET: "server-only-secret" }
  );
  assert.equal(response.status, 201);
  assert.equal(forwarded.url, "https://sol-holo.onrender.com/sol?mode=test");
  assert.equal(
    forwarded.headers.get("x-pam-holo-origin-guard"),
    "server-only-secret"
  );
  assert.equal(forwarded.headers.get("x-pam-holo-edge-guard"), "staged-v2");
  assert.equal(await forwarded.text(), JSON.stringify({ text: "Hallo" }));
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("cache-control"), "no-store, private, max-age=0");
});

test("fremde Herkunft, gefährliche Methoden und komprimierte Körper scheitern geschlossen", async () => {
  let fetchCalls = 0;
  const handler = createPamHoloEdgeGuard({
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
  const handler = createPamHoloEdgeGuard({
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

  for (const path of [
    "/assets/%2e%2e/server.mjs",
    "/assets/.%2e/server.mjs",
    "/assets/%252e%252e/server.mjs"
  ]) {
    const encoded = await handler(new Request(`https://edge.example${path}`));
    assert.ok([400, 404].includes(encoded.status), path);
  }
  assert.equal(fetchCalls, 0);
});

test("auch ein falsch oder gar nicht deklarierter großer Körper wird vollständig abgefangen", async () => {
  let fetchCalls = 0;
  const handler = createPamHoloEdgeGuard({
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response("unexpected");
    }
  });
  const body = new Uint8Array(20 * 1024 * 1024 + 1);
  const response = await handler(
    new Request("https://edge.example/sol", {
      method: "POST",
      headers: { origin: "https://edge.example" },
      body,
      duplex: "half"
    })
  );
  assert.equal(response.status, 413);
  assert.equal(fetchCalls, 0);
});

test("die spätere Ursprungssperre schließt bei fehlendem Secret sicher", async () => {
  const handler = createPamHoloEdgeGuard({
    fetchImpl: async () => new Response("unexpected")
  });
  const response = await handler(
    new Request("https://edge.example/security/guard-status"),
    { PAM_HOLO_ORIGIN_SECRET_REQUIRED: "true" }
  );
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /sol-holo\.onrender\.com/u);
});

test("Ursprungsfehler geben keine internen Einzelheiten preis", async () => {
  const handler = createPamHoloEdgeGuard({
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


test("Pam-Holo-Clients und OAuth-Callbacks verwenden ausschließlich den Türsteher", async () => {
  const clientPaths = [
    "index.html",
    "sol-holo-ui.js",
    "www/index.html",
    "www/sol-holo-ui.js",
    "www/trusted-app-session.mjs",
    "www/sol-holo-backup.mjs",
    "www/human-holo-animal-holos.mjs"
  ];
  const clientSources = await Promise.all(
    clientPaths.map((path) => readFile(new URL(path, root), "utf8"))
  );

  for (let index = 0; index < clientSources.length; index += 1) {
    assert.match(
      clientSources[index],
      /https:\/\/pam-holo-edge-guard\.pamela-nitschke75\.workers\.dev/u,
      clientPaths[index]
    );
    assert.doesNotMatch(
      clientSources[index],
      /https:\/\/sol-holo\.onrender\.com/u,
      clientPaths[index]
    );
  }

  const server = await readFile(new URL("server.mjs", root), "utf8");
  assert.match(
    server,
    /pam-holo-edge-guard\.pamela-nitschke75\.workers\.dev\/auth\/google\/callback/u
  );
  assert.match(
    server,
    /pam-holo-edge-guard\.pamela-nitschke75\.workers\.dev\/auth\/smartthings\/callback/u
  );
  assert.match(server, /function protectedOAuthRedirectUri/u);
  assert.match(server, /PAM_HOLO_ORIGIN_SECRET_REQUIRED/u);
  assert.match(
    server,
    /originGuardRequired[\s\S]*?PAM_HOLO_RENDER_ORIGIN[\s\S]*?return edgeRedirect/u
  );
});
