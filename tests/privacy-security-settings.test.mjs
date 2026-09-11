import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readText = path =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const ui = readText("www/sol-holo-ui.js");
const css = readText("www/sol-holo-ui.css");
const html = readText("www/index.html");
const androidWorkflow = readText(".github/workflows/android-build.yml");

test("Datenschutz und Sicherheit werden nur als neuer Einstellungsblock ergänzt", () => {
  assert.match(ui, /id = "privacySecuritySettings"/u);
  assert.match(ui, /Datenschutz &amp; Sicherheit/u);
  assert.match(ui, /settingsViewRoot\.insertBefore\(privacySecurityGroup, settingsSystemGroup\)/u);
  assert.match(ui, /href="\.\/datenschutz\.html"/u);
  assert.match(ui, /href="\.\/datenloeschung\.html"/u);
  assert.match(css, /#privacySecuritySettings\{/u);
});

test("sichtbare Pflichtangaben und Schutzgrenzen sind vollständig", () => {
  assert.match(ui, /<strong>18\+<\/strong>/u);
  assert.match(ui, /keine Werbe-ID/u);
  assert.match(ui, /bei Übertragung/u);
  assert.match(ui, /ownergebundener Zugriff/u);
  assert.match(ui, /keine Behörden-App und enthält keine Finanzfunktionen/u);
  assert.match(ui, /ersetzen\s*\n\s*keine Diagnose, Behandlung oder persönliche Dosierungsentscheidung/u);
  assert.match(ui, /Menschen- und Kinderhandel, Prostitution, Todesstrafe, Vergeltung/u);
  assert.match(ui, /Waffen, Drogen, Nikotinprodukte und Tierhandel bleiben absolute No-Gos/u);
});

test("neue UI-Assets erhalten eigene Cache-Versionen", () => {
  assert.match(html, /sol-holo-ui\.css\?v=50/u);
  assert.match(html, /sol-holo-ui\.js\?v=74/u);
});

test("derselbe dauerhafte Build liefert APK und signiertes Google-Play-Bundle", () => {
  assert.match(androidWorkflow, /\.\/gradlew assembleRelease bundleRelease/u);
  assert.match(androidWorkflow, /Human-Holo-Play\.aab/u);
  assert.match(androidWorkflow, /jarsigner\s+\\/u);
  assert.match(androidWorkflow, /jarsigner -verify -verbose -certs/u);
  assert.match(androidWorkflow, /SOL_HOLO_KEYSTORE_BASE64/u);
});
