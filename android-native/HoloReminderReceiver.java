package com.solholo.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import org.json.JSONObject;

public class HoloReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String id = intent == null
            ? ""
            : intent.getStringExtra(HoloReminderScheduler.EXTRA_REMINDER_ID);
        if (id == null || id.isEmpty()) return;

        PendingResult pendingResult = goAsync();
        new Thread(() -> {
            try {
                JSONObject reminder = HoloReminderStore.find(context, id);
                if (
                    reminder == null ||
                    !"time".equals(reminder.optString("triggerType"))
                ) {
                    return;
                }
                long triggerAt = reminder.optLong("triggerAt", 0L);
                if (triggerAt > System.currentTimeMillis() + 60_000L) {
                    HoloReminderScheduler.schedule(context, reminder);
                    return;
                }
                if (HoloReminderNotifications.show(context, reminder)) {
                    HoloReminderStore.remove(context, id);
                }
            } catch (Exception error) {
                android.util.Log.e(
                    "HumanHoloReminder",
                    "Private Erinnerung konnte nicht ausgelöst werden.",
                    error
                );
            } finally {
                pendingResult.finish();
            }
        }, "human-holo-reminder").start();
    }
}
