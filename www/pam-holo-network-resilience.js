(function installPamHoloNetworkResilience(global) {
  "use strict";

  const PAM_HOLO_EDGE_URL =
    "https://pam-holo-edge-guard.pamela-nitschke75.workers.dev";
  const nativeFetch = global.fetch.bind(global);

  function selectBackendUrl(locationObject = global.location) {
    const protocol = String(locationObject?.protocol || "");
    const hostname = String(locationObject?.hostname || "");
    const origin = String(locationObject?.origin || "");

    if (
      protocol === "https:" &&
      origin &&
      !hostname.endsWith(".onrender.com")
    ) {
      return origin;
    }

    return PAM_HOLO_EDGE_URL;
  }

  const backendUrl = selectBackendUrl();

  function setState(state) {
    const normalized =
      state === "offline"
        ? "offline"
        : state === "degraded"
          ? "degraded"
          : "online";
    const label =
      normalized === "offline"
        ? "Offline"
        : normalized === "degraded"
          ? "Verbindung gestört"
          : "Online";
    const container = global.document?.getElementById("onlineState");
    const labelElement = global.document?.getElementById("onlineLabel");

    container?.classList.toggle("offline", normalized === "offline");
    container?.classList.toggle("degraded", normalized === "degraded");
    if (labelElement) labelElement.textContent = label;

    global.document
      ?.querySelectorAll(".statusPill")
      .forEach((element) => {
        element.textContent = label;
        element.classList.toggle("offline", normalized === "offline");
        element.classList.toggle("degraded", normalized === "degraded");
      });
  }

  function delay(milliseconds) {
    return new Promise((resolve) => {
      global.setTimeout(resolve, milliseconds);
    });
  }

  function networkError(message, code, deliveryUncertain, cause) {
    const error = new Error(message, cause ? { cause } : undefined);
    error.code = code;
    error.deliveryUncertain = deliveryUncertain;
    return error;
  }

  async function request(
    input,
    init = {},
    {
      timeoutMilliseconds = 45_000,
      safeRetries = 2
    } = {}
  ) {
    const method = String(init.method || "GET").toUpperCase();
    const safeToRetry = method === "GET" || method === "HEAD";
    const attempts = safeToRetry
      ? Math.max(1, Math.min(3, Number(safeRetries) + 1))
      : 1;
    let lastError = null;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (global.navigator?.onLine === false) {
        setState("offline");
        throw networkError(
          "Pam Holo ist offline. Der Entwurf bleibt erhalten.",
          "PAM_HOLO_OFFLINE",
          false
        );
      }

      const controller = new AbortController();
      const abortFromCaller = () => controller.abort(init.signal?.reason);
      init.signal?.addEventListener("abort", abortFromCaller, { once: true });
      const timeoutId = global.setTimeout(
        () => controller.abort("pam-holo-network-timeout"),
        Math.max(1_000, Number(timeoutMilliseconds) || 45_000)
      );

      try {
        const response = await nativeFetch(input, {
          ...init,
          signal: controller.signal
        });

        if (
          safeToRetry &&
          response.status >= 500 &&
          attempt + 1 < attempts
        ) {
          await delay(250 * (2 ** attempt));
          continue;
        }

        setState(
          response.status >= 500
            ? "degraded"
            : "online"
        );
        return response;
      } catch (cause) {
        const timedOut =
          controller.signal.aborted &&
          !init.signal?.aborted;
        lastError = networkError(
          timedOut
            ? "Die Verbindung hat zu lange gedauert. Der Entwurf bleibt erhalten."
            : "Die Verbindung wurde unterbrochen. Der Entwurf bleibt erhalten.",
          timedOut
            ? "PAM_HOLO_NETWORK_TIMEOUT"
            : "PAM_HOLO_NETWORK_INTERRUPTED",
          !safeToRetry,
          cause
        );
        setState(
          global.navigator?.onLine === false
            ? "offline"
            : "degraded"
        );

        if (!safeToRetry || attempt + 1 >= attempts) {
          throw lastError;
        }

        await delay(250 * (2 ** attempt));
      } finally {
        global.clearTimeout(timeoutId);
        init.signal?.removeEventListener("abort", abortFromCaller);
      }
    }

    throw lastError || networkError(
      "Pam Holo ist vorübergehend nicht erreichbar.",
      "PAM_HOLO_NETWORK_UNAVAILABLE",
      !safeToRetry
    );
  }

  function apiEndpoint(pathValue) {
    const path = String(pathValue || "").trim();
    if (
      !path.startsWith("/") ||
      path.startsWith("//") ||
      path.includes("\\") ||
      path.includes("#") ||
      /%(?:00|2e|2f|5c|25)/iu.test(path) ||
      path.split("?")[0].split("/").includes("..")
    ) {
      throw networkError(
        "Der geschützte Pam-Holo-Endpunkt ist ungültig.",
        "PAM_HOLO_API_PATH_INVALID",
        false
      );
    }
    const endpoint = new URL(path, `${backendUrl}/`);
    if (endpoint.origin !== new URL(backendUrl).origin) {
      throw networkError(
        "Der geschützte Pam-Holo-Endpunkt ist ungültig.",
        "PAM_HOLO_API_ORIGIN_INVALID",
        false
      );
    }
    return endpoint.href;
  }

  function apiRequest(path, init = {}, options = {}) {
    return request(apiEndpoint(path), init, options);
  }

  async function checkHealth() {
    if (global.navigator?.onLine === false) {
      setState("offline");
      return false;
    }

    try {
      const response = await request(
        `${backendUrl}/health/live`,
        { method: "GET", cache: "no-store" },
        { timeoutMilliseconds: 8_000, safeRetries: 1 }
      );
      setState(response.ok ? "online" : "degraded");
      return response.ok;
    } catch {
      setState(
        global.navigator?.onLine === false
          ? "offline"
          : "degraded"
      );
      return false;
    }
  }

  function startMonitoring() {
    global.addEventListener("offline", () => setState("offline"));
    global.addEventListener("online", () => {
      setState("degraded");
      void checkHealth();
    });
    global.addEventListener("load", () => {
      setState(
        global.navigator?.onLine === false
          ? "offline"
          : "degraded"
      );
      void checkHealth();
    });
  }

  global.PamHoloNetwork = Object.freeze({
    apiEndpoint,
    apiRequest,
    backendUrl,
    checkHealth,
    edgeUrl: PAM_HOLO_EDGE_URL,
    request,
    selectBackendUrl,
    setState,
    startMonitoring
  });
})(window);
