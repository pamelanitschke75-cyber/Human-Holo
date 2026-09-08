import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(
  new URL(
    "../www/index.html",
    import.meta.url
  ),
  "utf8"
);

const elementBlock = id =>
  html.match(
    new RegExp(
      `<[^>]+id="${id}"[\\s\\S]*?>`,
      "u"
    )
  )?.[0] || "";


test(
  "Chat-Kamera startet eine neue Aufnahme mit der Rückkamera",
  () => {

    assert.match(
      html,
      /id="imageButton"[\s\S]*?aria-label="Sofort ein Foto aufnehmen"/u
    );

    const cameraInput =
      elementBlock("imageInput");

    assert.notEqual(
      cameraInput,
      ""
    );

    assert.match(
      cameraInput,
      /type="file"/u
    );

    assert.match(
      cameraInput,
      /accept="image\/\*"/u
    );

    assert.match(
      cameraInput,
      /capture="environment"/u
    );

    assert.doesNotMatch(
      cameraInput,
      /video/u
    );

    assert.match(
      html,
      /imageButton\.addEventListener\([\s\S]*?"click"[\s\S]*?imageInput\.click\(\)/u
    );
  }
);


test(
  "vorhandene Fotos und Videos bleiben getrennt im Menü auswählbar",
  () => {

    assert.match(
      html,
      /id="mediaLibraryButton"[\s\S]*?Foto oder Video auswählen/u
    );

    const libraryInput =
      elementBlock("mediaLibraryInput");

    assert.match(
      libraryInput,
      /accept="image\/\*,video\/\*"/u
    );

    assert.doesNotMatch(
      libraryInput,
      /capture=/u
    );

    assert.match(
      html,
      /mediaLibraryButton\.addEventListener\([\s\S]*?drawer\.classList\.remove\([\s\S]*?"open"[\s\S]*?mediaLibraryInput\.click\(\)/u
    );
  }
);


test(
  "Aufnahme und Medienauswahl nutzen dieselbe Vorschau ohne automatisches Senden",
  () => {

    assert.match(
      html,
      /imageInput\.addEventListener\([\s\S]*?"change"[\s\S]*?handleMediaInputChange/u
    );

    assert.match(
      html,
      /mediaLibraryInput\.addEventListener\([\s\S]*?"change"[\s\S]*?handleMediaInputChange/u
    );

    const handlerStart =
      html.indexOf(
        "async function handleMediaInputChange("
      );

    const handlerEnd =
      html.indexOf(
        "function clearSelectedImage(",
        handlerStart
      );

    const handler =
      handlerStart >= 0 &&
      handlerEnd > handlerStart
        ? html.slice(
            handlerStart,
            handlerEnd
          )
        : "";

    assert.notEqual(
      handler,
      ""
    );

    assert.match(
      handler,
      /selectedImageDataUrl\s*=\s*await resizeImageFile/u
    );

    assert.match(
      handler,
      /imagePreviewPanel\.classList\.add\([\s\S]*?"visible"/u
    );

    assert.doesNotMatch(
      handler,
      /sendMessage\s*\(/u
    );

    assert.doesNotMatch(
      handler,
      /fetch\s*\(/u
    );

    assert.match(
      html,
      /function clearSelectedImage\([\s\S]*?imageInput\.value\s*=\s*""[\s\S]*?mediaLibraryInput\.value\s*=\s*""/u
    );
  }
);


test(
  "Sofortfoto und Live-Bild bleiben als zwei getrennte Kameramodi erhalten",
  () => {

    assert.match(
      html,
      /id="imageInput"[\s\S]*?capture="environment"/u
    );

    assert.match(
      html,
      /id="liveCameraButton"[\s\S]*?Live-Bild starten/u
    );

    assert.match(
      html,
      /LIVE AN HOLO/u
    );
  }
);
