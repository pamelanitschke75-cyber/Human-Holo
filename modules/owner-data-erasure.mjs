export const OWNER_DATA_ERASURE_CONFIRMATION =
  "MEINE HUMAN HOLO DATEN ENDGÜLTIG LÖSCHEN";
export const OWNER_DATA_ERASURE_VERSION = "2026-09-14-v1";

const OWNER_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/u;
const SPEAKER_PATTERN = /^[a-z0-9][a-z0-9_-]{1,63}$/u;

const scopedTargets = Object.freeze([
  ["sol_fulltime_memory", "clone_id", "clone"],
  ["sol_google_tokens", "clone_id", "clone"],
  ["sol_smartthings_tokens", "clone_id", "clone"],
  ["sol_smartthings_allowed_devices", "clone_id", "clone"],
  ["sol_calendar_actions", "clone_id", "clone"],
  ["sol_identity_memory", "canonical_owner_id", "owner"],
  ["sol_identity_memory_supersession", "canonical_owner_id", "owner"],
  ["sol_personal_memory_preferences", "canonical_owner_id", "owner"],
  ["human_holo_voice_profiles", "owner_id", "owner"],
  ["human_holo_single_call_proof", "owner_id", "owner"],
  ["human_holo_animal_profile_photo", "owner_id", "owner"],
  ["sol_trusted_app_devices", "owner_id", "owner"]
]);

const legacyPamOnlyTargets = Object.freeze([
  "sol_memory",
  "sol_long_term_memory"
]);

function requiredIdentity(ownerId, speakerId, cloneId) {
  const owner = String(ownerId || "").trim();
  const speaker = String(speakerId || "").trim();
  const clone = String(cloneId || "").trim();
  if (
    !OWNER_PATTERN.test(owner) ||
    !SPEAKER_PATTERN.test(speaker) ||
    clone !== `clone-${owner}`
  ) {
    throw new Error("OWNER_DATA_ERASURE_SCOPE_INVALID");
  }
  return { ownerId: owner, speakerId: speaker, cloneId: clone };
}

async function countTarget(query, table, column, value) {
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM ${table} WHERE ${column} = $1`,
    [value]
  );
  return Number(result.rows?.[0]?.count || 0);
}

async function countLegacyTarget(query, table) {
  const result = await query(`SELECT COUNT(*)::int AS count FROM ${table}`);
  return Number(result.rows?.[0]?.count || 0);
}

async function buildCounts(query, identity) {
  const counts = {};
  for (const [table, column, scope] of scopedTargets) {
    counts[table] = await countTarget(
      query,
      table,
      column,
      scope === "clone" ? identity.cloneId : identity.ownerId
    );
  }
  if (identity.ownerId === "pam-sol" && identity.speakerId === "pam") {
    for (const table of legacyPamOnlyTargets) {
      counts[table] = await countLegacyTarget(query, table);
    }
  }
  return counts;
}

function summarizeCounts(counts) {
  return Object.values(counts).reduce(
    (sum, count) => sum + Number(count || 0),
    0
  );
}

export function createOwnerDataErasureService({ database }) {
  if (!database || typeof database.query !== "function") {
    throw new TypeError("Owner data erasure requires a database.");
  }

  async function preview({ ownerId, speakerId, cloneId }) {
    const identity = requiredIdentity(ownerId, speakerId, cloneId);
    const counts = await buildCounts(
      database.query.bind(database),
      identity
    );
    return {
      version: OWNER_DATA_ERASURE_VERSION,
      ownerId: identity.ownerId,
      speakerId: identity.speakerId,
      counts,
      totalRows: summarizeCounts(counts),
      includesLegacyPamTables:
        identity.ownerId === "pam-sol" && identity.speakerId === "pam",
      irreversible: true,
      localDeviceDataIncluded: false,
      externalProviderCopiesIncluded: false
    };
  }

  async function erase({
    ownerId,
    speakerId,
    cloneId,
    confirmation,
    understandIrreversible = false
  }) {
    const identity = requiredIdentity(ownerId, speakerId, cloneId);
    if (
      String(confirmation || "") !== OWNER_DATA_ERASURE_CONFIRMATION ||
      understandIrreversible !== true
    ) {
      throw new Error("OWNER_DATA_ERASURE_CONFIRMATION_REQUIRED");
    }
    if (typeof database.connect !== "function") {
      throw new Error("OWNER_DATA_ERASURE_TRANSACTION_UNAVAILABLE");
    }

    const client = await database.connect();
    const deleted = {};
    try {
      await client.query("BEGIN");
      for (const [table, column, scope] of scopedTargets) {
        const result = await client.query(
          `DELETE FROM ${table} WHERE ${column} = $1`,
          [scope === "clone" ? identity.cloneId : identity.ownerId]
        );
        deleted[table] = Number(result.rowCount || 0);
      }
      if (identity.ownerId === "pam-sol" && identity.speakerId === "pam") {
        for (const table of legacyPamOnlyTargets) {
          const result = await client.query(`DELETE FROM ${table}`);
          deleted[table] = Number(result.rowCount || 0);
        }
      }
      await client.query("COMMIT");
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {}
      throw error;
    } finally {
      client.release();
    }

    return {
      version: OWNER_DATA_ERASURE_VERSION,
      erased: true,
      irreversible: true,
      ownerId: identity.ownerId,
      deleted,
      totalRows: summarizeCounts(deleted),
      localDeviceDataIncluded: false,
      providerRevocationStillRequired: ["Google", "SmartThings"]
    };
  }

  return Object.freeze({ preview, erase });
}
