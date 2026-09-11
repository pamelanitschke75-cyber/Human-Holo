import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

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
const installer = await readFile(
  new URL("../scripts/install-whatsapp-driving-mode.mjs", import.meta.url),
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
    "globalThis.parsers = { verifiedHelpServiceCallFromMessage, " +
    "phoneContactCallNameFromMessage };",
  parserContext
);
const parsers = parserContext.parsers;

test("klare ADAC-Aufträge werden lokal erkannt, Fragen und Tests nicht", () => {
  for (const message of [
    "Ruf den ADAC an.",
    "Holo, ruf bitte die ADAC Pannenhilfe an!",
    "Wir haben eine Panne, ruf den ADAC an.",
    "Wir haben eine Panne ruf den ADAC an",
    "ADAC anrufen"
  ]) {
    assert.deepEqual(
      { ...parsers.verifiedHelpServiceCallFromMessage(message) },
      {
        serviceId: "adac_pannenhilfe_de",
        label: "ADAC Pannenhilfe Deutschland"
      },
      message
    );
  }

  for (const message of [
    "Nur ein Test: Ruf den ADAC an.",
    "Kannst du den ADAC anrufen?",
    "Was macht der ADAC bei einer Panne?",
    "Wenn wir morgen eine Panne haben, ruf den ADAC an."
  ]) {
    assert.equal(
      parsers.verifiedHelpServiceCallFromMessage(message),
      null,
      message
    );
  }
  assert.equal(parsers.phoneContactCallNameFromMessage("Ruf den ADAC an."), "");
});

test("ADAC wird vor einer allgemeinen Kontaktsuche abgefangen", () => {
  const handler = between(
    ui,
    "window.handleSolHoloLocalAction = async",
    "window.handleSolHoloRealtimeNoteTranscript"
  );
  assert.ok(
    handler.indexOf("verifiedHelpServiceCallFromMessage(cleanMessage)") <
      handler.indexOf("phoneContactCallNameFromMessage(cleanMessage)")
  );
  assert.match(handler, /executePhoneTool\("start_help_service_call"/u);
});

test("Kontaktanrufe werden ownergebunden und unmittelbar vorher erneut geprüft", () => {
  const method = between(
    nativePhone,
    "public void startContactCall",
    "public void startHelpServiceCall"
  );
  assert.match(method, /contactsGranted\(\)/u);
  assert.match(method, /explicitOwnerCallAuthorized\(call\)/u);
  assert.match(method, /Long\.parseLong\(contactIdText\)/u);
  assert.match(method, /findContactRecord\(contactId, expectedNumber\)/u);
  assert.match(method, /"device_contact",\s*\n\s*true/u);

  const uiTool = between(
    ui,
    "async function executePhoneTool",
    "window.executeSolHoloPhoneTool"
  );
  assert.match(uiTool, /plugin\.startContactCall/u);
  assert.match(uiTool, /contactId: String\(contact\.id\)/u);
  assert.match(uiTool, /explicitOwnerCommand: true/u);
  assert.doesNotMatch(uiTool, /openDialer\(/u);
});

test("ADAC nutzt nur die fest hinterlegte offizielle Deutschland-Nummer", () => {
  const method = between(
    nativePhone,
    "public void startHelpServiceCall",
    "public void openServiceDialer"
  );
  assert.match(nativePhone, /ADAC_PANNENHILFE_DE_NUMBER\s*=\s*\n\s*"08920204000"/u);
  assert.match(method, /ADAC_PANNENHILFE_DE_SERVICE_ID\.equals\(serviceId\)/u);
  assert.match(method, /ADAC_PANNENHILFE_DE_NUMBER/u);
  assert.doesNotMatch(method, /getString\("number"/u);
  assert.match(method, /explicitOwnerCallAuthorized\(call\)/u);
});

test("direkter Anruf folgt nur auf sichtbare Bestätigung und Laufzeitfreigabe", () => {
  const confirmation = between(
    nativePhone,
    "private void confirmAndStartDirectCall",
    "private void requestDirectCallPermissionOrStart"
  );
  const permission = between(
    nativePhone,
    "private void requestDirectCallPermissionOrStart",
    "private void directCallPermissionCallback"
  );
  const launch = between(
    nativePhone,
    "private void launchDirectCall",
    "private String normalizedDirectCallNumber"
  );

  assert.match(confirmation, /confirmExternalAction\(/u);
  assert.match(confirmation, /"Jetzt anrufen"/u);
  assert.match(permission, /requestPermissionForAlias\(\s*\n\s*"directCall"/u);
  assert.match(nativePhone, /Manifest\.permission\.CALL_PHONE/u);
  assert.match(launch, /Intent\.ACTION_CALL/u);
  assert.match(launch, /"callStarted", true/u);
  assert.match(launch, /"connectionConfirmed", false/u);
  assert.match(launch, /"emergencyCall", false/u);
  assert.equal((nativePhone.match(/Intent\.ACTION_CALL/g) || []).length, 1);
});

test("Notrufnummern bleiben vom direkten Anrufweg ausgeschlossen", () => {
  const validation = between(
    nativePhone,
    "private String normalizedDirectCallNumber",
    "private String cleanDestination"
  );
  const emergencyDialer = between(
    nativePhone,
    "public void openServiceDialer",
    "public void prepareSms"
  );
  assert.match(validation, /isEmergencyDestination\(normalized\)/u);
  assert.match(validation, /SAFE_SERVICE_DIALER_NUMBERS\.contains\(digits\)/u);
  assert.match(emergencyDialer, /Intent\.ACTION_DIAL/u);
  assert.doesNotMatch(emergencyDialer, /Intent\.ACTION_CALL/u);
});

test("Android-Manifest, Realtime-Werkzeug und Client-Routing sind ergänzt", () => {
  assert.match(installer, /android\.permission\.CALL_PHONE/u);
  assert.match(installer, /android\.hardware\.telephony/u);
  assert.match(server, /name:\s*\n\s*"start_help_service_call"/u);
  assert.match(server, /"adac_pannenhilfe_de"/u);
  assert.match(index, /"start_help_service_call"/u);
});

test("Human Holo pausiert auch während eines ausgehenden Telefonats", () => {
  const listeners = between(
    ui,
    "async function registerPhoneListeners",
    "async function loadPhoneStatus"
  );
  assert.match(listeners, /status\?\.callState === "offhook"/u);
  assert.match(listeners, /stopLiveConversation\(\)/u);
  assert.match(listeners, /pauseWakeListeningForConversation\(\)/u);
});
