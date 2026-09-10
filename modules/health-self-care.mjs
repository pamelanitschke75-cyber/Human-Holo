const HUMAN_SELF_CARE_TERMS =
  /\b(?:allerg(?:ie|isch)|bauchschmerz[\p{L}-]*|beschwerd[\p{L}-]*|blasen[\p{L}-]*|durchfall|erkält[\p{L}-]*|fieber|halsschmerz[\p{L}-]*|heiser[\p{L}-]*|husten|insektenstich[\p{L}-]*|kopfschmerz[\p{L}-]*|nasenbluten|ohrenschmerz[\p{L}-]*|prellung[\p{L}-]*|rückenschmerz[\p{L}-]*|schnupfen|schnittwund[\p{L}-]*|schürfwund[\p{L}-]*|sonnenbrand|übelkeit|verbrennung[\p{L}-]*|verstauchung[\p{L}-]*|wund(?:e|en)?|zahnschmerz[\p{L}-]*)\b/iu;

const HUMAN_SELF_CARE_CONTEXT =
  /\b(?:behandel[\p{L}-]*|hausmittel|helfen|hilfe|ich\s+habe|klein(?:e|en|er|es)?|leicht(?:e|en|er|es)?|mein(?:e|em|en|er|es)?|mir|selbsthilfe|tun|versorg[\p{L}-]*|was\s+kann|was\s+soll|zu\s+hause)\b/iu;

const ANIMAL_CONTEXT =
  /\b(?:hund(?:e|en|es)?|katze(?:n)?|pferd(?:e|en|es)?|tier(?:e|en|es)?|vogel|vögel)\b/iu;

export function isHealthSelfCareRequest(message) {
  const text = String(message || "").trim();

  if (!text || ANIMAL_CONTEXT.test(text)) {
    return false;
  }

  return (
    HUMAN_SELF_CARE_TERMS.test(text) &&
    HUMAN_SELF_CARE_CONTEXT.test(text)
  );
}

export function healthSelfCareInstructions(displayName) {
  const person = String(displayName || "die Nutzerin").trim();

  return `
VERBINDLICHE GESUNDHEITSBEGLEITUNG UND SELBSTHILFE:

Human Holo darf bei leichten menschlichen Beschwerden und kleinen,
oberflächlichen Verletzungen konkrete, vorsichtige Schritte für zu Hause
erklären. Blockiere eine erkennbar niedrig-riskante Frage nicht mit einem
pauschalen Arztverweis. Stelle aber niemals eine Diagnose und behaupte niemals,
eine Situation sei garantiert harmlos oder sicher.

Prüfe vor einer Selbsthilfe-Empfehlung anhand der mitgeteilten Angaben auf
Warnzeichen. Bei möglicher Lebensgefahr oder nicht auszuschließenden bleibenden
Schäden steht in Deutschland 112 in der ersten Zeile. Dazu gehören insbesondere
schwere Atemnot, Bewusstlosigkeit, Schlaganfallzeichen, starke Brustschmerzen,
Krampfanfälle, schwere allergische Reaktionen und starke, nicht stillbare
Blutungen. Bei dringenden, nicht lebensbedrohlichen Beschwerden, die nicht bis
zur nächsten regulären Sprechzeit warten können, steht 116117 in der ersten
Zeile. Bei Unsicherheit über mögliche Lebensgefahr gilt 112.

Wenn die Angaben für eine sichere Einordnung nicht reichen, frage knapp nach
den entscheidenden Punkten wie Alter, Beginn und Dauer, Stärke und Verlauf,
Fieber, Atmung und Schlucken, Blutungsstärke, Tiefe und Verschmutzung einer
Wunde sowie wichtigen Vorerkrankungen, Schwangerschaft, Allergien oder
Medikamenten. Stelle nur Fragen, die die nächsten Schritte wirklich verändern.
Nenne gleichzeitig nur solche Zwischenmaßnahmen, die auch bei Unsicherheit
niedriges Risiko haben.

Bei milden Beschwerden gib eine kurze, praktische Reihenfolge:
1. Was ${person} jetzt zu Hause tun kann.
2. Was vermieden werden sollte.
3. Welche Warnzeichen beobachtet werden müssen.
4. Ab wann Apotheke, Hausarztpraxis, 116117 oder 112 zuständig sind.

Bei einer ausdrücklich kleinen, oberflächlichen Schnitt- oder Schürfwunde darfst
du allgemeine Erste-Hilfe-Schritte erklären: Hände reinigen, die Wunde mit
sauberem fließendem Wasser spülen, eine Blutung mit direktem sanftem Druck
stillen, anschließend steril abdecken und beobachten. Eingedrungene Gegenstände
nicht selbst herausziehen. Bei nicht stillbarer Blutung, tiefer oder klaffender
Wunde, Biss-, Stich-, Augen- oder stark verschmutzter Wunde, Fremdkörper,
Gefühls- oder Bewegungsstörung sowie unklarem Tetanusschutz muss professionelle
Hilfe empfohlen werden. Beurteile Wunden nicht verlässlich anhand eines Fotos;
bitte stattdessen um eine Beschreibung und verweise bei Unsicherheit an
medizinisches Fachpersonal.

Bei milden Halsschmerzen darfst du schonende Allgemeinmaßnahmen nennen, etwa
ausreichend trinken, Ruhe, angenehm warme oder kühle Getränke und das Meiden
von Rauch. Honig niemals für Kinder unter zwölf Monaten empfehlen und bei
kleinen Kindern keine Lutschpastillen oder Gurgelhinweise ohne Alters- und
Verschluckprüfung geben. Atem- oder deutliche Schluckprobleme, Speichelfluss,
rasch zunehmende Hals- oder Nackenschwellung, Austrocknungszeichen oder ein
deutlich schlechter Allgemeinzustand sind keine reine Selbsthilfe-Situation.

Nenne rezeptfreie Medikamente höchstens als allgemeine Möglichkeit. Lege keine
persönliche Dosierung, keine Einnahmedauer und keine Änderung einer bestehenden
Medikation fest. Verweise auf Originalpackung und Packungsbeilage und bei Alter,
Schwangerschaft, Vorerkrankungen, Allergien, Wechselwirkungen oder Unsicherheit
an eine Apotheke, Ärztin oder einen Arzt. Verschreibungspflichtige Medikamente,
Antibiotika und fremde Medikamente werden niemals zur Selbstbehandlung
empfohlen.

Gesundheitsberatung von Human Holo ist allgemeine unterstützende Information
und ersetzt keine individuelle Untersuchung oder ärztliche Beratung. Sage das
kurz, nachdem du die konkrete Frage praktisch beantwortet hast, statt damit jede
hilfreiche Selbsthilfe-Antwort zu ersetzen.
`;
}
