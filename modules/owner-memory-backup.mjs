import { createHash } from "node:crypto";

export const OWNER_MEMORY_BACKUP_FORMAT = "human-holo-owner-memory";
export const OWNER_MEMORY_BACKUP_VERSION = 1;
export const OWNER_MEMORY_BACKUP_MAX_BYTES = 64 * 1024 * 1024;
export const OWNER_MEMORY_BACKUP_CHUNK_MAX_ITEMS = 250;

const MAX_FULLTIME_ROWS = 200_000;
const MAX_CONFIRMED_ROWS = 50_000;
const MAX_SUPERSESSION_ROWS = 20_000;
const MAX_LEGACY_ROWS = 100_000;
const MAX_CONTENT_LENGTH = 200_000;
const OWNER_PATTERN = /^[a-z0-9][a-z0-9_-]{1,63}$/u;
const SPEAKER_PATTERN = /^[a-z0-9][a-z0-9_-]{1,63}$/u;
const EVENT_PATTERN = /^[a-zA-Z0-9:_-]{16,160}$/u;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/u;

export class OwnerMemoryBackupError extends Error {
  constructor(code) {
    super("Die ownergebundene Gedächtnissicherung wurde abgelehnt.");
    this.name = "OwnerMemoryBackupError";
    this.code = code;
  }
}

function cleanId(value, pattern, code) {
  const clean = String(value ?? "").trim();
  if (!pattern.test(clean)) throw new OwnerMemoryBackupError(code);
  return clean;
}

function cleanContent(value) {
  const content = String(value ?? "");
  if (!content.trim() || content.length > MAX_CONTENT_LENGTH) {
    throw new OwnerMemoryBackupError("BACKUP_CONTENT_INVALID");
  }
  return content;
}

function cleanOptionalText(value, maximumLength) {
  const clean = String(value ?? "").trim();
  return clean ? clean.slice(0, maximumLength) : null;
}

function cleanEventId(value) {
  const clean = String(value ?? "").trim();
  return EVENT_PATTERN.test(clean) ? clean : null;
}

function cleanTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new OwnerMemoryBackupError("BACKUP_TIMESTAMP_INVALID");
  }
  return date.toISOString();
}

function cleanOptionalDate(value) {
  if (value === undefined || value === null || value === "") return null;
  const clean = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(clean)) {
    throw new OwnerMemoryBackupError("BACKUP_EVENT_DATE_INVALID");
  }
  const date = new Date(`${clean}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== clean) {
    throw new OwnerMemoryBackupError("BACKUP_EVENT_DATE_INVALID");
  }
  return clean;
}

function cleanOptionalDigest(value) {
  if (value === undefined || value === null || value === "") return null;
  const clean = String(value).trim().toLocaleLowerCase("en-US");
  if (!DIGEST_PATTERN.test(clean)) {
    throw new OwnerMemoryBackupError("BACKUP_CONTENT_DIGEST_INVALID");
  }
  return clean;
}

function cleanPositiveInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function cleanModalities(value) {
  const supplied = Array.isArray(value) ? value : [];
  const result = [];
  for (const item of supplied) {
    const modality = String(item ?? "").trim().toLocaleLowerCase("de-DE");
    if (!/^[a-z][a-z0-9_-]{1,39}$/u.test(modality) || result.includes(modality)) {
      continue;
    }
    result.push(modality);
    if (result.length >= 16) break;
  }
  return result.length ? result : ["text"];
}

function stableEntryId(prefix, fields) {
  const digest = createHash("sha256")
    .update(JSON.stringify(fields), "utf8")
    .digest("hex");
  return `${prefix}-${digest}`;
}

function normalizeFulltimeRow(row, ownerId) {
  const role = row?.role === "assistant" ? "assistant" : row?.role === "user" ? "user" : "";
  if (!role) throw new OwnerMemoryBackupError("BACKUP_ROLE_INVALID");
  const content = cleanContent(row?.content);
  const createdAt = cleanTimestamp(row?.createdAt ?? row?.created_at);
  const sourceEventId = cleanEventId(row?.sourceEventId ?? row?.source_event_id);
  const memoryEventId = cleanEventId(row?.memoryEventId ?? row?.memory_event_id);
  const sourceModalities = cleanModalities(
    row?.sourceModalities ?? row?.source_modalities
  );
  const hasEventOccurredOn = Object.prototype.hasOwnProperty.call(
    row || {},
    "eventOccurredOn"
  ) || Object.prototype.hasOwnProperty.call(row || {}, "event_occurred_on");
  const hasContentSha256 = Object.prototype.hasOwnProperty.call(
    row || {},
    "contentSha256"
  ) || Object.prototype.hasOwnProperty.call(row || {}, "content_sha256");
  const eventOccurredOn = cleanOptionalDate(
    row?.eventOccurredOn ?? row?.event_occurred_on
  );
  const contentSha256 = cleanOptionalDigest(
    row?.contentSha256 ?? row?.content_sha256
  );
  if (
    contentSha256 &&
    createHash("sha256").update(content, "utf8").digest("hex") !== contentSha256
  ) {
    throw new OwnerMemoryBackupError("BACKUP_CONTENT_DIGEST_INVALID");
  }
  const stableFields = [
    ownerId,
    role,
    content,
    sourceEventId,
    memoryEventId,
    sourceModalities,
    createdAt
  ];
  if (hasEventOccurredOn || hasContentSha256) {
    stableFields.push(eventOccurredOn, contentSha256);
  }
  return {
    backupEntryId: stableEntryId("fulltime", stableFields),
    role,
    content,
    sourceEventId,
    memoryEventId,
    sourceModalities,
    ...(hasEventOccurredOn ? { eventOccurredOn } : {}),
    ...(hasContentSha256 ? { contentSha256 } : {}),
    createdAt
  };
}

function normalizeConfirmedRow(row, ownerId, speakerId) {
  const content = cleanContent(row?.content);
  const sourceType = row?.sourceType === "voice" || row?.source_type === "voice"
    ? "voice"
    : "text";
  const confirmedBy = String(
    row?.confirmedBy ?? row?.confirmed_by ?? speakerId
  ).trim();
  if (confirmedBy !== speakerId) {
    throw new OwnerMemoryBackupError("BACKUP_CONFIRMATION_OWNER_MISMATCH");
  }
  const confirmationMethod = cleanOptionalText(
    row?.confirmationMethod ?? row?.confirmation_method,
    120
  ) || "owner_backup_restore";
  const confirmedAt = cleanTimestamp(row?.confirmedAt ?? row?.confirmed_at);
  const createdAt = cleanTimestamp(row?.createdAt ?? row?.created_at);
  const recallCandidate = String(
    row?.recallStatus ?? row?.recall_status ?? "active"
  ).trim();
  const recallStatus = ["active", "background", "blocked"].includes(recallCandidate)
    ? recallCandidate
    : "blocked";
  const legacySourceTable = cleanOptionalText(
    row?.legacySourceTable ?? row?.legacy_source_table,
    120
  );
  const legacySourceId = cleanPositiveInteger(
    row?.legacySourceId ?? row?.legacy_source_id
  );
  return {
    backupEntryId: stableEntryId("confirmed", [
      ownerId,
      speakerId,
      content,
      sourceType,
      confirmedAt,
      recallStatus,
      createdAt
    ]),
    content,
    sourceType,
    confirmedBy,
    confirmationMethod,
    confirmedAt,
    recallStatus,
    legacySourceTable,
    legacySourceId,
    createdAt
  };
}

function normalizeSupersessionRow(row, ownerId, speakerId) {
  const content = cleanContent(row?.content);
  const confirmedAt = cleanTimestamp(row?.confirmedAt ?? row?.confirmed_at);
  return {
    backupEntryId: stableEntryId("supersession", [
      ownerId,
      speakerId,
      content,
      confirmedAt
    ]),
    content,
    confirmedAt
  };
}

function normalizeLegacyConversationRow(row, ownerId) {
  const role = row?.role === "assistant" ? "assistant" : row?.role === "user" ? "user" : "";
  if (!role) throw new OwnerMemoryBackupError("BACKUP_ROLE_INVALID");
  const content = cleanContent(row?.content);
  const createdAt = cleanTimestamp(row?.createdAt ?? row?.created_at);
  return {
    backupEntryId: stableEntryId("legacy-dialog", [
      ownerId,
      role,
      content,
      createdAt
    ]),
    role,
    content,
    createdAt
  };
}

function normalizeLegacyLongTermRow(row, ownerId) {
  const content = cleanContent(row?.content);
  const createdAt = cleanTimestamp(row?.createdAt ?? row?.created_at);
  const updatedAt = cleanTimestamp(
    row?.updatedAt ?? row?.updated_at ?? row?.createdAt ?? row?.created_at
  );
  return {
    backupEntryId: stableEntryId("legacy-longterm", [
      ownerId,
      content,
      createdAt,
      updatedAt
    ]),
    content,
    createdAt,
    updatedAt
  };
}

function normalizeRows(values, maximum, normalize, code) {
  if (!Array.isArray(values) || values.length > maximum) {
    throw new OwnerMemoryBackupError(code);
  }
  const result = [];
  const seen = new Set();
  for (const value of values) {
    const normalized = normalize(value);
    if (seen.has(normalized.backupEntryId)) continue;
    seen.add(normalized.backupEntryId);
    result.push(normalized);
  }
  return result;
}

function digestPayload(snapshot) {
  return {
    format: snapshot.format,
    version: snapshot.version,
    ownerId: snapshot.ownerId,
    speakerId: snapshot.speakerId,
    cloneId: snapshot.cloneId,
    createdAt: snapshot.createdAt,
    data: snapshot.data
  };
}

function contentDigest(snapshot) {
  return createHash("sha256")
    .update(JSON.stringify(digestPayload(snapshot)), "utf8")
    .digest("hex");
}

function snapshotCounts(data) {
  return {
    fulltimeHistory: data.fulltimeHistory.length,
    confirmedMemories: data.confirmedMemories.length,
    supersessions: data.supersessions.length,
    legacyConversation: data.legacyConversation.length,
    legacyLongTerm: data.legacyLongTerm.length
  };
}

function assertSize(snapshot) {
  if (Buffer.byteLength(JSON.stringify(snapshot), "utf8") > OWNER_MEMORY_BACKUP_MAX_BYTES) {
    throw new OwnerMemoryBackupError("BACKUP_TOO_LARGE");
  }
}

export function buildOwnerMemoryBackup({
  ownerId,
  speakerId,
  cloneId,
  createdAt = new Date(),
  fulltimeHistory = [],
  confirmedMemories = [],
  supersessions = [],
  legacyConversation = [],
  legacyLongTerm = []
}) {
  const cleanOwnerId = cleanId(ownerId, OWNER_PATTERN, "BACKUP_OWNER_INVALID");
  const cleanSpeakerId = cleanId(speakerId, SPEAKER_PATTERN, "BACKUP_SPEAKER_INVALID");
  const cleanCloneId = cleanId(cloneId, OWNER_PATTERN, "BACKUP_CLONE_INVALID");
  const data = {
    fulltimeHistory: normalizeRows(
      fulltimeHistory,
      MAX_FULLTIME_ROWS,
      row => normalizeFulltimeRow(row, cleanOwnerId),
      "BACKUP_FULLTIME_TOO_LARGE"
    ),
    confirmedMemories: normalizeRows(
      confirmedMemories,
      MAX_CONFIRMED_ROWS,
      row => normalizeConfirmedRow(row, cleanOwnerId, cleanSpeakerId),
      "BACKUP_CONFIRMED_TOO_LARGE"
    ),
    supersessions: normalizeRows(
      supersessions,
      MAX_SUPERSESSION_ROWS,
      row => normalizeSupersessionRow(row, cleanOwnerId, cleanSpeakerId),
      "BACKUP_SUPERSESSIONS_TOO_LARGE"
    ),
    legacyConversation: normalizeRows(
      legacyConversation,
      MAX_LEGACY_ROWS,
      row => normalizeLegacyConversationRow(row, cleanOwnerId),
      "BACKUP_LEGACY_TOO_LARGE"
    ),
    legacyLongTerm: normalizeRows(
      legacyLongTerm,
      MAX_LEGACY_ROWS,
      row => normalizeLegacyLongTermRow(row, cleanOwnerId),
      "BACKUP_LEGACY_TOO_LARGE"
    )
  };
  const snapshot = {
    format: OWNER_MEMORY_BACKUP_FORMAT,
    version: OWNER_MEMORY_BACKUP_VERSION,
    ownerId: cleanOwnerId,
    speakerId: cleanSpeakerId,
    cloneId: cleanCloneId,
    createdAt: cleanTimestamp(createdAt),
    data
  };
  const result = {
    ...snapshot,
    integrity: {
      algorithm: "SHA-256",
      counts: snapshotCounts(data),
      contentDigest: contentDigest(snapshot)
    }
  };
  assertSize(result);
  return result;
}

export function validateOwnerMemoryBackup(
  value,
  { ownerId, speakerId, cloneId } = {}
) {
  if (
    value?.format !== OWNER_MEMORY_BACKUP_FORMAT ||
    value?.version !== OWNER_MEMORY_BACKUP_VERSION ||
    value?.integrity?.algorithm !== "SHA-256" ||
    !DIGEST_PATTERN.test(String(value?.integrity?.contentDigest || ""))
  ) {
    throw new OwnerMemoryBackupError("BACKUP_FORMAT_INVALID");
  }
  const rebuilt = buildOwnerMemoryBackup({
    ownerId: value.ownerId,
    speakerId: value.speakerId,
    cloneId: value.cloneId,
    createdAt: value.createdAt,
    fulltimeHistory: value.data?.fulltimeHistory,
    confirmedMemories: value.data?.confirmedMemories,
    supersessions: value.data?.supersessions,
    legacyConversation: value.data?.legacyConversation || [],
    legacyLongTerm: value.data?.legacyLongTerm || []
  });
  if (
    (ownerId && rebuilt.ownerId !== ownerId) ||
    (speakerId && rebuilt.speakerId !== speakerId) ||
    (cloneId && rebuilt.cloneId !== cloneId)
  ) {
    throw new OwnerMemoryBackupError("BACKUP_SCOPE_MISMATCH");
  }
  if (
    rebuilt.integrity.contentDigest !== value.integrity.contentDigest ||
    JSON.stringify(rebuilt.integrity.counts) !== JSON.stringify(value.integrity.counts)
  ) {
    throw new OwnerMemoryBackupError("BACKUP_INTEGRITY_INVALID");
  }
  return rebuilt;
}

function queryFunction(database) {
  if (typeof database?.query !== "function") {
    throw new TypeError("Eine PostgreSQL-Verbindung ist erforderlich.");
  }
  return database.query.bind(database);
}

async function withTransaction(database, beginStatement, operation) {
  const client = typeof database?.connect === "function"
    ? await database.connect()
    : database;
  const query = queryFunction(client);
  try {
    await query(beginStatement);
    const result = await operation(query);
    await query("COMMIT");
    return result;
  } catch (error) {
    try {
      await query("ROLLBACK");
    } catch {
      // Die ursprüngliche Ursache bleibt maßgeblich.
    }
    throw error;
  } finally {
    client?.release?.();
  }
}

function normalizeChunkMetadata(value, expected) {
  const ownerId = cleanId(value?.ownerId, OWNER_PATTERN, "BACKUP_OWNER_INVALID");
  const speakerId = cleanId(value?.speakerId, SPEAKER_PATTERN, "BACKUP_SPEAKER_INVALID");
  const cloneId = cleanId(value?.cloneId, OWNER_PATTERN, "BACKUP_CLONE_INVALID");
  if (
    value?.format !== OWNER_MEMORY_BACKUP_FORMAT ||
    value?.version !== OWNER_MEMORY_BACKUP_VERSION ||
    value?.integrity?.algorithm !== "SHA-256" ||
    !DIGEST_PATTERN.test(String(value?.integrity?.contentDigest || "")) ||
    ownerId !== expected.ownerId ||
    speakerId !== expected.speakerId ||
    cloneId !== expected.cloneId
  ) {
    throw new OwnerMemoryBackupError("BACKUP_SCOPE_MISMATCH");
  }
  return { ownerId, speakerId, cloneId };
}

function normalizeBackupChunk({ metadata, category, entries }, expected) {
  const scope = normalizeChunkMetadata(metadata, expected);
  if (!Array.isArray(entries) || entries.length > OWNER_MEMORY_BACKUP_CHUNK_MAX_ITEMS) {
    throw new OwnerMemoryBackupError("BACKUP_CHUNK_INVALID");
  }
  if (category === "fulltimeHistory") {
    return {
      ...scope,
      category,
      entries: normalizeRows(
        entries,
        OWNER_MEMORY_BACKUP_CHUNK_MAX_ITEMS,
        row => normalizeFulltimeRow(row, scope.ownerId),
        "BACKUP_CHUNK_INVALID"
      )
    };
  }
  if (category === "confirmedMemories") {
    return {
      ...scope,
      category,
      entries: normalizeRows(
        entries,
        OWNER_MEMORY_BACKUP_CHUNK_MAX_ITEMS,
        row => normalizeConfirmedRow(row, scope.ownerId, scope.speakerId),
        "BACKUP_CHUNK_INVALID"
      )
    };
  }
  if (category === "supersessions") {
    return {
      ...scope,
      category,
      entries: normalizeRows(
        entries,
        OWNER_MEMORY_BACKUP_CHUNK_MAX_ITEMS,
        row => normalizeSupersessionRow(row, scope.ownerId, scope.speakerId),
        "BACKUP_CHUNK_INVALID"
      )
    };
  }
  if (
    (category === "legacyConversation" || category === "legacyLongTerm") &&
    (scope.ownerId !== "pam-sol" || scope.speakerId !== "pam")
  ) {
    throw new OwnerMemoryBackupError("BACKUP_LEGACY_OWNER_MISMATCH");
  }
  if (category === "legacyConversation") {
    return {
      ...scope,
      category,
      entries: normalizeRows(
        entries,
        OWNER_MEMORY_BACKUP_CHUNK_MAX_ITEMS,
        row => normalizeLegacyConversationRow(row, scope.ownerId),
        "BACKUP_CHUNK_INVALID"
      )
    };
  }
  if (category === "legacyLongTerm") {
    return {
      ...scope,
      category,
      entries: normalizeRows(
        entries,
        OWNER_MEMORY_BACKUP_CHUNK_MAX_ITEMS,
        row => normalizeLegacyLongTermRow(row, scope.ownerId),
        "BACKUP_CHUNK_INVALID"
      )
    };
  }
  throw new OwnerMemoryBackupError("BACKUP_CATEGORY_INVALID");
}

async function restoreFulltimeChunk(query, chunk) {
  const result = await query(
    `
      WITH incoming AS (
        SELECT
          item->>'backupEntryId' AS backup_entry_id,
          item->>'role' AS role,
          item->>'content' AS content,
          NULLIF(item->>'sourceEventId', '') AS source_event_id,
          NULLIF(item->>'memoryEventId', '') AS memory_event_id,
          ARRAY(
            SELECT jsonb_array_elements_text(
              COALESCE(item->'sourceModalities', '["text"]'::jsonb)
            )
          ) AS source_modalities,
          NULLIF(item->>'eventOccurredOn', '')::date AS event_occurred_on,
          NULLIF(item->>'contentSha256', '') AS content_sha256,
          (item->>'createdAt')::timestamptz AS created_at
        FROM jsonb_array_elements($2::jsonb) AS source(item)
      )
      INSERT INTO sol_fulltime_memory (
        clone_id,
        role,
        content,
        source_event_id,
        memory_event_id,
        source_modalities,
        event_occurred_on,
        content_sha256,
        created_at
      )
      SELECT
        $1,
        incoming.role,
        incoming.content,
        COALESCE(
          incoming.source_event_id,
          'human-holo-backup:' || incoming.backup_entry_id
        ),
        incoming.memory_event_id,
        incoming.source_modalities,
        COALESCE(
          incoming.event_occurred_on,
          (incoming.created_at AT TIME ZONE 'Europe/Berlin')::date
        ),
        incoming.content_sha256,
        incoming.created_at
      FROM incoming
      WHERE NOT EXISTS (
        SELECT 1
        FROM sol_fulltime_memory existing
        WHERE existing.clone_id = $1
          AND (
            existing.source_event_id = COALESCE(
              incoming.source_event_id,
              'human-holo-backup:' || incoming.backup_entry_id
            )
            OR (
              existing.role = incoming.role
              AND existing.content = incoming.content
              AND existing.created_at = incoming.created_at
            )
          )
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `,
    [chunk.cloneId, JSON.stringify(chunk.entries)]
  );
  return Number(result.rowCount ?? result.rows?.length ?? 0);
}

async function restoreConfirmedChunk(query, chunk) {
  const result = await query(
    `
      WITH incoming AS (
        SELECT
          item->>'content' AS content,
          item->>'sourceType' AS source_type,
          item->>'confirmedBy' AS confirmed_by,
          item->>'confirmationMethod' AS confirmation_method,
          (item->>'confirmedAt')::timestamptz AS confirmed_at,
          item->>'recallStatus' AS recall_status,
          NULLIF(item->>'legacySourceTable', '') AS legacy_source_table,
          NULLIF(item->>'legacySourceId', '')::bigint AS legacy_source_id,
          (item->>'createdAt')::timestamptz AS created_at
        FROM jsonb_array_elements($3::jsonb) AS source(item)
      )
      INSERT INTO sol_identity_memory (
        canonical_owner_id,
        speaker_id,
        role,
        source_type,
        content,
        confirmed,
        confirmed_by,
        confirmation_method,
        confirmed_at,
        recall_status,
        legacy_source_table,
        legacy_source_id,
        created_at
      )
      SELECT
        $1,
        $2,
        'user',
        incoming.source_type,
        incoming.content,
        TRUE,
        incoming.confirmed_by,
        incoming.confirmation_method,
        incoming.confirmed_at,
        incoming.recall_status,
        incoming.legacy_source_table,
        incoming.legacy_source_id,
        incoming.created_at
      FROM incoming
      WHERE NOT EXISTS (
        SELECT 1
        FROM sol_identity_memory existing
        WHERE existing.canonical_owner_id = $1
          AND existing.speaker_id = $2
          AND existing.content = incoming.content
          AND existing.confirmed_at = incoming.confirmed_at
          AND existing.recall_status = incoming.recall_status
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `,
    [chunk.ownerId, chunk.speakerId, JSON.stringify(chunk.entries)]
  );
  return Number(result.rowCount ?? result.rows?.length ?? 0);
}

async function restoreSupersessionChunk(query, chunk) {
  const result = await query(
    `
      WITH incoming AS (
        SELECT
          item->>'content' AS content,
          (item->>'confirmedAt')::timestamptz AS confirmed_at
        FROM jsonb_array_elements($3::jsonb) AS source(item)
      )
      INSERT INTO sol_identity_memory_supersession (
        canonical_owner_id,
        speaker_id,
        content,
        confirmed_at
      )
      SELECT $1, $2, incoming.content, incoming.confirmed_at
      FROM incoming
      ON CONFLICT DO NOTHING
      RETURNING id
    `,
    [chunk.ownerId, chunk.speakerId, JSON.stringify(chunk.entries)]
  );
  return Number(result.rowCount ?? result.rows?.length ?? 0);
}

async function restoreLegacyConversationChunk(query, chunk) {
  const result = await query(
    `
      WITH incoming AS (
        SELECT
          item->>'backupEntryId' AS backup_entry_id,
          item->>'role' AS role,
          item->>'content' AS content,
          (item->>'createdAt')::timestamptz AS created_at
        FROM jsonb_array_elements($1::jsonb) AS source(item)
      )
      INSERT INTO sol_memory (
        role,
        content,
        created_at,
        source_backup_id
      )
      SELECT
        incoming.role,
        incoming.content,
        incoming.created_at,
        incoming.backup_entry_id
      FROM incoming
      ON CONFLICT DO NOTHING
      RETURNING id
    `,
    [JSON.stringify(chunk.entries)]
  );
  return Number(result.rowCount ?? result.rows?.length ?? 0);
}

async function restoreLegacyLongTermChunk(query, chunk) {
  const result = await query(
    `
      WITH incoming AS (
        SELECT
          item->>'backupEntryId' AS backup_entry_id,
          item->>'content' AS content,
          (item->>'createdAt')::timestamptz AS created_at,
          (item->>'updatedAt')::timestamptz AS updated_at
        FROM jsonb_array_elements($1::jsonb) AS source(item)
      )
      INSERT INTO sol_long_term_memory (
        content,
        created_at,
        updated_at,
        source_backup_id
      )
      SELECT
        incoming.content,
        incoming.created_at,
        incoming.updated_at,
        incoming.backup_entry_id
      FROM incoming
      ON CONFLICT DO NOTHING
      RETURNING id
    `,
    [JSON.stringify(chunk.entries)]
  );
  return Number(result.rowCount ?? result.rows?.length ?? 0);
}

export function createOwnerMemoryBackupStore({ database }) {
  queryFunction(database);
  return Object.freeze({
    async exportSnapshot({ ownerId, speakerId, cloneId }) {
      return withTransaction(
        database,
        "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY",
        async query => {
          const fulltime = await query(
            `
              SELECT
                role,
                content,
                source_event_id,
                memory_event_id,
                source_modalities,
                event_occurred_on,
                content_sha256,
                created_at
              FROM sol_fulltime_memory
              WHERE clone_id = $1
              ORDER BY id ASC
            `,
            [cloneId]
          );
          const confirmed = await query(
            `
              SELECT
                source_type,
                content,
                confirmed_by,
                confirmation_method,
                confirmed_at,
                recall_status,
                legacy_source_table,
                legacy_source_id,
                created_at
              FROM sol_identity_memory
              WHERE canonical_owner_id = $1
                AND speaker_id = $2
                AND confirmed IS TRUE
              ORDER BY id ASC
            `,
            [ownerId, speakerId]
          );
          const supersessions = await query(
            `
              SELECT content, confirmed_at
              FROM sol_identity_memory_supersession
              WHERE canonical_owner_id = $1
                AND speaker_id = $2
              ORDER BY id ASC
            `,
            [ownerId, speakerId]
          );
          const legacyOwner = ownerId === "pam-sol" && speakerId === "pam";
          const legacyConversation = legacyOwner
            ? await query(
                `
                  SELECT role, content, created_at
                  FROM sol_memory
                  ORDER BY id ASC
                `
              )
            : { rows: [] };
          const legacyLongTerm = legacyOwner
            ? await query(
                `
                  SELECT content, created_at, updated_at
                  FROM sol_long_term_memory
                  ORDER BY id ASC
                `
              )
            : { rows: [] };
          return buildOwnerMemoryBackup({
            ownerId,
            speakerId,
            cloneId,
            fulltimeHistory: fulltime.rows,
            confirmedMemories: confirmed.rows,
            supersessions: supersessions.rows,
            legacyConversation: legacyConversation.rows,
            legacyLongTerm: legacyLongTerm.rows
          });
        }
      );
    },

    async restoreChunk({ metadata, category, entries, ownerId, speakerId, cloneId }) {
      const chunk = normalizeBackupChunk(
        { metadata, category, entries },
        { ownerId, speakerId, cloneId }
      );
      return withTransaction(
        database,
        "BEGIN ISOLATION LEVEL SERIALIZABLE",
        async query => {
          let inserted;
          if (chunk.category === "fulltimeHistory") {
            inserted = await restoreFulltimeChunk(query, chunk);
          } else if (chunk.category === "confirmedMemories") {
            inserted = await restoreConfirmedChunk(query, chunk);
          } else if (chunk.category === "supersessions") {
            inserted = await restoreSupersessionChunk(query, chunk);
          } else if (chunk.category === "legacyConversation") {
            inserted = await restoreLegacyConversationChunk(query, chunk);
          } else {
            inserted = await restoreLegacyLongTermChunk(query, chunk);
          }
          return {
            category: chunk.category,
            accepted: chunk.entries.length,
            inserted,
            alreadyStored: chunk.entries.length - inserted
          };
        }
      );
    }
  });
}
