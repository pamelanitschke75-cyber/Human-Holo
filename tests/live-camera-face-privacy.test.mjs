import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  facePixelationRegions,
  pixelateFaceRegions
} from "../www/live-camera-face-privacy.mjs";

const readText = path =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const html = readText("www/index.html");
const moduleSource = readText("www/live-camera-face-privacy.mjs");
const serviceWorker = readText("www/service-worker.js");
const workflow = readText(".github/workflows/android-build.yml");
const readme = readText("README.md");
const privacy = readText("Datenschutz.md");
const documentation = readText(
  "PAM-HOLO-LIVE-KAMERA-GESICHTSSCHUTZ-17-09-2026.md"
);

function landmarksForBox(left, top, right, bottom) {
  return [
    { x: left, y: top },
    { x: (left + right) / 2, y: top },
    { x: right, y: top },
    { x: right, y: (top + bottom) / 2 },
    { x: right, y: bottom },
    { x: (left + right) / 2, y: bottom },
    { x: left, y: bottom },
    { x: left, y: (top + bottom) / 2 }
  ];
}

test("erkannte Gesichter erhalten vergrößerte und begrenzte Pixelbereiche", () => {
  const regions = facePixelationRegions(
    [
      landmarksForBox(0.40, 0.30, 0.60, 0.70),
      landmarksForBox(-0.05, 0.02, 0.08, 0.20)
    ],
    1000,
    500
  );

  assert.equal(regions.length, 2);
  assert.ok(regions[0].x < 400);
  assert.ok(regions[0].y < 150);
  assert.ok(regions[0].width > 200);
  assert.ok(regions[0].height > 200);
  assert.equal(regions[1].x, 0);
  assert.equal(regions[1].y, 0);
  assert.ok(regions.every(region =>
    region.x >= 0 &&
    region.y >= 0 &&
    region.x + region.width <= 1000 &&
    region.y + region.height <= 500
  ));
});

test("unvollständige oder ungültige Landmarken werden nicht als Gesicht ausgegeben", () => {
  assert.deepEqual(
    facePixelationRegions([[{ x: 0.5, y: 0.5 }]], 640, 480),
    []
  );
  assert.deepEqual(facePixelationRegions(null, 640, 480), []);
});

test("Pixelung verkleinert und zeichnet jeden geschützten Bereich ohne Glättung zurück", () => {
  const sourceDraws = [];
  const pixelDraws = [];
  const sourceContext = {
    imageSmoothingEnabled: true,
    drawImage: (...arguments_) => sourceDraws.push(arguments_),
    restore: () => {},
    save: () => {}
  };
  const pixelContext = {
    imageSmoothingEnabled: false,
    clearRect: () => {},
    drawImage: (...arguments_) => pixelDraws.push(arguments_)
  };
  const pixelCanvas = {
    width: 0,
    height: 0,
    getContext: () => pixelContext
  };
  const canvas = {
    width: 640,
    height: 480,
    getContext: () => sourceContext,
    ownerDocument: {
      createElement: () => pixelCanvas
    }
  };

  const count = pixelateFaceRegions(canvas, [
    { x: 20, y: 30, width: 180, height: 144 },
    { x: 300, y: 90, width: 90, height: 108 }
  ]);

  assert.equal(count, 2);
  assert.equal(pixelDraws.length, 2);
  assert.equal(sourceDraws.length, 2);
  assert.equal(sourceContext.imageSmoothingEnabled, false);
  assert.ok(pixelCanvas.width < 90);
  assert.ok(pixelCanvas.height < 108);
});

test("Umgebungsbilder werden vor jeder Kodierung lokal geschützt", () => {
  assert.match(
    html,
    /actualFacingMode\s*===\s*\n\s*"environment"\s*\|\|[\s\S]*?liveCameraFacingMode\s*===\s*\n\s*"environment"/u
  );
  assert.match(
    html,
    /import\(\s*"\.\/live-camera-face-privacy\.mjs\?v=1"\s*\)/u
  );

  const captureStart = html.indexOf(
    "async function captureCurrentLiveCameraImage("
  );
  const captureEnd = html.indexOf(
    "function liveCameraDataUrlLimit(",
    captureStart
  );
  const capture = html.slice(captureStart, captureEnd);

  assert.ok(captureStart >= 0);
  assert.ok(capture.indexOf("await protectLiveCameraCanvas(") >= 0);
  assert.ok(
    capture.indexOf("await protectLiveCameraCanvas(") <
      capture.indexOf("canvas.toDataURL(")
  );
  assert.match(html, /GESICHTER LOKAL VERPIXELT/u);
});

test("Gesichtsschutz lädt nur lokale Assets und speichert keine Roh- oder Landmarkdaten", () => {
  assert.match(moduleSource, /\.\/mediapipe\/vision_bundle\.mjs/u);
  assert.match(moduleSource, /\.\/mediapipe\/face_landmarker\.task/u);
  assert.doesNotMatch(moduleSource, /https?:\/\//u);
  assert.doesNotMatch(moduleSource, /\bfetch\s*\(/u);
  assert.doesNotMatch(moduleSource, /localStorage|sessionStorage|indexedDB/u);
  assert.doesNotMatch(moduleSource, /faceLandmarks\s*=/u);
});

test("technischer Schutzfehler stoppt Live- und Gebärdenbildweg fail-closed", () => {
  assert.match(html, /PAM_HOLO_LIVE_FACE_PRIVACY_FAIL_CLOSED/u);
  assert.match(
    html,
    /function stopLiveCameraForFacePrivacy\([\s\S]*?stopLiveCamera\(\{[\s\S]*?notifyModel:true/u
  );
  assert.match(
    html,
    /Gebärdensprachsequenz[\s\S]*?PAM_HOLO_LIVE_FACE_PRIVACY_FAIL_CLOSED|PAM_HOLO_LIVE_FACE_PRIVACY_FAIL_CLOSED[\s\S]*?Gebärdensprachsequenz/u
  );
  assert.match(
    serviceWorker,
    /"\.\/live-camera-face-privacy\.mjs"/u
  );
  assert.match(
    workflow,
    /test -s "\$face_privacy"[\s\S]*?! grep -Eq 'https\?:\/\/' "\$face_privacy"/u
  );
});

test("Dokumentation begrenzt die Aktivierung auf Pam und nennt die Erkennungsgrenze", () => {
  for (const text of [readme, privacy, documentation]) {
    assert.match(text, /ausschließlich|nur für Pams/u);
    assert.match(text, /anwaltlichen Hold/u);
    assert.match(text, /lokal/u);
    assert.match(text, /verpixel/u);
    assert.match(text, /übersehen/u);
  }
  assert.match(documentation, /keine hundertprozentige Anonymisierung/u);
  assert.match(documentation, /kein ungeschütztes Bild\n\s*gesendet/u);
});
