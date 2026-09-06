import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const ui = await readFile(
  new URL("../www/sol-holo-ui.js", import.meta.url),
  "utf8"
);
const index = await readFile(
  new URL("../www/index.html", import.meta.url),
  "utf8"
);
const nativePhone = await readFile(
  new URL("../android-native/PhoneContactsPlugin.java", import.meta.url),
  "utf8"
);
const server = await readFile(
  new URL("../server.mjs", import.meta.url),
  "utf8"
);

function between(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Startmarke fehlt: ${startMarker}`);
  assert.notEqual(end, -1, `Endmarke fehlt: ${endMarker}`);
  return source.slice(start, end);
}

const parserSource = between(
  ui,
  "const SAFE_SERVICE_DIALERS",
  "async function openServiceDialer"
);
const parserContext = {};
vm.runInNewContext(
  `${parserSource}\n` +
    "globalThis.parsers = { " +
    "isSafetyTriageQuestion, serviceDialRequestFromMessage, " +
    "phoneContactCallNameFromMessage };",
  parserContext
);
const parsers = parserContext.parsers;

test("die Ohrenschmerzfrage erreicht Sol und wird nicht als Kontaktname behandelt", () => {
  const message =
    "Nur ein Test, kein echter Notfall: Ich habe am Sonntag starke Ohrenschmerzen, aber keine Atemnot, bin bei Bewusstsein und es besteht keine Lebensgefahr. Wen soll ich anrufen?";

  assert.equal(parsers.isSafetyTriageQuestion(message), true);
  assert.equal(parsers.serviceDialRequestFromMessage(message), null);
  assert.equal(parsers.phoneContactCallNameFromMessage(message), "");

  const handler = between(
    ui,
    "window.handleSolHoloLocalAction = async",
    "window.handleSolHoloRealtimeNoteTranscript"
  );
  assert.ok(
    handler.indexOf("isSafetyTriageQuestion(cleanMessage)") <
      handler.indexOf("phoneContactCallNameFromMessage(cleanMessage)")
  );
  assert.match(
    handler,
    /isSafetyTriageQuestion\(cleanMessage\)[\s\S]*?return \{ handled: false \}/u
  );
});

test("Testmodus blockiert Wähler, echte klare Servicenummern bleiben möglich", () => {
  assert.equal(
    parsers.serviceDialRequestFromMessage("Nur ein Test: Ruf 112 an."),
    null
  );
  assert.deepEqual(
    { ...parsers.serviceDialRequestFromMessage("Ruf 116117 an.") },
    {
      number: "116117",
      label: "Ärztlicher Bereitschaftsdienst"
    }
  );
  assert.equal(
    parsers.phoneContactCallNameFromMessage("Ruf Steffi an."),
    "Steffi"
  );
});

test("der native Servicenummer-Weg öffnet nur den Wähler und startet keinen Anruf", () => {
  const method = between(
    nativePhone,
    "public void openServiceDialer",
    "public void prepareSms"
  );

  assert.match(nativePhone, /SAFE_SERVICE_DIALER_NUMBERS\.add\("112"\)/u);
  assert.match(nativePhone, /SAFE_SERVICE_DIALER_NUMBERS\.add\("110"\)/u);
  assert.match(nativePhone, /SAFE_SERVICE_DIALER_NUMBERS\.add\("116117"\)/u);
  assert.match(method, /Intent\.ACTION_DIAL/u);
  assert.doesNotMatch(method, /Intent\.ACTION_CALL/u);
  assert.match(method, /"callStarted", false/u);
  assert.match(method, /"finalDialerConfirmationRequired", true/u);
});

test("ein großer Anrufknopf erscheint nur außerhalb des Testmodus", () => {
  const renderer = between(
    index,
    "function addMessage(",
    "function readPendingFulltimeDialogs()"
  );

  assert.match(renderer, /className =\s*\n\s*"messageCallAction"/u);
  assert.match(renderer, /assistance\?\.open_dialer_allowed === true/u);
  assert.match(renderer, /assistance\?\.test_mode !== true/u);
  assert.match(renderer, /\["112", "110", "116117"\]\.includes/u);
  assert.match(renderer, /window\.openSolHoloServiceDialer/u);
  assert.match(index, /data\?\.ecosystem\?\.assistance/u);
});

test("der Server setzt die geprüfte Nummer an den Anfang und liefert die Aktion getrennt", () => {
  assert.match(server, /ensurePriorityContactPrefix\(/u);
  assert.match(
    server,
    /assistance:\s*\n\s*ecosystemTurn\.assessment\s*\n\s*\.priority_contact/u
  );
  assert.match(server, /112 bei medizinischer Lebensgefahr/u);
  assert.match(server, /110 bei akuter Polizeigefahr/u);
  assert.match(server, /116117 bei dringender, aber nicht lebensbedrohlicher/u);
});
