import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ANIMAL_HOLO_AUTO_SAVE_MARKER,
  ANIMAL_HOLO_CONVERSATION_REPLY,
  ANIMAL_HOLO_OPEN_BUILD,
  ANIMAL_HOLO_OWNER_ID,
  ANIMAL_HOLO_SAFETY,
  ANIMAL_HOLO_STORAGE_KEY,
  addAnimalHoloObservation,
  addAnimalHoloProfile,
  animalHoloAutoSaveProposalFromAssistantAnswer,
  animalHoloObservationFromFulltimeMessage,
  animalHoloProposalFromAssistantAnswer,
  animalHoloPromptContext,
  classifyAnimalHoloConversationReply,
  createAnimalHoloState,
  markAnimalHoloObservationSynced,
  mergeAnimalHoloStates,
  normalizeAnimalHoloState,
  serializeAnimalHoloState,
  stripAnimalHoloAutoSaveMarker
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

test("Pams Tier-Holo-Start enthält alle fünf bestätigten Tiere", () => {
  const state = createAnimalHoloState(ANIMAL_HOLO_OWNER_ID);
  assert.deepEqual(
    state.profiles.map((profile) => profile.name),
    ["Salt", "Pepper", "Tina", "Gurke", "Möhrchen"]
  );
  const salt = state.profiles.find((profile) => profile.id === "salt");
  const pepper = state.profiles.find((profile) => profile.id === "pepper");
  const tina = state.profiles.find((profile) => profile.id === "tina");
  assert.equal(salt.humanReference, "Steffi");
  assert.deepEqual(pepper.nicknames, ["Peps"]);
  assert.equal(pepper.humanReference, "Pam");
  assert.equal(tina.species, "Hund");
  assert.equal(tina.breed, "Schäferhund");
  assert.equal(salt.observations.length, 2);
  assert.match(salt.observations[0].text, /unkontrollierten Bewegungen/iu);
  assert.match(salt.observations[1].text, /zieht sie sich eher zurück/iu);
  assert.equal(
    state.profiles.find((profile) => profile.id === "gurke").humanReference,
    "Pams Eltern"
  );
  assert.equal(
    state.profiles.find((profile) => profile.id === "moehrchen").projectName,
    "Gurke & Möhrchen"
  );
});

test("Salt-Migration ergänzt nur fehlende Beobachtungen und verdoppelt nichts", () => {
  const migrated = normalizeAnimalHoloState(
    {
      ownerId: ANIMAL_HOLO_OWNER_ID,
      profiles: [{
        id: "salt",
        name: "Salt",
        observations: [{
          id: "alter-eintrag",
          text:
            "Nach Pams Beobachtung geht Salt auch mit unkontrollierten Bewegungen sehr kleiner Kinder ruhig um.",
          syncState: "synced"
        }]
      }]
    },
    { ownerId: ANIMAL_HOLO_OWNER_ID }
  );
  const salt = migrated.profiles.find((profile) => profile.id === "salt");
  assert.equal(salt.observations.length, 2);
  assert.equal(
    salt.observations.filter((observation) =>
      /unkontrollierten Bewegungen/iu.test(observation.text)
    ).length,
    1
  );
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

test("natürliche Zustimmung bestätigt nur eine offene Tier-Holo-Rückfrage", () => {
  for (const reply of [
    "Ja",
    "Ja bitte",
    "Okay",
    "OK, danke",
    "Alles",
    "Alles klar",
    "Gerne",
    "Mach das ruhig",
    "Von mir aus",
    "👍",
    "👍🏻",
    "✅",
    "Yes please",
    "Sí"
  ]) {
    assert.equal(
      classifyAnimalHoloConversationReply(reply),
      ANIMAL_HOLO_CONVERSATION_REPLY.CONFIRM,
      reply
    );
  }

  for (const reply of ["Nein", "Doch nicht", "Lieber nicht", "👎", "❌"]) {
    assert.equal(
      classifyAnimalHoloConversationReply(reply),
      ANIMAL_HOLO_CONVERSATION_REPLY.CANCEL,
      reply
    );
  }

  for (const reply of [
    "Was weißt du über Salt?",
    "Okay, aber welchen Stuhl meinst du?",
    "👍 oder 👎"
  ]) {
    assert.equal(
      classifyAnimalHoloConversationReply(reply),
      ANIMAL_HOLO_CONVERSATION_REPLY.OTHER,
      reply
    );
  }
});

test("Holos natürliche Rückfrage wird für jedes Tierprofil sicher erkannt", () => {
  const saltProposal = animalHoloProposalFromAssistantAnswer(
    "Alles klar, das ist Salt. Soll ich das im SALT & PEPS Tier-Holo festhalten? " +
      "Vorschlag: „Salt – entspannt auf dem Stuhl (heute)“."
  );
  assert.deepEqual(saltProposal, {
    profileId: "salt",
    text: "Salt – entspannt auf dem Stuhl (heute)",
    observedAt: ""
  });

  const profiles = [
    {
      id: "moehrchen",
      name: "Möhrchen",
      nicknames: [],
      projectName: "Möhrchens Tier-Holo"
    }
  ];
  const futureProfileProposal = animalHoloProposalFromAssistantAnswer(
    "Möchtest du, dass ich das im Tier-Holo von Möhrchen speichere? " +
      "Vorschlag: „Möhrchen wartet ruhig an der Tür.“",
    { profiles }
  );
  assert.deepEqual(futureProfileProposal, {
    profileId: "moehrchen",
    text: "Möhrchen wartet ruhig an der Tür.",
    observedAt: ""
  });

  assert.equal(
    animalHoloProposalFromAssistantAnswer(
      "Ich habe Salt dauerhaft gespeichert."
    ),
    null,
    "Eine unbelegte Erfolgsbehauptung darf keine offene Speicheraktion erzeugen"
  );
});

test("Pams Holo-Antwort löst eine direkte, unsichtbar markierte Speicherung aus", () => {
  const answer =
    "Das passt zu deiner Beobachtung.\n" +
    ANIMAL_HOLO_AUTO_SAVE_MARKER +
    ' {"profileId":"peps","text":"Peps wartet ruhig an der Tür.","observedAt":""}';
  assert.deepEqual(animalHoloAutoSaveProposalFromAssistantAnswer(answer), {
    profileId: "pepper",
    text: "Peps wartet ruhig an der Tür.",
    observedAt: ""
  });
  assert.equal(
    stripAnimalHoloAutoSaveMarker(answer),
    "Das passt zu deiner Beobachtung."
  );
  assert.equal(
    animalHoloAutoSaveProposalFromAssistantAnswer(
      ANIMAL_HOLO_AUTO_SAVE_MARKER +
        ' {"profileId":"unbekannt","text":"Nicht zuordnen","observedAt":""}'
    ),
    null
  );
});

test("ownergebundene Vollzeit-Beobachtungen werden wieder als Tier-Einträge sichtbar", () => {
  const restored = animalHoloObservationFromFulltimeMessage({
    content:
      "Bestätigte Tier-Holo-Beobachtung zu Möhrchen: Möhrchen sitzt gern im Karton.",
    createdAt: "2026-09-13T12:00:00.000Z",
    observationId: "fulltime-42"
  });
  assert.equal(restored.profileId, "moehrchen");
  assert.equal(restored.observation.syncState, "synced");
  assert.equal(restored.observation.id, "fulltime-42");
  assert.match(restored.observation.text, /sitzt gern im Karton/iu);

  const peps = animalHoloObservationFromFulltimeMessage({
    content:
      "Bestätigte Tier-Holo-Beobachtung zu Pepper (Peps): Peps schaut aus dem Fenster.",
    observationId: "fulltime-43"
  });
  assert.equal(peps.profileId, "pepper");
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
    4
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
  const [html, ui, solUi, server, workflow, worker] = await Promise.all([
    readFile(new URL("../www/index.html", import.meta.url), "utf8"),
    readFile(
      new URL("../www/human-holo-animal-holos.mjs", import.meta.url),
      "utf8"
    ),
    readFile(new URL("../www/sol-holo-ui.js", import.meta.url), "utf8"),
    readFile(new URL("../server.mjs", import.meta.url), "utf8"),
    readFile(
      new URL("../.github/workflows/android-build.yml", import.meta.url),
      "utf8"
    ),
    readFile(new URL("../www/service-worker.js", import.meta.url), "utf8")
  ]);

  assert.match(html, /human-holo-animal-holos\.mjs\?v=7/u);
  assert.match(html, /sol-holo-backup\.mjs\?v=6/u);
  assert.match(html, /captureConversationProposal/u);
  assert.match(ui, /LOKALES_TIER_HOLO_ERGEBNIS/u);
  assert.match(ui, /Erinnerungen.*Tier-Holos|Tier-Holos 🐾💚/su);
  assert.match(ui, /fulltime\/history\/append/u);
  assert.match(ui, /interactive: false/u);
  assert.match(ui, /pending/u);
  assert.match(ui, /handleConversationReply/u);
  assert.match(ui, /conversation_confirmation/u);
  assert.match(ui, /ownergebunden im Vollzeitgedächtnis/u);
  assert.match(ui, /Foto ändern/u);
  assert.match(ui, /animal-holos\/profile-photo\/save/u);
  assert.match(ui, /animal-holos\/observations/u);
  assert.match(ui, /ohne zusätzliche Zustimmungsfrage/u);
  assert.doesNotMatch(ui, /animalHoloObservationConfirmed/u);
  assert.match(solUi, /HumanHoloAnimalHolos[\s\S]*?handleConversationReply/u);
  assert.match(server, /function animalHoloSafetyInstructions/u);
  assert.match(server, /identity\?\.ownerId !== "pam-sol"/u);
  assert.match(server, /Tina erhält ein eigenes Hund-Tier-Holo/u);
  assert.match(server, /Gurke und Möhrchen sind Katzen/u);
  assert.match(server, /save_animal_holo_observation/u);
  assert.match(server, /TIER_HOLO_AUTOSAVE/u);
  assert.match(server, /animal-holos\/profile-photo\/save/u);
  assert.match(server, /jedes bestehende und künftig ownergebunden angelegte Tier-Holo/u);
  assert.match(server, /verlange keinen besonderen Befehlssatz/u);
  assert.match(workflow, /assets\/public\/human-holo-animal-core\.mjs/u);
  assert.match(workflow, /assets\/public\/human-holo-animal-holos\.mjs/u);
  assert.match(worker, /human-holo-296-complete-through-morning/u);
});

test("Tier-Holos folgen Pams kompakter Ein-Seiten-Ansicht", async () => {
  const ui = await readFile(
    new URL("../www/human-holo-animal-holos.mjs", import.meta.url),
    "utf8"
  );

  assert.match(ui, /const ANIMAL_HOLO_PRIMARY_NAVIGATION[\s\S]*?"salt"[\s\S]*?"pepper"[\s\S]*?"tina"/u);
  assert.match(ui, /label: "Start"/u);
  assert.match(ui, /label: "Mehr"/u);
  assert.match(ui, /titleText: "Über " \+ profileDisplayName\(profile\)/u);
  assert.match(ui, /titleText: "Erinnerungen"/u);
  assert.match(ui, /titleText: "Sicherheit"/u);
  assert.match(ui, /titleText: "Neue Erinnerung"/u);
  assert.match(ui, /if \(other !== details\) other\.open = false/u);
  assert.doesNotMatch(ui, /details\.open\s*=/u);
  assert.doesNotMatch(ui, /animalHoloMemoryBadge/u);
  assert.doesNotMatch(ui, /observationCount\s*\+\s*" gespeichert"/u);
  assert.match(ui, /Was Holo über " \+ profileDisplayName\(profile\) \+ " weiß"/u);
  assert.match(ui, /Build 292: Tier-Holos im verbindlichen Human-Holo-Glass-Design/u);
  assert.match(ui, /--human-holo-glass-edge:rgba\(211,232,255,\.78\)/u);
  assert.match(ui, /backdrop-filter:blur\(20px\) saturate\(1\.3\)/u);
  assert.match(ui, /linear-gradient\(145deg,rgba\(151,78,233,\.74\),rgba\(48,91,197,\.67\)\)/u);
  assert.match(ui, /Build 293: unterer Tier-Holo-Bereich wie Holos schwebende Hauptnavigation/u);
  assert.match(ui, /width:min\(calc\(100% - 20px\),740px\)/u);
  assert.match(ui, /bottom:calc\(8px \+ env\(safe-area-inset-bottom\)\)/u);
  assert.match(ui, /border-radius:23px/u);
  assert.match(ui, /animalHoloDockButton\[data-selected=true\]:after/u);
  assert.match(ui, /padding-bottom:calc\(104px \+ env\(safe-area-inset-bottom\)\)/u);
});

test("freigegebene Tierbilder sind im App-Build sichtbar, aber nicht MIT-lizenziert", async () => {
  const [ui, notice, license, ...photos] = await Promise.all([
    readFile(
      new URL("../www/human-holo-animal-holos.mjs", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../www/assets/animals/README.md", import.meta.url),
      "utf8"
    ),
    readFile(new URL("../TIER-HOLO-OPEN-BUILD-LICENSE.md", import.meta.url), "utf8"),
    ...["salt", "peps", "tina", "gurke", "moehrchen"].map((name) =>
      readFile(new URL(`../www/assets/animals/${name}.webp`, import.meta.url))
    )
  ]);

  for (const [profileId, fileName] of [
    ["salt", "salt.webp"],
    ["pepper", "peps.webp"],
    ["tina", "tina.webp"],
    ["gurke", "gurke.webp"],
    ["moehrchen", "moehrchen.webp"]
  ]) {
    assert.match(
      ui,
      new RegExp(`${profileId}: new URL\\("\\./assets/animals/${fileName.replace(".", "\\.")}"`, "u")
    );
  }
  for (const photo of photos) {
    assert.ok(photo.length > 20_000);
    assert.equal(photo.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(photo.subarray(8, 12).toString("ascii"), "WEBP");
  }
  assert.equal(ANIMAL_HOLO_OPEN_BUILD.publicStarterPhotosIncluded, true);
  assert.equal(ANIMAL_HOLO_OPEN_BUILD.privateMediaIncluded, false);
  assert.match(notice, /Tochter vollständig entfernt/iu);
  assert.match(notice, /nicht.*MIT-Freigabe/isu);
  assert.match(license, /www\/assets\/animals/iu);
});

test("frühere Tierfotos werden privat zugeordnet und Tina wird allein zugeschnitten", async () => {
  const ui = await readFile(
    new URL("../www/human-holo-animal-holos.mjs", import.meta.url),
    "utf8"
  );

  for (const [fileId, profileId] of [
    ["1000114664", "salt"],
    ["1000113888", "pepper"],
    ["1000115450", "tina"],
    ["1000114215", "gurke"],
    ["1000114211", "moehrchen"]
  ]) {
    assert.match(ui, new RegExp(`"${fileId}": "${profileId}"`, "u"));
  }
  assert.match(ui, /id="animalHoloPreviousPhotosInput"[\s\S]*?multiple hidden/u);
  assert.match(ui, /Vorherige Fotos übernehmen/u);
  assert.match(ui, /profileId === "tina"[\s\S]*?width > height[\s\S]*?width \* 0\.5/u);
  assert.match(ui, /writePhotoRecord[\s\S]*?syncState: "pending"/u);
  assert.match(ui, /savePhotoRemotely/u);
  assert.equal(ANIMAL_HOLO_OPEN_BUILD.privateMediaIncluded, false);
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
