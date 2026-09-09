import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import {
  hasSafeFaceGeometry,
  lowerFaceMotionWeight,
  normalizedLipCurve,
  normalizedLipSeam,
  normalizeFullSyncFaceMotion,
  normalizeSpeechMotion,
  smoothSpeechMotion,
  speechMotionMetrics
} from "../www/full-face-rig.mjs";

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

const face = {
  left: 0.34,
  right: 0.66,
  top: 0.20,
  bottom: 0.62,
  width: 0.32,
  height: 0.42,
  centerX: 0.50,
  centerY: 0.41
};

const mouth = {
  left: 0.43,
  right: 0.57,
  top: 0.405,
  bottom: 0.445,
  width: 0.14,
  height: 0.04,
  centerX: 0.50,
  centerY: 0.425
};

test("Bewegungsprofil begrenzt Foto-Fallback und definiert echten Kieferweg", async () => {
  const profile = await loadMotionProfile();

  assert.match(profile.version, /original-full-sync/);
  assert.ok(profile.speech.jawTravelByFace > 0);
  assert.ok(profile.speech.jawTravelByMouth > 0);
  assert.ok(profile.speech.lowerLipShare > profile.speech.upperLipShare);
  assert.ok(profile.fallback.maximumOpen < profile.speech.maximumOpen);
  assert.ok(profile.fallback.closureDepth > profile.fallback.baseOpen);
  assert.ok(Object.isFrozen(profile));
  assert.ok(Object.isFrozen(profile.speech));
  assert.ok(Object.isFrozen(profile.originalFullSync));
});

test("Original Full Sync begrenzt Kopf- und Gesichtsbewegung sicher", () => {
  assert.deepEqual(
    normalizeFullSyncFaceMotion({
      headX: 8,
      headY: -8,
      headTilt: 4,
      browLift: 2,
      eyeNarrow: -1,
      cheekLift: 2,
      mouthAsymmetry: -4
    }),
    {
      headX: 0.018,
      headY: -0.014,
      headTilt: 0.035,
      browLift: 0.28,
      eyeNarrow: 0,
      cheekLift: 0.24,
      mouthAsymmetry: -0.09
    }
  );
});

test("Audio-/Visem-Werte werden sicher auf das Bewegungsprofil begrenzt", async () => {
  const { speech } = await loadMotionProfile();
  const motion = normalizeSpeechMotion(
    {
      openness: 99,
      wideness: -1,
      roundness: Number.NaN
    },
    speech
  );

  assert.deepEqual(motion, {
    openness: speech.maximumOpen,
    wideness: 0,
    roundness: 0
  });
});

test("Mundoeffnung bewegt Unterlippe und Kiefer, Stille bleibt neutral", async () => {
  const { speech } = await loadMotionProfile();
  const silent = speechMotionMetrics(
    { openness: 0, wideness: 0, roundness: 0 },
    face,
    mouth,
    speech
  );
  const spoken = speechMotionMetrics(
    { openness: speech.maximumOpen, wideness: 0.18, roundness: 0.05 },
    face,
    mouth,
    speech
  );

  assert.equal(silent.verticalTravel, 0);
  assert.equal(silent.jawTravel, 0);
  assert.ok(spoken.verticalTravel > 0);
  assert.ok(spoken.jawTravel > 0);
  assert.ok(spoken.verticalTravel * 650 >= 8);
  assert.ok(spoken.jawTravel * 650 >= 4);
  assert.ok(spoken.lowerTravel > spoken.upperTravel);
  assert.ok(spoken.jawTravel / spoken.verticalTravel > 0.25);
  assert.ok(spoken.jawTravel / spoken.verticalTravel < 0.80);
});

test("Breite und gerundete Viseme erzeugen unterscheidbare Mundformen", async () => {
  const { speech } = await loadMotionProfile();
  const wide = speechMotionMetrics(
    { openness: 0.32, wideness: speech.wideMaximum, roundness: 0 },
    face,
    mouth,
    speech
  );
  const round = speechMotionMetrics(
    { openness: 0.32, wideness: 0, roundness: speech.roundMaximum },
    face,
    mouth,
    speech
  );

  assert.ok(wide.shapeScale > 1.08);
  assert.ok(round.shapeScale < 0.92);
  assert.ok(wide.shapeScale > round.shapeScale);
});

test("Glaettung reagiert schnell, loest weich und schnappt am Ende neutral", async () => {
  const { speech } = await loadMotionProfile();
  const attack = smoothSpeechMotion(
    { openness: 0, wideness: 0, roundness: 0 },
    { openness: 0.60, wideness: 0.30, roundness: 0 },
    16.67,
    speech
  );
  const release = smoothSpeechMotion(
    { openness: 0.60, wideness: 0.30, roundness: 0 },
    { openness: 0.30, wideness: 0.15, roundness: 0 },
    16.67,
    speech
  );
  const neutral = smoothSpeechMotion(
    release,
    { openness: 0.002, wideness: 0.001, roundness: 0 },
    16.67,
    speech
  );

  assert.ok(attack.openness > 0 && attack.openness < 0.60);
  assert.ok(0.60 - release.openness < attack.openness);
  assert.deepEqual(neutral, {
    openness: 0,
    wideness: 0,
    roundness: 0
  });
});

test("Unterkiefergewicht sitzt am Kinn und nicht im oberen Gesicht", () => {
  const aboveMouth = lowerFaceMotionWeight(
    { x: 0.50, y: 0.36 },
    face,
    mouth
  );
  const centerChin = lowerFaceMotionWeight(
    { x: 0.50, y: face.bottom },
    face,
    mouth
  );
  const sideChin = lowerFaceMotionWeight(
    { x: face.right, y: face.bottom },
    face,
    mouth
  );

  assert.equal(aboveMouth, 0);
  assert.equal(centerChin, 1);
  assert.ok(sideChin > 0.60 && sideChin < centerChin);
});

test("Unsichere Foto-Landmarks fallen zur lokalen Mundbewegung zurueck", () => {
  const leftEye = {
    left: 0.40,
    right: 0.46,
    top: 0.31,
    bottom: 0.34,
    width: 0.06,
    height: 0.03,
    centerX: 0.43,
    centerY: 0.325
  };
  const rightEye = {
    ...leftEye,
    left: 0.54,
    right: 0.60,
    centerX: 0.57
  };

  assert.equal(
    hasSafeFaceGeometry(face, mouth, leftEye, rightEye),
    true
  );
  assert.equal(
    hasSafeFaceGeometry(
      face,
      { ...mouth, centerY: 0.29, top: 0.27, bottom: 0.31 },
      leftEye,
      rightEye
    ),
    false
  );
  assert.equal(
    hasSafeFaceGeometry(
      face,
      { ...mouth, width: face.width * 0.9 },
      leftEye,
      rightEye
    ),
    false
  );
});

test("Lippennaht und Rundung folgen den erkannten Ober- und Unterlippen", () => {
  const points = [];
  points[78] = { x: 0.43, y: 0.42 };
  points[308] = { x: 0.57, y: 0.42 };
  points[13] = { x: 0.50, y: 0.425 };
  points[14] = { x: 0.50, y: 0.435 };

  const seam = normalizedLipSeam(points, mouth);
  assert.ok(Math.abs(seam.x - 0.50) < 0.000001);
  assert.ok(Math.abs(seam.y - 0.43) < 0.000001);
  assert.ok(Math.abs(normalizedLipCurve(points, mouth) - 0.25) < 0.000001);

  assert.deepEqual(normalizedLipSeam([], mouth), {
    x: mouth.centerX,
    y: mouth.centerY
  });
  assert.equal(normalizedLipCurve([], mouth), 0.16);

  points[13].y = 0.50;
  points[14].y = 0.50;
  assert.equal(normalizedLipCurve(points, mouth), 0.38);

  points[13].y = 0.30;
  points[14].y = 0.30;
  assert.equal(normalizedLipCurve(points, mouth), -0.10);
});

test("sichtbare Mundoeffnung folgt Lippennaht und aeusserer Lippenbewegung", async () => {
  const html = await readFile(
    new URL("../www/index.html", import.meta.url),
    "utf8"
  );
  const rig = await readFile(
    new URL("../www/full-face-rig.mjs", import.meta.url),
    "utf8"
  );
  const renderStart = html.indexOf("function renderNaturalMouth(");
  const renderEnd = html.indexOf("FREQUENZBAND", renderStart);
  const renderSource = html.slice(renderStart, renderEnd);
  const openingStart = html.indexOf("function renderVisibleMouthOpening(");
  const openingEnd = html.indexOf("function renderNaturalMouth(", openingStart);
  const openingSource = html.slice(openingStart, openingEnd);
  const geometryStart = html.indexOf("function updateMouthGeometry(");
  const geometryEnd = html.indexOf("function clearNaturalMouth(", geometryStart);
  const geometrySource = html.slice(geometryStart, geometryEnd);
  const textureWarp = renderSource.indexOf("for(\n    let y = warpStart;");
  const mouthInterior = renderSource.indexOf(
    "paintMouthInterior();",
    textureWarp
  );
  const edgeMask = renderSource.indexOf(
    'context.globalCompositeOperation =\n    "destination-in";',
    mouthInterior
  );
  const visibleTexture = renderSource.indexOf(
    "mouthCanvasContext.drawImage(",
    edgeMask
  );
  const visibleCavity = renderSource.indexOf(
    "const visibleCavityGradient =",
    visibleTexture
  );
  const visibleOpeningFill = renderSource.indexOf(
    "mouthCanvasContext.fill();",
    visibleCavity
  );
  const foregroundOpening = renderSource.indexOf(
    "renderVisibleMouthOpening("
  );
  const canvasAvailability = renderSource.indexOf(
    "!mouthCanvasContext",
    foregroundOpening
  );
  const detectedRig = renderSource.indexOf(
    "fullFaceRigReady",
    foregroundOpening
  );
  const hiddenStaticMouth = renderSource.indexOf(
    'mouthCanvas.style.display =\n      "none"',
    detectedRig
  );
  const detectedRigReturn = renderSource.indexOf(
    "return;",
    hiddenStaticMouth
  );

  assert.ok(textureWarp >= 0);
  assert.ok(mouthInterior > textureWarp);
  assert.ok(edgeMask > mouthInterior);
  assert.ok(visibleTexture > edgeMask);
  assert.ok(visibleCavity > visibleTexture);
  assert.ok(visibleOpeningFill > visibleCavity);
  assert.ok(foregroundOpening >= 0);
  assert.ok(detectedRig > foregroundOpening);
  assert.ok(hiddenStaticMouth > detectedRig);
  assert.ok(detectedRigReturn > hiddenStaticMouth);
  assert.ok(canvasAvailability > detectedRigReturn);
  assert.match(renderSource, /visibleCavityHeight\s*\*\s*0\.92/u);
  assert.match(renderSource, /mouthCanvasContext\.bezierCurveTo\(/u);
  assert.doesNotMatch(renderSource, /destination-out/u);
  assert.match(renderSource, /visibleToothGradient/u);
  assert.match(renderSource, /visibleTongueOpacity/u);
  assert.match(
    html,
    /<svg[\s\S]*?id="mouthOpening"[\s\S]*?<path id="mouthOpeningShape"><\/path>[\s\S]*?<\/svg>/u
  );
  assert.match(html, /#mouthCanvas\{[\s\S]*?z-index:10/u);
  assert.match(html, /#mouthOpening\{[\s\S]*?z-index:12/u);
  assert.match(
    openingSource,
    /mouthOpening\.style\.left\s*=\s*`\$\{[\s\S]*?canvasLeft[\s\S]*?visibleCavityWidth/u
  );
  assert.match(openingSource, /--mouth-teeth-opacity/u);
  assert.match(openingSource, /visibleCavityHeight[\s\S]*?0\.016/u);
  assert.match(openingSource, /imageDisplayHeight \* 0\.018/u);
  assert.match(openingSource, /mouthHeight \* 0\.36/u);
  assert.match(openingSource, /effectiveMouthWidth \* 0\.13/u);
  assert.match(openingSource, /wide \* 0\.30[\s\S]*?round \* 0\.10/u);
  assert.match(openingSource, /visibleCavityHeight \* 6\.2/u);
  assert.match(
    openingSource,
    /effectiveMouthWidth \* 0\.58,[\s\S]*?effectiveMouthWidth \* 0\.82/u
  );
  assert.match(openingSource, /mouthOpening\.style\.display\s*=\s*"block"/u);
  assert.match(openingSource, /LIP_SYNC_FACE\.curve/u);
  assert.match(openingSource, /lipCurve \*[\s\S]*?mouthHeight \/[\s\S]*?1\.45/u);
  assert.match(openingSource, /mouthOpeningShape\.setAttribute\([\s\S]*?"d"/u);
  assert.match(openingSource, /cornerUpperLocalY/u);
  assert.match(openingSource, /cavityCenterY -[\s\S]*?localOffsetY/u);
  assert.doesNotMatch(geometrySource, /!mouthCanvasContext/u);
  assert.doesNotMatch(geometrySource, /!lipMouthRenderContext/u);
  assert.doesNotMatch(html, /#mouthOpening\{[\s\S]*?clip-path:/u);
  assert.doesNotMatch(html, /#mouthOpening\{[\s\S]*?mask-image:/u);
  assert.match(renderSource, /featherMask/u);
  assert.match(renderSource, /open\s*-\s*0\.26/u);
  assert.match(html, /id="mouthOpeningCavityGradient"/u);
  assert.match(html, /stop-color="#704151" stop-opacity="\.58"/u);
  assert.match(html, /id="mouthOpeningTeeth"/u);
  assert.match(html, /id="mouthOpeningTongue"/u);
  assert.match(
    html,
    /fullFaceRig\?\.render\([\s\S]*?openness:visibleMouthOpen,[\s\S]*?localizedMouthOnly:true,[\s\S]*?cheekLift:0,[\s\S]*?mouthAsymmetry:0/u
  );
  assert.match(
    rig,
    /if \(!localizedMouthOnly\) \{[\s\S]*?this\.faceOvalIndices/u
  );
  assert.match(html, /\.\/full-face-rig\.mjs\?v=5/u);
});

test("Holos hoerbarer Android-Ausgang speist die Mundanalyse und eine sichtbare Mindestoeffnung", async () => {
  const html = await readFile(
    new URL("../www/index.html", import.meta.url),
    "utf8"
  );

  assert.match(
    html,
    /lipMediaElementSourceNode\.connect\(\s*lipAnalyser\s*\)/u
  );
  assert.match(
    html,
    /const outputSpeechShape\s*=\s*realtimeSpeechActive[\s\S]*?outputSpeechOpenShare/u
  );
  assert.match(
    html,
    /Math\.max\(\s*resolvedShape\.open,[\s\S]*?outputSpeechShape\?\.open[\s\S]*?outputSpeechOpenShare/u
  );
  assert.match(
    html,
    /ensureVisibleRealtimeMouth\([\s\S]*?Math\.max\([\s\S]*?0\.16,[\s\S]*?\* 0\.24/u
  );
  assert.match(
    html,
    /visibleKickShape[\s\S]*?Math\.max\([\s\S]*?visibleKickShape\.open,[\s\S]*?0\.12/u
  );
  assert.match(
    html,
    /Math\.pow\([\s\S]*?mouthRenderBaseOpen,[\s\S]*?0\.82[\s\S]*?\* 0\.82/u
  );
});
