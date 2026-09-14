import {
  DEFAULT_IDENTITY_REGISTRY,
  MEMORY_DECISION,
  resolveCanonicalOwnerId,
  toSafeIdentityMemoryAuditEvent
} from "./identity-memory.mjs";
import {
  prepareDurableMemoryContent
} from "../www/human-holo-durable-memory.mjs";
import {
  PERSONAL_MEMORY_POLICY_VERSION,
  classifyPersonalMemoryContent,
  normalizeAutomaticMemoryCategories,
  normalizePersonalMemoryCategory,
  normalizePersonalMemoryPreferences
} from "./personal-memory-policy.mjs";

export const PERSONAL_MEMORY_DELETE_CONFIRMATION =
  "DIESE ERINNERUNG ENDGÜLTIG LÖSCHEN";

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

function safeMemoryId(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new IdentityMemoryStoreError("MEMORY_ID_INVALID");
  }
  return parsed;
}

function safeBeforeId(value) {
  if (value === undefined || value === null || value === "") return null;
  return safeMemoryId(value);
}

function cleanSourceModalities(values, fallback = "text") {
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    const modality = String(value ?? "")
      .normalize("NFKC")
      .trim()
      .toLocaleLowerCase("de-DE");
    if (
      /^[a-z][a-z0-9_-]{1,39}$/u.test(modality) &&
      !result.includes(modality)
    ) {
      result.push(modality);
    }
    if (result.length >= 16) break;
  }
  return result.length ? result : [fallback === "voice" ? "voice" : "text"];
}

function cleanCaptureMode(value) {
  return ["explicit", "automatic", "import"].includes(value)
    ? value
    : "explicit";
}

function publicPreferences(row = {}) {
  let autoCategories = row.auto_categories ?? row.autoCategories ?? [];
  if (typeof autoCategories === "string") {
    try {
      autoCategories = JSON.parse(autoCategories);
    } catch {
      autoCategories = [];
    }
  }
  return normalizePersonalMemoryPreferences({
    mode: row.memory_mode ?? row.mode,
    paused: row.paused,
    autoCategories,
    consentRecordedAt:
      row.consent_recorded_at ?? row.consentRecordedAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null
  });
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

  async function withTransaction(operation) {
    if (typeof database?.connect !== "function") {
      throw new IdentityMemoryStoreError("MEMORY_TRANSACTION_UNAVAILABLE");
    }
    const client = await database.connect();
    try {
      await client.query("BEGIN");
      const result = await operation(client.query.bind(client));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {}
      throw error;
    } finally {
      client.release();
    }
  }

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
        ALTER TABLE sol_identity_memory
        ADD COLUMN IF NOT EXISTS memory_category TEXT NOT NULL DEFAULT 'other'
      `);

      await query(`
        ALTER TABLE sol_identity_memory
        ADD COLUMN IF NOT EXISTS capture_mode TEXT NOT NULL DEFAULT 'explicit'
      `);

      await query(`
        ALTER TABLE sol_identity_memory
        ADD COLUMN IF NOT EXISTS source_modalities TEXT[] NOT NULL
          DEFAULT ARRAY['text']::TEXT[]
      `);

      await query(`
        ALTER TABLE sol_identity_memory
        ADD COLUMN IF NOT EXISTS supersedes_memory_id BIGINT
      `);

      await query(`
        ALTER TABLE sol_identity_memory
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      `);

      await query(`
        CREATE INDEX IF NOT EXISTS sol_identity_memory_owner_category_idx
        ON sol_identity_memory (
          canonical_owner_id,
          memory_category,
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

      await query(`
        CREATE TABLE IF NOT EXISTS sol_personal_memory_preferences (
          canonical_owner_id TEXT PRIMARY KEY,
          speaker_id TEXT NOT NULL,
          memory_mode TEXT NOT NULL DEFAULT 'confirmed_only'
            CHECK (memory_mode IN ('confirmed_only', 'personalized')),
          paused BOOLEAN NOT NULL DEFAULT FALSE,
          auto_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
          policy_version TEXT NOT NULL,
          consent_recorded_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
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

      const memoryCategory = normalizePersonalMemoryCategory(
        memory.category || classifyPersonalMemoryContent(preparedContent.content)
      );
      const captureMode = cleanCaptureMode(memory.captureMode);
      const sourceModalities = cleanSourceModalities(
        memory.sourceModalities,
        memory.sourceType
      );

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
            memory_category,
            capture_mode,
            source_modalities,
            legacy_source_table,
            legacy_source_id
          )
          VALUES (
            $1, $2, $3, $4, $5, TRUE, $6, $7,
            $8, $9, $10, $11, $12
          )
          ON CONFLICT DO NOTHING
          RETURNING
            id,
            canonical_owner_id,
            speaker_id,
            source_type,
            memory_category,
            capture_mode,
            source_modalities,
            confirmed_at,
            recall_status,
            updated_at,
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
          memoryCategory,
          captureMode,
          sourceModalities,
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
            memory_category,
            capture_mode,
            source_modalities,
            supersedes_memory_id,
            confirmed_by,
            confirmation_method,
            confirmed_at,
            recall_status,
            updated_at,
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
            memory_category,
            capture_mode,
            source_modalities,
            supersedes_memory_id,
            confirmed_at,
            recall_status,
            updated_at,
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
              confirmation_method,
              memory_category,
              capture_mode,
              source_modalities
            )
            SELECT
              $1,
              $2,
              'user',
              'text',
              incoming.content,
              TRUE,
              $2,
              'owner_batch_import',
              'other',
              'import',
              ARRAY['text']::TEXT[]
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

    async getPreferences({ ownerId, speakerId }) {
      const canonicalOwnerId = resolveOwnerAccess(
        ownerId,
        speakerId,
        registry
      );
      const result = await query(
        `
          SELECT
            memory_mode,
            paused,
            auto_categories,
            consent_recorded_at,
            updated_at
          FROM sol_personal_memory_preferences
          WHERE canonical_owner_id = $1
            AND speaker_id = $2
          LIMIT 1
        `,
        [canonicalOwnerId, speakerId]
      );
      return publicPreferences(result.rows[0]);
    },

    async updatePreferences({
      ownerId,
      speakerId,
      mode,
      paused = false,
      autoCategories = [],
      acknowledged = false
    }) {
      const canonicalOwnerId = resolveOwnerAccess(
        ownerId,
        speakerId,
        registry
      );
      if (acknowledged !== true) {
        throw new IdentityMemoryStoreError("MEMORY_PREFERENCES_ACKNOWLEDGEMENT_REQUIRED");
      }
      const preferences = normalizePersonalMemoryPreferences({
        mode,
        paused,
        autoCategories
      });
      const categories = normalizeAutomaticMemoryCategories(
        preferences.autoCategories
      );
      const result = await query(
        `
          INSERT INTO sol_personal_memory_preferences (
            canonical_owner_id,
            speaker_id,
            memory_mode,
            paused,
            auto_categories,
            policy_version,
            consent_recorded_at,
            updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5::jsonb, $6,
            CASE WHEN $3 = 'personalized' THEN NOW() ELSE NULL END,
            NOW()
          )
          ON CONFLICT (canonical_owner_id) DO UPDATE SET
            speaker_id = EXCLUDED.speaker_id,
            memory_mode = EXCLUDED.memory_mode,
            paused = EXCLUDED.paused,
            auto_categories = EXCLUDED.auto_categories,
            policy_version = EXCLUDED.policy_version,
            consent_recorded_at = CASE
              WHEN EXCLUDED.memory_mode = 'personalized'
                THEN COALESCE(
                  sol_personal_memory_preferences.consent_recorded_at,
                  NOW()
                )
              ELSE NULL
            END,
            updated_at = NOW()
          RETURNING
            memory_mode,
            paused,
            auto_categories,
            consent_recorded_at,
            updated_at
        `,
        [
          canonicalOwnerId,
          speakerId,
          preferences.mode,
          preferences.paused,
          JSON.stringify(categories),
          PERSONAL_MEMORY_POLICY_VERSION
        ]
      );
      return publicPreferences(result.rows[0]);
    },

    async listManageable({
      ownerId,
      speakerId,
      beforeId = null,
      limit = 50,
      searchText = "",
      includeBlocked = true
    }) {
      const canonicalOwnerId = resolveOwnerAccess(
        ownerId,
        speakerId,
        registry
      );
      const cursor = safeBeforeId(beforeId);
      const cleanSearchText = String(searchText ?? "").trim().slice(0, 240);
      const pageLimit = safeLimit(limit, 50);
      const result = await query(
        `
          SELECT
            id,
            source_type,
            content,
            memory_category,
            capture_mode,
            source_modalities,
            supersedes_memory_id,
            confirmed_at,
            recall_status,
            updated_at,
            created_at
          FROM sol_identity_memory
          WHERE canonical_owner_id = $1
            AND speaker_id = $2
            AND confirmed IS TRUE
            AND ($3::bigint IS NULL OR id < $3::bigint)
            AND ($4::boolean IS TRUE OR recall_status <> 'blocked')
            AND (
              $5::text = '' OR
              LOWER(content) LIKE LOWER('%' || $5::text || '%')
            )
          ORDER BY id DESC
          LIMIT $6
        `,
        [
          canonicalOwnerId,
          speakerId,
          cursor,
          includeBlocked === true,
          cleanSearchText,
          pageLimit + 1
        ]
      );
      const hasMore = result.rows.length > pageLimit;
      const rows = result.rows.slice(0, pageLimit);
      return {
        rows,
        hasMore,
        nextBeforeId: hasMore ? rows.at(-1)?.id ?? null : null
      };
    },

    async setRecallStatusById({ ownerId, speakerId, memoryId, status }) {
      const canonicalOwnerId = resolveOwnerAccess(
        ownerId,
        speakerId,
        registry
      );
      const id = safeMemoryId(memoryId);
      if (!["active", "background", "blocked"].includes(status)) {
        throw new IdentityMemoryStoreError("MEMORY_STATUS_INVALID");
      }
      const result = await query(
        `
          UPDATE sol_identity_memory
          SET recall_status = $4,
              updated_at = NOW()
          WHERE canonical_owner_id = $1
            AND speaker_id = $2
            AND id = $3
            AND confirmed IS TRUE
          RETURNING
            id,
            source_type,
            content,
            memory_category,
            capture_mode,
            source_modalities,
            supersedes_memory_id,
            confirmed_at,
            recall_status,
            updated_at,
            created_at
        `,
        [canonicalOwnerId, speakerId, id, status]
      );
      if (!result.rows[0]) {
        throw new IdentityMemoryStoreError("MEMORY_NOT_FOUND");
      }
      return result.rows[0];
    },

    async correctConfirmedById({
      ownerId,
      speakerId,
      memoryId,
      content,
      category
    }) {
      const canonicalOwnerId = resolveOwnerAccess(
        ownerId,
        speakerId,
        registry
      );
      const id = safeMemoryId(memoryId);
      const preparedContent = prepareDurableMemoryContent(content);
      const cleanContent = preparedContent.content.normalize("NFKC").trim();
      if (!cleanContent || cleanContent.length > 10_000) {
        throw new IdentityMemoryStoreError("MEMORY_CONTENT_INVALID");
      }

      return withTransaction(async transactionQuery => {
        const targetResult = await transactionQuery(
          `
            SELECT
              id,
              content,
              source_type,
              memory_category,
              source_modalities
            FROM sol_identity_memory
            WHERE canonical_owner_id = $1
              AND speaker_id = $2
              AND id = $3
              AND confirmed IS TRUE
            FOR UPDATE
          `,
          [canonicalOwnerId, speakerId, id]
        );
        const target = targetResult.rows[0];
        if (!target) {
          throw new IdentityMemoryStoreError("MEMORY_NOT_FOUND");
        }
        if (target.content === cleanContent) {
          throw new IdentityMemoryStoreError("MEMORY_CORRECTION_UNCHANGED");
        }

        const existingResult = await transactionQuery(
          `
            SELECT id
            FROM sol_identity_memory
            WHERE canonical_owner_id = $1
              AND speaker_id = $2
              AND confirmed IS TRUE
              AND id <> $4
              AND recall_status <> 'blocked'
              AND LOWER(content) = LOWER($3)
            ORDER BY id DESC
            LIMIT 1
          `,
          [canonicalOwnerId, speakerId, cleanContent, id]
        );

        await transactionQuery(
          `
            INSERT INTO sol_identity_memory_supersession (
              canonical_owner_id,
              speaker_id,
              content
            )
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
          `,
          [canonicalOwnerId, speakerId, target.content]
        );
        await transactionQuery(
          `
            UPDATE sol_identity_memory
            SET recall_status = 'blocked',
                updated_at = NOW()
            WHERE canonical_owner_id = $1
              AND speaker_id = $2
              AND id = $3
          `,
          [canonicalOwnerId, speakerId, id]
        );

        if (existingResult.rows[0]) {
          return {
            corrected: true,
            inserted: false,
            previousMemoryId: id,
            memoryId: existingResult.rows[0].id,
            content: cleanContent,
            secretRedacted: preparedContent.changed
          };
        }

        const memoryCategory = normalizePersonalMemoryCategory(
          category || target.memory_category || classifyPersonalMemoryContent(cleanContent)
        );
        const inserted = await transactionQuery(
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
              memory_category,
              capture_mode,
              source_modalities,
              supersedes_memory_id
            )
            VALUES (
              $1, $2, 'user', $3, $4, TRUE, $2,
              'owner_correction', $5, 'explicit', $6, $7
            )
            RETURNING
              id,
              source_type,
              content,
              memory_category,
              capture_mode,
              source_modalities,
              supersedes_memory_id,
              confirmed_at,
              recall_status,
              updated_at,
              created_at
          `,
          [
            canonicalOwnerId,
            speakerId,
            target.source_type,
            cleanContent,
            memoryCategory,
            cleanSourceModalities(
              target.source_modalities,
              target.source_type
            ),
            id
          ]
        );
        return {
          corrected: true,
          inserted: true,
          previousMemoryId: id,
          memory: inserted.rows[0],
          secretRedacted: preparedContent.changed
        };
      });
    },

    async deleteConfirmedById({
      ownerId,
      speakerId,
      memoryId,
      confirmation,
      understandIrreversible = false
    }) {
      const canonicalOwnerId = resolveOwnerAccess(
        ownerId,
        speakerId,
        registry
      );
      const id = safeMemoryId(memoryId);
      if (
        confirmation !== PERSONAL_MEMORY_DELETE_CONFIRMATION ||
        understandIrreversible !== true
      ) {
        throw new IdentityMemoryStoreError("MEMORY_DELETE_CONFIRMATION_REQUIRED");
      }

      return withTransaction(async transactionQuery => {
        const targetResult = await transactionQuery(
          `
            SELECT id, content
            FROM sol_identity_memory
            WHERE canonical_owner_id = $1
              AND speaker_id = $2
              AND id = $3
              AND confirmed IS TRUE
            FOR UPDATE
          `,
          [canonicalOwnerId, speakerId, id]
        );
        const target = targetResult.rows[0];
        if (!target) {
          throw new IdentityMemoryStoreError("MEMORY_NOT_FOUND");
        }

        await transactionQuery(
          `
            DELETE FROM sol_identity_memory_supersession
            WHERE canonical_owner_id = $1
              AND speaker_id = $2
              AND content = $3
          `,
          [canonicalOwnerId, speakerId, target.content]
        );
        const deleted = await transactionQuery(
          `
            DELETE FROM sol_identity_memory
            WHERE canonical_owner_id = $1
              AND speaker_id = $2
              AND id = $3
            RETURNING id
          `,
          [canonicalOwnerId, speakerId, id]
        );
        return {
          deleted: deleted.rowCount === 1,
          memoryId: id,
          structuredMemoryOnly: true,
          historicalConversationCopiesIncluded: false
        };
      });
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
