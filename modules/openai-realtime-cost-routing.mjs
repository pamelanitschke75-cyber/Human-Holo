const OPENAI_REALTIME_CLIENT_SECRETS_URL =
  "https://api.openai.com/v1/realtime/client_secrets";

export const HUMAN_HOLO_REALTIME_STANDARD_MODEL =
  "gpt-realtime-2.1";

export const HUMAN_HOLO_REALTIME_COST_MODEL =
  "gpt-realtime-2.1-mini";

export function humanHoloRealtimeModel(environment = process.env) {
  const configured = String(
    environment.HUMAN_HOLO_REALTIME_MODEL || ""
  ).trim();

  return configured || HUMAN_HOLO_REALTIME_COST_MODEL;
}

function requestUrl(input) {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return String(input?.url || "");
}

function replaceRealtimeModel(value, targetModel) {
  if (!value || typeof value !== "object") {
    return false;
  }

  let changed = false;

  for (const [key, child] of Object.entries(value)) {
    if (
      key === "model" &&
      child === HUMAN_HOLO_REALTIME_STANDARD_MODEL
    ) {
      value[key] = targetModel;
      changed = true;
      continue;
    }

    if (child && typeof child === "object") {
      changed = replaceRealtimeModel(child, targetModel) || changed;
    }
  }

  return changed;
}

export function routeRealtimeClientSecretRequest(
  input,
  init = {},
  environment = process.env
) {
  if (
    requestUrl(input) !== OPENAI_REALTIME_CLIENT_SECRETS_URL ||
    String(init?.method || "GET").toUpperCase() !== "POST" ||
    typeof init?.body !== "string"
  ) {
    return {
      init,
      routed: false,
      model: null
    };
  }

  let payload;
  try {
    payload = JSON.parse(init.body);
  } catch {
    return {
      init,
      routed: false,
      model: null
    };
  }

  const model = humanHoloRealtimeModel(environment);
  const routed = replaceRealtimeModel(payload, model);

  if (!routed) {
    return {
      init,
      routed: false,
      model: null
    };
  }

  return {
    init: {
      ...init,
      body: JSON.stringify(payload)
    },
    routed: true,
    model
  };
}

export function installHumanHoloRealtimeCostRouting({
  environment = process.env,
  fetchImplementation = globalThis.fetch
} = {}) {
  if (typeof fetchImplementation !== "function") {
    throw new TypeError("Global fetch is required for OpenAI realtime routing.");
  }

  if (globalThis.__humanHoloRealtimeCostRoutingInstalled) {
    return;
  }

  globalThis.__humanHoloRealtimeCostRoutingInstalled = true;

  globalThis.fetch = async function humanHoloCostAwareFetch(input, init) {
    const routed = routeRealtimeClientSecretRequest(
      input,
      init,
      environment
    );

    const response = await fetchImplementation(input, routed.init);

    if (
      !routed.routed ||
      routed.model === HUMAN_HOLO_REALTIME_STANDARD_MODEL ||
      ![400, 404, 422].includes(response.status)
    ) {
      return response;
    }

    // Falls das günstigere Modell eine konkrete Realtime-Funktion künftig
    // nicht unterstützt, bleibt Human Holo funktionsfähig: genau diese eine
    // Session wird mit dem bisherigen Standardmodell erneut angefordert.
    const fallback = routeRealtimeClientSecretRequest(
      input,
      init,
      {
        ...environment,
        HUMAN_HOLO_REALTIME_MODEL:
          HUMAN_HOLO_REALTIME_STANDARD_MODEL
      }
    );

    return fetchImplementation(input, fallback.init);
  };
}
