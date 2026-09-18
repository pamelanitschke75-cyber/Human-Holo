const MAX_TITLE_LENGTH = 240;
const REMINDER_MARKER = "[LOKALES_HOLO_ERINNERUNGSERGEBNIS]";

export function normalizeReminderText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("de-DE")
    .replace(/[„“”'"´`]/gu, "")
    .replace(/[^a-z0-9äöüß\s-]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function cleanReminderTitle(value) {
  return String(value || "")
    .replace(/\s+/gu, " ")
    .replace(/^[\s:;,.-]+|[\s:;,.-]+$/gu, "")
    .replace(/^(?:dass|an|daran)\s+/iu, "")
    .trim()
    .slice(0, MAX_TITLE_LENGTH);
}

function stripHoloInvocation(value) {
  return String(value || "")
    .trim()
    .replace(
      /^(?:(?:hey|hallo)\s+)?(?:pam(?:[’']s)?\s+holo|human\s+holo|holo|sol)\s*[,;:!.-]*\s*/iu,
      ""
    )
    .trim();
}

export function reminderCommandFromMessage(value) {
  const message = stripHoloInvocation(value);
  const normalized = normalizeReminderText(message);
  if (!message || !normalized) return null;

  const stopMatch = message.match(
    /^(?:bitte\s+)?erinnere\s+mich\s+nicht\s+mehr\s+an\s+(.+?)[.!?]*$/iu
  );
  if (stopMatch) {
    return {
      action: "delete",
      query: cleanReminderTitle(stopMatch[1])
    };
  }

  const deleteMatch = message.match(
    /^(?:bitte\s+)?(?:lösch(?:e)?|loesch(?:e)?|entfern(?:e)?|streich(?:e)?)\s+(?:bitte\s+)?(?:die\s+)?(?:holo[- ]?)?erinnerung\s+(?:an|für|fuer)?\s*(.+?)[.!?]*$/iu
  );
  if (deleteMatch) {
    return {
      action: "delete",
      query: cleanReminderTitle(deleteMatch[1])
    };
  }

  const renameMatch = message.match(
    /^(?:bitte\s+)?(?:benenn(?:e)?|nenn(?:e)?)\s+(?:die\s+)?(?:holo[- ]?)?erinnerung\s+(?:an\s+)?(.+?)\s+(?:in|zu)\s+(.+?)\s+um[.!?]*$/iu
  );
  if (renameMatch) {
    return {
      action: "rename",
      query: cleanReminderTitle(renameMatch[1]),
      title: cleanReminderTitle(renameMatch[2])
    };
  }

  const updateMatch = message.match(
    /^(?:bitte\s+)?(?:verschieb(?:e)?|änder(?:e)?|aender(?:e)?)\s+(?:bitte\s+)?(?:die\s+)?(?:holo[- ]?)?erinnerung\s+(?:an|für|fuer)?\s*(.+?)\s+(?:auf|zu)\s+(.+?)[.!?]*$/iu
  );
  if (updateMatch) {
    return {
      action: "reschedule",
      query: cleanReminderTitle(updateMatch[1]),
      scheduleText: cleanReminderTitle(updateMatch[2])
    };
  }

  if (
    /^(?:welche|was\s+für|was\s+fuer)\s+(?:holo[- ]?)?erinnerungen\s+(?:(?:hast\s+du\s+)?(?:für\s+mich\s+|fuer\s+mich\s+)?(?:eingestellt|geplant|vorgemerkt)|sind\s+(?:eingestellt|geplant|vorgemerkt))[.!?]*$/iu.test(message) ||
    /^(?:zeig(?:e)?|nenn(?:e)?|lies)\s+(?:mir\s+)?(?:bitte\s+)?(?:meine\s+)?(?:geplanten|eingestellten|vorgemerkten)?\s*(?:holo[- ]?)?erinnerungen(?:\s+vor)?[.!?]*$/iu.test(message) ||
    /^woran\s+wirst\s+du\s+mich\s+erinnern[.!?]*$/iu.test(message)
  ) {
    return { action: "list" };
  }

  const nextUpdateMatch = message.match(
    /\berinnere\s+mich\b[\s\S]*?\b(?:beim|bei\s+dem|zum)\s+nächsten\s+(?:(?:human\s+holo|pam(?:[’']s)?\s+holo|holo)[- ]?)?(?:app[- ]?)?update\b[\s,;:-]*(?:daran\s*)?[,;:-]*\s*(.+?)[.!?]*$/iu
  );
  if (nextUpdateMatch) {
    return {
      action: "create_next_update",
      title: cleanReminderTitle(nextUpdateMatch[1])
    };
  }

  if (
    /\berinnere\s+mich\b/iu.test(message) ||
    /\b(?:stell|stelle|setz|setze)\s+(?:mir\s+)?(?:eine\s+)?(?:holo[- ]?)?erinnerung\b/iu.test(message)
  ) {
    return {
      action: "create_time",
      message
    };
  }

  return null;
}

export function formatReminderTrigger(reminder, locale = "de-DE") {
  if (reminder?.triggerType === "app_update") {
    return "Beim nächsten Holo-Update";
  }
  const triggerAt = Number(reminder?.triggerAt || 0);
  if (!Number.isFinite(triggerAt) || triggerAt <= 0) return "Zeitpunkt offen";
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Berlin",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(triggerAt));
}

function activeIdentity() {
  return globalThis.window?.SolHoloIdentity?.selected?.() || null;
}

function reminderPlugin() {
  return globalThis.window?.Capacitor?.Plugins?.HoloReminder || null;
}

function result(answer, success = true, extra = {}) {
  return {
    handled: true,
    success,
    marker: REMINDER_MARKER,
    status: success
      ? "Holo-Erinnerung aktualisiert."
      : "Holo-Erinnerung wurde nicht verändert.",
    answer,
    ...extra
  };
}

async function ensureReadyPlugin({ notificationsRequired = true } = {}) {
  const plugin = reminderPlugin();
  if (!plugin) {
    return {
      plugin: null,
      error:
        "Holo-Erinnerungen sind erst nach diesem Pam-Holo-Update verfügbar."
    };
  }
  let status = await plugin.getStatus();
  if (notificationsRequired && !status?.notificationsGranted) {
    status = await plugin.requestNotificationAccess();
  }
  if (notificationsRequired && !status?.notificationsGranted) {
    return {
      plugin: null,
      error:
        "Bitte erlaube Pam’s Holo die Benachrichtigungen. Ohne diese Freigabe habe ich nichts eingestellt."
    };
  }
  return { plugin, status, error: "" };
}

async function listOwnerReminders(plugin, identity) {
  const response = await plugin.listReminders({ ownerId: identity.ownerId });
  return (Array.isArray(response?.reminders) ? response.reminders : [])
    .slice()
    .sort((left, right) => {
      if (left.triggerType === "app_update") return 1;
      if (right.triggerType === "app_update") return -1;
      return Number(left.triggerAt || 0) - Number(right.triggerAt || 0);
    });
}

function matchingReminders(reminders, query) {
  const normalizedQuery = normalizeReminderText(query);
  if (!normalizedQuery) return [];
  const exact = reminders.filter(
    reminder => normalizeReminderText(reminder.title) === normalizedQuery
  );
  if (exact.length) return exact;
  return reminders.filter(reminder => {
    const title = normalizeReminderText(reminder.title);
    return title.includes(normalizedQuery) || normalizedQuery.includes(title);
  });
}

async function parseTimedReminder(message, identity) {
  const ensureTrustedSession =
    globalThis.window?.SolHoloTrustedSession?.ensure;
  if (typeof ensureTrustedSession !== "function") {
    throw new Error(
      "Die sichere S23-Sitzung ist für Holo-Erinnerungen nicht verfügbar."
    );
  }
  const trustedSession = await ensureTrustedSession({
    interactive: true,
    accessLevel: "owner_everyday"
  });
  if (trustedSession?.trusted !== true) {
    throw new Error(
      "Die sichere S23-Sitzung wurde nicht bestätigt. Es wurde keine Holo-Erinnerung angelegt."
    );
  }

  const request = globalThis.window?.PamHoloNetwork?.request || globalThis.fetch;
  const backendUrl = globalThis.window?.PamHoloNetwork?.backendUrl;
  if (typeof request !== "function" || !backendUrl) {
    throw new Error("Die sichere Holo-Verbindung ist gerade nicht verfügbar.");
  }
  const response = await request(`${backendUrl}/reminder/parse`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(globalThis.window?.SolHoloTrustedSession?.headers?.() || {})
    },
    body: JSON.stringify({
      message,
      ownerId: identity.ownerId,
      selectedSpeakerId: identity.speakerId
    })
  });
  const data = await response.json();
  if (!response.ok || !data?.reminderDraft) {
    throw new Error(
      String(data?.answer || data?.error || "Datum oder Uhrzeit sind nicht eindeutig.")
    );
  }
  return data.reminderDraft;
}

function reminderId() {
  const random = globalThis.crypto?.randomUUID?.().replace(/-/gu, "") ||
    `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return `holo_${random}`.slice(0, 100);
}

async function saveReminder(plugin, identity, draft, existing = null) {
  const numericTriggerAt = Number(draft.triggerAt);
  const triggerAt = draft.triggerType === "time"
    ? Number.isFinite(numericTriggerAt) && numericTriggerAt > 0
      ? numericTriggerAt
      : Date.parse(String(draft.triggerAt || ""))
    : 0;
  return plugin.scheduleReminder({
    id: existing?.id || reminderId(),
    ownerId: identity.ownerId,
    title: cleanReminderTitle(draft.title || existing?.title),
    triggerType: draft.triggerType,
    triggerAt: Number.isFinite(triggerAt) ? triggerAt : 0
  });
}

function listAnswer(reminders) {
  if (!reminders.length) {
    return "Du hast gerade keine Holo-Erinnerung eingestellt.";
  }
  return [
    reminders.length === 1
      ? "Du hast eine Holo-Erinnerung eingestellt:"
      : `Du hast ${reminders.length} Holo-Erinnerungen eingestellt:`,
    ...reminders.map(
      (reminder, index) =>
        `${index + 1}. ${reminder.title} – ${formatReminderTrigger(reminder)}`
    )
  ].join("\n");
}

export async function handleReminderCommand(message) {
  const command = reminderCommandFromMessage(message);
  if (!command) return { handled: false };
  const identity = activeIdentity();
  if (!identity?.ownerId) {
    return result("Die feste Holo-ID ist nicht verfügbar. Es wurde nichts verändert.", false);
  }

  try {
    const ready = await ensureReadyPlugin({
      notificationsRequired: !["list", "delete"].includes(command.action)
    });
    if (!ready.plugin) return result(ready.error, false);
    const plugin = ready.plugin;

    if (command.action === "create_next_update") {
      if (!command.title) {
        return result("Woran soll ich dich beim nächsten Holo-Update erinnern?", false);
      }
      const saved = await saveReminder(plugin, identity, {
        title: command.title,
        triggerType: "app_update",
        triggerAt: 0
      });
      await refreshReminderPanel();
      return result(
        `Ja. Beim nächsten Holo-Update erinnere ich dich an „${saved.title}“.`,
        true,
        { reminder: saved }
      );
    }

    if (command.action === "create_time") {
      const draft = await parseTimedReminder(command.message, identity);
      const saved = await saveReminder(plugin, identity, draft);
      await refreshReminderPanel();
      return result(
        `Ja. Ich erinnere dich ${formatReminderTrigger(saved)} an „${saved.title}“.`,
        true,
        { reminder: saved }
      );
    }

    const reminders = await listOwnerReminders(plugin, identity);
    if (command.action === "list") {
      await renderReminderPanel(reminders);
      return result(listAnswer(reminders), true, { reminders });
    }

    const matches = matchingReminders(reminders, command.query);
    if (matches.length === 0) {
      return result(
        `Ich finde keine eingestellte Holo-Erinnerung an „${command.query}“. Es wurde nichts verändert.`,
        false
      );
    }
    if (matches.length > 1) {
      return result(
        "Dazu passen mehrere Holo-Erinnerungen. Bitte nenne den vollständigen Text oder wähle sie unter Wichtiges aus. Es wurde nichts verändert.",
        false
      );
    }
    const existing = matches[0];

    if (command.action === "delete") {
      const cancelled = await plugin.cancelReminder({
        id: existing.id,
        ownerId: identity.ownerId
      });
      await refreshReminderPanel();
      return cancelled?.cancelled
        ? result(`„${existing.title}“ habe ich aus deinen Holo-Erinnerungen gelöscht.`)
        : result("Die Holo-Erinnerung wurde nicht gefunden. Es wurde nichts verändert.", false);
    }

    if (command.action === "rename") {
      if (!command.title) {
        return result("Wie soll die Holo-Erinnerung stattdessen heißen?", false);
      }
      const saved = await saveReminder(
        plugin,
        identity,
        {
          title: command.title,
          triggerType: existing.triggerType,
          triggerAt: existing.triggerAt
        },
        existing
      );
      await refreshReminderPanel();
      return result(`Die Holo-Erinnerung heißt jetzt „${saved.title}“.`);
    }

    if (command.action === "reschedule") {
      const nextUpdate = /\bnächste[nrs]?\b[\s\S]*\bupdate\b/iu.test(
        command.scheduleText
      );
      const draft = nextUpdate
        ? {
            title: existing.title,
            triggerType: "app_update",
            triggerAt: 0
          }
        : await parseTimedReminder(
            `Erinnere mich ${command.scheduleText} an ${existing.title}`,
            identity
          );
      const saved = await saveReminder(
        plugin,
        identity,
        { ...draft, title: existing.title },
        existing
      );
      await refreshReminderPanel();
      return result(
        `„${saved.title}“ habe ich auf ${formatReminderTrigger(saved)} geändert.`
      );
    }
  } catch (error) {
    return result(
      String(error?.message || "Die Holo-Erinnerung konnte gerade nicht sicher verarbeitet werden."),
      false
    );
  }

  return { handled: false };
}

function setPanelStatus(text) {
  const status = globalThis.document?.getElementById("holoReminderStatus");
  if (status) status.textContent = text;
}

async function editReminderFromPanel(reminder) {
  try {
    const identity = activeIdentity();
    const ready = await ensureReadyPlugin();
    if (!identity?.ownerId || !ready.plugin) {
      setPanelStatus(ready.error || "Die feste Holo-ID fehlt.");
      return;
    }
    const title = globalThis.window.prompt(
      "Woran soll Holo dich erinnern?",
      reminder.title
    );
    if (title === null) return;
    const cleanTitle = cleanReminderTitle(title);
    if (!cleanTitle) {
      setPanelStatus("Die Erinnerung braucht einen Text.");
      return;
    }

    let draft = {
      title: cleanTitle,
      triggerType: reminder.triggerType,
      triggerAt: reminder.triggerAt
    };
    if (reminder.triggerType === "time") {
      const current = new Date(Number(reminder.triggerAt || 0));
      const pad = value => String(value).padStart(2, "0");
      const localValue = Number.isFinite(current.getTime())
        ? `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}` +
          `T${pad(current.getHours())}:${pad(current.getMinutes())}`
        : "";
      const suppliedTime = globalThis.window.prompt(
        "Neuer Zeitpunkt (JJJJ-MM-TT HH:MM):",
        localValue.replace("T", " ")
      );
      if (suppliedTime === null) return;
      const triggerAt = Date.parse(suppliedTime.replace(" ", "T"));
      if (!Number.isFinite(triggerAt) || triggerAt < Date.now() + 15_000) {
        setPanelStatus("Bitte wähle einen eindeutigen zukünftigen Zeitpunkt.");
        return;
      }
      draft = { ...draft, triggerAt: new Date(triggerAt).toISOString() };
    }

    await saveReminder(ready.plugin, identity, draft, reminder);
    setPanelStatus("Holo-Erinnerung geändert ✅️");
    await refreshReminderPanel();
  } catch (error) {
    setPanelStatus(
      String(error?.message || "Die Holo-Erinnerung konnte nicht geändert werden.")
    );
  }
}

async function deleteReminderFromPanel(reminder) {
  if (!globalThis.window.confirm(`„${reminder.title}“ wirklich löschen?`)) return;
  try {
    const identity = activeIdentity();
    const ready = await ensureReadyPlugin({ notificationsRequired: false });
    if (!identity?.ownerId || !ready.plugin) {
      setPanelStatus(ready.error || "Die feste Holo-ID fehlt.");
      return;
    }
    const cancelled = await ready.plugin.cancelReminder({
      id: reminder.id,
      ownerId: identity.ownerId
    });
    setPanelStatus(
      cancelled?.cancelled
        ? "Holo-Erinnerung gelöscht."
        : "Die Holo-Erinnerung wurde nicht gefunden."
    );
    await refreshReminderPanel();
  } catch (error) {
    setPanelStatus(
      String(error?.message || "Die Holo-Erinnerung konnte nicht gelöscht werden.")
    );
  }
}

async function renderReminderPanel(reminders) {
  const list = globalThis.document?.getElementById("holoReminderList");
  const count = globalThis.document?.getElementById("holoReminderCount");
  const empty = globalThis.document?.getElementById("holoReminderEmpty");
  if (!list || !count || !empty) return;
  list.replaceChildren();
  count.textContent = String(reminders.length);
  empty.hidden = reminders.length > 0;

  for (const reminder of reminders) {
    const row = document.createElement("div");
    row.className = "holoReminderRow";

    const copy = document.createElement("div");
    copy.className = "holoReminderCopy";
    const title = document.createElement("strong");
    title.textContent = reminder.title;
    const time = document.createElement("span");
    time.textContent = formatReminderTrigger(reminder);
    copy.append(title, time);

    const actions = document.createElement("div");
    actions.className = "holoReminderActions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Ändern";
    edit.setAttribute("aria-label", `Erinnerung „${reminder.title}“ ändern`);
    edit.addEventListener("click", () => void editReminderFromPanel(reminder));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Löschen";
    remove.setAttribute("aria-label", `Erinnerung „${reminder.title}“ löschen`);
    remove.addEventListener("click", () => void deleteReminderFromPanel(reminder));
    actions.append(edit, remove);
    row.append(copy, actions);
    list.appendChild(row);
  }
}

async function refreshReminderPanel() {
  const identity = activeIdentity();
  const plugin = reminderPlugin();
  if (!identity?.ownerId || !plugin) {
    await renderReminderPanel([]);
    return [];
  }
  try {
    const reminders = await listOwnerReminders(plugin, identity);
    await renderReminderPanel(reminders);
    return reminders;
  } catch (error) {
    setPanelStatus("Holo-Erinnerungen konnten gerade nicht geladen werden.");
    return [];
  }
}

function installBrowserBridge() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  window.HumanHoloReminders = Object.freeze({
    matches: message => Boolean(reminderCommandFromMessage(message)),
    handle: handleReminderCommand,
    refresh: refreshReminderPanel
  });
  const refreshButton = document.getElementById("holoReminderRefreshButton");
  refreshButton?.addEventListener("click", () => void refreshReminderPanel());
  void refreshReminderPanel();
}

installBrowserBridge();
