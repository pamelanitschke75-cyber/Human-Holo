# Human Holo – vollständige private Gedächtnissicherung

Stand: 12.09.2026

**ENTSCHEIDUNG & PROJEKTINHABERIN: PAMELA CHRISTINA NITSCHKE**  
**OWNER-GEBUNDEN: Pamela Nitschke · `pam-sol`**

## Verbindliche Entscheidung

Eine zuverlässige Sicherung darf nicht nur einzelne Erinnerungen oder Themen
erfassen. Sie gilt für das gesamte persönliche Gedächtnis der jeweils aktiven
Human-Holo-Identität.

## Technisch erfasster Gesamtstand

- wortgetreuer Always-on-Vollzeitverlauf von Nutzerin und Holo
- Ereignis-IDs und gespeicherte Modalitätszuordnungen
- bestätigte persönliche Erinnerungen einschließlich Abrufstatus
- historische Korrekturen und Ersetzungen
- ältere, weiterhin abrufbare Gesprächs- und Langzeitbestände
- lokale Notizen
- noch nicht synchronisierte Dialoge
- Tier-Holo-Profile und bestätigte Tierbeobachtungen
- ausdrücklich angelegte Einträge und freigegebene Dateien aus
  „Erinnerung & Vermächtnis“
- erlaubte lokale App-Einstellungen

Der serverseitige Stand wird innerhalb einer konsistenten, nur lesenden
PostgreSQL-Transaktion erfasst. Erst wenn alle drei Serverbereiche vollständig
vorliegen, darf die App daraus gemeinsam mit den lokalen Daten eine Sicherung
erzeugen. Bei einem Fehler oder einer Größenüberschreitung wird abgebrochen;
eine Teilkopie darf nicht als vollständige Sicherung bezeichnet werden.

## Schutz der privaten Datei

- AES-256-GCM für Vertraulichkeit und Manipulationsschutz
- PBKDF2-HMAC-SHA-256 mit zufälligem Salt und 310.000 Iterationen
- SHA-256-Nachweis über den kanonischen Serverinhalt
- feste Datensatzanzahlen je Speicherbereich
- feste Owner-, Sprecher-, Klon- und Paketbindung
- Speicherung ausschließlich über den Android-Systemdialog
- keine Übertragung privater Sicherungsinhalte nach GitHub

## Sichere Wiederherstellung

Die App entschlüsselt und prüft zuerst die vollständige Datei. Vor jeder
Änderung wird eine Zusammenfassung angezeigt und Pams ausdrückliche
Bestätigung verlangt. Der Server nimmt anschließend kleine, ownergebundene
Teilstapel an. Jeder Teilstapel läuft in einer Datenbanktransaktion und wird
additiv mit `ON CONFLICT DO NOTHING` beziehungsweise einer vorherigen
Bestandsprüfung zusammengeführt.

Dadurch gilt:

- keine automatische Löschung
- kein Zurücksetzen
- kein pauschales Überschreiben
- vorhandene Einträge bleiben erhalten
- Wiederholung nach Netz- oder Geräteunterbrechung ist sicher
- andere Owner können die Datei weder exportieren noch einspielen

## Bewusste Sicherheitsausnahmen

Nicht Bestandteil einer übertragbaren Gedächtnissicherung sind
hardwaregebundene Geräteschlüssel, der APK-Signierschlüssel, Passwörter,
OAuth-Tokens, aktive Sitzungen, Sprecher-Embeddings, biometrische Rohdaten,
nicht freigegebene Fotos, Videos oder Audioaufnahmen und nicht eindeutig
zugeordnete Quarantänedaten. Diese Informationen sind keine vergessenen
Erinnerungen, sondern Sicherheits- oder Rohdaten und müssen auf einem neuen
Gerät bewusst neu gebunden beziehungsweise erneut freigegeben werden.

Ausdrücklich unter „Erinnerung & Vermächtnis“ angelegte Dateien sind davon
nicht betroffen: Sie werden gemeinsam mit ihrem ownergebundenen Eintrag in die
verschlüsselte Sicherung aufgenommen. Die Ausnahme gilt nur für unbestätigte
Rohmedien und biometrische Klondaten.

## Unveränderte Grundregel

**Erhalten und erweitern, nicht überschreiben.**  
Private Erinnerungen bleiben privat. Das öffentliche Repository enthält nur
die Technik und die verbindlichen Schutzregeln, niemals den persönlichen
Gedächtnisinhalt.

© 2026 Pamela Christina Nitschke · Human Holo
