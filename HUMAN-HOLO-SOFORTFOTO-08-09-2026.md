# Human Holo – Sofortfoto und Live-Bild

Stand: 08.09.2026

## Ergebnis

Human Holo bietet zwei bewusst getrennte Kameramodi:

1. Das kleine Kamerasymbol im Chat öffnet unmittelbar die Rückkamera für ein
   einzelnes neues Foto.
2. „Live-Bild starten“ bleibt im laufenden Sprachgespräch als eigener Modus
   verfügbar.

## Ablauf des Sofortfotos

1. Pam tippt im Chat auf das Kamerasymbol.
2. Android öffnet direkt die Kamera und bevorzugt die Rückkamera.
3. Nach der Aufnahme zeigt Human Holo das Foto zunächst nur als Vorschau.
4. Pam kann noch Text ergänzen, das Foto entfernen oder es mit dem
   Senden-Pfeil einmalig an Holo übertragen.

Die Aufnahme wird nicht bereits durch das Auslösen an Holo gesendet.

## Vorhandene Medien

Bereits vorhandene Fotos und Videos sind weiterhin über
„Foto oder Video auswählen“ im Seitenmenü erreichbar. Dadurch bleibt das
Kamerasymbol eindeutig für eine neue Sofortaufnahme reserviert.

## Technische Umsetzung

- Das Aufnahmefeld verwendet `accept="image/*"` und
  `capture="environment"`.
- Sofortfoto und Medienauswahl verwenden dieselbe geprüfte Vorschau- und
  Sendelogik.
- Der Live-Bild-Modus samt sichtbarer Vorschau, Kamerawechsel und sicherem
  Beenden bleibt unverändert erhalten.
- Paketname, App-Signatur und vorhandene Datenhaltung werden nicht geändert.

## Absicherung

Automatisierte Tests prüfen:

- die direkte Rückkamera-Anforderung des Chat-Kamerasymbols,
- die getrennte Galerie- und Videoauswahl,
- die Vorschau ohne automatisches Senden,
- das gleichzeitige Fortbestehen des Live-Bild-Modus.
