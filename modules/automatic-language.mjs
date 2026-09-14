const DEFAULT_TRANSCRIPTION_MODEL = "gpt-transcribe";

export const HUMAN_HOLO_LANGUAGE_POLICY = Object.freeze({
  version: "2026-09-14-owner-language-default-1",
  mode: "automatic-input-owner-default-reply",
  defaultLanguage: "de",
  pamDefaultReplyLanguage: "de",
  fixedAllowlist: false,
  automaticInputDetection: true,
  mixedLanguageInput: true,
  translateOnRequest: true,
  inferIdentityFromLanguage: false,
  signLanguageUsesCameraPath: true,
  modalityParityRequired: true
});

/**
 * Realtime soll weiterhin jede unterstützte Eingabesprache automatisch
 * erkennen. Deshalb wird absichtlich kein fester Transkriptions-Hinweis
 * gesetzt. Die Antwortsprache ist davon getrennt geregelt.
 */
export function createAutomaticTranscriptionConfig(
  model = DEFAULT_TRANSCRIPTION_MODEL
) {
  const cleanModel =
    String(model || "").trim();

  if (!cleanModel) {
    throw new TypeError(
      "Für die automatische Spracherkennung fehlt das OpenAI-Transkriptionsmodell."
    );
  }

  return {
    model:
      cleanModel
  };
}

function isPam(displayName) {
  return String(displayName || "")
    .trim()
    .toLocaleLowerCase("de-DE") === "pam";
}

export function automaticLanguageInstructions(
  displayName = "die sprechende Person"
) {
  const person =
    String(displayName || "").trim() ||
    "die sprechende Person";

  if (isPam(person)) {
    return `
VERBINDLICHE SPRACHFÜHRUNG FÜR PAM:

Verstehe Pams aktuellen Beitrag automatisch in jeder Sprache, die die aktive
OpenAI-Sprachfunktion zuverlässig unterstützt. Pam muss keine Eingabesprache
vorher auswählen. Dialekt, Umgangssprache, Mischsprache und Code-Switching
werden inhaltlich verstanden, ohne daraus Identität oder Berechtigungen
abzuleiten.

ANTWORTSPRACHE IST STANDARDMÄSSIG DEUTSCH. Das gilt gleichermaßen für
Schrift, gesprochene Sprache, Bild-/Kamerakontext und erkannte Gebärdensprache.
Auch wenn Pam einen Beitrag auf Englisch, Spanisch oder in einer anderen
Sprache formuliert, antwortest du ihr auf Deutsch, solange sie nicht für genau
diesen Beitrag ausdrücklich eine andere Antwortsprache oder eine Übersetzung
in eine andere Zielsprache verlangt.

Eine ausdrücklich verlangte andere Antwortsprache gilt nur für den konkreten
Auftrag. Danach kehrst du automatisch zu Deutsch zurück. Übersetze nicht
ungefragt. Wichtige Eigennamen und Originalbegriffe dürfen unverändert bleiben.

Sprache, Schrift und Gebärdensprache sind nur unterschiedliche Eingabewege.
Für Bedeutung, Gedächtnis, Regeln, Berechtigungen, Funktionen und Antwortinhalt
gilt derselbe Human-Holo-Kern. Kein Eingabeweg darf weniger Erinnerungen oder
andere persönliche Fakten sehen als ein anderer. Gebärdensprache wird technisch
über den Kamerapfad erfasst, aber nach sicherer Erkennung semantisch genauso
weiterverarbeitet wie derselbe Inhalt in Sprache oder Schrift.
`;
  }

  return `
VERBINDLICHE AUTOMATISCHE SPRACHFÜHRUNG:

Erkenne die Sprache von ${person}s aktuellem Beitrag automatisch. ${person}
muss keine Sprache vorher auswählen. Verwende jede Sprache, die die aktive
OpenAI-Sprachfunktion zuverlässig unterstützt.

Antworte grundsätzlich in derselben Sprache wie der aktuelle Beitrag. Bei
Mischsprache antworte in der überwiegenden Sprache. Wenn ausdrücklich eine
Übersetzung oder Zielsprache verlangt wird, verwende diese. Deutsch ist der
Rückfall, wenn keine Sprache zuverlässig erkennbar ist.

Leite Identität, Herkunft oder Berechtigungen niemals aus Sprache, Dialekt,
Akzent oder Stimme ab. Gebärdensprache wird technisch über den Kamerapfad
erfasst, muss aber nach sicherer Erkennung denselben Human-Holo-Kern für
Gedächtnis, Regeln und Funktionen verwenden wie Sprache und Schrift.
`;
}

export function automaticReplyLanguageInstructions(
  displayName = ""
) {
  if (isPam(displayName)) {
    return `
Verstehe die aktuelle Frage unabhängig von ihrer Eingabesprache. Antworte Pam
standardmäßig vollständig auf Deutsch. Nur wenn Pam in diesem konkreten Auftrag
ausdrücklich eine andere Antwortsprache oder Zielsprache verlangt, verwende
diese für genau diesen Auftrag und kehre danach zu Deutsch zurück. Keine
ungefragte Übersetzung. Sprache, Schrift und Gebärdensprache ändern weder
Gedächtnis noch Regeln noch persönliche Fakten.
`;
  }

  return `
Erkenne die Sprache der aktuellen Frage automatisch und antworte vollständig
in derselben Sprache. Verwende keine feste Sprachliste. Bei natürlicher
Mischsprache antworte in der überwiegenden Sprache und erhalte wichtige
Originalbegriffe. Wenn ausdrücklich eine Übersetzung oder Zielsprache verlangt
wird, verwende die verlangte Zielsprache. Deutsch ist der Rückfall, wenn aus
der Frage keine Sprache zuverlässig erkennbar ist.
`;
}
