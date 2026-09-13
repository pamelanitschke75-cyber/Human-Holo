import assert from "node:assert/strict";
import test from "node:test";

import {
  ANIMAL_PROFILE_PHOTO_MAX_BYTES,
  createAnimalProfilePhotoStore,
  parseAnimalProfilePhotoDataUrl
} from "../modules/animal-profile-photo-store.mjs";

const JPEG_BYTES = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10,
  0x4a, 0x46, 0x49, 0x46, 0x00, 0x01
]);
const JPEG_DATA_URL = `data:image/jpeg;base64,${JPEG_BYTES.toString("base64")}`;

class PhotoDatabase {
  constructor() {
    this.queries = [];
    this.row = null;
  }

  async query(sql, values = []) {
    this.queries.push({ sql, values });
    if (/CREATE TABLE/u.test(sql)) return { rows: [] };
    if (/INSERT INTO/u.test(sql)) {
      this.row = {
        mime_type: values[3],
        photo_bytes: values[4],
        content_sha256: values[5],
        updated_at: "2026-09-13T13:00:00.000Z"
      };
      return {
        rows: [{
          content_sha256: values[5],
          size_bytes: values[4].length,
          updated_at: this.row.updated_at
        }]
      };
    }
    if (/SELECT mime_type/u.test(sql)) {
      return { rows: this.row ? [this.row] : [] };
    }
    throw new Error("Unerwartete Testabfrage");
  }
}

test("Tierprofilfotos akzeptieren ausschließlich echte begrenzte Bilddaten", () => {
  const parsed = parseAnimalProfilePhotoDataUrl(JPEG_DATA_URL);
  assert.equal(parsed.mimeType, "image/jpeg");
  assert.equal(parsed.bytes.length, JPEG_BYTES.length);
  assert.match(parsed.sha256, /^[a-f0-9]{64}$/u);
  assert.equal(ANIMAL_PROFILE_PHOTO_MAX_BYTES, 6 * 1024 * 1024);

  assert.throws(
    () => parseAnimalProfilePhotoDataUrl("data:text/plain;base64,SGFsbG8="),
    /Bildformat/iu
  );
  assert.throws(
    () => parseAnimalProfilePhotoDataUrl("data:image/jpeg;base64,SGFsbG8gd2VsdCE="),
    /ungültig oder zu groß/iu
  );
});

test("Tierprofilfoto bleibt strikt owner-, sprecher- und profilgebunden", async () => {
  const database = new PhotoDatabase();
  const store = createAnimalProfilePhotoStore({ database });
  await store.initialize();
  const saved = await store.save({
    ownerId: "pam-sol",
    speakerId: "pam",
    profileId: "gurke",
    dataUrl: JPEG_DATA_URL
  });
  assert.equal(saved.profileId, "gurke");
  assert.equal(saved.sizeBytes, JPEG_BYTES.length);

  const restored = await store.get({
    ownerId: "pam-sol",
    speakerId: "pam",
    profileId: "gurke"
  });
  assert.equal(restored.dataUrl, JPEG_DATA_URL);
  assert.match(
    database.queries.find((entry) => /INSERT INTO/u.test(entry.sql)).sql,
    /ON CONFLICT \(owner_id, speaker_id, profile_id\)/u
  );

  await assert.rejects(
    store.get({
      ownerId: "pam-sol",
      speakerId: "pam",
      profileId: "../fremd"
    }),
    /Tierprofil-ID ist ungültig/iu
  );
});
