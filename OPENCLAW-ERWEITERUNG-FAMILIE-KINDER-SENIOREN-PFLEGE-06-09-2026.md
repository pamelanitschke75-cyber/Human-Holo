# OpenClaw-Erweiterung: Familie, Kinder, Senioren und Pflege

**Datum:** 06.09.2026  
**Initiatorin und Projektinhaberin:** Pamela Nitschke  
**Projekt:** Sol Holo · SH♾️  
**Leitsatz:** Miteinander füreinander. Together forever.  
**Status:** technisch ergänzt und im GitHub-Docker-Pflichtlauf verifiziert;
nicht produktiv

## Korrektur des bisherigen Worker-Grundgerüsts

Familie, Kinderbetreuung, Senioren und pflegebedürftige Menschen gehörten nach
Pams Festlegung von Anfang an zu Sol Holo. Sie waren in Schutz- und
Alltagsgrundsätzen bereits berücksichtigt, im OpenClaw-Labor jedoch bisher nur
unter Alltag beziehungsweise assistiven Sicherheitsregeln mitgedacht. Eigene
Worker fehlten. Diese unvollständige technische Aufteilung wird jetzt ergänzt,
ohne einen bestehenden Bereich oder früheren Nachweis zu löschen.

Das Grundgerüst umfasst damit acht getrennte Worker:

1. Alltag und Verständigung
2. Familie und Kinder
3. Senioren sowie hilfe- und pflegebedürftige Menschen
4. Geschäftliches
5. Tiere
6. Kochen
7. Sicherheit
8. Medizin

## Gemeinsame höchste Schutzpriorität

**Kinder sowie Senioren und hilfe- oder pflegebedürftige Menschen stehen bei
Sol Holo immer an erster Stelle.**

Beide neuen Worker tragen deshalb im maschinenlesbaren Grundmanifest die
Schutzpriorität `highest`. Keiner der beiden Bereiche wird dem anderen
pauschal nachgeordnet. Bei einer konkret beschriebenen akuten Gefahr hat der
unmittelbar notwendige Schutz Vorrang. Darüber hinaus bleiben Wohl, Würde,
Selbstbestimmung, Einwilligung und Privatsphäre verbindlich.

## Worker Familie & Kinder

Der Worker darf ausschließlich deutlich markierte fiktive Testangaben lesen,
ordnen und einen altersgerechten unverbindlichen Vorschlag formulieren.

Verbindlich gelten insbesondere:

- Sicherheit, Schutz und Wohlergehen des Kindes zuerst;
- ein Kind soll Kind sein dürfen;
- keine heimliche Totalüberwachung;
- keine unterstellten Familienverhältnisse, Sorgeberechtigungen oder
  Zustimmungen;
- kein Ersatz für eine erwachsene Betreuungsperson;
- keine Erziehungs-, Sorgerechts-, Diagnose-, Therapie- oder
  Medikamentenentscheidung;
- keine automatische Kontaktaufnahme oder Übergabe an andere Worker.

## Worker Senioren & hilfe-/pflegebedürftige Menschen

Der Worker darf ausschließlich deutlich markierte fiktive Testangaben zu
Alltag, Wünschen, Barrierefreiheit und ausdrücklich gewünschter Unterstützung
lesen, ordnen und einen respektvollen unverbindlichen Vorschlag formulieren.

Verbindlich gelten insbesondere:

- Sicherheit, Schutz, Wohl und Würde zuerst;
- Alter oder Pflegebedarf bedeuten nicht automatisch Hilflosigkeit oder
  Entscheidungsunfähigkeit;
- keine Bevormundung oder Infantilisierung;
- keine unterstellte Einwilligung, Vollmacht oder Vertretungsbefugnis;
- kein Ersatz für Pflege, Betreuung oder medizinische Fachpersonen;
- keine Pflegegrad-, Diagnose-, Therapie-, Medikamenten- oder
  Rechtsentscheidung;
- keine automatische Kontaktaufnahme oder Übergabe an andere Worker.

## Unveränderte technische Grenzen

Beide Worker besitzen wie alle anderen Labor-Worker:

- ein eigenes getrenntes Workspace und Agent-Verzeichnis;
- ausschließlich das Werkzeug `read`;
- ein schreibgeschütztes Docker-Workspace und Root-Dateisystem;
- kein Netzwerk und keine Linux-Capabilities;
- keine Skills, Plugins oder Agent-zu-Agent-Kommunikation;
- ausschließlich synthetische Testdaten;
- keinen Zugriff auf Sol Holo, `pam-sol`, persönliche Erinnerungen, Kinder-,
  Familien-, Gesundheits-, Pflege-, Kontakt-, Standort- oder Einwilligungsdaten;
- keine Freigabe für externe oder schreibende Aktionen.

Eine empfohlene Weiterleitung an menschliche Betreuung, fachliche Hilfe,
Sicherheit oder Medizin bleibt nur ein sichtbarer Vorschlag. Ein Worker darf
keinen anderen Worker selbst aufrufen.

## Technischer Nachweis

Das zentrale Manifest, beide Übergabeverträge, die OpenClaw-Konfiguration, der
deterministische Testtreiber und die Container-Prüfsuite werden gemeinsam von
sechs auf acht Worker erweitert. Der Pflichtlauf prüft für jeden neuen Worker:

- eigene fiktive Datei lesbar;
- Nachbar-Workspace technisch nicht lesbar;
- Schreiben technisch blockiert;
- eigenes Docker-Workspace schreibgeschützt;
- Docker-Netzwerk `none`;
- Root-Dateisystem schreibgeschützt;
- alle Capabilities entfernt und `no-new-privileges` aktiv;
- kein schreibbarer Bind-Mount.

Der [GitHub-Actions-Lauf #25](https://github.com/pamelanitschke75-cyber/Sol-Holo-/actions/runs/34058646736)
bestand den vollständigen Nachweis für alle acht Worker: `8/8` eigene
Lesezugriffe erlaubt, `8/8` Fremdleseversuche blockiert und `8/8`
Schreibversuche blockiert. Alle acht Container erfüllten die vorgesehenen
Mount- und Härtungsregeln. Der Status ist deshalb `verified`. Eine produktive
Verbindung oder Freigabe folgt daraus ausdrücklich nicht.

**Der bisherige Stand wird erweitert, niemals ersetzt.**
