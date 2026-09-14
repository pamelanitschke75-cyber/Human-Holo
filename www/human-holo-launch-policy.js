(function installHumanHoloLaunchPolicy(globalObject) {
  "use strict";

  const policy = Object.freeze({
    version: "2026-09-14-legal-review-1",
    profile: "legal-review",
    marketReleaseApproved: false,
    features: Object.freeze({
      coreChat: true,
      tapToTalk: true,
      confirmedMemory: true,
      calendarRemindersNotes: false,
      staticMediaUpload: true,
      whatsappDraft: true,
      dialerHandoff: true,
      googlePersonalServices: false,
      smartThings: false,
      alarmAndWatch: false,
      personalAppearance: false,
      animalHolos: false,
      memoryRestore: false,
      automaticFullTranscriptStorage: false,
      medicalAdvice: false,
      medicationRecognition: false,
      healthConnect: false,
      whatsappAutoSend: false,
      whatsappNotificationReader: false,
      directCalls: false,
      hardcodedRoadsideCall: false,
      personalCloneCall: false,
      liveCamera: false,
      backgroundWake: false,
      speakerBiometrics: false,
      knownPersonRecognition: false,
      customVoice: false,
      originalFullSync: false,
      memorialNewEntries: false
    })
  });

  const holdMessage =
    "Diese Funktion ist bis zum Abschluss der fachanwaltlichen Prüfung deaktiviert.";

  globalObject.HumanHoloLaunchPolicy = Object.freeze({
    policy,
    enabled(feature) {
      return policy.features[feature] === true;
    },
    hold(feature, message = holdMessage) {
      return Object.freeze({
        code: "FEATURE_LEGAL_REVIEW_HOLD",
        feature,
        message,
        policyVersion: policy.version
      });
    }
  });
})(window);
