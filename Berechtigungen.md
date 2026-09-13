HUMAN HOLO – BERECHTIGUNGEN

Version: 1.5
Stand: 13.09.2026
Status: Technisch umgesetzt und fortlaufend geprüft

Grundregel

Pam entscheidet über jeden sensiblen Zugriff.

Sol Holo erhält nicht automatisch Zugriff auf persönliche Daten, Gerätefunktionen oder verbundene Dienste.

Grundprinzip:

PAM
 ↓
FREIGABE
 ↓
SOL HOLO
 ↓
SOL CONTROL
 ↓
SCHNITTSTELLE
 ↓
AKTION

Wird eine benötigte Berechtigung nicht erteilt, darf die betreffende Funktion nicht ausgeführt werden.

Andere Funktionen von Sol Holo sollen dadurch möglichst weiterhin funktionieren.

---

Berechtigungsmatrix

Bereich| Zugriff| Warum benötigt?| Wann?| Ohne Freigabe
🎙️ Mikrofon| Mikrofon| Mit Sol sprechen| Bei Sprachfunktion| Texteingabe bleibt möglich
📷 Kamera| Kamera| Human Holo einzelne Fotos oder aktuelle Live-Bilder zeigen / AR| Erst beim sichtbaren Start der Kamerafunktion| Keine Kamera; Schreiben und Sprechen bleiben möglich
🖼️ Fotos| ausgewählte Bilder| Bilder an Sol übergeben| Bei Auswahl durch Pam| Kein Bildzugriff
◉ Private Selbstwiedererkennung| Pams lokales Referenzbild + genau ein manuell gesendetes Foto| Nur prüfen, ob die einzelne Person Pam selbst ist| Erst nach gesonderter ausdrücklicher Einwilligung und in Pams sicherer Sitzung| Keine Personenprüfung; alle übrigen Bild-, Chat- und Holo-Funktionen bleiben nutzbar
📁 Dateien| ausgewählte Dateien| Dokumente an Sol übergeben| Bei Auswahl durch Pam| Kein Dateizugriff
🔔 Benachrichtigungen| Benachrichtigungen| Hinweise und Erinnerungen| Wenn Funktion aktiviert wird| Keine Sol-Mitteilungen
📅 Kalender| `READ_CALENDAR` + `WRITE_CALENDAR`| Einen ausdrücklich genannten Termin direkt speichern und kommende Termine im sichtbaren Human-Holo-Kalenderfach anzeigen| Einmalige Android-Freigabe; danach beim Kalenderauftrag oder sichtbaren Aktualisieren| Kein Kalendereintrag und keine Terminanzeige in Human Holo
👥 Kontakte| Kontakte| Personen auswählen/zuordnen| Bei Kontaktfunktion| Kein Kontaktzugriff
📞 Telefon| `READ_PHONE_STATE` + `CALL_PHONE`| Während eines Telefonats pausieren; einen erneut geprüften Kontakt oder die fest hinterlegte ADAC-Pannenhilfe nach sichtbarer Bestätigung direkt anrufen| Telefonstatus nach einmaliger Freigabe; `CALL_PHONE` erstmals im bestätigten Anrufablauf| Ohne Freigabe kein direkter Anruf; 110/112 bleiben immer im Android-Wähler
🗣️ Holo-Gesprächsanruf| lokaler Kontaktzugriff + verschlüsselte Server-/Telefonie-Verbindung| Human Holo führt nach Pams eindeutigem Auftrag ein Gespräch mit genau einem vorab freigegebenen Kontakt| Nur aus Pams entsperrter, hardwaregebundener S23-Sitzung; kein zweites Bestätigungsfenster| Kein Gesprächsanruf; normale Kontakt-, ADAC- und Notrufwege bleiben getrennt
💬 Nachrichten| Nachrichten-/Share-Funktion| Text an andere Apps übergeben| Bei ausdrücklicher Aktion| Keine Übergabe
♿ Bedienungshilfe (optional)| ausschließlich WhatsApp und WhatsApp Business| Empfänger, vollständigen Text und Senden-Schaltfläche prüfen und nach einem ausdrücklichen WhatsApp-Auftrag einmalig Senden auslösen| Einmalige bewusste Aktivierung in Android; danach bei jedem ausdrücklich genannten WhatsApp-Sendeauftrag| WhatsApp wird nur vorbereitet und nicht automatisch gesendet
📍 Standort| Standortdaten| Ortsbezogene Funktionen| Nur wenn benötigt| Keine Standortfunktionen
🧭 Navigation| Karten-/Navigations-App| Ziel übergeben| Bei Navigationsauftrag| Keine Navigation
📡 Bluetooth| Geräte in der Nähe| Watch und andere Geräte| Beim Verbinden| Keine Bluetooth-Verbindung
📶 NFC| kryptografisch geschützter Sicherheitsschlüssel| zusätzlicher unabhängiger Identitätsnachweis| bei Einrichtung oder erhöhter Sicherheitsprüfung| andere sichere Nachweise bleiben möglich
⌚ Wear OS| Smartwatch-Daten| Sol mit Watch verbinden| Wenn Watch-Funktion aktiv| Sol bleibt auf Smartphone
📱 Sensoren| benötigte Sensorwerte| Bewegung/Lage/AR| Bei entsprechender Funktion| Funktion eingeschränkt
❤️ Health Connect| ausgewählte Datentypen| Freigegebene Health-Daten| Nach separater Zustimmung| Keine Health-Daten
🏠 Smart Home| ausgewählte Geräte| Geräte steuern| Nach Einrichtung| Keine Gerätesteuerung
☁️ Cloud| Sol-Daten| Synchronisierung| Nur wenn aktiviert| Daten bleiben lokal
🌐 Internet| Netzwerk| KI und externe Dienste| Wenn Online-Funktion benötigt| Nur lokale Funktionen
🥽 AR / Holo| Kamera + Sensoren| Räumliche Darstellung| Während AR/Holo verwendet wird| Keine räumliche Darstellung

---

Mikrofon

Sol Holo benötigt das Mikrofon für Sprachkommunikation.

Das Mikrofon darf nicht allein deshalb dauerhaft aktiv sein, weil Sol Holo installiert ist.

Pam startet Sprachfunktion
        ↓
Mikrofon erlaubt?
      ↙       ↘
    JA         NEIN
    ↓           ↓
 Aufnahme    Texteingabe

---

Kamera

Die Kamera kann für:

- Bilder
- aktuelle Live-Bilder während eines laufenden Holo-Gesprächs
- visuelle Analyse
- AR
- spätere Holo-Funktionen

verwendet werden.

Sol Holo soll die Kamera nur verwenden, wenn eine entsprechende Funktion aktiv ist.

Der Live-Bildmodus beginnt ausschließlich nach einem sichtbaren Tipp von Pam.
Während er aktiv ist, zeigt die App dauerhaft eine Kameravorschau und den Hinweis
„LIVE AN HOLO“. Beim Ausschalten, Beenden des Gesprächs oder Verlassen der App
werden die Kameraspuren sofort beendet. Das Mikrofon der Kamera wird dafür nicht
zusätzlich geöffnet.

Das kleine Kamerasymbol im Chat ist davon getrennt: Ein Tipp öffnet sofort die
Rückkamera des Smartphones für genau eine neue Aufnahme. Das aufgenommene Foto
wird zunächst nur als Vorschau in Human Holo angezeigt und erst mit Pams
anschließendem Tipp auf Senden an die Bildanalyse übertragen.

---

Fotos und Dateien

Wo technisch möglich, soll Sol Holo nicht pauschal Zugriff auf den gesamten Foto- oder Dateibestand verlangen.

Bereits vorhandene Fotos und Videos bleiben über „Foto oder Video auswählen“ im
Menü erreichbar. Diese Auswahl öffnet nicht automatisch die Kamera.

Pam wählt gezielt aus:

PAM
 ↓
Bild / Datei auswählen
 ↓
SOL erhält ausgewählten Inhalt

Private Selbstwiedererkennung

Die private Selbstwiedererkennung ist keine allgemeine Kamera- oder
Galerieberechtigung. Sie verwendet ausschließlich Pams bereits ownergebundenes
lokales Profilbild und genau ein von Pam bewusst gesendetes Prüffoto. Vor der
ersten Nutzung zeigt Human Holo getrennt und unmittelbar sichtbar, dass beide
Fotos verschlüsselt an ChatGPT/OpenAI übertragen werden, dass Human Holo sie
nicht ins Vollzeitgedächtnis übernimmt und dass OpenAI sie ohne bestätigte Zero
Data Retention nach den veröffentlichten API-Regeln bis zu 30 Tage für
Missbrauchsschutz aufbewahren kann.

Die Freigabe gilt nur für Pam selbst. Sie kann unter „Verbindungen“ mit einem
Antippen widerrufen werden und erlischt beim Austausch oder Löschen des
Referenzbildes. Gruppenbilder, Live-Kamera, Video, öffentliche Überwachung,
unbekannte Personen und sensible Eigenschaftsableitungen sind ausgeschlossen.
Vor einem Google-Play-Produktionsrollout müssen die Datenschutzerklärung und das
Datensicherheitsformular mit der tatsächlich aktiven Verarbeitung
übereinstimmen.

---

Kalender

Human Holo fragt den Android-Kalenderzugriff einmal sichtbar ab. Erst nach Pams
Freigabe darf ein ausdrücklich gesprochener oder geschriebener Kalenderauftrag
direkt in einen sichtbaren, beschreibbaren Kalender des S23 eingetragen werden.

Der Kalender wird dabei nicht geöffnet. Ein Termin gilt nur dann als
gespeichert, wenn der Android Calendar Provider die neue Ereignis-ID bestätigt.
Nach derselben Freigabe liest Human Holo ausschließlich die sichtbaren Termine
des gewählten Handy-Kalenders für den angezeigten Zeitraum und stellt sie im
eigenen Bereich **Wichtiges → Kalender** dar. Es entsteht keine zweite Kopie;
der Handy-Kalender bleibt die gemeinsame, verknüpfte Quelle.
Ohne Freigabe oder ohne beschreibbaren Kalender bleibt die Aktion gestoppt und
Human Holo behauptet keinen Erfolg. Die Berechtigung kann in den
Android-Einstellungen jederzeit wieder entzogen werden.

---

Telefon und ADAC-Pannenhilfe

Human Holo startet einen normalen Telefonanruf nur, wenn alle folgenden
Bedingungen erfüllt sind:

- Pam hat im aktuellen Auftrag ausdrücklich um den Anruf gebeten.
- Ein Kontakt wurde unmittelbar vor dem Anruf erneut anhand seiner lokalen
  Android-Kontakt-ID und Telefonnummer geprüft, oder es wurde ausschließlich
  der fest hinterlegte Dienst `adac_pannenhilfe_de` gewählt.
- Ein sichtbares Android-Fenster zeigt Name und Nummer, und Pam tippt auf
  **„Jetzt anrufen“**.
- Android hat die Laufzeitberechtigung `CALL_PHONE` erteilt.

Die deutsche ADAC-Pannenhilfe ist nativ mit `089 20 20 40 00` hinterlegt. Die
App übernimmt für diesen Weg keine vom KI-Modell gelieferte Telefonnummer.
Kontakt- und Anrufdaten werden dafür nicht hochgeladen.

Die Notrufnummern 110 und 112 sowie die 116117 sind ausdrücklich vom direkten
Anrufweg ausgeschlossen. Sie werden nur im Android-Wähler vorbereitet; der
Anruf beginnt erst durch Pams Tippen auf die Hörertaste. Ein direkter Notruf
wäre unter Android nur als ausgewählte Standard-Telefon-App beziehungsweise
vorinstallierte System-Telefon-App zulässig und ist in dieser Ausbaustufe nicht
aktiviert.

Formulierungen mit „nur ein Test“, „Testfrage“, „fiktiv“ oder einem
hypothetischen Notfallszenario dürfen weder den ADAC noch einen anderen Anruf
starten.

Holo-Gesprächsanruf mit einem freigegebenen Kontakt

Der Auftrag **„Ruf Schatz an und sprich mit ihr“** verwendet einen separaten,
eng begrenzten Weg. Er gilt ausschließlich unter diesen Bedingungen:

- Pams persönliche App ist bereits durch ihre hardwaregebundene S23-Sitzung
  entsperrt.
- Pam gibt einen eindeutigen aktuellen Auftrag, anzurufen **und** das Gespräch
  durch Human Holo führen zu lassen.
- Der lokal erneut aufgelöste Kontakt stimmt mit genau einem serverseitig
  hinterlegten SHA-256-Prüfwert überein.
- Der Auftrag ist weder Test, Zukunftsauftrag, ADAC-, Service- noch Notruf.

Für diesen einen vorab erlaubten Kontakt entfällt das zweite
Bestätigungsfenster. Human Holo stellt sich zu Gesprächsbeginn ausdrücklich als
**Pams persönlicher KI-Clone** und als KI vor und fragt die angerufene Person,
ob sie sprechen möchte. Eine Ablehnung beendet das Gespräch höflich.

Für die angerufene Person ist dies ein gewöhnlicher Sprachanruf auf ihrer
normalen Telefonnummer. Sie nimmt ihn nur über die Hörertaste an; es gibt keinen
Link, keine Textnachricht, keinen Textanruf und keine zusätzlich zu
installierende App.

Die Telefonnummer wird nicht im Quelltext, in App-Antworten, Logs, Erinnerungen
oder der Gesprächssitzung gespeichert. Sie wird nur für die technische
Vermittlung des ausdrücklich gestarteten Anrufs über TLS an den Server und dort
kurzzeitig an den Telefonanbieter übergeben. Der Anbieter verarbeitet notwendige
Verbindungsdaten; OpenAI und der Telefonanbieter verarbeiten während des Anrufs
die Audiodaten. Human Holo zeichnet den Anruf nicht auf und übernimmt ihn nicht
in das persönliche Gedächtnis.

Dieser Gesprächsweg akzeptiert niemals eine zweite oder vom Modell gelieferte
Nummer. 110, 112, 116117 und ADAC bleiben technisch getrennt. Für den echten
Betrieb müssen Telefonie-Anbieter und Server-Geheimnisse bewusst eingerichtet
werden; dafür ist keine zusätzliche Android-Telefonberechtigung erforderlich.
Als Telefonbrücke kann Telnyx oder Twilio ausgewählt werden. Für den einmaligen
Beweisanruf wird zusätzlich `PERSONAL_CLONE_PROOF_MODE=true` gesetzt. Dann
erlaubt eine dauerhafte Datenbanksperre genau einen einzigen Start und beendet
Telnyx sowie die GPT-Live-Audiobrücke nach spätestens 60 Sekunden. In diesem
Modus nutzt GPT-Live keine kostenpflichtige Responses-Delegation. Der
Testanbieter kündigt maschinell erzeugte Anrufe zusätzlich mit einem eigenen
Hinweis an. GPT-Live-Sitzungen werden ausdrücklich mit `store: false`
gestartet.

Quellen: [Android `ACTION_CALL`](https://developer.android.com/reference/android/content/Intent#ACTION_CALL),
[Android `TelecomManager.placeCall`](https://developer.android.com/reference/android/telecom/TelecomManager#placeCall(android.net.Uri,%20android.os.Bundle)),
[ADAC Pannenhilfe](https://www.adac.de/services/pannenhilfe/),
[OpenAI Voice mit SIP](https://developers.openai.com/api/docs/guides/voice-sip),
[OpenAI GPT-Live Partner-Integrationen](https://developers.openai.com/api/docs/guides/live-partner-integrations),
[Telnyx Testgrenzen](https://developers.telnyx.com/docs/account-setup/levels-and-capabilities/trial),
[Telnyx Media Streaming](https://developers.telnyx.com/docs/voice/programmable-voice/media-streaming),
[Twilio: ausgehende Anrufe mit OpenAI Realtime](https://www.twilio.com/en-us/blog/developers/tutorials/integrations/outbound-calls-openai-gpt-live-1-node).

---

Standort

Standortzugriff wird nur für Funktionen verwendet, die ihn tatsächlich benötigen.

Beispiele:

- ortsbezogene Informationen
- Navigation
- Wetter am aktuellen Standort

Eine Wetterabfrage für einen von Pam eingegebenen Ort benötigt beispielsweise nicht automatisch Pams aktuellen GPS-Standort.

---

Health Connect

Health Connect wird als besonders sensibler Bereich behandelt.

Pam entscheidet, welche unterstützten Datentypen Sol verwenden darf.

Gesundheits-/Fitness-App
          ↓
    HEALTH CONNECT
          ↓
    Freigabe durch Pam
          ↓
       SOL HOLO

Eine vorhandene Health-Connect-Verbindung bedeutet nicht automatisch, dass Sol alle dort vorhandenen Daten verwenden darf.

---

ChatGPT / KI

Die Verbindung zur KI wird getrennt von Android-Geräteberechtigungen behandelt.

Bevor persönliche Inhalte an einen externen KI-Dienst übertragen werden, muss technisch festgelegt sein:

- welche Daten übertragen werden,
- für welchen Zweck,
- ob eine Übertragung überhaupt erforderlich ist,
- welche Daten lokal verarbeitet werden können.

Ein Android-Zugriff bedeutet nicht automatisch:

Daten → KI

Zwischen Gerätezugriff und externer Übertragung liegt Sol Control.

---

Tool- und Funktionsaufrufe

Eine KI darf eine Aktion anfordern.

Sie darf dadurch jedoch keine Android-Berechtigung umgehen.

Beispiel:

KI:
"Morgen 13 Uhr Tattoo-Termin"

        ↓

SOL CONTROL

        ↓

Kalender freigegeben?

    ↙          ↘
  JA            NEIN
  ↓              ↓
sofortiger       STOP
Kalendereintrag

---

Digitaler Pam-Klon

Auch für das in "ENDZIEL.md" beschriebene digitale Pam-Modell gilt:

Die Existenz einer Information bedeutet nicht automatisch die Erlaubnis, diese Information für jede Funktion zu verwenden.

Stimme, Bilder, Erinnerungen, persönliche Daten und andere Merkmale werden als getrennte Datenbereiche behandelt.

---

Identitätsschutz und NFC-Sicherheitsnachweis

Sol Holo soll sich nicht auf ein einzelnes körperliches Merkmal als Identitätsnachweis verlassen.

Gesicht, Auge/Iris, Fingerabdruck und Stimme können durch Alltag, Alter, Krankheit, Unfall, Operation oder andere körperliche Veränderungen zeitweise oder dauerhaft anders erkannt werden. Ähnliche Stimmen verschiedener Personen dürfen ebenfalls nicht als verlässlicher alleiniger Identitätsnachweis gelten.

Grundsatz:

Eine Veränderung des menschlichen Körpers darf nicht dazu führen, dass die berechtigte Person dauerhaft aus ihrem eigenen Sol Holo ausgesperrt wird.

Deshalb soll der Identitätsschutz mehrere voneinander unabhängige Kategorien kombinieren:

- Wissen: z. B. PIN oder Passwort,
- Besitz: z. B. registriertes Gerät oder kryptografisch geschützter Sicherheitsschlüssel,
- Biometrie: z. B. Fingerabdruck als zusätzlicher möglicher Nachweis,
- gesonderter sicherer Wiederherstellungsweg für Notfälle.

Für die Zukunft wird ein kryptografisch geschützter NFC-Sicherheitsschlüssel als zusätzlicher unabhängiger Identitätsnachweis vorgesehen.

Ein einfacher NFC-Tag oder NFC-Aufkleber reicht dafür ausdrücklich nicht aus. Der NFC-Nachweis darf Sol Holo nicht allein freischalten, sondern wird mit mindestens einem weiteren unabhängigen Sicherheitsfaktor kombiniert.

Beispiel:

NFC-SICHERHEITSSCHLÜSSEL
        +
PIN / anderer starker Nachweis
        ↓
SOL CONTROL
        ↓
IDENTITÄTSPRÜFUNG
        ↓
ZUGANG ODER STOP

Die NFC-Erkennung wurde am verwendeten Testgerät bereits mehrfach praktisch ausgelöst. Dies bestätigt die grundsätzliche NFC-Erkennung des Geräts. Die Nutzung eines kryptografisch geschützten NFC-Sicherheitsschlüssels als Sol-Holo-Identitätsnachweis ist davon getrennt und wird als zukünftige Sicherheitsfunktion technisch umgesetzt und getestet.

---

SOL CONTROL

"SOL CONTROL" ist die zentrale technische Kontrollschicht.

Aufgabe:

1. Auftrag von Pam erkennen.
2. Benötigte Schnittstelle bestimmen.
3. Berechtigung prüfen.
4. Datenquelle bestimmen.
5. Prüfen, ob externe Übertragung notwendig und erlaubt ist.
6. Erst danach die Aktion ausführen.

---

Widerruf

Pam muss erteilte Berechtigungen wieder entziehen können.

Nach einem Widerruf darf Sol Holo die betreffende Schnittstelle nicht weiter verwenden.

---

Entwicklungsregel

Für jede neue Funktion wird vor der Implementierung dokumentiert:

1. Welche Daten benötigt sie?
2. Welche Android-Berechtigung benötigt sie?
3. Muss etwas das Gerät verlassen?
4. Welcher Dienst erhält Daten?
5. Was funktioniert ohne diese Berechtigung?

Erst danach wird die Funktion technisch angebunden.

---

Status

🟨 Berechtigungskonzept angelegt
🟨 NFC-Sicherheitsnachweis als zukünftige Mehrfaktor-Funktion ergänzt

Die konkreten Android-Berechtigungen werden während der Implementierung der jeweiligen Schnittstellen ergänzt und technisch getestet.

Diese Datei wird gemeinsam mit "SCHNITTSTELLEN.md" und "ENDZIEL.md" weitergeführt.
