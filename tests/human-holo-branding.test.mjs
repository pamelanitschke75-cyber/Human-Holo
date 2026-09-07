import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readText = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function pngDimensions(path) {
  const bytes = readFileSync(new URL(`../${path}`, import.meta.url));
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20)
  };
}

test("Human Holo ist der sichtbare Name bei unveränderter Android-Identität", () => {
  const capacitor = JSON.parse(readText("capacitor.config.json"));
  const manifest = JSON.parse(readText("www/manifest.json"));

  assert.equal(capacitor.appName, "Human Holo");
  assert.equal(capacitor.appId, "com.solholo.app");
  assert.equal(manifest.name, "Human Holo");
  assert.equal(manifest.short_name, "Human Holo");
});

test("aktueller Bildschirm nutzt Human Holo und bewahrt Pam’s Holo", () => {
  const html = readText("www/index.html");
  const ui = readText("www/sol-holo-ui.js");
  const css = readText("www/sol-holo-ui.css");
  const appLock = readText("www/app-lock-bootstrap.mjs");

  assert.match(html, /<title>Human Holo<\/title>/u);
  assert.match(html, /human-holo-logo\.png/u);
  assert.match(html, /instanceName:"Pam’s Holo"/u);
  assert.match(html, /ownerId:"pam-sol"/u);
  assert.match(html, /const HOLO_CHAT_SPEAKER =\s*"Du";/u);
  assert.doesNotMatch(html, /addMessage\(\s*"Sol"/u);
  assert.doesNotMatch(html, /Schreib Sol|Nachricht an Sol|Mit Sol sprechen/u);
  assert.match(html, /sol-holo-ui\.js\?v=52/u);
  assert.match(ui, /Human Holo · \$\{instanceName\}/u);
  assert.match(ui, /Pam’s Holo/u);
  assert.match(ui, /Chat mit Pam’s Holo/u);
  assert.match(ui, /BY PAMELA NITSCHKE AND STEFANIE HÖRATH/u);
  assert.match(ui, /IN COOPERATION WITH <strong>ChatGPT\/OpenAI<\/strong>/u);
  assert.match(ui, /Miteinander<br>Füreinander<br>Für eine bessere Welt ♡/u);
  assert.match(ui, /MENSCHEN · TIERE · UMWELT · ZUSAMMEN · FÜR ALLE/u);
  assert.match(ui, /EIN HELLERES HEUTE\. EINE FREUNDLICHERE ZUKUNFT\./u);
  assert.match(ui, /A BRIGHTER TODAY\. A KINDER TOMORROW\. ♡/u);
  assert.match(ui, /HSG – HUMANS SECOND GENERATION!/u);
  assert.match(ui, /humanHoloPosterVisual[\s\S]*humanHoloPosterMottos[\s\S]*humanHoloPosterCredits/u);
  assert.match(css, /url\("\.\/human-holo-logo\.png"\) center\/100% auto no-repeat/u);
  assert.match(css, /\.humanHoloPosterCredits\{[\s\S]*top:auto;[\s\S]*bottom:12px;/u);
  const creditsCss = css.match(/\.humanHoloPosterCredits\{([\s\S]*?)\n\}/u)?.[1] ?? "";
  assert.doesNotMatch(creditsCss, /background:|border:|backdrop-filter:|padding:/u);
  assert.doesNotMatch(ui, /Chat mit Sol|SH♾️ zurück/u);
  assert.match(html, /class="solHoloLockLogo"[\s\S]*human-holo-logo\.png/u);
  assert.match(html, /HSG – HUMANS SECOND GENERATION!/u);
  assert.match(appLock, /human-holo-logo\.png/u);
  assert.match(appLock, /HSG – HUMANS SECOND GENERATION!/u);
  assert.doesNotMatch(appLock, /SH♾️/u);
  assert.doesNotMatch(`${html}\n${ui}`, /Sol Holo/u);
});

test("neues Markenbild ist quadratisch und für Android-Icons vorbereitet", () => {
  assert.deepEqual(pngDimensions("assets/logo.png"), { width: 1024, height: 1024 });
  assert.deepEqual(pngDimensions("icon-512.png"), { width: 512, height: 512 });
  assert.deepEqual(pngDimensions("icon-192.png"), { width: 192, height: 192 });
  assert.deepEqual(pngDimensions("www/human-holo-logo.png"), { width: 1024, height: 1024 });
  assert.deepEqual(pngDimensions("www/icon-512.png"), { width: 512, height: 512 });
  assert.deepEqual(pngDimensions("www/icon-192.png"), { width: 192, height: 192 });
});

test("Build #89 Signaturwächter folgt dem neuen Artefaktnamen", () => {
  const build = readText(".github/workflows/android-build.yml");
  const guard = readText(".github/workflows/build89-signature-guard.yml");

  assert.match(build, /Human-Holo-Update\.apk/u);
  assert.match(build, /Human-Holo-Android-\$\{\{ steps\.signing_mode\.outputs\.mode \}\}/u);
  assert.match(build, /SOL_HOLO_KEYSTORE_BASE64/u);
  assert.match(guard, /Human-Holo-Update\.apk/u);
  assert.match(guard, /E1:22:20:10:77:B9:3C:B4:7E:DB:69:51:44:6F:B8:DF:F7:74:27:A2:F5:A2:BD:47:19:47:4A:63:8F:E8:03:E9/u);
  assert.match(guard, /CN=Pam's Holo Original, O=Pam's Holo, C=DE/u);
});
