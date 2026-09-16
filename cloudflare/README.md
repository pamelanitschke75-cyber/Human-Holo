# Getrennte Cloudflare-Türsteher für Pam’s Holo und Human Holo

Pam’s Holo und Human Holo bleiben technisch getrennte Dienste. Sie teilen weder Server, Datenbank, Ursprungsschlüssel noch persönlichen Speicher.

- `pam-holo-edge-guard.mjs` schützt ausschließlich Pam’s Holo und leitet nur zu `https://sol-holo.onrender.com` weiter.
- `human-holo-edge-guard.mjs` schützt ausschließlich Human Holo. Bis ein eigener Human-Holo-Server und eine eigene Datenbank bestätigt sind, bleibt dieser Worker fail-closed und darf niemals auf Pams Ursprung zurückfallen.

Die vorhandenen Worker `sol-holo-api` und `dark-wind-6dd8` werden weder überschrieben noch gelöscht.

## Schutzumfang

Der Pam-Holo-Türsteher prüft auch öffentliche Seiten und Endpunkte auf erlaubte Methoden, sichere Pfade, zulässige Herkunft, Anfragegröße und neutrale Fehler. Er entfernt spoofbare Weiterleitungsheader, setzt Browser-Sicherheitsheader und verhindert Edge-Caching persönlicher Antworten.

Persönliche Funktionen benötigen zusätzlich Owner-, Geräte-, Trusted-Session- und Sprecherbindung. Öffentliche Schutzregeln ersetzen niemals persönliche Zugriffskontrollen.

## Verifizierter Stand am 16.09.2026

Pam hat den getrennten Worker `pam-holo-edge-guard` im Cloudflare-Dashboard bereitgestellt.

Bestätigter Stand:

- Worker: `pam-holo-edge-guard`
- Worker-Adresse: `https://pam-holo-edge-guard.pamela-nitschke75.workers.dev`
- Render-Ursprung: `https://sol-holo.onrender.com`
- `PAM_HOLO_ORIGIN_SECRET`: als Secret in Cloudflare und Render gesetzt; der echte Wert wird nicht dokumentiert
- `PAM_HOLO_ORIGIN_SECRET_REQUIRED=true` auf Render aktiv
- direkter Aufruf von `https://sol-holo.onrender.com` wird mit `Direkter Ursprungszugriff ist nicht freigegeben.` abgelehnt
- Aufruf über den Cloudflare-Worker lädt die Anwendung weiterhin korrekt
- damit ist der Ursprungsschutz praktisch verifiziert

Der vorherige Pausenstand mit `PAM_HOLO_ORIGIN_SECRET_REQUIRED=false` ist historisch überholt.

Ausführlicher Nachweis:

[`PAM-HOLO-CLOUDFLARE-TUERSTEHER-VERIFIZIERT-16-09-2026.md`](../PAM-HOLO-CLOUDFLARE-TUERSTEHER-VERIFIZIERT-16-09-2026.md)

## Was der verifizierte Türsteher schützt

Der direkte Render-Weg kann nicht mehr als einfache Umgehung von Cloudflare genutzt werden. Nur eine Anfrage mit dem korrekten serverseitigen Ursprungsschlüssel wird vom Render-Ursprung akzeptiert. Der Cloudflare-Worker fügt diesen Schlüssel serverseitig hinzu.

Zusätzlich bleiben die vorhandenen Edge-Regeln für Methoden, private Pfade, Browser-Herkünfte, Anfragegrößen, Header und No-Cache-Verhalten aktiv.

## Grenzen des Schutzes

Dieser Nachweis ist keine Sicherheitszertifizierung und keine Behauptung absoluter Unangreifbarkeit. Weiter offen beziehungsweise separat zu prüfen sind insbesondere vollständige Autorisierung aller sensiblen Backend-Routen, regelmäßige Schlüsselrotation und ein unabhängiger Penetrationstest.

## Human Holo

Human Holo erhält dieselben Schutzklassen, aber einen eigenen Worker, eigenen Server, eigene Datenbank, eigene Schlüssel und eigene Herkunftsliste. Bis diese getrennte Infrastruktur existiert, bleibt der Human-Holo-Worker absichtlich fail-closed.

## Kontozugang

Der Cloudflare-Kontozugang bleibt ausschließlich bei Pamela Christina Nitschke. Passwörter, API-Tokens und Ursprungsschlüssel werden nicht in GitHub dokumentiert oder geteilt.
