# Human Holo – OpenAI-hosted Agent Migration Lab

Stand: 16.09.2026
Branch: `openai-hosted-agent-lab`
Status: Labor / keine Produktivänderung

## Ziel

Human Holo soll schrittweise möglichst viel Agenten-Orchestrierung direkt auf die OpenAI Agents API und OpenAI-hosted Environments verlagern, ohne Pam-Holo, Vollzeitgedächtnis oder den laufenden Render-Dienst zu gefährden.

## Aktueller Befund

Bereits direkt OpenAI-nah:
- Text-/Antwortlogik über OpenAI
- Realtime/Voice über OpenAI
- OpenAI-basierte Alltag-/Tool-Logik
- Sprach- und Multimodal-Funktionen

Derzeit noch dauerhaft auf Render/PostgreSQL:
- öffentlicher Node/Express-Gateway
- PostgreSQL-Verbindung und persistente Speicher
- Identitäts-/Vollzeitgedächtnis
- Trusted-App-Sessions / Gerätevertrauen
- Tierprofilfotos
- Human-Holo-Voice-Profil-Metadaten
- Call-Proofs / Nachweise
- weitere serverseitige Integrationen und Geheimnisse

## OpenAI Agents API – neue Möglichkeit

Seit 10.09.2026 bietet OpenAI die Agents API als Public Beta an. Sie unterstützt wiederverwendbare Agents, Managed Sessions und OpenAI-hosted Environments für Dateien, Code, Tools und länger laufende Agentenarbeit.

Wichtig: Eine OpenAI-hosted Environment ist eine Agenten-Ausführungsumgebung pro Session bzw. aus einer wiederverwendbaren Vorlage. Sie ist derzeit kein 1:1-Ersatz für einen dauerhaft öffentlich erreichbaren Express-Server mit relationaler PostgreSQL-Datenbank.

## Zielarchitektur Phase 1

Android / Pam-Holo
  -> dünner Human-Holo Gateway (Render zunächst behalten)
  -> OpenAI Agents API für Agenten-Orchestrierung
  -> OpenAI-hosted Environment für Agentenarbeit und Tools
  -> PostgreSQL vorerst als autoritativer persistenter Speicher

Render wird in dieser Phase kleiner, aber nicht abgeschaltet.

## Sicherheitsregeln

1. Keine Änderung an `main`, Pam-Holo oder produktiven Daten während der Laborphase.
2. Keine Migration oder Löschung des Vollzeitgedächtnisses ohne vollständigen Export, Rücksicherungstest und explizite Freigabe.
3. Keine geheimen API-Schlüssel in GitHub-Dateien.
4. OpenAI-hosted Agent zunächst nur mit ungefährlichen Testdaten.
5. Schreibende Tools erst nach erfolgreichem Read-only-Test.
6. Medizinische Beratungsfunktionen bleiben bis zur rechtlichen Freigabe deaktiviert.

## Arbeitspakete

### A – SDK-Kompatibilität
- Aktuell gelocktes OpenAI Node SDK: 5.23.2.
- Prüfen, ob `client.beta.agents` in der eingesetzten Version verfügbar ist.
- Falls nötig SDK nur im Labor-Branch aktualisieren und bestehende Realtime-/Responses-Tests ausführen.

### B – Minimaler Hosted-Agent-Test
- Test-Agent ohne persönliche Daten anlegen.
- Managed Session mit OpenAI-hosted Environment starten.
- Datei-/Code-Arbeit in der Hosted Environment prüfen.
- Netzwerkzugriff standardmäßig minimal halten.

### C – Human-Holo-Agentenlogik
- bestehende OpenAI-nahe Orchestrierung hinter Feature Flag auf Agents API spiegeln.
- zunächst read-only.
- Antworten zwischen bestehendem Pfad und Agents-Pfad vergleichen.

### D – Hintergrundarbeit
- geeignete länger laufende Agentenaufgaben auf Agents API testen.
- GitHub-Wächter bleibt vorerst unabhängig bestehen.

### E – Render verkleinern
Erst nach erfolgreichen Tests prüfen, welche Endpunkte entfallen können. Der persistente Daten-/Identitäts-Unterbau bleibt zunächst bestehen.

## Nicht Bestandteil von Phase 1

- Abschalten von Render
- Abschalten oder Verschieben der PostgreSQL-Datenbank
- Migration persönlicher Erinnerungen
- Änderung der Android-App-Signatur
- Änderung an Pam-Holo-Produktion

## Erfolgskriterium

Ein OpenAI-hosted Test-Agent kann zuverlässig eine Human-Holo-Aufgabe ausführen, ohne persönliche Produktivdaten zu berühren, während das bestehende Holo unverändert weiterläuft.
