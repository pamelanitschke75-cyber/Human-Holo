package com.solholo.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.content.pm.PackageInfoCompat;

import org.json.JSONArray;
import org.json.JSONObject;

public class HoloReminderRescheduleReceiver extends BroadcastReceiver {
    static long currentVersion(Context context) throws Exception {
        return PackageInfoCompat.getLongVersionCode(
            context.getPackageManager().getPackageInfo(
                context.getPackageName(),
                0
            )
        );
    }

    static void rescheduleAndDeliver(Context context) throws Exception {
        JSONArray reminders = HoloReminderStore.list(context);
        long now = System.currentTimeMillis();
        long currentVersion = currentVersion(context);
        for (int index = 0; index < reminders.length(); index += 1) {
            JSONObject reminder = reminders.optJSONObject(index);
            if (reminder == null) continue;
            String id = reminder.optString("id");
            String triggerType = reminder.optString("triggerType");
            if (
                "app_update".equals(triggerType) &&
                reminder.optLong("createdVersion", currentVersion) < currentVersion
            ) {
                if (HoloReminderNotifications.show(context, reminder)) {
                    HoloReminderStore.remove(context, id);
                }
                continue;
            }
            if ("time".equals(triggerType)) {
                long triggerAt = reminder.optLong("triggerAt", 0L);
                if (triggerAt > 0L) {
                    if (triggerAt < now) {
                        reminder.put("triggerAt", now + 5_000L);
                    }
                    HoloReminderScheduler.schedule(context, reminder);
                }
            }
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? "" : String.valueOf(intent.getAction());
        if (
            !Intent.ACTION_BOOT_COMPLETED.equals(action) &&
            !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
        ) {
            return;
        }
        PendingResult pendingResult = goAsync();
        new Thread(() -> {
            try {
                rescheduleAndDeliver(context);
            } catch (Exception error) {
                android.util.Log.e(
                    "HumanHoloReminder",
                    "Private Erinnerungen konnten nicht neu eingeplant werden.",
                    error
                );
            } finally {
                pendingResult.finish();
            }
        }, "human-holo-reminder-reschedule").start();
    }
}
