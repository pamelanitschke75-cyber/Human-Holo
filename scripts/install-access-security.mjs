import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const nativeSource = join(root, "android-native");
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
const mainActivityPath = join(javaTarget, "MainActivity.java");
const buildGradlePath = join(androidApp, "build.gradle");
const manifestPath = join(androidApp, "src", "main", "AndroidManifest.xml");
const xmlTarget = join(androidApp, "src", "main", "res", "xml");
const fullBackupRulesPath = join(xmlTarget, "sol_holo_backup_rules.xml");
const dataExtractionRulesPath = join(xmlTarget, "sol_holo_data_extraction_rules.xml");
const networkSecurityConfigPath = join(
  xmlTarget,
  "human_holo_network_security_config.xml"
);

for (const required of [mainActivityPath, buildGradlePath, manifestPath]) {
  if (!existsSync(required)) {
    throw new Error(
      `Android-Projekt fehlt (${required}). Zuerst Capacitor Android erzeugen.`
    );
  }
}

mkdirSync(javaTarget, { recursive: true });
for (const fileName of [
  "SecurityFactorPolicy.java",
  "SolAccessSecurityPlugin.java",
  "SolBackupPlugin.java"
]) {
  const source = join(nativeSource, fileName);
  if (!existsSync(source)) {
    throw new Error(`Native Sicherheitsquelle fehlt: ${source}`);
  }
  copyFileSync(source, join(javaTarget, fileName));
}

let gradle = readFileSync(buildGradlePath, "utf8");
const biometricDependency =
  '    implementation "androidx.biometric:biometric:1.1.0"';
if (!gradle.includes(biometricDependency)) {
  const dependenciesMarker = /dependencies\s*\{/;
  if (!dependenciesMarker.test(gradle)) {
    throw new Error("Gradle-dependencies-Block nicht gefunden.");
  }
  gradle = gradle.replace(
    dependenciesMarker,
    match => `${match}\n${biometricDependency}`
  );
  writeFileSync(buildGradlePath, gradle, "utf8");
}

let activity = readFileSync(mainActivityPath, "utf8");
const registration =
  "        registerPlugin(SolAccessSecurityPlugin.class);";
if (!activity.includes(registration)) {
  const preferredMarkers = [
    "        registerPlugin(SolSpeakerIdentityPlugin.class);",
    "        registerPlugin(PhoneContactsPlugin.class);"
  ];
  const marker = preferredMarkers.find(candidate =>
    activity.includes(candidate)
  );
  if (!marker) {
    throw new Error(
      "Sichere Plugin-Registrierungsposition in MainActivity nicht gefunden."
    );
  }
  activity = activity.replace(marker, `${marker}\n${registration}`);
  writeFileSync(mainActivityPath, activity, "utf8");
}

const backupRegistration =
  "        registerPlugin(SolBackupPlugin.class);";
if (!activity.includes(backupRegistration)) {
  if (!activity.includes(registration)) {
    throw new Error(
      "Sicherheitsplugin muss vor dem Backup-Plugin registriert sein."
    );
  }
  activity = activity.replace(
    registration,
    `${registration}\n${backupRegistration}`
  );
  writeFileSync(mainActivityPath, activity, "utf8");
}

/*
 * Androids unsichtbare Auto-Backups und Geräteübertragungen sind geschlossen.
 * Das Manifest schaltet Backups aus; die XML-Regeln schließen zusätzlich alle
 * App-Domänen aus, weil einzelne Hersteller auf neueren Android-Versionen
 * Geräteübertragungen trotz allowBackup=false unterschiedlich behandeln.
 *
 * Die vorhandene, bewusst von Pam ausgelöste Human-Holo-Sicherung bleibt davon
 * getrennt: Sie exportiert ausschließlich die Positivliste als verschlüsselten
 * Chiffretext über den System-Dateidialog. Gerätebindung und Sprecherprofil
 * werden auf einem neuen Gerät weiterhin bewusst neu eingerichtet.
 */
mkdirSync(xmlTarget, { recursive: true });

const legacyBackupDomains = Object.freeze([
  "root",
  "file",
  "database",
  "sharedpref",
  "external"
]);
const modernBackupDomains = Object.freeze([
  ...legacyBackupDomains,
  "device_root",
  "device_file",
  "device_database",
  "device_sharedpref"
]);
const explicitlySensitiveSharedPreferences = Object.freeze([
  "sol_holo_access_security_v1.xml",
  "sol_holo_access_security_v1_pam-sol.xml",
  "sol_holo_speaker_identity.xml"
]);
const exclusions = domains => domains
  .map(domain => `        <exclude domain="${domain}" path="." />\n`)
  .join("");
const sensitivePreferenceExclusions = () =>
  explicitlySensitiveSharedPreferences
    .map(path => `        <exclude domain="sharedpref" path="${path}" />\n`)
    .join("");

writeFileSync(
  fullBackupRulesPath,
  `<?xml version="1.0" encoding="utf-8"?>\n` +
    `<full-backup-content>\n` +
    exclusions(legacyBackupDomains).replaceAll("        ", "    ") +
    sensitivePreferenceExclusions().replaceAll("        ", "    ") +
    `</full-backup-content>\n`,
  "utf8"
);

writeFileSync(
  dataExtractionRulesPath,
  `<?xml version="1.0" encoding="utf-8"?>\n` +
    `<data-extraction-rules>\n` +
    `    <cloud-backup>\n` +
    exclusions(modernBackupDomains) +
    sensitivePreferenceExclusions() +
    `    </cloud-backup>\n` +
    `    <device-transfer>\n` +
    exclusions(modernBackupDomains) +
    sensitivePreferenceExclusions() +
    `    </device-transfer>\n` +
    `</data-extraction-rules>\n`,
  "utf8"
);

writeFileSync(
  networkSecurityConfigPath,
  `<?xml version="1.0" encoding="utf-8"?>\n` +
    `<network-security-config>\n` +
    `    <base-config cleartextTrafficPermitted="false">\n` +
    `        <trust-anchors>\n` +
    `            <certificates src="system" />\n` +
    `        </trust-anchors>\n` +
    `    </base-config>\n` +
    `</network-security-config>\n`,
  "utf8"
);

let manifest = readFileSync(manifestPath, "utf8");
const applicationTag = /<application\b([^>]*)>/u;
const match = manifest.match(applicationTag);
if (!match) {
  throw new Error("Android-application-Tag nicht gefunden.");
}

let attributes = match[1];
const requiredApplicationAttributes = [
  ["android:allowBackup", "false"],
  ["android:fullBackupContent", "@xml/sol_holo_backup_rules"],
  ["android:dataExtractionRules", "@xml/sol_holo_data_extraction_rules"],
  ["android:usesCleartextTraffic", "false"],
  [
    "android:networkSecurityConfig",
    "@xml/human_holo_network_security_config"
  ]
];

for (const [name, value] of requiredApplicationAttributes) {
  const attributePattern = new RegExp(`${name}="[^"]*"`, "u");
  if (attributePattern.test(attributes)) {
    attributes = attributes.replace(attributePattern, `${name}="${value}"`);
  } else {
    attributes += `\n        ${name}="${value}"`;
  }
}

manifest = manifest.replace(applicationTag, `<application${attributes}>`);
writeFileSync(manifestPath, manifest, "utf8");

// Deliberately no NFC manifest service is installed here. A future watch
// companion must first be selected and tested. If HCE is added, it must use
// CATEGORY_OTHER, coexist with Wallet/FIDO/Car Key, and never request the
// default-wallet role.
console.log(
  "Sol-Holo-Mehrfaktorgrundlage eingebunden: registriertes Gerät + " +
  "Android-Systemauthentifizierung. Automatische Android-Cloud-Backups und " +
  "unverschlüsselter Netzwerkverkehr sind gesperrt; die bewusste verschlüsselte " +
  "Human-Holo-Sicherung bleibt erhalten. NFC/Watch bleibt bis zum echten Challenge-, " +
  "Attestierungs- und Companion-Test fail-closed."
);
