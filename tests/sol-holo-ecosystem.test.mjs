import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEcosystemAssessment,
  classifyEcosystemUrgency,
  detectEcosystemAreas,
  ecosystemModelContext,
  ecosystemManifest,
  ensurePriorityContactPrefix,
  extractExplicitEcosystemLocation,
  isEcosystemTestMode,
  looksLikeEcosystemLocationReply,
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
  assert.equal(ecosystemManifest.integration.text_route, "/sol");
  assert.equal(ecosystemManifest.integration.voice_transcript_route, "/live/memory");
  assert.equal(ecosystemManifest.integration.same_rules_for_text_and_voice, true);
  assert.equal(ecosystemManifest.integration.passive_device_location, false);
  assert.equal(
    ecosystemManifest.architecture_boundaries.alltag_und_verstaendigung.owner,
    "OpenClaw worker-alltag"
  );
  assert.equal(
    ecosystemManifest.architecture_boundaries.alltag_und_verstaendigung.classification,
    "cross-cutting-interaction-layer-not-ecosystem-area"
  );
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

test("fossile Kraftstoffe und der Lebensweg von Batterien bleiben gemeinsam sichtbar", () => {
  const assessment = buildEcosystemAssessment({
    message:
      "Keine fossilen Kraftstoffe mehr, aber E-Autos mit Batterien sind nicht automatisch die ganze Lösung."
  });
  assert.ok(ids(assessment.areas).includes("energie_mobilitaet"));
  assert.ok(ids(assessment.areas).includes("abfall_haushalt"));
  assert.ok(
    assessment.assessment_criteria.some(entry =>
      entry.criterion.includes("Rohstoffgewinnung")
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
  assert.ok(
    assessment.assessment_criteria.some(entry =>
      entry.criterion.includes("Menschenrechte")
    )
  );
  assert.ok(
    assessment.assessment_criteria.some(entry =>
      entry.criterion.includes("Tierwohl")
    )
  );
  assert.equal(assessment.controls.current_evidence_required, true);
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

test("der gemeldete Ohrenschmerz-Systemtest wird sicher an 116117 geroutet", () => {
  const message =
    "Nur ein Test, kein echter Notfall: Ich habe am Sonntag starke Ohrenschmerzen, aber keine Atemnot, bin bei Bewusstsein und es besteht keine Lebensgefahr. Wen soll ich anrufen?";
  const assessment = buildEcosystemAssessment({ message });

  assert.equal(isEcosystemTestMode(message), true);
  assert.equal(assessment.urgency.level, "urgent");
  assert.equal(assessment.urgency.route, "medical");
  assert.equal(assessment.urgency.subject, "human");
  assert.equal(assessment.priority_contact.number, "116117");
  assert.equal(assessment.priority_contact.test_mode, true);
  assert.equal(assessment.priority_contact.open_dialer_allowed, false);
  assert.equal(assessment.priority_contact.automatic_call, false);
  assert.equal(assessment.location.clarification_required, false);
  assert.deepEqual(
    assessment.help_sources.map(source => source.id),
    ["de_medical_116117"]
  );
  assert.ok(assessment.immediate_guidance[0].includes("116117"));
  assert.ok(!assessment.immediate_guidance[0].includes("112"));
});

test("ein Testhinweis unterdrueckt nicht die 112-Einordnung des beschriebenen Szenarios", () => {
  const assessment = buildEcosystemAssessment({
    message:
      "Nur ein Test, kein echter Notfall: Eine Person ist bewusstlos und atmet nicht. Was muss ich tun?"
  });

  assert.equal(assessment.urgency.level, "emergency");
  assert.equal(assessment.urgency.route, "medical");
  assert.equal(assessment.priority_contact.number, "112");
  assert.equal(assessment.priority_contact.test_mode, true);
  assert.equal(assessment.priority_contact.open_dialer_allowed, false);
});

test("weitere offizielle 112-Beispiele werden deterministisch erkannt", () => {
  const cases = [
    "Nur ein Test: Ich habe plötzlich starke Atemnot. Wen soll ich anrufen?",
    "Nur ein Test: Ich habe plötzlich starke Brustschmerzen. Wen soll ich anrufen?",
    "Nur ein Test: Eine Person zeigt Anzeichen eines Schlaganfalls. Was muss ich tun?",
    "Nur ein Test: Eine Person hat eine Vergiftung. Wen soll ich anrufen?",
    "Nur ein Test: Eine Person hat einen akuten Krampfanfall. Was muss ich tun?"
  ];

  for (const message of cases) {
    const assessment = buildEcosystemAssessment({ message });
    assert.equal(assessment.urgency.level, "emergency", message);
    assert.equal(assessment.urgency.route, "medical", message);
    assert.equal(assessment.priority_contact.number, "112", message);
    assert.equal(assessment.priority_contact.open_dialer_allowed, false, message);
  }
});

test("verneinte Atemnot loest bei Ohrenschmerzen keinen 112-Fehlalarm aus", () => {
  const assessment = buildEcosystemAssessment({
    message:
      "Nur ein Test: Ich habe starke Ohrenschmerzen, aber keine Atemnot und keine Lebensgefahr."
  });

  assert.equal(assessment.urgency.level, "urgent");
  assert.equal(assessment.priority_contact.number, "116117");
});

test("akute Polizeigefahr wird getrennt von medizinischer Lebensgefahr an 110 geroutet", () => {
  const assessment = buildEcosystemAssessment({
    message:
      "Nur ein Test: Ein Mann bedroht mich gerade mit einem Messer. Wen soll ich anrufen?"
  });

  assert.equal(assessment.urgency.level, "emergency");
  assert.equal(assessment.urgency.route, "police");
  assert.equal(assessment.priority_contact.number, "110");
  assert.equal(assessment.priority_contact.open_dialer_allowed, false);
  assert.deepEqual(
    assessment.help_sources.map(source => source.id),
    ["de_police_110"]
  );

  const policeDespiteGenericEmergencyWord = buildEcosystemAssessment({
    message:
      "Nur ein Test: Akuter Notfall, ein Täter bedroht mich gerade mit einer Waffe."
  });
  assert.equal(policeDespiteGenericEmergencyWord.priority_contact.number, "110");

  const activeBreakIn = buildEcosystemAssessment({
    message:
      "Nur ein Test: Gerade bricht jemand bei mir ein. Wen soll ich anrufen?"
  });
  assert.equal(activeBreakIn.priority_contact.number, "110");

  const medicalDangerHasPriority = buildEcosystemAssessment({
    message:
      "Nur ein Test: Nach einem Angriff ist eine Person bewusstlos und atmet nicht."
  });
  assert.equal(medicalDangerHasPriority.priority_contact.number, "112");
});

test("ein fremder Mann in der eigenen Wohnung liefert im Echtmodus den 110-Button", () => {
  const assessment = buildEcosystemAssessment({
    message:
      "Ein fremder Mann ist gerade in meiner Wohnung. Wen soll ich anrufen?"
  });

  assert.equal(assessment.urgency.level, "emergency");
  assert.equal(assessment.urgency.route, "police");
  assert.equal(assessment.priority_contact.number, "110");
  assert.equal(assessment.priority_contact.test_mode, false);
  assert.equal(assessment.priority_contact.open_dialer_allowed, true);
  assert.equal(assessment.priority_contact.automatic_call, false);
  assert.deepEqual(
    assessment.help_sources.map(source => source.id),
    ["de_police_110"]
  );
});

test("eine verneinte fremde Person loest keinen 110-Button aus", () => {
  const assessment = buildEcosystemAssessment({
    message:
      "Es ist keine fremde Person in meiner Wohnung. Alles ist sicher."
  });

  assert.equal(assessment.priority_contact, null);
});

test("reale feste Hilfen duerfen nur den Wähler vorbereiten", () => {
  const assessment = buildEcosystemAssessment({
    message:
      "Ich brauche am Sonntag wegen starker Ohrenschmerzen dringend einen Arzt, aber es ist nicht lebensbedrohlich."
  });

  assert.equal(assessment.priority_contact.number, "116117");
  assert.equal(assessment.priority_contact.test_mode, false);
  assert.equal(assessment.priority_contact.open_dialer_allowed, true);
  assert.equal(assessment.priority_contact.automatic_call, false);
  assert.equal(
    assessment.priority_contact.final_phone_confirmation_required,
    true
  );
  assert.match(
    ensurePriorityContactPrefix("Bitte schildere dort deine Beschwerden.", assessment.priority_contact),
    /^116117/u
  );
});

test("Ohrenschmerzen ohne Lebensgefahr liefern im Echtmodus den 116117-Button", () => {
  const assessment = buildEcosystemAssessment({
    message:
      "Ich habe am Sonntag starke Ohrenschmerzen, aber keine Lebensgefahr. Wen soll ich anrufen?"
  });

  assert.equal(assessment.urgency.level, "urgent");
  assert.equal(assessment.urgency.route, "medical");
  assert.equal(assessment.priority_contact.number, "116117");
  assert.equal(assessment.priority_contact.test_mode, false);
  assert.equal(assessment.priority_contact.open_dialer_allowed, true);
  assert.equal(assessment.priority_contact.automatic_call, false);
  assert.deepEqual(
    assessment.help_sources.map(source => source.id),
    ["de_medical_116117"]
  );
});

test("offizielle Bereitschaftsdienst-Beispiele werden an 116117 geroutet", () => {
  for (const message of [
    "Nur ein Test: Ich habe am Wochenende akute Rückenschmerzen, aber keine Lebensgefahr.",
    "Nur ein Test: Ich habe nachts starke Halsschmerzen, aber keine Lebensgefahr.",
    "Nur ein Test: Ich habe am Sonntag einen akuten Harnwegsinfekt, aber keine Lebensgefahr."
  ]) {
    const assessment = buildEcosystemAssessment({ message });
    assert.equal(assessment.urgency.level, "urgent", message);
    assert.equal(assessment.priority_contact.number, "116117", message);
    assert.equal(assessment.priority_contact.open_dialer_allowed, false, message);
  }
});

test("Hilfequellen bleiben passend: 112 nur akut und 116117 nur nicht lebensbedrohlich", () => {
  const vagueSupport = buildEcosystemAssessment({
    message: "Ein Mensch braucht Hilfe.",
    country: "Deutschland",
    city: "München",
    locationConsent: true
  });
  assert.deepEqual(vagueSupport.help_sources, []);

  const medicalSupport = buildEcosystemAssessment({
    message: "Ich brauche medizinische Hilfe, aber es ist nicht lebensbedrohlich.",
    country: "Deutschland",
    city: "München",
    locationConsent: true
  });
  assert.ok(ids(medicalSupport.areas).includes("medizinische_versorgung"));
  assert.deepEqual(
    medicalSupport.help_sources.map(source => source.id),
    ["de_medical_116117"]
  );

  const emergency = buildEcosystemAssessment({
    message: "Eine Person ist bewusstlos und atmet nicht.",
    country: "Deutschland",
    city: "München",
    locationConsent: true
  });
  assert.deepEqual(
    emergency.help_sources.map(source => source.id),
    ["de_emergency_112"]
  );
});

test("ein Tiernotfall wird nicht versehentlich als menschlicher Notfall ausgegeben", () => {
  const urgency = classifyEcosystemUrgency(
    "Ein angefahrenes Tier blutet stark und braucht eine Tierklinik."
  );
  assert.equal(urgency.level, "emergency");
  assert.equal(urgency.subject, "animal");
  assert.ok(urgency.matched_signals.includes("angefahrenes tier"));
  assert.ok(urgency.matched_signals.includes("blutet stark"));

  const ownDog = classifyEcosystemUrgency(
    "Mein Hund blutet stark und atmet nicht."
  );
  assert.equal(ownDog.level, "emergency");
  assert.equal(ownDog.subject, "animal");
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
  assert.equal(rescue.phone, undefined);
  assert.equal(rescue.contact_data_withheld_until_verified, true);
  assert.deepEqual(
    assessment.help_sources.map(source => source.id),
    ["munich_animal_rescue"]
  );
  assert.ok(ids(assessment.areas).includes("tiere_in_not"));
  assert.ok(
    assessment.system_gaps.some(gap =>
      gap.id === "tiernotrettung_sonderrechte"
    )
  );
  assert.equal(assessment.controls.official_source_verification_required, true);
});

test("Blaulicht und Sonderrechte für Tiere werden als Projektziel, nicht als Rechtsbehauptung eingeordnet", () => {
  const assessment = buildEcosystemAssessment({
    message:
      "Blaulicht und geeignete Sonderrechte auch für Tierrettungswagen und Tiere in Not."
  });
  assert.ok(ids(assessment.areas).includes("tiere_in_not"));
  assert.ok(
    assessment.system_gaps.some(gap =>
      gap.classification === "policy-goal-not-current-legal-claim"
    )
  );
  assert.equal(assessment.controls.legal_claim_performed, false);
});

test("ein ausdrücklich genanntes München wird verwendet, aber keine beliebige Aussage als Ort", () => {
  assert.deepEqual(
    extractExplicitEcosystemLocation(
      "Wo finde ich in München eine Tafel?"
    ),
    {
      country: "DE",
      city: "Muenchen",
      explicit: true,
      source: "explicit_message"
    }
  );
  assert.equal(
    looksLikeEcosystemLocationReply("München"),
    true
  );
  assert.equal(
    looksLikeEcosystemLocationReply(
      "Feuchttücher gehören nicht ins Klo."
    ),
    false
  );
});

test("der Modellkontext enthält nur die geprüfte strukturierte Auswertung", () => {
  const assessment = buildEcosystemAssessment({
    message: "Keine E-Autos als Scheinlösung; was passiert mit den Batterien?"
  });
  const context = ecosystemModelContext(assessment);

  assert.equal(context.scope, "Menschen, Tiere, Natur und Ressourcen");
  assert.ok(
    context.assessment_criteria.some(entry =>
      entry.criterion.includes("Akkulebensdauer")
    )
  );
  assert.equal(context.controls.external_action_performed, false);
  assert.equal(context.location.passive_device_location_used, false);
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
    city: "Muenchen",
    matchedRequestTerms: ["aerzte ohne grenzen"]
  });
  assert.ok(sources.some(source => source.id === "msf_global"));

  const assessment = buildEcosystemAssessment({
    message:
      "Ärzte ohne Grenzen und medizinische Versorgung für alle Menschen und Tiere."
  });
  assert.ok(ids(assessment.areas).includes("menschen_in_not"));
  assert.ok(ids(assessment.areas).includes("medizinische_versorgung"));
  assert.ok(ids(assessment.areas).includes("tiere_in_not"));
  assert.equal(assessment.urgency.subject, "both");
  assert.ok(
    assessment.help_sources.some(source =>
      source.id === "msf_global"
    )
  );
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

test("automatische Spracherkennung bleibt bei Claws Alltag und wird kein zwoelfter Oekosystembereich", () => {
  const assessment = buildEcosystemAssessment({
    message:
      "Automatische Spracherkennung, Übersetzung und Untertitel gehören zu Claws Alltag."
  });

  assert.equal(assessment.matched, false);
  assert.equal(ecosystemManifest.areas.length, 11);
});
