import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const ui = fs.readFileSync(
  new URL("../www/sol-holo-ui.js", import.meta.url),
  "utf8"
);
const html = fs.readFileSync(
  new URL("../www/index.html", import.meta.url),
  "utf8"
);
const css = fs.readFileSync(
  new URL("../www/human-holo-theme.css", import.meta.url),
  "utf8"
);
const phonePlugin = fs.readFileSync(
  new URL("../android-native/PhoneContactsPlugin.java", import.meta.url),
  "utf8"
);
const watchPlugin = fs.readFileSync(
  new URL("../android-native/GalaxyWatchBridgePlugin.java", import.meta.url),
  "utf8"
);
const installer = fs.readFileSync(
  new URL("../scripts/install-whatsapp-driving-mode.mjs", import.meta.url),
  "utf8"
);
const server = fs.readFileSync(
  new URL("../server.mjs", import.meta.url),
  "utf8"
);

function sourceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Startmarke fehlt: ${startMarker}`);
  assert.notEqual(end, -1, `Endmarke fehlt: ${endMarker}`);
  return source.slice(start, end);
}

const alarmParser = new Function(
  `${sourceBetween(ui, "function normalizeNoteSearchText", "function stripHoloInvocation")}\n` +
  `${sourceBetween(ui, "function stripHoloInvocation", "function noteSecurityWarning")}\n` +
  `${sourceBetween(ui, "function cleanExplicitSaveContent", "function explicitListTitle")}\n` +
  `${sourceBetween(ui, "function germanAlarmHourValue", "function explicitSaveRequestFromMessage")}\n` +
  "return alarmClockRequestFromMessage;"
)();

const routeParser = new Function(
  `${sourceBetween(ui, "function stripHoloInvocation", "function noteSecurityWarning")}\n` +
  `${sourceBetween(ui, "function cleanExplicitSaveContent", "function explicitListTitle")}\n` +
  `${sourceBetween(ui, "function googleMapsDestinationFromMessage", "function alarmClockRequestFromMessage")}\n` +
  "return googleMapsDestinationFromMessage;"
)();

test("Hey Pam stellt und öffnet den Android-Wecker", () => {
  assert.deepEqual(
    alarmParser("Hey Pam, stell einen Wecker auf 7 Uhr"),
    { action: "set", hour: 7, minute: 0, label: "Human Holo" }
  );
  assert.deepEqual(
    alarmParser("Pam, weck mich morgen um 06:30 Uhr"),
    { action: "set", hour: 6, minute: 30, label: "Human Holo" }
  );
  assert.deepEqual(
    alarmParser("Kannst du mir bitte morgen um sieben Uhr einen Wecker stellen?"),
    { action: "set", hour: 7, minute: 0, label: "Human Holo" }
  );
  assert.deepEqual(
    alarmParser("Ich möchte morgen um halb acht geweckt werden."),
    { action: "set", hour: 7, minute: 30, label: "Human Holo" }
  );
  assert.deepEqual(
    alarmParser("Bitte wecke mich um Viertel vor acht."),
    { action: "set", hour: 7, minute: 45, label: "Human Holo" }
  );
  assert.deepEqual(
    alarmParser("Ich brauche um neun einen Alarm."),
    { action: "set", hour: 9, minute: 0, label: "Human Holo" }
  );
  assert.deepEqual(
    alarmParser("Kannst du bitte meinen Wecker öffnen?"),
    { action: "open" }
  );
  assert.deepEqual(alarmParser("Öffne meinen Wecker"), { action: "open" });
  assert.equal(alarmParser("Stell einen Wecker auf 28 Uhr"), null);
  assert.equal(alarmParser("Erzähl mir etwas über Wecker um 7 Uhr"), null);
  assert.match(phonePlugin, /AlarmClock\.ACTION_SET_ALARM/u);
  assert.match(phonePlugin, /AlarmClock\.ACTION_SHOW_ALARMS/u);
  assert.match(installer, /com\.android\.alarm\.permission\.SET_ALARM/u);
  assert.match(ui, /id="alarmClockRow"/u);
  assert.match(ui, /Handy-Wecker · Samsung Uhr/u);
  assert.match(ui, /Dein Wecker auf dem Handy ist auf/u);
  assert.match(html, /LOKALES_WECKERERGEBNIS/u);
  assert.match(server, /lokale Weckerweg sei nicht\nbestätigt/u);
});

test("Routenplaner versteht natürliche Ziele", () => {
  assert.equal(
    routeParser("Hey Pam, plane mir eine Route nach Hamburg"),
    "Hamburg"
  );
  assert.equal(routeParser("Öffne den Routenplaner"), "");
  assert.equal(routeParser("Erzähl mir etwas über Hamburg"), null);
  assert.match(phonePlugin, /google\.navigation:q=/u);
  assert.match(ui, /Routenplaner · Google Maps/u);
});

test("Kalender hat nach der sicheren S23-Prüfung eine Antwort und Android-Fallback", () => {
  const endpoint = sourceBetween(
    server,
    'app.post(\n  "/calendar/action"',
    'app.post(\n  "/gmail/action"'
  );
  assert.match(endpoint, /answer:\s*\n\s*calendarResult\?\.answer/u);
  assert.match(server, /function calendarDraftForClient/u);
  assert.match(server, /nativeFallbackAvailable:\s*true/u);
  assert.match(phonePlugin, /CalendarContract\.Events\.CONTENT_URI/u);
  assert.match(phonePlugin, /public void openCalendarEvent/u);
  assert.match(phonePlugin, /value instanceof Number/u);
  assert.match(html, /openSolHoloCalendarDraft/u);
  assert.match(ui, /window\.openSolHoloCalendarDraft/u);
});

test("Notizen werden wirklich lokal gesucht, geändert und gelöscht", () => {
  const notesTool = sourceBetween(
    ui,
    "async function executeNotesTool",
    "window.executeSolHoloNotesTool"
  );
  assert.match(ui, /function updatePersonalNote/u);
  assert.match(ui, /function deletePersonalNote/u);
  assert.match(notesTool, /return updatePersonalNote/u);
  assert.match(notesTool, /return deletePersonalNote/u);
  assert.match(notesTool, /personalNoteListAnswer/u);
  assert.match(ui, /wirklich löschen\?/u);
  assert.match(phonePlugin, /clipboardPrepared/u);
  assert.match(phonePlugin, /openSamsungNotesWithClipboard/u);
  assert.match(ui, /result\?\.clipboardPrepared/u);
});

test("Galaxy Watch erhält nur fest definierte, inhaltsarme Hinweise", () => {
  assert.match(watchPlugin, /@CapacitorPlugin\(\s*name = "GalaxyWatchBridge"/u);
  assert.match(watchPlugin, /Galaxy Watch 8/u);
  assert.match(watchPlugin, /ownerScopedSummaryOnly", true/u);
  assert.match(watchPlugin, /rawAudioTransferred", false/u);
  assert.match(watchPlugin, /personalMemoryTransferred", false/u);
  assert.match(watchPlugin, /NotificationCompat\.VISIBILITY_PRIVATE/u);
  assert.doesNotMatch(watchPlugin, /call\.getString\("(?:text|title|message)"/u);
  assert.match(installer, /GalaxyWatchBridgePlugin\.java/u);
  assert.match(installer, /registerPlugin\(GalaxyWatchBridgePlugin\.class\)/u);
  assert.match(installer, /com\.samsung\.android\.app\.watchmanager/u);
  assert.match(ui, /id="galaxyWatchRow"/u);
});

test("Startseite füllt hohen Handybildschirmen ohne großen Leerblock", () => {
  assert.match(css, /#app\[data-active-view="home"\]\{[\s\S]*?padding-bottom:0/u);
  assert.match(css, /#homeView\.humanHoloHome\.active\{[\s\S]*?display:flex/u);
  assert.match(css, /#homeView \.humanHoloHero\{[\s\S]*?flex:1 1 222px/u);
});
