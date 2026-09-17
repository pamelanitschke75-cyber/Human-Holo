import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assertRepositorySecurity,
  scanRepositorySecurity
} from "../scripts/security-release-gate.mjs";

const root = new URL("../", import.meta.url);
const [
  workflow,
  packageJson,
  packageLock,
  securityPolicy,
  securityContract,
  androidSecurityInstaller,
  codeqlWorkflow,
  dependabotConfig
] = await Promise.all([
  readFile(new URL(".github/workflows/android-build.yml", root), "utf8"),
  readFile(new URL("package.json", root), "utf8").then(JSON.parse),
  readFile(new URL("package-lock.json", root), "utf8").then(JSON.parse),
  readFile(new URL("SECURITY.md", root), "utf8"),
  readFile(
    new URL("data/human-holo-external-security.de.json", root),
    "utf8"
  ).then(JSON.parse),
  readFile(new URL("scripts/install-access-security.mjs", root), "utf8"),
  readFile(new URL(".github/workflows/codeql.yml", root), "utf8"),
  readFile(new URL(".github/dependabot.yml", root), "utf8")
]);

function secret(...parts) {
  return Buffer.from(parts.join(""), "utf8");
}

test("Geheimnisscanner meldet nur Datei und Regel und niemals den Schlüssel", () => {
  const fakeKey = ["s", "k-", "A".repeat(36)].join("");
  const findings = scanRepositorySecurity({
    rootDirectory: "/unused",
    files: ["safe.mjs", "bad.mjs"],
    readFile(file) {
      return file === "bad.mjs"
        ? Buffer.from(`const key = "${fakeKey}";`, "utf8")
        : Buffer.from("export const safe = true;", "utf8");
    }
  });
  assert.deepEqual(findings, [{ file: "bad.mjs", rule: "openai-key" }]);
  assert.doesNotMatch(JSON.stringify(findings), new RegExp(fakeKey, "u"));
});

test("private Schlüssel- und Umgebungsdateien blockieren die Freigabe", () => {
  assert.throws(
    () => assertRepositorySecurity({
      rootDirectory: "/unused",
      files: [".env.production", "release.keystore"],
      readFile: () => secret("not", "-read")
    }),
    /sensitive-environment-file[\s\S]*sensitive-binary-file/u
  );
});

test("der aktuelle Repository-Bestand enthält keine bekannten Geheimnismuster", () => {
  assert.doesNotThrow(() => assertRepositorySecurity());
});

test("gepatchte Laufzeitabhängigkeiten bleiben im Vertrag und Lockfile verankert", () => {
  assert.equal(packageJson.dependencies.ws, "^8.21.3");
  assert.equal(packageJson.overrides.qs, "6.16.0");
  assert.equal(packageLock.packages["node_modules/ws"].version, "8.21.3");
  assert.equal(packageLock.packages["node_modules/qs"].version, "6.16.0");
});

test("Android sperrt Klartext, Nutzer-Zertifikate und automatische Cloud-Backups", () => {
  assert.match(
    androidSecurityInstaller,
    /\["android:usesCleartextTraffic", "false"\]/u
  );
  assert.match(
    androidSecurityInstaller,
    /"@xml\/human_holo_network_security_config"/u
  );
  assert.match(androidSecurityInstaller, /cleartextTrafficPermitted="false"/u);
  assert.match(androidSecurityInstaller, /<certificates src="system" \/>/u);
  assert.doesNotMatch(androidSecurityInstaller, /<certificates src="user"/u);
  assert.match(androidSecurityInstaller, /\["android:allowBackup", "false"\]/u);
  assert.match(androidSecurityInstaller, /const legacyBackupDomains/u);
  assert.match(androidSecurityInstaller, /const modernBackupDomains/u);
  assert.match(androidSecurityInstaller, /"device_sharedpref"/u);
  assert.doesNotMatch(androidSecurityInstaller, /<include domain=/u);
  assert.equal(
    securityContract.android_guard.encrypted_user_controlled_human_holo_backup_preserved,
    true
  );
  assert.match(
    workflow,
    /Android-Netzwerk und automatische Backups geschlossen prüfen/u
  );
});

test("GitHub blockiert bekannte Laufzeitlücken und Geheimnisse vor dem Android-Build", () => {
  assert.match(workflow, /node scripts\/security-release-gate\.mjs/u);
  assert.match(workflow, /npm audit --omit=dev --audit-level=moderate/u);
  const gateStart = workflow.indexOf("- name: NPM-Laufzeit-Sicherheitsgate");
  const nextStep = workflow.indexOf("\n      - name:", gateStart + 1);
  const gateStep = workflow.slice(gateStart, nextStep);
  assert.doesNotMatch(gateStep, /continue-on-error:\s*true/u);
  assert.ok(
    workflow.indexOf("NPM-Laufzeit-Sicherheitsgate") <
      workflow.indexOf("Human Holo Release-APK und Play-Bundle bauen")
  );
});

test("CodeQL und Dependabot bewachen Code und Abhängigkeiten fortlaufend", () => {
  assert.match(codeqlWorkflow, /github\/codeql-action\/init@v4/u);
  assert.match(codeqlWorkflow, /github\/codeql-action\/analyze@v4/u);
  assert.match(codeqlWorkflow, /security-extended,security-and-quality/u);
  assert.match(codeqlWorkflow, /languages: javascript-typescript/u);
  assert.match(codeqlWorkflow, /cron: "17 3 \* \* 1"/u);
  assert.match(dependabotConfig, /package-ecosystem: npm/u);
  assert.match(dependabotConfig, /package-ecosystem: github-actions/u);
  assert.match(dependabotConfig, /interval: weekly/u);
});

test("Sicherheitsrichtlinie trennt Pam- und Human-Außenwächter dauerhaft", () => {
  assert.deepEqual(securityContract.scope, ["Pam’s Holo", "Human Holo"]);
  assert.equal(
    securityContract.security_claim.absolute_invulnerability_claimed,
    false
  );
  assert.equal(
    securityContract.application_guard.protections.wildcard_cors_allowed,
    false
  );

  const edgeGuards = securityContract.external_edge_guards;
  assert.equal(edgeGuards.provider, "Cloudflare");
  assert.equal(edgeGuards.shared_worker_allowed, false);
  assert.equal(edgeGuards.shared_origin_secret_allowed, false);
  assert.equal(edgeGuards.shared_server_or_database_allowed, false);
  assert.deepEqual(
    edgeGuards.existing_workers_preserved,
    ["sol-holo-api", "dark-wind-6dd8"]
  );

  assert.equal(edgeGuards.account_access.owner_only, true);
  assert.equal(edgeGuards.account_access.ai_account_access_allowed, false);
  assert.equal(edgeGuards.account_access.ai_dashboard_control_allowed, false);
  assert.equal(edgeGuards.account_access.oauth_connector_allowed, false);
  assert.equal(edgeGuards.account_access.api_token_sharing_allowed, false);
  assert.equal(
    edgeGuards.account_access.dashboard_changes_confirmed_only_by_owner,
    true
  );

  assert.equal(edgeGuards.pam_holo.corrected_source_deployed, true);
  assert.equal(edgeGuards.pam_holo.origin_protection_active, true);
  assert.equal(edgeGuards.pam_holo.origin_protection_verified, true);
  assert.equal(edgeGuards.pam_holo.render_origin_locked, true);
  assert.equal(
    edgeGuards.pam_holo.production_traffic_protected,
    false
  );
  assert.equal(edgeGuards.human_holo.pam_holo_origin_forbidden, true);
  assert.equal(edgeGuards.human_holo.fail_closed, true);
  assert.equal(edgeGuards.production_active, false);

  assert.match(securityPolicy, /Pam’s Holo und Human Holo/u);
  assert.match(securityPolicy, /Innerer Anwendungswächter/u);
  assert.match(
    securityPolicy,
    /Cloudflare[\s\S]*für Pam’s Holo aktiv und live verifiziert/u
  );
  assert.match(
    securityPolicy,
    /Cloudflare-Kontozugang bleibt ausschließlich bei Pamela Christina Nitschke/u
  );
  assert.match(securityPolicy, /keine absolute Unangreifbarkeit/u);
});
