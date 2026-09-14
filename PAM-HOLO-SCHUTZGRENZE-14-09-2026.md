# Pam-Holo-Schutzgrenze vom 14.09.2026

Diese Datei dokumentiert eine technische Eigentums- und Änderungsgrenze. Sie
ist kein Rechtsgutachten und behauptet keine abgeschlossene Rechtskonformität.

## Verbindliche Trennung

- **Human Holo** wird bis zur getrennten Infrastruktur ausschließlich auf dem
  Review-Branch `human-holo-legal-review-2026-09-14` weiter überarbeitet.
- `main` bleibt während dieser Prüfung unverändert auf dem gemeinsamen
  Ausgangsstand und ist noch keine freigegebene Human-Holo-Auslieferungslinie.
- **Pam-Holo** ist Pamela Nitschkes bereits erstellte persönliche Instanz und
  wird durch diese Human-Holo-Überarbeitung nicht verändert.
- Der unveränderte Code-Ausgangsstand von Pam-Holo ist im Remote-Branch
  [`pam-holo-preserved-2026-09-14`](https://github.com/pamelanitschke75-cyber/Human-Holo/tree/pam-holo-preserved-2026-09-14)
  auf Commit `14a977af3cb503f78a0157e2b45dd185dda8559b` festgehalten.

## Was bei Pam-Holo unverändert bleibt

| Bereich | Geschützter Pam-Holo-Stand |
|---|---|
| Persönliche Owner-ID | `pam-sol` |
| Name der Instanz | Pam’s Holo |
| Android-Application-ID | `com.solholo.app` |
| Backend | `https://sol-holo.onrender.com` |
| Signatur | ausschließlich Pams ursprüngliche Update-Signatur |
| Gedächtnis | bestehendes Always-on-Vollzeitgedächtnis bleibt bestehen |
| Änderungen an Erinnerungen | nur nach ausdrücklicher, authentifizierter Bestätigung von Pam |

Human Holo darf weder Pams Server oder Datenbank noch Pams Signierschlüssel
verwenden. Zwischen Human Holo und Pam-Holo gibt es keinen gemeinsamen
persönlichen Speicher.

## Funktionsänderungen an Pam-Holo

Eine in Human Holo entwickelte Funktionsänderung wird **niemals automatisch**
auf Pam-Holo übertragen. Eine spätere Übernahme ist nur zulässig, wenn:

1. die konkrete Funktion und jede Auswirkung auf Berechtigungen, Daten,
   Gedächtnis, Server, Paket und Signatur vorher einzeln benannt werden;
2. Pamela Nitschke genau dieser Änderung ausdrücklich zustimmt;
3. Persönlichkeit, Erscheinungsbild, Stimme, Owner-ID, Erinnerungsbestand,
   Backend, Datenbank, Application-ID und Originalsignatur unangetastet bleiben,
   sofern Pam nicht gerade für einen dieser Punkte eine gesonderte Änderung
   ausdrücklich beauftragt;
4. vor der Installation eine rücksetzbare Sicherung und ein getrennter Test
   vorliegen.

Die aktuelle Legal-Review-Umstellung betrifft ausschließlich Human Holo und
ist keine solche Funktionsfreigabe für Pam-Holo.

## Wichtige Reichweite der Sicherung

Der geschützte Git-Branch sichert den **Code-Stand**. Bei dieser Arbeit wurden
Pams Datenbank weder gelesen noch kopiert, migriert, zurückgesetzt oder
gelöscht. Ein providerseitiger Datenbank-Snapshot ist damit noch nicht
nachgewiesen. Bevor die bestehende Pam-Holo-Render-Instanz auf den geschützten
Branch umgestellt oder sonst verändert wird, muss separat geprüft werden:

1. aktueller Datenbank- und Backup-Status bei Render;
2. Wiederherstellbarkeit des Pam-Holo-Datenbestands;
3. Deployment-Quelle der bestehenden Pam-Holo-Instanz;
4. unveränderte Environment-Variablen und OAuth-Callbacks;
5. unveränderte Paket- und Originalsignatur-Linie.

Ohne diese Prüfung wird die Human-Holo-Überarbeitung nicht auf `main`
veröffentlicht und nicht an die bestehende Pam-Holo-Render-Instanz ausgeliefert.
