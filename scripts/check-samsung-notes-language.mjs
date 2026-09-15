import fs from "node:fs";
import vm from "node:vm";

const uiSource = fs.readFileSync("www/sol-holo-ui.js", "utf8");
const invocationStart = uiSource.indexOf(
  "function stripHoloInvocation"
);
const invocationEnd = uiSource.indexOf(
  "\n\n  function noteSecurityWarning",
  invocationStart
);
const functionStart = uiSource.indexOf(
  "function samsungNoteTextFromNaturalRequest"
);
const functionEnd = uiSource.indexOf(
  "\n\n  window.extractSolHoloSamsungNoteText",
  functionStart
);

if (
  invocationStart < 0 ||
  invocationEnd < 0 ||
  functionStart < 0 ||
  functionEnd < 0
) {
  throw new Error("Samsung-Notes-Spracherkennung wurde nicht gefunden.");
}

const context = {};
vm.createContext(context);
vm.runInContext(
  `${uiSource.slice(invocationStart, invocationEnd)}\n` +
    `${uiSource.slice(functionStart, functionEnd)}\n` +
    "this.extractSamsungNote = samsungNoteTextFromNaturalRequest;",
  context
);

const examples = new Map([
  ["Schreib bitte Zucker in Noten", "Zucker"],
  ["Schreib Zucker in Notes.", "Zucker"],
  ["Schreibe mir bitte Milch in Samsung Notes", "Milch"],
  ["Schreib bitte in Notes Kaffee", "Kaffee"],
  ["Pack bitte Eier in meine Notizen", "Eier"],
  ["Schreib Zucker, Milch und Kaffee in Samsung Notes", "Zucker, Milch und Kaffee"],
  ["Schreib in meine Notizen bitte Termin um 9:30 Uhr", "Termin um 9:30 Uhr"],
  ["In die Notizen bitte. Morgen Katzentoilette sauber machen", "Morgen Katzentoilette sauber machen"],
  ["Was steht in meinen Notizen?", ""]
]);

for (const [spokenText, expectedNote] of examples) {
  const actualNote = context.extractSamsungNote(spokenText);
  if (actualNote !== expectedNote) {
    throw new Error(
      `Falsche Notizerkennung für „${spokenText}“: ` +
        `erwartet „${expectedNote}“, erhalten „${actualNote}“`
    );
  }
}

const insertionStart = uiSource.indexOf(
  "function samsungNoteInsertionFromNaturalRequest"
);
const insertionEnd = uiSource.indexOf(
  "\n\n  function insertSamsungNoteLineBelow",
  insertionStart
);
if (insertionStart < 0 || insertionEnd < 0) {
  throw new Error("Samsung-Notes-Ergänzungserkennung wurde nicht gefunden.");
}
vm.runInContext(
  `${uiSource.slice(insertionStart, insertionEnd)}\n` +
    "this.extractSamsungNoteInsertion = samsungNoteInsertionFromNaturalRequest;",
  context
);

const insertionExamples = new Map([
  ["Setze Zucker unter Zitronensaft", ["Zucker", "Zitronensaft"]],
  ["Füge Zucker unter Zitronensaft hinzu", ["Zucker", "Zitronensaft"]],
  ["Sol, bitte setze Zucker unter Zitronensaft in Samsung Notes", ["Zucker", "Zitronensaft"]]
]);

for (const [spokenText, [addition, anchor]] of insertionExamples) {
  const actual = context.extractSamsungNoteInsertion(spokenText);
  if (actual?.addition !== addition || actual?.anchor !== anchor) {
    throw new Error(
      `Falsche Notes-Ergänzung für „${spokenText}“: ` +
        `erwartet „${anchor} / ${addition}“, erhalten ${JSON.stringify(actual)}`
    );
  }
}

const insertLineStart = uiSource.indexOf(
  "function insertSamsungNoteLineBelow"
);
const insertLineEnd = uiSource.indexOf(
  "\n\n  window.extractSolHoloSamsungNoteText",
  insertLineStart
);
if (insertLineStart < 0 || insertLineEnd < 0) {
  throw new Error("Samsung-Notes-Zeilenaufbau wurde nicht gefunden.");
}
vm.runInContext(
  `${uiSource.slice(insertLineStart, insertLineEnd)}\n` +
    "this.insertSamsungNoteLineBelow = insertSamsungNoteLineBelow;",
  context
);
assertNoteDraft("Zitronensaft", "Zitronensaft\nZucker");
assertNoteDraft("Zitronensaft\nZucker", "Zitronensaft\nZucker");

function assertNoteDraft(existing, expected) {
  const actual = context.insertSamsungNoteLineBelow(
    existing,
    "Zitronensaft",
    "Zucker"
  );
  if (actual !== expected) {
    throw new Error(
      `Falscher Samsung-Notes-Entwurf: erwartet ${JSON.stringify(expected)}, ` +
        `erhalten ${JSON.stringify(actual)}`
    );
  }
}

const phonePluginSource = fs.readFileSync(
  "android-native/PhoneContactsPlugin.java",
  "utf8"
);
const launchStart = phonePluginSource.indexOf(
  "private SamsungNoteLaunch samsungNoteLaunch"
);
const launchEnd = phonePluginSource.indexOf(
  "\n    @PluginMethod",
  launchStart
);
const launchSource = phonePluginSource.slice(launchStart, launchEnd);
const standardShareIndex = launchSource.indexOf(
  "new Intent(Intent.ACTION_SEND)"
);
const customCreateIndex = launchSource.indexOf(
  "new Intent(GOOGLE_CREATE_NOTE_ACTION)"
);

if (
  launchStart < 0 ||
  launchEnd < 0 ||
  standardShareIndex < 0 ||
  customCreateIndex < 0 ||
  standardShareIndex > customCreateIndex
) {
  throw new Error(
    "Samsung Notes muss zuerst die standardisierte ACTION_SEND-Textübergabe verwenden."
  );
}

for (const requiredSource of [
  "intent.putExtra(Intent.EXTRA_TEXT, text)",
  'result.put("saved", false)',
  'result.put("contentTransferred", true)',
  "new AlertDialog.Builder(activity)",
  '"Empfänger: " + recipient',
  '"SMS-Inhalt:\\n" + message',
  "Intent.ACTION_DIAL",
  "Intent.ACTION_CALL",
  "Manifest.permission.CALL_PHONE",
  "Manifest.permission.SEND_SMS",
  "RoleManager.ROLE_ASSISTANT",
  "public void requestDirectSmsAccess",
  "public void sendSmsDirect",
  "SmsManager",
  "public void startContactCall",
  "public void startHelpServiceCall",
  "Intent.ACTION_SENDTO"
]) {
  if (!phonePluginSource.includes(requiredSource)) {
    throw new Error(
      `Erwartete sichere Geräteübergabe fehlt: ${requiredSource}`
    );
  }
}

const directSmsStart = phonePluginSource.indexOf(
  "public void sendSmsDirect"
);
const directSmsEnd = phonePluginSource.indexOf(
  "\n    @SuppressWarnings(\"deprecation\")\n    private void sendSmsThroughDefaultSubscription",
  directSmsStart
);
const directSmsSource = phonePluginSource.slice(directSmsStart, directSmsEnd);
if (
  directSmsStart < 0 ||
  directSmsEnd < 0 ||
  !directSmsSource.includes("assistantRoleHeld()") ||
  !directSmsSource.includes("directSmsGranted()") ||
  !directSmsSource.includes("explicitOwnerCallAuthorized(call)") ||
  !directSmsSource.includes("findContactRecord(contactId, expectedNumber)") ||
  !directSmsSource.includes("normalizedDirectSmsNumber(contact.number)") ||
  !directSmsSource.includes('result.put("sent", true)') ||
  !directSmsSource.includes('result.put("deliveryConfirmed", false)') ||
  directSmsSource.includes("confirmExternalAction(")
) {
  throw new Error(
    "Direkte SMS müssen ownergebunden, kontaktgeprüft und ohne falsche Zustellbestätigung bleiben."
  );
}

const directSmsSetupStart = phonePluginSource.indexOf(
  "public void requestDirectSmsAccess"
);
const directSmsSetupEnd = phonePluginSource.indexOf(
  "\n    @PluginMethod\n    public void sendSmsDirect",
  directSmsSetupStart
);
const directSmsSetupSource = phonePluginSource.slice(
  directSmsSetupStart,
  directSmsSetupEnd
);
if (
  directSmsSetupStart < 0 ||
  directSmsSetupEnd < 0 ||
  directSmsSetupSource.indexOf("assistantRoleHeld()") < 0 ||
  directSmsSetupSource.indexOf('requestPermissionForAlias(\n                "directSms"') < 0 ||
  directSmsSetupSource.indexOf("assistantRoleHeld()") >
    directSmsSetupSource.indexOf('requestPermissionForAlias(\n                "directSms"')
) {
  throw new Error(
    "SEND_SMS darf erst nach der bestätigten Android-Assistentinnenrolle angefragt werden."
  );
}

const directCallStart = phonePluginSource.indexOf(
  "private void launchDirectCall"
);
const directCallEnd = phonePluginSource.indexOf(
  "\n    private String normalizedDirectCallNumber",
  directCallStart
);
const directCallSource = phonePluginSource.slice(
  directCallStart,
  directCallEnd
);
if (
  directCallStart < 0 ||
  directCallEnd < 0 ||
  !directCallSource.includes("Intent.ACTION_CALL") ||
  !directCallSource.includes('result.put("callStarted", true)') ||
  !directCallSource.includes('result.put("emergencyCall", false)')
) {
  throw new Error(
    "Der bestätigte direkte Anrufweg ist nicht vollständig abgesichert."
  );
}

const emergencyDialerStart = phonePluginSource.indexOf(
  "public void openServiceDialer"
);
const emergencyDialerEnd = phonePluginSource.indexOf(
  "\n    @PluginMethod\n    public void prepareSms",
  emergencyDialerStart
);
const emergencyDialerSource = phonePluginSource.slice(
  emergencyDialerStart,
  emergencyDialerEnd
);
if (
  emergencyDialerStart < 0 ||
  emergencyDialerEnd < 0 ||
  !emergencyDialerSource.includes("Intent.ACTION_DIAL") ||
  emergencyDialerSource.includes("Intent.ACTION_CALL")
) {
  throw new Error(
    "110, 112 und 116117 müssen im sicheren Android-Wähler bleiben."
  );
}

const nativeInstallerSource = fs.readFileSync(
  "scripts/install-whatsapp-driving-mode.mjs",
  "utf8"
);
if (
  !nativeInstallerSource.includes("android.permission.CALL_PHONE") ||
  !nativeInstallerSource.includes("android.permission.SEND_SMS") ||
  !nativeInstallerSource.includes(".HumanHoloVoiceInteractionService") ||
  !nativeInstallerSource.includes("android.permission.BIND_VOICE_INTERACTION") ||
  !nativeInstallerSource.includes(".HumanHoloRecognitionService") ||
  !nativeInstallerSource.includes("android.permission.BIND_SPEECH_RECOGNITION_SERVICE") ||
  !nativeInstallerSource.includes("@xml/human_holo_voice_interaction_service")
) {
  throw new Error(
    "Direkte Anrufe und der rollenbegrenzte direkte SMS-Weg fehlen im Android-Installer."
  );
}

console.log(
  "Samsung-Notes-Textübergabe und sichere Gerätebestätigungen sind geprüft. " +
    "Rollenbegrenzte Direkt-SMS sind ebenfalls geprüft."
);
