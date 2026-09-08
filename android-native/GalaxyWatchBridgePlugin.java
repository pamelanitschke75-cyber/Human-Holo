package com.solholo.app;

import android.Manifest;
import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "GalaxyWatchBridge",
    permissions = {
        @Permission(
            alias = "notifications",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
public class GalaxyWatchBridgePlugin extends Plugin {
    private static final String GALAXY_WEARABLE_PACKAGE =
        "com.samsung.android.app.watchmanager";
    private static final String CHANNEL_ID = "human_holo_private_watch";
    private static final int BASE_NOTIFICATION_ID = 4280;

    private boolean notificationsGranted() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(
                getContext(),
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean galaxyWearableInstalled() {
        return getContext()
            .getPackageManager()
            .getLaunchIntentForPackage(GALAXY_WEARABLE_PACKAGE) != null;
    }

    private JSObject status() {
        boolean wearableInstalled = galaxyWearableInstalled();
        boolean permissionGranted = notificationsGranted();
        JSObject result = new JSObject();
        result.put("supported", true);
        result.put("watchModel", "Galaxy Watch 8");
        result.put("galaxyWearableInstalled", wearableInstalled);
        result.put("notificationsGranted", permissionGranted);
        result.put("relayReady", wearableInstalled && permissionGranted);
        result.put("relayMode", "android_notification_bridge");
        result.put("directVoiceControlSupported", false);
        result.put("ownerScopedSummaryOnly", true);
        result.put("rawAudioTransferred", false);
        result.put("personalMemoryTransferred", false);
        return result;
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
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
        call.resolve(status());
    }

    @PluginMethod
    public void openGalaxyWearable(PluginCall call) {
        Activity activity = getActivity();
        Intent intent = getContext()
            .getPackageManager()
            .getLaunchIntentForPackage(GALAXY_WEARABLE_PACKAGE);
        if (activity == null || intent == null) {
            call.reject(
                "Galaxy Wearable wurde auf diesem Handy nicht gefunden.",
                "GALAXY_WEARABLE_NOT_INSTALLED"
            );
            return;
        }
        try {
            activity.startActivity(intent);
            JSObject result = new JSObject();
            result.put("opened", true);
            call.resolve(result);
        } catch (ActivityNotFoundException | SecurityException error) {
            call.reject(
                "Galaxy Wearable konnte gerade nicht geöffnet werden.",
                "GALAXY_WEARABLE_OPEN_FAILED",
                error
            );
        }
    }

    private String[] fixedSummary(String kind) {
        switch (kind) {
            case "alarm":
                return new String[] {
                    "Human Holo · Wecker",
                    "Ein Wecker wurde auf deinem Galaxy S23 gestellt."
                };
            case "navigation":
                return new String[] {
                    "Human Holo · Route",
                    "Die Navigation wurde auf deinem Galaxy S23 gestartet."
                };
            case "calendar":
                return new String[] {
                    "Human Holo · Kalender",
                    "Ein Kalenderauftrag wurde auf deinem Galaxy S23 vorbereitet."
                };
            case "note":
                return new String[] {
                    "Human Holo · Notiz",
                    "Eine Notiz wurde geschützt in Human Holo gespeichert."
                };
            default:
                return new String[] {
                    "Human Holo",
                    "Die privaten Watch-Hinweise sind bereit."
                };
        }
    }

    private void ensureNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) getContext()
            .getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Private Galaxy-Watch-Hinweise",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription(
            "Inhaltsarme Human-Holo-Hinweise für Pams verbundene Galaxy Watch."
        );
        channel.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);
        manager.createNotificationChannel(channel);
    }

    @PluginMethod
    public void sendPrivateSummary(PluginCall call) {
        if (!notificationsGranted()) {
            call.reject(
                "Für Watch-Hinweise fehlt die Benachrichtigungsfreigabe.",
                "WATCH_NOTIFICATION_PERMISSION_REQUIRED"
            );
            return;
        }

        String kind = call.getString("kind", "test").trim().toLowerCase();
        String[] summary = fixedSummary(kind);
        ensureNotificationChannel();

        Intent openApp = new Intent(getContext(), MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent contentIntent = PendingIntent.getActivity(
            getContext(),
            0,
            openApp,
            pendingFlags
        );

        Notification publicVersion = new NotificationCompat.Builder(
            getContext(),
            CHANNEL_ID
        )
            .setSmallIcon(getContext().getApplicationInfo().icon)
            .setContentTitle("Human Holo")
            .setContentText("Privater Hinweis")
            .build();
        Notification notification = new NotificationCompat.Builder(
            getContext(),
            CHANNEL_ID
        )
            .setSmallIcon(getContext().getApplicationInfo().icon)
            .setContentTitle(summary[0])
            .setContentText(summary[1])
            .setStyle(new NotificationCompat.BigTextStyle().bigText(summary[1]))
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setPublicVersion(publicVersion)
            .setContentIntent(contentIntent)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .setLocalOnly(false)
            .build();

        NotificationManager manager = (NotificationManager) getContext()
            .getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) {
            call.reject(
                "Der Android-Benachrichtigungsdienst ist nicht verfügbar.",
                "WATCH_NOTIFICATION_SERVICE_UNAVAILABLE"
            );
            return;
        }
        manager.notify(BASE_NOTIFICATION_ID + Math.abs(kind.hashCode() % 100), notification);

        JSObject result = new JSObject();
        result.put("sent", true);
        result.put("kind", kind);
        result.put("ownerScopedSummaryOnly", true);
        result.put("rawAudioTransferred", false);
        result.put("personalMemoryTransferred", false);
        call.resolve(result);
    }
}
