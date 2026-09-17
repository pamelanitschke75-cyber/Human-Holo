export const PAM_HOLO_RESPONSE_SPEED_POLICY = Object.freeze({
  primaryModel: "gpt-5",
  fallbackModel: "gpt-4.1-mini",
  primaryTimeoutMs: 40_000,
  fallbackTimeoutMs: 25_000,
  textMaxOutputTokens: 900,
  visualMaxOutputTokens: 1_200,
  textReasoningEffort: "minimal",
  visualReasoningEffort: "low"
});

export function createPamHoloPrimaryResponseRequest(
  request,
  {
    hasVisualMedia = false
  } = {}
) {
  return {
    ...request,
    model:
      PAM_HOLO_RESPONSE_SPEED_POLICY
        .primaryModel,
    store: false,
    max_output_tokens:
      hasVisualMedia
        ? PAM_HOLO_RESPONSE_SPEED_POLICY
            .visualMaxOutputTokens
        : PAM_HOLO_RESPONSE_SPEED_POLICY
            .textMaxOutputTokens,
    reasoning: {
      effort:
        hasVisualMedia
          ? PAM_HOLO_RESPONSE_SPEED_POLICY
              .visualReasoningEffort
          : PAM_HOLO_RESPONSE_SPEED_POLICY
              .textReasoningEffort
    }
  };
}

export function createPamHoloFallbackResponseRequest(
  request
) {
  const {
    reasoning: _reasoning,
    ...fallbackRequest
  } = request;

  return {
    ...fallbackRequest,
    model:
      PAM_HOLO_RESPONSE_SPEED_POLICY
        .fallbackModel,
    store: false
  };
}

export function isPamHoloProviderTimeout(error) {
  return (
    error?.name ===
      "APIConnectionTimeoutError" ||
    error?.code ===
      "ETIMEDOUT" ||
    error?.cause?.name ===
      "TimeoutError"
  );
}
