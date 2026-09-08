# Human Holo – Live-Bilder an Pam’s Holo

Datum: 08.09.2026

## Ziel

Pam kann während eines laufenden Sprachgesprächs die Kamera ausdrücklich
einschalten und Pam’s Holo fortlaufend zeigen, was sie gerade sieht. Ein
einzelnes Foto muss dafür nicht mehr jedes Mal ausgewählt und gesendet werden.

## Bedienung

1. Sprachgespräch über das Mikrofon starten.
2. „📷 Live-Bild starten“ antippen.
3. Die Rückkamera startet mit einer sichtbaren Vorschau und dem dauerhaften
   Hinweis „LIVE AN HOLO“.
4. Mit ↻ kann zwischen Rück- und Frontkamera gewechselt werden.
5. „■ Live-Bild stoppen“ beendet ausschließlich die Kamera; das Gespräch läuft
   weiter.

## Technischer Stand

- Aktuelle, komprimierte JPEG-Momentaufnahmen werden direkt über den bereits
  geöffneten OpenAI-Realtime-Datenkanal gesendet.
- Während des Live-Modus wird regelmäßig alle sechs Sekunden ein Bild ergänzt.
- Zu jedem gesprochenen Beitrag wird unmittelbar vor der Antwort ein frisches
  Kamerabild als visueller Kontext übertragen.
- Die Bildgröße passt sich zusätzlich an die ausgehandelte maximale Größe des
  WebRTC-Datenkanals an.
- Die Kameraspur enthält kein zweites Audiosignal.
- Ohne geöffnete Realtime-Sitzung werden keine Bilder übertragen.

## Sichtbarkeit und Datenschutz

- Start nur nach einem ausdrücklichen Tipp von Pam.
- Aktiver Zustand bleibt durch Vorschau und „LIVE AN HOLO“ erkennbar.
- Sofortiger Kamerastopp beim Ausschalten, beim Gesprächsende, bei App-Wechsel
  und beim Verlassen der Seite.
- Human Holo speichert die Live-Bilder weder im Vollzeitgedächtnis noch als
  bestätigte Langzeiterinnerungen.
- Die App verlangt keine Hintergrund-Kamera-Berechtigung.

## Prüfung

- 5 neue Live-Kamera-Prüfungen ergänzt.
- Gesamtlauf: 260 von 260 automatischen Projektprüfungen bestanden.
- Android-Installer fügt Kamera-Berechtigung und optionale Kamerahardware
  idempotent ein.
- GitHub-Workflow prüft Berechtigung, UI und Realtime-Bildübergabe vor dem
  Release-Bau.

Der lokale APK-Bau konnte in diesem Arbeitsbereich nicht abgeschlossen werden,
weil der erstmalige Gradle-Download durch die Netzsperre blockiert ist. Der
GitHub-Workflow enthält den vollständigen Release-Bau.
