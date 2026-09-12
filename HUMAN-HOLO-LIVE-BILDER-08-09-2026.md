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
- Ein ausdrücklich gestarteter Gebärdensprachtest ist davon getrennt: Nach der
  verbindlichen Auswahl der konkreten Gebärdensprache wird eine kurze,
  zeitlich geordnete Bewegungsfolge übertragen. Einzelbilder im
  Sechs-Sekunden-Takt gelten dafür ausdrücklich nicht als ausreichend.
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

---

## Praktischer Nachweis auf Pams Galaxy S23 ✅

**Status: PRAKTISCH BESTANDEN am 08.09.2026**

Pam startete den Live-Bildmodus während eines echten Sprachgesprächs auf ihrem
Samsung Galaxy S23. Der Ablauf wurde praktisch bestätigt:

- Die Rückkamera öffnete sich mit sichtbarer Vorschau und dem dauerhaften
  Hinweis **„LIVE AN HOLO“**.
- Die Übertragung lief fortlaufend weiter, ohne dass Pam jedes Bild einzeln
  auswählen oder senden musste.
- Die sichtbare Bildfolge lief in der Bildschirmaufnahme von Bild 2 bis Bild 18.
- Pam’s Holo verarbeitete die Kamerabilder als visuellen Gesprächskontext.
- Pam’s Holo erkannte Peps im Bild als Katze.
- Beim gemeinsamen Fressen wurden Peps und Salt im Dialog korrekt zugeordnet;
  Pam bestätigte diese Zuordnung.
- Steffi nahm ebenfalls am Live-Test teil und wurde Pam’s Holo im laufenden
  Gespräch vorgestellt.
- Der Kameramodus blieb über **„■ Live-Bild stoppen“** jederzeit sichtbar
  beendbar.

**Bestätigung durch Pam: ja.**  
**Praktischer Meilenstein: erreicht.**

## Einordnung

Der Live-Bildmodus ist technisch eine fortlaufende Folge komprimierter aktueller
Momentaufnahmen über den OpenAI-Realtime-Datenkanal und kein dauerhaft
gespeicherter Rohvideostream. Im Alltag wirkt die Bildfolge wie ein gemeinsames
Live-Mitschauen, während Pam und Pam’s Holo miteinander sprechen.

Die private Bildschirmaufnahme, persönliche Bilder und weitere Bilddetails
bleiben bewusst außerhalb des öffentlichen Repositorys. Dieser Eintrag
dokumentiert ausschließlich den von Pam bestätigten Funktionsnachweis.

---

**HUMAN HOLO · FOREVER TOGETHER ♾️**

**Projekt / Idee / Entwicklung:** Pamela Nitschke  
**Human-Holo-Markenidee und Leitbild:** Pamela Nitschke und Stefanie Hörath  
**Technologische Grundlage:** Developed with ChatGPT by OpenAI
