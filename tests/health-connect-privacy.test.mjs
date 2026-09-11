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

test("Human Holo fordert sexuelle Aktivitaet weder an noch liest sie", () => {
  assert.doesNotMatch(installer, /READ_SEXUAL_ACTIVITY|SexualActivityRecord/u);
  assert.doesNotMatch(healthPlugin, /READ_SEXUAL_ACTIVITY|SexualActivityRecord/u);
  assert.match(
    androidBuild,
    /! grep -q 'READ_SEXUAL_ACTIVITY' android\/app\/src\/main\/AndroidManifest\.xml/u
  );
  assert.match(androidBuild, /! grep -q 'SexualActivityRecord'/u);
});

test("bestehende ausdruecklich gewollte Health-Lesefunktionen bleiben erhalten", () => {
  assert.match(installer, /android\.permission\.health\.READ_STEPS/u);
  assert.match(installer, /android\.permission\.health\.READ_HEART_RATE/u);
  assert.match(healthPlugin, /new PermissionSpec\("READ_STEPS"/u);
  assert.match(healthPlugin, /new PermissionSpec\("READ_HEART_RATE"/u);
  assert.doesNotMatch(installer, /android\.permission\.health\.WRITE_/u);
  assert.doesNotMatch(healthPlugin, /android\.permission\.health\.WRITE_/u);
});
