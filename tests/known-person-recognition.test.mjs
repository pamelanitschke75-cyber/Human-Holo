import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  KNOWN_PERSON_RECOGNITION_RESPONSE_FORMAT,
  KNOWN_PERSON_SELF_CONSENT_VERSION,
  createOwnerSelfRecognitionRequest,
  formatOwnerSelfRecognitionAnswer,
  hasValidOwnerSelfConsent,
  isOwnerSelfRecognitionRequest,
  parseKnownPersonRecognitionResult
} from "../modules/known-person-recognition.mjs";

const readText = path =>
  readFileSync(
    new URL(`../${path}`, import.meta.url),
    "utf8"
  );

const server = readText("server.mjs");
const html = readText("www/index.html");
const ui = readText("www/sol-holo-ui.js");
const privacy = readText("www/datenschutz.html");
const backup = readText(
  "www/sol-holo-backup-core.mjs"
);

const consent = {
  consentVersion:
    KNOWN_PERSON_SELF_CONSENT_VERSION,
  granted:
    true,
  grantedAt:
    "2026-09-13T12:00:00.000Z",
  ownerId:
    "pam-sol",
  provider:
    "openai",
  providerAbuseMonitoringRetentionAcknowledged:
    true,
  purpose:
    "private-manually-submitted-photo-verification",
  providerAbuseMonitoringRetentionPossibleDays:
    30,
  speakerId:
    "pam",
  subject:
    "owner-self",
  withdrawal:
    "one-tap-in-connections"
};

test("nur eine bewusste Personenfrage mit einzelnem Foto öffnet den Weg", () => {
  assert.equal(
    isOwnerSelfRecognitionRequest(
      "Weißt du, wer die Person ist?",
      { hasImage: true }
    ),
    true
  );
  assert.equal(
    isOwnerSelfRecognitionRequest(
      "Nein, es geht nur um die Person.",
      { hasImage: true }
    ),
    true
  );
  assert.equal(
    isOwnerSelfRecognitionRequest(
      "Weißt du, wer Gurke ist?",
      { hasImage: true }
    ),
    false
  );
  assert.equal(
    isOwnerSelfRecognitionRequest(
      "Wer ist das?",
      { hasImage: true }
    ),
    false
  );
  assert.equal(
    isOwnerSelfRecognitionRequest(
      "Wer ist der Hersteller?",
      { hasImage: true }
    ),
    false
  );
  assert.equal(
    isOwnerSelfRecognitionRequest(
      "Erkennst du mich?",
      {
        hasImage: false,
        hasVideo: true
      }
    ),
    false
  );
  assert.equal(
    isOwnerSelfRecognitionRequest(
      "Beschreibe bitte das Foto.",
      { hasImage: true }
    ),
    false
  );
});

test("Einwilligung gilt nur exakt für Pam als Ownerin und diesen Zweck", () => {
  assert.equal(
    hasValidOwnerSelfConsent(
      consent,
      {
        ownerId: "pam-sol",
        speakerId: "pam"
      }
    ),
    true
  );
  assert.equal(
    hasValidOwnerSelfConsent(
      consent,
      {
        ownerId: "steffi-breeze",
        speakerId: "steffi"
      }
    ),
    false
  );
  assert.equal(
    hasValidOwnerSelfConsent(
      {
        ...consent,
        providerAbuseMonitoringRetentionAcknowledged:
          false
      },
      {
        ownerId: "pam-sol",
        speakerId: "pam"
      }
    ),
    false
  );
  assert.equal(
    hasValidOwnerSelfConsent(
      {
        ...consent,
        purpose: "public-live-identification"
      },
      {
        ownerId: "pam-sol",
        speakerId: "pam"
      }
    ),
    false
  );
});

test("nur ein Hochsicherheits-Treffer mit je genau einem Gesicht zählt", () => {
  const match =
    parseKnownPersonRecognitionResult({
      candidate_face_count: 1,
      confidence: "high",
      decision: "match",
      reference_face_count: 1
    });

  assert.equal(match.verifiedMatch, true);
  assert.equal(match.decision, "match");

  const medium =
    parseKnownPersonRecognitionResult({
      candidate_face_count: 1,
      confidence: "medium",
      decision: "match",
      reference_face_count: 1
    });
  assert.equal(medium.verifiedMatch, false);
  assert.equal(medium.decision, "uncertain");

  const group =
    parseKnownPersonRecognitionResult({
      candidate_face_count: 2,
      confidence: "high",
      decision: "match",
      reference_face_count: 1
    });
  assert.equal(group.verifiedMatch, false);
  assert.equal(group.decision, "uncertain");

  const invalid =
    parseKnownPersonRecognitionResult(
      "keine JSON-Antwort"
    );
  assert.equal(invalid.verifiedMatch, false);
  assert.equal(invalid.decision, "uncertain");
});

test("OpenAI erhält nur Referenz und Prüffoto ohne Response-Anwendungszustand", () => {
  const request =
    createOwnerSelfRecognitionRequest({
      candidateImage:
        "data:image/jpeg;base64,CANDIDATE",
      model:
        "gpt-test",
      referenceImage:
        "data:image/jpeg;base64,REFERENCE"
    });
  const content =
    request.input[0].content;
  const images =
    content.filter(
      part => part.type === "input_image"
    );

  assert.equal(request.model, "gpt-test");
  assert.equal(request.store, false);
  assert.equal(images.length, 2);
  assert.equal(
    images[0].image_url,
    "data:image/jpeg;base64,REFERENCE"
  );
  assert.equal(
    images[1].image_url,
    "data:image/jpeg;base64,CANDIDATE"
  );
  assert.equal(
    request.text.format,
    KNOWN_PERSON_RECOGNITION_RESPONSE_FORMAT
  );
  assert.match(
    request.instructions,
    /keine öffentliche Überwachung/u
  );
  assert.match(
    request.instructions,
    /Nenne und errate keine andere Identität/u
  );
  assert.doesNotMatch(
    request.instructions,
    /Steffi|Tochter|Kontakt/u
  );
});

test("sichtbare Antwort bestätigt Pam nur nach geprüftem Treffer", () => {
  const confirmed =
    formatOwnerSelfRecognitionAnswer(
      {
        verifiedMatch: true
      },
      "Pam"
    );
  assert.match(confirmed, /das bist du/u);
  assert.match(confirmed, /freigegebenen Referenzbild/u);

  const uncertain =
    formatOwnerSelfRecognitionAnswer(
      {
        candidateFaceCount: 1,
        decision: "uncertain",
        referenceFaceCount: 1,
        verifiedMatch: false
      },
      "Pam"
    );
  assert.match(uncertain, /nicht sicher bestätigen/u);
  assert.match(uncertain, /rate keinen Namen/u);

  const unavailable =
    formatOwnerSelfRecognitionAnswer(
      { technicalUnavailable: true },
      "Pam"
    );
  assert.match(unavailable, /technisch nicht erreichbar/u);
  assert.match(unavailable, /keinen Namen/u);
});

test("Backend prüft Sitzung, Owner und Einwilligung vor Bildauswertung", () => {
  const route =
    server.slice(
      server.indexOf('app.post("/sol"')
    );
  const recognitionGate =
    route.indexOf(
      "if (ownerSelfRecognitionRequested)"
    );
  const memoryWrite =
    route.indexOf(
      'saveFulltimeMemory(\n      "user"'
    );

  assert.ok(recognitionGate >= 0);
  assert.ok(memoryWrite > recognitionGate);
  assert.match(
    route,
    /trustedAppSessions\s*\n\s*\.validateRequest\(\s*\n\s*req/u
  );
  assert.match(
    route,
    /trustedRecognitionSession\s*\n\s*\.ownerId !==\s*\n\s*identity\.ownerId/u
  );
  assert.match(
    route,
    /identity\.ownerId !== "pam-sol"/u
  );
  assert.match(
    route,
    /hasValidOwnerSelfConsent/u
  );
  assert.match(
    route,
    /createOwnerSelfRecognitionRequest/u
  );
  assert.match(
    route,
    /providerApplicationStateStorageDisabled:\s*\n\s*true/u
  );
  assert.match(
    route,
    /providerAbuseMonitoringRetentionPossibleDays:\s*\n\s*30/u
  );
  assert.match(
    route,
    /publicOrLiveRecognition:\s*\n\s*false/u
  );
  assert.match(
    route,
    /rawImagesStoredInFulltimeMemory:\s*\n\s*false/u
  );
});

test("App bietet ausdrückliche Freigabe und Ein-Klick-Widerruf", () => {
  const sendStart =
    html.indexOf(
      "async function sendMessage("
    );
  const sendEnd =
    html.indexOf(
      "sendButton.addEventListener(",
      sendStart
    );
  const sendSource =
    html.slice(sendStart, sendEnd);

  assert.match(
    ui,
    /Pam auf Fotos wiedererkennen/u
  );
  assert.match(
    ui,
    /Die Einwilligung ist freiwillig/u
  );
  assert.match(
    ui,
    /bis zu 30 Tage für Missbrauchsschutz/u
  );
  assert.match(
    ui,
    /standardmäßig nicht zum Modelltraining/u
  );
  assert.match(
    ui,
    /Widerruf stoppt künftige Abgleiche/u
  );
  assert.match(
    ui,
    /revokeKnownPersonSelfConsent/u
  );
  assert.match(
    sendSource,
    /SolHoloKnownPersonRecognition/u
  );
  assert.match(
    sendSource,
    /ensureTrustedSession/u
  );
  assert.match(
    sendSource,
    /knownPersonSelfConsent:/u
  );
  assert.match(
    sendSource,
    /ownerSelfReferenceImage:/u
  );
  assert.ok(
    sendSource.indexOf(
      "SolHoloKnownPersonRecognition"
    ) <
    sendSource.indexOf(
      "addMessage(\n      identity.displayName"
    )
  );
});

test("Referenzbild und Einwilligung bleiben aus Backup und Vollzeitgedächtnis", () => {
  assert.doesNotMatch(
    backup,
    /owner-self-recognition-consent/u
  );
  assert.match(
    backup,
    /Klonfotos, Gesichtsdaten/u
  );
  assert.match(
    privacy,
    /nicht in eine Human-Holo-Sicherungsdatei übernommen/u
  );
  assert.match(
    privacy,
    /nicht in das Vollzeitgedächtnis/u
  );
  assert.match(
    privacy,
    /weder für Live-Bilder noch für öffentliche/u
  );
});
