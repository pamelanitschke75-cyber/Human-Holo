from pathlib import Path

server_path = Path("server.mjs")
server = server_path.read_text(encoding="utf-8")

# One shared retrieval budget for text, speech and sign-language semantic turns.
parity_marker = "\nasync function buildPersonalRecallResult(\n"
parity_constants = r'''

const PERSONAL_MEMORY_MODALITY_PARITY_LIMITS = Object.freeze({
  confirmed: 36,
  fulltime: 60,
  legacy: 40,
  legacyLongTerm: 30,
  recentMultimodalEvents: 4
});

'''
if "PERSONAL_MEMORY_MODALITY_PARITY_LIMITS" not in server:
    if parity_marker not in server:
        raise SystemExit("buildPersonalRecallResult marker missing")
    server = server.replace(parity_marker, parity_constants + parity_marker.lstrip("\n"), 1)


def patch_block(text, start_marker, end_marker, replacements):
    start = text.find(start_marker)
    if start < 0:
        raise SystemExit(f"start marker missing: {start_marker}")
    end = text.find(end_marker, start)
    if end < 0:
        raise SystemExit(f"end marker missing: {end_marker}")
    block = text[start:end]
    original = block
    for old, new, count in replacements:
        if old not in block:
            if new in block:
                continue
            raise SystemExit(f"replacement marker missing in {start_marker}: {old[:80]!r}")
        block = block.replace(old, new, count)
    if block == original:
        return text
    return text[:start] + block + text[end:]

# Voice/local recall result: use the same budget as written /sol questions.
server = patch_block(
    server,
    "async function buildPersonalRecallResult(",
    "/*\n  ==========================================================\n  PRIVATES VOLLZEITGEDÄCHTNIS",
    [
        ("limit:\n              8", "limit:\n              PERSONAL_MEMORY_MODALITY_PARITY_LIMITS.confirmed", 1),
        ("query,\n        16,", "query,\n        PERSONAL_MEMORY_MODALITY_PARITY_LIMITS.fulltime,", 1),
        ("query,\n            16\n          )", "query,\n            PERSONAL_MEMORY_MODALITY_PARITY_LIMITS.legacy\n          )", 1),
        ("query,\n            16\n          )", "query,\n            PERSONAL_MEMORY_MODALITY_PARITY_LIMITS.legacyLongTerm\n          )", 1),
        ("identity,\n            4\n          )", "identity,\n            PERSONAL_MEMORY_MODALITY_PARITY_LIMITS.recentMultimodalEvents\n          )", 1),
    ]
)

# Realtime tool search: same owner-memory budget, no weaker speech/sign path.
server = patch_block(
    server,
    'app.post(\n  "/memory/search",',
    'app.post(\n  "/realtime/web-search",',
    [
        ("limit:\n                  8", "limit:\n                  PERSONAL_MEMORY_MODALITY_PARITY_LIMITS.confirmed", 1),
        ("searchQuery,\n            16,", "searchQuery,\n            PERSONAL_MEMORY_MODALITY_PARITY_LIMITS.fulltime,", 1),
        ("searchQuery,\n                16\n              )", "searchQuery,\n                PERSONAL_MEMORY_MODALITY_PARITY_LIMITS.legacy\n              )", 1),
        ("searchQuery,\n                16\n              )", "searchQuery,\n                PERSONAL_MEMORY_MODALITY_PARITY_LIMITS.legacyLongTerm\n              )", 1),
        ("tokenIdentity,\n                4\n              )", "tokenIdentity,\n                PERSONAL_MEMORY_MODALITY_PARITY_LIMITS.recentMultimodalEvents\n              )", 1),
    ]
)

# Written /sol route: replace its numeric budget with the exact same constants.
server = patch_block(
    server,
    'app.post("/sol", async (req, res) => {',
    'app.use(\n  (\n    error,',
    [
        ("limit:\n                      36", "limit:\n                      PERSONAL_MEMORY_MODALITY_PARITY_LIMITS.confirmed", 1),
        ("memorySearchText,\n              60,", "memorySearchText,\n              PERSONAL_MEMORY_MODALITY_PARITY_LIMITS.fulltime,", 1),
        ("memorySearchText,\n                  40\n                )", "memorySearchText,\n                  PERSONAL_MEMORY_MODALITY_PARITY_LIMITS.legacy\n                )", 1),
        ("memorySearchText,\n                  30\n                )", "memorySearchText,\n                  PERSONAL_MEMORY_MODALITY_PARITY_LIMITS.legacyLongTerm\n                )", 1),
    ]
)

# Live weather and everyday answers inherit Pam's German owner preference too.
server = patch_block(
    server,
    "async function handleLiveEverydayWebRequest(message, identity)",
    "async function handleLiveWeatherRequest(",
    [
        ("${automaticReplyLanguageInstructions()}", "${automaticReplyLanguageInstructions(identity?.displayName || \"\")}", 1),
    ]
)
server = patch_block(
    server,
    "async function handleLiveWeatherRequest(",
    "/*\n  ==========================================================\n  KALENDER-BEFEHL SCHNELL ERKENNEN",
    [
        ("${automaticReplyLanguageInstructions()}", "${automaticReplyLanguageInstructions(identity?.displayName || \"\")}", 1),
    ]
)

# Realtime web search also knows the owner display name for reply-language policy.
web_start = server.find('app.post(\n  "/realtime/web-search",')
web_end = server.find('/*\n  ==========================================================\n  REALTIME → BESTÄTIGTES GEDÄCHTNIS', web_start)
if web_start < 0 or web_end < 0:
    raise SystemExit("realtime web-search block missing")
web_block = server[web_start:web_end]
if "const realtimeSearchDisplayName" not in web_block:
    needle = '''      if (!tokenSession) {\n        return res.status(401).json({\n          error:\n            \"Live-Websuche nicht autorisiert.\"\n        });\n      }\n\n'''
    replacement = needle + '''      const realtimeSearchDisplayName =\n        personalHoloProfile(\n          tokenSession.ownerId\n        )?.displayName || \"\";\n\n'''
    if needle not in web_block:
        raise SystemExit("realtime web search identity marker missing")
    web_block = web_block.replace(needle, replacement, 1)
web_block = web_block.replace(
    "${automaticReplyLanguageInstructions()}",
    "${automaticReplyLanguageInstructions(realtimeSearchDisplayName)}",
    1
)
server = server[:web_start] + web_block + server[web_end:]

# Strengthen the Realtime tool contract for parity across modalities.
old_tool_description = 'description:\n              `Durchsucht ausschließlich ${identity.displayName}s ownergebundenes Vollzeitgedächtnis und bestätigte persönliche Erinnerungen. Verwende dieses Tool, bevor du bei einer persönlichen Erinnerungsfrage sagst, dass du etwas nicht weißt.`'
new_tool_description = 'description:\n              `Durchsucht ausschließlich ${identity.displayName}s ownergebundenes Vollzeitgedächtnis und bestätigte persönliche Erinnerungen. Der gleiche Abruf gilt für gesprochene, geschriebene und sicher erkannte gebärdensprachliche persönliche Fragen. Verwende dieses Tool, bevor du bei einer persönlichen Erinnerungsfrage sagst, dass du etwas nicht weißt.`'
if old_tool_description in server:
    server = server.replace(old_tool_description, new_tool_description, 1)
elif new_tool_description not in server:
    raise SystemExit("search_personal_memory tool description marker missing")

server_path.write_text(server, encoding="utf-8")

# Replace the automatic-language tests with the new owner-language contract.
Path("tests/automatic-language.test.mjs").write_text(r'''import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  HUMAN_HOLO_LANGUAGE_POLICY,
  automaticLanguageInstructions,
  automaticReplyLanguageInstructions,
  createAutomaticTranscriptionConfig
} from "../modules/automatic-language.mjs";

const serverSource = await readFile(
  new URL("../server.mjs", import.meta.url),
  "utf8"
);

test("Eingabesprache bleibt automatisch erkennbar", () => {
  const transcription = createAutomaticTranscriptionConfig();
  assert.deepEqual(transcription, { model: "gpt-transcribe" });
  assert.equal(Object.hasOwn(transcription, "language"), false);
  assert.equal(HUMAN_HOLO_LANGUAGE_POLICY.fixedAllowlist, false);
  assert.equal(HUMAN_HOLO_LANGUAGE_POLICY.automaticInputDetection, true);
});

test("Pam wird standardmäßig auf Deutsch angesprochen", () => {
  const instructions = automaticLanguageInstructions("Pam");
  assert.equal(HUMAN_HOLO_LANGUAGE_POLICY.pamDefaultReplyLanguage, "de");
  assert.match(instructions, /ANTWORTSPRACHE IST STANDARDMÄSSIG DEUTSCH/u);
  assert.match(instructions, /Nur wenn Pam[\s\S]*?ausdrücklich eine andere Antwortsprache/u);
  assert.match(instructions, /Danach kehrst du automatisch zu Deutsch zurück/u);
});

test("Pam kann andere Sprachen nutzen ohne die deutsche Antwortsprache zu verlieren", () => {
  const instructions = automaticLanguageInstructions("Pam");
  assert.match(instructions, /Verstehe Pams aktuellen Beitrag automatisch in jeder Sprache/u);
  assert.match(instructions, /Dialekt, Umgangssprache, Mischsprache und Code-Switching/u);
  assert.match(instructions, /Englisch, Spanisch oder in einer anderen[\s\S]*?antwortest du ihr auf Deutsch/u);
});

test("Schrift Sprache und Gebärde verwenden denselben Kern", () => {
  const instructions = automaticLanguageInstructions("Pam");
  assert.equal(HUMAN_HOLO_LANGUAGE_POLICY.modalityParityRequired, true);
  assert.match(instructions, /Sprache, Schrift und Gebärdensprache sind nur unterschiedliche Eingabewege/u);
  assert.match(instructions, /Kein Eingabeweg darf weniger Erinnerungen/u);
  assert.match(instructions, /semantisch genauso[\s\S]*?wie derselbe Inhalt in Sprache oder Schrift/u);
});

test("Text und Realtime erhalten denselben Pam-Sprachvertrag", () => {
  const insertions = serverSource.match(
    /\$\{automaticLanguageInstructions\(identity\.displayName\)\}/gu
  ) || [];
  assert.equal(insertions.length, 2);
  assert.match(serverSource, /transcription:\s*\n\s*createAutomaticTranscriptionConfig\(\)/u);
});

test("Live-Wetter und Alltags-Websuche erben Pams deutsche Antwortsprache", () => {
  assert.match(
    serverSource,
    /automaticReplyLanguageInstructions\(identity\?\.displayName \|\| \"\"\)/u
  );
  assert.match(
    serverSource,
    /automaticReplyLanguageInstructions\(realtimeSearchDisplayName\)/u
  );
  assert.match(
    automaticReplyLanguageInstructions("Pam"),
    /standardmäßig vollständig auf Deutsch/u
  );
});
''', encoding="utf-8")

Path("tests/modality-parity.test.mjs").write_text(r'''import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const server = await readFile(
  new URL("../server.mjs", import.meta.url),
  "utf8"
);
const html = await readFile(
  new URL("../www/index.html", import.meta.url),
  "utf8"
);

function between(startMarker, endMarker) {
  const start = server.indexOf(startMarker);
  assert.notEqual(start, -1, `missing ${startMarker}`);
  const end = server.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing ${endMarker}`);
  return server.slice(start, end);
}

test("ein gemeinsames Memory-Budget gilt für Text Sprache und Gebärde", () => {
  assert.match(server, /const PERSONAL_MEMORY_MODALITY_PARITY_LIMITS = Object\.freeze/u);
  assert.match(server, /confirmed: 36/u);
  assert.match(server, /fulltime: 60/u);
  assert.match(server, /legacy: 40/u);
  assert.match(server, /legacyLongTerm: 30/u);

  const recall = between(
    "async function buildPersonalRecallResult(",
    "PRIVATES VOLLZEITGEDÄCHTNIS"
  );
  const tool = between(
    'app.post(\n  "/memory/search",',
    'app.post(\n  "/realtime/web-search",'
  );
  const textRoute = between(
    'app.post("/sol", async (req, res) => {',
    "app.use(\n  (\n    error,"
  );

  for (const block of [recall, tool, textRoute]) {
    assert.match(block, /PERSONAL_MEMORY_MODALITY_PARITY_LIMITS/u);
  }
});

test("Realtime wartet auf serverseitigen Kontext bevor die Antwort erzeugt wird", () => {
  assert.match(html, /manualResponseRouting:\s*\n\s*true/u);
  assert.match(html, /await sendLiveTranscriptToMemory/u);
  assert.match(html, /LOKALES_ERINNERUNGSERGEBNIS/u);
  assert.match(html, /LOKALER_DAUERKONTEXT/u);
});

test("Gebärdensprache bleibt visueller Eingang aber hat denselben Memory-Kern", () => {
  assert.match(server, /sign_language/u);
  assert.match(server, /gesprochene, geschriebene und sicher erkannte gebärdensprachliche persönliche Fragen/u);
  assert.match(html, /GEBAERDENSPRACHE_SEQUENZ_START/u);
  assert.match(server, /name:\s*\n\s*"search_personal_memory"/u);
});
''', encoding="utf-8")
