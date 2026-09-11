import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual
} from "node:crypto";
import WebSocket, { WebSocketServer } from "ws";

export const PERSONAL_CLONE_CALL_COMMAND =
  "START_PERSONAL_CLONE_CALL";

export const PERSONAL_CLONE_MEDIA_PATH =
  "/personal-clone/media";

const PERSONAL_CLONE_OWNER_ID = "pam-sol";
const PERSONAL_CLONE_RECIPIENT_NAME = "Steffi";
const DEFAULT_COUNTRY_CODE = "49";
const PENDING_BRIDGE_TTL_MS = 3 * 60 * 1000;
const ACTIVE_CALL_TTL_MS = 30 * 60 * 1000;
const TWILIO_TIMEOUT_MS = 15 * 1000;
const PROVIDER_HANDSHAKE_TIMEOUT_MS = 10 * 1000;
const MAX_PROVIDER_MESSAGE_BYTES = 256 * 1024;
const E164_PATTERN = /^\+[1-9]\d{6,14}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const TWILIO_CALL_SID_PATTERN = /^CA[a-f0-9]{32}$/i;
const BLOCKED_SERVICE_NUMBERS = new Set([
  "000",
  "110",
  "111",
  "112",
  "116117",
  "119",
  "911",
  "999"
]);

export class PersonalCloneCallError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = "PersonalCloneCallError";
    this.code = code;
    this.status = status;
  }
}

function sha256Hex(value) {
  return createHash("sha256")
    .update(String(value), "utf8")
    .digest("hex");
}

function constantTimeHexEquals(left, right) {
  if (!SHA256_PATTERN.test(left) || !SHA256_PATTERN.test(right)) {
    return false;
  }
  return timingSafeEqual(
    Buffer.from(left, "hex"),
    Buffer.from(right, "hex")
  );
}

function cleanDefaultCountryCode(value) {
  const digits = String(value || DEFAULT_COUNTRY_CODE).replace(/\D/g, "");
  if (!digits || digits.length > 3 || digits.startsWith("0")) {
    throw new PersonalCloneCallError(
      "PERSONAL_CLONE_COUNTRY_CODE_INVALID",
      "Die sichere Ländervorgabe für den Holo-Anruf ist ungültig.",
      503
    );
  }
  return digits;
}

export function normalizePersonalClonePhoneNumber(
  value,
  defaultCountryCode = DEFAULT_COUNTRY_CODE
) {
  const source = String(value || "").trim();
  if (!source || source.length > 80) {
    throw new PersonalCloneCallError(
      "PERSONAL_CLONE_DESTINATION_INVALID",
      "Das lokale Anrufziel ist ungültig."
    );
  }

  const compact = source.replace(/[\s()./\-]/g, "");
  if (!/^\+?\d+$/.test(compact) && !/^00\d+$/.test(compact)) {
    throw new PersonalCloneCallError(
      "PERSONAL_CLONE_DESTINATION_INVALID",
      "Das lokale Anrufziel ist ungültig."
    );
  }

  let international = compact;
  if (international.startsWith("00")) {
    international = `+${international.slice(2)}`;
  } else if (international.startsWith("0")) {
    international =
      `+${cleanDefaultCountryCode(defaultCountryCode)}` +
      international.slice(1);
  } else if (!international.startsWith("+")) {
    throw new PersonalCloneCallError(
      "PERSONAL_CLONE_DESTINATION_INVALID",
      "Das lokale Anrufziel muss als deutsche oder internationale Telefonnummer vorliegen."
    );
  }

  const originalDigits = compact.replace(/\D/g, "");
  const nationalDigits = compact.startsWith("+49")
    ? compact.slice(3)
    : compact.startsWith("0049")
      ? compact.slice(4)
      : compact.startsWith("0")
        ? compact.slice(1)
        : originalDigits;

  if (
    BLOCKED_SERVICE_NUMBERS.has(originalDigits) ||
    BLOCKED_SERVICE_NUMBERS.has(nationalDigits) ||
    !E164_PATTERN.test(international)
  ) {
    throw new PersonalCloneCallError(
      "PERSONAL_CLONE_DESTINATION_NOT_ALLOWED",
      "Notruf-, Service- oder ungültige Nummern sind für Holo-Gesprächsanrufe gesperrt."
    );
  }

  return international;
}

export function personalClonePhoneNumberSha256(
  value,
  defaultCountryCode = DEFAULT_COUNTRY_CODE
) {
  return sha256Hex(
    normalizePersonalClonePhoneNumber(value, defaultCountryCode)
  );
}

function strictE164(value, code, label) {
  const number = String(value || "").trim();
  if (!E164_PATTERN.test(number)) {
    throw new PersonalCloneCallError(
      code,
      `${label} ist nicht sicher eingerichtet.`,
      503
    );
  }
  return number;
}

function configuredPublicHost(environment) {
  const raw = String(
    environment.PERSONAL_CLONE_PUBLIC_BASE_URL ||
    environment.RENDER_EXTERNAL_URL ||
    ""
  ).trim();

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new PersonalCloneCallError(
      "PERSONAL_CLONE_PUBLIC_URL_INVALID",
      "Die öffentliche Audio-Brücke ist noch nicht eingerichtet.",
      503
    );
  }

  if (
    url.protocol !== "https:" ||
    !url.host ||
    url.username ||
    url.password ||
    (url.pathname && url.pathname !== "/") ||
    url.search ||
    url.hash
  ) {
    throw new PersonalCloneCallError(
      "PERSONAL_CLONE_PUBLIC_URL_INVALID",
      "Die öffentliche Audio-Brücke braucht eine sichere HTTPS-Adresse.",
      503
    );
  }
  return url.host;
}

function loadConfiguration(environment) {
  if (String(environment.PERSONAL_CLONE_CALLS_ENABLED || "") !== "true") {
    throw new PersonalCloneCallError(
      "PERSONAL_CLONE_CALLS_DISABLED",
      "Der Holo-Gesprächsanruf ist noch nicht für echte Telefonate freigeschaltet.",
      503
    );
  }

  const accountSid = String(environment.TWILIO_ACCOUNT_SID || "").trim();
  const authToken = String(environment.TWILIO_AUTH_TOKEN || "").trim();
  const openAiApiKey = String(environment.OPENAI_API_KEY || "").trim();
  const allowedNumberSha256 = String(
    environment.PERSONAL_CLONE_ALLOWED_NUMBER_SHA256 || ""
  ).trim().toLowerCase();

  if (
    !/^AC[a-f0-9]{32}$/i.test(accountSid) ||
    !authToken ||
    !openAiApiKey ||
    !SHA256_PATTERN.test(allowedNumberSha256)
  ) {
    throw new PersonalCloneCallError(
      "PERSONAL_CLONE_PROVIDER_NOT_CONFIGURED",
      "Die einmalige sichere Telefonanbieter-Verbindung ist noch nicht vollständig eingerichtet.",
      503
    );
  }

  return Object.freeze({
    accountSid,
    authToken,
    fromNumber: strictE164(
      environment.TWILIO_PHONE_NUMBER,
      "PERSONAL_CLONE_FROM_NUMBER_INVALID",
      "Die Absendernummer der Telefonbrücke"
    ),
    openAiApiKey,
    allowedNumberSha256,
    defaultCountryCode: cleanDefaultCountryCode(
      environment.PERSONAL_CLONE_DEFAULT_COUNTRY_CODE
    ),
    publicHost: configuredPublicHost(environment),
    openAiModel: "gpt-live-1",
    delegatedModel: "gpt-5.6-terra",
    voice: "marin"
  });
}

function publicConfigurationState(environment) {
  try {
    loadConfiguration(environment);
    return {
      enabled: true,
      configured: true,
      aiProvider: "openai",
      telephoneBridge: "twilio",
      outboundOnly: true,
      oneAllowedRecipient: true,
      numberStoredInSource: false
    };
  } catch (error) {
    return {
      enabled:
        String(environment.PERSONAL_CLONE_CALLS_ENABLED || "") === "true",
      configured: false,
      aiProvider: "openai",
      telephoneBridge: "twilio",
      outboundOnly: true,
      oneAllowedRecipient: true,
      numberStoredInSource: false,
      reason:
        error instanceof PersonalCloneCallError
          ? error.code
          : "PERSONAL_CLONE_PROVIDER_NOT_CONFIGURED"
    };
  }
}

function personalCloneOpening() {
  return (
    "Hallo Steffi, hier ist Human Holo, Pams persönlicher KI-Clone. " +
    "Pam hat mich gebeten, dich anzurufen. Ich bin eine KI; das Gespräch " +
    "wird technisch von OpenAI und dem Telefonanbieter verarbeitet, aber " +
    "von Human Holo weder aufgezeichnet noch als Erinnerung gespeichert. " +
    "Möchtest du mit mir sprechen?"
  );
}

function personalCloneVoiceInstructions() {
  return [
    "Du bist Human Holo in einem ausgehenden Telefongespräch mit Steffi.",
    "Du bist Pams persönlicher KI-Clone und sagst transparent, dass du eine KI bist.",
    "Behaupte niemals, Pam selbst oder ein Mensch zu sein.",
    "Sprich freundlich, natürlich und zunächst auf Deutsch. Halte einzelne Antworten kurz.",
    "Warte nach der Einleitung auf Steffis Zustimmung. Wenn sie nicht sprechen möchte, verabschiede dich sofort höflich und führe das Gespräch nicht fort.",
    "Das ist ein lockeres persönliches Gespräch im ausdrücklichen Auftrag von Pam.",
    "Gib keine privaten Erinnerungen, Zugangsdaten, Kontaktangaben oder sonstige vertrauliche Daten von Pam preis.",
    "Erfinde keine Aussagen, Wünsche, Zusagen oder Termine von Pam.",
    "Tätige keine Käufe, Buchungen, Zahlungen, Vertrags-, Medizin-, Rechts- oder Notfallentscheidungen.",
    "Bei akuter Gefahr nennst du 112 und erklärst, dass du selbst keinen Notruf aus diesem Gespräch heraus startest.",
    "Behaupte nie, das Gespräch werde aufgezeichnet oder dauerhaft gespeichert."
  ].join(" ");
}

function encodeBasicAuth(accountSid, authToken) {
  return Buffer.from(`${accountSid}:${authToken}`, "utf8").toString("base64");
}

function constantTimeStringEquals(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function expectedTwilioSignature(authToken, url) {
  return createHmac("sha1", authToken)
    .update(url, "utf8")
    .digest("base64");
}

function validBase64Audio(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_PROVIDER_MESSAGE_BYTES &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(value)
  );
}

function closeSocket(socket, code = 1000, reason = "") {
  if (!socket) return;
  if (
    socket.readyState === WebSocket.OPEN ||
    socket.readyState === WebSocket.CONNECTING
  ) {
    try {
      socket.close(code, reason);
    } catch {
      // The peer may already be closing.
    }
  }
}

export function createPersonalCloneCallService({
  environment = process.env,
  fetchImpl = globalThis.fetch,
  WebSocketImpl = WebSocket,
  now = () => Date.now(),
  randomToken = () => randomBytes(32).toString("base64url"),
  logger = console
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("Personal clone calls require fetch.");
  }

  const pendingBridges = new Map();
  const activeOwners = new Map();

  function cleanupExpired() {
    const current = now();
    for (const [token, session] of pendingBridges) {
      if (session.expiresAtMillis <= current) {
        pendingBridges.delete(token);
        if (activeOwners.get(session.ownerId) === session) {
          activeOwners.delete(session.ownerId);
        }
      }
    }
    for (const [ownerId, session] of activeOwners) {
      if (session.activeUntilMillis <= current) {
        activeOwners.delete(ownerId);
      }
    }
  }

  function assertAllowedDestination(targetNumber, configuration) {
    const normalized = normalizePersonalClonePhoneNumber(
      targetNumber,
      configuration.defaultCountryCode
    );
    const actualHash = sha256Hex(normalized);
    if (!constantTimeHexEquals(actualHash, configuration.allowedNumberSha256)) {
      throw new PersonalCloneCallError(
        "PERSONAL_CLONE_RECIPIENT_NOT_ALLOWED",
        "Nur der einmalig freigegebene Kontakt darf diesen Holo-Gesprächsanruf erhalten.",
        403
      );
    }
    return normalized;
  }

  async function startCall({
    ownerId,
    ownerCommand,
    targetNumber
  } = {}) {
    cleanupExpired();

    if (
      String(ownerId || "") !== PERSONAL_CLONE_OWNER_ID ||
      String(ownerCommand || "") !== PERSONAL_CLONE_CALL_COMMAND
    ) {
      throw new PersonalCloneCallError(
        "PERSONAL_CLONE_OWNER_COMMAND_REQUIRED",
        "Der Holo-Gesprächsanruf braucht Pams aktuellen eindeutigen Auftrag.",
        403
      );
    }

    if (activeOwners.has(PERSONAL_CLONE_OWNER_ID)) {
      throw new PersonalCloneCallError(
        "PERSONAL_CLONE_CALL_ALREADY_ACTIVE",
        "Human Holo führt bereits einen Telefonanruf.",
        409
      );
    }

    const configuration = loadConfiguration(environment);
    const normalizedTarget = assertAllowedDestination(
      targetNumber,
      configuration
    );
    const bridgeToken = randomToken();
    const callId = randomToken();
    if (
      !/^[A-Za-z0-9_-]{32,128}$/.test(bridgeToken) ||
      !/^[A-Za-z0-9_-]{32,128}$/.test(callId) ||
      bridgeToken === callId
    ) {
      throw new PersonalCloneCallError(
        "PERSONAL_CLONE_RANDOM_TOKEN_INVALID",
        "Der sichere Einmalzugang für die Audio-Brücke konnte nicht erzeugt werden.",
        500
      );
    }

    const session = {
      ownerId: PERSONAL_CLONE_OWNER_ID,
      callId,
      bridgeToken,
      callSid: "",
      claimed: false,
      configuration,
      expiresAtMillis: now() + PENDING_BRIDGE_TTL_MS,
      activeUntilMillis: now() + ACTIVE_CALL_TTL_MS
    };
    pendingBridges.set(bridgeToken, session);
    activeOwners.set(PERSONAL_CLONE_OWNER_ID, session);

    const streamUrl =
      `wss://${configuration.publicHost}${PERSONAL_CLONE_MEDIA_PATH}`;
    const twiml =
      `<Response><Connect><Stream url="${streamUrl}">` +
      `<Parameter name="bridgeToken" value="${bridgeToken}" />` +
      `</Stream></Connect></Response>`;
    const body = new URLSearchParams({
      To: normalizedTarget,
      From: configuration.fromNumber,
      Twiml: twiml
    });

    try {
      const response = await fetchImpl(
        `https://api.twilio.com/2010-04-01/Accounts/${configuration.accountSid}/Calls.json`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Basic ${encodeBasicAuth(configuration.accountSid, configuration.authToken)}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body,
          signal: AbortSignal.timeout(TWILIO_TIMEOUT_MS)
        }
      );

      let providerResult = {};
      try {
        providerResult = await response.json();
      } catch {
        providerResult = {};
      }
      if (
        !response.ok ||
        !TWILIO_CALL_SID_PATTERN.test(String(providerResult?.sid || ""))
      ) {
        throw new PersonalCloneCallError(
          "PERSONAL_CLONE_PROVIDER_REJECTED",
          "Der Telefonanbieter konnte den Holo-Anruf gerade nicht starten.",
          response.status >= 400 && response.status < 500 ? 502 : 503
        );
      }
      session.callSid = String(providerResult.sid);

      return {
        started: true,
        callId,
        recipientName: PERSONAL_CLONE_RECIPIENT_NAME,
        confirmationRequired: false,
        holoConductsConversation: true,
        transparentAiIntroduction: true,
        recordingEnabled: false,
        numberReturned: false
      };
    } catch (error) {
      pendingBridges.delete(bridgeToken);
      if (activeOwners.get(PERSONAL_CLONE_OWNER_ID) === session) {
        activeOwners.delete(PERSONAL_CLONE_OWNER_ID);
      }
      if (error instanceof PersonalCloneCallError) throw error;
      throw new PersonalCloneCallError(
        "PERSONAL_CLONE_PROVIDER_UNAVAILABLE",
        "Die Telefonbrücke ist gerade nicht erreichbar.",
        503
      );
    }
  }

  function claimBridge(token) {
    cleanupExpired();
    const cleanToken = String(token || "").trim();
    const session = pendingBridges.get(cleanToken);
    if (
      !session ||
      session.claimed ||
      session.expiresAtMillis <= now()
    ) {
      return null;
    }
    session.claimed = true;
    pendingBridges.delete(cleanToken);
    return session;
  }

  function releaseSession(session) {
    if (activeOwners.get(session?.ownerId) === session) {
      activeOwners.delete(session.ownerId);
    }
  }

  function validateProviderUpgrade(request) {
    let configuration;
    try {
      configuration = loadConfiguration(environment);
    } catch {
      return false;
    }

    const signature = String(
      request?.headers?.["x-twilio-signature"] || ""
    ).trim();
    if (!signature || signature.length > 128) {
      return false;
    }

    const endpoint =
      `${configuration.publicHost}${PERSONAL_CLONE_MEDIA_PATH}`;
    const candidates = [
      `https://${endpoint}`,
      `https://${endpoint}/`,
      `wss://${endpoint}`,
      `wss://${endpoint}/`
    ];
    return candidates.some((candidate) =>
      constantTimeStringEquals(
        signature,
        expectedTwilioSignature(configuration.authToken, candidate)
      )
    );
  }

  function handleMediaConnection(
    providerSocket,
    session,
    initialProviderEvent = null
  ) {
    const configuration = session.configuration;
    let streamSid = "";
    let sessionRequested = false;
    let sessionReady = false;
    let closed = false;
    let maximumDurationTimer = null;

    const openAiSocket = new WebSocketImpl(
      "wss://api.openai.com/v1/live/sessions",
      {
        headers: {
          Authorization: `Bearer ${configuration.openAiApiKey}`,
          "User-Agent": "human-holo/node 1.0"
        }
      }
    );

    const sendOpenAi = (event) => {
      if (openAiSocket.readyState === WebSocketImpl.OPEN) {
        openAiSocket.send(JSON.stringify(event));
      }
    };

    const closeBoth = (code = 1000, reason = "") => {
      if (closed) return;
      closed = true;
      sessionReady = false;
      if (maximumDurationTimer) {
        clearTimeout(maximumDurationTimer);
        maximumDurationTimer = null;
      }
      releaseSession(session);
      closeSocket(providerSocket, code, reason);
      closeSocket(openAiSocket, code, reason);
    };

    const startOpenAiSession = () => {
      if (
        sessionRequested ||
        !streamSid ||
        openAiSocket.readyState !== WebSocketImpl.OPEN
      ) {
        return;
      }
      sessionRequested = true;
      sendOpenAi({
        type: "session.start",
        session: {
          model: configuration.openAiModel,
          instructions: personalCloneVoiceInstructions(),
          audio: {
            format: { type: "audio/pcmu", rate: 8000 },
            output: { voice: configuration.voice }
          },
          delegation: {
            type: "responses",
            responses: {
              model: configuration.delegatedModel,
              instructions:
                "Führe ein kurzes, freundliches persönliches Gespräch. " +
                "Beachte strikt die Datenschutz-, Rollen- und Sicherheitsgrenzen der Sprachinstruktionen.",
              tools: []
            }
          }
        }
      });
    };

    openAiSocket.on("open", startOpenAiSession);
    openAiSocket.on("message", (raw) => {
      let event;
      try {
        event = JSON.parse(raw.toString("utf8"));
      } catch {
        closeBoth(1008, "invalid_openai_event");
        return;
      }

      if (event?.type === "session.started") {
        sessionReady = true;
        const opening = personalCloneOpening();
        sendOpenAi({
          type: "session.instructions.append",
          delegation_id: null,
          content:
            `Dein erster gesprochener Satz in diesem Anruf lautet wortgetreu: "${opening}"`
        });
        sendOpenAi({
          type: "session.commentary.append",
          delegation_id: null,
          content: opening
        });
        return;
      }

      if (
        event?.type === "session.output_audio.delta" &&
        streamSid &&
        providerSocket.readyState === WebSocket.OPEN &&
        validBase64Audio(event.delta)
      ) {
        providerSocket.send(JSON.stringify({
          event: "media",
          streamSid,
          media: { payload: event.delta }
        }));
        return;
      }

      if (event?.type === "error") {
        logger.warn("Holo-Gespräch: OpenAI-Audiositzung beendet.");
        closeBoth(1011, "openai_audio_error");
      }
    });
    openAiSocket.on("close", () => closeBoth());
    openAiSocket.on("error", () => {
      logger.warn("Holo-Gespräch: OpenAI-Audiobrücke nicht erreichbar.");
      closeBoth(1011, "openai_audio_unavailable");
    });

    const handleProviderEvent = (event) => {
      if (event?.event === "start") {
        const start = event.start || {};
        if (
          String(start.accountSid || "") !== configuration.accountSid ||
          (
            session.callSid &&
            String(start.callSid || "") !== session.callSid
          ) ||
          !/^MZ[a-f0-9]{32}$/i.test(String(start.streamSid || ""))
        ) {
          closeBoth(1008, "provider_identity_mismatch");
          return;
        }
        streamSid = String(start.streamSid);
        startOpenAiSession();
        return;
      }

      if (
        event?.event === "media" &&
        sessionReady &&
        openAiSocket.readyState === WebSocketImpl.OPEN &&
        validBase64Audio(event?.media?.payload)
      ) {
        sendOpenAi({
          type: "session.input_audio.append",
          audio: event.media.payload
        });
        return;
      }

      if (event?.event === "stop") {
        closeBoth();
      }
    };

    providerSocket.on("message", (raw) => {
      if (raw.length > MAX_PROVIDER_MESSAGE_BYTES) {
        closeBoth(1009, "provider_message_too_large");
        return;
      }

      let event;
      try {
        event = JSON.parse(raw.toString("utf8"));
      } catch {
        closeBoth(1008, "invalid_provider_event");
        return;
      }
      handleProviderEvent(event);
    });
    providerSocket.on("close", () => closeBoth());
    providerSocket.on("error", () => closeBoth(1011, "provider_audio_error"));

    maximumDurationTimer = setTimeout(
      () => closeBoth(1000, "maximum_call_duration"),
      ACTIVE_CALL_TTL_MS
    );
    maximumDurationTimer.unref?.();

    if (initialProviderEvent) {
      handleProviderEvent(initialProviderEvent);
    }
  }

  function handlePendingMediaConnection(providerSocket) {
    let connectedEventSeen = false;
    let settled = false;

    const handshakeTimer = setTimeout(() => {
      fail(1008, "provider_handshake_timeout");
    }, PROVIDER_HANDSHAKE_TIMEOUT_MS);
    handshakeTimer.unref?.();

    const cleanup = () => {
      clearTimeout(handshakeTimer);
      providerSocket.off?.("message", onMessage);
      providerSocket.off?.("close", onClose);
      providerSocket.off?.("error", onError);
    };
    const fail = (code, reason) => {
      if (settled) return;
      settled = true;
      cleanup();
      closeSocket(providerSocket, code, reason);
    };
    const onClose = () => fail(1000, "provider_closed_before_start");
    const onError = () => fail(1011, "provider_handshake_error");
    const onMessage = (raw) => {
      if (raw.length > MAX_PROVIDER_MESSAGE_BYTES) {
        fail(1009, "provider_message_too_large");
        return;
      }

      let event;
      try {
        event = JSON.parse(raw.toString("utf8"));
      } catch {
        fail(1008, "invalid_provider_event");
        return;
      }

      if (event?.event === "connected" && !connectedEventSeen) {
        connectedEventSeen = true;
        return;
      }
      if (event?.event !== "start") {
        fail(1008, "provider_start_required");
        return;
      }

      const token = String(
        event?.start?.customParameters?.bridgeToken || ""
      ).trim();
      const session = claimBridge(token);
      if (!session) {
        fail(1008, "provider_token_invalid");
        return;
      }

      settled = true;
      cleanup();
      handleMediaConnection(providerSocket, session, event);
    };

    providerSocket.on("message", onMessage);
    providerSocket.on("close", onClose);
    providerSocket.on("error", onError);
  }

  return Object.freeze({
    configurationState: () => publicConfigurationState(environment),
    startCall,
    claimBridge,
    validateProviderUpgrade,
    handlePendingMediaConnection,
    handleMediaConnection,
    releaseSession,
    _testing: Object.freeze({
      activeOwners,
      pendingBridges,
      loadConfiguration: () => loadConfiguration(environment),
      opening: personalCloneOpening,
      voiceInstructions: personalCloneVoiceInstructions
    })
  });
}

function rejectUpgrade(socket, statusCode = 401) {
  try {
    socket.write(
      `HTTP/1.1 ${statusCode} Unauthorized\r\n` +
      "Connection: close\r\n" +
      "Cache-Control: no-store\r\n" +
      "Content-Length: 0\r\n\r\n"
    );
  } finally {
    socket.destroy();
  }
}

export function attachPersonalCloneMediaBridge(
  httpServer,
  service
) {
  if (!httpServer || typeof httpServer.on !== "function") {
    throw new TypeError("Personal clone media bridge requires an HTTP server.");
  }
  if (!service || typeof service.claimBridge !== "function") {
    throw new TypeError("Personal clone media bridge requires its call service.");
  }

  const mediaServer = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false,
    maxPayload: MAX_PROVIDER_MESSAGE_BYTES
  });

  httpServer.on("upgrade", (request, socket, head) => {
    let url;
    try {
      url = new URL(request.url || "", "http://localhost");
    } catch {
      rejectUpgrade(socket, 400);
      return;
    }
    if (url.pathname !== PERSONAL_CLONE_MEDIA_PATH) {
      rejectUpgrade(socket, 404);
      return;
    }

    if (url.search || !service.validateProviderUpgrade?.(request)) {
      rejectUpgrade(socket, 401);
      return;
    }

    mediaServer.handleUpgrade(request, socket, head, (providerSocket) => {
      service.handlePendingMediaConnection(providerSocket);
    });
  });

  return mediaServer;
}
