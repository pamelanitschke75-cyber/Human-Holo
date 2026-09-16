import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateOwnerMetadataGate,
  OWNER_SCOPED_TABLES
} from "./owner-metadata-gate.mjs";

function emptySnapshot() {
  return {
    tables: OWNER_SCOPED_TABLES.map((tableName) => ({
      table_name: tableName,
      row_count: 0,
      owner_scope_count: 0,
      missing_owner_scope_count: 0
    })),
    global: {
      distinct_owner_scopes: 0,
      populated_owner_scoped_tables: 0
    }
  };
}

test("lässt vollständig zugeordnete Einzel-Owner-Metadaten passieren", () => {
  const snapshot = emptySnapshot();
  const memory = snapshot.tables.find((table) => table.table_name === "sol_fulltime_memory");
  memory.row_count = 3;
  memory.owner_scope_count = 1;
  snapshot.global.distinct_owner_scopes = 1;
  snapshot.global.populated_owner_scoped_tables = 1;

  const result = evaluateOwnerMetadataGate(snapshot);

  assert.equal(result.ok, true);
  assert.equal(result.migration_allowed, true);
  assert.equal(result.metadata_only, true);
  assert.deepEqual(result.blocker_codes, []);
});

test("blockiert den festgestellten Altbestand ohne Owner-Zuordnung", () => {
  const snapshot = emptySnapshot();
  const legacy = snapshot.tables.find((table) => table.table_name === "sol_memory");
  legacy.row_count = 2130;
  legacy.owner_scope_count = 1;
  legacy.missing_owner_scope_count = 1597;

  const tokens = snapshot.tables.find((table) => table.table_name === "sol_google_tokens");
  tokens.row_count = 2;
  tokens.owner_scope_count = 2;

  snapshot.global.distinct_owner_scopes = 2;
  snapshot.global.populated_owner_scoped_tables = 2;

  const result = evaluateOwnerMetadataGate(snapshot);

  assert.equal(result.ok, false);
  assert.equal(result.migration_allowed, false);
  assert.equal(result.missing_owner_scope_count, 1597);
  assert.equal(result.multi_scope_table_count, 1);
  assert.deepEqual(result.blocker_codes, [
    "UNSCOPED_ROWS_PRESENT",
    "OWNER_PARTITIONING_REQUIRED"
  ]);
});

test("weist Owner-IDs, Inhalte und Tokenwerte als Eingabe zurück", () => {
  for (const forbiddenField of ["owner_id", "content", "access_token"]) {
    const snapshot = emptySnapshot();
    snapshot.tables[0][forbiddenField] = "darf-nicht-eingelesen-werden";

    assert.throws(
      () => evaluateOwnerMetadataGate(snapshot),
      /nicht freigegebene Felder/u
    );
  }
});

test("stoppt bei einer fehlenden Tabelle", () => {
  const snapshot = emptySnapshot();
  snapshot.tables.pop();

  const result = evaluateOwnerMetadataGate(snapshot);

  assert.equal(result.ok, false);
  assert.equal(result.missing_table_count, 1);
  assert.deepEqual(result.blocker_codes, ["OWNER_METADATA_TABLES_MISSING"]);
});

test("stoppt bei widersprüchlichen oder unbekannten Metadaten", () => {
  const contradictory = emptySnapshot();
  contradictory.tables[0].row_count = 1;
  contradictory.tables[0].missing_owner_scope_count = 2;
  assert.throws(
    () => evaluateOwnerMetadataGate(contradictory),
    /Widersprüchliche Owner-Zahlen/u
  );

  const unknown = emptySnapshot();
  unknown.tables[0].table_name = "unbekannte_tabelle";
  assert.throws(
    () => evaluateOwnerMetadataGate(unknown),
    /unbekannte Tabelle/u
  );
});
