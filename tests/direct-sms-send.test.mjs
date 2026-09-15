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
const server = await readFile(
  new URL("../server.mjs", import.meta.url),
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
const assistantService = await readFile(
  new URL(
    "../android-native/HumanHoloVoiceInteractionService.java",
    import.meta.url
  ),
  "utf8"
);
const assistantSessionService = await readFile(
  new URL(
    "../android-native/HumanHoloVoiceInteractionSessionService.java",
    import.meta.url
  ),
  "utf8"
);
const recognitionService = await readFile(
  new URL(
    "../android-native/HumanHoloRecognitionService.java",
    import.meta.url
  ),
  "utf8"
);
const assistantConfig = await readFile(
  new URL(
    "../android-native/human_holo_voice_interaction_service.xml",
    import.meta.url
  ),
  "utf8"
);

function between(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Startmarke fehlt: ${startMarker}`);
  assert.notEqual(end, -1, `Endmarke fehlt: ${endMarker}`);
  return source.slice(start, end);
}

const parserContext = { window: {} };
vm.createContext(parserContext);
vm.runInContext(
  between(
    ui,
    "const SAFE_SERVICE_DIALERS",
    "function maskedContactChoice"
  ) + "\nthis.parseDirectSms = directSmsRequestFromMessage;",
  parserContext
);

test("eindeutige SMS-Sendeaufträge behalten Empfänger und Text", () => {
  const examples = new Map([
    ["Schreib eine SMS an Steffi: Bin gleich da", ["Steffi", "Bin gleich da"]],
    [
      "Sende eine SMS an Steffi mit dem Text Bin gleich da",
      ["Steffi", "Bin gleich da"]
    ],
    ["Schreib Steffi eine SMS: Ich liebe dich ❤️", ["Steffi", "Ich liebe dich ❤️"]],
    [
      "Holo, schicke Anna Maria eine SMS mit dem Text: Bis später!",
      ["Anna Maria", "Bis später!"]
    ],
    ["SMS an Schatz: Ruf mich bitte an.", ["Schatz", "Ruf mich bitte an."]],
    [
      "SMS an Steffi: Kommst du heute?",
      ["Steffi", "Kommst du heute?"]
    ]
  ]);

  for (const [spokenText, [contactName, message]] of examples) {
    assert.deepEqual(
      { ...parserContext.parseDirectSms(spokenText) },
      { contactName, message },
      spokenText
    );
  }
});

test("Fragen, Tests, Zukunft und unvollständige SMS lösen keinen Versand aus", () => {
  for (const spokenText of [
    "Kannst du eine SMS an Steffi senden?",
    "Teste SMS an Steffi: Hallo",
    "Morgen sende eine SMS an Steffi: Hallo",
    "Sende Steffi morgen eine SMS: Hallo",
    "Wenn ich später frage, sende eine SMS an Steffi: Hallo",
    "Schreib eine SMS an Steffi",
    "SMS an 112: Hilfe"
  ]) {
    assert.equal(parserContext.parseDirectSms(spokenText), null, spokenText);
  }
});

test("der lokale Text- und Sprachweg sendet direkt und behält den Entwurfsweg", () => {
  const handler = between(
    ui,
    "window.handleSolHoloLocalAction = async",
    "window.handleSolHoloRealtimeNoteTranscript"
  );
  const directIndex = handler.indexOf(
    "directSmsRequestFromMessage(cleanMessage)"
  );
  const fallbackIndex = handler.indexOf('executePhoneTool("prepare_sms"');
  assert.ok(directIndex >= 0 && directIndex < fallbackIndex);
  assert.match(handler, /executePhoneTool\("send_sms_direct"/u);
  assert.match(handler, /explicit_sms_command: true/u);
  assert.match(ui, /window\.extractSolHoloDirectSmsRequest/u);
});

test("Android fragt SEND_SMS erst nach der Standardassistentinnenrolle an", () => {
  const setup = between(
    nativePhone,
    "public void requestDirectSmsAccess",
    "public void sendSmsDirect"
  );
  const roleCheck = setup.indexOf("assistantRoleHeld()");
  const permissionRequest = setup.indexOf(
    'requestPermissionForAlias(\n                "directSms"'
  );
  assert.ok(roleCheck >= 0 && roleCheck < permissionRequest);
  assert.match(setup, /RoleManager\.ROLE_ASSISTANT/u);
  assert.match(setup, /directSmsAssistantRoleResult/u);
  assert.match(setup, /directSmsPermissionCallback/u);
  assert.match(nativePhone, /Manifest\.permission\.SEND_SMS/u);
});

test("direkter SMS-Versand ist ownergebunden und prüft den Kontakt erneut", () => {
  const method = between(
    nativePhone,
    "public void sendSmsDirect",
    '@SuppressWarnings("deprecation")\n    private void sendSmsThroughDefaultSubscription'
  );
  assert.match(method, /assistantRoleHeld\(\)/u);
  assert.match(method, /directSmsGranted\(\)/u);
  assert.match(method, /contactsGranted\(\)/u);
  assert.match(method, /explicitOwnerCallAuthorized\(call\)/u);
  assert.match(method, /findContactRecord\(contactId, expectedNumber\)/u);
  assert.match(method, /normalizedDirectSmsNumber\(contact\.number\)/u);
  assert.match(method, /sendSmsThroughDefaultSubscription/u);
  assert.match(method, /"sent", true/u);
  assert.match(method, /"deliveryConfirmed", false/u);
  assert.match(method, /"confirmationShown", false/u);
  assert.match(method, /"finalSmsAppConfirmationRequired", false/u);
  assert.doesNotMatch(method, /confirmExternalAction\(/u);

  const sender = between(
    nativePhone,
    "private void sendSmsThroughDefaultSubscription",
    "private String normalizedDirectCallNumber"
  );
  assert.match(sender, /SmsManager/u);
  assert.match(sender, /sendTextMessage/u);
  assert.match(sender, /sendMultipartTextMessage/u);
});

test("Notruf-, Kurz- und deutsche Mehrwertnummern bleiben gesperrt", () => {
  const validation = between(
    nativePhone,
    "private String normalizedDirectCallNumber",
    "private boolean isEmergencyDestination"
  );
  assert.match(validation, /SAFE_SERVICE_DIALER_NUMBERS\.contains\(digits\)/u);
  assert.match(validation, /isEmergencyDestination\(normalized\)/u);
  assert.match(validation, /digits\.length\(\) < 7/u);
  assert.match(validation, /startsWith\("0900"\)/u);
  assert.match(validation, /startsWith\("0137"\)/u);
  assert.match(validation, /startsWith\("0180"\)/u);
  assert.match(validation, /startsWith\("118"\)/u);
});

test("der bisherige sichtbare SMS-Entwurf bleibt als Rückfallweg erhalten", () => {
  const fallback = between(
    nativePhone,
    "public void prepareSms",
    "public void requestDirectSmsAccess"
  );
  assert.match(fallback, /confirmExternalAction\(/u);
  assert.match(fallback, /Intent\.ACTION_SENDTO/u);
  assert.match(fallback, /"messagePrepared", true/u);
  assert.match(fallback, /"sent", false/u);
  assert.match(fallback, /"finalSmsAppConfirmationRequired", true/u);
});

test("Assistentinnen-Komponenten, UI und Realtime-Tool sind vollständig verdrahtet", () => {
  assert.match(assistantService, /extends VoiceInteractionService/u);
  assert.match(
    assistantSessionService,
    /extends VoiceInteractionSessionService/u
  );
  assert.match(assistantConfig, /android:sessionService=/u);
  assert.match(assistantConfig, /android:recognitionService=/u);
  assert.match(assistantConfig, /android:supportsAssist="true"/u);
  assert.match(recognitionService, /extends RecognitionService/u);
  assert.match(recognitionService, /SpeechRecognizer\.ERROR_CLIENT/u);
  assert.match(installer, /android\.permission\.SEND_SMS/u);
  assert.match(installer, /android\.permission\.BIND_VOICE_INTERACTION/u);
  assert.match(installer, /android\.service\.voice\.VoiceInteractionService/u);
  assert.match(installer, /android\.speech\.RecognitionService/u);
  assert.match(installer, /android\.permission\.BIND_SPEECH_RECOGNITION_SERVICE/u);
  assert.match(installer, /human_holo_voice_interaction_service/u);
  assert.match(ui, /id="directSmsRow"/u);
  assert.match(ui, /requestDirectSmsAccess/u);
  assert.match(server, /name:\s*\n\s*"send_sms_direct"/u);
  assert.match(server, /explicit_sms_command/u);
  assert.match(index, /"send_sms_direct"/u);
});
