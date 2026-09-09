import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function loadEngine() {
  const source = await readFile(
    new URL("../www/remote-audio-level.js", import.meta.url),
    "utf8"
  );
  const context = vm.createContext({ Promise, Symbol });
  context.window = context;
  vm.runInContext(source, context, {
    filename: "remote-audio-level.js"
  });
  return context.SolHoloRemoteAudioLevel;
}

test("hörbarer WebRTC-Pegel erzeugt eine geglättete Mundaktivität", async () => {
  const engine = await loadEngine();
  let audioLevel = 0;
  const receiver = {
    getSynchronizationSources: () => [{ audioLevel }]
  };
  const tracker = engine.createTracker();

  assert.equal(tracker.setReceiver(receiver), true);
  assert.equal(tracker.receiverReady, true);
  assert.equal(tracker.sample(20).active, false);

  audioLevel = 0.08;
  const attackOne = tracker.sample(40);
  const attackTwo = tracker.sample(60);
  assert.equal(attackTwo.source, "synchronization-source");
  assert.ok(attackTwo.level > attackOne.level);
  assert.equal(attackTwo.active, true);

  audioLevel = 0;
  const releaseOne = tracker.sample(180);
  let releaseTwo;
  for (const timestamp of [260, 340, 420, 500, 580]) {
    releaseTwo = tracker.sample(timestamp);
  }
  assert.ok(releaseTwo.level < releaseOne.level);
  assert.equal(releaseTwo.active, false);
});

test("Receiver-Statistik ist ein zweiter Android-Audiofall", async () => {
  const engine = await loadEngine();
  let audioLevel = 0.06;
  const receiver = {
    getSynchronizationSources: () => [],
    getStats: async () => new Map([
      ["audio", {
        id: "audio",
        type: "inbound-rtp",
        kind: "audio",
        audioLevel
      }]
    ])
  };
  const tracker = engine.createTracker({ statsIntervalMs: 35 });
  tracker.setReceiver(receiver);

  tracker.sample(40);
  await new Promise(resolve => setTimeout(resolve, 0));
  const sample = tracker.sample(80);

  assert.equal(sample.source, "receiver-stats");
  assert.ok(sample.rawLevel >= 0.06);
  assert.equal(sample.active, true);
});

test("kumulierte WebRTC-Audioenergie wird als Pegel ausgewertet", async () => {
  const engine = await loadEngine();
  let energy = 1;
  let duration = 10;
  const receiver = {
    getSynchronizationSources: () => [],
    getStats: async () => new Map([
      ["audio", {
        id: "audio",
        type: "inbound-rtp",
        kind: "audio",
        totalAudioEnergy: energy,
        totalSamplesDuration: duration
      }]
    ])
  };
  const tracker = engine.createTracker({ statsIntervalMs: 35 });
  tracker.setReceiver(receiver);

  tracker.sample(40);
  await new Promise(resolve => setTimeout(resolve, 0));
  energy += 0.016;
  duration += 1;
  tracker.sample(80);
  await new Promise(resolve => setTimeout(resolve, 0));
  const sample = tracker.sample(100);

  assert.ok(sample.rawLevel >= 0.12);
  assert.equal(sample.active, true);
});

test("Pegelbrücke speichert und überträgt keine Sprachdaten", async () => {
  const source = await readFile(
    new URL("../www/remote-audio-level.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/u);
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket/u);
  assert.match(source, /getSynchronizationSources/u);
  assert.match(source, /totalAudioEnergy/u);
});

test("die App koppelt den echten Receiver an Mund und frühen Android-Unlock", async () => {
  const html = await readFile(
    new URL("../www/index.html", import.meta.url),
    "utf8"
  );

  assert.match(html, /remote-audio-level\.js\?v=1/u);
  assert.match(html, /lipRemoteAudioTracker[\s\S]*?\.sample\(timestamp\)/u);
  assert.match(html, /startLipSync\([\s\S]*?stream,[\s\S]*?event\.receiver/u);
  assert.match(
    html,
    /liveButton\.addEventListener\([\s\S]*?void ensureLipPlaybackAudioGraph\(\)[\s\S]*?await window\.pauseHeyHoSolForConversation/u
  );
});

test("Holos Android-Ausgabespur wird getrennt vom Mikrofon analysiert", async () => {
  const html = await readFile(
    new URL("../www/index.html", import.meta.url),
    "utf8"
  );

  assert.match(
    html,
    /createMediaElementSource\(\s*realtimeAudio\s*\)/u
  );
  assert.match(
    html,
    /lipMediaElementSourceNode\.connect\(\s*lipAudioContext\.destination\s*\)/u
  );
  assert.match(
    html,
    /lipSourceNode\s*=\s*lipAudioContext\s*\.createMediaStreamSource\(\s*stream\s*\)[\s\S]*?lipSourceNode\.connect\(\s*lipAnalyser\s*\)[\s\S]*?lipAnalyser\.connect\(\s*lipSilentGain\s*\)/u
  );
  assert.match(
    html,
    /lipSilentGain\.gain\.value\s*=\s*0/u
  );
  assert.match(
    html,
    /if\(\s*lipPlaybackAudioGraphPromise\s*\)[\s\S]*?return lipPlaybackAudioGraphPromise[\s\S]*?finally[\s\S]*?lipPlaybackAudioGraphPromise\s*=\s*null/u
  );
  assert.match(
    html,
    /if\(\s*lipSourceNode\s*\)[\s\S]*?lipSourceNode\.disconnect\(\)[\s\S]*?if\(\s*lipAnalyser\s*\)[\s\S]*?lipAnalyser\.disconnect\(\)/u
  );
});
