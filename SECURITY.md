# SOL HOLO / PAM’S HOLO – SECURITY POLICY

**Version:** 3.1

**Stand:** 16.09.2026
**Projektverantwortung:** Pamela Nitschke  
**Status:** Sicherheitsrichtlinie für einen persönlichen Entwicklungsprototyp – keine Sicherheitszertifizierung

Diese Datei beschreibt die Sicherheitsgrundsätze, bereits vorhandene Schutzmaßnahmen und noch offene Sicherheitsaufgaben von Sol Holo / Pam’s Holo.

Sie darf nicht so verstanden werden, als sei das Projekt bereits unabhängig sicherheitsgeprüft, für einen öffentlichen Mehrnutzerbetrieb freigegeben oder gegen sämtliche Angriffe geschützt.

---

## 1. Geltungsbereich

Diese Richtlinie gilt für den jeweils aktuellen Entwicklungsstand im Branch `main` und die daraus erstellten Android-Entwicklungsfassungen.

Ältere Builds und historische Commits können überholte oder unvollständige Schutzmaßnahmen enthalten und werden nicht als unterstützte Sicherheitsversionen behandelt.

Der derzeitige Stand ist eine persönliche Entwicklungsinstanz für Pamela Nitschke. Er ist noch kein allgemein freigegebener öffentlicher Mehrnutzer-Dienst.

---

## 2. Sicherheitsziel

Sol Holo soll nur solche Daten, Funktionen, Geräte und externen Dienste verwenden, die für den jeweiligen Zweck erforderlich und von der berechtigten Person freigegeben sind.

Dabei gelten insbesondere folgende Grundsätze:

- Geheimnisse bleiben außerhalb des öffentlichen Quellcodes.
- Persönliche Daten verschiedener Menschen dürfen nicht zu einer gemeinsamen Identität vermischt werden.
- Sensible Aktionen benötigen eine erkennbare Berechtigung und gegebenenfalls eine zusätzliche Bestätigung.
- Externe Dienste erhalten nur die für eine konkrete Funktion erforderlichen Informationen.
- Nicht belegte oder noch nicht implementierte Sicherheitsfunktionen werden nicht als abgeschlossen dargestellt.
- Ein Fehler in einer Funktion soll nicht automatisch weitere Rechte eröffnen.

Der Begriff **Sol Control** bezeichnet in den Projektunterlagen dieses Berechtigungs- und Kontrollprinzip. Er ist keine Behauptung über ein unabhängig zertifiziertes Sicherheitsprodukt.

---

## 3. Aktuell vorhandene Schutzmaßnahmen

Im derzeitigen Quellcode sind unter anderem folgende Maßnahmen vorhanden:

### Server-Geheimnisse

API-Schlüssel, Datenbank-Zugangsdaten, OAuth-Client-Secrets und vergleichbare Geheimnisse werden über Server-Umgebungsvariablen erwartet und nicht fest in den öffentlichen App-Code geschrieben.

Die `.gitignore` schließt insbesondere folgende lokale Inhalte aus:

- `.env` und `.env.*`
- Android-Signaturdateien wie `*.jks`, `*.keystore` und `*.p12`
- den privaten Ordner `.sol-holo-private/`

### Verifizierter Pam-Holo-Ursprungsschutz

Am 16.09.2026 wurde der getrennte Cloudflare-Türsteher für Pam’s Holo praktisch verifiziert. `PAM_HOLO_ORIGIN_SECRET` ist ausschließlich als Secret in Cloudflare und Render gespeichert; der echte Wert wird nicht in GitHub dokumentiert. Render verlangt den Ursprungsschlüssel mit `PAM_HOLO_ORIGIN_SECRET_REQUIRED=true`.

Der direkte Aufruf von `https://sol-holo.onrender.com` wurde nach Aktivierung abgelehnt. Der Aufruf über `https://pam-holo-edge-guard.pamela-nitschke75.workers.dev` funktionierte weiterhin. Damit ist die Umgehung des Cloudflare-Türstehers über einen normalen direkten Render-Aufruf gesperrt.

Dieser Nachweis gilt ausschließlich für Pam’s Holo und ist keine Sicherheitszertifizierung.

### OAuth-Schutz

Für Google und SmartThings werden zufällige, einmalig verwendbare und zeitlich begrenzte OAuth-Statuswerte erzeugt. Ein fehlender, fremder, bereits verwendeter oder abgelaufener Statuswert wird abgelehnt.

### SmartThings-Tokens

SmartThings-Zugriffs- und Refresh-Tokens werden vor der Speicherung auf Anwendungsebene mit AES-256-GCM verschlüsselt. Der dafür verwendete Schlüssel wird aus einer Server-Umgebungsvariable abgeleitet und gehört nicht in das Repository.

### Begrenzte Google-Berechtigungen

Der aktuelle Entwicklungsstand fordert für Gmail, Google Kontakte und Google Drive nur Lesezugriffe an. Für Google Calendar wird der Zugriff auf Kalenderereignisse verwendet. Auf Android kann Human Holo nach einmaliger, widerrufbarer `READ_CALENDAR`-/`WRITE_CALENDAR`-Freigabe einen ausdrücklich beauftragten Termin direkt über den Calendar Provider speichern und kommende sichtbare Termine aus derselben Quelle im eigenen Kalenderfach anzeigen. Es entsteht keine zweite Terminkopie. Die fremde Kalender-App wird dabei nicht geöffnet; ohne bestätigte Ereignis-ID darf kein Erfolg gemeldet werden.

### Voice Setup

Die Endpunkte zur Einrichtung einer persönlichen Stimme besitzen eine getrennte serverseitige Zugriffskontrolle über ein nicht öffentlich gespeichertes Setup-Geheimnis. Eine Veröffentlichung einer normalen Sprachaufnahme ist keine automatische Einwilligung zur Erstellung eines synthetischen Stimmprofils.

### Android-Bestätigungen

Normale Anrufwege bleiben sichtbar und bestätigungspflichtig. Ein direkter
Kontaktanruf ist nur nach Pams sichtbarer Bestätigung, erneuter lokaler
Kontaktnummernprüfung und Android-Laufzeitfreigabe möglich. Direkte SMS werden
nur bei einem eindeutigen Sendeauftrag, erneut geprüfter lokaler
Kontaktzuordnung, Standardassistentinnenrolle und einmaliger Android-Freigabe
ausgeführt; der bisherige sichtbare SMS-Entwurf bleibt als Rückfallweg erhalten.

### Health Connect

Die frühere Health-Connect-Entwicklung war ausschließlich lesend und schloss
den Datentyp **„Sexuelle Aktivität“** vollständig aus. Seit der verbindlichen
anwaltlich/rechtlich begründeten Medizinpause vom 15.09.2026 ist Health Connect
jedoch in Human Holo und Pam’s Holo vollständig deaktiviert: keine
Manifest-Berechtigung, keine Android-Freigabeanforderung und kein Lesepfad. Der
historische Entwicklungsnachweis bleibt versioniert, ist aber keine aktive
Funktion.

---

## 4. Sicherheitsaufgaben und aktueller Status

Die offene Liste aus Version 2.0 bleibt nachvollziehbar erhalten und wurde am
16.09.2026 mit dem tatsächlichen Stand ergänzt:

- **Teilweise umgesetzt, weiter zu prüfen:** vollständige Authentifizierung und
  Autorisierung jeder sensiblen Backend-Anfrage; Trusted-App-, Geräte-, Owner-
  und Sprecherbindung bestehen, ein unabhängiges Audit aller Routen fehlt.
- **Umgesetzt und getestet:** sichere Geräte- und Nutzerbindung der
  persönlichen Pam’s-Holo-Instanz für geschützte persönliche Dienste.
- **Weiter offen:** geregelte Rotation aller gespeicherten OAuth-Tokens.
- **Umgesetzt und getestet am 16.09.2026:** eng begrenzte
  Herkunftsfreigaben statt Wildcard-CORS.
- **Umgesetzt und getestet am 16.09.2026:** systematisches Rate-Limiting gegen
  automatisierten Missbrauch.
- **Umgesetzt und live verifiziert am 16.09.2026:** direkter Render-Ursprung von Pam’s Holo gesperrt; Zugriff über den getrennten Cloudflare-Türsteher mit serverseitigem Ursprungsschlüssel funktioniert.
- **Weiter im Ausbau:** vollständige Trennung aller künftigen
  Mehrnutzerinstanzen; Pams bestehende Instanz bleibt fest ownergebunden.
- **Umgesetzt und releasegesperrt am 16.09.2026:** wiederholbare Prüfung auf
  Geheimnismuster, private Schlüsseldateien, Android-Klartextverkehr,
  automatische Cloud-Backups und bekannte Laufzeitabhängigkeitslücken.
- **Umgesetzt am 16.09.2026:** automatisierte Secret-, NPM-Audit-, CodeQL- und
  Dependabot-Prüfungen für neue Commits.
- **Weiter offen:** unabhängiger Penetrationstest oder externes
  Sicherheitsaudit.

Solange diese Punkte nicht umgesetzt und getestet sind, darf Sol Holo nicht als sicherheitszertifiziert oder als fertig abgesicherter öffentlicher Mehrnutzer-Dienst bezeichnet werden.

---

## 5. Besonders geschützte Daten

Nicht in das öffentliche Repository gehören insbesondere:

- API-Schlüssel, Passwörter, Tokens und Zugangsdaten,
- Android-Signaturschlüssel und deren Passwörter,
- private Erinnerungen und vollständige Gesprächsverläufe,
- nicht ausdrücklich freigegebene Fotos, Videos oder Sprachaufnahmen,
- Kontakte, E-Mails und persönliche Dokumente,
- Gesundheits-, Fitness- und sonstige sensible persönliche Daten,
- Datenbanken, Datenbankexporte und Backups des persönlichen Profils,
- Authenticator-, Banking-, PIN-, TAN- oder Wiederherstellungsdaten.

Persönliche Bilder, Videos, Namen oder Sprachaufnahmen dürfen nur dann öffentlich dokumentiert werden, wenn die betroffene Person dies selbst erlaubt hat und die Veröffentlichung dem vereinbarten Umfang entspricht.

---

## 6. Persönliches Gedächtnis und Identität

Das persönliche Gedächtnis gehört ausschließlich zur jeweils berechtigten persönlichen Instanz.

Für zukünftige Mehrnutzerfassungen müssen mindestens folgende Bedingungen technisch erfüllt sein:

- eindeutige Nutzer- und Instanzzuordnung,
- authentifizierter Zugriff,
- getrennte Speicherung und Abfrage,
- keine Übernahme fremder Erinnerungen,
- nachvollziehbare Berichtigung und Löschung,
- Schutz vor unbefugtem Export,
- keine Freigabe persönlicher Daten allein aufgrund einer technischen Code-Nutzungserlaubnis.

Eine technische Sol-Holo-Lizenz oder ein Fork des Repositorys ist niemals automatisch eine Freigabe von Pamela Nitschkes persönlicher Identität, Stimme, ihrem Abbild oder ihren Erinnerungen.

---

## 7. Kamera, Mikrofon, Stimme, Fotos und Videos

Kamera und Mikrofon dürfen nur für eine erkennbare Funktion und im Rahmen der jeweiligen Geräteberechtigung verwendet werden.

Für andere erkennbare Personen gilt:

- Veröffentlichung nur im vereinbarten Umfang,
- keine Stimmnachbildung ohne gesonderte ausdrückliche Einwilligung,
- keine automatische Verwendung für einen digitalen Klon,
- keine Übertragung einer Freigabe auf fremde Projekte,
- ein Widerruf wird für zukünftige Verwendungen berücksichtigt.

Ein bereits öffentlich verbreiteter Inhalt kann technisch von Dritten kopiert worden sein. Ein späterer Widerruf kann daher vor allem die weitere eigene Nutzung und Veröffentlichung beenden, aber nicht jede bereits entstandene Kopie bei Dritten technisch zurückholen.

---

## 8. Externe Dienste und Datenübertragung

Sol Holo kann externe Anbieter, APIs, Cloud-Dienste und Geräteplattformen verwenden.

Vor einer Übertragung sensibler Inhalte soll geklärt sein:

1. welcher Dienst verwendet wird,
2. welche Daten tatsächlich erforderlich sind,
3. welche Berechtigung besteht,
4. ob die Aktion nur lesend oder auch schreibend ist,
5. ob eine sichtbare Bestätigung erforderlich ist,
6. wie die Verbindung widerrufen werden kann,
7. ob Daten gespeichert oder protokolliert werden.

Die Verwendung eines Anbieters bedeutet keine Partnerschaft, Unterstützung, Zertifizierung oder Mitentwicklung durch diesen Anbieter.

---

## 9. Protokollierung

Technische Protokolle sollen nur die für Fehlersuche und Betrieb erforderlichen Informationen enthalten.

Nicht unnötig protokolliert werden sollen insbesondere:

- vollständige private Gespräche,
- vollständige Erinnerungsbestände,
- Gesundheitsdaten,
- API-Schlüssel oder Tokens,
- Passwörter und Setup-Geheimnisse,
- vollständige private Bilder oder Dokumente.

Fehlermeldungen an die App sollen keine internen Geheimnisse oder vollständigen Antworten externer Dienste offenlegen.

---

## 10. Sicherheitsvorfall

Bei einem möglichen Sicherheitsvorfall gilt grundsätzlich:

1. betroffene Funktion oder Verbindung stoppen,
2. kompromittierte Schlüssel und Tokens widerrufen oder rotieren,
3. unbefugte Datenübertragung begrenzen,
4. die Ursache dokumentieren,
5. betroffene Daten und Personen bestimmen,
6. aktuelle Dateien korrigieren,
7. bei veröffentlichten Geheimnissen zusätzlich die Git-Historie prüfen,
8. erst nach einer Prüfung wieder freigeben.

Das bloße Löschen eines Geheimnisses aus der aktuellen Datei genügt nicht, wenn es bereits in einem Commit veröffentlicht wurde. Ein veröffentlichtes Geheimnis muss grundsätzlich als kompromittiert behandelt und ersetzt werden.

---

## 11. Sicherheitslücken melden

Sicherheitslücken, vermutete Datenlecks und gefundene Zugangsdaten sollen **nicht mit vollständigen technischen Details in einem öffentlichen Issue** veröffentlicht werden.

Bevorzugt wird – soweit im Repository verfügbar – GitHubs private Funktion **„Report a vulnerability“** verwendet.

Ist keine private Meldemöglichkeit sichtbar, kann ein öffentliches Issue mit dem Titel

`[SECURITY] Bitte privaten Kontakt herstellen`

erstellt werden. Dieses Issue darf keine Passwörter, Tokens, persönlichen Daten, Exploit-Schritte oder vertraulichen Anhänge enthalten. Die weiteren Einzelheiten werden anschließend über einen privaten Kontaktweg geklärt.

---

## 12. Sicherheitsstatus

| Bereich | Stand 29.08.2026, verbindlich aktualisiert 16.09.2026 |
|---|---|
| Geheimnisse über Server-Umgebungsvariablen | 🟩 vorhanden |
| `.gitignore` für Umgebungs- und Signaturdateien | 🟩 vorhanden |
| Zeitlich begrenzte OAuth-Statuswerte | 🟩 vorhanden |
| SmartThings-Tokenverschlüsselung | 🟩 vorhanden |
| Telefonanruf / direkte SMS | 🟩 Anruf bleibt sichtbar bestätigt; direkte SMS nur bei eindeutigem Auftrag, lokaler Kontaktprüfung, Standardassistentinnenrolle und Android-Freigabe |
| Health Connect / medizinische Funktionen | ⏸️ seit 15.09.2026 vollständig deaktiviert; historische Entwicklung bleibt nur versioniert |
| Innerer Anwendungswächter | 🟩 im Code und im blockierenden Freigabegate umgesetzt |
| Android-Klartextverkehr und automatische Cloud-Backups | 🟩 gesperrt; bewusste verschlüsselte Holo-Sicherung bleibt erhalten |
| Geheimnis- und Laufzeitabhängigkeitsprüfung | 🟩 blockiert die Freigabe bei Befund |
| CodeQL und Dependabot | 🟩 als fortlaufende GitHub-Prüfungen eingerichtet |
| Äußerer Cloudflare-Wächter | 🟩 für Pam’s Holo aktiv und live verifiziert; direkter Render-Ursprung gesperrt, Cloudflare-Weg funktioniert |
| Vollständige Backend-Zugriffskontrolle | 🟨 noch nicht abgeschlossen |
| Verschlüsselung aller gespeicherten OAuth-Tokens | 🟨 noch nicht abgeschlossen |
| Mehrnutzer- und Clone-Trennung | 🟨 Architekturziel; noch kein freigegebener Mehrnutzerbetrieb |
| Unabhängiger Sicherheitstest | ⬜ noch nicht durchgeführt |
| Sicherheitszertifizierung | ⬜ nicht vorhanden |

---

## 13. Zugehörige Dokumente

Diese Sicherheitsrichtlinie wird ergänzt durch:

- `Datenschutz.md`
- `Berechtigungen.md`
- `ANONYMISIERUNGSREGEL.md`
- `RECHTLICHER_HINWEIS.md`
- `THIRD_PARTY_NOTICES.md`
- `LICENSE`
- `PAM-HOLO-CLOUDFLARE-TUERSTEHER-VERIFIZIERT-16-09-2026.md`

Bei Widersprüchen zwischen einer geplanten Beschreibung und dem tatsächlich implementierten Code darf die Planung nicht als bereits vorhandene Schutzmaßnahme ausgegeben werden.

---

## 14. Verbindliche Außenangriff-Härtung ab 16.09.2026

Diese zusätzliche Schutzvorgabe gilt für **Pam’s Holo und Human Holo**, aber niemals über einen gemeinsamen Server, eine gemeinsame Datenbank, einen gemeinsamen Ursprungsschlüssel oder einen gemeinsamen persönlichen Speicher. Beide Dienste erhalten dieselben Schutzklassen in strikt getrennter Infrastruktur. Bestätigte Alltagsfunktionen werden dadurch nicht entfernt.

### Innerer Anwendungswächter

Der jeweilige Server besitzt vor CORS, JSON-Verarbeitung, API-Routen und öffentlich ausgelieferten Dateien einen inneren Anwendungswächter. Er setzt insbesondere folgende Sperren durch:

- Browserzugriffe nur von einer festen Holo-/App-Herkunftsliste; kein pauschales Wildcard-CORS,
- gestufte Anfragelimits gegen automatisierten Missbrauch und Ressourcenerschöpfung,
- keine öffentliche Auslieferung von Serverquellen, Modulen, Tests, Datenverträgen, Git-Dateien, Build-Skripten oder privaten Schlüsseldateien,
- Ablehnung nicht benötigter HTTP-Methoden, komprimierter Anfragekörper und verdächtiger Pfade,
- Sicherheitsheader gegen Clickjacking, MIME-Sniffing, unnötige Browserberechtigungen und Informationspreisgabe,
- neutrale Fehler- und 404-Antworten ohne Stacktrace oder interne Details,
- begrenzte Header-, Keep-alive- und Request-Zeiten am HTTP-Server.

Diese innere Schutzschicht ersetzt **nicht** die vorhandene kryptografische Geräte-, Trusted-Session-, Owner- und Sprecherbindung. Sie steht davor und bildet mit diesen Prüfungen eine mehrschichtige Abwehr.

Öffentliche Seiten und freigegebene öffentliche Funktionen erhalten dieselben grundlegenden Angriffs-, Methoden-, Pfad-, Größen-, Header-, DDoS-, Bot- und Rate-Limit-Schutzschichten. „Öffentlich“ bedeutet erreichbar, niemals ungeschützt. Persönliche Funktionen verlangen darüber hinaus Owner-, Geräte- und Sitzungsbindung. Interne Dateien und Verwaltungswege bleiben gesperrt.

### Identität und Schutz gegen Manipulation

- Holo verlangt beim Start starke Android-Biometrie oder Geräte-PIN und sperrt sofort wieder, sobald die App den Vordergrund verlässt. Biometrische Rohdaten bleiben ausschließlich bei Android.
- Mehrere auf Samsung hinterlegte Fingerabdrücke erzeugen und wechseln niemals eine Holo-Identität. Android meldet Holo nicht, welcher gespeicherte Finger die Gerätefreigabe bestanden hat; die Holo-Owner-ID bleibt davon unabhängig fest `pam-sol`. Die Android-Prüfung autorisiert damit das Gerät, nicht eine namentlich erkennbare Person. Der als **„Schatzi“** gespeicherte Fingerabdruck von Stefanie Renate Hörath bleibt ausschließlich für Pams Handy-Notfallzugang erlaubt und darf Pam’s Holo niemals freigeben. Solange dieser Finger gespeichert ist, genügt Samsung-Biometrie oder Geräte-PIN allein nicht als Holo-Ownernachweis. Vor einer App-Freigabe ist zusätzlich eine getrennte, nur Pam bekannte ownergebundene Holo-PIN beziehungsweise ein gleichwertiger unabhängiger Holo-Faktor technisch umzusetzen und zu testen.
- „Hey Pam“ bleibt erhalten. Der Weckdienst ist für fremde Apps nicht exportiert, benötigt eine bewusste Aktivierung und im Hintergrund einen sichtbaren, jederzeit abschaltbaren Android-Hinweis.
- Der Weckruf benötigt sowohl das feste Weckwort als auch Pams lokales 3-von-3-Stimmprofil. Diese Sprecherprüfung ist von der Android-Gerätefreigabe getrennt. Unklare oder fremde Stimmen werden abgelehnt.
- Die lokale Weckwortprüfung schreibt keine Audiodatei und besitzt keinen Netzwerkpfad zum Hochladen des laufenden Hintergrundtons.
- Für Pams synthetische OpenAI-Stimme ist zusätzlich eine ausdrücklich gesprochene OpenAI-Einwilligung erforderlich. OpenAI muss eine Consent-ID zurückgeben; ohne diese ID darf keine persönliche Stimme erstellt werden.
- Unveränderbare Android-`PendingIntent`s, hardwaregeschützte Geräteschlüssel, einmalig verbrauchbare Autorisierungen und signierte Builds verhindern, dass ein bloßer UI- oder Weckworttreffer eine geschützte Aktion ersetzt.

### Android- und Lieferkettenschutz

- Android-Klartextverkehr ist ausdrücklich gesperrt; die App vertraut für Netzwerkverbindungen nur den System-Zertifizierungsstellen und nicht zusätzlich installierten Nutzer-Zertifikaten.
- Automatische Android-Cloud-Backups sind gesperrt. Die vorhandene bewusste, verschlüsselte Human-Holo-Sicherung bleibt erhalten.
- GitHub prüft vor dem Android-Build auf bekannte Geheimnismuster und private Schlüsseldateien.
- Der Laufzeit-Abhängigkeitsaudit ist ein blockierendes Gate. Bekannte Schwachstellen ab Schweregrad `moderate` stoppen die Freigabe.
- CI verwendet den unveränderten Lockfile-Stand mit `npm ci`; Schutztests laufen vor Android-Kompilierung, Signaturprüfung und Artefaktfreigabe.
- GitHub CodeQL analysiert JavaScript bei Änderungen an `main`, bei Pull Requests und zusätzlich wöchentlich mit erweiterten Sicherheitsabfragen.
- Dependabot prüft NPM- und GitHub-Actions-Abhängigkeiten wöchentlich und schlägt Aktualisierungen als überprüfbare Pull Requests vor; es überschreibt keine Funktionen automatisch.

### Äußerer Cloudflare-Wächter

Cloudflare ist der zusätzliche äußere Türsteher vor Pam’s Holo. Pam’s Holo und Human Holo benötigen dafür getrennte Worker, Domains, Ursprünge und Secrets.

Der historische Worker `human-holo-edge-guard` bleibt als falsch bezeichnete Teststrecke dokumentiert und darf nicht als Human-Holo-Schutz ausgegeben werden.

Der korrigierte Pam-Holo-Worker `pam-holo-edge-guard` läuft mit dem Quellstand `cloudflare/pam-holo-edge-guard.mjs`. Der Worker begrenzt Methoden, private Pfade, Anfragegrößen und Browser-Herkünfte, entfernt spoofbare Weiterleitungsheader, verhindert Edge-Caching und setzt den serverseitigen Ursprungsschlüssel für Render.

Am 16.09.2026 wurde der Ursprungsschutz praktisch verifiziert:

- direkter Aufruf des Render-Ursprungs: blockiert,
- Zugriff über `pam-holo-edge-guard`: erfolgreich,
- `PAM_HOLO_ORIGIN_SECRET_REQUIRED=true`: aktiv,
- gemeinsamer geheimer Wert in Cloudflare und Render: gesetzt, nicht in GitHub dokumentiert.

`cloudflare/human-holo-edge-guard.mjs` bleibt bis zum bestätigten getrennten Human-Holo-Server absichtlich fail-closed und leitet niemals auf Pams Render-Ursprung zurück. Bestehende Worker `sol-holo-api` und `dark-wind-6dd8` bleiben unverändert.

Der Cloudflare-Kontozugang bleibt ausschließlich bei Pamela Christina Nitschke. Passwörter, API-Tokens und Ursprungsschlüssel werden nicht in GitHub dokumentiert oder geteilt.

### Ehrlicher Schutzstatus

Es wird **keine absolute Unangreifbarkeit** behauptet. Verbindlich ist eine mehrschichtige, standardmäßig geschlossene und fortlaufend geprüfte Abwehr. Unabhängiger Penetrationstest, regelmäßige Schlüsselrotation und die vollständige Autorisierungsprüfung sensibler Backend-Routen bleiben zusätzliche notwendige Schutzstufen.

Maschinenlesbarer Vertrag:
`data/human-holo-external-security.de.json`

---

**Pamela Nitschke**  
Sol Holo · Pam’s Holo · SH♾️