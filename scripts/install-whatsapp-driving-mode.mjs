import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { join } from "node:path";

/*
 * Android-Installationsprofil 2026-09-14: LEGAL REVIEW
 *
 * Der historische Dateiname bleibt erhalten, damit bestehende CI-Aufrufe nicht
 * brechen. Der Installer bindet ausdrücklich KEINEN WhatsApp-Fahrmodus, KEINE
 * Accessibility-Automatik, KEIN Health Connect, KEIN Hintergrund-Weckwort und
 * KEINE Direktanruf-Berechtigung mehr ein.
 */

const projectRoot = process.cwd();
const nativeSource = join(projectRoot, "android-native");
const javaTarget = join(
  projectRoot,
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "solholo",
  "app"
);
const manifestPath = join(
  projectRoot,
  "android",
  "app",
  "src",
  "main",
  "AndroidManifest.xml"
);
const mainActivityPath = join(javaTarget, "MainActivity.java");

mkdirSync(javaTarget, { recursive: true });

// Wiederholte lokale Builds dürfen keine früher installierten Risikomodule
// mitschleppen. Diese Dateien sind im Legal-Review-Profil ausdrücklich nicht
// Bestandteil der App und werden aus dem generierten Android-Projekt entfernt.
for (const fileName of [
  "HealthConnectPlugin.java",
  "HealthPrivacyActivity.java",
  "HeyHoSolPlugin.java",
  "HeyHoSolService.java",
  "PcmRingBuffer.java",
  "SolSpeakerIdentityPlugin.java",
  "SpeakerVerificationPolicy.java",
  "WakeCaptureEndpointer.java",
  "WakePhraseMatcher.java",
  "WakeRecognitionLifecyclePolicy.java",
  "WakeVoiceTemplateSelector.java",
  "GalaxyWatchBridgePlugin.java",
  "WhatsAppAutoSendAccessibilityService.java",
  "WhatsAppAutoSendCommand.java",
  "WhatsAppDrivingModePlugin.java",
  "WhatsAppNotificationListener.java"
]) {
  rmSync(join(javaTarget, fileName), { force: true });
}

for (const relativePath of [
  ["res", "xml", "sol_holo_whatsapp_auto_send_service.xml"],
  ["res", "xml", "sol_holo_notification_listener.xml"]
]) {
  rmSync(
    join(projectRoot, "android", "app", "src", "main", ...relativePath),
    { force: true }
  );
}

for (const fileName of [
  "PhoneContactsPlugin.java",
  "SolAudioRoutePlugin.java",
  "SolReadAloudPlugin.java"
]) {
  copyFileSync(join(nativeSource, fileName), join(javaTarget, fileName));
}

writeFileSync(
  mainActivityPath,
  `package com.solholo.app;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SolAudioRoutePlugin.class);
        registerPlugin(SolReadAloudPlugin.class);
        registerPlugin(PhoneContactsPlugin.class);
        super.onCreate(savedInstanceState);
        PhoneContactsPlugin.handleSharedNoteIntent(this, getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        PhoneContactsPlugin.handleSharedNoteIntent(this, intent);
    }
}
`,
  "utf8"
);

let manifest = readFileSync(manifestPath, "utf8");
const manifestMarker =
  '<manifest xmlns:android="http://schemas.android.com/apk/res/android">';
const applicationMarker = "    <application";

if (!manifest.includes(manifestMarker) || !manifest.includes(applicationMarker)) {
  throw new Error("Android-Manifest konnte nicht sicher auf Legal Review gesetzt werden.");
}

manifest = manifest.replace(
  /android:allowBackup="true"/g,
  'android:allowBackup="false"'
);

// Geschlossene Liste: nur Berechtigungen für bewusst ausgelöste Kernaktionen.
const allowedPermissions = [
  "android.permission.CAMERA",
  "android.permission.RECORD_AUDIO",
  "android.permission.MODIFY_AUDIO_SETTINGS",
  "android.permission.READ_CONTACTS"
];

// Falls ein Upstream-Template künftig zusätzliche risikoreiche Zeilen enthält,
// werden sie vor der Positivliste entfernt.
manifest = manifest.replace(
  /^\s*<uses-permission android:name="(?:android\.permission\.(?:SYSTEM_ALERT_WINDOW|POST_NOTIFICATIONS|READ_PHONE_STATE|READ_CALENDAR|WRITE_CALENDAR|CALL_PHONE|FOREGROUND_SERVICE(?:_MICROPHONE)?|WAKE_LOCK)|android\.permission\.health\.[^"]+|com\.android\.alarm\.permission\.SET_ALARM)" \/>\s*$/gm,
  ""
);

for (const permission of allowedPermissions) {
  const declaration = `<uses-permission android:name="${permission}" />`;
  if (!manifest.includes(declaration)) {
    manifest = manifest.replace(
      manifestMarker,
      `${manifestMarker}\n    ${declaration}`
    );
  }
}

if (!manifest.includes('android:name="android.hardware.camera.any"')) {
  manifest = manifest.replace(
    applicationMarker,
    `    <uses-feature
        android:name="android.hardware.camera.any"
        android:required="false" />

${applicationMarker}`
  );
}

if (!manifest.includes('android:name="android.hardware.telephony"')) {
  manifest = manifest.replace(
    applicationMarker,
    `    <uses-feature
        android:name="android.hardware.telephony"
        android:required="false" />

${applicationMarker}`
  );
}

if (!manifest.includes("<queries>")) {
  manifest = manifest.replace(
    applicationMarker,
    `    <queries>
        <intent>
            <action android:name="android.intent.action.TTS_SERVICE" />
        </intent>
        <package android:name="com.google.android.apps.maps" />
        <package android:name="com.samsung.android.app.notes" />
        <package android:name="com.samsung.android.app.watchmanager" />
        <package android:name="com.whatsapp" />
        <package android:name="com.whatsapp.w4b" />
    </queries>

${applicationMarker}`
  );
}

if (!manifest.includes('android:name="android.intent.action.SEND"')) {
  const launcherEnd = [
    '                <category android:name="android.intent.category.LAUNCHER" />',
    "            </intent-filter>"
  ].join("\n");
  if (!manifest.includes(launcherEnd)) {
    throw new Error("Launcher-Filter für die manuelle Notes-Übergabe fehlt.");
  }
  const shareFilter = [
    "            <intent-filter>",
    '                <action android:name="android.intent.action.SEND" />',
    '                <category android:name="android.intent.category.DEFAULT" />',
    '                <data android:mimeType="text/plain" />',
    "            </intent-filter>"
  ].join("\n");
  manifest = manifest.replace(
    launcherEnd,
    `${launcherEnd}\n${shareFilter}`
  );
}

// Keine riskanten Komponenten dürfen aus einem veränderten Template überleben.
for (const componentName of [
  "WhatsAppNotificationListener",
  "WhatsAppAutoSendAccessibilityService",
  "HeyHoSolService",
  "HealthPrivacyActivity",
  "ViewHealthPermissionUsageActivity"
]) {
  if (manifest.includes(componentName)) {
    throw new Error(
      `Risikokomponente ${componentName} ist trotz Legal-Review-Profil im Manifest.`
    );
  }
}

writeFileSync(manifestPath, manifest, "utf8");

console.log(
  "Android Legal-Review-Profil aktiv: Tap-to-talk, statische Medienwahl, " +
  "Telefonwähler, WhatsApp-Entwurf und bewusst geteilte Notes; kein Kalender, " +
  "kein Wecker/Watch, kein Health Connect, kein Hintergrund-Weckwort, kein " +
  "Direktanruf und kein Accessibility-/Benachrichtigungsdienst."
);
