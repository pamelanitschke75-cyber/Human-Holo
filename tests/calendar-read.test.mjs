import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readText = (path) => readFileSync(
  new URL(`../${path}`, import.meta.url),
  "utf8"
);

const ui = readText("www/sol-holo-ui.js");
const html = readText("www/index.html");
const server = readText("server.mjs");
const phonePlugin = readText("android-native/PhoneContactsPlugin.java");

function sourceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Startmarke fehlt: ${startMarker}`);
  assert.notEqual(end, -1, `Endmarke fehlt: ${endMarker}`);
  return source.slice(start, end);
}

const calendarRequestFromMessage = new Function(
  [
    sourceBetween(
      ui,
      "  function normalizeNoteSearchText",
      "  function stripHoloInvocation"
    ),
    sourceBetween(
      ui,
      "  function stripHoloInvocation",
      "  function noteSecurityWarning"
    ),
    sourceBetween(
      ui,
      "  function calendarReadRequestFromMessage",
      "  function calendarReadDateText"
    ),
    "return calendarReadRequestFromMessage;"
  ].join("\n")
)();

const referenceDate = new Date(2026, 8, 15, 10, 30, 0, 0);

test("Kalenderfragen erkennen Tag, Datum, nächsten Termin und Geburtstag", () => {
  const today = calendarRequestFromMessage(
    "Was steht heute im Kalender?",
    referenceDate
  );
  assert.equal(today.kind, "day");
  assert.equal(today.relativeLabel, "heute");
  assert.equal(today.startMillis, new Date(2026, 8, 15).getTime());

  const tomorrow = calendarRequestFromMessage(
    "Was habe ich morgen im Kalender?",
    referenceDate
  );
  assert.equal(tomorrow.kind, "day");
  assert.equal(tomorrow.relativeLabel, "morgen");
  assert.equal(tomorrow.startMillis, new Date(2026, 8, 16).getTime());

  const dayAfterTomorrow = calendarRequestFromMessage(
    "Lies mir meine Termine für übermorgen vor.",
    referenceDate
  );
  assert.equal(dayAfterTomorrow.kind, "day");
  assert.equal(dayAfterTomorrow.relativeLabel, "übermorgen");
  assert.equal(dayAfterTomorrow.startMillis, new Date(2026, 8, 17).getTime());

  const explicitDate = calendarRequestFromMessage(
    "Welche Termine stehen am 17.09.2026 im Kalender?",
    referenceDate
  );
  assert.equal(explicitDate.kind, "day");
  assert.equal(explicitDate.startMillis, new Date(2026, 8, 17).getTime());

  const weekday = calendarRequestFromMessage(
    "Was steht Freitag im Kalender?",
    referenceDate
  );
  assert.equal(weekday.kind, "day");
  assert.equal(weekday.startMillis, new Date(2026, 8, 18).getTime());

  const upcoming = calendarRequestFromMessage(
    "Wann ist mein nächster Termin?",
    referenceDate
  );
  assert.equal(upcoming.kind, "upcoming");

  const birthday = calendarRequestFromMessage(
    "Wann hat Salt Geburtstag?",
    referenceDate
  );
  assert.equal(birthday.kind, "birthday");
  assert.equal(birthday.person, "Salt");
  assert.equal(birthday.personQuery, "salt");
  assert.ok(
    birthday.endMillis - birthday.startMillis >= 365 * 24 * 60 * 60 * 1000
  );
});

test("Kalenderlesen verwechselt keine Schreib- oder Einkaufslistenaufträge", () => {
  for (const phrase of [
    "Trag morgen um 9 Uhr Zahnarzt in den Kalender ein",
    "Speichere Ernas Geburtstag im Kalender",
    "Öffne den Kalender",
    "Was steht auf meiner Einkaufsliste?",
    "Schreib Salz auf die Einkaufsliste"
  ]) {
    assert.equal(
      calendarRequestFromMessage(phrase, referenceDate),
      null,
      phrase
    );
  }
});

const calendarReadAnswer = new Function(
  [
    sourceBetween(
      ui,
      "  function normalizeNoteSearchText",
      "  function stripHoloInvocation"
    ),
    sourceBetween(
      ui,
      "  function normalizeLinkedCalendarEvent",
      "  function isHiddenSamsungBirthdayEvent"
    ),
    sourceBetween(
      ui,
      "  function localCalendarDayValue",
      "  function selectedCalendarDayStart"
    ),
    sourceBetween(
      ui,
      "  function linkedCalendarDuplicateKey",
      "  function linkedCalendarDateText"
    ),
    sourceBetween(
      ui,
      "  function calendarReadDateText",
      "  async function readDeviceCalendar"
    ),
    "return calendarReadAnswer;"
  ].join("\n")
)();

test("Kalenderantworten lesen echte Termine und ausgeblendete Geburtstage", () => {
  const request = calendarRequestFromMessage(
    "Was habe ich morgen im Kalender?",
    referenceDate
  );
  const events = [
    {
      eventId: "1",
      title: "Zahnarzt",
      startMillis: new Date(2026, 8, 16, 9, 0).getTime(),
      endMillis: new Date(2026, 8, 16, 10, 0).getTime(),
      allDay: false,
      calendarName: "Samsung Calendar",
      location: "Praxis"
    },
    {
      eventId: "2",
      title: "Müllabfuhr",
      startMillis: Date.UTC(2026, 8, 16),
      endMillis: Date.UTC(2026, 8, 17),
      allDay: true,
      calendarName: "Samsung Calendar"
    }
  ];
  const answer = calendarReadAnswer(request, events);
  assert.equal(answer.success, true);
  assert.equal(answer.empty, false);
  assert.equal(answer.events.length, 2);
  assert.match(answer.answer, /Für morgen stehen 2 Termine/u);
  assert.match(answer.answer, /Zahnarzt/u);
  assert.match(answer.answer, /Müllabfuhr/u);
  assert.match(answer.answer, /Ort: Praxis/u);

  const birthdayRequest = calendarRequestFromMessage(
    "Wann hat Salt Geburtstag?",
    referenceDate
  );
  const birthdayAnswer = calendarReadAnswer(birthdayRequest, [{
    eventId: "3",
    title: "Salt – Geburtstag",
    startMillis: Date.UTC(2027, 2, 6),
    endMillis: Date.UTC(2027, 2, 7),
    allDay: true,
    calendarName: "Samsung Calendar"
  }]);
  assert.equal(birthdayAnswer.success, true);
  assert.equal(birthdayAnswer.empty, false);
  assert.match(birthdayAnswer.answer, /Salt.+6\. März 2027.+Geburtstag/u);
});

test("der Android-Leseweg prüft Freigabe und begrenzt Geburtstagssuche", async () => {
  const calls = [];
  const plugin = {
    async getCalendarStatus() {
      calls.push(["status"]);
      return { supported: true, permissionGranted: true };
    },
    async listCalendarEvents(options) {
      calls.push(["list", options]);
      return { events: [{ title: "Salt – Geburtstag" }] };
    }
  };
  const readDeviceCalendar = new Function(
    "activePersonalOwner",
    "getPhoneContactsPlugin",
    "renderDeviceCalendarStatus",
    "calendarReadAnswer",
    [
      sourceBetween(
        ui,
        "  async function readDeviceCalendar",
        "  async function executeCalendarReadTool"
      ),
      "return readDeviceCalendar;"
    ].join("\n")
  )(
    () => ({ ownerId: "pam-sol" }),
    () => plugin,
    () => true,
    () => ({ success: true, empty: false, events: [], answer: "Gefunden." })
  );

  const request = calendarRequestFromMessage(
    "Wann hat Salt Geburtstag?",
    referenceDate
  );
  const result = await readDeviceCalendar(request);
  assert.equal(result.success, true);
  assert.equal(result.readOnly, true);
  assert.equal(result.destination, "Handy-Kalender");
  assert.deepEqual(calls[0], ["status"]);
  assert.equal(calls[1][0], "list");
  assert.equal(calls[1][1].limit, 50);
  assert.equal(calls[1][1].titleQuery, "salt");

  assert.match(phonePlugin, /MAX_CALENDAR_QUERY_LENGTH = 120/u);
  assert.match(phonePlugin, /call\.getString\("titleQuery", ""\)/u);
  assert.match(
    phonePlugin,
    /normalizedCalendarSearchText\(title\)[\s\S]*?\.contains\(titleQuery\)/u
  );
});

test("Text, Sprache und Gebärdensprache nutzen den Kalender-Leseweg", () => {
  const localHandler = sourceBetween(
    ui,
    "  window.handleSolHoloLocalAction = async",
    "  window.handleSolHoloRealtimeNoteTranscript = async"
  );
  const realtimeHandler = sourceBetween(
    ui,
    "  window.handleSolHoloRealtimeNoteTranscript = async",
    "  function getHeyHoSolPlugin"
  );
  assert.match(localHandler, /calendarReadRequestFromMessage\(noteMessage\)/u);
  assert.match(localHandler, /await readDeviceCalendar\(calendarReadRequest\)/u);
  assert.match(localHandler, /LOKALES_KALENDERLESEERGEBNIS/u);
  assert.ok(
    localHandler.indexOf("calendarReadRequestFromMessage(noteMessage)") <
      localHandler.indexOf("isShoppingListReadRequest(noteMessage)"),
    "Kalender- und Einkaufslistenfragen müssen getrennt ausgewertet werden"
  );
  assert.match(
    realtimeHandler,
    /calendarReadRequestFromMessage\(noteMessage\)[\s\S]*?handleSolHoloLocalAction/u
  );

  assert.match(html, /REALTIME_LOCAL_TOOL_NAMES[\s\S]*?"read_calendar"/u);
  assert.match(
    html,
    /toolCall\?\.name === "read_calendar"[\s\S]*?executeSolHoloCalendarReadTool/u
  );
  assert.match(
    server,
    /name:\s*"read_calendar"[\s\S]*?Gebärdensprache[\s\S]*?Verändert und speichert nichts/u
  );
  assert.match(
    server,
    /sicher erkannte Gebärdensprachfolge[\s\S]*?read_calendar/u
  );
});
