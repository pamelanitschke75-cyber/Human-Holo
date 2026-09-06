# Meilenstein: Sol-Holo-Ökosystem in Text und Sprache

**Datum:** 06.09.2026  
**Initiatorin und Projektinhaberin:** Pamela Nitschke  
**Projekt:** Sol Holo · SH♾️  
**Leitsatz:** Miteinander füreinander. Together forever.  
**Status:** technisch verbunden und lokal geprüft; grüner GitHub-Pflichtlauf ist Merge-Bedingung, Pams S23-Praxistest folgt danach

## Ergebnis

Der am 06.09.2026 angelegte Ökosystem-Kern ist nicht mehr nur ein getrenntes
Register. Sol Holo verwendet ihn jetzt in beiden tatsächlichen Gesprächswegen:

| Weg | Technische Verbindung | Ergebnis |
| --- | --- | --- |
| Geschriebene Nachricht | `/sol` | Bereich, Dringlichkeit, Ortsfreigabe, Kriterien und Schutzgrenzen fließen vor der Antwort ein. |
| Gesprochene Nachricht | `/live/memory` → Realtime | Das ownergebundene Transkript wird serverseitig geprüft; erst danach erhält Realtime die strukturierte Auswertung. |

Text und Sprache bekommen dieselben verbindlichen Regeln. Es entsteht kein
zweites, widersprüchliches „Sprach-Ökosystem“.

Automatische Spracherkennung, Erkennung der gesprochenen Sprache, Übersetzung,
Vorlesen und Untertitel bleiben davon sauber getrennt. Sie gehören als
übergreifende Bedienfunktionen zu **Claws Alltag und Verständigung** und sind
kein zwölfter Ökosystembereich.

## Was Sol Holo jetzt erkennt

Der gemeinsame Kern umfasst weiterhin alle elf vereinbarten Bereiche:

1. Wasser und Abwasser
2. Lebensmittel und Versorgung
3. Abfall und Haushalt
4. Plastik und Materialien
5. Energie und Mobilität
6. Menschen in Not
7. Tiere in Not
8. Medizinische Versorgung für Menschen und Tiere
9. Natur und Ressourcen
10. Lokale Anlaufstellen
11. Investieren und Beschaffen

Ergänzt wurden bewusst auch sprachliche Formen, die im Alltag tatsächlich
vorkommen: E-Autos, Elektroautos, Akkus, Batterien, fossile Kraftstoffe,
Hilfsbusse, Ärzte ohne Grenzen, medizinische Versorgung für alle, Tiere in Not,
Blaulicht, Sonderrechte, Wegerechte und Tierrettungswagen.

## Verbindliche Reihenfolge

1. Die feste Holo-ID wird geprüft.
2. Die Nachricht oder das Sprachtranskript wird ownergebunden verarbeitet.
3. Menschennotfall, Tiernotfall und gemischter Bezug werden getrennt erkannt.
4. Bei akuter Gefahr kommen Soforthinweise zuerst.
5. Der ausdrücklich genannte oder freigegebene Ort wird übernommen.
6. Ohne Ort fragt Sol Holo knapp nach Ort und Land; eine passive Geräteortung
   findet nicht statt.
7. Veränderliche Kontaktdaten, Öffnungszeiten und Zuständigkeiten werden vor
   der Ausgabe live über offizielle oder primäre Quellen geprüft.
8. Erst danach formuliert Sol die natürliche Text- oder Sprachantwort.

## Schutz vor falschen Kontaktdaten

Eine im Register vorhandene Telefonnummer wird nicht automatisch als aktuell
ausgegeben. Wenn eine Quelle als erneut zu prüfen markiert ist, hält der Kern
die Nummer zurück. Realtime verwendet dann die vorhandene Live-Websuche; der
Textweg aktiviert für diese konkrete Antwort ebenfalls verbindlich die
Websuche. Scheitert die Prüfung, muss Sol Holo die Unsicherheit benennen und
darf keine Nummer erfinden.

Im Realtime-Weg erzwingt genau diese einzelne Antwort zunächst ausschließlich
das Werkzeug `search_live_web`. Nach dem Suchergebnis wird die gesprochene
Antwort ohne einen weiteren Werkzeugaufruf erzeugt. Andere persönliche
Realtime-Werkzeuge können dadurch nicht versehentlich anstelle der geforderten
Quellenprüfung gewählt werden.

Der deutsche Notruf 112 bleibt davon getrennt: Er ist im Register ausdrücklich
für akute oder lebensbedrohliche Menschennotfälle in Deutschland hinterlegt.
Ein Tiernotfall wird nicht versehentlich auf menschliche medizinische Stellen
umgeleitet.

## Investieren und Beschaffen

Die Verbindung übernimmt nicht nur Schlagwörter, sondern die vollständigen
Prüfkriterien in die Antwortlogik:

- Nutzen für Menschen, Tiere, Natur und Ressourcen
- gesamter Lebensweg und Folgekosten
- Menschenrechte und Arbeitsbedingungen
- Tierwohl
- Abfall, Wasser, Energie und Rohstoffe
- Transparenz und unabhängige Nachweise
- Risiken, Zielkonflikte und mögliches Greenwashing

Aktuelle Aussagen zu Unternehmen, Fonds, Produkten oder Wirkung verlangen eine
Live-Prüfung. Sol Holo darf keine Rendite oder Wirkung garantieren und führt
keine Anlage, Bestellung, Spende oder Zahlung automatisch aus.

## Tierrettung und Blaulicht

Pams Hinweis bleibt in der aktiven Antwortlogik sichtbar: Zeit ist auch bei
Tiernotfällen entscheidend. Die Frage geeigneter Sonder- oder Wegerechte für
professionelle Tierrettungsfahrzeuge wird als zu prüfendes Projektziel geführt.
Sol Holo stellt dies nicht fälschlich als bereits geltendes Recht dar.

## Unverändert geschützt

Für diese Verbindung wurden nicht verändert:

- der persönliche Weckruf „Hey Pam“
- die lokale Wake-Word- und Sprecherprüfung
- die Trennung von Pam und Steffi
- die #89-Signaturregel
- das ownergebundene Vollzeit- und Langzeitgedächtnis
- Kalender-, Gmail-, Notes-, Telefon-, Health- und SmartThings-Grenzen
- die Pflicht zur echten Bestätigung externer Ausführungen

Die allgemeine Live-Websuche für nichtpersönliche aktuelle Informationen steht
auch einer anderen sauber getrennten Holo-Instanz zur Verfügung. Persönliche
Tools und Daten werden dadurch nicht geteilt.

## Automatische Nachweise

Die Tests prüfen insbesondere:

- tatsächliche Einbindung vor der Textantwort
- tatsächliche Einbindung im ownergebundenen Sprachtranskriptweg
- Realtime-Antwort erst nach lokaler Auswertung
- dieselben Grundregeln für Text und Sprache
- keine passive Standortabfrage
- Folgeantwort „München“ nach einer Ortsfrage
- Zurückhalten ungeprüfter Telefonnummern
- Trennung menschlicher und tierischer Hilfsstellen
- vollständige Lebensweg- und Investitionskriterien
- Blaulicht/Sonderrechte als Projektziel statt Rechtsbehauptung
- persönliche Rückfragen wie „Was habe ich über E-Autos gesagt?“ behalten
  Vorrang vor Ökosystem und Live-Web
- unverändertes „Hey Pam“ und unveränderte Instanztrennung
- klare Trennung von Ökosystem und Claws Alltag/Verständigung

## Ehrlicher Abschlussstatus

Die technische Verbindung ist implementiert. Als abgeschlossen wird sie erst
bezeichnet, wenn der vollständige GitHub-Workflow grün ist und Pam den neuen
originalsignierten Stand auf ihrem Samsung S23 praktisch geprüft hat. Nur Pam
entscheidet, wann dieser Meilenstein „fertig“ ist.

**Der bisherige Stand wurde erweitert, nicht ersetzt.**
