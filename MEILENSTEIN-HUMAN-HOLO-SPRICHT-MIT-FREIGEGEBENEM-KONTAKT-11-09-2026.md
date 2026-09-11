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

Für Steffi ist das ein gewöhnlicher **Sprachanruf auf ihre normale
Telefonnummer**. Sie muss nur den Anruf annehmen. Sie öffnet keinen Link,
installiert keine App und verwendet keinen Textanruf.

## Technischer Ablauf

1. Die ownergebundene App erkennt ausschließlich einen eindeutigen aktuellen
   Auftrag zum Anrufen **und** selbstständigen Sprechen.
2. Sie löst den Kontakt erneut im lokalen Android-Telefonbuch auf und überträgt
   die Nummer einmalig über TLS an den Human-Holo-Server.
3. Der Server normalisiert die Nummer und vergleicht ihren SHA-256-Wert
   zeitkonstant mit genau einem erlaubten Prüfwert.
4. Nur bei Übereinstimmung startet die ausgewählte Telefonbrücke den
   ausgehenden normalen Sprachanruf.
5. Ein einmaliger, kurzlebiger WebSocket-Schlüssel verbindet den Audiokanal mit
   OpenAI GPT-Live. Nach Annahme stellt sich Human Holo transparent vor und
   wartet auf Steffis Zustimmung.

Der zusätzliche Audioweg ist notwendig, weil ein normaler Telekom-Mobilfunk-
vertrag zwar Menschen miteinander telefonieren lässt, einer gewöhnlichen
Android-App aber keinen programmierbaren Zugang zum Mobilfunk-Audiokanal gibt.
OpenAI startet außerdem selbst keinen ausgehenden Anruf ins Telefonnetz.

Für den ersten Test ist deshalb Telnyx als auswählbare Telefonbrücke
implementiert. Telnyx stellt den normalen Telefonanruf her und überträgt beide
Audiorichtungen im PCMU-Telefonformat; Denken und Stimme bleiben bei OpenAI
GPT-Live. Der bereits implementierte Twilio-Weg bleibt als alternative
Telefonbrücke erhalten.

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
- `OPENAI_API_KEY`
- `PERSONAL_CLONE_TELEPHONE_BRIDGE=telnyx`
- `TELNYX_API_KEY`
- `TELNYX_CONNECTION_ID`
- `TELNYX_PHONE_NUMBER` oder `TELNYX_FROM_NUMBER`

Alternativ kann der bestehende Twilio-Weg mit `twilio`,
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` und `TWILIO_PHONE_NUMBER` aktiviert
werden.

## Erster Telefon-Test ohne neue Telefonie-Zahlung

Der Telnyx-Testzugang enthält laut Anbieter 5 US-Dollar Testguthaben. Er erlaubt
ausgehende Anrufe nur an **eine verifizierte Nummer** und höchstens zehn Minuten
pro Anruf. Genau diese Grenzen setzt Human Holo zusätzlich im Code. Im
Testzugang spielt Telnyx vor Holos transparenter Einleitung einen englischen
Hinweis auf einen automatisierten Anruf ab.

Für den ausschließlich mit Steffi geplanten Test muss Steffi die Verifizierung
ihrer eigenen Nummer selbst und ausdrücklich bestätigen. Falls der Anbieter
diese Verifizierung oder eine deutsche Test-Absendernummer nicht akzeptiert,
wird die Beschränkung nicht umgangen. Die Aktivierung einer lokalen
Absendernummer hängt von Verfügbarkeit, Testguthaben und deutschen
Nachweispflichten ab; eine Testnummer kann ohne Upgrade später zurückgenommen
werden.

Es wird durch den Code weder ein Konto eröffnet noch etwas bestellt, bezahlt
oder kostenpflichtig hochgestuft. Verlangt der Anbieter vor dem Test eine
Zahlung statt der ausgewiesenen Testgutschrift, wird angehalten. Unabhängig von
der Telefonbrücke wird GPT-Live nach Nutzungsdauer berechnet; vorhandenes
OpenAI-API-Guthaben kann dafür genutzt werden, aber ein Telekom-Vertrag deckt
diese KI-Verarbeitung nicht ab. Dauerhaft kostenlose KI-Telefonate werden daher
nicht behauptet.

Bis die geheimen Werte bewusst eingerichtet und ein echter Anruf mit Steffi
bestanden ist, bleibt der Serverweg sicher geschlossen und der Status lautet
weiterhin nicht „live praktisch bestanden“.

## Verifizierte Quellen

- [OpenAI: Voice Agents mit SIP](https://developers.openai.com/api/docs/guides/voice-sip)
- [OpenAI: Partner-Integrationen für Telefonie](https://developers.openai.com/api/docs/guides/live-partner-integrations)
- [OpenAI: GPT-Live – Ablauf und Abrechnung](https://developers.openai.com/api/docs/guides/live)
- [Telnyx: Testguthaben und Testgrenzen](https://developers.telnyx.com/docs/account-setup/levels-and-capabilities/trial)
- [Telnyx: Testkonto verwenden](https://developers.telnyx.com/docs/account-setup/using-trial-account)
- [Telnyx: bidirektionales Media Streaming](https://developers.telnyx.com/docs/voice/programmable-voice/media-streaming)
- [Telnyx: ausgehenden Anruf starten](https://developers.telnyx.com/api-reference/call-commands/dial)
- [Twilio: ausgehende Anrufe mit OpenAI GPT-Live](https://www.twilio.com/en-us/blog/developers/tutorials/integrations/outbound-calls-openai-gpt-live-1-node)
