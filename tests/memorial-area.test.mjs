import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readText = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const ui = readText("www/sol-holo-ui.js");
const css = readText("www/sol-holo-ui.css");
const theme = readText("www/human-holo-theme.css");
const html = readText("www/index.html");
const serviceWorker = readText("www/service-worker.js");
const server = readText("server.mjs");
const backup = readText("www/sol-holo-backup.mjs");

function functionSource(name, nextName) {
  const start = ui.indexOf(`function ${name}`);
  const end = ui.indexOf(`function ${nextName}`, start + 1);
  assert.notEqual(start, -1, `Funktion fehlt: ${name}`);
  assert.notEqual(end, -1, `Endmarke fehlt: ${nextName}`);
  return ui.slice(start, end);
}

test("Erinnerung & Vermächtnis ist ein eigener bedienbarer App-Bereich", () => {
  const entry = ui.match(
    /<button id="memorialMemoryRow"[\s\S]*?<\/button>/u
  )?.[0] || "";

  assert.match(entry, /data-open-view="memorial"/u);
  assert.match(entry, /Erinnerung &amp; Vermächtnis/u);
  assert.match(entry, /Fotos, Stimme, Geschichten und Lebensspuren/u);
  assert.match(ui, /memorialView\.id = "memorialView"/u);
  assert.match(ui, /memorialView\.setAttribute\("aria-labelledby", "memorialViewTitle"\)/u);
  assert.match(ui, /memorial:\s*memorialView/u);
  assert.match(ui, /activeViewName === "memorial"[\s\S]*?\? "memory"/u);
  assert.match(ui, /viewName === "memorial"[\s\S]*?loadMemorialEntries/u);
});

test("die acht freigegebenen Startseitenbereiche bleiben unverändert", () => {
  const homeMarkup = ui.match(/humanHoloHome\.innerHTML = `([\s\S]*?)`;\n/u)?.[1] ?? "";
  assert.equal((homeMarkup.match(/class="humanHoloAreaCard /gu) || []).length, 8);
  assert.doesNotMatch(homeMarkup, /Erinnerung &amp; Vermächtnis/u);
});

test("der Bereich zeigt Inhalte und die unverrückbare Identitätsgrenze", () => {
  assert.match(ui, /Fotos, Videos, Sprachaufnahmen, Geschichten, Texte und\n\s*biografische Erinnerungen/u);
  assert.match(ui, /Human Holo bewahrt Erinnerungen\. Es behauptet niemals, der\n\s*verstorbene Mensch selbst zu sein/u);
  assert.match(ui, /keine täuschende\n\s*Unterhaltung in dessen Namen/u);
  assert.match(ui, /Digitale Erinnerungsform · keine Identitätssimulation/u);
  assert.match(server, /VERBINDLICHER BEREICH ERINNERUNG & VERMÄCHTNIS/u);
  assert.match(server, /Behaupte niemals, der verstorbene Mensch selbst zu sein/u);
  assert.match(server, /Sprich niemals in\n\s*dessen Namen/u);
  assert.match(server, /Erfinde keine Aussagen, Wünsche, Gefühle, Einwilligungen oder biografischen\nFakten/u);
  assert.equal(
    (server.match(/\$\{memorialSafetyInstructions\(identity\)\}/gu) || []).length,
    2,
    "Text- und Realtime-Weg müssen dieselbe Vermächtnisregel erhalten"
  );
});

test("Speichern verlangt Einwilligung und bleibt ownergebunden lokal", () => {
  const form = ui.match(/<form id="memorialForm"[\s\S]*?<\/form>/u)?.[0] || "";
  const saveSource = functionSource("saveMemorialEntry", "deleteMemorialEntry");
  const loadSource = functionSource("loadMemorialEntries", "renderMemorialMediaSelection");

  assert.match(form, /id="memorialRightsConfirmation"[\s\S]*?type="checkbox" required/u);
  assert.match(form, /Rechte und\n\s*Einwilligungen geprüft/u);
  assert.match(saveSource, /if \(!memorialRightsConfirmation\.checked\)/u);
  assert.match(saveSource, /rightsConfirmed: true/u);
  assert.match(saveSource, /identityBoundary: memorialIdentityBoundary/u);
  assert.match(saveSource, /impersonationAllowed: false/u);
  assert.match(saveSource, /storageId: `\$\{identity\.ownerId\}:\$\{entryId\}`/u);
  assert.match(loadSource, /\.getAll\(identity\.ownerId\)/u);
  assert.match(ui, /entry\.ownerId !== ownerId/u);
  assert.doesNotMatch(`${saveSource}\n${loadSource}`, /\bfetch\s*\(|askSol\(|sendMessage\(/u);
  assert.match(form, /Die Inhalte bleiben lokal und ownergebunden/u);
});

test("lokale Medien werden begrenzt und nur in sicheren Formaten angenommen", () => {
  const validateSource = functionSource("validateMemorialMedia", "openMemorialDatabase");

  assert.match(ui, /const maxMemorialMediaFiles = 8/u);
  assert.match(ui, /const maxMemorialMediaBytes = 20 \* 1024 \* 1024/u);
  assert.match(ui, /const maxMemorialTotalBytes = 64 \* 1024 \* 1024/u);
  assert.match(validateSource, /type\.startsWith\("image\/"\)/u);
  assert.match(validateSource, /type\.startsWith\("audio\/"\)/u);
  assert.match(validateSource, /type === "video\/mp4"/u);
  assert.match(validateSource, /type === "video\/webm"/u);
  assert.match(ui, /globalThis\.indexedDB\.open\(memorialDatabaseName, 1\)/u);
  assert.doesNotMatch(ui, /indexedDB\.deleteDatabase\s*\(/u);
});

test("Erinnerung & Vermächtnis gehört vollständig zur verschlüsselten Gesamtsicherung", () => {
  const exportSource = functionSource(
    "exportMemorialArchive",
    "restoreMemorialArchive"
  );
  const restoreSource = functionSource(
    "restoreMemorialArchive",
    "cleanExplicitSaveContent"
  );

  assert.match(exportSource, /\.getAll\(ownerId\)/u);
  assert.match(exportSource, /await blob\.arrayBuffer\(\)/u);
  assert.match(exportSource, /dataBase64: memorialBytesToBase64/u);
  assert.match(restoreSource, /archive\?\.ownerId !== ownerId/u);
  assert.match(restoreSource, /existingIds\.has\(record\.storageId\)/u);
  assert.match(restoreSource, /store\.add\(record\)/u);
  assert.doesNotMatch(restoreSource, /\.clear\s*\(|\.delete\s*\(/u);
  assert.match(ui, /HumanHoloMemorialBackup = Object\.freeze/u);
  assert.match(backup, /fetchCompleteMemorialArchive/u);
  assert.match(backup, /restoreCompleteMemorialArchive/u);
});

test("der neue Bereich erhält Glasoptik und eine frische Android-Auslieferung", () => {
  assert.match(css, /#memorialView/u);
  assert.match(css, /\.memorialBoundary/u);
  assert.match(css, /\.memorialForm/u);
  assert.match(css, /\.memorialMediaGrid/u);
  assert.match(theme, /#memoryView,#memorialView,#medicationView,#servicesView/u);
  assert.match(html, /sol-holo-ui\.css\?v=51/u);
  assert.match(html, /human-holo-theme\.css\?v=9/u);
  assert.match(html, /sol-holo-ui\.js\?v=78/u);
  assert.match(serviceWorker, /human-holo-285-ownergebundenes-dauergedächtnis/u);
});
