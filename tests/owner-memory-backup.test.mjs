import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  OWNER_MEMORY_BACKUP_FORMAT,
  OWNER_MEMORY_BACKUP_VERSION,
  OwnerMemoryBackupError,
  buildOwnerMemoryBackup,
  createOwnerMemoryBackupStore,
  validateOwnerMemoryBackup
} from "../modules/owner-memory-backup.mjs";

const ownerId = "pam-sol";
const speakerId = "pam";
const cloneId = "pam-sol-001";

function sha256(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function sourceRows() {
  return {
    fulltime: [{
      role: "user",
      content: "Private Testangabe für das ownergebundene Gedächtnis.",
      source_event_id: "backup-test-event-0001:user",
      memory_event_id: "backup-test-event-0001",
      source_modalities: ["text"],
      event_occurred_on: "2026-09-11",
      content_sha256: sha256("Private Testangabe für das ownergebundene Gedächtnis."),
      created_at: "2026-09-12T20:00:00.000Z"
    }, {
      role: "assistant",
      content: "Privat gespeichert, nicht öffentlich dokumentiert.",
      source_event_id: null,
      memory_event_id: "backup-test-event-0001",
      source_modalities: ["text"],
      event_occurred_on: "2026-09-11",
      content_sha256: sha256("Privat gespeichert, nicht öffentlich dokumentiert."),
      created_at: "2026-09-12T20:00:01.000Z"
    }],
    confirmed: [{
      source_type: "text",
      content: "Private Erinnerung bleibt im ownergebundenen Gedächtnis.",
      confirmed_by: speakerId,
      confirmation_method: "owner_batch_import",
      confirmed_at: "2026-09-12T20:01:00.000Z",
      recall_status: "active",
      legacy_source_table: null,
      legacy_source_id: null,
      created_at: "2026-09-12T20:01:00.000Z"
    }],
    supersessions: [{
      content: "Eine ältere, ausdrücklich korrigierte Angabe.",
      confirmed_at: "2026-09-12T20:02:00.000Z"
    }],
    legacyConversation: [{
      role: "user",
      content: "Älterer persönlicher Testverlauf.",
      created_at: "2026-08-18T12:00:00.000Z"
    }],
    legacyLongTerm: [{
      content: "Älterer Langzeit-Testbestand.",
      created_at: "2026-08-18T12:01:00.000Z",
      updated_at: "2026-08-18T12:01:00.000Z"
    }]
  };
}

class FakeClient {
  constructor(rows = sourceRows()) {
    this.rows = rows;
    this.calls = [];
    this.released = false;
  }

  async query(sql, params = []) {
    const text = String(sql);
    this.calls.push({ sql: text, params });
    if (/FROM sol_fulltime_memory[\s\S]*ORDER BY id ASC/u.test(text)) {
      return { rows: this.rows.fulltime, rowCount: this.rows.fulltime.length };
    }
    if (/FROM sol_identity_memory[\s\S]*ORDER BY id ASC/u.test(text)) {
      return { rows: this.rows.confirmed, rowCount: this.rows.confirmed.length };
    }
    if (/FROM sol_identity_memory_supersession[\s\S]*ORDER BY id ASC/u.test(text)) {
      return { rows: this.rows.supersessions, rowCount: this.rows.supersessions.length };
    }
    if (/FROM sol_memory[\s\S]*ORDER BY id ASC/u.test(text)) {
      return { rows: this.rows.legacyConversation, rowCount: this.rows.legacyConversation.length };
    }
    if (/FROM sol_long_term_memory[\s\S]*ORDER BY id ASC/u.test(text)) {
      return { rows: this.rows.legacyLongTerm, rowCount: this.rows.legacyLongTerm.length };
    }
    if (/INSERT INTO/u.test(text)) {
      const encoded = params.at(-1);
      const accepted = typeof encoded === "string" ? JSON.parse(encoded).length : 0;
      return { rows: Array.from({ length: accepted }, (_, id) => ({ id })), rowCount: accepted };
    }
    return { rows: [], rowCount: 0 };
  }

  release() {
    this.released = true;
  }
}

class FakePool {
  constructor(client) {
    this.client = client;
  }

  query(...args) {
    return this.client.query(...args);
  }

  async connect() {
    return this.client;
  }
}

test("Export erfasst alle aktiven und älteren Gedächtnisbereiche vollständig", async () => {
  const client = new FakeClient();
  const store = createOwnerMemoryBackupStore({ database: new FakePool(client) });
  const backup = await store.exportSnapshot({ ownerId, speakerId, cloneId });

  assert.equal(backup.format, OWNER_MEMORY_BACKUP_FORMAT);
  assert.equal(backup.version, OWNER_MEMORY_BACKUP_VERSION);
  assert.equal(backup.ownerId, ownerId);
  assert.equal(backup.integrity.algorithm, "SHA-256");
  assert.deepEqual(backup.integrity.counts, {
    fulltimeHistory: 2,
    confirmedMemories: 1,
    supersessions: 1,
    legacyConversation: 1,
    legacyLongTerm: 1
  });
  assert.match(backup.integrity.contentDigest, /^[a-f0-9]{64}$/u);
  assert.ok(backup.data.fulltimeHistory.every(row => row.backupEntryId));
  assert.ok(backup.data.fulltimeHistory.every(row => row.eventOccurredOn === "2026-09-11"));
  assert.ok(backup.data.fulltimeHistory.every(row => /^[a-f0-9]{64}$/u.test(row.contentSha256)));
  assert.match(client.calls[0].sql, /REPEATABLE READ READ ONLY/u);
  assert.equal(client.calls.at(-1).sql, "COMMIT");
  assert.equal(client.released, true);
});

test("Manipulation und fremde Owner-Bindung werden abgewiesen", () => {
  const rows = sourceRows();
  const backup = buildOwnerMemoryBackup({
    ownerId,
    speakerId,
    cloneId,
    createdAt: "2026-09-12T20:03:00.000Z",
    fulltimeHistory: rows.fulltime,
    confirmedMemories: rows.confirmed,
    supersessions: rows.supersessions,
    legacyConversation: rows.legacyConversation,
    legacyLongTerm: rows.legacyLongTerm
  });

  assert.throws(
    () => validateOwnerMemoryBackup({
      ...backup,
      data: {
        ...backup.data,
        fulltimeHistory: [{
          ...backup.data.fulltimeHistory[0],
          content: "Verändert"
        }, ...backup.data.fulltimeHistory.slice(1)]
      }
    }),
    error =>
      error instanceof OwnerMemoryBackupError &&
      ["BACKUP_INTEGRITY_INVALID", "BACKUP_CONTENT_DIGEST_INVALID"].includes(
        error.code
      )
  );
  assert.throws(
    () => validateOwnerMemoryBackup(backup, { ownerId: "steffi-sol" }),
    error => error instanceof OwnerMemoryBackupError && error.code === "BACKUP_SCOPE_MISMATCH"
  );
});

test("Wiederherstellung erfolgt stückweise, transaktional, additiv und idempotent vorbereitet", async () => {
  const rows = sourceRows();
  const backup = buildOwnerMemoryBackup({
    ownerId,
    speakerId,
    cloneId,
    createdAt: "2026-09-12T20:04:00.000Z",
    fulltimeHistory: rows.fulltime,
    confirmedMemories: rows.confirmed,
    supersessions: rows.supersessions,
    legacyConversation: rows.legacyConversation,
    legacyLongTerm: rows.legacyLongTerm
  });
  const metadata = {
    format: backup.format,
    version: backup.version,
    ownerId: backup.ownerId,
    speakerId: backup.speakerId,
    cloneId: backup.cloneId,
    createdAt: backup.createdAt,
    integrity: backup.integrity
  };
  const client = new FakeClient();
  const store = createOwnerMemoryBackupStore({ database: new FakePool(client) });

  for (const category of [
    "fulltimeHistory",
    "confirmedMemories",
    "supersessions",
    "legacyConversation",
    "legacyLongTerm"
  ]) {
    const result = await store.restoreChunk({
      metadata,
      category,
      entries: backup.data[category],
      ownerId,
      speakerId,
      cloneId
    });
    assert.equal(result.accepted, backup.data[category].length);
    assert.equal(result.inserted, backup.data[category].length);
  }

  const sql = client.calls.map(call => call.sql).join("\n");
  assert.match(sql, /BEGIN ISOLATION LEVEL SERIALIZABLE/u);
  assert.match(sql, /ON CONFLICT DO NOTHING/u);
  assert.match(sql, /WHERE NOT EXISTS/u);
  assert.match(sql, /event_occurred_on/u);
  assert.match(sql, /content_sha256/u);
  assert.doesNotMatch(sql, /\b(?:DELETE|DROP|TRUNCATE)\b/iu);
  assert.equal((sql.match(/COMMIT/gu) || []).length, 5);
});

test("ältere Sicherungen ohne Ereignistag und Inhaltshash bleiben gültig", () => {
  const legacyFulltime = sourceRows().fulltime.map(row => {
    const {
      event_occurred_on: ignoredEventDate,
      content_sha256: ignoredDigest,
      ...legacyRow
    } = row;
    void ignoredEventDate;
    void ignoredDigest;
    return legacyRow;
  });
  const backup = buildOwnerMemoryBackup({
    ownerId,
    speakerId,
    cloneId,
    createdAt: "2026-09-12T20:05:00.000Z",
    fulltimeHistory: legacyFulltime
  });

  const validated = validateOwnerMemoryBackup(backup, {
    ownerId,
    speakerId,
    cloneId
  });
  assert.equal(validated.data.fulltimeHistory.length, 2);
  assert.equal("eventOccurredOn" in validated.data.fulltimeHistory[0], false);
  assert.equal("contentSha256" in validated.data.fulltimeHistory[0], false);
});
