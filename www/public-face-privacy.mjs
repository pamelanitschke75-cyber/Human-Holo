import {
  FaceLandmarker,
  FilesetResolver
} from "./mediapipe/vision_bundle.mjs";

const MAX_DETECTED_FACES = 10;
const MIN_PRIMARY_FACE_AREA_RATIO = 0.018;

export class PublicFacePrivacyUnavailableError extends Error {
  constructor(message = "Der lokale Gesichtsschutz ist gerade nicht verfügbar.") {
    super(message);
    this.name = "PublicFacePrivacyUnavailableError";
    this.code = "PUBLIC_FACE_PRIVACY_UNAVAILABLE";
  }
}

function clamp(value, minimum, maximum) {
  return Math.min(
    maximum,
    Math.max(minimum, Number(value) || 0)
  );
}

function positiveDimension(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? number
    : 0;
}

export function faceBoundsFromLandmarks(
  landmarks,
  frameWidth,
  frameHeight
) {
  const width = positiveDimension(frameWidth);
  const height = positiveDimension(frameHeight);
  const points = Array.isArray(landmarks)
    ? landmarks.filter(point =>
        Number.isFinite(Number(point?.x)) &&
        Number.isFinite(Number(point?.y))
      )
    : [];

  if (!width || !height || points.length < 3) {
    return null;
  }

  const normalizedLeft = Math.min(
    ...points.map(point => clamp(point.x, 0, 1))
  );
  const normalizedRight = Math.max(
    ...points.map(point => clamp(point.x, 0, 1))
  );
  const normalizedTop = Math.min(
    ...points.map(point => clamp(point.y, 0, 1))
  );
  const normalizedBottom = Math.max(
    ...points.map(point => clamp(point.y, 0, 1))
  );

  const detectedWidth =
    (normalizedRight - normalizedLeft) * width;
  const detectedHeight =
    (normalizedBottom - normalizedTop) * height;

  if (detectedWidth < 2 || detectedHeight < 2) {
    return null;
  }

  // Die MediaPipe-Punkte enden nah an der Gesichtskontur. Der zusätzliche
  // Rand schützt auch Stirn, Kinn, Ohren und seitliche Konturen.
  const horizontalPadding = detectedWidth * 0.34;
  const topPadding = detectedHeight * 0.42;
  const bottomPadding = detectedHeight * 0.30;
  const left = clamp(
    normalizedLeft * width - horizontalPadding,
    0,
    width
  );
  const top = clamp(
    normalizedTop * height - topPadding,
    0,
    height
  );
  const right = clamp(
    normalizedRight * width + horizontalPadding,
    0,
    width
  );
  const bottom = clamp(
    normalizedBottom * height + bottomPadding,
    0,
    height
  );

  return Object.freeze({
    x: Math.floor(left),
    y: Math.floor(top),
    width: Math.max(1, Math.ceil(right - left)),
    height: Math.max(1, Math.ceil(bottom - top))
  });
}

export function primaryFrontCameraFaceIndex(
  boxes,
  frameWidth,
  frameHeight
) {
  const width = positiveDimension(frameWidth);
  const height = positiveDimension(frameHeight);
  const frameArea = width * height;

  if (!Array.isArray(boxes) || !frameArea) {
    return -1;
  }

  let selectedIndex = -1;
  let selectedScore = -Infinity;

  boxes.forEach((box, index) => {
    const boxWidth = positiveDimension(box?.width);
    const boxHeight = positiveDimension(box?.height);
    const areaRatio =
      (boxWidth * boxHeight) / frameArea;
    const centerX =
      (Number(box?.x) + boxWidth / 2) / width;
    const centerY =
      (Number(box?.y) + boxHeight / 2) / height;

    // Nur ein deutlich sichtbares, zentral gerahmtes Gesicht darf als die
    // Person gelten, die gerade selbst die Frontkamera hält. Das ist keine
    // Identifizierung und verwendet kein Referenzbild.
    if (
      areaRatio < MIN_PRIMARY_FACE_AREA_RATIO ||
      centerX < 0.24 ||
      centerX > 0.76 ||
      centerY < 0.16 ||
      centerY > 0.84
    ) {
      return;
    }

    const centerDistance = Math.hypot(
      centerX - 0.5,
      centerY - 0.48
    );
    const score =
      areaRatio * 5 - centerDistance;

    if (score > selectedScore) {
      selectedIndex = index;
      selectedScore = score;
    }
  });

  return selectedIndex;
}

export function createFacePixelationPlan(
  faceLandmarks,
  {
    facingMode = "environment",
    frameHeight,
    frameWidth,
    preservePrimaryFrontCameraFace = true
  } = {}
) {
  const boxes = (Array.isArray(faceLandmarks)
    ? faceLandmarks
    : [])
    .map(landmarks =>
      faceBoundsFromLandmarks(
        landmarks,
        frameWidth,
        frameHeight
      )
    )
    .filter(Boolean);

  const primaryIndex =
    facingMode === "user" &&
    preservePrimaryFrontCameraFace
      ? primaryFrontCameraFaceIndex(
          boxes,
          frameWidth,
          frameHeight
        )
      : -1;

  return Object.freeze({
    detectedFaceCount: boxes.length,
    pixelatedBoxes: Object.freeze(
      boxes.filter((_, index) => index !== primaryIndex)
    ),
    preservedPrimaryFace:
      primaryIndex >= 0
  });
}

export function pixelateFaceRegions(
  canvas,
  boxes,
  {
    documentRef =
      canvas?.ownerDocument ||
      globalThis.document
  } = {}
) {
  const context =
    canvas?.getContext?.("2d", {
      alpha: false,
      desynchronized: true
    });

  if (!context || !documentRef?.createElement) {
    throw new PublicFacePrivacyUnavailableError(
      "Der lokale Bildfilter konnte nicht geöffnet werden."
    );
  }

  if (!Array.isArray(boxes) || boxes.length === 0) {
    return 0;
  }

  const snapshot = documentRef.createElement("canvas");
  snapshot.width = canvas.width;
  snapshot.height = canvas.height;

  const snapshotContext =
    snapshot.getContext("2d", { alpha: false });

  if (!snapshotContext) {
    throw new PublicFacePrivacyUnavailableError(
      "Der lokale Bildfilter konnte nicht vorbereitet werden."
    );
  }

  snapshotContext.drawImage(canvas, 0, 0);

  for (const box of boxes) {
    const sourceX = clamp(
      Math.floor(Number(box?.x) || 0),
      0,
      canvas.width
    );
    const sourceY = clamp(
      Math.floor(Number(box?.y) || 0),
      0,
      canvas.height
    );
    const sourceWidth = clamp(
      Math.ceil(Number(box?.width) || 0),
      1,
      canvas.width - sourceX
    );
    const sourceHeight = clamp(
      Math.ceil(Number(box?.height) || 0),
      1,
      canvas.height - sourceY
    );
    const mosaic = documentRef.createElement("canvas");

    // Höchstens 9 × 9 grobe Mosaikfelder: Die Details werden nicht nur
    // weichgezeichnet, sondern vor dem erneuten Vergrößern wirklich verworfen.
    mosaic.width = Math.max(
      4,
      Math.min(9, Math.round(sourceWidth / 26))
    );
    mosaic.height = Math.max(
      4,
      Math.min(9, Math.round(sourceHeight / 26))
    );

    const mosaicContext =
      mosaic.getContext("2d", { alpha: false });

    if (!mosaicContext) {
      throw new PublicFacePrivacyUnavailableError(
        "Ein Gesicht konnte nicht sicher verpixelt werden."
      );
    }

    mosaicContext.imageSmoothingEnabled = false;
    mosaicContext.drawImage(
      snapshot,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      mosaic.width,
      mosaic.height
    );

    context.save();
    context.imageSmoothingEnabled = false;
    context.drawImage(
      mosaic,
      0,
      0,
      mosaic.width,
      mosaic.height,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight
    );
    context.fillStyle = "rgba(8, 8, 24, 0.16)";
    context.fillRect(
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight
    );
    context.restore();

    mosaicContext.clearRect(
      0,
      0,
      mosaic.width,
      mosaic.height
    );
  }

  snapshotContext.clearRect(
    0,
    0,
    snapshot.width,
    snapshot.height
  );

  return boxes.length;
}

function waitForImage(image) {
  return new Promise((resolve, reject) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener(
      "error",
      () => reject(
        new PublicFacePrivacyUnavailableError(
          "Das Bild konnte für den lokalen Gesichtsschutz nicht gelesen werden."
        )
      ),
      { once: true }
    );
  });
}

export class PublicFacePrivacyController {
  constructor({
    createLandmarker = null,
    documentRef = globalThis.document
  } = {}) {
    this.createLandmarker = createLandmarker;
    this.documentRef = documentRef;
    this.initialization = null;
    this.landmarker = null;
    this.lastTimestamp = 0;
  }

  get ready() {
    return Boolean(this.landmarker);
  }

  async ensureReady() {
    if (this.landmarker) {
      return true;
    }

    if (this.initialization) {
      return this.initialization;
    }

    this.initialization = (async () => {
      if (typeof this.createLandmarker === "function") {
        this.landmarker =
          await this.createLandmarker();
        return true;
      }

      const wasmRoot =
        new URL("./mediapipe/wasm", import.meta.url).href;
      const modelPath =
        new URL(
          "./mediapipe/face_landmarker.task",
          import.meta.url
        ).href;
      const vision =
        await FilesetResolver.forVisionTasks(wasmRoot);

      this.landmarker =
        await FaceLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              delegate: "CPU",
              modelAssetPath: modelPath
            },
            minFaceDetectionConfidence: 0.58,
            minFacePresenceConfidence: 0.58,
            minTrackingConfidence: 0.55,
            numFaces: MAX_DETECTED_FACES,
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
            runningMode: "VIDEO"
          }
        );

      return true;
    })()
      .catch(error => {
        this.landmarker = null;
        console.error(
          "Lokaler Außenraum-Gesichtsschutz:",
          error
        );
        throw new PublicFacePrivacyUnavailableError();
      })
      .finally(() => {
        this.initialization = null;
      });

    return this.initialization;
  }

  nextTimestamp() {
    const clock =
      Number(globalThis.performance?.now?.()) ||
      Date.now();
    this.lastTimestamp = Math.max(
      this.lastTimestamp + 1,
      Math.ceil(clock)
    );
    return this.lastTimestamp;
  }

  protectCanvas(
    canvas,
    {
      facingMode = "environment",
      preservePrimaryFrontCameraFace = true
    } = {}
  ) {
    if (!this.landmarker) {
      throw new PublicFacePrivacyUnavailableError();
    }

    const width = positiveDimension(canvas?.width);
    const height = positiveDimension(canvas?.height);

    if (!width || !height) {
      throw new PublicFacePrivacyUnavailableError(
        "Das Kamerabild hat keine gültige Größe."
      );
    }

    let result;

    try {
      result = this.landmarker.detectForVideo(
        canvas,
        this.nextTimestamp()
      );
    } catch (error) {
      console.error(
        "Lokale Gesichtserkennung zur Verpixelung:",
        error
      );
      throw new PublicFacePrivacyUnavailableError();
    }

    const plan = createFacePixelationPlan(
      result?.faceLandmarks,
      {
        facingMode,
        frameHeight: height,
        frameWidth: width,
        preservePrimaryFrontCameraFace
      }
    );
    const pixelatedFaceCount =
      pixelateFaceRegions(
        canvas,
        plan.pixelatedBoxes,
        {
          documentRef: this.documentRef
        }
      );

    return Object.freeze({
      detectedFaceCount:
        plan.detectedFaceCount,
      pixelatedFaceCount,
      preservedPrimaryFace:
        plan.preservedPrimaryFace,
      protected: true
    });
  }

  async protectDataUrl(
    dataUrl,
    options = {}
  ) {
    await this.ensureReady();

    if (!this.documentRef?.createElement) {
      throw new PublicFacePrivacyUnavailableError();
    }

    const image =
      this.documentRef.createElement("img");
    const imageReady = waitForImage(image);
    image.decoding = "async";
    image.src = String(dataUrl || "");
    await imageReady;

    const width =
      positiveDimension(image.naturalWidth) ||
      positiveDimension(image.width);
    const height =
      positiveDimension(image.naturalHeight) ||
      positiveDimension(image.height);
    const canvas =
      this.documentRef.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context =
      canvas.getContext("2d", { alpha: false });

    if (!context) {
      throw new PublicFacePrivacyUnavailableError();
    }

    context.fillStyle = "#000000";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    try {
      const protection =
        this.protectCanvas(canvas, options);
      const protectedDataUrl =
        canvas.toDataURL("image/jpeg", 0.84);

      return Object.freeze({
        ...protection,
        dataUrl: protectedDataUrl
      });
    } finally {
      context.clearRect(0, 0, width, height);
      image.removeAttribute("src");
    }
  }

  async protectDataUrls(
    dataUrls,
    options = {}
  ) {
    await this.ensureReady();

    const protectedDataUrls = [];
    let detectedFaceCount = 0;
    let pixelatedFaceCount = 0;

    for (const dataUrl of dataUrls || []) {
      const result =
        await this.protectDataUrl(
          dataUrl,
          options
        );
      protectedDataUrls.push(result.dataUrl);
      detectedFaceCount +=
        result.detectedFaceCount;
      pixelatedFaceCount +=
        result.pixelatedFaceCount;
    }

    return Object.freeze({
      dataUrls: Object.freeze(protectedDataUrls),
      detectedFaceCount,
      pixelatedFaceCount,
      protected: true
    });
  }
}

const publicFacePrivacy =
  new PublicFacePrivacyController();

if (typeof window !== "undefined") {
  Object.defineProperty(
    window,
    "HumanHoloPublicFacePrivacy",
    {
      configurable: false,
      enumerable: false,
      value: publicFacePrivacy,
      writable: false
    }
  );
}

export default publicFacePrivacy;
