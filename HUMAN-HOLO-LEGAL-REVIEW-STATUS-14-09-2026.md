# Human Holo – Legal-Review-Status vom 14.09.2026

## Status

**Keine Marktfreigabe. Kein produktives Deployment. Keine Rechtskonformitätszusage.**

Diese Produktlinie wird technisch und dokumentarisch auf einen prüfbaren,
risikoärmeren Startumfang zurückgeführt. Pam-Holo ist davon getrennt und wird
nicht verändert; maßgeblich ist die
[Pam-Holo-Schutzgrenze](./PAM-HOLO-SCHUTZGRENZE-14-09-2026.md).

## Technisch aktiv im Legal-Review-Profil

„Aktiv“ bedeutet hier: im Code für den künftigen geschlossenen Test erlaubt.
Da der getrennte Human-Holo-Server und die Datenbank noch nicht eingerichtet
sind, ist der reale Zugang weiterhin fail-closed.

- Textchat und bewusst gestarteter Sprachchat;
- transparente Kennzeichnung als KI-gestützte Software;
- kurzlebiger Gesprächskontext im Arbeitsspeicher, derzeit höchstens 30 Minuten;
- bestätigte, ownergebundene Langzeiterinnerungen;
- Erinnerungen ansehen, korrigieren, ausblenden und nach exakter Bestätigung
  löschen;
- freiwillig wählbare automatische Erinnerungskategorien;
- statischer Foto- oder Video-Upload erst nach Rechtebestätigung;
- WhatsApp nur als Entwurf und Telefon nur über den Telefonwähler mit letzter
  Handlung durch den Nutzer.

## Technisch gesperrt

- automatische dauerhafte Wortlautprotokolle aller Gespräche;
- individuelle Gesundheitsberatung, Warnzeichenbewertung und
  Medikamentenerkennung;
- Health Connect;
- Google-Konto, Gmail, Google-Kontakte, Drive und direkte Kalenderaktionen;
- SmartThings, direkte Weckeraktionen und Galaxy-Watch-Verknüpfung;
- Live-Kamera im laufenden Gespräch;
- Sprecherbiometrie und Erkennung bekannter Personen;
- Hintergrund-Weckruf;
- automatische WhatsApp-Ausführung und Lesen von Benachrichtigungen;
- Direktanrufe, fest verdrahtete ADAC-Aktion und KI-Telefoniebrücke;
- eigene geklonte Stimme;
- Original Full Sync und persönliche Bewegungsprofile;
- persönliches Clone-Bild sowie Gedächtnisimport/-wiederherstellung;
- persönliche Tier-Holo-Profile, Tierfotos und automatische
  Tier-Beobachtungen;
- neue Vermächtnis-Einträge.

## Gedächtnis nach der Umstellung

| Ebene | Human Holo | Pam-Holo |
|---|---|---|
| Laufendes Gespräch | flüchtig im RAM, TTL 30 Minuten | unverändert |
| Vollständiger Wortlaut | keine neue automatische Dauerspeicherung | bestehende persönliche Funktion unverändert |
| Dauerhafte Erinnerung | standardmäßig nur ausdrücklich bestätigt | bestehender persönlicher Bestand unverändert |
| Optionale Automatik | nur einzeln freigegebene Kategorien | unverändert |
| Sensible Daten / Daten Dritter | niemals automatisch | unverändert; bleibt ausschließlich Pams Instanz |
| Trennung | eigener Owner, eigener Server, eigene DB | `pam-sol`, Pam-Server und Pam-DB |

Die Human-Holo-Kategorien sind: Über mich, Menschen & Beziehungen, Vorlieben,
Lebensereignisse, Projekte & Entscheidungen, Tiere, Gewohnheiten,
Organisation, sensible Angaben und Sonstiges. Automatisch wählbar sind nur
Über mich, Vorlieben, Lebensereignisse, Projekte & Entscheidungen, Tiere und
Gewohnheiten. Aussagen Dritter, Kontaktangaben, sensible Inhalte, Fragen und
unsichere Ableitungen werden nicht automatisch dauerhaft gespeichert.

## Eingeladener Testbetrieb

- kein öffentlicher Zugang und keine Selbstregistrierung;
- jeder Tester erhält eine eigene ID, einen eigenen Owner
  `human-test-<tester-id>`, einen eigenen Speaker `tester-<tester-id>` und
  einen eigenen Clone-Kontext;
- `pam`, `pam-sol`, `steffi` und `steffi-sol` sind als Tester-IDs technisch
  reserviert und werden abgelehnt;
- der Zugangscode liegt auf dem Server nur als SHA-256-Prüfwert vor;
- eine signierte Testsitzung gilt höchstens vier Stunden und wird nur im
  Browser-Sitzungsspeicher gehalten;
- ein zusätzlicher Realtime-Gedächtnisschlüssel gilt höchstens 30 Minuten
  und enthält keine Datenbank-Zugangsdaten;
- nach fünf Fehlversuchen innerhalb von 15 Minuten wird der Aktivierungsweg
  vorübergehend gesperrt;
- Entfernen eines Profils und Serverneustart macht dessen Sitzungen ungültig;
  ein Ablaufdatum beendet die Einladung automatisch; Rotation des
  Sitzungsschlüssels beendet sämtliche Testsitzungen;
- Statusantworten verraten weder Zahl, Namen noch Kennungen der Tester.

Es ist noch **kein echter Tester eingetragen**. Auch der beratende Anwalt wird
nur dann angelegt, wenn Pamela Nitschke ihn ausdrücklich einlädt. Neue
Einladungen werden lokal mit
`scripts/create-human-holo-test-invite.mjs` erzeugt. Der einmal ausgegebene
Klartextcode darf nicht in Git, Logs, Screenshots oder dieselbe Nachricht wie
die Einladungs-ID gelangen.

Die Struktur ist ohne echte Person und ohne gültigen Zugangscode in
`data/human-holo-tester-profiles.example.json` dokumentiert.

## Export und Löschung im Test

Jeder Tester kann ausschließlich seine eigenen Daten exportieren. Der Export
wird lokal mit AES-GCM-256 verschlüsselt; der Schlüssel wird aus einem vom
Tester gewählten Passwort mit PBKDF2/SHA-256 und 310.000 Iterationen abgeleitet.
Einladungscode, Sitzungstoken, OAuth-Token, Server-/Signiergeheimnisse und der
flüchtige RAM-Kontext sind ausgeschlossen. Ein Import beziehungsweise Restore
ist bis zur gesonderten Prüfung geparkt.

Die Löschung ist ebenfalls ownergebunden. Lokale IndexedDB-Einträge werden
zeilenweise für den angemeldeten Owner gelöscht; die ganze Datenbank wird nie
entfernt. Serverseitig muss der signierte Owner mit dem Löschauftrag
übereinstimmen. Daten von Pam oder anderen Testern werden weder exportiert noch
gelöscht.

## Abtrennung persönlicher Pam-Module

Der aktive Human-Holo-Einstieg lädt Pams Gerätebindung, Pam-Consent-Bestand,
ChatGPT-Importbrücke, Pam-Backup, persönliches Bewegungsprofil und Original
Full Sync nicht. Er lädt außerdem weder Pams Tier-Holo-Modul und Tierfotos
noch Pams persönliches Clone-Bild. Der Human-Holo-Webserver beantwortet direkte
URLs zu diesen Modulen und Dateien mit `404`; die zugehörigen API-Routen sind
serverseitig geparkt.

Die historischen Dateien bleiben im geschützten Pam-Holo-Code-Snapshot
erhalten. Die alten Pam-signierten Veröffentlichungs- und Stimmen-Workflows
sind in der Human-Holo-Linie zusätzlich mit einem nicht übersteuerbaren
`if: false` geparkt.

Auch der bisherige Android-Prüfworkflow ist fail-closed geparkt. Er enthält
historische Pfade unter Pams Application-ID `com.solholo.app` und darf deshalb
vor einer ausdrücklichen Entscheidung über eine eigene Human-Holo-ID und
Signatur weder kompilieren noch ein APK/AAB erzeugen. Der aktive GitHub-Workflow
führt nur Node- und Syntaxprüfungen aus; er signiert, veröffentlicht und
deployt nichts. Auch lokale NPM-Android-Befehle brechen ab. Die
Capacitor-Konfiguration enthält bis zur Entscheidung nur den ausdrücklich nicht
freigabefähigen Platzhalter `invalid.humanholo.unconfigured`.

## Getrennte Infrastruktur: fail-closed

Der Browser- und App-Code von Human Holo enthält derzeit absichtlich **keine
produktive Backend-Adresse**. Er verwendet bis zur Bereitstellung die
reservierte, nicht auflösbare Adresse `https://human-holo-backend.invalid`.
Pams Backend ist als verbotenes Ziel hinterlegt.

Der Human-Holo-Server startet nur, wenn alle folgenden Angaben zueinander
passen:

- `HUMAN_HOLO_SERVICE_ID=human-holo`;
- `HUMAN_HOLO_DATABASE_BOUNDARY=human-holo-dedicated-v1`;
- `HUMAN_HOLO_SEPARATE_DATABASE_CONFIRMED=true`;
- eigene `DATABASE_URL`;
- passender `HUMAN_HOLO_EXPECTED_DATABASE_NAME` mit Human-Holo-Kennung;
- eigene `HUMAN_HOLO_PUBLIC_BASE_URL`, die nicht Pams Backend ist;
- OAuth-Callbacks ausschließlich unter dieser neuen Basisadresse.

Zusätzlich verlangt er:

- `HUMAN_HOLO_ACCESS_MODE=invite-only-test`;
- einen eigenen `HUMAN_HOLO_TEST_SESSION_SECRET` mit mindestens 32 Byte;
- mindestens ein ausdrücklich freigegebenes Profil in
  `HUMAN_HOLO_TESTER_PROFILES_JSON`.

Beispiel der **Struktur**, nicht zum unveränderten Einsatz:

```text
HUMAN_HOLO_SERVICE_ID=human-holo
HUMAN_HOLO_DATABASE_BOUNDARY=human-holo-dedicated-v1
HUMAN_HOLO_SEPARATE_DATABASE_CONFIRMED=true
HUMAN_HOLO_ACCESS_MODE=invite-only-test
HUMAN_HOLO_EXPECTED_DATABASE_NAME=<eigener-human-holo-db-name>
HUMAN_HOLO_PUBLIC_BASE_URL=https://<eigener-human-holo-dienst>
DATABASE_URL=<nur-die-neue-human-holo-datenbank>
HUMAN_HOLO_TEST_SESSION_SECRET=<neues-zufälliges-geheimnis-mindestens-32-byte>
HUMAN_HOLO_TESTER_PROFILES_JSON=<ausdrücklich-freigegebene-profile-als-json>
```

Keine dieser Variablen darf einen Wert, Zugang oder Schlüssel von Pam-Holo
wiederverwenden.

## Noch offen und deshalb veröffentlichungsblockierend

1. separaten Human-Holo-Render-Dienst und separate PostgreSQL-Datenbank real
   anlegen und Wiederherstellung/Backups testen;
2. bestehende Pam-Holo-Render-Instanz nach Backup-Nachweis auf den geschützten
   Pam-Holo-Branch binden;
3. eigene Android-Application-ID und eigene Signaturlinie für Human Holo durch
   Pamela Nitschke festlegen; bis dahin wird kein APK/AAB veröffentlicht;
4. externe rechtliche Prüfungen, Verträge, Datenschutz-Folgenabschätzung,
   Löschfristen, Anbieter- und Transferprüfung abschließen;
5. vollständige technische, Sicherheits- und Barrierefreiheitstests mit der
   finalen Infrastruktur durchführen.

Bis Punkt 3 ausdrücklich entschieden ist, bleibt Human Holo ein getrennter
Web-Test. Der aktive GitHub-Workflow prüft Quellcode und Schutzgrenzen, greift
nicht auf Pams Signiergeheimnisse zu und erzeugt kein installierbares Artefakt.
