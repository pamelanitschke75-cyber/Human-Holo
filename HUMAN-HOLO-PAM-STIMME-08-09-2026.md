# HUMAN HOLO – Pams eigene Stimme

**Datum:** 08.09.2026  
**Status:** OpenAI-Weg technisch vorbereitet, aber für die verwendete
Organisation nicht freigegeben. Cartesia-Hörtest als abschaltbare Alternative
im Code geprüft; echter Hörtest und Pams Freigabe stehen noch aus.

## Ziel

Human Holo soll in Pams persönlicher Instanz nicht dauerhaft mit einer
allgemeinen Standardstimme antworten, sondern mit der ausdrücklich
freigegebenen synthetischen Stimme von Pam.

## Bereits vorhandene Aufnahmen

Die frühere Arbeit wurde nicht verworfen. Für Pam sind zwei getrennte
Aufnahmen vorhanden:

- Einwilligungsaufnahme: `Stimme Pam-Sol.m4a`;
- eigentliche Stimmprobe: `Pam's Stimme vom 19.08.2026.m4a`.

Die Audiodateien sind private Ausgangsdaten. Sie werden weder in dieses
öffentliche Repository eingecheckt noch vom Human-Holo-Backend als rohe
Audiodateien gespeichert.

Das bereits auf dem Android-Gerät eingerichtete lokale 3-von-3-Stimmprofil
bleibt unverändert erhalten. Es dient der Erkennung und Freigabe von Pams
Stimme. Die neue Custom Voice dient dagegen der Sprachausgabe von Human Holo.
Beide Aufgaben bleiben technisch getrennt.

## Umsetzung

- Die geschützte Seite `/voice-setup` verwendet für Pams OpenAI-Einwilligung
  die Sprachkennung `de` und zeigt den vorgeschriebenen deutschen Satz an.
- Die vorhandene Einwilligungsaufnahme und die vorhandene Stimmprobe können
  dort einmalig an OpenAI übertragen werden.
- Nach erfolgreicher Voice-Erstellung speichert Human Holo ausschließlich die
  zurückgegebene Voice-ID in der Datenbank.
- Ab dem nächsten Realtime-Gespräch wird diese Voice-ID automatisch als
  `{ "id": "voice_…" }` an die OpenAI Realtime API übergeben.
- Ein manuelles Kopieren der Voice-ID in die Serverkonfiguration ist nicht
  mehr nötig.
- Ein serverseitig gesetztes `HUMAN_HOLO_PAM_VOICE_ID` bleibt als sicherer
  administrativer Vorrang möglich; die ältere Bezeichnung
  `SOL_HOLO_VOICE_ID` wird kompatibel weiter erkannt.
- Solange noch keine gültige Custom-Voice-ID vorhanden ist, bleibt Coral als
  sichere Ersatzstimme aktiv.

## Feste Identitätsbindung

Pams Custom Voice wird ausschließlich verwendet, wenn beide Zuordnungen
gleichzeitig stimmen:

- Owner-ID: `pam-sol`;
- Sprecher-ID: `pam`.

Andere Human-Holo-Instanzen erhalten Pams Stimme nicht. Die Trennung wurde
automatisch getestet.

## Einmaliger Abschluss

Die Voice-Erstellung kann nur durchgeführt werden, wenn das verwendete
OpenAI-API-Projekt für Custom Voices berechtigt ist. OpenAI verlangt eine
separate Einwilligungsaufnahme und eine Stimmprobe von jeweils höchstens
30 Sekunden. Die vorhandenen Pam-Dateien liegen innerhalb dieser Grenze.

Der praktische Versuch am 08.09.2026 wurde von der OpenAI API mit
`Your organization does not have access to this endpoint.` abgewiesen. Das
ist kein Fehler von Pams Einwilligungsaufnahme und keine fehlende Render-
Passworteingabe. Ein öffentlich zugesagtes Freigabedatum für dieses konkrete
API-Projekt liegt nicht vor; deshalb wird hier kein Termin behauptet.

Offizielle Dokumentation:
https://developers.openai.com/api/docs/guides/text-to-speech#custom-voices

## Abschaltbare Alternative: Cartesia

- Das bestehende OpenAI-Verhalten bleibt als Rückfallweg erhalten.
- Cartesia wird nur verwendet, wenn ein serverseitiger `CARTESIA_API_KEY`, ein
  verarbeitetes Trainings-Opt-out und die geklärte deutsche Kontonutzung
  bestätigt sind, ein privates Stimmmodell erstellt wurde, Pam die Hörprobe
  vollständig abspielen ließ und die konkrete Stimme ausdrücklich aktiviert.
- Erstellen, Anhören und Aktivieren sind getrennte Schritte. Das Erstellen
  allein aktiviert nichts.
- Der Schlüssel und die Voice-ID verlassen das Backend nicht. Human Holo
  speichert keine rohe Stimmaufnahme; während der Einrichtung wird sie jedoch
  ausdrücklich an Cartesia übertragen. Während der Aktivierung werden die
  jeweiligen Human-Holo-Antworttexte dort in Sprache umgewandelt.
- M4A wird auf dem Gerät nur im Arbeitsspeicher in ein unterstütztes WAV
  umgewandelt. Der Server akzeptiert für diesen Weg nur die von Cartesia
  dokumentierten Dateiformate.
- Ein Stundenlimit pro kurzlebiger Realtime-Sitzung begrenzt unbeabsichtigte
  oder missbräuchliche kostenpflichtige Spracherzeugung.
- Eine Deaktivierung setzt nur die Freigabe zurück; danach greift ab dem
  nächsten Gespräch wieder der OpenAI-Stimmweg.

Offizielle Dokumentation:

- https://docs.cartesia.ai/api-reference/voices/clone
- https://docs.cartesia.ai/api-reference/tts/bytes
- https://www.cartesia.ai/legal/terms
- https://www.cartesia.ai/legal/privacy

## Prüfung

- Syntaxprüfung des Servers und des neuen Voice-Moduls: erfolgreich;
- neue Tests für Cartesia-Voice-ID, privaten Clone, Pflichtsprache `de`,
  Owner-Bindung, Hörfreigabe, Textmodus, Kostenlimit und OpenAI-Fallback:
  erfolgreich;
- vollständiger Projektbestand: **257 von 257 Tests bestanden**.

**Ergebnis:** Beide technischen Wege sind nachvollziehbar vorbereitet. Es
wurde noch keine Aufnahme an Cartesia übertragen, keine Cartesia-Stimme
erstellt und nichts live aktiviert. Erst Pams eigener Hörtest auf dem S23
entscheidet, ob dieser Stand für sie passt. 💜♾️✨️🌎
