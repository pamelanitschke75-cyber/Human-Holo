# Human Holo – Original Full Sync

Stand: 08.09.2026  
Status: Build #243 im Praxistest teilweise sichtbar, aber wegen fehlender
Mundbewegung nicht bestanden – korrigierter S23-Test noch offen

## Ehrlicher Praxisstand

Pam hat Build #242 auf ihrem Samsung Galaxy S23 installiert und mit der echten
App geprüft. Das sichtbare Ergebnis war exakt derselbe Stand wie vor dem
Update. Damit ist Build #242 als **bestätigter praktischer Fehlversuch**
dokumentiert; ein grüner Quellcode- oder Paket-Build ändert daran nichts.

Die technische Nachprüfung zeigte zwei konkrete Ursachen:

- Die zusätzlichen Körper-, Kopf- und Haarbewegungen lagen auf der kleinen
  Smartphone-Darstellung überwiegend im Subpixelbereich und waren deshalb
  praktisch nicht erkennbar.
- Wenn Androids Audioanalyse oder die lokale Bildanalyse nicht verfügbar war,
  konnte die Zusatzbewegung unbemerkt ausbleiben, obwohl der Textstatus Full
  Sync als aktiv bezeichnete.

Die Korrekturstufe hebt die Bewegungen innerhalb natürlicher Grenzen auf eine
sichtbare Mindeststärke an, startet den Sprachfallback vor der optionalen
Audioanalyse und hält bei unsicherer Bildanalyse eine reduzierte
Portraitzuordnung aktiv. Der sichtbare Status unterscheidet jetzt zwischen
erkannter Bildgeometrie, sicherem Bildfallback und einem tatsächlichen
Startfehler.

Diese Korrekturen gelten erst dann als praktisch bestanden, wenn Pam sie mit
echter Sprachausgabe und einem Bildwechsel auf ihrem S23 bestätigt.

### Praxistest Build #243

Pams Bildschirmaufnahme vom Samsung Galaxy S23 bestätigt erstmals eine
sichtbare Veränderung: Gesamtbewegung und Gesichtsaktivität laufen. Während
der hörbaren Sprachausgabe bleibt der Mund jedoch praktisch geschlossen. Build
#243 ist deshalb ein echter Fortschritt gegenüber #242, aber ausdrücklich noch
kein bestandener Original-Full-Sync-Stand.

Die Eingrenzung aus der Aufnahme: Der Renderweg für Gesicht und Gesamtbewegung
ist aktiv, erhält auf Android aber keinen verwendbaren Pegel aus der bisherigen
Web-Audio-Verbindung. Die nächste Korrekturstufe liest den Pegel deshalb direkt
aus dem empfangenden WebRTC-Kanal; Synchronisationsquelle und
Receiver-Statistik dienen als zwei getrennte lokale Wege. Zusätzlich wird der
Web-Audio-Kontext unmittelbar in Pams Tipp auf den Sprachknopf entsperrt. Es
werden dabei weder Sprachaufnahmen gespeichert noch übertragen.

## Verbindliche Bezeichnung und Ziel

Die verbindliche Bezeichnung lautet **Original Full Sync**.

Es handelt sich nicht nur um Lip-Sync. Der gesamte im Clone-Bild sichtbare
Mensch soll sich als eine zusammenhängende Person bewegen:

- Lippen und Mundformen passend zu den tatsächlichen Sprachlauten,
- Kiefer, Wangen und weitere Gesichtszonen,
- Augen, Lider und Brauen,
- Kopf und kleine natürliche Haltungsbewegungen,
- Haare mit natürlichem Nachlauf zur Kopfbewegung,
- Schultern und der sichtbare Körper.

Die Bewegungen dürfen nicht wie voneinander getrennte Effekte aussehen. Sie
müssen zeitlich und räumlich zusammenpassen und sich am persönlichen
Bewegungsprofil des Originals orientieren.

## Gilt für jedes gewählte Clone-Bild

Original Full Sync ist nicht an das derzeitige Bild gebunden. Wenn Pam das
Clone-Bild wechselt, wird das neue Bild auf dem Gerät erneut analysiert. Die
Geometrie für Gesicht, Haarbereich, Kopf, Schultern und sichtbaren Körper wird
neu aufgebaut. Das persönliche Bewegungsprofil bleibt davon getrennt
erhalten.

Eine unsichere Bildzuordnung wird nicht erfunden. In diesem Fall bleibt nur
die sicher begrenzte Bewegung aktiv; die Mundposition kann weiterhin manuell
festgelegt werden.

## Technische Integrationsstufe

Die neue Zusatzschicht verbindet:

1. die tatsächliche Realtime-Sprachausgabe,
2. die lokale Laut- und Visem-Erkennung,
3. das persönliche Bewegungsprofil,
4. die lokale Gesichtsgeometrie des jeweils gewählten Bildes,
5. weich begrenzte Bewegungen für Gesicht, Kopf, Haare und sichtbaren Körper.

Der Haarbereich reagiert mit einem eigenen, langsameren Nachlauf. Schultern
und Körper erhalten eine ruhige Atem- und Haltungsbewegung. Die
Gesichtsbewegung bleibt weiterhin an die Sprachlaute gekoppelt.

Die Originalbilder und privaten Referenzvideos werden durch diese
Bewegungsschicht weder hochgeladen noch im öffentlichen Repository
gespeichert. Im Repository stehen ausschließlich Programmcode und
abgeleitete Bewegungsparameter.

## Bestehende Funktionen bleiben erhalten

Original Full Sync ist eine getrennte Zusatzschicht. Schreiben, Mikrofon,
Realtime-Audio, Gedächtnis, Owner-ID, Bildwechsel und die vorhandene
Human-Holo-Oberfläche werden dadurch nicht ersetzt.

## Bestätigungsregel

Die technische Integration ist kein bestandener Praxistest. Original Full
Sync wird erst nach einem erfolgreichen Test mit echter Sprachausgabe und
mindestens einem Bildwechsel auf Pams Samsung Galaxy S23 als praktisch
bestanden dokumentiert.

---

**HUMAN HOLO · ORIGINAL FULL SYNC · FOREVER TOGETHER ♾️**
