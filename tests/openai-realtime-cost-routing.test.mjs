import test from "node:test";
import assert from "node:assert/strict";

import {
  HUMAN_HOLO_REALTIME_COST_MODEL,
  HUMAN_HOLO_REALTIME_STANDARD_MODEL,
  humanHoloRealtimeModel,
  routeRealtimeClientSecretRequest
} from "../modules/openai-realtime-cost-routing.mjs";

const URL = "https://api.openai.com/v1/realtime/client_secrets";

function realtimeInit(model = HUMAN_HOLO_REALTIME_STANDARD_MODEL) {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model,
        instructions: "test"
      }
    })
  };
}

test("Human Holo uses the lower-cost realtime model by default", () => {
  assert.equal(
    humanHoloRealtimeModel({}),
    HUMAN_HOLO_REALTIME_COST_MODEL
  );
});

test("Human Holo realtime model remains configurable for future upgrades", () => {
  assert.equal(
    humanHoloRealtimeModel({
      HUMAN_HOLO_REALTIME_MODEL: "future-realtime-model"
    }),
    "future-realtime-model"
  );
});

test("Realtime client-secret sessions are routed to the lower-cost model", () => {
  const routed = routeRealtimeClientSecretRequest(
    URL,
    realtimeInit(),
    {}
  );

  assert.equal(routed.routed, true);
  assert.equal(routed.model, HUMAN_HOLO_REALTIME_COST_MODEL);
  assert.equal(
    JSON.parse(routed.init.body).session.model,
    HUMAN_HOLO_REALTIME_COST_MODEL
  );
});

test("Non-realtime OpenAI requests are left unchanged", () => {
  const init = realtimeInit();
  const routed = routeRealtimeClientSecretRequest(
    "https://api.openai.com/v1/responses",
    init,
    {}
  );

  assert.equal(routed.routed, false);
  assert.equal(routed.init, init);
});

test("Standard realtime model can be restored without a code change", () => {
  const routed = routeRealtimeClientSecretRequest(
    URL,
    realtimeInit(),
    {
      HUMAN_HOLO_REALTIME_MODEL:
        HUMAN_HOLO_REALTIME_STANDARD_MODEL
    }
  );

  assert.equal(routed.routed, true);
  assert.equal(
    JSON.parse(routed.init.body).session.model,
    HUMAN_HOLO_REALTIME_STANDARD_MODEL
  );
});
