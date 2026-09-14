import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const installer = fs.readFileSync(
  new URL("../scripts/install-whatsapp-driving-mode.mjs", import.meta.url),
  "utf8"
);
const healthPlugin = fs.readFileSync(
  new URL("../android-native/HealthConnectPlugin.java", import.meta.url),
  "utf8"
);
const androidBuild = fs.readFileSync(
  new URL("../.github/workflows/android-build.yml", import.meta.url),
  "utf8"
);
const server = fs.readFileSync(
  new URL("../server.mjs", import.meta.url),
  "utf8"
);
const launchPolicy = fs.readFileSync(
  new URL("../modules/human-holo-launch-policy.mjs", import.meta.url),
  "utf8"
);

test("Legal-Review-Build fordert keinerlei Health-Connect-Daten an", () => {
  const allowedPermissions = installer.slice(
    installer.indexOf("const allowedPermissions"),
    installer.indexOf("// Falls ein Upstream-Template")
  );

  assert.doesNotMatch(installer, /READ_SEXUAL_ACTIVITY|SexualActivityRecord/u);
  assert.doesNotMatch(allowedPermissions, /android\.permission\.health\./u);
  assert.match(installer, /"HealthConnectPlugin\.java"/u);
  assert.match(installer, /rmSync\(join\(javaTarget, fileName\)/u);
  assert.match(androidBuild, /'android\.permission\.health\.'/u);
  assert.match(androidBuild, /! test -e android\/app\/src\/main\/java\/com\/solholo\/app\/HealthConnectPlugin\.java/u);
  assert.match(launchPolicy, /healthConnect: false/u);
});

test("historischer Health-Prototyp bleibt aus dem ausgelieferten Android-Projekt", () => {
  assert.match(installer, /registerPlugin\(PhoneContactsPlugin\.class\)/u);
  assert.doesNotMatch(installer, /registerPlugin\(HealthConnectPlugin\.class\)/u);
  assert.match(server, /Health Connect, Medikamentenerkennung und individuelle Gesundheitsberatung[\s\S]*nicht enthalten/u);
  assert.match(server, /isLaunchFeatureEnabled\("medicationRecognition"\)/u);
  assert.match(server, /isPersonalMedicalFeatureRequest\(message\)/u);
  assert.match(server, /respondLegalReviewHold\([\s\S]*"medicalAdvice"/u);
  // Der frühere Prototyp darf keine Schreibrechte enthalten und wird nicht
  // kopiert; diese Prüfung schützt auch das archivierte Quellmaterial.
  assert.match(healthPlugin, /new PermissionSpec\("READ_STEPS"/u);
  assert.match(healthPlugin, /new PermissionSpec\("READ_HEART_RATE"/u);
  assert.doesNotMatch(installer, /android\.permission\.health\.WRITE_/u);
  assert.doesNotMatch(healthPlugin, /android\.permission\.health\.WRITE_/u);
});
