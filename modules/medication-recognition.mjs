export const MEDICATION_RECOGNITION_LEGAL_HOLD_ACTIVE = true;

export const MEDICATION_RECOGNITION_RESPONSE_FORMAT = Object.freeze({
  type: "json_schema",
  name: "human_holo_medication_feature_disabled",
  strict: true,
  schema: Object.freeze({
    type: "object",
    properties: Object.freeze({
      status: Object.freeze({ type: "string", enum: Object.freeze(["disabled"]) })
    }),
    required: Object.freeze(["status"]),
    additionalProperties: false
  })
});

export function isMedicationRecognitionRequest() {
  return false;
}

export function medicationRecognitionInstructions() {
  return `
TEMPORARY LEGAL HOLD:
This feature is disabled pending documented legal review and explicit approval.
Only reminder and organization functions remain available.
`;
}

export function sanitizeMedicationRecognitionResult() {
  return Object.freeze({ status: "disabled" });
}

export function parseMedicationRecognitionResult() {
  return sanitizeMedicationRecognitionResult();
}

export function formatMedicationRecognitionAnswer() {
  return "This feature is currently disabled. Only reminder and organization functions remain available pending documented legal review and explicit approval.";
}
