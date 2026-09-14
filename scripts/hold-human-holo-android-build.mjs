const message = [
  "HUMAN_HOLO_ANDROID_BUILD_HELD",
  "Human Holo besitzt noch keine von Pamela Nitschke freigegebene Android-Application-ID und Signatur.",
  "Der Platzhalter invalid.humanholo.unconfigured darf nicht veröffentlicht werden.",
  "Pam-Holos com.solholo.app und Pams Signierschlüssel sind für Human Holo gesperrt."
].join("\n");

console.error(message);
process.exitCode = 1;
