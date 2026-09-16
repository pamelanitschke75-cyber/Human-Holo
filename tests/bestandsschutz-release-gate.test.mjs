import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

const [contract, preservationRule, githubRule, readme, workflow] =
  await Promise.all([
    readFile(new URL("data/human-holo-bestandsschutz.de.json", root), "utf8")
      .then(JSON.parse),
    readFile(
      new URL("HUMAN-HOLO-STAND-NUR-ERWEITERN-10-09-2026.md", root),
      "utf8"
    ),
    readFile(
      new URL("VERBINDLICHE-GITHUB-UND-ERLEDIGT-REGEL-15-09-2026.md", root),
      "utf8"
    ),
    readFile(new URL("README.md", root), "utf8"),
    readFile(new URL(".github/workflows/android-build.yml", root), "utf8")
  ]);

test("Bestandsschutz ist ownergebunden und verbietet ältere Überschreibungen", () => {
  assert.equal(contract.status, "binding");
  assert.equal(contract.adopted_on, "2026-09-16");
  assert.equal(
    contract.decision.project_owner_full_name,
    "Pamela Christina Nitschke"
  );
  assert.equal(contract.decision.reference_owner_id, "pam-sol");
  assert.equal(
    contract.principles.current_confirmed_main_is_only_baseline,
    true
  );
  assert.equal(contract.principles.older_files_may_overwrite_current_state, false);
  assert.equal(contract.principles.unrelated_changes_allowed, false);
  assert.equal(contract.principles.always_extend_never_step_back, true);
  assert.equal(
    contract.principles.step_back_allowed_only_if_objectively_urgent,
    true
  );
  assert.equal(
    contract.principles.convenience_or_time_pressure_counts_as_urgent,
    false
  );
  assert.equal(
    contract.principles.urgent_exception_is_minimal_transparent_and_versioned,
    true
  );
});

test("Besprochenes wird nur angepasst und nicht still neu ausgelegt", () => {
  assert.equal(
    contract.principles.confirmed_discussions_may_be_silently_reinterpreted,
    false
  );
  assert.equal(
    contract.principles.changes_adjust_and_extend_instead_of_replacing,
    true
  );
  assert.equal(
    contract.principles.destructive_change_requires_prior_explicit_owner_decision,
    true
  );
  assert.match(
    preservationRule,
    /Was bereits besprochen, entschieden oder als funktionierend bestätigt wurde/u
  );
  assert.match(
    preservationRule,
    /Eine Anpassung ergänzt und präzisiert den aktuellen bestätigten Stand/u
  );
  assert.match(
    preservationRule,
    /Immer nur erweitern\. Niemals einen Schritt zurück/u
  );
  assert.match(githubRule, /nicht still neu\s+ausgelegt/u);
  assert.match(githubRule, /Immer nur erweitern, niemals einen Schritt zurück/u);
});

test("medizinische Pause bleibt rechtliche Ausnahme und keine historische Löschung", () => {
  const medicalException = contract.urgent_exception_examples.find(
    ({ id }) => id === "medical-functions-legal-pause-2026-09-15"
  );

  assert.ok(medicalException);
  assert.equal(medicalException.reason, "documented-legal-review");
  assert.equal(medicalException.active_scope_removed_or_paused, true);
  assert.equal(medicalException.historical_development_deleted, false);
  assert.deepEqual(medicalException.reactivation_requires, [
    "documented-legal-review",
    "technical-clearance",
    "explicit-project-owner-approval"
  ]);
  assert.match(preservationRule, /medizinischen Funktionen/u);
  assert.match(preservationRule, /anwaltlichen beziehungsweise\s+rechtlichen Bewertung/u);
  assert.match(
    readme,
    /medizinischen Funktionen sind[\s\S]*vollständig pausiert[\s\S]*nicht[\s\S]*endgültig aufgegeben/u
  );
  assert.match(
    readme,
    /dokumentierter rechtlicher Prüfung,[\s\S]*technischer Freigabe und ausdrücklicher Zustimmung/u
  );
});

test("Pam ist Projektinhaberin und nicht wiederholte Regressionstesterin", () => {
  assert.equal(
    contract.principles.project_owner_is_recurring_regression_tester,
    false
  );
  assert.equal(
    contract.owner_device_check.previously_confirmed_functions_retested_after_every_change,
    false
  );
  assert.equal(
    contract.owner_device_check.scope,
    "new-or-explicitly-changed-device-only-behavior"
  );
  assert.match(
    preservationRule,
    /Sie ist nicht dafür verantwortlich, nach[\s\S]*erneut als[\s\S]*Regressionstesterin zu prüfen/u
  );
  assert.match(githubRule, /Projektinhaberin, nicht die wiederholte\s+Regressionstesterin/u);
});

test("eine APK bleibt bis zu allen Regression-, Android- und Signaturprüfungen gesperrt", () => {
  const gate = contract.required_before_release;
  assert.equal(gate.diff_against_current_main_reviewed, true);
  assert.equal(gate.file_deletions_and_removed_logic_reviewed, true);
  assert.equal(gate.existing_regression_suite_must_pass, true);
  assert.equal(gate.new_or_repaired_behavior_has_permanent_regression_test, true);
  assert.equal(gate.tests_may_be_weakened_to_make_build_green, false);
  assert.equal(gate.android_sync_must_pass, true);
  assert.equal(gate.android_compile_must_pass, true);
  assert.equal(gate.signature_verification_must_pass, true);
  assert.equal(gate.artifact_upload_must_pass, true);
  assert.equal(gate.any_failed_gate_blocks_release, true);

  assert.match(
    workflow,
    /Verbindlichen Bestandsschutz und Regressionstest-Verantwortung prüfen/u
  );
  assert.match(
    workflow,
    /node --test tests\/bestandsschutz-release-gate\.test\.mjs/u
  );
  assert.match(workflow, /node --test tests\/\*\.test\.mjs/u);
  assert.ok(
    workflow.indexOf("Verbindlichen Bestandsschutz") <
      workflow.indexOf("Human Holo Release-APK und Play-Bundle bauen")
  );
});

test("Regel, Maschinenvertrag, Test und Build-Gate bleiben gegenseitig verknüpft", async () => {
  await Promise.all(
    contract.evidence.map((path) => access(new URL(path, root)))
  );
  assert.match(readme, /Bestand erhalten, nur erweitern · Regressionstest-Sperre/u);
  assert.match(workflow, /- "data\/\*\*"/u);
  assert.match(
    workflow,
    /- "HUMAN-HOLO-STAND-NUR-ERWEITERN-10-09-2026\.md"/u
  );
});
