import {
  DEFAULT_IDENTITY_REGISTRY,
  MEMORY_DECISION,
  resolveCanonicalOwnerId,
  toSafeIdentityMemoryAuditEvent
} from "./identity-memory.mjs";
import {
  prepareDurableMemoryContent
} from "../www/human-holo-durable-memory.mjs";

export class IdentityMemoryStoreError extends Error {
  constructor(code) {
    super("Die Identitaets-Gedaechtnisoperation wurde abgelehnt.");
    this.name = "IdentityMemoryStoreError";
    this.code = code;
  }
}

function asQueryFunction(database) {
  if (typeof database === "function") {
    return database;
  }

  if (typeof database?.query === "function") {
    return database.query.bind(database);
  }

  throw new TypeError("Eine PostgreSQL-query-Funktion ist erforderlich.");
}

function safeLimit(value, fallback = 50) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 1), 200);
}

function searchPatterns(value) {
  const normalized = String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("de-DE");
  const words = normalized.match(/[\p{L}\p{N}][\p{L}\p{N}_-]*/gu) ?? [];
  const unique = [];

  for (const word of words) {
    if (word.length < 2 || unique.includes(word)) {
      continue;
    }

    unique.push(word);

    if (unique.length >= 12) {
      break;
    }
  }

  return (unique.length > 0 ? unique : [normalized])
    .filter(Boolean)
    .map((term) => `%${term}%`);
}

function confirmedBatchValues(
  values,
  {
    maximumItems = 250,
    allowEmpty = false
  } = {}
) {
  if (!Array.isArray(values)) {
    throw new IdentityMemoryStoreError("IMPORT_BATCH_INVALID");
  }

  const unique = [];
  const seen = new Set();

  for (const value of values) {
    const content = prepareDurableMemoryContent(value)
      .content
      .normalize("NFKC")
      .trim();
    const key = content.toLocaleLowerCase("de-DE");

    if (!content || content.length > 10_000 || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(content);

    if (unique.length > maximumItems) {
      throw new IdentityMemoryStoreError("IMPORT_BATCH_TOO_LARGE");
    }
  }

  if (!allowEmpty && unique.length === 0) {
    throw new IdentityMemoryStoreError("IMPORT_BATCH_EMPTY");
  }

  return unique;
}

function resolveOwnerAccess(ownerId, speakerId, registry) {
  const canonicalOwnerId = resolveCanonicalOwnerId(ownerId, registry);
  const speakerIdentity = registry.resolveSpeaker(speakerId);

  if (!canonicalOwnerId) {
    throw new IdentityMemoryStoreError("UNKNOWN_OWNER");
  }

  if (
    !speakerIdentity ||
    speakerIdentity.canonicalOwnerId !== canonicalOwnerId
  ) {
    throw new IdentityMemoryStoreError("OWNER_ACCESS_MISMATCH");
  }

  return canonicalOwnerId;
}

async function emitSafeAudit(audit, decision) {
  if (typeof audit !== "function") {
    return;
  }

  // Niemals `decision` direkt an einen Logger weitergeben: Es kann den
  // privaten Erinnerungsinhalt enthalten.
  try {
    await audit(toSafeIdentityMemoryAuditEvent(decision));
  } catch {
    // Ein optionales technisches Audit darf weder den privaten Inhalt in eine
    // Fehlermeldung ziehen noch einen bereits erfolgreichen Write wiederholen.
  }
}

/**
 * PostgreSQL-Speicher fuer ausschliesslich bestaetigte persoenliche
 * Erinnerungen. Bestehende Tabellen werden weder geloescht noch umgeschrieben.
 */
export function createIdentityMemoryStore({
  database,
  registry = DEFAULT_IDENTITY_REGISTRY,
  audit
}) {
  const query = asQueryFunction(database);

  return Object.freeze({
    async initialize() {
      await query(`
        CREATE TABLE IF NOT EXISTS sol_identity_memory (
          id BIGSERIAL PRIMARY KEY,
          canonical_owner_id TEXT NOT NULL,
          speaker_id TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role = 'user'),
          source_type TEXT NOT NULL
            CHECK (source_type IN ('text', 'voice')),
          content TEXT NOT NULL
            CHECK (LENGTH(BTRIM(content)) > 0),
          confirmed BOOLEAN NOT NULL
            CHECK (confirmed IS TRUE),
          confirmed_by TEXT NOT NULL,
          confirmation_method TEXT NOT NULL,
          confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          recall_status TEXT NOT NULL DEFAULT 'active'
            CHECK (recall_status IN ('active', 'background', 'blocked')),
          legacy_source_table TEXT,
          legacy_source_id BIGINT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE (
            legacy_source_table,
            legacy_source_id,
            canonical_owner_id
          )
        )
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS sol_identity_memory_owner_recall_idx
        ON sol_identity_memory (
          canonical_owner_id,
          recall_status,
          id DESC
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS sol_identity_memory_supersession (
          id BIGSERIAL PRIMARY KEY,
          canonical_owner_id TEXT NOT NULL,
          speaker_id TEXT NOT NULL,
          content TEXT NOT NULL
            CHECK (LENGTH(BTRIM(content)) > 0),
          confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await query(`
        CREATE UNIQUE INDEX IF NOT EXISTS sol_identity_memory_supersession_uidx
        ON sol_identity_memory_supersession (
          canonical_owner_id,
          speaker_id,
          LOWER(content)
        )
      `);

      await query(`
        CREATE UNIQUE INDEX IF NOT EXISTS sol_identity_memory_owner_content_uidx
        ON sol_identity_memory (
          canonical_owner_id,
          LOWER(content)
        )
        WHERE confirmed IS TRUE
          AND recall_status <> 'blocked'
      `);
    },

    async saveConfirmed(decision, legacySource = null) {
      if (
        decision?.kind !== MEMORY_DECISION.PERSIST ||
        decision?.persist !== true ||
        decision?.memory?.confirmed !== true
      ) {
        await emitSafeAudit(audit, decision);
        throw new IdentityMemoryStoreError("WRITE_NOT_CONFIRMED");
      }

      const memory = decision.memory;
      const canonicalOwnerId = resolveCanonicalOwnerId(
        memory.ownerId,
        registry
      );

      if (!canonicalOwnerId) {
        await emitSafeAudit(audit, {
          kind: MEMORY_DECISION.REJECT,
          reason: "unknown_owner"
        });
        throw new IdentityMemoryStoreError("UNKNOWN_OWNER");
      }

      const ownerIdentity = registry.resolveOwner(canonicalOwnerId);

      if (
        !ownerIdentity ||
        ownerIdentity.speakerId !== memory.speakerId ||
        memory.confirmedBy !== memory.speakerId
      ) {
        await emitSafeAudit(audit, {
          kind: MEMORY_DECISION.IDENTITY_CONFLICT,
          reason: "owner_speaker_confirmation_mismatch"
        });
        throw new IdentityMemoryStoreError("IDENTITY_MISMATCH");
      }

      const preparedContent =
        prepareDurableMemoryContent(
          memory.content
        );

      if (!preparedContent.content.trim()) {
        await emitSafeAudit(audit, {
          kind: MEMORY_DECISION.REJECT,
          reason: "empty_after_secret_protection"
        });
        throw new IdentityMemoryStoreError("MEMORY_CONTENT_EMPTY");
      }

      const result = await query(
        `
          INSERT INTO sol_identity_memory (
            canonical_owner_id,
            speaker_id,
            role,
            source_type,
            content,
            confirmed,
            confirmed_by,
            confirmation_method,
            legacy_source_table,
            legacy_source_id
          )
          VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7, $8, $9)
          ON CONFLICT DO NOTHING
          RETURNING
            id,
            canonical_owner_id,
            speaker_id,
            source_type,
            confirmed_at,
            recall_status,
            created_at
        `,
        [
          canonicalOwnerId,
          memory.speakerId,
          memory.role,
          memory.sourceType,
          preparedContent.content,
          memory.confirmedBy,
          memory.confirmationMethod,
          legacySource?.table ?? null,
          legacySource?.id ?? null
        ]
      );

      await emitSafeAudit(audit, decision);
      return result.rows[0]
        ? {
            ...result.rows[0],
            content:
              preparedContent.content,
            secretRedacted:
              preparedContent.changed
          }
        : null;
    },

    async listConfirmed({ ownerId, speakerId, limit = 50 }) {
      const canonicalOwnerId = resolveOwnerAccess(
        ownerId,
        speakerId,
        registry
      );

      const result = await query(
        `
          SELECT
            id,
            canonical_owner_id,
            speaker_id,
            source_type,
            content,
            confirmed_by,
            confirmation_method,
            confirmed_at,
            recall_status,
            created_at
          FROM sol_identity_memory
          WHERE canonical_owner_id = $1
            AND confirmed IS TRUE
            AND recall_status <> 'blocked'
          ORDER BY id DESC
          LIMIT $2
        `,
        [canonicalOwnerId, safeLimit(limit)]
      );

      return result.rows;
    },

    async searchConfirmed({ ownerId, speakerId, searchText, limit = 20 }) {
      const canonicalOwnerId = resolveOwnerAccess(
        ownerId,
        speakerId,
        registry
      );

      const cleanSearchText = String(searchText ?? "").trim();

      if (!cleanSearchText) {
        return [];
      }

      const result = await query(
        `
          SELECT
            id,
            canonical_owner_id,
            speaker_id,
            source_type,
            content,
            confirmed_at,
            recall_status,
            created_at
          FROM sol_identity_memory
          WHERE canonical_owner_id = $1
            AND confirmed IS TRUE
            AND recall_status <> 'blocked'
            AND (
              to_tsvector('german', content)
                @@ websearch_to_tsquery('german', $2)
              OR LOWER(content) LIKE ANY($3::text[])
            )
          ORDER BY
            ts_rank_cd(
              to_tsvector('german', content),
              websearch_to_tsquery('german', $2)
            ) DESC,
            id DESC
          LIMIT $4
        `,
        [
          canonicalOwnerId,
          cleanSearchText,
          searchPatterns(cleanSearchText),
          safeLimit(limit, 20)
        ]
      );

      return result.rows;
    },

    async importConfirmedBatch({
      ownerId,
      speakerId,
      contents,
      supersededContents = []
    }) {
      const canonicalOwnerId = resolveOwnerAccess(
        ownerId,
        speakerId,
        registry
      );
      const confirmedContents = confirmedBatchValues(contents);
      const blockedContents = confirmedBatchValues(
        supersededContents,
        {
          maximumItems: 100,
          allowEmpty: true
        }
      );

      const result = await query(
        `
          WITH replacements(content) AS (
            SELECT DISTINCT BTRIM(value)
            FROM UNNEST($3::text[]) AS value
            WHERE LENGTH(BTRIM(value)) > 0
          ),
          superseded AS (
            INSERT INTO sol_identity_memory_supersession (
              canonical_owner_id,
              speaker_id,
              content
            )
            SELECT $1, $2, replacements.content
            FROM replacements
            ON CONFLICT DO NOTHING
            RETURNING id
          ),
          blocked AS (
            UPDATE sol_identity_memory
            SET recall_status = 'blocked'
            WHERE canonical_owner_id = $1
              AND speaker_id = $2
              AND confirmed IS TRUE
              AND recall_status <> 'blocked'
              AND content = ANY($3::text[])
            RETURNING id
          ),
          incoming(content) AS (
            SELECT DISTINCT BTRIM(value)
            FROM UNNEST($4::text[]) AS value
            WHERE LENGTH(BTRIM(value)) > 0
          ),
          inserted AS (
            INSERT INTO sol_identity_memory (
              canonical_owner_id,
              speaker_id,
              role,
              source_type,
              content,
              confirmed,
              confirmed_by,
              confirmation_method
            )
            SELECT
              $1,
              $2,
              'user',
              'text',
              incoming.content,
              TRUE,
              $2,
              'owner_batch_import'
            FROM incoming
            ON CONFLICT DO NOTHING
            RETURNING id
          )
          SELECT
            (SELECT COUNT(*)::int FROM blocked) AS blocked_count,
            (SELECT COUNT(*)::int FROM inserted) AS inserted_count
        `,
        [
          canonicalOwnerId,
          speakerId,
          blockedContents,
          confirmedContents
        ]
      );

      const row = result.rows[0] ?? {};
      return {
        accepted: confirmedContents.length,
        inserted: Number(row.inserted_count || 0),
        alreadyStored:
          confirmedContents.length - Number(row.inserted_count || 0),
        superseded: blockedContents.length
      };
    },

    async filterSupersededRows({ ownerId, speakerId, rows }) {
      const canonicalOwnerId = resolveOwnerAccess(
        ownerId,
        speakerId,
        registry
      );
      const suppliedRows = Array.isArray(rows) ? rows : [];
      const contentKeys = suppliedRows
        .map(row => String(row?.content || "").trim().toLocaleLowerCase("de-DE"))
        .filter(Boolean);

      if (contentKeys.length === 0) {
        return [];
      }

      const result = await query(
        `
          SELECT LOWER(content) AS content_key
          FROM sol_identity_memory_supersession
          WHERE canonical_owner_id = $1
            AND speaker_id = $2
            AND LOWER(content) = ANY($3::text[])
        `,
        [canonicalOwnerId, speakerId, contentKeys]
      );
      const superseded = new Set(
        result.rows.map(row => String(row.content_key || ""))
      );

      return suppliedRows.filter(
        row => !superseded.has(
          String(row?.content || "").trim().toLocaleLowerCase("de-DE")
        )
      );
    },

    async blockConfirmed({ ownerId, speakerId, searchText }) {
      const canonicalOwnerId = resolveOwnerAccess(
        ownerId,
        speakerId,
        registry
      );
      const cleanSearchText = String(searchText ?? "").trim();

      if (!cleanSearchText) {
        return 0;
      }

      const result = await query(
        `
          UPDATE sol_identity_memory
          SET recall_status = 'blocked'
          WHERE canonical_owner_id = $1
            AND speaker_id = $2
            AND confirmed IS TRUE
            AND recall_status <> 'blocked'
            AND LOWER(content) LIKE LOWER($3)
          RETURNING id
        `,
        [canonicalOwnerId, speakerId, `%${cleanSearchText}%`]
      );

      return result.rowCount ?? result.rows.length;
    }
  });
}
