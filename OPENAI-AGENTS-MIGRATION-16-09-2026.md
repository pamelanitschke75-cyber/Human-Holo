# Human Holo – OpenAI Agents Migration

Stand: 16.09.2026
Branch: `openai-agents-migration`

## Ziel

Human Holo schrittweise stärker auf OpenAI-Infrastruktur verlagern, ohne das produktive Pam-Holo oder den aktuellen Render-Dienst zu gefährden.

## Sicherheitsregel

- `main` bleibt produktiv und unverändert, bis ein paralleler OpenAI-Weg nachweislich funktioniert.
- Keine Änderung an Pam-Holo-Gedächtnis, persönlichen Daten, Kalenderdaten oder produktiver Datenbank in dieser Phase.
- Keine medizinischen Beratungsfunktionen aktivieren; bestehende rechtliche Pause bleibt bestehen.
- Keine Zugangsdaten oder API-Schlüssel im Repository speichern.

## Ist-Zustand

- Produktiver Server: Node/Express auf Render.
- Persistenz: PostgreSQL über `DATABASE_URL`.
- OpenAI: Responses API und Realtime werden bereits genutzt.
- Aktuelles Repository verwendet `openai` 5.x.
- Hintergrund-Wächter läuft getrennt über GitHub Actions; kein Render-Worker erforderlich.

## Was zuerst zu OpenAI kann

1. Agenten-/Aufgabenlogik
   - Managed Agents Sessions
   - OpenAI-hosted execution environments
   - Tool-Orchestrierung und länger laufende Agenten-Turns

2. Teile der bisherigen Server-Orchestrierung
   - Aufgaben zerlegen
   - Tool-Auswahl
   - Web-/Datei-/Code-Arbeit, sofern die jeweilige OpenAI-Agentenumgebung dafür geeignet und freigegeben ist

3. Später prüfen
   - welche OpenClaw-/Alltags-Logik durch OpenAI Agents ersetzt werden kann
   - welche Hintergrundaufgaben durch GitHub Actions nur noch angestoßen und anschließend von OpenAI ausgeführt werden können

## Was vorerst bei Render bleibt

- öffentlicher App-Endpunkt für die installierte Android-App
- PostgreSQL und dauerhaftes persönliches Gedächtnis
- Authentifizierung/Trusted-App-Session und bestehende Schutzschicht
- Realtime-Token-Ausgabe und alle produktiven App-Routen, bis der Ersatz getestet ist
- Integrationen, die dauerhafte Server-Credentials oder feste Webhooks benötigen

## Technische Voraussetzung für den Testzweig

Die Agents API wurde dem offiziellen OpenAI Node SDK ab Version 7.15 hinzugefügt. Die aktuelle SDK-Reihe benötigt Node 22 oder neuer. Deshalb wird die Migration isoliert in diesem Branch aufgebaut und nicht direkt in der produktiven Render-Konfiguration getestet.

## Phasen

### Phase 1 – isolierter Agenten-Prototyp
- separates Experiment-Verzeichnis
- Node 22
- OpenAI SDK 7.16+
- API-Key ausschließlich aus Umgebung
- keine Verbindung zur produktiven Human-Holo-Datenbank
- keine schreibenden externen Aktionen

### Phase 2 – Read-only Human-Holo Bridge
- Agent darf ausgewählte, nicht sensible Informationen über eine eng begrenzte Bridge abrufen
- keine persönlichen Schreibzugriffe
- vollständige Protokollierung

### Phase 3 – paralleler App-Test
- Pam-Holo kann ausgewählte Aufgaben wahlweise über alten oder neuen Pfad ausführen
- alter Render-Pfad bleibt Fallback
- Ergebnisse vergleichen

### Phase 4 – Render verkleinern
Erst wenn der OpenAI-Pfad stabil ist:
- ersetzte Orchestrierungslogik aus Render entfernen
- Render nur noch als schlanke API-/Persistenzschicht betreiben
- Kosten und Ausfallsicherheit neu bewerten

## Nicht-Ziel

Render wird nicht vorschnell abgeschaltet. Die OpenAI-hosted Agentenumgebung ist eine Ausführungsumgebung für Agenten-Sessions und derzeit kein 1:1-Ersatz für einen permanenten öffentlichen Node/Express-Server plus PostgreSQL.
