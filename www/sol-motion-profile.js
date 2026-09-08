(function installSolHoloMotionProfile(globalScope){
  "use strict";

  /*
    Nur abgeleitete Bewegungswerte aus der privaten Video-Referenz.
    Das Video selbst und einzelne Bildframes werden nicht in der App verteilt.
  */
  const profile = {
    version:"2026-09-08-original-full-sync-2-visible",

    speech:{
      maximumOpen:0.62,
      restingOpen:0.012,
      attackRetention:0.58,
      releaseRetention:0.80,
      wideMaximum:0.52,
      roundMaximum:0.50,
      upperLipShare:0.18,
      lowerLipShare:0.72,
      travelByFace:0.027,
      travelByMouth:0.84,
      wideScale:0.24,
      roundScale:0.23,
      minimumMouthScale:0.88,
      maximumMouthScale:1.13,
      jawTravelByFace:0.014,
      jawTravelByMouth:0.46,
      jawLipShare:0.66,
      jawWidenShare:0.10,
      cheekShare:0.055,
      cheekLiftShare:0.10,
      cornerLiftShare:0.18,
      rigAttackMs:34,
      rigReleaseMs:86,
      shapeAttackMs:48,
      shapeReleaseMs:96,
      neutralEpsilon:0.007
    },

    fallback:{
      baseOpen:0.035,
      minimumOpen:0.010,
      maximumOpen:0.54,
      closureDepth:0.44,
      syllableRate:0.0174,
      consonantRate:0.039,
      phraseRate:0.0055
    },

    blink:{
      firstMinimumDelayMs:1450,
      firstMaximumDelayMs:2700,
      minimumDelayMs:3100,
      maximumDelayMs:6100,
      minimumDurationMs:170,
      maximumDurationMs:215,
      closureAmount:0.62
    },

    /*
      Persoenlicher Bewegungsstil fuer den gesamten sichtbaren Clone.
      Die Werte bleiben bildunabhaengig; bei jedem neuen Clone-Bild werden
      Gesicht, Haarbereich und sichtbarer Koerper lokal neu zugeordnet.
    */
    originalFullSync:{
      enabled:true,
      identityScope:"pam-sol",
      bodyBreathCycleMs:4700,
      bodyBreathLift:0.0060,
      bodyBreathScale:0.0072,
      bodySpeechLift:0.0038,
      bodySway:0.0065,
      bodyRotateDegrees:0.38,
      headSway:0.0090,
      headNod:0.0058,
      headTiltRadians:0.0085,
      browLift:0.12,
      eyeNarrow:0.08,
      cheekLift:0.10,
      mouthAsymmetry:0.035,
      hairFollow:0.78,
      hairSway:0.0130,
      hairLift:0.0055,
      hairRotateDegrees:0.62,
      motionResponseMs:90,
      hairResponseMs:190,
      bodyOverlayOpacity:0.64,
      hairOverlayOpacity:0.76,
      speechActivityFloor:0.38,
      idleActivity:0.035
    }
  };

  Object.values(profile).forEach(value => {
    if(value && typeof value === "object"){
      Object.freeze(value);
    }
  });

  globalScope.SolHoloMotionProfile =
    Object.freeze(profile);
})(window);
