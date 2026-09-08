import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CARTESIA_API_VERSION,
  CARTESIA_MODEL_ID,
  HumanHoloSpeechProviderError,
  buildCartesiaSpeechRequest,
  createCartesiaVoiceClient,
  createHumanHoloExternalVoiceStore,
  normalizeCartesiaCloneAudio,
  normalizeCartesiaVoiceId,
  normalizeHumanHoloSpeechText,
  resolveHumanHoloSpeechOutput
} from "../modules/human-holo-speech.mjs";

const CARTESIA_VOICE_ID =
  "9f4a32c1-7d61-4c6d-8b18-4e990f90f321";

const OPENAI_FALLBACK = Object.freeze({
  clientVoice: "coral",
  displayName: "Coral",
  isCustom: false,
  apiVoice: "coral"
});

test("akzeptiert ausschließlich plausible Cartesia-Voice-IDs", () => {
  assert.equal(
    normalizeCartesiaVoiceId(
      CARTESIA_VOICE_ID.toUpperCase()
    ),
    CARTESIA_VOICE_ID
  );
  assert.equal(
    normalizeCartesiaVoiceId("voice_pam"),
    ""
  );
  assert.equal(
    normalizeCartesiaVoiceId(
      "9f4a32c1-7d61-0c6d-8b18-4e990f90f321"
    ),
    ""
  );
});

test("normalisiert Clone-Dateien nach Endung und lehnt M4A serverseitig ab", () => {
  assert.deepEqual(
    normalizeCartesiaCloneAudio(
      "../../Pam.MP3",
      "audio/falsch"
    ),
    {
      filename: ".._.._Pam.MP3",
      mimeType: "audio/mpeg"
    }
  );
  assert.equal(
    normalizeCartesiaCloneAudio(
      "pam.m4a",
      "audio/mp4"
    ),
    null
  );
});

test("bereinigt Sprachtext und erzwingt das Zeichenlimit", () => {
  assert.equal(
    normalizeHumanHoloSpeechText(
      "  Hallo\u0000 Pam  "
    ),
    "Hallo Pam"
  );
  assert.equal(
    normalizeHumanHoloSpeechText("123456", 5),
    ""
  );
});

test("aktiviert Cartesia nur für Pam und nur nach Hörfreigabe", () => {
  const approvedProfile = {
    voiceId: CARTESIA_VOICE_ID,
    approvedAt: "2026-09-08T12:00:00.000Z"
  };

  const pamOutput = resolveHumanHoloSpeechOutput({
    ownerId: "pam-sol",
    speakerId: "pam",
    openAIVoice: OPENAI_FALLBACK,
    cartesiaProfile: approvedProfile,
    cartesiaConfigured: true
  });

  assert.equal(pamOutput.provider, "cartesia");
  assert.equal(pamOutput.external, true);
  assert.equal(pamOutput.voiceId, CARTESIA_VOICE_ID);
  assert.equal("apiVoice" in pamOutput, false);

  for (const override of [
    { approvedAt: null },
    { cartesiaConfigured: false },
    { ownerId: "steffi-sol", speakerId: "steffi" }
  ]) {
    const output = resolveHumanHoloSpeechOutput({
      ownerId: override.ownerId || "pam-sol",
      speakerId: override.speakerId || "pam",
      openAIVoice: OPENAI_FALLBACK,
      cartesiaProfile: {
        ...approvedProfile,
        approvedAt:
          Object.hasOwn(override, "approvedAt")
            ? override.approvedAt
            : approvedProfile.approvedAt
      },
      cartesiaConfigured:
        Object.hasOwn(override, "cartesiaConfigured")
          ? override.cartesiaConfigured
          : true
    });

    assert.equal(output.provider, "openai");
    assert.equal(output.external, false);
    assert.equal(output.apiVoice, "coral");
  }
});

test("baut deutsche Sonic-3.6-WAV-Anfragen", () => {
  const request = buildCartesiaSpeechRequest({
    voiceId: CARTESIA_VOICE_ID,
    text: "Hallo Pam"
  });

  assert.equal(request.model_id, CARTESIA_MODEL_ID);
  assert.equal(request.model_id, "sonic-3.6");
  assert.equal(request.locale, "de-DE");
  assert.equal(request.transcript, "Hallo Pam");
  assert.deepEqual(request.output_format, {
    container: "wav",
    encoding: "pcm_s16le",
    sample_rate: 44100
  });
});

test("sendet Clone und TTS nur mit serverseitigem Cartesia-Schlüssel", async () => {
  const requests = [];
  const client = createCartesiaVoiceClient({
    apiKey: "server-only-test-key",
    fetchImplementation: async (url, options) => {
      requests.push({ url, options });

      if (url.endsWith("/voices/clone")) {
        return new Response(
          JSON.stringify({
            id: CARTESIA_VOICE_ID,
            name: "Human Holo – Pam"
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }

      return new Response(
        new Uint8Array([82, 73, 70, 70]),
        {
          status: 200,
          headers: {
            "Content-Type": "audio/wav"
          }
        }
      );
    }
  });

  const clone = await client.createPrivateClone({
    audio: Buffer.from([1, 2, 3]),
    filename: "pam.wav",
    mimeType: "audio/wav",
    voiceName: "Human Holo – Pam"
  });
  const audioResponse = await client.synthesize({
    voiceId: clone.id,
    text: "Hallo Pam"
  });

  assert.equal(clone.id, CARTESIA_VOICE_ID);
  assert.equal(audioResponse.headers.get("content-type"), "audio/wav");
  assert.equal(
    requests[0].url,
    "https://api.cartesia.ai/voices/clone"
  );
  assert.equal(
    requests[0].options.headers.Authorization,
    "Bearer server-only-test-key"
  );
  assert.equal(
    requests[0].options.headers["Cartesia-Version"],
    CARTESIA_API_VERSION
  );
  assert.equal(
    requests[0].options.body.get("access"),
    "private"
  );
  assert.equal(
    requests[0].options.body.get("language"),
    "de"
  );
  assert.equal(
    requests[1].url,
    "https://api.cartesia.ai/tts/bytes"
  );
  assert.doesNotMatch(
    requests[1].options.body,
    /server-only-test-key/u
  );
});

test("übersetzt Providerfehler in einen kontrollierten Fehler", async () => {
  const client = createCartesiaVoiceClient({
    apiKey: "server-only-test-key",
    fetchImplementation: async () =>
      new Response(
        JSON.stringify({
          error: {
            message: "Endpoint nicht freigegeben"
          }
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
  });

  await assert.rejects(
    () =>
      client.synthesize({
        voiceId: CARTESIA_VOICE_ID,
        text: "Hallo Pam"
      }),
    (error) => {
      assert.ok(
        error instanceof HumanHoloSpeechProviderError
      );
      assert.equal(error.providerStatus, 403);
      assert.equal(
        error.message,
        "Endpoint nicht freigegeben"
      );
      return true;
    }
  );
});

test("Datenbankfreigabe ist erst nach einer Hörprobe möglich", async () => {
  const calls = [];
  let row = null;
  const query = async (text, values = []) => {
    calls.push({ text, values });

    if (/INSERT INTO human_holo_external_voice_profiles/u.test(text)) {
      row = {
        owner_id: "pam-sol",
        speaker_id: "pam",
        provider: "cartesia",
        voice_id: values[2],
        voice_name: values[3],
        previewed_at: null,
        approved_at: null
      };
      return { rows: [row] };
    }

    if (/SET previewed_at = NOW\(\)/u.test(text)) {
      row.previewed_at =
        "2026-09-08T12:00:00.000Z";
      return { rows: [row] };
    }

    if (/SET approved_at = NOW\(\)/u.test(text)) {
      if (!row?.previewed_at) {
        return { rows: [] };
      }
      row.approved_at =
        "2026-09-08T12:01:00.000Z";
      return { rows: [row] };
    }

    if (/SELECT/u.test(text)) {
      return { rows: row ? [row] : [] };
    }

    return { rows: [] };
  };
  const store = createHumanHoloExternalVoiceStore({
    database: query
  });

  await store.initialize();
  await store.savePamCartesiaProfile({
    voiceId: CARTESIA_VOICE_ID,
    voiceName: "Human Holo – Pam"
  });

  assert.equal(
    await store.approvePamCartesiaProfile({
      voiceId: CARTESIA_VOICE_ID
    }),
    null
  );

  await store.markPamCartesiaPreviewed({
    voiceId: CARTESIA_VOICE_ID
  });
  const approved =
    await store.approvePamCartesiaProfile({
      voiceId: CARTESIA_VOICE_ID
    });

  assert.equal(approved.ownerId, "pam-sol");
  assert.equal(approved.speakerId, "pam");
  assert.ok(approved.previewedAt);
  assert.ok(approved.approvedAt);
  assert.match(
    calls.find((call) =>
      /SET approved_at/u.test(call.text)
    ).text,
    /AND previewed_at IS NOT NULL/u
  );
});

test("Server verdrahtet Hörfreigabe, Textmodus und sicheren Fallback", async () => {
  const [server, client] = await Promise.all([
    readFile(
      new URL("../server.mjs", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../index.html", import.meta.url),
      "utf8"
    )
  ]);

  assert.match(
    server,
    /"\/voice\/setup\/cartesia\/create"[\s\S]*?checkVoiceSetupSecret/u
  );
  assert.match(
    server,
    /"\/voice\/setup\/cartesia\/preview"[\s\S]*?markPamCartesiaPreviewed/u
  );
  assert.match(
    server,
    /"\/voice\/setup\/cartesia\/activate"[\s\S]*?approved !== true/u
  );
  assert.match(
    server,
    /output_modalities:[\s\S]*?\["text"\][\s\S]*?\["audio"\]/u
  );
  assert.match(
    server,
    /"\/voice\/speak"[\s\S]*?validateRealtimeMemoryToken/u
  );
  assert.match(
    server,
    /REALTIME_SPEECH_CHARACTER_LIMIT/u
  );
  assert.match(
    server,
    /CARTESIA_TRAINING_OPT_OUT_PROCESSED[\s\S]*?CARTESIA_GERMANY_USE_CONFIRMED[\s\S]*?cartesiaVoicePilotReady/u
  );
  assert.match(
    server,
    /cartesiaConfigured:\s*cartesiaVoicePilotReady/u
  );
  assert.match(
    client,
    /tokenData\?\.speech_provider === "cartesia"/u
  );
  assert.match(
    client,
    /Authorization.*Bearer \$\{sessionToken\}/u
  );
  assert.doesNotMatch(
    server,
    /writeFile|createWriteStream|audio_sample_path|BYTEA/u
  );
});
