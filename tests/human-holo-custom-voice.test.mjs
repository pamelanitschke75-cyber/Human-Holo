import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext, Script } from "node:vm";

import {
  createHumanHoloVoiceProfileStore,
  normalizeOpenAICustomVoiceId,
  resolveHumanHoloRealtimeVoice
} from "../modules/human-holo-voice.mjs";

test("verwendet Pams eigene Voice-ID als Realtime-Voice-Objekt", () => {
  const voice = resolveHumanHoloRealtimeVoice({
    ownerId: "pam-sol",
    speakerId: "pam",
    requestedVoice: "marin",
    storedVoiceId: "voice_pam123"
  });

  assert.deepEqual(voice.apiVoice, { id: "voice_pam123" });
  assert.equal(voice.clientVoice, "pam_custom");
  assert.equal(voice.displayName, "Pam – eigene Stimme");
  assert.equal(voice.isCustom, true);
});

test("gibt Pams Stimme niemals an eine andere Identität weiter", () => {
  const voice = resolveHumanHoloRealtimeVoice({
    ownerId: "steffi-breeze",
    speakerId: "steffi",
    requestedVoice: "marin",
    storedVoiceId: "voice_pam123",
    environment: {
      HUMAN_HOLO_PAM_VOICE_ID: "voice_pam_from_env"
    }
  });

  assert.equal(voice.apiVoice, "marin");
  assert.equal(voice.clientVoice, "marin");
  assert.equal(voice.isCustom, false);
});

test("nutzt die Umgebungs-ID vorrangig und fällt sicher auf Coral zurück", () => {
  const environmentVoice = resolveHumanHoloRealtimeVoice({
    ownerId: "pam-sol",
    speakerId: "pam",
    requestedVoice: "unbekannt",
    storedVoiceId: "voice_from_database",
    environment: {
      HUMAN_HOLO_PAM_VOICE_ID: "voice_from_environment"
    }
  });

  assert.deepEqual(environmentVoice.apiVoice, {
    id: "voice_from_environment"
  });

  const fallback = resolveHumanHoloRealtimeVoice({
    ownerId: "pam-sol",
    speakerId: "pam",
    requestedVoice: "unbekannt",
    storedVoiceId: "nicht-gueltig"
  });

  assert.equal(fallback.apiVoice, "coral");
  assert.equal(fallback.isCustom, false);
});

test("akzeptiert ausschließlich plausible OpenAI-Voice-IDs", () => {
  assert.equal(
    normalizeOpenAICustomVoiceId(" voice_pam-2026 "),
    "voice_pam-2026"
  );
  assert.equal(normalizeOpenAICustomVoiceId("coral"), "");
  assert.equal(normalizeOpenAICustomVoiceId("voice_pam/other"), "");
});

test("speichert nur Pams serverseitiges Voice-Profil per Upsert", async () => {
  const calls = [];
  const database = {
    async query(text, values) {
      calls.push({ text, values });

      if (/SELECT owner_id/u.test(text)) {
        return {
          rows: [
            {
              owner_id: "pam-sol",
              speaker_id: "pam",
              voice_id: "voice_saved_pam",
              voice_name: "Human Holo – Pam",
              updated_at: "2026-09-08T12:00:00.000Z"
            }
          ]
        };
      }

      return { rows: [] };
    }
  };
  const store = createHumanHoloVoiceProfileStore({ database });

  await store.initialize();
  await store.savePamProfile({
    voiceId: "voice_saved_pam",
    voiceName: "Human Holo – Pam"
  });
  const profile = await store.getPamProfile();

  assert.equal(profile.ownerId, "pam-sol");
  assert.equal(profile.speakerId, "pam");
  assert.equal(profile.voiceId, "voice_saved_pam");
  assert.deepEqual(calls[1].values, [
    "pam-sol",
    "pam",
    "voice_saved_pam",
    "Human Holo – Pam"
  ]);
  assert.match(calls[1].text, /ON CONFLICT \(owner_id\)/u);
});

test("Server aktiviert die erstellte Voice-ID ohne rohe Audiodatei zu speichern", () => {
  const server = readFileSync(
    new URL("../server.mjs", import.meta.url),
    "utf8"
  );

  assert.match(
    server,
    /await humanHoloVoiceProfiles\s*\.savePamProfile\(\{/u
  );
  assert.match(server, /voice:\s*solHoloVoice\.apiVoice/u);
  assert.match(server, /sol_voice_custom:\s*solHoloVoice\.isCustom/u);
  assert.match(server, /value="de"\s*readonly/u);
  assert.match(
    server,
    /process\.env\.OPENAI_VOICE_API_KEY \|\|\s*process\.env\.OPENAI_API_KEY/u
  );
  assert.doesNotMatch(
    server,
    /writeFile|createWriteStream|audio_sample_path/u
  );
});

test("Voice-Setup liefert syntaktisch ausführbares Browser-JavaScript", () => {
  const server = readFileSync(
    new URL("../server.mjs", import.meta.url),
    "utf8"
  );
  const routeStart = server.indexOf('app.get(\n  "/voice-setup"');
  const templateStart = server.indexOf("`", server.indexOf("res.send(", routeStart));
  const templateEnd = server.indexOf("\n    `);", templateStart);

  assert.notEqual(routeStart, -1);
  assert.notEqual(templateStart, -1);
  assert.notEqual(templateEnd, -1);

  const page = runInNewContext(
    server.slice(templateStart, templateEnd + 6)
  );
  const browserScript = page.match(/<script>([\s\S]*?)<\/script>/u)?.[1];

  assert.ok(browserScript);
  assert.doesNotThrow(() => new Script(browserScript));
  assert.match(
    page,
    /Bitte diese Datei unten einmal auswählen\./u
  );
});
