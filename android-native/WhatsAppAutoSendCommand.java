package com.solholo.app;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Process-local, single-use authorization for one explicitly requested
 * WhatsApp send action. Nothing is persisted and a process restart always
 * fails closed.
 */
public final class WhatsAppAutoSendCommand {
    static final long DEFAULT_TTL_MS = 30_000L;

    public static final class Pending {
        public final String token;
        public final String packageName;
        public final String recipientName;
        public final String phoneDigits;
        public final String message;
        public final long createdAtMillis;
        public final long expiresAtMillis;

        private Pending(
            String token,
            String packageName,
            String recipientName,
            String phoneDigits,
            String message,
            long createdAtMillis,
            long expiresAtMillis
        ) {
            this.token = token;
            this.packageName = packageName;
            this.recipientName = recipientName;
            this.phoneDigits = phoneDigits;
            this.message = message;
            this.createdAtMillis = createdAtMillis;
            this.expiresAtMillis = expiresAtMillis;
        }
    }

    private static Pending pending;

    private WhatsAppAutoSendCommand() {}

    public static synchronized Pending arm(
        String packageName,
        String recipientName,
        String phoneDigits,
        String message
    ) {
        return arm(
            packageName,
            recipientName,
            phoneDigits,
            message,
            nowMillis(),
            DEFAULT_TTL_MS
        );
    }

    static synchronized Pending arm(
        String packageName,
        String recipientName,
        String phoneDigits,
        String message,
        long nowMillis,
        long ttlMillis
    ) {
        if (!isAllowedPackage(packageName)) {
            throw new IllegalArgumentException("WHATSAPP_PACKAGE_NOT_ALLOWED");
        }
        if (peek(nowMillis) != null) {
            throw new IllegalArgumentException("WHATSAPP_COMMAND_ALREADY_ACTIVE");
        }
        String cleanRecipient = cleanSingleLine(recipientName);
        String cleanDigits = digitsOnly(phoneDigits);
        String cleanMessage = message == null ? "" : message.trim();
        if (
            cleanRecipient.isEmpty()
                || cleanDigits.length() < 7
                || cleanMessage.isEmpty()
                || ttlMillis <= 0L
        ) {
            throw new IllegalArgumentException("WHATSAPP_COMMAND_INCOMPLETE");
        }

        long expiresAtMillis;
        try {
            expiresAtMillis = Math.addExact(nowMillis, ttlMillis);
        } catch (ArithmeticException ignored) {
            expiresAtMillis = Long.MAX_VALUE;
        }
        pending = new Pending(
            UUID.randomUUID().toString(),
            packageName,
            cleanRecipient,
            cleanDigits,
            cleanMessage,
            nowMillis,
            expiresAtMillis
        );
        return pending;
    }

    public static synchronized Pending peek() {
        return peek(nowMillis());
    }

    static synchronized Pending peek(long nowMillis) {
        if (pending == null) {
            return null;
        }
        if (nowMillis > pending.expiresAtMillis) {
            pending = null;
            return null;
        }
        return pending;
    }

    public static synchronized Pending claim(String token) {
        return claim(token, nowMillis());
    }

    static synchronized Pending claim(String token, long nowMillis) {
        Pending active = peek(nowMillis);
        if (active == null || !active.token.equals(token)) {
            return null;
        }
        pending = null;
        return active;
    }

    public static synchronized Pending cancel(String token) {
        if (pending == null || !pending.token.equals(token)) {
            return null;
        }
        Pending cancelled = pending;
        pending = null;
        return cancelled;
    }

    static synchronized void clearForTests() {
        pending = null;
    }

    public static boolean isAllowedPackage(String packageName) {
        return "com.whatsapp".equals(packageName)
            || "com.whatsapp.w4b".equals(packageName);
    }

    static long nowMillis() {
        return TimeUnit.NANOSECONDS.toMillis(System.nanoTime());
    }

    public static boolean exactMessage(CharSequence visible, String expected) {
        if (visible == null || expected == null) {
            return false;
        }
        return normalizeLineEndings(visible.toString())
            .equals(normalizeLineEndings(expected));
    }

    public static boolean matchesRecipientEvidence(
        CharSequence visible,
        String expectedName,
        String expectedPhoneDigits
    ) {
        String evidence = normalizedWords(
            visible == null ? "" : visible.toString()
        );
        String name = normalizedWords(expectedName);
        if (!name.isEmpty() && evidence.equals(name)) {
            return true;
        }

        String visibleDigits = digitsOnly(
            visible == null ? "" : visible.toString()
        );
        String expectedDigits = digitsOnly(expectedPhoneDigits);
        if (visibleDigits.length() < 7 || expectedDigits.length() < 7) {
            return false;
        }
        int suffixLength = Math.min(10, expectedDigits.length());
        return visibleDigits.endsWith(
            expectedDigits.substring(expectedDigits.length() - suffixLength)
        );
    }

    private static String normalizeLineEndings(String value) {
        return value.replace("\r\n", "\n").replace('\r', '\n');
    }

    private static String cleanSingleLine(String value) {
        return (value == null ? "" : value)
            .replace('\n', ' ')
            .replace('\r', ' ')
            .replaceAll("\\s+", " ")
            .trim();
    }

    private static String normalizedWords(String value) {
        return Normalizer.normalize(
            cleanSingleLine(value),
            Normalizer.Form.NFD
        )
            .replaceAll("\\p{M}+", "")
            .toLowerCase(Locale.GERMANY)
            .replaceAll("[^\\p{L}\\p{N}]+", " ")
            .trim();
    }

    private static String digitsOnly(String value) {
        return (value == null ? "" : value).replaceAll("\\D+", "");
    }
}
