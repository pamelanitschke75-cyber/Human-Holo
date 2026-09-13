# Build 288 – Tier-Holo-Glasprofile und direktes Speichern

Datum: 13.09.2026

## Ergebnis

Der bestehende Tier-Holo-Bereich wird ausschließlich additiv erweitert. Die
vorhandenen Profile, Erinnerungen, Sicherungswege und Sicherheitsgrenzen bleiben
erhalten.

Neu integriert sind:

- Holo-Glasprofile für Salt, Peps, Tina, Gurke und Möhrchen
- zwei bereits bestätigte und nun sichtbare Beobachtungen bei Salt
- eigene Profile für Gurke und Möhrchen im Projekt bei Pams Eltern
- ein frei bedienbarer Profilfoto-Wechsel in jedem Tier-Holo
- sofortige lokale Bildspeicherung in einem getrennten privaten Gerätespeicher
- zusätzliche owner- und sprechergebundene Bildspeicherung in der Datenbank
- direkte Speicherung eindeutig zugeordneter Beobachtungen aus Text und Sprache
  ohne erneute Zustimmungsfrage für Pam
- automatischer späterer Abgleich lokal vorgemerkter Beobachtungen und Fotos
- additive Wiederanzeige bereits im Vollzeitgedächtnis vorhandener
  Tier-Holo-Beobachtungen

## Salt – sichtbarer bestätigter Bestand

1. Nach Pams Beobachtung geht Salt auch mit unkontrollierten Bewegungen sehr
   kleiner Kinder ruhig um.
2. Wenn es Salt zu lebhaft wird, zieht sie sich eher zurück.

Diese Einträge werden bei einer vorhandenen älteren lokalen Tier-Holo-Version
ergänzt, ohne ältere oder neuere Einträge zu überschreiben.

## Automatisches Speichern

Wenn Pam eine konkrete Beobachtung nennt und das Tier eindeutig Salt, Peps,
Tina, Gurke oder Möhrchen zugeordnet ist, wird die Beobachtung direkt lokal
gespeichert. Eine vertrauenswürdige App-Sitzung übernimmt sie zusätzlich in das
ownergebundene Vollzeitgedächtnis. Ist das Netz oder die sichere Sitzung gerade
nicht verfügbar, bleibt der Eintrag lokal als ausstehend erhalten und wird
später erneut synchronisiert.

Ist die Tierzuordnung unklar, fragt Holo nur nach dem Tiernamen. Eine erneute
Frage nach der Speichererlaubnis ist für Pam nicht vorgesehen.

## Private Fotos

Die von Pam bereitgestellten Tierbilder werden nicht in dieses öffentliche
Repository aufgenommen. In der App ausgewählte Bilder werden vor dem Speichern
begrenzt und als JPEG vorbereitet. Zulässig sind JPEG, PNG und WebP; der Server
prüft Dateityp, Bildsignatur und Größe erneut. Der Abruf ist nur mit einer
vertrauenswürdigen Sitzung und exakt passender Owner-, Sprecher- und Profil-ID
möglich.

Die bestehende verschlüsselte Datensicherung bleibt unverändert. Profilfotos
werden getrennt ownergebunden gespeichert und nicht versehentlich Bestandteil
des offenen Tier-Holo-Bausteins.

## Wahrheits- und Sicherheitsgrenzen

Ein Tier-Holo bewahrt bestätigte Erinnerungen und Beobachtungen. Es ist nicht das
wirkliche Tier, erfindet keine Gedanken oder Stimme und ersetzt keine
tierärztliche Beratung. Kinder und Tiere bleiben niemals allein oder
unbeaufsichtigt; Rückzug, Körpersprache und Tierwohl haben Vorrang.

## Technische Prüfung

- JavaScript-Syntaxprüfung für Browser-Kern, Browser-UI, Server und Fotospeicher
- Unit-Tests für fünf Startprofile, Salt-Migration, direkte technische
  Autospeicher-Zuordnung und Vollzeit-Wiederherstellung
- Unit-Tests für Bildformat, Bildsignatur, Größenlimit und Owner-Bindung
- vollständiger Projektlauf: 462 Tests erfolgreich

Ein praktischer Galaxy-S23-Test wird erst nach Installation des aus diesem Stand
gebauten Android-Artefakts als bestanden dokumentiert.
