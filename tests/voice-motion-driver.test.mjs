import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

async function loadDriver() {
  const source = await readFile(
    new URL("../www/voice-motion-driver.js", import.meta.url),
    "utf8"
  );
  const context = vm.createContext({});
  context.window = context;
  vm.runInContext(source, context, {
    filename: "voice-motion-driver.js"
  });
  return context.SolHoloVoiceMotionDriver;
}

test("echter Sprachpegel bleibt auch fuer Wortpausen massgeblich", async () => {
  const driver = await loadDriver();
  const gate = driver.createSpeechGate({ fallbackDelayMs: 180 });

  assert.equal(
    gate.sample({ timestamp: 100, speaking: true, signalActive: false })
      .useFallback,
    false
  );
  assert.equal(
    gate.sample({ timestamp: 300, speaking: true, signalActive: false })
      .useFallback,
    true
  );

  const measured = gate.sample({
    timestamp: 320,
    speaking: true,
    signalActive: true
  });
  assert.equal(measured.measuredSignal, true);
  assert.equal(measured.useFallback, false);

  const wordPause = gate.sample({
    timestamp: 760,
    speaking: true,
    signalActive: false
  });
  assert.equal(wordPause.measuredSignal, true);
  assert.equal(wordPause.useFallback, false);

  gate.sample({ timestamp: 900, speaking: false, signalActive: false });
  assert.equal(gate.active, false);
  assert.equal(gate.measuredSignal, false);
});

test("Ersatzbewegung darf einen gemessenen Mundschluss nicht oeffnen", async () => {
  const driver = await loadDriver();
  const fallback = { open: 0.61, wide: 0.40, round: 0.31 };
  const detectedClosure = { open: 0, wide: 0.02, round: 0.01 };

  const measured = driver.resolveShape({
    detected: detectedClosure,
    fallback,
    receiver: fallback,
    receiverWeight: 0,
    useFallback: false
  });
  assert.equal(measured.open, 0);

  const unavailable = driver.resolveShape({
    detected: detectedClosure,
    fallback,
    receiver: null,
    receiverWeight: 0,
    useFallback: true
  });
  assert.equal(unavailable.open, fallback.open);
});

test("Receiver liefert Formhilfe, aber keine kuenstliche Oeffnung", async () => {
  const driver = await loadDriver();
  const shape = driver.resolveShape({
    detected: { open: 0.34, wide: 0, round: 0 },
    receiver: { open: 0.70, wide: 0.40, round: 0.20 },
    receiverWeight: 0.75,
    useFallback: false
  });

  assert.equal(shape.open, 0.34);
  assert.ok(shape.wide > 0 && shape.wide < 0.40);
  assert.ok(shape.round > 0 && shape.round < 0.20);
});

test("Bewegungstreiber speichert und uebertraegt keine Sprachdaten", async () => {
  const source = await readFile(
    new URL("../www/voice-motion-driver.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/u);
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|WebSocket/u);
});
