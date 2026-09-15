import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const installer = fs.readFileSync(
  new URL("../scripts/install-whatsapp-driving-mode.mjs", import.meta.url),
  "utf8"
);
const androidBuild = fs.readFileSync(
  new URL("../.github/workflows/android-build.yml", import.meta.url),
  "utf8"
);

test("Human Holo fordert keinerlei Health-Connect-Daten mehr an", () => {
  assert.doesNotMatch(installer, /android\.permission\.health\.READ_/u);
  assert.doesNotMatch(installer, /HealthConnectPlugin|HealthPrivacyActivity/u);
  assert.match(
    androidBuild,
    /! grep -q 'android\.permission\.health\.READ_' android\/app\/src\/main\/AndroidManifest\.xml/u
  );
  assert.match(androidBuild, /test ! -e android\/app\/src\/main\/java\/com\/solholo\/app\/HealthConnectPlugin\.java/u);
});
