import OpenAI from "openai";
import { pathToFileURL } from "node:url";

export const HUMAN_HOLO_READ_ONLY_URL =
  "https://pam-holo-edge-guard.pamela-nitschke75.workers.dev/security/guard-status";

const MAX_STATUS_BYTES = 8_192;
const FETCH_TIMEOUT_MS = 15_000;
const EXPECTED_EDGE_GUARD = "staged-v2";

function assertPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Die Holo-Statusantwort ist kein JSON-Objekt.");
  }
}

function assertString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Ungültiges Holo-Statusfeld: ${field}.`);
  }
  return value.trim();
}

export function sanitizeHoloGuardStatus(value) {
  assertPlainObject(value);

  if (value.protected !== true) {
    throw new Error("Pam-Holo meldet keinen aktiven Schutz.");
  }
  if (value.serviceBoundary !== "separate-from-human-holo") {
    throw new Error("Die Trennung zwischen Pam-Holo und Human Holo ist nicht bestätigt.");
  }
  if (value.applicationGuard !== "active-v1") {
    throw new Error("Der Pam-Holo-Anwendungsschutz ist nicht aktiv.");
  }
  if (value.wildcardCors !== false) {
    throw new Error("Wildcard-CORS darf für die Read-only-Bridge nicht aktiv sein.");
  }
  if (value.rateLimit !== true) {
    throw new Error("Das Rate-Limit ist nicht bestätigt.");
  }
  if (value.privateProjectFilesPublic !== false) {
    throw new Error("Private Projektdateien dürfen nicht öffentlich sein.");
  }
  if (!Array.isArray(value.scope) || value.scope.length !== 1) {
    throw new Error("Der Pam-Holo-Schutzbereich ist nicht eindeutig.");
  }

  const scope = value.scope.map((entry) => assertString(entry, "scope"));
  if (scope[0] !== "Pam’s Holo") {
    throw new Error("Der erwartete Pam-Holo-Schutzbereich fehlt.");
  }

  return Object.freeze({
    protected: true,
    scope: Object.freeze(scope),
    serviceBoundary: "separate-from-human-holo",
    applicationGuard: "active-v1",
    wildcardCors: false,
    rateLimit: true,
    privateProjectFilesPublic: false,
    renderOriginGuard: assertString(
      value.renderOriginGuard,
      "renderOriginGuard"
    ),
    cloudflareEdgeGuard: assertString(
      value.cloudflareEdgeGuard,
      "cloudflareEdgeGuard"
    )
  });
}

export async function readHoloGuardStatus(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== "function") {
    throw new Error("Für die Read-only-Bridge fehlt eine Fetch-Implementierung.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetchImpl(HUMAN_HOLO_READ_ONLY_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache"
      },
      redirect: "error",
      signal: controller.signal
    });

    if (!response?.ok || response.status !== 200) {
      throw new Error(
        `Holo-Read-only-Status nicht erreichbar: HTTP ${response?.status ?? "unbekannt"}.`
      );
    }
    if (response.headers?.get?.("x-pam-holo-edge-guard") !== EXPECTED_EDGE_GUARD) {
      throw new Error("Der bestätigte Cloudflare-Türsteher fehlt.");
    }
    if (response.headers?.get?.("x-human-holo-guard") !== "active-v1") {
      throw new Error("Der bestätigte Pam-Holo-Anwendungsschutz fehlt.");
    }

    const declaredLength = Number(response.headers?.get?.("content-length") || 0);
    if (declaredLength > MAX_STATUS_BYTES) {
      throw new Error("Die Holo-Statusantwort ist unerwartet groß.");
    }

    const body = await response.text();
    if (Buffer.byteLength(body, "utf8") > MAX_STATUS_BYTES) {
      throw new Error("Die Holo-Statusantwort ist unerwartet groß.");
    }

    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      throw new Error("Die Holo-Statusantwort enthält kein gültiges JSON.");
    }

    return sanitizeHoloGuardStatus(parsed);
  } finally {
    clearTimeout(timeout);
  }
}

async function deleteProbeSession(client, sessionId) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await client.beta.agents.sessions.delete(sessionId);
      return true;
    } catch (error) {
      if (error?.status !== 409 || attempt === 4) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
  return false;
}

export async function runReadOnlyBridge({
  OpenAIClient = OpenAI,
  fetchImpl = globalThis.fetch
} = {}) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  const model = String(process.env.HUMAN_HOLO_AGENT_MODEL || "").trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY fehlt.");
  }
  if (!model) {
    throw new Error("HUMAN_HOLO_AGENT_MODEL fehlt.");
  }

  const safeStatus = await readHoloGuardStatus(fetchImpl);
  const client = new OpenAIClient({ apiKey });
  let sessionId = null;
  let completed = false;
  let finalText = "";

  try {
    const events = await client.beta.agents.sessions.create({
      environment: { type: "none" },
      agent: {
        model,
        instructions: [
          "Du prüfst ausschließlich das mitgelieferte, bereits gefilterte Human-Holo-Read-only-Statusobjekt.",
          "Du hast keine Werkzeuge, keinen Netzwerkzugriff und darfst keine externen Aktionen ausführen.",
          "Wenn protected=true, serviceBoundary=separate-from-human-holo und applicationGuard=active-v1 sind, antworte ausschließlich mit HUMAN_HOLO_READ_ONLY_OK.",
          "Andernfalls antworte ausschließlich mit HUMAN_HOLO_READ_ONLY_REJECTED."
        ].join(" ")
      },
      input: JSON.stringify({
        purpose: "human-holo-read-only-bridge-probe",
        source: "fixed-get-security-guard-status",
        status: safeStatus
      }),
      stream: true
    });

    try {
      for await (const event of events) {
        sessionId ||= event?.session?.id || event?.session_id || null;

        if (event?.type === "agent.session.requires_action") {
          throw new Error("Die Read-only-Bridge darf keine Aktion anfordern.");
        }
        if (event?.type === "agent.session.turn.output_text.done") {
          finalText += String(event.text || "");
        }
        if (
          event?.type === "error" ||
          event?.type === "agent.session.failed" ||
          event?.type === "agent.session.environment.failed"
        ) {
          throw new Error(`OpenAI-Agentenfehler: ${event?.type}.`);
        }
        if (
          (event?.type === "agent.session.turn.failed" ||
            event?.type === "agent.session.turn.cancelled") &&
          event?.turn?.subagent_id === null
        ) {
          throw new Error(`OpenAI-Agententurn nicht abgeschlossen: ${event.type}.`);
        }
        if (
          event?.type === "agent.session.turn.completed" &&
          event?.turn?.subagent_id === null
        ) {
          completed = true;
          break;
        }
      }
    } finally {
      events.controller.abort();
    }

    if (!sessionId) {
      throw new Error("Die OpenAI-Agenten-Session hat keine ID geliefert.");
    }
    if (!completed) {
      throw new Error("Der OpenAI-Agententurn wurde nicht abgeschlossen.");
    }
    if (finalText.trim() !== "HUMAN_HOLO_READ_ONLY_OK") {
      throw new Error("Der OpenAI-Agent hat den gefilterten Read-only-Status nicht bestätigt.");
    }

    return {
      ok: true,
      source_method: "GET",
      source_path: "/security/guard-status",
      fields_forwarded: Object.keys(safeStatus),
      openai_environment: "none",
      agent_network_access: false,
      write_routes_available: false,
      personal_data_forwarded: false,
      agent_confirmed: true
    };
  } finally {
    if (sessionId) {
      await deleteProbeSession(client, sessionId);
    }
  }
}

function isMainModule() {
  return Boolean(process.argv[1]) &&
    import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  console.log(JSON.stringify(await runReadOnlyBridge(), null, 2));
}
