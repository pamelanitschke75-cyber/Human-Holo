import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  HUMAN_HOLO_DATABASE_BOUNDARY,
  HUMAN_HOLO_REQUIRED_ACCESS_MODE,
  HUMAN_HOLO_SERVICE_ID,
  inspectHumanHoloDeploymentBoundary,
  requireHumanHoloDeploymentBoundary
} from "../modules/human-holo-deployment-boundary.mjs";

const root = new URL("../", import.meta.url);
const source = async path =>
  readFile(new URL(path, root), "utf8");

function validEnvironment(overrides = {}) {
  return {
    HUMAN_HOLO_SERVICE_ID,
    HUMAN_HOLO_DATABASE_BOUNDARY,
    HUMAN_HOLO_SEPARATE_DATABASE_CONFIRMED: "true",
    HUMAN_HOLO_EXPECTED_DATABASE_NAME: "human_holo_production",
    HUMAN_HOLO_PUBLIC_BASE_URL: "https://human-holo-api.example",
    HUMAN_HOLO_ACCESS_MODE: HUMAN_HOLO_REQUIRED_ACCESS_MODE,
    HUMAN_HOLO_TEST_SESSION_SECRET:
      "human-holo-test-session-secret-32-bytes-minimum",
    HUMAN_HOLO_TESTER_PROFILES_JSON: JSON.stringify([
      {
        testerId: "legal-review-1",
        displayName: "Rechtstest",
        accessCodeSha256: "a".repeat(64),
        expiresAt: "2026-09-30T23:59:59.000Z"
      }
    ]),
    DATABASE_URL:
      "postgresql://human:secret@database.example/human_holo_production",
    ...overrides
  };
}

test("Human Holo bleibt ohne eigene Infrastruktur vollständig gesperrt", () => {
  const result = inspectHumanHoloDeploymentBoundary({});
  assert.equal(result.ok, false);
  assert.throws(
    () => requireHumanHoloDeploymentBoundary({}),
    /HUMAN_HOLO_DEPLOYMENT_BLOCKED/u
  );
});

test("eine konsistente eigenständige Human-Holo-Infrastruktur wird akzeptiert", () => {
  const result = requireHumanHoloDeploymentBoundary(validEnvironment());
  assert.equal(result.ok, true);
  assert.equal(result.actualDatabaseName, "human_holo_production");
  assert.equal(result.publicOrigin, "https://human-holo-api.example");
  assert.equal(result.accessMode, "invite-only-test");
  assert.equal(result.testerProfilesConfigured, true);
});

test("Human Holo startet nicht ohne eingeladenen Testerzugang", () => {
  const result = inspectHumanHoloDeploymentBoundary(
    validEnvironment({
      HUMAN_HOLO_ACCESS_MODE: "public",
      HUMAN_HOLO_TEST_SESSION_SECRET: "kurz",
      HUMAN_HOLO_TESTER_PROFILES_JSON: "[]"
    })
  );
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("TEST_ACCESS_MODE_MISMATCH"));
  assert.ok(result.errors.includes("TEST_SESSION_SECRET_MISSING_OR_SHORT"));
  assert.ok(result.errors.includes("TESTER_PROFILES_MISSING_OR_INVALID"));
});

test("Pams Backend kann niemals als Human-Holo-Backend bestätigt werden", () => {
  const result = inspectHumanHoloDeploymentBoundary(
    validEnvironment({
      HUMAN_HOLO_PUBLIC_BASE_URL: "https://sol-holo.onrender.com"
    })
  );
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("PAM_HOLO_BACKEND_FORBIDDEN"));
});

test("Datenbankname und OAuth-Callbacks müssen zur Human-Holo-Grenze passen", () => {
  const result = inspectHumanHoloDeploymentBoundary(
    validEnvironment({
      HUMAN_HOLO_EXPECTED_DATABASE_NAME: "human_holo_production",
      DATABASE_URL: "postgresql://human:secret@database.example/pam_memory",
      GOOGLE_REDIRECT_URI:
        "https://sol-holo.onrender.com/auth/google/callback",
      SMARTTHINGS_REDIRECT_URI:
        "https://wrong.example/auth/smartthings/callback"
    })
  );
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("DATABASE_NAME_MISMATCH"));
  assert.ok(
    result.errors.includes("GOOGLE_REDIRECT_URI_OUTSIDE_HUMAN_HOLO")
  );
  assert.ok(
    result.errors.includes("SMARTTHINGS_REDIRECT_URI_OUTSIDE_HUMAN_HOLO")
  );
});

test("alle aktiven Human-Holo-Clients sind vom Pam-Backend getrennt", async () => {
  const activeClientFiles = [
    "index.html",
    "sol-holo-ui.js",
    "www/index.html",
    "www/sol-holo-ui.js",
    "www/trusted-app-session.mjs",
    "www/data-rights.mjs",
    "www/memory-control.mjs",
    "www/human-holo-animal-holos.mjs",
    "www/human-holo-test-export.mjs",
    "www/human-holo-local-owner-data.mjs"
  ];
  const contents = await Promise.all(activeClientFiles.map(source));
  for (const content of contents) {
    assert.doesNotMatch(content, /https:\/\/sol-holo\.onrender\.com/u);
  }

  const config = await source("www/human-holo-backend-config.js");
  assert.match(config, /const PROVISIONED_BACKEND_URL = ""/u);
  assert.match(config, /https:\/\/human-holo-backend\.invalid/u);
  assert.match(config, /PAM_HOLO_PROTECTED_BACKEND_ORIGIN/u);
});

test("GitHub Pages öffnet keinen vermeintlich geschützten Test", async () => {
  const rootIndex = await source("index.html");
  assert.match(rootIndex, /Hier gibt es keinen öffentlichen App-Zugang/u);
  assert.doesNotMatch(rootIndex, /http-equiv="refresh"|window\.location/u);
  assert.doesNotMatch(rootIndex, /href="\.\/www\/"/u);
});

test("Servergrenze greift vor Datenbankaufbau und nutzt eigene Callback-Basis", async () => {
  const server = await source("server.mjs");
  assert.ok(
    server.indexOf("requireHumanHoloDeploymentBoundary(process.env)") <
      server.indexOf("new Pool")
  );
  assert.match(
    server,
    /humanHoloDeployment\.publicBaseUrl\}\/auth\/google\/callback/u
  );
  assert.match(
    server,
    /humanHoloDeployment\.publicBaseUrl\}\/auth\/smartthings\/callback/u
  );
  assert.doesNotMatch(server, /https:\/\/sol-holo\.onrender\.com/u);
  assert.match(
    server,
    /const REALTIME_MEMORY_TOKEN_TTL_MS =\s*30 \* 60 \* 1000/u
  );
  assert.doesNotMatch(server, /app\.use\(cors\(\)\)/u);
  assert.match(
    server,
    /origin === humanHoloDeployment\.publicOrigin/u
  );
  assert.match(server, /Content-Security-Policy/u);
  assert.match(server, /frame-ancestors 'none'/u);
  assert.match(server, /Permissions-Policy/u);
  assert.match(
    server,
    /HUMAN_HOLO_PUBLIC_TEST_PATHS[\s\S]*?"\/memory\/search"[\s\S]*?"\/realtime\/web-search"/u
  );
  assert.match(
    server,
    /app\.post\(\s*"\/realtime\/web-search"[\s\S]*?validateRealtimeMemoryToken\(token\)/u
  );
});

test("geparkte Konten-, Geräte- und Restore-Routen sind serverseitig gesperrt", async () => {
  const server = await source("server.mjs");
  assert.match(server, /const humanHoloHeldRouteRules = Object\.freeze/u);
  assert.match(
    server,
    /if \(isLaunchFeatureEnabled\("animalHolos"\)\) \{\s*await animalProfilePhotos\.initialize\(\)/u
  );
  for (const feature of [
    "googlePersonalServices",
    "calendarRemindersNotes",
    "smartThings",
    "animalHolos",
    "memoryRestore"
  ]) {
    assert.match(server, new RegExp(`feature: "${feature}"`, "u"));
  }
  for (const path of [
    "/app-session/",
    "/auth/google",
    "/calendar/",
    "/auth/smartthings",
    "/animal-holos/",
    "/memory/backup/restore-chunk",
    "/memory/import-confirmed"
  ]) {
    assert.match(server, new RegExp(path.replaceAll("/", "\\/"), "u"));
  }
  assert.match(
    server,
    /humanHoloHeldRouteRules\.find[\s\S]*?respondLegalReviewHold/u
  );
});

test("Pam-Holo-Code-Snapshot und unveränderliche Grenzen sind maschinenlesbar", async () => {
  const record = JSON.parse(
    await source("data/pam-holo-preservation-2026-09-14.json")
  );
  assert.equal(record.code_snapshot.branch, "pam-holo-preserved-2026-09-14");
  assert.equal(
    record.code_snapshot.commit,
    "14a977af3cb503f78a0157e2b45dd185dda8559b"
  );
  assert.equal(record.protected_invariants.owner_id, "pam-sol");
  assert.equal(
    record.protected_invariants.android_application_id,
    "com.solholo.app"
  );
  assert.equal(
    record.protected_invariants.backend_origin,
    "https://sol-holo.onrender.com"
  );
  assert.equal(record.human_holo_boundary.shared_personal_memory, false);
  assert.equal(
    record.human_holo_boundary.android_application_id_status,
    "unconfigured"
  );
  assert.equal(
    record.human_holo_boundary.android_config_placeholder,
    "invalid.humanholo.unconfigured"
  );
  assert.equal(record.human_holo_boundary.android_build_allowed, false);
  assert.equal(
    record.human_holo_boundary.human_changes_apply_to_pam_automatically,
    false
  );
  assert.equal(
    record.human_holo_boundary
      .pam_function_change_requires_explicit_prior_approval,
    true
  );
  assert.equal(record.database_safety.pam_database_changed_by_this_work, false);
  assert.equal(
    record.database_safety.provider_side_backup_created_by_this_work,
    false
  );
});

test("Human-Holo-CI baut bis zur eigenen App-ID kein Android-Paket", async () => {
  const [androidWorkflow, testWorkflow, capacitorConfig, packageJson, hold] = await Promise.all([
    source(".github/workflows/android-build.yml"),
    source(".github/workflows/human-holo-legal-review-tests.yml"),
    source("capacitor.config.json"),
    source("package.json"),
    source("scripts/hold-human-holo-android-build.mjs")
  ]);
  assert.match(
    androidWorkflow,
    /build-android:\s+[\s\S]*?if: \$\{\{ false \}\}/u
  );
  assert.doesNotMatch(androidWorkflow, /secrets\.SOL_HOLO_KEYSTORE/u);
  assert.doesNotMatch(androidWorkflow, /actions\/upload-artifact/u);
  assert.match(testWorkflow, /node --test tests\/\*\.test\.mjs/u);
  assert.doesNotMatch(
    testWorkflow,
    /gradlew|cap add android|upload-artifact|SOL_HOLO_KEYSTORE/u
  );
  assert.equal(
    JSON.parse(capacitorConfig).appId,
    "invalid.humanholo.unconfigured"
  );
  assert.equal(
    JSON.parse(packageJson).scripts["android:build"],
    "node scripts/hold-human-holo-android-build.mjs"
  );
  assert.equal(
    JSON.parse(packageJson).scripts["cap:sync"],
    "node scripts/hold-human-holo-android-build.mjs"
  );
  assert.match(hold, /HUMAN_HOLO_ANDROID_BUILD_HELD/u);
  assert.match(hold, /Pam-Holos com\.solholo\.app/u);
});

test("historische Pam-Veröffentlichungs- und Identitätsjobs sind in Human Holo geparkt", async () => {
  const workflowNames = [
    "publish-build-161.yml",
    "publish-build-165.yml",
    "publish-build-167.yml",
    "publish-build-169.yml",
    "publish-build-172.yml",
    "publish-build-203.yml",
    "publish-build-205.yml",
    "publish-build-207.yml",
    "publish-build-209.yml",
    "publish-human-holo-build-213.yml",
    "publish-human-holo-build-217.yml",
    "publish-human-holo-build-219.yml",
    "publish-human-holo-build-223.yml",
    "publish-human-holo-build-225.yml",
    "build89-signature-guard.yml",
    "speaker-identity-test-build.yml"
  ];
  for (const workflowName of workflowNames) {
    const workflow = await source(`.github/workflows/${workflowName}`);
    assert.match(workflow, /^\s{4}if: \$\{\{ false \}\}$/mu, workflowName);
  }
});

test("öffentliche Projektdokumentation trennt aktuellen Test und historische Funktionen", async () => {
  const readme = await source("README.md");
  assert.match(readme, /Verbindliches Human-Holo-Testprofil/u);
  assert.match(readme, /Human Holo ist KI-gestützte Software/u);
  assert.doesNotMatch(readme, /\*\*Human Holo ist keine KI\./u);
  assert.match(readme, /keine neue automatische Dauerspeicherung/u);
  assert.match(readme, /Pam-Holo wird dadurch nicht aktualisiert/u);
});
