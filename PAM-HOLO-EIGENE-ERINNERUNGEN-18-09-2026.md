# Pam’s Holo · Eigene mitdenkende Erinnerungen

**Stand:** 18.09.2026

**Entscheidung und Projektinhaberin:** Pamela Christina Nitschke

**Aktive technische Geltung:** ausschließlich Pams private, ownergebundene
Pam-Holo-Instanz (`pam-sol`)

**Offizielles Human Holo:** weiterhin vollständig im anwaltlichen Hold

## Verbindliche Entscheidung

Pam Holo erhält eigene aktive Erinnerungen. Pam kann sie natürlich per Text
oder Sprache anlegen, anzeigen, ändern und löschen. Pam kann die geplanten
Einträge zusätzlich im Bereich **Wichtiges → Kalender → Holo-Erinnerungen**
ansehen sowie dort direkt ändern oder löschen.

Beispiele:

- „Erinnere mich morgen um 9 Uhr an die Überschrift.“
- „Erinnere mich beim nächsten Holo-Update daran, Katzenfutter zu bestellen.“
- „Welche Erinnerungen hast du für mich eingestellt?“
- „Verschiebe die Erinnerung Medikamente auf morgen 10 Uhr.“
- „Lösche die Erinnerung an Medikamente.“

## Verhalten auf Pams Galaxy S23

- Eine zeitbezogene Erinnerung erscheint als private Android-Benachrichtigung,
  auch wenn Pam Holo gerade geschlossen ist.
- Eine ausdrücklich für das **nächste Holo-Update** angelegte Erinnerung wird
  nach einer tatsächlich neu installierten App-Version ausgelöst.
- Ein Neustart des Handys oder ein App-Update verwirft geplante Erinnerungen
  nicht; Android plant sie anschließend erneut ein.
- Es wird kein zusätzlicher Google-Kalendertermin angelegt. Kalender und
  Holo-Erinnerungen bleiben getrennte, klar erkennbare Funktionen.
- Der aktive Erinnerungsauftrag ist kein biografischer Eintrag im Bereich
  „Erinnerung & Vermächtnis“ und wird getrennt vom Vollzeitgedächtnis verwaltet.
  Das normale Gespräch darüber bleibt nach den bereits geltenden Regeln im
  ownergebundenen Gesprächsverlauf erhalten.

## Eigentum, Privatsphäre und Sicherheit

- Jede Erinnerung ist an die aktive feste Owner-ID gebunden. Eine andere
  Identität kann sie weder auflisten, ändern noch löschen.
- Android speichert den Erinnerungsinhalt lokal verschlüsselt mit AES-GCM. Der
  Schlüssel bleibt im Android Keystore; die rohe Owner-ID wird im nativen
  Erinnerungsspeicher nicht abgelegt.
- Auf dem Sperrbildschirm zeigt die öffentliche Benachrichtigung nur den
  neutralen Hinweis **„Private Erinnerung“**. Der private Inhalt verwendet
  Androids Sichtbarkeit `PRIVATE`.
- Für Benachrichtigungen wird Pams normale Android-Freigabe verwendet. Wird sie
  abgelehnt, behauptet Holo keinen Erfolg und speichert nichts heimlich.
- Es wird bewusst keine Play-Store-kritische Berechtigung für exakte Alarme
  angefordert. Android darf eine Erinnerung zugunsten des Akkuschutzes leicht
  verzögert zustellen.

## Eindeutigkeit und Zurückhaltung

- Fehlen Datum oder Uhrzeit, fragt beziehungsweise meldet Holo, dass der
  Zeitpunkt nicht eindeutig ist. Es wird nichts geraten.
- Mehrere ähnlich benannte Erinnerungen werden niemals willkürlich verändert.
  Pam nennt dann den vollständigen Text oder wählt den Eintrag sichtbar aus.
- Fragen nach biografischen Erinnerungen wie „Erinnerst du dich an Heike?“ oder
  „Welche offenen Erinnerungen haben wir?“ bleiben vollständig im bestehenden
  Gedächtnisweg und werden nicht als aktive Termin-Erinnerung missverstanden.

## Gemeinsam mitgenommene sichtbare Korrektur

Wie mit Pam vereinbart, wird für diese echte Funktionsänderung kein separates
Zwischenupdate gebaut. Das Update erneuert zugleich die ausgelieferte
Oberflächen- und Cache-Version, damit die bereits festgelegte Überschrift
**„Alles Wichtige auf einen Blick“** auf dem Handy tatsächlich sichtbar wird.

## Bestandsschutz

Diese Erweiterung ist ausschließlich additiv. Sie löscht, ersetzt oder
verschiebt keine Termine, Notizen, Einkaufslistenartikel, Erinnerungen,
Tier-Holos, Einstellungen, Dienste oder Sicherheitsregeln. Fingerprintschutz,
Owner-Bindung, Vollzeitgedächtnis, Sicherungen, Kalender und alle bisherigen
Funktionen bleiben erhalten.
