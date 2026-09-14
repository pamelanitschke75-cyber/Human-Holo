export const MEDICAL_LEGAL_HOLD_ACTIVE = true;

export function isHealthSelfCareRequest() {
  return false;
}

export function healthSelfCareInstructions() {
  return `
TEMPORARY LEGAL HOLD:
This feature is disabled pending documented legal review and explicit approval.
Memory and reminder functions remain separate and may continue to operate.
`;
}
