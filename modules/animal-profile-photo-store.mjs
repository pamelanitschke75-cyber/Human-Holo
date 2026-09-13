import { createHash } from "node:crypto";

export const ANIMAL_PROFILE_PHOTO_MAX_BYTES = 6 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

function cleanIdentity(value, label) {
  const clean = String(value || "").trim().toLocaleLowerCase("de-DE");
  if (!/^[a-z0-9äöüß_-]{1,120}$/u.test(clean)) {
    throw new TypeError(`${label} ist ungültig.`);
  }
  return clean;
}

function hasExpectedSignature(bytes, mimeType) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  return (
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

export function parseAnimalProfilePhotoDataUrl(value) {
  const dataUrl = String(value || "").trim();
  const match = dataUrl.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/]+={0,2})$/iu
  );
  if (!match || !ALLOWED_MIME_TYPES.has(match[1].toLocaleLowerCase("en-US"))) {
    throw new TypeError("Das Tierfoto hat kein unterstütztes Bildformat.");
  }
  const mimeType = match[1].toLocaleLowerCase("en-US");
  const bytes = Buffer.from(match[2], "base64");
  if (
    bytes.length < 12 ||
    bytes.length > ANIMAL_PROFILE_PHOTO_MAX_BYTES ||
    !hasExpectedSignature(bytes, mimeType)
  ) {
    throw new TypeError("Das Tierfoto ist ungültig oder zu groß.");
  }
  return {
    bytes,
    mimeType,
    sha256: createHash("sha256").update(bytes).digest("hex")
  };
}

export function createAnimalProfilePhotoStore({ database }) {
  if (!database || typeof database.query !== "function") {
    throw new TypeError("Animal profile photo store requires a database.");
  }

  async function initialize() {
    await database.query(`
      CREATE TABLE IF NOT EXISTS human_holo_animal_profile_photo (
        owner_id TEXT NOT NULL,
        speaker_id TEXT NOT NULL,
        profile_id TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        photo_bytes BYTEA NOT NULL,
        content_sha256 TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (owner_id, speaker_id, profile_id)
      )
    `);
  }

  async function save({ ownerId, speakerId, profileId, dataUrl }) {
    const ownerIdValue = cleanIdentity(ownerId, "Owner-ID");
    const speakerIdValue = cleanIdentity(speakerId, "Sprecher-ID");
    const profileIdValue = cleanIdentity(profileId, "Tierprofil-ID");
    const photo = parseAnimalProfilePhotoDataUrl(dataUrl);
    const result = await database.query(
      `
        INSERT INTO human_holo_animal_profile_photo (
          owner_id,
          speaker_id,
          profile_id,
          mime_type,
          photo_bytes,
          content_sha256,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (owner_id, speaker_id, profile_id)
        DO UPDATE SET
          mime_type = EXCLUDED.mime_type,
          photo_bytes = EXCLUDED.photo_bytes,
          content_sha256 = EXCLUDED.content_sha256,
          updated_at = NOW()
        RETURNING content_sha256, OCTET_LENGTH(photo_bytes) AS size_bytes, updated_at
      `,
      [
        ownerIdValue,
        speakerIdValue,
        profileIdValue,
        photo.mimeType,
        photo.bytes,
        photo.sha256
      ]
    );
    const row = result.rows?.[0] || {};
    return {
      profileId: profileIdValue,
      sha256: String(row.content_sha256 || photo.sha256),
      sizeBytes: Number(row.size_bytes || photo.bytes.length),
      updatedAt: row.updated_at || new Date().toISOString()
    };
  }

  async function get({ ownerId, speakerId, profileId }) {
    const ownerIdValue = cleanIdentity(ownerId, "Owner-ID");
    const speakerIdValue = cleanIdentity(speakerId, "Sprecher-ID");
    const profileIdValue = cleanIdentity(profileId, "Tierprofil-ID");
    const result = await database.query(
      `
        SELECT mime_type, photo_bytes, content_sha256, updated_at
        FROM human_holo_animal_profile_photo
        WHERE owner_id = $1
          AND speaker_id = $2
          AND profile_id = $3
        LIMIT 1
      `,
      [ownerIdValue, speakerIdValue, profileIdValue]
    );
    const row = result.rows?.[0];
    if (!row) return null;
    const bytes = Buffer.isBuffer(row.photo_bytes)
      ? row.photo_bytes
      : Buffer.from(row.photo_bytes);
    return {
      profileId: profileIdValue,
      dataUrl: `data:${row.mime_type};base64,${bytes.toString("base64")}`,
      sha256: String(row.content_sha256 || ""),
      sizeBytes: bytes.length,
      updatedAt: row.updated_at
    };
  }

  return Object.freeze({ initialize, save, get });
}
