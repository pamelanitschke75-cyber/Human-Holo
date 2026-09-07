# Human Holo – neue Startseite und einheitliche Glasoptik

**Datum:** 07.09.2026  
**Ausgangsbasis:** veröffentlichter Human-Holo-Build #225  
**Zwischenstände:** Builds #226 und #227, auf Pams Samsung Galaxy S23 visuell geprüft  
**Ergebnis:** bereinigter, originalsignierter Human-Holo-Build #228  
**Referenz:** von Pam freigegebener Human-Holo-Startbildschirm und ihre S23-Screenshots

## Startseite mit acht Bereichen

Die bisherige Startseite mit den vier Schnellbereichen **Erinnerungen**, **Ziele**,
**Heute** und **Verbindungen** wurde durch das neue Human-Holo-Design ersetzt.
Der Einstieg enthält acht sichtbare und bedienbare Bereiche:

1. Menschen
2. Familie & Freunde
3. Tiere
4. Umwelt
5. Gesundheit
6. Bildung
7. Zusammen
8. Geschäftliches

Jeder Bereich öffnet den bestehenden Chat mit einem passenden, vorausgefüllten
Auftrag. Kamera/Galerie, Texteingabe, Mikrofon, Profil, Einstellungen und die
feste Navigation bleiben echte App-Funktionen.

## Bereinigte Startseite

- Human-Holo-Kopfbereich mit **Forever Together**
- Begrüßung **„Hallo Pam♡“** oberhalb des Motivs
- Startseiten- und Chat-Einhorn entfernt
- **„Schön dich zu sehen. Womit wollen wir starten?“** vollständig entfernt
- Fußspruch, Pfoten und zusätzliche Weltkugel entfernt
- bestehendes Human-Holo-Motiv mit Mensch, Holo, Erde und Unendlichkeit bleibt
- Motiv kontrolliert herausgezoomt, damit deutlich mehr vom quadratischen
  Originalbild sichtbar ist, ohne den Bildschirm zu verlängern
- verbleibende Bedienelemente weiter nach unten gesetzt
- feste Navigation: Start, Chat, Erinnerungen, Dienste und Profil

## Einheitlicher Human-Holo-Glasstil in Build #228

Eine bewusst zuletzt geladene Designschicht verhindert, dass ältere dunkle
Oberflächen den neuen Stil wieder überschreiben. Sie gilt für:

- Chat mit Antwortsfeld, Nachrichten, Schreibfeld, Kamera, Mikrofon und Senden
- Erinnerungen einschließlich aller Karten und des unteren Aktionsbuttons
- Dienste einschließlich sämtlicher Dienstkarten
- Profil und Einstellungen
- verschachtelte Einstellungsflächen, Stimmenauswahl, Lautstärke und Weckruf
- die zur Android-Laufzeit erzeugte lokale Stimmprüfung
- Notizen und Eingabefelder
- Klick-Hinweise und Statusmeldungen
- feste untere Navigation

Die Flächen verwenden nun durchgehend hellere blau-violette Transparenz,
Glanzlichter, cyan-violette Leuchtränder und eine gut lesbare weiße Typografie.
Funktionen, persönliche Daten und Sicherheitsregeln wurden nicht verändert.

## Technische Kontinuität

Unverändert bleiben insbesondere:

- Android-Application-ID `com.solholo.app`;
- Pams feste Owner-ID `pam-sol`;
- persönliche Instanz **Pam’s Holo** und Weckruf **„Hey Pam“**;
- bestehende Erinnerungen, Einstellungen, Verbindungen und Sicherheitsregeln;
- Update-Signatur und vorhandene Android-Daten.

## Prüfstatus

- [x] acht neue Bereiche ersetzen die vier alten Schnellbereiche;
- [x] Motiv kleiner und besser sichtbar;
- [x] alle von Pam gezeigten Haupt-, Unter- und Hinweisflächen im gemeinsamen Glasstil;
- [x] verbliebene sichtbare Einhornsignaturen entfernt;
- [x] JavaScript- und CSS-Strukturprüfung erfolgreich;
- [x] vollständiger automatisierter Testlauf: **232 von 232 Tests bestanden**;
- [x] Android-Build #228 in GitHub Actions erfolgreich;
- [x] Originalsignatur durch den separaten #89-Signaturwächter bestätigt;
- [ ] finale Darstellung von Build #228 auf Pams Samsung Galaxy S23 praktisch bestätigt.

**APK-SHA-256:**  
`6680023edb25b935f809fc20e1b0d221ef1c85b90607fa6b471217af4fe6d015`

Die finale praktische Bestätigung erfolgt nach der Installation von Build #228
auf Pams Samsung Galaxy S23.
