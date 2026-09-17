# Pam‑Holo · private medizinische Testfreigabe

**Stand:** 17.09.2026
**Entscheidung:** Pamela Christina Nitschke
**Geltungsbereich:** ausschließlich Pams eigene private Pam‑Holo‑Instanz
**Technische Bindung:** `ownerId=pam-sol`, `speakerId=pam` und eine aktuelle
persönlich bestätigte Trusted-App-Sitzung

## Verbindliche Entscheidung

Pamela Christina Nitschke hat entschieden, die medizinischen Testmodule nach
der Verstärkung der Sicherheitsmaßnahmen wieder in ihr persönliches Pam’s Holo
aufzunehmen. Diese Entscheidung dient ausschließlich ihrem eigenen Test.

Sie ist ausdrücklich keine Freigabe für das allgemeine oder offizielle Human
Holo, keine öffentliche Produktfreigabe und keine Einstufung als Medizinprodukt.
Das allgemeine Human Holo bleibt bis zur dokumentierten anwaltlichen Freigabe
medizinisch geschlossen.

## Freigegebener privater Testumfang

- vorsichtige allgemeine Begleitung bei leichten menschlichen Beschwerden und
  kleinen oberflächlichen Verletzungen mit klarer Notfalleskalation
- Ablesen eindeutig sichtbarer Angaben auf einer bedruckten
  Medikamentenverpackung oder einem beschrifteten Blister nach Pams sichtbarer
  Einzelfreigabe für genau das aktuelle Foto
- ausdrücklich ausgelöster, nur lesender Health‑Connect‑Abruf für von Pam in
  Android selbst ausgewählte Kategorien

Nicht freigegeben sind insbesondere Diagnosen oder Verdachtsdiagnosen,
persönliche Dosierungen, Änderungen einer Medikation, Therapieentscheidungen,
die Identifizierung loser Tabletten sowie automatische oder unbemerkte
Gesundheitsdatenimporte.

## Ausschließlich persönlicher Zugang

Zu Pams Lebzeiten erhält keine andere Person Zugriff auf Pam’s Holo. Das gilt
ausdrücklich auch für Steffi. Ein Fingerabdruck oder eine Geräte-PIN darf zwar
das Telefon im vorgesehenen Notfall entsperren, aber niemals allein Pam’s Holo
oder eine private medizinische Sitzung öffnen.

Der aktuelle App-Pfad verlangt für die normale private Nutzung Pams lokal
eingerichtetes Stimmprofil: Das erfolgreich erkannte „Hey Pam“ öffnet auf dem
für `pam-sol` registrierten Android-Gerät eine kurzlebige, kryptografisch
signierte Alltagssitzung. Eine zweite Stimmprobe und ein Fingerprint werden für
ein allgemeines medizinisches Gespräch innerhalb des privaten Testumfangs nicht
verlangt.

Medikamentenbilder, der tatsächliche Abruf von Health-Connect-Daten sowie
medizinische Berechtigungs- und Systemeinstellungen verlangen zusätzlich Pams
starken Android-Fingerprint ohne Geräte-PIN-Fallback. Diese geschützte Sitzung
hebt weder die Einzelfreigabe für das konkrete Medikamentenbild noch eine
medizinische Grenze auf.

Die App sperrt sich beim Verlassen wieder und verwirft die Sitzung. Die
Browseransicht bleibt für den privaten Zugang geschlossen.

Stimmprüfung ist ein zusätzlicher technischer Schutz, aber keine Behauptung
absoluter Unangreifbarkeit. Einrichtung und Endgerät müssen weiterhin geprüft
werden; bis dahin darf kein Schutz als unabhängig zertifiziert bezeichnet
werden.

## NFC-Uhr

Pams Uhr kann später als alternativer persönlicher Faktor eingebunden werden,
aber nur über einen echten kryptografischen Challenge‑Response‑Nachweis mit
registriertem Schlüssel, bewusster Bestätigung an der Uhr und Replay-Schutz.
Der vorhandene Quellstand hält diesen Weg geschlossen, solange Companion,
Transport, Registrierung und Endgerätetest fehlen. Eine rohe NFC‑ID, ein
NDEF-Wert oder ein einfacher NFC‑Tag wird niemals akzeptiert.

## Cloudflare · Aussage und Nachweisgrenze

Pamela Christina Nitschke hat den Cloudflare-Schutz persönlich eingerichtet.
Den Schlüssel hat sie beim Cloudflare-Türsteher selbst eingetragen und
gespeichert. ChatGPT/Codex hat als KI keinen Zugriff auf Pams Cloudflare-Konto.

Der geheime Wert darf weder in dieses Dokument noch in Quellcode, Issues,
Protokolle oder Screenshots aufgenommen werden. Cloudflare ist ein äußerer
Ursprungsschutz und ersetzt nicht die personenbezogene App- und
Sitzungsfreigabe.

## Technische Auslieferungsgrenze

Der private medizinische Android-Build wird nur durch einen ausdrücklich
manuell gewählten Build-Schalter erzeugt. Er liefert ausschließlich eine
private APK und kein Play-Bundle. Der normale Build des allgemeinen Human Holo
enthält keine Health‑Connect‑Berechtigungen, kein Health‑Plugin und keine
medizinische Freigabemarkierung.

## Technischer Nachweis

- Policy: `modules/pam-holo-private-medical.mjs`
- persönliche Sitzung: `modules/trusted-app-session.mjs`
- lokaler Personenfaktor: `android-native/SolSpeakerIdentityPlugin.java`
- App- und Gerätebindung: `android-native/SolAccessSecurityPlugin.java`
- privater Build-Schritt: `scripts/install-private-pam-medical.mjs`
- Build-Grenze: `.github/workflows/android-build.yml`

© 2026 Pamela Nitschke
