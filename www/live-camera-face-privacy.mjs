const DEFAULT_MAXIMUM_FACES = 8;
const DEFAULT_PADDING_RATIO = 0.30;
const DEFAULT_PIXEL_BLOCK_SIZE = 28;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value) || 0));
}

function finiteCoordinate(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function facePixelationRegions(
  faceLandmarks,
  width,
  height,
  {
    paddingRatio = DEFAULT_PADDING_RATIO,
    minimumSizePixels = 24
  } = {}
) {
  const canvasWidth = Math.max(1, Math.floor(Number(width) || 0));
  const canvasHeight = Math.max(1, Math.floor(Number(height) || 0));
  const safePadding = clamp(paddingRatio, 0.08, 0.55);
  const safeMinimumSize = Math.max(
    8,
    Math.floor(Number(minimumSizePixels) || 24)
  );

  if (!Array.isArray(faceLandmarks)) return [];

  return faceLandmarks.flatMap((landmarks) => {
    if (!Array.isArray(landmarks) || landmarks.length < 8) return [];

    const points = landmarks.flatMap((landmark) => {
      const x = finiteCoordinate(landmark?.x);
      const y = finiteCoordinate(landmark?.y);
      return x === null || y === null ? [] : [{ x, y }];
    });

    if (points.length < 8) return [];

    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minimumX = clamp(Math.min(...xs), 0, 1);
    const maximumX = clamp(Math.max(...xs), 0, 1);
    const minimumY = clamp(Math.min(...ys), 0, 1);
    const maximumY = clamp(Math.max(...ys), 0, 1);
    const detectedWidth =
      (maximumX - minimumX) * canvasWidth;
    const detectedHeight =
      (maximumY - minimumY) * canvasHeight;
    const rawWidth = Math.max(
      safeMinimumSize,
      detectedWidth
    );
    const rawHeight = Math.max(
      safeMinimumSize,
      detectedHeight
    );
    const centerX = ((minimumX + maximumX) / 2) * canvasWidth;
    const centerY = ((minimumY + maximumY) / 2) * canvasHeight;
    const horizontalPadding = rawWidth * safePadding;
    const topPadding = rawHeight * (safePadding + 0.12);
    const bottomPadding = rawHeight * safePadding;
    const left = clamp(
      centerX - rawWidth / 2 - horizontalPadding,
      0,
      canvasWidth
    );
    const top = clamp(
      centerY - rawHeight / 2 - topPadding,
      0,
      canvasHeight
    );
    const right = clamp(
      centerX + rawWidth / 2 + horizontalPadding,
      0,
      canvasWidth
    );
    const bottom = clamp(
      centerY + rawHeight / 2 + bottomPadding,
      0,
      canvasHeight
    );

    if (right <= left || bottom <= top) return [];

    return [{
      x: Math.floor(left),
      y: Math.floor(top),
      width: Math.max(1, Math.ceil(right - left)),
      height: Math.max(1, Math.ceil(bottom - top))
    }];
  });
}

export function pixelateFaceRegions(
  canvas,
  regions,
  {
    blockSizePixels = DEFAULT_PIXEL_BLOCK_SIZE,
    createCanvas = () => canvas?.ownerDocument?.createElement("canvas")
  } = {}
) {
  const context = canvas?.getContext?.("2d");
  const safeRegions = Array.isArray(regions) ? regions : [];

  if (!context || safeRegions.length === 0) return 0;

  const pixelCanvas = createCanvas();
  const pixelContext = pixelCanvas?.getContext?.("2d", { alpha: false });

  if (!pixelCanvas || !pixelContext) {
    throw new Error("Lokale Gesichtsverpixelung ist nicht verfügbar.");
  }

  const blockSize = Math.max(
    10,
    Math.floor(Number(blockSizePixels) || DEFAULT_PIXEL_BLOCK_SIZE)
  );

  for (const region of safeRegions) {
    const x = Math.max(0, Math.floor(Number(region?.x) || 0));
    const y = Math.max(0, Math.floor(Number(region?.y) || 0));
    const width = Math.max(1, Math.floor(Number(region?.width) || 0));
    const height = Math.max(1, Math.floor(Number(region?.height) || 0));
    const sampleWidth = Math.max(3, Math.ceil(width / blockSize));
    const sampleHeight = Math.max(3, Math.ceil(height / blockSize));

    pixelCanvas.width = sampleWidth;
    pixelCanvas.height = sampleHeight;
    pixelContext.imageSmoothingEnabled = true;
    pixelContext.clearRect(0, 0, sampleWidth, sampleHeight);
    pixelContext.drawImage(
      canvas,
      x,
      y,
      width,
      height,
      0,
      0,
      sampleWidth,
      sampleHeight
    );

    context.save();
    context.imageSmoothingEnabled = false;
    context.drawImage(
      pixelCanvas,
      0,
      0,
      sampleWidth,
      sampleHeight,
      x,
      y,
      width,
      height
    );
    context.restore();
  }

  return safeRegions.length;
}

export class PamHoloLiveCameraFacePrivacy {
  constructor({ maximumFaces = DEFAULT_MAXIMUM_FACES } = {}) {
    this.maximumFaces = Math.max(
      1,
      Math.min(12, Math.floor(Number(maximumFaces) || DEFAULT_MAXIMUM_FACES))
    );
    this.landmarker = null;
    this.initializationPromise = null;
    this.failed = false;
  }

  async initialize() {
    if (this.landmarker) return this;
    if (this.failed) {
      throw new Error("Lokaler Gesichtsschutz ist nicht verfügbar.");
    }
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      try {
        const {
          FaceLandmarker,
          FilesetResolver
        } = await import("./mediapipe/vision_bundle.mjs");
        const wasmRoot = new URL("./mediapipe/wasm", import.meta.url).href;
        const modelPath = new URL(
          "./mediapipe/face_landmarker.task",
          import.meta.url
        ).href;
        const vision = await FilesetResolver.forVisionTasks(wasmRoot);

        this.landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "CPU"
          },
          runningMode: "IMAGE",
          numFaces: this.maximumFaces,
          minFaceDetectionConfidence: 0.40,
          minFacePresenceConfidence: 0.40,
          minTrackingConfidence: 0.40,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false
        });

        return this;
      } catch (error) {
        this.failed = true;
        this.landmarker = null;
        throw new Error(
          "Der lokale Gesichtsschutz konnte nicht geladen werden.",
          { cause: error }
        );
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  async protectCanvas(canvas) {
    await this.initialize();

    if (!canvas?.width || !canvas?.height || !this.landmarker) {
      throw new Error("Der lokale Gesichtsschutz ist nicht einsatzbereit.");
    }

    let detection;
    try {
      detection = this.landmarker.detect(canvas);
    } catch (error) {
      throw new Error(
        "Gesichter konnten nicht sicher lokal geprüft werden.",
        { cause: error }
      );
    }

    const regions = facePixelationRegions(
      detection?.faceLandmarks,
      canvas.width,
      canvas.height
    );
    const faceCount = pixelateFaceRegions(canvas, regions);

    return Object.freeze({
      protected: true,
      faceCount
    });
  }
}

export function createPamHoloLiveCameraFacePrivacy(options) {
  return new PamHoloLiveCameraFacePrivacy(options);
}
