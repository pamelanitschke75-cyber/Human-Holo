import test from "node:test";
import assert from "node:assert/strict";

import {
  DURABLE_MEMORY_FALLBACK_KEY,
  DURABLE_MEMORY_LEGACY_KEY,
  createDurableMemoryOutbox,
  createInMemoryDurableMemoryStore,
  openBrowserDurableMemoryOutbox,
  prepareDurableMemoryContent
} from "../www/human-holo-durable-memory.mjs";

const ownerId = "pam-sol";
const speakerId = "pam";

function eventId(number) {
  return `app-memory-test-${String(number).padStart(8, "0")}`;
}

test("gewöhnliche Erinnerungen bleiben wortgetreu und Zugangsdaten werden nicht gespeichert", async () => {
  const ordinary = "Gestern gab es Fisch, und Gurke lag neben mir.\nDas war schön!";
  assert.equal(prepareDurableMemoryContent(ordinary).content, ordinary);

  const store = createInMemoryDurableMemoryStore();
  const outbox = createDurableMemoryOutbox({ store, ownerId, speakerId });
  await outbox.enqueue(
    [{
      role: "user",
      content: "Mein Passwort ist SuperGeheim123 und Gurke gehört zu mir."
    }],
    eventId(1)
  );

  const serialized = JSON.stringify(await outbox.list());
  assert.doesNotMatch(serialized, /SuperGeheim123/u);
  assert.match(serialized, /Passwort ist \[NICHT GESPEICHERT\]/u);
  assert.match(serialized, /Gurke gehört zu mir/u);
});

test("der Ausgangskorb besitzt keine willkürliche 200-Erinnerungen-Grenze", async () => {
  const store = createInMemoryDurableMemoryStore();
  const outbox = createDurableMemoryOutbox({ store, ownerId, speakerId });

  for (let index = 0; index < 275; index += 1) {
    await outbox.enqueue(
      [{ role: "user", content: `Persönlicher Satz ${index}` }],
      eventId(index + 10)
    );
  }

  const rows = await outbox.list();
  assert.equal(rows.length, 275);
  assert.equal(rows[0].messages[0].content, "Persönlicher Satz 0");
  assert.equal(rows.at(-1).messages[0].content, "Persönlicher Satz 274");
});

test("Nutzerwort und Holo-Antwort werden unter derselben Ereignis-ID ergänzt", async () => {
  const store = createInMemoryDurableMemoryStore();
  const outbox = createDurableMemoryOutbox({ store, ownerId, speakerId });
  const sourceEventId = eventId(2);

  const userRevision = await outbox.enqueue(
    [{ role: "user", content: "Das ist Gurke." }],
    sourceEventId,
    ["text", "image"]
  );
  const completedRevision = await outbox.enqueue(
    [{ role: "assistant", content: "Jetzt erkenne ich Gurke." }],
    sourceEventId,
    ["text", "image"]
  );

  assert.equal(userRevision.revision, 1);
  assert.equal(completedRevision.revision, 2);
  assert.deepEqual(
    completedRevision.messages.map(message => message.sourceEventId),
    [`${sourceEventId}:user`, `${sourceEventId}:assistant`]
  );
  assert.equal(await outbox.acknowledge(sourceEventId, 1), false);
  assert.equal((await outbox.list())[0].messages.length, 2);
  assert.equal(await outbox.acknowledge(sourceEventId, 2), true);
  assert.deepEqual(await outbox.list(), []);
});

test("eine verspätete Serverbestätigung kann eine neuere Antwort niemals löschen", async () => {
  const store = createInMemoryDurableMemoryStore();
  const outbox = createDurableMemoryOutbox({ store, ownerId, speakerId });
  const sourceEventId = eventId(3);
  const sentSnapshot = await outbox.enqueue(
    [{ role: "user", content: "Wir hatten gestern Fisch." }],
    sourceEventId
  );
  await outbox.enqueue(
    [{ role: "assistant", content: "Ja, gestern gab es Fisch." }],
    sourceEventId
  );

  assert.equal(
    await outbox.acknowledge(sourceEventId, sentSnapshot.revision),
    false
  );
  const pending = await outbox.list();
  assert.equal(pending[0].revision, 2);
  assert.equal(pending[0].messages.length, 2);
});

test("Pam und andere Owner bleiben auch im lokalen Ausgangskorb getrennt", async () => {
  const store = createInMemoryDurableMemoryStore();
  const pam = createDurableMemoryOutbox({ store, ownerId, speakerId });
  const steffi = createDurableMemoryOutbox({
    store,
    ownerId: "steffi-sol",
    speakerId: "steffi"
  });
  const sourceEventId = eventId(4);

  await pam.enqueue(
    [{ role: "user", content: "Pams private Erinnerung" }],
    sourceEventId
  );
  await steffi.enqueue(
    [{ role: "user", content: "Steffis private Erinnerung" }],
    sourceEventId
  );

  assert.deepEqual(
    (await pam.list()).map(row => row.messages[0].content),
    ["Pams private Erinnerung"]
  );
  assert.deepEqual(
    (await steffi.list()).map(row => row.messages[0].content),
    ["Steffis private Erinnerung"]
  );
});

test("der frühere lokale Wartestapel wird einmalig und ohne Löschen vor der Übernahme migriert", async () => {
  const values = new Map();
  const localStorageObject = {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
  localStorageObject.setItem(
    DURABLE_MEMORY_LEGACY_KEY,
    JSON.stringify([{
      sourceEventId: eventId(5),
      messages: [{ role: "user", content: "Alte ungesendete Erinnerung" }]
    }])
  );

  const outbox = await openBrowserDurableMemoryOutbox({
    ownerId,
    speakerId,
    indexedDBFactory: null,
    localStorageObject
  });

  assert.equal((await outbox.list()).length, 1);
  assert.equal(localStorageObject.getItem(DURABLE_MEMORY_LEGACY_KEY), null);
  assert.ok(localStorageObject.getItem(DURABLE_MEMORY_FALLBACK_KEY));
});
