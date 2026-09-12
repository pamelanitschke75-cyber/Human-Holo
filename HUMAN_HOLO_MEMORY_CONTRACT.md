# Human Holo: dauerhafter Identitäts- und Gedächtnisvertrag

Dieser Vertrag gilt für alle künftigen Human-Holo-Versionen.

## Always-on bleibt bestehen

- Textnachrichten und Sprachtranskripte der Nutzerin sowie die Antworten ihres
  Holos werden Wort für Wort im ownergebundenen Vollzeitverlauf gespeichert.
  Frühere Holo-Antworten bleiben als Gesprächsverlauf gekennzeichnet und werden
  nicht zu bestätigten persönlichen Fakten umgedeutet.
- Das Vollzeitgedächtnis bleibt bei App-, Design-, Namens-, Funktions-,
  Server-, Datenbank- und Migrationsänderungen erhalten.
- Speicheränderungen sind additiv und idempotent. Eine neue Version darf
  bestätigte Erinnerungen oder den vollständigen Verlauf weder zurücksetzen
  noch überschreiben oder automatisch löschen.
- Eine Korrektur ergänzt die neuere bestätigte Angabe. Die alte Angabe wird
  nur aus dem normalen Abruf genommen und bleibt historisch nachvollziehbar.
- Eine Entfernung persönlicher Erinnerungen darf ausschließlich die
  zugehörige Person selbst durch einen eindeutigen, authentifizierten und
  ausdrücklich bestätigten Vorgang auslösen.

## Modalitätsübergreifende Ereignisse

- Foto, Video, Live-Bild, Gebärdensprache, gesprochene Sprache und Text werden
  nicht als voneinander getrennte Gedächtnisinseln behandelt. Der
  ownergebundene Beitrag, die verwendeten Modalitäten und Holos damalige
  semantische Auswertung erhalten eine gemeinsame Ereignis-ID.
- Eindeutige spätere Ergänzungen und Korrekturen werden mit dem passenden
  Ereignis verknüpft. Die jüngste Aussage der Ownerin hat bei einem
  Widerspruch Vorrang; ältere Aussagen bleiben historisch erhalten.
- Diese Regel gilt ohne Themenbegrenzung – unter anderem für Essen, Tiere,
  Menschen, Haushalt, Reisen, Dokumente und alle künftigen Alltagsthemen.
- Wenn mehrere Ereignisse als Bezug infrage kommen, fragt Holo kurz nach,
  statt eine Verbindung zu erfinden.
- Rohbilder, Rohvideos und Audioaufnahmen werden nicht in der
  Gedächtnisdatenbank abgelegt. Erinnerbar sind der gespeicherte Dialog, die
  Modalitäten und Holos klar als damalige Auswertung gekennzeichnete Antwort.
- Gebärdensprache wird als visuelle Sprache behandelt, nicht als beliebige
  Handbewegung. Für blinde und sehbehinderte Menschen ist gesprochene Ein- und
  Ausgabe der Hauptweg; sichtbarer Inhalt kann auf einen Sprachbefehl hin als
  gesprochene Audiobeschreibung wiedergegeben werden. Beides gilt für Kinder
  und Erwachsene; unsichere Wahrnehmungen werden nie als sichere Übersetzung
  oder Beschreibung gespeichert.
- Bei sprachgeführter Handyhilfe nennt Holo genau einen nächsten Schritt,
  fragt vor einer neuen Aktion ausdrücklich nach und handelt erst nach einem
  eindeutigen Ja. Eine ausgeführte Aktion wird nur bei technischer Bestätigung
  als Erfolg benannt.
- Unter jeder geschriebenen Holo-Antwort steht sichtbar `🔊 Vorlesen`. Ein
  erneuter Tipp beendet die Wiedergabe. Auf Android nutzt diese reine
  Barrierefreiheitsfunktion die lokale deutsche Gerätestimme und keinen
  zusätzlichen KI- oder Telefondienst.

## Eine Identität pro Person

- Human Holo bleibt ein allgemeines System, das künftig jeder Mensch mit
  einer eigenen Human-Holo-Identität nutzen kann.
- Jede Person erhält einen eigenen technischen Owner-Bereich und startet ohne
  die persönlichen Daten anderer Menschen.
- Gespräche, Erinnerungen, Stimme, Bilder, Einstellungen und Dienste werden
  ausschließlich im eigenen Owner-Bereich verarbeitet.
- Zwischen zwei Personen gibt es keinen gemeinsamen persönlichen Speicher.
  Gemeinsame Erlebnisse können nur als getrennte, jeweils selbst bestätigte
  Kopien gespeichert werden.
- Ein privater Import muss zur angemeldeten Identität gehören und von ihr
  bestätigt werden. Private Importdateien gehören niemals in das öffentliche
  Repository.

Die kanonische interne Owner-ID einer bestehenden Installation darf durch eine
reine Umbenennung nicht gewechselt werden. So bleiben ältere, bereits
zugeordnete Erinnerungen erreichbar, während der sichtbare Produktname davon
unabhängig geändert werden kann.

## Verbindlicher Gedächtnisstandard – bestätigt am 08.09.2026

Genau diese sieben Punkte bilden den verbindlichen Gedächtnisstandard für Human Holo:

- langfristig stabil – über Updates, Geräte-, Server- und Datenbankwechsel hinweg
- automatische Erkennung wirklich relevanter Erinnerungen
- zeitliche, persönliche und thematische Verknüpfung von Zusammenhängen
- gleichwertiger Zugriff auf alte und neue Erinnerungen
- Quellen-, Datums- und Sicherheitsprüfung gegen falsche Erinnerungen
- klare Trennung zwischen unveränderter Roh-Erinnerung und später daraus abgeleiteter Erkenntnis
- skalierbare Speicherung und Suche, ohne ältere Originalerinnerungen zu löschen

Unsichere oder widersprüchliche Inhalte werden gekennzeichnet und getrennt gehalten, statt als Wahrheit übernommen zu werden. Bestätigte Korrekturen ersetzen die frühere Aussage nachvollziehbar, löschen aber nicht heimlich die Historie.

## Verbindliche vollständige Gedächtnissicherung – bestätigt am 12.09.2026

- Die verschlüsselte persönliche Sicherung gilt nicht für einzelne Personen,
  Tiere oder Themen, sondern für das **gesamte ownergebundene Gedächtnis**.
- Sie enthält den wortgetreuen Vollzeitverlauf beider Rollen, bestätigte
  persönliche Erinnerungen, gesperrte beziehungsweise in den Hintergrund
  gesetzte historische Zustände, die Korrektur- und Ersetzungshistorie,
  weiterhin abrufbare ältere Gesprächs- und Langzeitbestände,
  lokale Notizen, noch nicht synchronisierte Dialoge, Tier-Holo-Profile,
  bestätigte Tierbeobachtungen, ausdrücklich angelegte Einträge und
  freigegebene Dateien aus „Erinnerung & Vermächtnis“ sowie die dafür
  erlaubten lokalen Einstellungen.
- Die Serverdaten werden in einer konsistenten, nur lesenden Transaktion
  vollständig erfasst. Eine Größenüberschreitung oder ein Fehler bricht den
  Export ab; es wird niemals still eine unvollständige Kopie als vollständige
  Sicherung ausgegeben.
- Die Datei wird auf Pams Gerät verschlüsselt. Inhalt, Passwort und private
  Erinnerungen gehören nicht in das öffentliche Repository.
- Wiederherstellung ist ownergebunden, ausdrücklich bestätigt, additiv,
  idempotent und transaktional pro Teilstapel. Bestehende Daten werden weder
  gelöscht noch zurückgesetzt. Ein unterbrochener Vorgang kann mit derselben
  Datei gefahrlos erneut gestartet werden.
- Der SHA-256-Inhaltsnachweis und die erwarteten Datensatzanzahlen erkennen
  unvollständige oder veränderte Sicherungsstände zusätzlich zur
  authentifizierten AES-GCM-Verschlüsselung.
- Geräteschlüssel, APK-Signierschlüssel, Passwörter, Tokens, Sitzungen,
  biometrische Sprecher- oder Gesichtsprofile sowie nicht freigegebene
  Rohmedien bleiben ausgeschlossen. Diese Sicherheitsbindungen müssen auf
  einem neuen Gerät bewusst und sicher neu eingerichtet werden.

Und weiterhin gilt: Jede persönliche Human-Holo-Identität besitzt ihren eigenen geschützten Speicher – **verbunden, aber nicht vermischt**. 💜♾️🌎
