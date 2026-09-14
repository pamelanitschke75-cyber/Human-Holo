import assert from "node:assert/strict";
import test from "node:test";

import {
  MEDICATION_RECOGNITION_LEGAL_HOLD_ACTIVE,
  formatMedicationRecognitionAnswer,
  isMedicationRecognitionRequest,
  medicationRecognitionInstructions,
  parseMedicationRecognitionResult,
  sanitizeMedicationRecognitionResult
} from "../modules/medication-recognition.mjs";

test("feature remains disabled while legal hold is active", () => {
  assert.equal(MEDICATION_RECOGNITION_LEGAL_HOLD_ACTIVE, true);
  assert.equal(isMedicationRecognitionRequest("test", { hasImage: true }), false);
  assert.equal(isMedicationRecognitionRequest("test", { hasImage: false }), false);
});

test("only reminder and organization functions remain available", () => {
  const instructions = medicationRecognitionInstructions();
  const answer = formatMedicationRecognitionAnswer();

  assert.match(instructions, /Only reminder and organization functions remain available/u);
  assert.match(answer, /Only reminder and organization functions remain available/u);
});

test("disabled parser returns no recognized content", () => {
  assert.deepEqual(sanitizeMedicationRecognitionResult({ any: "value" }), {
    status: "disabled"
  });
  assert.deepEqual(parseMedicationRecognitionResult("anything"), {
    status: "disabled"
  });
});
