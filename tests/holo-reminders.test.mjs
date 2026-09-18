import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  formatReminderTrigger,
  handleReminderCommand,
  reminderCommandFromMessage
} from "../www/human-holo-reminders.mjs";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Holo-Erinnerungen erkennen Zeit und nächstes App-Update", () => {
  assert.deepEqual(
    reminderCommandFromMessage(
      "Erinnere mich morgen um 9 Uhr an die Überschrift"
    ),
    {
      action: "create_time",
      message: "Erinnere mich morgen um 9 Uhr an die Überschrift"
    }
  );
  assert.deepEqual(
    reminderCommandFromMessage(
      "Holo, erinnere mich beim nächsten Holo-Update daran, die Überschrift mitzunehmen"
    ),
    {
      action: "create_next_update",
      title: "die Überschrift mitzunehmen"
    }
  );
  assert.equal(
    formatReminderTrigger({ triggerType: "app_update" }),
    "Beim nächsten Holo-Update"
  );
});

test("Holo kann geplante Erinnerungen anzeigen, ändern, umbenennen und löschen", () => {
  assert.deepEqual(
    reminderCommandFromMessage(
      "Welche Erinnerungen hast du für mich eingestellt?"
    ),
    { action: "list" }
  );
  assert.deepEqual(
    reminderCommandFromMessage(
      "Verschiebe die Erinnerung Medikamente auf morgen 10 Uhr"
    ),
    {
      action: "reschedule",
      query: "Medikamente",
      scheduleText: "morgen 10 Uhr"
    }
  );
  assert.deepEqual(
    reminderCommandFromMessage(
      "Benenne die Erinnerung Medikamente in Tabletten um"
    ),
    {
      action: "rename",
      query: "Medikamente",
      title: "Tabletten"
    }
  );
  assert.deepEqual(
    reminderCommandFromMessage("Lösche die Erinnerung an Medikamente"),
    { action: "delete", query: "Medikamente" }
  );
});

test("biografische Gedächtnisfragen werden nicht als Holo-Termin missverstanden", () => {
  assert.equal(
    reminderCommandFromMessage("Welche offenen Erinnerungen haben wir?"),
    null
  );
  assert.equal(
    reminderCommandFromMessage("Erinnerst du dich noch an Heike?"),
    null
  );
});

test("Pam kann Erinnerungen auch bei ausgeschalteten Benachrichtigungen löschen", async () => {
  let permissionRequests = 0;
  let cancelledId = "";
  globalThis.window = {
    SolHoloIdentity: {
      selected: () => ({ ownerId: "pam-sol", speakerId: "pam" })
    },
    Capacitor: {
      Plugins: {
        HoloReminder: {
          getStatus: async () => ({ notificationsGranted: false }),
          requestNotificationAccess: async () => {
            permissionRequests += 1;
            return { notificationsGranted: false };
          },
          listReminders: async () => ({
            reminders: [{
              id: "holo_medikamente",
              title: "Medikamente",
              triggerType: "time",
              triggerAt: Date.now() + 60_000
            }]
          }),
          cancelReminder: async ({ id }) => {
            cancelledId = id;
            return { cancelled: true };
          }
        }
      }
    }
  };

  try {
    const result = await handleReminderCommand(
      "Lösche die Erinnerung an Medikamente"
    );
    assert.equal(result.success, true);
    assert.equal(cancelledId, "holo_medikamente");
    assert.equal(permissionRequests, 0);
  } finally {
    delete globalThis.window;
  }
});

test("eine neue Zeit-Erinnerung verlangt die sichere S23-Sitzung", async () => {
  let trustedSessionChecks = 0;
  let scheduled = null;
  globalThis.window = {
    SolHoloIdentity: {
      selected: () => ({
        displayName: "Pam",
        ownerId: "pam-sol",
        speakerId: "pam"
      })
    },
    SolHoloTrustedSession: {
      ensure: async ({ accessLevel, interactive }) => {
        trustedSessionChecks += 1;
        assert.equal(accessLevel, "owner_everyday");
        assert.equal(interactive, true);
        return { trusted: true };
      },
      headers: () => ({ "x-sol-holo-trusted-session": "test-session" })
    },
    PamHoloNetwork: {
      backendUrl: "https://pam-holo.example",
      request: async (_url, init) => {
        assert.equal(init.method, "POST");
        assert.equal(
          init.headers["x-sol-holo-trusted-session"],
          "test-session"
        );
        return {
          ok: true,
          json: async () => ({
            reminderDraft: {
              title: "Steffi wecken",
              triggerType: "time",
              triggerAt: new Date(Date.now() + 120_000).toISOString()
            }
          })
        };
      }
    },
    Capacitor: {
      Plugins: {
        HoloReminder: {
          getStatus: async () => ({ notificationsGranted: true }),
          scheduleReminder: async reminder => {
            scheduled = reminder;
            return reminder;
          },
          listReminders: async () => ({ reminders: [] })
        }
      }
    }
  };

  try {
    const result = await handleReminderCommand(
      "Erinnere mich in zwei Minuten daran, Steffi zu wecken"
    );
    assert.equal(result.success, true);
    assert.equal(trustedSessionChecks, 1);
    assert.equal(scheduled.ownerId, "pam-sol");
    assert.equal(scheduled.title, "Steffi wecken");
  } finally {
    delete globalThis.window;
  }
});

test("Android speichert Erinnerungen verschlüsselt, ownergebunden und updatefest", async () => {
  const [
    plugin,
    store,
    notifications,
    reschedule,
    installer,
    workflow
  ] = await Promise.all([
    read("android-native/HoloReminderPlugin.java"),
    read("android-native/HoloReminderStore.java"),
    read("android-native/HoloReminderNotifications.java"),
    read("android-native/HoloReminderRescheduleReceiver.java"),
    read("scripts/install-whatsapp-driving-mode.mjs"),
    read(".github/workflows/android-build.yml")
  ]);

  assert.match(plugin, /name = "HoloReminder"/u);
  assert.match(plugin, /HoloReminderStore\.ownerHash/u);
  assert.match(plugin, /"app_update"\.equals\(triggerType\)/u);
  assert.match(store, /AES\/GCM\/NoPadding/u);
  assert.match(store, /AndroidKeyStore/u);
  assert.doesNotMatch(store, /ownerId"/u);
  assert.match(notifications, /VISIBILITY_PRIVATE/u);
  assert.match(notifications, /CATEGORY_REMINDER/u);
  assert.match(notifications, /areNotificationsEnabled/u);
  assert.match(reschedule, /PackageInfoCompat\.getLongVersionCode/u);
  assert.doesNotMatch(plugin, /BuildConfig\.VERSION_CODE/u);
  assert.doesNotMatch(reschedule, /BuildConfig\.VERSION_CODE/u);
  assert.match(reschedule, /HoloReminderScheduler\.schedule/u);
  assert.match(reschedule, /Intent\.ACTION_BOOT_COMPLETED/u);
  assert.match(reschedule, /Intent\.ACTION_MY_PACKAGE_REPLACED/u);
  assert.match(installer, /registerPlugin\(HoloReminderPlugin\.class\)/u);
  assert.match(installer, /android\.intent\.action\.BOOT_COMPLETED/u);
  assert.match(installer, /android\.intent\.action\.MY_PACKAGE_REPLACED/u);
  assert.doesNotMatch(installer, /SCHEDULE_EXACT_ALARM/u);
  assert.match(workflow, /Ownergebundene Holo-Erinnerungen prüfen/u);
});

test("Text und Sprache nutzen denselben lokalen Erinnerungsweg", async () => {
  const [ui, reminderUi, html, server, serviceWorker] = await Promise.all([
    read("www/sol-holo-ui.js"),
    read("www/human-holo-reminders.mjs"),
    read("www/index.html"),
    read("server.mjs"),
    read("www/service-worker.js")
  ]);

  assert.match(ui, /id="holoReminderPanel"/u);
  assert.match(ui, /Holo-Erinnerungen/u);
  assert.match(ui, /HumanHoloReminders\?\.handle/u);
  assert.match(ui, /HumanHoloReminders\?\.matches/u);
  assert.match(html, /human-holo-reminders\.mjs\?v=1/u);
  assert.match(server, /app\.post\(\s*"\/reminder\/parse"/u);
  assert.match(server, /Du erstellst keinen Kalendereintrag/u);
  assert.match(server, /\[LOKALES_HOLO_ERINNERUNGSERGEBNIS\]/u);
  assert.match(serviceWorker, /human-holo-reminders\.mjs/u);
  assert.match(reminderUi, /notificationsRequired: !\["list", "delete"\]/u);
  assert.match(reminderUi, /accessLevel: "owner_everyday"/u);
});

test("die vereinbarte Überschrift wird mit dem Erinnerungsupdate ausgeliefert", async () => {
  const [ui, html, serviceWorker] = await Promise.all([
    read("www/sol-holo-ui.js"),
    read("www/index.html"),
    read("www/service-worker.js")
  ]);
  assert.match(ui, /<h3>Alles Wichtige auf einen Blick<\/h3>/u);
  assert.doesNotMatch(ui, /Pams Wichtiges in Pam’s Holo/u);
  assert.match(html, /sol-holo-ui\.js\?v=91/u);
  assert.match(html, /sol-holo-ui\.css\?v=56/u);
  assert.match(html, /service-worker\.js\?v=302/u);
  assert.match(serviceWorker, /restored-entry-network-v14/u);
});
