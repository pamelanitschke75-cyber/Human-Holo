import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  PAM_HOLO_PRIVATE_MEDICAL_POLICY,
  isPamHoloPrivateMedicalAuthorized,
  isPamHoloPrivateMedicalIdentity,
  pamHoloPrivateMedicalBoundaryInstructions
} from "../modules/pam-holo-private-medical.mjs";
import {
  TRUSTED_APP_ACCESS_LEVEL,
  TRUSTED_APP_EVERYDAY_OWNER_PERSON_PROOF
} from "../modules/trusted-app-session.mjs";

const pam = Object.freeze({ ownerId: "pam-sol", speakerId: "pam" });
const trustedPamSession = Object.freeze({
  ownerId: "pam-sol",
  accessLevel: TRUSTED_APP_ACCESS_LEVEL.OWNER_EVERYDAY,
  ownerPersonProof: TRUSTED_APP_EVERYDAY_OWNER_PERSON_PROOF
});

test("private Medizinfreigabe verlangt exakt Pam und den persönlichen Sitzungsnachweis", () => {
  assert.equal(isPamHoloPrivateMedicalIdentity(pam), true);
  assert.equal(
    isPamHoloPrivateMedicalAuthorized(pam, trustedPamSession),
    true
  );
  assert.equal(
    isPamHoloPrivateMedicalAuthorized(pam, {
      ownerId: "pam-sol",
      accessLevel: TRUSTED_APP_ACCESS_LEVEL.OWNER_EVERYDAY,
      ownerPersonProof: "fingerprint_or_pin_only"
    }),
    false
  );
  assert.equal(
    isPamHoloPrivateMedicalAuthorized(
      { ownerId: "steffi-sol", speakerId: "steffi" },
      trustedPamSession
    ),
    false
  );
  assert.equal(
    PAM_HOLO_PRIVATE_MEDICAL_POLICY.humanHoloRelease,
    "lawyer-approval-required"
  );
  assert.equal(PAM_HOLO_PRIVATE_MEDICAL_POLICY.medicalDevice, false);
});

test("allgemeines Human Holo bleibt geschlossen und privater Test bleibt begrenzt", () => {
  const general = pamHoloPrivateMedicalBoundaryInstructions();
  assert.match(general, /ALLGEMEINES HUMAN HOLO/u);
  assert.match(general, /anwaltlicher Prüfung/u);

  const privateInstructions =
    pamHoloPrivateMedicalBoundaryInstructions({ authorized: true });
  assert.match(privateInstructions, /PRIVATE PAM-HOLO-MEDIZINTEST/u);
  assert.match(privateInstructions, /Keine Diagnose/u);
  assert.match(privateInstructions, /keine persönliche Dosierung/u);
  assert.match(privateInstructions, /nicht automatisch importiert/u);
});

test("Server, App-Sperre und NFC-Uhr bleiben fail-closed", async () => {
  const [server, appLock, nativeAccess, nativeSpeaker, workflow] =
    await Promise.all([
      readFile(new URL("../server.mjs", import.meta.url), "utf8"),
      readFile(
        new URL("../www/app-lock-bootstrap.mjs", import.meta.url),
        "utf8"
      ),
      readFile(
        new URL("../android-native/SolAccessSecurityPlugin.java", import.meta.url),
        "utf8"
      ),
      readFile(
        new URL("../android-native/SolSpeakerIdentityPlugin.java", import.meta.url),
        "utf8"
      ),
      readFile(
        new URL("../.github/workflows/android-build.yml", import.meta.url),
        "utf8"
      )
    ]);

  assert.match(server, /function requirePrivatePamHoloAccess/u);
  assert.match(server, /isPamHoloPrivateMedicalAuthorized/u);
  assert.match(server, /app\.post\("\/sol"[\s\S]*requirePrivatePamHoloAccess/u);
  assert.match(server, /app\.post\("\/realtime\/token"[\s\S]*requirePrivatePamHoloAccess/u);
  assert.doesNotMatch(appLock, /freshOwnerVoiceProof/u);
  assert.doesNotMatch(appLock, /claimVerifiedWakeOwnerProof/u);
  assert.doesNotMatch(appLock, /verifySample\(/u);
  assert.match(appLock, /„Hey Pam“ ist ausschließlich der Weckruf/u);
  assert.match(appLock, /authorizeAppAccess/u);
  assert.match(appLock, /consumeCriticalAuthorization/u);
  assert.match(appLock, /authenticationType !== "system_strong_biometric"/u);
  assert.match(appLock, /ownerEverydayAuthorizationId/u);
  assert.match(
    appLock,
    /authorizeAppAccess[\s\S]*consumeCriticalAuthorization[\s\S]*revealApp\(\);[\s\S]*void connectOwnerServicesAfterFingerprint/u
  );
  assert.match(appLock, /allowBootstrap: false/u);
  assert.match(appLock, /ensureProtectedPamHoloAccess/u);
  assert.match(appLock, /Browseransicht bleibt geschlossen/u);
  assert.match(nativeSpeaker, /consumeOwnerPersonProof/u);
  const appAccessMethod = nativeAccess.slice(
    nativeAccess.indexOf("public void authorizeAppAccess"),
    nativeAccess.indexOf("public void authorizeBiometricRecovery")
  );
  assert.ok(appAccessMethod.length > 0);
  assert.doesNotMatch(appAccessMethod, /consumeOwnerPersonProof/u);
  assert.doesNotMatch(appAccessMethod, /ownerPersonProofId/u);
  assert.match(nativeAccess, /SIMPLE_NFC_TAG_NEVER_ACCEPTED/u);
  assert.match(nativeAccess, /companionImplemented", false/u);
  assert.match(nativeAccess, /transportImplemented", false/u);
  assert.match(workflow, /Pams private medizinische Test-APK ohne Play-Bundle bauen/u);
});

test("Cloudflare-Angabe hält den fehlenden KI-Kontozugriff fest", async () => {
  const [readme, security, release] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../SECURITY.md", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../PAM-HOLO-PRIVATE-MEDIZIN-TESTFREIGABE-17-09-2026.md",
        import.meta.url
      ),
      "utf8"
    )
  ]);
  for (const document of [readme, security, release]) {
    assert.match(
      document,
      /ChatGPT\/Codex hat als KI keinen Zugriff auf Pams\s+Cloudflare-Konto/u
    );
    assert.match(document, /persönlich eingerichtet/u);
    assert.match(document, /Cloudflare-Türsteher selbst\s+eingetragen/u);
  }
});
