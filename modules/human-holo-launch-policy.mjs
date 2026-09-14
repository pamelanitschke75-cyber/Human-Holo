export const HUMAN_HOLO_LAUNCH_POLICY_VERSION =
  "2026-09-14-legal-review-1";

export const HUMAN_HOLO_LAUNCH_POLICY = Object.freeze({
  version: HUMAN_HOLO_LAUNCH_POLICY_VERSION,
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

export function isLaunchFeatureEnabled(feature) {
  return HUMAN_HOLO_LAUNCH_POLICY.features[feature] === true;
}

export function legalReviewHoldPayload(
  feature,
  message =
    "Diese Funktion ist bis zum Abschluss der fachanwaltlichen Prüfung deaktiviert."
) {
  return {
    error: "FEATURE_LEGAL_REVIEW_HOLD",
    code: "FEATURE_LEGAL_REVIEW_HOLD",
    feature,
    enabled: false,
    persisted: false,
    legalReview: true,
    policyVersion: HUMAN_HOLO_LAUNCH_POLICY_VERSION,
    message
  };
}

const PERSONAL_HEALTH_CONTEXT =
  /\b(ich|mir|mich|mein(?:e|en|em|er|es)?|bei mir|du siehst|auf dem foto|dieses medikament|meine tablette|meine dosis)\b/i;
const HEALTH_SUBJECT =
  /\b(symptom(?:e|en)?|schmerz(?:en)?|fieber|ausschlag|blut(?:ung|druck)?|atemnot|brustschmerz|schwindel|ohnmacht|allerg(?:ie|isch)|schwanger|medikament(?:e|en)?|tablette(?:n)?|dosis|dosierung|diagnos(?:e|tizier)|krank(?:heit)?|notfall|112|116117|apotheke|arzt|ärztin)\b/i;
const PERSONAL_MEDICAL_ACTION =
  /\b(was soll ich (?:tun|nehmen)|soll ich (?:zum arzt|112|116117)|wie viel soll ich nehmen|erkenne? (?:das|dieses) medikament|prüf(?:e)? (?:meine|das) symptom)\b/i;

export function isPersonalMedicalFeatureRequest(message) {
  const text = String(message || "").trim();
  if (!text) {
    return false;
  }

  return (
    PERSONAL_MEDICAL_ACTION.test(text) ||
    (PERSONAL_HEALTH_CONTEXT.test(text) && HEALTH_SUBJECT.test(text))
  );
}

export function personalMedicalHoldMessage() {
  return [
    "Die persönliche Gesundheits-, Warnzeichen- und Medikamentenfunktion ist derzeit rechtlich deaktiviert.",
    "Human Holo nimmt keine medizinische Bewertung vor.",
    "Bei akuter Gefahr oder schweren Beschwerden bitte 112 wählen; bei dringenden, nicht lebensbedrohlichen Beschwerden in Deutschland 116117 oder ärztliche Hilfe kontaktieren."
  ].join(" ");
}
