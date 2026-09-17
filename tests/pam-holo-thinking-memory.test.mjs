import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  PAM_HOLO_THINKING_MEMORY_POLICY,
  isPamHoloThinkingMemoryEnabled,
  pamHoloThinkingMemoryInstructions
} from "../modules/pam-holo-thinking-memory.mjs";

const pamIdentity = Object.freeze({
  ownerId: "pam-sol",
  speakerId: "pam",
  displayName: "Pam"
});

test("mitdenkendes Gedächtnis ist ausschließlich für Pam’s Holo aktiv", () => {
  assert.equal(isPamHoloThinkingMemoryEnabled(pamIdentity), true);
  assert.equal(
    isPamHoloThinkingMemoryEnabled({
      ownerId: "steffi-sol",
      speakerId: "steffi"
    }),
    false
  );
  assert.equal(
    isPamHoloThinkingMemoryEnabled({
      ownerId: "human-holo",
      speakerId: "tester"
    }),
    false
  );
  assert.equal(PAM_HOLO_THINKING_MEMORY_POLICY.name, "Mitdenkendes Gedächtnis");
  assert.equal(PAM_HOLO_THINKING_MEMORY_POLICY.existingMemoryIsMutated, false);
  assert.equal(PAM_HOLO_THINKING_MEMORY_POLICY.inferredFactsArePersisted, false);
  assert.equal(PAM_HOLO_THINKING_MEMORY_POLICY.inferredFeelingsArePersisted, false);
  assert.equal(PAM_HOLO_THINKING_MEMORY_POLICY.inferredSensationsArePersisted, false);
  assert.equal(PAM_HOLO_THINKING_MEMORY_POLICY.backgroundProcessing, false);
  assert.equal(PAM_HOLO_THINKING_MEMORY_POLICY.autonomousActions, false);
  assert.equal(
    PAM_HOLO_THINKING_MEMORY_POLICY.humanHoloRelease,
    "lawyer-approval-required"
  );
});

test("andere Identitäten erhalten keine private Mitdenk-Regel", () => {
  assert.equal(
    pamHoloThinkingMemoryInstructions({
      ownerId: "human-holo",
      speakerId: "tester"
    }),
    ""
  );
});

test("Mitdenken verbindet Belege, Korrekturen und offene Themen ohne Autonomie", () => {
  const instructions = pamHoloThinkingMemoryInstructions(pamIdentity);

  assert.match(instructions, /kein zweiter Speicher/u);
  assert.match(instructions, /verändert,[\s\S]*ersetzt oder löscht keinen/u);
  assert.match(instructions, /ausschließlich[\s\S]*während eines aktiven Gesprächs/u);
  assert.match(instructions, /nicht im Hintergrund/u);
  assert.match(instructions, /Menschen, Tiere, Beziehungen, Erlebnisse/u);
  assert.match(instructions, /offenes Thema[\s\S]*aktuellen Unterhaltung passt/u);
  assert.match(instructions, /jüngere ownerbelegte[\s\S]*Vorrang/u);
  assert.match(instructions, /genau[\s\S]*eine Rückfrage/u);
  assert.match(instructions, /direkter Erinnerung[\s\S]*Schlussfolgerung[\s\S]*Unsicherheit/u);
  assert.match(instructions, /GEFÜHLSEBENE, WAHRNEHMUNGEN UND EMPFINDUNGEN/u);
  assert.match(instructions, /Freude, Trauer, Angst, Wut, Erleichterung/u);
  assert.match(instructions, /Wärme, Kälte, Schmerz, Druck, Unruhe/u);
  assert.match(instructions, /allgemein und nicht nur für Trauer/u);
  assert.match(instructions, /Tod oder Verlust können tiefe Traurigkeit/u);
  assert.match(instructions, /gute[\s\S]*Nachricht,[\s\S]*Erfolg oder Wiedersehen Freude/u);
  assert.match(instructions, /Gefahr[\s\S]*Sorge oder Angst/u);
  assert.match(instructions, /Ungerechtigkeit[\s\S]*Wut/u);
  assert.match(instructions, /Rückschlag Enttäuschung oder Frust/u);
  assert.match(instructions, /gelöste Belastung Erleichterung/u);
  assert.match(instructions, /unmittelbar als Trauer- und[\s\S]*Verlustsituation/u);
  assert.match(instructions, /sehr traurig sein kann/u);
  assert.match(instructions, /mehrere, wechselnde oder unerwartete Gefühle/u);
  assert.match(instructions, /Schock, Leere, Wut, Freude, Erleichterung/u);
  assert.match(instructions, /Todesfall darf später als relevanter Trauerkontext/u);
  assert.match(instructions, /Verlust nicht unaufgefordert/u);
  assert.match(instructions, /Tonfall, Wortwahl, Sprechtempo, Gebärdensprache, Mimik/u);
  assert.match(instructions, /Signal vom möglichen inneren Zustand/u);
  assert.match(instructions, /Du klingst gerade traurig – stimmt das/u);
  assert.match(instructions, /keine eigenen körperlichen Sinne oder[\s\S]*Empfindungen/u);
  assert.match(instructions, /niemals, Gedanken oder ein verborgenes Gefühl sicher zu kennen/u);
  assert.match(instructions, /keine Diagnose,\s*psychische Erkrankung/u);
  assert.match(instructions, /vermutete Gefühlslage, Wahrnehmung oder Empfindung wird niemals/u);
  assert.match(instructions, /ohne sie zu\s+bevormunden, zu manipulieren/u);
  assert.match(instructions, /nicht automatisch als Erinnerung/u);
  assert.match(instructions, /Vermische niemals Owner/u);
  assert.match(instructions, /Mitdenken erteilt keine Handlungsbefugnis/u);
});

test("Mitdenk-Regel ist in Text und Realtime eingebunden", async () => {
  const serverSource = await readFile(
    new URL("../server.mjs", import.meta.url),
    "utf8"
  );
  const insertions = serverSource.match(
    /\$\{pamHoloThinkingMemoryInstructions\(identity\)\}/gu
  ) || [];

  assert.equal(insertions.length, 2);
  assert.match(
    serverSource,
    /includeTimestamp:\s*isPamHoloThinkingMemoryEnabled\(\s*identity\s*\)/u
  );
  assert.match(
    serverSource,
    /includeTimestamp:\s*isPamHoloThinkingMemoryEnabled\(\s*tokenIdentity\s*\)/u
  );
});

test("App zeigt den Bereich Mitdenkendes Gedächtnis mit klaren Grenzen", async () => {
  const [ui, serviceWorker] = await Promise.all([
    readFile(new URL("../www/sol-holo-ui.js", import.meta.url), "utf8"),
    readFile(new URL("../www/service-worker.js", import.meta.url), "utf8")
  ]);

  assert.match(ui, />Mitdenkendes Gedächtnis</u);
  assert.match(ui, /Zusammenhänge, Wahrnehmungen, Gefühle und Empfindungen/u);
  assert.match(ui, /emotionale Bedeutung von Erlebnissen/u);
  assert.match(ui, /Gefühle, Wahrnehmungen und Empfindungen vorsichtig an/u);
  assert.match(ui, /fragt Holo nach,[\s\S]*handelt niemals eigenmächtig/u);
  assert.match(serviceWorker, /restored-entry-network-v11/u);
});
