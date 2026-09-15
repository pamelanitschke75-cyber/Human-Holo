import {
  installHumanHoloRealtimeCostRouting
} from "../modules/openai-realtime-cost-routing.mjs";

installHumanHoloRealtimeCostRouting();

await import("../server.mjs");
