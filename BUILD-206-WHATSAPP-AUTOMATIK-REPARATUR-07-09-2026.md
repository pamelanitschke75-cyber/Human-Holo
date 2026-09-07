# Sol Holo – WhatsApp-Automatik nach S23-Praxistest repariert

**Datum:** 07.09.2026  
**Auslöser:** Praxistest von Pam auf dem Samsung Galaxy S23  
**Bereich:** Ökosystem 2.0 · WhatsApp-Automatik

## Beobachtung im Praxistest

Pam öffnete Sol Holo manuell, weil sie wegen der neben ihr schlafenden Steffi
extrem leise sprach und der Wake-up deshalb nicht reagierte. Sol Holo verstand
den WhatsApp-Auftrag an den als **„Schatz ❤️“** gespeicherten Kontakt und öffnete
den richtigen Chat mit dem Nachrichtentext. Der abschließende Sendetipp wurde
jedoch nicht automatisch ausgeführt.

Der leise Wake-up und der fehlende WhatsApp-Sendeklick sind zwei getrennte
Vorgänge. Diese Änderung repariert ausschließlich die WhatsApp-Automatik. Die
bestehende Wake-up- und Stimmfreigabe bleibt unverändert.

## Reparatur

- Ein ausdrücklicher WhatsApp-Auftrag behält auch im Realtime-Werkzeugweg das
  verpflichtende Merkmal `explicit_whatsapp_command: true`.
- Die Android-Bedienungshilfe wartet nicht mehr nur auf ein einzelnes
  WhatsApp-Fensterereignis, sondern prüft den einmaligen Auftrag bis zum Ablauf
  kontrolliert erneut.
- Die aktuelle WhatsApp-Senden-Schaltfläche wird über ihre feste WhatsApp-ID
  oder eine eindeutige deutsche/englische Beschriftung erkannt. Wenn nur das
  umgebende Bedienelement klickbar ist, wird genau dieses verwendet.
- Kontaktbeschreibungen wie
  **„Schatz ❤️, tippe hier, um Kontaktinfos anzuzeigen“** werden sicher dem
  exakt ausgewählten Kontakt zugeordnet.
- Zusätzliche Fenster-, Fokus- und Texteingabeereignisse helfen dabei, erst
  nach vollständig geladenem WhatsApp-Chat zu senden.

## Unveränderte Schutzgrenzen

- nur nach einem aktuellen, ausdrücklichen WhatsApp-Sendeauftrag von Pam
- nur ein eindeutiger lokaler Kontakt
- nur `com.whatsapp` oder `com.whatsapp.w4b`
- Empfänger und vollständiger Nachrichtentext müssen sichtbar passen
- genau ein kurzlebiger Einmalauftrag; Ablauf nach 30 Sekunden
- kein Speichern oder Hochladen sichtbarer WhatsApp-Inhalte
- kein Eingriff in Wake-up, Stimmprofil, App-Identität oder Signatur

## Verbindlicher Testbefehl

> Schicke Schatz eine WhatsApp mit dem Text: Ich liebe dich

Erwartung: WhatsApp öffnet den Kontakt **„Schatz ❤️“** und betätigt nach der
sichtbaren Empfänger- und Textprüfung selbstständig die Senden-Schaltfläche.
