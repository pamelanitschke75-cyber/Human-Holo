# Human Holo – Draußen-Schutz für Gesichter

Stand: 15.09.2026  
Status: Implementiert und automatisiert getestet; S23-Praxistest steht noch aus

## Ziel

Bei Kameraaufnahmen im Freien oder öffentlichen Raum sollen unbeteiligte
Menschen nicht unnötig erkennbar an Human Holo, das Backend oder OpenAI
übertragen werden.

## Umgesetztes Verhalten

- Der Schutz ist bei jeder neu gestarteten Live-Kamera eingeschaltet.
- Ein direkt mit der Rückkamera aufgenommenes Foto wird standardmäßig lokal
  geschützt.
- Für Fotos und Videos aus der Galerie gibt es vor dem Senden den sichtbaren
  Schalter „Draußen-Schutz“.
- Die Rückkamera verpixelt alle erkannten Gesichter.
- Bei der Frontkamera kann nur das große, zentral gerahmte Gesicht der Person,
  die das Handy hält, sichtbar bleiben. Die Auswahl erfolgt anhand von Position
  und Größe, nicht anhand der Identität.
- Alle anderen erkannten Gesichter werden mit einem groben Mosaik verdeckt.
- Die Verarbeitung läuft mit dem bereits lokal ausgelieferten
  MediaPipe-Modell auf dem Gerät.
- Es gibt keinen Namensabgleich, kein fremdes Referenzbild, kein Gesichtsprofil
  und keine Speicherung von Erkennungsergebnissen.
- Kann der lokale Filter nicht sicher ausgeführt werden, wird das als geschützt
  markierte Bild nicht gesendet.

## Videos

Im Draußen-Schutz werden nur wenige, bereits lokal verpixelte Einzelbilder an
Human Holo gesendet. Das Originalvideo und seine Tonspur bleiben auf dem Handy.
Dadurch kann Human Holo in diesem Modus keine Aussagen über Geräusche oder
gesprochene Wörter treffen.

## Bewusste technische Grenze

Automatische Gesichtsdetektion ist keine absolute Garantie. Sehr kleine,
verdeckte, unscharfe oder ungünstig beleuchtete Gesichter können übersehen
werden. Die App zeigt deshalb den Schutzstatus und eine Vorschau an. Diese
Grenze muss im S23-Praxistest mit echten Außenaufnahmen geprüft werden.

## Trennung von Pams privater Selbstwiedererkennung

Der Draußen-Schutz lokalisiert nur Bildbereiche zum Verpixeln. Er ist technisch
und zweckmäßig vollständig von der freiwilligen, ownergebundenen privaten
1:1-Selbstwiedererkennung getrennt.

## Prüfnachweise

- `tests/public-face-privacy.test.mjs`
- `tests/direct-camera-capture.test.mjs`
- `tests/live-camera-realtime.test.mjs`
- Android-Workflow prüft, dass das lokale Schutzmodul im APK enthalten ist.

Der vollständige Node-Teststand umfasst nach dieser Erweiterung 482 bestandene
Tests.
