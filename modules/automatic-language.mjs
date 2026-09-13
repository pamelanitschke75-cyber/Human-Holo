const DEFAULT_TRANSCRIPTION_MODEL = "gpt-transcribe";

export const HUMAN_HOLO_LANGUAGE_POLICY = Object.freeze({
  version: "2026-09-13-automatic-all-supported-1",
  mode: "automatic",
  defaultLanguage: "de",
  fixedAllowlist: false,
  switchPerTurn: true,
  mixedLanguageInput: true,
  translateOnRequest: true,
  inferIdentityFromLanguage: false,
  signLanguageUsesCameraPath: true
});

/**
 * Creates the Realtime transcription configuration without a language hint.
 * Omitting both `language` and `languages` is intentional: a fixed hint such
 * as `de` biases transcription and prevents Human Holo's automatic-language
 * contract from being true for the next spoken turn.
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

export function automaticLanguageInstructions(
  displayName = "die sprechende Person"
) {
  const person =
    String(displayName || "").trim() ||
    "die sprechende Person";

  return `
VERBINDLICHE AUTOMATISCHE SPRACHFÜHRUNG:

Erkenne die Sprache von ${person}s aktuellem Beitrag automatisch. ${person}
muss keine Sprache vorher auswählen und keinen Befehl wie „Sprich Spanisch“
geben. Es gibt keine feste Zehnerliste und keine künstliche Sprach-Whitelist:
Nutze jede Sprache, die die aktive OpenAI-Sprachfunktion zuverlässig
unterstützt.

Antworte grundsätzlich in derselben Sprache wie der aktuelle Beitrag. Wechselt
${person} zwischen Gesprächsbeiträgen die Sprache, wechselst du mit. Bei
natürlicher Mischsprache oder Code-Switching verstehst du den gesamten Inhalt,
behältst wichtige Originalbegriffe bei und antwortest in der überwiegenden
Sprache des aktuellen Beitrags. Ist keine Sprache überwiegend, verwende die
zuletzt eindeutig verwendete Sprache. Frage nur dann kurz nach, wenn die
Sprachunsicherheit die Bedeutung oder die gewünschte Antwort tatsächlich
verändern würde.

Übersetze nicht ungefragt. Wenn ${person} ausdrücklich eine Übersetzung oder
eine Zielsprache verlangt, übersetze sinngenau in diese Zielsprache und
kennzeichne echte Mehrdeutigkeit. Deutsch ist ausschließlich die
Standardsprache für die Bedienoberfläche und der Rückfall, wenn noch kein
verständlicher sprachlicher Beitrag vorliegt; Deutsch darf eine erkannte
andere Sprache niemals überschreiben.

Leite Identität, Herkunft oder Berechtigungen niemals aus Sprache, Dialekt,
Akzent oder Stimme ab. Gebärdensprachen bleiben vom gesprochenen Sprachweg
getrennt und werden nur über den ausdrücklich gestarteten Kamerapfad mit einer
konkret gewählten Gebärdensprache ausgewertet.
`;
}

export function automaticReplyLanguageInstructions() {
  return `
Erkenne die Sprache der aktuellen Frage automatisch und antworte vollständig
in derselben Sprache. Verwende keine feste Sprachliste. Bei natürlicher
Mischsprache antworte in der überwiegenden Sprache und erhalte wichtige
Originalbegriffe. Wenn ausdrücklich eine Übersetzung oder Zielsprache verlangt
wird, verwende die verlangte Zielsprache. Deutsch ist nur der Rückfall, wenn
aus der Frage keine Sprache zuverlässig erkennbar ist.
`;
}
