# Pam-Holo Cloudflare-Türsteher – verifiziert am 16.09.2026

**Status:** technisch aktiviert und praktisch verifiziert  
**Scope:** ausschließlich Pam’s Holo  
**Owner:** Pamela Christina Nitschke

## Ergebnis

Der getrennte Cloudflare-Worker `pam-holo-edge-guard` ist vor dem bestehenden Render-Ursprung von Pam’s Holo aktiv.

Der Render-Ursprung lautet:

`https://sol-holo.onrender.com`

Der Cloudflare-Weg lautet:

`https://pam-holo-edge-guard.pamela-nitschke75.workers.dev`

## Verifizierter Ursprungsschutz

Am 16.09.2026 wurde der Ursprungsschutz praktisch in beiden Richtungen getestet:

1. **Direkter Aufruf von Render**
   - Aufruf von `https://sol-holo.onrender.com`
   - Ergebnis: direkter Ursprungszugriff wird abgelehnt.
   - Sichtbare Antwort: `Direkter Ursprungszugriff ist nicht freigegeben.`

2. **Aufruf über Cloudflare**
   - Aufruf von `https://pam-holo-edge-guard.pamela-nitschke75.workers.dev`
   - Ergebnis: Pam-Holo/Human-Holo-Startseite wird über den Worker korrekt vom Render-Ursprung ausgeliefert.

Damit ist belegt:

- der direkte Render-Weg ist für normale externe Aufrufe gesperrt,
- der Cloudflare-Worker kann den Ursprung weiterhin erreichen,
- `PAM_HOLO_ORIGIN_SECRET` ist auf Cloudflare und Render mit demselben geheimen Wert gesetzt,
- `PAM_HOLO_ORIGIN_SECRET_REQUIRED=true` ist auf Render aktiv,
- der eigentliche Secret-Wert wird **nicht** in GitHub dokumentiert.

## Was dieser Schutz bedeutet

Cloudflare ist der äußere Türsteher vor Pam’s Holo. Ein normaler externer Aufruf kann den Render-Ursprung nicht mehr direkt umgehen. Nur der Worker kennt den serverseitigen Ursprungsschlüssel und kann ihn als `x-pam-holo-origin-guard` an Render weitergeben.

Der Worker begrenzt außerdem unter anderem Methoden, private Pfade, Anfragegrößen und bestimmte Browser-Herkünfte, entfernt spoofbare Weiterleitungsheader und setzt Sicherheits- und No-Cache-Header.

## Was ausdrücklich nicht behauptet wird

Dieser Nachweis ist **keine Sicherheitszertifizierung** und keine Behauptung absoluter Unangreifbarkeit.

Weiterhin getrennt zu behandeln sind insbesondere:

- Owner-/Geräte-/Sitzungs-Authentifizierung,
- vollständige Autorisierungsprüfung sensibler Backend-Routen,
- regelmäßige Schlüsselrotation,
- unabhängiger Penetrationstest,
- Human Holo mit eigenem Server, eigener Datenbank, eigenem Worker und eigenem Ursprungsschlüssel.

Human Holo darf nicht auf Pams Render-Ursprung zurückfallen.

## Verbindliche Trennung

Pam’s Holo und Human Holo teilen weder Ursprungsschlüssel noch Server, Datenbank oder persönlichen Speicher. Der hier verifizierte Türsteher gilt ausschließlich für Pam’s Holo.

## Geheimhaltung

Der echte Wert von `PAM_HOLO_ORIGIN_SECRET` darf niemals in GitHub, README, Issues, Screenshots, Chatverläufen oder App-Code veröffentlicht werden. Dokumentiert wird ausschließlich, **dass** der Schlüssel gesetzt und erfolgreich verifiziert wurde.

## Freigabestatus dieses Schutzschritts

**✅ Ursprungsschutz Pam’s Holo: technisch aktiviert, getestet und verifiziert.**

Weitere Sicherheitsstufen bleiben davon unabhängig und werden separat freigegeben.
