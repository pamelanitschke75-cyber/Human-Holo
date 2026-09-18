package com.solholo.app;

import android.Manifest;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.regex.Pattern;

@CapacitorPlugin(
    name = "HoloReminder",
    permissions = {
        @Permission(
            alias = "notifications",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
public class HoloReminderPlugin extends Plugin {
    private static final Pattern SAFE_ID = Pattern.compile("^[A-Za-z0-9_-]{8,100}$");
    private static final long MAX_FUTURE_MS = 5L * 366L * 24L * 60L * 60L * 1000L;

    private boolean notificationsGranted() {
        return HoloReminderNotifications.canNotify(getContext());
    }

    private JSObject status() {
        JSObject result = new JSObject();
        result.put("supported", true);
        result.put("notificationsGranted", notificationsGranted());
        result.put("ownerScoped", true);
        result.put("encryptedAtRest", true);
        result.put("survivesAppUpdates", true);
        result.put("supportsNextAppUpdate", true);
        return result;
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        restoreDeliveryWhenAllowed();
        call.resolve(status());
    }

    @PluginMethod
    public void requestNotificationAccess(PluginCall call) {
        if (
            Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            getPermissionState("notifications") == PermissionState.GRANTED
        ) {
            call.resolve(status());
            return;
        }
        requestPermissionForAlias(
            "notifications",
            call,
            "notificationPermissionCallback"
        );
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        restoreDeliveryWhenAllowed();
        call.resolve(status());
    }

    @PluginMethod
    public void scheduleReminder(PluginCall call) {
        if (!notificationsGranted()) {
            call.reject(
                "Für Holo-Erinnerungen fehlt die Benachrichtigungsfreigabe.",
                "HOLO_REMINDER_NOTIFICATION_PERMISSION_REQUIRED"
            );
            return;
        }

        String id = clean(call.getString("id", ""), 100);
        String ownerId = clean(call.getString("ownerId", ""), 240);
        String title = clean(call.getString("title", ""), 240);
        String triggerType = clean(call.getString("triggerType", "time"), 40);
        Long triggerAt = call.getLong("triggerAt");
        if (!SAFE_ID.matcher(id).matches() || ownerId.isEmpty() || title.isEmpty()) {
            call.reject("Die Holo-Erinnerung ist unvollständig.", "HOLO_REMINDER_INVALID");
            return;
        }
        if (!"time".equals(triggerType) && !"app_update".equals(triggerType)) {
            call.reject("Der Erinnerungsauslöser ist ungültig.", "HOLO_REMINDER_TRIGGER_INVALID");
            return;
        }
        long now = System.currentTimeMillis();
        if (
            "time".equals(triggerType) &&
            (
                triggerAt == null ||
                triggerAt < now + 15_000L ||
                triggerAt > now + MAX_FUTURE_MS
            )
        ) {
            call.reject("Die Erinnerungszeit ist ungültig.", "HOLO_REMINDER_TIME_INVALID");
            return;
        }

        try {
            JSONObject existing = HoloReminderStore.find(getContext(), id);
            if (
                existing != null &&
                !HoloReminderStore.ownerHash(ownerId).equals(
                    existing.optString("ownerHash")
                )
            ) {
                call.reject(
                    "Diese Holo-Erinnerung gehört nicht zum aktiven Owner.",
                    "HOLO_REMINDER_OWNER_MISMATCH"
                );
                return;
            }

            HoloReminderScheduler.cancel(getContext(), id);
            JSONObject reminder = new JSONObject();
            reminder.put("id", id);
            reminder.put("ownerHash", HoloReminderStore.ownerHash(ownerId));
            reminder.put("title", title);
            reminder.put("triggerType", triggerType);
            reminder.put("triggerAt", "time".equals(triggerType) ? triggerAt : 0L);
            reminder.put(
                "createdAt",
                existing == null ? now : existing.optLong("createdAt", now)
            );
            reminder.put("updatedAt", now);
            reminder.put(
                "createdVersion",
                "app_update".equals(triggerType) || existing == null
                    ? BuildConfig.VERSION_CODE
                    : existing.optInt("createdVersion", BuildConfig.VERSION_CODE)
            );
            HoloReminderStore.upsert(getContext(), reminder);
            HoloReminderScheduler.schedule(getContext(), reminder);
            call.resolve(publicReminder(reminder));
        } catch (Exception error) {
            call.reject(
                "Die Holo-Erinnerung konnte nicht sicher gespeichert werden.",
                "HOLO_REMINDER_STORE_FAILED",
                error
            );
        }
    }

    @PluginMethod
    public void listReminders(PluginCall call) {
        String ownerId = clean(call.getString("ownerId", ""), 240);
        if (ownerId.isEmpty()) {
            call.reject("Die feste Holo-ID fehlt.", "HOLO_REMINDER_OWNER_REQUIRED");
            return;
        }
        try {
            String ownerHash = HoloReminderStore.ownerHash(ownerId);
            JSONArray stored = HoloReminderStore.list(getContext());
            JSArray reminders = new JSArray();
            for (int index = 0; index < stored.length(); index += 1) {
                JSONObject reminder = stored.optJSONObject(index);
                if (
                    reminder != null &&
                    ownerHash.equals(reminder.optString("ownerHash"))
                ) {
                    reminders.put(publicReminder(reminder));
                }
            }
            JSObject result = new JSObject();
            result.put("reminders", reminders);
            result.put("ownerScoped", true);
            call.resolve(result);
        } catch (Exception error) {
            call.reject(
                "Die Holo-Erinnerungen konnten nicht sicher gelesen werden.",
                "HOLO_REMINDER_READ_FAILED",
                error
            );
        }
    }

    @PluginMethod
    public void cancelReminder(PluginCall call) {
        String id = clean(call.getString("id", ""), 100);
        String ownerId = clean(call.getString("ownerId", ""), 240);
        if (!SAFE_ID.matcher(id).matches() || ownerId.isEmpty()) {
            call.reject("Die Holo-Erinnerung ist unvollständig.", "HOLO_REMINDER_INVALID");
            return;
        }
        try {
            JSONObject reminder = HoloReminderStore.find(getContext(), id);
            if (reminder == null) {
                JSObject result = new JSObject();
                result.put("cancelled", false);
                result.put("notFound", true);
                call.resolve(result);
                return;
            }
            if (
                !HoloReminderStore.ownerHash(ownerId).equals(
                    reminder.optString("ownerHash")
                )
            ) {
                call.reject(
                    "Diese Holo-Erinnerung gehört nicht zum aktiven Owner.",
                    "HOLO_REMINDER_OWNER_MISMATCH"
                );
                return;
            }
            HoloReminderScheduler.cancel(getContext(), id);
            boolean removed = HoloReminderStore.remove(getContext(), id);
            JSObject result = new JSObject();
            result.put("cancelled", removed);
            result.put("id", id);
            call.resolve(result);
        } catch (Exception error) {
            call.reject(
                "Die Holo-Erinnerung konnte nicht sicher gelöscht werden.",
                "HOLO_REMINDER_DELETE_FAILED",
                error
            );
        }
    }

    private JSObject publicReminder(JSONObject reminder) {
        JSObject result = new JSObject();
        result.put("id", reminder.optString("id"));
        result.put("title", reminder.optString("title"));
        result.put("triggerType", reminder.optString("triggerType"));
        result.put("triggerAt", reminder.optLong("triggerAt", 0L));
        result.put("createdAt", reminder.optLong("createdAt", 0L));
        result.put("updatedAt", reminder.optLong("updatedAt", 0L));
        result.put("ownerScoped", true);
        result.put("encryptedAtRest", true);
        return result;
    }

    private void restoreDeliveryWhenAllowed() {
        if (!notificationsGranted()) return;
        try {
            HoloReminderRescheduleReceiver.rescheduleAndDeliver(getContext());
        } catch (Exception error) {
            android.util.Log.e(
                "HumanHoloReminder",
                "Private Erinnerungen konnten nicht wieder aktiviert werden.",
                error
            );
        }
    }

    private String clean(String value, int maxLength) {
        String clean = String.valueOf(value == null ? "" : value).trim();
        return clean.length() > maxLength
            ? clean.substring(0, maxLength).trim()
            : clean;
    }
}
