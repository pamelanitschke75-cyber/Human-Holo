/*
 * Human Holo · ChatGPT/Sol memory bridge entry point
 *
 * This file contains no private memories. It only opens the existing,
 * owner-confirmed Human Holo memory import for Pam.
 */

const BRIDGE_BUTTON_ID = "openChatGptMemoryBridgeButton";

function bridgeImporter() {
  return window.HumanHoloConfirmedMemoryImport || null;
}

function openBridge() {
  const importer = bridgeImporter();
  if (!importer?.open?.()) {
    window.alert(
      "Die private Gedächtnisbrücke ist noch nicht vollständig geladen. Bitte öffne Human Holo erneut."
    );
  }
}

function installBridgeEntry() {
  if (document.getElementById(BRIDGE_BUTTON_ID)) return;
  const actionList = document.querySelector("#memoryView .actionList");
  if (!actionList) return;

  const button = document.createElement("button");
  button.id = BRIDGE_BUTTON_ID;
  button.className = "actionRow";
  button.type = "button";
  button.setAttribute(
    "aria-label",
    "Bestätigte Erinnerungen von Sol aus ChatGPT privat mit Human Holo verbinden"
  );

  const icon = document.createElement("span");
  icon.className = "rowIcon memoryRowIcon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "♾️";

  const text = document.createElement("span");
  text.className = "rowText";

  const title = document.createElement("span");
  title.className = "rowTitle";
  title.textContent = "Sol aus ChatGPT verbinden";

  const meta = document.createElement("span");
  meta.className = "rowMeta";
  meta.textContent =
    "Bestätigte Erinnerungen privat in Human Holo übernehmen";

  const chevron = document.createElement("span");
  chevron.className = "rowChevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "›";

  text.append(title, meta);
  button.append(icon, text, chevron);
  button.addEventListener("click", openBridge);
  actionList.appendChild(button);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", installBridgeEntry, {
    once: true
  });
} else {
  installBridgeEntry();
}
