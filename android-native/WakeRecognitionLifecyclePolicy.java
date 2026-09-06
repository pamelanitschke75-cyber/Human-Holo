package com.solholo.app;

/** Pure policy for keeping the owner wake listener healthy across screen changes. */
final class WakeRecognitionLifecyclePolicy {
    private WakeRecognitionLifecyclePolicy() {
    }

    static boolean shouldRearmForScreenTransition(
        boolean backgroundMode,
        boolean destroyed,
        boolean pausedForConversation,
        boolean speakerVerificationPending,
        boolean wakeHandled
    ) {
        return backgroundMode
            && !destroyed
            && !pausedForConversation
            && !speakerVerificationPending
            && !wakeHandled;
    }

    static boolean shouldKeepWakeLockForRestart(
        boolean backgroundMode,
        boolean destroyed,
        boolean pausedForConversation
    ) {
        return backgroundMode && !destroyed && !pausedForConversation;
    }
}
