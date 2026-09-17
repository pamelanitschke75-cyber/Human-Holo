export const PAM_HOLO_ACCESS_LEVEL = Object.freeze({
  OWNER_EVERYDAY: "owner_everyday",
  PROTECTED: "protected_media_documents_settings"
});

export const PAM_HOLO_SESSION_ACTION = Object.freeze({
  [PAM_HOLO_ACCESS_LEVEL.OWNER_EVERYDAY]:
    "bind_owner_everyday_session",
  [PAM_HOLO_ACCESS_LEVEL.PROTECTED]:
    "bind_trusted_app_session"
});

export const PAM_HOLO_OWNER_PROOF = Object.freeze({
  [PAM_HOLO_ACCESS_LEVEL.OWNER_EVERYDAY]:
    "pam_registered_owner_device_everyday_v1",
  [PAM_HOLO_ACCESS_LEVEL.PROTECTED]:
    "pam_voice_or_registered_watch_v1"
});

const EVERYDAY_CAPABILITIES = new Set([
  "conversation",
  "current_information",
  "weather",
  "shopping_list",
  "personal_notes",
  "whatsapp_message",
  "calendar_everyday_action",
  "phone_everyday_action",
  "smart_home_everyday_action"
]);

const SYSTEM_SETTINGS_CAPABILITIES = new Set([
  "image_access",
  "video_access",
  "document_access",
  "file_attachment_access",
  "business_matter_access",
  "business_external_action",
  "system_settings",
  "security_settings",
  "account_connection_settings",
  "permission_settings",
  "voice_profile_settings",
  "device_registration_settings",
  "medical_permission_settings",
  "medical_data_access",
  "backup_restore"
]);

export function normalizePamHoloAccessLevel(value, {
  fallback = PAM_HOLO_ACCESS_LEVEL.PROTECTED
} = {}) {
  const level = String(value || "").trim();
  if (Object.values(PAM_HOLO_ACCESS_LEVEL).includes(level)) {
    return level;
  }
  return fallback;
}

export function pamHoloSessionAction(accessLevel) {
  return PAM_HOLO_SESSION_ACTION[
    normalizePamHoloAccessLevel(accessLevel)
  ];
}

export function pamHoloOwnerProof(accessLevel) {
  return PAM_HOLO_OWNER_PROOF[
    normalizePamHoloAccessLevel(accessLevel)
  ];
}

export function pamHoloAccessSatisfies(actual, required) {
  const actualLevel = normalizePamHoloAccessLevel(actual, {
    fallback: ""
  });
  const requiredLevel = normalizePamHoloAccessLevel(required, {
    fallback: PAM_HOLO_ACCESS_LEVEL.OWNER_EVERYDAY
  });
  if (!actualLevel) return false;
  if (requiredLevel === PAM_HOLO_ACCESS_LEVEL.OWNER_EVERYDAY) {
    return actualLevel === PAM_HOLO_ACCESS_LEVEL.OWNER_EVERYDAY ||
      actualLevel === PAM_HOLO_ACCESS_LEVEL.PROTECTED;
  }
  return actualLevel === PAM_HOLO_ACCESS_LEVEL.PROTECTED;
}

export function isPamHoloEverydayCapability(capability) {
  return EVERYDAY_CAPABILITIES.has(String(capability || "").trim());
}

export function isPamHoloSystemSettingsCapability(capability) {
  return SYSTEM_SETTINGS_CAPABILITIES.has(String(capability || "").trim());
}

export function isPamHoloBusinessMatter(message) {
  const text = String(message || "").trim().toLowerCase();
  if (!text) return false;
  return /\b(?:geschäftlich(?:e[nsr]?)?|beruflich(?:e[nsr]?)?|firma|firmen|arbeitgeber|arbeitsvertrag|vertrag(?:s|e|en)?|rechnung(?:en)?|angebot(?:e|en)?|kund(?:e|en|in|innen)|steuer(?:n|erklärung)?|buchhaltung|gewerbe|geschäftskonto|business)\b/u.test(text);
}

export function isPamHoloProtectedContentRequest({
  message = "",
  hasImage = false,
  hasVideo = false,
  hasDocument = false,
  hasFileAttachment = false
} = {}) {
  return Boolean(
    hasImage ||
    hasVideo ||
    hasDocument ||
    hasFileAttachment ||
    isPamHoloBusinessMatter(message)
  );
}

export function pamHoloAccessBoundaryInstructions() {
  return `
PAM-HOLO-ZUGRIFFSGRENZE:
- „Hey Pam“ ist ausschließlich der Weckruf und niemals eine Entsperrung.
  Bevor irgendein Teil von Pam-Holo sichtbar wird, verlangt Pams registrierte
  Android-App eine frische starke Android-Biometrie ohne Geräte-PIN-Fallback.
  Erst wenn danach auch die gerätegebundene Alltagssitzung vollständig steht,
  wird die App-Oberfläche sichtbar.
- Nach erfolgreichem Fingerprint funktionieren Schreiben, Sprechen und die
  normalen Alltagsfunktionen ohne weiteren Fingerprint. Ein Netz- oder
  Sitzungsfehler darf niemals eine sichtbare, aber funktionslose Oberfläche
  hinterlassen.
- Zum normalen Alltag gehören insbesondere Gespräche, aktuelle Fragen wie
  Wetter, persönliche Listen und Notizen sowie von Pam beauftragte
  Alltagsaktionen wie Einkaufsliste und WhatsApp. Diese Beispiele sind nicht
  abschließend.
- Fotos, Videos, Scans, Dateien, Dokumente und Medienanhänge dürfen erst nach
  Pams gesonderter Android-Fingerprintfreigabe geöffnet, übertragen,
  ausgewertet, gespeichert oder verändert werden.
- Geschäftliche Angelegenheiten und Handlungen mit geschäftlicher Wirkung
  benötigen ebenfalls diese Fingerprintfreigabe. Sie hebt keine fachlichen,
  rechtlichen oder anderweitigen Verbote auf.
- Vor dem Ändern von System-, Sicherheits-, Konto-, Verbindungs- oder
  Berechtigungseinstellungen ist dieselbe gesonderte Freigabe nötig.
- Auch der tatsächliche Zugriff auf Health-Connect-Daten sowie Sicherung,
  Export, Import und Wiederherstellung benötigen diese Fingerprintfreigabe.
- Bereits bestehende inhaltliche Bestätigungen bleiben erhalten: etwa die
  Bestätigung von Empfänger und Inhalt vor einer WhatsApp-Nachricht. Sie sind
  keine Systementsperrung und werden nicht durch sie ersetzt.
`;
}
