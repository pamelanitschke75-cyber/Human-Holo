# Human Holo – private Wiedererkennung der Ownerin

Stand: 13.09.2026
Entscheidung und Projektinhaberin: Pamela Christina Nitschke
Technische Umsetzung: Human Holo mit ChatGPT/OpenAI

## Ziel

Pam’s Holo soll auf einem bewusst gesendeten einzelnen Foto prüfen können, ob
die sichtbare Person Pam selbst ist. Die Funktion ergänzt die vorhandene
Bildanalyse und das ownergebundene Gedächtnis; sie ersetzt oder entfernt keine
bestehende Funktion.

## Zulässiger und technisch umgesetzter Umfang

- fest gebunden an Owner-ID `pam-sol` und Sprecher-ID `pam`,
- nur in einer kryptografisch bestätigten App-Sitzung,
- getrennte, ausdrückliche und jederzeit widerrufbare Einwilligung,
- Pams bereits ownergebundenes lokales Holo-Profilbild als Referenz,
- genau ein von Pam manuell gesendetes Prüffoto,
- privater 1:1-Abgleich ausschließlich über ChatGPT/OpenAI,
- Bestätigung nur bei genau einem klaren Gesicht in Referenz- und Prüffoto und
  einem vom Modell als hochsicher bewerteten Treffer,
- bei Unklarheit, Gruppenbild, Verdeckung oder technischem Fehler kein Name,
- kein Benennen oder Erraten anderer Personen,
- keine Ableitung sensibler Eigenschaften,
- keine Live-Kamera, kein Video, keine öffentliche oder heimliche Überwachung.

## Datenschutz und Speicherung

Referenz- und Prüffoto werden nur für den aktuellen Abgleich übertragen. Für
das OpenAI-Response-Objekt ist `store: false` gesetzt; dadurch wird die normale
Speicherung des Response-Anwendungszustands ausgeschaltet. Human Holo speichert
die beiden Bilddateien nicht im Vollzeitgedächtnis. Dort bleiben nur der
sichtbare Hinweis auf das gesendete Foto, Pams Nachricht und Holos Ergebnis als
Teil des ownergebundenen Dialogs.

Diese technische Einstellung ist nicht mit Zero Data Retention gleichzusetzen.
OpenAI verwendet API-Daten standardmäßig nicht zum Modelltraining, kann Inhalte
aber nach den aktuell veröffentlichten API-Datenkontrollen bis zu 30 Tage in
Missbrauchsschutz-Protokollen aufbewahren, sofern für das verwendete Projekt
keine Zero Data Retention bestätigt ist. Gesetzlich oder in besonderen
Sicherheitsfällen kann eine längere Aufbewahrung nötig sein. Der sichtbare
Einwilligungstext nennt diese Grenze ausdrücklich.

Das lokale Profilbild und die Einwilligung sind weiterhin ausdrücklich von der
Human-Holo-Sicherungsdatei ausgeschlossen. Beim Austausch oder Löschen des
Profilbildes wird die Einwilligung automatisch widerrufen. Unter
„Verbindungen“ kann Pam sie jederzeit mit einem Antippen ausschalten, ohne das
Holo-Bild oder andere Funktionen zu verändern. Der Widerruf stoppt alle
künftigen Abgleiche; bereits entstandene OpenAI-Missbrauchsschutz-Protokolle
kann Human Holo nicht rückwirkend löschen.

## Bewusste Grenze

Weitere Personen sind nicht automatisch eingeschlossen. Steffi, Angehörige
oder andere Menschen dürfen erst nach ihrer jeweils eigenen ausdrücklichen
Einwilligung und einer dafür getrennt geprüften sicheren Umsetzung aufgenommen
werden.

## Grenze vor öffentlicher Veröffentlichung

Ein privater Testbuild und eine öffentliche Produktionsfreigabe sind zwei
verschiedene Stufen. Vor einem Rollout über Google Play müssen mindestens:

- die tatsächlich geltenden OpenAI-Aufbewahrungsbedingungen und die
  vertraglichen Datenschutz- und Drittlandgrundlagen bestätigt sein,
- die öffentliche Datenschutzerklärung dem ausgelieferten Verhalten
  entsprechen,
- im Play-Datensicherheitsformular die freiwillig übertragenen Kategorien
  „Fotos“ und „Name“, die optionale Verarbeitung und der Zweck
  „App-Funktionalität“ geprüft und wahrheitsgemäß angegeben sein,
- ein echter S23-Praxistest Unsicherheit, Widerruf und Fehlerfall bestätigen.

Bis diese Punkte bestätigt sind, ist die Wiedererkennung nicht für einen
öffentlichen Google-Play-Produktionsrollout freigegeben.

## Prüfstand

- Modul-, Policy-, Owner-, Einwilligungs-, Unsicherheits- und
  Integrationsprüfungen ergänzt,
- vollständiger automatisierter Projektbestand erfolgreich geprüft,
- echter S23-Praxistest mit zwei unterschiedlichen Fotos von Pam steht nach dem
  signierten Update noch aus.

## Offizielle Grundlagen

- [DSGVO, insbesondere Art. 5, 7, 9 und 13](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [OpenAI Usage Policies](https://openai.com/policies/usage-policies/)
- [OpenAI API-Datenkontrollen](https://developers.openai.com/api/docs/guides/your-data)
- [Google Play User Data](https://support.google.com/googleplay/android-developer/answer/10144311?hl=de)
- [Google Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=de)
