package com.solholo.app;

import android.service.voice.VoiceInteractionService;

/**
 * Declares Human Holo as an Android assistant candidate.
 *
 * <p>The role is requested visibly through Android and is never assigned by
 * the app itself. Holding it is also the policy gate before SEND_SMS may be
 * requested for the owner's explicit direct-SMS commands.</p>
 */
public final class HumanHoloVoiceInteractionService
    extends VoiceInteractionService {
}
