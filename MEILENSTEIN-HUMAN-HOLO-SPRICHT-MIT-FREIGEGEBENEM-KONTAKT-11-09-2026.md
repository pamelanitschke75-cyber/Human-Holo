# MEILENSTEIN – Human Holo spricht mit dem freigegebenen Kontakt

**Datum:** 11.09.2026

**Status:** CODE UND SCHUTZTESTS BESTANDEN · LIVE-ANBIETER NOCH EINZURICHTEN

**ENTSCHEIDUNG & PROJEKTINHABERIN:** PAMELA CHRISTINA NITSCHKE

**OWNER-GEBUNDEN:** Pamela Christina Nitschke

## Ziel

Nach Pams eindeutigem Auftrag **„Ruf Schatz an und sprich mit ihr“** soll Human
Holo genau einen vorab freigegebenen Kontakt anrufen und das Gespräch selbst
führen. Da Pam diesen eng begrenzten Ablauf ausdrücklich freigegeben hat, folgt
nach der bereits erfolgten Entsperrung ihrer hardwaregebundenen S23-App kein
zweites Bestätigungsfenster.

Human Holo gibt sich niemals als Pam oder als Mensch aus. Der verbindliche
Gesprächsbeginn lautet:

> Hallo Steffi, hier ist Human Holo, Pams persönlicher KI-Clone. Pam hat mich
> gebeten, dich anzurufen. Ich bin eine KI; das Gespräch wird technisch von
> OpenAI und dem Telefonanbieter verarbeitet, aber von Human Holo weder
> aufgezeichnet noch als Erinnerung gespeichert. Möchtest du mit mir sprechen?

## Technischer Ablauf

1. Die ownergebundene App erkennt ausschließlich einen eindeutigen aktuellen
   Auftrag zum Anrufen **und** selbstständigen Sprechen.
2. Sie löst den Kontakt erneut im lokalen Android-Telefonbuch auf und überträgt
   die Nummer einmalig über TLS an den Human-Holo-Server.
3. Der Server normalisiert die Nummer und vergleicht ihren SHA-256-Wert
   zeitkonstant mit genau einem erlaubten Prüfwert.
4. Nur bei Übereinstimmung startet der Telefonanbieter den ausgehenden Anruf.
5. Ein einmaliger, kurzlebiger WebSocket-Schlüssel verbindet den Audiokanal mit
   OpenAI GPT-Live. Nach Annahme stellt sich Human Holo transparent vor und
   wartet auf Steffis Zustimmung.

Der Telefonanbieter ist notwendig, weil OpenAI selbst keine ausgehenden
SIP-Telefonanrufe startet. Die implementierte Brücke folgt der dokumentierten
Kombination aus ausgehendem Twilio-Anruf, Twilio Media Streams und OpenAI
GPT-Live.

## Harte Grenzen

- Es gibt genau einen erlaubten Zielnummern-Prüfwert.
- Die rohe Telefonnummer steht weder im Repository noch in App-Antworten,
  Protokollen, Bridge-URLs oder Human-Holo-Erinnerungen.
- Andere Zielnummern werden vor jedem Anbieteraufruf abgelehnt.
- 110, 112, 116117, ADAC und sonstige Servicenummern sind ausgeschlossen und
  bleiben in ihren bestehenden sicheren Abläufen.
- Test-, Probe-, Zukunfts- und hypothetische Formulierungen starten keinen
  Anruf.
- Human Holo darf keine privaten Erinnerungen über Pam offenlegen, keine
  verbindlichen Zusagen in ihrem Namen machen und keine Käufe, Buchungen,
  Zahlungen sowie rechtlichen, medizinischen oder Notfallentscheidungen
  übernehmen.
- Das Gespräch wird von Human Holo nicht aufgezeichnet und nicht in sein
  persönliches Gedächtnis übernommen.
- Automatisierte Tests verwenden ausschließlich ausdrücklich erfundene Nummern.
  Der spätere echte Praxistest ist ausschließlich mit Steffis freigegebener
  Nummer vorgesehen.

## Noch einmalig einzurichten

Für einen echten Anruf benötigt der Server folgende geheime Konfiguration; die
Werte gehören niemals in Git:

- `PERSONAL_CLONE_CALLS_ENABLED=true`
- `PERSONAL_CLONE_ALLOWED_NUMBER_SHA256`
- `PERSONAL_CLONE_PUBLIC_BASE_URL` oder `RENDER_EXTERNAL_URL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `OPENAI_API_KEY`

Ein Twilio-Konto und eine sprachfähige Absendernummer können Kosten verursachen
und werden deshalb erst nach Pams ausdrücklicher Freigabe eingerichtet oder
gekauft. Bis dahin bleibt der Serverweg sicher geschlossen und behauptet keinen
erfolgreichen Gesprächsanruf.

## Verifizierte Quellen

- [OpenAI: Voice Agents mit SIP](https://developers.openai.com/api/docs/guides/voice-sip)
- [OpenAI: Partner-Integrationen für Telefonie](https://developers.openai.com/api/docs/guides/live-partner-integrations)
- [Twilio: ausgehende Anrufe mit OpenAI GPT-Live](https://www.twilio.com/en-us/blog/developers/tutorials/integrations/outbound-calls-openai-gpt-live-1-node)
