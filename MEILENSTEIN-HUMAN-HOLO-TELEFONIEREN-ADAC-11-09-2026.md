# MEILENSTEIN – Human Holo telefoniert und ruft die ADAC-Pannenhilfe

**Datum:** 11.09.2026

**Status:** KONTAKTANRUF AUF PAMS SAMSUNG GALAXY S23 PRAKTISCH BESTANDEN ✅

**ENTSCHEIDUNG & PROJEKTINHABERIN:** PAMELA CHRISTINA NITSCHKE

**OWNER-GEBUNDEN:** Pamela Christina Nitschke

## Ziel

Human Holo soll nach einem ausdrücklichen Auftrag nicht nur eine Nummer im
Telefon-Wähler vorbereiten, sondern einen normalen Kontakt oder die deutsche
ADAC-Pannenhilfe direkt anrufen. Die letzte Entscheidung bleibt bei Pam.

## Umgesetzter Ablauf

1. Pam sagt oder schreibt einen eindeutigen aktuellen Auftrag, zum Beispiel
   „Ruf Steffi an“ oder „Ruf den ADAC an“.
2. Bei Kontakten sucht Human Holo ausschließlich im lokalen
   Android-Telefonbuch und prüft Kontakt-ID und Telefonnummer unmittelbar vor
   dem Anruf erneut.
3. Beim ADAC akzeptiert die native Android-Schicht nur den festen Dienst
   `adac_pannenhilfe_de`. Die App verwendet dafür die offizielle deutsche
   Pannenhilfe-Nummer `089 20 20 40 00`; eine KI kann keine andere Nummer
   einschleusen.
4. Android zeigt Name und Nummer in einem sichtbaren Bestätigungsfenster.
5. Erst Pams Tipp auf **„Jetzt anrufen“** darf genau diesen einen direkten
   Anruf starten. Beim ersten Mal fragt Android zusätzlich nach der
   Berechtigung `CALL_PHONE`.
6. Ohne Auftrag, Bestätigung oder Android-Freigabe wird kein Anruf gestartet.

## Notrufgrenze

110, 112 und 116117 bleiben absichtlich im sicheren Android-Wähler. Human Holo
startet diese Nummern in der aktuellen Ausbaustufe nicht direkt. Unter Android
darf ein Notruf über `TelecomManager.placeCall` nur von der ausgewählten
Standard-Telefon-App oder einer vorinstallierten System-Telefon-App ausgeführt
werden. Human Holo übernimmt diese systemweite Telefon-App-Rolle derzeit nicht.

## Schutz vor Testanrufen

„Nur ein Test“, „Testfrage“, „Testszenario“, „kein echter Notfall“ und
„fiktiv“ sperren die lokale ADAC- und Notrufaktion. Fragen wie „Kannst du den
ADAC anrufen?“ oder „Was macht der ADAC bei einer Panne?“ starten ebenfalls
keinen lokalen Anruf. Ein Realtime-Werkzeug darf nur bei einem ausdrücklichen
aktuellen Auftrag verwendet werden und erreicht trotzdem immer noch das native
Bestätigungsfenster.

## Datenschutz

- Das Telefonbuch bleibt auf Pams Gerät.
- Kontakt- und Telefonnummern werden für diesen Anrufweg nicht hochgeladen.
- `CALL_PHONE` wird erst im bestätigten Anrufablauf angefragt und kann in den
  Android-App-Einstellungen jederzeit widerrufen werden.
- Verweigert Pam die Freigabe, bleiben die anderen Funktionen von Human Holo
  nutzbar.

## Bestätigter Praxistest

Pam installierte das signierte Update auf ihrem Samsung Galaxy S23. Der normale
Kontaktanruf zeigte das vorgesehene Bestätigungsfenster; nach Pams Tipp auf
**„Jetzt anrufen“** öffnete sich der echte ausgehende Anruf zum ausgewählten
Kontakt. Damit ist dieser Ablauf praktisch bestätigt.

Ein echter ADAC-Anruf wird ohne Panne bewusst nicht als Test durchgeführt. 110,
112 und 116117 bleiben weiterhin vollständig vom direkten Anrufweg getrennt.

## Verifizierte Quellen

- [Android `Intent.ACTION_CALL`](https://developer.android.com/reference/android/content/Intent#ACTION_CALL)
- [Android-Berechtigung `CALL_PHONE`](https://developer.android.com/reference/android/Manifest.permission#CALL_PHONE)
- [Android `TelecomManager.placeCall`](https://developer.android.com/reference/android/telecom/TelecomManager#placeCall(android.net.Uri,%20android.os.Bundle))
- [ADAC Pannenhilfe und Telefonnummern](https://www.adac.de/services/pannenhilfe/)
