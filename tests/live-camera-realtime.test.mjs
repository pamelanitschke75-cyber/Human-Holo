import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readText = path =>
  readFileSync(
    new URL(
      `../${path}`,
      import.meta.url
    ),
    "utf8"
  );

const html =
  readText("www/index.html");

const androidInstaller =
  readText(
    "scripts/install-whatsapp-driving-mode.mjs"
  );

const server =
  readText("server.mjs");

const privacy =
  readText("Datenschutz.md");

const workflow =
  readText(
    ".github/workflows/android-build.yml"
  );


function createSignLanguageRequestHarness(){

  const optionsSource =
    html.match(
      /const SIGN_LANGUAGE_OPTIONS\s*=\s*Object\.freeze\(\[[\s\S]*?\n  \]\);/u
    )?.[0];

  const parserSource =
    html.match(
      /function normalizeSignLanguageRequestText\([\s\S]*?(?=\nfunction liveCameraIsActive\()/u
    )?.[0];


  assert.ok(
    optionsSource,
    "Gebärdensprach-Liste muss aus dem Client ladbar sein."
  );

  assert.ok(
    parserSource,
    "Gebärdensprach-Anfrageparser muss aus dem Client ladbar sein."
  );


  return Function(
    `"use strict";
      let pendingSignLanguageSelection = false;
      let activeSignLanguage = null;
      ${optionsSource}
      ${parserSource}
      return {
        parse: value => signLanguageSequenceRequest(value),
        selectPending: value => {
          pendingSignLanguageSelection = value === true;
        },
        selectLanguage: value => {
          activeSignLanguage = explicitlyNamedSignLanguage(value);
        }
      };`
  )();
}


test(
  "Live-Kamera ist im Sprachmodus sichtbar und bewusst schaltbar",
  () => {

    assert.match(
      html,
      /id="liveCameraButton"[\s\S]*?aria-pressed="false"[\s\S]*?Live-Bild starten/u
    );

    assert.match(
      html,
      /id="liveCameraPanel"[\s\S]*?hidden[\s\S]*?id="liveCameraPreview"[\s\S]*?autoplay[\s\S]*?muted[\s\S]*?playsinline/u
    );

    assert.match(
      html,
      /LIVE AN HOLO/u
    );

    assert.match(
      html,
      /id="switchLiveCameraButton"[\s\S]*?Front- und Rückkamera wechseln/u
    );
  }
);


test(
  "Android fordert Kamera nur für den gestarteten Vordergrundmodus an",
  () => {

    assert.match(
      androidInstaller,
      /android\.permission\.CAMERA/u
    );

    assert.match(
      androidInstaller,
      /android\.hardware\.camera\.any"[\s\S]*?android:required="false"/u
    );

    assert.match(
      html,
      /navigator\.mediaDevices[\s\S]*?\.getUserMedia\(\{[\s\S]*?video:[\s\S]*?audio:false/u
    );

    assert.doesNotMatch(
      androidInstaller,
      /FOREGROUND_SERVICE_CAMERA/u
    );

    assert.match(
      workflow,
      /Live-Kamera für Realtime prüfen[\s\S]*?android\.permission\.CAMERA[\s\S]*?android\.hardware\.camera\.any/u
    );
  }
);


test(
  "aktuelle Einzelbilder gehen direkt in dieselbe Realtime-Unterhaltung",
  () => {

    assert.match(
      html,
      /LIVE_CAMERA_FRAME_INTERVAL_MS\s*=\s*6000/u
    );

    assert.match(
      html,
      /type:\s*"conversation\.item\.create"[\s\S]*?type:\s*"input_image"[\s\S]*?image_url:\s*imageDataUrl/u
    );

    assert.match(
      html,
      /LIVE_CAMERA_MAX_DATA_URL_CHARS\s*=\s*180000/u
    );

    assert.match(
      html,
      /canvas\.toDataURL\([\s\S]*?"image\/jpeg"[\s\S]*?quality/u
    );

    assert.match(
      html,
      /pc\?\.sctp\?\.maxMessageSize/u
    );

    assert.match(
      html,
      /async function handleRealtimeUserTranscript\([\s\S]*?await sendCurrentLiveCameraFrame\(\{[\s\S]*?force:true[\s\S]*?reason:"voice_turn"/u
    );

    const frameSenderStart =
      html.indexOf(
        "async function sendCurrentLiveCameraFrame("
      );

    const frameSenderEnd =
      html.indexOf(
        "function waitForLiveCameraPreview(",
        frameSenderStart
      );

    const frameSender =
      frameSenderStart >= 0 &&
      frameSenderEnd >
        frameSenderStart
        ? html.slice(
            frameSenderStart,
            frameSenderEnd
          )
        : "";

    assert.notEqual(
      frameSender,
      ""
    );

    assert.doesNotMatch(
      frameSender,
      /response\.create/u
    );
  }
);


test(
  "Live-Bilder enden sicher bei Gesprächsende oder App-Wechsel",
  () => {

    assert.match(
      html,
      /function stopLiveConversation\([\s\S]*?stopLiveCamera\(\{[\s\S]*?notifyModel:false/u
    );

    assert.match(
      html,
      /document\.addEventListener\([\s\S]*?"visibilitychange"[\s\S]*?document\.visibilityState\s*===\s*"hidden"[\s\S]*?stopLiveCamera/u
    );

    assert.match(
      html,
      /liveCameraStream[\s\S]*?\.getTracks\(\)[\s\S]*?track\.stop\(\)/u
    );

    assert.match(
      html,
      /liveCameraPreview\.srcObject\s*=\s*null/u
    );
  }
);


test(
  "Realtime speichert keine Rohbilder, aber den semantischen Live-Bild-Dialog",
  () => {

    assert.match(
      server,
      /WICHTIG ZUR LIVE-KAMERA:/u
    );

    assert.match(
      server,
      /zeitlich geordnete Momentaufnahmen und kein lückenloses Video/u
    );

    assert.match(
      server,
      /rohen Kamerabilder werden nicht im[\s\S]*Vollzeitgedächtnis[\s\S]*gespeichert/u
    );

    assert.match(
      server,
      /Sprachdialog, die Modalität „Live-Bild“ und deine damalige[\s\S]*semantische Auswertung[\s\S]*gemeinsames Ereignis/u
    );

    assert.match(
      html,
      /liveCameraIsActive\(\)[\s\S]*?"voice",[\s\S]*?"live_image"/u
    );

    assert.match(
      html,
      /currentRealtimeMemoryEventId[\s\S]*?sendLiveTranscriptToMemory\([\s\S]*?"assistant",[\s\S]*?sourceTurnEventId/u
    );
  }
);


test(
  "blinde Menschen können die Kamerabeschreibung vollständig per Sprache starten",
  () => {

    assert.match(
      html,
      /function isVoiceCameraDescriptionRequest\([\s\S]*?erklär[\s\S]*?was du \(\?:da \)\?siehst/u
    );

    assert.match(
      html,
      /async function handleRealtimeUserTranscript\([\s\S]*?!liveCameraIsActive\(\)[\s\S]*?isVoiceCameraDescriptionRequest\([\s\S]*?await startLiveCamera\(\)[\s\S]*?reason:"voice_turn"/u
    );

    assert.match(
      server,
      /blinde und sehbehinderte Kinder und Erwachsene[\s\S]*?gesprochene Eingabe[\s\S]*?gesprochene Ausgabe[\s\S]*?Gefahren zuerst/u
    );

    assert.match(
      server,
      /Setze niemals voraus, dass die Person den Bildschirm sehen kann/u
    );
  }
);


test(
  "Human Holo erklärt den eigenen Handybildschirm hörbar und ohne Fremd-App-Zugriff",
  () => {

    assert.match(
      html,
      /function isCurrentHoloScreenDescriptionRequest\([\s\S]*?meinen bildschirm[\s\S]*?auf dem handy/u
    );

    assert.match(
      html,
      /function describeCurrentHoloScreen\(\)[\s\S]*?Sprachgespräch mit Human Holo[\s\S]*?Soll ich dir den nächsten Schritt erklären/u
    );

    assert.match(
      html,
      /screenDescriptionRequested[\s\S]*?\[LOKALE_BILDSCHIRMBESCHREIBUNG\][\s\S]*?localHandled/u
    );

    assert.match(
      server,
      /\[LOKALE_BILDSCHIRMBESCHREIBUNG\][\s\S]*?ohne Zugriff auf eine andere\s+App[\s\S]*?keine Aktion aus/u
    );
  }
);


test(
  "Gebärdensprachtests verlangen eine konkrete Sprache statt einer universellen Annahme",
  () => {

    assert.match(
      html,
      /SIGN_LANGUAGE_OPTIONS[\s\S]*?Deutsche Gebärdensprache \(DGS\)[\s\S]*?American Sign Language \(ASL\)[\s\S]*?British Sign Language \(BSL\)/u
    );

    assert.match(
      html,
      /function signLanguageSequenceRequest\([\s\S]*?pendingSignLanguageSelection[\s\S]*?explicitLanguage/u
    );

    assert.match(
      html,
      /Welche Gebärdensprache soll ich prüfen\? Gebärdensprachen sind nicht universell/u
    );

    assert.match(
      server,
      /Die dort genannte Gebärdensprache ist für[\s\S]*?genau diese Folge verbindlich/u
    );

    assert.match(
      server,
      /Übertrage keine Bedeutung aus[\s\S]*?einer anderen Gebärdensprache/u
    );
  }
);


test(
  "Gebärdensprach-Anfrageparser trennt DGS, ÖGS und ASL praktisch",
  () => {

    const parser =
      createSignLanguageRequestHarness();

    const unspecified =
      parser.parse(
        "Starte den Gebärdensprach-Test mit Steffi."
      );


    assert.equal(
      unspecified.requested,
      true
    );

    assert.equal(
      unspecified.language,
      null
    );


    parser.selectPending(
      true
    );


    assert.equal(
      parser.parse(
        "DGS"
      ).language.code,
      "DGS"
    );

    assert.equal(
      parser.parse(
        "Bitte übersetze diese Österreichische Gebärdensprache."
      ).language.code,
      "ÖGS"
    );

    assert.equal(
      parser.parse(
        "Starte den ASL-Test."
      ).language.code,
      "ASL"
    );


    parser.selectPending(
      false
    );

    parser.selectLanguage(
      "DGS"
    );


    assert.equal(
      parser.parse(
        "Teste die Gebärdensprache noch einmal."
      ).language.code,
      "DGS"
    );

    assert.equal(
      parser.parse(
        "Steffi macht eine Handbewegung."
      ).requested,
      false
    );
  }
);


test(
  "DGS-Praxistest sendet eine kompakte zeitlich geordnete Bewegungsfolge",
  () => {

    assert.match(
      html,
      /SIGN_LANGUAGE_CAPTURE_FRAME_COUNT\s*=\s*10/u
    );

    assert.match(
      html,
      /SIGN_LANGUAGE_MIN_FRAME_COUNT\s*=\s*6/u
    );

    assert.match(
      html,
      /SIGN_LANGUAGE_CAPTURE_INTERVAL_MS\s*=\s*350/u
    );

    assert.match(
      html,
      /SIGN_LANGUAGE_MAX_DATA_URL_CHARS\s*=\s*65000/u
    );

    assert.match(
      html,
      /async function captureSignLanguageSequenceImages\([\s\S]*?SIGN_LANGUAGE_CAPTURE_FRAME_COUNT[\s\S]*?SIGN_LANGUAGE_CAPTURE_INTERVAL_MS/u
    );

    assert.match(
      html,
      /async function sendSignLanguageSequence\([\s\S]*?GEBAERDENSPRACHE_SEQUENZ_START[\s\S]*?GEBAERDENSPRACHE_FRAME[\s\S]*?input_image[\s\S]*?GEBAERDENSPRACHE_SEQUENZ_ENDE/u
    );

    assert.match(
      html,
      /Handform, Ausführungsort, Richtung, Bewegung, Körperhaltung und Mimik/u
    );

    assert.match(
      html,
      /Ich konnte die Gebärde nicht sicher erkennen/u
    );
  }
);


test(
  "Gebärdensprachfolge wird semantisch erinnert, Rohbilder werden nicht gespeichert",
  () => {

    assert.match(
      html,
      /signLanguageSequenceSent[\s\S]*?"live_image"[\s\S]*?"sign_language"[\s\S]*?currentRealtimeMemoryModalities/u
    );

    assert.match(
      privacy,
      /Vor der Aufnahme muss eine konkrete Gebärdensprache wie DGS gewählt sein/u
    );

    assert.match(
      privacy,
      /bis zu zehn komprimierte, zeitlich[\s\S]*?geordnete Bewegungsbilder/u
    );

    assert.match(
      privacy,
      /Human Holo übernimmt diese Live-Bilder weder in das Vollzeitgedächtnis/u
    );
  }
);
