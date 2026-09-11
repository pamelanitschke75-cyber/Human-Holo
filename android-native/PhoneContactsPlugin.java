package com.solholo.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ComponentName;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.ContactsContract;
import android.provider.AlarmClock;
import android.provider.CalendarContract;
import android.provider.Settings;
import android.telephony.PhoneNumberUtils;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyCallback;
import android.telephony.TelephonyManager;
import android.text.TextUtils;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.HashSet;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;

@CapacitorPlugin(
    name = "PhoneContacts",
    permissions = {
        @Permission(
            alias = "contacts",
            strings = { Manifest.permission.READ_CONTACTS }
        ),
        @Permission(
            alias = "phoneState",
            strings = { Manifest.permission.READ_PHONE_STATE }
        ),
        @Permission(
            alias = "directCall",
            strings = { Manifest.permission.CALL_PHONE }
        ),
        @Permission(
            alias = "calendar",
            strings = {
                Manifest.permission.READ_CALENDAR,
                Manifest.permission.WRITE_CALENDAR
            }
        )
    }
)
public class PhoneContactsPlugin extends Plugin {
    private static final String GOOGLE_MAPS_PACKAGE =
        "com.google.android.apps.maps";
    private static final String SAMSUNG_NOTES_PACKAGE =
        "com.samsung.android.app.notes";
    private static final String GOOGLE_CREATE_NOTE_ACTION =
        "com.google.android.gms.actions.CREATE_NOTE";
    private static final String GOOGLE_NOTE_NAME_EXTRA =
        "com.google.android.gms.actions.extra.NAME";
    private static final String GOOGLE_NOTE_TEXT_EXTRA =
        "com.google.android.gms.actions.extra.TEXT";
    private static final String NOTE_PREFERENCES = "sol_holo_shared_notes";
    private static final String NOTE_TEXT_KEY = "pending_note_text";
    private static final String NOTE_TITLE_KEY = "pending_note_title";
    private static final String NOTE_TRUNCATED_KEY = "pending_note_truncated";
    private static final int MAX_SHARED_NOTE_LENGTH = 3200;
    private static final int MAX_SHARED_NOTE_TITLE_LENGTH = 160;
    private static final int MAX_MAPS_DESTINATION_LENGTH = 500;
    private static final int MAX_ALARM_LABEL_LENGTH = 160;
    private static final int MAX_CALENDAR_TITLE_LENGTH = 240;
    private static final int MAX_CALENDAR_DESCRIPTION_LENGTH = 2000;
    private static final long CALENDAR_DUPLICATE_WINDOW_MILLIS = 2 * 60 * 1000L;
    private static final String CALENDAR_PREFERENCES =
        "human_holo_direct_calendar";
    private static final String CALENDAR_FINGERPRINT_KEY =
        "last_event_fingerprint";
    private static final String CALENDAR_EVENT_ID_KEY = "last_event_id";
    private static final String CALENDAR_SAVED_AT_KEY = "last_event_saved_at";
    private static final int MAX_SMS_LENGTH = 5000;
    private static final int MAX_WHATSAPP_MESSAGE_LENGTH = 5000;
    private static final int MAX_RECIPIENT_NAME_LENGTH = 160;
    private static final int MAX_CONTACT_ALIAS_LENGTH = 60;
    private static final String WHATSAPP_PACKAGE = "com.whatsapp";
    private static final String WHATSAPP_BUSINESS_PACKAGE =
        "com.whatsapp.w4b";
    private static final String CONTACT_ALIAS_PREFERENCES =
        "sol_holo_contact_aliases";
    private static final String ADAC_PANNENHILFE_DE_SERVICE_ID =
        "adac_pannenhilfe_de";
    private static final String ADAC_PANNENHILFE_DE_NUMBER =
        "08920204000";
    private static final String ADAC_PANNENHILFE_DE_LABEL =
        "ADAC Pannenhilfe Deutschland";
    private static final Set<String> SAFE_SERVICE_DIALER_NUMBERS =
        new HashSet<>();
    static {
        SAFE_SERVICE_DIALER_NUMBERS.add("112");
        SAFE_SERVICE_DIALER_NUMBERS.add("110");
        SAFE_SERVICE_DIALER_NUMBERS.add("116117");
    }
    private static volatile PhoneContactsPlugin activePlugin;

    private TelephonyManager telephonyManager;
    private TelephonyCallback telephonyCallback;
    private PhoneStateListener legacyPhoneStateListener;
    private int currentCallState = TelephonyManager.CALL_STATE_IDLE;
    private PluginCall pendingExternalActionCall;
    private AlertDialog pendingExternalActionDialog;
    private PluginCall pendingDirectCallPermissionCall;
    private DirectCallTarget pendingDirectCallPermissionTarget;

    private static final class SamsungNoteLaunch {
        final Intent intent;
        final String mode;

        SamsungNoteLaunch(Intent intent, String mode) {
            this.intent = intent;
            this.mode = mode;
        }
    }

    private static final class ContactRecord {
        final long id;
        final String name;
        final String number;
        final String normalizedNumber;
        final String label;

        ContactRecord(
            long id,
            String name,
            String number,
            String normalizedNumber,
            String label
        ) {
            this.id = id;
            this.name = name == null ? "" : name;
            this.number = number == null ? "" : number;
            this.normalizedNumber = normalizedNumber == null
                ? ""
                : normalizedNumber;
            this.label = label == null ? "" : label;
        }
    }

    private static final class WritableCalendar {
        final long id;
        final String displayName;

        WritableCalendar(long id, String displayName) {
            this.id = id;
            this.displayName = displayName == null ? "" : displayName;
        }
    }

    private static final class DirectCallTarget {
        final String number;
        final String recipientName;
        final String targetType;
        final boolean contactReverifiedOnDevice;

        DirectCallTarget(
            String number,
            String recipientName,
            String targetType,
            boolean contactReverifiedOnDevice
        ) {
            this.number = number == null ? "" : number;
            this.recipientName = recipientName == null ? "" : recipientName;
            this.targetType = targetType == null ? "" : targetType;
            this.contactReverifiedOnDevice = contactReverifiedOnDevice;
        }
    }

    @Override
    public void load() {
        activePlugin = this;
        registerCallStateListener();
    }

    @Override
    protected void handleOnResume() {
        super.handleOnResume();
        registerCallStateListener();
        notifyListeners("phoneStatusChanged", status(), true);
    }

    @Override
    protected void handleOnDestroy() {
        unregisterCallStateListener();
        cancelPendingExternalAction();
        cancelPendingDirectCallPermission();
        WhatsAppAutoSendCommand.Pending pending =
            WhatsAppAutoSendCommand.peek();
        if (pending != null) {
            WhatsAppAutoSendCommand.cancel(pending.token);
        }
        if (activePlugin == this) {
            activePlugin = null;
        }
        super.handleOnDestroy();
    }

    public static boolean handleSharedNoteIntent(Context context, Intent intent) {
        if (
            context == null
                || intent == null
                || !Intent.ACTION_SEND.equals(intent.getAction())
        ) {
            return false;
        }

        String mimeType = intent.getType();
        if (mimeType != null && !mimeType.startsWith("text/")) {
            return false;
        }

        CharSequence sharedText = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
        String text = sharedText == null ? "" : sharedText.toString().trim();
        if (text.isEmpty()) {
            return false;
        }

        String title = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        title = title == null ? "" : title.trim();
        if (title.length() > MAX_SHARED_NOTE_TITLE_LENGTH) {
            title = title.substring(0, MAX_SHARED_NOTE_TITLE_LENGTH).trim();
        }

        boolean truncated = text.length() > MAX_SHARED_NOTE_LENGTH;
        if (truncated) {
            text = text.substring(0, MAX_SHARED_NOTE_LENGTH).trim();
        }

        context
            .getSharedPreferences(NOTE_PREFERENCES, Context.MODE_PRIVATE)
            .edit()
            .putString(NOTE_TEXT_KEY, text)
            .putString(NOTE_TITLE_KEY, title)
            .putBoolean(NOTE_TRUNCATED_KEY, truncated)
            .apply();

        intent.removeExtra(Intent.EXTRA_TEXT);
        intent.removeExtra(Intent.EXTRA_SUBJECT);

        PhoneContactsPlugin plugin = activePlugin;
        if (plugin != null) {
            JSObject event = new JSObject();
            event.put("available", true);
            event.put("characterCount", text.length());
            event.put("truncated", truncated);
            plugin.notifyListeners("sharedNoteReceived", event, true);
        }

        return true;
    }

    public static void publishWhatsAppAutoSendResult(
        String token,
        String recipientName,
        String message,
        boolean sendControlActivated,
        String reason
    ) {
        PhoneContactsPlugin plugin = activePlugin;
        if (plugin == null) {
            return;
        }
        JSObject event = new JSObject();
        event.put("token", token == null ? "" : token);
        event.put(
            "recipientName",
            recipientName == null ? "" : recipientName
        );
        event.put("message", message == null ? "" : message);
        event.put("automaticSendRequested", true);
        event.put("sendControlActivated", sendControlActivated);
        event.put("sent", sendControlActivated);
        event.put("deliveryConfirmed", false);
        event.put("manualTypingRequired", false);
        event.put("manualSendRequired", false);
        event.put("executedBy", "Pam’s Holo");
        event.put("reason", reason == null ? "" : reason);
        plugin.notifyListeners("whatsAppAutoSendResult", event, true);
    }

    private boolean contactsGranted() {
        return ContextCompat.checkSelfPermission(
            getContext(),
            Manifest.permission.READ_CONTACTS
        ) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean phoneStateGranted() {
        return ContextCompat.checkSelfPermission(
            getContext(),
            Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean directCallGranted() {
        return ContextCompat.checkSelfPermission(
            getContext(),
            Manifest.permission.CALL_PHONE
        ) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean calendarGranted() {
        return ContextCompat.checkSelfPermission(
            getContext(),
            Manifest.permission.READ_CALENDAR
        ) == PackageManager.PERMISSION_GRANTED &&
        ContextCompat.checkSelfPermission(
            getContext(),
            Manifest.permission.WRITE_CALENDAR
        ) == PackageManager.PERMISSION_GRANTED;
    }

    private WritableCalendar writableCalendar() {
        if (!calendarGranted()) {
            return null;
        }

        String[] projection = new String[] {
            CalendarContract.Calendars._ID,
            CalendarContract.Calendars.CALENDAR_DISPLAY_NAME,
            CalendarContract.Calendars.ACCOUNT_NAME,
            CalendarContract.Calendars.ACCOUNT_TYPE,
            CalendarContract.Calendars.IS_PRIMARY,
            CalendarContract.Calendars.SYNC_EVENTS
        };
        String selection =
            CalendarContract.Calendars.VISIBLE + " = 1 AND " +
            CalendarContract.Calendars.SYNC_EVENTS + " = 1 AND " +
            CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL + " >= ?";
        String[] selectionArgs = new String[] {
            String.valueOf(CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR)
        };

        WritableCalendar selected = null;
        int selectedScore = Integer.MIN_VALUE;
        try (Cursor cursor = getContext().getContentResolver().query(
            CalendarContract.Calendars.CONTENT_URI,
            projection,
            selection,
            selectionArgs,
            null
        )) {
            if (cursor == null) {
                return null;
            }
            while (cursor.moveToNext()) {
                long id = cursor.getLong(0);
                String displayName = cursor.getString(1);
                String accountName = cursor.getString(2);
                String accountType = cursor.getString(3);
                boolean primary = !cursor.isNull(4) && cursor.getInt(4) == 1;
                boolean synced = !cursor.isNull(5) && cursor.getInt(5) == 1;
                int score = 0;
                if (primary) score += 1000;
                if ("com.google".equals(accountType)) score += 500;
                if (synced) score += 100;
                if (
                    accountName != null &&
                    accountName.toLowerCase(Locale.ROOT).endsWith("@gmail.com")
                ) {
                    score += 50;
                }
                if ("mein kalender".equalsIgnoreCase(displayName)) score += 25;

                if (selected == null || score > selectedScore) {
                    selected = new WritableCalendar(id, displayName);
                    selectedScore = score;
                }
            }
        } catch (SecurityException | IllegalArgumentException error) {
            return null;
        }
        return selected;
    }

    private JSObject calendarStatus() {
        boolean permissionGranted = calendarGranted();
        WritableCalendar calendar = permissionGranted
            ? writableCalendar()
            : null;
        JSObject result = new JSObject();
        result.put("supported", true);
        result.put("permissionGranted", permissionGranted);
        result.put("writableCalendarAvailable", calendar != null);
        result.put("directWriteSupported", true);
        result.put("opensExternalApp", false);
        result.put("reviewAndSaveRequired", false);
        result.put("accessCanBeRevoked", true);
        return result;
    }

    private ComponentName whatsAppAutoSendComponent() {
        return new ComponentName(
            getContext(),
            WhatsAppAutoSendAccessibilityService.class
        );
    }

    private boolean whatsAppAutoSendAccessEnabled() {
        String enabledServices = Settings.Secure.getString(
            getContext().getContentResolver(),
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );
        if (TextUtils.isEmpty(enabledServices)) {
            return false;
        }

        ComponentName expected = whatsAppAutoSendComponent();
        TextUtils.SimpleStringSplitter splitter =
            new TextUtils.SimpleStringSplitter(':');
        splitter.setString(enabledServices);
        while (splitter.hasNext()) {
            ComponentName enabled = ComponentName.unflattenFromString(
                splitter.next()
            );
            if (expected.equals(enabled)) {
                return true;
            }
        }
        return false;
    }

    private JSObject whatsAppAutoSendStatus() {
        JSObject result = new JSObject();
        result.put("supported", true);
        result.put("accessEnabled", whatsAppAutoSendAccessEnabled());
        result.put("explicitOwnerCommandRequired", true);
        result.put("contactMustBeUnique", true);
        result.put("messageMustMatchExactly", true);
        result.put("singleUseCommand", true);
        result.put("commandExpiresAfterMillis", 30_000);
        result.put("packageScope", "com.whatsapp,com.whatsapp.w4b");
        result.put("screenDataStored", false);
        result.put("screenDataUploaded", false);
        result.put("messagePersisted", false);
        result.put("canBeDisabledInAndroidSettings", true);
        return result;
    }

    private boolean telephonySupported() {
        return getContext()
            .getPackageManager()
            .hasSystemFeature(PackageManager.FEATURE_TELEPHONY);
    }

    private JSObject status() {
        JSObject result = new JSObject();
        result.put("supported", telephonySupported());
        result.put("contactsPermissionGranted", contactsGranted());
        result.put("phoneStatePermissionGranted", phoneStateGranted());
        result.put("directCallPermissionGranted", directCallGranted());
        result.put(
            "connected",
            contactsGranted() && phoneStateGranted()
        );
        result.put("permissionsCanBeRevoked", true);
        result.put(
            "contactsPermissionPurpose",
            "Das vollständige Android-Kontaktverzeichnis bleibt auf diesem Gerät und wird nur nach einem ausdrücklich genannten Empfänger durchsucht."
        );
        result.put("contactDirectoryScope", "all_device_contacts");
        result.put("contactsUploaded", false);
        result.put("contactAliasesOwnerScoped", true);
        result.put(
            "phoneStatePermissionPurpose",
            "Der Telefonstatus wird nur erkannt, damit Pam’s Holo während eines Anrufs pausiert."
        );
        result.put(
            "directCallPermissionPurpose",
            "Nach einem ausdrücklichen Auftrag und einer sichtbaren Bestätigung startet Human Holo genau einen Anruf an den erneut geprüften Kontakt oder die fest hinterlegte ADAC-Pannenhilfe."
        );
        result.put("directContactCallsSupported", telephonySupported());
        result.put("directHelpServiceCallsSupported", telephonySupported());
        result.put("outgoingCallsDirectlyStarted", true);
        result.put("emergencyCallsDirectlyStarted", false);
        result.put("emergencyCallsRequireDefaultDialer", true);
        result.put("smsDirectlySent", false);
        result.put(
            "whatsAppDirectSendEnabled",
            whatsAppAutoSendAccessEnabled()
        );
        result.put("whatsAppAutoSendRequiresExplicitCommand", true);
        result.put("whatsAppAutoSendScreenDataStored", false);
        result.put("visibleActionConfirmationRequired", true);
        result.put("callState", callStateName(currentCallState));
        result.put(
            "incomingCall",
            currentCallState == TelephonyManager.CALL_STATE_RINGING
        );
        return result;
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void getWhatsAppAutoSendStatus(PluginCall call) {
        call.resolve(whatsAppAutoSendStatus());
    }

    @PluginMethod
    public void requestWhatsAppAutoSendAccess(PluginCall call) {
        if (whatsAppAutoSendAccessEnabled()) {
            call.resolve(whatsAppAutoSendStatus());
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject(
                "Die Android-Bedienungshilfe konnte gerade nicht geöffnet werden.",
                "WHATSAPP_AUTO_SEND_SETTINGS_UNAVAILABLE"
            );
            return;
        }

        String disclosure =
            "Damit Human Holo nach deinem ausdrücklichen Auftrag in WhatsApp " +
            "automatisch auf Senden tippen kann, benötigt sie die Android-" +
            "Bedienungshilfe.\n\n" +
            "Android bezeichnet diese Freigabe als weitreichenden Bildschirm- " +
            "und Steuerungszugriff. Human Holos technische Begrenzung lässt die " +
            "Funktion trotzdem ausschließlich in WhatsApp arbeiten.\n\n" +
            "Die Funktion reagiert ausschließlich auf einen kurzlebigen " +
            "Einmal-Auftrag, ausschließlich in WhatsApp und nur wenn " +
            "Empfänger sowie vollständiger Nachrichtentext übereinstimmen.\n\n" +
            "Human Holo speichert oder überträgt dabei keine sichtbaren " +
            "WhatsApp-Inhalte. Du kannst den Zugriff jederzeit in den " +
            "Android-Einstellungen ausschalten.";

        confirmExternalAction(
            call,
            activity,
            "WhatsApp automatisch senden",
            disclosure,
            "Bedienungshilfe öffnen",
            () -> {
                Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
                try {
                    activity.startActivity(intent);
                    JSObject result = whatsAppAutoSendStatus();
                    result.put("settingsOpened", true);
                    result.put(
                        "instructions",
                        "Wähle Human Holo – WhatsApp automatisch senden und aktiviere den Zugriff. Danach den WhatsApp-Befehl einmal wiederholen."
                    );
                    call.resolve(result);
                } catch (ActivityNotFoundException | SecurityException error) {
                    call.reject(
                        "Die Android-Bedienungshilfe konnte gerade nicht geöffnet werden.",
                        "WHATSAPP_AUTO_SEND_SETTINGS_UNAVAILABLE",
                        error
                    );
                }
            }
        );
    }

    @PluginMethod
    public void consumeSharedNote(PluginCall call) {
        String text = getContext()
            .getSharedPreferences(NOTE_PREFERENCES, Context.MODE_PRIVATE)
            .getString(NOTE_TEXT_KEY, "");
        String title = getContext()
            .getSharedPreferences(NOTE_PREFERENCES, Context.MODE_PRIVATE)
            .getString(NOTE_TITLE_KEY, "");
        boolean truncated = getContext()
            .getSharedPreferences(NOTE_PREFERENCES, Context.MODE_PRIVATE)
            .getBoolean(NOTE_TRUNCATED_KEY, false);

        JSObject result = new JSObject();
        result.put("available", text != null && !text.trim().isEmpty());
        result.put("text", text == null ? "" : text);
        result.put("title", title == null ? "" : title);
        result.put("truncated", truncated);

        getContext()
            .getSharedPreferences(NOTE_PREFERENCES, Context.MODE_PRIVATE)
            .edit()
            .remove(NOTE_TEXT_KEY)
            .remove(NOTE_TITLE_KEY)
            .remove(NOTE_TRUNCATED_KEY)
            .apply();

        call.resolve(result);
    }

    private boolean samsungNotesAvailable() {
        Intent launchIntent = getContext()
            .getPackageManager()
            .getLaunchIntentForPackage(SAMSUNG_NOTES_PACKAGE);
        return launchIntent != null;
    }

    private Intent withSamsungNoteText(Intent intent, String title, String text) {
        intent.setPackage(SAMSUNG_NOTES_PACKAGE);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_TEXT, text);
        intent.putExtra(GOOGLE_NOTE_TEXT_EXTRA, text);
        intent.setClipData(
            ClipData.newPlainText(
                title.isEmpty() ? "Pam’s Holo" : title,
                text
            )
        );

        if (!title.isEmpty()) {
            intent.putExtra(Intent.EXTRA_SUBJECT, title);
            intent.putExtra(Intent.EXTRA_TITLE, title);
            intent.putExtra(GOOGLE_NOTE_NAME_EXTRA, title);
        }

        return intent;
    }

    private Intent resolveSamsungNotesActivity(Intent intent) {
        ResolveInfo resolved = getContext()
            .getPackageManager()
            .resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY);
        if (
            resolved == null
                || resolved.activityInfo == null
                || !SAMSUNG_NOTES_PACKAGE.equals(resolved.activityInfo.packageName)
        ) {
            return null;
        }

        intent.setComponent(
            new ComponentName(
                resolved.activityInfo.packageName,
                resolved.activityInfo.name
            )
        );
        return intent;
    }

    private SamsungNoteLaunch samsungNoteLaunch(String title, String text) {
        // ACTION_SEND + EXTRA_TEXT ist Androids standardisierte Textübergabe.
        // Samsung Notes erhält sie zuerst, damit der gewünschte Inhalt nicht nur
        // eine leere Notizansicht öffnet.
        Intent sharedText = resolveSamsungNotesActivity(
            withSamsungNoteText(
                new Intent(Intent.ACTION_SEND),
                title,
                text
            )
        );
        if (sharedText != null) {
            return new SamsungNoteLaunch(sharedText, "share_text");
        }

        Intent googleNote = resolveSamsungNotesActivity(
            withSamsungNoteText(
                new Intent(GOOGLE_CREATE_NOTE_ACTION),
                title,
                text
            )
        );
        if (googleNote != null) {
            return new SamsungNoteLaunch(googleNote, "create_note");
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            Intent androidNote = resolveSamsungNotesActivity(
                withSamsungNoteText(
                    new Intent(Intent.ACTION_CREATE_NOTE),
                    title,
                    text
                )
            );
            if (androidNote != null) {
                return new SamsungNoteLaunch(androidNote, "android_create_note");
            }
        }

        return null;
    }

    private boolean openSamsungNotesWithClipboard(
        Activity activity,
        String title,
        String text
    ) {
        ClipboardManager clipboard = (ClipboardManager) getContext()
            .getSystemService(Context.CLIPBOARD_SERVICE);
        Intent launchIntent = activity
            .getPackageManager()
            .getLaunchIntentForPackage(SAMSUNG_NOTES_PACKAGE);
        if (clipboard == null || launchIntent == null) {
            return false;
        }
        clipboard.setPrimaryClip(
            ClipData.newPlainText(title.isEmpty() ? "Human Holo" : title, text)
        );
        activity.startActivity(launchIntent);
        return true;
    }

    @PluginMethod
    public void getSamsungNotesStatus(PluginCall call) {
        SamsungNoteLaunch launch = samsungNoteLaunch(
            "Pam’s Holo",
            "Notiz"
        );
        JSObject result = new JSObject();
        result.put("available", samsungNotesAvailable());
        result.put("packageName", SAMSUNG_NOTES_PACKAGE);
        result.put("directWriteSupported", false);
        boolean available = samsungNotesAvailable();
        result.put("draftHandoffSupported", launch != null || available);
        result.put("clipboardFallbackSupported", available);
        result.put(
            "handoffMode",
            launch == null ? (available ? "clipboard" : "") : launch.mode
        );
        result.put("pamHoloConfirmationRequired", false);
        result.put("reviewAndSaveInSamsungNotesRequired", true);
        result.put("textTransport", "android.intent.extra.TEXT");
        call.resolve(result);
    }

    @PluginMethod
    public void openSamsungNotes(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject(
                "Samsung Notes konnte gerade nicht geöffnet werden.",
                "SAMSUNG_NOTES_ACTIVITY_UNAVAILABLE"
            );
            return;
        }

        Intent intent = activity
            .getPackageManager()
            .getLaunchIntentForPackage(SAMSUNG_NOTES_PACKAGE);
        if (intent == null) {
            call.reject(
                "Samsung Notes wurde auf diesem Handy nicht gefunden.",
                "SAMSUNG_NOTES_NOT_INSTALLED"
            );
            return;
        }

        try {
            activity.startActivity(intent);
            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("packageName", SAMSUNG_NOTES_PACKAGE);
            call.resolve(result);
        } catch (ActivityNotFoundException error) {
            call.reject(
                "Samsung Notes konnte gerade nicht geöffnet werden.",
                "SAMSUNG_NOTES_OPEN_FAILED",
                error
            );
        }
    }

    @PluginMethod
    public void getGoogleMapsStatus(PluginCall call) {
        boolean nativeAppAvailable = getContext()
            .getPackageManager()
            .getLaunchIntentForPackage(GOOGLE_MAPS_PACKAGE) != null;
        JSObject result = new JSObject();
        result.put("available", true);
        result.put("nativeAppAvailable", nativeAppAvailable);
        result.put("packageName", GOOGLE_MAPS_PACKAGE);
        result.put("navigationIntentSupported", true);
        result.put("browserFallbackSupported", true);
        result.put("apiKeyRequired", false);
        call.resolve(result);
    }

    @PluginMethod
    public void openGoogleMaps(PluginCall call) {
        String destination = call.getString("destination", "").trim();
        if (destination.length() > MAX_MAPS_DESTINATION_LENGTH) {
            call.reject(
                "Das Navigationsziel ist zu lang.",
                "GOOGLE_MAPS_DESTINATION_TOO_LONG"
            );
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject(
                "Google Maps konnte gerade nicht geöffnet werden.",
                "GOOGLE_MAPS_ACTIVITY_UNAVAILABLE"
            );
            return;
        }

        Intent nativeIntent;
        Intent browserIntent;
        if (destination.isEmpty()) {
            nativeIntent = new Intent(
                Intent.ACTION_VIEW,
                Uri.parse("https://www.google.com/maps")
            );
        } else {
            nativeIntent = new Intent(
                Intent.ACTION_VIEW,
                Uri.parse(
                    "google.navigation:q=" +
                    Uri.encode(destination) +
                    "&mode=d"
                )
            );
        }
        nativeIntent.setPackage(GOOGLE_MAPS_PACKAGE);

        browserIntent = new Intent(
            Intent.ACTION_VIEW,
            Uri.parse(
                destination.isEmpty()
                    ? "https://www.google.com/maps"
                    : "https://www.google.com/maps/dir/?api=1&destination=" +
                        Uri.encode(destination)
            )
        );

        boolean nativeNavigation = true;
        try {
            try {
                activity.startActivity(nativeIntent);
            } catch (ActivityNotFoundException | SecurityException nativeError) {
                nativeNavigation = false;
                activity.startActivity(browserIntent);
            }
            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("destination", destination);
            result.put("nativeNavigation", nativeNavigation);
            result.put(
                "packageName",
                nativeNavigation ? GOOGLE_MAPS_PACKAGE : ""
            );
            call.resolve(result);
        } catch (ActivityNotFoundException | SecurityException error) {
            call.reject(
                "Google Maps konnte gerade nicht geöffnet werden.",
                "GOOGLE_MAPS_OPEN_FAILED",
                error
            );
        }
    }

    @PluginMethod
    public void getAlarmClockStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("supported", true);
        result.put("setAlarmSupported", true);
        result.put("showAlarmsSupported", true);
        result.put("runtimePermissionRequired", false);
        call.resolve(result);
    }

    @PluginMethod
    public void openAlarmClock(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject(
                "Die Uhr-App konnte gerade nicht geöffnet werden.",
                "ALARM_CLOCK_ACTIVITY_UNAVAILABLE"
            );
            return;
        }

        try {
            activity.startActivity(new Intent(AlarmClock.ACTION_SHOW_ALARMS));
            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("action", "show");
            call.resolve(result);
        } catch (ActivityNotFoundException | SecurityException error) {
            call.reject(
                "Auf diesem Handy wurde keine passende Uhr-App gefunden.",
                "ALARM_CLOCK_OPEN_FAILED",
                error
            );
        }
    }

    @PluginMethod
    public void setAlarm(PluginCall call) {
        Integer hour = call.getInt("hour");
        Integer minute = call.getInt("minute");
        String label = call.getString("label", "Human Holo").trim();
        boolean skipUi = Boolean.TRUE.equals(call.getBoolean("skipUi", true));
        if (
            hour == null ||
            minute == null ||
            hour < 0 ||
            hour > 23 ||
            minute < 0 ||
            minute > 59
        ) {
            call.reject("Die Weckzeit ist ungültig.", "ALARM_TIME_INVALID");
            return;
        }
        if (label.length() > MAX_ALARM_LABEL_LENGTH) {
            label = label.substring(0, MAX_ALARM_LABEL_LENGTH).trim();
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject(
                "Der Wecker konnte gerade nicht gestellt werden.",
                "ALARM_CLOCK_ACTIVITY_UNAVAILABLE"
            );
            return;
        }

        Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM)
            .putExtra(AlarmClock.EXTRA_HOUR, hour)
            .putExtra(AlarmClock.EXTRA_MINUTES, minute)
            .putExtra(AlarmClock.EXTRA_MESSAGE, label)
            .putExtra(AlarmClock.EXTRA_SKIP_UI, skipUi);
        try {
            activity.startActivity(intent);
            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("action", "set");
            result.put("hour", hour);
            result.put("minute", minute);
            result.put("label", label);
            call.resolve(result);
        } catch (ActivityNotFoundException | SecurityException error) {
            call.reject(
                "Der Wecker konnte in der Uhr-App nicht gestellt werden.",
                "ALARM_CLOCK_SET_FAILED",
                error
            );
        }
    }

    @PluginMethod
    public void getCalendarStatus(PluginCall call) {
        call.resolve(calendarStatus());
    }

    @PluginMethod
    public void listCalendarEvents(PluginCall call) {
        if (!calendarGranted()) {
            call.reject(
                "Bitte erlaube Human Holo den Kalenderzugriff.",
                "CALENDAR_PERMISSION_REQUIRED"
            );
            return;
        }

        Long startValue = numericLong(call, "startMillis");
        Long endValue = numericLong(call, "endMillis");
        if (
            startValue == null ||
            endValue == null ||
            startValue <= 0L ||
            endValue <= startValue
        ) {
            call.reject(
                "Der Zeitraum für die Kalenderverknüpfung ist ungültig.",
                "CALENDAR_RANGE_INVALID"
            );
            return;
        }

        Integer requestedLimit = call.getInt("limit", 30);
        int limit = Math.max(
            1,
            Math.min(requestedLimit == null ? 30 : requestedLimit, 50)
        );
        Uri.Builder instancesBuilder =
            CalendarContract.Instances.CONTENT_URI.buildUpon();
        ContentUris.appendId(instancesBuilder, startValue);
        ContentUris.appendId(instancesBuilder, endValue);

        String[] projection = new String[] {
            CalendarContract.Instances.EVENT_ID,
            CalendarContract.Instances.TITLE,
            CalendarContract.Instances.BEGIN,
            CalendarContract.Instances.END,
            CalendarContract.Instances.ALL_DAY,
            CalendarContract.Instances.CALENDAR_DISPLAY_NAME,
            CalendarContract.Instances.EVENT_LOCATION
        };
        String selection = CalendarContract.Calendars.VISIBLE + " = 1";
        String sortOrder = CalendarContract.Instances.BEGIN + " ASC";
        JSArray events = new JSArray();

        try (Cursor cursor = getContext().getContentResolver().query(
            instancesBuilder.build(),
            projection,
            selection,
            null,
            sortOrder
        )) {
            if (cursor != null) {
                int eventIdIndex = cursor.getColumnIndexOrThrow(
                    CalendarContract.Instances.EVENT_ID
                );
                int titleIndex = cursor.getColumnIndexOrThrow(
                    CalendarContract.Instances.TITLE
                );
                int beginIndex = cursor.getColumnIndexOrThrow(
                    CalendarContract.Instances.BEGIN
                );
                int endIndex = cursor.getColumnIndexOrThrow(
                    CalendarContract.Instances.END
                );
                int allDayIndex = cursor.getColumnIndexOrThrow(
                    CalendarContract.Instances.ALL_DAY
                );
                int calendarNameIndex = cursor.getColumnIndexOrThrow(
                    CalendarContract.Instances.CALENDAR_DISPLAY_NAME
                );
                int locationIndex = cursor.getColumnIndexOrThrow(
                    CalendarContract.Instances.EVENT_LOCATION
                );

                while (cursor.moveToNext() && events.length() < limit) {
                    long begin = cursor.getLong(beginIndex);
                    long end = cursor.getLong(endIndex);
                    JSObject event = new JSObject();
                    event.put("eventId", cursor.getLong(eventIdIndex));
                    event.put("title", cursor.getString(titleIndex));
                    event.put("startMillis", begin);
                    event.put("endMillis", end > begin ? end : begin);
                    event.put("allDay", cursor.getInt(allDayIndex) == 1);
                    event.put(
                        "calendarName",
                        cursor.getString(calendarNameIndex)
                    );
                    event.put("location", cursor.getString(locationIndex));
                    events.put(event);
                }
            }
        } catch (SecurityException error) {
            call.reject(
                "Android hat die Kalenderverknüpfung nicht freigegeben.",
                "CALENDAR_PERMISSION_REQUIRED",
                error
            );
            return;
        } catch (Exception error) {
            call.reject(
                "Die verknüpften Termine konnten gerade nicht geladen werden.",
                "CALENDAR_EVENTS_READ_FAILED",
                error
            );
            return;
        }

        JSObject result = calendarStatus();
        result.put("linked", true);
        result.put("count", events.length());
        result.put("events", events);
        result.put("rangeStartMillis", startValue);
        result.put("rangeEndMillis", endValue);
        call.resolve(result);
    }

    @PluginMethod
    public void requestCalendarAccess(PluginCall call) {
        if (calendarGranted()) {
            call.resolve(calendarStatus());
            return;
        }

        requestPermissionForAliases(
            new String[] { "calendar" },
            call,
            "calendarAccessCallback"
        );
    }

    @PermissionCallback
    private void calendarAccessCallback(PluginCall call) {
        call.resolve(calendarStatus());
    }

    @PluginMethod
    public void saveCalendarEvent(PluginCall call) {
        if (!validCalendarEvent(call)) {
            return;
        }
        if (!calendarGranted()) {
            requestPermissionForAliases(
                new String[] { "calendar" },
                call,
                "calendarSavePermissionCallback"
            );
            return;
        }
        saveCalendarEventNow(call);
    }

    @PermissionCallback
    private void calendarSavePermissionCallback(PluginCall call) {
        if (!calendarGranted()) {
            call.reject(
                "Bitte erlaube Human Holo den Kalenderzugriff. Es wurde nichts gespeichert.",
                "CALENDAR_PERMISSION_REQUIRED"
            );
            return;
        }
        saveCalendarEventNow(call);
    }

    private boolean validCalendarEvent(PluginCall call) {
        Long startValue = numericLong(call, "startMillis");
        Long endValue = numericLong(call, "endMillis");
        if (
            startValue == null ||
            endValue == null ||
            startValue <= 0L ||
            endValue <= startValue
        ) {
            call.reject("Die Kalenderzeit ist ungültig.", "CALENDAR_TIME_INVALID");
            return false;
        }
        return true;
    }

    private JSObject directCalendarResult(
        long eventId,
        WritableCalendar calendar,
        boolean duplicate
    ) {
        JSObject result = calendarStatus();
        result.put("saved", true);
        result.put("direct", true);
        result.put("opened", false);
        result.put("duplicate", duplicate);
        result.put("eventId", eventId);
        result.put("calendarId", calendar.id);
        result.put("calendarName", calendar.displayName);
        return result;
    }

    private void saveCalendarEventNow(PluginCall call) {
        String title = call.getString("title", "Termin").trim();
        String description = call.getString("description", "").trim();
        Long startValue = numericLong(call, "startMillis");
        Long endValue = numericLong(call, "endMillis");
        boolean allDay = Boolean.TRUE.equals(call.getBoolean("allDay", false));
        if (title.length() > MAX_CALENDAR_TITLE_LENGTH) {
            title = title.substring(0, MAX_CALENDAR_TITLE_LENGTH).trim();
        }
        if (description.length() > MAX_CALENDAR_DESCRIPTION_LENGTH) {
            description = description
                .substring(0, MAX_CALENDAR_DESCRIPTION_LENGTH)
                .trim();
        }

        WritableCalendar calendar = writableCalendar();
        if (calendar == null) {
            call.reject(
                "Auf diesem Handy ist kein sichtbarer, beschreibbarer Kalender verfügbar.",
                "WRITABLE_CALENDAR_NOT_FOUND"
            );
            return;
        }

        String cleanTitle = title.isEmpty() ? "Termin" : title;
        String fingerprint = cleanTitle + "\n" + startValue + "\n" + endValue;
        long now = System.currentTimeMillis();
        SharedPreferences preferences = getContext().getSharedPreferences(
            CALENDAR_PREFERENCES,
            Context.MODE_PRIVATE
        );
        if (
            fingerprint.equals(
                preferences.getString(CALENDAR_FINGERPRINT_KEY, "")
            ) &&
            now - preferences.getLong(CALENDAR_SAVED_AT_KEY, 0L) <=
                CALENDAR_DUPLICATE_WINDOW_MILLIS
        ) {
            call.resolve(directCalendarResult(
                preferences.getLong(CALENDAR_EVENT_ID_KEY, -1L),
                calendar,
                true
            ));
            return;
        }

        ContentValues values = new ContentValues();
        values.put(CalendarContract.Events.CALENDAR_ID, calendar.id);
        values.put(CalendarContract.Events.TITLE, cleanTitle);
        values.put(CalendarContract.Events.DTSTART, startValue);
        values.put(CalendarContract.Events.DTEND, endValue);
        values.put(
            CalendarContract.Events.EVENT_TIMEZONE,
            allDay ? "UTC" : "Europe/Berlin"
        );
        values.put(CalendarContract.Events.ALL_DAY, allDay ? 1 : 0);
        if (!description.isEmpty()) {
            values.put(CalendarContract.Events.DESCRIPTION, description);
        }

        try {
            Uri eventUri = getContext()
                .getContentResolver()
                .insert(CalendarContract.Events.CONTENT_URI, values);
            if (eventUri == null || eventUri.getLastPathSegment() == null) {
                call.reject(
                    "Der Kalender hat den Eintrag nicht bestätigt.",
                    "CALENDAR_INSERT_NOT_CONFIRMED"
                );
                return;
            }
            long eventId = Long.parseLong(eventUri.getLastPathSegment());
            preferences
                .edit()
                .putString(CALENDAR_FINGERPRINT_KEY, fingerprint)
                .putLong(CALENDAR_EVENT_ID_KEY, eventId)
                .putLong(CALENDAR_SAVED_AT_KEY, now)
                .apply();
            call.resolve(directCalendarResult(eventId, calendar, false));
        } catch (SecurityException | IllegalArgumentException error) {
            call.reject(
                "Der Termin konnte nicht direkt im Kalender gespeichert werden.",
                "CALENDAR_DIRECT_SAVE_FAILED",
                error
            );
        }
    }

    private Long numericLong(PluginCall call, String key) {
        Object value = call.getData().opt(key);
        return value instanceof Number ? ((Number) value).longValue() : null;
    }

    @PluginMethod
    public void prepareSamsungNote(PluginCall call) {
        String text = call.getString("text", "").trim();
        String title = call.getString("title", "").trim();

        if (text.isEmpty()) {
            call.reject(
                "Der Notiztext ist leer.",
                "SAMSUNG_NOTE_TEXT_REQUIRED"
            );
            return;
        }

        if (text.length() > 10000) {
            call.reject(
                "Der Notiztext ist für die sichere Übergabe zu lang.",
                "SAMSUNG_NOTE_TEXT_TOO_LONG"
            );
            return;
        }

        if (title.length() > MAX_SHARED_NOTE_TITLE_LENGTH) {
            title = title.substring(0, MAX_SHARED_NOTE_TITLE_LENGTH).trim();
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject(
                "Samsung Notes konnte gerade nicht geöffnet werden.",
                "SAMSUNG_NOTES_ACTIVITY_UNAVAILABLE"
            );
            return;
        }

        SamsungNoteLaunch launch = samsungNoteLaunch(title, text);
        if (launch == null) {
            try {
                if (openSamsungNotesWithClipboard(activity, title, text)) {
                    JSObject result = new JSObject();
                    result.put("opened", true);
                    result.put("saved", false);
                    result.put("textPrepared", true);
                    result.put("packageName", SAMSUNG_NOTES_PACKAGE);
                    result.put("handoffMode", "clipboard");
                    result.put("contentTransferred", false);
                    result.put("clipboardPrepared", true);
                    result.put("pasteRequired", true);
                    result.put("reviewAndSaveInSamsungNotesRequired", true);
                    call.resolve(result);
                    return;
                }
            } catch (ActivityNotFoundException | SecurityException ignored) {
                // Die eindeutige Fehlermeldung folgt direkt darunter.
            }
            call.reject(
                "Diese Samsung-Notes-Version nimmt gerade keinen Notizentwurf an.",
                "SAMSUNG_NOTES_DRAFT_UNAVAILABLE"
            );
            return;
        }

        try {
            activity.startActivity(launch.intent);
            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("saved", false);
            result.put("textPrepared", true);
            result.put("packageName", SAMSUNG_NOTES_PACKAGE);
            result.put("handoffMode", launch.mode);
            result.put("pamHoloConfirmationRequired", false);
            result.put("reviewAndSaveInSamsungNotesRequired", true);
            result.put("contentTransferred", true);
            call.resolve(result);
        } catch (ActivityNotFoundException | SecurityException error) {
            try {
                if (openSamsungNotesWithClipboard(activity, title, text)) {
                    JSObject result = new JSObject();
                    result.put("opened", true);
                    result.put("saved", false);
                    result.put("textPrepared", true);
                    result.put("packageName", SAMSUNG_NOTES_PACKAGE);
                    result.put("handoffMode", "clipboard");
                    result.put("contentTransferred", false);
                    result.put("clipboardPrepared", true);
                    result.put("pasteRequired", true);
                    result.put("reviewAndSaveInSamsungNotesRequired", true);
                    call.resolve(result);
                    return;
                }
            } catch (ActivityNotFoundException | SecurityException fallbackError) {
                error.addSuppressed(fallbackError);
            }
            call.reject(
                "Samsung Notes konnte die Notiz gerade nicht übernehmen.",
                "SAMSUNG_NOTES_SHARE_FAILED",
                error
            );
        }
    }

    @PluginMethod
    public void requestAccess(PluginCall call) {
        if (
            getPermissionState("contacts") == PermissionState.GRANTED
                && getPermissionState("phoneState") == PermissionState.GRANTED
        ) {
            registerCallStateListener();
            call.resolve(status());
            return;
        }

        requestPermissionForAliases(
            new String[] { "contacts", "phoneState" },
            call,
            "phonePermissionsCallback"
        );
    }

    @PermissionCallback
    private void phonePermissionsCallback(PluginCall call) {
        registerCallStateListener();
        JSObject result = status();
        notifyListeners("phoneStatusChanged", result, true);
        call.resolve(result);
    }

    @PluginMethod
    public void openPermissionSettings(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject(
                "Die Android-Berechtigungen konnten gerade nicht geöffnet werden.",
                "APP_PERMISSION_SETTINGS_UNAVAILABLE"
            );
            return;
        }

        Intent intent = new Intent(
            Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.fromParts("package", getContext().getPackageName(), null)
        );

        try {
            activity.startActivity(intent);
            JSObject result = status();
            result.put("settingsOpened", true);
            result.put(
                "instructions",
                "Unter Berechtigungen können Kontakte, Telefonstatus und direkte Anrufe jederzeit einzeln widerrufen werden."
            );
            call.resolve(result);
        } catch (ActivityNotFoundException | SecurityException error) {
            call.reject(
                "Die Android-Berechtigungen konnten gerade nicht geöffnet werden.",
                "APP_PERMISSION_SETTINGS_UNAVAILABLE",
                error
            );
        }
    }

    @PluginMethod
    public void searchContacts(PluginCall call) {
        if (!contactsGranted()) {
            call.reject(
                "Ohne Kontaktfreigabe kann Pam’s Holo keine Telefonnummer suchen.",
                "CONTACTS_PERMISSION_REQUIRED"
            );
            return;
        }

        String query = call.getString("query", "").trim();
        if (query.isEmpty()) {
            call.reject("Bitte nenne den gesuchten Kontakt.");
            return;
        }

        Integer requestedLimit = call.getInt("limit", 8);
        int limit = Math.max(1, Math.min(requestedLimit == null ? 8 : requestedLimit, 20));

        String[] projection = {
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.NORMALIZED_NUMBER,
            ContactsContract.CommonDataKinds.Phone.TYPE,
            ContactsContract.CommonDataKinds.Phone.LABEL
        };

        String selection =
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " LIKE ?";
        String[] selectionArgs = { "%" + query + "%" };
        String sortOrder =
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " COLLATE NOCASE ASC";

        JSArray results = new JSArray();
        Set<String> seenNumbers = new HashSet<>();

        try (
            Cursor cursor = getContext().getContentResolver().query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                projection,
                selection,
                selectionArgs,
                sortOrder
            )
        ) {
            if (cursor != null) {
                int idIndex = cursor.getColumnIndexOrThrow(
                    ContactsContract.CommonDataKinds.Phone.CONTACT_ID
                );
                int nameIndex = cursor.getColumnIndexOrThrow(
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME
                );
                int numberIndex = cursor.getColumnIndexOrThrow(
                    ContactsContract.CommonDataKinds.Phone.NUMBER
                );
                int normalizedNumberIndex = cursor.getColumnIndex(
                    ContactsContract.CommonDataKinds.Phone.NORMALIZED_NUMBER
                );
                int typeIndex = cursor.getColumnIndexOrThrow(
                    ContactsContract.CommonDataKinds.Phone.TYPE
                );
                int labelIndex = cursor.getColumnIndexOrThrow(
                    ContactsContract.CommonDataKinds.Phone.LABEL
                );

                while (cursor.moveToNext() && results.length() < limit) {
                    String number = cursor.getString(numberIndex);
                    String dedupeKey = (number == null ? "" : number)
                        .replaceAll("[^0-9+]", "");

                    if (dedupeKey.isEmpty() || !seenNumbers.add(dedupeKey)) {
                        continue;
                    }

                    int type = cursor.getInt(typeIndex);
                    String customLabel = cursor.getString(labelIndex);
                    CharSequence label = ContactsContract.CommonDataKinds.Phone.getTypeLabel(
                        getContext().getResources(),
                        type,
                        customLabel
                    );

                    JSObject contact = new JSObject();
                    contact.put("id", cursor.getLong(idIndex));
                    contact.put("name", cursor.getString(nameIndex));
                    contact.put("number", number);
                    contact.put(
                        "normalizedNumber",
                        normalizedNumberIndex < 0
                            ? ""
                            : cursor.getString(normalizedNumberIndex)
                    );
                    contact.put("label", String.valueOf(label));
                    results.put(contact);
                }
            }
        } catch (SecurityException error) {
            call.reject(
                "Android hat den Kontaktzugriff nicht freigegeben.",
                "CONTACTS_PERMISSION_REQUIRED",
                error
            );
            return;
        } catch (Exception error) {
            call.reject(
                "Die Kontakte konnten gerade nicht durchsucht werden.",
                null,
                error
            );
            return;
        }

        JSObject result = new JSObject();
        result.put("query", query);
        result.put("count", results.length());
        result.put("results", results);
        call.resolve(result);
    }

    @PluginMethod
    public void resolveContactAlias(PluginCall call) {
        if (!contactsGranted()) {
            call.reject(
                "Ohne Kontaktfreigabe kann Pam’s Holo keinen Kontaktalias auflösen.",
                "CONTACTS_PERMISSION_REQUIRED"
            );
            return;
        }

        String alias = cleanContactAlias(call.getString("alias", ""));
        String aliasKey = normalizedAliasKey(alias);
        String ownerId = cleanOwnerId(call.getString("ownerId", ""));
        if (ownerId.isEmpty()) {
            call.reject(
                "Die feste Holo-ID fehlt für diesen Kontaktalias.",
                "CONTACT_ALIAS_OWNER_REQUIRED"
            );
            return;
        }
        if (aliasKey.isEmpty()) {
            call.reject("Bitte nenne den Kontaktalias.", "CONTACT_ALIAS_REQUIRED");
            return;
        }

        String prefix = contactAliasPreferencePrefix(ownerId, aliasKey);
        long contactId = getContext()
            .getSharedPreferences(CONTACT_ALIAS_PREFERENCES, Context.MODE_PRIVATE)
            .getLong(prefix + "contact_id", -1L);
        String expectedNumber = getContext()
            .getSharedPreferences(CONTACT_ALIAS_PREFERENCES, Context.MODE_PRIVATE)
            .getString(prefix + "number", "");

        JSObject result = new JSObject();
        result.put("alias", alias);
        result.put("storedOnlyOnDevice", true);

        if (contactId < 0L || expectedNumber == null || expectedNumber.isEmpty()) {
            result.put("found", false);
            call.resolve(result);
            return;
        }

        ContactRecord contact = findContactRecord(contactId, expectedNumber);
        if (contact == null) {
            getContext()
                .getSharedPreferences(CONTACT_ALIAS_PREFERENCES, Context.MODE_PRIVATE)
                .edit()
                .remove(prefix + "alias")
                .remove(prefix + "contact_id")
                .remove(prefix + "number")
                .apply();
            result.put("found", false);
            result.put("staleBindingRemoved", true);
            call.resolve(result);
            return;
        }

        result.put("found", true);
        result.put("contact", contactRecordToJs(contact));
        call.resolve(result);
    }

    @PluginMethod
    public void bindContactAlias(PluginCall call) {
        if (!contactsGranted()) {
            call.reject(
                "Ohne Kontaktfreigabe kann Pam’s Holo keinen Kontaktalias speichern.",
                "CONTACTS_PERMISSION_REQUIRED"
            );
            return;
        }

        String alias = cleanContactAlias(call.getString("alias", ""));
        String aliasKey = normalizedAliasKey(alias);
        String ownerId = cleanOwnerId(call.getString("ownerId", ""));
        String contactIdText = call.getString("contactId", "").trim();
        long contactId = -1L;
        try {
            contactId = Long.parseLong(contactIdText);
        } catch (NumberFormatException ignored) {
            // Die Prüfung unten lehnt eine fehlende oder ungültige ID geschlossen ab.
        }
        String expectedNumber = cleanDestination(call.getString("number", ""));

        if (aliasKey.isEmpty()) {
            call.reject(
                "Der Kontaktalias ist leer oder zu lang.",
                "CONTACT_ALIAS_REQUIRED"
            );
            return;
        }
        if (ownerId.isEmpty()) {
            call.reject(
                "Die feste Holo-ID fehlt für diesen Kontaktalias.",
                "CONTACT_ALIAS_OWNER_REQUIRED"
            );
            return;
        }
        if (contactId < 0L || expectedNumber.isEmpty()) {
            call.reject(
                "Der ausgewählte Kontakt ist nicht eindeutig.",
                "CONTACT_ALIAS_CONTACT_REQUIRED"
            );
            return;
        }

        ContactRecord contact = findContactRecord(contactId, expectedNumber);
        if (contact == null) {
            call.reject(
                "Der ausgewählte Kontakt wurde im Android-Telefonbuch nicht mehr gefunden.",
                "CONTACT_ALIAS_CONTACT_STALE"
            );
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject(
                "Der Kontaktalias konnte gerade nicht bestätigt werden.",
                "CONTACT_ALIAS_ACTIVITY_UNAVAILABLE"
            );
            return;
        }

        String confirmationText =
            "Alias: " + alias + "\n\n" +
            "Kontakt: " + contact.name + " (" + contact.number + ")\n\n" +
            "Diese Zuordnung wird nur im geschützten App-Bereich auf diesem Gerät gespeichert.";

        confirmExternalAction(
            call,
            activity,
            "Kontaktalias bestätigen",
            confirmationText,
            "Auf diesem Gerät verbinden",
            () -> {
                String prefix = contactAliasPreferencePrefix(ownerId, aliasKey);
                getContext()
                    .getSharedPreferences(
                        CONTACT_ALIAS_PREFERENCES,
                        Context.MODE_PRIVATE
                    )
                    .edit()
                    .putString(prefix + "alias", alias)
                    .putLong(prefix + "contact_id", contact.id)
                    .putString(
                        prefix + "number",
                        contact.normalizedNumber.isEmpty()
                            ? contact.number
                            : contact.normalizedNumber
                    )
                    .apply();

                JSObject result = new JSObject();
                result.put("saved", true);
                result.put("alias", alias);
                result.put("contact", contactRecordToJs(contact));
                result.put("storedOnlyOnDevice", true);
                result.put("confirmationShown", true);
                result.put("userConfirmed", true);
                call.resolve(result);
            }
        );
    }

    @PluginMethod
    public void openDialer(PluginCall call) {
        String number = cleanDestination(call.getString("number", ""));
        String recipientName = cleanRecipientName(
            call.getString("recipientName", "")
        );
        if (number.isEmpty()) {
            call.reject("Keine Telefonnummer erhalten.");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Die Telefon-App konnte nicht geöffnet werden.");
            return;
        }

        String recipient = recipientName.isEmpty()
            ? number
            : recipientName + " (" + number + ")";
        String confirmationText =
            "Empfänger: " + recipient + "\n\n" +
            "Aktion: Telefon-App mit dieser Nummer öffnen.\n\n" +
            "Der Anruf wird nicht automatisch gestartet. " +
            "Du startest ihn anschließend selbst in der Telefon-App.";

        confirmExternalAction(
            call,
            activity,
            "Anruf bestätigen",
            confirmationText,
            "Telefon-App öffnen",
            () -> {
                Intent intent = new Intent(
                    Intent.ACTION_DIAL,
                    Uri.fromParts("tel", number, null)
                );

                try {
                    activity.startActivity(intent);
                    JSObject result = new JSObject();
                    result.put("opened", true);
                    result.put("number", number);
                    result.put("recipientName", recipientName);
                    result.put("confirmationShown", true);
                    result.put("userConfirmed", true);
                    result.put("callStarted", false);
                    result.put("finalDialerConfirmationRequired", true);
                    call.resolve(result);
                } catch (ActivityNotFoundException | SecurityException error) {
                    call.reject(
                        "Auf diesem Gerät wurde keine Telefon-App gefunden.",
                        "PHONE_APP_UNAVAILABLE",
                        error
                    );
                }
            }
        );
    }

    @PluginMethod
    public void startContactCall(PluginCall call) {
        if (!contactsGranted()) {
            call.reject(
                "Ohne Kontaktfreigabe kann Human Holo den Anrufkontakt nicht prüfen.",
                "CONTACTS_PERMISSION_REQUIRED"
            );
            return;
        }
        if (!telephonySupported()) {
            call.reject(
                "Dieses Gerät unterstützt keine Telefonanrufe.",
                "TELEPHONY_UNAVAILABLE"
            );
            return;
        }
        if (!explicitOwnerCallAuthorized(call)) {
            call.reject(
                "Der direkte Anruf braucht einen ausdrücklichen ownergebundenen Auftrag.",
                "DIRECT_CALL_OWNER_CONFIRMATION_REQUIRED"
            );
            return;
        }

        String contactIdText = call.getString("contactId", "").trim();
        String expectedNumber = cleanDestination(call.getString("number", ""));
        long contactId = -1L;
        try {
            contactId = Long.parseLong(contactIdText);
        } catch (NumberFormatException ignored) {
            // Die Prüfung unten lehnt eine fehlende oder ungültige ID geschlossen ab.
        }
        if (contactId < 0L || expectedNumber.isEmpty()) {
            call.reject(
                "Der ausgewählte Anrufkontakt ist nicht eindeutig.",
                "DIRECT_CALL_CONTACT_REQUIRED"
            );
            return;
        }

        ContactRecord contact = findContactRecord(contactId, expectedNumber);
        if (contact == null) {
            call.reject(
                "Der ausgewählte Kontakt wurde vor dem Anruf nicht mehr im Android-Telefonbuch gefunden.",
                "DIRECT_CALL_CONTACT_STALE"
            );
            return;
        }

        String directNumber = normalizedDirectCallNumber(contact.number);
        if (directNumber.isEmpty()) {
            call.reject(
                "Diese Kontaktnummer darf nicht direkt angerufen werden.",
                "DIRECT_CALL_DESTINATION_NOT_ALLOWED"
            );
            return;
        }

        confirmAndStartDirectCall(
            call,
            new DirectCallTarget(
                directNumber,
                contact.name,
                "device_contact",
                true
            )
        );
    }

    @PluginMethod
    public void startHelpServiceCall(PluginCall call) {
        if (!telephonySupported()) {
            call.reject(
                "Dieses Gerät unterstützt keine Telefonanrufe.",
                "TELEPHONY_UNAVAILABLE"
            );
            return;
        }
        if (!explicitOwnerCallAuthorized(call)) {
            call.reject(
                "Der direkte Anruf braucht einen ausdrücklichen ownergebundenen Auftrag.",
                "DIRECT_CALL_OWNER_CONFIRMATION_REQUIRED"
            );
            return;
        }

        String serviceId = call.getString("serviceId", "").trim();
        if (!ADAC_PANNENHILFE_DE_SERVICE_ID.equals(serviceId)) {
            call.reject(
                "Diese Pannenhilfe ist nicht für einen direkten Anruf freigegeben.",
                "HELP_SERVICE_NOT_ALLOWED"
            );
            return;
        }

        confirmAndStartDirectCall(
            call,
            new DirectCallTarget(
                ADAC_PANNENHILFE_DE_NUMBER,
                ADAC_PANNENHILFE_DE_LABEL,
                "verified_help_service",
                false
            )
        );
    }

    @PluginMethod
    public void openServiceDialer(PluginCall call) {
        String number = cleanDestination(call.getString("number", ""))
            .replace(" ", "");
        String label = cleanRecipientName(call.getString("label", ""));

        if (!SAFE_SERVICE_DIALER_NUMBERS.contains(number)) {
            call.reject(
                "Diese Servicenummer ist nicht für den sicheren Wähler freigegeben.",
                "SERVICE_NUMBER_NOT_ALLOWED"
            );
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Die Telefon-App konnte nicht geöffnet werden.");
            return;
        }

        Intent intent = new Intent(
            Intent.ACTION_DIAL,
            Uri.fromParts("tel", number, null)
        );

        try {
            activity.startActivity(intent);
            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("number", number);
            result.put("label", label);
            result.put("allowlistedServiceNumber", true);
            result.put("callStarted", false);
            result.put("finalDialerConfirmationRequired", true);
            call.resolve(result);
        } catch (ActivityNotFoundException | SecurityException error) {
            call.reject(
                "Auf diesem Gerät wurde keine Telefon-App gefunden.",
                "PHONE_APP_UNAVAILABLE",
                error
            );
        }
    }

    @PluginMethod
    public void prepareSms(PluginCall call) {
        String number = cleanDestination(call.getString("number", ""));
        String message = call.getString("message", "").trim();
        String recipientName = cleanRecipientName(
            call.getString("recipientName", "")
        );

        if (number.isEmpty()) {
            call.reject("Keine Telefonnummer für die SMS erhalten.");
            return;
        }

        if (message.isEmpty()) {
            call.reject("Kein SMS-Text erhalten.");
            return;
        }

        if (message.length() > MAX_SMS_LENGTH) {
            call.reject(
                "Der SMS-Text ist für eine vollständige sichtbare Bestätigung zu lang.",
                "SMS_TEXT_TOO_LONG"
            );
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Die Nachrichten-App konnte nicht geöffnet werden.");
            return;
        }

        String recipient = recipientName.isEmpty()
            ? number
            : recipientName + " (" + number + ")";
        String confirmationText =
            "Empfänger: " + recipient + "\n\n" +
            "SMS-Inhalt:\n" + message + "\n\n" +
            "Die Nachricht wird nicht automatisch gesendet. " +
            "Du sendest sie anschließend selbst in der Nachrichten-App.";

        confirmExternalAction(
            call,
            activity,
            "SMS bestätigen",
            confirmationText,
            "SMS-App öffnen",
            () -> {
                Intent intent = new Intent(
                    Intent.ACTION_SENDTO,
                    Uri.fromParts("smsto", number, null)
                );
                intent.putExtra("sms_body", message);

                try {
                    activity.startActivity(intent);
                    JSObject result = new JSObject();
                    result.put("opened", true);
                    result.put("number", number);
                    result.put("recipientName", recipientName);
                    result.put("confirmationShown", true);
                    result.put("userConfirmed", true);
                    result.put("messagePrepared", true);
                    result.put("messageLength", message.length());
                    result.put("sent", false);
                    result.put("finalSmsAppConfirmationRequired", true);
                    call.resolve(result);
                } catch (ActivityNotFoundException | SecurityException error) {
                    call.reject(
                        "Auf diesem Gerät wurde keine SMS-App gefunden.",
                        "SMS_APP_UNAVAILABLE",
                        error
                    );
                }
            }
        );
    }

    @PluginMethod
    public void prepareWhatsApp(PluginCall call) {
        String number = cleanDestination(call.getString("number", ""));
        String normalizedNumber = cleanDestination(
            call.getString("normalizedNumber", "")
        );
        String message = call.getString("message", "").trim();
        String recipientName = cleanRecipientName(
            call.getString("recipientName", "")
        );
        boolean autoSend = Boolean.TRUE.equals(
            call.getBoolean("autoSend", false)
        );
        boolean explicitOwnerCommand = Boolean.TRUE.equals(
            call.getBoolean("explicitOwnerCommand", false)
        );

        if (number.isEmpty()) {
            call.reject(
                "Keine Telefonnummer für WhatsApp erhalten.",
                "WHATSAPP_NUMBER_REQUIRED"
            );
            return;
        }
        if (message.isEmpty()) {
            call.reject(
                "Kein WhatsApp-Text erhalten.",
                "WHATSAPP_TEXT_REQUIRED"
            );
            return;
        }
        if (message.length() > MAX_WHATSAPP_MESSAGE_LENGTH) {
            call.reject(
                "Der WhatsApp-Text ist für eine sichere vollständige Prüfung zu lang.",
                "WHATSAPP_TEXT_TOO_LONG"
            );
            return;
        }
        if (autoSend && recipientName.isEmpty()) {
            call.reject(
                "Automatisches Senden braucht einen eindeutig geprüften Kontaktnamen.",
                "WHATSAPP_AUTO_SEND_RECIPIENT_REQUIRED"
            );
            return;
        }
        if (autoSend && !explicitOwnerCommand) {
            call.reject(
                "Automatisches Senden braucht einen ausdrücklichen WhatsApp-Auftrag der Besitzerin.",
                "WHATSAPP_AUTO_SEND_EXPLICIT_COMMAND_REQUIRED"
            );
            return;
        }

        String whatsAppDigits = internationalWhatsAppDigits(
            normalizedNumber,
            number
        );
        if (whatsAppDigits.isEmpty()) {
            call.reject(
                "Für die sichere WhatsApp-Zuordnung konnte keine vollständige internationale Nummer ermittelt werden. Bitte speichere sie im Kontakt mit Ländervorwahl, zum Beispiel +49.",
                "WHATSAPP_INTERNATIONAL_NUMBER_REQUIRED"
            );
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject(
                "WhatsApp konnte gerade nicht geöffnet werden.",
                "WHATSAPP_ACTIVITY_UNAVAILABLE"
            );
            return;
        }

        Uri whatsAppUri = new Uri.Builder()
            .scheme("https")
            .authority("wa.me")
            .appendPath(whatsAppDigits)
            .appendQueryParameter("text", message)
            .build();
        String packageName = resolveWhatsAppPackage(whatsAppUri);
        if (packageName.isEmpty()) {
            call.reject(
                "WhatsApp oder WhatsApp Business wurde auf diesem Gerät nicht gefunden.",
                "WHATSAPP_NOT_INSTALLED"
            );
            return;
        }

        if (autoSend) {
            if (!whatsAppAutoSendAccessEnabled()) {
                call.reject(
                    "Für automatisches WhatsApp-Senden muss der einmalige Besitzer-Modus in den Android-Bedienungshilfen aktiviert werden.",
                    "WHATSAPP_AUTO_SEND_ACCESS_REQUIRED"
                );
                return;
            }

            WhatsAppAutoSendCommand.Pending pending;
            try {
                pending = WhatsAppAutoSendCommand.arm(
                    packageName,
                    recipientName,
                    whatsAppDigits,
                    message
                );
            } catch (IllegalArgumentException error) {
                call.reject(
                    "Der automatische WhatsApp-Sendeauftrag war nicht vollständig oder nicht eindeutig.",
                    "WHATSAPP_AUTO_SEND_COMMAND_REJECTED",
                    error
                );
                return;
            }

            Intent intent = new Intent(Intent.ACTION_VIEW, whatsAppUri);
            intent.setPackage(packageName);
            try {
                activity.startActivity(intent);
                WhatsAppAutoSendAccessibilityService.wakeForPendingCommand();

                JSObject result = new JSObject();
                result.put("opened", true);
                result.put("packageName", packageName);
                result.put("number", number);
                result.put("recipientName", recipientName);
                result.put("confirmationShown", false);
                result.put("explicitOwnerCommandAccepted", true);
                result.put("messagePrepared", true);
                result.put("messageLength", message.length());
                result.put("automaticSendRequested", true);
                result.put("sendControlActivated", false);
                result.put("sent", false);
                result.put("deliveryConfirmed", false);
                result.put("finalWhatsAppSendRequired", false);
                result.put("singleUseCommand", true);
                result.put("commandExpiresAfterMillis", 30_000);
                result.put("pendingToken", pending.token);
                call.resolve(result);
            } catch (ActivityNotFoundException | SecurityException error) {
                WhatsAppAutoSendCommand.cancel(pending.token);
                call.reject(
                    "WhatsApp konnte den automatischen Sendeauftrag gerade nicht öffnen.",
                    "WHATSAPP_OPEN_FAILED",
                    error
                );
            }
            return;
        }

        String recipient = recipientName.isEmpty()
            ? number
            : recipientName + " (" + number + ")";
        String confirmationText =
            "Empfänger: " + recipient + "\n\n" +
            "WhatsApp-Ziel: +" + whatsAppDigits + "\n\n" +
            "WhatsApp-Inhalt:\n" + message + "\n\n" +
            "Die Nachricht wird nicht automatisch gesendet. " +
            "Du prüfst sie und tippst anschließend selbst in WhatsApp auf Senden.";

        confirmExternalAction(
            call,
            activity,
            "WhatsApp bestätigen",
            confirmationText,
            "In WhatsApp öffnen",
            () -> {
                Intent intent = new Intent(Intent.ACTION_VIEW, whatsAppUri);
                intent.setPackage(packageName);

                try {
                    activity.startActivity(intent);
                    JSObject result = new JSObject();
                    result.put("opened", true);
                    result.put("packageName", packageName);
                    result.put("number", number);
                    result.put("recipientName", recipientName);
                    result.put("confirmationShown", true);
                    result.put("userConfirmed", true);
                    result.put("messagePrepared", true);
                    result.put("messageLength", message.length());
                    result.put("automaticSendRequested", false);
                    result.put("sent", false);
                    result.put("finalWhatsAppSendRequired", true);
                    call.resolve(result);
                } catch (ActivityNotFoundException | SecurityException error) {
                    call.reject(
                        "WhatsApp konnte den Nachrichtenentwurf gerade nicht öffnen.",
                        "WHATSAPP_OPEN_FAILED",
                        error
                    );
                }
            }
        );
    }

    private void confirmExternalAction(
        PluginCall call,
        Activity activity,
        String title,
        String message,
        String positiveLabel,
        Runnable confirmedAction
    ) {
        synchronized (this) {
            if (pendingExternalActionCall != null) {
                call.reject(
                    "Bitte schließe zuerst die bereits geöffnete Bestätigung.",
                    "EXTERNAL_ACTION_CONFIRMATION_ACTIVE"
                );
                return;
            }
            pendingExternalActionCall = call;
        }

        activity.runOnUiThread(() -> {
            try {
                AlertDialog dialog = new AlertDialog.Builder(activity)
                    .setTitle(title)
                    .setMessage(message)
                    .setPositiveButton(positiveLabel, (ignored, which) -> {
                        if (completeExternalConfirmation(call)) {
                            confirmedAction.run();
                        }
                    })
                    .setNegativeButton("Abbrechen", (ignored, which) -> {
                        if (completeExternalConfirmation(call)) {
                            call.reject(
                                "Die Aktion wurde abgebrochen.",
                                "USER_CANCELLED"
                            );
                        }
                    })
                    .setOnCancelListener(ignored -> {
                        if (completeExternalConfirmation(call)) {
                            call.reject(
                                "Die Aktion wurde abgebrochen.",
                                "USER_CANCELLED"
                            );
                        }
                    })
                    .create();

                synchronized (PhoneContactsPlugin.this) {
                    if (pendingExternalActionCall != call) {
                        return;
                    }
                    pendingExternalActionDialog = dialog;
                }
                dialog.show();
            } catch (RuntimeException error) {
                if (completeExternalConfirmation(call)) {
                    call.reject(
                        "Die sichtbare Bestätigung konnte gerade nicht geöffnet werden.",
                        "EXTERNAL_ACTION_CONFIRMATION_UNAVAILABLE",
                        error
                    );
                }
            }
        });
    }

    private synchronized boolean completeExternalConfirmation(PluginCall call) {
        if (pendingExternalActionCall != call) {
            return false;
        }
        pendingExternalActionCall = null;
        pendingExternalActionDialog = null;
        return true;
    }

    private void cancelPendingExternalAction() {
        PluginCall call;
        AlertDialog dialog;
        synchronized (this) {
            call = pendingExternalActionCall;
            dialog = pendingExternalActionDialog;
            pendingExternalActionCall = null;
            pendingExternalActionDialog = null;
        }

        if (dialog != null && dialog.isShowing()) {
            dialog.setOnCancelListener(null);
            dialog.dismiss();
        }
        if (call != null) {
            call.reject(
                "Die sichtbare Bestätigung wurde geschlossen.",
                "EXTERNAL_ACTION_CONFIRMATION_CLOSED"
            );
        }
    }

    private boolean explicitOwnerCallAuthorized(PluginCall call) {
        String ownerId = cleanOwnerId(call.getString("ownerId", ""));
        boolean explicitOwnerCommand = Boolean.TRUE.equals(
            call.getBoolean("explicitOwnerCommand", false)
        );
        return !ownerId.isEmpty() && explicitOwnerCommand;
    }

    private void confirmAndStartDirectCall(
        PluginCall call,
        DirectCallTarget target
    ) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject(
                "Der Anruf konnte gerade nicht bestätigt werden.",
                "DIRECT_CALL_ACTIVITY_UNAVAILABLE"
            );
            return;
        }

        String recipient = target.recipientName.isEmpty()
            ? target.number
            : target.recipientName + " (" + target.number + ")";
        String confirmationText =
            "Anrufziel: " + recipient + "\n\n" +
            "Nach deiner Bestätigung startet Human Holo genau diesen Anruf sofort. " +
            "Beim ersten Mal folgt zusätzlich die Android-Freigabe für Telefonanrufe.\n\n" +
            "110, 112 und andere Notrufnummern werden auf diesem Weg nicht direkt angerufen.";

        confirmExternalAction(
            call,
            activity,
            "Direkten Anruf bestätigen",
            confirmationText,
            "Jetzt anrufen",
            () -> requestDirectCallPermissionOrStart(call, target)
        );
    }

    private void requestDirectCallPermissionOrStart(
        PluginCall call,
        DirectCallTarget target
    ) {
        if (directCallGranted()) {
            launchDirectCall(call, target);
            return;
        }

        synchronized (this) {
            if (pendingDirectCallPermissionCall != null) {
                call.reject(
                    "Bitte schließe zuerst die bereits geöffnete Telefonfreigabe.",
                    "DIRECT_CALL_PERMISSION_ACTIVE"
                );
                return;
            }
            pendingDirectCallPermissionCall = call;
            pendingDirectCallPermissionTarget = target;
        }

        try {
            requestPermissionForAlias(
                "directCall",
                call,
                "directCallPermissionCallback"
            );
        } catch (RuntimeException error) {
            clearPendingDirectCallPermission(call);
            call.reject(
                "Die Android-Freigabe für den Anruf konnte gerade nicht geöffnet werden.",
                "DIRECT_CALL_PERMISSION_UNAVAILABLE",
                error
            );
        }
    }

    @PermissionCallback
    private void directCallPermissionCallback(PluginCall call) {
        DirectCallTarget target = clearPendingDirectCallPermission(call);
        if (target == null) {
            call.reject(
                "Der bestätigte Anrufauftrag ist nicht mehr aktiv.",
                "DIRECT_CALL_REQUEST_EXPIRED"
            );
            return;
        }
        if (!directCallGranted()) {
            call.reject(
                "Ohne Android-Telefonfreigabe wurde kein Anruf gestartet.",
                "DIRECT_CALL_PERMISSION_REQUIRED"
            );
            return;
        }
        launchDirectCall(call, target);
    }

    private synchronized DirectCallTarget clearPendingDirectCallPermission(
        PluginCall call
    ) {
        if (pendingDirectCallPermissionCall != call) {
            return null;
        }
        DirectCallTarget target = pendingDirectCallPermissionTarget;
        pendingDirectCallPermissionCall = null;
        pendingDirectCallPermissionTarget = null;
        return target;
    }

    private void cancelPendingDirectCallPermission() {
        PluginCall call;
        synchronized (this) {
            call = pendingDirectCallPermissionCall;
            pendingDirectCallPermissionCall = null;
            pendingDirectCallPermissionTarget = null;
        }
        if (call != null) {
            call.reject(
                "Die Android-Telefonfreigabe wurde geschlossen.",
                "DIRECT_CALL_PERMISSION_CLOSED"
            );
        }
    }

    private void launchDirectCall(PluginCall call, DirectCallTarget target) {
        String number = normalizedDirectCallNumber(target.number);
        if (number.isEmpty()) {
            call.reject(
                "Dieses Anrufziel darf nicht direkt angerufen werden.",
                "DIRECT_CALL_DESTINATION_NOT_ALLOWED"
            );
            return;
        }
        if (!directCallGranted()) {
            call.reject(
                "Ohne Android-Telefonfreigabe wurde kein Anruf gestartet.",
                "DIRECT_CALL_PERMISSION_REQUIRED"
            );
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject(
                "Der Anruf konnte gerade nicht gestartet werden.",
                "DIRECT_CALL_ACTIVITY_UNAVAILABLE"
            );
            return;
        }

        Intent intent = new Intent(
            Intent.ACTION_CALL,
            Uri.fromParts("tel", number, null)
        );
        try {
            activity.startActivity(intent);
            JSObject result = new JSObject();
            result.put("opened", true);
            result.put("number", number);
            result.put("recipientName", target.recipientName);
            result.put("targetType", target.targetType);
            result.put(
                "contactReverifiedOnDevice",
                target.contactReverifiedOnDevice
            );
            result.put("confirmationShown", true);
            result.put("userConfirmed", true);
            result.put("explicitOwnerCommandAccepted", true);
            result.put("callStarted", true);
            result.put("connectionConfirmed", false);
            result.put("finalDialerConfirmationRequired", false);
            result.put("emergencyCall", false);
            call.resolve(result);
        } catch (ActivityNotFoundException | SecurityException error) {
            call.reject(
                "Der bestätigte Anruf konnte auf diesem Gerät nicht gestartet werden.",
                "DIRECT_CALL_START_FAILED",
                error
            );
        }
    }

    private String normalizedDirectCallNumber(String value) {
        String clean = cleanDestination(value);
        if (
            clean.isEmpty()
                || clean.contains("*")
                || clean.contains("#")
                || clean.contains(",")
                || clean.contains(";")
                || !clean.matches("[+0-9()/.\\s-]+")
                || clean.indexOf('+') > 0
                || clean.indexOf('+') != clean.lastIndexOf('+')
        ) {
            return "";
        }

        String normalized = comparablePhoneNumber(clean);
        String digits = normalized.replaceAll("[^0-9]", "");
        if (digits.length() < 5 || digits.length() > 15) {
            return "";
        }
        if (
            SAFE_SERVICE_DIALER_NUMBERS.contains(digits)
                || isEmergencyDestination(normalized)
        ) {
            return "";
        }
        return normalized;
    }

    @SuppressWarnings("deprecation")
    private boolean isEmergencyDestination(String number) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                TelephonyManager manager = getContext().getSystemService(
                    TelephonyManager.class
                );
                return manager == null || manager.isEmergencyNumber(number);
            }
            return PhoneNumberUtils.isLocalEmergencyNumber(
                getContext(),
                number
            );
        } catch (RuntimeException ignored) {
            return true;
        }
    }

    private String cleanDestination(String value) {
        String clean = (value == null ? "" : value).trim();
        if (clean.length() > 80 || clean.contains("\n") || clean.contains("\r")) {
            return "";
        }
        return clean;
    }

    private String cleanRecipientName(String value) {
        String clean = (value == null ? "" : value)
            .replace('\n', ' ')
            .replace('\r', ' ')
            .trim();
        if (clean.length() > MAX_RECIPIENT_NAME_LENGTH) {
            clean = clean.substring(0, MAX_RECIPIENT_NAME_LENGTH).trim();
        }
        return clean;
    }

    private String cleanContactAlias(String value) {
        String clean = (value == null ? "" : value)
            .replace('\n', ' ')
            .replace('\r', ' ')
            .replaceAll("\\s+", " ")
            .trim();
        if (clean.length() > MAX_CONTACT_ALIAS_LENGTH) {
            return "";
        }
        return clean;
    }

    private String normalizedAliasKey(String alias) {
        String normalized = Normalizer.normalize(
            cleanContactAlias(alias),
            Normalizer.Form.NFKD
        );
        return normalized
            .replaceAll("\\p{M}+", "")
            .toLowerCase(Locale.GERMAN)
            .replaceAll("[^\\p{L}\\p{N}]+", " ")
            .trim();
    }

    private String cleanOwnerId(String value) {
        String clean = value == null ? "" : value.trim();
        return clean.matches("[a-z0-9][a-z0-9-]{1,79}") ? clean : "";
    }

    private String contactAliasPreferencePrefix(
        String ownerId,
        String aliasKey
    ) {
        return "owner." + ownerId + ".alias." + aliasKey + ".";
    }

    private String comparablePhoneNumber(String value) {
        String clean = value == null ? "" : value.trim();
        boolean international = clean.startsWith("+") || clean.startsWith("00");
        String digits = clean.replaceAll("[^0-9]", "");
        if (international && digits.startsWith("00")) {
            digits = digits.substring(2);
        }
        return (international ? "+" : "") + digits;
    }

    private ContactRecord findContactRecord(long contactId, String expectedNumber) {
        String[] projection = {
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER,
            ContactsContract.CommonDataKinds.Phone.NORMALIZED_NUMBER,
            ContactsContract.CommonDataKinds.Phone.TYPE,
            ContactsContract.CommonDataKinds.Phone.LABEL
        };
        String selection =
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID + " = ?";
        String[] selectionArgs = { String.valueOf(contactId) };
        String expected = comparablePhoneNumber(expectedNumber);

        try (
            Cursor cursor = getContext().getContentResolver().query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                projection,
                selection,
                selectionArgs,
                null
            )
        ) {
            if (cursor == null) {
                return null;
            }

            int idIndex = cursor.getColumnIndexOrThrow(
                ContactsContract.CommonDataKinds.Phone.CONTACT_ID
            );
            int nameIndex = cursor.getColumnIndexOrThrow(
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME
            );
            int numberIndex = cursor.getColumnIndexOrThrow(
                ContactsContract.CommonDataKinds.Phone.NUMBER
            );
            int normalizedNumberIndex = cursor.getColumnIndex(
                ContactsContract.CommonDataKinds.Phone.NORMALIZED_NUMBER
            );
            int typeIndex = cursor.getColumnIndexOrThrow(
                ContactsContract.CommonDataKinds.Phone.TYPE
            );
            int labelIndex = cursor.getColumnIndexOrThrow(
                ContactsContract.CommonDataKinds.Phone.LABEL
            );

            while (cursor.moveToNext()) {
                String currentNumber = cursor.getString(numberIndex);
                String currentNormalizedNumber = normalizedNumberIndex < 0
                    ? ""
                    : cursor.getString(normalizedNumberIndex);
                if (
                    !expected.equals(comparablePhoneNumber(currentNumber))
                        && !expected.equals(
                            comparablePhoneNumber(currentNormalizedNumber)
                        )
                ) {
                    continue;
                }
                int type = cursor.getInt(typeIndex);
                String customLabel = cursor.getString(labelIndex);
                CharSequence label = ContactsContract.CommonDataKinds.Phone.getTypeLabel(
                    getContext().getResources(),
                    type,
                    customLabel
                );
                return new ContactRecord(
                    cursor.getLong(idIndex),
                    cursor.getString(nameIndex),
                    currentNumber,
                    currentNormalizedNumber,
                    String.valueOf(label)
                );
            }
        } catch (SecurityException ignored) {
            return null;
        }
        return null;
    }

    private JSObject contactRecordToJs(ContactRecord contact) {
        JSObject result = new JSObject();
        result.put("id", contact.id);
        result.put("name", contact.name);
        result.put("number", contact.number);
        result.put("normalizedNumber", contact.normalizedNumber);
        result.put("label", contact.label);
        return result;
    }

    private String internationalWhatsAppDigits(
        String normalizedNumber,
        String displayNumber
    ) {
        for (String candidate : new String[] {
            normalizedNumber,
            displayNumber
        }) {
            String direct = directInternationalDigits(candidate);
            if (!direct.isEmpty()) {
                return direct;
            }
        }

        String countryIso = deviceCountryIso();
        String e164 = countryIso.isEmpty()
            ? null
            : PhoneNumberUtils.formatNumberToE164(displayNumber, countryIso);
        return directInternationalDigits(e164);
    }

    private String directInternationalDigits(String value) {
        String candidate = value == null ? "" : value.trim();
        if (candidate.startsWith("00")) {
            candidate = "+" + candidate.substring(2);
        }
        if (!candidate.startsWith("+")) {
            return "";
        }
        String digits = candidate.replaceAll("[^0-9]", "");
        if (
            digits.length() < 7
                || digits.length() > 15
                || digits.startsWith("0")
        ) {
            return "";
        }
        return digits;
    }

    private String deviceCountryIso() {
        TelephonyManager manager = (TelephonyManager) getContext()
            .getSystemService(Context.TELEPHONY_SERVICE);
        String countryIso = "";
        if (manager != null) {
            try {
                countryIso = manager.getNetworkCountryIso();
                if (countryIso == null || countryIso.trim().isEmpty()) {
                    countryIso = manager.getSimCountryIso();
                }
            } catch (SecurityException ignored) {
                countryIso = "";
            }
        }
        if (countryIso == null || countryIso.trim().isEmpty()) {
            countryIso = Locale.getDefault().getCountry();
        }
        return countryIso == null
            ? ""
            : countryIso.trim().toUpperCase(Locale.ROOT);
    }

    private String resolveWhatsAppPackage(Uri uri) {
        for (String packageName : new String[] {
            WHATSAPP_PACKAGE,
            WHATSAPP_BUSINESS_PACKAGE
        }) {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.setPackage(packageName);
            ResolveInfo resolved = getContext()
                .getPackageManager()
                .resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY);
            if (
                resolved != null
                    && resolved.activityInfo != null
                    && packageName.equals(resolved.activityInfo.packageName)
            ) {
                return packageName;
            }
        }
        return "";
    }

    private String callStateName(int state) {
        if (state == TelephonyManager.CALL_STATE_RINGING) {
            return "ringing";
        }
        if (state == TelephonyManager.CALL_STATE_OFFHOOK) {
            return "offhook";
        }
        return "idle";
    }

    private void publishCallState(int state) {
        currentCallState = state;
        JSObject event = status();
        notifyListeners("callStateChanged", event, true);
        notifyListeners("phoneStatusChanged", event, true);
    }

    @SuppressWarnings("deprecation")
    private void registerCallStateListener() {
        if (!phoneStateGranted() || !telephonySupported()) {
            unregisterCallStateListener();
            currentCallState = TelephonyManager.CALL_STATE_IDLE;
            return;
        }

        if (telephonyCallback != null || legacyPhoneStateListener != null) {
            return;
        }

        telephonyManager =
            (TelephonyManager) getContext().getSystemService(Context.TELEPHONY_SERVICE);
        if (telephonyManager == null) {
            return;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                telephonyCallback = new SolHoloCallStateCallback();
                telephonyManager.registerTelephonyCallback(
                    getContext().getMainExecutor(),
                    telephonyCallback
                );
            } else {
                legacyPhoneStateListener = new PhoneStateListener() {
                    @Override
                    public void onCallStateChanged(int state, String ignoredNumber) {
                        publishCallState(state);
                    }
                };
                telephonyManager.listen(
                    legacyPhoneStateListener,
                    PhoneStateListener.LISTEN_CALL_STATE
                );
            }
        } catch (SecurityException error) {
            telephonyCallback = null;
            legacyPhoneStateListener = null;
        }
    }

    @SuppressWarnings("deprecation")
    private void unregisterCallStateListener() {
        if (telephonyManager == null) {
            return;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (telephonyCallback != null) {
                    telephonyManager.unregisterTelephonyCallback(telephonyCallback);
                }
            } else if (legacyPhoneStateListener != null) {
                telephonyManager.listen(
                    legacyPhoneStateListener,
                    PhoneStateListener.LISTEN_NONE
                );
            }
        } catch (SecurityException ignored) {
            // Android kann die Freigabe während der Laufzeit entziehen.
        }

        telephonyCallback = null;
        legacyPhoneStateListener = null;
        telephonyManager = null;
    }

    private final class SolHoloCallStateCallback
        extends TelephonyCallback
        implements TelephonyCallback.CallStateListener {

        @Override
        public void onCallStateChanged(int state) {
            publishCallState(state);
        }
    }
}
