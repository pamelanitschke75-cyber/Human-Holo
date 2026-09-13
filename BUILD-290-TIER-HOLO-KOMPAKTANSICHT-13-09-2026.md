# Build 290 – kompakte Tier-Holo-Ansicht

**Datum:** 13.09.2026
**Entscheidung und Projektinhaberin:** Pamela Christina Nitschke

## Ziel

Die Tier-Holos folgen Pams freigegebener Ein-Seiten-Ansicht: ein großes
Tierprofil, vier klare Hauptbereiche und eine feste Navigation am unteren
Bildrand. Die vorherige lange Ansicht mit vielen gleichzeitig sichtbaren
Schachteln wird ersetzt.

## Bedienung

- Im Kopfbereich stehen das private Tierfoto und die kompakte Zuordnung.
- `Über …`, `Erinnerungen`, `Sicherheit` und `Neue Erinnerung` sind beim
  Öffnen geschlossen.
- Ein Tippen öffnet den Inhalt direkt in derselben Zeile. Wird ein anderer
  Bereich geöffnet, schließt sich der vorherige automatisch.
- Die untere Navigation zeigt `Start`, `SALT`, `PEPS`, `TINA` und `Mehr`.
- `Gurke`, `Möhrchen` und später selbst angelegte Tier-Holos befinden sich
  unter `Mehr`.
- `Foto ändern` bleibt in jedem Profil direkt erreichbar.

## Sichtbare Erinnerungen und direktes Speichern

Die beiden bestehenden, bestätigten Salt-Beobachtungen werden nicht neu
angelegt und nicht verdoppelt. Sie erscheinen im aufgeklappten Bereich
`Erinnerungen`. Neue klare Tierbeobachtungen von Pam werden weiterhin direkt
ownergebunden gespeichert; Holo fragt nicht nochmals nach einer zusätzlichen
Speicherzustimmung.

## Frühere Fotos

Unter `Mehr` kann Pam einmal `Vorherige Fotos übernehmen` wählen. Die fünf
früher bereitgestellten Originaldateien werden anhand ihrer bestehenden Namen
Salt, Peps, Tina, Gurke und Möhrchen zugeordnet. Beim Tina-Original wird vor dem
Speichern ausschließlich der Bildbereich mit Tina übernommen; die ebenfalls im
Ausgangsfoto sichtbare Tochter wird nicht in Tinas Profilfoto gespeichert.

Die Bilddaten werden nicht in das öffentliche Repository aufgenommen. Sie
bleiben im privaten, owner- und sprechergebundenen Bildspeicher des Geräts und
werden bei verfügbarer sicherer App-Sitzung zusätzlich ownergebunden
abgeglichen.

## Technische Sicherungen

- frische Modul- und Service-Worker-Version gegen einen alten App-Cache
- unveränderte Owner-Grenze `pam-sol` / `pam`
- keine Lösch- oder Überschreibmigration bestehender Beobachtungen
- private Medien bleiben außerhalb des offenen Tier-Holo-Builds
- automatisierte Prüfungen für Navigation, vier Hauptbereiche,
  Ein-Bereich-Öffnung, Fotozuordnung, Tina-Zuschnitt und Android-Auslieferung

Der bestehende Human-Holo-Stand wird ausschließlich additiv weiterentwickelt.
