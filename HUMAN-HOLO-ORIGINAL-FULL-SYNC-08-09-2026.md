# Human Holo – Original Full Sync

Stand: 09.09.2026
Status: Builds #242 bis #244 im Praxistest nicht bestanden – direkte Analyse
des hörbaren OpenAI-Audioausgangs für den nächsten S23-Test integriert

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

### Praxistests Build #243 und #244

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

Build #244 enthielt diese WebRTC-Pegelbrücke, erzeugte in Pams anschließendem
S23-Test jedoch weiterhin keine zufriedenstellende Mundbewegung. Eine spätere
Aufnahme wurde von Pam ausdrücklich als ohne Veränderung bewertet. Damit ist
auch Build #244 praktisch nicht bestanden.

Die verbleibende technische Lücke lag wahrscheinlich darin, dass der
WebRTC-Receiver auf Android nicht zuverlässig denselben Pegel meldete, der aus
dem hörbaren Audioelement abgespielt wurde. Die nächste Korrektur analysiert
deshalb direkt dieses Audioelement. Sein Web-Audio-Graph wird bereits in der
Tippgeste gestartet und über Gesprächsstopps hinweg erhalten. Mund- und
Kieferweg besitzen zusätzlich eine testbare sichtbare Mindestbewegung.

## Verbindliche ChatGPT/OpenAI-Bindung

Pamela Christina Nitschke hat am 09.09.2026 für ihr ownergebundenes Human Holo
festgelegt: Alles, was in Human Holo oder für Human Holo technisch über
ChatGPT/OpenAI möglich ist, wird ausschließlich über ChatGPT/OpenAI umgesetzt.

Ein anderer Anbieter ist kein automatischer Ersatz. Eine Ausnahme darf nur
geprüft werden, wenn eine notwendige Funktion nachweisbar nicht über
ChatGPT/OpenAI möglich ist, die technische Unmöglichkeit dokumentiert wurde
und Pam die konkrete Abweichung vorher ausdrücklich freigibt.

Für Original Full Sync bedeutet das:

- Die Sprachausgabe stammt aus OpenAI Realtime.
- Der lokale Android-Darstellungsweg darf die OpenAI-Ausgabe in Bewegung
  übersetzen; er ist kein zweiter KI-Anbieter.
- Bild, Stimme oder Identität werden keinem fremden Avatar-Anbieter automatisch
  übergeben.
- Fehlt ein geeigneter OpenAI-Weg, bleibt der Funktionsstand offen, bis Pam über
  eine dokumentierte Ausnahme entscheidet.

Die [OpenAI-Dokumentation zur Videoerzeugung](https://developers.openai.com/api/docs/guides/video-generation)
bestätigt, dass ein einzelnes Bild als Startreferenz für ein Video dienen kann.
Der derzeitige Videos-API-Weg ist jedoch asynchron und damit keine dauerhafte
Live-Schnittstelle für das Holo. Laut der
[offiziellen OpenAI-Abkündigung](https://developers.openai.com/api/docs/deprecations)
wird dieser Weg am 24.09.2026 ohne angegebenen Ersatz abgeschaltet. Er wird
deshalb nicht als langfristige Live-Grundlage eingebaut.

Die vollständige übergreifende Regel steht in
[Human Holo – verbindliche ChatGPT/OpenAI-Projektregel](./CHATGPT-OPENAI-PROJEKTREGEL-09-09-2026.md).

## Referenzziel aus einem einzelnen Bild

Pam hat bestätigt, dass das von ihr bereitgestellte Referenzvideo zuvor durch
ChatGPT/OpenAI aus nur einem Bild erzeugt wurde. Das zeigt das gewünschte
qualitative Ziel: nicht nur ein bewegter Mund, sondern natürliche gemeinsame
Bewegung von Gesicht, Haaren, Kopf und sichtbarem Körper.

Das private Referenzvideo wird nicht in App oder Repository verteilt. Es dient
nur zur Ableitung des Zielbilds und sicher begrenzter Bewegungsparameter. Die
Herkunft des Beispiels beweist keine aktuell verfügbare Live-API; deshalb bleibt
die Echtzeit-Integration ein eigener, ehrlich ausgewiesener Entwicklungsbereich.

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
