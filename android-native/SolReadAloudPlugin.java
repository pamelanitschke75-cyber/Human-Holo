package com.solholo.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(name = "SolReadAloud")
public class SolReadAloudPlugin extends Plugin {
    private static final int MAX_MESSAGE_CHARACTERS = 24000;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private TextToSpeech textToSpeech;
    private boolean textToSpeechReady;
    private PendingSpeech pendingSpeech;
    private String activeSessionId;
    private String activeFinalUtteranceId;

    private static final class PendingSpeech {
        final String text;
        final float rate;
        final float volume;
        final PluginCall call;

        PendingSpeech(String text, float rate, float volume, PluginCall call) {
            this.text = text;
            this.rate = rate;
            this.volume = volume;
            this.call = call;
        }
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = String.valueOf(call.getString("text", "")).trim();

        if (text.isEmpty()) {
            call.reject("Es gibt keinen Text zum Vorlesen.");
            return;
        }

        if (text.length() > MAX_MESSAGE_CHARACTERS) {
            call.reject("Die Antwort ist zum Vorlesen zu lang.");
            return;
        }

        float rate = clamp(
            call.getFloat("rate", 1.0f),
            0.5f,
            2.0f
        );
        float volume = clamp(
            call.getFloat("volume", 1.0f),
            0.0f,
            1.0f
        );

        mainHandler.post(() -> {
            stopActiveSpeech();
            rejectPendingSpeech("Die vorherige Vorleseanfrage wurde ersetzt.");
            pendingSpeech = new PendingSpeech(text, rate, volume, call);

            if (textToSpeechReady && textToSpeech != null) {
                speakPendingText();
                return;
            }

            if (textToSpeech == null) {
                textToSpeech = new TextToSpeech(
                    getContext().getApplicationContext(),
                    this::onTextToSpeechInitialized
                );
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        mainHandler.post(() -> {
            rejectPendingSpeech("Das Vorlesen wurde beendet.");
            stopActiveSpeech();
            call.resolve();
        });
    }

    private void onTextToSpeechInitialized(int status) {
        mainHandler.post(() -> {
            if (status != TextToSpeech.SUCCESS || textToSpeech == null) {
                rejectPendingSpeech("Die Android-Sprachausgabe ist nicht verfügbar.");
                shutdownTextToSpeech();
                notifyReadAloudState(false);
                return;
            }

            int languageStatus = textToSpeech.setLanguage(Locale.GERMANY);
            textToSpeechReady = languageStatus != TextToSpeech.LANG_MISSING_DATA
                && languageStatus != TextToSpeech.LANG_NOT_SUPPORTED
                && selectOfflineGermanVoice();

            if (!textToSpeechReady) {
                rejectPendingSpeech(
                    "Keine offline verfügbare deutsche Android-Stimme gefunden."
                );
                shutdownTextToSpeech();
                notifyReadAloudState(false);
                return;
            }

            textToSpeech.setOnUtteranceProgressListener(
                new UtteranceProgressListener() {
                    @Override
                    public void onStart(String utteranceId) {
                        if (belongsToActiveSession(utteranceId)) {
                            notifyReadAloudState(true);
                        }
                    }

                    @Override
                    public void onDone(String utteranceId) {
                        finishIfFinalUtterance(utteranceId);
                    }

                    @Override
                    public void onError(String utteranceId) {
                        finishIfFinalUtterance(utteranceId);
                    }

                    @Override
                    public void onError(String utteranceId, int errorCode) {
                        finishIfFinalUtterance(utteranceId);
                    }
                }
            );

            speakPendingText();
        });
    }

    private void speakPendingText() {
        PendingSpeech request = pendingSpeech;
        pendingSpeech = null;

        if (!textToSpeechReady || textToSpeech == null || request == null) {
            return;
        }

        textToSpeech.setSpeechRate(request.rate);
        List<String> chunks = splitForTextToSpeech(request.text);
        String sessionId = "human-holo-read-" + UUID.randomUUID();
        activeSessionId = sessionId;
        activeFinalUtteranceId = sessionId + "-" + (chunks.size() - 1);

        Bundle parameters = new Bundle();
        parameters.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, request.volume);

        for (int index = 0; index < chunks.size(); index += 1) {
            int queueMode = index == 0
                ? TextToSpeech.QUEUE_FLUSH
                : TextToSpeech.QUEUE_ADD;
            int result = textToSpeech.speak(
                chunks.get(index),
                queueMode,
                parameters,
                sessionId + "-" + index
            );

            if (result == TextToSpeech.ERROR) {
                stopActiveSpeech();
                request.call.reject("Die Android-Sprachausgabe konnte nicht starten.");
                return;
            }
        }

        JSObject response = new JSObject();
        response.put("started", true);
        response.put("locale", "de-DE");
        request.call.resolve(response);
    }

    private boolean selectOfflineGermanVoice() {
        if (textToSpeech == null) {
            return false;
        }

        Set<Voice> voices = textToSpeech.getVoices();
        if (voices == null || voices.isEmpty()) {
            return false;
        }

        Voice selected = null;
        for (Voice voice : voices) {
            if (
                voice == null
                    || voice.isNetworkConnectionRequired()
                    || !Locale.GERMAN.getLanguage().equals(
                        voice.getLocale().getLanguage()
                    )
            ) {
                continue;
            }

            selected = voice;
            if (Locale.GERMANY.equals(voice.getLocale())) {
                break;
            }
        }

        return selected != null
            && textToSpeech.setVoice(selected) == TextToSpeech.SUCCESS;
    }

    private List<String> splitForTextToSpeech(String text) {
        int maximumLength = Math.max(
            256,
            TextToSpeech.getMaxSpeechInputLength() - 64
        );
        List<String> chunks = new ArrayList<>();
        String remaining = text.trim();

        while (!remaining.isEmpty()) {
            if (remaining.length() <= maximumLength) {
                chunks.add(remaining);
                break;
            }

            int splitAt = findNaturalSplit(remaining, maximumLength);
            chunks.add(remaining.substring(0, splitAt).trim());
            remaining = remaining.substring(splitAt).trim();
        }

        if (chunks.isEmpty()) {
            chunks.add(text.trim());
        }

        return chunks;
    }

    private int findNaturalSplit(String text, int maximumLength) {
        int minimumLength = maximumLength / 2;

        for (int index = maximumLength; index >= minimumLength; index -= 1) {
            char character = text.charAt(index - 1);
            if (
                character == '.'
                    || character == '!'
                    || character == '?'
                    || character == '\n'
            ) {
                return index;
            }
        }

        int whitespace = text.lastIndexOf(' ', maximumLength);
        return whitespace >= minimumLength ? whitespace : maximumLength;
    }

    private boolean belongsToActiveSession(String utteranceId) {
        return activeSessionId != null
            && utteranceId != null
            && utteranceId.startsWith(activeSessionId + "-");
    }

    private void finishIfFinalUtterance(String utteranceId) {
        if (
            activeFinalUtteranceId == null
                || !activeFinalUtteranceId.equals(utteranceId)
        ) {
            return;
        }

        activeSessionId = null;
        activeFinalUtteranceId = null;
        notifyReadAloudState(false);
    }

    private void stopActiveSpeech() {
        if (textToSpeech != null) {
            textToSpeech.stop();
        }
        activeSessionId = null;
        activeFinalUtteranceId = null;
        notifyReadAloudState(false);
    }

    private void rejectPendingSpeech(String message) {
        if (pendingSpeech == null) {
            return;
        }
        pendingSpeech.call.reject(message);
        pendingSpeech = null;
    }

    private void notifyReadAloudState(boolean speaking) {
        Runnable notification = () -> {
            JSObject state = new JSObject();
            state.put("speaking", speaking);
            notifyListeners("readAloudState", state);
        };

        if (Looper.myLooper() == Looper.getMainLooper()) {
            notification.run();
        } else {
            mainHandler.post(notification);
        }
    }

    private float clamp(Float value, float minimum, float maximum) {
        float safeValue = value == null ? 1.0f : value;
        return Math.max(minimum, Math.min(maximum, safeValue));
    }

    private void shutdownTextToSpeech() {
        textToSpeechReady = false;
        if (textToSpeech != null) {
            textToSpeech.shutdown();
            textToSpeech = null;
        }
    }

    @Override
    protected void handleOnDestroy() {
        rejectPendingSpeech("Human Holo wurde geschlossen.");
        stopActiveSpeech();
        shutdownTextToSpeech();
        super.handleOnDestroy();
    }
}
