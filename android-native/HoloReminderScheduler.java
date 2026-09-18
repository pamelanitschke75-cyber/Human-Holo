package com.solholo.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import org.json.JSONObject;

final class HoloReminderScheduler {
    static final String EXTRA_REMINDER_ID = "human_holo_reminder_id";

    private HoloReminderScheduler() {}

    static void schedule(Context context, JSONObject reminder) {
        if (!"time".equals(reminder.optString("triggerType"))) return;
        String id = reminder.optString("id");
        if (id.isEmpty()) return;
        long triggerAt = reminder.optLong("triggerAt", 0L);
        if (triggerAt <= 0L) return;

        AlarmManager manager = (AlarmManager) context.getSystemService(
            Context.ALARM_SERVICE
        );
        if (manager == null) {
            throw new IllegalStateException("REMINDER_ALARM_SERVICE_UNAVAILABLE");
        }

        long safeTriggerAt = Math.max(
            triggerAt,
            System.currentTimeMillis() + 1_000L
        );
        PendingIntent pendingIntent = pendingIntent(
            context,
            id
        );
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            manager.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                safeTriggerAt,
                pendingIntent
            );
        } else {
            manager.set(
                AlarmManager.RTC_WAKEUP,
                safeTriggerAt,
                pendingIntent
            );
        }
    }

    static void cancel(Context context, String id) {
        AlarmManager manager = (AlarmManager) context.getSystemService(
            Context.ALARM_SERVICE
        );
        if (manager != null) {
            manager.cancel(pendingIntent(context, id));
        }
    }

    private static PendingIntent pendingIntent(Context context, String id) {
        Intent intent = new Intent(context, HoloReminderReceiver.class)
            .setAction("com.solholo.app.HOLO_REMINDER." + id)
            .putExtra(EXTRA_REMINDER_ID, id);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        return PendingIntent.getBroadcast(
            context,
            requestCode(id),
            intent,
            flags
        );
    }

    static int requestCode(String id) {
        return String.valueOf(id).hashCode() & 0x7fffffff;
    }
}
