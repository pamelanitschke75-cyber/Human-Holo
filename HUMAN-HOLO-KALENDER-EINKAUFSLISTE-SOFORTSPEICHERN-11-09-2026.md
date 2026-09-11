# Human Holo – Kalender und Einkaufsliste sofort speichern

**Stand:** 11.09.2026  
**Entscheidung & Projektinhaberin:** Pamela Christina Nitschke  
**Umsetzung im Human-Holo-Projekt:** gemeinsam mit ChatGPT von OpenAI

## Verbindliche Bedienregel

- „Morgen 13 Uhr Tattoo-Termin“ ist ein Kalenderauftrag. Nach der einmaligen
  Android-Kalenderfreigabe wird der Termin sofort gespeichert.
- Die Kalender-App wird nicht geöffnet. Pam muss nicht noch einmal auf
  „Speichern“ tippen.
- „Schwip Schwap auf die Einkaufsliste bitte“ wird sofort und ausschließlich
  unter **Wichtiges → Einkaufsliste** gespeichert.
- Ein vertipptes Schlusswort wie „bittec“ darf diesen lokalen Sofortspeicher
  nicht mehr umgehen.
- Einkaufsliste und Notizen werden nicht mit Samsung Notes vermischt. Samsung
  Notes bleibt ausschließlich eine optionale, manuell gewählte Übergabe.

## Technische Umsetzung

Die Android-App fordert `READ_CALENDAR` und `WRITE_CALENDAR` einmal sichtbar
an. Nach Freigabe schreibt der native Human-Holo-Adapter den Termin direkt über
den Android Calendar Provider in einen sichtbaren, beschreibbaren Hauptkalender.
Eine Ereignis-ID ist die notwendige Erfolgsbestätigung. Wiederholungen desselben
Auftrags innerhalb eines kurzen Zeitfensters werden nicht doppelt angelegt.

Der bisherige `ACTION_INSERT`-Entwurfsweg wurde entfernt. Damit kann Human Holo
kein vorausgefülltes Kalenderfenster mehr als gespeicherten Termin behandeln.

Die Einkaufslistenerkennung bleibt lokal, ownergebunden und toleriert ein
versehentlich angehängtes „bitte…“. Bei einem eindeutigen Listenauftrag wird
kein allgemeiner Chatweg und kein Samsung-Notes-Weg mehr verwendet.

## Sicherheitsgrenzen

- Keine Kalenderaktion ohne ausdrücklichen Auftrag.
- Keine Umgehung der Android-Freigabe.
- Kein Erfolgstext ohne bestätigten Speichervorgang.
- Berechtigung jederzeit über Android widerrufbar.
- Bestehende Human-Holo-Funktionen bleiben erhalten und werden nur erweitert
  beziehungsweise im fehlerhaften Entwurfsweg gezielt berichtigt.

