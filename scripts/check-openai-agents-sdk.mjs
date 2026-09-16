import OpenAI from "openai";

const client = new OpenAI({ apiKey: "sdk-compatibility-probe-not-used" });

const agents = client?.beta?.agents;
const checks = {
  beta: Boolean(client?.beta),
  agents: Boolean(agents),
  createAgent: typeof agents?.create === "function",
  sessions: Boolean(agents?.sessions),
  createSession: typeof agents?.sessions?.create === "function",
  environments: Boolean(agents?.environments),
  createEnvironmentTemplate:
    typeof agents?.environments?.templates?.create === "function"
};

console.log(JSON.stringify(checks, null, 2));

const required = [
  "agents",
  "createAgent",
  "sessions",
  "createSession",
  "environments",
  "createEnvironmentTemplate"
];

const missing = required.filter((key) => !checks[key]);
if (missing.length) {
  console.error(`OpenAI Agents SDK compatibility missing: ${missing.join(", ")}`);
  process.exit(1);
}

console.log("OpenAI Agents SDK compatibility: OK");
