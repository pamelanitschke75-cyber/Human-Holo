# Human Holo · automatische Sprachen ohne feste Liste

**Datum:** 13.09.2026

**Entscheidung und Projektinhaberin:** Pamela Christina Nitschke

**Technische Umsetzung:** ChatGPT / OpenAI als Werkzeug

**Leitsatz:** BESTEHENDES BEHALTEN · NUR ERWEITERN

**Status:** im Server umgesetzt und automatisiert geprüft; Android-Pflichtlauf
und Pams praktischer S23-Sprachtest stehen noch aus

## Pams verbindliche Entscheidung

**Alle Sprachen heißt alle Sprachen.** Human Holo führt deshalb keine feste
Liste aus zehn, zwanzig oder einer anderen willkürlichen Zahl von Sprachen.
Der aktive Sprachweg verwendet jede Sprache, die die jeweils eingesetzte
OpenAI-Sprachfunktion zuverlässig verarbeiten kann.

Technisch nicht unterstützte oder im konkreten Audiobeitrag nicht sicher
erkennbare Sprache wird nicht als erfolgreich erkannt behauptet. Nur wenn die
Unsicherheit die Bedeutung oder gewünschte Antwort wirklich verändert, fragt
Holo kurz nach.

## Verbindliches Verhalten

- Die Sprache jedes gesprochenen Beitrags wird automatisch erkannt; ein
  vorheriger Sprachbefehl oder eine manuelle Auswahl ist nicht nötig.
- Holo antwortet grundsätzlich in derselben Sprache wie der aktuelle Beitrag.
- Bei einem Sprachwechsel zwischen zwei Beiträgen wechselt Holo unmittelbar
  mit.
- Mischsprachen und Code-Switching werden als ein zusammengehöriger Beitrag
  verarbeitet. Wichtige Originalbegriffe bleiben erhalten.
- Übersetzungen erfolgen sinngenau, sobald Pam sie verlangt. Ohne Auftrag wird
  nicht ungefragt übersetzt.
- Deutsch bleibt Sprache der Bedienoberfläche und Rückfall, solange noch kein
  verständlicher sprachlicher Beitrag vorliegt. Eine erkannte andere Sprache
  wird niemals durch Deutsch überschrieben.
- Identität, Herkunft und Berechtigungen werden niemals aus Sprache, Dialekt,
  Akzent oder Stimme abgeleitet.
- Gebärdensprachen bleiben ein eigener, bewusst gestarteter Kamerapfad mit
  einer konkret gewählten Gebärdensprache. Sie werden nicht als angeblich
  universelle gesprochene Sprache behandelt.

## Technische Änderung

Die frühere Realtime-Vorgabe `language: "de"` wurde entfernt. Die
Transkriptionskonfiguration enthält nur noch das OpenAI-Transkriptionsmodell
und setzt weder `language` noch `languages`. Dadurch wird die nächste Äußerung
nicht mehr vorab in Richtung Deutsch gelenkt.

Realtime-Sprache und normale Modellantworten erhalten denselben zentralen
Sprachvertrag aus `modules/automatic-language.mjs`. Auch aktuelle Wetter- und
Websuchergebnisse werden in der automatisch erkannten Fragesprache formuliert,
statt pauschal auf Deutsch zurückzufallen. Bestehende Wege für `Hey Pam`,
Owner-Bindung, Vollzeitgedächtnis, Kamera, Gebärdensprache, Gesundheit und
Notfälle bleiben erhalten.

## Automatische Prüfung

Die neuen Tests sichern insbesondere:

1. keine feste deutsche Transkriptionssprache;
2. keine feste Zehnerliste oder Sprach-Whitelist;
3. Antwort in der Sprache des aktuellen Beitrags;
4. Sprachwechsel und Mischsprache;
5. Übersetzung nur auf Wunsch;
6. Deutsch ausschließlich als Rückfall;
7. getrennten Gebärdensprach-Kamerapfad;
8. keine Identitätsableitung aus Sprache oder Akzent.

Am 13.09.2026 bestanden nach vollständiger Abhängigkeitsinstallation alle
**448 von 448** vorhandenen Node-Tests. Darin enthalten sind sechs gezielte
Tests für automatische Sprache und sprachgleiche Live-Suchergebnisse.

## Noch praktisch zu bestätigen

Der grüne Quelltest beweist Konfiguration, Regeln und Regressionsschutz. Er
beweist noch nicht die Erkennungsqualität jedes Mikrofons, Dialekts oder jeder
einzelnen Sprache in der wirklichen Umgebung. Nach einem grünen Android-Build
folgt deshalb Pams S23-Praxistest mit mindestens:

- Deutsch und einer deutlich anderen Sprache;
- Wechsel der Sprache ohne Vorankündigung;
- einem gemischtsprachigen Satz;
- einem ausdrücklichen Übersetzungsauftrag;
- einer absichtlich undeutlichen Äußerung, bei der Holo nur bei
  bedeutungsrelevanter Unsicherheit nachfragt.

Erst dieser praktische Test darf als praktische Bestätigung bezeichnet
werden.

## Technische Referenz

- [OpenAI · Realtime transcription](https://developers.openai.com/api/docs/guides/realtime-transcription)
- [OpenAI · Realtime translation](https://developers.openai.com/api/docs/guides/realtime-translation)

---

**OWNER-GEBUNDEN: Pamela Nitschke**

**ENTSCHEIDUNG & PROJEKTINHABERIN: PAMELA CHRISTINA NITSCHKE**
