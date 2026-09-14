import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { webcrypto } from "node:crypto";

import {
  HUMAN_HOLO_TEST_ENCRYPTED_FORMAT,
  HUMAN_HOLO_TEST_EXPORT_MAX_BYTES,
  createHumanHoloTestDataSnapshot,
  decryptHumanHoloTestData,
  encryptHumanHoloTestData,
  humanHoloTestExportFileName
} from "../www/human-holo-test-export-core.mjs";
import {
  collectHumanHoloOwnerIndexedData,
  collectHumanHoloOwnerLocalStorage,
  eraseHumanHoloOwnerIndexedData,
  eraseHumanHoloOwnerLocalStorage
} from "../www/human-holo-local-owner-data.mjs";

test("Testexport bleibt inklusive Base64-Hülle unter der nativen Dateigrenze", () => {
  assert.equal(HUMAN_HOLO_TEST_EXPORT_MAX_BYTES, 90 * 1024 * 1024);
  const maximumCiphertextEnvelope = Math.ceil(
    (HUMAN_HOLO_TEST_EXPORT_MAX_BYTES + 16) / 3
  ) * 4 + 4096;
  assert.ok(maximumCiphertextEnvelope < 128 * 1024 * 1024);
});

const identity = Object.freeze({
  ownerId: "human-test-anwalt",
  speakerId: "tester-anwalt",
  cloneId: "human-test-anwalt-001",
  displayName: "Eingeladener Anwalt",
  role: "legal-review",
  testOnly: true
});

function serverMemory(owner = identity.ownerId) {
  return {
    format: "human-holo-owner-memory",
    version: 1,
    ownerId: owner,
    speakerId: identity.speakerId,
    cloneId: identity.cloneId,
    createdAt: "2026-09-14T18:00:00.000Z",
    data: {
      fulltimeHistory: [],
      confirmedMemories: [{ content: "Nur der Anwalt kennt diesen Testsatz." }],
      supersessions: [],
      legacyConversation: [],
      legacyLongTerm: []
    },
    integrity: {
      algorithm: "SHA-256",
      counts: {
        fulltimeHistory: 0,
        confirmedMemories: 1,
        supersessions: 0,
        legacyConversation: 0,
        legacyLongTerm: 0
      },
      contentDigest: "a".repeat(64)
    }
  };
}

class MemoryStorage {
  constructor(values = {}) {
    this.values = new Map(Object.entries(values));
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

function fakeIndexedDB(seed) {
  const databases = new Map(
    Object.entries(seed).map(([databaseName, stores]) => [
      databaseName,
      new Map(
        Object.entries(stores).map(([storeName, rows]) => [storeName, rows])
      )
    ])
  );

  function databaseFor(databaseName) {
    const stores = databases.get(databaseName);
    return {
      objectStoreNames: {
        contains(storeName) {
          return stores.has(storeName);
        }
      },
      transaction(storeName) {
        const rows = stores.get(storeName);
        const transaction = {};
        transaction.objectStore = () => ({
          openCursor() {
            const request = {};
            let index = 0;
            let currentDeleted = false;
            const deliver = () => {
              if (index >= rows.length) {
                request.result = null;
                request.onsuccess?.();
                queueMicrotask(() => transaction.oncomplete?.());
                return;
              }
              currentDeleted = false;
              request.result = {
                value: rows[index],
                delete() {
                  rows.splice(index, 1);
                  currentDeleted = true;
                },
                continue() {
                  if (!currentDeleted) index += 1;
                  queueMicrotask(deliver);
                }
              };
              request.onsuccess?.();
            };
            queueMicrotask(deliver);
            return request;
          }
        });
        return transaction;
      },
      close() {}
    };
  }

  return {
    data: databases,
    async databases() {
      return [...databases.keys()].map(name => ({ name }));
    },
    open(databaseName) {
      const request = {};
      queueMicrotask(() => {
        request.result = databaseFor(databaseName);
        request.onsuccess?.();
      });
      return request;
    }
  };
}

test("Human-Holo-Testexport ist ownergebunden und enthält nur Chiffretext", async () => {
  const snapshot = createHumanHoloTestDataSnapshot({
    identity,
    serverMemory: serverMemory(),
    memoryPreferences: { mode: "confirmed_only", paused: false },
    localData: { notes: [{ text: "Vertrauliche Testnotiz" }] },
    createdAt: "2026-09-14T18:10:00.000Z"
  });
  const password = "Testexport-nur-Anwalt-2026!";
  const encrypted = await encryptHumanHoloTestData(
    snapshot,
    password,
    webcrypto
  );
  const envelope = JSON.parse(encrypted);

  assert.equal(envelope.format, HUMAN_HOLO_TEST_ENCRYPTED_FORMAT);
  assert.equal(envelope.encryption.cipher, "AES-GCM-256");
  assert.equal(envelope.encryption.iterations, 310_000);
  assert.doesNotMatch(encrypted, /Nur der Anwalt|Vertrauliche Testnotiz/u);

  const decrypted = await decryptHumanHoloTestData(
    encrypted,
    password,
    webcrypto
  );
  assert.equal(decrypted.identity.ownerId, identity.ownerId);
  assert.equal(
    decrypted.data.serverMemory.data.confirmedMemories[0].content,
    "Nur der Anwalt kennt diesen Testsatz."
  );
  assert.deepEqual(
    decrypted.scope.excluded,
    [
      "Einladungs-Zugangscode",
      "Sitzungstoken",
      "OAuth-Zugangs- und Aktualisierungstoken",
      "Server- und Signiergeheimnisse",
      "flüchtiger RAM-Gesprächskontext"
    ]
  );
  await assert.rejects(
    decryptHumanHoloTestData(encrypted, "Falsches-Passwort-2026!", webcrypto)
  );
});

test("fremder Owner und Pam-Identität werden vom Human-Testexport abgewiesen", () => {
  assert.throws(
    () => createHumanHoloTestDataSnapshot({
      identity,
      serverMemory: serverMemory("pam-sol")
    }),
    /MEMORY_SCOPE_MISMATCH/u
  );
  assert.throws(
    () => humanHoloTestExportFileName({
      ...identity,
      ownerId: "pam-sol",
      speakerId: "pam",
      cloneId: "pam-sol-001",
      testOnly: false
    }),
    /IDENTITY_INVALID/u
  );
});

test("lokaler Export und Löschung lassen Pam und andere Tester unangetastet", () => {
  const currentNotes = `human-holo:${identity.ownerId}:notes:v1`;
  const currentAnimals = `human-holo-animal-memory-v1:${identity.ownerId}`;
  const otherNotes = "human-holo:human-test-zweite:notes:v1";
  const legacyPamAnimals = "human-holo-animal-memory-v1";
  const fallbackKey = "human-holo-owner-memory-outbox-v2";
  const storage = new MemoryStorage({
    [currentNotes]: JSON.stringify([{ text: "Nur Anwalt" }]),
    [currentAnimals]: JSON.stringify({ ownerId: identity.ownerId }),
    [otherNotes]: JSON.stringify([{ text: "Andere Testperson" }]),
    [legacyPamAnimals]: JSON.stringify({ ownerId: "pam-sol" }),
    "sol-holo-fulltime-pending-v1": JSON.stringify([{ content: "Pam-Altwert" }]),
    [fallbackKey]: JSON.stringify([
      {
        ownerId: identity.ownerId,
        speakerId: identity.speakerId,
        scope: `${identity.ownerId}:${identity.speakerId}`,
        content: "Nur Anwalt"
      },
      {
        ownerId: "human-test-zweite",
        speakerId: "tester-zweite",
        scope: "human-test-zweite:tester-zweite",
        content: "Andere Testperson"
      }
    ])
  });

  const exported = collectHumanHoloOwnerLocalStorage(storage, identity);
  assert.equal(exported.notes[0].text, "Nur Anwalt");
  assert.equal(exported.pendingDialogFallback.length, 1);
  assert.doesNotMatch(JSON.stringify(exported), /Andere Testperson|Pam-Altwert/u);

  const erased = eraseHumanHoloOwnerLocalStorage(storage, identity);
  assert.equal(erased.complete, true);
  assert.equal(storage.getItem(currentNotes), null);
  assert.equal(storage.getItem(currentAnimals), null);
  assert.match(storage.getItem(otherNotes), /Andere Testperson/u);
  assert.match(storage.getItem(legacyPamAnimals), /pam-sol/u);
  assert.match(storage.getItem("sol-holo-fulltime-pending-v1"), /Pam-Altwert/u);
  const fallback = JSON.parse(storage.getItem(fallbackKey));
  assert.deepEqual(fallback.map(row => row.ownerId), ["human-test-zweite"]);
});

test("IndexedDB-Export und -Löschung arbeiten datensatzweise für genau einen Owner", async () => {
  const other = {
    ownerId: "human-test-zweite",
    speakerId: "tester-zweite",
    scope: "human-test-zweite:tester-zweite"
  };
  const factory = fakeIndexedDB({
    "human-holo-owner-memory-outbox": {
      "pending-dialogs": [
        { ownerId: identity.ownerId, speakerId: identity.speakerId,
          scope: `${identity.ownerId}:${identity.speakerId}`, content: "A" },
        { ...other, content: "B" }
      ]
    },
    "human-holo-erinnerung-vermaechtnis-v1": {
      ownerMemories: [
        { ownerId: identity.ownerId, story: "A" },
        { ownerId: other.ownerId, story: "B" }
      ]
    },
    "human-holo-private-animal-media-v1": {
      profilePhotos: [
        { ownerId: identity.ownerId, speakerId: identity.speakerId,
          data: new Blob(["A"], { type: "text/plain" }) },
        { ownerId: other.ownerId, speakerId: other.speakerId, data: "B" }
      ]
    }
  });

  const exported = await collectHumanHoloOwnerIndexedData(factory, identity);
  assert.equal(exported.pendingDialogs.length, 1);
  assert.equal(exported.memorialEntries.length, 1);
  assert.equal(exported.animalProfilePhotos.length, 1);
  assert.equal(
    exported.animalProfilePhotos[0].data.portableType,
    "Blob"
  );
  assert.doesNotMatch(JSON.stringify(exported), /human-test-zweite/u);

  const erased = await eraseHumanHoloOwnerIndexedData(factory, identity);
  assert.equal(erased.complete, true);
  assert.deepEqual(erased.deleted, {
    pendingDialogs: 1,
    memorialEntries: 1,
    animalProfilePhotos: 1
  });
  for (const stores of factory.data.values()) {
    for (const rows of stores.values()) {
      assert.equal(rows.length, 1);
      assert.equal(rows[0].ownerId, other.ownerId);
    }
  }
});

test("Human-Test lädt weder Pam-Backup noch Pam-Full-Sync und löscht keine ganze Datenbank", async () => {
  const [html, rights, localData, launchPolicy] = await Promise.all([
    readFile(new URL("../www/index.html", import.meta.url), "utf8"),
    readFile(new URL("../www/data-rights.mjs", import.meta.url), "utf8"),
    readFile(new URL("../www/human-holo-local-owner-data.mjs", import.meta.url), "utf8"),
    readFile(new URL("../www/human-holo-launch-policy.js", import.meta.url), "utf8")
  ]);

  assert.match(html, /human-holo-test-export\.mjs\?v=1/u);
  assert.ok(
    html.indexOf("human-holo-test-export.mjs?v=1") <
      html.indexOf("data-rights.mjs?v=1")
  );
  assert.doesNotMatch(html, /sol-holo-backup\.mjs|consent-ui-bootstrap\.mjs/u);
  assert.doesNotMatch(html, /human-holo-animal-holos\.mjs/u);
  assert.doesNotMatch(html, /src="\.\/original-full-sync\.js/u);
  assert.doesNotMatch(html, /src="\.\/sol-motion-profile\.js/u);
  assert.match(
    html,
    /HumanHoloLaunchPolicy\?\.enabled\?\.\("originalFullSync"\) === true/u
  );
  assert.match(launchPolicy, /originalFullSync: false/u);
  assert.match(launchPolicy, /animalHolos: false/u);
  assert.match(rights, /HumanHoloTestExport/u);
  assert.doesNotMatch(`${rights}\n${localData}`, /deleteDatabase\s*\(/u);
  assert.match(localData, /cursor\.delete\(\)/u);
  assert.match(localData, /foreignOwnerDataDeleted: false/u);
});
