import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  PublicFacePrivacyController,
  createFacePixelationPlan,
  faceBoundsFromLandmarks,
  pixelateFaceRegions,
  primaryFrontCameraFaceIndex
} from "../www/public-face-privacy.mjs";

const readText = path =>
  readFileSync(
    new URL(`../${path}`, import.meta.url),
    "utf8"
  );

function rectangleLandmarks({
  bottom,
  left,
  right,
  top
}) {
  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
    {
      x: (left + right) / 2,
      y: (top + bottom) / 2
    }
  ];
}

function createCanvasHarness(
  width = 640,
  height = 480
) {
  const contexts = [];

  const documentRef = {
    createElement(tagName) {
      assert.equal(tagName, "canvas");
      return createCanvas();
    }
  };

  function createContext() {
    const calls = [];
    const context = {
      calls,
      clearRect(...args) {
        calls.push(["clearRect", ...args]);
      },
      drawImage(...args) {
        calls.push(["drawImage", ...args]);
      },
      fillRect(...args) {
        calls.push(["fillRect", ...args]);
      },
      fillStyle: "",
      imageSmoothingEnabled: true,
      restore() {
        calls.push(["restore"]);
      },
      save() {
        calls.push(["save"]);
      }
    };
    contexts.push(context);
    return context;
  }

  function createCanvas() {
    const context = createContext();
    return {
      height,
      ownerDocument: documentRef,
      width,
      getContext() {
        return context;
      },
      toDataURL() {
        return "data:image/jpeg;base64,PROTECTED";
      }
    };
  }

  return {
    canvas: createCanvas(),
    contexts,
    documentRef
  };
}

test(
  "Gesichtsrahmen erhalten einen großzügigen Schutzrand und bleiben im Bild",
  () => {
    const box = faceBoundsFromLandmarks(
      rectangleLandmarks({
        bottom: 0.60,
        left: 0.40,
        right: 0.60,
        top: 0.30
      }),
      1000,
      800
    );

    assert.ok(box.x < 400);
    assert.ok(box.y < 240);
    assert.ok(box.x + box.width > 600);
    assert.ok(box.y + box.height > 480);
    assert.ok(box.x >= 0);
    assert.ok(box.y >= 0);
    assert.ok(box.x + box.width <= 1000);
    assert.ok(box.y + box.height <= 800);
  }
);

test(
  "Rückkamera verpixelt jedes erkannte Gesicht ohne Identitätsausnahme",
  () => {
    const plan = createFacePixelationPlan(
      [
        rectangleLandmarks({
          bottom: 0.52,
          left: 0.12,
          right: 0.28,
          top: 0.22
        }),
        rectangleLandmarks({
          bottom: 0.66,
          left: 0.43,
          right: 0.64,
          top: 0.28
        })
      ],
      {
        facingMode: "environment",
        frameHeight: 720,
        frameWidth: 1280
      }
    );

    assert.equal(plan.detectedFaceCount, 2);
    assert.equal(plan.pixelatedBoxes.length, 2);
    assert.equal(plan.preservedPrimaryFace, false);
  }
);

test(
  "Frontkamera lässt höchstens die große zentrale Kameranutzerin sichtbar",
  () => {
    const landmarks = [
      rectangleLandmarks({
        bottom: 0.68,
        left: 0.36,
        right: 0.64,
        top: 0.20
      }),
      rectangleLandmarks({
        bottom: 0.48,
        left: 0.74,
        right: 0.88,
        top: 0.24
      })
    ];
    const boxes = landmarks.map(face =>
      faceBoundsFromLandmarks(face, 1080, 1920)
    );

    assert.equal(
      primaryFrontCameraFaceIndex(
        boxes,
        1080,
        1920
      ),
      0
    );

    const plan = createFacePixelationPlan(
      landmarks,
      {
        facingMode: "user",
        frameHeight: 1920,
        frameWidth: 1080
      }
    );

    assert.equal(plan.detectedFaceCount, 2);
    assert.equal(plan.pixelatedBoxes.length, 1);
    assert.equal(plan.preservedPrimaryFace, true);
  }
);

test(
  "ohne klar zentrales Frontgesicht werden vorsorglich alle Gesichter verpixelt",
  () => {
    const plan = createFacePixelationPlan(
      [
        rectangleLandmarks({
          bottom: 0.48,
          left: 0.01,
          right: 0.12,
          top: 0.25
        })
      ],
      {
        facingMode: "user",
        frameHeight: 1920,
        frameWidth: 1080
      }
    );

    assert.equal(plan.pixelatedBoxes.length, 1);
    assert.equal(plan.preservedPrimaryFace, false);
  }
);

test(
  "Mosaikfilter verwirft Details mit groben Pixelblöcken",
  () => {
    const harness = createCanvasHarness();
    const count = pixelateFaceRegions(
      harness.canvas,
      [{
        height: 180,
        width: 150,
        x: 100,
        y: 80
      }],
      {
        documentRef: harness.documentRef
      }
    );

    assert.equal(count, 1);
    assert.ok(
      harness.contexts.some(context =>
        context.calls.some(call =>
          call[0] === "fillRect" &&
          call[1] === 100 &&
          call[2] === 80
        )
      )
    );
    assert.ok(
      harness.contexts.some(context =>
        context.imageSmoothingEnabled === false
      )
    );
  }
);

test(
  "Filterfehler bleiben geschlossen und geben kein ungeschütztes Ergebnis frei",
  async () => {
    const originalConsoleError =
      console.error;
    const controller =
      new PublicFacePrivacyController({
        createLandmarker: async () => {
          throw new Error("Modellfehler");
        }
      });

    console.error = () => {};

    try {
      await assert.rejects(
        controller.ensureReady(),
        error =>
          error?.code ===
            "PUBLIC_FACE_PRIVACY_UNAVAILABLE"
      );
      assert.equal(controller.ready, false);
    } finally {
      console.error = originalConsoleError;
    }
  }
);

test(
  "App verdrahtet Draußen-Schutz vor Foto-, Video- und Live-Übertragung",
  () => {
    const html = readText("www/index.html");
    const server = readText("server.mjs");
    const privacy = readText(
      "www/public-face-privacy.mjs"
    );

    assert.match(
      html,
      /id="liveCameraPublicPrivacyToggle"[\s\S]*?checked/u
    );
    assert.match(
      html,
      /await ensureLiveCameraPublicPrivacy\(\)[\s\S]*?requestLiveCameraStream\(\)/u
    );
    assert.match(
      html,
      /privacy\.protectCanvas\([\s\S]*?canvas[\s\S]*?canvas\.toDataURL/u
    );
    assert.match(
      html,
      /sourceInput ===[\s\S]*?imageInput/u
    );
    assert.match(
      html,
      /privacy\.protectDataUrls\([\s\S]*?preparedVideoFrames/u
    );
    assert.match(
      html,
      /videoFramesToSend\.length[\s\S]*?publicMediaPrivacyToSend[\s\S]*?Originalvideo und Tonspur bleiben auf diesem Handy/u
    );
    assert.match(
      server,
      /publicFacePrivacyApplied[\s\S]*?Versuche niemals, eine verpixelte Person zu identifizieren/u
    );
    assert.match(
      server,
      /Draußen-Schutz darf keine übertragene Tonspur enthalten/u
    );
    assert.doesNotMatch(
      privacy,
      /\bfetch\s*\(|XMLHttpRequest|localStorage|indexedDB|ownerSelfReferenceImage/u
    );
    assert.match(
      privacy,
      /\.\/mediapipe\/face_landmarker\.task/u
    );
  }
);
