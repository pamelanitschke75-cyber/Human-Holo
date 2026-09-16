import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import OpenAI from "openai";

const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
if (!apiKey) {
  throw new Error("OPENAI_API_KEY fehlt.");
}

const client = new OpenAI({ apiKey });
const marker = `HUMAN_HOLO_MEMORY_${Date.now()}`;
const tempDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "human-holo-memory-probe-")
);
const tempPath = path.join(tempDirectory, "synthetic-memory.txt");
let conversationId = null;
let summary = null;

try {
  fs.writeFileSync(
    tempPath,
    [
      "Human Holo OpenAI Memory Migration Probe",
      `marker=${marker}`,
      "owner_scope=synthetic-test-only",
      "content=Die Test-Sonnenblume heißt Aurora.",
      "privacy=Keine produktiven oder persönlichen Daten."
    ].join("\n"),
    {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600
    }
  );

  const conversation = await client.conversations.create({
    metadata: {
      purpose: "human-holo-memory-migration-probe",
      owner_scope: "synthetic-test-only"
    },
    items: [
      {
        type: "message",
        role: "user",
        content: `Synthetic memory marker: ${marker}`
      }
    ]
  });
  conversationId = conversation.id;

  const uploaded = await client.files.create({
    file: fs.createReadStream(tempPath),
    purpose: "assistants",
    expires_after: {
      anchor: "created_at",
      seconds: 86400
    }
  });

  const vectorStore = await client.vectorStores.create({
    name: `human-holo-memory-probe-${Date.now()}`,
    expires_after: {
      anchor: "last_active_at",
      days: 1
    },
    metadata: {
      purpose: "human-holo-memory-migration-probe",
      owner_scope: "synthetic-test-only"
    }
  });

  const attached = await client.vectorStores.files.create(vectorStore.id, {
    file_id: uploaded.id,
    attributes: {
      owner_scope: "synthetic-test-only",
      memory_kind: "probe"
    }
  });

  let status = attached.status;
  let lastError = attached.last_error || null;
  for (let attempt = 0; attempt < 30 && status === "in_progress"; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const current = await client.vectorStores.files.retrieve(uploaded.id, {
      vector_store_id: vectorStore.id
    });
    status = current.status;
    lastError = current.last_error || null;
  }

  if (status !== "completed") {
    throw new Error(
      `Vector-Store-Verarbeitung fehlgeschlagen: ${status} ${JSON.stringify(lastError)}`
    );
  }

  const results = [];
  for await (const result of client.vectorStores.search(vectorStore.id, {
    query: "Wie heißt die Test-Sonnenblume?",
    max_num_results: 3
  })) {
    results.push(result);
  }

  const combinedText = results
    .flatMap((result) => result.content || [])
    .map((item) => item.text || "")
    .join("\n");

  if (!combinedText.includes("Aurora")) {
    throw new Error("OpenAI Vector Store konnte die synthetische Erinnerung nicht wiederfinden.");
  }

  summary = {
    ok: true,
    conversation_created: Boolean(conversation.id),
    vector_store_created: Boolean(vectorStore.id),
    file_indexed: status === "completed",
    semantic_recall: true,
    owner_scope: "synthetic-test-only",
    productive_data_touched: false,
    local_temp_file_removed: true
  };
} finally {
  try {
    if (conversationId) {
      await client.conversations.delete(conversationId);
    }
  } finally {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
}

console.log(JSON.stringify(summary, null, 2));
