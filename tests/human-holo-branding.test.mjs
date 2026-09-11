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
  const theme = readText("www/human-holo-theme.css");
  const appLock = readText("www/app-lock-bootstrap.mjs");
  const renderedHome = ui.match(
    /humanHoloHome\.innerHTML = `([\s\S]*?)`;\n/u
  )?.[1] ?? "";

  assert.match(html, /<title>Human Holo<\/title>/u);
  assert.match(html, /human-holo-logo\.png/u);
  assert.match(html, /instanceName:"Pam’s Holo"/u);
  assert.match(html, /ownerId:"pam-sol"/u);
  assert.match(html, /const HOLO_CHAT_SPEAKER =\s*"Du";/u);
  assert.doesNotMatch(html, /addMessage\(\s*"Sol"/u);
  assert.doesNotMatch(html, /Schreib Sol|Nachricht an Sol|Mit Sol sprechen/u);
  assert.match(html, /sol-holo-ui\.js\?v=71/u);
  assert.match(ui, /Human Holo · \$\{instanceName\}/u);
  assert.match(ui, /Pam’s Holo/u);
  assert.match(ui, /Chat mit Pam’s Holo/u);
  assert.match(ui, /BY PAMELA NITSCHKE UND STEFANIE HÖRATH/u);
  assert.match(renderedHome, /BY PAMELA NITSCHKE UND STEFANIE HÖRATH/u);
  assert.match(ui, /DEVELOPED WITH <strong>CHATGPT BY OPENAI<\/strong>/u);
  assert.match(ui, /<h3 id="aboutHumanHoloTitle">Über Human Holo<\/h3>/u);
  assert.match(ui, /<strong>Pamela Nitschke und Stefanie Hörath<\/strong>/u);
  assert.match(ui, /<span>Developed with ChatGPT\/OpenAI<\/span>/u);
  assert.match(css, /Sichtbare gemeinsame Human-Holo-Zuordnung/u);
  assert.doesNotMatch(ui, /IN COOPERATION WITH/u);
  assert.match(ui, /humanHoloHome\.innerHTML = `/u);
  assert.match(ui, /humanHoloHero[\s\S]*humanHoloPosterCredits/u);
  assert.match(ui, /Miteinander<br>Füreinander<br>Für eine<br>bessere Welt♡/u);
  assert.match(ui, /Together<br>Forever♡/u);
  assert.match(ui, /class="humanHoloWelcomeTitle">Hallo Pam♡<\/h2>/u);
  assert.match(ui, /homeTitle\.textContent = displayName \? `Hallo \$\{displayName\}♡` : "Hallo♡"/u);
  assert.doesNotMatch(`${html}\n${ui}`, /pamUnicorn--home/u);
  assert.doesNotMatch(
    renderedHome,
    /id="homeComposer"|id="homeCameraButton"|id="homeGalleryButton"|id="homeMicButton"/u
  );
  assert.match(css, /#homeView\.humanHoloHome\{/u);
  assert.match(css, /\.humanHoloAreaGrid\{[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/u);
  assert.match(html, /human-holo-theme\.css\?v=9/u);
  assert.ok(
    html.indexOf("human-holo-theme.css?v=9") >
      html.indexOf("sol-holo-backup.css?v=2")
  );
  assert.match(ui, /<img src="human-holo-home-hero\.png"/u);
  assert.match(theme, /\.humanHoloHero>img\{[\s\S]*height:100%[\s\S]*object-fit:cover/u);
  assert.match(theme, /transform:translate\(-50%,-50%\)/u);
  assert.match(theme, /#homeView \.humanHoloAreaGrid\{[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/u);
  assert.match(theme, /#homeView \.humanHoloAreaCard\{[\s\S]*backdrop-filter:blur\(21px\) saturate\(1\.34\)/u);
  assert.match(theme, /#homeView \.humanHoloAreaCard\{[\s\S]*grid-template-columns:44px minmax\(0,1fr\)/u);
  assert.match(theme, /#app\[data-active-view="home"\] #bottomNav\{/u);
  assert.match(theme, /#app\[data-active-view="home"\]\{[\s\S]*?padding-bottom:0/u);
  assert.match(ui, /manageMemoriesButton\.replaceChildren\([\s\S]*?"Erinnerungen mit Human Holo ansehen "/u);
  assert.match(theme, /#memoryView #manageMemoriesButton,[\s\S]*?#bottomNav\{/u);
  assert.match(html, /function humanHoloVisibleText\(value\)/u);
  assert.match(ui, /function applyHumanHoloVisibleNaming\(root = document\)/u);
  assert.match(ui, /new MutationObserver/u);
  assert.match(ui, /Immer aktiv · updatefest/u);
  assert.doesNotMatch(ui, /askSol\("Sol,/u);
  assert.doesNotMatch(ui, /Chat mit Sol|SH♾️ zurück/u);
  assert.match(html, /class="solHoloLockLogo"[\s\S]*human-holo-logo\.png/u);
  assert.match(html, /HSG – HUMANS SECOND GENERATION!/u);
  assert.match(appLock, /human-holo-logo\.png/u);
  assert.match(appLock, /HSG – HUMANS SECOND GENERATION!/u);
  assert.doesNotMatch(appLock, /SH♾️/u);
  assert.doesNotMatch(`${html}\n${ui}`, /Sol Holo/u);
});

test("Startseite ersetzt die vier alten Schnellbereiche durch genau acht Human-Holo-Bereiche", () => {
  const ui = readText("www/sol-holo-ui.js");
  const homeMarkup = ui.match(/humanHoloHome\.innerHTML = `([\s\S]*?)`;\n/u)?.[1] ?? "";
  const heroMarkup = homeMarkup.match(/<button id="homeOrbButton"[\s\S]*?<\/button>/u)?.[0] ?? "";

  assert.notEqual(homeMarkup, "");
  assert.equal((homeMarkup.match(/class="humanHoloAreaCard /gu) || []).length, 8);

  for (const label of [
    "Menschen",
    "Familie &amp;<br>Freunde",
    "Tiere",
    "Umwelt",
    "Gesundheit",
    "Bildung",
    "Zusammen",
    "Geschäftliches"
  ]) {
    assert.match(homeMarkup, new RegExp(`>${label}<`, "u"));
  }

  assert.doesNotMatch(
    homeMarkup,
    /quickGrid|quickCard|>Erinnerungen<|>Ziele<|>Heute<|>Verbindungen</u
  );
  assert.doesNotMatch(
    homeMarkup,
    /Schön dich zu sehen|Womit wollen wir starten|Ein kleiner Schritt|Ein großer für die Menschen|humanHoloFooterPaw|humanHoloFooterEarth|🦄|🐾|🌎/u
  );
  assert.notEqual(heroMarkup, "");
  assert.doesNotMatch(heroMarkup, /homeTitle|Hallo Pam/u);
  assert.match(homeMarkup, /humanHoloFooterInfinity/u);
});

test("alle App-Bereiche verwenden denselben Human-Holo-Glasstil", () => {
  const css = readText("www/sol-holo-ui.css");
  const theme = readText("www/human-holo-theme.css");

  for (const view of [
    "chatView",
    "memoryView",
    "memorialView",
    "servicesView",
    "profileView",
    "settingsView",
    "notesView"
  ]) {
    assert.match(css, new RegExp(`#${view}`, "u"));
  }

  assert.match(css, /Einheitlicher Human-Holo-Stil fuer alle Bereiche/u);
  assert.match(css, /\.appView:not\(\.humanHoloHome\) :is\(\.glassCard,\.actionRow,\.serviceRow,\.settingsGroup,\.profileStatus,\.noteCard,\.memorialCard\)/u);
  assert.match(theme, /HUMAN HOLO · EINHEITLICHE GLASOPTIK/u);
  assert.match(theme, /#app:not\(\.voice-mode\) #chatView #chatPanel/u);
  assert.match(theme, /#app:not\(\.voice-mode\) #chatView #messageWrap/u);
  assert.match(theme, /#chatView \.message/u);
  assert.match(theme, /#settingsView #speakerIdentityPanel/u);
  assert.match(theme, /#settingsView :is\(\.settingsChoiceRow,\.wakeModeChooser\)/u);
  assert.match(theme, /#uiToast\{/u);
  assert.match(theme, /backdrop-filter:blur\(24px\) saturate\(1\.35\)/u);
  assert.match(theme, /\.solBackupDialog,[\s\S]*\.humanHoloMemoryImportList/u);
  assert.match(theme, /\.pamUnicorn,[\s\S]*#chatUnicornSignature\{[\s\S]*display:none!important/u);
});

test("neues Markenbild ist quadratisch und für Android-Icons vorbereitet", () => {
  assert.deepEqual(pngDimensions("assets/logo.png"), { width: 1024, height: 1024 });
  assert.deepEqual(pngDimensions("icon-512.png"), { width: 512, height: 512 });
  assert.deepEqual(pngDimensions("icon-192.png"), { width: 192, height: 192 });
  assert.deepEqual(pngDimensions("www/human-holo-logo.png"), { width: 1024, height: 1024 });
  assert.deepEqual(pngDimensions("www/icon-512.png"), { width: 512, height: 512 });
  assert.deepEqual(pngDimensions("www/icon-192.png"), { width: 192, height: 192 });
});

test("Startseitenmotiv ist seitlich erweitert und für den breiten Bildrahmen optimiert", () => {
  assert.deepEqual(pngDimensions("www/human-holo-home-hero.png"), {
    width: 1536,
    height: 1024
  });
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
