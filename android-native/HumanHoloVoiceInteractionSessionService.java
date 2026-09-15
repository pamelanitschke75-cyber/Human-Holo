package com.solholo.app;

import android.os.Bundle;
import android.service.voice.VoiceInteractionSession;
import android.service.voice.VoiceInteractionSessionService;

public final class HumanHoloVoiceInteractionSessionService
    extends VoiceInteractionSessionService {

    @Override
    public VoiceInteractionSession onNewSession(Bundle args) {
        return new HumanHoloVoiceInteractionSession(this);
    }
}
