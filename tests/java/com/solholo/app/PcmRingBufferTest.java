package com.solholo.app;

import java.util.Arrays;

public final class PcmRingBufferTest {
    public static void main(String[] args) {
        retainsAllSamplesBeforeCapacity();
        retainsOnlyNewestSamplesAfterWrap();
        extractsFromAbsoluteKeywordStart();
        clampsExpiredAndFuturePositions();
        keepsRecentKeywordTimestampWithPreroll();
        boundsMissingAndStaleKeywordTimestamps();
        rejectsInvalidInput();
        System.out.println("PcmRingBufferTest: OK");
    }

    private static void retainsAllSamplesBeforeCapacity() {
        PcmRingBuffer buffer = new PcmRingBuffer(6);
        buffer.append(new short[] { 1, 2, 3 }, 3);
        assertArray(new short[] { 1, 2, 3 }, buffer.snapshotFrom(0));
        assertEquals(3L, buffer.totalWritten());
    }

    private static void retainsOnlyNewestSamplesAfterWrap() {
        PcmRingBuffer buffer = new PcmRingBuffer(4);
        buffer.append(new short[] { 1, 2, 3 }, 3);
        buffer.append(new short[] { 4, 5, 6 }, 3);
        assertArray(new short[] { 3, 4, 5, 6 }, buffer.snapshotFrom(0));
        assertEquals(6L, buffer.totalWritten());
    }

    private static void extractsFromAbsoluteKeywordStart() {
        PcmRingBuffer buffer = new PcmRingBuffer(8);
        buffer.append(new short[] { 10, 11, 12, 13 }, 4);
        buffer.append(new short[] { 14, 15, 16 }, 3);
        assertArray(new short[] { 13, 14, 15, 16 }, buffer.snapshotFrom(3));
    }

    private static void clampsExpiredAndFuturePositions() {
        PcmRingBuffer buffer = new PcmRingBuffer(3);
        buffer.append(new short[] { 1, 2, 3, 4, 5 }, 5);
        assertArray(new short[] { 3, 4, 5 }, buffer.snapshotFrom(-10));
        assertArray(new short[0], buffer.snapshotFrom(99));
    }

    private static void keepsRecentKeywordTimestampWithPreroll() {
        assertEquals(
            7_500L,
            PcmRingBuffer.boundedKeywordStart(8_000L, 10_000L, 500, 4_000)
        );
    }

    private static void boundsMissingAndStaleKeywordTimestamps() {
        assertEquals(
            6_000L,
            PcmRingBuffer.boundedKeywordStart(0L, 10_000L, 500, 4_000)
        );
        assertEquals(
            6_000L,
            PcmRingBuffer.boundedKeywordStart(1_000L, 10_000L, 500, 4_000)
        );
        assertEquals(
            6_000L,
            PcmRingBuffer.boundedKeywordStart(12_000L, 10_000L, 500, 4_000)
        );
    }

    private static void rejectsInvalidInput() {
        boolean rejected = false;
        try {
            new PcmRingBuffer(0);
        } catch (IllegalArgumentException expected) {
            rejected = true;
        }
        if (!rejected) {
            throw new AssertionError("Zero capacity must be rejected");
        }
    }

    private static void assertArray(short[] expected, short[] actual) {
        if (!Arrays.equals(expected, actual)) {
            throw new AssertionError(
                "expected=" + Arrays.toString(expected)
                    + " actual=" + Arrays.toString(actual)
            );
        }
    }

    private static void assertEquals(long expected, long actual) {
        if (expected != actual) {
            throw new AssertionError("expected=" + expected + " actual=" + actual);
        }
    }
}
