import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readText = path =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const html = readText("www/index.html");
const installer = readText("scripts/install-whatsapp-driving-mode.mjs");
const server = readText("server.mjs");
const ui = readText("www/sol-holo-ui.js");
const consent = readText("www/legal-consent-bootstrap.mjs");
const launchPolicy = readText("modules/human-holo-launch-policy.mjs");
const workflow = readText(".github/workflows/android-build.yml");

function createSignLanguageRequestHarness() {
  const optionsSource = html.match(
    /const SIGN_LANGUAGE_OPTIONS\s*=\s*Object\.freeze\(\[[\s\S]*?\n  \]\);/u
  )?.[0];
  const parserSource = html.match(
    /function normalizeSignLanguageRequestText\([\s\S]*?(?=\nasync function openFilteredMicrophone\()/u
  )?.[0];

  assert.ok(optionsSource, "Gebärdensprach-Liste muss ladbar sein.");
  assert.ok(parserSource, "Gebärdensprach-Anfrageparser muss ladbar sein.");

  return Function(
    `"use strict";
      let pendingSignLanguageSelection = false;
      let activeSignLanguage = null;
      ${optionsSource}
      ${parserSource}
      return value => signLanguageSequenceRequest(value);`
  )();
}

test("der fortlaufende Live-Bildmodus ist aus dem ausgelieferten Client entfernt", () => {
  assert.match(launchPolicy, /liveCamera: false/u);
  assert.doesNotMatch(
    html,
    /liveCameraButton|liveCameraPanel|LIVE_CAMERA|LIVE_KAMERA|sendCurrentLiveCameraFrame|startLiveCamera/u
  );
  assert.doesNotMatch(
    html,
    /getUserMedia\(\{[\s\S]{0,220}video\s*:/u
  );
  assert.doesNotMatch(workflow, /Live-Kamera für Realtime prüfen/u);
});

test("Android behält Kamera nur für bewusst ausgelöste Einzelaufnahmen", () => {
  assert.match(installer, /android\.permission\.CAMERA/u);
  assert.match(
    installer,
    /android\.hardware\.camera\.any"[\s\S]*?android:required="false"/u
  );
  assert.doesNotMatch(installer, /FOREGROUND_SERVICE_CAMERA/u);
  assert.match(html, /id="imageInput"[\s\S]*?capture="environment"/u);
  assert.match(html, /id="mediaLibraryInput"[\s\S]*?accept="image\/\*,video\/\*"/u);
});

test("jedes ausgewählte Foto oder Video braucht eine Rechtebestätigung", () => {
  assert.match(html, /HumanHoloLegalConsent[\s\S]*?ensureMediaRights/u);
  assert.match(consent, /Der ausgewählte Inhalt wird erst nach dieser Bestätigung übertragen/u);
  assert.match(consent, /Erkennbare oder hörbare Dritte wurden informiert und haben zugestimmt/u);
  assert.match(consent, /keine intime Situation[\s\S]*keine heimliche Aufnahme/u);
});

test("Realtime wird ausdrücklich ohne laufenden Kamerablick instruiert", () => {
  assert.match(server, /Der fortlaufende Live-Bildmodus ist in diesem Build nicht enthalten/u);
  assert.match(server, /Behaupte\s+keinen laufenden Kamerablick/u);
  assert.match(server, /Rohmedien werden nicht als Erinnerung gespeichert/u);
  assert.doesNotMatch(server, /GEBAERDENSPRACHE_FRAME|GEBAERDENSPRACHE_SEQUENZ_START/u);
});

test("Gebärdensprach-Liveaufnahme endet sichtbar im Legal-Review-Hold", () => {
  const parse = createSignLanguageRequestHarness();
  assert.equal(parse("Starte den DGS-Test.").language.code, "DGS");
  assert.equal(parse("Bitte übersetze diese Österreichische Gebärdensprache.").language.code, "ÖGS");
  assert.equal(parse("Steffi macht eine Handbewegung.").requested, false);
  assert.match(
    html,
    /fortlaufende Kamera- und Gebärdensprachmodus ist im Legal-Review-Build deaktiviert/u
  );
  assert.doesNotMatch(html, /captureSignLanguageSequenceImages|type:\s*"input_image"/u);
});

test("der eigene Holo-Bildschirm bleibt lokal per Sprache erklärbar", () => {
  assert.match(
    html,
    /function isCurrentHoloScreenDescriptionRequest\([\s\S]*?meinen bildschirm[\s\S]*?auf dem handy/u
  );
  assert.match(
    html,
    /function describeCurrentHoloScreen\(\)[\s\S]*?Sprachgespräch mit Human Holo[\s\S]*?fortlaufende Live-Bildmodus ist deaktiviert/u
  );
  assert.match(
    server,
    /\[LOKALE_BILDSCHIRMBESCHREIBUNG\][\s\S]*?ohne Zugriff auf eine andere\s+App/u
  );
});

test("statische Medien ändern den neuen Gedächtnisgrundsatz nicht", () => {
  assert.match(
    ui,
    /Neue Gespräche werden nicht automatisch Wort für Wort gespeichert/u
  );
  assert.doesNotMatch(html, /"live_image"/u);
  assert.match(
    server,
    /Neue Nachrichten, Antworten,[\s\S]*nicht automatisch als[\s\S]*wortwörtlicher Dauerverlauf/u
  );
});
