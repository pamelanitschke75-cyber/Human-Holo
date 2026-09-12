/*
 * Human Holo · ownergebundener, verlustsicherer Gedächtnis-Ausgangskorb
 *
 * Diese Datei enthält keine privaten Erinnerungen. Sie hält ausschließlich
 * die Technik bereit, mit der freigegebene Dialogtexte bis zur bestätigten
 * Speicherung im Human-Holo-Backend auf dem Gerät verbleiben.
 */

export const DURABLE_MEMORY_DATABASE_NAME =
  "human-holo-owner-memory-outbox";
export const DURABLE_MEMORY_DATABASE_VERSION = 1;
export const DURABLE_MEMORY_STORE_NAME = "pending-dialogs";
export const DURABLE_MEMORY_LEGACY_KEY =
  "sol-holo-fulltime-pending-v1";
export const DURABLE_MEMORY_FALLBACK_KEY =
  "human-holo-owner-memory-outbox-v2";

const EVENT_ID_PATTERN = /^[a-zA-Z0-9:_-]{16,160}$/u;
const OWNER_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{1,63}$/u;
const SPEAKER_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{1,63}$/u;
const MAX_MEMORY_CONTENT_LENGTH = 8_000;

function cloneValue(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function cleanScopedId(value, pattern, label) {
  const clean = String(value ?? "").trim();
  if (!pattern.test(clean)) {
    throw new TypeError(`${label} ist für das ownergebundene Gedächtnis ungültig.`);
  }
  return clean;
}

function cleanEventId(value) {
  const clean = String(value ?? "").trim();
  if (!EVENT_ID_PATTERN.test(clean)) {
    throw new TypeError("Die Ereignis-ID des Dauergedächtnisses ist ungültig.");
  }
  return clean;
}

function cleanModalities(value) {
  const supplied = Array.isArray(value) ? value : [];
  const result = [];
  for (const item of supplied) {
    const modality = String(item ?? "")
      .trim()
      .toLocaleLowerCase("de-DE");
    if (
      !/^[a-z][a-z0-9_-]{1,39}$/u.test(modality) ||
      result.includes(modality)
    ) {
      continue;
    }
    result.push(modality);
    if (result.length >= 16) break;
  }
  return result.length ? result : ["text"];
}

/**
 * Bewahrt normalen Dialog wortgetreu. Nur ausdrücklich als Geheimnis
 * bezeichnete Zugangsdaten werden vor jeder dauerhaften Speicherung ersetzt.
 */
export function prepareDurableMemoryContent(value) {
  let content = String(value ?? "");
  let redactionCount = 0;
  const replaceSecret = (match, prefix = "") => {
    redactionCount += 1;
    return `${prefix}[NICHT GESPEICHERT]`;
  };

  content = content.replace(
    /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/gu,
    match => replaceSecret(match)
  );

  content = content.replace(
    /\b(IBAN|Kreditkartennummer|Kartennummer)\b(\s*(?:(?:ist|lautet)\s+|[:=]\s*))([A-Z]{2}\d{2}(?:\s?[A-Z0-9]){11,30}|(?:\d[ -]?){12,19}\d)/giu,
    (match, label, separator) =>
      replaceSecret(match, `${label}${separator}`)
  );

  content = content.replace(
    /\b(Passwort|Password|PIN|TAN|OTP|Einmalcode|Sicherheitscode|Zugangscode|Wiederherstellungscode|API[-_ ]?Key|Secret|Token|CVV|CVC)\b(\s*(?:(?:ist|lautet|heißt|heisst)\s+|[:=]\s*))((?:"[^"\r\n]{1,256}")|(?:'[^'\r\n]{1,256}')|[^\s,;]{1,256})/giu,
    (match, label, separator) =>
      replaceSecret(match, `${label}${separator}`)
  );

  content = content.replace(
    /\b(Authorization\s*:\s*Bearer\s+)([A-Za-z0-9._~+\/-]{8,})/giu,
    (match, prefix) => replaceSecret(match, prefix)
  );

  return Object.freeze({
    content,
    redactionCount,
    changed: redactionCount > 0
  });
}

function normalizeIncomingMessages(messages, sourceEventId, sourceModalities) {
  const entries = Array.isArray(messages) ? messages : [];
  const roleTotals = entries.reduce((totals, entry) => {
    const role = entry?.role === "assistant"
      ? "assistant"
      : entry?.role === "user"
        ? "user"
        : "";
    if (role) totals.set(role, (totals.get(role) || 0) + 1);
    return totals;
  }, new Map());
  const roleCounts = new Map();
  const result = [];

  for (const entry of entries) {
    const role = entry?.role === "assistant"
      ? "assistant"
      : entry?.role === "user"
        ? "user"
        : "";
    if (!role) continue;
    const prepared = prepareDurableMemoryContent(entry?.content);
    if (!prepared.content.trim()) continue;
    if (prepared.content.length > MAX_MEMORY_CONTENT_LENGTH) {
      throw new TypeError("Der Dauergedächtnis-Beitrag ist länger als 8.000 Zeichen.");
    }
    const ordinal = roleCounts.get(role) || 0;
    roleCounts.set(role, ordinal + 1);
    const candidateId = String(entry?.sourceEventId || "").trim();
    const entrySourceEventId = EVENT_ID_PATTERN.test(candidateId)
      ? candidateId
      : roleTotals.get(role) === 1
        ? `${sourceEventId}:${role}`
        : `${sourceEventId}:${ordinal}:${role}`;
    result.push({
      role,
      content: prepared.content,
      sourceEventId: entrySourceEventId,
      sourceModalities: cleanModalities(
        entry?.sourceModalities || sourceModalities
      )
    });
  }

  if (!result.length) {
    throw new TypeError("Der Dauergedächtnis-Eintrag enthält keinen Dialogtext.");
  }
  if (result.length > 8) {
    throw new TypeError("Ein Dauergedächtnis-Ereignis darf höchstens acht Beiträge enthalten.");
  }
  return result;
}

function nextAvailableEntryId(existing, entry, sourceEventId) {
  const usedIds = new Set(existing.map(item => item.sourceEventId));
  for (let ordinal = 1; ordinal < 100; ordinal += 1) {
    const candidate = `${sourceEventId}:${ordinal}:${entry.role}`;
    if (!usedIds.has(candidate)) return candidate;
  }
  throw new Error("Das Dauergedächtnis-Ereignis enthält zu viele gleichartige Beiträge.");
}

function mergeMessages(existingMessages, incomingMessages, sourceEventId) {
  const merged = cloneValue(existingMessages || []);
  let changed = false;
  for (const incoming of incomingMessages) {
    const exact = merged.find(
      entry => entry.sourceEventId === incoming.sourceEventId
    );
    if (exact) {
      if (
        exact.role === incoming.role &&
        exact.content === incoming.content &&
        JSON.stringify(exact.sourceModalities) ===
          JSON.stringify(incoming.sourceModalities)
      ) {
        continue;
      }
      merged.push({
        ...incoming,
        sourceEventId: nextAvailableEntryId(
          merged,
          incoming,
          sourceEventId
        )
      });
      changed = true;
      continue;
    }
    merged.push(incoming);
    changed = true;
  }
  if (merged.length > 8) {
    throw new Error("Das Dauergedächtnis-Ereignis enthält mehr als acht Beiträge.");
  }
  return { messages: merged, changed };
}

function storageKey(scope, sourceEventId) {
  return `${scope}|${sourceEventId}`;
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(
      transaction.error || new Error("IndexedDB-Transaktion fehlgeschlagen.")
    );
    transaction.onabort = () => reject(
      transaction.error || new Error("IndexedDB-Transaktion abgebrochen.")
    );
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(
      request.error || new Error("IndexedDB-Anfrage fehlgeschlagen.")
    );
  });
}

export function createInMemoryDurableMemoryStore(initialRecords = []) {
  const records = new Map(
    initialRecords.map(record => [record.key, cloneValue(record)])
  );
  return Object.freeze({
    async mutate(key, mutator) {
      const next = mutator(cloneValue(records.get(key) || null));
      if (next) records.set(key, cloneValue(next));
      return cloneValue(next);
    },
    async list(scope) {
      return [...records.values()]
        .filter(record => record.scope === scope)
        .sort((left, right) =>
          String(left.queuedAt).localeCompare(String(right.queuedAt))
        )
        .map(cloneValue);
    },
    async removeIfRevision(key, revision) {
      const current = records.get(key);
      if (!current || current.revision !== revision) return false;
      records.delete(key);
      return true;
    }
  });
}

export async function createIndexedDbDurableMemoryStore(indexedDBFactory) {
  if (!indexedDBFactory?.open) {
    throw new Error("IndexedDB ist auf diesem Gerät nicht verfügbar.");
  }
  const database = await new Promise((resolve, reject) => {
    const request = indexedDBFactory.open(
      DURABLE_MEMORY_DATABASE_NAME,
      DURABLE_MEMORY_DATABASE_VERSION
    );
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DURABLE_MEMORY_STORE_NAME)) {
        const store = db.createObjectStore(
          DURABLE_MEMORY_STORE_NAME,
          { keyPath: "key" }
        );
        store.createIndex("scope", "scope", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(
      request.error || new Error("Das lokale Dauergedächtnis konnte nicht geöffnet werden.")
    );
  });

  return Object.freeze({
    async mutate(key, mutator) {
      const transaction = database.transaction(
        DURABLE_MEMORY_STORE_NAME,
        "readwrite"
      );
      const store = transaction.objectStore(DURABLE_MEMORY_STORE_NAME);
      const current = await requestResult(store.get(key));
      const next = mutator(cloneValue(current || null));
      if (next) store.put(cloneValue(next));
      await transactionDone(transaction);
      return cloneValue(next);
    },
    async list(scope) {
      const transaction = database.transaction(
        DURABLE_MEMORY_STORE_NAME,
        "readonly"
      );
      const store = transaction.objectStore(DURABLE_MEMORY_STORE_NAME);
      const rows = await requestResult(store.getAll());
      await transactionDone(transaction);
      return rows
        .filter(record => record.scope === scope)
        .sort((left, right) =>
          String(left.queuedAt).localeCompare(String(right.queuedAt))
        )
        .map(cloneValue);
    },
    async removeIfRevision(key, revision) {
      const transaction = database.transaction(
        DURABLE_MEMORY_STORE_NAME,
        "readwrite"
      );
      const store = transaction.objectStore(DURABLE_MEMORY_STORE_NAME);
      const current = await requestResult(store.get(key));
      const matched = Boolean(current && current.revision === revision);
      if (matched) store.delete(key);
      await transactionDone(transaction);
      return matched;
    }
  });
}

export function createLocalStorageDurableMemoryStore(localStorageObject) {
  if (!localStorageObject?.getItem || !localStorageObject?.setItem) {
    throw new Error("Kein lokaler Speicher für das Dauergedächtnis verfügbar.");
  }
  const readAll = () => {
    const parsed = JSON.parse(
      localStorageObject.getItem(DURABLE_MEMORY_FALLBACK_KEY) || "[]"
    );
    return Array.isArray(parsed) ? parsed : [];
  };
  const writeAll = records => {
    localStorageObject.setItem(
      DURABLE_MEMORY_FALLBACK_KEY,
      JSON.stringify(records)
    );
  };
  return Object.freeze({
    async mutate(key, mutator) {
      const records = readAll();
      const index = records.findIndex(record => record.key === key);
      const next = mutator(cloneValue(index >= 0 ? records[index] : null));
      if (next) {
        if (index >= 0) records[index] = cloneValue(next);
        else records.push(cloneValue(next));
        writeAll(records);
      }
      return cloneValue(next);
    },
    async list(scope) {
      return readAll()
        .filter(record => record.scope === scope)
        .sort((left, right) =>
          String(left.queuedAt).localeCompare(String(right.queuedAt))
        )
        .map(cloneValue);
    },
    async removeIfRevision(key, revision) {
      const records = readAll();
      const index = records.findIndex(record => record.key === key);
      if (index < 0 || records[index].revision !== revision) return false;
      records.splice(index, 1);
      writeAll(records);
      return true;
    }
  });
}

export function createDurableMemoryOutbox({
  store,
  ownerId,
  speakerId,
  now = () => new Date()
}) {
  if (!store?.mutate || !store?.list || !store?.removeIfRevision) {
    throw new TypeError("Ein dauerhafter Gedächtnisspeicher ist erforderlich.");
  }
  const cleanOwnerId = cleanScopedId(
    ownerId,
    OWNER_ID_PATTERN,
    "Owner-ID"
  );
  const cleanSpeakerId = cleanScopedId(
    speakerId,
    SPEAKER_ID_PATTERN,
    "Sprecher-ID"
  );
  const scope = `${cleanOwnerId}:${cleanSpeakerId}`;

  return Object.freeze({
    ownerId: cleanOwnerId,
    speakerId: cleanSpeakerId,
    async enqueue(messages, sourceEventId, sourceModalities = ["text"]) {
      const cleanSourceEventId = cleanEventId(sourceEventId);
      const incoming = normalizeIncomingMessages(
        messages,
        cleanSourceEventId,
        sourceModalities
      );
      const key = storageKey(scope, cleanSourceEventId);
      return store.mutate(key, current => {
        const merged = mergeMessages(
          current?.messages,
          incoming,
          cleanSourceEventId
        );
        if (current && !merged.changed) return current;
        const timestamp = now().toISOString();
        return {
          key,
          scope,
          ownerId: cleanOwnerId,
          speakerId: cleanSpeakerId,
          sourceEventId: cleanSourceEventId,
          revision: Number(current?.revision || 0) + 1,
          messages: merged.messages,
          queuedAt: current?.queuedAt || timestamp,
          updatedAt: timestamp
        };
      });
    },
    async list() {
      return store.list(scope);
    },
    async acknowledge(sourceEventId, revision) {
      const cleanSourceEventId = cleanEventId(sourceEventId);
      if (!Number.isSafeInteger(revision) || revision < 1) return false;
      return store.removeIfRevision(
        storageKey(scope, cleanSourceEventId),
        revision
      );
    }
  });
}

export async function openBrowserDurableMemoryOutbox({
  ownerId,
  speakerId,
  indexedDBFactory = globalThis.indexedDB,
  localStorageObject = globalThis.localStorage,
  now
}) {
  let store;
  try {
    store = await createIndexedDbDurableMemoryStore(indexedDBFactory);
  } catch {
    store = createLocalStorageDurableMemoryStore(localStorageObject);
  }
  const outbox = createDurableMemoryOutbox({
    store,
    ownerId,
    speakerId,
    now
  });

  if (localStorageObject?.getItem) {
    let legacyDialogs = [];
    try {
      const parsed = JSON.parse(
        localStorageObject.getItem(DURABLE_MEMORY_LEGACY_KEY) || "[]"
      );
      legacyDialogs = Array.isArray(parsed) ? parsed : [];
    } catch {
      legacyDialogs = [];
    }
    for (const dialog of legacyDialogs) {
      try {
        await outbox.enqueue(
          dialog?.messages,
          dialog?.sourceEventId,
          dialog?.sourceModalities || ["text"]
        );
      } catch {
        // Ungültige Altwerte bleiben zur manuellen Prüfung unangetastet.
        return outbox;
      }
    }
    if (legacyDialogs.length) {
      localStorageObject.removeItem(DURABLE_MEMORY_LEGACY_KEY);
    }
  }

  return outbox;
}
