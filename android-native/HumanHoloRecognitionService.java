package com.solholo.app;

import android.content.Intent;
import android.os.RemoteException;
import android.speech.RecognitionService;
import android.speech.SpeechRecognizer;

/**
 * Required Android assistant-role companion service.
 *
 * <p>Human Holo's real speech path remains inside the owner-bound app. The
 * system recognizer therefore fails closed instead of capturing ambient audio
 * outside an active Human Holo conversation.</p>
 */
public final class HumanHoloRecognitionService extends RecognitionService {
    @Override
    protected void onStartListening(
        Intent recognizerIntent,
        Callback listener
    ) {
        failClosed(listener);
    }

    @Override
    protected void onStopListening(Callback listener) {
        failClosed(listener);
    }

    @Override
    protected void onCancel(Callback listener) {
        // No recognition session or audio capture is kept by this service.
    }

    private static void failClosed(Callback listener) {
        try {
            listener.error(SpeechRecognizer.ERROR_CLIENT);
        } catch (RemoteException ignored) {
            // The system listener already went away; there is no session to retain.
        }
    }
}
