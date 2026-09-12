import assert from "node:assert/strict";
import test from "node:test";

import {
  formatMultimodalEventRows,
  mayReferToRecentMultimodalEvent,
  mentionsSignLanguage,
  memoryEventIdFromRow,
  memoryModalitiesFromRow,
  normalizeMemoryModalities,
  selectReferencedMultimodalEventId,
  shouldAssociateWithRecentMultimodalEvent
} from "../modules/multimodal-event-memory.mjs";

test("normalisiert Bild, Video, Gebärdensprache, Sprache und Text", () => {
  assert.deepEqual(
    normalizeMemoryModalities([
      "typed",
      "Foto",
      "speech",
      "video",
      "DGS",
      "foto"
    ]),
    ["text", "image", "voice", "video", "sign_language"]
  );
});

test("erkennt Gebärdensprache sprachunabhängig und nicht als beliebige Handbewegung", () => {
  assert.equal(
    mentionsSignLanguage("Das ist Deutsche Gebärdensprache (DGS)."),
    true
  );
  assert.equal(
    mentionsSignLanguage("She is using sign language."),
    true
  );
  assert.equal(
    mentionsSignLanguage("Sie winkt mit der Hand."),
    false
  );
});

test("erkennt alte Foto- und Videoeinträge ohne nachträgliches Umschreiben", () => {
  assert.deepEqual(
    memoryModalitiesFromRow({
      content: "Wie lange braucht der?\n[Foto gesendet]"
    }),
    ["image"]
  );
  assert.deepEqual(
    memoryModalitiesFromRow({
      content: "[Video gesendet · 17 Sekunden]"
    }),
    ["video"]
  );
  assert.deepEqual(
    memoryModalitiesFromRow({
      content: "[Video gesendet · 9 Sekunden]\n[Gebärdensprache]"
    }),
    ["video", "sign_language"]
  );
});

test("ordnet beide Rollen über die gemeinsame Ereignis-ID zusammen", () => {
  assert.equal(
    memoryEventIdFromRow({
      source_event_id: "app-1234567890123456:assistant"
    }),
    "app-1234567890123456"
  );
  assert.equal(
    memoryEventIdFromRow({
      source_event_id: "app-1234567890123456:1:user"
    }),
    "app-1234567890123456"
  );
});

test("erkennt natürliche spätere Ergänzungen zu jedem vorherigen Ereignis", () => {
  assert.equal(
    mayReferToRecentMultimodalEvent(
      "Es hat etwas länger gedauert, weil wir es krosser wollten."
    ),
    true
  );
  assert.equal(
    mayReferToRecentMultimodalEvent(
      "Weißt du noch das Bild von gestern?"
    ),
    true
  );
  assert.equal(
    mayReferToRecentMultimodalEvent(
      "Wie wird morgen das Wetter?"
    ),
    false
  );
  assert.equal(
    shouldAssociateWithRecentMultimodalEvent(
      "Gestern war ich einkaufen."
    ),
    false,
    "Ein Datum allein darf kein fremdes Medienereignis übernehmen."
  );
});

test("verknüpft eine spätere Ergänzung mit dem inhaltlich passenden Ereignis", () => {
  const eventId = selectReferencedMultimodalEventId(
    [
      {
        id: 11,
        role: "user",
        content: "Unsere Katze auf dem Kratzbaum\n[Foto gesendet]",
        source_event_id: "app-cat-123456789012:user"
      },
      {
        id: 21,
        role: "user",
        content: "Wie lange braucht der Fisch im Airfryer?\n[Foto gesendet]",
        source_event_id: "app-fish-12345678901:user"
      },
      {
        id: 22,
        role: "assistant",
        content: "Der Fisch braucht ungefähr 18 bis 22 Minuten.",
        source_event_id: "app-fish-12345678901:assistant"
      }
    ],
    "Bei dem Fisch-Foto hat es länger gedauert, weil wir ihn krosser wollten."
  );

  assert.equal(eventId, "app-fish-12345678901");
});

test("verknüpft eine allgemeine direkte Folgeaussage mit dem jüngsten Bild", () => {
  const eventId = selectReferencedMultimodalEventId(
    [
      {
        id: 3,
        role: "user",
        content: "[Video gesendet · 5 Sekunden]",
        memory_event_id: "app-old-123456789012",
        source_modalities: ["video"]
      },
      {
        id: 8,
        role: "user",
        content: "[Foto gesendet]",
        memory_event_id: "app-new-123456789012",
        source_modalities: ["image"]
      }
    ],
    "Es hat etwas länger gedauert, weil wir es krosser wollten."
  );

  assert.equal(eventId, "app-new-123456789012");
});

test("formatiert ein Foto mit späterer Holo-Auswertung als ein Ereignis", () => {
  const text = formatMultimodalEventRows([
    {
      id: 1,
      role: "user",
      content: "Wie lange braucht der im Airfryer?\n[Foto gesendet]",
      source_event_id: "app-1234567890123456:user",
      source_modalities: ["text", "image"],
      created_at: "2026-09-11T10:00:00.000Z"
    },
    {
      id: 2,
      role: "assistant",
      content: "Der Fisch braucht ungefähr 18 bis 22 Minuten.",
      source_event_id: "app-1234567890123456:assistant",
      source_modalities: ["text", "image"],
      created_at: "2026-09-11T10:00:02.000Z"
    }
  ]);

  assert.match(text, /Foto/u);
  assert.match(text, /Airfryer/u);
  assert.match(text, /Fisch/u);
  assert.match(text, /kein eigenständiger Beleg/u);
  assert.doesNotMatch(text, /base64|data:image/u);
});

test("kennzeichnet ein Gebärdensprachereignis ohne Rohvideo als Erinnerung", () => {
  const text = formatMultimodalEventRows([
    {
      id: 4,
      role: "user",
      content: "Bitte beschreibe nur die sicher erkennbare Bedeutung.",
      memory_event_id: "app-sign-123456789012",
      source_modalities: ["video", "sign_language"],
      created_at: "2026-09-12T09:00:00.000Z"
    },
    {
      id: 5,
      role: "assistant",
      content: "Die Bedeutung ist aus diesen Ausschnitten nicht sicher erkennbar.",
      memory_event_id: "app-sign-123456789012",
      source_modalities: ["video", "sign_language"],
      created_at: "2026-09-12T09:00:01.000Z"
    }
  ]);

  assert.match(text, /Video \+ Gebärdensprache/u);
  assert.match(text, /nicht sicher erkennbar/u);
  assert.doesNotMatch(text, /data:video|base64/u);
});
