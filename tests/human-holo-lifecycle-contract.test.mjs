import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

const [contract, documentText, readmeText] = await Promise.all([
  readFile(new URL("data/human-holo-lifecycle-contract.de.json", root), "utf8")
    .then(JSON.parse),
  readFile(new URL("HUMAN-HOLO-LEBENSVERTRAG-13-09-2026.md", root), "utf8"),
  readFile(new URL("README.md", root), "utf8")
]);

test("der Lebensvertrag ist ownergebunden, versioniert und erweitert den Bestand", () => {
  assert.equal(contract.name, "Lebensvertrag für Holo");
  assert.equal(contract.adopted_on, "2026-09-13");
  assert.equal(
    contract.status,
    "binding-lifecycle-contract-runtime-partially-implemented"
  );
  assert.equal(
    contract.decision.project_owner_full_name,
    "Pamela Christina Nitschke"
  );
  assert.equal(contract.decision.reference_owner_id, "pam-sol");
  assert.equal(contract.decision.reference_instance, "Pam’s Holo");
  assert.equal(contract.scope.replaces_existing_contracts, false);
  assert.equal(contract.scope.extends_existing_contracts, true);
  assert.equal(contract.scope.one_person_one_separate_identity, true);
});

test("der unverrückbare Kern schützt Bestand, Ownerwillen und Wahrheit", () => {
  const rules = contract.non_negotiable;

  assert.equal(rules.preserve_existing_state_and_only_extend, true);
  assert.equal(rules.silent_delete_overwrite_or_reset_allowed, false);
  assert.equal(rules.destructive_change_requires_explicit_owner_confirmation, true);
  assert.equal(rules.unavoidable_exception_requires_early_transparency, true);
  assert.equal(rules.owner_binding_required_before_personal_access, true);
  assert.equal(
    rules.identity_inferred_from_name_voice_face_language_relationship_device_or_location,
    false
  );
  assert.equal(rules.uncertainty_must_be_visible, true);
  assert.equal(rules.hidden_total_surveillance_allowed, false);
});

test("persönliches Gedächtnis und Vertretungsbefugnis werden nie automatisch geteilt", () => {
  assert.equal(
    contract.non_negotiable.personal_memory_shared_between_owners,
    false
  );
  assert.equal(
    contract.non_negotiable.shared_experience_storage,
    "separate-owner-confirmed-copies-only"
  );
  assert.equal(contract.trusted_access.designated_trusted_person, null);
  assert.equal(contract.trusted_access.authority_inferred_from_relationship, false);
  assert.equal(contract.trusted_access.human_holo_may_issue_legal_authority, false);
  assert.equal(
    contract.trusted_access.future_authority_requires_separate_owner_decision,
    true
  );
  assert.equal(contract.trusted_access.emergency_access_default, "closed");
});

test("alle acht Lebensphasen sind vollständig und in verbindlicher Reihenfolge enthalten", () => {
  const expectedIds = [
    "setup",
    "daily_development",
    "relationships",
    "technology_change",
    "aging_and_accessibility",
    "incapacity",
    "legacy",
    "pause_and_end"
  ];
  const ids = contract.life_phases.map(({ id }) => id);

  assert.deepEqual(ids, expectedIds);
  assert.equal(new Set(ids).size, ids.length);
  for (const phase of contract.life_phases) {
    assert.ok(phase.title.length > 0);
    assert.ok(Array.isArray(phase.required));
    assert.ok(phase.required.length > 0);
    assert.ok(phase.required.every((requirement) => requirement.length > 0));
  }
});

test("Fähigkeitsstände verwenden nur ehrliche Vertragsstatus und nennen offene Nachweise", () => {
  const allowed = new Set(contract.status_vocabulary);

  assert.ok(contract.capability_status.length >= 10);
  for (const capability of contract.capability_status) {
    assert.ok(allowed.has(capability.status), capability.id);
    assert.ok(capability.not_yet_proven.length > 0, capability.id);
  }
  assert.ok(
    contract.capability_status.some(({ status }) => status === "planned-contract-only")
  );
  assert.ok(
    contract.capability_status.some(
      ({ status }) => status === "requires-owner-device-test"
    )
  );
});

test("Anbietergrenze, Wahrheitskette und Belegdateien bleiben maschinenprüfbar", async () => {
  assert.equal(contract.non_negotiable.provider_priority, "ChatGPT/OpenAI");
  assert.equal(contract.non_negotiable.automatic_provider_fallback, false);
  assert.deepEqual(contract.implementation_gates, [
    "decided",
    "documented",
    "implemented",
    "automatically-tested",
    "real-device-tested",
    "owner-confirmed"
  ]);

  const evidencePaths = new Set(
    contract.capability_status.flatMap(({ evidence }) => evidence)
  );
  await Promise.all(
    [...evidencePaths].map((path) => access(new URL(path, root)))
  );
});

test("der verständliche Vertrag wahrt Identitäts-, Vermächtnis- und Statusgrenzen", () => {
  assert.match(documentText, /BESTEHENDES BEHALTEN · NUR ERWEITERN/u);
  assert.match(documentText, /keine Vertrauensperson bestimmt/u);
  assert.match(
    documentText,
    /Keine frühere Stufe darf als eine spätere ausgegeben werden/u
  );
  assert.match(documentText, /weder eine bewiesene Bewusstseinsübertragung/u);
  assert.equal(contract.identity_boundary.consciousness_transfer_claimed, false);
  assert.equal(contract.identity_boundary.biological_person_continuity_claimed, false);
  assert.equal(contract.identity_boundary.deceased_person_present_claimed, false);
  assert.equal(
    contract.identity_boundary.new_unverified_wishes_after_death_allowed,
    false
  );
  assert.doesNotMatch(documentText, /Avatar|digitaler Zwilling|menschliche Kopie/iu);
  assert.match(
    readmeText,
    /\.\/HUMAN-HOLO-LEBENSVERTRAG-13-09-2026\.md/u
  );
});
