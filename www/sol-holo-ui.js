const uiMarkup = "\n<section id=\"onboardingScreen\" aria-labelledby=\"welcomeTitle\">\n  <div class=\"welcomeContent\">\n    <img class=\"welcomeLogo\" src=\"human-holo-logo.png\" alt=\"Human Holo – Forever Together\">\n    <h2 id=\"welcomeTitle\" class=\"welcomeName\">HUMAN HOLO <span class=\"pamUnicorn\" role=\"img\" aria-label=\"Rosa Einhorn\">🦄</span></h2>\n    <p class=\"welcomeTagline\">\n      Dein persönliches digitales Ich.\n      <strong>Für alles, was dich ausmacht.</strong>\n    </p>\n  </div>\n  <div class=\"cosmicHorizon\" aria-hidden=\"true\"></div>\n  <button id=\"welcomeButton\" class=\"primaryButton welcomeButton\" type=\"button\">\n    <span>Willkommen bei Human Holo</span>\n    <span class=\"arrow\" aria-hidden=\"true\">→</span>\n  </button>\n  <div class=\"welcomeDots\" aria-hidden=\"true\">\n    <span></span><span></span><span></span>\n  </div>\n</section>\n\n<section id=\"homeView\" class=\"appView active\" aria-labelledby=\"homeTitle\">\n  <div class=\"screenHeader\">\n    <div class=\"homeBrand\">\n      <img class=\"screenLogo\" src=\"human-holo-logo.png\" alt=\"Human Holo – Forever Together\">\n      <span class=\"statusPill\">Online</span>\n    </div>\n    <button id=\"homeSettingsButton\" class=\"iconButton\" type=\"button\"\n      aria-label=\"Einstellungen öffnen\">⚙</button>\n  </div>\n\n  <div class=\"homeIntro\">\n    <p class=\"eyebrow\">Me, Myself &amp; I</p>\n    <h2 id=\"homeTitle\" class=\"viewTitle\">\n      Hallo Pam <span class=\"accent\">✦</span>\n    </h2>\n    <p class=\"viewLead\">Schön, dich zu sehen.<br>Womit wollen wir starten?</p>\n  </div>\n\n  <button id=\"homeOrbButton\" class=\"holoOrbButton\" type=\"button\"\n    aria-label=\"Sprachgespräch mit Sol starten\">\n    <span class=\"holoOrb\" aria-hidden=\"true\"></span>\n    <span class=\"orbHint\">Antippen und mit Sol sprechen</span>\n  </button>\n\n  <form id=\"homeComposer\" class=\"homeComposer glassCard\">\n    <input id=\"homeMessageInput\" type=\"text\" autocomplete=\"off\"\n      placeholder=\"Sprich oder schreib mit Sol …\" aria-label=\"Nachricht an Sol\">\n    <button id=\"homeMicButton\" class=\"composerButton\" type=\"button\"\n      aria-label=\"Sprachgespräch starten\">◉</button>\n    <button id=\"homeSendButton\" class=\"composerButton primary\" type=\"submit\"\n      aria-label=\"Nachricht senden\">→</button>\n  </form>\n\n  <div class=\"quickGrid\" aria-label=\"Schnellzugriffe\">\n    <button class=\"quickCard\" type=\"button\" data-open-view=\"memory\">\n      <span class=\"quickIcon\">◇</span>\n      <span class=\"quickTitle\">Erinnerungen</span>\n      <span class=\"quickMeta\">Dein Gedächtnis</span>\n      <span class=\"quickChevron\">›</span>\n    </button>\n    <button class=\"quickCard\" type=\"button\"\n      data-sol-prompt=\"Sol, zeig mir meine aktuellen Ziele.\">\n      <span class=\"quickIcon\">◎</span>\n      <span class=\"quickTitle\">Ziele</span>\n      <span class=\"quickMeta\">Pläne &amp; Fortschritt</span>\n      <span class=\"quickChevron\">›</span>\n    </button>\n    <button class=\"quickCard\" type=\"button\"\n      data-sol-prompt=\"Sol, was sollte ich heute im Blick behalten?\">\n      <span class=\"quickIcon\">▦</span>\n      <span class=\"quickTitle\">Heute</span>\n      <span id=\"todayCardMeta\" class=\"quickMeta\">Dein Überblick</span>\n      <span class=\"quickChevron\">›</span>\n    </button>\n    <button class=\"quickCard\" type=\"button\" data-open-view=\"services\">\n      <span class=\"quickIcon\">♡</span>\n      <span class=\"quickTitle\">Verbindungen</span>\n      <span class=\"quickMeta\">Google &amp; Handy</span>\n      <span class=\"quickChevron\">›</span>\n    </button>\n  </div>\n</section>\n\n<section id=\"memoryView\" class=\"appView\" aria-labelledby=\"memoryViewTitle\">\n  <div class=\"subHeader\">\n    <button class=\"iconButton\" type=\"button\" data-open-view=\"home\"\n      aria-label=\"Zurück zur Startseite\">‹</button>\n    <div id=\"memoryViewTitle\" class=\"subHeaderTitle\">Erinnerungen</div>\n    <button class=\"iconButton\" type=\"button\"\n      data-sol-prompt=\"Sol, was weißt du dauerhaft?\"\n      aria-label=\"Gedächtnis mit Sol besprechen\">···</button>\n  </div>\n\n  <div class=\"memoryVisual memoryInfinityVisual\" aria-hidden=\"true\">\n    <svg viewBox=\"0 0 360 220\" role=\"presentation\">\n      <defs>\n        <linearGradient id=\"memoryInfinityGradient\" x1=\"52\" y1=\"106\" x2=\"308\" y2=\"106\" gradientUnits=\"userSpaceOnUse\">\n          <stop offset=\"0\" stop-color=\"#d44dff\"/>\n          <stop offset=\".2\" stop-color=\"#a85cff\"/>\n          <stop offset=\".46\" stop-color=\"#756dff\"/>\n          <stop offset=\".7\" stop-color=\"#31c8ff\"/>\n          <stop offset=\"1\" stop-color=\"#66efff\"/>\n        </linearGradient>\n        <linearGradient id=\"memoryPlatformGradient\" x1=\"52\" y1=\"0\" x2=\"308\" y2=\"0\" gradientUnits=\"userSpaceOnUse\">\n          <stop offset=\"0\" stop-color=\"#8f49ff\" stop-opacity=\"0\"/>\n          <stop offset=\".28\" stop-color=\"#a256ff\" stop-opacity=\".88\"/>\n          <stop offset=\".7\" stop-color=\"#3bbfff\" stop-opacity=\".9\"/>\n          <stop offset=\"1\" stop-color=\"#52e6ff\" stop-opacity=\"0\"/>\n        </linearGradient>\n        <radialGradient id=\"memoryPlatformFill\" cx=\"50%\" cy=\"50%\" r=\"50%\">\n          <stop offset=\"0\" stop-color=\"#6f64ff\" stop-opacity=\".28\"/>\n          <stop offset=\".58\" stop-color=\"#3158f0\" stop-opacity=\".1\"/>\n          <stop offset=\"1\" stop-color=\"#050819\" stop-opacity=\"0\"/>\n        </radialGradient>\n        <filter id=\"memoryInfinityGlow\" x=\"-40%\" y=\"-70%\" width=\"180%\" height=\"240%\">\n          <feGaussianBlur stdDeviation=\"8\" result=\"blur\"/>\n          <feMerge>\n            <feMergeNode in=\"blur\"/>\n            <feMergeNode in=\"SourceGraphic\"/>\n          </feMerge>\n        </filter>\n        <filter id=\"memoryStarGlow\" x=\"-300%\" y=\"-300%\" width=\"700%\" height=\"700%\">\n          <feGaussianBlur stdDeviation=\"2.2\" result=\"blur\"/>\n          <feMerge>\n            <feMergeNode in=\"blur\"/>\n            <feMergeNode in=\"SourceGraphic\"/>\n          </feMerge>\n        </filter>\n      </defs>\n\n      <g class=\"memoryStarfield\" filter=\"url(#memoryStarGlow)\">\n        <circle cx=\"47\" cy=\"58\" r=\"1.6\" fill=\"#8d63ff\"/>\n        <circle cx=\"72\" cy=\"34\" r=\"1.1\" fill=\"#dca8ff\"/>\n        <circle cx=\"102\" cy=\"47\" r=\"1.3\" fill=\"#548cff\"/>\n        <circle cx=\"133\" cy=\"28\" r=\"1.1\" fill=\"#b687ff\"/>\n        <circle cx=\"224\" cy=\"33\" r=\"1.25\" fill=\"#62ddff\"/>\n        <circle cx=\"255\" cy=\"43\" r=\"1.65\" fill=\"#31baff\"/>\n        <circle cx=\"291\" cy=\"31\" r=\"1.05\" fill=\"#78e9ff\"/>\n        <circle cx=\"319\" cy=\"62\" r=\"1.35\" fill=\"#a56bff\"/>\n        <circle cx=\"36\" cy=\"116\" r=\"1.05\" fill=\"#4edcff\"/>\n        <circle cx=\"329\" cy=\"118\" r=\"1.15\" fill=\"#b05eff\"/>\n        <circle cx=\"93\" cy=\"170\" r=\"1.1\" fill=\"#8f79ff\"/>\n        <circle cx=\"270\" cy=\"169\" r=\"1.2\" fill=\"#4cdcff\"/>\n      </g>\n\n      <path class=\"memoryBeam memoryBeam--soft\" d=\"M180 18V192\"/>\n      <path class=\"memoryBeam memoryBeam--core\" d=\"M180 30V186\"/>\n\n      <ellipse class=\"memoryOrbit memoryOrbit--far\" cx=\"180\" cy=\"109\" rx=\"151\" ry=\"62\"/>\n      <ellipse class=\"memoryOrbit memoryOrbit--near\" cx=\"180\" cy=\"109\" rx=\"132\" ry=\"45\"/>\n\n      <g class=\"memoryInfinityGlyph\">\n        <path class=\"memoryInfinityAura\" filter=\"url(#memoryInfinityGlow)\"\n          d=\"M180 107 C157 73 140 56 112 56 C79 56 57 77 57 106 C57 136 80 155 112 155 C142 155 160 133 180 106 C200 79 218 57 248 57 C280 57 303 77 303 106 C303 136 281 155 248 155 C220 155 203 138 180 107\"/>\n        <path class=\"memoryInfinityRibbon memoryInfinityRibbon--shadow\"\n          d=\"M180 107 C157 73 140 56 112 56 C79 56 57 77 57 106 C57 136 80 155 112 155 C142 155 160 133 180 106 C200 79 218 57 248 57 C280 57 303 77 303 106 C303 136 281 155 248 155 C220 155 203 138 180 107\"/>\n        <path class=\"memoryInfinityRibbon memoryInfinityRibbon--main\"\n          d=\"M180 107 C157 73 140 56 112 56 C79 56 57 77 57 106 C57 136 80 155 112 155 C142 155 160 133 180 106 C200 79 218 57 248 57 C280 57 303 77 303 106 C303 136 281 155 248 155 C220 155 203 138 180 107\"/>\n        <path class=\"memoryInfinityHighlight\"\n          d=\"M180 103 C157 70 140 53 112 53 C79 53 57 74 57 103 C57 133 80 152 112 152 C142 152 160 130 180 103 C200 76 218 54 248 54 C280 54 303 74 303 103\"/>\n      </g>\n\n      <ellipse class=\"memoryPlatform memoryPlatform--glow\" cx=\"180\" cy=\"188\" rx=\"118\" ry=\"22\"/>\n      <ellipse class=\"memoryPlatform memoryPlatform--outer\" cx=\"180\" cy=\"188\" rx=\"126\" ry=\"21\"/>\n      <ellipse class=\"memoryPlatform memoryPlatform--inner\" cx=\"180\" cy=\"188\" rx=\"88\" ry=\"12\"/>\n      <path class=\"memoryPlatformLine\" d=\"M82 188H278\"/>\n      <circle class=\"memoryPlatformSpark\" cx=\"180\" cy=\"188\" r=\"2.3\"/>\n    </svg>\n  </div>\n  <div class=\"memoryIntro\">\n    <h3 class=\"featureHeadline\">\n      Dein Gedächtnis.<strong class=\"memoryForever\"><span class=\"memoryForeverWords\">Together forever!</span> <span class=\"memoryForeverSymbols\" aria-label=\"Funkeln, Erde und Unendlichkeit\">✨🌎♾️</span></strong>\n    </h3>\n    <p class=\"featureCopy\">\n      Pam’s Holo erinnert sich an das, was zu deinem persönlichen Ich gehört.\n      Deine Gespräche und Erfahrungen bleiben ausschließlich deinem\n      persönlichen Pam’s Holo zugeordnet.\n    </p>\n  </div>\n\n  <div class=\"actionList\">\n    <button class=\"actionRow\" type=\"button\"\n      data-sol-prompt=\"Sol, fasse unsere letzten Gespräche und Notizen zusammen.\">\n      <span class=\"rowIcon memoryRowIcon\">\n        <svg viewBox=\"0 0 32 32\" aria-hidden=\"true\" focusable=\"false\">\n          <path d=\"M7 6.5h18a3.5 3.5 0 0 1 3.5 3.5v8.5A3.5 3.5 0 0 1 25 22h-9.8L8 27v-5H7a3.5 3.5 0 0 1-3.5-3.5V10A3.5 3.5 0 0 1 7 6.5Z\"/>\n          <path d=\"M16 18.2s-4.2-2.4-4.2-5a2.5 2.5 0 0 1 4.2-1.8 2.5 2.5 0 0 1 4.2 1.8c0 2.6-4.2 5-4.2 5Z\"/>\n        </svg>\n      </span>\n      <span class=\"rowText\">\n        <span class=\"rowTitle\">Gespräche &amp; Notizen</span>\n        <span class=\"rowMeta\">Was wir zuletzt miteinander besprochen haben</span>\n      </span>\n      <span class=\"rowChevron\">›</span>\n    </button>\n    <button class=\"actionRow\" type=\"button\"\n      data-sol-prompt=\"Sol, welche Lebensereignisse weißt du von mir?\">\n      <span class=\"rowIcon memoryRowIcon\">\n        <svg viewBox=\"0 0 32 32\" aria-hidden=\"true\" focusable=\"false\">\n          <rect x=\"4.5\" y=\"7\" width=\"23\" height=\"21\" rx=\"3.5\"/>\n          <path d=\"M10 4.5v5M22 4.5v5M4.5 12.5h23\"/>\n          <path d=\"m16 15.2 1.3 2.7 3 .4-2.2 2.1.6 3-2.7-1.5-2.7 1.5.6-3-2.2-2.1 3-.4 1.3-2.7Z\"/>\n        </svg>\n      </span>\n      <span class=\"rowText\">\n        <span class=\"rowTitle\">Lebensereignisse</span>\n        <span class=\"rowMeta\">Wichtige Momente, die zu dir gehören</span>\n      </span>\n      <span class=\"rowChevron\">›</span>\n    </button>\n    <button class=\"actionRow\" type=\"button\"\n      data-sol-prompt=\"Sol, welche Vorlieben und Gewohnheiten kennst du von mir?\">\n      <span class=\"rowIcon memoryRowIcon\">\n        <svg viewBox=\"0 0 32 32\" aria-hidden=\"true\" focusable=\"false\">\n          <path d=\"M16 27.5S4.8 21 4.8 12.7A6.3 6.3 0 0 1 16 8.8a6.3 6.3 0 0 1 11.2 3.9C27.2 21 16 27.5 16 27.5Z\"/>\n        </svg>\n      </span>\n      <span class=\"rowText\">\n        <span class=\"rowTitle\">Vorlieben &amp; Gewohnheiten</span>\n        <span class=\"rowMeta\">Was dich ausmacht und dir wichtig ist</span>\n      </span>\n      <span class=\"rowChevron\">›</span>\n    </button>\n  </div>\n\n  <button id=\"manageMemoriesButton\" class=\"secondaryButton\" type=\"button\">\n    Erinnerungen mit Sol ansehen <span aria-hidden=\"true\">→</span>\n  </button>\n</section>\n\n<section id=\"servicesView\" class=\"appView\" aria-labelledby=\"servicesViewTitle\">\n  <div class=\"subHeader\">\n    <button class=\"iconButton\" type=\"button\" data-open-view=\"settings\"\n      aria-label=\"Zurück zu den Einstellungen\">‹</button>\n    <div id=\"servicesViewTitle\" class=\"subHeaderTitle\">Verbindungen</div>\n    <button id=\"refreshServicesButton\" class=\"iconButton\" type=\"button\"\n      aria-label=\"Verbindungsstatus neu prüfen\">↻</button>\n  </div>\n\n  <div class=\"serviceOrbit\" aria-hidden=\"true\">\n    <div class=\"orbitRing\"></div>\n    <img class=\"orbitLogo\" src=\"human-holo-logo.png\" alt=\"\">\n    <span class=\"orbitNode google\">G</span>\n    <span class=\"orbitNode whatsapp\">W</span>\n    <span class=\"orbitNode phone\">☎</span>\n    <span class=\"orbitNode contacts\">♙</span>\n  </div>\n\n  <div class=\"servicesIntro\">\n    <h3 class=\"featureHeadline\">\n      Together<strong>forever!</strong>\n    </h3>\n    <p class=\"featureCopy\">\n      Pam’s Holo verbindet nur die Dienste, die du wirklich möchtest.\n      Jede Freigabe wird einzeln erteilt und kann wieder ausgeschaltet werden.\n    </p>\n  </div>\n\n  <div class=\"actionList\">\n    <button id=\"googleAccountRow\" class=\"serviceRow\" type=\"button\">\n      <span class=\"rowIcon\">G</span>\n      <span class=\"rowText\">\n        <span class=\"rowTitle\">Google‑Konto</span>\n        <span class=\"rowMeta\">Google Kalender und freigegebene Google‑Dienste</span>\n      </span>\n      <span id=\"googleAccountStatus\" class=\"serviceStatus\">Wird geprüft …</span>\n    </button>\n\n    <button id=\"whatsappDriveRow\" class=\"serviceRow\" type=\"button\">\n      <span class=\"rowIcon\">W</span>\n      <span class=\"rowText\">\n        <span class=\"rowTitle\">WhatsApp‑Fahrmodus</span>\n        <span class=\"rowMeta\">Nachrichten beim Autofahren sicher vorlesen</span>\n      </span>\n      <span id=\"whatsappDriveStatus\" class=\"serviceStatus setup\">\n        Einrichtung nötig\n      </span>\n    </button>\n\n    <button id=\"phoneContactsRow\" class=\"serviceRow\" type=\"button\">\n      <span class=\"rowIcon\">☎</span>\n      <span class=\"rowText\">\n        <span class=\"rowTitle\">Telefon &amp; Kontakte</span>\n        <span class=\"rowMeta\">Kontakt finden, Anruf erst nach Bestätigung</span>\n      </span>\n      <span id=\"phoneContactsStatus\" class=\"serviceStatus setup\">\n        Freigabe nötig\n      </span>\n    </button>\n  </div>\n\n  <button id=\"manageServicesButton\" class=\"secondaryButton\" type=\"button\">\n    Dienste und Freigaben verwalten <span aria-hidden=\"true\">+</span>\n  </button>\n  <p class=\"permissionNote\">\n    Pam’s Holo liest keine WhatsApp‑Nachricht, keinen Kontakt und kein\n    Telefonbuch ohne deine ausdrückliche Android‑Freigabe.\n  </p>\n</section>\n\n<section id=\"profileView\" class=\"appView\" aria-labelledby=\"profileViewTitle\">\n  <div class=\"subHeader\">\n    <button class=\"iconButton\" type=\"button\" data-open-view=\"home\"\n      aria-label=\"Zurück zur Startseite\">‹</button>\n    <div id=\"profileViewTitle\" class=\"subHeaderTitle\">Profil</div>\n    <button id=\"profileSettingsButton\" class=\"iconButton\" type=\"button\"\n      data-open-view=\"settings\" aria-label=\"Einstellungen öffnen\">⚙</button>\n  </div>\n\n  <div class=\"profileHero profileHero--clean glassCard\">\n    <img class=\"profileLogo\" src=\"human-holo-logo.png\" alt=\"Human Holo – Forever Together\">\n    <h3 class=\"profileName\">Pam’s Holo <span class=\"pamUnicorn pamUnicorn--profile\" role=\"img\" aria-label=\"Rosa Einhorn\">🦄</span></h3>\n    <p class=\"profileMeta\">\n      Dein persönlicher Klon · dein persönliches digitales Ich\n    </p>\n  </div>\n</section>\n\n<section id=\"settingsView\" class=\"appView\" aria-labelledby=\"settingsViewTitle\">\n  <div class=\"subHeader\">\n    <button class=\"iconButton\" type=\"button\" data-open-view=\"profile\"\n      aria-label=\"Zurück zum Profil\">‹</button>\n    <div id=\"settingsViewTitle\" class=\"subHeaderTitle\">Einstellungen</div>\n    <span></span>\n  </div>\n\n  <div class=\"settingsIntro\">\n    <p class=\"eyebrow\">Alles an seinem Platz</p>\n    <h2>Deine Einstellungen</h2>\n    <p>Hier bestimmst du, wie Pam’s Holo aussieht, spricht, hört und sich verbindet.</p>\n  </div>\n\n  <section class=\"settingsGroup glassCard\" aria-labelledby=\"settingsAppearanceTitle\">\n    <div class=\"settingsGroupHeader\">\n      <span class=\"settingsGroupIcon\" aria-hidden=\"true\">▣</span>\n      <div>\n        <h3 id=\"settingsAppearanceTitle\">Bild &amp; Aussehen</h3>\n        <p>Profilbild, Gesichtserkennung und Lip-Sync</p>\n      </div>\n    </div>\n    <div id=\"settingsPhotoEditor\" class=\"settingsPhotoEditor\"></div>\n  </section>\n\n  <section class=\"settingsGroup glassCard\" aria-labelledby=\"settingsVoiceTitle\">\n    <div class=\"settingsGroupHeader\">\n      <span class=\"settingsGroupIcon\" aria-hidden=\"true\">◉</span>\n      <div>\n        <h3 id=\"settingsVoiceTitle\">Stimme &amp; „Hey Pam“</h3>\n        <p>Stimme, Lautstärke, Weckruf und Hörmodus</p>\n      </div>\n    </div>\n    <div id=\"settingsVoiceSlot\"></div>\n    <div class=\"settingsSubsection\">\n      <strong>Sprachlautstärke</strong>\n      <div id=\"settingsVolumeChooser\" class=\"settingsChoiceRow\" aria-label=\"Sprachlautstärke auswählen\">\n        <button type=\"button\" data-volume-target=\"volumeMute\">Stumm</button>\n        <button type=\"button\" data-volume-target=\"volumeLow\">Leise</button>\n        <button type=\"button\" data-volume-target=\"volumeNormal\">Normal</button>\n      </div>\n    </div>\n    <div id=\"settingsWakeSlot\" class=\"settingsWakeSlot\"></div>\n  </section>\n\n  <section class=\"settingsGroup glassCard\" aria-labelledby=\"settingsMemoryTitle\">\n    <div class=\"settingsGroupHeader\">\n      <span class=\"settingsGroupIcon\" aria-hidden=\"true\">✧</span>\n      <div>\n        <h3 id=\"settingsMemoryTitle\">Gedächtnis &amp; Verbindungen</h3>\n        <p>Deine Daten, Konten, Geräte und Freigaben</p>\n      </div>\n    </div>\n\n    <div class=\"profileStatusGrid settingsStatusGrid\">\n      <div class=\"profileStatus glassCard\">\n        <strong>Vollzeitgedächtnis</strong>\n        <span id=\"profileMemoryState\">Aktiv</span>\n      </div>\n      <div class=\"profileStatus glassCard\">\n        <strong>Google‑Konto</strong>\n        <span id=\"profileGoogleState\">Wird geprüft …</span>\n      </div>\n    </div>\n\n    <div class=\"actionList settingsActionList\">\n      <button id=\"settingsMemoryButton\" class=\"actionRow\" type=\"button\"\n        data-open-view=\"memory\">\n        <span class=\"rowIcon\">✧</span>\n        <span class=\"rowText\">\n          <span class=\"rowTitle\">Gedächtnis verwalten</span>\n          <span class=\"rowMeta\">Erinnerungen ansehen und mit Sol besprechen</span>\n        </span>\n        <span class=\"rowChevron\">›</span>\n      </button>\n      <button id=\"settingsConnectionsButton\" class=\"actionRow\" type=\"button\"\n        data-open-view=\"services\">\n        <span class=\"rowIcon\">⌯</span>\n        <span class=\"rowText\">\n          <span class=\"rowTitle\">Verbindungen &amp; Berechtigungen</span>\n          <span class=\"rowMeta\">Google, Telefon, Samsung, Health und SmartThings</span>\n        </span>\n        <span class=\"rowChevron\">›</span>\n      </button>\n    </div>\n  </section>\n\n  <section class=\"settingsGroup glassCard\" aria-labelledby=\"settingsSystemTitle\">\n    <div class=\"settingsGroupHeader\">\n      <span class=\"settingsGroupIcon\" aria-hidden=\"true\">⚙</span>\n      <div>\n        <h3 id=\"settingsSystemTitle\">App &amp; System</h3>\n        <p>Status, Diagnose und Willkommensseite</p>\n      </div>\n    </div>\n    <div class=\"actionList settingsActionList\">\n      <button id=\"openSystemMenuButton\" class=\"actionRow\" type=\"button\"\n        aria-expanded=\"false\" aria-controls=\"settingsSystemDetails\">\n        <span class=\"rowIcon\">⚙</span>\n        <span class=\"rowText\">\n          <span class=\"rowTitle\">Systemstatus</span>\n          <span class=\"rowMeta\">Chat, Mikrofon, Gedächtnis und Lip-Sync</span>\n        </span>\n        <span class=\"rowChevron\">›</span>\n      </button>\n      <button id=\"showWelcomeAgainButton\" class=\"actionRow\" type=\"button\">\n        <span class=\"rowIcon\">✦</span>\n        <span class=\"rowText\">\n          <span class=\"rowTitle\">Willkommensseite erneut zeigen</span>\n          <span class=\"rowMeta\">Die Willkommensseite von Pam’s Holo öffnen</span>\n        </span>\n        <span class=\"rowChevron\">›</span>\n      </button>\n    </div>\n    <div id=\"settingsSystemDetails\" class=\"settingsSystemDetails\" hidden></div>\n  </section>\n</section>\n";

(() => {
  "use strict";

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

    <button id="homeImportantButton" class="humanHoloImportantCard glassCard"
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
      <button class="humanHoloAreaCard humanHoloAreaCard--health" type="button"
        data-open-view="medication">
        <span class="humanHoloAreaIcon" aria-hidden="true">
          <svg viewBox="0 0 32 32"><path d="M16 27S5.5 21 5.5 13.4A6 6 0 0 1 16 9.5a6 6 0 0 1 10.5 3.9C26.5 21 16 27 16 27Z"/><path d="M8.5 17h4l2-4 3.2 8 2.2-4H24"/></svg>
        </span>
        <span>Gesundheit</span>
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

    <section class="memorialIntro glassCard" aria-labelledby="memorialIntroTitle">
      <p class="eyebrow">Eigenständiger Human-Holo-Bereich</p>
      <h2 id="memorialIntroTitle">Erinnerungen bewahren.<strong>Würde schützen.</strong></h2>
      <p>
        Bewahre Fotos, Videos, Sprachaufnahmen, Geschichten, Texte und
        biografische Erinnerungen an einen verstorbenen Menschen respektvoll
        und nur in deinem eigenen Human Holo.
      </p>
    </section>

    <aside class="memorialBoundary glassCard" role="note"
      aria-label="Verbindliche Identitätsgrenze">
      <span class="memorialBoundaryIcon" aria-hidden="true">∞</span>
      <div>
        <strong>Klare und unverrückbare Grenze</strong>
        <p>
          Human Holo bewahrt Erinnerungen. Es behauptet niemals, der
          verstorbene Mensch selbst zu sein, und erzeugt keine täuschende
          Unterhaltung in dessen Namen.
        </p>
      </div>
    </aside>

    <div class="memorialKinds" aria-label="Bewahrbare Erinnerungsarten">
      <div class="memorialKind glassCard">
        <span aria-hidden="true">▧</span>
        <strong>Fotos &amp; Videos</strong>
      </div>
      <div class="memorialKind glassCard">
        <span aria-hidden="true">◉</span>
        <strong>Stimme &amp; Texte</strong>
      </div>
      <div class="memorialKind glassCard">
        <span aria-hidden="true">✦</span>
        <strong>Geschichten &amp; Lebensspuren</strong>
      </div>
    </div>

    <form id="memorialForm" class="memorialForm glassCard">
      <div class="memorialFormHeading">
        <span aria-hidden="true">＋</span>
        <div>
          <h3>Eine Erinnerung bewahren</h3>
          <p>Erst nach deiner ausdrücklichen Bestätigung wird etwas gespeichert.</p>
        </div>
      </div>

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

    <section class="memorialCollection" aria-labelledby="memorialCollectionTitle">
      <div class="memorialCollectionHeader">
        <h3 id="memorialCollectionTitle">Bewahrte Erinnerungen</h3>
        <span id="memorialCount">0</span>
      </div>
      <div id="memorialList" class="memorialList" aria-live="polite"></div>
      <div id="memorialEmpty" class="memorialEmpty glassCard">
        <span aria-hidden="true">🌻</span>
        <strong>Noch keine Erinnerung angelegt.</strong>
        <p>Du entscheidest bewusst, was hier einen geschützten Platz erhält.</p>
      </div>
    </section>
  `;
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
  solApp.insertBefore(medicationView, currentHeader);

  const profileMemoryState = document.getElementById("profileMemoryState");
  if (profileMemoryState) {
    profileMemoryState.textContent = "Immer aktiv · updatefest";
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
            <p>Datum oder „morgen“ plus Uhrzeit kommt hierhin.</p>
          </div>
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
    '<button id="healthConnectRow" class="serviceRow" type="button">' +
      '<span class="rowIcon">♡</span>' +
      '<span class="rowText">' +
        '<span class="rowTitle">Health Connect</span>' +
        '<span class="rowMeta">Samsung Health &amp; andere Quellen · nur lesen</span>' +
      '</span>' +
      '<span id="healthConnectStatus" class="serviceStatus setup">Wird geprüft …</span>' +
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
        '<span class="rowTitle">Alltagsworker · fiktiver Test</span>' +
        '<span class="rowMeta">Nur Testdaten lesen · Vorschlag sichtbar zurückgeben</span>' +
      '</span>' +
      '<span id="openClawAlltagPreviewStatus" class="serviceStatus setup">Bewusst starten</span>' +
    '</button>' +
    '<section id="openClawAlltagPreviewResult" class="openClawPreviewResult" ' +
      'aria-labelledby="openClawAlltagPreviewResultTitle" aria-live="polite" hidden>' +
      '<div class="openClawPreviewHeader">' +
        '<span aria-hidden="true">⌘</span>' +
        '<div>' +
          '<strong id="openClawAlltagPreviewResultTitle">Alltagsworker-Vorschau</strong>' +
          '<small id="openClawAlltagPreviewMeta">Fiktive Daten · nur lesen</small>' +
        '</div>' +
      '</div>' +
      '<div id="openClawAlltagPreviewContent"></div>' +
      '<p class="openClawPreviewGuard">Keine echten Daten · nichts gespeichert · keine Aktion ausgeführt.</p>' +
    '</section>'
  );

  document.querySelector("#servicesView .permissionNote").textContent =
    "Nach deiner Android-Freigabe kann Pam’s Holo alle Gerätekontakte lokal " +
    "durchsuchen. Das Telefonbuch wird nicht hochgeladen; verwendet wird nur " +
    "der von dir genannte, eindeutig geprüfte Empfänger. WhatsApp-Nachrichten " +
    "werden vollständig angezeigt und erst von dir in WhatsApp gesendet. " +
    "Bild, Notiz und Health-Wert bleiben ohne deine sichtbare Auswahl oder Freigabe gesperrt. " +
    "Speichern auf Zuruf ist aktiv: Ein ausdrücklicher Speicherauftrag gilt für " +
    "normale Alltagsinhalte als Freigabe; " +
    "Passwörter, PIN, TAN, Token und Schlüssel bleiben gesperrt. " +
    "Geräte werden erst nach einer einmaligen Gerätefreigabe steuerbar.";

  document.querySelector("#phoneContactsRow .rowMeta").textContent =
    "Alle Gerätekontakte lokal finden · WhatsApp auf ausdrücklichen Auftrag automatisch senden";

  const drawerVoiceSettings = document.querySelector("#drawer .drawerVoiceSettings");
  if (drawerVoiceSettings) {
    document.getElementById("settingsVoiceSlot").append(drawerVoiceSettings);
  }

  const settingsWakeSlot = document.getElementById("settingsWakeSlot");
  settingsWakeSlot.append(
    document.getElementById("heyHoSolRow"),
    document.getElementById("wakeModeChooser")
  );

  const settingsSystemDetails = document.getElementById("settingsSystemDetails");
  const aiProviderPolicy = window.HumanHoloAIProviderPolicy;
  const aiProviderStatus = document.createElement("div");
  aiProviderStatus.id = "aiProviderStatus";
  aiProviderStatus.className = "settingsSystemStatus";
  aiProviderStatus.textContent =
    aiProviderPolicy?.openAIRequiredWheneverPossible &&
    aiProviderPolicy?.provider === "openai"
      ? "✦ Human Holo: ChatGPT/OpenAI zuerst und verbindlich · Ausnahme nur, wenn technisch unmöglich und von Pam freigegeben."
      : "⚠️ ChatGPT/OpenAI-Bindung konnte nicht bestätigt werden.";
  settingsSystemDetails.append(aiProviderStatus);

  ["chatStatus", "micStatus", "memoryStatus", "lipSyncStatus"].forEach((id) => {
    const status = document.getElementById(id);
    if (status) {
      status.classList.add("settingsSystemStatus");
      settingsSystemDetails.append(status);
    }
  });

  const chatView = document.createElement("section");
  chatView.id = "chatView";
  chatView.className = "appView";
  chatView.setAttribute("aria-label", "Chat mit Pam’s Holo");
  solApp.insertBefore(chatView, currentHeader);

  [
    currentHeader,
    currentChatPanel,
    currentControls,
    currentSolStage
  ].forEach((element) => chatView.appendChild(element));

  currentBottomNav.setAttribute("aria-label", "Hauptnavigation");
  currentBottomNav.innerHTML =
    '<button class="navItem active" type="button" data-view="home" aria-label="Start">' +
      '<span class="navIcon" aria-hidden="true"><svg viewBox="0 0 24 24">' +
        '<path d="M4 10.8 12 4l8 6.8V20h-5v-5H9v5H4Z"/></svg></span>' +
      '<span class="navLabel">Start</span>' +
    '</button>' +
    '<button class="navItem" type="button" data-view="chat" aria-label="Chat">' +
      '<span class="navIcon" aria-hidden="true"><svg viewBox="0 0 24 24">' +
        '<path d="M5 5.5h14v10H9l-4 3v-13Z"/></svg></span>' +
      '<span class="navLabel">Chat</span>' +
    '</button>' +
    '<button class="navItem" type="button" data-view="memory" aria-label="Erinnerungen">' +
      '<span class="navIcon" aria-hidden="true"><svg viewBox="0 0 24 24">' +
        '<path d="M12 3 15 9l6 3-6 3-3 6-3-6-6-3 6-3 3-6Z"/></svg></span>' +
      '<span class="navLabel">Erinnerungen</span>' +
    '</button>' +
    '<button class="navItem" type="button" data-view="services" aria-label="Dienste">' +
      '<span class="navIcon" aria-hidden="true"><svg viewBox="0 0 24 24">' +
        '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="7" r="2.5"/>' +
        '<circle cx="18" cy="17" r="2.5"/><path d="m8.4 11 7.2-3M8.4 13l7.2 3"/></svg></span>' +
      '<span class="navLabel">Dienste</span>' +
    '</button>' +
    '<button class="navItem" type="button" data-view="profile" aria-label="Profil">' +
      '<span class="navIcon" aria-hidden="true"><svg viewBox="0 0 24 24">' +
        '<circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6"/></svg></span>' +
      '<span class="navLabel">Profil</span>' +
    '</button>';

  const uiToast = document.createElement("div");
  uiToast.id = "uiToast";
  uiToast.setAttribute("role", "status");
  uiToast.setAttribute("aria-live", "polite");
  document.body.appendChild(uiToast);

  const views = {
    home: document.getElementById("homeView"),
    chat: chatView,
    notes: notesView,
    memory: document.getElementById("memoryView"),
    memorial: memorialView,
    medication: medicationView,
    services: document.getElementById("servicesView"),
    profile: document.getElementById("profileView"),
    settings: document.getElementById("settingsView")
  };

  const introKey = "sol-holo-intro-v2-seen";
  const pamClonePhotoKey = "sol-holo:pam-sol:clone-photo:v2";
  const pamCloneMouthKey = "sol-holo:pam-sol:clone-mouth:v2";
  const legacyClonePhotoKey = "sol-holo-clone-photo-v1";
  const legacyCloneMouthKey = "sol-holo-clone-mouth-v1";
  const legacyClonePhotoQuarantineKey =
    "sol-holo:unassigned:clone-photo:v1:quarantine";
  const legacyCloneMouthQuarantineKey =
    "sol-holo:unassigned:clone-mouth:v1:quarantine";
  const legacyCloneQuarantineMetadataKey =
    "sol-holo:unassigned:clone-appearance:v1:quarantine-meta";
  const cloneAppearanceMigrationKey =
    "sol-holo:pam-sol:clone-appearance-migration:v2";
  const pamCloneMetadataKey =
    "sol-holo:pam-sol:clone-appearance-meta:v2";
  const unverifiedPamClonePhotoQuarantineKey =
    "sol-holo:unassigned:clone-photo:v2:quarantine";
  const unverifiedPamCloneMouthQuarantineKey =
    "sol-holo:unassigned:clone-mouth:v2:quarantine";
  const unverifiedPamCloneMetadataQuarantineKey =
    "sol-holo:unassigned:clone-appearance:v2:quarantine-meta";
  const pamNotesStorageKey = "pams-holo-original-notes-v1";
  const memorialDatabaseName = "human-holo-erinnerung-vermaechtnis-v1";
  const memorialStoreName = "ownerMemories";
  const memorialIdentityBoundary =
    "Human Holo bewahrt Erinnerungen und behauptet niemals, " +
    "der verstorbene Mensch selbst zu sein.";
  const maxMemorialMediaFiles = 8;
  const maxMemorialMediaBytes = 20 * 1024 * 1024;
  const maxMemorialTotalBytes = 64 * 1024 * 1024;
  const medicationRecognitionPrompt =
    "Bitte erkenne diese Medikamentenverpackung oder diesen beschrifteten Blister und lies nur die eindeutig sichtbaren Packungsangaben vor.";
  const healthSelfCarePrompt =
    "Ich möchte sichere Hilfe für zu Hause bei einer leichten Beschwerde oder kleinen Verletzung. Bitte frage mich zuerst, was los ist, und prüfe die entscheidenden Warnzeichen.";
  const medicationRecognitionDisclosure =
    "Gesundheitsfunktion · Medikamentenerkennung\n\n" +
    "Das ausgewählte Foto wird einmalig zur Bilderkennung an ChatGPT/OpenAI übertragen. Human Holo speichert die Bilddatei selbst nicht im Vollzeitgedächtnis; dein Nachrichtentext, der Hinweis ‚Foto gesendet‘ und Pam’s Holos Antwort bleiben dort ownergebunden gespeichert.\n\n" +
    "Human Holo ist kein Medizinprodukt. Es gibt keine persönliche Dosierung, Einnahme, Diagnose oder Behandlung vor. Lose Tabletten oder Kapseln werden nicht anhand von Farbe, Form oder Prägung bestimmt.\n\n" +
    "Möchtest du dieses eine Foto jetzt freigeben?";
  const medicationRecognitionPattern =
    /\b(?:arznei(?:mittel)?|beipackzettel|blister|kapseln?|medikament[\p{L}-]*|packungsbeilage|pillen?|tabletten?|wirkstoff|wirkstärke)\b/iu;
  const medicationRecognitionActionPattern =
    /\b(?:auslesen|erkenn(?:e|en|st|t)?|identifizieren|lies|lesen|prüfen|sag(?:en)?|welche[rs]?|was\s+ist|zeig(?:en)?)\b/iu;
  let medicationConsentExpiresAt = 0;
  const onboarding = document.getElementById("onboardingScreen");
  const calendarComposer = document.getElementById("calendarComposer");
  const calendarTextInput = document.getElementById("calendarTextInput");
  const calendarComposerStatus = document.getElementById("calendarComposerStatus");
  const shoppingComposer = document.getElementById("shoppingComposer");
  const shoppingItemInput = document.getElementById("shoppingItemInput");
  const shoppingList = document.getElementById("shoppingList");
  const shoppingEmpty = document.getElementById("shoppingEmpty");
  const shoppingCount = document.getElementById("shoppingCount");
  const noteComposer = document.getElementById("noteComposer");
  const noteTextInput = document.getElementById("noteTextInput");
  const notesSearchInput = document.getElementById("notesSearchInput");
  const notesList = document.getElementById("notesList");
  const notesEmpty = document.getElementById("notesEmpty");
  const notesCount = document.getElementById("notesCount");
  const memorialForm = document.getElementById("memorialForm");
  const memorialPersonName = document.getElementById("memorialPersonName");
  const memorialRelationship = document.getElementById("memorialRelationship");
  const memorialStory = document.getElementById("memorialStory");
  const memorialMediaInput = document.getElementById("memorialMediaInput");
  const memorialMediaStatus = document.getElementById("memorialMediaStatus");
  const memorialRightsConfirmation = document.getElementById(
    "memorialRightsConfirmation"
  );
  const memorialSaveButton = document.getElementById("memorialSaveButton");
  const memorialList = document.getElementById("memorialList");
  const memorialEmpty = document.getElementById("memorialEmpty");
  const memorialCount = document.getElementById("memorialCount");
  const profilePhotoInput = document.getElementById("profilePhotoInput");
  const profilePhotoChangeButton = document.getElementById(
    "profilePhotoChangeButton"
  );
  const profilePhotoActions = document.getElementById("profilePhotoActions");
  const profileMouthButton = document.getElementById("profileMouthButton");
  const profilePhotoResetButton = document.getElementById(
    "profilePhotoResetButton"
  );
  const profilePhotoHelp = document.getElementById("profilePhotoHelp");
  const profileMouthMarker = document.getElementById("profileMouthMarker");
  const profileMouthControls = document.getElementById("profileMouthControls");
  const profileMouthX = document.getElementById("profileMouthX");
  const profileMouthY = document.getElementById("profileMouthY");
  const profileMouthWidth = document.getElementById("profileMouthWidth");
  const profileMouthHeight = document.getElementById("profileMouthHeight");
  const profileMouthXValue = document.getElementById("profileMouthXValue");
  const profileMouthYValue = document.getElementById("profileMouthYValue");
  const profileMouthWidthValue = document.getElementById(
    "profileMouthWidthValue"
  );
  const profileMouthHeightValue = document.getElementById(
    "profileMouthHeightValue"
  );
  const profileMouthConfirmButton = document.getElementById(
    "profileMouthConfirmButton"
  );
  const profileMouthCancelButton = document.getElementById(
    "profileMouthCancelButton"
  );
  let toastTimer = null;
  let customClonePhoto = "";
  let cloneMouthCalibrationActive = false;
  let cloneMouthBeforeCalibration = null;
  let pendingPersonalNoteText = false;
  let previousPlainUserMessage = "";
  let previousPlainUserMessageAt = 0;
  let personalRecallAnchorQuery = "";
  let personalRecallAnchorAt = 0;
  let lastPreparedSamsungNoteText = "";
  let lastPreparedSamsungNoteAt = 0;
  let customCloneMouth = {
    x: 0.5,
    y: 0.58,
    width: 0.16,
    height: 0.075
  };
  let googleConnected = false;
  let googleStatus = {
    connected: false,
    allRequestedAccessGranted: false,
    services: {}
  };
  let smartThingsStatus = {
    configured: false,
    connected: false,
    selectedDevicesOnly: true,
    actionsRequireConfirmation: true
  };
  let whatsappStatus = {
    supported: false,
    permissionGranted: false,
    enabled: false,
    active: false
  };
  let whatsappActionRunning = false;
  let wakeStatus = {
    supported: false,
    mode: "off",
    active: false,
    serviceRunning: false,
    listening: false,
    processingAudio: false,
    pausedForConversation: false,
    overlayPermissionGranted: false,
    speakerGateReady: false
  };
  let wakeActionRunning = false;
  let wakeListenersRegistered = false;
  let lastWakeDetectedAt = 0;
  let pendingWakePrompt = "";
  let phoneStatus = {
    supported: false,
    contactsPermissionGranted: false,
    phoneStatePermissionGranted: false,
    connected: false,
    whatsAppDirectSendEnabled: false,
    callState: "idle",
    incomingCall: false
  };
  let phoneActionRunning = false;
  let phoneListenersRegistered = false;
  let galaxyWatchStatus = {
    supported: false,
    galaxyWearableInstalled: false,
    notificationsGranted: false,
    relayReady: false
  };
  let noteImportRunning = false;
  let noteListenerRegistered = false;
  let personalNotes = [];
  let memorialEntries = [];
  let memorialLoadRunning = false;
  const memorialObjectUrls = new Set();

  function activePersonalOwner() {
    return window.SolHoloIdentity?.selected()?.ownerId || "";
  }

  function activeNotesStorageKey() {
    const ownerId = activePersonalOwner();
    if (ownerId === "pam-sol") {
      return pamNotesStorageKey;
    }
    return "";
  }

  function activeCloneStorageKeys() {
    const ownerId = activePersonalOwner();
    if (ownerId === "pam-sol") {
      return {
        metadata: pamCloneMetadataKey,
        mouth: pamCloneMouthKey,
        photo: pamClonePhotoKey
      };
    }
    return null;
  }

  function quarantineLegacyCloneAppearance() {
    try {
      if (localStorage.getItem(cloneAppearanceMigrationKey) === "1") {
        return false;
      }

      const legacyPhoto = localStorage.getItem(legacyClonePhotoKey);
      const legacyMouth = localStorage.getItem(legacyCloneMouthKey);
      let quarantined = false;

      if (legacyPhoto) {
        localStorage.setItem(legacyClonePhotoQuarantineKey, legacyPhoto);
        if (localStorage.getItem(legacyClonePhotoQuarantineKey) !== legacyPhoto) {
          throw new Error("LEGACY_PHOTO_QUARANTINE_FAILED");
        }
      }

      if (legacyMouth) {
        localStorage.setItem(legacyCloneMouthQuarantineKey, legacyMouth);
        if (localStorage.getItem(legacyCloneMouthQuarantineKey) !== legacyMouth) {
          throw new Error("LEGACY_MOUTH_QUARANTINE_FAILED");
        }
      }

      if (legacyPhoto || legacyMouth) {
        const quarantineMetadata = JSON.stringify({
          deviceOrigin: "unknown",
          facialIdentity: "not-verified",
          locationOrigin: "unknown",
          originalOwnerId: null,
          reason: "legacy-owner-missing",
          state: "unassigned"
        });
        localStorage.setItem(
          legacyCloneQuarantineMetadataKey,
          quarantineMetadata
        );
        if (
          localStorage.getItem(legacyCloneQuarantineMetadataKey) !==
            quarantineMetadata
        ) {
          throw new Error("LEGACY_METADATA_QUARANTINE_FAILED");
        }
        if (legacyPhoto) localStorage.removeItem(legacyClonePhotoKey);
        if (legacyMouth) localStorage.removeItem(legacyCloneMouthKey);
        quarantined = true;
      }

      localStorage.setItem(cloneAppearanceMigrationKey, "1");
      return quarantined;
    } catch (error) {
      console.error("Altes Holo-Bild sicher separieren:", error);
      return false;
    }
  }

  function validPamCloneMetadata(value) {
    try {
      const metadata = JSON.parse(value || "null");
      return Boolean(
        metadata &&
        metadata.ownerId === "pam-sol" &&
        metadata.speakerId === "pam" &&
        metadata.confirmedBy === "pam" &&
        metadata.explicitOwnerConfirmation === true
      );
    } catch {
      return false;
    }
  }

  function quarantineUnverifiedPamCloneAppearance(keys) {
    try {
      const photo = localStorage.getItem(keys.photo) || "";
      const mouth = localStorage.getItem(keys.mouth) || "";
      const metadata = localStorage.getItem(keys.metadata) || "";
      if (!photo && !mouth && !metadata) return false;
      if (validPamCloneMetadata(metadata)) return false;

      const quarantineEntries = [
        [unverifiedPamClonePhotoQuarantineKey, photo],
        [unverifiedPamCloneMouthQuarantineKey, mouth],
        [
          unverifiedPamCloneMetadataQuarantineKey,
          JSON.stringify({
            deviceOrigin: "unknown",
            facialIdentity: "not-verified",
            locationOrigin: "unknown",
            originalMetadata: metadata || null,
            originalOwnerId: null,
            reason: "owner-confirmation-missing-or-invalid",
            state: "unassigned"
          })
        ]
      ];

      for (const [key, value] of quarantineEntries) {
        if (!value) continue;
        localStorage.setItem(key, value);
        if (localStorage.getItem(key) !== value) {
          throw new Error("UNVERIFIED_IMAGE_QUARANTINE_FAILED");
        }
      }

      localStorage.removeItem(keys.photo);
      localStorage.removeItem(keys.mouth);
      localStorage.removeItem(keys.metadata);
      return true;
    } catch (error) {
      console.error("Unbestätigtes Holo-Bild sicher separieren:", error);
      return true;
    }
  }

  function activePersonalName() {
    return window.SolHoloIdentity?.selected()?.displayName || "";
  }

  function activeInstanceName() {
    const name = activePersonalName();
    if (name === "Pam") {
      return "Pam’s Holo";
    }
    return "persönliches Holo";
  }

  function requireActivePersonalOwner() {
    const identity = window.SolHoloIdentity?.require?.();
    if (!identity) {
      showToast("Die feste Holo-ID ist nicht verfügbar. Persönliche Daten bleiben gesperrt.");
      return null;
    }
    return identity;
  }

  function renderPersonalIdentityUi() {
    const identity = window.SolHoloIdentity?.selected?.() || null;
    const displayName = identity?.displayName || "";
    const instanceName = displayName
      ? "Pam’s Holo"
      : "Persönliches Holo";

    document.title = displayName
      ? `Human Holo · ${instanceName}`
      : "Human Holo";

    const homeTitle = document.getElementById("homeTitle");
    if (homeTitle) {
      homeTitle.textContent = displayName ? `Hallo ${displayName}♡` : "Hallo♡";
    }

    const profileName = document.querySelector("#profileView .profileName");
    if (profileName) {
      const unicorn = profileName.querySelector(".pamUnicorn")?.cloneNode(true);
      profileName.replaceChildren(document.createTextNode(`${instanceName} `));
      if (unicorn) {
        profileName.append(unicorn);
      }
    }

    const memoryCopy = document.querySelector(
      "#memoryView .memoryIntro .featureCopy"
    );
    if (memoryCopy) {
      memoryCopy.textContent = identity
        ? `${instanceName}s Vollzeitgedächtnis ist immer aktiv: Deine Nachrichten und Holos Antworten werden bei Text und Sprache Wort für Wort ownergebunden gespeichert. Bestätigte Erinnerungen bleiben bei allen künftigen App-, Design-, Namens-, Funktions- und Datenbankänderungen erhalten; eine andere Person kann sie niemals laden.`
        : "Die feste Holo-ID ist nicht verfügbar. Das Gedächtnis bleibt gesperrt.";
    }

    const servicesCopy = document.querySelector(
      "#servicesView .servicesIntro .featureCopy"
    );
    if (servicesCopy) {
      servicesCopy.textContent = identity
        ? `${instanceName} verbindet nur ${displayName}s eigene Dienste. Konto, Zuhause und Geräte werden einmalig ausgewählt; keine Verbindung wird mit einer anderen Person geteilt.`
        : "Die feste Holo-ID ist nicht verfügbar. Dienstverbindungen bleiben gesperrt.";
    }

    const permissionCopy = document.querySelector("#servicesView .permissionNote");
    if (permissionCopy) {
      permissionCopy.textContent = identity
        ? `Euer Dialog bleibt automatisch in ${instanceName}s ownergebundenem Vollzeitgedächtnis. Zusätzliche Alltagsinhalte wie Listen speichert ${instanceName} auf ${displayName}s ausdrücklichen Zuruf. Passwörter, PIN, TAN, Token und Schlüssel bleiben gesperrt. Freigegebene Alltagsgeräte dürfen später auf ausdrücklichen Auftrag gesteuert werden; neue oder riskante Geräteaktionen brauchen eine zusätzliche Bestätigung.`
        : "Die feste Holo-ID ist nicht verfügbar. Keine persönliche Verbindung wird geladen.";
    }

    const memorialOwnerNote = document.querySelector(
      "#memorialView .memorialOwnerNote"
    );
    if (memorialOwnerNote) {
      memorialOwnerNote.textContent = identity
        ? `Die Inhalte bleiben lokal und ownergebunden in ${instanceName}. ` +
          `Eine andere Human-Holo-Identität kann ${displayName}s bewahrte ` +
          "Erinnerungen nicht laden."
        : "Die feste Holo-ID ist nicht verfügbar. Der Erinnerungsbereich bleibt gesperrt.";
    }

    const settingsCopy = document.querySelector("#settingsView .settingsIntro p:last-child");
    if (settingsCopy) {
      settingsCopy.textContent = identity
        ? `Hier bestimmst du nur, wie ${instanceName} aussieht, spricht und sich verbindet.`
        : "Die feste Holo-ID ist nicht verfügbar. Einstellungen bleiben gesperrt.";
    }

    const notesHeading = document.querySelector("#notesView .notesIntro h3");
    if (notesHeading) {
      notesHeading.textContent = identity
        ? `${displayName}s Wichtiges in ${instanceName}`
        : "Drei getrennte persönliche Bereiche";
    }

    const notesFooter = document.getElementById("noteStorageHint");
    if (notesFooter) {
      notesFooter.textContent = identity
        ? `Bleibt getrennt in ${instanceName} auf diesem Handy.`
        : "Die feste Holo-ID ist nicht verfügbar.";
    }

    const manageMemoriesButton = document.getElementById("manageMemoriesButton");
    if (manageMemoriesButton) {
      const arrow = document.createElement("span");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "→";
      manageMemoriesButton.replaceChildren(
        "Erinnerungen mit Human Holo ansehen ",
        arrow
      );
    }

    noteTextInput.placeholder = identity
      ? `Was soll ${instanceName} nur für ${displayName} notieren?`
      : "Die feste Holo-ID ist nicht verfügbar.";

    profileDisplayImage.alt = identity
      ? `Persönliches Bild von ${instanceName}`
      : "Noch kein persönliches Holo ausgewählt";
    profileCloneImage.alt = identity
      ? `Bildvorschau für ${instanceName}`
      : "Noch kein persönliches Holo ausgewählt";
    profilePhotoButton.setAttribute(
      "aria-label",
      identity
        ? `Eigenes Bild für ${instanceName} aus der Galerie auswählen`
        : "Die feste Holo-ID ist nicht verfügbar"
    );
  }

  let healthStatus = {
    supported: false,
    readOnly: true,
    availablePermissionCount: 0,
    grantedPermissionCount: 0,
    connected: false,
    allGranted: false
  };
  let healthActionRunning = false;
  let openClawAlltagPreviewRunning = false;
  let openClawAlltagPreviewCompleted = false;

  function showToast(text) {
    uiToast.textContent = normalizedVisibleText(text);
    uiToast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      uiToast.classList.remove("visible");
    }, 4200);
  }

  function setOpenClawAlltagPreviewStatus(text, state = "setup") {
    const status = document.getElementById("openClawAlltagPreviewStatus");
    if (!status) return;
    status.textContent = text;
    status.classList.remove("connected", "setup");
    if (state) status.classList.add(state);
  }

  function renderOpenClawAlltagPreview(data, errorMessage = "") {
    const panel = document.getElementById("openClawAlltagPreviewResult");
    const content = document.getElementById("openClawAlltagPreviewContent");
    const meta = document.getElementById("openClawAlltagPreviewMeta");
    if (!panel || !content || !meta) return;

    panel.hidden = false;
    content.replaceChildren();

    if (errorMessage) {
      meta.textContent = "Sicher abgelehnt · nichts ausgeführt";
      const message = document.createElement("p");
      message.className = "openClawPreviewError";
      message.textContent = errorMessage;
      content.append(message);
      return;
    }

    const result = data?.result;
    if (
      result?.worker !== "worker-alltag" ||
      result?.status !== "completed-proposal" ||
      result?.controls?.external_action_performed !== false ||
      result?.controls?.data_written !== false ||
      result?.controls?.boundary_crossed !== false ||
      result?.controls?.human_review_required !== true
    ) {
      renderOpenClawAlltagPreview(
        null,
        "Die Antwort entsprach nicht dem sicheren Vorschauformat und wurde verworfen."
      );
      return;
    }

    meta.textContent = "worker-alltag · fiktive Daten · nur lesen";

    const addList = (title, entries) => {
      const section = document.createElement("section");
      const heading = document.createElement("strong");
      heading.textContent = title;
      const list = document.createElement("ul");
      for (const entry of entries) {
        const item = document.createElement("li");
        item.textContent = String(entry);
        list.append(item);
      }
      section.append(heading, list);
      content.append(section);
    };

    addList("Gelesene Testfakten", Array.isArray(result.facts) ? result.facts : []);
    addList(
      "Offene Punkte",
      Array.isArray(result.uncertainties) ? result.uncertainties : []
    );

    const proposalSection = document.createElement("section");
    const proposalTitle = document.createElement("strong");
    proposalTitle.textContent = "Unverbindlicher Vorschlag";
    const proposal = document.createElement("p");
    proposal.textContent = String(result.proposal || "");
    proposalSection.append(proposalTitle, proposal);
    content.append(proposalSection);
  }

  async function runOpenClawAlltagPreview() {
    if (openClawAlltagPreviewRunning || openClawAlltagPreviewCompleted) {
      return;
    }

    const identity = requireActivePersonalOwner();
    if (
      !identity ||
      identity.ownerId !== "pam-sol" ||
      identity.speakerId !== "pam"
    ) {
      renderOpenClawAlltagPreview(
        null,
        "Der Test bleibt gesperrt, weil die feste Pam-Holo-ID nicht bestätigt ist."
      );
      return;
    }

    const confirmed = window.confirm(
      "Jetzt genau den fiktiven Alltagstest starten?\n\n" +
      "worker-alltag darf ausschließlich die eingebauten Testdaten lesen und " +
      "einen sichtbaren Vorschlag zurückgeben. Es werden keine echten Daten " +
      "gesendet, nichts gespeichert und keine Aktion ausgeführt."
    );
    if (!confirmed) {
      setOpenClawAlltagPreviewStatus("Nicht gestartet", "setup");
      showToast("Alltagstest abgebrochen · nichts wurde gesendet.");
      return;
    }

    const row = document.getElementById("openClawAlltagPreviewRow");
    openClawAlltagPreviewRunning = true;
    row.disabled = true;
    setOpenClawAlltagPreviewStatus("S23 bestätigen …", "setup");

    try {
      const session = await window.SolHoloTrustedSession?.ensure?.({
        interactive: true
      });
      if (session?.trusted !== true) {
        throw new Error(
          "Die sichere S23-Sitzung wurde nicht bestätigt. Der Test blieb gesperrt."
        );
      }

      setOpenClawAlltagPreviewStatus("worker-alltag liest …", "setup");
      document.getElementById("openClawAlltagPreviewResult").hidden = true;

      const response = await fetch(
        `${BACKEND_URL}/openclaw/alltag-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(window.SolHoloTrustedSession?.headers?.() || {})
          },
          body: JSON.stringify({
            confirmation: "RUN_FIXED_SYNTHETIC_ALLTAG_PREVIEW",
            ownerId: identity.ownerId,
            selectedSpeakerId: identity.speakerId
          }),
          cache: "no-store",
          credentials: "omit",
          referrerPolicy: "no-referrer"
        }
      );
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      if (!response.ok) {
        throw new Error(
          String(
            data?.message ||
            "Der lokale OpenClaw-Labor-Runner ist noch nicht freigeschaltet."
          )
        );
      }
      if (
        data?.identity?.ownerId !== identity.ownerId ||
        data?.preview !== true ||
        data?.productive !== false ||
        data?.persisted !== false
      ) {
        throw new Error(
          "Die sichere Zuordnung der Laborantwort konnte nicht bestätigt werden."
        );
      }

      renderOpenClawAlltagPreview(data);
      openClawAlltagPreviewCompleted = true;
      setOpenClawAlltagPreviewStatus("Vorschlag da ✅", "connected");
      showToast("worker-alltag hat den fiktiven Vorschlag sicher zurückgegeben ✅️");
    } catch (error) {
      console.error(
        "OpenClaw-Alltag-Vorschau:",
        error?.name || "Fehler"
      );
      const message = String(
        error?.message ||
        "Die fiktive Alltag-Vorschau wurde sicher abgebrochen."
      );
      renderOpenClawAlltagPreview(null, message);
      setOpenClawAlltagPreviewStatus("Weiter gesperrt", "setup");
      showToast(message);
    } finally {
      openClawAlltagPreviewRunning = false;
      row.disabled = openClawAlltagPreviewCompleted;
    }
  }

  function normalizeNoteSearchText(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("de-DE")
      .trim();
  }

  function stripHoloInvocation(value) {
    return String(value || "")
      .trim()
      .replace(
        /^(?:(?:hey\s+)?(?:sol(?:\s+holo)?|pam(?:['’]s\s+holo)?|holo))\s*[,;:!.-]?\s*/i,
        ""
      )
      .trim();
  }

  function noteSecurityWarning(text) {
    const cleanText = String(text || "");
    const namedSecret = /\b(?:passwort|password|pin|tan|api[\s_-]?key|secret|token|authenticator|banking|kreditkart(?:e|en)?|cvv|iban)\b/i;
    const apiSecret = /\b(?:sk|pk|ghp|github_pat|xox[baprs])[-_][A-Za-z0-9_-]{12,}\b/;
    const jwtToken = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/;

    if (namedSecret.test(cleanText) || apiSecret.test(cleanText) || jwtToken.test(cleanText)) {
      return (
        "Dieser Inhalt enthält möglicherweise Zugangsdaten wie Passwort, PIN, " +
        "TAN, API-Key, Token, Banking- oder Authenticator-Daten. " +
        "Das ausgewählte persönliche Holo speichert ihn zu deinem Schutz nicht."
      );
    }

    return "";
  }

  function cleanMemorialText(value, maxLength) {
    return String(value || "")
      .replace(/\u0000/g, "")
      .trim()
      .slice(0, maxLength);
  }

  function validateMemorialMedia(fileList) {
    const files = Array.from(fileList || []);
    if (files.length > maxMemorialMediaFiles) {
      return {
        valid: false,
        files: [],
        error: `Bitte höchstens ${maxMemorialMediaFiles} Dateien auswählen.`
      };
    }

    let totalBytes = 0;
    for (const file of files) {
      const type = String(file?.type || "").toLocaleLowerCase("de-DE");
      const supported =
        type.startsWith("image/") ||
        type.startsWith("audio/") ||
        type === "video/mp4" ||
        type === "video/webm";

      if (!supported) {
        return {
          valid: false,
          files: [],
          error: "Erlaubt sind Fotos, Sprachaufnahmen sowie MP4- und WebM-Videos."
        };
      }

      const size = Number(file?.size || 0);
      if (!Number.isFinite(size) || size <= 0 || size > maxMemorialMediaBytes) {
        return {
          valid: false,
          files: [],
          error: "Jede Datei muss lesbar und höchstens 20 MB groß sein."
        };
      }
      totalBytes += size;
    }

    if (totalBytes > maxMemorialTotalBytes) {
      return {
        valid: false,
        files: [],
        error: "Die ausgewählten Dateien dürfen zusammen höchstens 64 MB groß sein."
      };
    }

    return { valid: true, files, totalBytes, error: "" };
  }

  function openMemorialDatabase() {
    return new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) {
        reject(new Error("MEMORIAL_STORAGE_UNAVAILABLE"));
        return;
      }

      const request = globalThis.indexedDB.open(memorialDatabaseName, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        const store = database.objectStoreNames.contains(memorialStoreName)
          ? request.transaction.objectStore(memorialStoreName)
          : database.createObjectStore(memorialStoreName, {
            keyPath: "storageId"
          });
        if (!store.indexNames.contains("ownerId")) {
          store.createIndex("ownerId", "ownerId", { unique: false });
        }
      };
      request.onerror = () => reject(
        request.error || new Error("MEMORIAL_STORAGE_OPEN_FAILED")
      );
      request.onblocked = () => reject(new Error("MEMORIAL_STORAGE_BLOCKED"));
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => database.close();
        resolve(database);
      };
    });
  }

  function memorialRequestResult(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(
        request.error || new Error("MEMORIAL_STORAGE_REQUEST_FAILED")
      );
    });
  }

  function memorialTransactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(
        transaction.error || new Error("MEMORIAL_STORAGE_TRANSACTION_FAILED")
      );
      transaction.onabort = () => reject(
        transaction.error || new Error("MEMORIAL_STORAGE_TRANSACTION_ABORTED")
      );
    });
  }

  function normalizeMemorialEntry(entry, ownerId) {
    if (
      !entry ||
      entry.ownerId !== ownerId ||
      entry.rightsConfirmed !== true ||
      entry.impersonationAllowed !== false ||
      entry.identityBoundary !== memorialIdentityBoundary
    ) {
      return null;
    }

    const personName = cleanMemorialText(entry.personName, 120);
    const story = cleanMemorialText(entry.story, 10_000);
    const media = Array.isArray(entry.media)
      ? entry.media
        .filter((item) => item?.blob && item?.type && item?.name)
        .slice(0, maxMemorialMediaFiles)
      : [];
    if (!personName || (!story && media.length === 0)) {
      return null;
    }

    return {
      storageId: String(entry.storageId || ""),
      id: String(entry.id || ""),
      ownerId,
      personName,
      relationship: cleanMemorialText(entry.relationship, 120),
      story,
      media,
      rightsConfirmed: true,
      rightsConfirmedAt: Number(entry.rightsConfirmedAt || 0),
      identityBoundary: memorialIdentityBoundary,
      impersonationAllowed: false,
      createdAt: Number(entry.createdAt || Date.now()),
      updatedAt: Number(entry.updatedAt || entry.createdAt || Date.now())
    };
  }

  function releaseMemorialObjectUrls() {
    for (const objectUrl of memorialObjectUrls) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {}
    }
    memorialObjectUrls.clear();
  }

  function memorialDateText(entry) {
    try {
      return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(entry.updatedAt));
    } catch {
      return new Date(entry.updatedAt).toLocaleString("de-DE");
    }
  }

  function memorialMediaElement(item) {
    if (!globalThis.URL?.createObjectURL || !item?.blob) {
      return null;
    }

    const objectUrl = URL.createObjectURL(item.blob);
    memorialObjectUrls.add(objectUrl);
    const type = String(item.type || "");
    let mediaElement;
    if (type.startsWith("image/")) {
      mediaElement = document.createElement("img");
      mediaElement.alt = `Bewahrtes Foto: ${cleanMemorialText(item.name, 160)}`;
      mediaElement.loading = "lazy";
    } else if (type.startsWith("audio/")) {
      mediaElement = document.createElement("audio");
      mediaElement.controls = true;
      mediaElement.preload = "metadata";
      mediaElement.setAttribute(
        "aria-label",
        `Bewahrte Sprachaufnahme: ${cleanMemorialText(item.name, 160)}`
      );
    } else {
      mediaElement = document.createElement("video");
      mediaElement.controls = true;
      mediaElement.preload = "metadata";
      mediaElement.setAttribute(
        "aria-label",
        `Bewahrtes Video: ${cleanMemorialText(item.name, 160)}`
      );
    }
    mediaElement.src = objectUrl;
    return mediaElement;
  }

  function renderMemorialEntries() {
    releaseMemorialObjectUrls();
    memorialList.replaceChildren();
    memorialCount.textContent = String(memorialEntries.length);
    memorialEmpty.hidden = memorialEntries.length > 0;

    for (const entry of memorialEntries) {
      const card = document.createElement("article");
      card.className = "memorialCard glassCard";
      card.dataset.memorialId = entry.id;

      const header = document.createElement("div");
      header.className = "memorialCardHeader";
      const titleWrap = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = entry.personName;
      titleWrap.append(title);
      if (entry.relationship) {
        const relationship = document.createElement("span");
        relationship.textContent = entry.relationship;
        titleWrap.append(relationship);
      }
      const date = document.createElement("time");
      date.dateTime = new Date(entry.updatedAt).toISOString();
      date.textContent = memorialDateText(entry);
      header.append(titleWrap, date);
      card.append(header);

      if (entry.story) {
        const story = document.createElement("p");
        story.className = "memorialStory";
        story.textContent = entry.story;
        card.append(story);
      }

      if (entry.media.length) {
        const mediaGrid = document.createElement("div");
        mediaGrid.className = "memorialMediaGrid";
        for (const item of entry.media) {
          const figure = document.createElement("figure");
          const mediaElement = memorialMediaElement(item);
          if (!mediaElement) continue;
          const caption = document.createElement("figcaption");
          caption.textContent = cleanMemorialText(item.name, 160);
          figure.append(mediaElement, caption);
          mediaGrid.append(figure);
        }
        if (mediaGrid.childElementCount) {
          card.append(mediaGrid);
        }
      }

      const footer = document.createElement("div");
      footer.className = "memorialCardFooter";
      const boundary = document.createElement("span");
      boundary.textContent = "Digitale Erinnerungsform · keine Identitätssimulation";
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.dataset.memorialAction = "delete";
      deleteButton.dataset.memorialId = entry.id;
      deleteButton.textContent = "Löschen";
      deleteButton.setAttribute(
        "aria-label",
        `Bewahrte Erinnerung an ${entry.personName} löschen`
      );
      footer.append(boundary, deleteButton);
      card.append(footer);
      memorialList.append(card);
    }
  }

  async function loadMemorialEntries() {
    if (memorialLoadRunning) return;
    const identity = requireActivePersonalOwner();
    if (!identity) {
      memorialEntries = [];
      renderMemorialEntries();
      return;
    }

    memorialLoadRunning = true;
    try {
      const database = await openMemorialDatabase();
      const transaction = database.transaction(memorialStoreName, "readonly");
      const done = memorialTransactionDone(transaction);
      const request = transaction
        .objectStore(memorialStoreName)
        .index("ownerId")
        .getAll(identity.ownerId);
      const records = await memorialRequestResult(request);
      await done;
      database.close();
      memorialEntries = Array.isArray(records)
        ? records
          .map((entry) => normalizeMemorialEntry(entry, identity.ownerId))
          .filter(Boolean)
          .sort((left, right) => right.updatedAt - left.updatedAt)
        : [];
      renderMemorialEntries();
    } catch (error) {
      console.error(
        "Erinnerung-und-Vermächtnis-Speicher laden:",
        error?.name || "Fehler"
      );
      memorialEntries = [];
      renderMemorialEntries();
      showToast("Der geschützte lokale Erinnerungsbereich ist gerade nicht verfügbar.");
    } finally {
      memorialLoadRunning = false;
    }
  }

  function renderMemorialMediaSelection() {
    const result = validateMemorialMedia(memorialMediaInput.files);
    memorialMediaInput.setCustomValidity(result.error);
    if (!result.valid) {
      memorialMediaStatus.textContent = result.error;
      memorialMediaStatus.classList.add("error");
      return result;
    }

    memorialMediaStatus.classList.remove("error");
    if (!result.files.length) {
      memorialMediaStatus.textContent = "Noch keine Datei ausgewählt.";
      return result;
    }

    const sizeMegabytes = result.totalBytes / (1024 * 1024);
    memorialMediaStatus.textContent =
      `${result.files.length} ${result.files.length === 1 ? "Datei" : "Dateien"}` +
      ` ausgewählt · ${sizeMegabytes.toLocaleString("de-DE", {
        maximumFractionDigits: 1
      })} MB`;
    return result;
  }

  async function saveMemorialEntry() {
    const identity = requireActivePersonalOwner();
    if (!identity) return false;

    const personName = cleanMemorialText(memorialPersonName.value, 120);
    const relationship = cleanMemorialText(memorialRelationship.value, 120);
    const story = cleanMemorialText(memorialStory.value, 10_000);
    const mediaResult = renderMemorialMediaSelection();

    if (!personName) {
      memorialPersonName.setCustomValidity("Bitte den Namen des Menschen eintragen.");
      memorialPersonName.reportValidity();
      return false;
    }
    memorialPersonName.setCustomValidity("");

    if (!story && mediaResult.files.length === 0) {
      memorialStory.setCustomValidity(
        "Bitte eine Geschichte eintragen oder mindestens eine Datei auswählen."
      );
      memorialStory.reportValidity();
      return false;
    }
    memorialStory.setCustomValidity("");

    if (!mediaResult.valid) {
      memorialMediaInput.reportValidity();
      return false;
    }

    const securityWarning = noteSecurityWarning(
      `${personName}\n${relationship}\n${story}`
    );
    if (securityWarning) {
      showToast(securityWarning);
      return false;
    }

    if (!memorialRightsConfirmation.checked) {
      memorialRightsConfirmation.setCustomValidity(
        "Bitte Rechte und Einwilligungen ausdrücklich bestätigen."
      );
      memorialRightsConfirmation.reportValidity();
      return false;
    }
    memorialRightsConfirmation.setCustomValidity("");

    const now = Date.now();
    const entryId = globalThis.crypto?.randomUUID?.() ||
      `memorial-${now}-${Math.random().toString(36).slice(2, 10)}`;
    const record = {
      storageId: `${identity.ownerId}:${entryId}`,
      id: entryId,
      ownerId: identity.ownerId,
      speakerId: identity.speakerId,
      personName,
      relationship,
      story,
      media: mediaResult.files.map((file, index) => ({
        id: `${entryId}-media-${index + 1}`,
        name: cleanMemorialText(file.name, 160) || `Datei ${index + 1}`,
        type: String(file.type || "").toLocaleLowerCase("de-DE"),
        size: Number(file.size),
        lastModified: Number(file.lastModified || 0),
        blob: file
      })),
      rightsConfirmed: true,
      rightsConfirmedAt: now,
      identityBoundary: memorialIdentityBoundary,
      impersonationAllowed: false,
      createdAt: now,
      updatedAt: now
    };

    memorialSaveButton.disabled = true;
    memorialSaveButton.textContent = "Wird geschützt gespeichert …";
    try {
      const database = await openMemorialDatabase();
      const transaction = database.transaction(memorialStoreName, "readwrite");
      const done = memorialTransactionDone(transaction);
      transaction.objectStore(memorialStoreName).put(record);
      await done;
      database.close();
      memorialForm.reset();
      renderMemorialMediaSelection();
      await loadMemorialEntries();
      showToast("Erinnerung ownergebunden und respektvoll bewahrt ✅️");
      return true;
    } catch (error) {
      console.error(
        "Erinnerung-und-Vermächtnis-Speicher schreiben:",
        error?.name || "Fehler"
      );
      showToast("Die Erinnerung konnte nicht sicher gespeichert werden.");
      return false;
    } finally {
      memorialSaveButton.disabled = false;
      memorialSaveButton.textContent = "Erinnerung sicher anlegen";
    }
  }

  async function deleteMemorialEntry(entryId) {
    const identity = requireActivePersonalOwner();
    const entry = memorialEntries.find((item) => item.id === entryId);
    if (!identity || !entry || entry.ownerId !== identity.ownerId) return;

    const confirmed = window.confirm(
      `Die bewahrte Erinnerung an „${entry.personName}“ wirklich löschen?\n\n` +
      "Dieser Schritt kann in der App nicht rückgängig gemacht werden."
    );
    if (!confirmed) return;

    try {
      const database = await openMemorialDatabase();
      const transaction = database.transaction(memorialStoreName, "readwrite");
      const done = memorialTransactionDone(transaction);
      transaction
        .objectStore(memorialStoreName)
        .delete(`${identity.ownerId}:${entry.id}`);
      await done;
      database.close();
      await loadMemorialEntries();
      showToast("Bewahrte Erinnerung gelöscht.");
    } catch (error) {
      console.error(
        "Erinnerung-und-Vermächtnis-Speicher löschen:",
        error?.name || "Fehler"
      );
      showToast("Die Erinnerung konnte nicht sicher gelöscht werden.");
    }
  }

  function cleanExplicitSaveContent(value) {
    return String(value || "")
      .replace(/^[\s:,-]+|[\s.!?]+$/g, "")
      .replace(/^dass\s+/i, "")
      .trim()
      .slice(0, 10_000);
  }

  function explicitListTitle(value) {
    const normalized = normalizeNoteSearchText(value)
      .replace(/[\s_-]+/g, "");
    const titles = {
      aufgabenliste: "Aufgabenliste",
      besorgungsliste: "Besorgungsliste",
      einkaufliste: "Einkaufsliste",
      einkaufsliste: "Einkaufsliste",
      packliste: "Packliste",
      todoliste: "Aufgabenliste",
      wunschliste: "Wunschliste"
    };
    return titles[normalized] || "Liste";
  }

  function savedContentCategory(value) {
    const text = normalizeNoteSearchText(value);
    if (/\b(?:erinner|weck|alarm)\w*\b/u.test(text)) return "Erinnerung";
    if (/\b(?:termin|datum|uhrzeit|uhr|treffen|arzttermin|geburtstag|besprechung)\w*\b/u.test(text)) return "Termin";
    if (/\b(?:aufgabe|todo|erledig|muss|soll)\w*\b/u.test(text)) return "Aufgabe";
    if (/\b(?:wunsch|wunsche|mochte|vorliebe|mag)\w*\b/u.test(text)) return "Wunsch oder Vorliebe";
    return "Gespeicherter Inhalt";
  }

  function calendarWriteDestinationFromMessage(value) {
    const text = normalizeNoteSearchText(value);
    if (!text) return false;

    const explicitListRequest =
      /\b(?:einkaufs?liste|besorgungsliste|aufgabenliste|to[-\s]?do[-\s]?liste|packliste|wunschliste)\b/u.test(text);
    const explicitNoteRequest =
      /^(?:bitte\s+)?notier(?:e)?\b/u.test(text) ||
      /^(?:bitte\s+)?schreib(?:e)?\s+(?:mir\s+)?(?:bitte\s+)?(?:auf|als\s+notiz|in\s+meine\s+notizen)\b/u.test(text) ||
      /^(?:bitte\s+)?(?:mach|mache)\s+(?:mir\s+)?(?:bitte\s+)?(?:eine\s+)?notiz\b/u.test(text) ||
      /^(?:neue\s+)?notiz\s*[:,-]/u.test(text);
    if (explicitListRequest || explicitNoteRequest) {
      return false;
    }

    const directCalendarRequest = Boolean(
      /\b(?:google\s+)?kalender\b/u.test(text) ||
      /\btermin\w*\b/u.test(text) ||
      /\berinnere\s+mich\b/u.test(text) ||
      /\bkalendereintrag\w*\b/u.test(text)
    );
    if (directCalendarRequest) return true;

    const hasDateReference = Boolean(
      /\b(?:heute|morgen|ubermorgen|nachste[nrsm]?\s+(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b/u.test(text) ||
      /\b\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?\b/u.test(text) ||
      /\b\d{1,2}\.?\s+(?:januar|februar|marz|april|mai|juni|juli|august|september|oktober|november|dezember)(?:\s+\d{2,4})?\b/u.test(text)
    );
    const hasClockTime = Boolean(
      /\b\d{1,2}(?::\d{2})?\s*uhr\b/u.test(text) ||
      /\b(?:[01]?\d|2[0-3]):[0-5]\d\b/u.test(text)
    );
    const hasConcreteTime = hasDateReference || hasClockTime;
    const asksToSchedule = Boolean(
      /\b(?:schreib|schreibe|trag|trage|plane|plan|setz|setze|halt|halte)\b[\s\S]*\b(?:auf|ein|fest|vor)\b/u.test(text) ||
      /\b(?:schreib|schreibe|trag|trage|plane|plan|setz|setze)\b/u.test(text)
    );
    const looksLikeQuestion =
      /\?\s*$/u.test(text) ||
      /^(?:wann|was|wie|wo|wer|warum|wieso|weshalb)\b/u.test(text);

    return !looksLikeQuestion && (
      (hasDateReference && hasClockTime) ||
      (hasConcreteTime && asksToSchedule)
    );
  }

  function liveWeatherRequestFromMessage(value) {
    const text = normalizeNoteSearchText(value);
    if (!text) return false;
    return Boolean(
      /\b(?:wetter|wetterbericht|wettervorhersage|temperatur)\w*\b/u.test(text) ||
      /\b(?:regnet|schneit|hagelt)\s+es\b/u.test(text) ||
      /\bwird\s+es\s+(?:regnen|schneien|hageln)\b/u.test(text)
    );
  }

  function personalRecallQueryFromMessage(value) {
    const text = normalizeNoteSearchText(stripHoloInvocation(value))
      .replace(/[?!.,;:]+$/u, "")
      .trim();
    if (!text) return "";

    const patterns = [
      /^wei(?:ss|ß)t\s+du\s+noch[,]?\s+was\s+ich\s+dir(?:\s+(?:heute|gestern|vorgestern|damals))?\s+(?:uber|von)\s+(.+?)\s+(?:erzahlt|gesagt)(?:\s+habe)?$/u,
      /^ich\s+habe\s+dir(?:\s+(?:heute|gestern|vorgestern|damals))?\s+(?:etwas|was)\s+(?:uber|von)\s+(.+?)\s+(?:erzahlt|gesagt)[,\s]+(?:wei(?:ss|ß)t|erinnerst)\s+du\b.*$/u,
      /^wei(?:ss|ß)t\s+du\s+noch[,]?\s+(?:etwas|was)\s+(?:uber|von)\s+(.+)$/u,
      /^hast\s+du\s+dir\s+(.+?)\s+gemerkt$/u,
      /^was\s+wei(?:ss|ß)t\s+du(?:\s+noch)?\s+(?:uber|von)\s+(.+)$/u,
      /^erinnerst\s+du\s+dich(?:\s+noch)?\s+(?:an\s+)?(.+)$/u,
      /^kannst\s+du\s+dich(?:\s+noch)?\s+(?:an\s+)?(.+?)\s+erinnern$/u,
      /^was\s+habe\s+ich\s+dir(?:\s+(?:heute|gestern|vorgestern|damals))?\s+(?:uber|von)\s+(.+?)\s+(?:erzahlt|gesagt)(?:\s+habe)?$/u,
      /^wer\s+ist\s+(?:die\s+|der\s+|das\s+)?(.+)$/u,
      /^kennst\s+du(?:\s+noch)?\s+(?:die\s+|den\s+|das\s+)?(.+)$/u
    ];

    for (const pattern of patterns) {
      const query = String(text.match(pattern)?.[1] || "").trim();
      if (query.length >= 2) return query.slice(0, 240);
    }

    if (
      /\b(?:empfohlen|vorgeschlagen|geraten|gesagt|erzahlt|geschrieben|geantwortet|gemeint|ausgesucht)\b/u.test(text) &&
      (
        /\b(?:du|ihr|sie|sol|holo|assistenz)\b/u.test(text) ||
        /\bdein(?:e|er|en|em|es)?\s+(?:antwort|empfehlung|vorschlag)\b/u.test(text)
      )
    ) {
      return text.slice(0, 240);
    }

    if (
      /^(?:was|wie|wann|wo|welch\w*|wer)\b/u.test(text) &&
      /\b(?:mein(?:e|er|en|em|es)?|unser(?:e|er|en|em|es)?)\b/u.test(text)
    ) {
      return text.slice(0, 240);
    }

    if (
      /^(?:was|wie|wann|wo|welch\w*)\b/u.test(text) &&
      /\b(?:gestern|vorgestern|damals|fruher|letzt\w*)\b/u.test(text)
    ) {
      return text.slice(0, 240);
    }

    return "";
  }

  function personalRecallFollowUpKindFromMessage(value) {
    const text = normalizeNoteSearchText(stripHoloInvocation(value))
      .replace(/[?!.,;:]+$/u, "")
      .replace(/\s+/gu, " ")
      .trim();
    if (!text || text.length > 64) return "";

    const patterns = [
      [
        "place",
        /^(?:und\s+)?(?:wo(?:\s+genau)?|an\s+welchem\s+ort)(?:\s+(?:ist|war)\s+(?:das|es))?$/u
      ],
      [
        "time",
        /^(?:und\s+)?(?:wann(?:\s+genau)?|an\s+welchem\s+tag|zu\s+welchem\s+datum)(?:\s+(?:ist|war)\s+(?:das|es))?$/u
      ],
      [
        "person",
        /^(?:und\s+)?wer(?:\s+genau)?(?:\s+(?:ist|war)\s+(?:das|es))?$/u
      ],
      [
        "detail",
        /^(?:und\s+)?(?:wie(?:\s+genau)?|was(?:\s+noch)?)(?:\s+(?:ist|war)\s+(?:das|es))?$/u
      ]
    ];

    for (const [kind, pattern] of patterns) {
      if (pattern.test(text)) return kind;
    }
    return "";
  }

  function contextualPersonalRecallQueryFromMessage(value) {
    const directQuery = personalRecallQueryFromMessage(value);
    if (directQuery) {
      personalRecallAnchorQuery = directQuery;
      personalRecallAnchorAt = Date.now();
      return directQuery;
    }

    const followUpKind = personalRecallFollowUpKindFromMessage(value);
    const hasRecentAnchor =
      personalRecallAnchorQuery &&
      Date.now() - personalRecallAnchorAt <= 10 * 60 * 1000;
    if (followUpKind && hasRecentAnchor) {
      return personalRecallAnchorQuery;
    }

    if (String(value || "").trim() && !followUpKind) {
      personalRecallAnchorQuery = "";
      personalRecallAnchorAt = 0;
    }
    return "";
  }

  function googleMapsDestinationFromMessage(value) {
    const cleanMessage = stripHoloInvocation(value);
    if (!cleanMessage) return null;

    if (
      /^(?:bitte\s+)?(?:öffne|oeffne|starte|zeige)\s+(?:bitte\s+)?(?:(?:den|meinen)\s+)?(?:(?:google\s+)?maps|routenplaner|navigation)[.!?]*$/i.test(
        cleanMessage
      )
    ) {
      return "";
    }

    const patterns = [
      /^(?:bitte\s+)?(?:navigier(?:e)?|bring(?:e)?|führ(?:e)?|fuehr(?:e)?|fahr(?:e)?|route)\s+(?:mich\s+)?(?:bitte\s+)?(?:zu(?:m|r)?|nach)\s+(.+?)[.!?]*$/i,
      /^(?:bitte\s+)?(?:öffne|oeffne|starte)\s+(?:bitte\s+)?(?:(?:den|meinen)\s+)?(?:(?:google\s+)?maps|routenplaner|navigation)\s+(?:mit\s+(?:dem\s+)?ziel|zu(?:m|r)?|nach)\s+(.+?)[.!?]*$/i,
      /^(?:bitte\s+)?(?:plan(?:e)?|berechne)\s+(?:mir\s+)?(?:bitte\s+)?(?:eine\s+)?route\s+(?:zu(?:m|r)?|nach)\s+(.+?)[.!?]*$/i,
      /^(?:bitte\s+)?(?:zeig(?:e)?\s+mir\s+(?:den\s+)?weg|wie\s+komme\s+ich)\s+(?:am\s+besten\s+)?(?:zu(?:m|r)?|nach)\s+(.+?)[.!?]*$/i
    ];

    for (const pattern of patterns) {
      const destination = cleanExplicitSaveContent(
        cleanMessage.match(pattern)?.[1] || ""
      );
      if (destination) return destination;
    }

    return null;
  }

  function germanAlarmHourValue(value) {
    const normalized = normalizeNoteSearchText(value)
      .replace(/[\s-]+/g, "");
    const hourWords = {
      null: 0,
      mitternacht: 0,
      ein: 1,
      eins: 1,
      zwei: 2,
      drei: 3,
      vier: 4,
      funf: 5,
      sechs: 6,
      sieben: 7,
      acht: 8,
      neun: 9,
      zehn: 10,
      elf: 11,
      zwolf: 12,
      dreizehn: 13,
      vierzehn: 14,
      funfzehn: 15,
      sechzehn: 16,
      siebzehn: 17,
      achtzehn: 18,
      neunzehn: 19,
      zwanzig: 20,
      einundzwanzig: 21,
      zweiundzwanzig: 22,
      dreiundzwanzig: 23
    };
    if (/^\d{1,2}$/u.test(normalized)) {
      return Number(normalized);
    }
    return Object.prototype.hasOwnProperty.call(hourWords, normalized)
      ? hourWords[normalized]
      : null;
  }

  function alarmClockTimeFromMessage(value) {
    const cleanMessage = normalizeNoteSearchText(value);
    const hourWordPattern =
      "dreiundzwanzig|zweiundzwanzig|einundzwanzig|neunzehn|achtzehn|" +
      "siebzehn|sechzehn|funfzehn|vierzehn|dreizehn|zwolf|elf|zehn|" +
      "neun|acht|sieben|sechs|funf|vier|drei|zwei|eins|ein|" +
      "mitternacht|null|\\d{1,2}";
    const spokenHour = new RegExp(`(${hourWordPattern})`, "u");
    const halfMatch = cleanMessage.match(
      new RegExp(`\\bhalb\\s+${spokenHour.source}(?:\\s+uhr)?\\b`, "u")
    );
    if (halfMatch) {
      const nextHour = germanAlarmHourValue(halfMatch[1]);
      if (Number.isInteger(nextHour) && nextHour >= 1 && nextHour <= 24) {
        return { hour: (nextHour + 23) % 24, minute: 30 };
      }
    }

    const quarterMatch = cleanMessage.match(
      new RegExp(
        `\\bviertel\\s+(nach|vor)\\s+${spokenHour.source}(?:\\s+uhr)?\\b`,
        "u"
      )
    );
    if (quarterMatch) {
      const referencedHour = germanAlarmHourValue(quarterMatch[2]);
      if (
        Number.isInteger(referencedHour) &&
        referencedHour >= 0 &&
        referencedHour <= 23
      ) {
        return quarterMatch[1] === "vor"
          ? { hour: (referencedHour + 23) % 24, minute: 45 }
          : { hour: referencedHour, minute: 15 };
      }
    }

    const numericMatch = cleanMessage.match(
      /\b(?:um|auf|fur|gegen)\s*(\d{1,2})(?:\s*[:.]\s*(\d{1,2}))?\s*(?:uhr)?\b/u
    ) || cleanMessage.match(
      /\b(\d{1,2})\s*uhr(?:\s*(\d{1,2}))?\b/u
    ) || cleanMessage.match(
      /\b(\d{1,2})\s*[:.]\s*(\d{2})\b/u
    );
    if (numericMatch) {
      const hour = Number(numericMatch[1]);
      const minute = Number(numericMatch[2] || 0);
      return { hour, minute };
    }

    const wordMatch = cleanMessage.match(
      new RegExp(
        `\\b(?:um|auf|fur|gegen)\\s+${spokenHour.source}(?:\\s+uhr)?\\b`,
        "u"
      )
    ) || cleanMessage.match(
      new RegExp(`\\b${spokenHour.source}\\s+uhr\\b`, "u")
    );
    if (!wordMatch) return null;
    return {
      hour: germanAlarmHourValue(wordMatch[1]),
      minute: 0
    };
  }

  function relativeAlarmTimeFromMessage(value) {
    const text = normalizeNoteSearchText(value);
    const match = text.match(
      /\bin\s+(?:(\d{1,4})|(ein(?:e|er|em)?))\s*(min(?:ute|uten)?|std\.?|stunde|stunden)\b/u
    );
    if (!match) return null;

    const amount = match[1] ? Number(match[1]) : 1;
    const isHours = /^(?:std|stunde)/u.test(match[3]);
    const relativeMinutes = amount * (isHours ? 60 : 1);
    if (!Number.isInteger(relativeMinutes) || relativeMinutes < 1 || relativeMinutes > 7 * 24 * 60) {
      return null;
    }

    const target = new Date(Date.now() + relativeMinutes * 60 * 1000);
    return {
      hour: target.getHours(),
      minute: target.getMinutes(),
      relativeMinutes
    };
  }

  function alarmClockRequestFromMessage(value) {
    const cleanMessage = stripHoloInvocation(value);
    if (!cleanMessage) return null;
    const normalizedMessage = normalizeNoteSearchText(cleanMessage);

    if (
      /^(?:bitte\s+)?(?:öffne|oeffne|starte|zeige)\s+(?:mir\s+)?(?:bitte\s+)?(?:(?:den|meinen|die|meine)\s+)?(?:wecker|alarme?|uhr(?:en)?-?app)[.!?]*$/i.test(cleanMessage) ||
      /^(?:bitte\s+)?(?:meine\s+)?(?:wecker|alarme?)\s+(?:öffnen|oeffnen|zeigen)[.!?]*$/i.test(cleanMessage) ||
      (
        /\b(?:wecker|alarme?|uhr(?:en)?-?app)\b/u.test(normalizedMessage) &&
        /\b(?:offn(?:est|en|et|e)?|zeig(?:en|st|t|e)?|start(?:est|en|et|e)?)\b/u.test(normalizedMessage) &&
        !alarmClockTimeFromMessage(cleanMessage)
      )
    ) {
      return { action: "open" };
    }

    const isAlarmRequest =
      /\b(?:wecker|alarme?)\b/u.test(normalizedMessage) ||
      /\b(?:weck(?:e|en)?(?:\s+(?:mich|uns))?|geweckt)\b/u.test(normalizedMessage);
    const isSetRequest =
      /\b(?:stell(?:en|st|t|e)?|setz(?:en|t|e)?|mach(?:en|st|t|e)?|weck(?:en|st|t|e)?|geweckt)\b/u.test(normalizedMessage) ||
      /\b(?:brauch(?:en|st|t|e)|mocht(?:est|en|et|e)|will|wollen|hatte\s+gern)\b/u.test(normalizedMessage);
    if (!isAlarmRequest || !isSetRequest) return null;

    const relativeTime = relativeAlarmTimeFromMessage(cleanMessage);
    const time = relativeTime || alarmClockTimeFromMessage(cleanMessage);
    if (!time) return null;
    const { hour, minute } = time;
    if (
      !Number.isInteger(hour) ||
      !Number.isInteger(minute) ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      return null;
    }

    const labelMatch = cleanMessage.match(
      /\b(?:mit\s+(?:dem\s+)?(?:namen|text)|namens)\s+(.+?)[.!?]*$/i
    );
    const label = cleanExplicitSaveContent(labelMatch?.[1] || "Human Holo");
    return {
      action: "set",
      hour,
      minute,
      ...(relativeTime ? { relativeMinutes: relativeTime.relativeMinutes } : {}),
      label: label || "Human Holo"
    };
  }

  function explicitSaveRequestFromMessage(message) {
    const cleanMessage = stripHoloInvocation(message);

    if (
      !cleanMessage ||
      /\b(?:samsung\s*)?(?:notes?|noten)\b/i.test(cleanMessage)
    ) {
      return null;
    }

    const listPatterns = [
      {
        pattern: /^(?:bitte\s+)?(?:setz(?:e)?|pack(?:e)?|f(?:u|ü)g(?:e)?|trag(?:e)?|nimm|speicher(?:e)?)\s+(?:mir\s+)?(?:bitte\s+)?(.+?)\s+(?:auf|in|zu(?:r)?)\s+(?:(?:meine|die|der)\s+)?(einkaufs?liste|besorgungsliste|aufgabenliste|to[-\s]?do[-\s]?liste|packliste|wunschliste)(?:\s+(?:ein|hinzu|drauf))?[.!?]*$/i,
        contentGroup: 1,
        listGroup: 2
      },
      {
        pattern: /^(?:bitte\s+)?f(?:u|ü)g(?:e)?\s+(?:(?:meiner|der)\s+)?(einkaufs?liste|besorgungsliste|aufgabenliste|to[-\s]?do[-\s]?liste|packliste|wunschliste)\s+(.+?)\s+hinzu[.!?]*$/i,
        contentGroup: 2,
        listGroup: 1
      },
      {
        pattern: /^(?:bitte\s+)?(.+?)\s+(?:bitte\s+)?(?:in|auf)\s+(?:(?:meine|die|der)\s+)?(einkaufs?liste|besorgungsliste|aufgabenliste|to[-\s]?do[-\s]?liste|packliste|wunschliste)(?:\s+(?:ein|hinein|rein|drauf))?[.!?]*$/i,
        contentGroup: 1,
        listGroup: 2
      },
      {
        pattern: /^(?:bitte\s+)?(?:in|auf)\s+(?:(?:meine|die|der)\s+)?(einkaufs?liste|besorgungsliste|aufgabenliste|to[-\s]?do[-\s]?liste|packliste|wunschliste)\s*[:,-]?\s*(?:bitte\s+)?(.+?)[.!?]*$/i,
        contentGroup: 2,
        listGroup: 1
      }
    ];

    for (const listPattern of listPatterns) {
      const match = cleanMessage.match(listPattern.pattern);
      if (!match) continue;
      const content = cleanExplicitSaveContent(match[listPattern.contentGroup]);
      const rawListTitle = match[listPattern.listGroup];
      if (content) {
        return {
          category: explicitListTitle(rawListTitle),
          content,
          kind: "list-item",
          listTitle: explicitListTitle(rawListTitle)
        };
      }
    }

    if (calendarWriteDestinationFromMessage(cleanMessage)) {
      return null;
    }

    const directMatch = cleanMessage.match(
      /^(?:bitte\s+)?(?:speicher(?:e)?|merk(?:e)?(?:\s+dir\b[,:]?)?|halt(?:e)?\s+(?:das\s+)?fest)\s+(?:mir\s+)?(?:bitte\s+)?[:,-]?\s*(.+?)[.!?]*$/i
    );
    const content = cleanExplicitSaveContent(directMatch?.[1] || "");
    if (!content) return null;

    return {
      category: savedContentCategory(content),
      content,
      kind: "content"
    };
  }

  function explicitSaveUsesPreviousMessage(request) {
    return request?.kind === "content" &&
      /^(?:das|dies|es|diesen\s+inhalt|diese\s+info(?:rmation)?|das\s+bitte)$/i.test(
        String(request.content || "").trim()
      );
  }

  function recentPlainUserMessageForSave() {
    const message = String(previousPlainUserMessage || "").trim();
    const isUsable =
      message &&
      Date.now() - previousPlainUserMessageAt <= 5 * 60 * 1000 &&
      message.length <= 10_000 &&
      !/[?]\s*$/.test(message) &&
      !/^(?:ja|nein|okay|ok|danke|bitte)[.!?]*$/i.test(message);
    return isUsable ? message : "";
  }

  function noteTitleFromText(text, preferredTitle = "") {
    const title = String(preferredTitle || "").trim();
    const firstLine = String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) || "Notiz";
    const selectedTitle = title || firstLine;
    return selectedTitle.length > 72
      ? `${selectedTitle.slice(0, 69).trimEnd()} …`
      : selectedTitle;
  }

  function normalizeStoredNote(note) {
    const text = String(note?.text || "").trim();
    if (!text) {
      return null;
    }

    const createdAt = Number(note?.createdAt || Date.now());
    const updatedAt = Number(note?.updatedAt || createdAt);
    return {
      id: String(note?.id || `note-${createdAt}`),
      title: noteTitleFromText(text, note?.title),
      text: text.slice(0, 10_000),
      source: String(note?.source || "Persönliches Holo"),
      createdAt,
      updatedAt
    };
  }

  function loadPersonalNotes() {
    const storageKey = activeNotesStorageKey();
    if (!storageKey) {
      personalNotes = [];
      return;
    }
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
      personalNotes = Array.isArray(stored)
        ? stored
          .map(normalizeStoredNote)
          .filter(Boolean)
          .sort((left, right) => right.updatedAt - left.updatedAt)
          .slice(0, 250)
        : [];
    } catch (error) {
      console.error("Persönliche Holo-Notizen laden:", error);
      personalNotes = [];
    }
  }

  function storePersonalNotes(nextNotes) {
    const storageKey = activeNotesStorageKey();
    if (!storageKey) {
      return false;
    }
    try {
      const normalized = nextNotes
        .map(normalizeStoredNote)
        .filter(Boolean)
        .sort((left, right) => right.updatedAt - left.updatedAt)
        .slice(0, 250);
      localStorage.setItem(storageKey, JSON.stringify(normalized));
      personalNotes = normalized;
      return true;
    } catch (error) {
      console.error("Persönliche Holo-Notizen speichern:", error);
      return false;
    }
  }

  function noteDateText(note) {
    try {
      return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(note.updatedAt));
    } catch {
      return new Date(note.updatedAt).toLocaleString("de-DE");
    }
  }

  function isShoppingListNote(note) {
    return normalizeNoteSearchText(note?.title) === "einkaufsliste";
  }

  function shoppingItemsFromNote(note) {
    return String(note?.text || "")
      .split(/\r?\n/)
      .map((line) => line.replace(/^[•*\-]\s*/, "").trim())
      .filter(Boolean);
  }

  function buildPersonalNoteCard(note, options = {}) {
    const shopping = options.shopping === true;
    const card = document.createElement("article");
    card.className = shopping ? "noteCard shoppingCard" : "noteCard";
    card.dataset.noteId = note.id;

    const header = document.createElement("div");
    header.className = "noteCardHeader";
    const heading = document.createElement("h3");
    heading.textContent = note.title;
    const source = document.createElement("span");
    source.className = "noteSource";
    source.textContent = note.source;
    header.append(heading, source);

    let body;
    if (shopping) {
      body = document.createElement("ul");
      body.className = "shoppingItems";
      shoppingItemsFromNote(note).forEach((item) => {
        const entry = document.createElement("li");
        entry.textContent = item;
        body.appendChild(entry);
      });
    } else {
      body = document.createElement("p");
      body.className = "noteBody";
      body.textContent = note.text;
    }

    const footer = document.createElement("div");
    footer.className = "noteCardFooter";
    const date = document.createElement("time");
    date.dateTime = new Date(note.updatedAt).toISOString();
    date.textContent = noteDateText(note);
    const actions = document.createElement("div");
    actions.className = "noteActions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.dataset.noteAction = "edit";
    editButton.dataset.noteId = note.id;
    editButton.textContent = "Bearbeiten";
    editButton.setAttribute(
      "aria-label",
      shopping ? "Einkaufsliste bearbeiten" : `Notiz „${note.title}“ bearbeiten`
    );

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.dataset.noteAction = "delete";
    deleteButton.dataset.noteId = note.id;
    deleteButton.textContent = "Löschen";
    deleteButton.setAttribute(
      "aria-label",
      shopping ? "Einkaufsliste löschen" : `Notiz „${note.title}“ löschen`
    );

    actions.append(editButton, deleteButton);
    footer.append(date, actions);
    card.append(header, body, footer);
    return card;
  }

  function renderPersonalNotes(searchText = notesSearchInput?.value || "") {
    const query = normalizeNoteSearchText(searchText);
    const shoppingNotes = personalNotes.filter(isShoppingListNote);
    const regularNotes = personalNotes.filter((note) => !isShoppingListNote(note));
    const visibleNotes = regularNotes.filter((note) => {
      if (!query) return true;
      return normalizeNoteSearchText(
        `${note.title}\n${note.text}\n${note.source}`
      ).includes(query);
    });

    notesList.replaceChildren();
    shoppingList.replaceChildren();

    notesCount.textContent = query
      ? `${visibleNotes.length} von ${regularNotes.length} Notizen`
      : `${regularNotes.length} ${regularNotes.length === 1 ? "Notiz" : "Notizen"}`;

    const shoppingItemCount = shoppingNotes.reduce(
      (total, note) => total + shoppingItemsFromNote(note).length,
      0
    );
    shoppingCount.textContent = `${shoppingItemCount} Artikel`;

    const quickMeta = document.getElementById("notesQuickMeta");
    if (quickMeta) {
      quickMeta.textContent =
        `Kalender · ${shoppingItemCount} Einkäufe · ${regularNotes.length} Notizen`;
    }

    shoppingEmpty.hidden = shoppingNotes.length > 0;
    shoppingNotes.forEach((note) => {
      shoppingList.appendChild(buildPersonalNoteCard(note, { shopping: true }));
    });

    notesEmpty.hidden = visibleNotes.length > 0;
    const emptyTitle = notesEmpty.querySelector("strong");
    const emptyCopy = notesEmpty.querySelector("p");
    if (emptyTitle && emptyCopy) {
      emptyTitle.textContent = query
        ? "Keine passende Notiz gefunden."
        : "Noch keine Notiz.";
      emptyCopy.textContent = query
        ? "Versuch einen anderen Suchbegriff."
        : "Schreib oben etwas hinein oder sag: „Notiere …“";
    }

    visibleNotes.forEach((note) => {
      notesList.appendChild(buildPersonalNoteCard(note));
    });
  }

  function createPersonalNote(text, options = {}) {
    const ownerId = activePersonalOwner();
    if (!ownerId) {
      return {
        success: false,
        identityRequired: true,
        answer: "Die feste Holo-ID ist nicht verfügbar. Es wurde keine Notiz gespeichert."
      };
    }

    const cleanText = String(text || "").trim();
    if (!cleanText) {
      return {
        success: false,
        answer: "Die Notiz ist leer. Sag oder schreib bitte, was ich notieren soll."
      };
    }

    const securityWarning = noteSecurityWarning(cleanText);
    if (securityWarning) {
      return { success: false, securityBlocked: true, answer: securityWarning };
    }

    const now = Date.now();
    const recentDuplicate = personalNotes.find((note) =>
      normalizeNoteSearchText(note.text) === normalizeNoteSearchText(cleanText) &&
      now - Number(note.createdAt || 0) <= 10 * 1000
    );
    if (recentDuplicate) {
      return {
        success: true,
        duplicate: true,
        note: recentDuplicate,
        answer: `Notiz ist bereits gespeichert: ${recentDuplicate.title}`
      };
    }

    const randomPart = globalThis.crypto?.randomUUID?.() ||
      Math.random().toString(36).slice(2, 12);
    const note = normalizeStoredNote({
      id: `note-${randomPart}`,
      title: options.title,
      text: cleanText,
      source: options.source || "Pam’s Holo",
      createdAt: now,
      updatedAt: now
    });

    if (!storePersonalNotes([note, ...personalNotes])) {
      return {
        success: false,
        answer: "Die Notiz konnte auf diesem Handy gerade nicht gespeichert werden."
      };
    }

    renderPersonalNotes();
    showToast("Notiz in Pam’s Holo gespeichert ✅️");
    return {
      success: true,
      note,
      answer: `Notiz gespeichert: ${note.title}`
    };
  }

  function appendPersonalListItem(listTitle, item) {
    const ownerId = activePersonalOwner();
    if (!ownerId) {
      return {
        success: false,
        identityRequired: true,
        answer: "Die feste Holo-ID ist nicht verfügbar. Es wurde nichts gespeichert."
      };
    }

    const cleanItem = cleanExplicitSaveContent(item);
    if (!cleanItem) {
      return {
        success: false,
        answer: "Der Eintrag ist leer. Es wurde nichts gespeichert."
      };
    }

    const securityWarning = noteSecurityWarning(cleanItem);
    if (securityWarning) {
      return { success: false, securityBlocked: true, answer: securityWarning };
    }

    const cleanListTitle = explicitListTitle(listTitle);
    const normalizedTitle = normalizeNoteSearchText(cleanListTitle);
    const existing = personalNotes.find(
      (note) => normalizeNoteSearchText(note.title) === normalizedTitle
    );
    const existingLines = String(existing?.text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const normalizedItem = normalizeNoteSearchText(cleanItem);
    const duplicate = existingLines.some(
      (line) => normalizeNoteSearchText(line.replace(/^[•*\-]\s*/, "")) === normalizedItem
    );

    if (duplicate) {
      return {
        success: true,
        duplicate: true,
        note: existing,
        answer: `„${cleanItem}“ steht bereits auf deiner ${cleanListTitle}.`
      };
    }

    const now = Date.now();
    const randomPart = globalThis.crypto?.randomUUID?.() ||
      Math.random().toString(36).slice(2, 12);
    const updated = normalizeStoredNote({
      id: existing?.id || `note-${randomPart}`,
      title: cleanListTitle,
      text: [...existingLines, `• ${cleanItem}`].join("\n"),
      source: "Auf Zuruf gespeichert",
      createdAt: existing?.createdAt || now,
      updatedAt: now
    });
    const remaining = personalNotes.filter((note) => note.id !== existing?.id);

    if (!storePersonalNotes([updated, ...remaining])) {
      return {
        success: false,
        answer: `Die ${cleanListTitle} konnte auf diesem Handy gerade nicht gespeichert werden.`
      };
    }

    renderPersonalNotes();
    showToast(`${cleanListTitle} gespeichert ✅️`);
    return {
      success: true,
      note: updated,
      answer: `„${cleanItem}“ steht jetzt dauerhaft auf deiner ${cleanListTitle} ✅️`
    };
  }

  function saveExplicitRequest(request) {
    if (request?.kind === "list-item") {
      return appendPersonalListItem(request.listTitle, request.content);
    }

    const content = cleanExplicitSaveContent(request?.content);
    const category = String(request?.category || "Gespeicherter Inhalt");
    const result = createPersonalNote(content, {
      source: "Auf Zuruf gespeichert",
      title: `${category}: ${noteTitleFromText(content)}`
    });
    if (!result.success) return result;

    const preview = content.length > 180
      ? `${content.slice(0, 177).trimEnd()} …`
      : content;
    return {
      ...result,
      answer: `${category} dauerhaft gespeichert ✅️: ${preview}`
    };
  }

  function findPersonalNotes(query) {
    const cleanQuery = normalizeNoteSearchText(query);
    if (!cleanQuery) {
      return [];
    }

    const exactMatches = personalNotes.filter((note) =>
      normalizeNoteSearchText(note.id) === cleanQuery ||
      normalizeNoteSearchText(note.title) === cleanQuery ||
      normalizeNoteSearchText(note.text) === cleanQuery
    );
    if (exactMatches.length) {
      return exactMatches;
    }

    return personalNotes.filter((note) =>
      normalizeNoteSearchText(`${note.title}\n${note.text}`).includes(cleanQuery)
    );
  }

  function updatePersonalNote(query, text) {
    if (!activePersonalOwner()) {
      return {
        success: false,
        identityRequired: true,
        answer: "Die feste Holo-ID ist nicht verfügbar. Es wurde nichts geändert."
      };
    }
    const cleanText = String(text || "").trim();
    if (!cleanText) {
      return { success: false, answer: "Der neue Notiztext ist leer." };
    }
    const securityWarning = noteSecurityWarning(cleanText);
    if (securityWarning) {
      return { success: false, securityBlocked: true, answer: securityWarning };
    }
    const matches = findPersonalNotes(query);
    if (matches.length !== 1) {
      return {
        success: false,
        ambiguous: matches.length > 1,
        answer: matches.length
          ? "Ich habe mehrere passende Notizen gefunden. Bitte nenne den Titel genauer."
          : `Ich finde keine Notiz zu „${String(query || "").trim()}“.`
      };
    }
    const current = matches[0];
    const automaticTitle = current.title === noteTitleFromText(current.text);
    const updated = normalizeStoredNote({
      ...current,
      title: automaticTitle ? noteTitleFromText(cleanText) : current.title,
      text: cleanText,
      updatedAt: Date.now()
    });
    const remaining = personalNotes.filter((note) => note.id !== current.id);
    if (!storePersonalNotes([updated, ...remaining])) {
      return { success: false, answer: "Die Notiz konnte gerade nicht geändert werden." };
    }
    renderPersonalNotes();
    showToast("Notiz geändert ✅️");
    return { success: true, note: updated, answer: `Notiz geändert: ${updated.title}` };
  }

  function deletePersonalNote(query) {
    if (!activePersonalOwner()) {
      return {
        success: false,
        identityRequired: true,
        answer: "Die feste Holo-ID ist nicht verfügbar. Es wurde nichts gelöscht."
      };
    }
    const matches = findPersonalNotes(query);
    if (matches.length !== 1) {
      return {
        success: false,
        ambiguous: matches.length > 1,
        answer: matches.length
          ? "Ich habe mehrere passende Notizen gefunden. Bitte nenne den Titel genauer."
          : `Ich finde keine Notiz zu „${String(query || "").trim()}“.`
      };
    }
    const note = matches[0];
    if (!storePersonalNotes(personalNotes.filter((entry) => entry.id !== note.id))) {
      return { success: false, answer: "Die Notiz konnte gerade nicht gelöscht werden." };
    }
    renderPersonalNotes();
    showToast("Notiz gelöscht");
    return { success: true, deleted: true, answer: `Notiz gelöscht: ${note.title}` };
  }

  function personalNoteListAnswer(query = "") {
    const matches = query
      ? findPersonalNotes(query)
      : personalNotes;
    if (!matches.length) {
      return query
        ? `Ich finde keine Notiz zu „${query}“. Die Notizen bleiben unverändert.`
        : `Du hast noch keine Notiz in ${activeInstanceName()} gespeichert.`;
    }

    const listed = matches.slice(0, 12).map((note, index) => {
      const preview = note.text.length > 180
        ? `${note.text.slice(0, 177).trimEnd()} …`
        : note.text;
      return `${index + 1}. ${note.title}: ${preview}`;
    });
    const remainder = matches.length > listed.length
      ? `\nAußerdem gibt es noch ${matches.length - listed.length} weitere.`
      : "";
    return `${matches.length} ${matches.length === 1 ? "Notiz" : "Notizen"}:\n${listed.join("\n")}${remainder}`;
  }

  async function openSamsungNotesForReview(actionText = "ansehen") {
    if (!activePersonalOwner()) {
      return {
        success: false,
        identityRequired: true,
        answer: "Die feste Holo-ID ist nicht verfügbar."
      };
    }
    const plugin = getPhoneContactsPlugin();
    if (!plugin) {
      return {
        success: false,
        answer: "Samsung Notes kann nur aus der Human-Holo-App für Android geöffnet werden."
      };
    }

    try {
      await plugin.openSamsungNotes();
      return {
        success: true,
        opened: true,
        saved: false,
        answer: `Samsung Notes ist geöffnet. Du kannst deine Notizen dort ${actionText}.`
      };
    } catch (error) {
      console.error("Samsung Notes öffnen:", error);
      return {
        success: false,
        answer: String(
          error?.message ||
          "Samsung Notes konnte gerade nicht geöffnet werden."
        )
      };
    }
  }

  async function prepareSamsungNote(text) {
    if (!activePersonalOwner()) {
      return {
        success: false,
        identityRequired: true,
        answer: "Die feste Holo-ID ist nicht verfügbar."
      };
    }
    const cleanText = String(text || "").trim();
    if (!cleanText) {
      return {
        success: false,
        answer: "Die Notiz ist leer. Sag oder schreib bitte, was in Samsung Notes stehen soll."
      };
    }

    const securityWarning = noteSecurityWarning(cleanText);
    if (securityWarning) {
      return { success: false, securityBlocked: true, answer: securityWarning };
    }

    const plugin = getPhoneContactsPlugin();
    if (!plugin) {
      return {
        success: false,
        answer: "Samsung Notes kann nur aus der Human-Holo-App für Android geöffnet werden."
      };
    }

    const title = noteTitleFromText(cleanText);
    const preview = cleanText.length > 160
      ? `${cleanText.slice(0, 160)} …`
      : cleanText;

    try {
      const result = await plugin.prepareSamsungNote({
        title,
        text: cleanText
      });
      if (
        !result?.opened ||
        (result?.contentTransferred !== true && result?.clipboardPrepared !== true)
      ) {
        return {
          success: false,
          answer:
            "Samsung Notes hat den Text nicht bestätigt übernommen. Es wurde nichts gespeichert."
        };
      }

      lastPreparedSamsungNoteText = cleanText;
      lastPreparedSamsungNoteAt = Date.now();
      showToast("Entwurf an Samsung Notes übergeben · dort noch speichern");
      return {
        success: true,
        opened: true,
        saved: false,
        title,
        handoffMode: String(result?.handoffMode || ""),
        clipboardPrepared: Boolean(result?.clipboardPrepared),
        answer: result?.clipboardPrepared
          ? `Samsung Notes ist geöffnet und der Entwurf „${preview}“ ist kopiert. ` +
            "Füge ihn dort ein und tippe auf Speichern."
          : `Samsung Notes ist mit diesem Entwurf geöffnet: „${preview}“. ` +
            "Bitte dort noch speichern."
      };
    } catch (error) {
      console.error("Samsung-Notes-Übergabe:", error);
      return {
        success: false,
        answer: String(
          error?.message ||
          "Samsung Notes konnte die Notiz gerade nicht übernehmen. Es wurde nichts gespeichert."
        )
      };
    }
  }

  async function executeNotesTool(name, args = {}) {
    if (name === "create_personal_note") {
      const text = String(args?.text || "").trim();
      const localResult = createPersonalNote(text, {
        source: "Auf Zuruf notiert"
      });
      if (!localResult?.success) {
        return localResult;
      }

      let handoffResult = null;
      if (args?.openSamsungNotes === true) {
        handoffResult = await prepareSamsungNote(text);
      }

      void notifyGalaxyWatchSummary("note");
      return {
        ...(handoffResult || {}),
        success: true,
        opened: Boolean(handoffResult?.opened),
        saved: true,
        localSaved: true,
        destination: "Notizen",
        note: localResult.note,
        answer: handoffResult
          ? `Unter Wichtiges → Notizen gespeichert. ${handoffResult.answer}`
          : "Unter Wichtiges → Notizen gespeichert ✅️"
      };
    }

    if (name === "search_personal_notes") {
      const query = String(args?.query || "").trim();
      showView("notes");
      notesSearchInput.value = query;
      renderPersonalNotes(query);
      return {
        success: true,
        opened: true,
        notes: query ? findPersonalNotes(query) : personalNotes,
        answer: personalNoteListAnswer(query)
      };
    }

    if (name === "update_personal_note") {
      return updatePersonalNote(args?.query, args?.text);
    }

    if (name === "delete_personal_note") {
      return deletePersonalNote(args?.query);
    }

    return { success: false, answer: "Unbekannte Notiz-Funktion." };
  }

  window.executeSolHoloNotesTool = executeNotesTool;

  function clampCloneValue(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, Number(value) || 0));
  }

  function normalizedCloneMouth(value) {
    return {
      x: clampCloneValue(value?.x || 0.5, 0.08, 0.92),
      y: clampCloneValue(value?.y || 0.58, 0.08, 0.92),
      width: clampCloneValue(value?.width || 0.16, 0.06, 0.32),
      height: clampCloneValue(value?.height || 0.075, 0.035, 0.18)
    };
  }

  function updateCloneMouthMarker() {
    const mouth = normalizedCloneMouth(customCloneMouth);
    profileMouthMarker.style.left = `${mouth.x * 100}%`;
    profileMouthMarker.style.top = `${mouth.y * 100}%`;
    profileMouthMarker.style.width = `${mouth.width * 100}%`;
    profileMouthMarker.style.height = `${mouth.height * 100}%`;
    profileMouthMarker.hidden =
      !customClonePhoto || !cloneMouthCalibrationActive;
  }

  function updateCloneMouthControls() {
    const mouth = normalizedCloneMouth(customCloneMouth);
    const xPercent = mouth.x * 100;
    const yPercent = mouth.y * 100;
    const widthPercent = mouth.width * 100;
    const heightPercent = mouth.height * 100;
    profileMouthX.value = String(xPercent);
    profileMouthY.value = String(yPercent);
    profileMouthWidth.value = String(widthPercent);
    profileMouthHeight.value = String(heightPercent);
    profileMouthXValue.textContent = `${xPercent.toFixed(1)} %`;
    profileMouthYValue.textContent = `${yPercent.toFixed(1)} %`;
    profileMouthWidthValue.textContent = `${widthPercent.toFixed(1)} %`;
    profileMouthHeightValue.textContent = `${heightPercent.toFixed(1)} %`;
  }

  function applyCustomCloneAppearance(photo, mouth) {
    customClonePhoto = String(photo || "");
    customCloneMouth = normalizedCloneMouth(mouth);

    if (!customClonePhoto) {
      cloneMouthCalibrationActive = false;
      cloneMouthBeforeCalibration = null;
      profileCloneImage.src = "human-holo-logo.png";
      profileDisplayImage.src = "human-holo-logo.png";
      profileDisplayImage.classList.remove("customPhoto");
      profilePhotoButton.classList.remove("customPhoto", "calibrating");
      profilePhotoActions.hidden = true;
      profileMouthButton.hidden = false;
      profileMouthControls.hidden = true;
      profileMouthMarker.hidden = true;
      profilePhotoHelp.textContent =
        "Bild antippen und aus der Galerie wählen · bleibt nur auf diesem Gerät.";
      window.SolHoloClone?.reset();
      return;
    }

    profileCloneImage.src = customClonePhoto;
    profileDisplayImage.src = customClonePhoto;
    profileDisplayImage.classList.add("customPhoto");
    profilePhotoButton.classList.add("customPhoto");
    profilePhotoActions.hidden = false;
    profileMouthButton.hidden = true;
    profileMouthControls.hidden = true;
    profileMouthMarker.hidden = true;
    profilePhotoHelp.textContent =
      "Das gewählte Bild wird für Original Full Sync lokal neu zugeordnet …";
    updateCloneMouthMarker();
    window.SolHoloClone?.setImage(customClonePhoto);
    window.SolHoloClone?.setMouthGeometry(customCloneMouth);
  }

  function restoreCustomCloneAppearance() {
    const legacyAppearanceQuarantined = quarantineLegacyCloneAppearance();
    applyCustomCloneAppearance("", null);
    const keys = activeCloneStorageKeys();
    if (!keys) {
      profilePhotoHelp.textContent =
        "Die feste Holo-ID ist nicht verfügbar. Bilder bleiben gesperrt.";
      return;
    }

    const unverifiedAppearanceQuarantined =
      quarantineUnverifiedPamCloneAppearance(keys);

    if (unverifiedAppearanceQuarantined) {
      profilePhotoHelp.textContent =
        "Ein nicht eindeutig bestätigtes Bild wurde gesperrt und separiert. Bitte wähle Pams eigenes Bild erneut aus.";
      return;
    }

    try {
      const savedPhoto = localStorage.getItem(keys.photo) || "";
      const savedMouth = JSON.parse(
        localStorage.getItem(keys.mouth) || "null"
      );
      if (savedPhoto.startsWith("data:image/")) {
        applyCustomCloneAppearance(savedPhoto, savedMouth);
      } else if (legacyAppearanceQuarantined) {
        profilePhotoHelp.textContent =
          "Ein altes, nicht eindeutig zugeordnetes Bild wurde sicher separiert. Bitte wähle Pams eigenes Bild erneut aus.";
      }
    } catch (error) {
      console.error("Persönliches Holo-Bild wiederherstellen:", error);
    }
  }

  window.addEventListener("sol-holo-face-rig-status", event => {
    if (!customClonePhoto || cloneMouthCalibrationActive) {
      return;
    }

    const state = String(event.detail?.state || "off");

    if (state === "ready") {
      profileMouthButton.hidden = true;
      profilePhotoHelp.textContent =
        "Original Full Sync bereit · Gesicht, Haare, Kopf und sichtbarer Körper bewegen sich zusammenhängend mit Pam’s Holo.";
      return;
    }

    if (state === "loading" || state === "analysing") {
      profileMouthButton.hidden = true;
      profilePhotoHelp.textContent =
        "Das gewählte Bild wird für Original Full Sync lokal neu zugeordnet …";
      return;
    }

    if (state === "fallback") {
      profileMouthButton.hidden = false;
      profilePhotoHelp.textContent =
        "Bild nicht eindeutig erkannt · die sichere Mundposition kann manuell festgelegt werden.";
    }
  });

  function readImageElement(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Bild konnte nicht geöffnet werden."));
      image.src = source;
    });
  }

  async function prepareClonePhoto(file) {
    if (!file || !String(file.type || "").startsWith("image/")) {
      throw new Error("Bitte ein Bild aus der Galerie auswählen.");
    }

    const source = URL.createObjectURL(file);
    try {
      const image = await readImageElement(source);
      const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
      const scale = Math.min(1, 1200 / Math.max(1, largestSide));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d", { alpha: false });
      context.fillStyle = "#020714";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/webp", 0.86);
    } finally {
      URL.revokeObjectURL(source);
    }
  }

  function beginCloneMouthCalibration() {
    if (!requireActivePersonalOwner()) {
      return;
    }
    if (!customClonePhoto) {
      profilePhotoInput.click();
      return;
    }

    cloneMouthBeforeCalibration = {
      ...customCloneMouth
    };
    cloneMouthCalibrationActive = true;
    profilePhotoButton.classList.add("calibrating");
    profileMouthControls.hidden = false;
    updateCloneMouthControls();
    updateCloneMouthMarker();
    profilePhotoButton.setAttribute(
      "aria-label",
      "Mundbox durch Antippen genau positionieren"
    );
    profilePhotoHelp.textContent =
      "Mund antippen, Position und Größe fein einstellen, dann mit ✅ bestätigen.";
    showToast("Tippe auf den Mund und stelle die blaue Box genau ein 👄");
  }

  function moveCloneMouthCalibration(event) {
    const imageRect = profileCloneImage.getBoundingClientRect();
    if (imageRect.width <= 0 || imageRect.height <= 0) {
      return;
    }

    customCloneMouth = normalizedCloneMouth({
      ...customCloneMouth,
      x: (event.clientX - imageRect.left) / imageRect.width,
      y: (event.clientY - imageRect.top) / imageRect.height
    });

    updateCloneMouthMarker();
    updateCloneMouthControls();
    window.SolHoloClone?.setMouthGeometry(customCloneMouth);
    profilePhotoHelp.textContent =
      "Die blaue Box kann weiter versetzt oder mit den Reglern angepasst werden.";
  }

  function previewCloneMouthGeometry() {
    customCloneMouth = normalizedCloneMouth({
      x: Number(profileMouthX.value) / 100,
      y: Number(profileMouthY.value) / 100,
      width: Number(profileMouthWidth.value) / 100,
      height: Number(profileMouthHeight.value) / 100
    });
    updateCloneMouthControls();
    updateCloneMouthMarker();
    window.SolHoloClone?.setMouthGeometry(customCloneMouth);
  }

  function confirmCloneMouthCalibration() {
    const keys = activeCloneStorageKeys();
    if (!keys) {
      cancelCloneMouthCalibration();
      showToast("Die feste Holo-ID ist nicht verfügbar.");
      return;
    }
    cloneMouthCalibrationActive = false;
    cloneMouthBeforeCalibration = null;
    profilePhotoButton.classList.remove("calibrating");
    profileMouthControls.hidden = true;
    profileMouthMarker.hidden = true;
    profilePhotoButton.setAttribute(
      "aria-label",
      `Bild für ${activePersonalName()}s Holo aus der Galerie ändern`
    );
    profilePhotoHelp.textContent =
      "Mundposition gespeichert · Original Full Sync folgt der echten Holo-Stimme.";
    window.SolHoloClone?.setMouthGeometry(customCloneMouth);

    try {
      localStorage.setItem(keys.mouth, JSON.stringify(customCloneMouth));
    } catch (error) {
      console.error("Persönliche Holo-Mundposition speichern:", error);
    }

    showToast("Mundbox bestätigt. Original Full Sync ist bereit ✅️");
  }

  function cancelCloneMouthCalibration() {
    if (cloneMouthBeforeCalibration) {
      customCloneMouth = normalizedCloneMouth(cloneMouthBeforeCalibration);
    }
    cloneMouthCalibrationActive = false;
    cloneMouthBeforeCalibration = null;
    profilePhotoButton.classList.remove("calibrating");
    profileMouthControls.hidden = true;
    profileMouthMarker.hidden = true;
    profilePhotoButton.setAttribute(
      "aria-label",
      `Bild für ${activePersonalName() || "das persönliche"} Holo aus der Galerie ändern`
    );
    profilePhotoHelp.textContent =
      "Änderung abgebrochen · die bisherige Mundbox bleibt gespeichert.";
    window.SolHoloClone?.setMouthGeometry(customCloneMouth);
  }

  function showView(viewName) {
    const nextView = views[viewName] || views.home;
    const activeViewName = views[viewName] ? viewName : "home";

    Object.values(views).forEach((view) => {
      view?.classList.remove("active");
    });

    nextView.classList.add("active");
    solApp.dataset.activeView = activeViewName;

    const activeNavView =
      activeViewName === "settings"
        ? "profile"
        : activeViewName === "memorial"
          ? "memory"
          : activeViewName === "medication"
            ? "home"
          : activeViewName;

    currentBottomNav.querySelectorAll(".navItem").forEach((button) => {
      const isActive = button.dataset.view === activeNavView;
      button.classList.toggle("active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    window.scrollTo({ top: 0, behavior: "smooth" });

    if (viewName === "services" || viewName === "settings") {
      void loadGoogleStatus();
    }

    if (viewName === "services" || viewName === "settings") {
      void loadWhatsAppStatus();
      void loadWakeStatus();
      void loadPhoneStatus();
      void loadHealthStatus();
      void loadSmartThingsStatus();
      void renderGoogleMapsStatus();
      void loadLiveWeatherStatus();
      renderSamsungNotesStatus();
    }

    if (viewName === "notes") {
      renderPersonalNotes();
    }

    if (viewName === "memorial") {
      void loadMemorialEntries();
    }

    if (viewName === "chat" && typeof updateMouthGeometry === "function") {
      window.requestAnimationFrame(updateMouthGeometry);
    }

    if (viewName === "chat" && typeof scrollChatToLatest === "function") {
      scrollChatToLatest();
    }
  }

  async function askSol(prompt) {
    const cleanPrompt = normalizedVisibleText(prompt).trim();
    if (!cleanPrompt) {
      return;
    }

    showView("chat");
    const chatInput = document.getElementById("messageInput");
    chatInput.value = cleanPrompt;
    chatInput.dispatchEvent(
      new Event(
        "input",
        {
          bubbles: true
        }
      )
    );

    if (typeof sendMessage === "function") {
      await sendMessage();
    }
  }

  function isMedicationImageRequest(message, hasImage) {
    const cleanMessage = String(message || "").trim();
    return Boolean(
      hasImage &&
      medicationRecognitionPattern.test(cleanMessage) &&
      medicationRecognitionActionPattern.test(cleanMessage)
    );
  }

  function grantMedicationConsentForNextPhoto() {
    medicationConsentExpiresAt = Date.now() + 5 * 60 * 1000;
  }

  function authorizeMedicationRecognition({ message, hasImage }) {
    if (!isMedicationImageRequest(message, hasImage)) {
      return {
        required: false,
        granted: false
      };
    }

    if (Date.now() <= medicationConsentExpiresAt) {
      medicationConsentExpiresAt = 0;
      return {
        required: true,
        granted: true
      };
    }

    const granted = window.confirm(medicationRecognitionDisclosure);
    medicationConsentExpiresAt = 0;

    return {
      required: true,
      granted
    };
  }

  function beginMedicationRecognition(source) {
    grantMedicationConsentForNextPhoto();
    showView("chat");

    const chatInput = document.getElementById("messageInput");
    chatInput.value = medicationRecognitionPrompt;
    chatInput.dispatchEvent(new Event("input", { bubbles: true }));

    if (source === "camera") {
      document.getElementById("imageButton")?.click();
      return;
    }

    document.getElementById("medicationGalleryInput")?.click();
  }

  window.SolHoloMedicationRecognition = Object.freeze({
    authorizeRequest: authorizeMedicationRecognition,
    isRequest: isMedicationImageRequest,
    prompt: medicationRecognitionPrompt
  });

  async function startSolVoice() {
    showView("chat");

    if (!window.SolHoloIdentity?.selected()) {
      window.SolHoloIdentity?.require();
      showToast("Die feste Holo-ID ist nicht verfügbar.");
      return;
    }

    if (
      typeof enterVoiceMode !== "function" ||
      typeof startLiveConversation !== "function"
    ) {
      await resumeWakeListeningAfterConversation();
      showToast("Der Sprachmodus ist gerade nicht verfügbar.");
      return;
    }

    enterVoiceMode();
    await pauseWakeListeningForConversation();
    await startLiveConversation();
  }

  async function loadGoogleStatus() {
    const serviceState = document.getElementById("googleAccountStatus");
    const profileState = document.getElementById("profileGoogleState");
    const todayState = document.getElementById("todayCardMeta");
    const identity = window.SolHoloIdentity?.selected?.();

    if (!identity) {
      googleConnected = false;
      googleStatus = {
        connected: false,
        allRequestedAccessGranted: false,
        services: {}
      };
      serviceState.textContent = "Holo-ID nicht verfügbar";
      serviceState.classList.add("setup");
      profileState.textContent = "Persönliche Auswahl nötig";
      todayState.textContent = "Kalender bleibt getrennt";
      return;
    }

    const identityQuery = new URLSearchParams({
      ownerId: identity.ownerId,
      selectedSpeakerId: identity.speakerId
    });

    if (serviceState) {
      serviceState.textContent = "Wird geprüft …";
      serviceState.classList.remove("connected", "setup");
    }

    try {
      const response = await fetch(
        `https://sol-holo.onrender.com/google/status?${identityQuery}`,
        {
          cache: "no-store",
          headers: window.SolHoloTrustedSession?.headers?.() || {}
        }
      );
      const data = await response.json();

      googleStatus = {
        connected: Boolean(response.ok && data?.connected),
        allRequestedAccessGranted: Boolean(
          response.ok && data?.allRequestedAccessGranted
        ),
        services: data?.services || {},
        trustedSessionRequired:
          data?.error === "TRUSTED_APP_SESSION_REQUIRED"
      };
      googleConnected = googleStatus.allRequestedAccessGranted;

      if (googleStatus.trustedSessionRequired) {
        serviceState.textContent = "S23 bestätigen";
        serviceState.classList.add("setup");
        profileState.textContent = "App-Sitzung noch nicht gebunden";
        todayState.textContent = "Kalender bleibt geschützt";
      } else if (googleConnected) {
        serviceState.textContent = "Verbunden";
        serviceState.classList.add("connected");
        profileState.textContent = "Vollständig verbunden";
        todayState.textContent = "Google Kalender verbunden";
      } else if (googleStatus.connected) {
        serviceState.textContent = "Erweitern";
        serviceState.classList.add("setup");
        profileState.textContent = "Weitere Freigabe nötig";
        todayState.textContent = "Google Kalender verbunden";
      } else {
        serviceState.textContent = "Verbinden";
        serviceState.classList.add("setup");
        profileState.textContent = "Noch nicht verbunden";
        todayState.textContent = "Kalender verknüpfen";
      }
    } catch (error) {
      console.error("Google-Kontostatus:", error);
      googleConnected = false;
      googleStatus = {
        connected: false,
        allRequestedAccessGranted: false,
        services: {}
      };
      serviceState.textContent = "Nicht erreichbar";
      serviceState.classList.add("setup");
      profileState.textContent = "Status nicht erreichbar";
      todayState.textContent = "Kalenderstatus offen";
    }
  }

  async function loadSmartThingsStatus() {
    const serviceState = document.getElementById("smartThingsStatus");
    const identity = window.SolHoloIdentity?.selected?.();

    if (!identity) {
      smartThingsStatus = {
        configured: false,
        connected: false,
        selectedDevicesOnly: true,
        actionsRequireConfirmation: true
      };
      serviceState.textContent = "Holo-ID nicht verfügbar";
      serviceState.classList.add("setup");
      return;
    }

    const identityQuery = new URLSearchParams({
      ownerId: identity.ownerId,
      selectedSpeakerId: identity.speakerId
    });
    serviceState.textContent = "Wird geprüft …";
    serviceState.classList.remove("connected", "setup");

    try {
      const response = await fetch(
        `https://sol-holo.onrender.com/smartthings/status?${identityQuery}`,
        {
          cache: "no-store",
          headers: window.SolHoloTrustedSession?.headers?.() || {}
        }
      );
      const data = await response.json();

      smartThingsStatus = {
        configured: Boolean(response.ok && data?.configured),
        connected: Boolean(response.ok && data?.connected),
        selectedDevicesOnly: data?.selectedDevicesOnly !== false,
        actionsRequireConfirmation:
          data?.actionsRequireConfirmation !== false,
        trustedSessionRequired:
          data?.error === "TRUSTED_APP_SESSION_REQUIRED"
      };

      if (smartThingsStatus.trustedSessionRequired) {
        serviceState.textContent = "S23 bestätigen";
        serviceState.classList.add("setup");
      } else if (smartThingsStatus.connected) {
        serviceState.textContent = "Zuhause verbunden";
        serviceState.classList.add("connected");
      } else if (smartThingsStatus.configured) {
        serviceState.textContent = "Verbinden";
        serviceState.classList.add("setup");
      } else {
        serviceState.textContent = "Einrichtung nötig";
        serviceState.classList.add("setup");
      }
    } catch (error) {
      console.error("SmartThings-Status:", error);
      smartThingsStatus = {
        configured: false,
        connected: false,
        selectedDevicesOnly: true,
        actionsRequireConfirmation: true
      };
      serviceState.textContent = "Nicht erreichbar";
      serviceState.classList.add("setup");
    }
  }

  function getWhatsAppDrivingModePlugin() {
    return window.Capacitor?.Plugins?.WhatsAppDrivingMode || null;
  }

  function renderWhatsAppStatus(nextStatus) {
    const statusElement = document.getElementById("whatsappDriveStatus");
    const row = document.getElementById("whatsappDriveRow");

    whatsappStatus = {
      supported: Boolean(nextStatus?.supported),
      permissionGranted: Boolean(nextStatus?.permissionGranted),
      enabled: Boolean(nextStatus?.enabled),
      active: Boolean(nextStatus?.active)
    };

    statusElement.classList.remove("connected", "setup");
    row.setAttribute("aria-pressed", String(whatsappStatus.active));

    if (!whatsappStatus.supported) {
      statusElement.textContent = "Nur Android";
      statusElement.classList.add("setup");
    } else if (!whatsappStatus.permissionGranted) {
      statusElement.textContent = "Freigabe nötig";
      statusElement.classList.add("setup");
    } else if (whatsappStatus.active) {
      statusElement.textContent = "Aktiv";
      statusElement.classList.add("connected");
    } else {
      statusElement.textContent = "Aus";
      statusElement.classList.add("setup");
    }
  }

  async function loadWhatsAppStatus() {
    const plugin = getWhatsAppDrivingModePlugin();
    if (!plugin) {
      renderWhatsAppStatus({ supported: false });
      return whatsappStatus;
    }

    try {
      const status = await plugin.getStatus();
      renderWhatsAppStatus(status);
    } catch (error) {
      console.error("WhatsApp-Fahrmodusstatus:", error);
      renderWhatsAppStatus({ supported: true });
      document.getElementById("whatsappDriveStatus").textContent =
        "Status offen";
    }

    return whatsappStatus;
  }

  async function toggleWhatsAppDrivingMode() {
    if (whatsappActionRunning) {
      return;
    }

    if (!requireActivePersonalOwner()) {
      return;
    }

    const plugin = getWhatsAppDrivingModePlugin();
    if (!plugin) {
      showToast("Der WhatsApp-Fahrmodus ist nur in der Android-App verfügbar.");
      renderWhatsAppStatus({ supported: false });
      return;
    }

    const row = document.getElementById("whatsappDriveRow");
    whatsappActionRunning = true;
    row.disabled = true;

    try {
      const currentStatus = await plugin.getStatus();

      if (!currentStatus.permissionGranted) {
        await plugin.setEnabled({ enabled: true });
        showToast(
          `Bitte erlaube ${activeInstanceName()} jetzt den Benachrichtigungszugriff. ` +
          "Danach ist der WhatsApp-Fahrmodus aktiv."
        );
        await plugin.openNotificationAccessSettings();
        renderWhatsAppStatus({
          supported: true,
          permissionGranted: false,
          enabled: true,
          active: false
        });
        return;
      }

      const nextStatus = await plugin.setEnabled({
        enabled: !currentStatus.active
      });
      renderWhatsAppStatus(nextStatus);

      if (nextStatus.active) {
        showToast(
          "WhatsApp-Fahrmodus aktiv: Neue Nachrichten werden vorgelesen."
        );
      } else {
        showToast("WhatsApp-Fahrmodus ausgeschaltet.");
      }
    } catch (error) {
      console.error("WhatsApp-Fahrmodus:", error);
      showToast(
        "Der WhatsApp-Fahrmodus konnte gerade nicht geändert werden."
      );
      await loadWhatsAppStatus();
    } finally {
      whatsappActionRunning = false;
      row.disabled = false;
    }
  }

  function getPhoneContactsPlugin() {
    return window.Capacitor?.Plugins?.PhoneContacts || null;
  }

  function getGalaxyWatchBridgePlugin() {
    return window.Capacitor?.Plugins?.GalaxyWatchBridge || null;
  }

  async function loadAlarmClockStatus() {
    const statusElement = document.getElementById("alarmClockStatus");
    if (!statusElement) return;
    statusElement.classList.remove("connected", "setup");
    const plugin = getPhoneContactsPlugin();
    if (typeof plugin?.getAlarmClockStatus !== "function") {
      statusElement.textContent = "App-Update nötig";
      statusElement.classList.add("setup");
      return;
    }
    try {
      const status = await plugin.getAlarmClockStatus();
      statusElement.textContent = status?.supported ? "Bereit" : "Nicht verfügbar";
      statusElement.classList.add(status?.supported ? "connected" : "setup");
    } catch (error) {
      console.error("Wecker-Status:", error);
      statusElement.textContent = "Prüfung fehlgeschlagen";
      statusElement.classList.add("setup");
    }
  }

  async function openAlarmClockForRequest(request = { action: "open" }) {
    const plugin = getPhoneContactsPlugin();
    if (!plugin) {
      return {
        success: false,
        opened: false,
        answer: "Der Android-Wecker ist nur in der Human-Holo-App verfügbar."
      };
    }

    try {
      const isSet = request?.action === "set";
      const result = isSet
        ? await plugin.setAlarm({
            hour: request.hour,
            minute: request.minute,
            label: request.label || "Human Holo",
            skipUi: true
          })
        : await plugin.openAlarmClock();
      if (!result?.opened) {
        throw new Error("Die Uhr-App hat das Öffnen nicht bestätigt.");
      }

      const alarmTime =
        `${String(request.hour).padStart(2, "0")}:${String(request.minute).padStart(2, "0")} Uhr`;
      const answer = isSet
        ? Number.isInteger(request?.relativeMinutes)
          ? `Dein Wecker ist in ${request.relativeMinutes} Minuten gestellt (${alarmTime}).`
          : `Dein Wecker auf dem Handy ist auf ${alarmTime} gestellt.`
        : "Deine Wecker auf dem Handy sind geöffnet.";
      showToast(answer);
      if (isSet) void notifyGalaxyWatchSummary("alarm");
      return { success: true, opened: true, answer };
    } catch (error) {
      console.error("Android-Wecker:", error);
      return {
        success: false,
        opened: false,
        answer: String(
          error?.message || "Der Android-Wecker konnte gerade nicht geöffnet werden."
        )
      };
    }
  }

  function renderGalaxyWatchStatus(nextStatus) {
    const statusElement = document.getElementById("galaxyWatchStatus");
    if (!statusElement) return;
    galaxyWatchStatus = {
      supported: Boolean(nextStatus?.supported),
      galaxyWearableInstalled: Boolean(nextStatus?.galaxyWearableInstalled),
      notificationsGranted: Boolean(nextStatus?.notificationsGranted),
      relayReady: Boolean(nextStatus?.relayReady)
    };
    statusElement.classList.remove("connected", "setup");
    if (!galaxyWatchStatus.supported) {
      statusElement.textContent = "Nur Android";
      statusElement.classList.add("setup");
    } else if (!galaxyWatchStatus.notificationsGranted) {
      statusElement.textContent = "Freigabe nötig";
      statusElement.classList.add("setup");
    } else if (galaxyWatchStatus.galaxyWearableInstalled) {
      statusElement.textContent = "Hinweise bereit";
      statusElement.classList.add("connected");
    } else {
      statusElement.textContent = "Wearable-App fehlt";
      statusElement.classList.add("setup");
    }
  }

  async function loadGalaxyWatchStatus() {
    const plugin = getGalaxyWatchBridgePlugin();
    if (typeof plugin?.getStatus !== "function") {
      renderGalaxyWatchStatus({ supported: false });
      return;
    }
    try {
      renderGalaxyWatchStatus(await plugin.getStatus());
    } catch (error) {
      console.error("Galaxy-Watch-Status:", error);
      renderGalaxyWatchStatus({ supported: true });
    }
  }

  async function notifyGalaxyWatchSummary(kind = "test") {
    const plugin = getGalaxyWatchBridgePlugin();
    if (typeof plugin?.sendPrivateSummary !== "function") return false;
    try {
      const result = await plugin.sendPrivateSummary({ kind });
      return Boolean(result?.sent);
    } catch (error) {
      if (error?.code !== "WATCH_NOTIFICATION_PERMISSION_REQUIRED") {
        console.error("Galaxy-Watch-Hinweis:", error);
      }
      return false;
    }
  }

  window.notifySolHoloGalaxyWatch = notifyGalaxyWatchSummary;

  async function setupGalaxyWatchBridge() {
    const plugin = getGalaxyWatchBridgePlugin();
    if (!plugin) {
      showToast("Die Galaxy-Watch-Verknüpfung ist erst nach dem App-Update verfügbar.");
      return;
    }
    try {
      let status = await plugin.getStatus();
      if (!status?.notificationsGranted) {
        status = await plugin.requestNotificationAccess();
      }
      renderGalaxyWatchStatus(status);
      if (!status?.notificationsGranted) {
        showToast("Bitte erlaube Human Holo Benachrichtigungen für die Watch.");
        return;
      }
      await plugin.sendPrivateSummary({ kind: "test" });
      showToast("Privater Test-Hinweis gesendet. Aktiviere Human Holo jetzt in Galaxy Wearable.");
      if (status?.galaxyWearableInstalled) {
        await plugin.openGalaxyWearable();
      }
    } catch (error) {
      console.error("Galaxy Watch einrichten:", error);
      showToast(String(error?.message || "Die Galaxy Watch konnte gerade nicht eingerichtet werden."));
    } finally {
      void loadGalaxyWatchStatus();
    }
  }

  window.openSolHoloCalendarDraft = async (calendarResult) => {
    const draft = calendarResult?.calendarDraft;
    if (calendarResult?.success || !draft) return calendarResult;
    const plugin = getPhoneContactsPlugin();
    if (typeof plugin?.openCalendarEvent !== "function") return calendarResult;

    const startMillis = Date.parse(String(draft.start || ""));
    const endMillis = Date.parse(String(draft.end || ""));
    if (!Number.isFinite(startMillis) || !Number.isFinite(endMillis)) {
      return calendarResult;
    }

    try {
      const opened = await plugin.openCalendarEvent({
        title: String(draft.title || "Termin"),
        description: String(draft.description || ""),
        startMillis,
        endMillis,
        allDay: Boolean(draft.allDay)
      });
      if (!opened?.opened) return calendarResult;
      void notifyGalaxyWatchSummary("calendar");
      return {
        ...calendarResult,
        draftOpened: true,
        answer:
          `Die Kalender-App ist mit „${String(draft.title || "Termin")}“ fertig ausgefüllt. ` +
          "Tippe dort nur noch auf Speichern."
      };
    } catch (error) {
      console.error("Android-Kalenderentwurf:", error);
      return calendarResult;
    }
  };

  async function renderGoogleMapsStatus() {
    const statusElement = document.getElementById("googleMapsStatus");
    if (!statusElement) return;
    statusElement.classList.remove("connected", "setup");
    const plugin = getPhoneContactsPlugin();
    if (!plugin?.getGoogleMapsStatus) {
      statusElement.textContent = "Nur Android";
      statusElement.classList.add("setup");
      return;
    }

    try {
      const status = await plugin.getGoogleMapsStatus();
      statusElement.textContent = status?.available
        ? "Bereit"
        : "Browser-Route";
      statusElement.classList.add("connected");
    } catch (error) {
      console.error("Google-Maps-Status:", error);
      statusElement.textContent = "Prüfung fehlgeschlagen";
      statusElement.classList.add("setup");
    }
  }

  async function loadLiveWeatherStatus() {
    const statusElement = document.getElementById("liveWeatherStatus");
    if (!statusElement) return;
    statusElement.textContent = "Wird geprüft …";
    statusElement.classList.remove("connected", "setup");

    try {
      const response = await fetch(
        `${BACKEND_URL}/weather/status`,
        { cache: "no-store" }
      );
      const status = await response.json();
      if (!response.ok || !status?.configured || !status?.liveSearch) {
        throw new Error("Live-Wetter ist serverseitig nicht bereit.");
      }
      statusElement.textContent = "Bereit";
      statusElement.classList.add("connected");
    } catch (error) {
      console.error("Live-Wetter-Status:", error);
      statusElement.textContent = "Nicht bereit";
      statusElement.classList.add("setup");
    }
  }

  async function openGoogleMapsForRequest(destination = "") {
    const cleanDestination = String(destination || "").trim();
    const plugin = getPhoneContactsPlugin();

    try {
      if (plugin?.openGoogleMaps) {
        const result = await plugin.openGoogleMaps({
          destination: cleanDestination
        });
        if (!result?.opened) {
          throw new Error("Google Maps hat das Öffnen nicht bestätigt.");
        }
      } else {
        const mapsUrl = cleanDestination
          ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cleanDestination)}`
          : "https://www.google.com/maps";
        const mapsWindow = window.open(mapsUrl, "_blank", "noopener");
        if (!mapsWindow) {
          throw new Error("Google Maps konnte nicht geöffnet werden.");
        }
      }

      const answer = cleanDestination
        ? `Der Routenplaner ist geöffnet. Ziel: ${cleanDestination}`
        : "Der Routenplaner ist geöffnet.";
      showToast(answer);
      if (cleanDestination) void notifyGalaxyWatchSummary("navigation");
      return {
        success: true,
        opened: true,
        answer
      };
    } catch (error) {
      console.error("Google Maps öffnen:", error);
      return {
        success: false,
        answer: String(
          error?.message ||
          "Google Maps konnte gerade nicht geöffnet werden."
        )
      };
    }
  }

  function renderPhoneStatus(nextStatus) {
    const statusElement = document.getElementById("phoneContactsStatus");

    phoneStatus = {
      supported: Boolean(nextStatus?.supported),
      contactsPermissionGranted: Boolean(
        nextStatus?.contactsPermissionGranted
      ),
      phoneStatePermissionGranted: Boolean(
        nextStatus?.phoneStatePermissionGranted
      ),
      connected: Boolean(nextStatus?.connected),
      whatsAppDirectSendEnabled: Boolean(
        nextStatus?.whatsAppDirectSendEnabled
      ),
      callState: String(nextStatus?.callState || "idle"),
      incomingCall: Boolean(nextStatus?.incomingCall)
    };

    statusElement.classList.remove("connected", "setup");

    if (!getPhoneContactsPlugin()) {
      statusElement.textContent = "Nur Android";
      statusElement.classList.add("setup");
    } else if (phoneStatus.incomingCall) {
      statusElement.textContent = "Anruf erkannt";
      statusElement.classList.add("connected");
    } else if (
      phoneStatus.contactsPermissionGranted &&
      phoneStatus.whatsAppDirectSendEnabled
    ) {
      statusElement.textContent = "Auto-Senden aktiv";
      statusElement.classList.add("connected");
    } else if (phoneStatus.connected) {
      statusElement.textContent = "Verbunden";
      statusElement.classList.add("connected");
    } else if (phoneStatus.contactsPermissionGranted) {
      statusElement.textContent = "Kontakte verbunden";
      statusElement.classList.add("connected");
    } else {
      statusElement.textContent = "Freigabe nötig";
      statusElement.classList.add("setup");
    }
  }

  async function registerPhoneListeners() {
    const plugin = getPhoneContactsPlugin();
    if (!plugin || phoneListenersRegistered) {
      return;
    }

    phoneListenersRegistered = true;
    try {
      await plugin.addListener("phoneStatusChanged", (status) => {
        renderPhoneStatus(status);
      });

      await plugin.addListener("callStateChanged", async (status) => {
        const previousState = phoneStatus.callState;
        renderPhoneStatus(status);

        if (status?.callState === "ringing") {
          showToast(`Eingehender Anruf erkannt. ${activeInstanceName()} pausiert.`);
          if (typeof stopLiveConversation === "function") {
            stopLiveConversation();
          }
          await pauseWakeListeningForConversation();
        } else if (
          status?.callState === "idle" &&
          previousState !== "idle"
        ) {
          showToast(`Telefonat beendet. ${activeInstanceName()} ist wieder da.`);
          void resumeWakeListeningAfterConversation();
        }
      });

      await plugin.addListener("whatsAppAutoSendResult", (result) => {
        const recipient = String(result?.recipientName || "dem Kontakt");
        if (result?.sendControlActivated) {
          showToast(`WhatsApp an ${recipient} automatisch gesendet ✅️`);
          void window.recordSolHoloVerifiedDeviceAction?.({
            token: String(result?.token || ""),
            recipientName: recipient,
            message: String(result?.message || ""),
            sendControlActivated: true,
            deliveryConfirmed: result?.deliveryConfirmed === true
          });
          return;
        }
        showToast(
          `WhatsApp an ${recipient} wurde zur Sicherheit nicht automatisch gesendet.`
        );
        void window.recordSolHoloVerifiedDeviceAction?.({
          token: String(result?.token || ""),
          recipientName: recipient,
          message: String(result?.message || ""),
          sendControlActivated: false,
          deliveryConfirmed: false
        });
      });
    } catch (error) {
      phoneListenersRegistered = false;
      console.error("Telefon-Ereignisse:", error);
    }
  }

  async function loadPhoneStatus() {
    const plugin = getPhoneContactsPlugin();
    if (!plugin) {
      renderPhoneStatus({ supported: false });
      return phoneStatus;
    }

    await registerPhoneListeners();

    try {
      renderPhoneStatus(await plugin.getStatus());
    } catch (error) {
      console.error("Telefonstatus:", error);
      renderPhoneStatus({ supported: true });
    }

    return phoneStatus;
  }

  async function requestPhoneAccess() {
    if (phoneActionRunning) {
      return phoneStatus;
    }

    if (!requireActivePersonalOwner()) {
      return phoneStatus;
    }

    const plugin = getPhoneContactsPlugin();
    if (!plugin) {
      showToast("Telefon und Kontakte sind nur in der Android-App verfügbar.");
      return phoneStatus;
    }

    phoneActionRunning = true;
    try {
      const status = await plugin.requestAccess();
      renderPhoneStatus(status);
      await registerPhoneListeners();

      if (status?.contactsPermissionGranted) {
        showToast(
          "Alle Gerätekontakte sind lokal verfügbar. Automatisches WhatsApp-Senden braucht einen ausdrücklichen Auftrag und seine einmalige Bedienungshilfe." +
          (status?.phoneStatePermissionGranted
            ? ""
            : " Die optionale Anruferkennung ist noch nicht freigegeben.")
        );
      } else {
        showToast(
          `Für alle Telefonfunktionen braucht ${activeInstanceName()} beide Android-Freigaben.`
        );
      }
      return status;
    } catch (error) {
      console.error("Telefonfreigabe:", error);
      showToast("Die Telefonfreigabe konnte gerade nicht abgeschlossen werden.");
      return loadPhoneStatus();
    } finally {
      phoneActionRunning = false;
    }
  }

  const SAFE_SERVICE_DIALERS = Object.freeze({
    "112": "Notruf für Feuerwehr und Rettungsdienst",
    "110": "Polizeinotruf",
    "116117": "Ärztlicher Bereitschaftsdienst"
  });

  function normalizeLocalPhoneIntent(value) {
    return String(value || "")
      .replace(/[Ää]/g, "ae")
      .replace(/[Öö]/g, "oe")
      .replace(/[Üü]/g, "ue")
      .replace(/ß/g, "ss")
      .toLocaleLowerCase("de-DE")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isSafetyTriageQuestion(message) {
    const normalized = normalizeLocalPhoneIntent(message);
    const hasTestMarker =
      /\b(?:nur ein test|systemtest|testfrage|testszenario|kein echter notfall|kein realer notfall|fiktiv)/i.test(
        normalized
      );
    const hasSafetyContext =
      /\b(?:notfall|lebensgefahr|lebensbedrohlich|bewusstlos|atmung|atemnot|brustschmerzen|herzbeschwerden|schlaganfall|krampfanfall|vergiftung|verbrennung|stromunfall|stromschlag|ertrinkungsunfall|schmerzen|ohrenschmerzen|halsschmerzen|rueckenschmerzen|bauchschmerzen|fieber|verletzt|blutet|bedroht|messer|waffe|einbruch|einbrecher|fremd(?:e|er|en|em|es)?|unbekannt(?:e|er|en|em|es)?|unbefugt(?:e|er|en|em|es)?|polizei|116117|112|110)\b/i.test(
        normalized
      );
    const asksForGuidance =
      /\b(?:wen soll ich|was muss ich|was soll ich|welche nummer|wo soll ich|soll ich .* anrufen|an wen .* wenden)\b/i.test(
        normalized
      );

    return hasTestMarker || (hasSafetyContext && asksForGuidance);
  }

  function serviceDialRequestFromMessage(message) {
    const cleanMessage = String(message || "")
      .trim()
      .replace(
        /^(?:(?:hey\s+)?(?:sol(?:\s+holo)?|pam(?:['’]s\s+holo)?|holo))\s*[,;:!.-]?\s*/i,
        ""
      )
      .trim();
    if (isSafetyTriageQuestion(cleanMessage)) return null;

    const match = cleanMessage.match(
      /^ruf(?:e)?(?:\s+bitte|\s+mal)?\s+(112|110|116\s*117)(?:\s+an)?[.!]?$/i
    );
    const number = String(match?.[1] || "").replace(/\s+/g, "");
    return SAFE_SERVICE_DIALERS[number]
      ? { number, label: SAFE_SERVICE_DIALERS[number] }
      : null;
  }

  function phoneContactCallNameFromMessage(message) {
    const cleanMessage = String(message || "").trim();
    if (isSafetyTriageQuestion(cleanMessage) || /[?:;]/.test(cleanMessage)) {
      return "";
    }

    let match = cleanMessage.match(
      /^ruf(?:e)?(?:\s+mal)?\s+(.+?)(?:\s+an)?[.!]?$/i
    );
    if (!match) {
      match = cleanMessage.match(/^(.+?)\s+anrufen[.!]?$/i);
    }

    const name = String(match?.[1] || "")
      .replace(/[.!]+$/g, "")
      .trim();
    if (
      !name ||
      name.split(/\s+/).length > 5 ||
      !/^[\p{L}\p{M}][\p{L}\p{M} .,'’\-]*$/u.test(name) ||
      /\b(?:ich|du|er|sie|wir|ihr|wer|wen|was|wann|warum|wie|notfall|arzt|aerztin|polizei)\b/i.test(
        normalizeLocalPhoneIntent(name)
      )
    ) {
      return "";
    }
    return name;
  }

  async function openServiceDialer(number, label = "") {
    const cleanNumber = String(number || "").replace(/\s+/g, "");
    const expectedLabel = SAFE_SERVICE_DIALERS[cleanNumber];
    if (!expectedLabel) {
      return {
        success: false,
        answer: "Diese Servicenummer darf nicht automatisch an den Wähler übergeben werden."
      };
    }
    if (!activePersonalOwner()) {
      return {
        success: false,
        answer: "Die feste Holo-ID ist nicht verfügbar."
      };
    }

    const plugin = getPhoneContactsPlugin();
    if (!plugin?.openServiceDialer) {
      return {
        success: false,
        answer: "Der sichere Servicenummer-Wähler ist erst nach dem App-Update verfügbar."
      };
    }

    try {
      await plugin.openServiceDialer({
        number: cleanNumber,
        label: String(label || expectedLabel).trim()
      });
      return {
        success: true,
        opened: true,
        answer: `${cleanNumber} ist im Telefon-Wähler vorbereitet. Erst dein Tippen auf die grüne Hörertaste startet den Anruf.`
      };
    } catch (error) {
      console.error("Servicenummer-Wähler:", error);
      return {
        success: false,
        answer: String(
          error?.message ||
          "Der Telefon-Wähler konnte gerade nicht geöffnet werden."
        )
      };
    }
  }

  window.isSolHoloSafetyTriageQuestion = isSafetyTriageQuestion;
  window.extractSolHoloServiceDialRequest = serviceDialRequestFromMessage;
  window.extractSolHoloPhoneContactCallName = phoneContactCallNameFromMessage;
  window.openSolHoloServiceDialer = openServiceDialer;

  function normalizeContactLookupName(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("de-DE")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanContactAliasPhrase(value) {
    return String(value || "")
      .replace(/[\s\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D]+$/gu, "")
      .replace(/^[\s:;,–—-]+|[\s:;,–—-]+$/g, "")
      .trim();
  }

  function contactLookupHint(value) {
    const clean = cleanContactAliasPhrase(value);
    const hintMatch = clean.match(/^(.+?)\s+(?:nr\.?\s*)?(\d{2,4})$/i);
    return hintMatch
      ? {
          query: hintMatch[1].trim(),
          numberSuffix: hintMatch[2]
        }
      : { query: clean, numberSuffix: "" };
  }

  function maskedContactChoice(contact) {
    const digits = String(contact?.number || "").replace(/\D/g, "");
    const suffix = digits.slice(-4);
    const label = String(contact?.label || "Nummer").trim() || "Nummer";
    return `${contact?.name || "Unbenannt"} (${label}${suffix ? ` · …${suffix}` : ""})`;
  }

  function ambiguousContactAnswer(contactName, contacts) {
    const choices = contacts
      .slice(0, 5)
      .map(maskedContactChoice)
      .join("; ");
    return (
      `Ich habe mehrere passende Kontakte für „${contactName}“ gefunden: ` +
      `${choices}. Bitte nenne den vollständigen Namen oder zusätzlich die ` +
      "letzten vier Ziffern."
    );
  }

  async function findPhoneContact(query) {
    if (!activePersonalOwner()) {
      throw new Error("Die feste Holo-ID ist nicht verfügbar.");
    }
    const plugin = getPhoneContactsPlugin();
    if (!plugin) {
      throw new Error("Telefon und Kontakte sind nur in der Android-App verfügbar.");
    }

    const cleanQuery = cleanContactAliasPhrase(query);
    if (!cleanQuery) {
      throw new Error("Bitte nenne einen Kontakt.");
    }

    const currentStatus = await loadPhoneStatus();
    if (!currentStatus.contactsPermissionGranted) {
      await requestPhoneAccess();
    }

    if (typeof plugin.resolveContactAlias === "function") {
      const aliasResult = await plugin.resolveContactAlias({
        alias: cleanQuery,
        ownerId: activePersonalOwner()
      });
      if (aliasResult?.found && aliasResult?.contact) {
        return {
          contact: aliasResult.contact,
          contacts: [aliasResult.contact],
          aliasMatched: true,
          ambiguous: false
        };
      }
    }

    const hint = contactLookupHint(cleanQuery);
    const result = await plugin.searchContacts({
      query: hint.query,
      limit: 20
    });
    const contacts = Array.isArray(result?.results) ? result.results : [];

    const suffixMatches = hint.numberSuffix
      ? contacts.filter((contact) =>
          String(contact?.number || "")
            .replace(/\D/g, "")
            .endsWith(hint.numberSuffix)
        )
      : contacts;
    const normalizedQuery = normalizeContactLookupName(hint.query);
    const exactMatches = suffixMatches.filter(
      (contact) =>
        normalizeContactLookupName(contact?.name) === normalizedQuery
    );
    const candidates = exactMatches.length > 0
      ? exactMatches
      : suffixMatches;

    return {
      contact: candidates.length === 1 ? candidates[0] : null,
      contacts: candidates,
      aliasMatched: false,
      ambiguous: candidates.length > 1
    };
  }

  async function bindPhoneContactAlias(alias, contactName) {
    const cleanAlias = cleanContactAliasPhrase(alias);
    const cleanContactName = cleanContactAliasPhrase(contactName);
    if (!cleanAlias || !cleanContactName) {
      return {
        success: false,
        answer: "Bitte nenne den Alias und den Kontakt, der damit verbunden werden soll."
      };
    }

    const resolution = await findPhoneContact(cleanContactName);
    if (resolution.ambiguous) {
      return {
        success: false,
        answer: ambiguousContactAnswer(cleanContactName, resolution.contacts)
      };
    }
    if (!resolution.contact) {
      return {
        success: false,
        answer: `Ich habe keinen Telefonkontakt namens „${cleanContactName}“ gefunden.`
      };
    }

    const plugin = getPhoneContactsPlugin();
    if (typeof plugin?.bindContactAlias !== "function") {
      return {
        success: false,
        answer: "Kontakt-Aliasse sind erst nach dem App-Update verfügbar."
      };
    }

    await plugin.bindContactAlias({
      alias: cleanAlias,
      contactId: String(resolution.contact.id),
      number: resolution.contact.number,
      ownerId: activePersonalOwner()
    });
    return {
      success: true,
      answer:
        `„${cleanAlias}“ ist jetzt nur auf diesem Gerät mit ` +
        `${resolution.contact.name} verbunden.`
    };
  }

  async function executePhoneTool(name, args = {}) {
    const actionName = String(name || "");
    const contactName = String(args?.contact_name || args?.query || "").trim();

    try {
      const result = await findPhoneContact(contactName);

      if (actionName === "search_phone_contact") {
        if (result.contacts.length === 0) {
          return {
            success: false,
            answer: `Ich habe keinen Telefonkontakt namens „${contactName}“ gefunden.`
          };
        }

        return {
          success: true,
          answer: result.contacts
            .map((contact) => `${contact.name} – ${contact.number}`)
            .join("; ")
        };
      }

      const contact = result.contact;
      if (!contact) {
        if (result.ambiguous) {
          return {
            success: false,
            ambiguous: true,
            answer: ambiguousContactAnswer(contactName, result.contacts)
          };
        }
        return {
          success: false,
          answer: `Ich habe keinen Telefonkontakt namens „${contactName}“ gefunden.`
        };
      }

      if (actionName === "start_phone_call") {
        await getPhoneContactsPlugin().openDialer({
          number: contact.number,
          recipientName: contact.name
        });
        return {
          success: true,
          answer: `${contact.name} ist in der Telefon-App geöffnet. Du bestätigst den Anruf dort.`
        };
      }

      if (actionName === "prepare_sms") {
        const message = String(args?.message || "").trim();
        if (!message) {
          return { success: false, answer: "Für die SMS fehlt noch der Text." };
        }

        await getPhoneContactsPlugin().prepareSms({
          number: contact.number,
          recipientName: contact.name,
          message
        });
        return {
          success: true,
          answer: `Die SMS an ${contact.name} ist vorbereitet. Du sendest sie in der Nachrichten-App selbst ab.`
        };
      }

      if (actionName === "prepare_whatsapp") {
        const message = String(args?.message || "").trim();
        if (!message) {
          return {
            success: false,
            answer: "Für WhatsApp fehlt noch der Nachrichtentext."
          };
        }

        const plugin = getPhoneContactsPlugin();
        if (typeof plugin?.prepareWhatsApp !== "function") {
          return {
            success: false,
            answer: "Die sichere WhatsApp-Übergabe ist erst nach dem App-Update verfügbar."
          };
        }

        const automaticSend = Boolean(args?.explicit_whatsapp_command);
        let handoff;
        window.markSolHoloConversationForExternalReturn?.("whatsapp");
        try {
          handoff = await plugin.prepareWhatsApp({
            number: contact.number,
            normalizedNumber: contact.normalizedNumber || "",
            recipientName: contact.name,
            message,
            autoSend: automaticSend,
            explicitOwnerCommand: automaticSend
          });
        } catch (error) {
          window.cancelSolHoloConversationExternalReturn?.("whatsapp");
          if (error?.code !== "WHATSAPP_AUTO_SEND_ACCESS_REQUIRED") {
            throw error;
          }
          if (typeof plugin?.requestWhatsAppAutoSendAccess !== "function") {
            return {
              success: false,
              answer:
                "Der automatische WhatsApp-Besitzer-Modus ist erst nach dem App-Update verfügbar."
            };
          }
          await plugin.requestWhatsAppAutoSendAccess();
          return {
            success: false,
            setupRequired: true,
            settingsOpened: true,
            answer:
              "Aktiviere einmal „Human Holo – WhatsApp automatisch senden“ in den Android-Bedienungshilfen. " +
              "Danach sagst du denselben WhatsApp-Befehl noch einmal."
          };
        }
        return automaticSend
          ? {
              success: true,
              automaticSendRequested: true,
              pendingToken: String(handoff?.pendingToken || ""),
              answer:
                `Der einmalige automatische WhatsApp-Sendeauftrag an ${contact.name} läuft. ` +
                "Pam’s Holo sendet nur, wenn Empfänger und vollständiger Text in WhatsApp exakt stimmen."
            }
          : {
              success: true,
              automaticSendRequested: false,
              answer:
                `WhatsApp an ${contact.name} ist vorbereitet. ` +
                "Für automatisches Senden muss dein Auftrag WhatsApp ausdrücklich nennen."
            };
      }

      return { success: false, answer: "Unbekannte Telefonfunktion." };
    } catch (error) {
      console.error("Telefonfunktion:", error);
      if (error?.code === "USER_CANCELLED") {
        return {
          success: false,
          cancelled: true,
          answer: "Die Aktion wurde abgebrochen."
        };
      }
      return {
        success: false,
        answer: String(error?.message || error || "Die Telefonfunktion ist fehlgeschlagen.")
      };
    }
  }

  window.executeSolHoloPhoneTool = executePhoneTool;

  function contactAliasBindingFromMessage(message) {
    const cleanMessage = String(message || "")
      .replace(
        /^(?:(?:hey\s+)?(?:sol(?:\s+holo)?|pam))\s*[,;:!.-]?\s*/i,
        ""
      )
      .trim();
    let match = cleanMessage.match(
      /^kontaktalias\s+(.+?)\s+(?:ist|=)\s+(.+?)[.!]?$/i
    );
    if (!match) {
      match = cleanMessage.match(
        /^verbinde\s+(.+?)\s+mit\s+(?:dem\s+)?kontakt\s+(.+?)[.!]?$/i
      );
    }
    if (!match) {
      return null;
    }
    const alias = cleanContactAliasPhrase(match[1]);
    const contactName = cleanContactAliasPhrase(match[2]);
    return alias && contactName ? { alias, contactName } : null;
  }

  function whatsAppDraftSyntaxFromMessage(message) {
    const cleanMessage = String(message || "")
      .replace(
        /^(?:(?:hey\s+)?(?:sol(?:\s+holo)?|pam))\s*[,;:!.-]?\s*/i,
        ""
      )
      .trim();
    let remainder = "";
    let explicitWhatsApp = /\bwhats[\s-]*app(?:-nachricht)?\b/i.test(cleanMessage);
    const verbMatch = cleanMessage.match(
      /^(?:schreib(?:e)?|sende|schick(?:e)?)\s+(?:bitte\s+)?(.+)$/i
    );
    const directWhatsAppMatch = cleanMessage.match(
      /^whats[\s-]*app(?:-nachricht)?\s+(?:an\s+)?(.+)$/i
    );
    if (verbMatch) {
      remainder = verbMatch[1].trim();
    } else if (directWhatsAppMatch) {
      explicitWhatsApp = true;
      remainder = directWhatsAppMatch[1].trim();
    } else {
      return null;
    }

    const recipientWhatsAppMatch = remainder.match(
      /^(.+?)\s+(?:eine\s+)?whats[\s-]*app(?:-nachricht)?\s+(?:mit(?:\s+dem)?\s+text\s*[:;,–—-]?\s+|mit\s+)(.+)$/i
    );
    if (recipientWhatsAppMatch) {
      return {
        explicitWhatsApp: true,
        contactName: cleanContactAliasPhrase(recipientWhatsAppMatch[1]),
        message: String(recipientWhatsAppMatch[2] || "").trim(),
        body: remainder
      };
    }

    if (!explicitWhatsApp && /\bsms\b/i.test(remainder)) {
      return null;
    }

    const routedMatch = remainder.match(
      /^(.+?)\s+(?:über|per)\s+whats[\s-]*app(?:-nachricht)?\s*(?::|;|,|\s+mit(?:\s+dem)?\s+text\s+)(.+)$/i
    );
    if (routedMatch) {
      return {
        explicitWhatsApp: true,
        contactName: cleanContactAliasPhrase(routedMatch[1]),
        message: String(routedMatch[2] || "").trim(),
        body: remainder
      };
    }

    remainder = remainder.replace(
      /^(?:eine\s+)?whats[\s-]*app(?:-nachricht)?\s+(?:an\s+)?/i,
      ""
    );
    remainder = remainder.replace(/^eine\s+nachricht\s+an\s+/i, "");
    remainder = remainder.replace(/^an\s+/i, "").trim();

    const delimitedMatch = remainder.match(
      /^(.+?)(?::|;|,|\s+mit(?:\s+dem)?\s+text\s+)(.+)$/i
    );
    if (delimitedMatch) {
      return {
        explicitWhatsApp,
        contactName: cleanContactAliasPhrase(delimitedMatch[1]),
        message: String(delimitedMatch[2] || "").trim(),
        body: remainder
      };
    }

    return {
      explicitWhatsApp,
      contactName: "",
      message: "",
      body: remainder
    };
  }

  async function resolveWhatsAppDraftFromMessage(message) {
    const syntax = whatsAppDraftSyntaxFromMessage(message);
    if (!syntax) {
      return null;
    }

    let ambiguousResolution = null;
    if (syntax.contactName) {
      const resolution = await findPhoneContact(syntax.contactName);
      if (resolution.contact && syntax.message) {
        return {
          contactName: syntax.contactName,
          message: syntax.message,
          explicitWhatsApp: syntax.explicitWhatsApp
        };
      }
      if (resolution.ambiguous) {
        ambiguousResolution = {
          contactName: syntax.contactName,
          contacts: resolution.contacts
        };
      }
      if (syntax.explicitWhatsApp) {
        return resolution.ambiguous
          ? {
              error: ambiguousContactAnswer(
                syntax.contactName,
                resolution.contacts
              )
            }
          : {
              error:
                `Ich habe keinen eindeutigen Telefonkontakt namens ` +
                `„${syntax.contactName}“ gefunden.`
            };
      }
    }

    const words = String(syntax.body || "")
      .split(/\s+/)
      .filter(Boolean);
    if (words.length < 2) {
      return syntax.explicitWhatsApp
        ? { error: "Bitte nenne den Kontakt und den Nachrichtentext." }
        : null;
    }

    const maxContactWords = Math.min(5, words.length - 1);
    for (let wordCount = maxContactWords; wordCount >= 1; wordCount -= 1) {
      const contactName = cleanContactAliasPhrase(
        words.slice(0, wordCount).join(" ")
      );
      if (!contactName) {
        continue;
      }
      const resolution = await findPhoneContact(contactName);
      if (resolution.contact) {
        const messageText = words.slice(wordCount).join(" ").trim();
        if (messageText) {
          return {
            contactName,
            message: messageText,
            explicitWhatsApp: syntax.explicitWhatsApp
          };
        }
      } else if (resolution.ambiguous) {
        ambiguousResolution = { contactName, contacts: resolution.contacts };
      }
    }

    if (ambiguousResolution) {
      return {
        error: ambiguousContactAnswer(
          ambiguousResolution.contactName,
          ambiguousResolution.contacts
        )
      };
    }

    const firstName = cleanContactAliasPhrase(words[0]);
    if (
      /^(?:schatz|liebling|mama|mutti|papa|vati|oma|opa)$/i.test(firstName)
    ) {
      return {
        error:
          `„${firstName}“ ist noch keinem Kontakt zugeordnet. ` +
          `Sag einmal: „Kontaktalias ${firstName} ist [Kontaktname].“`
      };
    }
    return syntax.explicitWhatsApp
      ? { error: "Ich habe keinen eindeutigen Empfänger gefunden." }
      : null;
  }

  window.extractSolHoloContactAliasBinding = contactAliasBindingFromMessage;
  window.extractSolHoloWhatsAppDraftSyntax = whatsAppDraftSyntaxFromMessage;

  async function registerSharedNoteListener() {
    const plugin = getPhoneContactsPlugin();
    if (!plugin || noteListenerRegistered) {
      return;
    }

    noteListenerRegistered = true;
    try {
      await plugin.addListener("sharedNoteReceived", () => {
        void consumeSharedNoteImport();
      });
    } catch (error) {
      noteListenerRegistered = false;
      console.error("Samsung-Notes-Ereignis:", error);
    }
  }

  async function renderSamsungNotesStatus() {
    const statusElement = document.getElementById("samsungNotesStatus");
    statusElement.classList.remove("connected", "setup");
    const plugin = getPhoneContactsPlugin();
    if (!plugin) {
      statusElement.textContent = "Nur Android";
      statusElement.classList.add("setup");
      return;
    }

    try {
      const status = await plugin.getSamsungNotesStatus();
      statusElement.textContent = status?.available
        ? status?.directWriteSupported
          ? "Direkt verbunden"
          : "Übergabe bereit"
        : "Nicht gefunden";
      statusElement.classList.add(status?.available ? "connected" : "setup");
    } catch (error) {
      console.error("Samsung-Notes-Status:", error);
      statusElement.textContent = "Prüfung fehlgeschlagen";
      statusElement.classList.add("setup");
    }
  }

  async function consumeSharedNoteImport() {
    const plugin = getPhoneContactsPlugin();
    const identity = window.SolHoloIdentity?.selected?.();
    if (!plugin || noteImportRunning || !identity) {
      return;
    }

    noteImportRunning = true;
    try {
      const note = await plugin.consumeSharedNote();
      if (!note?.available) {
        return;
      }

      if (note.truncated) {
        window.alert(
          "Diese Notiz ist für die sichere Einzelübergabe zu lang. " +
          "Bitte markiere in Samsung Notes einen kürzeren persönlichen " +
          `Abschnitt und teile ihn erneut mit ${activeInstanceName()}. Es wurde nichts gespeichert.`
        );
        return;
      }

      const title = String(note.title || "").trim();
      const text = String(note.text || "").trim();
      const preview = text.length > 800
        ? text.slice(0, 800) + " …"
        : text;
      const confirmed = window.confirm(
        "Diese ausgewählte Samsung-Notiz im Notizbuch deiner " +
        `${activeInstanceName()} auf diesem Handy speichern?\n\n` +
        (title ? `Titel: ${title}\n\n` : "") +
        preview +
        "\n\nNur persönliche Inhalte bestätigen. Geschäftliche Daten, PINs, " +
        "Passwörter, TANs, Banking- und Authenticator-Daten bleiben ausgeschlossen."
      );

      if (!confirmed) {
        showToast("Notiz verworfen. Es wurde nichts gespeichert.");
        return;
      }

      const savedNote = createPersonalNote(text, {
        title,
        source: `Samsung Notes · von ${identity.displayName} freigegeben`
      });
      if (!savedNote.success) {
        if (savedNote.securityBlocked) {
          window.alert(savedNote.answer);
        } else {
          showToast(savedNote.answer);
        }
        return;
      }

      showToast(`Samsung-Notiz in ${activeInstanceName()} gespeichert ✅️`);
    } catch (error) {
      console.error("Samsung-Notes-Import:", error);
      showToast("Die geteilte Notiz konnte gerade nicht übernommen werden.");
    } finally {
      noteImportRunning = false;
    }
  }

  function getHealthConnectPlugin() {
    return window.Capacitor?.Plugins?.HealthConnect || null;
  }

  function renderHealthStatus(nextStatus) {
    const statusElement = document.getElementById("healthConnectStatus");
    healthStatus = {
      supported: Boolean(nextStatus?.supported),
      readOnly: nextStatus?.readOnly !== false,
      availablePermissionCount: Number(
        nextStatus?.availablePermissionCount || 0
      ),
      grantedPermissionCount: Number(
        nextStatus?.grantedPermissionCount || 0
      ),
      connected: Boolean(nextStatus?.connected),
      allGranted: Boolean(nextStatus?.allGranted)
    };

    statusElement.classList.remove("connected", "setup");
    if (!getHealthConnectPlugin()) {
      statusElement.textContent = "Nur Android";
      statusElement.classList.add("setup");
    } else if (!healthStatus.supported) {
      statusElement.textContent = "Ab Android 14";
      statusElement.classList.add("setup");
    } else if (healthStatus.allGranted) {
      statusElement.textContent = "Alles lesend";
      statusElement.classList.add("connected");
    } else if (healthStatus.connected) {
      statusElement.textContent =
        `${healthStatus.grantedPermissionCount}/` +
        `${healthStatus.availablePermissionCount} lesend`;
      statusElement.classList.add("connected");
    } else {
      statusElement.textContent = "Freigaben wählen";
      statusElement.classList.add("setup");
    }
  }

  async function loadHealthStatus() {
    const plugin = getHealthConnectPlugin();
    if (!plugin) {
      renderHealthStatus({ supported: false });
      return healthStatus;
    }

    try {
      renderHealthStatus(await plugin.getStatus());
    } catch (error) {
      console.error("Health-Connect-Status:", error);
      renderHealthStatus({ supported: false });
    }
    return healthStatus;
  }

  async function openHealthPermissions() {
    if (healthActionRunning) {
      return;
    }

    if (!requireActivePersonalOwner()) {
      return;
    }

    const plugin = getHealthConnectPlugin();
    if (!plugin) {
      showToast("Health Connect ist nur in der Android-App verfügbar.");
      return;
    }

    healthActionRunning = true;
    const statusElement = document.getElementById("healthConnectStatus");
    statusElement.textContent = "Android wird geöffnet …";
    statusElement.classList.remove("connected");
    statusElement.classList.add("setup");
    showToast("Androids Health-Freigabe wird geöffnet …");

    try {
      const status = await plugin.openPermissions();
      renderHealthStatus(status);
      if (!status?.supported) {
        showToast("Für diese direkte Health-Verbindung braucht das Handy Android 14 oder neuer.");
        return;
      }

      if (status?.settingsOpened) {
        showToast(`Android zeigt die Health-Freigaben von ${activeInstanceName()}.`);
      } else if (status?.allGranted) {
        showToast("Health Connect ist vollständig und nur lesend verbunden.");
      } else if (status?.connected) {
        showToast(
          `${status.grantedPermissionCount} von ` +
          `${status.availablePermissionCount} Health-Bereichen sind lesend freigegeben.`
        );
      } else {
        showToast("Es wurde noch keine Health-Lesefreigabe erteilt.");
      }
    } catch (error) {
      console.error("Health-Freigaben:", error);
      await loadHealthStatus();
      showToast("Die Health-Connect-Freigaben konnten nicht geöffnet werden.");
    } finally {
      healthActionRunning = false;
    }
  }

  function healthCategoryFromText(text) {
    const value = String(text || "").toLowerCase();
    if (/schlaf|sleep/.test(value)) {
      return "sleep";
    }
    if (/gewicht|größe|körperfett|körperwasser|knochen|grundumsatz/.test(value)) {
      return "body";
    }
    if (/ernährung|nahrung|trinken|wasser|hydration/.test(value)) {
      return "nutrition";
    }
    if (/zyklus|menstru|ovulation|reproduktiv|zwischenblutung/.test(value)) {
      return "reproductive";
    }
    if (/herz|puls|blut|sauerstoff|atem|temperatur|vo2|vital/.test(value)) {
      return "vitals";
    }
    if (/schritt|training|bewegung|kalorien|distanz|etagen|aktivität/.test(value)) {
      return "activity";
    }
    return "all";
  }

  function compactHealthValue(value, depth = 0) {
    if (value == null) {
      return "";
    }
    if (typeof value !== "object") {
      return String(value);
    }
    if (depth >= 2) {
      return JSON.stringify(value).slice(0, 220);
    }
    if (Array.isArray(value)) {
      return value.slice(0, 4)
        .map((item) => compactHealthValue(item, depth + 1))
        .filter(Boolean)
        .join(", ");
    }
    return Object.entries(value)
      .slice(0, 10)
      .map(([key, item]) => `${key}: ${compactHealthValue(item, depth + 1)}`)
      .join(", ");
  }

  function formatHealthSnapshot(snapshot) {
    const categories = Array.isArray(snapshot?.categories)
      ? snapshot.categories
      : [];
    if (categories.length === 0) {
      return (
        `Health Connect enthält im gewählten Bereich für die letzten ` +
        `${snapshot?.days || 7} Tage keine lesbaren Einträge. ` +
        "Es wurde nichts automatisch gespeichert."
      );
    }

    const lines = categories.map((category) => {
      const records = Array.isArray(category?.records)
        ? category.records
        : [];
      const latest = records[0]
        ? compactHealthValue(records[0])
        : "";
      return `${category.label} (${category.count}): ${latest || "Eintrag vorhanden"}`;
    });

    const answer = [
      `Health Connect · letzte ${snapshot.days || 7} Tage · nur lesend:`,
      ...lines,
      "Keine Diagnose. Diese Werte wurden nicht automatisch im Langzeitgedächtnis gespeichert."
    ].join("\n");

    return answer.length > 6000
      ? answer.slice(0, 5900) + "\nWeitere freigegebene Kategorien sind vorhanden."
      : answer;
  }

  async function executeHealthTool(name, args = {}) {
    if (String(name || "") !== "read_health_snapshot") {
      return { success: false, answer: "Unbekannte Health-Funktion." };
    }

    if (!activePersonalOwner()) {
      return {
        success: false,
        identityRequired: true,
        answer: "Die feste Holo-ID ist nicht verfügbar."
      };
    }

    const plugin = getHealthConnectPlugin();
    if (!plugin) {
      return {
        success: false,
        answer: "Health Connect ist nur in der Human-Holo-App für Android verfügbar."
      };
    }

    const days = Math.max(1, Math.min(30, Number(args?.days) || 7));
    const requestedCategory = String(args?.category || "all");
    const category = [
      "all",
      "activity",
      "body",
      "vitals",
      "sleep",
      "nutrition",
      "reproductive"
    ].includes(requestedCategory)
      ? requestedCategory
      : healthCategoryFromText(args?.focus);

    try {
      const status = await loadHealthStatus();
      if (!status.supported) {
        return {
          success: false,
          answer: "Health Connect braucht auf diesem Handy Android 14 oder neuer."
        };
      }
      if (!status.connected) {
        return {
          success: false,
          answer: `Öffne in ${activeInstanceName()} unter Dienste zuerst Health Connect und wähle die Lesefreigaben.`
        };
      }

      const confirmed = window.confirm(
        `Health-Connect-Daten der letzten ${days} Tage jetzt lesend abrufen?\n\n` +
        "Die freigegebenen Werte werden nur für diese bestätigte Holo-Antwort " +
        "verarbeitet, nicht verändert und nicht automatisch als Erinnerung gespeichert."
      );
      if (!confirmed) {
        return {
          success: false,
          cancelled: true,
          answer: "Der Health-Zugriff wurde abgebrochen."
        };
      }

      const snapshot = await plugin.readSnapshot({ days, category });
      return {
        success: true,
        answer: formatHealthSnapshot(snapshot),
        snapshot
      };
    } catch (error) {
      console.error("Health-Connect-Abfrage:", error);
      const message = String(error?.message || error || "");
      return {
        success: false,
        answer: /freigabe|permission/i.test(message)
          ? "Für diesen Health-Bereich fehlt noch die Android-Lesefreigabe. Öffne Health Connect unter Dienste."
          : "Die Health-Connect-Daten konnten gerade nicht gelesen werden."
      };
    }
  }

  window.executeSolHoloHealthTool = executeHealthTool;

  function samsungNoteTextFromNaturalRequest(message) {
    const cleanMessage = stripHoloInvocation(message);
    const patterns = [
      /^(?:bitte\s+)?(?:schreib(?:e)?|notier(?:e)?|trag(?:e)?|pack(?:e)?|setz(?:e)?)\s+(?:mir\s+)?(?:bitte\s+)?(.+?)\s+(?:bitte\s+)?(?:in|zu)\s+(?:(?:meine|die)\s+)?(?:samsungs?(?:\s+|-))?(?:notes?|noten|notizen)(?:\s+(?:rein|hinein|ein))?[.!?]*$/i,
      /^(?:bitte\s+)?(?:schreib(?:e)?|notier(?:e)?|trag(?:e)?|pack(?:e)?|setz(?:e)?)\s+(?:mir\s+)?(?:bitte\s+)?(?:in|zu)\s+(?:(?:meine|die)\s+)?(?:samsungs?(?:\s+|-))?(?:notes?|noten|notizen)(?:\s+(?:rein|hinein|ein))?\s*[:,-]?\s*(?:bitte\s+)?(.+?)[.!?]*$/i
    ];

    for (const pattern of patterns) {
      const match = cleanMessage.match(pattern);
      const noteText = String(match?.[1] || "")
        .replace(/^[\s:,-]+|[\s.!?]+$/g, "")
        .trim();
      if (noteText) {
        return noteText;
      }
    }

    return "";
  }

  function samsungNoteInsertionFromNaturalRequest(message) {
    const cleanMessage = stripHoloInvocation(message);
    const match = cleanMessage.match(
      /^(?:bitte\s+)?(?:setz(?:e)?|schreib(?:e)?|pack(?:e)?|füg(?:e)?)\s+(?:mir\s+)?(?:bitte\s+)?(.+?)\s+unter\s+(.+?)(?:\s+hinzu)?(?:\s+(?:in|bei|zu)\s+(?:(?:meine|die)\s+)?(?:samsungs?(?:\s+|-))?(?:notes?|noten|notizen))?[.!?]*$/i
    );
    const addition = String(match?.[1] || "")
      .replace(/^[\s:,-]+|[\s.!?]+$/g, "")
      .trim();
    const anchor = String(match?.[2] || "")
      .replace(/^[\s:,-]+|[\s.!?]+$/g, "")
      .trim();
    return addition && anchor
      ? { addition, anchor }
      : null;
  }

  function insertSamsungNoteLineBelow(existingText, anchor, addition) {
    const normalized = (value) => String(value || "").trim().toLocaleLowerCase("de");
    const lines = String(existingText || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    let anchorIndex = lines.findIndex(
      (line) => normalized(line) === normalized(anchor)
    );
    if (anchorIndex < 0) {
      lines.push(anchor);
      anchorIndex = lines.length - 1;
    }
    const alreadyBelow = normalized(lines[anchorIndex + 1]) === normalized(addition);
    if (!alreadyBelow) {
      lines.splice(anchorIndex + 1, 0, addition);
    }
    return lines.join("\n");
  }

  window.extractSolHoloSamsungNoteText = samsungNoteTextFromNaturalRequest;
  window.extractSolHoloSamsungNoteInsertion =
    samsungNoteInsertionFromNaturalRequest;
  window.extractSolHoloExplicitSaveRequest = explicitSaveRequestFromMessage;
  window.extractSolHoloGoogleMapsDestination =
    googleMapsDestinationFromMessage;
  window.extractSolHoloAlarmClockRequest =
    alarmClockRequestFromMessage;
  window.isSolHoloCalendarWriteRequest =
    calendarWriteDestinationFromMessage;
  window.isSolHoloLiveWeatherRequest =
    liveWeatherRequestFromMessage;
  window.extractSolHoloPersonalRecallQuery =
    personalRecallQueryFromMessage;
  window.isSolHoloPersonalRecallRequest =
    (message) => Boolean(contextualPersonalRecallQueryFromMessage(message));

  window.handleSolHoloLocalAction = async (message) => {
    const cleanMessage = String(message || "").trim();
    const noteMessage = stripHoloInvocation(cleanMessage);

    contextualPersonalRecallQueryFromMessage(
      noteMessage
    );

    const alarmRequest = alarmClockRequestFromMessage(noteMessage);
    if (alarmRequest) {
      const result = await openAlarmClockForRequest(alarmRequest);
      return {
        handled: true,
        status: result?.opened
          ? alarmRequest.action === "set"
            ? "Wecker an die Uhr-App des Handys übergeben."
            : "Handy-Wecker geöffnet."
          : "Handy-Wecker wurde nicht geöffnet.",
        answer: result.answer
      };
    }

    const mapsDestination = googleMapsDestinationFromMessage(noteMessage);
    if (mapsDestination !== null) {
      const result = await openGoogleMapsForRequest(mapsDestination);
      return {
        handled: true,
        status: result?.opened
          ? "Navigation an Google Maps übergeben."
          : "Google Maps wurde nicht geöffnet.",
        answer: result.answer
      };
    }

    let explicitSaveRequest = explicitSaveRequestFromMessage(noteMessage);
    if (explicitSaveRequest) {
      if (explicitSaveUsesPreviousMessage(explicitSaveRequest)) {
        const previousMessage = recentPlainUserMessageForSave();
        if (!previousMessage) {
          return {
            handled: true,
            status: "Noch nichts gespeichert.",
            answer: "Gern. Was genau soll ich dauerhaft speichern?"
          };
        }
        explicitSaveRequest = {
          ...explicitSaveRequest,
          category: savedContentCategory(previousMessage),
          content: previousMessage
        };
      }
      const result = saveExplicitRequest(explicitSaveRequest);
      if (result?.success) {
        pendingPersonalNoteText = false;
        previousPlainUserMessage = "";
        previousPlainUserMessageAt = 0;
      }
      return {
        handled: true,
        status: result?.success
          ? "Auf Zuruf dauerhaft gespeichert."
          : "Speichern sicher abgelehnt.",
        answer: result.answer
      };
    }

    const finishNoteCreation = async (text) => {
      const result = await executeNotesTool("create_personal_note", {
        text
      });
      if (result?.success) {
        pendingPersonalNoteText = false;
        previousPlainUserMessage = "";
        previousPlainUserMessageAt = 0;
      }
      return {
        handled: true,
        status: result?.localSaved
          ? "Unter Wichtiges · Notizen gespeichert."
          : "Notiz wurde nicht gespeichert.",
        answer: result.answer
      };
    };

    const noteInsertion = samsungNoteInsertionFromNaturalRequest(noteMessage);
    if (noteInsertion) {
      const recentPreparedText =
        lastPreparedSamsungNoteText &&
        Date.now() - lastPreparedSamsungNoteAt <= 10 * 60 * 1000
          ? lastPreparedSamsungNoteText
          : "";
      const updatedDraft = insertSamsungNoteLineBelow(
        recentPreparedText,
        noteInsertion.anchor,
        noteInsertion.addition
      );
      const result = await executeNotesTool("create_personal_note", {
        text: updatedDraft
      });
      if (!result?.localSaved) {
        return {
          handled: true,
          status: "Notiz wurde nicht gespeichert.",
          answer: result.answer
        };
      }
      pendingPersonalNoteText = false;
      previousPlainUserMessage = "";
      previousPlainUserMessageAt = 0;
      return {
        handled: true,
        status: "Unter Wichtiges · Notizen gespeichert.",
        answer: result.answer
      };
    }

    const naturalSamsungNoteText = samsungNoteTextFromNaturalRequest(
      noteMessage
    );
    if (naturalSamsungNoteText) {
      return finishNoteCreation(naturalSamsungNoteText);
    }

    let noteMatch = noteMessage.match(
      /^(?:bitte\s+)?notier(?:e)?\b\s*(?:mir\s+)?(?:bitte\s+)?[:,-]?\s*(.+?)[.!]?$/i
    );
    if (!noteMatch) {
      noteMatch = noteMessage.match(
        /^(?:bitte\s+)?(?:mach|mache|schreib|schreibe)\s+(?:mir\s+)?(?:bitte\s+)?eine\s+notiz(?:\s+daraus)?\s*[:,-]?\s+(.+?)[.!]?$/i
      );
    }
    if (!noteMatch) {
      noteMatch = noteMessage.match(
        /^(?:bitte\s+)?schreib(?:e)?\s+(?:mir\s+)?(?:bitte\s+)?(?:als\s+notiz|in\s+meine\s+notizen|auf)\s*[:,-]?\s+(.+?)[.!]?$/i
      );
    }
    if (!noteMatch) {
      noteMatch = noteMessage.match(
        /^(?:neue\s+)?notiz\s*[:,-]\s*(.+?)[.!]?$/i
      );
    }
    if (noteMatch) {
      return finishNoteCreation(noteMatch[1]);
    }

    if (pendingPersonalNoteText) {
      if (/^(?:abbrechen|abbruch|doch\s+nicht|keine\s+notiz)[.!?]*$/i.test(noteMessage)) {
        pendingPersonalNoteText = false;
        return {
          handled: true,
          answer: "Alles klar. Es wurde keine Notiz gespeichert."
        };
      }
      return finishNoteCreation(noteMessage);
    }

    const simpleNoteRequest = noteMessage
      .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D]/gu, "")
      .replace(/\s+(?:danke|dankeschön)\s*[.!?]*$/i, "")
      .trim();
    if (
      /^(?:(?:mach|mache|schreib|schreibe)\s+(?:mir\s+)?(?:bitte\s+)?(?:eine\s+)?)?(?:einfache\s+|neue\s+)?notiz(?:\s+bitte)?[.!?]*$/i.test(simpleNoteRequest)
    ) {
      const previousMessage = recentPlainUserMessageForSave();
      if (previousMessage) {
        return finishNoteCreation(previousMessage);
      }

      pendingPersonalNoteText = true;
      return {
        handled: true,
        answer: "Gern. Was soll ich unter Wichtiges → Notizen speichern?"
      };
    }

    noteMatch = noteMessage.match(
      /^(?:suche|finde)\s+(?:in\s+)?(?:meinen\s+)?notizen\s+(?:nach\s+)?(.+?)[.!]?$/i
    );
    if (noteMatch) {
      const result = await executeNotesTool("search_personal_notes", {
        query: noteMatch[1]
      });
      return { handled: true, answer: result.answer };
    }

    if (
      /^(?:(?:zeig|zeige|öffne|oeffne|lies|lese)\s+(?:mir\s+)?(?:bitte\s+)?(?:meine\s+)?notizen(?:\s+vor)?|was\s+habe\s+ich\s+notiert)[.!?]?$/i.test(noteMessage)
    ) {
      const result = await executeNotesTool("search_personal_notes", {
        query: ""
      });
      return { handled: true, answer: result.answer };
    }

    noteMatch = noteMessage.match(
      /^(?:lösch|lösche|entfern|entferne)\s+(?:bitte\s+)?(?:die\s+)?notiz(?:\s+mit|\s+zu|\s+über)?\s+(.+?)[.!]?$/i
    );
    if (noteMatch) {
      const result = await executeNotesTool("delete_personal_note", {
        query: noteMatch[1]
      });
      return { handled: true, answer: result.answer };
    }

    noteMatch = noteMessage.match(
      /^(?:änder|ändere|bearbeit|bearbeite)\s+(?:bitte\s+)?(?:die\s+)?notiz\s+(.+?)\s+(?:in|zu|auf)\s+(.+?)[.!]?$/i
    );
    if (noteMatch) {
      const result = await executeNotesTool("update_personal_note", {
        query: noteMatch[1],
        text: noteMatch[2]
      });
      return { handled: true, answer: result.answer };
    }

    if (
      /^(?:zeig|zeige|lies|lese|gib|wie\s+(?:viele|war|waren|ist|sind))\b/i.test(cleanMessage) &&
      /health|gesundheit|gesundheitsdaten|schritt|schlaf|gewicht|herz|puls|blutdruck|sauerstoff|training|kalorien|zyklus|menstru|ernährung/i.test(cleanMessage)
    ) {
      const result = await executeHealthTool("read_health_snapshot", {
        days: 7,
        category: healthCategoryFromText(cleanMessage)
      });
      return { handled: true, answer: result.answer };
    }

    if (isSafetyTriageQuestion(cleanMessage)) {
      previousPlainUserMessage = noteMessage;
      previousPlainUserMessageAt = Date.now();
      return { handled: false };
    }

    const serviceDialRequest = serviceDialRequestFromMessage(cleanMessage);
    if (serviceDialRequest) {
      const result = await openServiceDialer(
        serviceDialRequest.number,
        serviceDialRequest.label
      );
      return { handled: true, answer: result.answer };
    }

    const aliasBinding = contactAliasBindingFromMessage(cleanMessage);
    if (aliasBinding) {
      try {
        const result = await bindPhoneContactAlias(
          aliasBinding.alias,
          aliasBinding.contactName
        );
        return { handled: true, answer: result.answer };
      } catch (error) {
        return {
          handled: true,
          answer: error?.code === "USER_CANCELLED"
            ? "Die Kontaktzuordnung wurde abgebrochen."
            : String(
                error?.message ||
                "Der Kontaktalias konnte gerade nicht verbunden werden."
              )
        };
      }
    }

    const phoneContactName = phoneContactCallNameFromMessage(cleanMessage);
    if (phoneContactName) {
      const result = await executePhoneTool("start_phone_call", {
        contact_name: phoneContactName
      });
      return { handled: true, answer: result.answer };
    }

    let match = cleanMessage.match(
      /^(?:suche|finde)\s+(?:den\s+)?kontakt(?:\s+von)?\s+(.+?)[.!?]?$/i
    );
    if (!match) {
      match = cleanMessage.match(/^welche\s+(?:telefon)?nummer\s+hat\s+(.+?)[.!?]?$/i);
    }
    if (match) {
      const result = await executePhoneTool("search_phone_contact", {
        query: match[1]
      });
      return { handled: true, answer: result.answer };
    }

    if (/\bsms\b/i.test(cleanMessage)) {
      match = cleanMessage.match(
        /^(?:schreib|schreibe|sende)\s+(?:eine\s+)?sms\s+(?:an\s+)?(.+?)(?:\s+mit(?:\s+dem)?\s+text|\s*[:,-])\s+(.+)$/i
      );
      if (match) {
        const result = await executePhoneTool("prepare_sms", {
          contact_name: match[1],
          message: match[2]
        });
        return { handled: true, answer: result.answer };
      }
    }

    let whatsAppDraft = null;
    try {
      whatsAppDraft = await resolveWhatsAppDraftFromMessage(cleanMessage);
    } catch (error) {
      if (whatsAppDraftSyntaxFromMessage(cleanMessage)) {
        return {
          handled: true,
          answer: /freigabe|permission/i.test(
            String(error?.message || error || "")
          )
            ? "Für diesen WhatsApp-Auftrag fehlt noch die Android-Kontaktfreigabe."
            : String(
                error?.message ||
                "Der WhatsApp-Empfänger konnte gerade nicht sicher geprüft werden."
              )
        };
      }
      throw error;
    }
    if (whatsAppDraft?.error) {
      return { handled: true, answer: whatsAppDraft.error };
    }
    if (whatsAppDraft) {
      const result = await executePhoneTool("prepare_whatsapp", {
        contact_name: whatsAppDraft.contactName,
        message: whatsAppDraft.message,
        explicit_whatsapp_command: Boolean(
          whatsAppDraft.explicitWhatsApp
        )
      });
      return { handled: true, answer: result.answer };
    }

    previousPlainUserMessage = noteMessage;
    previousPlainUserMessageAt = Date.now();
    return { handled: false };
  };

  window.handleSolHoloRealtimeNoteTranscript = async (message) => {
    const cleanMessage = String(message || "").trim();
    const noteMessage = stripHoloInvocation(cleanMessage);
    if (alarmClockRequestFromMessage(noteMessage)) {
      return window.handleSolHoloLocalAction(cleanMessage);
    }
    if (
      calendarWriteDestinationFromMessage(noteMessage) ||
      liveWeatherRequestFromMessage(noteMessage) ||
      contextualPersonalRecallQueryFromMessage(noteMessage)
    ) {
      return { handled: false };
    }
    return window.handleSolHoloLocalAction(cleanMessage);
  };

  function getHeyHoSolPlugin() {
    return window.Capacitor?.Plugins?.HeyHoSol || null;
  }

  function renderWakeStatus(nextStatus) {
    const statusElement = document.getElementById("heyHoSolStatus");
    const chooser = document.getElementById("wakeModeChooser");
    const pluginAvailable = Boolean(getHeyHoSolPlugin());

    wakeStatus = {
      supported: Boolean(nextStatus?.supported),
      mode: String(nextStatus?.mode || "off"),
      active: Boolean(nextStatus?.active),
      serviceRunning: Boolean(nextStatus?.serviceRunning),
      listening: Boolean(nextStatus?.listening),
      processingAudio: Boolean(nextStatus?.processingAudio),
      pausedForConversation: Boolean(nextStatus?.pausedForConversation),
      speakerGateReady: Boolean(nextStatus?.speakerGateReady),
      overlayPermissionGranted: Boolean(
        nextStatus?.overlayPermissionGranted
      ),
      lastError: String(nextStatus?.lastError || "")
    };

    statusElement.classList.remove("connected", "setup");
    chooser.querySelectorAll("[data-wake-mode]").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.wakeMode === wakeStatus.mode
      );
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.wakeMode === wakeStatus.mode)
      );
      button.disabled =
        wakeActionRunning ||
        (
          button.dataset.wakeMode !== "off" &&
          (!pluginAvailable || !wakeStatus.speakerGateReady)
        );
    });

    if (!pluginAvailable) {
      statusElement.textContent = "Nur Android";
      statusElement.classList.add("setup");
    } else if (!wakeStatus.supported) {
      statusElement.textContent = "Offline fehlt";
      statusElement.classList.add("setup");
    } else if (!wakeStatus.speakerGateReady) {
      statusElement.textContent = "Stimme fehlt";
      statusElement.classList.add("setup");
    } else if (wakeStatus.pausedForConversation) {
      statusElement.textContent = "Holo spricht";
      statusElement.classList.add("connected");
    } else if (
      wakeStatus.mode === "background" &&
      !wakeStatus.overlayPermissionGranted
    ) {
      statusElement.textContent = "Freigabe nötig";
      statusElement.classList.add("setup");
    } else if (wakeStatus.mode === "background") {
      statusElement.textContent = wakeStatus.listening
        ? "Hintergrund aktiv"
        : wakeStatus.processingAudio
          ? "Prüft „Hey Pam“ …"
          : wakeStatus.serviceRunning
            ? "Mikrofon startet …"
            : "Startet …";
      statusElement.classList.add("connected");
    } else if (wakeStatus.mode === "foreground") {
      statusElement.textContent = wakeStatus.listening
        ? "App hört zu"
        : wakeStatus.processingAudio
          ? "Prüft „Hey Pam“ …"
          : wakeStatus.serviceRunning
            ? "Mikrofon startet …"
            : "App offen";
      statusElement.classList.add("connected");
    } else {
      statusElement.textContent = "Aus";
      statusElement.classList.add("setup");
    }
  }

  async function registerWakeListeners() {
    const plugin = getHeyHoSolPlugin();
    if (!plugin || wakeListenersRegistered) {
      return;
    }

    wakeListenersRegistered = true;
    try {
      await plugin.addListener("wakePhraseDetected", (event) => {
        void handleWakePhraseDetected(event);
      });
      await plugin.addListener("wakeStatusChanged", (status) => {
        renderWakeStatus(status);
      });
      await plugin.addListener("wakeDiagnostic", (event) => {
        const campplusScore = Number(event?.campplusScore);
        const eres2netScore = Number(event?.eres2netScore);
        const scoreText =
          Number.isFinite(campplusScore) && Number.isFinite(eres2netScore)
            ? ` · A ${campplusScore.toFixed(3)} · B ${eres2netScore.toFixed(3)}`
            : "";
        if (event?.stage === "phrase_heard") {
          showToast("„Hey Pam“ gehört · deine Stimme wird geprüft …");
        } else if (event?.stage === "owner_accepted") {
          showToast("Stimme freigegeben · Pam’s Holo startet ✨");
        } else if (event?.stage === "owner_rejected") {
          showToast(
            "„Hey Pam“ gehört · Stimme nicht freigegeben 🔒" + scoreText
          );
        }
      });
    } catch (error) {
      wakeListenersRegistered = false;
      console.error("Hey-ho-Sol-Ereignisse:", error);
    }
  }

  async function consumePendingWakeEvent() {
    const plugin = getHeyHoSolPlugin();
    if (!plugin) {
      return;
    }

    try {
      const event = await plugin.consumeWakeEvent();
      if (event?.detected) {
        await handleWakePhraseDetected(event);
      }
    } catch (error) {
      console.error("Hey-ho-Sol-Weckruf:", error);
    }
  }

  async function loadWakeStatus(consumeEvent = false) {
    const plugin = getHeyHoSolPlugin();
    if (!plugin) {
      renderWakeStatus({ supported: false, mode: "off" });
      return wakeStatus;
    }

    await registerWakeListeners();

    try {
      const status = await plugin.getStatus();
      renderWakeStatus(status);
      if (consumeEvent) {
        await consumePendingWakeEvent();
      }
    } catch (error) {
      console.error("Hey-ho-Sol-Status:", error);
      renderWakeStatus({ supported: true, mode: "off" });
      document.getElementById("heyHoSolStatus").textContent = "Status offen";
    }

    return wakeStatus;
  }

  async function setWakeMode(mode) {
    if (wakeActionRunning) {
      return;
    }

    const plugin = getHeyHoSolPlugin();
    if (!plugin) {
      showToast("Der Hey-Pam-Weckruf ist nur in der Android-App verfügbar.");
      return;
    }

    wakeActionRunning = true;
    renderWakeStatus(wakeStatus);

    try {
      const status = await plugin.setMode({ mode });
      renderWakeStatus(status);

      if (mode === "background") {
        if (!status.overlayPermissionGranted) {
          showToast(
            "Aktiviere jetzt „Human Holo“ bei „Über anderen Apps einblenden“ " +
            "und kehre danach zurück."
          );
          await plugin.openOverlaySettings();
          return;
        }

        showToast(
          "Hintergrund-Hören und automatisches Öffnen sind aktiv."
        );
      } else if (mode === "foreground") {
        showToast("Pam’s Holo hört nur auf den Weckruf, solange die App geöffnet ist.");
      } else {
        showToast("Der Hey-Pam-Weckruf ist ausgeschaltet.");
      }
    } catch (error) {
      const message = String(error?.message || error || "");
      console.error("Hey-ho-Sol-Modus:", error);

      if (message.toLowerCase().includes("offline")) {
        showToast(
          "Die Offline-Spracherkennung fehlt. " +
          "Ich öffne die Android-Spracheinstellungen."
        );
        try {
          await plugin.openSpeechSettings();
        } catch {}
      } else {
        showToast(message || "Der Hey-Pam-Weckruf konnte gerade nicht aktiviert werden.");
      }

      await loadWakeStatus();
    } finally {
      wakeActionRunning = false;
      renderWakeStatus(wakeStatus);
    }
  }

  async function pauseWakeListeningForConversation() {
    const plugin = getHeyHoSolPlugin();
    if (!plugin || wakeStatus.mode === "off") {
      return;
    }

    try {
      const status = await plugin.pauseForConversation();
      renderWakeStatus(status);
      await new Promise((resolve) => window.setTimeout(resolve, 260));
    } catch (error) {
      console.error("Hey ho Sol pausieren:", error);
    }
  }

  async function resumeWakeListeningAfterConversation() {
    const plugin = getHeyHoSolPlugin();
    if (!plugin) {
      return;
    }

    try {
      const status = await plugin.resumeAfterConversation();
      renderWakeStatus(status);
    } catch (error) {
      console.error("Hey ho Sol fortsetzen:", error);
    }
  }

  async function handleWakePhraseDetected(event) {
    const detectedAt = Number(event?.detectedAt || Date.now());
    if (
      detectedAt <= lastWakeDetectedAt ||
      Date.now() - detectedAt > 30_000
    ) {
      return;
    }

    lastWakeDetectedAt = detectedAt;
    pendingWakePrompt = String(
      event?.phrase || "Hey Pam"
    );
    showToast("Stimme freigegeben · Pam’s Holo startet ✨");
    await startSolVoice();
  }

  window.consumeSolHoloWakePrompt = () => {
    const prompt = pendingWakePrompt;
    pendingWakePrompt = "";
    return prompt;
  };

  window.pauseHeyHoSolForConversation = pauseWakeListeningForConversation;
  window.resumeHeyHoSolAfterConversation =
    resumeWakeListeningAfterConversation;

  document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-open-view]");
    if (viewButton) {
      showView(viewButton.dataset.openView);
      return;
    }

    const promptButton = event.target.closest("[data-sol-prompt]");
    if (promptButton) {
      void askSol(normalizedVisibleText(promptButton.dataset.solPrompt));
    }
  });

  document.getElementById("medicationCameraButton")?.addEventListener(
    "click",
    () => beginMedicationRecognition("camera")
  );

  document.getElementById("healthSelfCareButton")?.addEventListener(
    "click",
    () => {
      medicationConsentExpiresAt = 0;
      void askSol(healthSelfCarePrompt);
    }
  );

  document.getElementById("medicationGalleryButton")?.addEventListener(
    "click",
    () => beginMedicationRecognition("gallery")
  );

  document.getElementById("medicationGalleryInput")?.addEventListener(
    "change",
    handleMediaInputChange
  );

  document.getElementById("medicationGeneralHealthButton")?.addEventListener(
    "click",
    () => {
      medicationConsentExpiresAt = 0;
      void askSol("Ich möchte zum Bereich Gesundheit. Hilf mir dort bitte weiter.");
    }
  );

  currentBottomNav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (button) {
      event.preventDefault();
      showView(button.dataset.view);
    }
  }, true);

  document.getElementById("welcomeButton").addEventListener("click", () => {
    onboarding.classList.add("hidden");
    try {
      localStorage.setItem(introKey, "1");
    } catch {}
    showView("home");
  });

  document.getElementById("homeSettingsButton").addEventListener("click", () => {
    showView("settings");
  });

  document.getElementById("menuButton")?.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      document.getElementById("drawer")?.classList.remove("open");
      showView("settings");
    },
    true
  );

  const settingsVolumeChooser = document.getElementById("settingsVolumeChooser");
  const syncSettingsVolume = () => {
    settingsVolumeChooser.querySelectorAll("[data-volume-target]").forEach((button) => {
      const target = document.getElementById(button.dataset.volumeTarget);
      button.classList.toggle("active", Boolean(target?.classList.contains("active")));
    });
  };
  settingsVolumeChooser.addEventListener("click", (event) => {
    const button = event.target.closest("[data-volume-target]");
    if (!button) return;
    document.getElementById(button.dataset.volumeTarget)?.click();
    window.requestAnimationFrame(syncSettingsVolume);
  });
  syncSettingsVolume();

  profilePhotoButton.addEventListener("click", (event) => {
    if (cloneMouthCalibrationActive) {
      moveCloneMouthCalibration(event);
      return;
    }
    if (!requireActivePersonalOwner()) {
      return;
    }
    profilePhotoInput.click();
  });

  profilePhotoChangeButton.addEventListener("click", () => {
    if (!requireActivePersonalOwner()) {
      return;
    }
    profilePhotoInput.click();
  });

  profilePhotoInput.addEventListener("change", async () => {
    const identity = requireActivePersonalOwner();
    const keys = activeCloneStorageKeys();
    if (!identity || !keys) {
      profilePhotoInput.value = "";
      return;
    }
    const file = profilePhotoInput.files?.[0];
    profilePhotoInput.value = "";
    if (!file) {
      return;
    }

    const confirmedForOwner = window.confirm(
      `Ist dies wirklich ${identity.displayName}s eigenes Bild und soll es ausschließlich unter ${identity.ownerId} gespeichert werden?`
    );
    if (!confirmedForOwner) {
      showToast("Bild nicht gespeichert · die Zuordnung wurde nicht bestätigt.");
      return;
    }

    showToast(`Dein Bild wird nur für ${identity.displayName}s Holo vorbereitet …`);
    try {
      const photo = await prepareClonePhoto(file);
      const mouth = normalizedCloneMouth({
        x: 0.5,
        y: 0.58,
        width: 0.16,
        height: 0.075
      });
      const metadata = JSON.stringify({
        confirmedBy: identity.speakerId,
        deviceBinding: "signed-owner-bound-instance",
        deviceDisplayNameUsedAsIdentity: false,
        explicitOwnerConfirmation: true,
        faceProcessing: "local-landmarks-only-not-person-identification",
        locationUsedAsIdentity: false,
        ownerId: identity.ownerId,
        schemaVersion: 2,
        speakerId: identity.speakerId,
        storedAt: new Date().toISOString()
      });
      localStorage.setItem(keys.photo, photo);
      localStorage.setItem(keys.mouth, JSON.stringify(mouth));
      localStorage.setItem(keys.metadata, metadata);
      if (
        localStorage.getItem(keys.photo) !== photo ||
        localStorage.getItem(keys.metadata) !== metadata
      ) {
        throw new Error("OWNER_BOUND_IMAGE_SAVE_FAILED");
      }
      applyCustomCloneAppearance(photo, mouth);
      showToast(
        "Bild owner-gebunden gespeichert · Original Full Sync wird nur lokal neu zugeordnet ✨"
      );
    } catch (error) {
      console.error("Persönliches Holo-Galeriebild:", error);
      showToast(
        error?.message || "Das Bild konnte gerade nicht übernommen werden."
      );
    }
  });

  profileMouthButton.addEventListener("click", () => {
    beginCloneMouthCalibration();
  });

  [
    profileMouthX,
    profileMouthY,
    profileMouthWidth,
    profileMouthHeight
  ].forEach((control) => {
    control.addEventListener("input", () => {
      previewCloneMouthGeometry();
    });
  });

  profileMouthConfirmButton.addEventListener("click", () => {
    confirmCloneMouthCalibration();
  });

  profileMouthCancelButton.addEventListener("click", () => {
    cancelCloneMouthCalibration();
  });

  profilePhotoResetButton.addEventListener("click", () => {
    if (!requireActivePersonalOwner()) {
      return;
    }
    const keys = activeCloneStorageKeys();
    if (!keys) {
      return;
    }
    cloneMouthCalibrationActive = false;
    cloneMouthBeforeCalibration = null;
    try {
      localStorage.removeItem(keys.photo);
      localStorage.removeItem(keys.mouth);
      localStorage.removeItem(keys.metadata);
    } catch {}
    applyCustomCloneAppearance("", null);
    showToast("Das HUMAN-HOLO-Bild ist wieder aktiv.");
  });

  calendarComposer.addEventListener("submit", (event) => {
    event.preventDefault();
    const calendarText = calendarTextInput.value.trim();
    if (!calendarText) {
      calendarComposerStatus.textContent = "Sag bitte, was und wann eingetragen werden soll.";
      showToast("Kalendereintrag fehlt.");
      return;
    }
    if (!calendarWriteDestinationFromMessage(calendarText)) {
      calendarComposerStatus.textContent =
        "Bitte Datum oder „morgen“, Uhrzeit und Anlass nennen.";
      showToast("Zum Beispiel: Morgen 13 Uhr Zahnarzt");
      return;
    }

    calendarComposerStatus.textContent = "Kalenderauftrag wird geprüft …";
    calendarTextInput.value = "";
    void askSol(calendarText);
  });

  shoppingComposer.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = appendPersonalListItem(
      "Einkaufsliste",
      shoppingItemInput.value
    );
    if (result.success) {
      shoppingItemInput.value = "";
      shoppingItemInput.focus();
      return;
    }
    if (result.securityBlocked) {
      window.alert(result.answer);
    } else {
      showToast(result.answer);
    }
  });

  noteComposer.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = createPersonalNote(noteTextInput.value, {
      source: `In ${activeInstanceName()} geschrieben`
    });
    if (result.success) {
      noteTextInput.value = "";
      noteTextInput.focus();
      return;
    }
    if (result.securityBlocked) {
      window.alert(result.answer);
    } else {
      showToast(result.answer);
    }
  });

  notesSearchInput.addEventListener("input", () => {
    renderPersonalNotes(notesSearchInput.value);
  });

  const handlePersonalNoteAction = async (event) => {
    const actionButton = event.target.closest("[data-note-action]");
    if (!actionButton) {
      return;
    }

    const note = personalNotes.find(
      (entry) => entry.id === actionButton.dataset.noteId
    );
    if (!note) {
      showToast("Dieser Eintrag wurde nicht mehr gefunden.");
      renderPersonalNotes();
      return;
    }

    if (actionButton.dataset.noteAction === "delete") {
      const confirmed = window.confirm(
        `„${note.title}“ wirklich löschen?`
      );
      if (!confirmed) {
        return;
      }
      await executeNotesTool("delete_personal_note", { query: note.id });
      return;
    }

    if (actionButton.dataset.noteAction === "edit") {
      const newText = window.prompt(
        `„${note.title}“ bearbeiten:`,
        note.text
      );
      if (newText === null || newText.trim() === note.text) {
        return;
      }
      const result = await executeNotesTool("update_personal_note", {
        query: note.id,
        text: newText
      });
      if (result.securityBlocked) {
        window.alert(result.answer);
      }
    }
  };

  notesList.addEventListener("click", handlePersonalNoteAction);
  shoppingList.addEventListener("click", handlePersonalNoteAction);

  memorialPersonName.addEventListener("input", () => {
    memorialPersonName.setCustomValidity("");
  });

  memorialStory.addEventListener("input", () => {
    memorialStory.setCustomValidity("");
  });

  memorialRightsConfirmation.addEventListener("change", () => {
    memorialRightsConfirmation.setCustomValidity("");
  });

  memorialMediaInput.addEventListener("change", () => {
    renderMemorialMediaSelection();
  });

  memorialForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void saveMemorialEntry();
  });

  memorialList.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-memorial-action]");
    if (!actionButton) return;
    if (actionButton.dataset.memorialAction === "delete") {
      void deleteMemorialEntry(actionButton.dataset.memorialId);
    }
  });

  document.getElementById("notesVoiceButton").addEventListener("click", () => {
    void startSolVoice();
  });

  document.getElementById("homeOrbButton").addEventListener("click", () => {
    void startSolVoice();
  });

  document.getElementById("manageMemoriesButton").addEventListener("click", () => {
    void askSol("Was weißt du dauerhaft?");
  });

  document.getElementById("refreshServicesButton").addEventListener("click", () => {
    void loadGoogleStatus();
    void loadSmartThingsStatus();
    void loadWhatsAppStatus();
    void loadWakeStatus();
    void loadPhoneStatus();
    void loadHealthStatus();
    void renderGoogleMapsStatus();
    void loadAlarmClockStatus();
    void loadGalaxyWatchStatus();
    void loadLiveWeatherStatus();
    renderSamsungNotesStatus();
  });

  document.getElementById("openClawAlltagPreviewRow").addEventListener(
    "click",
    () => {
      void runOpenClawAlltagPreview();
    }
  );

  document.getElementById("googleAccountRow").addEventListener("click", async () => {
    const identity = requireActivePersonalOwner();
    if (!identity) {
      return;
    }

    if (googleConnected) {
      showToast(
        `Google-Konto nur für ${identity.displayName}s Holo verbunden: Anmeldung, Gmail, Kontakte, Drive und Kalender.`
      );
      return;
    }

    if (googleStatus.trustedSessionRequired) {
      showToast("Dein registriertes S23 wird jetzt einmal sicher bestätigt …");
      try {
        const session = await window.SolHoloTrustedSession?.ensure?.({
          interactive: true
        });
        if (!session?.trusted) {
          throw new Error("TRUSTED_APP_SESSION_NOT_CONFIRMED");
        }
        await loadGoogleStatus();
        await loadSmartThingsStatus();
        showToast("Sichere S23-Sitzung bestätigt ✅️");
      } catch (error) {
        console.error("Sichere App-Sitzung:", error?.code || error?.name);
        showToast(
          String(
            error?.message ||
            "Die sichere S23-Sitzung wurde noch nicht bestätigt."
          )
        );
        return;
      }
      if (googleConnected) {
        showToast("Google-Konto und Kalender sind verbunden ✅️");
        return;
      }
    }

    let authUrl = "";
    try {
      const response = await fetch(
        "https://sol-holo.onrender.com/auth/google/start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(window.SolHoloTrustedSession?.headers?.() || {})
          },
          body: JSON.stringify({
            ownerId: identity.ownerId,
            selectedSpeakerId: identity.speakerId
          }),
          cache: "no-store"
        }
      );
      const data = await response.json();
      if (!response.ok || !data?.authUrl) {
        throw new Error(
          data?.error ||
          "Die Google-Verbindung konnte nicht gestartet werden."
        );
      }
      authUrl = data.authUrl;
    } catch (error) {
      console.error("Google-Verbindung:", error);
      showToast(String(error?.message || "Google ist gerade nicht erreichbar."));
      return;
    }

    const authWindow = window.open(
      authUrl,
      "_blank",
      "noopener"
    );

    if (!authWindow) {
      window.location.href = authUrl;
    }
  });

  document.getElementById("whatsappDriveRow").addEventListener("click", () => {
    void toggleWhatsAppDrivingMode();
  });

  document.getElementById("heyHoSolRow").addEventListener("click", () => {
    showToast(
      wakeStatus.mode === "background" &&
      !wakeStatus.overlayPermissionGranted
        ? "Tippe unten noch einmal auf „Hintergrund“, um die einmalige " +
          "Android-Freigabe zu öffnen."
        : "Wähle: Aus, nur bei geöffneter App oder sichtbar im Hintergrund."
    );
  });

  document.getElementById("wakeModeChooser").addEventListener("click", (event) => {
    const button = event.target.closest("[data-wake-mode]");
    if (button) {
      void setWakeMode(button.dataset.wakeMode);
    }
  });

  document.getElementById("phoneContactsRow").addEventListener("click", async () => {
    if (phoneStatus.contactsPermissionGranted) {
      const managePermissions = window.confirm(
        "Alle Gerätekontakte und die Anruferkennung sind aktiv. WhatsApp kann nach deinem ausdrücklichen Auftrag automatisch senden; SMS und Anrufe bleiben sichtbar bestätigt.\n\nAndroid-Berechtigungen jetzt verwalten oder widerrufen?"
      );
      if (managePermissions) {
        try {
          await getPhoneContactsPlugin()?.openPermissionSettings();
        } catch (error) {
          console.error("Telefon-Berechtigungen:", error);
          showToast("Die Android-Berechtigungen konnten gerade nicht geöffnet werden.");
        }
      }
      return;
    }
    void requestPhoneAccess();
  });

  document.getElementById("samsungGalleryRow").addEventListener("click", () => {
    const identity = requireActivePersonalOwner();
    if (!identity) {
      return;
    }
    showView("settings");
    profilePhotoInput.click();
    showToast(`Samsung Galerie ist geöffnet · das Bild bleibt nur bei ${identity.displayName}s Holo.`);
  });

  document.getElementById("smartThingsRow").addEventListener("click", () => {
    const identity = requireActivePersonalOwner();
    if (!identity) {
      return;
    }

    if (smartThingsStatus.connected) {
      showToast(
        "SmartThings-Zuhause verbunden. Geräteaktionen brauchen immer deine Bestätigung."
      );
      return;
    }

    if (smartThingsStatus.trustedSessionRequired) {
      showToast("Bestätige zuerst die sichere S23-Sitzung bei Google.");
      return;
    }

    if (!smartThingsStatus.configured) {
      showToast(
        "Die sichere SmartThings-Verbindung ist vorbereitet. " +
        "Die einmalige Samsung-Appregistrierung schließen wir am Laptop ab."
      );
      return;
    }

    const identityQuery = new URLSearchParams({
      ownerId: identity.ownerId,
      selectedSpeakerId: identity.speakerId
    });
    const authUrl =
      `https://sol-holo.onrender.com/auth/smartthings?${identityQuery}`;

    const authWindow = window.open(
      authUrl,
      "_blank",
      "noopener"
    );

    if (!authWindow) {
      window.location.href = authUrl;
    }
  });

  const openSamsungNotes = async () => {
    const result = await openSamsungNotesForReview("ansehen");
    showToast(result.answer);
  };

  document.getElementById("samsungNotesQuickCard")?.addEventListener(
    "click",
    () => void openSamsungNotes()
  );

  document.getElementById("samsungNotesRow").addEventListener(
    "click",
    () => void openSamsungNotes()
  );

  document.getElementById("googleMapsRow")?.addEventListener(
    "click",
    () => void openGoogleMapsForRequest("")
  );

  document.getElementById("alarmClockRow")?.addEventListener(
    "click",
    () => void openAlarmClockForRequest({ action: "open" })
  );

  document.getElementById("galaxyWatchRow")?.addEventListener(
    "click",
    () => void setupGalaxyWatchBridge()
  );

  document.getElementById("liveWeatherRow")?.addEventListener(
    "click",
    () => void askSol("Wie ist das Wetter?")
  );

  document.getElementById("healthConnectRow").addEventListener("click", () => {
    void openHealthPermissions();
  });

  document.getElementById("manageServicesButton").addEventListener("click", () => {
    const whatsappText = whatsappStatus.active
      ? "Der WhatsApp-Fahrmodus ist aktiv."
      : "Den WhatsApp-Fahrmodus richtest du direkt über seine Zeile ein.";
    showToast(
      "Jeder Dienst wird einzeln freigegeben. " + whatsappText +
      " Google-Konto, Telefon, Wecker, Galaxy Watch, Health und SmartThings richtest du über ihre Zeile ein. " +
      "Samsung Galerie öffnet die Bildauswahl; Zurufe werden direkt unter Wichtiges gespeichert. Samsung Notes öffnet nur beim manuellen Antippen."
    );
  });

  document.getElementById("openSystemMenuButton").addEventListener("click", () => {
    const details = document.getElementById("settingsSystemDetails");
    const button = document.getElementById("openSystemMenuButton");
    details.hidden = !details.hidden;
    button.setAttribute("aria-expanded", String(!details.hidden));
    button.querySelector(".rowChevron").textContent = details.hidden ? "›" : "⌄";
  });

  document.getElementById("showWelcomeAgainButton").addEventListener("click", () => {
    try {
      localStorage.removeItem(introKey);
    } catch {}
    onboarding.classList.remove("hidden");
  });

  try {
    if (localStorage.getItem(introKey) === "1") {
      onboarding.classList.add("hidden");
    }
  } catch {}

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void loadWhatsAppStatus();
      void loadWakeStatus(true);
      void loadPhoneStatus();
      void loadHealthStatus();
      void loadSmartThingsStatus();
      void loadGalaxyWatchStatus();
      void consumeSharedNoteImport();
      window.setTimeout(
        () => void window.resumeSolHoloConversationAfterExternalReturn?.("whatsapp"),
        350
      );
    }
  });

  window.addEventListener("focus", () => {
    void loadWhatsAppStatus();
    void loadWakeStatus(true);
    void loadPhoneStatus();
    void loadHealthStatus();
    void loadSmartThingsStatus();
    void loadGalaxyWatchStatus();
    void consumeSharedNoteImport();
    window.setTimeout(
      () => void window.resumeSolHoloConversationAfterExternalReturn?.("whatsapp"),
      350
    );
  });

  window.addEventListener("solholoidentitychange", () => {
    renderPersonalIdentityUi();
    loadPersonalNotes();
    renderPersonalNotes("");
    memorialEntries = [];
    renderMemorialEntries();
    if (views.memorial.classList.contains("active")) {
      void loadMemorialEntries();
    }
    restoreCustomCloneAppearance();
    void loadGoogleStatus();
    void loadSmartThingsStatus();
  });

  window.addEventListener("solholo:trusted-session", () => {
    void loadGoogleStatus();
    void loadSmartThingsStatus();
  });

  loadPersonalNotes();
  renderPersonalNotes();
  renderMemorialMediaSelection();
  renderMemorialEntries();
  renderPersonalIdentityUi();
  restoreCustomCloneAppearance();
  document.querySelectorAll(".pamUnicorn, #chatUnicornSignature").forEach(
    node => node.remove()
  );
  applyHumanHoloVisibleNaming(document);
  const visibleNamingObserver = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") {
        const normalized = normalizedVisibleText(record.target.nodeValue);
        if (normalized !== record.target.nodeValue) {
          record.target.nodeValue = normalized;
        }
        continue;
      }
      for (const node of record.addedNodes) {
        applyHumanHoloVisibleNaming(node);
      }
    }
  });
  visibleNamingObserver.observe(document.body, {
    childList: true,
    characterData: true,
    subtree: true
  });
  showView("home");
  void loadGoogleStatus();
  void loadSmartThingsStatus();
  void loadWhatsAppStatus();
  void loadWakeStatus(true);
  void loadPhoneStatus();
  void renderGoogleMapsStatus();
  void loadAlarmClockStatus();
  void loadGalaxyWatchStatus();
  void loadLiveWeatherStatus();
  renderSamsungNotesStatus();
  void registerSharedNoteListener();
  void consumeSharedNoteImport();
  void loadHealthStatus();
})();
