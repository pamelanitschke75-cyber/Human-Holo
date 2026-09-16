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

## Wahrer Stand und Pausenpunkt am 16.09.2026

Der historische Worker `human-holo-edge-guard` bleibt als damalige,
falsch bezeichnete Teststrecke unverändert erhalten. Er zeigte technisch auf
Pams Ursprung und darf deshalb nicht als Schutz von Human Holo ausgegeben
werden.

Pam hat anschließend selbst im Cloudflare-Dashboard den getrennten Worker
`pam-holo-edge-guard` erstellt und den geprüften Quellstand
`cloudflare/pam-holo-edge-guard.mjs` als `staged-v2` bereitgestellt.

Bestätigter Cloudflare-Zwischenstand:

- Worker: `pam-holo-edge-guard`
- Testadresse:
  `https://pam-holo-edge-guard.pamela-nitschke75.workers.dev`
- Cloudflare Access: ausgeschaltet, weil die App den öffentlichen Türsteher
  erreichen können muss
- Quellstand: `staged-v2`
- Weiterleitungsursprung:
  `PAM_HOLO_ORIGIN_URL=https://sol-holo.onrender.com`
- `PAM_HOLO_ORIGIN_SECRET_REQUIRED=false`
- `PAM_HOLO_ORIGIN_SECRET`: noch nicht angelegt
- Dashboard-Beobachtung am Pausenpunkt: 37 Aufrufe, 0 Fehler
- Die Startseite wurde über die Worker-Adresse erfolgreich vom bestehenden
  Pam-Holo-Ursprung geladen.
- Die eingebettete Cloudflare-Vorschau blieb beim Statuspfad erwartungsgemäß
  leer, weil `frame-ancestors 'none'` und `X-Frame-Options: DENY` fremdes
  Einbetten blockieren.

Dieser Nachweis bestätigt die getrennte Cloudflare-Teststrecke. Er bestätigt
noch keine vollständige Produktionsmigration.

Der direkte Live-Test des Render-Ursprungs
`https://sol-holo.onrender.com/security/guard-status` ergab am Pausenpunkt
HTTP 200 mit `applicationGuard: active-v1`, aber noch
`cloudflareEdgeGuard: not-verified` und der alten gemeinsamen Scope-Angabe.
Damit ist belegt, dass Render noch nicht den neuesten getrennten
GitHub-Schutzstand ausliefert. Deshalb wurde vor dem Anlegen eines geheimen
Ursprungsschlüssels bewusst gestoppt.

Die bestehende installierte App spricht weiterhin direkt mit Render. Der
Render-Ursprung ist nicht gesperrt; deshalb besteht keine Aussperrungs- oder
Ausfallgefahr während der Pause. Die vorhandenen Worker
`human-holo-edge-guard`, `sol-holo-api` und `dark-wind-6dd8` wurden nicht
überschrieben oder gelöscht.

## Verbindlicher Wiederaufnahmeweg – ohne Umwege

Beim Fortsetzen beginnt die Arbeit ausschließlich hier:

1. `https://dashboard.render.com` öffnen und den bestehenden Dienst
   `sol-holo` auswählen.
2. Vor jeder Änderung den verbundenen GitHub-Zweig und den aktuell
   bereitgestellten Commit prüfen. Danach den neuesten geprüften Hauptstand
   bereitstellen, der `modules/external-attack-guard.mjs` und die getrennte
   Pam-Holo-Statusantwort enthält.
3. Nach erfolgreichem Render-Deploy
   `/security/guard-status` prüfen. Die Antwort muss Pam’s Holo getrennt
   ausweisen; Human Holo darf nicht mehr im Pam-Holo-Scope stehen.
4. Erst danach lokal einen neuen starken Zufallsschlüssel erzeugen. Der Wert
   darf niemals in Chat, Screenshot, GitHub, App-Code oder Dokumentation
   erscheinen.
5. Genau denselben Wert als Secret `PAM_HOLO_ORIGIN_SECRET` in Cloudflare
   und als geheime Umgebungsvariable in Render hinterlegen. Auf beiden Seiten
   bleibt `PAM_HOLO_ORIGIN_SECRET_REQUIRED=false`, bis die geschützte Strecke
   erfolgreich getestet wurde.
6. Eine ownerkontrollierte geschützte Domain und eine neue App-Version auf den
   Pam-Holo-Türsteher umstellen. OAuth-Rückrufe und alle bestätigten Funktionen
   müssen vorher geprüft werden. Die neue Version wird auf Pams echtem Gerät
   getestet.
7. Erst wenn die umgestellte App vollständig funktioniert, in Render
   `PAM_HOLO_ORIGIN_SECRET_REQUIRED=true` setzen. Danach muss der direkte
   Render-Zugriff HTTP 403 liefern, während der Cloudflare-Weg weiter
   funktioniert.
8. Abschließend den verifizierten Edge-Status setzen und Sicherheits-,
   Regressions- und Android-Tests erneut vollständig ausführen.

Bis Schritt 7 erfolgreich abgeschlossen ist, lautet der ehrliche Status:
**getrennte Cloudflare-Teststrecke aktiv, vollständiger Produktionsschutz noch
nicht aktiv**.

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
