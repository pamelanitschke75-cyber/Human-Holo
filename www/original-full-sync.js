(function installOriginalFullSync(globalScope){
  "use strict";

  const NUMBER_KEYS = Object.freeze([
    "bodyBreathCycleMs",
    "bodyBreathLift",
    "bodyBreathScale",
    "bodySpeechLift",
    "bodySway",
    "bodyRotateDegrees",
    "headSway",
    "headNod",
    "headTiltRadians",
    "browLift",
    "eyeNarrow",
    "cheekLift",
    "mouthAsymmetry",
    "hairFollow",
    "hairSway",
    "hairLift",
    "hairRotateDegrees",
    "motionResponseMs",
    "hairResponseMs",
    "bodyOverlayOpacity",
    "hairOverlayOpacity",
    "idleActivity"
  ]);

  const DEFAULT_PROFILE = Object.freeze({
    enabled:true,
    identityScope:"pam-sol",
    bodyBreathCycleMs:4700,
    bodyBreathLift:0.0022,
    bodyBreathScale:0.0028,
    bodySpeechLift:0.0012,
    bodySway:0.0016,
    bodyRotateDegrees:0.10,
    headSway:0.0022,
    headNod:0.0015,
    headTiltRadians:0.0024,
    browLift:0.12,
    eyeNarrow:0.08,
    cheekLift:0.10,
    mouthAsymmetry:0.035,
    hairFollow:0.78,
    hairSway:0.0030,
    hairLift:0.0015,
    hairRotateDegrees:0.16,
    motionResponseMs:90,
    hairResponseMs:170,
    bodyOverlayOpacity:0.36,
    hairOverlayOpacity:0.52,
    idleActivity:0.035
  });

  const FRAME_KEYS = Object.freeze([
    "activity",
    "bodyX",
    "bodyY",
    "bodyRotate",
    "bodyScaleX",
    "bodyScaleY",
    "torsoX",
    "torsoY",
    "torsoRotate",
    "torsoScaleX",
    "torsoScaleY",
    "hairX",
    "hairY",
    "hairRotate",
    "headX",
    "headY",
    "headTilt",
    "browLift",
    "eyeNarrow",
    "cheekLift",
    "mouthAsymmetry"
  ]);

  const NEUTRAL_FRAME = Object.freeze({
    activity:0,
    bodyX:0,
    bodyY:0,
    bodyRotate:0,
    bodyScaleX:1,
    bodyScaleY:1,
    torsoX:0,
    torsoY:0,
    torsoRotate:0,
    torsoScaleX:1,
    torsoScaleY:1,
    hairX:0,
    hairY:0,
    hairRotate:0,
    headX:0,
    headY:0,
    headTilt:0,
    browLift:0,
    eyeNarrow:0,
    cheekLift:0,
    mouthAsymmetry:0
  });

  function clamp(value, minimum, maximum){
    return Math.min(maximum, Math.max(minimum, Number(value) || 0));
  }

  function finiteNumber(value, fallback){
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeProfile(value){
    const source = value && typeof value === "object" ? value : {};
    const profile = {
      ...DEFAULT_PROFILE,
      enabled:source.enabled !== false,
      identityScope:String(
        source.identityScope || DEFAULT_PROFILE.identityScope
      )
    };

    for(const key of NUMBER_KEYS){
      profile[key] = finiteNumber(source[key], DEFAULT_PROFILE[key]);
    }

    profile.bodyBreathCycleMs = clamp(
      profile.bodyBreathCycleMs,
      2200,
      9000
    );
    profile.motionResponseMs = clamp(profile.motionResponseMs, 35, 360);
    profile.hairResponseMs = clamp(profile.hairResponseMs, 80, 520);
    profile.hairFollow = clamp(profile.hairFollow, 0, 1.4);
    profile.bodyOverlayOpacity = clamp(profile.bodyOverlayOpacity, 0, 0.75);
    profile.hairOverlayOpacity = clamp(profile.hairOverlayOpacity, 0, 0.82);
    profile.idleActivity = clamp(profile.idleActivity, 0, 0.16);
    return profile;
  }

  function normalizeGeometry(value){
    const face = value?.face;
    if(!face){
      return null;
    }

    const geometry = {};
    for(const key of [
      "left",
      "top",
      "right",
      "bottom",
      "width",
      "height",
      "centerX",
      "centerY"
    ]){
      geometry[key] = Number(face[key]);
    }

    if(
      !Object.values(geometry).every(Number.isFinite) ||
      geometry.width < 0.12 ||
      geometry.height < 0.12 ||
      geometry.centerX <= 0 ||
      geometry.centerX >= 1 ||
      geometry.centerY <= 0 ||
      geometry.centerY >= 1
    ){
      return null;
    }

    return geometry;
  }

  function calculateFrame(input, profileValue){
    const profile = normalizeProfile(profileValue);
    const timestamp = Math.max(0, finiteNumber(input?.timestamp, 0));
    const seconds = timestamp / 1000;
    const openness = clamp(input?.openness, 0, 1);
    const wideness = clamp(input?.wideness, 0, 1);
    const roundness = clamp(input?.roundness, 0, 1);
    const rms = clamp(input?.rms, 0, 1);
    const spectralActivity = clamp(
      Math.max(input?.low || 0, input?.middle || 0, input?.high || 0),
      0,
      1
    );
    const speechActivity = clamp(
      Math.max(
        openness / 0.62,
        wideness / 0.52 * 0.72,
        roundness / 0.50 * 0.72,
        rms * 8.5,
        spectralActivity * 0.92,
        input?.speaking ? 0.10 : 0
      ),
      0,
      1
    );
    const activity = Math.max(profile.idleActivity, speechActivity);
    const breathPhase =
      timestamp / profile.bodyBreathCycleMs * Math.PI * 2;
    const breath = 0.5 + 0.5 * Math.sin(breathPhase - Math.PI / 2);
    const phrase = Math.sin(seconds * 3.15 + Math.sin(seconds * 0.71) * 0.48);
    const syllable = Math.sin(seconds * 8.70 + roundness * 1.40);
    const asymmetryWave = Math.sin(seconds * 4.35 + wideness * 1.80);
    const speechWeight = Math.pow(speechActivity, 0.74);

    const bodyX =
      profile.bodySway *
      (0.20 + activity * 0.80) *
      Math.sin(seconds * 0.82 + 0.35);
    const bodyY =
      -profile.bodyBreathLift * breath -
      profile.bodySpeechLift * speechWeight * (0.55 + 0.45 * syllable);
    const bodyRotate =
      profile.bodyRotateDegrees *
      (0.22 + activity * 0.78) *
      Math.sin(seconds * 0.68 + 0.58);
    const headX =
      profile.headSway * speechWeight * phrase;
    const headY =
      profile.headNod * speechWeight *
      (0.48 + 0.52 * Math.sin(seconds * 5.55 + 0.90));
    const headTilt =
      profile.headTiltRadians * speechWeight *
      Math.sin(seconds * 2.28 + 0.42);

    return {
      activity,
      bodyX,
      bodyY,
      bodyRotate,
      bodyScaleX:1 - breath * profile.bodyBreathScale * 0.22,
      bodyScaleY:1 + breath * profile.bodyBreathScale,
      torsoX:bodyX * 0.34 - headX * 0.18,
      torsoY:-profile.bodyBreathLift * breath * 0.62,
      torsoRotate:-bodyRotate * 0.24,
      torsoScaleX:1 + breath * profile.bodyBreathScale * 0.38,
      torsoScaleY:1 + breath * profile.bodyBreathScale * 0.82,
      hairX:
        headX * profile.hairFollow +
        profile.hairSway * speechWeight * Math.sin(seconds * 1.34 + 1.10),
      hairY:
        -profile.hairLift *
        (breath * 0.28 + speechWeight * (0.45 + 0.55 * syllable)),
      hairRotate:
        bodyRotate * profile.hairFollow +
        profile.hairRotateDegrees * speechWeight *
        Math.sin(seconds * 1.16 + 1.72),
      headX,
      headY,
      headTilt,
      browLift:
        profile.browLift * speechWeight *
        clamp(0.28 + openness * 0.72 + Math.max(0, phrase) * 0.20, 0, 1),
      eyeNarrow:
        profile.eyeNarrow * speechWeight *
        clamp(wideness * 0.58 + Math.max(0, -phrase) * 0.30, 0, 1),
      cheekLift:
        profile.cheekLift * speechWeight *
        clamp(wideness * 1.25 + openness * 0.22, 0, 1),
      mouthAsymmetry:
        profile.mouthAsymmetry * speechWeight * asymmetryWave
    };
  }

  function smoothFrame(currentValue, targetValue, elapsedMs, responseMs){
    const current = currentValue || NEUTRAL_FRAME;
    const target = targetValue || NEUTRAL_FRAME;
    const elapsed = clamp(elapsedMs, 8, 80);
    const amount = 1 - Math.exp(-elapsed / Math.max(1, responseMs));
    const next = {};

    for(const key of FRAME_KEYS){
      const fallback = key.startsWith("bodyScale") ||
        key.startsWith("torsoScale") ? 1 : 0;
      const from = finiteNumber(current[key], fallback);
      const to = finiteNumber(target[key], fallback);
      next[key] = from + (to - from) * amount;
    }

    return next;
  }

  function createMotionLayer(baseImage, className){
    const layer = baseImage.cloneNode(false);
    layer.removeAttribute("id");
    layer.alt = "";
    layer.setAttribute("aria-hidden", "true");
    layer.className = `originalFullSyncLayer ${className}`;
    layer.draggable = false;
    layer.removeAttribute("usemap");
    return layer;
  }

  function createController({wrapper, image, profile:profileValue}){
    if(!wrapper || !image){
      return null;
    }

    const profile = normalizeProfile(profileValue);
    let bodyLayer = wrapper.querySelector(".originalFullSyncBody");
    let hairLayer = wrapper.querySelector(".originalFullSyncHair");

    if(!bodyLayer){
      bodyLayer = createMotionLayer(image, "originalFullSyncBody");
      image.insertAdjacentElement("afterend", bodyLayer);
    }

    if(!hairLayer){
      hairLayer = createMotionLayer(image, "originalFullSyncHair");
      bodyLayer.insertAdjacentElement("afterend", hairLayer);
    }

    let geometry = null;
    let active = false;
    let currentFrame = {...NEUTRAL_FRAME};
    let lastFrameAt = 0;

    function syncSource(){
      const source = image.currentSrc || image.src || "";
      if(source){
        if(bodyLayer.src !== source) bodyLayer.src = source;
        if(hairLayer.src !== source) hairLayer.src = source;
      }
    }

    function setGeometry(value){
      geometry = normalizeGeometry(value);
      wrapper.classList.toggle(
        "original-full-sync-geometry-ready",
        Boolean(geometry)
      );

      if(!geometry){
        bodyLayer.style.clipPath = "";
        hairLayer.style.clipPath = "";
        return false;
      }

      const bodyTop = clamp(
        (geometry.bottom - geometry.height * 0.02) * 100,
        35,
        76
      );
      const shoulderHalfWidth = clamp(geometry.width * 1.34 * 100, 24, 48);
      const lowerHalfWidth = clamp(geometry.width * 1.60 * 100, 30, 50);
      const centerX = geometry.centerX * 100;
      const bodyPolygon = [
        `${clamp(centerX - shoulderHalfWidth, 0, 100)}% ${bodyTop}%`,
        `${clamp(centerX + shoulderHalfWidth, 0, 100)}% ${bodyTop}%`,
        `${clamp(centerX + lowerHalfWidth, 0, 100)}% 100%`,
        `${clamp(centerX - lowerHalfWidth, 0, 100)}% 100%`
      ].join(", ");
      bodyLayer.style.clipPath = `polygon(${bodyPolygon})`;

      const hairRadiusX = clamp(geometry.width * 0.98 * 100, 19, 43);
      const hairRadiusY = clamp(geometry.height * 1.02 * 100, 30, 62);
      const hairCenterY = clamp(
        (geometry.top + geometry.height * 0.38) * 100,
        18,
        52
      );
      hairLayer.style.clipPath =
        `ellipse(${hairRadiusX}% ${hairRadiusY}% at ${centerX}% ${hairCenterY}%)`;
      return true;
    }

    function setActive(value){
      active = Boolean(value) && profile.enabled;
      wrapper.classList.toggle("original-full-sync-active", active);
      if(!active){
        reset();
      }
    }

    function applyFrame(frame){
      const width = Math.max(1, image.offsetWidth || wrapper.offsetWidth || 1);
      const height = Math.max(1, image.offsetHeight || wrapper.offsetHeight || 1);
      wrapper.style.setProperty("--ofs-body-x", `${frame.bodyX * width}px`);
      wrapper.style.setProperty("--ofs-body-y", `${frame.bodyY * height}px`);
      wrapper.style.setProperty("--ofs-body-rotate", `${frame.bodyRotate}deg`);
      wrapper.style.setProperty("--ofs-body-scale-x", String(frame.bodyScaleX));
      wrapper.style.setProperty("--ofs-body-scale-y", String(frame.bodyScaleY));
      wrapper.style.setProperty("--ofs-torso-x", `${frame.torsoX * width}px`);
      wrapper.style.setProperty("--ofs-torso-y", `${frame.torsoY * height}px`);
      wrapper.style.setProperty("--ofs-torso-rotate", `${frame.torsoRotate}deg`);
      wrapper.style.setProperty("--ofs-torso-scale-x", String(frame.torsoScaleX));
      wrapper.style.setProperty("--ofs-torso-scale-y", String(frame.torsoScaleY));
      wrapper.style.setProperty("--ofs-hair-x", `${frame.hairX * width}px`);
      wrapper.style.setProperty("--ofs-hair-y", `${frame.hairY * height}px`);
      wrapper.style.setProperty("--ofs-hair-rotate", `${frame.hairRotate}deg`);
      wrapper.style.setProperty(
        "--ofs-body-opacity",
        String(profile.bodyOverlayOpacity)
      );
      wrapper.style.setProperty(
        "--ofs-hair-opacity",
        String(profile.hairOverlayOpacity)
      );
    }

    function update(input){
      if(!active){
        return {
          ...NEUTRAL_FRAME,
          face:{
            headX:0,
            headY:0,
            headTilt:0,
            browLift:0,
            eyeNarrow:0,
            cheekLift:0,
            mouthAsymmetry:0
          }
        };
      }

      const timestamp = Math.max(0, finiteNumber(input?.timestamp, 0));
      const elapsed = lastFrameAt ? timestamp - lastFrameAt : 16.67;
      const target = calculateFrame(input, profile);
      const baseSmoothed = smoothFrame(
        currentFrame,
        target,
        elapsed,
        profile.motionResponseMs
      );
      const hairSmoothed = smoothFrame(
        currentFrame,
        target,
        elapsed,
        profile.hairResponseMs
      );
      currentFrame = {
        ...baseSmoothed,
        hairX:hairSmoothed.hairX,
        hairY:hairSmoothed.hairY,
        hairRotate:hairSmoothed.hairRotate
      };
      lastFrameAt = timestamp;
      applyFrame(currentFrame);

      return {
        ...currentFrame,
        face:{
          headX:currentFrame.headX,
          headY:currentFrame.headY,
          headTilt:currentFrame.headTilt,
          browLift:currentFrame.browLift,
          eyeNarrow:currentFrame.eyeNarrow,
          cheekLift:currentFrame.cheekLift,
          mouthAsymmetry:currentFrame.mouthAsymmetry
        }
      };
    }

    function reset(){
      currentFrame = {...NEUTRAL_FRAME};
      lastFrameAt = 0;
      applyFrame(currentFrame);
    }

    image.addEventListener("load", syncSource);
    syncSource();
    reset();

    return Object.freeze({
      get active(){ return active; },
      get geometryReady(){ return Boolean(geometry); },
      profile:Object.freeze({...profile}),
      reset,
      setActive,
      setGeometry,
      syncSource,
      update
    });
  }

  globalScope.SolHoloOriginalFullSync = Object.freeze({
    calculateFrame,
    createController,
    defaults:DEFAULT_PROFILE,
    neutralFrame:NEUTRAL_FRAME,
    normalizeGeometry,
    normalizeProfile,
    smoothFrame
  });
})(window);
