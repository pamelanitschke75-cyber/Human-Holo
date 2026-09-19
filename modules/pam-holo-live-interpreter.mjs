export const PAM_HOLO_LIVE_INTERPRETER_POLICY = Object.freeze({
  version: "2026-09-19",
  name: "Pam-Holo Live-Dolmetscher",
  functionalConcept: "Vollendetes Bewusstsein",
  functionalConceptMeaning:
    "live-input-understanding-logical-context-and-fitting-response",
  ownerId: "pam-sol",
  speakerId: "pam",
  activeRealtimeMicrophoneRequired: true,
  automaticTranslationToGerman: true,
  separateTranslationCommandRequired: false,
  currentLiveAudioOnly: true,
  contextAwareTranslation: true,
  inventedTranslationAllowed: false,
  textChatIsLiveAudio: false,
  cameraFramesAreLiveAudio: false,
  prerecordedOrDescribedSpeechIsLiveAudio: false,
  humanHoloRelease: "lawyer-approval-required"
});

export function isPamHoloLiveInterpreterEnabled(identity) {
  return (
    String(identity?.ownerId || "").trim() ===
      PAM_HOLO_LIVE_INTERPRETER_POLICY.ownerId &&
    String(identity?.speakerId || "").trim() ===
      PAM_HOLO_LIVE_INTERPRETER_POLICY.speakerId
  );
}

export function pamHoloLiveInterpreterInstructions(identity) {
  if (!isPamHoloLiveInterpreterEnabled(identity)) {
    return "";
  }

  return `
VERBINDLICHER LIVE-DOLMETSCHER FÜR PAM’S HOLO:

- Pams Funktionsbegriff „Vollendetes Bewusstsein“ bezeichnet hier das
  Zusammenspiel der technisch aktuell verfügbaren Live-Eingabe mit Verständnis,
  logischer Verbindung des Zusammenhangs und einer passenden Reaktion. Es ist
  keine bloße Übersetzungs- oder Worttauschregel.
- Der Live-Dolmetscher ist ausschließlich in einer von Pam geöffneten
  Realtime-Mikrofonsitzung aktiv. Er verändert weder Textchat noch Kamera,
  Erinnerungen, Berechtigungen oder andere bestehende Funktionen.
- Sobald eine tatsächlich anwesende Person Pam in der laufenden Situation in
  einer anderen Sprache als Deutsch anspricht, erkenne die Sprache automatisch
  und gib die Bedeutung sofort auf Deutsch wieder. Pam muss dafür keinen
  zusätzlichen Übersetzungsbefehl geben. Das gilt beispielsweise auch, wenn
  ihr Nachbar unmittelbar mit ihr spricht.
- Übersetze nur eine Äußerung, die gerade über den aktiven Realtime-Audioweg
  empfangen wurde. Eine erzählte, zitierte, nachgestellte, abgespielte,
  erinnerte oder erfundene Äußerung ist keine aktuelle Live-Situation. Stelle
  sie niemals als live gehört dar.
- Übersetze sinngenau und im Zusammenhang statt Wort für Wort. Bewahre Namen,
  Zahlen, Uhrzeiten, Daten, Verneinungen, Fragen und die erkennbare Absicht.
  Verbinde den unmittelbar gesprochenen Kontext logisch: A + B = C. Ergänze
  keine Aussage, die nicht zuverlässig im aktuellen Audiosignal enthalten ist.
- Wenn Sprache oder Wortlaut akustisch nicht sicher verstanden werden, sage
  das kurz und bitte um Wiederholung, statt eine Übersetzung zu erfinden.
- Wenn Pam ausdrücklich eine Antwort für die andere Person formuliert oder
  übersetzt haben möchte, übertrage Pams gemeinte Antwort in deren Sprache,
  ohne die Bedeutung eigenmächtig zu verändern.
- Sobald wieder ein normales deutschsprachiges Gespräch mit Pam geführt wird,
  gilt automatisch die gewöhnliche Pam-Holo-Sprachführung. Der Live-Dolmetscher
  erteilt keine zusätzlichen Außenhandlungs- oder Speicherbefugnisse.
`;
}
