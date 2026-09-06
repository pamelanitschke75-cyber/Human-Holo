import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  calendarMemorySearchQuery,
  resolveGroundedBirthdayCalendarCommand
} from "../modules/calendar-memory-grounding.mjs";

test("Vater-Geburtstag sucht gezielt im ownergebundenen Verlauf", () => {
  assert.equal(
    calendarMemorySearchQuery(
      "Kannst du meinen Vater seinen Geburtstag auch in den Kalender eintragen"
    ),
    "vater papa vati geburtstag geburtsdatum geboren"
  );
});

test("ein früher von Pam genanntes Datum wird zum jährlichen Ganztagstermin", () => {
  const result = resolveGroundedBirthdayCalendarCommand({
    message:
      "Kannst du meinen Vater seinen Geburtstag auch in den Kalender eintragen",
    todayIso:
      "2026-09-06",
    rows: [
      {
        id: 10,
        role: "user",
        content: "Mein Papa hat am 12. März Geburtstag."
      }
    ]
  });

  assert.equal(result.resolved, true);
  assert.deepEqual(result.command, {
    action: "create",
    summary: "Vater Geburtstag",
    start: "2027-03-12",
    end: "2027-03-13",
    description: "",
    reminderMinutes: null,
    allDay: true,
    recurrence: "yearly",
    memoryGrounded: true
  });
});

test("eine kurze Datumsantwort direkt nach Sols Vater-Frage zählt", () => {
  const result = resolveGroundedBirthdayCalendarCommand({
    message:
      "Trag den Geburtstag meines Vaters in den Kalender ein",
    todayIso:
      "2026-09-06",
    rows: [
      {
        id: 20,
        role: "assistant",
        content: "Wann hat dein Vater Geburtstag?"
      },
      {
        id: 21,
        role: "user",
        content: "Am 9. Dezember."
      }
    ]
  });

  assert.equal(result.resolved, true);
  assert.equal(result.command.start, "2026-12-09");
  assert.equal(result.command.end, "2026-12-10");
});

test("ein Datum aus einer früheren Sol-Antwort wird niemals übernommen", () => {
  const result = resolveGroundedBirthdayCalendarCommand({
    message:
      "Trag den Geburtstag meines Vaters in den Kalender ein",
    todayIso:
      "2026-09-06",
    rows: [
      {
        id: 30,
        role: "assistant",
        content: "Dein Vater hat am 2. Mai Geburtstag."
      }
    ]
  });

  assert.equal(result.matched, true);
  assert.equal(result.resolved, false);
  assert.equal(result.reason, "missing_date");
});

test("eine spätere Korrektur von Pam hat Vorrang vor der älteren Angabe", () => {
  const result = resolveGroundedBirthdayCalendarCommand({
    message:
      "Trag den Geburtstag meiner Mutter in den Kalender ein",
    todayIso:
      "2026-09-06",
    rows: [
      {
        id: 40,
        role: "user",
        content: "Meine Mama hat am 8. Dezember Geburtstag."
      },
      {
        id: 41,
        role: "user",
        content: "Korrektur: Mutti hat am 9. Dezember Geburtstag."
      }
    ]
  });

  assert.equal(result.resolved, true);
  assert.equal(result.command.summary, "Mutter Geburtstag");
  assert.equal(result.command.start, "2026-12-09");
});

test("mehrere Datumsangaben in derselben Aussage bleiben gesperrt", () => {
  const result = resolveGroundedBirthdayCalendarCommand({
    message:
      "Trag den Geburtstag meines Vaters in den Kalender ein",
    todayIso:
      "2026-09-06",
    rows: [
      {
        id: 50,
        role: "user",
        content: "Bei Papa stehen hier der 2. Mai und der 3. Mai."
      }
    ]
  });

  assert.equal(result.resolved, false);
  assert.equal(result.reason, "conflicting_dates");
});

test("der Kalender lädt das Gedächtnis vor dem Parser und schreibt echte Wiederholung", async () => {
  const server = await readFile(
    new URL("../server.mjs", import.meta.url),
    "utf8"
  );
  const handlerStart = server.indexOf("async function handleCalendarWriteRequest");
  const handlerEnd = server.indexOf("app.post(\n  \"/calendar/action\"", handlerStart);
  const handler = server.slice(handlerStart, handlerEnd);
  const eventStart = server.indexOf("async function createGoogleCalendarEvent");
  const eventEnd = server.indexOf("function calendarActionScope", eventStart);
  const eventWriter = server.slice(eventStart, eventEnd);

  assert.ok(handlerStart >= 0);
  assert.ok(handlerEnd > handlerStart);
  assert.ok(
    handler.indexOf("loadCalendarGroundingMemory") <
      handler.indexOf("parseCalendarCommand("),
    "Der ownergebundene Abruf muss vor dem Kalenderparser erfolgen."
  );
  assert.match(
    handler,
    /resolveGroundedBirthdayCalendarCommand\([\s\S]*?calendarGrounding\.rows/u
  );
  assert.match(
    handler,
    /parseCalendarCommand\([\s\S]*?calendarGrounding\.memoryText/u
  );
  assert.match(eventWriter, /date:\s*\n\s*startValue/u);
  assert.match(eventWriter, /date:\s*\n\s*endValue/u);
  assert.match(eventWriter, /RRULE:FREQ=YEARLY/u);
});
