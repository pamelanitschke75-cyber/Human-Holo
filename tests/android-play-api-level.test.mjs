import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(".github/workflows/android-build.yml", "utf8");

test("der Play-Build verwendet Android 16 mit Ziel-API 36", () => {
  assert.match(workflow, /sdkmanager "platforms;android-36"/u);
  assert.match(workflow, /compileSdkVersion[\s\S]*?= 36/u);
  assert.match(workflow, /targetSdkVersion[\s\S]*?= 36/u);
  assert.match(workflow, /com\.android\.tools\.build:gradle:8\.10\.1/u);
  assert.match(workflow, /gradle-8\.11\.1-all\.zip/u);
});

test("die Android-Mindestversion bleibt unverändert bei API 23", () => {
  assert.match(workflow, /minSdkVersion\\s\*=\\s\*23/u);
  assert.match(workflow, /Android-minSdkVersion 23 muss unverändert bleiben/u);
});

test("API 36 gilt für APK und Google-Play-Bundle", () => {
  assert.match(workflow, /assembleRelease bundleRelease/u);
  assert.match(workflow, /Human Holo Play-Bundle dauerhaft signieren und prüfen/u);
});
