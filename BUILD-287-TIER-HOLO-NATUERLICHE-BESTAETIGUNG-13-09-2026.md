# Build 287 – Natürliche Bestätigung für alle Tier-Holos

Stand: 13.09.2026

## Anlass

Human Holo konnte eine konkrete Tierbeobachtung vorschlagen, aber eine
anschließende natürliche Zustimmung wie „Ja bitte“ führte noch nicht zur
tatsächlichen Speicherung. Die Bestätigung durfte außerdem nicht an einen
einzigen Befehlssatz oder einen fest codierten Tiernamen gebunden bleiben.

## Umgesetzte Erweiterung

- Eine offene Speicher-Rückfrage wird jetzt an Owner, Sprecherin und das
  aktuelle Gespräch gebunden.
- Natürliche Antworten wie „Ja bitte“, „okay“, „alles klar“, „gerne“,
  „mach das ruhig“ sowie eindeutige Zeichen wie 👍 und ✅ bestätigen denselben
  noch offenen Vorschlag.
- „Nein“, „doch nicht“, 👎 oder ❌ brechen die offene Speicherung ab.
- Die Auswertung gilt für alle bereits vorhandenen und künftig angelegten
  Tier-Holos. Tiernamen und Profile werden aus dem aktuellen ownergebundenen
  Tier-Holo-Bestand aufgelöst und nicht auf Salt, Peps oder Tina begrenzt.
- Die bestätigte Beobachtung wird sofort im lokalen Tier-Holo gespeichert.
  Die bestehende ownergebundene Vollzeit-Synchronisierung wird anschließend
  ausgeführt; wenn sie vorübergehend nicht erreichbar ist, bleibt der Eintrag
  lokal erhalten und zur späteren Synchronisierung vorgemerkt.
- Human Holo meldet eine Speicherung erst nach einem technischen
  Speicherergebnis und führt dieselbe Bestätigung nicht doppelt aus.
- Textchat und transkribierte Realtime-Sprache verwenden denselben Ablauf.

## Kontext statt Zauberbefehl

Eine kurze Antwort wie „ok“ oder 👍 wird ausschließlich dann als Freigabe
verstanden, wenn direkt davor eine noch gültige Tier-Holo-Speicherfrage mit
einem konkreten Vorschlag offen ist. Außerhalb dieses Kontexts löst sie keine
Speicherung aus. Die offene Rückfrage verfällt nach 30 Minuten oder bei einem
Wechsel von Owner, Sprecherin oder Gespräch.

## Unveränderte Schutzgrenzen

- BESTEHENDES BEHALTEN · NUR ERWEITERN
- keine Vermischung zwischen Human-Holo-Ownern
- keine erfundenen Beobachtungen, Orte oder Zeiten
- keine Speicherung des Rohfotos durch diesen Ablauf
- keine Erfolgsbehauptung ohne bestätigtes lokales Speicherergebnis
- bestehende Tierwohl-, Kinderschutz- und Tierhandelsgrenzen bleiben bestehen

## Automatisierte Nachweise

Die Tests prüfen unter anderem:

- die von Pam gewünschten natürlichen Bestätigungen einschließlich 👍
- sichere Abbruchantworten und unverwandte Antworten
- die Rückfrage aus dem Salt-Praxistest
- ein später neu angelegtes Tier-Holo mit einem zuvor unbekannten Tiernamen
- lokale, ownergebundene und additiv synchronisierte Speicherung
- unveränderte Verdrahtung in App, Backend und Android-Build

Gesamter automatischer Teststand: 457 von 457 Tests erfolgreich. Der
automatische Test ersetzt nicht Pams anschließenden Praxistest auf dem Samsung
Galaxy S23 mit dem neu gebauten App-Stand.

OWNER-GEBUNDEN: Pamela Nitschke

ENTSCHEIDUNG & PROJEKTINHABERIN: PAMELA CHRISTINA NITSCHKE
