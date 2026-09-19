import OpenAI from "openai";

const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
const model = String(process.env.HUMAN_HOLO_AGENT_MODEL || "").trim();

if (!apiKey) {
  throw new Error("OPENAI_API_KEY fehlt. Der Schlüssel darf nur als Umgebungsvariable gesetzt werden.");
}

if (!model) {
  throw new Error("HUMAN_HOLO_AGENT_MODEL fehlt. Für den Prototyp muss das Testmodell ausdrücklich gesetzt werden.");
}

const client = new OpenAI({ apiKey });

const session = await client.beta.agents.sessions.create({
  environment: { type: "none" },
  agent: {
    model,
    instructions: [
      "Du bist ein isolierter technischer Human-Holo-Migrationstest.",
      "Greife nicht auf persönliche Daten, Kalender, Nachrichten oder produktive Datenbanken zu.",
      "Führe keine externen Schreibaktionen aus.",
      "Antworte auf den Test ausschließlich mit HUMAN_HOLO_AGENT_OK."
    ].join(" ")
  },
  input: "Bestätige den isolierten Agenten-Prototyp."
});

console.log(JSON.stringify({
  ok: Boolean(session?.id),
  session_id: session?.id || null,
  status: session?.status || null,
  environment_type: session?.environment?.type || null
}, null, 2));
