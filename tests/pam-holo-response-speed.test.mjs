import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  PAM_HOLO_RESPONSE_SPEED_POLICY,
  createPamHoloFallbackResponseRequest,
  createPamHoloPrimaryResponseRequest,
  isPamHoloProviderTimeout
} from "../modules/pam-holo-response-speed.mjs";

test("normaler Pam-Holo-Textchat nutzt GPT-5 mit minimalem Denkaufwand", () => {
  const request =
    createPamHoloPrimaryResponseRequest({
      input: "Hallo",
      instructions: "Persönlich antworten"
    });

  assert.equal(request.model, "gpt-5");
  assert.equal(request.store, false);
  assert.equal(
    request.max_output_tokens,
    900
  );
  assert.deepEqual(
    request.reasoning,
    { effort: "minimal" }
  );
});

test("direkte Bildauswertung behält mehr Antwort- und Denkraum", () => {
  const request =
    createPamHoloPrimaryResponseRequest(
      { input: "Foto" },
      { hasVisualMedia: true }
    );

  assert.equal(
    request.max_output_tokens,
    1_200
  );
  assert.deepEqual(
    request.reasoning,
    { effort: "low" }
  );
});

test("nach 40 Sekunden wechselt nur ein echter Provider-Timeout auf den schnellen Ersatzweg", () => {
  const primary =
    createPamHoloPrimaryResponseRequest({
      input: "Überleg mal"
    });
  const fallback =
    createPamHoloFallbackResponseRequest(
      primary
    );

  assert.equal(
    PAM_HOLO_RESPONSE_SPEED_POLICY
      .primaryTimeoutMs,
    40_000
  );
  assert.equal(
    PAM_HOLO_RESPONSE_SPEED_POLICY
      .fallbackTimeoutMs,
    25_000
  );
  assert.equal(
    fallback.model,
    "gpt-4.1-mini"
  );
  assert.equal(fallback.store, false);
  assert.equal(
    Object.hasOwn(
      fallback,
      "reasoning"
    ),
    false
  );
  assert.equal(
    isPamHoloProviderTimeout({
      name:
        "APIConnectionTimeoutError"
    }),
    true
  );
  assert.equal(
    isPamHoloProviderTimeout({
      name: "RateLimitError"
    }),
    false
  );
});

test("der normale Sol-Endpunkt verwendet den abgesicherten Antwortweg", async () => {
  const serverSource =
    await readFile(
      new URL(
        "../server.mjs",
        import.meta.url
      ),
      "utf8"
    );
  const solRoute =
    serverSource.slice(
      serverSource.indexOf(
        'app.post("/sol"'
      )
    );

  assert.match(
    solRoute,
    /createPamHoloPrimaryResponseRequest/u
  );
  assert.match(
    solRoute,
    /await createPamHoloResponse\(/u
  );
});
