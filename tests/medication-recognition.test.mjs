import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  MEDICATION_RECOGNITION_RESPONSE_FORMAT,
  formatMedicationRecognitionAnswer,
  isMedicationRecognitionRequest,
  medicationRecognitionInstructions,
  parseMedicationRecognitionResult,
  sanitizeMedicationRecognitionResult
} from "../modules/medication-recognition.mjs";

const readText = path =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const server = readText("server.mjs");
const html = readText("www/index.html");
const ui = readText("www/sol-holo-ui.js");
const css = readText("www/sol-holo-ui.css");
const privacy = readText("www/datenschutz-medikamentenerkennung.html");
const documentation = readText(
  "HUMAN-HOLO-MEDIKAMENTENERKENNUNG-10-09-2026.md"
);

test("nur ein Medikamentenfoto wird als Erkennungsweg eingestuft", () => {
  assert.equal(
    isMedicationRecognitionRequest(
      "Bitte erkenne diese Medikamentenverpackung.",
      { hasImage: true }
    ),
    true
  );
  assert.equal(
    isMedicationRecognitionRequest(
      "Bitte lies diesen beschrifteten Blister.",
      { hasImage: true }
    ),
    true
  );
  assert.equal(
    isMedicationRecognitionRequest(
      "Was weißt du allgemein über Medikamente?",
      { hasImage: false }
    ),
    false
  );
  assert.equal(
    isMedicationRecognitionRequest("Beschreibe das Essen.", { hasImage: true }),
    false
  );
});

test("das strukturierte Ergebnis enthält keine Dosierungsentscheidung", () => {
  const schema = MEDICATION_RECOGNITION_RESPONSE_FORMAT.schema;

  assert.equal(MEDICATION_RECOGNITION_RESPONSE_FORMAT.strict, true);
  assert.equal(schema.additionalProperties, false);
  assert.equal(Object.hasOwn(schema.properties, "dosage"), false);
  assert.equal(Object.hasOwn(schema.properties, "dose"), false);
  assert.deepEqual(
    Object.keys(schema.properties).sort(),
    [
      "status",
      "medicine_name",
      "active_ingredient",
      "strength",
      "dosage_form",
      "package_size",
      "manufacturer",
      "expiry_date",
      "uncertainty"
    ].sort()
  );
});

test("unsichere und unzulässige Modelltexte werden geschlossen bereinigt", () => {
  const result = sanitizeMedicationRecognitionResult({
    status: "package",
    medicine_name: "Beispiel 400",
    active_ingredient: "Ibuprofen",
    strength: "400 mg",
    dosage_form: "Nimm täglich zwei Tabletten",
    package_size: "20 Filmtabletten",
    manufacturer: "Beispiel GmbH",
    expiry_date: "12/2028",
    uncertainty: "",
    dosage: "2 täglich"
  });

  assert.equal(result.medicine_name, "Beispiel 400");
  assert.equal(result.strength, "400 mg");
  assert.equal(result.dosage_form, "");
  assert.equal(Object.hasOwn(result, "dosage"), false);

  const invalid = parseMedicationRecognitionResult("keine JSON-Antwort");
  assert.equal(invalid.status, "uncertain");
  assert.match(invalid.uncertainty, /nicht zuverlässig/u);
});

test("die sichtbare Antwort bleibt Packungslesung statt Medizinentscheidung", () => {
  const answer = formatMedicationRecognitionAnswer({
    status: "blister",
    acute_emergency: false,
    medicine_name: "Beispiel 500",
    active_ingredient: "Beispielstoff",
    strength: "500 mg",
    dosage_form: "Filmtabletten",
    package_size: "20 Filmtabletten",
    manufacturer: "Beispiel GmbH",
    expiry_date: "10/2029",
    uncertainty: ""
  });

  assert.match(answer, /Gesundheitsfunktion · Medikamentenerkennung/u);
  assert.match(answer, /Medikament: Beispiel 500/u);
  assert.match(answer, /Wirkstärke: 500 mg/u);
  assert.match(answer, /kein Medizinprodukt/u);
  assert.match(answer, /keine Diagnose/u);
  assert.match(answer, /Dosierung, Einnahme, Eignung oder Therapie/u);

  const loose = formatMedicationRecognitionAnswer({
    status: "loose_medicine"
  });
  assert.match(loose, /lose Tablette oder Kapsel identifiziere ich nicht/u);

  const emergency = formatMedicationRecognitionAnswer(
    { status: "uncertain" },
    { message: "Ich habe zu viel genommen und bekomme keine Luft." }
  );
  assert.match(emergency, /^112/u);
});

test("Text- und Realtime-Weg erhalten dieselben festen Gesundheitsgrenzen", () => {
  const instructions = medicationRecognitionInstructions("Pam");
  assert.match(instructions, /kein Medizinprodukt/u);
  assert.match(instructions, /Identifiziere niemals lose Tabletten oder Kapseln/u);
  assert.match(instructions, /persönliche Dosierung/u);
  assert.match(instructions, /Gesundheit → Medikamentenerkennung/u);
  assert.equal(
    (server.match(/\$\{medicationRecognitionInstructions\(/gu) || []).length,
    3,
    "Realtime, normaler Textweg und isolierte Fotoauswertung brauchen dieselbe Grenze"
  );
});

test("Backend verlangt Einzelfreigabe vor Gedächtnis und Bildanalyse", () => {
  const route = server.slice(server.indexOf('app.post("/sol"'));
  const gate = route.indexOf("MEDICATION_RECOGNITION_CONSENT_REQUIRED");
  const memoryWrite = route.indexOf('saveFulltimeMemory(\n      "user"');
  const providerCall = route.indexOf("openai.responses.create");

  assert.ok(gate >= 0);
  assert.ok(memoryWrite > gate);
  assert.ok(providerCall > memoryWrite);
  assert.match(route, /req\.body\?\.medicationRecognitionConsent ===\s*\n\s*true/u);
  assert.match(route, /responseRequest\.store = false/u);
  assert.match(route, /MEDICATION_RECOGNITION_RESPONSE_FORMAT/u);
  assert.match(route, /rawImageStoredInFulltimeMemory: false/u);
  assert.match(route, /responseStoredInFulltimeMemory: true/u);
  assert.match(
    route,
    /const memories =\s*\n\s*medicationRecognitionRequested\s*\n\s*\? \[\]/u
  );
  assert.match(
    route,
    /responseRequest\.instructions = `[\s\S]*?Gib ausschließlich das verlangte strukturierte JSON aus/u
  );
});

test("App zeigt die Gesundheitsfreigabe vor Kamera oder Galerie", () => {
  const homeMarkup = ui.match(/humanHoloHome\.innerHTML = `([\s\S]*?)`;\n/u)?.[1] ?? "";
  const healthCard = homeMarkup.match(
    /<button class="humanHoloAreaCard humanHoloAreaCard--health"[\s\S]*?<\/button>/u
  )?.[0] ?? "";

  assert.equal((homeMarkup.match(/class="humanHoloAreaCard /gu) || []).length, 8);
  assert.match(healthCard, /data-open-view="medication"/u);
  assert.match(ui, /medicationView\.id = "medicationView"/u);
  assert.match(ui, /Gesundheitsfunktion · Medikamentenerkennung/u);
  assert.match(ui, /Zustimmen &amp; Kamera öffnen/u);
  assert.match(ui, /Zustimmen &amp; Foto auswählen/u);
  assert.match(ui, /einmalig zur Bilderkennung an\n\s*<strong>ChatGPT\/OpenAI<\/strong>/u);
  assert.match(ui, /Andere Gesundheitsfrage stellen/u);
  assert.match(ui, /Ich möchte zum Bereich Gesundheit\. Hilf mir dort bitte weiter\./u);
  assert.match(css, /#medicationView/u);
  assert.match(css, /\.medicationDisclosure/u);
});

test("Client überträgt die Freigabe nur nach bestätigtem Hinweis", () => {
  const sendStart = html.indexOf("async function sendMessage(");
  const sendEnd = html.indexOf("sendButton.addEventListener(", sendStart);
  const sendSource = html.slice(sendStart, sendEnd);

  assert.match(sendSource, /authorizeRequest\?\.\(\{/u);
  assert.match(sendSource, /medicationAuthorization\.required &&\s*\n\s*!medicationAuthorization\.granted/u);
  assert.match(sendSource, /das Foto wurde nicht übertragen/u);
  assert.match(sendSource, /medicationRecognitionConsent,/u);
  assert.ok(
    sendSource.indexOf("authorizeRequest") <
      sendSource.indexOf("addMessage(\n      identity.displayName")
  );
});

test("Datenschutz und Play-Erklärung nennen Zweck, Anbieter und Grenzen", () => {
  assert.match(privacy, /Projektinhaberin: <strong>Pamela Christina Nitschke/u);
  assert.match(privacy, /an <strong>OpenAI<\/strong> übertragen/u);
  assert.match(privacy, /Bilddatei selbst nicht im ownergebundenen/u);
  assert.match(privacy, /kein Medizinprodukt/u);
  assert.match(privacy, /Löschanliegen/u);
  assert.match(documentation, /Medication and treatment management/u);
  assert.match(documentation, /Medical reference and education/u);
  assert.match(documentation, /Play-Console-Erklärung ist ein eigener Veröffentlichungsschritt/u);
  assert.match(documentation, /support\.google\.com\/googleplay/u);
});
