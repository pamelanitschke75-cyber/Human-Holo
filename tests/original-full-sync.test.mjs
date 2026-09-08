import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function loadOriginalFullSync() {
  const source = await readFile(
    new URL("../www/original-full-sync.js", import.meta.url),
    "utf8"
  );
  const context = vm.createContext({});
  context.window = context;
  vm.runInContext(source, context, {
    filename: "original-full-sync.js"
  });
  return context.SolHoloOriginalFullSync;
}

async function loadMotionProfile() {
  const source = await readFile(
    new URL("../www/sol-motion-profile.js", import.meta.url),
    "utf8"
  );
  const context = vm.createContext({});
  context.window = context;
  vm.runInContext(source, context, {
    filename: "sol-motion-profile.js"
  });
  return context.SolHoloMotionProfile;
}

test("Original Full Sync besitzt ein ownergebundenes Gesamtbewegungsprofil", async () => {
  const engine = await loadOriginalFullSync();
  const profile = await loadMotionProfile();

  assert.match(profile.version, /original-full-sync/);
  assert.equal(profile.originalFullSync.enabled, true);
  assert.equal(profile.originalFullSync.identityScope, "pam-sol");
  assert.ok(profile.originalFullSync.hairResponseMs > profile.originalFullSync.motionResponseMs);
  assert.ok(profile.originalFullSync.bodyBreathCycleMs >= 2200);
  assert.ok(Object.isFrozen(profile.originalFullSync));
  assert.equal(engine.normalizeProfile(profile.originalFullSync).identityScope, "pam-sol");
});

test("Stimme steuert Gesicht, Kopf, Haare und sichtbaren Koerper gemeinsam", async () => {
  const engine = await loadOriginalFullSync();
  const profile = (await loadMotionProfile()).originalFullSync;
  const silent = engine.calculateFrame(
    {
      timestamp: 3200,
      speaking: false,
      openness: 0,
      wideness: 0,
      roundness: 0,
      rms: 0,
      low: 0,
      middle: 0,
      high: 0
    },
    profile
  );
  const speaking = engine.calculateFrame(
    {
      timestamp: 3200,
      speaking: true,
      openness: 0.54,
      wideness: 0.31,
      roundness: 0.14,
      rms: 0.09,
      low: 0.22,
      middle: 0.48,
      high: 0.35
    },
    profile
  );

  for (const value of Object.values(speaking)) {
    assert.equal(Number.isFinite(value), true);
  }
  assert.ok(speaking.activity > silent.activity);
  assert.notEqual(speaking.headX, 0);
  assert.notEqual(speaking.hairX, 0);
  assert.notEqual(speaking.torsoY, 0);
  assert.ok(speaking.browLift > 0);
  assert.ok(speaking.cheekLift > 0);
});

test("Haarbewegung folgt langsamer als Gesicht und bleibt weich", async () => {
  const engine = await loadOriginalFullSync();
  const target = {
    ...engine.neutralFrame,
    headX: 0.010,
    hairX: 0.018,
    bodyScaleY: 1.004,
    torsoScaleY: 1.006
  };
  const faceStep = engine.smoothFrame(
    engine.neutralFrame,
    target,
    16.67,
    90
  );
  const hairStep = engine.smoothFrame(
    engine.neutralFrame,
    target,
    16.67,
    170
  );

  assert.ok(faceStep.headX > 0 && faceStep.headX < target.headX);
  assert.ok(hairStep.hairX > 0 && hairStep.hairX < target.hairX);
  assert.ok(hairStep.hairX < faceStep.hairX);
  assert.ok(faceStep.bodyScaleY > 1 && faceStep.bodyScaleY < 1.004);
});

test("Jedes neue Bild erhaelt eine neue sichere Geometriezuordnung", async () => {
  const engine = await loadOriginalFullSync();
  const valid = engine.normalizeGeometry({
    face: {
      left: 0.34,
      top: 0.18,
      right: 0.66,
      bottom: 0.62,
      width: 0.32,
      height: 0.44,
      centerX: 0.50,
      centerY: 0.40
    }
  });
  const invalid = engine.normalizeGeometry({
    face: {
      left: 0,
      top: 0,
      right: 0.05,
      bottom: 0.05,
      width: 0.05,
      height: 0.05,
      centerX: 0.025,
      centerY: 0.025
    }
  });

  assert.equal(valid.centerX, 0.50);
  assert.equal(valid.height, 0.44);
  assert.equal(invalid, null);
});

test("Bildwechsel setzt die alte Zuordnung vor jeder neuen Analyse zurueck", async () => {
  const html = await readFile(
    new URL("../www/index.html", import.meta.url),
    "utf8"
  );
  const ui = await readFile(
    new URL("../www/sol-holo-ui.js", import.meta.url),
    "utf8"
  );

  assert.match(
    html,
    /setImage\(source\)[\s\S]*?originalFullSyncController\s*\?\.setGeometry\(null\)[\s\S]*?solImage\.src\s*=\s*cleanSource/u
  );
  assert.match(
    html,
    /rig\.getFullSyncGeometry\?\.\(\)/u
  );
  assert.match(
    ui,
    /applyCustomCloneAppearance\(photo, mouth\)[\s\S]*?SolHoloClone\?\.setImage\(customClonePhoto\)/u
  );
});

test("In der sichtbaren App heisst der Bereich Original Full Sync", async () => {
  const html = await readFile(
    new URL("../www/index.html", import.meta.url),
    "utf8"
  );

  assert.match(
    html,
    /Lip\[-‑ \]\?Sync\(\?: V4\)\?\\b\/giu,[\s\S]*?"Original Full Sync"/u
  );
  assert.match(html, /✨ Original Full Sync bereit\./u);
});

test("Bewegungscode speichert oder uebertraegt keine Bilddateien", async () => {
  const source = await readFile(
    new URL("../www/original-full-sync.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/u);
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket/u);
  assert.match(source, /image\.addEventListener\("load", syncSource\)/u);
  assert.match(source, /setGeometry\(value\)/u);
});
