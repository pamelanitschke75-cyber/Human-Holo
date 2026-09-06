package com.solholo.app;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.ContactsContract;
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
    private static final int MAX_SMS_LENGTH = 5000;
    private static final int MAX_WHATSAPP_MESSAGE_LENGTH = 5000;
    private static final int MAX_RECIPIENT_NAME_LENGTH = 160;
    private static final int MAX_CONTACT_ALIAS_LENGTH = 60;
    private static final String WHATSAPP_PACKAGE = "com.whatsapp";
    private static final String WHATSAPP_BUSINESS_PACKAGE =
        "com.whatsapp.w4b";
    private static final String CONTACT_ALIAS_PREFERENCES =
        "sol_holo_contact_aliases";
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
        event.put("automaticSendRequested", true);
        event.put("sendControlActivated", sendControlActivated);
        event.put("sent", sendControlActivated);
        event.put("deliveryConfirmed", false);
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
        result.put("outgoingCallsDirectlyStarted", false);
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
            "Damit Sol Holo nach deinem ausdrücklichen Auftrag in WhatsApp " +
            "automatisch auf Senden tippen kann, benötigt sie die Android-" +
            "Bedienungshilfe.\n\n" +
            "Android bezeichnet diese Freigabe als weitreichenden Bildschirm- " +
            "und Steuerungszugriff. Sol Holos technische Begrenzung lässt die " +
            "Funktion trotzdem ausschließlich in WhatsApp arbeiten.\n\n" +
            "Die Funktion reagiert ausschließlich auf einen kurzlebigen " +
            "Einmal-Auftrag, ausschließlich in WhatsApp und nur wenn " +
            "Empfänger sowie vollständiger Nachrichtentext übereinstimmen.\n\n" +
            "Sol Holo speichert oder überträgt dabei keine sichtbaren " +
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
                        "Wähle Sol Holo – WhatsApp automatisch senden und aktiviere den Zugriff. Danach den WhatsApp-Befehl einmal wiederholen."
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
        result.put("draftHandoffSupported", launch != null);
        result.put("handoffMode", launch == null ? "" : launch.mode);
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
                "Unter Berechtigungen können Kontakte und Telefon jederzeit einzeln widerrufen werden."
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
