import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEcosystemAssessment,
  classifyEcosystemUrgency,
  detectEcosystemAreas,
  ecosystemManifest,
  normalizeEcosystemText,
  renderGermanEcosystemAssessment,
  selectEcosystemHelpSources
} from "../modules/sol-holo-ecosystem.mjs";

function ids(result) {
  return result.map(area => area.id);
}

test("das Manifest deckt den ganzen vereinbarten Umfang ab", () => {
  assert.deepEqual(
    ecosystemManifest.areas.map(area => area.id),
    [
      "wasser_abwasser",
      "lebensmittel_versorgung",
      "abfall_haushalt",
      "plastik_materialien",
      "energie_mobilitaet",
      "menschen_in_not",
      "tiere_in_not",
      "medizinische_versorgung",
      "natur_ressourcen",
      "lokale_anlaufstellen",
      "investieren_beschaffen"
    ]
  );
  assert.equal(ecosystemManifest.scope, "Menschen, Tiere, Natur und Ressourcen");
  assert.ok(ecosystemManifest.principles.some(value => value.includes("allen in Not")));
  assert.ok(ecosystemManifest.system_gaps.some(value => value.id === "tiernotrettung_sonderrechte"));
});

test("deutsche Umlaute werden verlaesslich normalisiert", () => {
  assert.equal(
    normalizeEcosystemText("Öl, Müll, Feuchttücher und Straße"),
    "oel, muell, feuchttuecher und strasse"
  );
});

test("Feuchttuecher werden als Abwasser- und Abfallthema erkannt", () => {
  const result = ids(detectEcosystemAreas("Darf ich Feuchttücher in die Toilette werfen?"));
  assert.ok(result.includes("wasser_abwasser"));
  assert.ok(result.includes("abfall_haushalt"));
});

test("Fett im Abfluss und Spuelmittel werden dem Wasserschutz zugeordnet", () => {
  const result = ids(
    detectEcosystemAreas("Fett im Abfluss und zu viel Spülmittel schaden dem Wasser.")
  );
  assert.ok(result.includes("wasser_abwasser"));
  assert.ok(result.includes("abfall_haushalt"));
});

test("Hundekot und Katzenstreu landen nicht in einer pauschalen Abwasserantwort", () => {
  const assessment = buildEcosystemAssessment({
    message: "Wie entsorge ich Hundekot und Katzenstreu?"
  });
  assert.ok(ids(assessment.areas).includes("abfall_haushalt"));
  assert.ok(
    assessment.practical_steps.some(value => value.includes("oertlichen Regeln"))
  );
  assert.ok(
    assessment.practical_steps.some(value => value.includes("nie in Toilette"))
  );
});

test("Lebensmittel retten und Hilfe fuer Hunger werden gemeinsam erkannt", () => {
  const assessment = buildEcosystemAssessment({
    message: "Das Essen nicht wegwerfen, sondern an die Tafel spenden; dort braucht jemand Hilfe gegen Hunger."
  });
  assert.ok(ids(assessment.areas).includes("lebensmittel_versorgung"));
  assert.ok(ids(assessment.areas).includes("menschen_in_not"));
  assert.ok(ids(assessment.areas).includes("lokale_anlaufstellen"));
});

test("Plastik wird mit Vermeidung, Mehrweg und Gesamtwirkung verbunden", () => {
  const assessment = buildEcosystemAssessment({
    message: "Kein Plastik mehr; Mehrweg und Wiederverwenden müssen Vorrang haben."
  });
  assert.ok(ids(assessment.areas).includes("plastik_materialien"));
  assert.ok(
    assessment.project_positions.some(position =>
      position.statement.includes("So wenig Plastik")
    )
  );
});

test("E-Auto und E-Roller werden nicht als automatische Komplettloesung behandelt", () => {
  const assessment = buildEcosystemAssessment({
    message: "Keine E-Autos und E-Roller als Scheinlösung: Wohin kommen Akku und Batterie?"
  });
  assert.ok(ids(assessment.areas).includes("energie_mobilitaet"));
  assert.ok(ids(assessment.areas).includes("abfall_haushalt"));
  assert.ok(
    assessment.project_positions.some(position =>
      position.statement.includes("batterieintensiven privaten E-Autos")
    )
  );
});

test("Investitionen werden nach sozialer, oekologischer und tierfreundlicher Wirkung geprueft", () => {
  const assessment = buildEcosystemAssessment({
    message: "Soll Sol Holo in dieses Unternehmen investieren oder ist das Greenwashing?"
  });
  assert.ok(ids(assessment.areas).includes("investieren_beschaffen"));
  assert.equal(assessment.controls.payment_or_investment_performed, false);
  assert.equal(assessment.controls.external_action_performed, false);
});

test("ein menschlicher Akutnotfall hat Vorrang und verweist in Deutschland auf 112", () => {
  const assessment = buildEcosystemAssessment({
    message: "Hier ist eine Person bewusstlos, akuter Notfall!",
    country: "Deutschland",
    city: "München",
    locationConsent: true
  });
  assert.deepEqual(assessment.urgency.subject, "human");
  assert.deepEqual(assessment.urgency.level, "emergency");
  assert.ok(assessment.immediate_guidance.some(value => value.includes("112")));
  assert.ok(assessment.help_sources.some(source => source.id === "de_emergency_112"));
  assert.equal(assessment.controls.medical_diagnosis_performed, false);
  assert.equal(assessment.controls.external_action_performed, false);
});

test("ein Tiernotfall wird nicht versehentlich als menschlicher Notfall ausgegeben", () => {
  const urgency = classifyEcosystemUrgency(
    "Ein angefahrenes Tier blutet stark und braucht eine Tierklinik."
  );
  assert.equal(urgency.level, "emergency");
  assert.equal(urgency.subject, "animal");
  assert.ok(urgency.matched_signals.includes("angefahrenes tier"));
  assert.ok(urgency.matched_signals.includes("blutet stark"));
});

test("bei Tiernotfall in Muenchen wird nur eine erneut zu pruefende Stelle vorgeschlagen", () => {
  const assessment = buildEcosystemAssessment({
    message: "Ein angefahrenes Tier braucht die Tierrettung.",
    country: "DE",
    city: "Munich",
    locationConsent: true
  });
  const rescue = assessment.help_sources.find(source => source.id === "munich_animal_rescue");
  assert.ok(rescue);
  assert.equal(rescue.verification_required_before_use, true);
  assert.equal(assessment.controls.official_source_verification_required, true);
});

test("ohne Ortsfreigabe wird kein lokaler Standort unterstellt", () => {
  const assessment = buildEcosystemAssessment({
    message: "Wo ist die nächste Notunterkunft oder ein Hilfsbus?",
    country: "DE",
    city: "München",
    locationConsent: false
  });
  assert.equal(assessment.location.clarification_required, true);
  assert.equal(assessment.location.city, null);
  assert.equal(assessment.location.country, null);
  assert.equal(assessment.location.passive_device_location_used, false);
  assert.ok(assessment.help_sources.every(source => !source.city));
});

test("mit Ortsfreigabe werden offizielle Muenchner Hilfen passend gefiltert", () => {
  const assessment = buildEcosystemAssessment({
    message: "Ich suche in der Nähe eine Tafel und Hilfe bei Wohnungslosigkeit.",
    country: "Deutschland",
    city: "München",
    locationConsent: true
  });
  const sourceIds = assessment.help_sources.map(source => source.id);
  assert.ok(sourceIds.includes("munich_tafel"));
  assert.ok(sourceIds.includes("munich_homeless_support"));
  assert.ok(sourceIds.includes("de_tafel_search"));
  assert.ok(sourceIds.every(id => id !== "munich_animal_rescue"));
});

test("internationale medizinische Hilfe bleibt als globale Anlaufstelle auffindbar", () => {
  const sources = selectEcosystemHelpSources({
    areaIds: ["menschen_in_not", "medizinische_versorgung"],
    country: "DE",
    city: "Muenchen"
  });
  assert.ok(sources.some(source => source.id === "msf_global"));
});

test("die Textausgabe trennt Soforthilfe, Bereiche und Ortsrueckfrage", () => {
  const assessment = buildEcosystemAssessment({
    message: "Ein verletztes Tier braucht in der Nähe Hilfe."
  });
  const rendered = renderGermanEcosystemAssessment(assessment);
  assert.match(rendered, /Eigene Sicherheit zuerst/u);
  assert.match(rendered, /Betroffene Bereiche:/u);
  assert.match(rendered, /aktuellen Ort/u);
  assert.doesNotMatch(rendered, /habe .* alarmiert/iu);
});

test("bei einem fremden Thema behauptet der Kern keinen Treffer", () => {
  const assessment = buildEcosystemAssessment({
    message: "Welche Farbe hat mein Pullover?"
  });
  assert.equal(assessment.matched, false);
  assert.equal(assessment.controls.external_action_performed, false);
  assert.equal(assessment.controls.data_written, false);
});
