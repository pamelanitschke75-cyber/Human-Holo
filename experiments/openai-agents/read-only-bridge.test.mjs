import assert from "node:assert/strict";
import test from "node:test";

import {
  HUMAN_HOLO_READ_ONLY_URL,
  readHoloGuardStatus,
  runReadOnlyBridge,
  sanitizeHoloGuardStatus
} from "./read-only-bridge.mjs";

const validStatus = Object.freeze({
  protected: true,
  scope: ["Pam’s Holo"],
  serviceBoundary: "separate-from-human-holo",
  applicationGuard: "active-v1",
  wildcardCors: false,
  rateLimit: true,
  privateProjectFilesPublic: false,
  renderOriginGuard: "configured",
  cloudflareEdgeGuard: "verified-active"
});

test("sanitizer gibt nur freigegebene Schutzstatus-Felder weiter", () => {
  const sanitized = sanitizeHoloGuardStatus({
    ...validStatus,
    ownerId: "darf-nicht-weitergegeben-werden",
    calendar: ["darf-nicht-weitergegeben-werden"],
    token: "darf-nicht-weitergegeben-werden"
  });

  assert.deepEqual(sanitized, validStatus);
  assert.equal("ownerId" in sanitized, false);
  assert.equal("calendar" in sanitized, false);
  assert.equal("token" in sanitized, false);
});

test("sanitizer stoppt bei fehlender Owner-Trennung", () => {
  assert.throws(
    () => sanitizeHoloGuardStatus({
      ...validStatus,
      serviceBoundary: "mixed"
    }),
    /Trennung/u
  );
});

test("sanitizer stoppt bei unsicherem öffentlichen Zugriff", () => {
  assert.throws(
    () => sanitizeHoloGuardStatus({
      ...validStatus,
      wildcardCors: true
    }),
    /Wildcard-CORS/u
  );
  assert.throws(
    () => sanitizeHoloGuardStatus({
      ...validStatus,
      privateProjectFilesPublic: true
    }),
    /Projektdateien/u
  );
});

test("Bridge verwendet ausschließlich festen GET-Lesepfad ohne Redirect", async () => {
  let capturedUrl = null;
  let capturedOptions = null;

  const result = await readHoloGuardStatus(async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return new Response(JSON.stringify({
      ...validStatus,
      secret: "wird-entfernt"
    }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  });

  assert.equal(capturedUrl, HUMAN_HOLO_READ_ONLY_URL);
  assert.equal(capturedOptions.method, "GET");
  assert.equal(capturedOptions.redirect, "error");
  assert.equal(capturedOptions.body, undefined);
  assert.equal("secret" in result, false);
});

test("Bridge lehnt HTTP-Fehler ab", async () => {
  await assert.rejects(
    readHoloGuardStatus(async () => new Response("no", { status: 503 })),
    /HTTP 503/u
  );
});

test("Agent erhält nur gefilterten Status und die temporäre Session wird gelöscht", async () => {
  const previousApiKey = process.env.OPENAI_API_KEY;
  const previousModel = process.env.HUMAN_HOLO_AGENT_MODEL;
  let createRequest = null;
  let deletedSessionId = null;
  let streamAborted = false;

  class FakeOpenAI {
    constructor(options) {
      assert.equal(options.apiKey, "test-key");
      this.beta = {
        agents: {
          sessions: {
            create: async (request) => {
              createRequest = request;
              return {
                controller: {
                  abort() {
                    streamAborted = true;
                  }
                },
                async *[Symbol.asyncIterator]() {
                  yield {
                    type: "agent.session.created",
                    session: { id: "session_read_only_test" }
                  };
                  yield {
                    type: "agent.session.turn.output_text.done",
                    session_id: "session_read_only_test",
                    text: "HUMAN_HOLO_READ_ONLY_OK"
                  };
                  yield {
                    type: "agent.session.turn.completed",
                    session_id: "session_read_only_test",
                    turn: { subagent_id: null }
                  };
                }
              };
            },
            delete: async (sessionId) => {
              deletedSessionId = sessionId;
            }
          }
        }
      };
    }
  }

  process.env.OPENAI_API_KEY = "test-key";
  process.env.HUMAN_HOLO_AGENT_MODEL = "gpt-test";

  try {
    const proof = await runReadOnlyBridge({
      OpenAIClient: FakeOpenAI,
      fetchImpl: async () => new Response(JSON.stringify({
        ...validStatus,
        ownerId: "nicht-freigegeben",
        calendar: ["nicht-freigegeben"],
        secret: "nicht-freigegeben"
      }), { status: 200 })
    });

    assert.equal(proof.ok, true);
    assert.equal(proof.personal_data_forwarded, false);
    assert.equal(proof.write_routes_available, false);
    assert.equal(createRequest.environment.type, "none");
    assert.equal(createRequest.stream, true);
    assert.equal("tools" in createRequest.agent, false);

    const forwarded = JSON.parse(createRequest.input);
    assert.deepEqual(forwarded.status, validStatus);
    assert.equal("ownerId" in forwarded.status, false);
    assert.equal("calendar" in forwarded.status, false);
    assert.equal("secret" in forwarded.status, false);
    assert.equal(deletedSessionId, "session_read_only_test");
    assert.equal(streamAborted, true);
  } finally {
    if (previousApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousApiKey;
    if (previousModel === undefined) delete process.env.HUMAN_HOLO_AGENT_MODEL;
    else process.env.HUMAN_HOLO_AGENT_MODEL = previousModel;
  }
});
