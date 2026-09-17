import assert from "node:assert/strict";
import test from "node:test";

import {
  PAM_HOLO_ACCESS_LEVEL,
  isPamHoloBusinessMatter,
  isPamHoloEverydayCapability,
  isPamHoloProtectedContentRequest,
  isPamHoloSystemSettingsCapability,
  pamHoloAccessBoundaryInstructions,
  pamHoloAccessSatisfies,
  pamHoloOwnerProof,
  pamHoloSessionAction
} from "../modules/pam-holo-access-policy.mjs";

test("Nach Fingerprint öffnet Pams registriertes Gerät den Alltag einschließlich Wetter, Einkaufsliste und WhatsApp", () => {
  for (const capability of [
    "conversation",
    "weather",
    "shopping_list",
    "whatsapp_message"
  ]) {
    assert.equal(isPamHoloEverydayCapability(capability), true);
    assert.equal(isPamHoloSystemSettingsCapability(capability), false);
  }
  assert.equal(
    pamHoloAccessSatisfies(
      PAM_HOLO_ACCESS_LEVEL.OWNER_EVERYDAY,
      PAM_HOLO_ACCESS_LEVEL.OWNER_EVERYDAY
    ),
    true
  );
});

test("Bilder, Dokumente und ausdrücklich geschäftliche Anliegen wählen die Fingerprint-Stufe", () => {
  assert.equal(isPamHoloProtectedContentRequest({ hasImage: true }), true);
  assert.equal(isPamHoloProtectedContentRequest({ hasVideo: true }), true);
  assert.equal(isPamHoloProtectedContentRequest({ hasDocument: true }), true);
  assert.equal(
    isPamHoloProtectedContentRequest({
      message: "Bitte prüfe diese geschäftliche Rechnung."
    }),
    true
  );
  assert.equal(isPamHoloBusinessMatter("Wie wird das Wetter?"), false);
  assert.equal(
    isPamHoloProtectedContentRequest({ message: "Setz Milch auf die Einkaufsliste" }),
    false
  );
});

test("Medien, Unterlagen und Systemeinstellungen bleiben entsperrpflichtig", () => {
  for (const capability of [
    "image_access",
    "video_access",
    "document_access",
    "file_attachment_access",
    "business_matter_access",
    "business_external_action",
    "system_settings",
    "security_settings",
    "account_connection_settings",
    "permission_settings",
    "medical_data_access",
    "backup_restore"
  ]) {
    assert.equal(isPamHoloSystemSettingsCapability(capability), true);
    assert.equal(isPamHoloEverydayCapability(capability), false);
  }
  assert.equal(
    pamHoloAccessSatisfies(
      PAM_HOLO_ACCESS_LEVEL.OWNER_EVERYDAY,
      PAM_HOLO_ACCESS_LEVEL.PROTECTED
    ),
    false
  );
  assert.equal(
    pamHoloAccessSatisfies(
      PAM_HOLO_ACCESS_LEVEL.PROTECTED,
      PAM_HOLO_ACCESS_LEVEL.OWNER_EVERYDAY
    ),
    true
  );
});

test("Sitzungsaktionen und Personenbeweise sind zwischen Alltag und System getrennt", () => {
  assert.equal(
    pamHoloSessionAction(PAM_HOLO_ACCESS_LEVEL.OWNER_EVERYDAY),
    "bind_owner_everyday_session"
  );
  assert.equal(
    pamHoloSessionAction(PAM_HOLO_ACCESS_LEVEL.PROTECTED),
    "bind_trusted_app_session"
  );
  assert.notEqual(
    pamHoloOwnerProof(PAM_HOLO_ACCESS_LEVEL.OWNER_EVERYDAY),
    pamHoloOwnerProof(PAM_HOLO_ACCESS_LEVEL.PROTECTED)
  );
});

test("die dokumentierte Grenze bezeichnet die Alltagsbeispiele ausdrücklich als nicht abschließend", () => {
  const instructions = pamHoloAccessBoundaryInstructions();
  assert.match(instructions, /„Hey Pam“ ist ausschließlich der Weckruf/u);
  assert.match(instructions, /Bevor irgendein Teil von Pam-Holo sichtbar wird/u);
  assert.match(instructions, /starke Android-Biometrie ohne Geräte-PIN-Fallback/u);
  assert.match(instructions, /unabhängig von Render, Cloudflare/u);
  assert.match(instructions, /ohne zweiten Fingerprint/u);
  assert.match(instructions, /Wetter/u);
  assert.match(instructions, /Einkaufsliste/u);
  assert.match(instructions, /WhatsApp/u);
  assert.match(instructions, /nicht\s+abschließend/u);
  assert.match(instructions, /Fotos, Videos, Scans, Dateien, Dokumente/u);
  assert.match(instructions, /Fingerprintfreigabe/u);
  assert.match(instructions, /Geschäftliche Angelegenheiten/u);
  assert.match(instructions, /hebt keine[\s\S]*Verbote auf/u);
  assert.match(instructions, /System-, Sicherheits-, Konto-, Verbindungs-/u);
  assert.match(instructions, /Health-Connect-Daten/u);
  assert.match(instructions, /Sicherung,[\s\S]*Export,[\s\S]*Import/u);
});

test("Client und Server erzwingen Fingerprint für geschützte Daten", async () => {
  const { readFile } = await import("node:fs/promises");
  const [
    html,
    ui,
    appLock,
    backup,
    animals,
    server,
    nativeSecurity,
    serviceWorker
  ] =
    await Promise.all([
      readFile(new URL("../www/index.html", import.meta.url), "utf8"),
      readFile(new URL("../www/sol-holo-ui.js", import.meta.url), "utf8"),
      readFile(new URL("../www/app-lock-bootstrap.mjs", import.meta.url), "utf8"),
      readFile(new URL("../www/sol-holo-backup.mjs", import.meta.url), "utf8"),
      readFile(new URL("../www/human-holo-animal-holos.mjs", import.meta.url), "utf8"),
      readFile(new URL("../server.mjs", import.meta.url), "utf8"),
      readFile(new URL("../android-native/SolAccessSecurityPlugin.java", import.meta.url), "utf8"),
      readFile(new URL("../www/service-worker.js", import.meta.url), "utf8")
    ]);

  assert.doesNotMatch(appLock, /claimVerifiedWakeOwnerProof/u);
  assert.doesNotMatch(appLock, /verifySample\(/u);
  assert.match(appLock, /plugin\.authorizeAppAccess/u);
  assert.match(appLock, /authenticationType !== "system_strong_biometric"/u);
  assert.match(appLock, /plugin\.consumeCriticalAuthorization/u);
  assert.match(
    appLock,
    /authorizeAppAccess[\s\S]*consumeCriticalAuthorization[\s\S]*revealApp\(\);[\s\S]*refreshEverydaySessionInBackground/u
  );
  assert.match(appLock, /ownerEverydayAuthorizationId/u);
  assert.match(appLock, /authorizationId: hasFingerprintGrant/u);
  assert.match(appLock, /trusted-app-session\.mjs\?v=11/u);
  assert.match(html, /app-lock-bootstrap\.mjs\?v=11/u);
  assert.match(html, /service-worker\.js\?v=297/u);
  assert.match(
    serviceWorker,
    /human-holo-296-pam-fingerprint-entry-wake-only-v6/u
  );
  assert.doesNotMatch(
    appLock,
    /status\?\.device\?\.registered !== true[\s\S]{0,300}revealApp\(\)/u
  );
  assert.match(appLock, /allowBootstrap: false/u);
  assert.match(appLock, /"medical_data"/u);
  assert.match(appLock, /"backup_and_restore"/u);
  assert.match(html, /pamHoloRequestNeedsFingerprint/u);
  assert.match(ui, /SolHoloProtectedAccess\?\.ensure/u);
  assert.match(backup, /protected_media_documents_settings/u);
  assert.match(animals, /protected_media_documents_settings/u);
  assert.match(server, /function requireProtectedTrustedSession/u);
  assert.match(server, /isPamHoloProtectedContentRequest/u);
  assert.match(server, /\/google\/drive\/search[\s\S]*protectedAccess: true/u);
  assert.match(server, /\/memory\/backup\/export[\s\S]*requireProtectedOwnerIdentity/u);
  assert.match(server, /\/animal-holos\/profile-photo\/save[\s\S]*requireProtectedOwnerIdentity/u);
  assert.match(nativeSecurity, /PROTECTED_AUTHENTICATORS\s*=\s*\n\s*BiometricManager\.Authenticators\.BIOMETRIC_STRONG/u);
  assert.match(
    nativeSecurity,
    /\(authenticators & BiometricManager\.Authenticators\.DEVICE_CREDENTIAL\)[\s\S]*promptBuilder\.setNegativeButtonText\("Abbrechen"\)[\s\S]*promptBuilder\.build\(\)/u
  );
  assert.match(
    nativeSecurity,
    /setAllowedAuthenticators\(PROTECTED_AUTHENTICATORS\)[\s\S]{0,180}setNegativeButtonText\("Abbrechen"\)[\s\S]{0,80}\.build\(\)/u
  );
  const appAccessMethod = nativeSecurity.slice(
    nativeSecurity.indexOf("public void authorizeAppAccess"),
    nativeSecurity.indexOf("public void authorizeBiometricRecovery")
  );
  assert.ok(appAccessMethod.length > 0);
  assert.doesNotMatch(appAccessMethod, /consumeOwnerPersonProof/u);
  assert.doesNotMatch(appAccessMethod, /ownerPersonProofId/u);
});
