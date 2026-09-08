const PAM_OWNER_ID = "pam-sol";
const PAM_SPEAKER_ID = "pam";

export const HUMAN_HOLO_SPEECH_PROVIDERS = Object.freeze({
  OPENAI: "openai",
  CARTESIA: "cartesia"
});

export const CARTESIA_API_VERSION = "2026-08-14";
export const CARTESIA_MODEL_ID = "sonic-3.6";
export const CARTESIA_PREVIEW_TEXT =
  "Hallo Pam. Ich bin Human Holo und spreche jetzt mit deiner eigenen Stimme.";

const CARTESIA_VOICE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const CARTESIA_CLONE_AUDIO_TYPES = Object.freeze(
  new Map([
    [".flac", "audio/flac"],
    [".mp3", "audio/mpeg"],
    [".mpeg", "audio/mpeg"],
    [".mpga", "audio/mpeg"],
    [".oga", "audio/ogg"],
    [".ogg", "audio/ogg"],
    [".wav", "audio/wav"],
    [".webm", "audio/webm"]
  ])
);

function asQueryFunction(database) {
  if (typeof database === "function") {
    return database;
  }

  if (typeof database?.query === "function") {
    return database.query.bind(database);
  }

  throw new TypeError("Eine PostgreSQL-query-Funktion ist erforderlich.");
}

function normalizeVoiceName(value) {
  return (
    String(value || "Human Holo – Pam")
      .normalize("NFKC")
      .trim()
      .slice(0, 160) || "Human Holo – Pam"
  );
}

function normalizedProfile(row) {
  const voiceId = normalizeCartesiaVoiceId(row?.voice_id);

  if (!voiceId) {
    return null;
  }

  return Object.freeze({
    ownerId: PAM_OWNER_ID,
    speakerId: PAM_SPEAKER_ID,
    provider: HUMAN_HOLO_SPEECH_PROVIDERS.CARTESIA,
    voiceId,
    voiceName: normalizeVoiceName(row?.voice_name),
    previewedAt: row?.previewed_at || null,
    approvedAt: row?.approved_at || null,
    updatedAt: row?.updated_at || null
  });
}

export function normalizeCartesiaVoiceId(value) {
  const voiceId = String(value || "").normalize("NFKC").trim();

  return CARTESIA_VOICE_ID_PATTERN.test(voiceId)
    ? voiceId.toLowerCase()
    : "";
}

export function normalizeCartesiaCloneAudio(filename, suppliedType) {
  const cleanName = String(filename || "")
    .normalize("NFKC")
    .trim()
    .replace(/[\\/\0]/gu, "_")
    .slice(-180);
  const lowerName = cleanName.toLowerCase();
  const extension = [...CARTESIA_CLONE_AUDIO_TYPES.keys()]
    .find((candidate) => lowerName.endsWith(candidate));

  if (!extension) {
    return null;
  }

  const canonicalType = CARTESIA_CLONE_AUDIO_TYPES.get(extension);
  return Object.freeze({
    filename: cleanName || `pam-stimme${extension}`,
    mimeType: canonicalType
  });
}

export function normalizeHumanHoloSpeechText(value, maxLength = 1600) {
  const text = String(value || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/gu, "")
    .trim();

  if (!text || text.length > maxLength) {
    return "";
  }

  return text;
}

export function resolveHumanHoloSpeechOutput({
  ownerId,
  speakerId,
  openAIVoice,
  cartesiaProfile,
  cartesiaConfigured
}) {
  const pamProfile =
    String(ownerId || "") === PAM_OWNER_ID &&
    String(speakerId || "") === PAM_SPEAKER_ID;
  const cartesiaVoiceId = normalizeCartesiaVoiceId(
    cartesiaProfile?.voiceId
  );

  if (
    pamProfile &&
    cartesiaConfigured === true &&
    cartesiaVoiceId &&
    cartesiaProfile?.approvedAt
  ) {
    return Object.freeze({
      provider: HUMAN_HOLO_SPEECH_PROVIDERS.CARTESIA,
      external: true,
      voiceId: cartesiaVoiceId,
      clientVoice: "pam_cartesia",
      displayName: "Pam – eigene Stimme",
      isCustom: true
    });
  }

  return Object.freeze({
    provider: HUMAN_HOLO_SPEECH_PROVIDERS.OPENAI,
    external: false,
    voiceId: "",
    clientVoice: openAIVoice.clientVoice,
    displayName: openAIVoice.displayName,
    isCustom: openAIVoice.isCustom,
    apiVoice: openAIVoice.apiVoice
  });
}

export function buildCartesiaSpeechRequest({ voiceId, text }) {
  const normalizedVoiceId = normalizeCartesiaVoiceId(voiceId);
  const normalizedText = normalizeHumanHoloSpeechText(text);

  if (!normalizedVoiceId) {
    throw new TypeError("Die Cartesia-Voice-ID ist ungültig.");
  }

  if (!normalizedText) {
    throw new TypeError("Der Text für Pams Stimme ist ungültig.");
  }

  return Object.freeze({
    model_id: CARTESIA_MODEL_ID,
    transcript: normalizedText,
    voice: normalizedVoiceId,
    output_format: Object.freeze({
      container: "wav",
      encoding: "pcm_s16le",
      sample_rate: 44100
    }),
    locale: "de-DE",
    normalization: "auto",
    generation_config: Object.freeze({
      volume: 1,
      speed: 1
    })
  });
}

export class HumanHoloSpeechProviderError extends Error {
  constructor(message, { status = 502, providerStatus = 0 } = {}) {
    super(message);
    this.name = "HumanHoloSpeechProviderError";
    this.status = status;
    this.providerStatus = providerStatus;
  }
}

async function providerErrorMessage(response, fallback) {
  const text = await response.text();

  try {
    const data = JSON.parse(text);
    return String(
      data?.error?.message ||
        data?.error ||
        data?.message ||
        fallback
    ).slice(0, 500);
  } catch {
    return fallback;
  }
}

export function createCartesiaVoiceClient({
  apiKey,
  apiVersion = CARTESIA_API_VERSION,
  fetchImplementation = globalThis.fetch
}) {
  const key = String(apiKey || "").trim();
  const version = String(apiVersion || CARTESIA_API_VERSION).trim();

  if (!key) {
    throw new TypeError("CARTESIA_API_KEY fehlt.");
  }

  if (typeof fetchImplementation !== "function") {
    throw new TypeError("Eine fetch-Funktion ist erforderlich.");
  }

  const headers = Object.freeze({
    Authorization: `Bearer ${key}`,
    "Cartesia-Version": version
  });

  return Object.freeze({
    async createPrivateClone({
      audio,
      filename,
      mimeType,
      voiceName
    }) {
      if (!Buffer.isBuffer(audio) || audio.length === 0) {
        throw new TypeError("Keine Stimmprobe erhalten.");
      }

      const upload = normalizeCartesiaCloneAudio(filename, mimeType);
      if (!upload) {
        throw new TypeError(
          "Cartesia benötigt FLAC, MP3, MPEG, OGG, WAV oder WebM."
        );
      }

      const form = new FormData();
      form.append(
        "clip",
        new Blob([audio], { type: upload.mimeType }),
        upload.filename
      );
      form.append("name", normalizeVoiceName(voiceName));
      form.append("language", "de");
      form.append("description", "Pams persönliche Stimme für Human Holo");
      form.append("access", "private");

      const response = await fetchImplementation(
        "https://api.cartesia.ai/voices/clone",
        {
          method: "POST",
          headers,
          body: form
        }
      );

      if (!response.ok) {
        throw new HumanHoloSpeechProviderError(
          await providerErrorMessage(
            response,
            "Cartesia konnte Pams Stimme nicht erstellen."
          ),
          { providerStatus: response.status }
        );
      }

      const data = await response.json();
      const voiceId = normalizeCartesiaVoiceId(data?.id);

      if (!voiceId) {
        throw new HumanHoloSpeechProviderError(
          "Cartesia hat keine gültige Voice-ID zurückgegeben."
        );
      }

      return Object.freeze({
        id: voiceId,
        name: normalizeVoiceName(data?.name || voiceName),
        provider: HUMAN_HOLO_SPEECH_PROVIDERS.CARTESIA
      });
    },

    async synthesize({ voiceId, text }) {
      const body = buildCartesiaSpeechRequest({ voiceId, text });
      const response = await fetchImplementation(
        "https://api.cartesia.ai/tts/bytes",
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        throw new HumanHoloSpeechProviderError(
          await providerErrorMessage(
            response,
            "Pams Stimme konnte gerade nicht erzeugt werden."
          ),
          { providerStatus: response.status }
        );
      }

      return response;
    }
  });
}

export function createHumanHoloExternalVoiceStore({ database }) {
  const query = asQueryFunction(database);

  return Object.freeze({
    async initialize() {
      await query(`
        CREATE TABLE IF NOT EXISTS human_holo_external_voice_profiles (
          owner_id TEXT NOT NULL,
          speaker_id TEXT NOT NULL,
          provider TEXT NOT NULL,
          voice_id TEXT NOT NULL,
          voice_name TEXT NOT NULL,
          previewed_at TIMESTAMPTZ,
          approved_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (owner_id, provider),
          CHECK (owner_id = 'pam-sol'),
          CHECK (speaker_id = 'pam'),
          CHECK (provider = 'cartesia')
        )
      `);
    },

    async getPamCartesiaProfile({ approvedOnly = false } = {}) {
      const result = await query(
        `
          SELECT
            owner_id,
            speaker_id,
            provider,
            voice_id,
            voice_name,
            previewed_at,
            approved_at,
            updated_at
          FROM human_holo_external_voice_profiles
          WHERE owner_id = $1
            AND speaker_id = $2
            AND provider = 'cartesia'
            ${approvedOnly ? "AND approved_at IS NOT NULL" : ""}
          LIMIT 1
        `,
        [PAM_OWNER_ID, PAM_SPEAKER_ID]
      );

      return normalizedProfile(result.rows?.[0]);
    },

    async savePamCartesiaProfile({ voiceId, voiceName }) {
      const normalizedVoiceId = normalizeCartesiaVoiceId(voiceId);
      if (!normalizedVoiceId) {
        throw new TypeError("Die Cartesia-Voice-ID ist ungültig.");
      }

      const normalizedVoiceName = normalizeVoiceName(voiceName);
      const result = await query(
        `
          INSERT INTO human_holo_external_voice_profiles (
            owner_id,
            speaker_id,
            provider,
            voice_id,
            voice_name,
            previewed_at,
            approved_at,
            created_at,
            updated_at
          )
          VALUES ($1, $2, 'cartesia', $3, $4, NULL, NULL, NOW(), NOW())
          ON CONFLICT (owner_id, provider)
          DO UPDATE SET
            speaker_id = EXCLUDED.speaker_id,
            voice_id = EXCLUDED.voice_id,
            voice_name = EXCLUDED.voice_name,
            previewed_at = NULL,
            approved_at = NULL,
            updated_at = NOW()
          RETURNING *
        `,
        [
          PAM_OWNER_ID,
          PAM_SPEAKER_ID,
          normalizedVoiceId,
          normalizedVoiceName
        ]
      );

      return normalizedProfile(result.rows?.[0]) || Object.freeze({
        ownerId: PAM_OWNER_ID,
        speakerId: PAM_SPEAKER_ID,
        provider: HUMAN_HOLO_SPEECH_PROVIDERS.CARTESIA,
        voiceId: normalizedVoiceId,
        voiceName: normalizedVoiceName,
        previewedAt: null,
        approvedAt: null,
        updatedAt: null
      });
    },

    async markPamCartesiaPreviewed({ voiceId }) {
      const normalizedVoiceId = normalizeCartesiaVoiceId(voiceId);
      if (!normalizedVoiceId) {
        throw new TypeError("Die Cartesia-Voice-ID ist ungültig.");
      }

      const result = await query(
        `
          UPDATE human_holo_external_voice_profiles
          SET previewed_at = NOW(), updated_at = NOW()
          WHERE owner_id = $1
            AND speaker_id = $2
            AND provider = 'cartesia'
            AND voice_id = $3
          RETURNING *
        `,
        [PAM_OWNER_ID, PAM_SPEAKER_ID, normalizedVoiceId]
      );

      return normalizedProfile(result.rows?.[0]);
    },

    async approvePamCartesiaProfile({ voiceId }) {
      const normalizedVoiceId = normalizeCartesiaVoiceId(voiceId);
      if (!normalizedVoiceId) {
        throw new TypeError("Die Cartesia-Voice-ID ist ungültig.");
      }

      const result = await query(
        `
          UPDATE human_holo_external_voice_profiles
          SET approved_at = NOW(), updated_at = NOW()
          WHERE owner_id = $1
            AND speaker_id = $2
            AND provider = 'cartesia'
            AND voice_id = $3
            AND previewed_at IS NOT NULL
          RETURNING *
        `,
        [PAM_OWNER_ID, PAM_SPEAKER_ID, normalizedVoiceId]
      );

      return normalizedProfile(result.rows?.[0]);
    },

    async deactivatePamCartesiaProfile() {
      const result = await query(
        `
          UPDATE human_holo_external_voice_profiles
          SET approved_at = NULL, updated_at = NOW()
          WHERE owner_id = $1
            AND speaker_id = $2
            AND provider = 'cartesia'
          RETURNING *
        `,
        [PAM_OWNER_ID, PAM_SPEAKER_ID]
      );

      return normalizedProfile(result.rows?.[0]);
    }
  });
}
