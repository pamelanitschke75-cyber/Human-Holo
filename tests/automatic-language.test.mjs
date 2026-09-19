import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  HUMAN_HOLO_LANGUAGE_POLICY,
  automaticLanguageInstructions,
  automaticReplyLanguageInstructions,
  createAutomaticTranscriptionConfig
} from "../modules/automatic-language.mjs";

const serverSource = await readFile(
  new URL("../server.mjs", import.meta.url),
  "utf8"
);

test("Eingabesprache bleibt automatisch erkennbar", () => {
  const transcription = createAutomaticTranscriptionConfig();
  assert.deepEqual(transcription, { model: "gpt-transcribe" });
  assert.equal(Object.hasOwn(transcription, "language"), false);
  assert.equal(HUMAN_HOLO_LANGUAGE_POLICY.fixedAllowlist, false);
  assert.equal(HUMAN_HOLO_LANGUAGE_POLICY.automaticInputDetection, true);
});

test("Pam wird standardmäßig auf Deutsch angesprochen", () => {
  const instructions = automaticLanguageInstructions("Pam");
  assert.equal(HUMAN_HOLO_LANGUAGE_POLICY.pamDefaultReplyLanguage, "de");
  assert.equal(HUMAN_HOLO_LANGUAGE_POLICY.pamRealtimeLiveInterpreterException, true);
  assert.match(instructions, /ANTWORTSPRACHE IST STANDARDMÄSSIG DEUTSCH/u);
  assert.match(instructions, /ausdrücklich eine andere Antwortsprache/u);
  assert.match(instructions, /Danach kehrst du automatisch zu Deutsch zurück/u);
  assert.match(instructions, /ownergebundenen Realtime-Live-Dolmetschers/u);
});

test("Pam kann andere Sprachen nutzen ohne die deutsche Antwortsprache zu verlieren", () => {
  const instructions = automaticLanguageInstructions("Pam");
  assert.match(instructions, /Verstehe Pams aktuellen Beitrag automatisch in jeder Sprache/u);
  assert.match(instructions, /Dialekt, Umgangssprache, Mischsprache und Code-Switching/u);
  assert.match(instructions, /Englisch, Spanisch oder in einer anderen[\s\S]*?antwortest du ihr auf Deutsch/u);
});

test("Schrift Sprache und Gebärde verwenden denselben Kern", () => {
  const instructions = automaticLanguageInstructions("Pam");
  assert.equal(HUMAN_HOLO_LANGUAGE_POLICY.modalityParityRequired, true);
  assert.match(instructions, /Sprache, Schrift und Gebärdensprache sind nur unterschiedliche Eingabewege/u);
  assert.match(instructions, /Kein Eingabeweg darf weniger Erinnerungen/u);
  assert.match(instructions, /semantisch genauso[\s\S]*?wie derselbe Inhalt in Sprache oder Schrift/u);
});

test("Text und Realtime erhalten denselben Pam-Sprachvertrag", () => {
  const insertions = serverSource.match(
    /\$\{automaticLanguageInstructions\(identity\.displayName\)\}/gu
  ) || [];
  assert.equal(insertions.length, 2);
  assert.match(serverSource, /transcription:\s*\n\s*createAutomaticTranscriptionConfig\(\)/u);
});

test("Live-Wetter und Alltags-Websuche erben Pams deutsche Antwortsprache", () => {
  assert.ok(
    serverSource.includes(
      'automaticReplyLanguageInstructions(identity?.displayName || "")'
    )
  );
  assert.ok(
    serverSource.includes(
      "automaticReplyLanguageInstructions(realtimeSearchDisplayName)"
    )
  );
  assert.match(
    automaticReplyLanguageInstructions("Pam"),
    /standardmäßig vollständig auf Deutsch/u
  );
});
