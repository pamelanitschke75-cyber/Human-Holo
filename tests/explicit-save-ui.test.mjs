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
const css = fs.readFileSync(
  new URL("../www/sol-holo-ui.css", import.meta.url),
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

  for (const phrase of [
    "Maggi Einkaufsliste setzen",
    "Maggi Eikaufsliste setzen",
    "Schreib Maggi auf die Einkaufsliste",
    "Füge Maggi zur Einkaufsliste hinzu",
    "Füge der Einkaufsliste Maggi hinzu",
    "Hinterlege Maggi in der Einkaufsliste",
    "Maggi auf die Einkaufsliste setzen",
    "Maggi zur Einkaufsliste hinzufügen",
    "Maggi gehört auf die Einkaufsliste",
    "Maggi muss auf die Einkaufsliste",
    "Kannst du bitte Maggi auf die Einkaufsliste setzen?",
    "Schreib mer Maggi uff de Einkaufslischt",
    "Tu Maggi auf'n Einkaufszettel",
    "Maggi uf d Iichaufslischte tue",
    "Maggi op de Einkaufsliste"
  ]) {
    assert.deepEqual(
      extract(phrase),
      {
        category: "Einkaufsliste",
        content: "Maggi",
        kind: "list-item",
        listTitle: "Einkaufsliste"
      },
      phrase
    );
  }

  for (const phrase of [
    "Steht Maggi auf der Einkaufsliste?",
    "Hast du Maggi auf die Einkaufsliste gesetzt?",
    "Was steht auf meiner Einkaufsliste?",
    "Lies mir bitte die Einkaufsliste vor.",
    "Schreib Maggi nicht auf die Einkaufsliste"
  ]) {
    assert.equal(
      extract(phrase),
      null,
      `Kein Speicherauftrag: ${phrase}`
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

test("Einkaufsliste wird auf natürliche Fragen ownergebunden vorgelesen", () => {
  const requestSource = [
    functionSource("normalizeNoteSearchText", "stripHoloInvocation"),
    functionSource("stripHoloInvocation", "noteSecurityWarning"),
    functionSource("isShoppingListReadRequest", "currentShoppingListItems"),
    "return isShoppingListReadRequest;"
  ].join("\n");
  const isReadRequest = new Function(requestSource)();

  for (const phrase of [
    "Was steht auf meiner Einkaufsliste?",
    "Holo, was ist alles auf der Einkaufsliste?",
    "Sag mir bitte, was auf dem Einkaufszettel steht.",
    "Lies mir meine Einkaufsliste vor.",
    "Kannst du die Einkaufsliste anzeigen?",
    "Wie sieht meine Einkaufsliste aus?",
    "Welche Artikel stehen auf der Einkaufsliste?"
  ]) {
    assert.equal(isReadRequest(phrase), true, phrase);
  }

  for (const phrase of [
    "Maggi auf die Einkaufsliste setzen",
    "Schreib Salz auf die Einkaufsliste",
    "Was soll ich auf die Einkaufsliste setzen?",
    "Was steht heute im Kalender?"
  ]) {
    assert.equal(isReadRequest(phrase), false, phrase);
  }

  const readSource = [
    functionSource("normalizeNoteSearchText", "stripHoloInvocation"),
    functionSource("isShoppingListNote", "shoppingItemsFromNote"),
    functionSource("shoppingItemsFromNote", "isShoppingListReadRequest"),
    functionSource("currentShoppingListItems", "shoppingListAnswerFromItems"),
    functionSource("shoppingListAnswerFromItems", "readShoppingList"),
    functionSource("readShoppingList", "buildPersonalNoteCard"),
    "return readShoppingList();"
  ].join("\n");
  const readList = new Function(
    "personalNotes",
    "activePersonalOwner",
    readSource
  );

  const populated = readList(
    [
      {
        title: "Einkaufsliste",
        text: "• Maggi\n• Salz\n• Maggi"
      },
      {
        title: "Andere Notiz",
        text: "Darf nicht vorgelesen werden"
      }
    ],
    () => "pam-sol"
  );
  assert.deepEqual(populated.items, ["Maggi", "Salz"]);
  assert.equal(
    populated.answer,
    "Auf deiner Einkaufsliste stehen: Maggi und Salz."
  );
  assert.equal(populated.readOnly, true);

  const empty = readList([], () => "pam-sol");
  assert.equal(empty.answer, "Deine Einkaufsliste ist leer.");
  assert.equal(empty.empty, true);

  const blocked = readList([], () => "");
  assert.equal(blocked.success, false);
  assert.match(blocked.answer, /Holo-ID.+nicht verfügbar/u);
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
  assert.match(ui, /id="calendarDayInput" type="date"/u);
  assert.match(ui, /id="calendarTodayButton"/u);
  assert.match(ui, /Zugriff freigeben/u);
  assert.match(ui, /requestCalendarAccess/u);
  assert.match(ui, /saveCalendarEvent/u);
  assert.match(ui, /listCalendarEvents/u);
  assert.match(ui, /openLinkedCalendar/u);
  assert.match(ui, /plugin\.openCalendar/u);
  assert.match(ui, /Extern gespeichert/u);
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
    isCalendar("In die Notizen bitte. Morgen 10 Uhr Katzenklo sauber machen"),
    false,
    "Eine vorangestellte Zielangabe zu Notizen hat Vorrang vor Datum und Uhrzeit"
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
  assert.match(appendFunction, /executeShoppingListTool/u);
  assert.match(appendFunction, /executeSolHoloShoppingListTool/u);
  assert.match(handler, /explicitSaveRequestFromMessage/u);
  assert.match(handler, /Auf Zuruf dauerhaft gespeichert/u);
  assert.match(ui, /Passwörter, PIN, TAN, Token und Schlüssel bleiben gesperrt/u);
});

test("Sprachaufträge verwenden denselben lokalen Speicherweg", () => {
  const realtimeHandler = ui.slice(
    ui.indexOf("window.handleSolHoloRealtimeNoteTranscript = async"),
    ui.indexOf("function getHeyHoSolPlugin")
  );
  const sharedHandler = ui.slice(
    ui.indexOf("function handleShoppingListCommand"),
    ui.indexOf("window.handleSolHoloRealtimeNoteTranscript = async")
  );
  assert.match(sharedHandler, /explicitSaveRequestFromMessage\(message\)/u);
  assert.match(sharedHandler, /saveShoppingListItem\(shoppingItem\)/u);
  assert.match(sharedHandler, /window\.handleSolHoloLocalAction = async/u);
  assert.match(sharedHandler, /handleShoppingListCommand\(noteMessage\)/u);
  assert.match(sharedHandler, /isShoppingListReadRequest\(noteMessage\)/u);
  assert.match(sharedHandler, /readShoppingList\(\)/u);
  assert.match(sharedHandler, /LOKALES_EINKAUFSLISTENERGEBNIS/u);
  assert.ok(
    sharedHandler.indexOf("isShoppingListReadRequest(noteMessage)") <
      sharedHandler.indexOf("handleShoppingListCommand(noteMessage)"),
    "Lesefragen müssen vor einem möglichen Speicherauftrag ausgewertet werden"
  );
  assert.match(sharedHandler, /Unter Wichtiges · Einkaufsliste gespeichert/u);
  assert.match(realtimeHandler, /handleSolHoloLocalAction/u);
  assert.match(
    ui,
    /function executeShoppingListTool\([\s\S]*?saveShoppingListItem\(args\?\.item\)/u,
    "Sicher erkannte Gebärden müssen denselben Einkaufslistenspeicher verwenden"
  );
  assert.match(html, /LOKALES_NOTIZERGEBNIS/u);
  assert.match(html, /LOKALES_NAVIGATIONSERGEBNIS/u);
  assert.match(html, /sol-holo-ui\.js\?v=91/u);
});

test("ohne echten Artikel speichern Text Sprache und Gebärde kein Befehlswort", () => {
  const source = [
    functionSource("normalizeNoteSearchText", "noteSecurityWarning"),
    functionSource("cleanExplicitSaveContent", "explicitListTitle"),
    functionSource("explicitListTitle", "savedContentCategory"),
    functionSource("savedContentCategory", "calendarWriteDestinationFromMessage"),
    functionSource("calendarWriteDestinationFromMessage", "liveWeatherRequestFromMessage"),
    functionSource("liveWeatherRequestFromMessage", "googleMapsDestinationFromMessage"),
    functionSource("googleMapsDestinationFromMessage", "explicitSaveRequestFromMessage"),
    functionSource("explicitSaveRequestFromMessage", "noteTitleFromText"),
    functionSource("shoppingListItemFromValue", "saveShoppingListItem"),
    "return shoppingListItemFromValue;"
  ].join("\n");
  const itemFrom = new Function(source)();

  assert.equal(itemFrom("setzen"), "");
  assert.equal(itemFrom("Auf die Einkaufsliste setzen"), "");
  assert.equal(itemFrom("Einkaufsliste hinzufügen"), "");
  assert.equal(itemFrom("es"), "");
  assert.equal(itemFrom("Maggi"), "Maggi");
  assert.equal(itemFrom("Maggi auf die Einkaufsliste setzen"), "Maggi");
});

test("Füge hinzu und Schreib es auf die Liste verstehen einen sicheren Rückbezug", () => {
  const source = [
    functionSource("normalizeNoteSearchText", "noteSecurityWarning"),
    functionSource("stripHoloInvocation", "noteSecurityWarning"),
    functionSource("cleanExplicitSaveContent", "explicitListTitle"),
    functionSource("shoppingListShorthandFromMessage", "handleShoppingListCommand"),
    "return shoppingListShorthandFromMessage;"
  ].join("\n");
  const shorthand = new Function(source)();

  assert.deepEqual(
    shorthand("Füge Maggi hinzu"),
    { content: "Maggi", usesPrevious: false }
  );
  assert.deepEqual(
    shorthand("Schreib Maggi auf die Liste auch bitte"),
    { content: "Maggi", usesPrevious: false }
  );
  assert.deepEqual(
    shorthand("Füg es hinzu"),
    { content: "es", usesPrevious: true }
  );
  assert.deepEqual(
    shorthand("Schreib es auf die Liste auch bitte"),
    { content: "es", usesPrevious: true }
  );

  const handlerStart = ui.indexOf("  function handleShoppingListCommand");
  const handlerEnd = ui.indexOf(
    "  window.handleSolHoloShoppingListCommand",
    handlerStart
  );
  assert.notEqual(handlerStart, -1);
  assert.ok(handlerEnd > handlerStart);
  const handler = ui.slice(handlerStart, handlerEnd);
  assert.match(handler, /recentPlainUserMessageForSave\(\)/u);
  assert.match(handler, /saveShoppingListItem\(shoppingItem\)/u);
});

test("einzelne Einkaufsartikel werden über Text und Sprache eindeutig geändert oder gelöscht", () => {
  const source = [
    functionSource("normalizeNoteSearchText", "stripHoloInvocation"),
    functionSource("stripHoloInvocation", "noteSecurityWarning"),
    functionSource("cleanExplicitSaveContent", "explicitListTitle"),
    functionSource("isShoppingListNote", "shoppingItemsFromNote"),
    functionSource("shoppingItemsFromNote", "isShoppingListReadRequest"),
    functionSource("shoppingListEntries", "resolveShoppingListEntry"),
    functionSource("shoppingListMutationFromMessage", "handleShoppingListMutationCommand"),
    "return shoppingListMutationFromMessage;"
  ].join("\n");
  const parse = new Function("personalNotes", source)([
    {
      id: "shopping",
      title: "Einkaufsliste",
      text: "• Milch\n• Brot"
    }
  ]);

  assert.deepEqual(
    parse("Ändere Milch in Hafermilch"),
    {
      action: "update",
      currentItem: "Milch",
      replacement: "Hafermilch",
      listNamed: false
    }
  );
  assert.deepEqual(
    parse("Ersetze Milch auf der Einkaufsliste durch Hafermilch, bitte."),
    {
      action: "update",
      currentItem: "Milch",
      replacement: "Hafermilch",
      listNamed: true
    }
  );
  assert.deepEqual(
    parse("Lösche Milch von der Einkaufsliste."),
    { action: "delete", item: "Milch", listNamed: true }
  );
  assert.deepEqual(
    parse("Kannst du bitte Milch von meiner Einkaufsliste löschen?"),
    { action: "delete", item: "Milch", listNamed: true }
  );
  assert.deepEqual(
    parse("Brot aus dem Einkaufszettel entfernen"),
    { action: "delete", item: "Brot", listNamed: true }
  );
  assert.equal(
    parse("Ändere die Farbe in Blau"),
    null,
    "Eine allgemeine Änderung ohne vorhandenen Einkaufsartikel bleibt außerhalb der Liste"
  );
  assert.equal(
    parse("Lösche die Einkaufsliste"),
    null,
    "Die ganze Einkaufsliste darf nicht durch einen Sprachbefehl gelöscht werden"
  );
});

test("Ändern und Löschen speichern genau einen Einkaufsartikel lokal", () => {
  const source = [
    "let personalNotes = structuredClone(initialNotes);",
    "const activePersonalOwner = () => 'pam-sol';",
    "const explicitSaveRequestFromMessage = () => null;",
    "const noteSecurityWarning = () => '';",
    "const normalizeStoredNote = (note) => note;",
    "const renderPersonalNotes = () => {};",
    "const showToast = () => {};",
    "const storePersonalNotes = (nextNotes) => { personalNotes = nextNotes.filter(Boolean); return true; };",
    functionSource("normalizeNoteSearchText", "stripHoloInvocation"),
    functionSource("cleanExplicitSaveContent", "explicitListTitle"),
    functionSource("isShoppingListNote", "shoppingItemsFromNote"),
    functionSource("shoppingItemsFromNote", "isShoppingListReadRequest"),
    functionSource("currentShoppingListItems", "shoppingListAnswerFromItems"),
    functionSource("shoppingListItemFromValue", "saveShoppingListItem"),
    functionSource("shoppingListEntries", "resolveShoppingListEntry"),
    functionSource("resolveShoppingListEntry", "shoppingListResolutionFailure"),
    functionSource("shoppingListResolutionFailure", "updateShoppingListItem"),
    functionSource("updateShoppingListItem", "deleteShoppingListItem"),
    functionSource("deleteShoppingListItem", "executeShoppingListTool"),
    "return { updateShoppingListItem, deleteShoppingListItem, notes: () => structuredClone(personalNotes) };"
  ].join("\n");
  const createHarness = new Function("initialNotes", source);
  const harness = createHarness([
    {
      id: "shopping",
      title: "Einkaufsliste",
      text: "• Milch\n• Brot",
      source: "Auf Zuruf gespeichert",
      createdAt: 1,
      updatedAt: 1
    },
    {
      id: "other",
      title: "Andere Notiz",
      text: "Bleibt erhalten",
      createdAt: 1,
      updatedAt: 1
    }
  ]);

  const changed = harness.updateShoppingListItem("Milch", "Hafermilch");
  assert.equal(changed.success, true);
  assert.match(harness.notes()[0].text, /• Hafermilch\n• Brot/u);
  assert.equal(harness.notes()[1].text, "Bleibt erhalten");

  const duplicate = harness.updateShoppingListItem("Brot", "Hafermilch");
  assert.equal(duplicate.success, false);
  assert.equal(duplicate.duplicate, true);
  assert.match(harness.notes()[0].text, /• Hafermilch\n• Brot/u);

  const deleted = harness.deleteShoppingListItem("Brot");
  assert.equal(deleted.success, true);
  assert.equal(harness.notes()[0].text, "• Hafermilch");

  const emptied = harness.deleteShoppingListItem("Hafermilch");
  assert.equal(emptied.success, true);
  assert.equal(emptied.empty, true);
  assert.deepEqual(
    harness.notes().map((note) => note.id),
    ["other"],
    "Nur die nun leere Einkaufsliste wird entfernt; andere Notizen bleiben erhalten"
  );

  const ambiguousHarness = createHarness([
    { id: "one", title: "Einkaufsliste", text: "• Milch" },
    { id: "two", title: "Einkaufsliste", text: "• Milch" }
  ]);
  const ambiguous = ambiguousHarness.deleteShoppingListItem("Milch");
  assert.equal(ambiguous.success, false);
  assert.equal(ambiguous.ambiguous, true);
  assert.equal(ambiguousHarness.notes().length, 2);
});

test("Pam kann jeden Einkaufsartikel direkt ändern oder löschen", () => {
  const cardSource = functionSource(
    "buildPersonalNoteCard",
    "renderPersonalNotes"
  );
  const uiHandler = ui.slice(
    ui.indexOf("const handleShoppingItemAction"),
    ui.indexOf("const handlePersonalNoteAction")
  );

  assert.match(cardSource, /itemEditButton\.dataset\.shoppingAction = "edit"/u);
  assert.match(cardSource, /itemDeleteButton\.dataset\.shoppingAction = "delete"/u);
  assert.match(cardSource, /dataset\.itemIndex = String\(itemIndex\)/u);
  assert.match(cardSource, /textContent = "Ändern"/u);
  assert.match(cardSource, /textContent = "Löschen"/u);
  assert.match(uiHandler, /window\.prompt/u);
  assert.match(uiHandler, /window\.confirm/u);
  assert.match(uiHandler, /updateShoppingListItem/u);
  assert.match(uiHandler, /deleteShoppingListItem/u);
  assert.match(ui, /Gesamte Einkaufsliste wirklich leeren/u);
});

test("Wichtiges-Überschrift und leerer Kalenderkasten verwenden das freigegebene Holo-Glas", () => {
  assert.match(ui, /<h3>Alles Wichtige auf einen Blick<\/h3>/u);
  assert.match(ui, /<p>Kalender, Einkaufsliste und Notizen\.<\/p>/u);
  assert.doesNotMatch(ui, /Pams Wichtiges in Pam’s Holo/u);

  const calendarGlass = css.match(/#calendarEmpty\{[\s\S]*?\n\}/u)?.[0] || "";
  assert.match(calendarGlass, /border:1px solid/u);
  assert.match(calendarGlass, /linear-gradient/u);
  assert.match(calendarGlass, /rgba\(151,81,244,\.22\)/u);
  assert.match(calendarGlass, /rgba\(37,166,225,\.16\)/u);
  assert.match(calendarGlass, /backdrop-filter:blur\(18px\) saturate\(145%\)/u);
  assert.match(calendarGlass, /inset 0 1px 0 rgba\(255,255,255,\.22\)/u);
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
