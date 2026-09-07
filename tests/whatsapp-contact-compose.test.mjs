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
const server = fs.readFileSync(
  new URL("../server.mjs", import.meta.url),
  "utf8"
);
const android = fs.readFileSync(
  new URL("../android-native/PhoneContactsPlugin.java", import.meta.url),
  "utf8"
);
const autoSendCommand = fs.readFileSync(
  new URL("../android-native/WhatsAppAutoSendCommand.java", import.meta.url),
  "utf8"
);
const autoSendService = fs.readFileSync(
  new URL(
    "../android-native/WhatsAppAutoSendAccessibilityService.java",
    import.meta.url
  ),
  "utf8"
);
const autoSendServiceConfig = fs.readFileSync(
  new URL(
    "../android-native/sol_holo_whatsapp_auto_send_service.xml",
    import.meta.url
  ),
  "utf8"
);
const installer = fs.readFileSync(
  new URL("../scripts/install-whatsapp-driving-mode.mjs", import.meta.url),
  "utf8"
);

function sourceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Startmarke fehlt: ${startMarker}`);
  assert.notEqual(end, -1, `Endmarke fehlt: ${endMarker}`);
  return source.slice(start, end);
}

const syntaxParser = new Function(
  `${sourceBetween(
    ui,
    "function cleanContactAliasPhrase",
    "function contactLookupHint"
  )}\n` +
  `${sourceBetween(
    ui,
    "function whatsAppDraftSyntaxFromMessage",
    "async function resolveWhatsAppDraftFromMessage"
  )}\n` +
  "return whatsAppDraftSyntaxFromMessage;"
)();

const aliasParser = new Function(
  `${sourceBetween(
    ui,
    "function cleanContactAliasPhrase",
    "function contactLookupHint"
  )}\n` +
  `${sourceBetween(
    ui,
    "function contactAliasBindingFromMessage",
    "function whatsAppDraftSyntaxFromMessage"
  )}\n` +
  "return contactAliasBindingFromMessage;"
)();

const resolverFactory = new Function(
  "findPhoneContact",
  "ambiguousContactAnswer",
  `${sourceBetween(
    ui,
    "function cleanContactAliasPhrase",
    "function contactLookupHint"
  )}\n` +
  `${sourceBetween(
    ui,
    "function whatsAppDraftSyntaxFromMessage",
    "async function resolveWhatsAppDraftFromMessage"
  )}\n` +
  `${sourceBetween(
    ui,
    "async function resolveWhatsAppDraftFromMessage",
    "window.extractSolHoloContactAliasBinding"
  )}\n` +
  "return resolveWhatsAppDraftFromMessage;"
);

test("natürliche WhatsApp-Aufträge behalten Empfänger und Text vollständig", () => {
  assert.deepEqual(
    syntaxParser("Schreib WhatsApp an Steffi: Ich liebe dich ❤️"),
    {
      explicitWhatsApp: true,
      contactName: "Steffi",
      message: "Ich liebe dich ❤️",
      body: "Steffi: Ich liebe dich ❤️"
    }
  );
  assert.deepEqual(
    syntaxParser("Schreib Steffi über WhatsApp: Bin gleich da"),
    {
      explicitWhatsApp: true,
      contactName: "Steffi",
      message: "Bin gleich da",
      body: "Steffi über WhatsApp: Bin gleich da"
    }
  );
  assert.deepEqual(
    syntaxParser(
      "Sol Holo, schicke Steffi eine Whats App mit dem Text: Ich liebe dich ❤️"
    ),
    {
      explicitWhatsApp: true,
      contactName: "Steffi",
      message: "Ich liebe dich ❤️",
      body: "Steffi eine Whats App mit dem Text: Ich liebe dich ❤️"
    }
  );
  assert.deepEqual(
    syntaxParser(
      "Hey Pam, schicke Schatz ❤️ eine WhatsApp mit dem Text: Ich liebe dich"
    ),
    {
      explicitWhatsApp: true,
      contactName: "Schatz",
      message: "Ich liebe dich",
      body: "Schatz ❤️ eine WhatsApp mit dem Text: Ich liebe dich"
    }
  );
  assert.deepEqual(
    syntaxParser("schreib Schatz❤️ ich liebe dich ❤️"),
    {
      explicitWhatsApp: false,
      contactName: "",
      message: "",
      body: "Schatz❤️ ich liebe dich ❤️"
    }
  );
  assert.equal(
    syntaxParser("Schreib eine SMS an Steffi: Bin gleich da"),
    null
  );
});

test("Kontaktalias wird nur durch einen ausdrücklichen Bindungsauftrag erkannt", () => {
  assert.deepEqual(
    aliasParser("Kontaktalias Schatz ist Steffi"),
    { alias: "Schatz", contactName: "Steffi" }
  );
  assert.deepEqual(
    aliasParser("Verbinde Schatz ❤️ mit Kontakt Steffi"),
    { alias: "Schatz", contactName: "Steffi" }
  );
  assert.equal(aliasParser("Schatz ist Steffi"), null);
});

test("Schatz-Kommandos und mehrteilige Namen werden ohne Trennwort aufgelöst", async () => {
  const contacts = new Map([
    ["schatz", { id: "1", name: "Steffi", number: "+491234567" }],
    ["anna maria", { id: "2", name: "Anna Maria", number: "+499876543" }],
    ["steffi", { id: "3", name: "Steffi", number: "+491234567" }]
  ]);
  const resolver = resolverFactory(
    async (query) => {
      const contact = contacts.get(String(query).toLocaleLowerCase("de-DE"));
      return {
        contact: contact || null,
        contacts: contact ? [contact] : [],
        ambiguous: false
      };
    },
    () => "mehrdeutig"
  );

  assert.deepEqual(
    await resolver("Schreib Schatz❤️ ich liebe dich ❤️"),
    {
      contactName: "Schatz",
      message: "ich liebe dich ❤️",
      explicitWhatsApp: false
    }
  );
  assert.deepEqual(
    await resolver("Schreib Anna Maria bin gleich da"),
    {
      contactName: "Anna Maria",
      message: "bin gleich da",
      explicitWhatsApp: false
    }
  );
  assert.deepEqual(
    await resolver(
      "Sol Holo, schicke Steffi eine WhatsApp mit dem Text: Ich liebe dich ❤️"
    ),
    {
      contactName: "Steffi",
      message: "Ich liebe dich ❤️",
      explicitWhatsApp: true
    }
  );
});

test("alle Gerätekontakte bleiben lokal und mehrdeutige Treffer werden nicht gewählt", () => {
  assert.match(android, /Manifest\.permission\.READ_CONTACTS/u);
  assert.match(android, /contactDirectoryScope", "all_device_contacts"/u);
  assert.match(android, /contactsUploaded", false/u);
  assert.match(ui, /Das Telefonbuch wird nicht hochgeladen/u);
  assert.match(ui, /candidates\.length === 1 \? candidates\[0\] : null/u);
  assert.doesNotMatch(ui, /exact\s*\|\|\s*contacts\[0\]/u);
  assert.match(ui, /ambiguousContactAnswer/u);
  assert.match(ui, /letzten vier Ziffern/u);
});

test("Kontaktalias bleibt im privaten App-Bereich und wird gegen Kontakte geprüft", () => {
  assert.match(android, /CONTACT_ALIAS_PREFERENCES/u);
  assert.match(android, /Context\.MODE_PRIVATE/u);
  assert.match(android, /contactAliasesOwnerScoped", true/u);
  assert.match(android, /"owner\." \+ ownerId \+ "\.alias\."/u);
  assert.match(ui, /ownerId: activePersonalOwner\(\)/u);
  assert.match(android, /public void bindContactAlias\(PluginCall call\)/u);
  assert.match(android, /public void resolveContactAlias\(PluginCall call\)/u);
  assert.match(android, /findContactRecord\(contactId, expectedNumber\)/u);
  assert.match(android, /Kontaktalias bestätigen/u);
  assert.match(android, /storedOnlyOnDevice", true/u);
});

test("WhatsApp-Auto-Senden ist einmalig, explizit und fail-closed", () => {
  const method = sourceBetween(
    android,
    "public void prepareWhatsApp",
    "private void confirmExternalAction"
  );
  assert.match(method, /authority\("wa\.me"\)/u);
  assert.match(method, /call\.getBoolean\("autoSend", false\)/u);
  assert.match(method, /call\.getBoolean\("explicitOwnerCommand", false\)/u);
  assert.match(method, /whatsAppAutoSendAccessEnabled/u);
  assert.match(method, /WhatsAppAutoSendCommand\.arm/u);
  assert.match(method, /WhatsAppAutoSendAccessibilityService\.wakeForPendingCommand/u);
  assert.match(method, /finalWhatsAppSendRequired", false/u);
  assert.match(method, /singleUseCommand", true/u);
  assert.match(method, /confirmExternalAction/u);
  assert.match(method, /Intent\.ACTION_VIEW/u);
  assert.match(method, /result\.put\("sent", false\)/u);
  assert.match(method, /finalWhatsAppSendRequired", true/u);
  assert.doesNotMatch(method, /Intent\.ACTION_SEND\b/u);
  assert.match(android, /WHATSAPP_PACKAGE = "com\.whatsapp"/u);
  assert.match(android, /"com\.whatsapp\.w4b"/u);
  assert.match(installer, /<package android:name="\$\{whatsAppPackage\}"/u);
  assert.match(installer, /"com\.whatsapp"/u);
  assert.match(installer, /"com\.whatsapp\.w4b"/u);
  assert.match(
    installer,
    /WhatsAppAutoSendAccessibilityService\.java/u
  );
  assert.match(
    installer,
    /android\.permission\.BIND_ACCESSIBILITY_SERVICE/u
  );

  assert.match(autoSendCommand, /static final long DEFAULT_TTL_MS = 30_000L/u);
  assert.match(autoSendCommand, /private static Pending pending/u);
  assert.match(autoSendCommand, /WHATSAPP_COMMAND_ALREADY_ACTIVE/u);
  assert.doesNotMatch(autoSendCommand, /SharedPreferences/u);
  assert.match(autoSendCommand, /public static synchronized Pending claim/u);
  assert.match(autoSendService, /pending\.packageName\.contentEquals/u);
  assert.match(autoSendService, /findExactDraft/u);
  assert.match(autoSendService, /findRecipientEvidence/u);
  assert.match(autoSendService, /findSendControl/u);
  assert.match(autoSendService, /scheduleRetryIfPending/u);
  assert.match(autoSendService, /clickableSelfOrAncestor/u);
  assert.match(autoSendService, /RETRY_INTERVAL_MS/u);
  assert.match(autoSendService, /WhatsAppAutoSendCommand\.claim/u);
  assert.match(autoSendService, /scheduleReturnToSolHolo\(claimed\)/u);
  assert.match(autoSendService, /performGlobalAction\(GLOBAL_ACTION_BACK\)/u);
  assert.match(autoSendService, /new Intent\(this, MainActivity\.class\)/u);
  assert.equal(
    (autoSendService.match(/ACTION_CLICK/g) || []).length,
    1,
    "Der Dienst darf genau eine Klickstelle besitzen"
  );
  assert.match(
    autoSendServiceConfig,
    /android:packageNames="com\.whatsapp,com\.whatsapp\.w4b"/u
  );
  assert.match(autoSendServiceConfig, /android:canRetrieveWindowContent="true"/u);
  assert.match(autoSendServiceConfig, /android:isAccessibilityTool="false"/u);
});

test("Text- und Sprachchat kennen dasselbe lokale WhatsApp-Werkzeug", () => {
  assert.match(server, /name:\s*\n\s*"prepare_whatsapp"/u);
  assert.match(server, /ausdrücklichem WhatsApp-Sendeauftrag/u);
  assert.match(server, /explicit_whatsapp_command/u);
  assert.match(server, /enum:\s*\[\s*true\s*\]/u);
  assert.match(server, /Ohne diese technische Rückmeldung niemals behaupten/u);
  assert.match(html, /"prepare_whatsapp"/u);
  assert.match(ui, /executePhoneTool\("prepare_whatsapp"/u);
  assert.match(ui, /plugin\.prepareWhatsApp/u);
  assert.match(ui, /autoSend: automaticSend/u);
  assert.match(ui, /explicitOwnerCommand: automaticSend/u);
  assert.match(ui, /explicit_whatsapp_command/u);
  assert.match(ui, /whatsAppAutoSendResult/u);
  assert.match(ui, /automatisch gesendet/u);
});

test("technisch bestätigter WhatsApp-Versand wird Sol verbindlich übergeben", () => {
  assert.match(android, /event\.put\("message", message/u);
  assert.match(android, /event\.put\("executedBy", "Pam’s Holo"\)/u);
  assert.match(android, /event\.put\("manualSendRequired", false\)/u);
  assert.match(ui, /recordSolHoloVerifiedDeviceAction/u);
  assert.match(html, /window\.recordSolHoloVerifiedDeviceAction/u);
  assert.match(html, /TECHNISCH_BESTAETIGTE_GERAETEAKTION/u);
  assert.match(html, /Technisch bestätigte Geräteaktion:/u);
  assert.match(html, /sendLiveTranscriptToMemory\([\s\S]*?"assistant"/u);
  assert.match(server, /VERBINDLICHE TECHNISCHE GERÄTEAKTIONEN/u);
  assert.match(server, /Widersprich einem solchen Beleg nicht/u);
  assert.match(server, /Die Nutzerin\s+erteilt den Auftrag;[\s\S]*führt ihn technisch aus/u);
});
