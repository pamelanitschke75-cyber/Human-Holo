# Pam‑Holo · verbindliche Zugriffs- und Fingerprintgrenze

**Stand:** 17.09.2026
**Entscheidung:** Pamela Christina Nitschke
**Geltungsbereich:** ausschließlich Pams eigenes persönliches Pam’s Holo
**Keine allgemeine Freigabe:** Das offizielle Human Holo bleibt von dieser
persönlichen Entscheidung unberührt.

## Verbindliche Grundregel

Pams ausdrückliche Festlegung lautet: **„Ich lass mir das von niemandem mehr
nehmen!“** Pam bleibt zu Lebzeiten alleinige Ownerin ihres persönlichen Pam
Holo. Betreiber-, Verwaltungs-, Entwicklungs- oder sonstige Zugriffsrechte
begründen weder Mitinhaberschaft noch persönlichen Zugang.

„Hey Pam“ ist ausschließlich der Weckruf: Er kann Pam Holo wecken und das
Zuhören starten, ist aber weder Passwort noch Entsperrung. Das lokale
Stimmprofil schützt den Weckruf und die Sprecherzuordnung; es sperrt Pam nicht
aus ihrer App aus.

Auf Pams für `pam-sol` registriertem Android-Gerät wird die normale
App-Oberfläche nach der lokalen Geräteprüfung direkt geöffnet. Dafür werden
**weder ein Prüfsatz noch ein Fingerprint** verlangt. Auch eine vorübergehend
nicht erreichbare Online-Sitzung darf die lokale Oberfläche nicht sperren.
Eine kurzlebige, gerätegebundene Online-Sitzung wird getrennt im Hintergrund
aufgebaut, sobald der geschützte Serverweg erreichbar ist.

Ein Fingerprint wird erst verlangt, wenn Pam einen besonders geschützten
Bereich verwendet. Alltagssitzung und geschützte Sitzung sind technisch
getrennt. Beim Verlassen der App werden beide wieder verworfen.

## Auf Pams registriertem Gerät offen

Zur normalen Alltagsnutzung gehören insbesondere:

- mit Sol sprechen oder schreiben,
- Fragen stellen und aktuelle Informationen abrufen, zum Beispiel das Wetter,
- die persönliche Einkaufsliste ergänzen, ändern, abhaken oder bereinigen,
- persönliche Alltagsnotizen verwenden,
- auf Pams Auftrag eine reine Textnachricht über WhatsApp vorbereiten und über
  den vorhandenen bestätigten Versandweg senden,
- persönliche Telefonate, SMS, Kalendereinträge und normale Smart-Home-Aktionen
  über ihre jeweils bereits vorhandenen Bestätigungswege ausführen,
- mit Sol über allgemeine Gesundheitsthemen sprechen, soweit der eng begrenzte
  private Medizintest und dessen medizinische Sicherheitsgrenzen dies erlauben,
- weitere normale Alltagsaufgaben innerhalb der bereits freigegebenen
  Holo-Funktionen.

Diese Punkte sind **Beispiele und keine abschließende Liste**. Entscheidend ist
die Grenze zwischen normaler Alltagsnutzung und den nachfolgend geschützten
Inhalten oder Systemeinstellungen.

Eine WhatsApp-Nachricht behält ihre vorhandene sichtbare Bestätigung von
Empfänger und Inhalt. Diese inhaltliche Bestätigung ist kein Fingerprint und
wird durch die Zugriffsregel weder entfernt noch ersetzt.

## Nur nach Fingerprint

Vor dem Öffnen, Übertragen, Auswerten, Speichern oder Verändern der folgenden
Inhalte ist Pams gesonderte Fingerprintfreigabe erforderlich:

- Bilder und Fotos,
- Videos,
- Scans,
- Dateien und Unterlagen,
- Dokumente und Medienanhänge,
- geschäftliche Angelegenheiten oder Handlungen mit geschäftlicher Wirkung,
- System- und Sicherheitseinstellungen,
- Konto-, Verbindungs- und Berechtigungseinstellungen,
- Stimmprofil-, Geräte- und medizinische Berechtigungseinstellungen,
- der tatsächliche Abruf von Health-Connect-Gesundheitsdaten,
- Sicherung, Export, Import und Wiederherstellung.

Beispiele für geschäftliche Angelegenheiten sind geschäftliche Nachrichten und
E-Mails, Verträge, Rechnungen, Angebote, Arbeitsdateien oder Handlungen mit
geschäftlicher Außenwirkung. Auch diese Beispiele sind nicht abschließend.

Eine reine Text-WhatsApp gehört zur normalen Alltagsnutzung. Sobald ein Bild,
Video, Dokument oder anderer geschützter Anhang verwendet wird, gilt die
Fingerprint-Stufe.

Ein allgemeines medizinisches Gespräch innerhalb des privaten Testumfangs kann
auf Pams registriertem Gerät stattfinden. Ein Medikamentenfoto, der tatsächliche
Health-Connect-Datenabruf und jede Änderung medizinischer Berechtigungen bleiben
zusätzlich fingerprintgeschützt. Die Einzelfreigabe für das konkrete
Medikamentenbild bleibt daneben bestehen.

## Fortgeltende Sicherheitsgrenzen

- Die Fingerprintfreigabe hebt keine medizinischen, rechtlichen,
  geschäftlichen oder sonstigen Verbote auf. Sie ist eine zusätzliche
  Zugangsvoraussetzung und keine fachliche Freigabe.
- Sicherheitskritische Außenhandlungen behalten ihre eigenen sichtbaren
  Bestätigungen.
- Pams registrierte App öffnet den normalen Alltag auf ihrem entsperrten Gerät
  direkt. Ein Fingerprint ist keine Identitätsumschaltung und bleibt nur die
  zusätzliche Freigabe für die ausdrücklich geschützten Bereiche.
- Android liefert der App keine Fingerabdruckdaten. Für den geschützten Bereich
  fordert die App starke Android-Biometrie ohne Geräte-PIN-Fallback an.
- Eine spätere NFC-Uhr darf den persönlichen Faktor nur nach echter
  kryptografischer Registrierung, bewusster Bestätigung und bestandenem
  Endgerätetest ersetzen. Ein einfacher NFC-Tag genügt niemals.
- Zu Pams Lebzeiten erhält keine andere Person Zugriff auf Pam’s Holo. Das gilt
  ausdrücklich auch für Steffi.

## Persönliche und offizielle Freigabe bleiben getrennt

Diese Regel gilt nur für `ownerId=pam-sol`, `speakerId=pam` und Pams eigene
registrierte Android-App. Sie ist keine Freigabe für das allgemeine oder
offizielle Human Holo. Dessen Erweiterungen und insbesondere medizinische
Freigaben bleiben bis zur dokumentierten anwaltlichen Prüfung geschlossen.

## Technischer Nachweis im Repository

- Zugriffsregel: `modules/pam-holo-access-policy.mjs`
- lokale Weckruf- und Sprecherprüfung ohne Entsperrfunktion:
  `android-native/SolSpeakerIdentityPlugin.java`
- Weckrufübergabe: `android-native/HeyHoSolService.java`
- Fingerprint- und Geräteschutz: `android-native/SolAccessSecurityPlugin.java`
- App-Sitzungen: `modules/trusted-app-session.mjs` und
  `www/trusted-app-session.mjs`
- App-Grenze: `www/app-lock-bootstrap.mjs` – Pams registriertes Gerät öffnet
  den Alltag lokal; „Hey Pam“ bleibt ausschließlich der Weckruf. Eine
  vorübergehend nicht erreichbare Online-Sitzung sperrt die App-Oberfläche
  nicht erneut.
- automatisierte Nachweise: `tests/pam-holo-access-policy.test.mjs`

© 2026 Pamela Nitschke
