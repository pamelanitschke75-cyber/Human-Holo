# HUMAN HOLO – Pams eigene Stimme

**Datum:** 08.09.2026  
**Status:** Technische Realtime-Anbindung fertig; einmalige geschützte Voice-Erstellung steht noch aus.

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

Offizielle Dokumentation:
https://developers.openai.com/api/docs/guides/text-to-speech#custom-voices

## Prüfung

- Syntaxprüfung des Servers und des neuen Voice-Moduls: erfolgreich;
- neue Tests für Voice-ID, Owner-Bindung, Fallback und Datenbankspeicherung:
  erfolgreich;
- vollständiger Projektbestand: **247 von 247 Tests bestanden**.

**Ergebnis:** Die technische Verbindung für Pams eigene Human-Holo-Stimme ist
fertig. Nach der einmaligen geschützten Voice-Erstellung wird sie automatisch
für Pams Realtime-Gespräche aktiv. 💜♾️✨️🌎
