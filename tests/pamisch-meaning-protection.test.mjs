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
