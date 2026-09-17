# Pam-Holo Cloudflare-Türsteher – öffentliches Endpunktverhalten vom 16.09.2026

**Status:** von außen sichtbares Verhalten geprüft
**Scope:** ausschließlich Pam’s Holo  
**Owner:** Pamela Christina Nitschke

## Ergebnis

Pamela Christina Nitschke hat den getrennten Cloudflare-Worker
`pam-holo-edge-guard` persönlich eingerichtet. Den Schlüssel hat sie beim
Cloudflare-Türsteher selbst eingetragen und gespeichert. ChatGPT/Codex hat als
KI keinen Zugriff auf Pams Cloudflare-Konto.

Der Render-Ursprung lautet:

`https://sol-holo.onrender.com`

Der Cloudflare-Weg lautet:

`https://pam-holo-edge-guard.pamela-nitschke75.workers.dev`

## Von außen geprüfte Wege

Am 16.09.2026 wurde der Ursprungsschutz praktisch in beiden Richtungen getestet:

1. **Direkter Aufruf von Render**
   - Aufruf von `https://sol-holo.onrender.com`
   - Ergebnis: direkter Ursprungszugriff wird abgelehnt.
   - Sichtbare Antwort: `Direkter Ursprungszugriff ist nicht freigegeben.`

2. **Aufruf über Cloudflare**
   - Aufruf von `https://pam-holo-edge-guard.pamela-nitschke75.workers.dev`
   - Ergebnis: Pam-Holo/Human-Holo-Startseite wird über den Worker korrekt vom Render-Ursprung ausgeliefert.

Damit wurde von außen beobachtet:

- der direkte Render-Weg ist für normale externe Aufrufe gesperrt,
- der Cloudflare-Weg konnte den Ursprung weiterhin erreichen,
- der eigentliche Secret-Wert wird **nicht** in GitHub dokumentiert.

## Was dieser Schutz bedeutet

Cloudflare dient als äußerer Türsteher vor Pam’s Holo. Der beobachtete normale
externe Direktaufruf konnte den Render-Ursprung nicht umgehen. Der Worker-Code
ist dafür ausgelegt, den serverseitigen Ursprungsschlüssel als
`x-pam-holo-origin-guard` an Render weiterzugeben.

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

Pam’s Holo und Human Holo teilen weder Ursprungsschlüssel noch Server,
Datenbank oder persönlichen Speicher. Der hier beschriebene öffentliche
Endpunkttest gilt ausschließlich für Pam’s Holo.

## Geheimhaltung

Der echte Wert von `PAM_HOLO_ORIGIN_SECRET` darf niemals in GitHub, README,
Issues, Screenshots, Chatverläufen oder App-Code veröffentlicht werden.
Dokumentiert werden Pamela Christina Nitschkes persönliche Einrichtung sowie
das von außen beobachtete Endpunktverhalten.

## Freigabestatus dieses Schutzschritts

**🟨 Ursprungsschutz Pam’s Holo: öffentliches Endpunktverhalten geprüft.**

Weitere Sicherheitsstufen bleiben davon unabhängig und werden separat freigegeben.
