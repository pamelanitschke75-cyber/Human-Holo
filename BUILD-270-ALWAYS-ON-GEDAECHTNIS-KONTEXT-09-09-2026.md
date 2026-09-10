# Build 270 – Always-on-Gedächtnis und Gesprächskontext

Stand: 09.09.2026

## Anlass

Der vollständige ownergebundene Dialog wurde bereits dauerhaft gespeichert,
aber einzelne Abrufwege verbanden kurze Folgefragen und benachbarte
Gesprächsteile nicht zuverlässig. Außerdem waren frühere Holo-Antworten beim
Abruf vollständig ausgeschlossen. Dadurch konnte Human Holo zwar persönliche
Fakten schützen, aber nicht zuverlässig wiedergeben, was es selbst zuvor
gesagt oder empfohlen hatte.

## Umgesetzte Korrektur

- Nutzer- und Holo-Nachrichten bleiben bei Text und transkribierter Sprache
  gemeinsam im ownergebundenen Always-on-Vollzeitverlauf gespeichert.
- Kurze Folgefragen wie „Und wo?“ oder „Und wann?“ übernehmen nur das
  unmittelbar vorherige persönliche Erinnerungsthema.
- Ein dazwischenliegendes neues Thema hebt diesen Bezug auf.
- Treffer werden nach der Zahl passender Suchbegriffe gewichtet.
- Direkt benachbarte Gesprächsteile werden mitgeladen, damit zusammengehörige
  Angaben nicht an einer Nachrichtengrenze auseinanderfallen.
- Relative Zeitangaben wie „gestern“ und „vorgestern“ können den passenden
  ownergebundenen Tagesausschnitt ergänzen.
- Frühere Holo-Antworten sind für Fragen nach einer früheren Empfehlung oder
  Aussage abrufbar und ausdrücklich als Gesprächsverlauf gekennzeichnet.

## Verbindliche Schutzgrenze

Eine frühere Holo-Antwort belegt nur, was Human Holo damals gesagt hat. Sie ist
kein bestätigter persönlicher Fakt der Nutzerin. Für persönliche Fakten gelten
weiterhin nur Nutzerangaben und bestätigte Erinnerungen; die jüngste
Nutzerkorrektur hat Vorrang.

Alle Datenbankabfragen bleiben an die feste Owner-ID gebunden. Zwischen den
persönlichen Human-Holo-Instanzen wird kein Verlauf geteilt.

## Automatisierte Nachweise

Abgedeckt sind insbesondere:

- Themenbezug von Datum zu anschließender Ortsfrage
- Abbruch des Bezugs nach einem Themenwechsel
- Wiederfinden unterschiedlicher Begriffe für einen Saugroboter
- Wiederfinden einer früheren Essensempfehlung als Holo-Verlauf
- Trennung von Holo-Verlauf und persönlichen Fakten
- Always-on-Speicherung beider Rollen in Text und Sprache

Der automatische Teststand ist kein Ersatz für den anschließenden praktischen
Test auf dem Samsung Galaxy S23.
