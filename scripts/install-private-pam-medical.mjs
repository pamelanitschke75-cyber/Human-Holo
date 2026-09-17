import {
  copyFileSync,
  existsSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { join } from "node:path";

if (process.env.PAM_HOLO_PRIVATE_MEDICAL_BUILD !== "true") {
  throw new Error(
    "Private Pam-Medizin darf nur mit PAM_HOLO_PRIVATE_MEDICAL_BUILD=true eingebunden werden."
  );
}

const root = process.cwd();
const androidApp = join(root, "android", "app");
const javaTarget = join(
  androidApp,
  "src",
  "main",
  "java",
  "com",
  "solholo",
  "app"
);
const manifestPath = join(androidApp, "src", "main", "AndroidManifest.xml");
const mainActivityPath = join(javaTarget, "MainActivity.java");
const publicAssets = join(androidApp, "src", "main", "assets", "public");
const uiPath = join(publicAssets, "sol-holo-ui.js");
const indexPath = join(publicAssets, "index.html");

for (const required of [manifestPath, mainActivityPath, uiPath, indexPath]) {
  if (!existsSync(required)) {
    throw new Error(`Privater Pam-Medizin-Build unvollständig: ${required}`);
  }
}

const index = readFileSync(indexPath, "utf8");
if (
  !/ownerId:\s*"pam-sol"/u.test(index) ||
  !/speakerId:\s*"pam"/u.test(index)
) {
  throw new Error(
    "Private Medizinfunktionen dürfen nur in der fest gebundenen Pam-Holo-App gebaut werden."
  );
}

for (const fileName of [
  "HealthConnectPlugin.java",
  "HealthPrivacyActivity.java"
]) {
  copyFileSync(
    join(root, "android-native", fileName),
    join(javaTarget, fileName)
  );
}

let mainActivity = readFileSync(mainActivityPath, "utf8");
const healthRegistration =
  "        registerPlugin(HealthConnectPlugin.class);";
if (!mainActivity.includes(healthRegistration)) {
  const marker =
    "        registerPlugin(PhoneContactsPlugin.class);";
  if (!mainActivity.includes(marker)) {
    throw new Error("Registrierungsposition für das private Health-Plugin fehlt.");
  }
  mainActivity = mainActivity.replace(
    marker,
    `${marker}\n${healthRegistration}`
  );
  writeFileSync(mainActivityPath, mainActivity, "utf8");
}

const healthReadPermissions = Object.freeze([
  "READ_ACTIVE_CALORIES_BURNED",
  "READ_BASAL_BODY_TEMPERATURE",
  "READ_BASAL_METABOLIC_RATE",
  "READ_BLOOD_GLUCOSE",
  "READ_BLOOD_PRESSURE",
  "READ_BODY_FAT",
  "READ_BODY_TEMPERATURE",
  "READ_BODY_WATER_MASS",
  "READ_BONE_MASS",
  "READ_CERVICAL_MUCUS",
  "READ_CYCLING_PEDALING_CADENCE",
  "READ_DISTANCE",
  "READ_ELEVATION_GAINED",
  "READ_EXERCISE",
  "READ_FLOORS_CLIMBED",
  "READ_HEART_RATE",
  "READ_HEART_RATE_VARIABILITY",
  "READ_HEIGHT",
  "READ_HYDRATION",
  "READ_INTERMENSTRUAL_BLEEDING",
  "READ_LEAN_BODY_MASS",
  "READ_MENSTRUATION",
  "READ_NUTRITION",
  "READ_OVULATION_TEST",
  "READ_OXYGEN_SATURATION",
  "READ_PLANNED_EXERCISE",
  "READ_POWER",
  "READ_RESPIRATORY_RATE",
  "READ_RESTING_HEART_RATE",
  "READ_SKIN_TEMPERATURE",
  "READ_SLEEP",
  "READ_SPEED",
  "READ_STEPS",
  "READ_TOTAL_CALORIES_BURNED",
  "READ_VO2_MAX",
  "READ_WEIGHT",
  "READ_WHEELCHAIR_PUSHES"
]);

let manifest = readFileSync(manifestPath, "utf8");
for (const permissionName of healthReadPermissions) {
  const permission =
    `<uses-permission android:name="android.permission.health.${permissionName}" />`;
  if (!manifest.includes(permission)) {
    const applicationStart = /\s*<application\b/u;
    if (!applicationStart.test(manifest)) {
      throw new Error("Android-application-Tag für Health-Rechte fehlt.");
    }
    manifest = manifest.replace(
      applicationStart,
      `\n    ${permission}\n\n    <application`
    );
  }
}

if (!manifest.includes('android:name="com.google.android.apps.healthdata"')) {
  if (manifest.includes("    </queries>")) {
    manifest = manifest.replace(
      "    </queries>",
      '        <package android:name="com.google.android.apps.healthdata" />\n' +
        "    </queries>"
    );
  } else {
    manifest = manifest.replace(
      /\s*<application\b/u,
      '\n    <queries>\n        <package android:name="com.google.android.apps.healthdata" />\n    </queries>\n\n    <application'
    );
  }
}

if (!manifest.includes(".HealthPrivacyActivity")) {
  const applicationEnd = "    </application>";
  if (!manifest.includes(applicationEnd)) {
    throw new Error("Android-application-Ende für Health-Datenschutz fehlt.");
  }
  const privacyActivity = [
    "        <activity",
    '            android:name=".HealthPrivacyActivity"',
    '            android:exported="true">',
    "            <intent-filter>",
    '                <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" />',
    "            </intent-filter>",
    "        </activity>",
    "",
    "        <activity-alias",
    '            android:name=".ViewHealthPermissionUsageActivity"',
    '            android:exported="true"',
    '            android:targetActivity=".HealthPrivacyActivity"',
    '            android:permission="android.permission.START_VIEW_PERMISSION_USAGE">',
    "            <intent-filter>",
    '                <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />',
    '                <category android:name="android.intent.category.HEALTH_PERMISSIONS" />',
    "            </intent-filter>",
    "        </activity-alias>",
    ""
  ].join("\n");
  manifest = manifest.replace(
    applicationEnd,
    `${privacyActivity}\n${applicationEnd}`
  );
}
writeFileSync(manifestPath, manifest, "utf8");

copyFileSync(
  join(root, "private-pam-medical", "datenschutz-gesundheitsbegleitung.html"),
  join(publicAssets, "datenschutz-gesundheitsbegleitung.html")
);
copyFileSync(
  join(root, "private-pam-medical", "datenschutz-medikamentenerkennung.html"),
  join(publicAssets, "datenschutz-medikamentenerkennung.html")
);

let ui = readFileSync(uiPath, "utf8");
const replacements = [
  [
    "  // Medizinische Oberfläche ist rechtlich gesperrt und wird nicht eingebunden.",
    "  solApp.insertBefore(medicationView, currentHeader);"
  ],
  [
    "    memorial: memorialView,\n    services:",
    "    memorial: memorialView,\n    medication: medicationView,\n    services:"
  ]
];
for (const [from, to] of replacements) {
  if (!ui.includes(from)) {
    throw new Error(`Private Pam-Medizin-UI-Markierung fehlt: ${from}`);
  }
  ui = ui.replace(from, to);
}

const educationCard =
  '      <button class="humanHoloAreaCard humanHoloAreaCard--education" type="button"';
if (!ui.includes(educationCard)) {
  throw new Error("Einfügepunkt für Pams private Gesundheitskachel fehlt.");
}
ui = ui.replace(
  educationCard,
  `      <button class="humanHoloAreaCard humanHoloAreaCard--health" type="button"
        data-open-view="medication">
        <span class="humanHoloAreaIcon" aria-hidden="true">
          <svg viewBox="0 0 32 32"><path d="M16 27S5.5 21 5.5 13.4A6 6 0 0 1 16 9.5a6 6 0 0 1 10.5 3.9C26.5 21 16 27 16 27Z"/><path d="M8.5 17h4l2-4 3.2 8 2.2-4H24"/></svg>
        </span>
        <span>Gesundheit · privat</span>
      </button>
${educationCard}`
);

const generalHealthButton =
  '    <button id="medicationGeneralHealthButton" class="medicationGeneralHealthButton"';
if (!ui.includes(generalHealthButton)) {
  throw new Error("Einfügepunkt für den privaten Health-Connect-Bereich fehlt.");
}
ui = ui.replace(
  generalHealthButton,
  `    <section class="medicationLimits glassCard" aria-labelledby="privateHealthConnectTitle">
      <p class="eyebrow">Privater Pam-Holo-Test · nur lesend</p>
      <h3 id="privateHealthConnectTitle">Health Connect</h3>
      <p>Nur von Pam ausdrücklich gewählte Kategorien. Kein Hintergrundimport und keine automatische Erinnerung.</p>
      <button id="healthConnectRow" class="secondaryButton" type="button">
        Health-Freigaben verwalten · <span id="healthConnectStatus" class="serviceStatus setup">Wird geprüft …</span>
      </button>
    </section>

${generalHealthButton}`
);

const medicationCameraListener =
  '  document.getElementById("medicationCameraButton")?.addEventListener(';
if (!ui.includes(medicationCameraListener)) {
  throw new Error("Listener-Einfügepunkt der privaten Gesundheitsseite fehlt.");
}
ui = ui.replace(
  medicationCameraListener,
  `  document.getElementById("healthConnectRow")?.addEventListener(
    "click",
    () => void openHealthPermissions()
  );

${medicationCameraListener}`
);

const safetyTriageMarker =
  "    if (isSafetyTriageQuestion(cleanMessage)) {\n      previousPlainUserMessage = noteMessage;";
if (!ui.includes(safetyTriageMarker)) {
  throw new Error("Einfügepunkt für Pams bestätigten Health-Leseauftrag fehlt.");
}
ui = ui.replace(
  safetyTriageMarker,
  `    if (
      !isSafetyTriageQuestion(cleanMessage) &&
      /^(?:zeig|zeige|lies|lese|gib|wie\\s+(?:viele|war|waren|ist|sind))\\b/i.test(cleanMessage) &&
      /health|gesundheit|gesundheitsdaten|schritt|schlaf|gewicht|herz|puls|blutdruck|sauerstoff|training|kalorien|zyklus|menstru|ernährung/i.test(cleanMessage)
    ) {
      const result = await executeHealthTool("read_health_snapshot", {
        days: 7,
        category: healthCategoryFromText(cleanMessage)
      });
      return {
        handled: true,
        answer: result.answer
      };
    }

${safetyTriageMarker}`
);

writeFileSync(uiPath, ui, "utf8");
writeFileSync(
  join(publicAssets, "PAM_HOLO_PRIVATE_MEDICAL_BUILD.txt"),
  [
    "PAM_HOLO_PRIVATE_MEDICAL_BUILD=TRUE",
    "ownerId=pam-sol",
    "speakerId=pam",
    "generalHumanHoloMedical=false",
    "Health Connect: read-only, explicit action, no background import"
  ].join("\n") + "\n",
  "utf8"
);

console.log(
  "Privater Pam-Holo-Medizintest eingebunden. Allgemeiner Human-Holo-Build bleibt unverändert ohne Health-Rechte."
);
