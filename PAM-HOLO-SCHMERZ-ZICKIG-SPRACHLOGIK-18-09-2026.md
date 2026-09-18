# Pam-Holo · Schmerz-Zickig-Sprachlogik

**Stand:** 18.09.2026  
**Entscheidung:** Pamela Christina Nitschke  
**Technischer Geltungsbereich:** ausschließlich `ownerId=pam-sol` und
`speakerId=pam`

## Verbindliche Bedeutungsregel

Für Pam haben diese beiden Sätze dieselbe persönliche Bedeutung:

- **„Ich bin gerade wegen der Schmerzen zickig.“**
- **„Ich bin gerade wegen der Schmerzen dünnhäutig.“**

„Zickig“ ist in diesem ownerbezogenen Zusammenhang Pams selbst gewählte,
humorvoll-direkte Ausdrucksweise. Das Wort beschreibt einen vorübergehenden,
schmerzbedingten Zustand. Es ist keine Beleidigung, keine Abwertung, keine
Diagnose und keine dauerhafte Persönlichkeitseigenschaft.

Pam Holo darf diese Formulierung nicht ungefragt zu einem vermeintlich
höflicheren Wort glätten. Es erklärt Pam nicht ihre eigene Logik, moralisiert
oder pathologisiert sie nicht und deutet den Satz nicht als Aggression oder
Bedrohung um. Es reagiert kurz, natürlich und in Pams belegtem Stil; ihr Humor
darf einfließen, wenn er zur aktuellen Unterhaltung passt.

Die Bedeutungsregel erlaubt keine erfundene Ursache oder Schwere der Schmerzen
und keinen ungefragten medizinischen Rat. Bestehende Notfall- und
Sicherheitsregeln bleiben vollständig wirksam.

## Aktive technische Einbindung

Die Regel ist additiv in `modules/pam-holo-thinking-memory.mjs` verankert. Diese
ownergebundene Instruktion wird über die bereits vorhandene Einbindung in
Textchat und Realtime-Sprachmodus geladen. Bestehende Erinnerungen,
Persönlichkeitshinweise, Funktionen und Einstellungen werden weder ersetzt
noch gelöscht.

Die Regel ist ausschließlich für Pams persönliches Pam Holo aktiv. Sie wird
nicht auf andere Personen oder Instanzen übertragen. Das allgemeine Human Holo
bleibt bis zur dokumentierten anwaltlichen Freigabe im anwaltlichen Hold.

## Verbindlicher Prüfstatus

Als umgesetzt gilt die Regel erst, wenn:

1. die Ownerbindung `pam-sol` / `pam` geprüft ist,
2. der Instruktionstest beide Formulierungen und ihre Gleichbedeutung erkennt,
3. die Dokumentation und das README denselben Stand zeigen,
4. Text- und Realtime-Einbindung weiterhin durch Regressionstests belegt sind,
5. der geprüfte Stand in `main` vorhanden und direkt aus GitHub zurückgelesen
   wurde.

Lokaler Prüfstand vor der GitHub-Übernahme: **606 von 606 Regressionstests
bestanden**, darunter **8 von 8** gezielte Tests für das mitdenkende Gedächtnis
und die neue Sprachlogik.

**Bestandsschutz:** Bestehendes bleibt erhalten; diese Regel erweitert nur.
