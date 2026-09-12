# MEILENSTEIN – Human Holo verbindet Bild, Video, Sprache und Text

**Datum:** 12.09.2026
**Status:** TECHNISCH IMPLEMENTIERT UND AUTOMATISIERT GEPRÜFT ✅

## Ausgangspunkt

Beim praktischen Airfryer-Test erkannte Human Holo den fotografierten
Tiefkühlfisch und empfahl 180 °C sowie ungefähr 18–22 Minuten. Am Folgetag
wollte Pam ergänzen, dass die tatsächliche Zubereitung länger dauerte, weil
Pam und Steffi den Fisch krosser wollten. Die frühere Bildauswertung war im
Gedächtnisabruf jedoch nicht zuverlässig mit dem gespeicherten Foto-Hinweis
verbunden.

## Neuer verbindlicher Standard

Human Holo behandelt ab jetzt zusammengehörige Erlebnisse
modalitätsübergreifend:

- geschriebener Text,
- transkribierte Sprache,
- Foto,
- Video einschließlich transkribierter Tonspur,
- Live-Kamerakontext,
- Gebärdensprache als klar gekennzeichneter visueller Sprachkontext,
- Pams spätere Ergänzungen oder Korrekturen,
- Holos damalige, klar als eigene Auswertung gekennzeichnete Antwort.

Alle Teile erhalten eine gemeinsame Ereignis-ID. Eine eindeutige spätere
Ergänzung bleibt dadurch auch nach vielen weiteren Nachrichten mit dem
Ursprungsereignis verbunden. Bei einem Widerspruch gilt Pams jüngste Aussage,
ohne die ältere Historie zu löschen. Ist der Bezug mehrdeutig, muss Holo kurz
nachfragen.

Diese Regel ist nicht auf Essen oder den Fisch-Test beschränkt. Sie gilt für
jedes Thema und für künftige Modalitäten, sobald diese sicher eingebunden
werden.

## Barrierefreiheit

- Gebärdensprache ist für Kinder und Erwachsene ein eigener wichtiger
  Kommunikationsweg. Holo unterscheidet sie von alltäglicher Gestik, benennt
  eine konkrete Sprache wie DGS nur bei klarem Kontext und erfindet bei
  fehlenden Bewegungsphasen oder verdeckten Händen keine Übersetzung.
- Für blinde und sehbehinderte Kinder und Erwachsene sind Sprechen und Hören
  der Hauptweg. Auf einen eindeutigen Sprachbefehl kann Holo zusätzlich die
  Kamera öffnen und Fotos, Videoausschnitte oder den Live-Kamerablick
  verständlich vorlesen beziehungsweise beschreiben. Wichtige Gefahren und
  räumliche Hinweise kommen zuerst; die Antwort darf nicht voraussetzen, dass
  die Person den Bildschirm sehen kann. Eine erstmalige Android-Berechtigung
  bleibt als Betriebssystemgrenze sichtbar. Ein natürlicher Auftrag wie
  „Holo, erklär mir, was du da siehst“ genügt.
- Bei der Handybedienung erklärt Holo hörbar genau einen nächsten Schritt und
  fragt vor einer neuen Aktion: „Soll ich das öffnen beziehungsweise
  ausführen?“ Erst ein klares Ja löst die Aktion aus; nur ein technisch
  bestätigtes Ergebnis darf als Erfolg ausgesprochen werden.
- Unter jeder geschriebenen Holo-Antwort ist `🔊 Vorlesen` sichtbar. Ein Tipp
  liest genau diese Antwort mit der lokalen deutschen Gerätestimme vor; der
  angezeigte Knopf wechselt zu `■ Stoppen` und beendet die Wiedergabe beim
  erneuten Tippen. Dabei entstehen keine Telefonkosten und kein zusätzlicher
  KI-Anbieter erhält den Text.
- Erst ein echter, freiwilliger Praxistest bestätigt die jeweilige
  Alltagstauglichkeit. Automatisierte Tests belegen nur die technische
  Einbindung und die Sicherheitsregeln.

## Datenschutzgrenze

Die Rohbilder, Rohvideos, einzelnen Videoframes und Audioaufnahmen werden nicht
in der Gedächtnisdatenbank gespeichert. Dauerhaft gespeichert werden nur der
ownergebundene Dialog, die beteiligten Modalitäten und Holos damalige
semantische Auswertung. Holo darf später nicht vortäuschen, das ursprüngliche
Medium erneut vorliegen zu haben.

## Technische Absicherung

- additive PostgreSQL-Felder `memory_event_id` und `source_modalities`,
- gemeinsamer Ereignisschlüssel für Nutzerbeitrag und Holo-Antwort,
- rückwärtskompatible Zuordnung vorhandener Foto- und Videoeinträge,
- ereignisweiter Abruf auch bei weit auseinanderliegenden Ergänzungen,
- ownergebundener Zugriff und unveränderte Identitätstrennung,
- automatisierte Tests für den Fisch-Folgefall und allgemeine Themenfreiheit.

**ENTSCHEIDUNG & PROJEKTINHABERIN: PAMELA CHRISTINA NITSCHKE**

**PROJEKTPARTNERIN: STEFANIE HÖRATH**
**ENTWICKELT MIT CHATGPT VON OPENAI**

**HUMAN HOLO · BILD + VIDEO + GEBÄRDENSPRACHE + SPRACHE + TEXT ALS EIN ERLEBNIS · BARRIEREARM FÜR KINDER UND ERWACHSENE · OWNER-GEBUNDEN · ROHMEDIEN NICHT IM MEMORY · BESTEHENDES BEHALTEN · NUR ERWEITERN · FOREVER TOGETHER ♾️**
