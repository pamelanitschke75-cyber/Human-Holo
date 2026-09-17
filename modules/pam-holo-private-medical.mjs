import {
  PAM_HOLO_ACCESS_LEVEL,
  normalizePamHoloAccessLevel,
  pamHoloAccessSatisfies,
  pamHoloOwnerProof
} from "./pam-holo-access-policy.mjs";

export const PAM_HOLO_PRIVATE_MEDICAL_POLICY = Object.freeze({
  version: "2026-09-17",
  ownerId: "pam-sol",
  speakerId: "pam",
  minimumAccessLevel: PAM_HOLO_ACCESS_LEVEL.OWNER_EVERYDAY,
  mode: "private-owner-test",
  humanHoloRelease: "lawyer-approval-required",
  medicalDevice: false
});

export function isPamHoloPrivateMedicalIdentity(identity) {
  return (
    String(identity?.ownerId || "").trim() ===
      PAM_HOLO_PRIVATE_MEDICAL_POLICY.ownerId &&
    String(identity?.speakerId || "").trim() ===
      PAM_HOLO_PRIVATE_MEDICAL_POLICY.speakerId
  );
}

export function isPamHoloPrivateMedicalAuthorized(
  identity,
  trustedSession
) {
  const accessLevel = normalizePamHoloAccessLevel(
    trustedSession?.accessLevel,
    { fallback: "" }
  );
  return (
    isPamHoloPrivateMedicalIdentity(identity) &&
    String(trustedSession?.ownerId || "").trim() ===
      PAM_HOLO_PRIVATE_MEDICAL_POLICY.ownerId &&
    pamHoloAccessSatisfies(
      accessLevel,
      PAM_HOLO_PRIVATE_MEDICAL_POLICY.minimumAccessLevel
    ) &&
    String(trustedSession?.ownerPersonProof || "").trim() ===
      pamHoloOwnerProof(accessLevel)
  );
}

export function pamHoloPrivateMedicalBoundaryInstructions({
  authorized = false
} = {}) {
  if (!authorized) {
    return `
TEMPORÄRER JURISTISCHER HOLD · ALLGEMEINES HUMAN HOLO:

- Medizinische Beratung, Erkennung und Gesundheitsdatenauswertung sind für das
  allgemeine Human Holo technisch deaktiviert.
- Eine Freigabe ist erst nach dokumentierter anwaltlicher Prüfung zulässig.
`;
  }

  return `
PRIVATE PAM-HOLO-MEDIZINTEST · VERBINDLICHE GRENZE:

- Diese begrenzte Testfreigabe gilt ausschließlich für ownerId=pam-sol,
  speakerId=pam und eine aktuelle, persönlich bestätigte private App-Sitzung.
- Sie ist keine Freigabe für das allgemeine Human Holo, keine Produktfreigabe
  und keine Einstufung als Medizinprodukt.
- Erlaubt sind ausschließlich die technisch definierten privaten Testmodule:
  vorsichtige allgemeine Selbsthilfe bei leichten Beschwerden, das Ablesen
  bedruckter Medikamentenverpackungen nach sichtbarer Einzelfreigabe und der
  ausdrücklich ausgelöste, nur lesende Health-Connect-Abruf.
- Keine Diagnose, keine persönliche Dosierung, keine Änderung einer Medikation,
  keine Therapieentscheidung und keine Behauptung, eine Untersuchung zu
  ersetzen. Bei Warnzeichen gilt das festgelegte Notfallrouting.
- Gesundheitsdaten werden nicht automatisch importiert. Jede Berechtigung ist
  widerrufbar; ein Health-Abruf braucht eine ausdrückliche aktuelle Handlung.
`;
}
