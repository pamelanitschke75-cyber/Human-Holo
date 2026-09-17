# Pam’s Holo · Gesichtsschutz bei der Live-Umgebungskamera

**Stand:** 17.09.2026

**Aktive technische Geltung:** ausschließlich Pamela Christina Nitschke und
ihre private, ownergebundene Pam-Holo-Instanz – ihr eigenes persönliches
digitales Ich: **„Ich, ich und ich!“**

**Offizielles Human Holo:** vollständig im anwaltlichen Hold

## Verbindliche Entscheidung

Bei der ausdrücklich von Pam gestarteten Live-Umgebungskamera werden erkannte
Gesichter anderer Menschen auf Pams Gerät verpixelt, bevor ein Einzelbild die
App verlässt. Die unveränderte Kameravorschau bleibt ausschließlich lokal auf
Pams Gerät und wird nicht als Rohbild an OpenAI, Render, Cloudflare oder einen
anderen externen Dienst übertragen oder dauerhaft gespeichert.

Diese Regel schützt Erwachsene und Kinder gleichermaßen. Der bestehende
nicht übersteuerbare Kinderschutz mit Priorität 1 bleibt vorrangig und gilt
zusätzlich; die Gesichtspixelung ersetzt keine Kinderschutzprüfung.

## Technische Schutzgrenzen

- Die Gesichtssuche läuft lokal mit den bereits in der App enthaltenen
  MediaPipe-Dateien und einem lokalen Modell. Für die Gesichtssuche wird kein
  externer Gesichtsdienst aufgerufen.
- Die Funktion bildet keine Gesichtskennung und keine biometrische Vorlage,
  benennt keine Person und versucht keine Identifizierung oder
  Wiedererkennung.
- Aus den kurzzeitig im Arbeitsspeicher erkannten Landmarken werden nur
  vergrößerte Pixelbereiche berechnet. Landmarken und unverpixelte
  Live-Einzelbilder werden von dieser Funktion nicht gespeichert.
- Die Regel greift, sobald die Rück- beziehungsweise Umgebungskamera tatsächlich
  aktiv ist oder von Pam angefordert wurde. Dadurch bleibt sie auch bei einer
  ungenauen Kamera-Rückmeldung des Geräts aktiv.
- Erst nach der lokalen Bearbeitung darf das Bild in die laufende
  Realtime-Unterhaltung gelangen. Das gilt ebenso für die geordneten
  Einzelbilder eines Gebärdensprachtests.
- Kann das lokale Schutzmodul oder sein Modell nicht geladen werden, schlägt
  die Prüfung fehl oder kann das Bild nicht sicher bearbeitet werden, wird die
  Umgebungskamera gestoppt. In diesem Fehlerfall wird kein ungeschütztes Bild
  gesendet (**fail-closed**).
- Der Status in der App zeigt sichtbar an, dass erkannte Gesichter lokal
  verpixelt werden.

## Ehrliche Erkennungsgrenze

Automatische Gesichtserkennung ist keine Garantie, jedes Gesicht in jeder
Situation zu finden. Sehr kleine, verdeckte, unscharfe, seitlich gedrehte oder
schlecht beleuchtete Gesichter können übersehen werden. Deshalb behauptet Pam
Holo keine hundertprozentige Anonymisierung. Der technische Fail-closed-Weg
schützt vor dem Ausfall der Schutzfunktion; er kann jedoch kein Gesicht
blockieren, das das lokale Modell fälschlich gar nicht erkannt hat.

Die Live-Umgebungskamera darf deshalb nicht als Ersatz für Einwilligung,
Rücksichtnahme oder rechtliche Prüfung verwendet werden. In sensiblen
Situationen wird die Kamera nicht auf andere Menschen gerichtet oder sofort
beendet.

## Strikte Trennung

Diese Aktivierung gilt nur für Pams persönliches Pam Holo. Sie aktiviert weder
Live-Bilder noch Gesichtsanalyse im offiziellen Human Holo. Eine spätere
Übernahme allgemeinen Codes setzt die dokumentierte anwaltliche sowie eine
gesonderte technische Freigabe voraus. Pams private Bilder, Videos,
Gespräche, Identitätsdaten und sonstige persönliche Inhalte dürfen niemals in
das offizielle Human Holo übertragen werden.
