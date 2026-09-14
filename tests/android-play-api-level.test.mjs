import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = readFileSync(".github/workflows/android-build.yml", "utf8");

test("die geparkte historische Android-Konfiguration zielte auf API 36", () => {
  assert.match(workflow, /build-android:[\s\S]*?if: \$\{\{ false \}\}/u);
  assert.match(workflow, /cmdline-tools\/latest\/bin\/sdkmanager/u);
  assert.match(workflow, /"\$sdk_manager" "platforms;android-36"/u);
  assert.match(workflow, /compileSdkVersion[\s\S]*?= 36/u);
  assert.match(workflow, /targetSdkVersion[\s\S]*?= 36/u);
  assert.match(workflow, /com\.android\.tools\.build:gradle:8\.10\.1/u);
  assert.match(workflow, /gradle-8\.11\.1-all\.zip/u);
});

test("die geparkte historische Android-Konfiguration enthält API 23", () => {
  assert.match(workflow, /minSdkVersion\\s\*=\\s\*23/u);
  assert.match(workflow, /Android-minSdkVersion 23 muss unverändert bleiben/u);
});

test("der geparkte Pfad enthält weiterhin die frühere Buildprüfung", () => {
  assert.match(workflow, /assembleRelease bundleRelease/u);
  assert.match(workflow, /Android-Artefakte nur zur Buildprüfung kompilieren/u);
  assert.match(workflow, /keine Signierung, kein Upload und keine Marktfreigabe/u);
  assert.doesNotMatch(workflow, /jarsigner|upload-artifact/u);
});
