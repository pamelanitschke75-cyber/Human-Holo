const OWNER_SCOPED_TABLES = Object.freeze([
  "human_holo_animal_profile_photo",
  "human_holo_single_call_proof",
  "human_holo_voice_profiles",
  "sol_calendar_actions",
  "sol_fulltime_memory",
  "sol_google_tokens",
  "sol_identity_memory",
  "sol_identity_memory_supersession",
  "sol_long_term_memory",
  "sol_memory",
  "sol_notes",
  "sol_smartthings_allowed_devices",
  "sol_smartthings_tokens",
  "sol_trusted_app_devices"
]);

const ALLOWED_TABLE_FIELDS = new Set([
  "table_name",
  "row_count",
  "owner_scope_count",
  "missing_owner_scope_count"
]);

const ALLOWED_GLOBAL_FIELDS = new Set([
  "distinct_owner_scopes",
  "populated_owner_scoped_tables"
]);

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} muss ein Objekt sein.`);
  }
}

function assertAllowedFields(value, allowed, label) {
  const unexpected = Object.keys(value).filter((field) => !allowed.has(field));
  if (unexpected.length > 0) {
    throw new Error(
      `${label} enthält nicht freigegebene Felder: ${unexpected.join(", ")}.`
    );
  }
}

function readCount(value, label) {
  const count = typeof value === "string" && /^\d+$/u.test(value)
    ? Number(value)
    : value;

  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error(`${label} muss eine nichtnegative ganze Zahl sein.`);
  }
  return count;
}

export function evaluateOwnerMetadataGate(snapshot) {
  assertPlainObject(snapshot, "Owner-Metadaten-Snapshot");
  assertAllowedFields(snapshot, new Set(["tables", "global"]), "Owner-Metadaten-Snapshot");

  if (!Array.isArray(snapshot.tables)) {
    throw new Error("Owner-Metadaten-Snapshot.tables muss eine Liste sein.");
  }
  assertPlainObject(snapshot.global, "Owner-Metadaten-Snapshot.global");
  assertAllowedFields(snapshot.global, ALLOWED_GLOBAL_FIELDS, "Owner-Metadaten-Snapshot.global");

  const allowedTables = new Set(OWNER_SCOPED_TABLES);
  const seenTables = new Set();
  let totalRows = 0;
  let unscopedRows = 0;
  let multiScopeTables = 0;

  for (const table of snapshot.tables) {
    assertPlainObject(table, "Owner-Tabellenmetadaten");
    assertAllowedFields(table, ALLOWED_TABLE_FIELDS, "Owner-Tabellenmetadaten");

    if (typeof table.table_name !== "string" || !allowedTables.has(table.table_name)) {
      throw new Error("Owner-Tabellenmetadaten enthalten eine unbekannte Tabelle.");
    }
    if (seenTables.has(table.table_name)) {
      throw new Error(`Owner-Tabelle doppelt vorhanden: ${table.table_name}.`);
    }
    seenTables.add(table.table_name);

    const rowCount = readCount(table.row_count, `${table.table_name}.row_count`);
    const ownerScopeCount = readCount(
      table.owner_scope_count,
      `${table.table_name}.owner_scope_count`
    );
    const missingOwnerScopeCount = readCount(
      table.missing_owner_scope_count,
      `${table.table_name}.missing_owner_scope_count`
    );

    if (ownerScopeCount > rowCount || missingOwnerScopeCount > rowCount) {
      throw new Error(`Widersprüchliche Owner-Zahlen für ${table.table_name}.`);
    }

    totalRows += rowCount;
    unscopedRows += missingOwnerScopeCount;
    if (ownerScopeCount > 1) multiScopeTables += 1;
  }

  const missingTables = OWNER_SCOPED_TABLES.filter((table) => !seenTables.has(table));
  const distinctOwnerScopes = readCount(
    snapshot.global.distinct_owner_scopes,
    "global.distinct_owner_scopes"
  );
  const populatedOwnerScopedTables = readCount(
    snapshot.global.populated_owner_scoped_tables,
    "global.populated_owner_scoped_tables"
  );

  if (populatedOwnerScopedTables > OWNER_SCOPED_TABLES.length) {
    throw new Error("Widersprüchliche Anzahl befüllter Owner-Tabellen.");
  }

  const blockerCodes = [];
  if (missingTables.length > 0) blockerCodes.push("OWNER_METADATA_TABLES_MISSING");
  if (unscopedRows > 0) blockerCodes.push("UNSCOPED_ROWS_PRESENT");
  if (distinctOwnerScopes > 1 || multiScopeTables > 0) {
    blockerCodes.push("OWNER_PARTITIONING_REQUIRED");
  }

  return Object.freeze({
    ok: blockerCodes.length === 0,
    migration_allowed: blockerCodes.length === 0,
    metadata_only: true,
    table_count: snapshot.tables.length,
    total_row_count: totalRows,
    missing_owner_scope_count: unscopedRows,
    distinct_owner_scope_count: distinctOwnerScopes,
    multi_scope_table_count: multiScopeTables,
    missing_table_count: missingTables.length,
    blocker_codes: Object.freeze(blockerCodes)
  });
}

export { OWNER_SCOPED_TABLES };
