import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const installer = fs.readFileSync(
  new URL("../scripts/install-whatsapp-driving-mode.mjs", import.meta.url),
  "utf8"
);
const privateInstaller = fs.readFileSync(
  new URL("../scripts/install-private-pam-medical.mjs", import.meta.url),
  "utf8"
);
const androidBuild = fs.readFileSync(
  new URL("../.github/workflows/android-build.yml", import.meta.url),
  "utf8"
);

test("normaler Human-Holo-Build fordert keinerlei Health-Connect-Daten an", () => {
  assert.doesNotMatch(installer, /android\.permission\.health\.READ_/u);
  assert.doesNotMatch(installer, /HealthConnectPlugin|HealthPrivacyActivity/u);
  assert.match(
    androidBuild,
    /! grep -q 'android\.permission\.health\.READ_' android\/app\/src\/main\/AndroidManifest\.xml/u
  );
  assert.match(androidBuild, /test ! -e android\/app\/src\/main\/java\/com\/solholo\/app\/HealthConnectPlugin\.java/u);
  assert.match(
    androidBuild,
    /Allgemeinen Human-Holo-Build medizinisch geschlossen halten/u
  );
});

test("privater Pam-Build ist manuell, ownergebunden, lesend und ohne Play-Bundle", () => {
  assert.match(
    privateInstaller,
    /PAM_HOLO_PRIVATE_MEDICAL_BUILD !== "true"/u
  );
  assert.equal(
    privateInstaller.includes('!/ownerId:\\s*"pam-sol"/u.test(index)'),
    true
  );
  assert.equal(
    privateInstaller.includes('!/speakerId:\\s*"pam"/u.test(index)'),
    true
  );
  assert.match(privateInstaller, /READ_HEART_RATE/u);
  assert.doesNotMatch(privateInstaller, /WRITE_[A-Z_]+/u);
  assert.match(privateInstaller, /no background import/u);
  assert.match(
    privateInstaller,
    /!isSafetyTriageQuestion\(cleanMessage\)[\s\S]*read_health_snapshot/u
  );
  assert.match(
    androidBuild,
    /workflow_dispatch[\s\S]*pam_holo_private_medical_test/u
  );
  assert.match(
    androidBuild,
    /Pams private medizinische Test-APK ohne Play-Bundle bauen[\s\S]*assembleRelease/u
  );
  assert.match(
    androidBuild,
    /Human Holo Release-APK und Play-Bundle bauen[\s\S]*bundleRelease/u
  );
});
