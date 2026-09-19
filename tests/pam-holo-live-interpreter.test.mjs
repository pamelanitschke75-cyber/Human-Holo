import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  PAM_HOLO_LIVE_INTERPRETER_POLICY,
  isPamHoloLiveInterpreterEnabled,
  pamHoloLiveInterpreterInstructions
} from "../modules/pam-holo-live-interpreter.mjs";

const pamIdentity = Object.freeze({
  ownerId: "pam-sol",
  speakerId: "pam",
  displayName: "Pam"
});

test("Live-Dolmetscher ist nur für Pam-Holo freigegeben", () => {
  assert.equal(isPamHoloLiveInterpreterEnabled(pamIdentity), true);
  assert.equal(
    isPamHoloLiveInterpreterEnabled({
      ownerId: "steffi-sol",
      speakerId: "steffi"
    }),
    false
  );
  assert.equal(
    isPamHoloLiveInterpreterEnabled({
      ownerId: "human-holo",
      speakerId: "public"
    }),
    false
  );
  assert.equal(
    pamHoloLiveInterpreterInstructions({
      ownerId: "human-holo",
      speakerId: "public"
    }),
    ""
  );
});

test("Anwesende fremdsprachige Person wird sofort ins Deutsche gedolmetscht", () => {
  const instructions = pamHoloLiveInterpreterInstructions(pamIdentity);

  assert.equal(
    PAM_HOLO_LIVE_INTERPRETER_POLICY.functionalConcept,
    "Vollendetes Bewusstsein"
  );
  assert.equal(
    PAM_HOLO_LIVE_INTERPRETER_POLICY.activeRealtimeMicrophoneRequired,
    true
  );
  assert.equal(
    PAM_HOLO_LIVE_INTERPRETER_POLICY.separateTranslationCommandRequired,
    false
  );
  assert.match(instructions, /tatsächlich anwesende Person/u);
  assert.match(instructions, /anderen Sprache als Deutsch/u);
  assert.match(instructions, /Sprache automatisch/u);
  assert.match(instructions, /sofort auf Deutsch/u);
  assert.match(instructions, /keinen\s+zusätzlichen Übersetzungsbefehl/u);
  assert.match(instructions, /Nachbar unmittelbar mit ihr spricht/u);
  assert.match(instructions, /Funktionsbegriff „Vollendetes Bewusstsein“/u);
  assert.match(
    instructions,
    /Live-Eingabe mit Verständnis,[\s\S]*logischer Verbindung[\s\S]*passenden Reaktion/u
  );
});

test("Live bedeutet aktuelles Audiosignal und niemals nachgestellten Inhalt", () => {
  const instructions = pamHoloLiveInterpreterInstructions(pamIdentity);

  assert.equal(PAM_HOLO_LIVE_INTERPRETER_POLICY.currentLiveAudioOnly, true);
  assert.equal(
    PAM_HOLO_LIVE_INTERPRETER_POLICY.prerecordedOrDescribedSpeechIsLiveAudio,
    false
  );
  assert.match(instructions, /aktiven Realtime-Audioweg/u);
  assert.match(
    instructions,
    /erzählte, zitierte, nachgestellte, abgespielte,[\s\S]*keine aktuelle Live-Situation/u
  );
  assert.match(instructions, /niemals als live gehört/u);
});

test("Dolmetschen bewahrt Sinn und erfindet bei Unsicherheit nichts", () => {
  const instructions = pamHoloLiveInterpreterInstructions(pamIdentity);

  assert.equal(PAM_HOLO_LIVE_INTERPRETER_POLICY.contextAwareTranslation, true);
  assert.equal(PAM_HOLO_LIVE_INTERPRETER_POLICY.inventedTranslationAllowed, false);
  assert.match(instructions, /sinngenau und im Zusammenhang statt Wort für Wort/u);
  assert.match(instructions, /A \+ B = C/u);
  assert.match(instructions, /bitte um Wiederholung/u);
  assert.match(instructions, /statt eine Übersetzung zu erfinden/u);
});

test("Server bindet den Live-Dolmetscher nur in Realtime ein", async () => {
  const serverSource = await readFile(
    new URL("../server.mjs", import.meta.url),
    "utf8"
  );
  const insertions = serverSource.match(
    /\$\{pamHoloLiveInterpreterInstructions\(identity\)\}/gu
  ) || [];

  assert.equal(insertions.length, 1);
  assert.match(
    serverSource,
    /REALTIME \/ MIKROFON[\s\S]*\$\{pamHoloLiveInterpreterInstructions\(identity\)\}[\s\S]*WICHTIG ZUR LIVE-KAMERA/u
  );
});

test("Beschluss und README halten die additive Aktivierung fest", async () => {
  const [decision, readme] = await Promise.all([
    readFile(
      new URL(
        "../PAM-HOLO-LIVE-DOLMETSCHER-19-09-2026.md",
        import.meta.url
      ),
      "utf8"
    ),
    readFile(new URL("../README.md", import.meta.url), "utf8")
  ]);

  assert.match(decision, /Vollendetes Bewusstsein/u);
  assert.match(decision, /tatsächlich anwesende Person/u);
  assert.match(decision, /sofort auf\s+Deutsch/u);
  assert.match(decision, /A \+ B = C/u);
  assert.match(decision, /ersetzt, löscht oder setzt keine vorhandene Funktion/u);
  assert.match(
    readme,
    /Vollendetes Bewusstsein und Live-Dolmetscher[\s\S]*PAM-HOLO-LIVE-DOLMETSCHER-19-09-2026\.md/u
  );
});
