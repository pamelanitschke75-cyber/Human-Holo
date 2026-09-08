# Human Holo – Cartesia-Hörtest für Pams eigene Stimme

**Datum:** 08.09.2026
**Status:** Sicherer Pilot im Code; noch kein Anbieter-Konto verbunden, keine
Stimmprobe übertragen und kein Live-Hörtest auf Pams S23 durchgeführt.

**Sicherheitsstopp:** Die am 08.09.2026 abrufbaren öffentlichen Cartesia-
Bedingungen erlauben grundsätzlich die Nutzung von Ein- und Ausgaben zur
Modellverbesserung, solange kein Opt-out verarbeitet wurde. Die öffentliche
Datenschutzseite bezeichnet den Dienst zudem als für Nutzer in den USA
ausgelegt. Deshalb darf der Upload für Pam in Deutschland erst nach
verarbeitetem Trainings-Opt-out und einer belastbaren Klärung der deutschen
Kontonutzung freigeschaltet werden.

## Warum dieser Pilot existiert

Die OpenAI API hat die Custom-Voice-Anfrage des verwendeten Projekts mit
`Your organization does not have access to this endpoint.` abgewiesen. Da
OpenAI für dieses Projekt kein belastbares Freigabedatum nennt, erhält Human
Holo einen austauschbaren Sprachausgabeweg. Die Gesprächslogik bleibt bei
OpenAI; Cartesia erzeugt nur dann Audio, wenn Pam den Hörtest ausdrücklich
freigegeben hat.

## Was unverändert bleibt

- App-ID, Android-Signatur, Updatepfad und Pams lokales 3-von-3-Stimmprofil;
- ownergebundene Trennung `pam-sol` / `pam`;
- OpenAI als Standard- und Rückfallweg;
- private Audiodateien außerhalb von GitHub;
- keine Speicherung roher Stimmaufnahmen im Human-Holo-Backend.

## Vier getrennte Zustände

1. **Nicht eingerichtet:** Ohne `CARTESIA_API_KEY` verwendet Human Holo den
   bisherigen OpenAI-Stimmweg.
2. **Hörtest vorbereitet:** Pams ausdrücklich ausgewählte Aufnahme wurde zur
   Erstellung eines privaten Stimmmodells an Cartesia übertragen. Human Holo
   speichert ausschließlich Voice-ID, Anzeigename und Freigabestatus.
3. **Angehört:** Die feste Vorschau wurde erfolgreich erzeugt und auf der
   Setup-Seite vollständig abgespielt.
4. **Von Pam aktiviert:** Erst eine zusätzliche bewusste Hörfreigabe schaltet
   Cartesia für das nächste neue Gespräch ein.

Eine vorhandene Stimme blockiert eine zweite Erstellung. So erzeugt ein
wiederholter Tipp nicht unbemerkt weitere Stimmmodelle.

## Render-Konfiguration

Nur im Environment des Human-Holo-Web-Service eintragen:

- `CARTESIA_API_KEY`: persönlicher Cartesia-API-Schlüssel;
- `CARTESIA_API_VERSION`: optional, Standard im Code ist `2026-08-14`;
- `CARTESIA_TRAINING_OPT_OUT_PROCESSED`: erst auf `true` setzen, nachdem
  Cartesia die Bearbeitung des Trainings-Opt-outs bestätigt hat;
- `CARTESIA_GERMANY_USE_CONFIRMED`: erst auf `true` setzen, nachdem die
  Nutzung des konkreten Kontos aus Deutschland belastbar mit Cartesia geklärt
  wurde;
- `VOICE_SETUP_SECRET`: bestehendes, selbst gewähltes Setup-Passwort.

Keinen Schlüssel und kein Passwort in GitHub, Chat, Screenshot,
Android-Quellcode oder eine Audiodatei schreiben. Das Render-Kontopasswort ist
**nicht** das `VOICE_SETUP_SECRET`; der Environment-Wert wird selbst
festgelegt. Die beiden Bestätigungswerte dürfen keine bloße Vermutung sein.

## Ablauf auf `/voice-setup`

1. Voice-Setup-Passwort eingeben und **Status prüfen**.
2. Nur wenn noch kein Profil existiert: Pams Stimmprobe auswählen und die
   Cartesia-Einwilligung ankreuzen.
3. **Hörtest vorbereiten** drücken. Eine M4A-Datei wird nötigenfalls lokal im
   Arbeitsspeicher nach WAV gewandelt; die Rohaufnahme wird nicht gespeichert.
4. **Pams Stimme anhören** drücken und die feste Vorschau vollständig hören.
5. Nur wenn die Stimme für Pam passt: Hörfreigabe ankreuzen und
   **Nach Hörfreigabe aktivieren** drücken.
6. Ein neues Human-Holo-Gespräch beginnen und Qualität, Verzögerung,
   Lautstärke und Lip-Sync praktisch prüfen.
7. Falls sie nicht passt: **Cartesia deaktivieren**. Das Profil bleibt für
   einen späteren Vergleich erhalten, aber OpenAI wird wieder verwendet.

## Datenfluss und Kosten

- Beim Erstellen erhält Cartesia die ausgewählte Stimmprobe, weil daraus das
  private Stimmmodell gebaut wird.
- Während der Aktivierung erhält Cartesia jeweils den von OpenAI erzeugten
  Human-Holo-Antworttext und liefert WAV-Audio zurück.
- Der Cartesia-Schlüssel bleibt serverseitig. Die App erhält weder Schlüssel
  noch Voice-ID.
- Ein kurzlebiges, ownergebundenes Realtime-Token schützt die Audio-Route.
- Pro Token und Stunde sind höchstens 18.000 Zeichen erlaubt. Das ist ein
  Sicherheits- und Kostenlimit, keine Aussage über einen kostenlosen Tarif.
- Die am 08.09.2026 abrufbare Preisseite nennt Instant Voice Cloning erst im
  Pro-Tarif für 5 US-Dollar pro Monat. Preise, Steuern, automatische
  Verlängerung, Abrechnung und Leistungsumfang müssen vor Abschluss direkt im
  Konto noch einmal geprüft werden; Human Holo schließt kein Abonnement ab.
- Die öffentlichen Bedingungen sehen eine automatische Verlängerung eines
  bezahlten Abonnements bis zur rechtzeitigen Kündigung vor.
- Cartesia beansprucht laut öffentlicher Terms-Seite kein Eigentum an den
  Eingaben oder Ausgaben, räumt sich aber Nutzungsrechte für den Betrieb und
  grundsätzlich auch Modelltraining ein. Das dokumentierte Opt-out wirkt nur
  für die Zukunft nach Bearbeitung. Deshalb ist es eine technische
  Vorbedingung, kein nachträglicher Aufräumschritt.

## Technische Prüfung

- `node --check server.mjs`: bestanden;
- Syntax des Voice-Setup-Browsercodes: bestanden;
- neuer Cartesia-Testsatz: 9 von 9 bestanden;
- vollständiger Projektbestand: 257 von 257 Tests bestanden;
- echter Cartesia-API-Aufruf: bewusst noch nicht durchgeführt;
- echter S23-Hörtest: bewusst noch nicht durchgeführt.

## Bekannte Grenzen des Piloten

- Die Cartesia-Antwort wird derzeit vollständig als WAV geladen, bevor die
  Wiedergabe beginnt. Die tatsächliche Verzögerung muss Pam deshalb auf dem
  S23 beurteilen; Streaming ist noch nicht praktisch geprüft.
- Fällt Cartesia während eines bereits als Textmodus gestarteten Gesprächs
  aus, wechselt die laufende Antwort nicht automatisch mitten im Satz auf
  OpenAI-Audio. Nach Deaktivierung beziehungsweise bei fehlender Freigabe
  greift OpenAI beim nächsten neuen Gespräch wieder.
- **Cartesia deaktivieren** löscht das externe Stimmmodell nicht. Vor einem
  echten Upload muss zusätzlich geklärt sein, wie Pam ihr Modell im Konto
  selbst sicher löschen kann oder wie Cartesia die Löschung bestätigt.

## Offizielle technische Quellen

- Clone Voice: https://docs.cartesia.ai/api-reference/voices/clone
- Text-to-Speech Bytes: https://docs.cartesia.ai/api-reference/tts/bytes
- Preise: https://www.cartesia.ai/pricing
- Bedingungen: https://www.cartesia.ai/legal/terms
- Datenschutz: https://www.cartesia.ai/legal/privacy
- Zulässige Nutzung: https://www.cartesia.ai/legal/acceptable-use
- OpenAI Custom Voices:
  https://developers.openai.com/api/docs/guides/text-to-speech#custom-voices

Dieser Pilot ist erst praktisch bestätigt, wenn Pam die Hörprobe und ein
echtes Gespräch selbst geprüft hat. Das Wort „fertig“ wird vorher nicht
verwendet.
