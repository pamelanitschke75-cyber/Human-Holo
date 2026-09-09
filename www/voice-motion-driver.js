(function installSolHoloVoiceMotionDriver(globalScope){
  "use strict";

  const DEFAULTS = Object.freeze({
    fallbackDelayMs:180,
    receiverShapeShare:0.58
  });

  function clamp(value, minimum, maximum){
    return Math.min(
      maximum,
      Math.max(minimum, Number(value) || 0)
    );
  }

  function normalizedProfile(value){
    const source = value && typeof value === "object" ? value : {};
    return {
      fallbackDelayMs:clamp(
        source.fallbackDelayMs ?? DEFAULTS.fallbackDelayMs,
        80,
        600
      ),
      receiverShapeShare:clamp(
        source.receiverShapeShare ?? DEFAULTS.receiverShapeShare,
        0,
        1
      )
    };
  }

  /*
    Sobald in einer Sprachausgabe ein echter Audiopegel erkannt wurde, bleibt
    dieser fuer die ganze Ausgabe massgeblich. Kurze Wortpausen duerfen den
    Mund deshalb schliessen und werden nicht mehr von einer Sinusbewegung
    ueberschrieben.
  */
  function createSpeechGate(profileValue){
    const profile = normalizedProfile(profileValue);
    let active = false;
    let startedAt = 0;
    let measuredSignal = false;

    function reset(){
      active = false;
      startedAt = 0;
      measuredSignal = false;
    }

    function sample(value){
      const timestamp = Math.max(0, Number(value?.timestamp) || 0);
      const speaking = Boolean(value?.speaking);
      const signalActive = Boolean(value?.signalActive);

      if(!speaking){
        reset();
        return {
          active:false,
          measuredSignal:false,
          useFallback:false
        };
      }

      if(!active){
        active = true;
        startedAt = timestamp;
        measuredSignal = false;
      }

      if(signalActive){
        measuredSignal = true;
      }

      return {
        active:true,
        measuredSignal,
        useFallback:
          !measuredSignal &&
          timestamp - startedAt >= profile.fallbackDelayMs
      };
    }

    return Object.freeze({
      get active(){ return active; },
      get measuredSignal(){ return measuredSignal; },
      profile:Object.freeze({...profile}),
      reset,
      sample
    });
  }

  function safeShape(value){
    return {
      open:clamp(value?.open, 0, 1),
      wide:clamp(value?.wide, 0, 1),
      round:clamp(value?.round, 0, 1)
    };
  }

  function resolveShape(value, profileValue){
    const profile = normalizedProfile(profileValue);
    const detected = safeShape(value?.detected);
    const fallback = safeShape(value?.fallback);
    const receiver = safeShape(value?.receiver);
    const useFallback = Boolean(value?.useFallback);
    const receiverWeight = clamp(value?.receiverWeight, 0, 1);
    const receiverShapeWeight =
      receiverWeight * profile.receiverShapeShare;

    return {
      // Ein gemessener Pegel darf auch echte Verschlusslaute und Wortpausen
      // bis ganz auf null abbilden. Nur ohne Messsignal darf der Fallback den
      // Mund oeffnen.
      open:useFallback
        ? Math.max(detected.open, fallback.open)
        : detected.open,
      wide:Math.max(
        detected.wide,
        useFallback
          ? fallback.wide
          : receiver.wide * receiverShapeWeight
      ),
      round:Math.max(
        detected.round,
        useFallback
          ? fallback.round
          : receiver.round * receiverShapeWeight
      )
    };
  }

  globalScope.SolHoloVoiceMotionDriver = Object.freeze({
    createSpeechGate,
    defaults:DEFAULTS,
    normalizedProfile,
    resolveShape
  });
})(window);
