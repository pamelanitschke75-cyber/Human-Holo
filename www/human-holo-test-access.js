(function installHumanHoloInviteOnlyTestAccess(globalObject) {
  "use strict";

  const SESSION_KEY = "human-holo:invite-only-test-session:v1";
  const backend = globalObject.HumanHoloBackend;
  const nativeFetch = globalObject.fetch.bind(globalObject);

  function readSession() {
    try {
      const session = JSON.parse(
        globalObject.sessionStorage.getItem(SESSION_KEY) || "null"
      );
      const expiresAtMillis = Date.parse(String(session?.expiresAt || ""));
      const identity = session?.identity;
      if (
        session?.testOnly !== true ||
        typeof session?.token !== "string" ||
        session.token.length < 80 ||
        session.token.length > 4096 ||
        !Number.isFinite(expiresAtMillis) ||
        expiresAtMillis <= Date.now() ||
        identity?.testOnly !== true ||
        !String(identity?.ownerId || "").startsWith("human-test-") ||
        !String(identity?.speakerId || "").startsWith("tester-") ||
        !String(identity?.displayName || "").trim()
      ) {
        globalObject.sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return Object.freeze({
        token: session.token,
        expiresAt: new Date(expiresAtMillis).toISOString(),
        identity: Object.freeze({ ...identity }),
        testOnly: true
      });
    } catch {
      try {
        globalObject.sessionStorage.removeItem(SESSION_KEY);
      } catch {}
      return null;
    }
  }

  let activeSession = readSession();

  function isHumanHoloBackendRequest(input) {
    try {
      const candidate = new URL(
        typeof input === "string" || input instanceof URL
          ? input
          : input?.url,
        globalObject.location.href
      );
      const base = new URL(backend?.baseUrl || "https://invalid.invalid");
      const basePath = base.pathname.replace(/\/+$/u, "");
      return (
        candidate.origin === base.origin &&
        (
          !basePath ||
          candidate.pathname === basePath ||
          candidate.pathname.startsWith(`${basePath}/`)
        )
      );
    } catch {
      return false;
    }
  }

  globalObject.fetch = function humanHoloTestBoundFetch(input, init = {}) {
    if (!activeSession || !isHumanHoloBackendRequest(input)) {
      return nativeFetch(input, init);
    }

    const inputHeaders =
      typeof Request !== "undefined" && input instanceof Request
        ? input.headers
        : undefined;
    const headers = new Headers(init.headers || inputHeaders || undefined);
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${activeSession.token}`);
    }
    return nativeFetch(input, { ...init, headers });
  };

  function clearSession() {
    try {
      globalObject.sessionStorage.removeItem(SESSION_KEY);
    } catch {}
    activeSession = null;
  }

  async function activate({ testerId, accessCode }) {
    const baseUrl = backend?.assertProvisioned?.();
    const response = await nativeFetch(`${baseUrl}/test-access/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testerId, accessCode }),
      cache: "no-store",
      credentials: "omit"
    });
    const data = await response.json().catch(() => ({}));
    if (
      !response.ok ||
      data?.accessGranted !== true ||
      data?.testOnly !== true ||
      data?.identity?.testOnly !== true
    ) {
      const error = new Error(
        response.status === 429
          ? "Zu viele Fehlversuche. Bitte 15 Minuten warten."
          : "Einladungs-ID oder Zugangscode stimmen nicht."
      );
      error.code = String(data?.error || "TEST_ACCESS_DENIED");
      throw error;
    }

    const candidate = {
      token: data.token,
      expiresAt: data.expiresAt,
      identity: data.identity,
      testOnly: true
    };
    globalObject.sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify(candidate)
    );
    activeSession = readSession();
    if (!activeSession) {
      throw new Error("Die Testsitzung konnte nicht sicher übernommen werden.");
    }
    return activeSession;
  }

  function installStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #humanHoloTestGate{position:fixed;z-index:250000;inset:0;display:grid;
        place-items:center;padding:22px;background:rgba(2,1,8,.96);color:#fff;
        font-family:Arial,sans-serif}
      #humanHoloTestGate[hidden]{display:none}
      .humanHoloTestCard{width:min(100%,440px);padding:24px;border-radius:26px;
        border:1px solid rgba(101,224,255,.68);background:linear-gradient(145deg,
        rgba(70,34,144,.96),rgba(8,43,78,.96));box-shadow:0 20px 70px #000}
      .humanHoloTestCard h1{margin:6px 0 10px;font-size:27px}
      .humanHoloTestCard p{line-height:1.45;color:#e6e6f5}
      .humanHoloTestCard label{display:grid;gap:7px;margin:15px 0;font-weight:700}
      .humanHoloTestCard input{min-height:50px;padding:11px 13px;border-radius:14px;
        border:1px solid rgba(255,255,255,.45);background:rgba(4,3,15,.68);color:#fff}
      .humanHoloTestCard button{width:100%;min-height:52px;border:0;border-radius:15px;
        background:linear-gradient(135deg,#a84cff,#28bfd2);color:#fff;font-weight:800}
      .humanHoloTestCard button:disabled{opacity:.5}
      #humanHoloTestGateStatus{min-height:24px;color:#ffe18a}
      #humanHoloTestBadge{position:fixed;z-index:9000;left:10px;bottom:10px;
        display:flex;align-items:center;gap:8px;max-width:calc(100vw - 20px);padding:7px 10px;
        border:1px solid rgba(101,224,255,.55);border-radius:14px;background:rgba(4,3,15,.9);
        color:#fff;font:700 12px/1.25 Arial,sans-serif;box-shadow:0 7px 25px #0008}
      #humanHoloTestBadge button{border:0;border-radius:9px;padding:5px 8px;
        background:#6337a9;color:#fff;font:inherit}
    `;
    document.head.append(style);
  }

  function renderActiveBadge() {
    if (!activeSession || document.getElementById("humanHoloTestBadge")) return;
    document.documentElement.classList.remove("solholo-booting");
    globalObject.dispatchEvent(new CustomEvent("human-holo-app-unlocked", {
      detail: {
        ownerId: activeSession.identity.ownerId,
        testOnly: true
      }
    }));
    const badge = document.createElement("aside");
    badge.id = "humanHoloTestBadge";
    badge.setAttribute("role", "status");
    const label = document.createElement("span");
    label.textContent = `TEST · ${activeSession.identity.displayName} · kein Marktstart`;
    const logout = document.createElement("button");
    logout.type = "button";
    logout.textContent = "Test beenden";
    logout.addEventListener("click", () => {
      clearSession();
      globalObject.location.reload();
    });
    badge.append(label, logout);
    document.body.append(badge);
  }

  function renderAccessGate() {
    if (activeSession) {
      renderActiveBadge();
      return;
    }
    if (document.getElementById("humanHoloTestGate")) return;

    const gate = document.createElement("section");
    gate.id = "humanHoloTestGate";
    gate.setAttribute("aria-labelledby", "humanHoloTestGateTitle");
    gate.innerHTML = `
      <form class="humanHoloTestCard" autocomplete="off">
        <p><strong>HUMAN HOLO · LEGAL REVIEW</strong></p>
        <h1 id="humanHoloTestGateTitle">Eingeladener Testzugang</h1>
        <p>Nur für ausdrücklich eingeladene Tester. Jede Person erhält eine eigene
          Testidentität und einen getrennten Gedächtnisbereich. Kein Zugriff auf Pam‑Holo.</p>
        <label>Einladungs-ID
          <input name="testerId" required maxlength="40" autocapitalize="none"
            autocomplete="username" spellcheck="false">
        </label>
        <label>Zugangscode
          <input name="accessCode" required minlength="12" maxlength="200" type="password"
            autocomplete="current-password">
        </label>
        <button type="submit">Human Holo testen</button>
        <p id="humanHoloTestGateStatus" role="status" aria-live="polite"></p>
      </form>
    `;
    document.body.append(gate);

    const form = gate.querySelector("form");
    const button = gate.querySelector("button");
    const status = gate.querySelector("#humanHoloTestGateStatus");
    if (!backend?.provisioned) {
      button.disabled = true;
      status.textContent = "Der getrennte Human-Holo-Testserver ist noch nicht eingerichtet.";
      return;
    }

    form.addEventListener("submit", async event => {
      event.preventDefault();
      button.disabled = true;
      status.textContent = "Einladung wird sicher geprüft …";
      const formData = new FormData(form);
      try {
        await activate({
          testerId: String(formData.get("testerId") || ""),
          accessCode: String(formData.get("accessCode") || "")
        });
        form.reset();
        globalObject.location.reload();
      } catch (error) {
        form.elements.accessCode.value = "";
        status.textContent = error?.message || "Der Testzugang wurde abgelehnt.";
        button.disabled = false;
      }
    });
  }

  globalObject.HumanHoloTestAccess = Object.freeze({
    mode: "invite-only-test",
    active: () => Boolean(activeSession),
    identity: () => activeSession?.identity || null,
    headers(additional = {}) {
      return activeSession
        ? { ...additional, Authorization: `Bearer ${activeSession.token}` }
        : { ...additional };
    },
    clear: clearSession
  });

  // Im eingeladenen Web-Test ersetzt die signierte Testsitzung die
  // ausschließlich für Pams Originalgerät gebaute native Gerätebindung.
  // Der Server prüft weiterhin jeden einzelnen Request selbst.
  if (!globalObject.SolHoloTrustedSession) {
    globalObject.SolHoloTrustedSession = Object.freeze({
      async ensure() {
        return activeSession
          ? {
              trusted: true,
              testOnly: true,
              ownerId: activeSession.identity.ownerId,
              expiresAt: activeSession.expiresAt
            }
          : { trusted: false, testOnly: true };
      },
      headers() {
        return {};
      },
      clear: clearSession
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    installStyles();
    renderAccessGate();
  }, { once: true });
})(window);
