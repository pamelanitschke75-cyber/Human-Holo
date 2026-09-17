import assert from "node:assert/strict";
import test from "node:test";

import {
  MEDICATION_RECOGNITION_LEGAL_HOLD_ACTIVE,
  PAM_HOLO_PRIVATE_MEDICATION_TEST_ACTIVE,
  formatMedicationRecognitionAnswer,
  isMedicationRecognitionRequest,
  medicationRecognitionInstructions,
  parseMedicationRecognitionResult,
  sanitizeMedicationRecognitionResult
} from "../modules/medication-recognition.mjs";

test("allgemeines Human Holo bleibt trotz privater Pam-Ausnahme geschlossen", () => {
  assert.equal(MEDICATION_RECOGNITION_LEGAL_HOLD_ACTIVE, true);
  assert.equal(PAM_HOLO_PRIVATE_MEDICATION_TEST_ACTIVE, true);
  assert.equal(
    isMedicationRecognitionRequest("Lies dieses Medikament", {
      hasImage: true
    }),
    false
  );
  assert.match(
    medicationRecognitionInstructions(),
    /allgemeinen Human Holo[\s\S]*deaktiviert/u
  );
  assert.match(
    formatMedicationRecognitionAnswer(),
    /allgemeinen Human Holo[\s\S]*anwaltlichen Freigabe deaktiviert/u
  );
});

test("privater Pam-Test erkennt nur einen Bildauftrag zur Verpackung", () => {
  assert.equal(
    isMedicationRecognitionRequest("Lies dieses Medikament", {
      hasImage: true,
      privatePamMedical: true
    }),
    true
  );
  assert.equal(
    isMedicationRecognitionRequest("Lies dieses Medikament", {
      hasImage: false,
      privatePamMedical: true
    }),
    false
  );
  assert.match(
    medicationRecognitionInstructions("Pam", {
      authorized: true,
      privatePamMedical: true
    }),
    /nur ein ausdrücklich ausgewähltes Foto[\s\S]*niemals eine persönliche Dosierung/u
  );
});

test("Parser bleibt standardmäßig geschlossen und filtert Dosierungsangaben", () => {
  assert.deepEqual(sanitizeMedicationRecognitionResult({ any: "value" }), {
    status: "disabled"
  });
  assert.deepEqual(parseMedicationRecognitionResult("anything"), {
    status: "disabled"
  });

  const parsed = parseMedicationRecognitionResult(
    JSON.stringify({
      status: "package",
      medicine_name: "Beispiel",
      active_ingredient: "Wirkstoff",
      strength: "500 mg",
      dosage_form: "Tablette",
      package_size: "20 Stück",
      manufacturer: "Hersteller",
      expiry_date: "12/2028",
      uncertainty: "Nimm täglich zwei Tabletten"
    }),
    { privatePamMedical: true }
  );
  assert.equal(parsed.status, "package");
  assert.equal(parsed.uncertainty, "");
  assert.match(
    formatMedicationRecognitionAnswer(parsed, {
      privatePamMedical: true
    }),
    /keine Diagnose, Behandlung oder persönliche Einnahmeempfehlung/u
  );
});
