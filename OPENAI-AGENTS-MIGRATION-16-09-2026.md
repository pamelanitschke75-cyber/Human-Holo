# Human Holo – OpenAI Agents Migration

Stand: 16.09.2026
Branch: `openai-agents-migration`

## Ziel

Human Holo soll so weit technisch sinnvoll vollständig auf OpenAI-Infrastruktur verlagert werden. Render wird erst abgeschaltet oder verkleinert, wenn für jede produktive Funktion ein getesteter Ersatz vorhanden ist. Das produktive Pam-Holo bleibt bis dahin unverändert und funktionsfähig.

## Sicherheitsregel

- `main` bleibt produktiv und unverändert, bis ein paralleler OpenAI-Weg nachweislich funktioniert.
- Keine Änderung an Pam-Holo-Gedächtnis, persönlichen Daten, Kalenderdaten oder produktiver Datenbank in der Testphase.
- Keine medizinischen Beratungsfunktionen aktivieren; bestehende rechtliche Pause bleibt bestehen.
- Keine Zugangsdaten oder API-Schlüssel im Repository speichern.
- Erinnerungsdaten, Zugangsdaten, Geräteidentitäten und externe Provider-Tokens bleiben logisch getrennt.

## Kostenleitplanken

- Monatlicher Gesamtdeckel für Human Holo: 120 EUR. Ziel ist deutlich darunter zu bleiben.
- Routine-, Prüf- und Hintergrundaufgaben bevorzugt mit `gpt-5.6-luna` ausführen.
- Leistungsstärkere Modelle nur einsetzen, wenn Luna qualitativ nicht ausreicht.
- Keine dauerhaft laufenden Render-Worker nur für Agenten- oder Prüfaufgaben.
- Zeitgesteuerte Auslöser bevorzugt über GitHub Actions; Agentenarbeit über OpenAI.
- Vor Abschalten oder Hochstufen eines Dienstes tatsächliche Nutzungs- und Kostenwerte vergleichen.
- Keine kostenpflichtige Infrastruktur vorsorglich aktivieren; erst bei nachgewiesenem Bedarf.

## Aktuell bestätigte OpenAI-Bausteine

- Managed Agents Sessions funktionieren im isolierten Testzweig.
- OpenAI Conversations sind als persistenter Gesprächszustand vorgesehen.
- OpenAI Files + Vector Stores sind Kandidaten für semantisches Langzeitgedächtnis und Wiederfinden von Erinnerungen.
- GitHub Actions kann OpenAI-Aufgaben zeitgesteuert anstoßen; kein Render-Worker erforderlich.

## Produktives Speicherinventar – nur Struktur und Anzahl, keine Inhalte ausgelesen

Stand der Render-Postgres-Struktur am 16.09.2026:

- `sol_fulltime_memory`: 5.834 Datensätze
- `sol_memory`: 2.130 Datensätze
- `sol_identity_memory`: 104 Datensätze
- `sol_identity_memory_supersession`: 22 Datensätze
- `sol_long_term_memory`: 18 Datensätze
- `sol_calendar_actions`: 15 Datensätze
- `sol_google_tokens`: 2 Datensätze
- `sol_trusted_app_devices`: 1 Datensatz
- `sol_notes`: 0 Datensätze
- `sol_smartthings_allowed_devices`: 0 Datensätze
- `sol_smartthings_tokens`: 0 Datensätze
- `human_holo_voice_profiles`: 0 Datensätze
- `human_holo_animal_profile_photo`: 0 Datensätze
- `human_holo_single_call_proof`: 0 Datensätze

## Zielabbildung

### Zu OpenAI

- Agenten- und Aufgabenlogik
- Gesprächszustand über Conversations
- semantisches Erinnern über Files/Vector Stores
- längere Agentenläufe und Tool-Orchestrierung
- später ausgewählte OpenClaw-/Alltagslogik

### Nicht in semantischen OpenAI-Speicher mischen

- Google OAuth Access-/Refresh-Tokens
- SmartThings-Tokens
- Trusted-App-Geräteschlüssel und Zertifikats-Fingerprints
- kurzlebige Sicherheitsnachweise

Diese Daten sind Zugangsdaten/Sicherheitszustand und müssen separat, verschlüsselt und minimal gehalten werden. Sie dürfen nicht als normale Erinnerung indexiert werden.

## Ist-Zustand

- Produktiver Server: Node/Express auf Render.
- Persistenz: PostgreSQL über `DATABASE_URL`.
- OpenAI: Responses API und Realtime werden bereits genutzt.
- Produktives Repository verwendet derzeit `openai` 5.x.
- Migrations-Prototyp verwendet isoliert OpenAI SDK 7.16+ und Node 22.
- Hintergrund-Wächter läuft über GitHub Actions; kein Render-Worker erforderlich.

## Phasen

### Phase 1 – OpenAI-Bausteine beweisen

- Managed Agents Session: erfolgreich getestet.
- Conversation + Vector-Store-Memory: isolierter Test mit ausschließlich synthetischen Daten.
- Keine produktiven personenbezogenen Daten in dieser Phase.

### Phase 2 – produktive Daten sicher exportierbar machen

- Exportformat für Vollzeit-, Identity- und Long-Term-Memory definieren.
- Owner-ID und Quelle pro Erinnerung erhalten.
- Prüfsummen erhalten, damit Vollständigkeit nach Migration kontrollierbar ist.
- Zugangsdaten ausdrücklich aus dem Memory-Export ausschließen.

### Phase 3 – Parallelimport und Vergleich

- Erinnerungen zunächst kopieren, nicht verschieben.
- Stichproben und Anzahl/Prüfsummen vergleichen.
- alter Render-Speicher bleibt Fallback, bis Vollständigkeit bestätigt ist.

### Phase 4 – App-Pfade umstellen

- Agenten-/Memory-Leseweg auf OpenAI schalten.
- Schreibweg kontrolliert umstellen.
- Kalender, Nachrichten, Geräte und Realtime jeweils separat testen.

### Phase 5 – Render zurückbauen

- erst nach erfolgreicher Parallelphase.
- keine Datenbank löschen, bevor Export, Import und Wiederabruf bestätigt sind.
- verbleibende Serverfunktion nur behalten, wenn OpenAI dafür keinen geeigneten Ersatz bietet.

## Wichtige technische Grenze

OpenAI Conversations, Files, Vector Stores und Agents ersetzen viele Orchestrierungs- und Memory-Aufgaben, sind aber kein klassischer relationaler PostgreSQL-Server. Sicherheitsdaten, OAuth-Tokens, Gerätevertrauen und externe Webhooks müssen deshalb entweder in einer geeigneten geschützten Persistenz verbleiben oder durch einen anderen dafür vorgesehenen Mechanismus ersetzt werden.
