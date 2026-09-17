# Pam’s Holo · Einkaufsliste korrigieren und Kalender im Holo-Glass-Design

**Stand:** 17.09.2026

**Entscheidung und Projektinhaberin:** Pamela Christina Nitschke

**Aktive technische Geltung:** ausschließlich Pams private, ownergebundene
Pam-Holo-Instanz (`pam-sol`)

**Offizielles Human Holo:** weiterhin vollständig im anwaltlichen Hold

## Verbindliche Entscheidung

Pam und Pam Holo dürfen einen einzelnen falsch eingetragenen Artikel auf Pams
Einkaufsliste ändern oder löschen. Die Änderung wird im bereits bestehenden,
ownergebundenen lokalen Einkaufslistenspeicher vorgenommen. Andere Notizen,
Erinnerungen, Einstellungen, Dienste und bestehende Funktionen bleiben
unverändert.

Pam kann jeden Artikel direkt in der sichtbaren Einkaufsliste über die
Schaltflächen **„Ändern“** und **„Löschen“** bearbeiten. Pam Holo kann dieselben
beiden Aktionen nach einem eindeutigen gesprochenen, geschriebenen oder sicher
erkannten gebärdensprachlichen Auftrag ausführen.

## Schutz vor falschen Änderungen

- Geändert oder gelöscht wird immer nur ein eindeutig bestimmter einzelner
  Artikel.
- Wird kein passender Artikel gefunden oder steht derselbe Artikel mehrfach
  auf der Liste, bleibt die Einkaufsliste unverändert und Pam erhält eine
  wahrheitsgemäße Rückmeldung.
- Eine Änderung auf einen bereits vorhandenen identischen Artikel wird nicht
  als zweite Kopie gespeichert.
- Wird der letzte Artikel einzeln gelöscht, wird nur die dadurch leere
  Einkaufsliste entfernt. Alle anderen persönlichen Notizen bleiben erhalten.
- Ein Sprach-, Text- oder Gebärdenauftrag darf niemals versehentlich die
  gesamte Einkaufsliste löschen. Das sichtbare Leeren der vollständigen Liste
  bleibt eine gesonderte, ausdrücklich bestätigte Bedienhandlung.
- Ohne feste ownergebundene Holo-ID wird nichts geändert oder gelöscht.

## Sichtbare Gestaltung

Die bisherige Überschrift
**„Pams Wichtiges in Pam’s Holo“** wird ersetzt durch:

**„Alles Wichtige auf einen Blick“**

Darunter steht klar und knapp:

**„Kalender, Einkaufsliste und Notizen.“**

Der untere leere Kalenderkasten erhält das Holo-Glass-Design mit transparentem
Lila-Blau-Verlauf, heller Glaskante, Tiefenlicht, Holo-Leuchten und
Hintergrundunschärfe. Inhalt und Funktion des Kalenders bleiben unverändert.

## Technische Absicherung

- Die lokalen Realtime-Werkzeuge
  `update_shopping_list_item` und `delete_shopping_list_item` sind für Pams
  Holo ergänzt.
- Der lokale Text- und Sprachweg erkennt eindeutige natürliche Formulierungen,
  zum Beispiel „Ändere Milch in Hafermilch“ oder „Lösche Milch von der
  Einkaufsliste“.
- Direkte Bedienung und Holo-Auftrag verwenden denselben ownergebundenen
  Speicherweg.
- Automatisierte Regressionstests decken direkte Bedienung, Text und Sprache,
  Realtime-Werkzeuge, eindeutige Treffer, Mehrfachtreffer, fehlende Treffer,
  Dubletten, das Löschen des letzten Artikels sowie den Erhalt anderer Notizen
  ab.
- Der vollständige reguläre Testlauf umfasst **570 bestandene Tests bei 0
  Fehlern**. Das Repository-Sicherheitsgate meldet keine bekannten
  Geheimnismuster oder privaten Schlüsseldateien; der npm-Laufzeitaudit meldet
  **0 Schwachstellen**.

## Unveränderte Grenzen

Diese Ergänzung entfernt, ersetzt oder öffnet keine bestehende Funktion.
Fingerprintschutz, Owner-Bindung, Erinnerungen, Vollzeitgedächtnis,
Sicherungen, Dienste, Kinderschutz, Netzwerkgrenzen und das übrige
Pam-Holo-Design bleiben erhalten. Es ist keine Play-Store- oder
Produktionsfreigabe damit verbunden.
