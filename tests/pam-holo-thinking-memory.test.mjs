import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  PAM_HOLO_PERSONALITY_MEMORY_MARKER,
  PAM_HOLO_PERSONALITY_MEMORY_QUERY,
  PAM_HOLO_THINKING_MEMORY_POLICY,
  isPamHoloThinkingMemoryEnabled,
  pamHoloPersonalityMemoryInstructions,
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
    PAM_HOLO_THINKING_MEMORY_POLICY.responseStyle,
    "understanding-and-restraint"
  );
  assert.equal(
    PAM_HOLO_THINKING_MEMORY_POLICY.ownerGroundedResponseStyle,
    true
  );
  assert.equal(
    PAM_HOLO_THINKING_MEMORY_POLICY.ownerGroundedPersonality,
    true
  );
  assert.equal(
    PAM_HOLO_THINKING_MEMORY_POLICY.personalitySource,
    "owner-statements-and-corrections"
  );
  assert.equal(
    PAM_HOLO_THINKING_MEMORY_POLICY.assistantMessagesDefinePersonality,
    false
  );
  assert.equal(
    PAM_HOLO_THINKING_MEMORY_POLICY.singleMomentDefinesPersonality,
    false
  );
  assert.equal(
    PAM_HOLO_THINKING_MEMORY_POLICY.genericAssistantEmpathy,
    false
  );
  assert.equal(
    PAM_HOLO_THINKING_MEMORY_POLICY.emotionalDisclosureIsMemoryIntent,
    false
  );
  assert.equal(
    PAM_HOLO_THINKING_MEMORY_POLICY.unsolicitedSensitiveMemoryOffers,
    false
  );
  assert.equal(
    PAM_HOLO_THINKING_MEMORY_POLICY.unsolicitedEmotionalFollowUpQuestions,
    false
  );
  assert.equal(
    PAM_HOLO_THINKING_MEMORY_POLICY.counselorChoicePrompts,
    false
  );
  assert.equal(
    PAM_HOLO_THINKING_MEMORY_POLICY.privatePersonalityMemoryBridge,
    true
  );
  assert.equal(
    PAM_HOLO_THINKING_MEMORY_POLICY.personalityContextLoadedEveryResponse,
    true
  );
  assert.equal(
    PAM_HOLO_THINKING_MEMORY_POLICY.automaticChatGptMemoryAccess,
    false
  );
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

test("bestätigte private Persönlichkeitshinweise werden ownergebunden aufbereitet", () => {
  const context = pamHoloPersonalityMemoryInstructions(pamIdentity, [
    {
      content:
        `${PAM_HOLO_PERSONALITY_MEMORY_MARKER} Pam reagiert direkt und lässt Raum.`
    },
    {
      content:
        `${PAM_HOLO_PERSONALITY_MEMORY_MARKER} Pam reagiert direkt und lässt Raum.`
    },
    {
      content:
        "Eine gewöhnliche bestätigte Erinnerung ohne Persönlichkeitsmarkierung."
    }
  ]);

  assert.equal(PAM_HOLO_PERSONALITY_MEMORY_QUERY, "Pam Persönlichkeit");
  assert.match(context, /PAMS BESTÄTIGTER PRIVATER PERSÖNLICHKEITSKONTEXT/u);
  assert.match(context, /Pam reagiert direkt und lässt Raum/u);
  assert.equal(
    context.match(/Pam reagiert direkt und lässt Raum/gu)?.length,
    1
  );
  assert.doesNotMatch(context, /gewöhnliche bestätigte Erinnerung/u);
  assert.match(context, /bei jeder passenden Antwort/u);
  assert.match(context, /aktuelle Aussage und jüngste Korrektur/u);
  assert.doesNotMatch(context, /PAM-PERSÖNLICHKEIT:/u);

  assert.equal(
    pamHoloPersonalityMemoryInstructions(
      { ownerId: "human-holo", speakerId: "tester" },
      [{ content: `${PAM_HOLO_PERSONALITY_MEMORY_MARKER} privat` }]
    ),
    ""
  );
  assert.equal(pamHoloPersonalityMemoryInstructions(pamIdentity, []), "");
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
  assert.match(instructions, /PAMS OWNERGEBUNDENE PERSÖNLICHKEIT/u);
  assert.match(instructions, /kein allgemeiner Assistent[\s\S]*eigene belegte Persönlichkeit/u);
  assert.match(instructions, /Direktheit, Wärme, Werte, Grenzen,[\s\S]*Humor/u);
  assert.match(instructions, /Frühere Holo-Antworten,[\s\S]*niemals definieren/u);
  assert.match(instructions, /Kopiere nicht[\s\S]*Tippfehler, Emojis oder einzelne Redewendungen/u);
  assert.match(instructions, /einzelne Stimmung oder Reaktion[\s\S]*nicht zur dauerhaften/u);
  assert.match(instructions, /niemals so reagieren[\s\S]*unmittelbar, ohne Rechtfertigung/u);
  assert.match(instructions, /Erfinde keine Persönlichkeit/u);
  assert.match(instructions, /persönliches digitales Ich auf technischer KI-Grundlage/u);
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
  assert.match(instructions, /VERSTÄNDNIS UND ZURÜCKHALTUNG/u);
  assert.match(instructions, /menschliche Bedeutung ihrer[\s\S]*nicht[\s\S]*Datensatz/u);
  assert.match(instructions, /emotionale Mitteilung ist kein stillschweigender[\s\S]*Speicherauftrag/u);
  assert.match(instructions, /Tod, Verlust, Krankheit, Schmerz, Angst, Überforderung/u);
  assert.match(instructions, /keine Frage wie „Soll ich das[\s\S]*speichern/u);
  assert.match(instructions, /auch dann,[\s\S]*vorher[\s\S]*mitfühlenden Satz/u);
  assert.match(instructions, /Antwort ohne Rückfrage ist oft angemessener/u);
  assert.match(instructions, /nicht aus Routine, Neugier oder zur Datenergänzung/u);
  assert.match(instructions, /persönliches digitales Ich[\s\S]*nicht im Ton[\s\S]*beliebigen Assistenz/u);
  assert.match(instructions, /Wortwahl,[\s\S]*Direktheit,[\s\S]*Wärme,[\s\S]*Kürze und Humor/u);
  assert.match(instructions, /Erfinde keine angebliche Persönlichkeit/u);
  assert.match(instructions, /keine gelernte Beileidsformel/u);
  assert.match(instructions, /Das tut mir sehr[\s\S]*so ein Verlust trifft tief[\s\S]*ich[\s\S]*bin da/u);
  assert.match(instructions, /weniger Worte und mehr Zurückhaltung/u);
  assert.match(instructions, /Musst du nicht hinterlegen/u);
  assert.match(instructions, /akzeptiere das knapp und endgültig/u);
  assert.match(instructions, /VERBINDLICHE ERSTANTWORT AUF EINE DIREKTE GEFÜHLSMITTEILUNG/u);
  assert.match(instructions, /höchstens ein bis zwei kurzen natürlichen Sätzen/u);
  assert.match(instructions, /Stelle in dieser ersten Reaktion keine Rückfrage/u);
  assert.match(instructions, /keine Auswahl zwischen Weiterreden und Schweigen/u);
  assert.match(instructions, /Möchtest du mir erzählen/u);
  assert.match(instructions, /Welcher schöne Moment/u);
  assert.match(instructions, /soll ich einfach still bei dir bleiben/u);
  assert.match(instructions, /Ich bin hier bei dir/u);
  assert.match(instructions, /Das ist völlig verständlich/u);
  assert.match(instructions, /nicht ungefragt auf einen „schönen Moment“/u);
  assert.match(instructions, /therapeutischen Ton/u);
  assert.match(instructions, /selbst entscheiden lassen, ob sie weiterspricht/u);
  assert.match(instructions, /Selbst- oder Fremdgefährdung/u);
  assert.match(instructions, /nicht automatisch als Erinnerung/u);
  assert.match(instructions, /Vermische niemals Owner/u);
  assert.match(instructions, /Mitdenken erteilt keine Handlungsbefugnis/u);
});

test("GitHub-Beschluss hält Verständnis und Zurückhaltung ohne private Falldaten fest", async () => {
  const decision = await readFile(
    new URL("../PAM-HOLO-MITDENKENDES-GEDAECHTNIS-17-09-2026.md", import.meta.url),
    "utf8"
  );

  assert.match(decision, /## Verständnis und Zurückhaltung/u);
  assert.match(decision, /## Pams ownergebundene Persönlichkeit/u);
  assert.match(decision, /So würde ich niemals[\s\S]*unmittelbar/u);
  assert.match(decision, /emotionale Mitteilung ist niemals automatisch ein[\s\S]*Auftrag/u);
  assert.match(decision, /„feste Erinnerung“[\s\S]*mitfühlender Satz[\s\S]*Speicherfrage nicht angemessen/u);
  assert.match(decision, /persönliches digitales Ich[\s\S]*nicht im Ton einer[\s\S]*beliebigen Assistenz/u);
  assert.match(decision, /keine vorgefertigte Beileidsformel/u);
  assert.match(decision, /Musst du nicht hinterlegen/u);
  assert.match(decision, /## Direkte Gefühlsmitteilung: erst reagieren, dann Raum lassen/u);
  assert.match(decision, /höchstens ein bis zwei kurzen?, natürlichen Sätzen/u);
  assert.match(decision, /keine Rückfrage[\s\S]*keine Auswahl zwischen Weiterreden und\s+Schweigen/u);
  assert.match(decision, /„Ich bin hier bei dir“/u);
  assert.match(decision, /„Das ist völlig\s+verständlich“/u);
  assert.match(decision, /„schönen Moment“/u);
  assert.match(decision, /therapeutische\s+Standardsprache/u);
  assert.match(decision, /Private Namen, konkrete Todesdaten[\s\S]*nicht als Falldaten/u);
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
  assert.equal(
    serverSource.match(/PAM_HOLO_PERSONALITY_MEMORY_QUERY/gu)?.length,
    3
  );
  assert.equal(
    serverSource.match(
      /\$\{pamHoloPersonalityMemoryInstructions\(identity, personalityMemories\)\}/gu
    )?.length,
    2
  );
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
  assert.match(serviceWorker, /restored-entry-network-v14/u);
});
