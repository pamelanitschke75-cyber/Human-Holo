const NOTICE_VERSION = "2026-09-14-legal-review-1";

let activePrompt = null;
let voiceEnvironmentConfirmed = false;

function storageKey() {
  const ownerId = String(
    window.SolHoloIdentity?.selected?.()?.ownerId || ""
  ).trim();
  return ownerId.startsWith("human-test-")
    ? `human-holo:${ownerId}:legal-notice:${NOTICE_VERSION}`
    : "";
}

function readStoredDecision() {
  try {
    const key = storageKey();
    if (!key) return null;
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    return parsed?.version === NOTICE_VERSION && parsed?.accepted === true
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function storeDecision() {
  const key = storageKey();
  if (!key) {
    throw new Error("Die aktive Testidentität ist nicht verfügbar.");
  }
  const record = {
    version: NOTICE_VERSION,
    accepted: true,
    acceptedAt: new Date().toISOString(),
    notices: [
      "ai-interaction",
      "adult-use",
      "core-processing",
      "no-medical-or-emergency-reliance"
    ]
  };
  localStorage.setItem(key, JSON.stringify(record));
  return record;
}

function appendStatusBanner() {
  if (document.getElementById("humanHoloLegalStatus")) return;
  const app = document.getElementById("app");
  if (!app) return;

  const banner = document.createElement("aside");
  banner.id = "humanHoloLegalStatus";
  banner.setAttribute("role", "status");
  banner.setAttribute("aria-label", "KI- und Freigabestatus");
  const backendStatus = window.HumanHoloBackend?.provisioned
    ? "eigener Server verbunden"
    : "eigener Server noch nicht eingerichtet";
  banner.innerHTML = `
    <strong>KI-gestützte Software</strong>
    <span>Legal-Review-Profil · keine Marktfreigabe · ${backendStatus}</span>
    <a href="./datenschutz.html">Datenschutz</a>
  `;
  Object.assign(banner.style, {
    position: "relative",
    zIndex: "80",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "6px 12px",
    padding: "9px 12px",
    borderBottom: "1px solid rgba(255,255,255,.18)",
    background: "#171126",
    color: "#fff",
    fontSize: "12px",
    lineHeight: "1.35",
    textAlign: "center"
  });
  banner.querySelector("span").style.color = "#d6cfea";
  banner.querySelector("a").style.color = "#84e7ff";
  app.prepend(banner);
}

function promptForAcknowledgements({
  title,
  intro,
  acknowledgements,
  acceptLabel = "Bestätigen und fortfahren"
}) {
  if (activePrompt) return activePrompt;

  activePrompt = new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "humanHoloLegalTitle");
    Object.assign(overlay.style, {
      position: "fixed",
      zIndex: "100000",
      inset: "0",
      display: "grid",
      placeItems: "center",
      padding: "18px",
      overflow: "auto",
      background: "rgba(2,1,6,.94)"
    });

    const panel = document.createElement("section");
    Object.assign(panel.style, {
      width: "min(100%, 620px)",
      maxHeight: "calc(100vh - 36px)",
      overflow: "auto",
      padding: "22px",
      border: "1px solid rgba(132,231,255,.5)",
      borderRadius: "20px",
      background: "#130d20",
      color: "#fff",
      boxShadow: "0 22px 70px rgba(0,0,0,.6)"
    });

    const heading = document.createElement("h2");
    heading.id = "humanHoloLegalTitle";
    heading.textContent = title;
    heading.style.margin = "0 0 10px";

    const lead = document.createElement("p");
    lead.textContent = intro;
    lead.style.lineHeight = "1.5";

    const form = document.createElement("form");
    const checks = acknowledgements.map((labelText, index) => {
      const label = document.createElement("label");
      Object.assign(label.style, {
        display: "grid",
        gridTemplateColumns: "24px 1fr",
        gap: "10px",
        margin: "14px 0",
        lineHeight: "1.45"
      });
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `humanHoloLegalCheck${index}`;
      checkbox.style.width = "20px";
      checkbox.style.height = "20px";
      const text = document.createElement("span");
      text.textContent = labelText;
      label.append(checkbox, text);
      form.append(label);
      return checkbox;
    });

    const links = document.createElement("p");
    links.innerHTML =
      '<a href="./datenschutz.html">Datenschutzhinweise</a> · ' +
      '<a href="./datenloeschung.html">Datenexport, Widerruf und Löschung</a>';
    links.querySelectorAll("a").forEach((link) => {
      link.style.color = "#84e7ff";
      link.target = "_blank";
      link.rel = "noopener";
    });

    const actions = document.createElement("div");
    Object.assign(actions.style, {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginTop: "18px"
    });
    const accept = document.createElement("button");
    accept.type = "submit";
    accept.disabled = true;
    accept.textContent = acceptLabel;
    Object.assign(accept.style, {
      flex: "1 1 240px",
      minHeight: "48px",
      border: "0",
      borderRadius: "14px",
      background: "linear-gradient(135deg,#7247d8,#1684ad)",
      color: "#fff",
      fontWeight: "800"
    });
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = "Nicht zustimmen";
    Object.assign(cancel.style, {
      minHeight: "48px",
      padding: "0 18px",
      border: "1px solid #716982",
      borderRadius: "14px",
      background: "transparent",
      color: "#fff"
    });
    actions.append(accept, cancel);
    form.append(links, actions);
    panel.append(heading, lead, form);
    overlay.append(panel);
    document.body.append(overlay);

    const updateButton = () => {
      accept.disabled = !checks.every((checkbox) => checkbox.checked);
    };
    checks.forEach((checkbox) => checkbox.addEventListener("change", updateButton));

    const finish = (accepted) => {
      overlay.remove();
      activePrompt = null;
      resolve(accepted);
    };
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!checks.every((checkbox) => checkbox.checked)) return;
      finish(true);
    });
    cancel.addEventListener("click", () => finish(false));
    heading.tabIndex = -1;
    heading.focus();
  });

  return activePrompt;
}

async function ensureCoreNotice() {
  if (readStoredDecision()) return true;
  const accepted = await promptForAcknowledgements({
    title: "Vor der ersten Nutzung",
    intro:
      "Human Holo ist eine KI-gestützte Software im Legal-Review-Profil. Eingaben und Ausgaben können fehlerhaft sein. Sensible Funktionen sind technisch deaktiviert.",
    acknowledgements: [
      "Mir ist klar, dass ich mit einem KI-System und nicht mit einem Menschen oder einem echten digitalen Ich interagiere.",
      "Ich bin mindestens 18 Jahre alt.",
      "Ich stimme der Verarbeitung meiner aktiv eingegebenen Text- und Sprachinhalte für die angeforderte Antwort zu. Details und Widerrufsmöglichkeiten stehen in den Datenschutzhinweisen.",
      "Ich nutze Human Holo nicht für medizinische Entscheidungen oder Notfälle. Bei akuter Gefahr nutze ich 112."
    ]
  });
  if (accepted) storeDecision();
  return accepted;
}

async function ensureMediaRights({ kind = "Medieninhalt" } = {}) {
  if (!(await ensureCoreNotice())) return false;
  return promptForAcknowledgements({
    title: `${kind} einmalig freigeben`,
    intro:
      "Der ausgewählte Inhalt wird erst nach dieser Bestätigung übertragen. Die Bestätigung ersetzt keine Rechte oder Einwilligungen, die tatsächlich fehlen.",
    acknowledgements: [
      "Ich darf diesen Inhalt verwenden und an Human Holo zur einmaligen Auswertung übertragen.",
      "Erkennbare oder hörbare Dritte wurden informiert und haben zugestimmt; bei Kindern liegt die erforderliche Zustimmung der Sorgeberechtigten vor.",
      "Der Inhalt zeigt keine intime Situation, keinen höchstpersönlichen Lebensbereich und keine heimliche Aufnahme."
    ],
    acceptLabel: `${kind} jetzt übertragen`
  });
}

async function ensureVoiceEnvironment() {
  if (!(await ensureCoreNotice())) return false;
  if (voiceEnvironmentConfirmed) return true;
  const accepted = await promptForAcknowledgements({
    title: "Mikrofon für dieses Gespräch",
    intro:
      "Das Mikrofon läuft nur während des von dir gestarteten Gesprächs. Hintergrund-Weckwort und automatische Volltextspeicherung sind deaktiviert.",
    acknowledgements: [
      "Im Aufnahmebereich sprechen keine uninformierten oder nicht einwilligenden Dritten mit.",
      "Ich beende das Gespräch, sobald eine andere Person ohne Freigabe hörbar wird."
    ],
    acceptLabel: "Mikrofon-Gespräch starten"
  });
  voiceEnvironmentConfirmed = accepted;
  return accepted;
}

function withdraw() {
  const key = storageKey();
  if (key) localStorage.removeItem(key);
  voiceEnvironmentConfirmed = false;
  return true;
}

window.HumanHoloLegalConsent = Object.freeze({
  version: NOTICE_VERSION,
  ensure: ensureCoreNotice,
  ensureMediaRights,
  ensureVoiceEnvironment,
  withdraw,
  accepted: () => Boolean(readStoredDecision())
});

appendStatusBanner();

window.addEventListener("human-holo-app-unlocked", () => {
  void ensureCoreNotice();
});

if (!document.documentElement.classList.contains("solholo-booting")) {
  void ensureCoreNotice();
}
