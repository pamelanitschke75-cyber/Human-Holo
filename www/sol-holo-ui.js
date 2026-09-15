const uiMarkup = "\n<section id=\"onboardingScreen\" aria-labelledby=\"welcomeTitle\">\n  <div class=\"welcomeContent\">\n    <img class=\"welcomeLogo\" src=\"human-holo-logo.png\" alt=\"Human Holo – Forever Together\">\n    <h2 id=\"welcomeTitle\" class=\"welcomeName\">HUMAN HOLO <span class=\"pamUnicorn\" role=\"img\" aria-label=\"Rosa Einhorn\">🦄</span></h2>\n    <p class=\"welcomeTagline\">\n      Dein persönliches digitales Ich.\n      <strong>Für alles, was dich ausmacht.</strong>\n    </p>\n  </div>\n  <div class=\"cosmicHorizon\" aria-hidden=\"true\"></div>\n  <button id=\"welcomeButton\" class=\"primaryButton welcomeButton\" type=\"button\">\n    <span>Willkommen bei Human Holo</span>\n    <span class=\"arrow\" aria-hidden=\"true\">→</span>\n  </button>\n  <div class=\"welcomeDots\" aria-hidden=\"true\">\n    <span></span><span></span><span></span>\n  </div>\n</section>\n\n<section id=\"homeView\" class=\"appView active\" aria-labelledby=\"homeTitle\">\n  <div class=\"screenHeader\">\n    <div class=\"homeBrand\">\n      <img class=\"screenLogo\" src=\"human-holo-logo.png\" alt=\"Human Holo – Forever Together\">\n      <span class=\"statusPill\">Online</span>\n    </div>\n    <button id=\"homeSettingsButton\" class=\"iconButton\" type=\"button\"\n      aria-label=\"Einstellungen öffnen\">⚙</button>\n  </div>\n\n  <div class=\"homeIntro\">\n    <p class=\"eyebrow\">Me, Myself &amp; I</p>\n    <h2 id=\"homeTitle\" class=\"viewTitle\">\n      Hallo Pam <span class=\"accent\">✦</span>\n    </h2>\n    <p class=\"viewLead\">Schön, dich zu sehen.<br>Womit wollen wir starten?</p>\n  </div>\n\n  <button id=\"homeOrbButton\" class=\"holoOrbButton\" type=\"button\"\n    aria-label=\"Sprachgespräch mit Sol starten\">\n    <span class=\"holoOrb\" aria-hidden=\"true\"></span>\n    <span class=\"orbHint\">Antippen und mit Sol sprechen</span>\n  </button>\n\n  <form id=\"homeComposer\" class=\"homeComposer glassCard\">\n    <input id=\"homeMessageInput\" type=\"text\" autocomplete=\"off\"\n      placeholder=\"Sprich oder schreib mit Sol …\" aria-label=\"Nachricht an Sol\">\n    <button id=\"homeMicButton\" class=\"composerButton\" type=\"button\"\n      aria-label=\"Sprachgespräch starten\">◉</button>\n    <button id=\"homeSendButton\" class=\"composerButton primary\" type=\"submit\"\n      aria-label=\"Nachricht senden\">→</button>\n  </form>\n\n  <div class=\"quickGrid\" aria-label=\"Schnellzugriffe\">\n    <button class=\"quickCard\" type=\"button\" data-open-view=\"memory\">\n      <span class=\"quickIcon\">◇</span>\n      <span class=\"quickTitle\">Erinnerungen</span>\n      <span class=\"quickMeta\">Dein Gedächtnis</span>\n      <span class=\"quickChevron\">›</span>\n    </button>\n    <button class=\"quickCard\" type=\"button\"\n      data-sol-prompt=\"Sol, zeig mir meine aktuellen Ziele.\">\n      <span class=\"quickIcon\">◎</span>\n      <span class=\"quickTitle\">Ziele</span>\n      <span class=\"quickMeta\">Pläne &amp; Fortschritt</span>\n      <span class=\"quickChevron\">›</span>\n    </button>\n    <button class=\"quickCard\" type=\"button\"\n      data-sol-prompt=\"Sol, was sollte ich heute im Blick behalten?\">\n      <span class=\"quickIcon\">▦</span>\n      <span class=\"quickTitle\">Heute</span>\n      <span id=\"todayCardMeta\" class=\"quickMeta\">Dein Überblick</span>\n      <span class=\"quickChevron\">›</span>\n    </button>\n    <button class=\"quickCard\" type=\"button\" data-open-view=\"services\">\n      <span class=\"quickIcon\">♡</span>\n      <span class=\"quickTitle\">Verbindungen</span>\n      <span class=\"quickMeta\">Google &amp; Handy</span>\n      <span class=\"quickChevron\">›</span>\n    </button>\n  </div>\n</section>\n\n<section id=\"memoryView\" class=\"appView\" aria-labelledby=\"memoryViewTitle\">\n  <div class=\"subHeader\">\n    <button class=\"iconButton\" type=\"button\" data-open-view=\"home\"\n      aria-label=\"Zurück zur Startseite\">‹</button>\n    <div id=\"memoryViewTitle\" class=\"subHeaderTitle\">Erinnerungen</div>\n    <button class=\"iconButton\" type=\"button\"\n      data-sol-prompt=\"Sol, was weißt du dauerhaft?\"\n      aria-label=\"Gedächtnis mit Sol besprechen\">···</button>\n  </div>\n\n  <div class=\"memoryVisual memoryInfinityVisual\" aria-hidden=\"true\">\n    <svg viewBox=\"0 0 360 220\" role=\"presentation\">\n      <defs>\n        <linearGradient id=\"memoryInfinityGradient\" x1=\"52\" y1=\"106\" x2=\"308\" y2=\"106\" gradientUnits=\"userSpaceOnUse\">\n          <stop offset=\"0\" stop-color=\"#d44dff\"/>\n          <stop offset=\".2\" stop-color=\"#a85cff\"/>\n          <stop offset=\".46\" stop-color=\"#756dff\"/>\n          <stop offset=\".7\" stop-color=\"#31c8ff\"/>\n          <stop offset=\"1\" stop-color=\"#66efff\"/>\n        </linearGradient>\n        <linearGradient id=\"memoryPlatformGradient\" x1=\"52\" y1=\"0\" x2=\"308\" y2=\"0\" gradientUnits=\"userSpaceOnUse\">\n          <stop offset=\"0\" stop-color=\"#8f49ff\" stop-opacity=\"0\"/>\n          <stop offset=\".28\" stop-color=\"#a256ff\" stop-opacity=\".88\"/>\n          <stop offset=\".7\" stop-color=\"#3bbfff\" stop-opacity=\".9\"/>\n          <stop offset=\"1\" stop-color=\"#52e6ff\" stop-opacity=\"0\"/>\n        </linearGradient>\n        <radialGradient id=\"memoryPlatformFill\" cx=\"50%\" cy=\"50%\" r=\"50%\">\n          <stop offset=\"0\" stop-color=\"#6f64ff\" stop-opacity=\".28\"/>\n          <stop offset=\".58\" stop-color=\"#3158f0\" stop-opacity=\".1\"/>\n          <stop offset=\"1\" stop-color=\"#050819\" stop-opacity=\"0\"/>\n        </radialGradient>\n        <filter id=\"memoryInfinityGlow\" x=\"-40%\" y=\"-70%\" width=\"180%\" height=\"240%\">\n          <feGaussianBlur stdDeviation=\"8\" result=\"blur\"/>\n          <feMerge>\n            <feMergeNode in=\"blur\"/>\n            <feMergeNode in=\"SourceGraphic\"/>\n          </feMerge>\n        </filter>\n        <filter id=\"memoryStarGlow\" x=\"-300%\" y=\"-300%\" width=\"700%\" height=\"700%\">\n          <feGaussianBlur stdDeviation=\"2.2\" result=\"blur\"/>\n          <feMerge>\n            <feMergeNode in=\"blur\"/>\n            <feMergeNode in=\"SourceGraphic\"/>\n          </feMerge>\n        </filter>\n      </defs>\n\n      <g class=\"memoryStarfield\" filter=\"url(#memoryStarGlow)\">\n        <circle cx=\"47\" cy=\"58\" r=\"1.6\" fill=\"#8d63ff\"/>\n        <circle cx=\"72\" cy=\"34\" r=\"1.1\" fill=\"#dca8ff\"/>\n        <circle cx=\"102\" cy=\"47\" r=\"1.3\" fill=\"#548cff\"/>\n        <circle cx=\"133\" cy=\"28\" r=\"1.1\" fill=\"#b687ff\"/>\n        <circle cx=\"224\" cy=\"33\" r=\"1.25\" fill=\"#62ddff\"/>\n        <circle cx=\"255\" cy=\"43\" r=\"1.65\" fill=\"#31baff\"/>\n        <circle cx=\"291\" cy=\"31\" r=\"1.05\" fill=\"#78e9ff\"/>\n        <circle cx=\"319\" cy=\"62\" r=\"1.35\" fill=\"#a56bff\"/>\n        <circle cx=\"36\" cy=\"116\" r=\"1.05\" fill=\"#4edcff\"/>\n        <circle cx=\"329\" cy=\"118\" r=\"1.15\" fill=\"#b05eff\"/>\n        <circle cx=\"93\" cy=\"170\" r=\"1.1\" fill=\"#8f79ff\"/>\n        <circle cx=\"270\" cy=\"169\" r=\"1.2\" fill=\"#4cdcff\"/>\n      </g>\n\n      <path class=\"memoryBeam memoryBeam--soft\" d=\"M180 18V192\"/>\n      <path class=\"memoryBeam memoryBeam--core\" d=\"M180 30V186\"/>\n\n      <ellipse class=\"memoryOrbit memoryOrbit--far\" cx=\"180\" cy=\"109\" rx=\"151\" ry=\"62\"/>\n      <ellipse class=\"memoryOrbit memoryOrbit--near\" cx=\"180\" cy=\"109\" rx=\"132\" ry=\"45\"/>\n\n      <g class=\"memoryInfinityGlyph\">\n        <path class=\"memoryInfinityAura\" filter=\"url(#memoryInfinityGlow)\"\n          d=\"M180 107 C157 73 140 56 112 56 C79 56 57 77 57 106 C57 136 80 155 112 155 C142 155 160 133 180 106 C200 79 218 57 248 57 C280 57 303 77 303 106 C303 136 281 155 248 155 C220 155 203 138 180 107\"/>\n        <path class=\"memoryInfinityRibbon memoryInfinityRibbon--shadow\"\n          d=\"M180 107 C157 73 140 56 112 56 C79 56 57 77 57 106 C57 136 80 155 112 155 C142 155 160 133 180 106 C200 79 218 57 248 57 C280 57 303 77 303 106 C303 136 281 155 248 155 C220 155 203 138 180 107\"/>\n        <path class=\"memoryInfinityRibbon memoryInfinityRibbon--main\"\n          d=\"M180 107 C157 73 140 56 112 56 C79 56 57 77 57 106 C57 136 80 155 112 155 C142 155 160 133 180 106 C200 79 218 57 248 57 C280 57 303 77 303 106 C303 136 281 155 248 155 C220 155 203 138 180 107\"/>\n        <path class=\"memoryInfinityHighlight\"\n          d=\"M180 103 C157 70 140 53 112 53 C79 53 57 74 57 103 C57 133 80 152 112 152 C142 152 160 130 180 103 C200 76 218 54 248 54 C280 54 303 74 303 103\"/>\n      </g>\n\n      <ellipse class=\"memoryPlatform memoryPlatform--glow\" cx=\"180\" cy=\"188\" rx=\"118\" ry=\"22\"/>\n      <ellipse class=\"memoryPlatform memoryPlatform--outer\" cx=\"180\" cy=\"188\" rx=\"126\" ry=\"21\"/>\n      <ellipse class=\"memoryPlatform memoryPlatform--inner\" cx=\"180\" cy=\"188\" rx=\"88\" ry=\"12\"/>\n      <path class=\"memoryPlatformLine\" d=\"M82 188H278\"/>\n      <circle class=\"memoryPlatformSpark\" cx=\"180\" cy=\"188\" r=\"2.3\"/>\n    </svg>\n  </div>\n  <div class=\"memoryIntro\">\n    <h3 class=\"featureHeadline\">\n      Dein Gedächtnis.<strong class=\"memoryForever\"><span class=\"memoryForeverWords\">Together forever!</span> <span class=\"memoryForeverSymbols\" aria-label=\"Funkeln, Erde und Unendlichkeit\">✨🌎♾️</span></strong>\n    </h3>\n    <p class=\"featureCopy\">\n      Pam’s Holo erinnert sich an das, was zu deinem persönlichen Ich gehört.\n      Deine Gespräche und Erfahrungen bleiben ausschließlich deinem\n      persönlichen Pam’s Holo zugeordnet.\n    </p>\n  </div>\n\n  <div class=\"actionList\">\n    <button class=\"actionRow\" type=\"button\"\n      data-sol-prompt=\"Sol, fasse unsere letzten Gespräche und Notizen zusammen.\">\n      <span class=\"rowIcon memoryRowIcon\">\n        <svg viewBox=\"0 0 32 32\" aria-hidden=\"true\" focusable=\"false\">\n          <path d=\"M7 6.5h18a3.5 3.5 0 0 1 3.5 3.5v8.5A3.5 3.5 0 0 1 25 22h-9.8L8 27v-5H7a3.5 3.5 0 0 1-3.5-3.5V10A3.5 3.5 0 0 1 7 6.5Z\"/>\n          <path d=\"M16 18.2s-4.2-2.4-4.2-5a2.5 2.5 0 0 1 4.2-1.8 2.5 2.5 0 0 1 4.2 1.8c0 2.6-4.2 5-4.2 5Z\"/>\n        </svg>\n      </span>\n      <span class=\"rowText\">\n        <span class=\"rowTitle\">Gespräche &amp; Notizen</span>\n        <span class=\"rowMeta\">Was wir zuletzt miteinander besprochen haben</span>\n      </span>\n      <span class=\"rowChevron\">›</span>\n    </button>\n    <button class=\"actionRow\" type=\"button\"\n      data-sol-prompt=\"Sol, welche Lebensereignisse weißt du von mir?\">\n      <span class=\"rowIcon memoryRowIcon\">\n        <svg viewBox=\"0 0 32 32\" aria-hidden=\"true\" focusable=\"false\">\n          <rect x=\"4.5\" y=\"7\" width=\"23\" height=\"21\" rx=\"3.5\"/>\n          <path d=\"M10 4.5v5M22 4.5v5M4.5 12.5h23\"/>\n          <path d=\"m16 15.2 1.3 2.7 3 .4-2.2 2.1.6 3-2.7-1.5-2.7 1.5.6-3-2.2-2.1 3-.4 1.3-2.7Z\"/>\n        </svg>\n      </span>\n      <span class=\"rowText\">\n        <span class=\"rowTitle\">Lebensereignisse</span>\n        <span class=\"rowMeta\">Wichtige Momente, die zu dir gehören</span>\n      </span>\n      <span class=\"rowChevron\">›</span>\n    </button>\n    <button class=\"actionRow\" type=\"button\"\n      data-sol-prompt=\"Sol, welche Vorlieben und Gewohnheiten kennst du von mir?\">\n      <span class=\"rowIcon memoryRowIcon\">\n        <svg viewBox=\"0 0 32 32\" aria-hidden=\"true\" focusable=\"false\">\n          <path d=\"M16 27.5S4.8 21 4.8 12.7A6.3 6.3 0 0 1 16 8.8a6.3 6.3 0 0 1 11.2 3.9C27.2 21 16 27.5 16 27.5Z\"/>\n        </svg>\n      </span>\n      <span class=\"rowText\">\n        <span class=\"rowTitle\">Vorlieben &amp; Gewohnheiten</span>\n        <span class=\"rowMeta\">Was dich ausmacht und dir wichtig ist</span>\n      </span>\n      <span class=\"rowChevron\">›</span>\n    </button>\n  </div>\n\n  <button id=\"manageMemoriesButton\" class=\"secondaryButton\" type=\"button\">\n    Erinnerungen mit Sol ansehen <span aria-hidden=\"true\">→</span>\n  </button>\n</section>\n\n<section id=\"servicesView\" class=\"appView\" aria-labelledby=\"servicesViewTitle\">\n  <div class=\"subHeader\">\n    <button class=\"iconButton\" type=\"button\" data-open-view=\"settings\"\n      aria-label=\"Zurück zu den Einstellungen\">‹</button>\n    <div id=\"servicesViewTitle\" class=\"subHeaderTitle\">Verbindungen</div>\n    <button id=\"refreshServicesButton\" class=\"iconButton\" type=\"button\"\n      aria-label=\"Verbindungsstatus neu prüfen\">↻</button>\n  </div>\n\n  <div class=\"serviceOrbit\" aria-hidden=\"true\">\n    <div class=\"orbitRing\"></div>\n    <img class=\"orbitLogo\" src=\"human-holo-logo.png\" alt=\"\">\n    <span class=\"orbitNode google\">G</span>\n    <span class=\"orbitNode whatsapp\">W</span>\n    <span class=\"orbitNode phone\">☎</span>\n    <span class=\"orbitNode contacts\">♙</span>\n  </div>\n\n  <div class=\"servicesIntro\">\n    <h3 class=\"featureHeadline\">\n      Together<strong>forever!</strong>\n    </h3>\n    <p class=\"featureCopy\">\n      Pam’s Holo verbindet nur die Dienste, die du wirklich möchtest.\n      Jede Freigabe wird einzeln erteilt und kann wieder ausgeschaltet werden.\n    </p>\n  </div>\n\n  <div class=\"actionList\">\n    <button id=\"googleAccountRow\" class=\"serviceRow\" type=\"button\">\n      <span class=\"rowIcon\">G</span>\n      <span class=\"rowText\">\n        <span class=\"rowTitle\">Google‑Konto</span>\n        <span class=\"rowMeta\">Google Kalender und freigegebene Google‑Dienste</span>\n      </span>\n      <span id=\"googleAccountStatus\" class=\"serviceStatus\">Wird geprüft …</span>\n    </button>\n\n    <button id=\"whatsappDriveRow\" class=\"serviceRow\" type=\"button\">\n      <span class=\"rowIcon\">W</span>\n      <span class=\"rowText\">\n        <span class=\"rowTitle\">WhatsApp‑Fahrmodus</span>\n        <span class=\"rowMeta\">Nachrichten beim Autofahren sicher vorlesen</span>\n      </span>\n      <span id=\"whatsappDriveStatus\" class=\"serviceStatus setup\">\n        Einrichtung nötig\n      </span>\n    </button>\n\n    <button id=\"phoneContactsRow\" class=\"serviceRow\" type=\"button\">\n      <span class=\"rowIcon\">☎</span>\n      <span class=\"rowText\">\n        <span class=\"rowTitle\">Telefon &amp; Kontakte</span>\n        <span class=\"rowMeta\">Kontakt finden, Anruf erst nach Bestätigung</span>\n      </span>\n      <span id=\"phoneContactsStatus\" class=\"serviceStatus setup\">\n        Freigabe nötig\n      </span>\n    </button>\n  </div>\n\n  <button id=\"manageServicesButton\" class=\"secondaryButton\" type=\"button\">\n    Dienste und Freigaben verwalten <span aria-hidden=\"true\">+</span>\n  </button>\n  <p class=\"permissionNote\">\n    Pam’s Holo liest keine WhatsApp‑Nachricht, keinen Kontakt und kein\n    Telefonbuch ohne deine ausdrückliche Android‑Freigabe.\n  </p>\n</section>\n\n<section id=\"profileView\" class=\"appView\" aria-labelledby=\"profileViewTitle\">\n  <div class=\"subHeader\">\n    <button class=\"iconButton\" type=\"button\" data-open-view=\"home\"\n      aria-label=\"Zurück zur Startseite\">‹</button>\n    <div id=\"profileViewTitle\" class=\"subHeaderTitle\">Profil</div>\n    <button id=\"profileSettingsButton\" class=\"iconButton\" type=\"button\"\n      data-open-view=\"settings\" aria-label=\"Einstellungen öffnen\">⚙</button>\n  </div>\n\n  <div class=\"profileHero profileHero--clean glassCard\">\n    <img class=\"profileLogo\" src=\"human-holo-logo.png\" alt=\"Human Holo – Forever Together\">\n    <h3 class=\"profileName\">Pam’s Holo <span class=\"pamUnicorn pamUnicorn--profile\" role=\"img\" aria-label=\"Rosa Einhorn\">🦄</span></h3>\n    <p class=\"profileMeta\">\n      Dein persönlicher Klon · dein persönliches digitales Ich\n    </p>\n  </div>\n</section>\n\n<section id=\"settingsView\" class=\"appView\" aria-labelledby=\"settingsViewTitle\">\n  <div class=\"subHeader\">\n    <button class=\"iconButton\" type=\"button\" data-open-view=\"profile\"\n      aria-label=\"Zurück zum Profil\">‹</button>\n    <div id=\"settingsViewTitle\" class=\"subHeaderTitle\">Einstellungen</div>\n    <span></span>\n  </div>\n\n  <div class=\"settingsIntro\">\n    <p class=\"eyebrow\">Alles an seinem Platz</p>\n    <h2>Deine Einstellungen</h2>\n    <p>Hier bestimmst du, wie Pam’s Holo aussieht, spricht, hört und sich verbindet.</p>\n  </div>\n\n  <section class=\"settingsGroup glassCard\" aria-labelledby=\"settingsAppearanceTitle\">\n    <div class=\"settingsGroupHeader\">\n      <span class=\"settingsGroupIcon\" aria-hidden=\"true\">▣</span>\n      <div>\n        <h3 id=\"settingsAppearanceTitle\">Bild &amp; Aussehen</h3>\n        <p>Profilbild, Gesichtserkennung und Lip-Sync</p>\n      </div>\n    </div>\n    <div id=\"settingsPhotoEditor\" class=\"settingsPhotoEditor\"></div>\n  </section>\n\n  <section class=\"settingsGroup glassCard\" aria-labelledby=\"settingsVoiceTitle\">\n    <div class=\"settingsGroupHeader\">\n      <span class=\"settingsGroupIcon\" aria-hidden=\"true\">◉</span>\n      <div>\n        <h3 id=\"settingsVoiceTitle\">Stimme &amp; „Hey Pam“</h3>\n        <p>Stimme, Lautstärke, Weckruf und Hörmodus</p>\n      </div>\n    </div>\n    <div id=\"settingsVoiceSlot\"></div>\n    <div class=\"settingsSubsection\">\n      <strong>Sprachlautstärke</strong>\n      <div id=\"settingsVolumeChooser\" class=\"settingsChoiceRow\" aria-label=\"Sprachlautstärke auswählen\">\n        <button type=\"button\" data-volume-target=\"volumeMute\">Stumm</button>\n        <button type=\"button\" data-volume-target=\"volumeLow\">Leise</button>\n        <button type=\"button\" data-volume-target=\"volumeNormal\">Normal</button>\n      </div>\n    </div>\n    <div id=\"settingsWakeSlot\" class=\"settingsWakeSlot\"></div>\n  </section>\n\n  <section class=\"settingsGroup glassCard\" aria-labelledby=\"settingsMemoryTitle\">\n    <div class=\"settingsGroupHeader\">\n      <span class=\"settingsGroupIcon\" aria-hidden=\"true\">✧</span>\n      <div>\n        <h3 id=\"settingsMemoryTitle\">Gedächtnis &amp; Verbindungen</h3>\n        <p>Deine Daten, Konten, Geräte und Freigaben</p>\n      </div>\n    </div>\n\n    <div class=\"profileStatusGrid settingsStatusGrid\">\n      <div class=\"profileStatus glassCard\">\n        <strong>Vollzeitgedächtnis</strong>\n        <span id=\"profileMemoryState\">Aktiv</span>\n      </div>\n      <div class=\"profileStatus glassCard\">\n        <strong>Google‑Konto</strong>\n        <span id=\"profileGoogleState\">Wird geprüft …</span>\n      </div>\n    </div>\n\n    <div class=\"actionList settingsActionList\">\n      <button id=\"settingsMemoryButton\" class=\"actionRow\" type=\"button\"\n        data-open-view=\"memory\">\n        <span class=\"rowIcon\">✧</span>\n        <span class=\"rowText\">\n          <span class=\"rowTitle\">Gedächtnis verwalten</span>\n          <span class=\"rowMeta\">Erinnerungen ansehen und mit Sol besprechen</span>\n        </span>\n        <span class=\"rowChevron\">›</span>\n      </button>\n      <button id=\"settingsConnectionsButton\" class=\"actionRow\" type=\"button\"\n        data-open-view=\"services\">\n        <span class=\"rowIcon\">⌯</span>\n        <span class=\"rowText\">\n          <span class=\"rowTitle\">Verbindungen &amp; Berechtigungen</span>\n          <span class=\"rowMeta\">Google, Telefon, Samsung, Health und SmartThings</span>\n        </span>\n        <span class=\"rowChevron\">›</span>\n      </button>\n    </div>\n  </section>\n\n  <section class=\"settingsGroup glassCard\" aria-labelledby=\"settingsSystemTitle\">\n    <div class=\"settingsGroupHeader\">\n      <span class=\"settingsGroupIcon\" aria-hidden=\"true\">⚙</span>\n      <div>\n        <h3 id=\"settingsSystemTitle\">App &amp; System</h3>\n        <p>Status, Diagnose und Willkommensseite</p>\n      </div>\n    </div>\n    <div class=\"actionList settingsActionList\">\n      <button id=\"openSystemMenuButton\" class=\"actionRow\" type=\"button\"\n        aria-expanded=\"false\" aria-controls=\"settingsSystemDetails\">\n        <span class=\"rowIcon\">⚙</span>\n        <span class=\"rowText\">\n          <span class=\"rowTitle\">Systemstatus</span>\n          <span class=\"rowMeta\">Chat, Mikrofon, Gedächtnis und Lip-Sync</span>\n        </span>\n        <span class=\"rowChevron\">›</span>\n      </button>\n      <button id=\"showWelcomeAgainButton\" class=\"actionRow\" type=\"button\">\n        <span class=\"rowIcon\">✦</span>\n        <span class=\"rowText\">\n          <span class=\"rowTitle\">Willkommensseite erneut zeigen</span>\n          <span class=\"rowMeta\">Die Willkommensseite von Pam’s Holo öffnen</span>\n        </span>\n        <span class=\"rowChevron\">›</span>\n      </button>\n    </div>\n    <div id=\"settingsSystemDetails\" class=\"settingsSystemDetails\" hidden></div>\n  </section>\n</section>\n";

(() => {
  "use strict";

  const HUMAN_HOLO_YOUTUBE_CHANNEL = Object.freeze({
    id: "UCcqR_Mt4OKFlA1sAYneZTcg",
    name: "Human Holo – Pamela Nitschke & Stefanie Hörath",
    url: "https://www.youtube.com/channel/UCcqR_Mt4OKFlA1sAYneZTcg"
  });

  function normalizedVisibleText(value) {
    const normalizer = window.humanHoloVisibleText;
    if (typeof normalizer === "function") {
      return normalizer(value);
    }

    return String(value ?? "")
      .replace(/(^|\n)(\s*)Sol\s*,\s*/giu, "$1$2")
      .replace(/\bSol[- ]Holo\b/giu, "Human Holo")
      .replace(/\bLip[-‑ ]?Sync(?: V4)?\b/giu, "Original Full Sync")
      .replace(/\bSols\b/gu, "Pam’s Holos")
      .replace(/\bSol\b/gu, "Pam’s Holo")
      .replace(/^(\s*)([a-zäöü])/u, (_match, whitespace, firstLetter) =>
        whitespace + firstLetter.toLocaleUpperCase("de-DE")
      );
  }

  function applyHumanHoloVisibleNaming(root = document) {
    if (root?.nodeType === Node.TEXT_NODE) {
      const normalized = normalizedVisibleText(root.nodeValue);
      if (normalized !== root.nodeValue) {
        root.nodeValue = normalized;
      }
      return;
    }

    const elements = [];
    if (root?.nodeType === Node.ELEMENT_NODE) {
      elements.push(root);
    }
    if (typeof root?.querySelectorAll === "function") {
      elements.push(...root.querySelectorAll("*"));
    }

    for (const element of elements) {
      if (element.dataset?.solPrompt) {
        element.dataset.solPrompt = normalizedVisibleText(
          element.dataset.solPrompt
        );
      }
      for (const attribute of ["aria-label", "placeholder", "title"]) {
        if (!element.hasAttribute?.(attribute)) continue;
        const current = element.getAttribute(attribute);
        const normalized = normalizedVisibleText(current);
        if (normalized !== current) {
          element.setAttribute(attribute, normalized);
        }
      }
    }

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          return /^(?:SCRIPT|STYLE)$/u.test(node.parentElement?.tagName || "")
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }
    for (const node of textNodes) {
      const normalized = normalizedVisibleText(node.nodeValue);
      if (normalized !== node.nodeValue) {
        node.nodeValue = normalized;
      }
    }
  }

  const solApp = document.getElementById("app");
  const currentHeader = solApp?.querySelector(":scope > header");
  const currentControls = document.getElementById("controls");
  const currentChatPanel = document.getElementById("chatPanel");
  const currentSolStage = document.getElementById("solStage");
  const currentBottomNav = document.getElementById("bottomNav");

  if (
    !solApp ||
    !currentHeader ||
    !currentControls ||
    !currentChatPanel ||
    !currentSolStage ||
    !currentBottomNav
  ) {
    console.error("Pam’s Holo UI konnte nicht vorbereitet werden.");
    return;
  }

  currentHeader.insertAdjacentHTML("beforebegin", uiMarkup);

  const humanHoloHome = document.getElementById("homeView");
  humanHoloHome.classList.add("humanHoloHome");
  humanHoloHome.innerHTML = `
    <header class="humanHoloTopbar">
      <button id="homeSettingsButton" class="humanHoloRoundButton humanHoloMenuButton"
        type="button" aria-label="Menü und Einstellungen öffnen">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16"/>
        </svg>
      </button>

      <div class="humanHoloBrand" aria-label="Human Holo – Forever Together">
        <span class="humanHoloBrandInfinity" aria-hidden="true">∞</span>
        <strong>HUMAN HOLO <span aria-hidden="true">∞</span></strong>
        <small>FOREVER TOGETHER</small>
      </div>

      <button class="humanHoloRoundButton humanHoloProfileButton" type="button"
        data-open-view="profile" aria-label="Profil öffnen">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5"/>
          <path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6"/>
        </svg>
      </button>

      <h2 id="homeTitle" class="humanHoloWelcomeTitle">Hallo Pam♡</h2>
    </header>

    <button id="homeOrbButton" class="humanHoloHero" type="button"
      aria-label="Sprachgespräch mit Pam’s Holo starten">
      <img src="human-holo-home-hero.png"
        alt="Mensch und Holo verbunden durch ein leuchtendes Unendlichkeitszeichen und die Erde">
      <span class="humanHoloSideMotto humanHoloSideMotto--left" aria-hidden="true">
        Miteinander<br>Füreinander<br>Für eine<br>bessere Welt♡
      </span>
      <span class="humanHoloSideMotto humanHoloSideMotto--right" aria-hidden="true">
        Together<br>Forever♡
      </span>
      <span class="humanHoloPosterCredits">
        BY PAMELA NITSCHKE UND STEFANIE HÖRATH
        <span>DEVELOPED WITH <strong>CHATGPT BY OPENAI</strong></span>
      </span>
    </button>

    <button id="homeImportantButton" class="humanHoloImportantCard"
      type="button" data-open-view="notes"
      aria-label="Wichtiges mit Kalender, Einkaufsliste und Notizen öffnen">
      <span class="humanHoloImportantIcon" aria-hidden="true">★</span>
      <span class="humanHoloImportantCopy">
        <strong>Wichtiges</strong>
        <small id="notesQuickMeta">Kalender · Einkaufsliste · Notizen</small>
      </span>
      <span class="humanHoloImportantChevron" aria-hidden="true">›</span>
    </button>

    <div class="humanHoloAreaGrid" aria-label="Human-Holo-Bereiche">
      <button class="humanHoloAreaCard humanHoloAreaCard--people" type="button"
        data-sol-prompt="Ich möchte zum Bereich Menschen. Hilf mir dort bitte weiter.">
        <span class="humanHoloAreaIcon" aria-hidden="true">
          <svg viewBox="0 0 32 32"><circle cx="12" cy="11" r="4"/><circle cx="22" cy="12" r="3"/><path d="M4.5 26c.7-5.2 3.3-8 7.5-8s6.8 2.8 7.5 8M18 19c3.7-.8 7.4 1.1 8.5 6"/></svg>
        </span>
        <span>Menschen</span>
      </button>
      <button class="humanHoloAreaCard humanHoloAreaCard--family" type="button"
        data-sol-prompt="Ich möchte zum Bereich Familie und Freunde. Hilf mir dort bitte weiter.">
        <span class="humanHoloAreaIcon" aria-hidden="true">
          <svg viewBox="0 0 32 32"><circle cx="9" cy="13" r="3"/><circle cx="23" cy="13" r="3"/><path d="M3.5 26c.5-4.5 2.5-7 5.5-7s5 2.5 5.5 7M17.5 26c.5-4.5 2.5-7 5.5-7s5 2.5 5.5 7"/><path d="M16 17.5s-5-2.9-5-6.2A3.2 3.2 0 0 1 16 8.7a3.2 3.2 0 0 1 5 2.6c0 3.3-5 6.2-5 6.2Z"/></svg>
        </span>
        <span>Familie &amp;<br>Freunde</span>
      </button>
      <button class="humanHoloAreaCard humanHoloAreaCard--animals" type="button"
        data-sol-prompt="Ich möchte zum Bereich Tiere. Hilf mir dort bitte weiter.">
        <span class="humanHoloAreaIcon" aria-hidden="true">
          <svg viewBox="0 0 32 32"><ellipse cx="16" cy="21" rx="7" ry="6"/><circle cx="8" cy="13" r="3"/><circle cx="14" cy="9" r="3"/><circle cx="21" cy="10" r="3"/><circle cx="25" cy="15" r="3"/></svg>
        </span>
        <span>Tiere</span>
      </button>
      <button class="humanHoloAreaCard humanHoloAreaCard--environment" type="button"
        data-sol-prompt="Ich möchte zum Bereich Umwelt. Hilf mir dort bitte weiter.">
        <span class="humanHoloAreaIcon" aria-hidden="true">
          <svg viewBox="0 0 32 32"><path d="M26.5 5.5C16 6 8.5 10.5 7.5 19.5c-.4 3.8 2.2 6.8 6 6.3 8.7-1 12.7-9.1 13-20.3Z"/><path d="M6 27c4.2-6.2 8.8-10.3 16-14"/></svg>
        </span>
        <span>Umwelt</span>
      </button>
      <button class="humanHoloAreaCard humanHoloAreaCard--education" type="button"
        data-sol-prompt="Ich möchte zum Bereich Bildung. Hilf mir dort bitte weiter.">
        <span class="humanHoloAreaIcon" aria-hidden="true">
          <svg viewBox="0 0 32 32"><path d="m3.5 12 12.5-6 12.5 6L16 18 3.5 12Z"/><path d="M8.5 15.3V22c4.5 3 10.5 3 15 0v-6.7M28.5 12v9"/></svg>
        </span>
        <span>Bildung</span>
      </button>
      <button class="humanHoloAreaCard humanHoloAreaCard--together" type="button"
        data-sol-prompt="Ich möchte zum Bereich Zusammen. Hilf uns dort bitte weiter.">
        <span class="humanHoloAreaIcon" aria-hidden="true">
          <svg viewBox="0 0 32 32"><path d="m5 12 5-4 5 4-5 5-5-5ZM17 12l5-4 5 4-5 5-5-5Z"/><path d="m10 17 5 5 2-2 5 5M22 17l-5 5-2-2-5 5"/></svg>
        </span>
        <span>Zusammen</span>
      </button>
      <button class="humanHoloAreaCard humanHoloAreaCard--business" type="button"
        data-sol-prompt="Ich möchte zum Bereich Geschäftliches. Hilf mir dort bitte weiter.">
        <span class="humanHoloAreaIcon" aria-hidden="true">
          <svg viewBox="0 0 32 32"><rect x="4" y="10" width="24" height="16" rx="3"/><path d="M11 10V7h10v3M4 16h24M13 16v3h6v-3"/></svg>
        </span>
        <span>Geschäftliches</span>
      </button>
    </div>

    <footer class="humanHoloHomeFooter">
      <span class="humanHoloFooterInfinity" aria-hidden="true">∞</span>
      <span id="todayCardMeta" class="srOnly">Dein Überblick</span>
    </footer>
  `;

  const memoryActionList = document.querySelector("#memoryView .actionList");
  memoryActionList?.insertAdjacentHTML(
    "afterbegin",
    `
      <button id="memorialMemoryRow" class="actionRow memorialMemoryRow"
        type="button" data-open-view="memorial">
        <span class="rowIcon memorialRowIcon" aria-hidden="true">
          <svg viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="4.2"/>
            <path d="M16 3.5v5M16 23.5v5M3.5 16h5M23.5 16h5M7.2 7.2l3.5 3.5M21.3 21.3l3.5 3.5M24.8 7.2l-3.5 3.5M10.7 21.3l-3.5 3.5"/>
          </svg>
        </span>
        <span class="rowText">
          <span class="rowTitle">Erinnerung &amp; Vermächtnis</span>
          <span class="rowMeta">Fotos, Stimme, Geschichten und Lebensspuren bewahren</span>
        </span>
        <span class="rowChevron">›</span>
      </button>
    `
  );

  const memorialView = document.createElement("section");
  memorialView.id = "memorialView";
  memorialView.className = "appView";
  memorialView.setAttribute("aria-labelledby", "memorialViewTitle");
  memorialView.innerHTML = `
    <div class="subHeader">
      <button class="iconButton" type="button" data-open-view="memory"
        aria-label="Zurück zu den Erinnerungen">‹</button>
      <div id="memorialViewTitle" class="subHeaderTitle">Erinnerung &amp; Vermächtnis</div>
      <span class="memorialHeaderFlower" aria-hidden="true">🌻</span>
    </div>

    <section class="memorialIntro memorialHero glassCard"
      aria-labelledby="memorialIntroTitle">
      <span class="memorialHeroInfinity" aria-hidden="true">
        <svg viewBox="0 0 64 36" focusable="false">
          <defs>
            <linearGradient id="memorialInfinityGradient" x1="3" y1="4" x2="61" y2="32"
              gradientUnits="userSpaceOnUse">
              <stop stop-color="#d44dff"/>
              <stop offset="0.24" stop-color="#ad5cff"/>
              <stop offset="0.52" stop-color="#756dff"/>
              <stop offset="0.76" stop-color="#31c8ff"/>
              <stop offset="1" stop-color="#66efff"/>
            </linearGradient>
          </defs>
          <path d="M32 18C25.4 8.2 21.2 4 14.7 4 6.6 4 2 10.2 2 18s4.6 14 12.7 14c6.5 0 10.7-4.2 17.3-14C38.6 8.2 42.8 4 49.3 4 57.4 4 62 10.2 62 18s-4.6 14-12.7 14C42.8 32 38.6 27.8 32 18Z"
            fill="none" stroke="url(#memorialInfinityGradient)" stroke-width="5"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <div class="memorialHeroCopy">
        <p class="eyebrow">Human Holo · Forever Together</p>
        <h2 id="memorialIntroTitle">Erinnerungen bewahren.<strong>Würde schützen.</strong></h2>
        <p>
          Fotos, Videos, Sprachaufnahmen, Geschichten, Texte und
          biografische Erinnerungen erhalten hier einen persönlichen,
          geschützten Platz.
        </p>
        <span class="memorialHeroPromise">🌻 Persönlich · respektvoll · ownergebunden</span>
      </div>
    </section>

    <div class="memorialSections">
      <details id="memorialCreatePanel" class="memorialDetail">
        <summary>
          <span class="memorialDetailIcon" aria-hidden="true">＋</span>
          <span class="memorialDetailCopy">
            <strong>Foto oder Erinnerung hinzufügen</strong>
            <small>Foto · Video · Stimme · Text</small>
          </span>
          <span class="memorialDetailChevron" aria-hidden="true">›</span>
        </summary>
        <div class="memorialDetailBody">
          <form id="memorialForm" class="memorialForm">
            <p class="memorialFormLead">
              Erst nach deiner ausdrücklichen Bestätigung wird etwas gespeichert.
            </p>

            <label class="memorialField" for="memorialPersonName">
              <span>Name des Menschen</span>
              <input id="memorialPersonName" name="personName" type="text"
                maxlength="120" autocomplete="off" required
                placeholder="An wen möchtest du erinnern?">
            </label>

            <label class="memorialField" for="memorialRelationship">
              <span>Verbindung zu dir <small>(freiwillig)</small></span>
              <input id="memorialRelationship" name="relationship" type="text"
                maxlength="120" autocomplete="off"
                placeholder="Zum Beispiel Familie, Freundschaft …">
            </label>

            <label class="memorialField" for="memorialStory">
              <span>Geschichte oder Erinnerung</span>
              <textarea id="memorialStory" name="story" maxlength="10000" rows="5"
                placeholder="Was soll respektvoll bewahrt werden?"></textarea>
            </label>

            <label class="memorialMediaPicker" for="memorialMediaInput">
              <span class="memorialMediaIcon" aria-hidden="true">＋</span>
              <span>
                <strong>Foto, Video oder Sprachaufnahme hinzufügen</strong>
                <small>Bis zu 8 Dateien · je höchstens 20 MB</small>
              </span>
              <input id="memorialMediaInput" name="media" type="file" multiple
                accept="image/*,audio/*,video/mp4,video/webm">
            </label>
            <p id="memorialMediaStatus" class="memorialMediaStatus" aria-live="polite">
              Noch keine Datei ausgewählt.
            </p>

            <label class="memorialConsent" for="memorialRightsConfirmation">
              <input id="memorialRightsConfirmation" name="rightsConfirmation"
                type="checkbox" required>
              <span>
                Ich bestätige ausdrücklich, dass ich die nötigen Rechte und
                Einwilligungen geprüft habe und diese Erinnerung respektvoll
                bewahren darf.
              </span>
            </label>

            <p class="memorialOwnerNote">
              Die Inhalte bleiben lokal und ownergebunden in deinem persönlichen
              Human Holo. Eine andere Human-Holo-Identität kann sie nicht laden.
            </p>

            <button id="memorialSaveButton" class="primaryButton" type="submit">
              Erinnerung sicher anlegen
            </button>
          </form>
        </div>
      </details>

      <details id="memorialCollectionPanel" class="memorialDetail" open>
        <summary>
          <span class="memorialDetailIcon memorialDetailIcon--flower" aria-hidden="true">🌻</span>
          <span class="memorialDetailCopy">
            <strong id="memorialCollectionTitle">Bewahrte Erinnerungen</strong>
            <small>Menschen, Geschichten und gemeinsame Lebensspuren</small>
          </span>
          <span id="memorialCount" class="memorialCount">0</span>
          <span class="memorialDetailChevron" aria-hidden="true">›</span>
        </summary>
        <div class="memorialDetailBody memorialDetailBody--collection">
          <section class="memorialCollection" aria-labelledby="memorialCollectionTitle">
            <div id="memorialList" class="memorialList" aria-live="polite"></div>
            <div id="memorialEmpty" class="memorialEmpty">
              <span aria-hidden="true">🌻</span>
              <strong>Noch keine Erinnerung angelegt.</strong>
              <p>Du entscheidest bewusst, was hier einen geschützten Platz erhält.</p>
            </div>
          </section>
        </div>
      </details>

      <details class="memorialDetail memorialDetail--boundary">
        <summary>
          <span class="memorialDetailIcon" aria-hidden="true">∞</span>
          <span class="memorialDetailCopy">
            <strong>Würde &amp; Sicherheit</strong>
            <small>Die unverrückbare Grenze von Human Holo</small>
          </span>
          <span class="memorialDetailChevron" aria-hidden="true">›</span>
        </summary>
        <div class="memorialDetailBody">
          <aside class="memorialBoundary" role="note"
            aria-label="Verbindliche Identitätsgrenze">
            <strong>Erinnerung bleibt Erinnerung.</strong>
            <p>
              Human Holo bewahrt Erinnerungen. Es behauptet niemals, der
              verstorbene Mensch selbst zu sein, und erzeugt keine täuschende
              Unterhaltung in dessen Namen.
            </p>
          </aside>
        </div>
      </details>
    </div>

    <input id="memorialAppendPhotoInput" type="file" accept="image/*" multiple hidden>

    <p class="memorialPageFooter">♾️ Forever Together · in Würde bewahrt</p>
  `;

  // Omas bewahrte Erinnerung steht bewusst vor dem Eingabebereich. Dadurch
  // bleibt das private Bild sichtbar, ohne von der schwebenden Navigation
  // verdeckt zu werden; die Bedien- und Fokusreihenfolge folgt der Darstellung.
  const memorialSections = memorialView.querySelector(".memorialSections");
  const memorialCollectionForLayout = memorialView.querySelector(
    "#memorialCollectionPanel"
  );
  const memorialCreateForLayout = memorialView.querySelector(
    "#memorialCreatePanel"
  );
  if (memorialSections && memorialCollectionForLayout && memorialCreateForLayout) {
    memorialSections.insertBefore(
      memorialCollectionForLayout,
      memorialCreateForLayout
    );
  }
  solApp.insertBefore(memorialView, currentHeader);

  const medicationView = document.createElement("section");
  medicationView.id = "medicationView";
  medicationView.className = "appView";
  medicationView.setAttribute("aria-labelledby", "medicationViewTitle");
  medicationView.innerHTML = `
    <div class="subHeader">
      <button class="iconButton" type="button" data-open-view="home"
        aria-label="Zurück zur Startseite">‹</button>
      <div id="medicationViewTitle" class="subHeaderTitle">Gesundheit</div>
      <span class="medicationHeaderIcon" aria-hidden="true">✚</span>
    </div>

    <section class="healthSelfCareIntro glassCard" aria-labelledby="healthSelfCareTitle">
      <p class="eyebrow">Gesundheitsbegleitung · Hilfe für zu Hause</p>
      <h2 id="healthSelfCareTitle">Leichte Beschwerden.<strong>Kleine Verletzungen.</strong></h2>
      <p>
        Beschreibe Pam’s Holo per Text oder Sprache, was los ist. Bei zum
        Beispiel milden Halsschmerzen oder einer kleinen oberflächlichen
        Schnittwunde nennt Holo vorsichtige Schritte für zu Hause und sagt dir,
        auf welche Warnzeichen du achten musst.
      </p>
      <ul class="healthSelfCareExamples">
        <li>konkrete, schonende Selbsthilfe statt pauschalem Arztverweis</li>
        <li>bei dringend, aber nicht lebensbedrohlich: 116117</li>
        <li>bei möglicher Lebensgefahr oder bleibenden Schäden: 112</li>
      </ul>
      <p class="healthSelfCareBoundary">
        Keine Diagnose und keine garantierte Entwarnung. Keine Wunddiagnose per
        Foto. Kein Alkohol für Jugendliche oder als Hausmittel, keine
        Zigaretten, Vapes, sonstigen Nikotinprodukte, Drogen oder Waffen.
      </p>
      <aside class="healthSelfCareDisclosure" role="note">
        Deine Beschreibung wird zur Antwort an <strong>ChatGPT/OpenAI</strong>
        übertragen. Frage und Antwort bleiben wie deine übrigen Gespräche
        ausschließlich ownergebunden in Pam’s Holos Vollzeitgedächtnis.
      </aside>
      <button id="healthSelfCareButton" class="primaryButton" type="button">
        Hinweis verstanden &amp; Beschwerden schildern
      </button>
      <a class="healthSelfCarePrivacyLink"
        href="./datenschutz-gesundheitsbegleitung.html" target="_blank"
        rel="noopener noreferrer">Datenschutz &amp; Grenzen ansehen</a>
    </section>

    <details class="humanHoloNoGoCard glassCard">
      <summary>Unverrückbare Human-Holo-No-Gos</summary>
      <ul>
        <li>Menschenhandel und Kinderhandel</li>
        <li>Prostitution, Vermittlung oder Werbung sexueller Dienstleistungen</li>
        <li>Todesstrafe und jede Unterstützung von Hinrichtungen</li>
        <li>Rache, Vergeltung und Selbstjustiz</li>
        <li>Waffen, Munition und alles zu Beschaffung oder Einsatz</li>
        <li>Drogen sowie Zigaretten, Vapes und sonstige Nikotinprodukte</li>
        <li>Tierhandel</li>
      </ul>
      <p>
        Betroffene bekommen immer Schutz- und Ausstiegshilfe. In akuter Gefahr
        nennt Holo zuerst 110 beziehungsweise 112.
      </p>
    </details>

    <section class="medicationIntro glassCard" aria-labelledby="medicationIntroTitle">
      <p class="eyebrow">Gesundheitsfunktion · Medikamentenerkennung</p>
      <h2 id="medicationIntroTitle">Verpackung zeigen.<strong>Angaben sicher lesen.</strong></h2>
      <p>
        Pam’s Holo kann ein von dir ausgewähltes Foto einer bedruckten
        Originalverpackung oder eines beschrifteten Blisters auslesen.
      </p>
    </section>

    <aside class="medicationDisclosure glassCard" role="note"
      aria-labelledby="medicationDisclosureTitle">
      <span class="medicationDisclosureIcon" aria-hidden="true">☝️</span>
      <div>
        <strong id="medicationDisclosureTitle">Vor dem Foto: deine ausdrückliche Freigabe</strong>
        <p>
          Das ausgewählte Foto wird einmalig zur Bilderkennung an
          <strong>ChatGPT/OpenAI</strong> übertragen. Human Holo übernimmt die
          Bilddatei selbst nicht in dein Vollzeitgedächtnis. Wie bisher bleiben
          dort dein Nachrichtentext, der Hinweis „Foto gesendet“ und Pam’s Holos
          Antwort ownergebunden gespeichert.
        </p>
      </div>
    </aside>

    <section class="medicationLimits glassCard" aria-labelledby="medicationLimitsTitle">
      <h3 id="medicationLimitsTitle">Was Pam’s Holo dabei darf</h3>
      <ul>
        <li>Medikamentenname, Wirkstoff und Wirkstärke ablesen</li>
        <li>Darreichungsform, Packungsgröße, Hersteller und Verfallsdatum nennen</li>
        <li>Unsicherheit sichtbar kennzeichnen</li>
      </ul>
      <h3>Feste Sicherheitsgrenzen</h3>
      <ul>
        <li>Keine lose Tablette oder Kapsel nach Farbe, Form oder Prägung bestimmen</li>
        <li>Keine persönliche Dosierung, Einnahme oder Behandlungsentscheidung festlegen</li>
        <li>Keine Diagnose stellen und nichts als sicher ausgeben, was nicht eindeutig lesbar ist</li>
      </ul>
    </section>

    <p class="medicationMedicalNotice" role="note">
      Human Holo ist kein Medizinprodukt. Die Funktion diagnostiziert,
      behandelt, heilt oder verhindert keine Krankheit und ersetzt keine
      individuelle Untersuchung oder ärztliche Beratung. Bei medizinischen
      Entscheidungen bitte immer medizinisches Fachpersonal fragen.
      <a href="./datenschutz-medikamentenerkennung.html" target="_blank"
        rel="noopener noreferrer">Datenschutz dieser Funktion ansehen</a>
    </p>

    <div class="medicationConsentActions" aria-label="Medikamentenerkennung freigeben">
      <button id="medicationCameraButton" class="primaryButton" type="button">
        Zustimmen &amp; Kamera öffnen
      </button>
      <button id="medicationGalleryButton" class="secondaryButton" type="button">
        Zustimmen &amp; Foto auswählen
      </button>
      <input id="medicationGalleryInput" type="file" accept="image/*" hidden>
    </div>

    <button id="medicationGeneralHealthButton" class="medicationGeneralHealthButton"
      type="button">
      Andere Gesundheitsfrage stellen <span aria-hidden="true">→</span>
    </button>
  `;
  // Medizinische Oberfläche ist rechtlich gesperrt und wird nicht eingebunden.

  const profileMemoryState = document.getElementById("profileMemoryState");
  if (profileMemoryState) {
    profileMemoryState.textContent = "Immer aktiv · updatefest";
  }

  const settingsViewRoot = document.getElementById("settingsView");
  const settingsSystemGroup = settingsViewRoot?.querySelector(
    '[aria-labelledby="settingsSystemTitle"]'
  );
  if (settingsViewRoot && settingsSystemGroup) {
    const privacySecurityGroup = document.createElement("section");
    privacySecurityGroup.id = "privacySecuritySettings";
    privacySecurityGroup.className = "settingsGroup glassCard";
    privacySecurityGroup.setAttribute(
      "aria-labelledby",
      "privacySecuritySettingsTitle"
    );
    privacySecurityGroup.innerHTML = `
      <div class="settingsGroupHeader">
        <span class="settingsGroupIcon" aria-hidden="true">⌾</span>
        <div>
          <h3 id="privacySecuritySettingsTitle">Datenschutz &amp; Sicherheit</h3>
          <p>Deine Rechte, Datenwege und unverrückbaren Schutzgrenzen</p>
        </div>
      </div>

      <p class="privacySecurityLead">
        Human Holo bleibt persönlich und ownergebunden. Berechtigungen und
        externe Verbindungen werden nur für die Funktion verwendet, die du
        bewusst auswählst.
      </p>

      <div class="privacySecurityFacts" aria-label="Verbindliche App-Angaben">
        <div>
          <strong>18+</strong>
          <span>Zielgruppe</span>
        </div>
        <div>
          <strong>Werbefrei</strong>
          <span>keine Werbe-ID</span>
        </div>
        <div>
          <strong>Verschlüsselt</strong>
          <span>bei Übertragung</span>
        </div>
        <div>
          <strong>Geschützt</strong>
          <span>ownergebundener Zugriff</span>
        </div>
      </div>

      <div class="actionList settingsActionList privacySecurityLinks">
        <a class="actionRow" href="./datenschutz.html" target="_blank"
          rel="noopener noreferrer">
          <span class="rowIcon" aria-hidden="true">◎</span>
          <span class="rowText">
            <span class="rowTitle">Datenschutzerklärung</span>
            <span class="rowMeta">Welche Daten freiwillig verarbeitet werden und wofür</span>
          </span>
          <span class="rowChevron" aria-hidden="true">›</span>
        </a>
        <a class="actionRow" href="./datenloeschung.html" target="_blank"
          rel="noopener noreferrer">
          <span class="rowIcon" aria-hidden="true">⌫</span>
          <span class="rowText">
            <span class="rowTitle">Daten löschen lassen</span>
            <span class="rowMeta">Löschweg, Umfang und mögliche Aufbewahrung</span>
          </span>
          <span class="rowChevron" aria-hidden="true">›</span>
        </a>
      </div>

      <details class="privacySecurityDetails">
        <summary>Datennutzung und feste Grenzen</summary>
        <ul>
          <li>
            Nachrichten, Medien, Sprache, Gesundheit, Kontakte, Kalender,
            Dateien, App-Aktivitäten und Gerätekennungen werden nur verarbeitet,
            soweit du die jeweilige Funktion nutzt oder freigibst.
          </li>
          <li>Kein Verkauf deiner Daten und keine Nutzung für Werbung.</li>
          <li>
            Der einschaltbare Draußen-Schutz erkennt Gesichtsflächen nur lokal
            auf dem Handy und verpixelt sie vor dem Senden. Er identifiziert
            keine Person und speichert kein Gesichtsprofil. Bei der Frontkamera
            kann ausschließlich die zentral gerahmte Kameranutzerin sichtbar
            bleiben; alle weiteren erkannten Gesichter werden verpixelt.
          </li>
          <li>
            Gesundheitsinformationen sind allgemeine Orientierung und ersetzen
            keine Diagnose, Behandlung oder persönliche Dosierungsentscheidung.
          </li>
          <li>
            Human Holo ist keine Behörden-App und enthält keine Finanzfunktionen.
          </li>
          <li>
            Menschen- und Kinderhandel, Prostitution, Todesstrafe, Vergeltung,
            Waffen, Drogen, Nikotinprodukte und Tierhandel bleiben absolute No-Gos.
          </li>
        </ul>
      </details>
    `;
    settingsViewRoot.insertBefore(privacySecurityGroup, settingsSystemGroup);

  }

  const notesView = document.createElement("section");
  notesView.id = "notesView";
  notesView.className = "appView";
  notesView.setAttribute("aria-labelledby", "notesViewTitle");
  notesView.innerHTML = `
    <div class="subHeader">
      <button class="iconButton" type="button" data-open-view="home"
        aria-label="Zurück zur Startseite">‹</button>
      <div id="notesViewTitle" class="subHeaderTitle">Wichtiges</div>
      <button id="notesVoiceButton" class="iconButton" type="button"
        aria-label="Wichtiges mit Pam’s Holo sprechen">◉</button>
    </div>

    <div class="notesIntro glassCard">
      <span class="notesIntroIcon" aria-hidden="true">★</span>
      <div>
        <h3>Pams Wichtiges in Pam’s Holo</h3>
        <p>Drei klare Bereiche – Kalender, Einkaufsliste und Notizen.</p>
      </div>
    </div>

    <div class="importantSections">
      <section id="calendarImportantSection"
        class="importantSection importantSection--calendar glassCard"
        aria-labelledby="calendarImportantTitle">
        <div class="importantSectionHeader">
          <span class="importantSectionIcon" aria-hidden="true">📅</span>
          <div>
            <h3 id="calendarImportantTitle">Kalender</h3>
            <p>Alles bleibt im Handy-Kalender. Holo zeigt einen Tag kompakt.</p>
          </div>
        </div>
        <div class="importantComposerFooter" aria-label="Kalenderverknüpfung">
          <span id="calendarAccessStatus">Kalenderverknüpfung wird geprüft …</span>
          <button id="calendarAccessButton" class="primaryButton" type="button">
            Zugriff prüfen
          </button>
        </div>
        <form id="calendarComposer" class="importantComposer">
          <label class="srOnly" for="calendarTextInput">Neuer Kalendereintrag</label>
          <textarea id="calendarTextInput" maxlength="1000" rows="2"
            placeholder="Zum Beispiel: Morgen 13 Uhr Zahnarzt"></textarea>
          <div class="importantComposerFooter">
            <span id="calendarComposerStatus">„Morgen“ genügt als Datum.</span>
            <button class="primaryButton" type="submit">In Kalender</button>
          </div>
        </form>
        <div class="calendarDayControls" aria-label="Kalendertag auswählen">
          <label class="calendarDayPicker" for="calendarDayInput">
            <span>Tag ansehen</span>
            <input id="calendarDayInput" type="date">
          </label>
          <button id="calendarTodayButton" class="calendarTodayButton"
            type="button">Heute</button>
        </div>
        <div class="importantSectionToolbar">
          <strong id="calendarCount">Heute · 0 Termine</strong>
          <button id="calendarRefreshButton" class="calendarRefreshButton"
            type="button">Aktualisieren</button>
        </div>
        <div id="calendarList" class="notesList calendarList"
          aria-live="polite"></div>
        <div id="calendarEmpty" class="notesEmpty importantInlineEmpty">
          <span aria-hidden="true">📅</span>
          <strong>Heute steht nichts im Kalender.</strong>
          <p>Wähle oben einen anderen Tag, ohne Holo zu verlassen.</p>
        </div>
      </section>

      <section id="shoppingImportantSection"
        class="importantSection importantSection--shopping glassCard"
        aria-labelledby="shoppingImportantTitle">
        <div class="importantSectionHeader">
          <span class="importantSectionIcon" aria-hidden="true">🛒</span>
          <div>
            <h3 id="shoppingImportantTitle">Einkaufsliste</h3>
            <p>Nur Einkäufe – getrennt von deinen Notizen.</p>
          </div>
        </div>
        <form id="shoppingComposer" class="importantComposer">
          <label class="srOnly" for="shoppingItemInput">Neuer Einkauf</label>
          <input id="shoppingItemInput" maxlength="300" autocomplete="off"
            placeholder="Was brauchst du?">
          <div class="importantComposerFooter">
            <span>Oder sag: „Milch bitte in die Einkaufsliste.“</span>
            <button class="primaryButton" type="submit">Hinzufügen</button>
          </div>
        </form>
        <div class="importantSectionToolbar">
          <strong id="shoppingCount">0 Artikel</strong>
        </div>
        <div id="shoppingList" class="notesList shoppingList" aria-live="polite"></div>
        <div id="shoppingEmpty" class="notesEmpty importantInlineEmpty">
          <span aria-hidden="true">🛒</span>
          <strong>Die Einkaufsliste ist leer.</strong>
          <p>Hier landet nur, was du ausdrücklich in die Einkaufsliste schickst.</p>
        </div>
      </section>

      <section id="notesImportantSection"
        class="importantSection importantSection--notes glassCard"
        aria-labelledby="notesImportantTitle">
        <div class="importantSectionHeader">
          <span class="importantSectionIcon" aria-hidden="true">✏️</span>
          <div>
            <h3 id="notesImportantTitle">Notizen</h3>
            <p>„Notiere …“ und „Schreib auf …“ landen nur hier.</p>
          </div>
        </div>
        <form id="noteComposer" class="noteComposer importantComposer">
          <label for="noteTextInput">Neue Notiz</label>
          <textarea id="noteTextInput" maxlength="10000" rows="4"
            placeholder="Was soll Pam’s Holo für dich notieren?"></textarea>
          <div class="noteComposerFooter importantComposerFooter">
            <span id="noteStorageHint">Bleibt in deiner Pam’s-Holo-Original-App auf diesem Handy.</span>
            <button class="primaryButton" type="submit">Notiz speichern</button>
          </div>
        </form>

        <div class="notesToolbar">
          <strong id="notesCount">0 Notizen</strong>
          <label class="notesSearch">
            <span class="srOnly">Notizen durchsuchen</span>
            <input id="notesSearchInput" type="search" autocomplete="off"
              placeholder="Notizen durchsuchen …">
          </label>
        </div>

        <div id="notesList" class="notesList" aria-live="polite"></div>
        <div id="notesEmpty" class="notesEmpty importantInlineEmpty">
          <span aria-hidden="true">✏️</span>
          <strong>Noch keine Notiz.</strong>
          <p>Schreib oben etwas hinein oder sag: „Sol, notiere …“</p>
        </div>
      </section>
    </div>
  `;
  solApp.insertBefore(notesView, currentHeader);

  const profileDisplayImage = document.querySelector("#profileView .profileLogo");
  profileDisplayImage.id = "profileDisplayImage";
  profileDisplayImage.alt = "Persönliches Bild von Pam’s Holo";

  const profileCloneImage = profileDisplayImage.cloneNode(true);
  profileCloneImage.id = "profileCloneImage";
  profileCloneImage.alt = "Bildvorschau für Pam’s Holo";

  const profilePhotoButton = document.createElement("button");
  profilePhotoButton.id = "profilePhotoButton";
  profilePhotoButton.className = "profilePhotoButton";
  profilePhotoButton.type = "button";
  profilePhotoButton.setAttribute(
    "aria-label",
    "Eigenes Bild für Pam’s Holo aus der Galerie auswählen"
  );
  profilePhotoButton.append(profileCloneImage);
  profilePhotoButton.insertAdjacentHTML(
    "beforeend",
    '<span id="profileMouthMarker" class="profileMouthMarker" hidden></span>'
  );

  const settingsPhotoEditor = document.getElementById("settingsPhotoEditor");
  settingsPhotoEditor.append(profilePhotoButton);
  settingsPhotoEditor.insertAdjacentHTML(
    "beforeend",
    '<button id="profilePhotoChangeButton" class="profilePhotoEdit" type="button">' +
      '✎ Bild ändern' +
    '</button>' +
    '<input id="profilePhotoInput" type="file" accept="image/*" hidden>' +
    '<div id="profilePhotoActions" class="profilePhotoActions" hidden>' +
      '<button id="profileMouthButton" type="button">👄 Mund festlegen</button>' +
      '<button id="profilePhotoResetButton" type="button">HUMAN-HOLO-Bild zurücksetzen</button>' +
    '</div>' +
    '<div id="profileMouthControls" class="profileMouthControls" hidden>' +
      '<strong>Mund genau einstellen</strong>' +
      '<p>Tippe zuerst im Bild genau auf die Mitte des Mundes.</p>' +
      '<label>Links ↔ Rechts <output id="profileMouthXValue">50.0 %</output>' +
        '<input id="profileMouthX" type="range" min="8" max="92" ' +
          'step="0.25" value="50"></label>' +
      '<label>Hoch ↕ Runter <output id="profileMouthYValue">58.0 %</output>' +
        '<input id="profileMouthY" type="range" min="8" max="92" ' +
          'step="0.25" value="58"></label>' +
      '<label>Mundbreite <output id="profileMouthWidthValue">16 %</output>' +
        '<input id="profileMouthWidth" type="range" min="6" max="32" ' +
          'step="0.5" value="16"></label>' +
      '<label>Mundhöhe <output id="profileMouthHeightValue">7.5 %</output>' +
        '<input id="profileMouthHeight" type="range" min="3.5" max="18" ' +
          'step="0.5" value="7.5"></label>' +
      '<div class="profileMouthConfirmRow">' +
        '<button id="profileMouthConfirmButton" class="confirm" type="button">' +
          '✅ Mundposition bestätigen' +
        '</button>' +
        '<button id="profileMouthCancelButton" type="button">Abbrechen</button>' +
      '</div>' +
    '</div>' +
    '<p id="profilePhotoHelp" class="profilePhotoHelp">' +
      'Hier änderst du das Bild · es bleibt nur auf diesem Gerät.' +
    '</p>'
  );

  const whatsappDriveRow = document.getElementById("whatsappDriveRow");
  document.getElementById("googleAccountRow")?.insertAdjacentHTML(
    "afterend",
    '<button id="youtubeChannelRow" class="serviceRow" type="button">' +
      '<span class="rowIcon" aria-hidden="true">▶</span>' +
      '<span class="rowText">' +
        '<span class="rowTitle">YouTube · Human Holo</span>' +
        '<span class="rowMeta">Offizieller Kanal von Pamela Nitschke &amp; Stefanie Hörath</span>' +
      '</span>' +
      '<span id="youtubeChannelStatus" class="serviceStatus connected">Verknüpft</span>' +
    '</button>' +
    '<button id="googleMapsRow" class="serviceRow" type="button">' +
      '<span class="rowIcon">⌖</span>' +
      '<span class="rowText">' +
        '<span class="rowTitle">Routenplaner · Google Maps</span>' +
        '<span class="rowMeta">Route per Text oder Sprache direkt starten</span>' +
      '</span>' +
      '<span id="googleMapsStatus" class="serviceStatus setup">Wird geprüft …</span>' +
    '</button>' +
    '<button id="alarmClockRow" class="serviceRow" type="button">' +
      '<span class="rowIcon">⏰</span>' +
      '<span class="rowText">' +
        '<span class="rowTitle">Handy-Wecker · Samsung Uhr</span>' +
        '<span class="rowMeta">Per Text oder Sprache direkt auf dem Handy stellen</span>' +
      '</span>' +
      '<span id="alarmClockStatus" class="serviceStatus setup">Wird geprüft …</span>' +
    '</button>' +
    '<button id="liveWeatherRow" class="serviceRow" type="button">' +
      '<span class="rowIcon">☀</span>' +
      '<span class="rowText">' +
        '<span class="rowTitle">Live-Wetter</span>' +
        '<span class="rowMeta">Aktuelle Wetterantwort über vorhandenes OpenAI</span>' +
      '</span>' +
      '<span id="liveWeatherStatus" class="serviceStatus setup">Wird geprüft …</span>' +
    '</button>'
  );

  const settingsConnectionsMeta = document.querySelector(
    "#settingsConnectionsButton .rowMeta"
  );
  if (settingsConnectionsMeta) {
    settingsConnectionsMeta.textContent =
      "YouTube, Google, Telefon, Samsung und SmartThings";
  }

  whatsappDriveRow.insertAdjacentHTML(
    "afterend",
    '<button id="heyHoSolRow" class="serviceRow" type="button">' +
      '<span class="rowIcon">✦</span>' +
      '<span class="rowText">' +
        '<span class="rowTitle">Sol-Weckruf</span>' +
        '<span class="rowMeta">„Hey Pam“</span>' +
      '</span>' +
      '<span id="heyHoSolStatus" class="serviceStatus setup">Wird geprüft …</span>' +
    '</button>' +
    '<div id="wakeModeChooser" class="wakeModeChooser" ' +
      'aria-label="Hey-Pam-Hörmodus auswählen">' +
      '<button type="button" data-wake-mode="off">Aus</button>' +
      '<button type="button" data-wake-mode="foreground">App offen</button>' +
      '<button type="button" data-wake-mode="background">Hintergrund</button>' +
    '</div>'
  );

  const phoneContactsRow = document.getElementById("phoneContactsRow");
  phoneContactsRow.insertAdjacentHTML(
    "afterend",
    '<button id="galaxyWatchRow" class="serviceRow" type="button">' +
      '<span class="rowIcon">⌚</span>' +
      '<span class="rowText">' +
        '<span class="rowTitle">Galaxy Watch 8</span>' +
        '<span class="rowMeta">Private Hinweise für Wecker, Route, Kalender und Notizen</span>' +
      '</span>' +
      '<span id="galaxyWatchStatus" class="serviceStatus setup">Wird geprüft …</span>' +
    '</button>' +
    '<button id="samsungGalleryRow" class="serviceRow" type="button">' +
      '<span class="rowIcon">▣</span>' +
      '<span class="rowText">' +
        '<span class="rowTitle">Samsung Galerie</span>' +
        '<span class="rowMeta">Galerie öffnen · dein Bild selbst auswählen</span>' +
      '</span>' +
      '<span id="samsungGalleryStatus" class="serviceStatus connected">Verbunden</span>' +
    '</button>' +
    '<button id="knownPersonRecognitionRow" class="serviceRow" type="button">' +
      '<span class="rowIcon">◉</span>' +
      '<span class="rowText">' +
        '<span class="rowTitle">Pam auf Fotos wiedererkennen</span>' +
        '<span class="rowMeta">Nur einzeln gesendete Fotos · jederzeit widerrufbar</span>' +
      '</span>' +
      '<span id="knownPersonRecognitionStatus" class="serviceStatus setup">Aus</span>' +
    '</button>' +
    '<button id="smartThingsRow" class="serviceRow" type="button">' +
      '<span class="rowIcon">⌂</span>' +
      '<span class="rowText">' +
        '<span class="rowTitle">SmartThings Zuhause</span>' +
        '<span class="rowMeta">Räume &amp; Geräte · Aktion erst nach Bestätigung</span>' +
      '</span>' +
      '<span id="smartThingsStatus" class="serviceStatus setup">Wird geprüft …</span>' +
    '</button>' +
    '<button id="samsungNotesRow" class="serviceRow" type="button">' +
      '<span class="rowIcon">✎</span>' +
      '<span class="rowText">' +
        '<span class="rowTitle">Samsung Notes · optional</span>' +
        '<span class="rowMeta">Nur bei manuellem Antippen öffnen · Zurufe speichern in Human Holo</span>' +
      '</span>' +
      '<span id="samsungNotesStatus" class="serviceStatus setup">Wird geprüft …</span>' +
    '</button>' +
    '<button id="explicitSaveRow" class="serviceRow" type="button" data-open-view="notes">' +
      '<span class="rowIcon">✓</span>' +
      '<span class="rowText">' +
        '<span class="rowTitle">Alltagsworker · Speichern auf Zuruf</span>' +
        '<span class="rowMeta">Echte Alltagsinhalte · nur auf deinen ausdrücklichen Auftrag</span>' +
      '</span>' +
      '<span id="explicitSaveStatus" class="serviceStatus connected">Aktiv ✅</span>' +
    '</button>' +
    '<button id="openClawAlltagPreviewRow" class="serviceRow" type="button" ' +
      'data-lab-only="true" aria-hidden="true" tabindex="-1" hidden>' +
      '<span class="rowIcon">⌘</span>' +
      '<span class="rowText">' +
        '<span class="rowTitle">Allt