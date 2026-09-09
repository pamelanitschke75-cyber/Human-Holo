(function installHumanHoloAIProviderPolicy(globalScope){
  "use strict";

  const provider = "openai";
  const capabilities = Object.freeze([
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

  function assertProvider(value){
    const normalized = String(value || "")
      .normalize("NFKC")
      .trim()
      .toLowerCase();

    if(normalized !== provider){
      throw new TypeError(
        "Human Holo erlaubt ausschließlich ChatGPT/OpenAI als KI-Anbieter."
      );
    }

    return provider;
  }

  globalScope.HumanHoloAIProviderPolicy = Object.freeze({
    version:"2026-09-09-chatgpt-openai-only-1",
    decisionOwner:Object.freeze({
      ownerId:"pam-sol",
      name:"Pamela Christina Nitschke"
    }),
    provider,
    providerLabel:"ChatGPT/OpenAI",
    scope:"all-human-holo-functions",
    openAIRequiredWheneverPossible:true,
    externalProvidersDefaultAllowed:false,
    automaticFallbackAllowed:false,
    nonOpenAIException:Object.freeze({
      condition:"required-capability-impossible-via-chatgpt-openai",
      requiresExplicitOwnerApproval:true,
      requiresDocumentedTechnicalProof:true
    }),
    unsupportedCapabilityAction:"block-and-request-owner-approval",
    localRuntimeRole:"render-and-connect-openai-output",
    capabilities,
    assertProvider
  });
})(window);
