const OPENAI_PROVIDER_ID = "openai";
const OPENAI_PROVIDER_LABEL = "ChatGPT/OpenAI";

const AI_CAPABILITIES = Object.freeze([
  "conversation",
  "reasoning",
  "memory-assistance",
  "voice",
  "speech",
  "image-generation",
  "video-generation",
  "avatar-animation",
  "original-full-sync"
]);

export const HUMAN_HOLO_AI_PROVIDER_POLICY = Object.freeze({
  version: "2026-09-09-chatgpt-openai-only-1",
  decisionOwner: Object.freeze({
    ownerId: "pam-sol",
    name: "Pamela Christina Nitschke"
  }),
  provider: OPENAI_PROVIDER_ID,
  providerLabel: OPENAI_PROVIDER_LABEL,
  scope: "all-human-holo-functions",
  openAIRequiredWheneverPossible: true,
  externalProvidersDefaultAllowed: false,
  automaticFallbackAllowed: false,
  nonOpenAIException: Object.freeze({
    condition: "required-capability-impossible-via-chatgpt-openai",
    requiresExplicitOwnerApproval: true,
    requiresDocumentedTechnicalProof: true
  }),
  unsupportedCapabilityAction: "block-and-request-owner-approval",
  localRuntimeRole: "render-and-connect-openai-output",
  capabilities: AI_CAPABILITIES
});

export function assertHumanHoloAIProvider(provider) {
  const normalized = String(provider || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase();

  if (normalized !== OPENAI_PROVIDER_ID) {
    throw new TypeError(
      "Human Holo erlaubt für KI-, Sprach-, Video- und Original-Full-Sync-Funktionen ausschließlich ChatGPT/OpenAI."
    );
  }

  return OPENAI_PROVIDER_ID;
}

export function humanHoloAIProviderPolicyResponse() {
  return {
    ...HUMAN_HOLO_AI_PROVIDER_POLICY,
    capabilities: [...HUMAN_HOLO_AI_PROVIDER_POLICY.capabilities]
  };
}
