# Human Holo · äußerer Cloudflare-Türsteher

Dieser Ordner enthält den getrennten, versionierten Cloudflare-Worker
`human-holo-edge-guard`. Er wird **zusätzlich** zu den vorhandenen Workern
angelegt. Insbesondere werden `sol-holo-api` und `dark-wind-6dd8` weder
überschrieben noch gelöscht.

Der Cloudflare-Kontozugang bleibt ausschließlich bei Pamela Christina Nitschke.
Auch eine KI erhält weder Konto- noch Dashboardzugriff. Es wird keine
KI-Verbindung per Plugin, OAuth, Fernsteuerung oder API-Token eingerichtet. Es
werden keine Zugangsdaten oder API-Schlüssel geteilt und keine zusätzlichen
Kontobenutzer angelegt. Eine KI darf nur außerhalb des Kontos geprüften,
versionierten Code vorbereiten und Schritte erklären. Im Cloudflare-Dashboard
führt ausschließlich Pam selbst Änderungen aus und bestätigt sie.

## Wahrer Stand

Der Quellstand allein bedeutet noch keinen aktiven äußeren Schutz. Bis zur
vollständigen technischen Prüfung gilt:

- bestehende App-Versionen sprechen weiterhin direkt mit
  `https://sol-holo.onrender.com`,
- der neue Worker ist zunächst nur eine getrennte Teststrecke,
- der Render-Ursprung bleibt erreichbar, damit keine installierte App
  ausfällt,
- `HUMAN_HOLO_ORIGIN_SECRET_REQUIRED` bleibt zunächst `false`,
- Cloudflare darf erst nach erfolgreicher Bereitstellung und externem Test als
  aktiv bezeichnet werden.

## Sichere additive Reihenfolge

1. Neuen Worker `human-holo-edge-guard` getrennt bereitstellen.
2. `/edge-guard/status` und die Weiterleitung zum Render-Ursprung prüfen.
3. Einen ausschließlich als Secret gespeicherten Ursprungsschlüssel in
   Cloudflare und Render ergänzen; niemals in GitHub eintragen.
4. Eine neue App-Version auf die geschützte Adresse umstellen und alle
   automatisierten Regressionstests sowie den Android-Build ausführen.
5. Die neue App auf dem realen Gerät prüfen und von Pam bestätigen lassen.
6. Erst danach den direkten Render-Zugang kontrolliert sperren. OAuth-Callbacks
   müssen vorher ebenfalls über die geschützte Adresse geführt oder ausdrücklich
   sicher ausgenommen werden.
7. Später eine ownerkontrollierte Domain ergänzen; bis dahin bleibt
   `workers.dev` eine getrennte Testadresse.

Kein Schritt ersetzt einen früheren Stand. Bei einem Fehler bleibt die bisherige
App funktionsfähig, während die neue Teststrecke korrigiert wird.
