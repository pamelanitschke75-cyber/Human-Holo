import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const ui = fs.readFileSync(
  new URL("../www/sol-holo-ui.js", import.meta.url),
  "utf8"
);
const phonePlugin = fs.readFileSync(
  new URL("../android-native/PhoneContactsPlugin.java", import.meta.url),
  "utf8"
);

function sourceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Startmarke fehlt: ${startMarker}`);
  assert.notEqual(end, -1, `Endmarke fehlt: ${endMarker}`);
  return source.slice(start, end);
}

const hidesSamsungBirthday = new Function(
  `${sourceBetween(
    ui,
    "function normalizeNoteSearchText",
    "function stripHoloInvocation"
  )}\n${sourceBetween(
    ui,
    "function isHiddenSamsungBirthdayEvent",
    "function localCalendarDayValue"
  )}\nreturn isHiddenSamsungBirthdayEvent;`
)();

test("Samsung-Geburtstage bleiben extern und werden in Holo ausgeblendet", () => {
  assert.equal(
    hidesSamsungBirthday({
      calendarName: "Samsung Calendar",
      title: "Salt – Geburtstag"
    }),
    true
  );
  assert.equal(
    hidesSamsungBirthday({
      calendarName: "Samsung Kalender",
      title: "Erna – Geburtstag"
    }),
    true
  );
  assert.equal(
    hidesSamsungBirthday({
      calendarName: "Samsung Calendar",
      title: "Zahnarzt"
    }),
    false
  );
  assert.equal(
    hidesSamsungBirthday({
      calendarName: "Google Kalender",
      title: "Geburtstag gemeinsam feiern"
    }),
    false
  );
  assert.match(
    ui,
    /\.filter\(\(event\) => !isHiddenSamsungBirthdayEvent\(event\)\)/u
  );
});

test("der verknüpfte Kalenderknopf öffnet den Handy-Kalender", () => {
  assert.match(ui, /"Kalender öffnen"/u);
  assert.match(ui, /plugin\.openCalendarApp\(\{/u);
  assert.match(
    ui,
    /timeMillis: selectedCalendarDayStart\(\)\.getTime\(\)/u
  );
  assert.doesNotMatch(
    ui,
    /button\.disabled = Boolean\(granted\)/u
  );
  assert.match(ui, /button\.dataset\.calendarAction = granted/u);
  assert.match(ui, /granted \? "Handy-Kalender öffnen"/u);
  assert.match(phonePlugin, /public void openCalendarApp\(PluginCall call\)/u);
  assert.match(phonePlugin, /Intent\.CATEGORY_APP_CALENDAR/u);
  assert.match(phonePlugin, /com\.samsung\.android\.calendar/u);
  assert.match(phonePlugin, /result\.put\("opensExternalApp", true\)/u);
});
