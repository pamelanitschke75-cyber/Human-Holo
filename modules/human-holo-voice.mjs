const PAM_OWNER_ID = "pam-sol";
const PAM_SPEAKER_ID = "pam";

export const DEFAULT_HUMAN_HOLO_VOICE = "coral";

export const HUMAN_HOLO_REALTIME_VOICES = Object.freeze([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "sage",
  "shimmer",
  "verse",
  "marin",
  "cedar"
]);

const HUMAN_HOLO_REALTIME_VOICE_SET =
  new Set(HUMAN_HOLO_REALTIME_VOICES);

function asQueryFunction(database) {
  if (typeof database === "function") {
    return database;
  }

  if (typeof database?.query === "function") {
    return database.query.bind(database);
  }

  throw new TypeError("Eine PostgreSQL-query-Funktion ist erforderlich.");
}

export function normalizeOpenAICustomVoiceId(value) {
  const voiceId = String(value || "").normalize("NFKC").trim();

  if (
    voiceId.length < 7 ||
    voiceId.length > 220 ||
    !/^voice_[A-Za-z0-9_-]+$/u.test(voiceId)
  ) {
    return "";
  }

  return voiceId;
}

export function resolveBuiltInHumanHoloVoice(requestedVoice) {
  const voice = String(requestedVoice || "").trim().toLowerCase();

  return HUMAN_HOLO_REALTIME_VOICE_SET.has(voice)
    ? voice
    : DEFAULT_HUMAN_HOLO_VOICE;
}

export function pamVoiceIdFromEnvironment(environment = {}) {
  return normalizeOpenAICustomVoiceId(
    environment.HUMAN_HOLO_PAM_VOICE_ID ||
      environment.SOL_HOLO_VOICE_ID ||
      ""
  );
}

export function resolveHumanHoloRealtimeVoice({
  ownerId,
  speakerId,
  requestedVoice,
  storedVoiceId,
  environment = {}
}) {
  const pamProfile =
    String(ownerId || "") === PAM_OWNER_ID &&
    String(speakerId || "") === PAM_SPEAKER_ID;
  const customVoiceId = pamProfile
    ? pamVoiceIdFromEnvironment(environment) ||
      normalizeOpenAICustomVoiceId(storedVoiceId)
    : "";

  if (customVoiceId) {
    return Object.freeze({
      apiVoice: Object.freeze({ id: customVoiceId }),
      clientVoice: "pam_custom",
      displayName: "Pam – eigene Stimme",
      isCustom: true
    });
  }

  const builtInVoice = resolveBuiltInHumanHoloVoice(requestedVoice);

  return Object.freeze({
    apiVoice: builtInVoice,
    clientVoice: builtInVoice,
    displayName: builtInVoice,
    isCustom: false
  });
}

export function createHumanHoloVoiceProfileStore({ database }) {
  const query = asQueryFunction(database);

  return Object.freeze({
    async initialize() {
      await query(`
        CREATE TABLE IF NOT EXISTS human_holo_voice_profiles (
          owner_id TEXT PRIMARY KEY,
          speaker_id TEXT NOT NULL,
          provider TEXT NOT NULL DEFAULT 'openai'
            CHECK (provider = 'openai'),
          voice_id TEXT NOT NULL,
          voice_name TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CHECK (owner_id = 'pam-sol'),
          CHECK (speaker_id = 'pam')
        )
      `);
    },

    async getPamProfile() {
      const result = await query(
        `
          SELECT owner_id, speaker_id, voice_id, voice_name, updated_at
          FROM human_holo_voice_profiles
          WHERE owner_id = $1
            AND speaker_id = $2
          LIMIT 1
        `,
        [PAM_OWNER_ID, PAM_SPEAKER_ID]
      );

      const row = result.rows?.[0];
      const voiceId = normalizeOpenAICustomVoiceId(row?.voice_id);

      if (!voiceId) {
        return null;
      }

      return Object.freeze({
        ownerId: PAM_OWNER_ID,
        speakerId: PAM_SPEAKER_ID,
        voiceId,
        voiceName: String(row.voice_name || "Pam – eigene Stimme"),
        updatedAt: row.updated_at || null
      });
    },

    async savePamProfile({ voiceId, voiceName }) {
      const normalizedVoiceId = normalizeOpenAICustomVoiceId(voiceId);

      if (!normalizedVoiceId) {
        throw new TypeError("Die OpenAI-Voice-ID ist ungültig.");
      }

      const normalizedVoiceName =
        String(voiceName || "Pam – eigene Stimme")
          .normalize("NFKC")
          .trim()
          .slice(0, 160) || "Pam – eigene Stimme";

      await query(
        `
          INSERT INTO human_holo_voice_profiles (
            owner_id,
            speaker_id,
            provider,
            voice_id,
            voice_name,
            created_at,
            updated_at
          )
          VALUES ($1, $2, 'openai', $3, $4, NOW(), NOW())
          ON CONFLICT (owner_id)
          DO UPDATE SET
            speaker_id = EXCLUDED.speaker_id,
            provider = EXCLUDED.provider,
            voice_id = EXCLUDED.voice_id,
            voice_name = EXCLUDED.voice_name,
            updated_at = NOW()
        `,
        [PAM_OWNER_ID, PAM_SPEAKER_ID, normalizedVoiceId, normalizedVoiceName]
      );

      return Object.freeze({
        ownerId: PAM_OWNER_ID,
        speakerId: PAM_SPEAKER_ID,
        voiceId: normalizedVoiceId,
        voiceName: normalizedVoiceName
      });
    }
  });
}
