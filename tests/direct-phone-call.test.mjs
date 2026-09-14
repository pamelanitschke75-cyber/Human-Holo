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
    "globalThis.parsers = { restrictedExternalCallFromMessage, " +
    "phoneContactCallNameFromMessage };",
  parserContext
);
const parsers = parserContext.parsers;

test("Pannenhilfe-Direktanruf wird erklärt, aber technisch nicht ausgeführt", () => {
  for (const message of [
    "Ruf den ADAC an.",
    "Holo, ruf bitte die ADAC Pannenhilfe an!",
    "Wir haben eine Panne, ruf den ADAC an."
  ]) {
    assert.match(
      parsers.restrictedExternalCallFromMessage(message),
      /nicht enthalten/u,
      message
    );
  }

  for (const message of [
    "Nur ein Test: Ruf den ADAC an.",
    "Kannst du den ADAC anrufen?",
    "Was macht der ADAC bei einer Panne?"
  ]) {
    assert.equal(parsers.restrictedExternalCallFromMessage(message), null);
  }
  assert.equal(parsers.phoneContactCallNameFromMessage("Ruf den ADAC an."), "");
});

test("KI-geführte Telefonate mit Dritten werden lokal abgefangen", () => {
  assert.match(
    parsers.restrictedExternalCallFromMessage(
      "Ruf Steffi an und sprich mit ihr selbst."
    ),
    /KI selbst geführte Telefonate/u
  );

  const handler = between(
    ui,
    "window.handleSolHoloLocalAction = async",
    "window.handleSolHoloRealtimeNoteTranscript"
  );
  assert.ok(
    handler.indexOf("restrictedExternalCallFromMessage(cleanMessage)") <
      handler.indexOf("phoneContactCallNameFromMessage(cleanMessage)")
  );
  assert.doesNotMatch(handler, /start_help_service_call|start_personal_clone_call/u);
});

test("Kontaktanruf öffnet ausschließlich den Telefonwähler", () => {
  const uiTool = between(
    ui,
    "async function executePhoneTool",
    "window.executeSolHoloPhoneTool"
  );
  const nativeDialer = between(
    nativePhone,
    "public void openDialer",
    "public void openServiceDialer"
  );

  assert.match(uiTool, /actionName === "start_phone_call"/u);
  assert.match(uiTool, /plugin\.openDialer/u);
  assert.match(uiTool, /callStarted: false/u);
  assert.match(uiTool, /finalDialerConfirmationRequired: true/u);
  assert.doesNotMatch(uiTool, /startContactCall|startHelpServiceCall/u);
  assert.match(nativeDialer, /confirmExternalAction\(/u);
  assert.match(nativeDialer, /Intent\.ACTION_DIAL/u);
  assert.match(nativeDialer, /"callStarted", false/u);
});

test("Direktanruf-Berechtigung und ausführender Android-Code fehlen", () => {
  const allowedPermissions = between(
    installer,
    "const allowedPermissions",
    "// Falls ein Upstream-Template"
  );

  assert.doesNotMatch(allowedPermissions, /CALL_PHONE|READ_PHONE_STATE/u);
  assert.doesNotMatch(nativePhone, /Manifest\.permission\.CALL_PHONE/u);
  assert.doesNotMatch(nativePhone, /Intent\.ACTION_CALL/u);
  assert.doesNotMatch(nativePhone, /public void startContactCall/u);
  assert.doesNotMatch(nativePhone, /public void startHelpServiceCall/u);
  assert.doesNotMatch(nativePhone, /ADAC_PANNENHILFE_DE_NUMBER/u);
  assert.match(installer, /"WhatsAppAutoSendAccessibilityService\.java"/u);
  assert.match(installer, /rmSync\(join\(javaTarget, fileName\)/u);
});

test("Servicenummern bleiben eine enge Wähler-Positivliste", () => {
  const emergencyDialer = between(
    nativePhone,
    "public void openServiceDialer",
    "public void prepareSms"
  );

  assert.match(nativePhone, /SAFE_SERVICE_DIALER_NUMBERS\.add\("112"\)/u);
  assert.match(nativePhone, /SAFE_SERVICE_DIALER_NUMBERS\.add\("110"\)/u);
  assert.match(nativePhone, /SAFE_SERVICE_DIALER_NUMBERS\.add\("116117"\)/u);
  assert.match(emergencyDialer, /SAFE_SERVICE_DIALER_NUMBERS\.contains/u);
  assert.match(emergencyDialer, /Intent\.ACTION_DIAL/u);
  assert.doesNotMatch(emergencyDialer, /Intent\.ACTION_CALL/u);
  assert.match(emergencyDialer, /"finalDialerConfirmationRequired", true/u);
});

test("Realtime bietet weder Pannenhilfe-Direktanruf noch Health-Werkzeug an", () => {
  const realtimeTools = between(
    server,
    "const sessionConfig = {",
    "if (\n      identity.ownerId !=="
  );
  const localToolNames = between(
    index,
    "const REALTIME_LOCAL_TOOL_NAMES",
    "function getRealtimeMemoryToolCall"
  );

  assert.match(realtimeTools, /name:\s*\n\s*"start_phone_call"/u);
  assert.match(realtimeTools, /nur den Telefonwähler/u);
  assert.doesNotMatch(realtimeTools, /start_help_service_call|read_health_snapshot/u);
  assert.doesNotMatch(localToolNames, /start_help_service_call|read_health_snapshot/u);
  assert.doesNotMatch(ui, /start_help_service_call|start_personal_clone_call/u);
});
