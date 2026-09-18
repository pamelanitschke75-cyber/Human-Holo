package com.solholo.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONObject;

final class HoloReminderNotifications {
    private static final String CHANNEL_ID = "human_holo_private_reminders";

    private HoloReminderNotifications() {}

    static boolean canNotify(Context context) {
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return false;
        }
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) {
            return false;
        }
        NotificationManager manager = (NotificationManager) context
            .getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = manager.getNotificationChannel(CHANNEL_ID);
            if (
                channel != null &&
                channel.getImportance() == NotificationManager.IMPORTANCE_NONE
            ) {
                return false;
            }
        }
        return true;
    }

    static boolean show(Context context, JSONObject reminder) {
        NotificationManager manager = (NotificationManager) context
            .getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return false;
        ensureChannel(manager);
        if (!canNotify(context)) return false;

        String id = reminder.optString("id");
        String title = reminder.optString("title", "Deine Holo-Erinnerung");
        Intent openApp = new Intent(context, MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP)
            .putExtra(HoloReminderScheduler.EXTRA_REMINDER_ID, id);
        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent contentIntent = PendingIntent.getActivity(
            context,
            HoloReminderScheduler.requestCode(id),
            openApp,
            pendingFlags
        );

        Notification publicVersion = new NotificationCompat.Builder(
            context,
            CHANNEL_ID
        )
            .setSmallIcon(context.getApplicationInfo().icon)
            .setContentTitle("Pam’s Holo")
            .setContentText("Private Erinnerung")
            .build();

        Notification notification = new NotificationCompat.Builder(
            context,
            CHANNEL_ID
        )
            .setSmallIcon(context.getApplicationInfo().icon)
            .setContentTitle("Pam’s Holo erinnert dich")
            .setContentText(title)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(title))
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setPublicVersion(publicVersion)
            .setContentIntent(contentIntent)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .setLocalOnly(false)
            .build();

        manager.notify(
            53_000 + Math.abs(HoloReminderScheduler.requestCode(id) % 10_000),
            notification
        );
        return true;
    }

    private static void ensureChannel(NotificationManager manager) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Holo-Erinnerungen",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription(
            "Ownergebundene Erinnerungen von Pam’s Holo."
        );
        channel.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
        manager.createNotificationChannel(channel);
    }
}
