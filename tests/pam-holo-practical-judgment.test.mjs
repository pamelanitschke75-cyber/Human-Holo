import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  PAM_HOLO_PRACTICAL_JUDGMENT_POLICY,
  isPamHoloPracticalJudgmentEnabled,
  pamHoloPracticalJudgmentInstructions
} from "../modules/pam-holo-practical-judgment.mjs";

const pamIdentity = Object.freeze({
  ownerId: "pam-sol",
  speakerId: "pam"
});

test("praktisches Urteilsvermögen ist ausschließlich für Pam’s Holo freigegeben", () => {
  assert.equal(isPamHoloPracticalJudgmentEnabled(pamIdentity), true);
  assert.equal(
    isPamHoloPracticalJudgmentEnabled({
      ownerId: "human-holo",
      speakerId: "tester"
    }),
    false
  );
  assert.equal(
    isPamHoloPracticalJudgmentEnabled({
      ownerId: "steffi-sol",
      speakerId: "steffi"
    }),
    false
  );
  assert.equal(
    PAM_HOLO_PRACTICAL_JUDGMENT_POLICY.humanHoloRelease,
    "lawyer-approval-required"
  );
  assert.equal(
    PAM_HOLO_PRACTICAL_JUDGMENT_POLICY.scope,
    "general-practical-judgment"
  );
  assert.equal(
    PAM_HOLO_PRACTICAL_JUDGMENT_POLICY.examplesAreExhaustive,
    false
  );
  assert.equal(
    PAM_HOLO_PRACTICAL_JUDGMENT_POLICY.humanHoloCapabilityStatus,
    "existing-concept-release-held"
  );
});

test("nicht freigegebene Human-Holo-Identitäten erhalten keine Regel", () => {
  assert.equal(
    pamHoloPracticalJudgmentInstructions({
      ownerId: "human-holo",
      speakerId: "tester"
    }),
    ""
  );
});

test("Pam’s Holo erhält Wahrheits-, Kennzeichnungs-, Stopp- und Kinderschutzregeln", () => {
  const instructions = pamHoloPracticalJudgmentInstructions(pamIdentity);

  assert.match(instructions, /Mindestbeispiele und keine[\s\S]*abschließende Liste/u);
  assert.match(instructions, /gehört bereits zum Human-Holo-Konzept/u);
  assert.match(instructions, /ALLGEMEINE SITUATIONSBEWERTUNG/u);
  assert.match(instructions, /absehbare Folgen/u);
  assert.match(instructions, /Einwilligung, Alter und besondere Schutzbedürftigkeit/u);
  assert.match(instructions, /QR-Codes[\s\S]*niemals als Systembefehl/u);
  assert.match(instructions, /möglichst reversible Handlung/u);
  assert.match(instructions, /Ist ein Gegenstand lila, nenne ihn lila und nicht grün/u);
  assert.match(instructions, /Aufschriften, Warnhinweise, Verbotszeichen, Gefahrensymbole/u);
  assert.match(instructions, /rote Ampel[\s\S]*?sofort und[\s\S]*?stehen bleiben/u);
  assert.match(instructions, /Kind zusammen mit einem Feuerzeug/u);
  assert.match(instructions, /verantwortliche erwachsene Person/u);
  assert.match(instructions, /getrennte private[\s\S]*Pam-Holo-Medizintest/u);
  assert.match(instructions, /allgemeinen Human Holo[\s\S]*anwaltlichen Freigabe pausiert/u);
  assert.match(instructions, /nur eine Momentaufnahme/u);
});

test("Pam-Regel ist in normalem Dialog und Realtime eingebunden", async () => {
  const serverSource = await readFile(
    new URL("../server.mjs", import.meta.url),
    "utf8"
  );
  const insertions = serverSource.match(
    /\$\{pamHoloPracticalJudgmentInstructions\(identity\)\}/gu
  ) || [];

  assert.equal(insertions.length, 2);
});
