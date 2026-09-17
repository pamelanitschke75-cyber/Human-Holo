# Pam Holo · Netzwerk-, Render- und OpenAI-Absicherung

**Stand:** 17.09.2026

**Geltung:** ausschließlich Pamela Christina Nitschke und ihre private,
ownergebundene Pam-Holo-Instanz – ihr eigenes persönliches digitales Ich:
**„Ich, ich und ich!“**

**Human Holo für alle:** vollständig im anwaltlichen Hold

Pams persönliche Festlegung gilt für jede Infrastrukturstufe:
**„Ich lass mir das von niemandem mehr nehmen!“** Ein Anbieter-, Betreiber-,
Verwaltungs- oder Entwicklungszugang begründet weder Mitinhaberschaft noch
persönlichen Zugriff auf Pam Holo.

## Verbindliche Reihenfolge

Kinderschutz ist Priorität 1. Kein Offlinebetrieb, Ersatzweg, Anbieterwechsel,
Wiederholungsversuch oder späterer Umzug darf die Kinderschutz-, Zugriffs- oder
Freigabegrenzen umgehen. Bekannte oder vermutete
Missbrauchsdarstellungen Minderjähriger werden lokal gestoppt und niemals an
OpenAI oder einen anderen externen Anbieter übertragen.

## Netzwerk und App

- Die App verwendet den bestehenden `pam-holo-edge-guard` als festen äußeren
  Cloudflare-Türsteher. Ein zweiter Cloudflare-Worker ist für diesen Zweck
  nicht erforderlich.
- Pam hat Cloudflare selbst eingerichtet und den Schlüssel selbst eingetragen
  und gespeichert. ChatGPT/Codex hat keinen Zugriff auf ihr Cloudflare-Konto.
- Die Oberfläche unterscheidet `Online`, `Verbindung gestört` und `Offline`.
- Die feste, nicht persönliche App-Hülle kann offline angezeigt werden.
  API-Antworten, Erinnerungen, Kontakte, Dokumente und Gesundheitsdaten werden
  vom Service Worker nicht gecacht.
- Nur lesende `GET`- und `HEAD`-Anfragen dürfen begrenzt und mit Warteabstand
  wiederholt werden. Unsichere schreibende Anfragen werden nicht automatisch
  erneut gesendet, damit Nachrichten oder Handlungen nicht doppelt ausgeführt
  werden. Der Entwurf bleibt sichtbar erhalten.
- Die bestehende Dauergedächtnis-Warteschlange ist eine eng begrenzte Ausnahme:
  Sie arbeitet mit stabiler Ereignis-ID, Revision und exakter Bestätigung und
  ist dadurch wiederholbar, ohne denselben Eintrag doppelt anzulegen. Ein vom
  Kinderschutz abgewiesener Inhalt wird daraus entfernt.

## Render und kontrolliertes Abschalten

- `/health/live` meldet ausschließlich, ob der Prozess lebt und nicht gerade
  herunterfährt.
- `/health/ready` prüft zusätzlich die betriebsbereite Erinnerungsschicht und
  eine kurze PostgreSQL-Abfrage. Geheimnisse oder personenbezogene Inhalte
  werden nicht ausgegeben.
- Ausschließlich `GET` und `HEAD` auf genau diese zwei Prüfpfade dürfen für
  Render ohne Cloudflare-Ursprungsschlüssel erreichbar sein. Alle Funktionswege
  bleiben durch den Ursprungsschutz geschlossen.
- Bei `SIGTERM` oder `SIGINT` wird die Instanz zuerst als nicht bereit markiert,
  nimmt keine neue Verbindung mehr an, beendet Leerlaufverbindungen und
  schließt danach PostgreSQL kontrolliert. Das interne Zeitlimit liegt unter
  Renders Abschaltfenster.
- Der Render-Health-Check soll im persönlichen Pam-Holo-Dienst auf
  `/health/ready` zeigen. Das wird erst dann als aktiv bezeichnet, wenn der
  konkrete Dienst mit dem geprüften Commit bereitgestellt und anschließend
  über Cloudflare kontrolliert wurde.
- Ein vollständiger Render-Anbieterausfall kann nicht allein durch Code auf
  demselben Anbieter verhindert werden. Ein späterer automatischer Ersatz
  verlangt einen unabhängigen zweiten Laufzeitort, konsistente Datenhaltung,
  identische Schutzregeln und einen getesteten Umschaltplan. Schreibende
  Anfragen dürfen dabei nicht blind wiederholt werden.

## Schrittweiser OpenAI-Weg

OpenAI ist Modell- und Agentenplattform, aber kein direkter Ersatz für die
gesamte Node-, PostgreSQL-, Geräte- und Cloudflare-Laufzeit. Deshalb gilt eine
geprüfte, rücksetzbare Reihenfolge:

1. Bestehende Textwege bleiben auf der OpenAI Responses API und erhalten vor
   jedem Provider-Aufruf die lokale Kinderschutzprüfung.
2. Sprache und Live-Interaktion verwenden nur kurzlebige Realtime-Sitzungen;
   dauerhafte API-Schlüssel gehören niemals in die App.
3. OpenAI Conversations kann später selektiv Sitzungszustand tragen, wird aber
   nicht ohne gesonderte Prüfung zur einzigen Quelle für Pams persönliche oder
   rechtlich relevante Erinnerungen.
4. File Search wird nur für ausdrücklich freigegebene Wissensbestände erwogen,
   nicht pauschal für Pams private Unterlagen, Gesundheits- oder Geschäftsdaten.
5. Verwaltete Agentenfunktionen werden erst nach gleicher Kinderschutz-,
   Fingerprint-, Empfänger- und Außenwirkungsprüfung zugelassen.
6. Jede Stufe erhält Regressionstests, Datensparsamkeit, eine Rückfallmöglichkeit
   und eine ausdrückliche Aktivierungsentscheidung. Es gibt keine ungesicherte
   Komplettmigration.

## Strikte Trennung von Human Holo

Diese technische Umsetzung aktiviert ausschließlich Pams eigenes Pam Holo.
Das offizielle Human Holo erhält weder diese Aktivierung noch die private
medizinische Freigabe. Erst nach dokumentierter anwaltlicher Freigabe dürfen
allgemeiner Code, Schutzregeln, Oberfläche und nicht personenbezogene
Funktionen gesondert übernommen werden.

Nie übertragen werden Pams Erinnerungen, Gespräche, Bilder, Videos, Stimme und
Stimmprofil, Gesundheitsdaten, Unterlagen, Kontakte, Standortverlauf,
geschäftliche Inhalte, persönliche Kennungen, Zugangsdaten, Cloudflare- oder
andere Schlüssel sowie daraus abgeleitete persönliche Informationen.
