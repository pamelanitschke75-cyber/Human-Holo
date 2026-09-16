# Getrennte Cloudflare-Türsteher für Pam’s Holo und Human Holo

Pam’s Holo und Human Holo bleiben technisch getrennte Dienste. Sie teilen
weder Server, Datenbank, Ursprungsschlüssel noch persönlichen Speicher.

- `pam-holo-edge-guard.mjs` schützt ausschließlich Pam’s Holo und darf nur zu
  `https://sol-holo.onrender.com` weiterleiten.
- `human-holo-edge-guard.mjs` schützt ausschließlich Human Holo. Bis ein
  eigener Human-Holo-Server und eine eigene Datenbank bestätigt sind, lehnt
  dieser Worker jede Nutzanfrage mit HTTP 503 geschlossen ab.

Die vorhandenen Worker `sol-holo-api` und `dark-wind-6dd8` werden weder
überschrieben noch gelöscht.

## Schutzumfang für öffentliche und persönliche Bereiche

Öffentlich erreichbar bedeutet niemals ungeschützt. Der Pam-Holo-Türsteher
prüft auch öffentliche Seiten und Endpunkte auf erlaubte Methoden, sichere
Pfade, zulässige Herkunft, Anfragegröße, komprimierte Körper und neutrale
Fehler. Er entfernt verräterische Serverheader, setzt Browser-Sicherheitsheader
und verhindert Edge-Caching persönlicher Antworten.

Persönliche Funktionen benötigen zusätzlich die vorhandene Owner-, Geräte-,
Biometrie-/PIN-, Trusted-Session- und Sprecherbindung. Interne Projektdateien,
Schlüsseldateien, Quellcode, Tests und Verwaltungswege bleiben von außen
unsichtbar. Öffentliche Schutzregeln ersetzen niemals persönliche
Zugriffskontrollen.

## Wahrer Stand am 16.09.2026

Pam hat den Worker `human-holo-edge-guard` selbst als getrennte Teststrecke
bereitgestellt. Die extern geprüfte Fassung meldete `staged-v1`, leitete aber
technisch zu `sol-holo.onrender.com` weiter. Damit testete sie ausschließlich
den Pam-Holo-Ursprung; die damalige gemeinsame Scope-Bezeichnung war falsch und
darf nicht als Human-Holo-Schutz ausgegeben werden.

Die externe Prüfung dieser Teststrecke ergab:

- Status und Pam-Holo-Weiterleitung: HTTP 200,
- fremde Browser-Herkunft: HTTP 403,
- privater Projektpfad: HTTP 404,
- nicht freigegebene HTTP-Methode: HTTP 405,
- innerer Anwendungswächter dahinter: `active-v1`.

Der korrigierte Quellstand trennt nun beide Dienste. Er ist noch nicht im
Cloudflare-Dashboard bereitgestellt. Bestehende App-Versionen sprechen weiter
direkt mit `https://sol-holo.onrender.com`; der Render-Ursprung ist noch nicht
gesperrt. WAF-, Bot- und Rate-Limit-Regeln sowie eine ownerkontrollierte Domain
sind noch nicht produktiv bestätigt. Deshalb besteht noch kein vollständiger
Cloudflare-Produktionsschutz.

## Sichere Reihenfolge für Pam’s Holo

1. Einen getrennten Worker `pam-holo-edge-guard` mit
   `pam-holo-edge-guard.mjs` bereitstellen und die Testadresse prüfen.
2. Cloudflare-WAF, DDoS-/Bot-Schutz und Rate-Limits für öffentliche und
   persönliche Endpunkte testen; unbekannte Verwaltungswege standardmäßig
   sperren.
3. Einen neuen, zufälligen Ursprungsschlüssel ausschließlich als Secret in
   Cloudflare und Render hinterlegen; niemals in GitHub oder der App.
4. Erst wenn beide Seiten denselben Schlüssel verwenden, in Render
   `PAM_HOLO_ORIGIN_SECRET_REQUIRED=true` setzen und den direkten Ursprungstest
   auf HTTP 403 prüfen.
5. Eine neue App-Version auf die geschützte ownerkontrollierte Domain umstellen,
   sämtliche Sicherheits-/Regressionstests und den Android-Build ausführen und
   auf Pams realem Gerät bestätigen.
6. Erst danach alten Direktverkehr kontrolliert schließen. OAuth-Callbacks
   müssen vorher über die geschützte Domain geführt oder sicher ausgenommen
   werden.

## Human Holo

Human Holo erhält dieselben Schutzklassen, aber einen eigenen Worker, eigenen
Server, eigene Datenbank, eigene Schlüssel und eigene Herkunftsliste. Bis diese
getrennte Infrastruktur existiert, bleibt der Human-Holo-Worker absichtlich
fail-closed. Er darf niemals auf Pams Render-Ursprung zurückfallen.

## Kontozugang

Der Cloudflare-Kontozugang bleibt ausschließlich bei Pamela Christina
Nitschke. Keine KI erhält Konto-, Dashboard-, Plugin-, OAuth-, Fernsteuerungs-
oder API-Token-Zugriff. Passwörter und Schlüssel werden nicht geteilt; weitere
Kontobenutzer werden nicht angelegt. Quellcode kann außerhalb des Kontos
vorbereitet werden, aber sämtliche Dashboard-Schritte führt und bestätigt Pam
selbst.
