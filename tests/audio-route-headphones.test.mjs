import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readProjectFile = path =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Human Holo bevorzugt verbundene Kopfhoerer vor dem Handy-Lautsprecher", async () => {
  const [html, plugin] = await Promise.all([
    readProjectFile("www/index.html"),
    readProjectFile("android-native/SolAudioRoutePlugin.java")
  ]);

  assert.match(html, /plugin\.usePreferredOutput\(\)/u);
  assert.doesNotMatch(html, /plugin\.useSpeaker\(\)/u);
  assert.match(
    plugin,
    /selectPreferredExternalCommunicationDevice\(\)[\s\S]*?externalSelected[\s\S]*?TYPE_BUILTIN_SPEAKER/u
  );
  assert.match(plugin, /TYPE_BLUETOOTH_SCO/u);
  assert.match(plugin, /TYPE_BLE_HEADSET/u);
  assert.match(plugin, /TYPE_WIRED_HEADPHONES/u);
});

test("ohne externes Ausgabegeraet bleibt Holos Stimme am Handy hoerbar", async () => {
  const plugin = await readProjectFile(
    "android-native/SolAudioRoutePlugin.java"
  );

  assert.match(
    plugin,
    /if \(!externalSelected && !speakerSelected\)[\s\S]*?setSpeakerphoneOn\(true\)/u
  );
  assert.match(plugin, /restorePreviousRoute\(\)/u);
});
