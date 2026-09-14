import assert from "node:assert/strict";
import test from "node:test";

import {
  MEDICAL_LEGAL_HOLD_ACTIVE,
  healthSelfCareInstructions,
  isHealthSelfCareRequest
} from "../modules/health-self-care.mjs";
import {
  humanHoloNoGoInstructions
} from "../modules/human-holo-no-go.mjs";

test("medizinische Selbsthilfe ist bis zur juristischen Freigabe deaktiviert", () => {
  assert.equal(MEDICAL_LEGAL_HOLD_ACTIVE, true);
  assert.equal(isHealthSelfCareRequest("Gesundheitsfrage"), false);
  assert.match(healthSelfCareInstructions(), /LEGAL HOLD/u);
});

test("zentrale Human-Holo-Regel enthält den juristischen Medizin-Hold", () => {
  const rules = humanHoloNoGoInstructions();
  assert.match(rules, /TEMPORÄRER JURISTISCHER HOLD · MEDIZIN/u);
  assert.match(rules, /ausschließlich Erinnerungs- und Organisationsfunktionen/u);
  assert.match(rules, /Text, Sprache, Realtime, Bilder/u);
});
