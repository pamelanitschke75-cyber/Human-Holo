import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import {
  HUMAN_HOLO_AI_PROVIDER_POLICY,
  assertHumanHoloAIProvider,
  humanHoloAIProviderPolicyResponse
} from "../modules/human-holo-ai-provider-policy.mjs";

async function loadBrowserPolicy() {
  const source = await readFile(
    new URL("../www/human-holo-ai-policy.js", import.meta.url),
    "utf8"
  );
  const context = vm.createContext({ TypeError });
  context.window = context;
  vm.runInContext(source, context, {
    filename: "human-holo-ai-policy.js"
  });
  return context.HumanHoloAIProviderPolicy;
}

test("alle Human-Holo-Funktionen sind zuerst verbindlich an ChatGPT/OpenAI gebunden", async () => {
  const browserPolicy = await loadBrowserPolicy();

  for (const policy of [HUMAN_HOLO_AI_PROVIDER_POLICY, browserPolicy]) {
    assert.equal(policy.decisionOwner.ownerId, "pam-sol");
    assert.equal(policy.decisionOwner.name, "Pamela Christina Nitschke");
    assert.equal(policy.provider, "openai");
    assert.equal(policy.providerLabel, "ChatGPT/OpenAI");
    assert.equal(policy.scope, "all-human-holo-functions");
    assert.equal(policy.openAIRequiredWheneverPossible, true);
    assert.equal(policy.externalProvidersDefaultAllowed, false);
    assert.equal(policy.automaticFallbackAllowed, false);
    assert.equal(
      policy.nonOpenAIException.condition,
      "required-capability-impossible-via-chatgpt-openai"
    );
    assert.equal(policy.nonOpenAIException.requiresExplicitOwnerApproval, true);
    assert.equal(policy.nonOpenAIException.requiresDocumentedTechnicalProof, true);
    assert.equal(
      policy.unsupportedCapabilityAction,
      "block-and-request-owner-approval"
    );
    assert.equal(policy.localRuntimeRole, "render-and-connect-openai-output");
    assert.ok(policy.capabilities.includes("voice"));
    assert.ok(policy.capabilities.includes("video-generation"));
    assert.ok(policy.capabilities.includes("original-full-sync"));
  }

  assert.deepEqual(
    [...browserPolicy.capabilities],
    [...HUMAN_HOLO_AI_PROVIDER_POLICY.capabilities]
  );
});

test("jeder andere Anbieter wird als automatischer Fallback abgewiesen", async () => {
  const browserPolicy = await loadBrowserPolicy();

  assert.equal(assertHumanHoloAIProvider(" OpenAI "), "openai");
  assert.equal(browserPolicy.assertProvider("OPENAI"), "openai");
  assert.throws(() => assertHumanHoloAIProvider("other-provider"));
  assert.throws(() => browserPolicy.assertProvider("other-provider"));
  assert.throws(() => assertHumanHoloAIProvider(""));
});

test("Server, App und Android-Build veröffentlichen dieselbe feste Richtlinie", async () => {
  const [server, html, ui, workflow] = await Promise.all([
    readFile(new URL("../server.mjs", import.meta.url), "utf8"),
    readFile(new URL("../www/index.html", import.meta.url), "utf8"),
    readFile(new URL("../www/sol-holo-ui.js", import.meta.url), "utf8"),
    readFile(new URL("../.github/workflows/android-build.yml", import.meta.url), "utf8")
  ]);

  assert.match(server, /\/ai\/provider-policy/u);
  assert.match(server, /assertHumanHoloAIProvider/u);
  assert.match(html, /human-holo-ai-policy\.js\?v=1/u);
  assert.match(html, /sol-holo-ui\.js\?v=74/u);
  assert.match(ui, /ChatGPT\/OpenAI zuerst und verbindlich/u);
  assert.match(workflow, /www\/human-holo-ai-policy\.js/u);
  assert.deepEqual(
    humanHoloAIProviderPolicyResponse().capabilities,
    [...HUMAN_HOLO_AI_PROVIDER_POLICY.capabilities]
  );
});
