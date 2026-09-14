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

test("Backend blockiert biometrische Bildauswertung vor Sitzung und Anbieteraufruf", () => {
  const route =
    server.slice(
      server.indexOf('app.post("/sol"')
    );
  const recognitionRequest =
    route.indexOf(
      "const ownerSelfRecognitionRequested"
    );
  const legalReviewGate =
    route.indexOf(
      '!isLaunchFeatureEnabled("knownPersonRecognition")'
    );
  const trustedSessionCheck = route.indexOf(
    "trustedAppSessions\n          .validateRequest",
    legalReviewGate
  );
  const providerRequest = route.indexOf(
    "createOwnerSelfRecognitionRequest",
    legalReviewGate
  );

  assert.ok(recognitionRequest >= 0);
  assert.ok(legalReviewGate > recognitionRequest);
  assert.ok(trustedSessionCheck > legalReviewGate);
  assert.ok(providerRequest > legalReviewGate);
  assert.match(
    route,
    /respondLegalReviewHold\([\s\S]*?"knownPersonRecognition"[\s\S]*?Biometrische Personen-Wiedererkennung ist bis zur rechtlichen Freigabe deaktiviert/u
  );
});

test("App zeigt den Legal-Review-Hold und erteilt keine biometrische Freigabe", () => {
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

  assert.match(ui, /Biometrische Wiedererkennung deaktiviert/u);
  assert.match(ui, /Biometrische Wiedererkennung ist rechtlich deaktiviert/u);
  assert.match(ui, /reason: "legal-review-hold"/u);
  const grantStart = ui.indexOf("function grantKnownPersonSelfConsent()");
  const grantOwnerCheck = ui.indexOf("requireActivePersonalOwner()", grantStart);
  const grantGate = ui.indexOf('!featureEnabled("knownPersonRecognition")', grantStart);
  assert.ok(grantStart >= 0);
  assert.ok(grantGate > grantStart);
  assert.ok(grantOwnerCheck > grantGate);
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
