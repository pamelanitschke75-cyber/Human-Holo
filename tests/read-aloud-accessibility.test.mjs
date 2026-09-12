import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readProjectFile = path =>
  readFileSync(
    new URL(`../${path}`, import.meta.url),
    "utf8"
  );

const html = readProjectFile("www/index.html");
const css = readProjectFile("www/sol-holo-ui.css");
const nativePlugin = readProjectFile(
  "android-native/SolReadAloudPlugin.java"
);
const installer = readProjectFile(
  "scripts/install-whatsapp-driving-mode.mjs"
);

test("jede geschriebene Holo-Antwort erhält einen sichtbaren Vorleseknopf", () => {
  assert.match(
    html,
    /className === "sol-message" &&[\s\S]*?className =\s*\n\s*"messageReadAloud"/u
  );
  assert.match(html, /"🔊 Vorlesen"/u);
  assert.match(html, /"■ Stoppen"/u);
  assert.match(html, /"Diese Holo-Antwort vorlesen"/u);
  assert.match(html, /aria-pressed/u);
  assert.match(css, /#chatView \.messageReadAloud\{/u);
  assert.match(css, /min-height:42px/u);
  assert.match(css, /:focus-visible/u);
});

test("Vorlesen nutzt Android lokal und fällt nur auf lokale Browser-TTS zurück", () => {
  assert.match(html, /Capacitor\?\.Plugins\?\.SolReadAloud/u);
  assert.match(html, /await plugin\.speak\(\{/u);
  assert.match(html, /new SpeechSynthesisUtterance\(/u);
  assert.match(html, /utterance\.lang =\s*\n\s*"de-DE"/u);
  assert.match(html, /window\.speechSynthesis\.speak\(/u);

  const readAloudStart = html.indexOf(
    "async function toggleHoloReadAloud("
  );
  const readAloudEnd = html.indexOf(
    "function addMessage(",
    readAloudStart
  );
  const readAloudImplementation = html.slice(
    readAloudStart,
    readAloudEnd
  );

  assert.doesNotMatch(readAloudImplementation, /fetch\s*\(/u);
  assert.doesNotMatch(readAloudImplementation, /https?:\/\//u);
});

test("Android-Plugin liest Deutsch, unterstützt lange Antworten und kann stoppen", () => {
  assert.match(nativePlugin, /@CapacitorPlugin\(name = "SolReadAloud"\)/u);
  assert.match(nativePlugin, /new TextToSpeech\(/u);
  assert.match(nativePlugin, /setLanguage\(Locale\.GERMANY\)/u);
  assert.match(nativePlugin, /isNetworkConnectionRequired\(\)/u);
  assert.match(nativePlugin, /selectOfflineGermanVoice\(\)/u);
  assert.match(nativePlugin, /TextToSpeech\.getMaxSpeechInputLength\(\)/u);
  assert.match(nativePlugin, /TextToSpeech\.QUEUE_ADD/u);
  assert.match(nativePlugin, /KEY_PARAM_VOLUME/u);
  assert.match(nativePlugin, /UtteranceProgressListener/u);
  assert.match(nativePlugin, /public void stop\(PluginCall call\)/u);
});

test("Android-Build kopiert und registriert die lokale Vorlesefunktion", () => {
  assert.match(installer, /"SolReadAloudPlugin\.java"/u);
  assert.match(
    installer,
    /registerPlugin\(SolReadAloudPlugin\.class\)/u
  );
});

test("ein neues Sprachgespräch beendet Vorlesen ohne Audioüberlagerung", () => {
  assert.match(
    html,
    /async function startLiveConversation\(\)[\s\S]*?requireSelectedIdentity\(\)[\s\S]*?if\([\s\S]*?!identity[\s\S]*?return;[\s\S]*?await stopHoloReadAloud\(\)/u
  );
});
