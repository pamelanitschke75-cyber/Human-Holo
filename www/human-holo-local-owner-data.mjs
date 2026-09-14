const TEST_OWNER_PATTERN = /^human-test-[a-z0-9][a-z0-9-]{2,39}$/u;
const TEST_SPEAKER_PATTERN = /^tester-[a-z0-9][a-z0-9-]{2,39}$/u;

export const HUMAN_HOLO_LOCAL_DATABASE_TARGETS = Object.freeze([
  Object.freeze({
    databaseName: "human-holo-owner-memory-outbox",
    storeName: "pending-dialogs",
    label: "pendingDialogs",
    matches(record, identity) {
      return (
        record?.ownerId === identity.ownerId &&
        record?.speakerId === identity.speakerId &&
        record?.scope === `${identity.ownerId}:${identity.speakerId}`
      );
    }
  }),
  Object.freeze({
    databaseName: "human-holo-erinnerung-vermaechtnis-v1",
    storeName: "ownerMemories",
    label: "memorialEntries",
    matches(record, identity) {
      return record?.ownerId === identity.ownerId;
    }
  }),
  Object.freeze({
    databaseName: "human-holo-private-animal-media-v1",
    storeName: "profilePhotos",
    label: "animalProfilePhotos",
    matches(record, identity) {
      return (
        record?.ownerId === identity.ownerId &&
        record?.speakerId === identity.speakerId
      );
    }
  })
]);

function requiredTestIdentity(identity) {
  const ownerId = String(identity?.ownerId || "").trim();
  const speakerId = String(identity?.speakerId || "").trim();
  if (
    identity?.testOnly !== true ||
    !TEST_OWNER_PATTERN.test(ownerId) ||
    !TEST_SPEAKER_PATTERN.test(speakerId)
  ) {
    throw new Error("HUMAN_HOLO_TEST_IDENTITY_REQUIRED");
  }
  return Object.freeze({ ownerId, speakerId, testOnly: true });
}

function storageKeys(identity) {
  return Object.freeze({
    notes: `human-holo:${identity.ownerId}:notes:v1`,
    animalHolos: `human-holo-animal-memory-v1:${identity.ownerId}`,
    pendingAnimalProposal:
      `human-holo-animal-conversation-pending-v1:${identity.ownerId}`,
    legalNotice:
      `human-holo:${identity.ownerId}:legal-notice:2026-09-14-legal-review-1`
  });
}

function parsedLocalValue(value) {
  if (value === null || value === undefined || value === "") return null;
  try {
    return JSON.parse(String(value));
  } catch {
    return Object.freeze({ unreadableJson: true, rawValue: String(value) });
  }
}

function readSharedFallback(storage, identity) {
  const value = parsedLocalValue(
    storage.getItem("human-holo-owner-memory-outbox-v2")
  );
  if (!Array.isArray(value)) return [];
  const scope = `${identity.ownerId}:${identity.speakerId}`;
  return value.filter(record =>
    record?.ownerId === identity.ownerId &&
    record?.speakerId === identity.speakerId &&
    record?.scope === scope
  );
}

export function collectHumanHoloOwnerLocalStorage(storage, identityValue) {
  if (!storage?.getItem) {
    throw new Error("HUMAN_HOLO_LOCAL_STORAGE_UNAVAILABLE");
  }
  const identity = requiredTestIdentity(identityValue);
  const keys = storageKeys(identity);
  return Object.freeze({
    ownerId: identity.ownerId,
    speakerId: identity.speakerId,
    notes: parsedLocalValue(storage.getItem(keys.notes)),
    animalHolos: parsedLocalValue(storage.getItem(keys.animalHolos)),
    pendingAnimalProposal:
      parsedLocalValue(storage.getItem(keys.pendingAnimalProposal)),
    legalNotice: parsedLocalValue(storage.getItem(keys.legalNotice)),
    pendingDialogFallback: readSharedFallback(storage, identity)
  });
}

export function eraseHumanHoloOwnerLocalStorage(storage, identityValue) {
  if (!storage?.getItem || !storage?.setItem || !storage?.removeItem) {
    throw new Error("HUMAN_HOLO_LOCAL_STORAGE_UNAVAILABLE");
  }
  const identity = requiredTestIdentity(identityValue);
  const keys = storageKeys(identity);
  const removedKeys = [];
  const failedKeys = [];
  for (const key of Object.values(keys)) {
    try {
      if (storage.getItem(key) !== null) removedKeys.push(key);
      storage.removeItem(key);
    } catch {
      failedKeys.push(key);
    }
  }

  const fallbackKey = "human-holo-owner-memory-outbox-v2";
  const rawFallback = storage.getItem(fallbackKey);
  let fallbackRowsRemoved = 0;
  let sharedFallbackRetainedUnreadable = false;
  let sharedFallbackWriteFailed = false;
  if (rawFallback !== null) {
    let records;
    try {
      records = JSON.parse(rawFallback);
    } catch {
      records = null;
    }
    if (Array.isArray(records)) {
      const scope = `${identity.ownerId}:${identity.speakerId}`;
      const retained = records.filter(record => {
        const belongsToOwner =
          record?.ownerId === identity.ownerId &&
          record?.speakerId === identity.speakerId &&
          record?.scope === scope;
        if (belongsToOwner) fallbackRowsRemoved += 1;
        return !belongsToOwner;
      });
      try {
        if (retained.length) storage.setItem(fallbackKey, JSON.stringify(retained));
        else storage.removeItem(fallbackKey);
      } catch {
        sharedFallbackWriteFailed = true;
      }
    } else {
      // Ein unbekannter gemeinsamer Altwert darf nicht auf Verdacht gelöscht werden.
      sharedFallbackRetainedUnreadable = true;
    }
  }

  return Object.freeze({
    removedKeys: Object.freeze(removedKeys),
    failedKeys: Object.freeze(failedKeys),
    fallbackRowsRemoved,
    sharedFallbackRetainedUnreadable,
    sharedFallbackWriteFailed,
    complete: failedKeys.length === 0 && !sharedFallbackWriteFailed
  });
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function portableValue(value, byteBudget) {
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    byteBudget.used += value.size;
    if (byteBudget.used > byteBudget.maximum) {
      throw new Error("HUMAN_HOLO_LOCAL_EXPORT_TOO_LARGE");
    }
    const bytes = new Uint8Array(await value.arrayBuffer());
    return Object.freeze({
      portableType: "Blob",
      mediaType: value.type || "application/octet-stream",
      size: bytes.byteLength,
      dataBase64: bytesToBase64(bytes)
    });
  }
  if (Array.isArray(value)) {
    return Promise.all(value.map(item => portableValue(item, byteBudget)));
  }
  if (value && typeof value === "object") {
    const result = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = await portableValue(item, byteBudget);
    }
    return result;
  }
  return value;
}

async function databaseExists(indexedDBFactory, databaseName) {
  if (typeof indexedDBFactory?.databases !== "function") return true;
  const databases = await indexedDBFactory.databases();
  return databases.some(database => database?.name === databaseName);
}

async function openExistingDatabase(indexedDBFactory, databaseName) {
  if (!indexedDBFactory?.open) return null;
  if (!(await databaseExists(indexedDBFactory, databaseName))) return null;
  return new Promise((resolve, reject) => {
    let abortedCreation = false;
    const request = indexedDBFactory.open(databaseName);
    request.onupgradeneeded = event => {
      if (Number(event.oldVersion || 0) === 0) {
        abortedCreation = true;
        request.transaction?.abort();
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      if (abortedCreation) resolve(null);
      else reject(request.error || new Error("HUMAN_HOLO_LOCAL_DATABASE_OPEN_FAILED"));
    };
    request.onblocked = () => reject(
      new Error("HUMAN_HOLO_LOCAL_DATABASE_BLOCKED")
    );
  });
}

async function ownerRecordsForTarget(indexedDBFactory, target, identity) {
  const database = await openExistingDatabase(
    indexedDBFactory,
    target.databaseName
  );
  if (!database) return [];
  try {
    if (!database.objectStoreNames.contains(target.storeName)) return [];
    return await new Promise((resolve, reject) => {
      const rows = [];
      const transaction = database.transaction(target.storeName, "readonly");
      const request = transaction.objectStore(target.storeName).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        if (target.matches(cursor.value, identity)) rows.push(cursor.value);
        cursor.continue();
      };
      request.onerror = () => reject(
        request.error || new Error("HUMAN_HOLO_LOCAL_DATABASE_READ_FAILED")
      );
      transaction.oncomplete = () => resolve(rows);
      transaction.onerror = () => reject(
        transaction.error || new Error("HUMAN_HOLO_LOCAL_DATABASE_READ_FAILED")
      );
      transaction.onabort = transaction.onerror;
    });
  } finally {
    database.close();
  }
}

async function eraseOwnerRecordsForTarget(indexedDBFactory, target, identity) {
  const database = await openExistingDatabase(
    indexedDBFactory,
    target.databaseName
  );
  if (!database) return 0;
  try {
    if (!database.objectStoreNames.contains(target.storeName)) return 0;
    return await new Promise((resolve, reject) => {
      let deleted = 0;
      const transaction = database.transaction(target.storeName, "readwrite");
      const request = transaction.objectStore(target.storeName).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        if (target.matches(cursor.value, identity)) {
          cursor.delete();
          deleted += 1;
        }
        cursor.continue();
      };
      request.onerror = () => reject(
        request.error || new Error("HUMAN_HOLO_LOCAL_DATABASE_ERASE_FAILED")
      );
      transaction.oncomplete = () => resolve(deleted);
      transaction.onerror = () => reject(
        transaction.error || new Error("HUMAN_HOLO_LOCAL_DATABASE_ERASE_FAILED")
      );
      transaction.onabort = transaction.onerror;
    });
  } finally {
    database.close();
  }
}

export async function collectHumanHoloOwnerIndexedData(
  indexedDBFactory,
  identityValue,
  { maximumBlobBytes = 64 * 1024 * 1024 } = {}
) {
  const identity = requiredTestIdentity(identityValue);
  const byteBudget = { used: 0, maximum: maximumBlobBytes };
  const result = {};
  for (const target of HUMAN_HOLO_LOCAL_DATABASE_TARGETS) {
    const rows = await ownerRecordsForTarget(indexedDBFactory, target, identity);
    result[target.label] = await portableValue(rows, byteBudget);
  }
  return Object.freeze({
    ...result,
    portableBlobBytes: byteBudget.used
  });
}

export async function eraseHumanHoloOwnerIndexedData(
  indexedDBFactory,
  identityValue
) {
  const identity = requiredTestIdentity(identityValue);
  const deleted = {};
  const failed = [];
  for (const target of HUMAN_HOLO_LOCAL_DATABASE_TARGETS) {
    try {
      deleted[target.label] = await eraseOwnerRecordsForTarget(
        indexedDBFactory,
        target,
        identity
      );
    } catch {
      deleted[target.label] = 0;
      failed.push(target.label);
    }
  }
  return Object.freeze({
    deleted: Object.freeze(deleted),
    failed: Object.freeze(failed),
    complete: failed.length === 0
  });
}

export async function collectHumanHoloOwnerLocalData({
  storage = globalThis.localStorage,
  indexedDBFactory = globalThis.indexedDB,
  identity
} = {}) {
  const requiredIdentity = requiredTestIdentity(identity);
  const [localStorageData, indexedData] = await Promise.all([
    Promise.resolve(
      collectHumanHoloOwnerLocalStorage(storage, requiredIdentity)
    ),
    collectHumanHoloOwnerIndexedData(indexedDBFactory, requiredIdentity)
  ]);
  return Object.freeze({ localStorage: localStorageData, indexedDB: indexedData });
}

export async function eraseHumanHoloOwnerLocalData({
  storage = globalThis.localStorage,
  indexedDBFactory = globalThis.indexedDB,
  identity
} = {}) {
  const requiredIdentity = requiredTestIdentity(identity);
  const localStorageResult = eraseHumanHoloOwnerLocalStorage(
    storage,
    requiredIdentity
  );
  const indexedDBResult = await eraseHumanHoloOwnerIndexedData(
    indexedDBFactory,
    requiredIdentity
  );
  return Object.freeze({
    localStorage: localStorageResult,
    indexedDB: indexedDBResult,
    complete: localStorageResult.complete && indexedDBResult.complete,
    foreignOwnerDataDeleted: false
  });
}
