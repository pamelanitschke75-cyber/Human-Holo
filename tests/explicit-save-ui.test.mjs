import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const ui = fs.readFileSync(
  new URL("../www/sol-holo-ui.js", import.meta.url),
  "utf8"
);
const html = fs.readFileSync(
  new URL("../www/index.html", import.meta.url),
  "utf8"
);

function functionSource(name, nextName) {
  const start = ui.indexOf(`  function ${name}`);
  const end = ui.indexOf(`  function ${nextName}`, start + 1);
  assert.notEqual(start, -1, `Funktion fehlt: ${name}`);
  assert.notEqual(end, -1, `Endmarke fehlt: ${nextName}`);
  return ui.slice(start, end);
}

test("Speichern auf Zuruf ist als gemeinsame Alltagsfreigabe sichtbar", () => {
  const row = ui.match(
    /<button id="explicitSaveRow"[\s\S]*?<\/button>/u
  )?.[0];
  assert.ok(row, "Speichern-auf-Zuruf-Zeile fehlt");
  assert.match(row, /Alltagsworker · Speichern auf Zuruf/u);
  assert.match(row, /Echte Alltagsinhalte/u);
  assert.match(row, /serviceStatus connected">Aktiv ✅/u);
  assert.match(row, /data-open-view="notes"/u);

  const labRow = ui.match(
    /<button id="openClawAlltagPreviewRow"[\s\S]*?<\/button>/u
  )?.[0];
  assert.ok(labRow, "interne Sicherheitstest-Zeile fehlt");
  assert.match(labRow, /data-lab-only="true"/u);
  assert.match(labRow, /hidden/u);
});

test("explizite Speicheraufträge und benannte Listen werden lokal erkannt", () => {
  const source = [
    functionSource("normalizeNoteSearchText", "noteSecurityWarning"),
    functionSource("cleanExplicitSaveContent", "explicitListTitle"),
    functionSource("explicitListTitle", "savedContentCategory"),
    functionSource("savedContentCategory", "calendarWriteDestinationFromMessage"),
    functionSource("calendarWriteDestinationFromMessage", "liveWeatherRequestFromMessage"),
    functionSource("liveWeatherRequestFromMessage", "googleMapsDestinationFromMessage"),
    functionSource("googleMapsDestinationFromMessage", "explicitSaveRequestFromMessage"),
    functionSource("explicitSaveRequestFromMessage", "noteTitleFromText"),
    "return explicitSaveRequestFromMessage;"
  ].join("\n");
  const extract = new Function(source)();

  assert.deepEqual(
    extract("Sol, setze Salz auf die Einkaufsliste"),
    {
      category: "Einkaufsliste",
      content: "Salz",
      kind: "list-item",
      listTitle: "Einkaufsliste"
    }
  );
  for (const phrase of [
    "Bitte Milch in die Einkaufsliste",
    "Milch bitte in die Einkaufsliste",
    "In die Einkaufsliste: Milch"
  ]) {
    assert.deepEqual(
      extract(phrase),
      {
        category: "Einkaufsliste",
        content: "Milch",
        kind: "list-item",
        listTitle: "Einkaufsliste"
      },
      phrase
    );
  }

  assert.deepEqual(
    extract("Schwip schwap auf die einkaufsliste bittec"),
    {
      category: "Einkaufsliste",
      content: "Schwip schwap",
      kind: "list-item",
      listTitle: "Einkaufsliste"
    },
    "Ein vertipptes Schluss-Bitte darf den Sofortspeicher nicht umgehen"
  );

  assert.deepEqual(
    extract("Schwipp schwapp auf die Einkaufsliste, bitte"),
    {
      category: "Einkaufsliste",
      content: "Schwipp schwapp",
      kind: "list-item",
      listTitle: "Einkaufsliste"
    },
    "Ein automatisch gesetztes Komma vor Bitte muss sofort lokal speichern"
  );

  assert.deepEqual(
    extract("Bitte merke dir, dass der Airfryer später über HomeID eingerichtet wird."),
    {
      category: "Gespeicherter Inhalt",
      content: "der Airfryer später über HomeID eingerichtet wird",
      kind: "content"
    }
  );
  assert.equal(
    extract("Kannst du alles speichern?"),
    null,
    "Eine Frage darf nicht als Speicherauftrag gelten"
  );
  assert.equal(
    extract("Schreibe Salz in Samsung Notes"),
    null,
    "Ein ausdrücklich genanntes Samsung-Notes-Ziel bleibt beim Notes-Adapter"
  );
  assert.equal(
    extract("Trag morgen um 9 Uhr Zahnarzt in den Kalender ein"),
    null,
    "Ein Kalenderauftrag muss den echten Google-Calendar-Weg erreichen"
  );
  assert.equal(
    extract("Schreib für morgen bitte 13 Uhr auf, dass wir zu meinen Eltern fahren"),
    null,
    "Datum, Uhrzeit und Aufschreibauftrag müssen auch ohne das Wort Kalender erkannt werden"
  );
  assert.equal(
    extract("Notiere Zucker"),
    null,
    "Ein Notizauftrag muss den Notes-Adapter erreichen"
  );
});

test("Wichtiges zeigt Kalender, Einkaufsliste und Notizen als eigene Bereiche", () => {
  assert.match(
    ui,
    /id="homeImportantButton" class="humanHoloImportantCard"/u
  );
  assert.doesNotMatch(
    ui,
    /id="homeImportantButton" class="humanHoloImportantCard glassCard"/u
  );
  assert.match(ui, />Wichtiges</u);
  assert.match(ui, /id="calendarImportantSection"/u);
  assert.match(ui, /id="shoppingImportantSection"/u);
  assert.match(ui, /id="notesImportantSection"/u);
  assert.match(ui, /Kalender · Einkaufsliste · Notizen/u);
  assert.match(ui, /id="calendarAccessStatus"/u);
  assert.match(ui, /id="calendarAccessButton"/u);
  assert.match(ui, /id="calendarList"/u);
  assert.match(ui, /id="calendarCount"/u);
  assert.match(ui, /id="calendarRefreshButton"/u);
  assert.match(ui, /Zugriff freigeben/u);
  assert.match(ui, /requestCalendarAccess/u);
  assert.match(ui, /saveCalendarEvent/u);
  assert.match(ui, /listCalendarEvents/u);
  assert.match(ui, /Mit Human Holo verknüpft/u);
  assert.match(ui, /savedDirectly:\s*true/u);
  assert.match(ui, /accessRequired:\s*true/u);
  assert.doesNotMatch(ui, /openCalendarEvent/u);
});

test("Datum oder ‚morgen‘ plus Uhrzeit nimmt den Kalenderweg", () => {
  const source = [
    functionSource("normalizeNoteSearchText", "noteSecurityWarning"),
    functionSource("calendarWriteDestinationFromMessage", "liveWeatherRequestFromMessage"),
    "return calendarWriteDestinationFromMessage;"
  ].join("\n");
  const isCalendar = new Function(source)();

  assert.equal(isCalendar("Morgen 13 Uhr Zahnarzt"), true);
  assert.equal(
    isCalendar("Morgen um 10 Uhr Katzenklo sauber machen"),
    true
  );
  assert.equal(
    isCalendar("Notiere morgen um 10 Uhr Katzenklo sauber machen"),
    false,
    "‚Notiere‘ hat Vorrang und bleibt in Notizen"
  );
  assert.equal(
    isCalendar("Schreib auf: morgen um 10 Uhr Katzenklo sauber machen"),
    false,
    "‚Schreib auf‘ hat Vorrang und bleibt in Notizen"
  );
  assert.equal(
    isCalendar("Milch bitte in die Einkaufsliste"),
    false,
    "Eine ausdrücklich genannte Einkaufsliste bleibt getrennt"
  );
});

test("kurze Rückbezüge wie ‚Speichere das‘ verwenden den letzten Inhalt", () => {
  const referenceFunction = functionSource(
    "explicitSaveUsesPreviousMessage",
    "recentPlainUserMessageForSave"
  );
  const usesPrevious = new Function(
    `${referenceFunction}\nreturn explicitSaveUsesPreviousMessage;`
  )();

  assert.equal(
    usesPrevious({ kind: "content", content: "das" }),
    true
  );
  assert.equal(
    usesPrevious({ kind: "list-item", content: "das" }),
    false
  );
  assert.match(ui, /recentPlainUserMessageForSave\(\)/u);
  assert.match(ui, /Was genau soll ich dauerhaft speichern\?/u);
});

test("sensible Inhalte bleiben unabhängig vom Speicherbefehl gesperrt", () => {
  const warningSource = functionSource(
    "noteSecurityWarning",
    "cleanExplicitSaveContent"
  );
  const warning = new Function(
    `${warningSource}\nreturn noteSecurityWarning;`
  )();

  assert.match(warning("Mein Passwort ist Sommer123"), /speichert ihn.+nicht/su);
  assert.equal(warning("Salz und Haferdrink kaufen"), "");
});

test("Speicheraufträge nutzen die feste Holo-ID, lokale Persistenz und Geheimnissperre", () => {
  const appendFunction = functionSource(
    "appendPersonalListItem",
    "saveExplicitRequest"
  );
  const saveFunction = functionSource("saveExplicitRequest", "findPersonalNotes");
  const handler = ui.slice(
    ui.indexOf("window.handleSolHoloLocalAction = async"),
    ui.indexOf("window.handleSolHoloRealtimeNoteTranscript = async")
  );

  assert.match(appendFunction, /activePersonalOwner\(\)/u);
  assert.match(appendFunction, /noteSecurityWarning\(cleanItem\)/u);
  assert.match(appendFunction, /storePersonalNotes/u);
  assert.match(saveFunction, /createPersonalNote/u);
  assert.match(handler, /explicitSaveRequestFromMessage/u);
  assert.match(handler, /Auf Zuruf dauerhaft gespeichert/u);
  assert.match(ui, /Passwörter, PIN, TAN, Token und Schlüssel bleiben gesperrt/u);
});

test("Sprachaufträge verwenden denselben lokalen Speicherweg", () => {
  const realtimeHandler = ui.slice(
    ui.indexOf("window.handleSolHoloRealtimeNoteTranscript = async"),
    ui.indexOf("function getHeyHoSolPlugin")
  );
  assert.match(realtimeHandler, /handleSolHoloLocalAction/u);
  assert.match(html, /LOKALES_NOTIZERGEBNIS/u);
  assert.match(html, /LOKALES_NAVIGATIONSERGEBNIS/u);
  assert.match(html, /sol-holo-ui\.js\?v=73/u);
});

test("Google Maps versteht natürliche Text- und Sprachziele", () => {
  const source = [
    functionSource("stripHoloInvocation", "noteSecurityWarning"),
    functionSource("cleanExplicitSaveContent", "explicitListTitle"),
    functionSource("googleMapsDestinationFromMessage", "explicitSaveRequestFromMessage"),
    "return googleMapsDestinationFromMessage;"
  ].join("\n");
  const extract = new Function(source)();

  assert.equal(extract("Sol, navigiere mich zum Kölner Dom"), "Kölner Dom");
  assert.equal(extract("Öffne Google Maps"), "");
  assert.equal(extract("Wie komme ich nach Hamburg?"), "Hamburg");
  assert.equal(extract("Erzähl mir etwas über Hamburg"), null);
});
