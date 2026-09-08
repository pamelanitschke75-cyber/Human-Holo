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

const workflow =
  readText(
    ".github/workflows/android-build.yml"
  );


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
  "Realtime-Anweisung behandelt Live-Bilder als Momentaufnahmen ohne Gedächtnisimport",
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
      /nicht Teil des[\s\S]*Vollzeitgedächtnisses oder der bestätigten Langzeiterinnerungen/u
    );
  }
);
