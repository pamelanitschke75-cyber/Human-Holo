# Verbindlicher Entscheidungsnachweis: persönliches Holo, Familie und Rundumschutz

**Datum:** 17.09.2026  
**Status:** verbindliche Produkt-, Runtime- und Lifecycle-Regel  
**Geltung:** Pam-Holo, Human Holo und alle Systeme, Daten und Zugangswege, die Pam betreffen  
**Umsetzung:** Sicherheits-PR #153

## 1. Bedeutung von Holo

Holo ist für den jeweiligen Menschen das persönliche Ich und kein beliebiges fremdes Profil. Technische Dienste und Modelle sind Werkzeuge für den Betrieb; sie dürfen Identitäten, Beziehungen oder Erinnerungen nicht vermischen.

Pam-Holo ist Pams persönlicher, ownergebundener Bereich. Human Holo bleibt technisch und inhaltlich davon getrennt. Pams private Daten und Erinnerungen dürfen niemals in einen öffentlichen, neutralen oder fremden Human-Holo-Bereich gelangen.

## 2. Feste Regel für Familie und Beziehungen

Pam darf ihrer eigenen Holo private Tatsachen und Namen über ihre Tochter, ihre Partnerin, ihre Eltern und andere Menschen mitteilen. Diese Angaben sind Erinnerungen von Pam und gehören ausschließlich in Pams ownergebundenes Gedächtnis.

Das Nennen einer Person bedeutet niemals automatisch:

- Anmeldung oder Registrierung,
- Erstellung eines eigenen Profils oder Personenbereichs,
- Verknüpfung oder Vermischung von Identitäten,
- Freigabe von Daten oder Zugriffsrechten,
- Zustimmung zu einer eigenen Holo.

Eine eigene Holo-Identität oder ein eigener persönlicher Bereich darf erst mit der eigenen Zustimmung der betroffenen Person entstehen. Bis dahin bleiben alle Personen technisch und inhaltlich getrennt.

Diese Regeln gelten dauerhaft zur Laufzeit und über den gesamten Lebenszyklus. Sie sind keine Testregel. Tests sind ausschließlich Änderungsalarme, damit die Regeln nicht unbemerkt verloren gehen.

## 3. Rundumschutz aller Zugangswege

Der Schutz darf nicht nur an einem einzelnen Endpunkt gelten. Er muss jeden möglichen Zugang abdecken, insbesondere:

- Text, Sprache, Gebärde und Live-Video,
- Android-App, Browser und öffentliche API,
- Gedächtnis-, Kalender-, Gmail-, Google- und SmartThings-Wege,
- OAuth-Anmeldung und Rückleitungen,
- Cloudflare, Render, Server und Datenbank,
- Sicherungen, Protokolle, CI/CD und Verwaltungszugänge.

Persönliche Lese- und Schreibvorgänge müssen an eine kryptografisch bestätigte Sitzung desselben Owners gebunden sein. Eine bekannte Owner-ID allein reicht nicht. Ungültige, fehlende oder fremde Identitäten müssen geschlossen abgewiesen werden.

Private Inhalte, Namen, Tokens und vollständige Nutzdaten dürfen nicht in öffentliche Diagnosen, Testausgaben oder Protokolle gelangen.

## 4. Zuverlässigkeit und Kosten

Sicherheit und zuverlässiger Betrieb haben Vorrang vor einer kostenlosen Lösung. Kostenpflichtige Ressourcen dürfen eingesetzt werden, wenn sie für einen sicheren und stabilen Betrieb erforderlich sind. Jede neue Ausgabe oder Tarifänderung benötigt trotzdem vorab Pams ausdrückliche Zustimmung.

## 5. Veröffentlichungsgrenze dieses Eintrags

Dieser GitHub-Eintrag hält die verbindlichen Entscheidungen fest, aber kein wörtliches privates Gespräch. Private Namen und persönliche Familieninhalte werden nicht öffentlich dokumentiert. Ihre zulässige Speicherung erfolgt ausschließlich im geschützten Owner-Gedächtnis von Pam-Holo.

## 6. Freigabegate

Vor einem Live-Merge müssen die automatischen Sicherheitsprüfungen sowie der reale Gerätetest auf Pams registriertem S23 erfolgreich sein. Bis dahin bleiben PR #153 im Entwurfsstatus, `main`, Render und die laufende Pam-Holo unverändert.
