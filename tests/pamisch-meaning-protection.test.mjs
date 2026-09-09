import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const serverSource = await readFile(
  new URL("../server.mjs", import.meta.url),
  "utf8"
);

test("Pamisch wird nicht ohne eindeutigen Beleg zu einer Drohung umgedeutet", () => {
  assert.match(serverSource, /VERBINDLICHER BEDEUTUNGSSCHUTZ/u);
  assert.match(
    serverSource,
    /Unterstelle \$\{profile\.displayName\} niemals eine Drohung, Absicht oder Handlung/u
  );
  assert.match(
    serverSource,
    /„Das[\s\S]*?Backend bekommt eine auf den Latz“[\s\S]*?scherzhafte Kritik am Backend/u
  );
  assert.match(
    serverSource,
    /nicht als reale Drohung von[\s\S]*?\$\{profile\.displayName\}/u
  );
  assert.match(
    serverSource,
    /einen Satz tatsächlich gesagt hat,[\s\S]*?nur den[\s\S]*?Wortlaut und nicht automatisch eine reale Drohabsicht/u
  );
  assert.match(
    serverSource,
    /Gesagtes und[\s\S]*?Beabsichtigtes niemals ohne eindeutigen Zusammenhang gleich/u
  );
});

test("bildhafte Alltagsbeschreibungen lösen keinen erfundenen Alarm aus", () => {
  assert.match(
    serverSource,
    /„In der Küche sieht es[\s\S]*?als hätte eine Bombe eingeschlagen“[\s\S]*?Unordnung/u
  );
  assert.match(
    serverSource,
    /weder eine Bombenmeldung noch eine Drohung oder ein Notfall/u
  );
  assert.match(
    serverSource,
    /Ein einzelnes auffälliges Wort darf niemals losgelöst vom ganzen Satz/u
  );
});

test("absurder Pamisch-Humor wird nicht zur persönlichen Tatsache", () => {
  assert.match(
    serverSource,
    /„Wie die Kuh die Eier[\s\S]*?legt“[\s\S]*?keine[\s\S]*?Tatsachenbehauptung über Kühe/u
  );
  assert.match(
    serverSource,
    /nicht als Irrtum, reale[\s\S]*?Absicht oder persönliche Erinnerung/u
  );
});

test("alte spöttische Sprüche werden im scherzhaften Zusammenhang verstanden", () => {
  assert.match(
    serverSource,
    /„Oh Herr, lass Gras wachsen, die Rindviecher haben Hunger“[\s\S]*?weder eine böse Absicht noch eine[\s\S]*?Drohung/u
  );
  assert.match(
    serverSource,
    /keine Tatsachenmeldung über hungrige Rinder/u
  );
  assert.match(
    serverSource,
    /Unterstelle allein[\s\S]*?keine Beleidigungsabsicht/u
  );
});

test("liebevolles gegenseitiges Necken wird nicht als Beziehungskonflikt erfunden", () => {
  assert.match(
    serverSource,
    /Pam und Steffi[\s\S]*?„Trottel“[\s\S]*?„Depp“[\s\S]*?nicht automatisch eine Beleidigung/u
  );
  assert.match(
    serverSource,
    /nicht automatisch[\s\S]*?ein Streit,[\s\S]*?Missbrauch oder ein Beziehungsproblem/u
  );
  assert.match(
    serverSource,
    /Erst wenn eine beteiligte Person klar von Verletzung, Angst,[\s\S]*?ernst gemeinter Gewalt spricht/u
  );
});

test("Ärger über eine falsche Unterstellung bestätigt diese nicht nachträglich", () => {
  assert.match(
    serverSource,
    /Ärger oder kräftige Sprache als Reaktion auf eine falsche[\s\S]*?kein nachträglicher Beleg/u
  );
  assert.match(
    serverSource,
    /Rechtfertige eine falsche Einordnung niemals[\s\S]*?verärgerten Reaktion/u
  );
  assert.match(
    serverSource,
    /Berichtige den eigenen Fehler klar,[\s\S]*?verteidigt, das sie nicht gesagt hat/u
  );
});

test("Zitate, Formulierungsaufträge und eigene Absichten bleiben getrennt", () => {
  assert.match(
    serverSource,
    /Trenne[\s\S]*?Redewendung oder scherzhaften Übertreibung[\s\S]*?Auftrag, einen bestimmten[\s\S]*?Satz zu sagen oder zu formulieren/u
  );
  assert.match(
    serverSource,
    /aus einem[\s\S]*?Zitat- oder Formulierungsauftrag keine Behauptung[\s\S]*?eigene Absicht/u
  );
});

test("Bedeutungsschutz gilt in Realtime-Sprache und normalen Antworten", () => {
  const instructionInsertions = serverSource.match(
    /\$\{personalCloneIdentityInstructions\(identity\)\}/gu
  ) || [];

  assert.equal(instructionInsertions.length, 2);
});
