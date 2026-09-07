package com.solholo.app;

public final class WhatsAppAutoSendCommandTest {
    private static final long NOW = 1_000_000L;

    public static void main(String[] args) {
        acceptsOnlyOfficialWhatsAppPackages();
        keepsOneCompleteCommandOnlyInProcessMemory();
        refusesToReplaceAnActiveCommand();
        expiresAndConsumesExactlyOnce();
        requiresExactMessageText();
        verifiesRecipientByExactNameOrPhoneSuffix();
        acceptsCurrentWhatsAppAccessibilityLabels();
        System.out.println("WhatsAppAutoSendCommandTest: OK");
    }

    private static void acceptsOnlyOfficialWhatsAppPackages() {
        assertTrue(
            WhatsAppAutoSendCommand.isAllowedPackage("com.whatsapp"),
            "Privates WhatsApp muss erlaubt sein"
        );
        assertTrue(
            WhatsAppAutoSendCommand.isAllowedPackage("com.whatsapp.w4b"),
            "WhatsApp Business muss erlaubt sein"
        );
        assertFalse(
            WhatsAppAutoSendCommand.isAllowedPackage("example.fake.whatsapp"),
            "Fremde Pakete müssen gesperrt bleiben"
        );
    }

    private static void keepsOneCompleteCommandOnlyInProcessMemory() {
        WhatsAppAutoSendCommand.clearForTests();
        WhatsAppAutoSendCommand.Pending pending =
            WhatsAppAutoSendCommand.arm(
                "com.whatsapp",
                "Steffi",
                "491234567890",
                "Ich liebe dich ❤️",
                NOW,
                30_000L
            );

        assertEquals("com.whatsapp", pending.packageName, "Paket");
        assertEquals("Steffi", pending.recipientName, "Empfängerin");
        assertEquals("491234567890", pending.phoneDigits, "Telefonnummer");
        assertEquals("Ich liebe dich ❤️", pending.message, "Nachricht");
        assertTrue(!pending.token.isEmpty(), "Einmaltoken fehlt");
    }

    private static void expiresAndConsumesExactlyOnce() {
        WhatsAppAutoSendCommand.clearForTests();
        WhatsAppAutoSendCommand.Pending pending =
            WhatsAppAutoSendCommand.arm(
                "com.whatsapp",
                "Steffi",
                "491234567890",
                "Ich liebe dich",
                NOW,
                10L
            );

        assertTrue(
            WhatsAppAutoSendCommand.peek(NOW + 10L) != null,
            "Auftrag darf bis einschließlich Ablaufzeit gültig bleiben"
        );
        assertTrue(
            WhatsAppAutoSendCommand.claim(pending.token, NOW + 5L) != null,
            "Erster Verbrauch muss gelingen"
        );
        assertTrue(
            WhatsAppAutoSendCommand.claim(pending.token, NOW + 5L) == null,
            "Zweiter Verbrauch muss gesperrt sein"
        );

        WhatsAppAutoSendCommand.Pending expiring =
            WhatsAppAutoSendCommand.arm(
                "com.whatsapp",
                "Steffi",
                "491234567890",
                "Bin gleich da",
                NOW,
                10L
            );
        assertTrue(
            WhatsAppAutoSendCommand.claim(expiring.token, NOW + 11L) == null,
            "Abgelaufener Auftrag darf nicht senden"
        );
    }

    private static void refusesToReplaceAnActiveCommand() {
        WhatsAppAutoSendCommand.clearForTests();
        WhatsAppAutoSendCommand.arm(
            "com.whatsapp",
            "Steffi",
            "491234567890",
            "Erste Nachricht",
            NOW,
            30_000L
        );
        boolean rejected = false;
        try {
            WhatsAppAutoSendCommand.arm(
                "com.whatsapp",
                "Steffi",
                "491234567890",
                "Zweite Nachricht",
                NOW + 1L,
                30_000L
            );
        } catch (IllegalArgumentException expected) {
            rejected = "WHATSAPP_COMMAND_ALREADY_ACTIVE".equals(
                expected.getMessage()
            );
        }
        assertTrue(rejected, "Aktiver Auftrag darf nicht ersetzt werden");
        WhatsAppAutoSendCommand.clearForTests();
    }

    private static void requiresExactMessageText() {
        assertTrue(
            WhatsAppAutoSendCommand.exactMessage(
                "Ich liebe dich ❤️",
                "Ich liebe dich ❤️"
            ),
            "Exakter Text muss passen"
        );
        assertFalse(
            WhatsAppAutoSendCommand.exactMessage(
                "Ich liebe dich",
                "Ich liebe dich ❤️"
            ),
            "Ein fehlendes Zeichen muss blockieren"
        );
        assertFalse(
            WhatsAppAutoSendCommand.exactMessage(
                "ich liebe dich ❤️",
                "Ich liebe dich ❤️"
            ),
            "Groß-/Kleinschreibung darf nicht still verändert werden"
        );
    }

    private static void verifiesRecipientByExactNameOrPhoneSuffix() {
        assertTrue(
            WhatsAppAutoSendCommand.matchesRecipientEvidence(
                "Steffi",
                "Steffi",
                "491234567890"
            ),
            "Exakter Kontaktname muss passen"
        );
        assertTrue(
            WhatsAppAutoSendCommand.matchesRecipientEvidence(
                "+49 123 4567890",
                "Steffi",
                "491234567890"
            ),
            "Passende internationale Nummer muss passen"
        );
        assertTrue(
            WhatsAppAutoSendCommand.matchesRecipientEvidence(
                "Schatz ❤️, tippe hier, um Kontaktinfos anzuzeigen",
                "Schatz ❤️",
                "491234567890"
            ),
            "WhatsApps erweiterte Kontaktbeschreibung muss passen"
        );
        assertFalse(
            WhatsAppAutoSendCommand.matchesRecipientEvidence(
                "Stefanie",
                "Steffi",
                "491234567890"
            ),
            "Ähnlicher Name darf nicht ausreichen"
        );
        assertFalse(
            WhatsAppAutoSendCommand.matchesRecipientEvidence(
                "+49 123 0000000",
                "Steffi",
                "491234567890"
            ),
            "Andere Nummer muss gesperrt bleiben"
        );
    }

    private static void acceptsCurrentWhatsAppAccessibilityLabels() {
        assertTrue(
            WhatsAppAutoSendCommand.matchesSendLabel("Senden"),
            "Deutsche Senden-Beschriftung muss passen"
        );
        assertTrue(
            WhatsAppAutoSendCommand.matchesSendLabel("Senden, Schaltfläche"),
            "Erweiterte deutsche Senden-Beschriftung muss passen"
        );
        assertFalse(
            WhatsAppAutoSendCommand.matchesSendLabel("Sprachnachricht senden"),
            "Andere WhatsApp-Aktionen dürfen nicht als Text-Senden gelten"
        );
    }

    private static void assertTrue(boolean value, String message) {
        if (!value) {
            throw new AssertionError(message);
        }
    }

    private static void assertFalse(boolean value, String message) {
        assertTrue(!value, message);
    }

    private static void assertEquals(
        String expected,
        String actual,
        String label
    ) {
        if (!expected.equals(actual)) {
            throw new AssertionError(
                label + ": erwartet=" + expected + ", tatsächlich=" + actual
            );
        }
    }
}
