import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ANIMAL_HOLO_OPEN_BUILD,
  ANIMAL_HOLO_OWNER_ID,
  ANIMAL_HOLO_SAFETY,
  ANIMAL_HOLO_STORAGE_KEY,
  addAnimalHoloObservation,
  addAnimalHoloProfile,
  animalHoloPromptContext,
  createAnimalHoloState,
  markAnimalHoloObservationSynced,
  mergeAnimalHoloStates,
  normalizeAnimalHoloState,
  serializeAnimalHoloState
} from "../www/human-holo-animal-core.mjs";
import {
  BACKUP_STORAGE_KEYS,
  applyBackupRestore,
  createBackupSnapshot,
  decryptBackup,
  encryptBackup,
  planBackupRestore
} from "../www/sol-holo-backup-core.mjs";

class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries));
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

test("Pams Tier-Holo-Start enthält Salt, Pepper alias Peps und Tina", () => {
  const state = createAnimalHoloState(ANIMAL_HOLO_OWNER_ID);
  assert.deepEqual(
    state.profiles.map((profile) => profile.name),
    ["Salt", "Pepper", "Tina"]
  );
  const salt = state.profiles.find((profile) => profile.id === "salt");
  const pepper = state.profiles.find((profile) => profile.id === "pepper");
  const tina = state.profiles.find((profile) => profile.id === "tina");
  assert.equal(salt.humanReference, "Steffi");
  assert.deepEqual(pepper.nicknames, ["Peps"]);
  assert.equal(pepper.humanReference, "Pam");
  assert.equal(tina.species, "Hund");
  assert.equal(tina.breed, "Schäferhund");
});

test("Tier-Holo-Sicherheitsgrenzen schützen Kind, Tier und Wirklichkeit", () => {
  const context = animalHoloPromptContext(
    createAnimalHoloState(ANIMAL_HOLO_OWNER_ID)
  );
  assert.match(context, /niemals allein oder unbeaufsichtigt/iu);
  assert.match(context, /niemals das wirkliche Tier/iu);
  assert.match(context, /Rückzug/iu);
  assert.match(ANIMAL_HOLO_SAFETY.veterinaryBoundary, /tierärztliche/iu);
  assert.doesNotMatch(context, /garantiert ungefährlich/iu);
});

test("Tier-Holo-Daten bleiben strikt ownergebunden", () => {
  const other = createAnimalHoloState("anderer-owner");
  assert.deepEqual(other.profiles, []);
  assert.notEqual(
    ANIMAL_HOLO_STORAGE_KEY,
    "human-holo-animal-memory-v1:anderer-owner"
  );
  assert.throws(
    () =>
      normalizeAnimalHoloState(
        { ownerId: "anderer-owner", profiles: [] },
        { ownerId: ANIMAL_HOLO_OWNER_ID }
      ),
    /anderen Owner-Instanz/iu
  );
});

test("Bestätigte Beobachtungen werden sofort normalisiert und gespeichert", () => {
  const initial = createAnimalHoloState(ANIMAL_HOLO_OWNER_ID);
  const result = addAnimalHoloObservation(
    initial,
    "pepper",
    {
      text: "  Peps sitzt beim Familienalltag mitten im Geschehen.  ",
      observedAt: "2026-09-09T12:00:00.000Z"
    },
    "2026-09-10T12:00:00.000Z"
  );
  assert.equal(result.duplicate, false);
  assert.equal(result.observation.syncState, "pending");
  assert.equal(
    result.observation.text,
    "Peps sitzt beim Familienalltag mitten im Geschehen."
  );
  const synced = markAnimalHoloObservationSynced(
    result.state,
    "pepper",
    result.observation.id,
    "2026-09-10T12:01:00.000Z"
  );
  assert.equal(
    synced.profiles.find((profile) => profile.id === "pepper")
      .observations[0].syncState,
    "synced"
  );
});

test("Weitere Tier-Holos können auf dem offenen Kern aufbauen", () => {
  const extended = addAnimalHoloProfile(
    createAnimalHoloState("builder-owner"),
    {
      name: "Milo",
      species: "Hund",
      summary: "Ein selbst angelegtes Tier-Holo."
    },
    "2026-09-10T12:00:00.000Z"
  );
  assert.equal(ANIMAL_HOLO_OPEN_BUILD.license, "MIT");
  assert.equal(ANIMAL_HOLO_OPEN_BUILD.extensible, true);
  assert.equal(extended.profiles[0].name, "Milo");
});

test("Tier-Holo-Wiederherstellung ist additiv und dedupliziert", () => {
  const first = addAnimalHoloObservation(
    createAnimalHoloState(ANIMAL_HOLO_OWNER_ID),
    "salt",
    {
      id: "animal_salt_shared",
      text: "Salt zieht sich bei viel Trubel zurück."
    },
    "2026-09-10T10:00:00.000Z"
  ).state;
  const second = addAnimalHoloObservation(
    createAnimalHoloState(ANIMAL_HOLO_OWNER_ID),
    "salt",
    {
      id: "animal_salt_second",
      text: "Salt sucht danach wieder einen ruhigen Kontakt."
    },
    "2026-09-10T11:00:00.000Z"
  ).state;
  const merged = mergeAnimalHoloStates(first, second, {
    ownerId: ANIMAL_HOLO_OWNER_ID
  });
  assert.equal(merged.observationsAdded, 1);
  assert.equal(
    merged.state.profiles.find((profile) => profile.id === "salt")
      .observations.length,
    2
  );
});

test("Verschlüsselte Sicherung enthält Tier-Holo-Daten nur als Chiffretext", async () => {
  const state = addAnimalHoloObservation(
    createAnimalHoloState(ANIMAL_HOLO_OWNER_ID),
    "tina",
    { text: "Nur für den Verschlüsselungstest." },
    "2026-09-10T12:00:00.000Z"
  ).state;
  const storage = new MemoryStorage({
    [BACKUP_STORAGE_KEYS.animalHolos]: serializeAnimalHoloState(state)
  });
  const snapshot = createBackupSnapshot(
    storage,
    "2026-09-10T12:05:00.000Z"
  );
  assert.equal(
    snapshot.data.animalHolos.profiles.find((profile) => profile.id === "tina")
      .observations.length,
    1
  );
  const encrypted = await encryptBackup(
    snapshot,
    "Human-Holo-Tier-Test-2026!",
    webcrypto
  );
  assert.equal(encrypted.includes("Nur für den Verschlüsselungstest"), false);
  const decrypted = await decryptBackup(
    encrypted,
    "Human-Holo-Tier-Test-2026!",
    webcrypto
  );
  assert.equal(decrypted.data.animalHolos.ownerId, ANIMAL_HOLO_OWNER_ID);
});

test("Tier-Holo-Sicherung wird ohne Überschreiben vorhandener Beobachtungen restauriert", () => {
  const current = addAnimalHoloObservation(
    createAnimalHoloState(ANIMAL_HOLO_OWNER_ID),
    "pepper",
    { id: "animal_pepper_current", text: "Aktuelle Beobachtung." },
    "2026-09-10T09:00:00.000Z"
  ).state;
  const incoming = addAnimalHoloObservation(
    createAnimalHoloState(ANIMAL_HOLO_OWNER_ID),
    "pepper",
    { id: "animal_pepper_backup", text: "Beobachtung aus Sicherung." },
    "2026-09-10T08:00:00.000Z"
  ).state;
  const storage = new MemoryStorage({
    [BACKUP_STORAGE_KEYS.animalHolos]: serializeAnimalHoloState(current)
  });
  const snapshot = createBackupSnapshot(
    new MemoryStorage({
      [BACKUP_STORAGE_KEYS.animalHolos]: serializeAnimalHoloState(incoming)
    }),
    "2026-09-10T12:00:00.000Z"
  );
  const plan = planBackupRestore(storage, snapshot);
  assert.equal(plan.summary.animalObservationsAdded, 1);
  applyBackupRestore(storage, plan);
  const restored = normalizeAnimalHoloState(
    storage.getItem(BACKUP_STORAGE_KEYS.animalHolos),
    { ownerId: ANIMAL_HOLO_OWNER_ID }
  );
  assert.equal(
    restored.profiles.find((profile) => profile.id === "pepper")
      .observations.length,
    2
  );
});

test("Der offene Kern trägt eine eindeutige MIT-Kennzeichnung", async () => {
  const source = await readFile(
    new URL("../www/human-holo-animal-core.mjs", import.meta.url),
    "utf8"
  );
  assert.match(source, /SPDX-License-Identifier: MIT/u);
  assert.match(source, /private photos, recordings and identity data/iu);
});

test("Tier-Holos sind in App, Vollzeitgedächtnis und Android-Build verdrahtet", async () => {
  const [html, ui, server, workflow, worker] = await Promise.all([
    readFile(new URL("../www/index.html", import.meta.url), "utf8"),
    readFile(
      new URL("../www/human-holo-animal-holos.mjs", import.meta.url),
      "utf8"
    ),
    readFile(new URL("../server.mjs", import.meta.url), "utf8"),
    readFile(
      new URL("../.github/workflows/android-build.yml", import.meta.url),
      "utf8"
    ),
    readFile(new URL("../www/service-worker.js", import.meta.url), "utf8")
  ]);

  assert.match(html, /human-holo-animal-holos\.mjs\?v=1/u);
  assert.match(html, /sol-holo-backup\.mjs\?v=4/u);
  assert.match(ui, /Erinnerungen.*Tier-Holos|Tier-Holos 🐾💚/su);
  assert.match(ui, /fulltime\/history\/append/u);
  assert.match(ui, /interactive: false/u);
  assert.match(ui, /pending/u);
  assert.match(server, /function animalHoloSafetyInstructions/u);
  assert.match(server, /identity\?\.ownerId !== "pam-sol"/u);
  assert.match(server, /Tina erhält ein eigenes Hund-Tier-Holo/u);
  assert.match(workflow, /assets\/public\/human-holo-animal-core\.mjs/u);
  assert.match(workflow, /assets\/public\/human-holo-animal-holos\.mjs/u);
  assert.match(worker, /human-holo-282-health-self-care/u);
});

test("Tier-Holo-Open-Build ist eng abgegrenzt und dokumentiert", async () => {
  const [license, openBuild, ui] = await Promise.all([
    readFile(new URL("../LICENSE", import.meta.url), "utf8"),
    readFile(
      new URL("../TIER-HOLO-OPEN-BUILD-LICENSE.md", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../www/human-holo-animal-holos.mjs", import.meta.url),
      "utf8"
    )
  ]);
  assert.match(license, /Ausdrückliche Open-Build-Freigabe/u);
  assert.match(openBuild, /MIT License/u);
  assert.match(openBuild, /gilt ausschließlich/u);
  assert.match(ui, /SPDX-License-Identifier: MIT/u);
  assert.match(openBuild, /private Erinnerungen/u);
});
