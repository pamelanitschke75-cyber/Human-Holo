(function installHumanHoloBackendConfiguration(globalObject) {
  "use strict";

  // Wird erst nach Bereitstellung des eigenständigen Human-Holo-Servers gesetzt.
  // Bis dahin zeigt die reservierte .invalid-Adresse absichtlich nirgendwohin.
  const PROVISIONED_BACKEND_URL = "";
  const UNPROVISIONED_BACKEND_URL =
    "https://human-holo-backend.invalid";
  const PAM_HOLO_PROTECTED_BACKEND_ORIGIN =
    "https://sol-holo.onrender.com";

  function normalizedBackendUrl(candidate) {
    const value = String(candidate || "").trim();
    if (!value) return "";

    try {
      const url = new URL(value);
      const localDevelopment =
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1";
      if (url.protocol !== "https:" && !localDevelopment) return "";
      if (url.origin === PAM_HOLO_PROTECTED_BACKEND_ORIGIN) return "";
      if (url.username || url.password || url.search || url.hash) return "";
      return url.origin + url.pathname.replace(/\/+$/, "");
    } catch {
      return "";
    }
  }

  const provisionedBackendUrl = normalizedBackendUrl(
    PROVISIONED_BACKEND_URL
  );
  const provisioned = Boolean(provisionedBackendUrl);
  const baseUrl = provisioned
    ? provisionedBackendUrl
    : UNPROVISIONED_BACKEND_URL;

  const configuration = Object.freeze({
    product: "human-holo",
    provisioned,
    baseUrl,
    protectedPamHoloOrigin: PAM_HOLO_PROTECTED_BACKEND_ORIGIN,
    status: provisioned
      ? "separate-backend-configured"
      : "separate-backend-not-provisioned",
    assertProvisioned() {
      if (!provisioned) {
        const error = new Error(
          "Der getrennte Human-Holo-Server ist noch nicht eingerichtet."
        );
        error.code = "HUMAN_HOLO_BACKEND_NOT_PROVISIONED";
        throw error;
      }
      return baseUrl;
    }
  });

  globalObject.HumanHoloBackend = configuration;
})(window);
