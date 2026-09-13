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

test("Realtime-Transkription ist nicht mehr auf Deutsch festgelegt", () => {
  const transcription =
    createAutomaticTranscriptionConfig();

  assert.deepEqual(
    transcription,
    {
      model:
        "gpt-transcribe"
    }
  );
  assert.equal(
    Object.hasOwn(transcription, "language"),
    false
  );
  assert.equal(
    Object.hasOwn(transcription, "languages"),
    false
  );
  assert.doesNotMatch(
    serverSource,
    /transcription:\s*\{[\s\S]{0,180}?language:\s*["']de["']/u
  );
});

test("Sprachvertrag gilt ohne Zehnerliste für jeden aktuellen Beitrag", () => {
  const instructions =
    automaticLanguageInstructions("Pam");

  assert.equal(
    HUMAN_HOLO_LANGUAGE_POLICY.mode,
    "automatic"
  );
  assert.equal(
    HUMAN_HOLO_LANGUAGE_POLICY.fixedAllowlist,
    false
  );
  assert.match(
    instructions,
    /keine feste Zehnerliste/u
  );
  assert.match(
    instructions,
    /jede Sprache, die die aktive OpenAI-Sprachfunktion zuverlässig[\s\S]*?unterstützt/u
  );
  assert.match(
    instructions,
    /keine Sprache vorher auswählen/u
  );
  assert.match(
    instructions,
    /in derselben Sprache wie der aktuelle Beitrag/u
  );
});

test("Sprachwechsel, Mischsprache und Übersetzung sind ausdrücklich geregelt", () => {
  const instructions =
    automaticLanguageInstructions("Pam");

  assert.match(
    instructions,
    /zwischen Gesprächsbeiträgen die Sprache, wechselst du mit/u
  );
  assert.match(
    instructions,
    /Mischsprache oder Code-Switching/u
  );
  assert.match(
    instructions,
    /Übersetze nicht ungefragt/u
  );
  assert.match(
    instructions,
    /ausdrücklich eine Übersetzung oder[\s\S]*?Zielsprache verlangt/u
  );
  assert.match(
    instructions,
    /Sprachunsicherheit die Bedeutung/u
  );
});

test("Deutsch bleibt nur UI-Fallback und Gebärdensprache bleibt separat", () => {
  const instructions =
    automaticLanguageInstructions("Pam");

  assert.equal(
    HUMAN_HOLO_LANGUAGE_POLICY.defaultLanguage,
    "de"
  );
  assert.equal(
    HUMAN_HOLO_LANGUAGE_POLICY.signLanguageUsesCameraPath,
    true
  );
  assert.match(
    instructions,
    /Deutsch ist ausschließlich die[\s\S]*?Standardsprache für die Bedienoberfläche und der Rückfall/u
  );
  assert.match(
    instructions,
    /Gebärdensprachen bleiben vom gesprochenen Sprachweg[\s\S]*?Kamerapfad/u
  );
  assert.match(
    instructions,
    /Identität, Herkunft oder Berechtigungen niemals aus Sprache/u
  );
});

test("Realtime und Textantworten erhalten denselben Sprachvertrag", () => {
  const insertions =
    serverSource.match(
      /\$\{automaticLanguageInstructions\(identity\.displayName\)\}/gu
    ) || [];

  assert.equal(
    insertions.length,
    2
  );
  assert.match(
    serverSource,
    /transcription:\s*\n\s*createAutomaticTranscriptionConfig\(\)/u
  );
});

test("Live-Suchergebnisse bleiben in der automatisch erkannten Fragesprache", () => {
  const instructions =
    automaticReplyLanguageInstructions();
  const insertions =
    serverSource.match(
      /\$\{automaticReplyLanguageInstructions\(\)\}/gu
    ) || [];

  assert.match(
    instructions,
    /Sprache der aktuellen Frage automatisch/u
  );
  assert.match(
    instructions,
    /vollständig[\s\S]*?in derselben Sprache/u
  );
  assert.match(
    instructions,
    /keine feste Sprachliste/u
  );
  assert.equal(
    insertions.length,
    3
  );
  assert.doesNotMatch(
    serverSource,
    /Du beantwortest (?:ausschließlich )?eine aktuelle (?:Alltags|Wetter)frage auf Deutsch\./u
  );
});
