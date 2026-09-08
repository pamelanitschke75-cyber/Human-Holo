(function installRemoteAudioLevel(globalScope){
  "use strict";

  const DEFAULTS = Object.freeze({
    noiseFloor:0.0025,
    fullSpeechLevel:0.12,
    attackMs:38,
    releaseMs:105,
    holdMs:90,
    statsIntervalMs:72,
    staleAfterMs:360
  });

  function clamp(value, minimum, maximum){
    return Math.min(maximum, Math.max(minimum, Number(value) || 0));
  }

  function finiteNumber(value, fallback){
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeProfile(value){
    const source = value && typeof value === "object" ? value : {};
    const profile = {};
    for(const [key, fallback] of Object.entries(DEFAULTS)){
      profile[key] = finiteNumber(source[key], fallback);
    }
    profile.noiseFloor = clamp(profile.noiseFloor, 0, 0.08);
    profile.fullSpeechLevel = clamp(
      profile.fullSpeechLevel,
      profile.noiseFloor + 0.01,
      1
    );
    profile.attackMs = clamp(profile.attackMs, 12, 180);
    profile.releaseMs = clamp(profile.releaseMs, 35, 420);
    profile.holdMs = clamp(profile.holdMs, 0, 260);
    profile.statsIntervalMs = clamp(profile.statsIntervalMs, 35, 240);
    profile.staleAfterMs = clamp(profile.staleAfterMs, 120, 1200);
    return profile;
  }

  function activityFromLevel(level, profileValue){
    const profile = normalizeProfile(profileValue);
    const normalized = clamp(
      (finiteNumber(level, 0) - profile.noiseFloor) /
        Math.max(0.0001, profile.fullSpeechLevel - profile.noiseFloor),
      0,
      1
    );
    return Math.pow(normalized, 0.72);
  }

  function reportsFrom(stats){
    const reports = [];
    if(stats && typeof stats.forEach === "function"){
      stats.forEach(report => reports.push(report));
      return reports;
    }
    if(stats && typeof stats[Symbol.iterator] === "function"){
      for(const entry of stats){
        reports.push(Array.isArray(entry) ? entry[1] : entry);
      }
    }
    return reports;
  }

  function createTracker(profileValue){
    const profile = normalizeProfile(profileValue);
    let receiver = null;
    let envelope = 0;
    let lastSampleAt = 0;
    let lastSoundAt = -Infinity;
    let latestStatsLevel = 0;
    let latestStatsAt = -Infinity;
    let statsRequestedAt = -Infinity;
    let statsPending = false;
    let previousEnergy = null;
    let previousDuration = null;
    let previousReportId = "";
    let receiverGeneration = 0;

    function reset(){
      receiverGeneration += 1;
      receiver = null;
      envelope = 0;
      lastSampleAt = 0;
      lastSoundAt = -Infinity;
      latestStatsLevel = 0;
      latestStatsAt = -Infinity;
      statsRequestedAt = -Infinity;
      statsPending = false;
      previousEnergy = null;
      previousDuration = null;
      previousReportId = "";
    }

    function setReceiver(value){
      if(value === receiver){
        return Boolean(receiver);
      }
      reset();
      receiver = value || null;
      return Boolean(receiver);
    }

    function synchronizationLevel(){
      if(!receiver || typeof receiver.getSynchronizationSources !== "function"){
        return {available:false, level:0};
      }
      try{
        const sources = receiver.getSynchronizationSources() || [];
        let available = false;
        let level = 0;
        for(const source of sources){
          const candidate = Number(source?.audioLevel);
          if(Number.isFinite(candidate)){
            available = true;
            level = Math.max(level, clamp(candidate, 0, 1));
          }
        }
        return {available, level};
      }catch{
        return {available:false, level:0};
      }
    }

    function recordStats(stats, timestamp){
      let found = false;
      let level = 0;
      for(const report of reportsFrom(stats)){
        if(!report || report.type !== "inbound-rtp") continue;
        const kind = String(report.kind || report.mediaType || "");
        if(kind && kind !== "audio") continue;

        const directLevel = Number(report.audioLevel);
        if(Number.isFinite(directLevel)){
          found = true;
          level = Math.max(level, clamp(directLevel, 0, 1));
        }

        const energy = Number(report.totalAudioEnergy);
        const duration = Number(report.totalSamplesDuration);
        const reportId = String(report.id || "inbound-audio");
        if(Number.isFinite(energy) && Number.isFinite(duration)){
          if(
            previousReportId === reportId &&
            previousEnergy !== null &&
            previousDuration !== null
          ){
            const energyDelta = energy - previousEnergy;
            const durationDelta = duration - previousDuration;
            if(energyDelta >= 0 && durationDelta > 0){
              found = true;
              level = Math.max(
                level,
                clamp(Math.sqrt(energyDelta / durationDelta), 0, 1)
              );
            }
          }
          previousReportId = reportId;
          previousEnergy = energy;
          previousDuration = duration;
        }
      }
      if(found){
        latestStatsLevel = level;
        latestStatsAt = timestamp;
      }
    }

    function requestStats(timestamp){
      if(
        !receiver ||
        typeof receiver.getStats !== "function" ||
        statsPending ||
        timestamp - statsRequestedAt < profile.statsIntervalMs
      ){
        return;
      }
      statsRequestedAt = timestamp;
      statsPending = true;
      const selectedReceiver = receiver;
      const selectedGeneration = receiverGeneration;
      Promise.resolve()
        .then(() => selectedReceiver?.getStats?.())
        .then(stats => {
          if(
            selectedReceiver === receiver &&
            selectedGeneration === receiverGeneration
          ){
            recordStats(stats, timestamp);
          }
        })
        .catch(() => {})
        .finally(() => {
          if(selectedGeneration === receiverGeneration){
            statsPending = false;
          }
        });
    }

    function sample(timestampValue){
      const timestamp = Math.max(0, finiteNumber(timestampValue, 0));
      const elapsed = lastSampleAt
        ? clamp(timestamp - lastSampleAt, 8, 80)
        : 16.67;
      lastSampleAt = timestamp;

      const sync = synchronizationLevel();
      requestStats(timestamp);
      const statsFresh =
        timestamp - latestStatsAt <= profile.staleAfterMs;
      const rawLevel = Math.max(
        sync.level,
        statsFresh ? latestStatsLevel : 0
      );
      let target = activityFromLevel(rawLevel, profile);
      if(target > 0.025){
        lastSoundAt = timestamp;
      }else if(timestamp - lastSoundAt <= profile.holdMs){
        target = Math.max(target, Math.min(envelope, 0.12));
      }

      const responseMs = target > envelope
        ? profile.attackMs
        : profile.releaseMs;
      const amount = 1 - Math.exp(-elapsed / responseMs);
      envelope += (target - envelope) * amount;
      if(envelope < 0.001) envelope = 0;

      return {
        active:
          envelope > 0.028 ||
          timestamp - lastSoundAt <= profile.holdMs,
        level:clamp(envelope, 0, 1),
        rawLevel,
        source:
          sync.available
            ? "synchronization-source"
            : statsFresh
              ? "receiver-stats"
              : "none"
      };
    }

    return Object.freeze({
      get receiverReady(){ return Boolean(receiver); },
      profile:Object.freeze({...profile}),
      reset,
      sample,
      setReceiver
    });
  }

  globalScope.SolHoloRemoteAudioLevel = Object.freeze({
    activityFromLevel,
    createTracker,
    defaults:DEFAULTS,
    normalizeProfile
  });
})(window);
