#!/usr/bin/env node

import { randomBytes } from "node:crypto";
import {
  createHumanHoloTestAccess,
  hashHumanHoloTestAccessCode
} from "../modules/human-holo-test-access.mjs";

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? String(process.argv[index + 1] || "").trim() : "";
}

const testerId = argument("tester-id");
const displayName = argument("display-name");
const expiresAt = argument("expires-at");
const role = argument("role") || "tester";

if (!testerId || !displayName || !expiresAt) {
  console.error(
    "Aufruf: node scripts/create-human-holo-test-invite.mjs " +
    "--tester-id <id> --display-name <name> --expires-at <ISO-Zeit> " +
    "[--role <rolle>]"
  );
  process.exitCode = 1;
} else {
  const accessCode = randomBytes(24).toString("base64url");
  const profile = {
    testerId,
    displayName,
    accessCodeSha256: hashHumanHoloTestAccessCode(accessCode),
    expiresAt,
    role
  };

  // Nutzt dieselbe strenge Profilprüfung wie der Server. Der zufällige
  // Validierungsschlüssel wird weder ausgegeben noch gespeichert.
  createHumanHoloTestAccess({
    profilesJson: JSON.stringify([profile]),
    signingSecret: randomBytes(48).toString("base64url")
  });

  console.log("Einmaliger Zugangscode (nicht in Git speichern):");
  console.log(accessCode);
  console.log("\nGeprüfter Profileintrag für HUMAN_HOLO_TESTER_PROFILES_JSON:");
  console.log(JSON.stringify(profile, null, 2));
  console.log(
    "\nDer Zugang ist erst aktiv, wenn Pam diesen Eintrag bewusst in die " +
    "separate Human-Holo-Serverkonfiguration übernimmt und den Server neu startet."
  );
}
