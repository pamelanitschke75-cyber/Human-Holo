import assert from "node:assert/strict";
import test from "node:test";

import {
  MEDICAL_LEGAL_HOLD_ACTIVE,
  PAM_HOLO_PRIVATE_SELF_CARE_TEST_ACTIVE,
  healthSelfCareInstructions,
  isHealthSelfCareRequest
} from "../modules/health-self-care.mjs";
import {
  humanHoloNoGoInstructions
} from "../modules/human-holo-no-go.mjs";

test("medizinische Selbsthilfe ist bis zur juristischen Freigabe deaktiviert", () => {
  assert.equal(MEDICAL_LEGAL_HOLD_ACTIVE, true);
  assert.equal(PAM_HOLO_PRIVATE_SELF_CARE_TEST_ACTIVE, true);
  assert.equal(isHealthSelfCareRequest("Gesundheitsfrage"), false);
  assert.equal(
    isHealthSelfCareRequest("Was kann ich bei leichtem Husten tun?"),
    false
  );
  assert.match(
    healthSelfCareInstructions(),
    /TEMPORÄRER JURISTISCHER HOLD · MEDIZIN/u
  );
});

test("private Pam-Selbsthilfe bleibt eng begrenzt", () => {
  assert.equal(
    isHealthSelfCareRequest("Was kann ich bei leichtem Husten tun?", {
      privatePamMedical: true
    }),
    true
  );
  assert.equal(
    isHealthSelfCareRequest("Was kann ich beim Husten meiner Katze tun?", {
      privatePamMedical: true
    }),
    false
  );
  const instructions = healthSelfCareInstructions("Pam", {
    privatePamMedical: true
  });
  assert.match(instructions, /niemals eine Diagnose/u);
  assert.match(instructions, /keine\s+persönliche Dosierung/u);
  assert.match(instructions, /112/u);
  assert.match(instructions, /116117/u);
});

test("zentrale Human-Holo-Regel enthält den juristischen Medizin-Hold", () => {
  const rules = humanHoloNoGoInstructions();
  assert.match(rules, /TEMPORÄRER JURISTISCHER HOLD · MEDIZIN/u);
  assert.match(rules, /ausschließlich Erinnerungs- und Organisationsfunktionen/u);
  assert.match(rules, /Text, Sprache, Realtime, Bilder/u);

  const privateRules = humanHoloNoGoInstructions({
    privatePamMedical: true
  });
  assert.match(privateRules, /PRIVATE AUSNAHME · NUR PAMS EIGENES HOLO/u);
  assert.match(privateRules, /Diagnosen, Verdachtsdiagnosen/u);
  assert.match(privateRules, /bleiben auch in Pams Test verboten/u);
});
