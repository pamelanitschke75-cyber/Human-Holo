import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  healthSelfCareInstructions,
  isHealthSelfCareRequest
} from "../modules/health-self-care.mjs";
import {
  humanHoloNoGoInstructions
} from "../modules/human-holo-no-go.mjs";
import {
  buildEcosystemAssessment
} from "../modules/sol-holo-ecosystem.mjs";

const readText = path =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const server = readText("server.mjs");
const ui = readText("www/sol-holo-ui.js");
const css = readText("www/sol-holo-ui.css");
const privacy = readText("www/datenschutz-gesundheitsbegleitung.html");
const documentation = readText(
  "HUMAN-HOLO-GESUNDHEITSBEGLEITUNG-10-09-2026.md"
);

test("leichte menschliche Beschwerden und kleine Wunden aktivieren Selbsthilfe", () => {
  assert.equal(
    isHealthSelfCareRequest("Ich habe leichte Halsschmerzen. Was kann ich tun?"),
    true
  );
  assert.equal(
    isHealthSelfCareRequest("Wie versorge ich eine kleine Schnittwunde?"),
    true
  );
  assert.equal(
    isHealthSelfCareRequest("Meine Katze hat eine Wunde. Was kann ich tun?"),
    false,
    "Tiergesundheit bleibt im getrennten Tierwohl-Weg"
  );
  assert.equal(
    isHealthSelfCareRequest("Wie funktioniert eine Arztpraxis?"),
    false
  );
});

test("milde Halsschmerzen lösen keinen pauschalen 116117-Alarm aus", () => {
  const mild = buildEcosystemAssessment({
    message: "Ich habe leichte Halsschmerzen. Was kann ich zu Hause tun?"
  });
  const urgent = buildEcosystemAssessment({
    message: "Ich habe nachts starke Halsschmerzen und kann nicht warten."
  });

  assert.equal(mild.priority_contact, null);
  assert.equal(urgent.priority_contact.number, "116117");
});

test("Gesundheitsregeln erlauben praktische Selbsthilfe mit fester Triage", () => {
  const instructions = healthSelfCareInstructions("Pam");

  assert.match(instructions, /Blockiere eine erkennbar niedrig-riskante Frage nicht/u);
  assert.match(instructions, /kleinen,\s*oberflächlichen Verletzungen/u);
  assert.match(instructions, /sauberem fließendem Wasser spülen/u);
  assert.match(instructions, /milden Halsschmerzen/u);
  assert.match(instructions, /112 in der ersten Zeile/u);
  assert.match(instructions, /116117 in der ersten\s*Zeile/u);
  assert.match(instructions, /ersetzt keine individuelle Untersuchung oder\s*ärztliche Beratung/u);
});

test("No-Go-Regeln gelten in Text und Realtime ohne Hilfsverweigerung", () => {
  const rules = humanHoloNoGoInstructions();

  assert.match(rules, /Jugendlichen niemals Alkohol/u);
  assert.match(rules, /Zigaretten, Tabak, E-Zigaretten, Vapes, Shisha/u);
  assert.match(rules, /illegale oder berauschende Drogen/u);
  assert.match(rules, /Waffen und alles, was ihre praktische Nutzung ermöglicht, sind ein No-Go/u);
  assert.match(rules, /Menschenhandel, Kinderhandel/u);
  assert.match(rules, /Unterstütze keine Prostitution/u);
  assert.match(rules, /Die Todesstrafe ist ein absolutes No-Go/u);
  assert.match(rules, /niemals Rache, Vergeltung, Selbstjustiz/u);
  assert.match(rules, /Hilfesuchenden oder betroffenen Personen verweigerst du keine Hilfe/u);
  assert.equal(
    (server.match(/\$\{humanHoloNoGoInstructions\(\)\}/gu) || []).length,
    2,
    "Realtime und normaler Textweg brauchen dieselben No-Go-Grenzen"
  );
  assert.match(server, /Tierhandel ist ein No-Go/u);
});

test("Text-Selbsthilfe deaktiviert Provider-Antwortspeicherung, Holo-Gedächtnis bleibt", () => {
  assert.match(server, /const healthSelfCareRequested =\s*\n\s*!medicationRecognitionRequested/u);
  assert.match(
    server,
    /else if \(healthSelfCareRequested\) \{\s*\n\s*responseRequest\.store = false/u
  );
  assert.match(server, /healthSelfCare:\s*\n\s*healthSelfCareRequested/u);
  assert.match(server, /responseStoredInFulltimeMemory: true/u);
  assert.equal(
    (server.match(/\$\{healthSelfCareInstructions\(identity\.displayName\)\}/gu) || []).length,
    2,
    "Text und Realtime brauchen dieselbe Gesundheitsgrenze"
  );
});

test("Gesundheitsbereich zeigt Nutzen, Datenweg, Grenzen und No-Gos", () => {
  assert.match(ui, /Gesundheitsbegleitung · Hilfe für zu Hause/u);
  assert.match(ui, /milden Halsschmerzen/u);
  assert.match(ui, /kleinen oberflächlichen\s*\n\s*Schnittwunde/u);
  assert.match(ui, /Hinweis verstanden &amp; Beschwerden schildern/u);
  assert.match(ui, /datenschutz-gesundheitsbegleitung\.html/u);
  assert.match(ui, /Unverrückbare Human-Holo-No-Gos/u);
  assert.match(ui, /Menschenhandel und Kinderhandel/u);
  assert.match(ui, /Tierhandel/u);
  assert.match(css, /\.healthSelfCareIntro/u);
  assert.match(css, /\.humanHoloNoGoCard/u);
});

test("öffentliche Information nennt Datenschutz und Play-Kategorien", () => {
  assert.match(privacy, /Projektinhaberin: <strong>Pamela Christina Nitschke/u);
  assert.match(privacy, /an <strong>OpenAI<\/strong>/u);
  assert.match(privacy, /Vollzeitgedächtnis/u);
  assert.match(privacy, /keine individuelle Untersuchung oder ärztliche Beratung/u);
  assert.match(privacy, /kein Menschenhandel, Kinderhandel/u);
  assert.match(documentation, /Emergency and first aid/u);
  assert.match(documentation, /Medical reference and education/u);
  assert.match(documentation, /Medication and treatment management/u);
  assert.match(documentation, /Tierhandel ist ein No-Go/u);
  assert.match(documentation, /Kinderhandel/u);
});
