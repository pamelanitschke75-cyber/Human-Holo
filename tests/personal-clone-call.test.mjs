import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import {
  PERSONAL_CLONE_CALL_COMMAND,
  PersonalCloneCallError,
  createPersonalCloneCallService,
  normalizePersonalClonePhoneNumber,
  personalClonePhoneNumberSha256
} from "../modules/personal-clone-call.mjs";

const TEST_TARGET = "+4915123456789";
const OTHER_TEST_TARGET = "+4915798765432";
const ACCOUNT_SID = `AC${"a".repeat(32)}`;
const CALL_SID = `CA${"b".repeat(32)}`;
const STREAM_SID = `MZ${"c".repeat(32)}`;
const TELNYX_CALL_CONTROL_ID = `v3:${"f".repeat(64)}`;
const TELNYX_STREAM_ID = "32de0dea-53cb-4bca-9e18-1c043bc09a4e";
const TELNYX_API_KEY = `KEY_${"t".repeat(40)}`;

function environment(overrides = {}) {
  return {
    PERSONAL_CLONE_CALLS_ENABLED: "true",
    PERSONAL_CLONE_ALLOWED_NUMBER_SHA256:
      personalClonePhoneNumberSha256(TEST_TARGET),
    PERSONAL_CLONE_PUBLIC_BASE_URL: "https://sol-holo.example",
    PERSONAL_CLONE_DEFAULT_COUNTRY_CODE: "49",
    TWILIO_ACCOUNT_SID: ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: "test-auth-token-never-log",
    TWILIO_PHONE_NUMBER: "+49301234567",
    OPENAI_API_KEY: "test-openai-key-never-log",
    ...overrides
  };
}

function telnyxEnvironment(overrides = {}) {
  return environment({
    PERSONAL_CLONE_TELEPHONE_BRIDGE: "telnyx",
    TELNYX_API_KEY,
    TELNYX_CONNECTION_ID: "726700000000000001",
    TELNYX_PHONE_NUMBER: "+49301234567",
    ...overrides
  });
}

function tokenSequence() {
  const values = [
    `bridge_${"d".repeat(48)}`,
    `call_${"e".repeat(48)}`
  ];
  return () => values.shift();
}

function successfulProviderFetch(capture = {}) {
  return async (url, options) => {
    capture.url = String(url);
    capture.options = options;
    return {
      ok: true,
      status: 201,
      async json() {
        return { sid: CALL_SID };
      }
    };
  };
}

function successfulTelnyxProviderFetch(capture = {}) {
  return async (url, options) => {
    capture.url = String(url);
    capture.options = options;
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          data: { call_control_id: TELNYX_CALL_CONTROL_ID }
        };
      }
    };
  };
}

test("deutsche Mobilnummern werden kanonisch gehasht, Serviceziele bleiben gesperrt", () => {
  assert.equal(
    normalizePersonalClonePhoneNumber("0151 234 56789"),
    TEST_TARGET
  );
  assert.equal(
    normalizePersonalClonePhoneNumber("0049 151 23456789"),
    TEST_TARGET
  );
  assert.equal(
    personalClonePhoneNumberSha256("0151 234 56789"),
    personalClonePhoneNumberSha256(TEST_TARGET)
  );

  for (const number of ["110", "112", "116117", "+49112", "+49116117"]) {
    assert.throws(
      () => normalizePersonalClonePhoneNumber(number),
      PersonalCloneCallError,
      number
    );
  }
});

test("nur der eine freigegebene Nummern-Hash erreicht die Telefonbrücke", async () => {
  let providerRequests = 0;
  const service = createPersonalCloneCallService({
    environment: environment(),
    fetchImpl: async () => {
      providerRequests += 1;
      return {
        ok: true,
        status: 201,
        json: async () => ({ sid: CALL_SID })
      };
    },
    randomToken: tokenSequence()
  });

  await assert.rejects(
    service.startCall({
      ownerId: "pam-sol",
      ownerCommand: PERSONAL_CLONE_CALL_COMMAND,
      targetNumber: OTHER_TEST_TARGET
    }),
    (error) =>
      error?.code === "PERSONAL_CLONE_RECIPIENT_NOT_ALLOWED" &&
      error?.status === 403
  );
  assert.equal(providerRequests, 0);
});

test("ownergebundener Start gibt weder Zielnummer noch Brückentoken zurück", async () => {
  const capture = {};
  const service = createPersonalCloneCallService({
    environment: environment(),
    fetchImpl: successfulProviderFetch(capture),
    randomToken: tokenSequence()
  });

  const result = await service.startCall({
    ownerId: "pam-sol",
    ownerCommand: PERSONAL_CLONE_CALL_COMMAND,
    targetNumber: "0151 234 56789"
  });

  assert.equal(result.started, true);
  assert.equal(result.confirmationRequired, false);
  assert.equal(result.holoConductsConversation, true);
  assert.equal(result.numberReturned, false);
  assert.equal(result.recipientName, "Steffi");
  assert.doesNotMatch(JSON.stringify(result), /4915123456789/u);
  assert.doesNotMatch(JSON.stringify(result), /bridge_/u);

  assert.match(capture.url, new RegExp(ACCOUNT_SID));
  assert.equal(capture.options.method, "POST");
  assert.equal(capture.options.body.get("To"), TEST_TARGET);
  assert.equal(capture.options.body.get("From"), "+49301234567");
  assert.match(
    capture.options.body.get("Twiml"),
    /<Stream url="wss:\/\/sol-holo\.example\/personal-clone\/media">/u
  );
  assert.match(
    capture.options.body.get("Twiml"),
    /<Parameter name="bridgeToken" value="bridge_[a-z]+" \/>/u
  );
  assert.doesNotMatch(capture.options.body.get("Twiml"), /\?token=/u);
  assert.doesNotMatch(capture.options.body.get("Twiml"), /4915123456789/u);

  const session = [...service._testing.pendingBridges.values()][0];
  assert.ok(session);
  assert.equal(Object.hasOwn(session, "targetNumber"), false);
  assert.equal(Object.hasOwn(session, "number"), false);

  await assert.rejects(
    service.startCall({
      ownerId: "pam-sol",
      ownerCommand: PERSONAL_CLONE_CALL_COMMAND,
      targetNumber: TEST_TARGET
    }),
    (error) => error?.code === "PERSONAL_CLONE_CALL_ALREADY_ACTIVE"
  );
});

test("Telnyx-Testweg startet genau einen normalen bidirektionalen Sprachanruf", async () => {
  const capture = {};
  const service = createPersonalCloneCallService({
    environment: telnyxEnvironment(),
    fetchImpl: successfulTelnyxProviderFetch(capture),
    randomToken: tokenSequence()
  });

  const result = await service.startCall({
    ownerId: "pam-sol",
    ownerCommand: PERSONAL_CLONE_CALL_COMMAND,
    targetNumber: TEST_TARGET
  });
  const body = JSON.parse(String(capture.options.body));

  assert.equal(capture.url, "https://api.telnyx.com/v2/calls");
  assert.equal(capture.options.method, "POST");
  assert.equal(
    capture.options.headers.Authorization,
    `Bearer ${TELNYX_API_KEY}`
  );
  assert.equal(body.to, TEST_TARGET);
  assert.equal(body.from, "+49301234567");
  assert.equal(body.connection_id, "726700000000000001");
  assert.equal(
    body.stream_url,
    "wss://sol-holo.example/personal-clone/media"
  );
  assert.equal(body.stream_track, "inbound_track");
  assert.equal(body.stream_codec, "PCMU");
  assert.equal(body.stream_bidirectional_mode, "rtp");
  assert.equal(body.stream_bidirectional_codec, "PCMU");
  assert.equal(body.stream_bidirectional_target_legs, "self");
  assert.equal(body.stream_bidirectional_sampling_rate, 8000);
  assert.equal(body.stream_auth_token, `bridge_${"d".repeat(48)}`);
  assert.equal(
    Buffer.from(body.client_state, "base64").toString("utf8"),
    body.stream_auth_token
  );
  assert.equal(body.sip_region, "Europe");
  assert.equal(body.time_limit_secs, 10 * 60);
  assert.doesNotMatch(body.stream_url, /[?&](?:token|key)=/u);
  assert.equal(Object.hasOwn(body, "record"), false);
  assert.equal(result.started, true);
  assert.equal(result.confirmationRequired, false);
  assert.equal(result.numberReturned, false);
  assert.doesNotMatch(JSON.stringify(result), /4915123456789/u);
  assert.doesNotMatch(JSON.stringify(result), /bridge_/u);
  assert.equal(
    service.configurationState().telephoneBridge,
    "telnyx"
  );
});

test("Audio-Brückentoken ist kurzlebig und genau einmal verwendbar", async () => {
  let currentTime = 1_000_000;
  const service = createPersonalCloneCallService({
    environment: environment(),
    fetchImpl: successfulProviderFetch(),
    randomToken: tokenSequence(),
    now: () => currentTime
  });
  await service.startCall({
    ownerId: "pam-sol",
    ownerCommand: PERSONAL_CLONE_CALL_COMMAND,
    targetNumber: TEST_TARGET
  });

  const token = [...service._testing.pendingBridges.keys()][0];
  const session = service.claimBridge(token);
  assert.ok(session);
  assert.equal(service.claimBridge(token), null);
  service.releaseSession(session);
  assert.equal(service._testing.activeOwners.size, 0);

  const secondService = createPersonalCloneCallService({
    environment: environment(),
    fetchImpl: successfulProviderFetch(),
    randomToken: tokenSequence(),
    now: () => currentTime
  });
  await secondService.startCall({
    ownerId: "pam-sol",
    ownerCommand: PERSONAL_CLONE_CALL_COMMAND,
    targetNumber: TEST_TARGET
  });
  const expiringToken = [...secondService._testing.pendingBridges.keys()][0];
  currentTime += 3 * 60 * 1000 + 1;
  assert.equal(secondService.claimBridge(expiringToken), null);
});

test("nur ein kryptografisch signierter Twilio-Verbindungsaufbau wird angenommen", () => {
  const service = createPersonalCloneCallService({
    environment: environment(),
    fetchImpl: successfulProviderFetch()
  });
  const url = "https://sol-holo.example/personal-clone/media";
  const signature = createHmac("sha1", "test-auth-token-never-log")
    .update(url, "utf8")
    .digest("base64");

  assert.equal(
    service.validateProviderUpgrade({
      headers: { "x-twilio-signature": signature }
    }),
    true
  );
  assert.equal(
    service.validateProviderUpgrade({
      headers: { "x-twilio-signature": "not-a-valid-signature" }
    }),
    false
  );
  assert.equal(service.validateProviderUpgrade({ headers: {} }), false);
});

test("Telnyx-Audioverbindung braucht den einmaligen geheimen Streaming-Header", async () => {
  const service = createPersonalCloneCallService({
    environment: telnyxEnvironment(),
    fetchImpl: successfulTelnyxProviderFetch(),
    randomToken: tokenSequence()
  });
  await service.startCall({
    ownerId: "pam-sol",
    ownerCommand: PERSONAL_CLONE_CALL_COMMAND,
    targetNumber: TEST_TARGET
  });
  const bridgeToken = [...service._testing.pendingBridges.keys()][0];

  assert.deepEqual(
    service.providerUpgradeContext({
      headers: {
        "x-telnyx-streaming-auth-token": bridgeToken
      }
    }),
    {
      telephoneBridge: "telnyx",
      bridgeToken
    }
  );
  assert.equal(
    service.validateProviderUpgrade({
      headers: {
        "x-telnyx-streaming-auth-token": "not-a-valid-token"
      }
    }),
    false
  );
  assert.equal(service.validateProviderUpgrade({ headers: {} }), false);
});

class FakeOpenAiSocket extends EventEmitter {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;
  static instances = [];

  constructor(url, options) {
    super();
    this.url = url;
    this.options = options;
    this.readyState = FakeOpenAiSocket.CONNECTING;
    this.sent = [];
    FakeOpenAiSocket.instances.push(this);
  }

  open() {
    this.readyState = FakeOpenAiSocket.OPEN;
    this.emit("open");
  }

  send(value) {
    this.sent.push(JSON.parse(String(value)));
  }

  close() {
    if (this.readyState === FakeOpenAiSocket.CLOSED) return;
    this.readyState = FakeOpenAiSocket.CLOSED;
    this.emit("close");
  }
}

class FakeProviderSocket extends EventEmitter {
  constructor() {
    super();
    this.readyState = 1;
    this.sent = [];
  }

  send(value) {
    this.sent.push(JSON.parse(String(value)));
  }

  close() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.emit("close");
  }
}

test("Telnyx-Sprachanruf überträgt Steffis Ton zu GPT-Live und Holos Stimme zurück", async () => {
  FakeOpenAiSocket.instances.length = 0;
  const service = createPersonalCloneCallService({
    environment: telnyxEnvironment(),
    fetchImpl: successfulTelnyxProviderFetch(),
    WebSocketImpl: FakeOpenAiSocket,
    randomToken: tokenSequence(),
    logger: { warn() {} }
  });
  await service.startCall({
    ownerId: "pam-sol",
    ownerCommand: PERSONAL_CLONE_CALL_COMMAND,
    targetNumber: TEST_TARGET
  });
  const bridgeToken = [...service._testing.pendingBridges.keys()][0];
  const providerContext = service.providerUpgradeContext({
    headers: {
      "x-telnyx-streaming-auth-token": bridgeToken
    }
  });
  const provider = new FakeProviderSocket();
  service.handlePendingMediaConnection(provider, providerContext);
  provider.emit("message", Buffer.from(JSON.stringify({
    event: "connected",
    version: "1.0.0",
    "x-telnyx-streaming-auth-token": bridgeToken
  })));
  provider.emit("message", Buffer.from(JSON.stringify({
    event: "start",
    stream_id: TELNYX_STREAM_ID,
    start: {
      call_control_id: TELNYX_CALL_CONTROL_ID,
      client_state: Buffer.from(bridgeToken, "utf8").toString("base64"),
      media_format: {
        encoding: "PCMU",
        sample_rate: 8000,
        channels: 1
      }
    }
  })));

  const openAi = FakeOpenAiSocket.instances[0];
  openAi.open();
  openAi.emit("message", Buffer.from(JSON.stringify({
    type: "session.started"
  })));
  provider.emit("message", Buffer.from(JSON.stringify({
    event: "media",
    stream_id: TELNYX_STREAM_ID,
    media: { track: "inbound", payload: "QUJDRA==" }
  })));
  assert.deepEqual(
    openAi.sent.find((event) => event.type === "session.input_audio.append"),
    { type: "session.input_audio.append", audio: "QUJDRA==" }
  );

  openAi.emit("message", Buffer.from(JSON.stringify({
    type: "session.output_audio.delta",
    delta: "RUZHSA=="
  })));
  assert.deepEqual(provider.sent[0], {
    event: "media",
    media: { payload: "RUZHSA==" }
  });
  provider.emit("message", Buffer.from(JSON.stringify({
    event: "stop",
    stream_id: TELNYX_STREAM_ID
  })));
  assert.equal(service._testing.activeOwners.size, 0);
});

test("Telnyx-Audio wird nur vom eindeutig gebundenen Eingangsstream angenommen", async () => {
  FakeOpenAiSocket.instances.length = 0;
  const service = createPersonalCloneCallService({
    environment: telnyxEnvironment(),
    fetchImpl: successfulTelnyxProviderFetch(),
    WebSocketImpl: FakeOpenAiSocket,
    randomToken: tokenSequence(),
    logger: { warn() {} }
  });
  await service.startCall({
    ownerId: "pam-sol",
    ownerCommand: PERSONAL_CLONE_CALL_COMMAND,
    targetNumber: TEST_TARGET
  });
  const bridgeToken = [...service._testing.pendingBridges.keys()][0];
  const providerContext = service.providerUpgradeContext({
    headers: {
      "x-telnyx-streaming-auth-token": bridgeToken
    }
  });
  const provider = new FakeProviderSocket();
  service.handlePendingMediaConnection(provider, providerContext);
  provider.emit("message", Buffer.from(JSON.stringify({
    event: "connected",
    version: "1.0.0",
    "x-telnyx-streaming-auth-token": bridgeToken
  })));
  provider.emit("message", Buffer.from(JSON.stringify({
    event: "start",
    stream_id: TELNYX_STREAM_ID,
    start: {
      call_control_id: TELNYX_CALL_CONTROL_ID,
      client_state: Buffer.from(bridgeToken, "utf8").toString("base64"),
      media_format: {
        encoding: "PCMU",
        sample_rate: 8000,
        channels: 1
      }
    }
  })));

  const openAi = FakeOpenAiSocket.instances[0];
  openAi.open();
  openAi.emit("message", Buffer.from(JSON.stringify({
    type: "session.started"
  })));
  provider.emit("message", Buffer.from(JSON.stringify({
    event: "media",
    stream_id: "539b2ede-7bcb-4ad1-ae93-00a6ef147dac",
    media: { track: "inbound", payload: "QUJDRA==" }
  })));

  assert.equal(
    openAi.sent.some((event) => event.type === "session.input_audio.append"),
    false
  );
  assert.equal(provider.readyState, FakeOpenAiSocket.CLOSED);
  assert.equal(service._testing.activeOwners.size, 0);
});

test("GPT-Live erhält Telefon-Audio und beginnt mit transparenter KI-Einleitung", async () => {
  FakeOpenAiSocket.instances.length = 0;
  const service = createPersonalCloneCallService({
    environment: environment(),
    fetchImpl: successfulProviderFetch(),
    WebSocketImpl: FakeOpenAiSocket,
    randomToken: tokenSequence(),
    logger: { warn() {} }
  });
  await service.startCall({
    ownerId: "pam-sol",
    ownerCommand: PERSONAL_CLONE_CALL_COMMAND,
    targetNumber: TEST_TARGET
  });
  const token = [...service._testing.pendingBridges.keys()][0];
  const provider = new FakeProviderSocket();
  service.handlePendingMediaConnection(provider);
  provider.emit("message", Buffer.from(JSON.stringify({
    event: "connected",
    protocol: "Call",
    version: "1.0.0"
  })));
  provider.emit("message", Buffer.from(JSON.stringify({
    event: "start",
    start: {
      accountSid: ACCOUNT_SID,
      callSid: CALL_SID,
      streamSid: STREAM_SID,
      customParameters: { bridgeToken: token }
    }
  })));
  const openAi = FakeOpenAiSocket.instances[0];
  openAi.open();

  const sessionStart = openAi.sent.find((event) => event.type === "session.start");
  assert.equal(sessionStart.session.model, "gpt-live-1");
  assert.equal(sessionStart.session.store, false);
  assert.deepEqual(
    sessionStart.session.audio.format,
    { type: "audio/pcmu", rate: 8000 }
  );
  assert.match(sessionStart.session.instructions, /persönlicher KI-Clone/u);
  assert.match(sessionStart.session.instructions, /niemals, Pam selbst/u);
  assert.match(sessionStart.session.instructions, /keine privaten Erinnerungen/u);

  openAi.emit("message", Buffer.from(JSON.stringify({ type: "session.started" })));
  const openingInstructions = openAi.sent.find(
    (event) => event.type === "session.instructions.append"
  );
  assert.equal(openingInstructions.event_id, "holo_opening_instructions");
  assert.equal(
    openAi.sent.some((event) => event.type === "session.commentary.append"),
    false
  );
  openAi.emit("message", Buffer.from(JSON.stringify({
    type: "session.instructions.appended",
    client_event_id: openingInstructions.event_id
  })));
  const opening = openAi.sent.find(
    (event) => event.type === "session.commentary.append"
  );
  assert.equal(opening.event_id, "holo_opening_commentary");
  assert.equal(opening.delegation_id, null);
  const openingContent = opening.content;
  assert.match(openingContent, /^Hallo Steffi, hier ist Human Holo/u);
  assert.match(openingContent, /Pams persönlicher KI-Clone/u);
  assert.match(openingContent, /von Human Holo weder aufgezeichnet noch/u);
  assert.match(openingContent, /Möchtest du mit mir sprechen\?$/u);

  provider.emit("message", Buffer.from(JSON.stringify({
    event: "media",
    streamSid: STREAM_SID,
    media: { payload: "QUJDRA==" }
  })));
  assert.deepEqual(
    openAi.sent.find((event) => event.type === "session.input_audio.append"),
    { type: "session.input_audio.append", audio: "QUJDRA==" }
  );

  openAi.emit("message", Buffer.from(JSON.stringify({
    type: "session.output_audio.delta",
    delta: "RUZHSA=="
  })));
  assert.deepEqual(provider.sent[0], {
    event: "media",
    streamSid: STREAM_SID,
    media: { payload: "RUZHSA==" }
  });
  provider.close();
  assert.equal(service._testing.activeOwners.size, 0);
});

test("App-Befehl ist eindeutig, fragt nicht erneut und läuft vor dem normalen Direktanruf", async () => {
  const ui = await readFile(
    new URL("../www/sol-holo-ui.js", import.meta.url),
    "utf8"
  );
  const start = ui.indexOf("const SAFE_SERVICE_DIALERS");
  const end = ui.indexOf("async function openServiceDialer", start);
  assert.ok(start >= 0 && end > start);
  const parserContext = {};
  vm.runInNewContext(
    `${ui.slice(start, end)}\n` +
      "globalThis.parser = personalCloneContactCallFromMessage;",
    parserContext
  );

  for (const message of [
    "Ruf Schatz an und sprich mit ihr.",
    "Human Holo, ruf bitte Steffi an und rede mit ihr!",
    "Holo, rufe jetzt Schatz ❤️ an und unterhalte dich mit ihr selbst."
  ]) {
    assert.equal(parserContext.parser(message)?.mode, "personal_clone_conversation");
  }
  for (const message of [
    "Kann Holo Steffi anrufen und mit ihr sprechen?",
    "Später ruf Steffi an und sprich mit ihr.",
    "Test: Ruf Steffi an und sprich mit ihr.",
    "Ruf den ADAC an und sprich mit ihm."
  ]) {
    assert.equal(parserContext.parser(message), null, message);
  }

  const handler = ui.slice(
    ui.indexOf("window.handleSolHoloLocalAction = async"),
    ui.indexOf("window.handleSolHoloRealtimeNoteTranscript")
  );
  assert.ok(
    handler.indexOf("personalCloneContactCallFromMessage(cleanMessage)") <
      handler.indexOf("phoneContactCallNameFromMessage(cleanMessage)")
  );

  const tool = ui.slice(
    ui.indexOf("async function executePhoneTool"),
    ui.indexOf("window.executeSolHoloPhoneTool")
  );
  const personalStart = tool.slice(
    tool.indexOf('actionName === "start_personal_clone_call"')
  );
  assert.match(personalStart, /interactive: false/u);
  assert.match(personalStart, /\/personal-clone\/calls\/start/u);
  assert.match(personalStart, /START_PERSONAL_CLONE_CALL/u);
  assert.doesNotMatch(personalStart, /window\.confirm/u);
  assert.doesNotMatch(personalStart, /startContactCall/u);
});

test("Produktionsquellen enthalten keine fest eingetragene Empfängernummer", async () => {
  const sources = await Promise.all([
    "../modules/personal-clone-call.mjs",
    "../server.mjs",
    "../www/sol-holo-ui.js"
  ].map((name) => readFile(new URL(name, import.meta.url), "utf8")));
  const production = sources.join("\n");
  assert.doesNotMatch(production, /\+49\s*1[5-7]\d{8,10}/u);
  assert.doesNotMatch(production, /0151\s*6/u);
  assert.match(production, /PERSONAL_CLONE_ALLOWED_NUMBER_SHA256/u);
  assert.match(production, /numberReturned:\s*false/u);
});
