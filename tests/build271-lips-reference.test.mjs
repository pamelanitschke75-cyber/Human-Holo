import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readText = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");

function extractRange(source, start, end, includeEnd = false) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);

  assert.ok(startIndex >= 0, `Referenzanfang fehlt: ${start}`);
  assert.ok(endIndex > startIndex, `Referenzende fehlt: ${end}`);

  return source.slice(
    startIndex,
    endIndex + (includeEnd ? end.length : 0)
  );
}

test("Pams praktisch bestaetigte Build-271-Lippenbasis bleibt bytegenau erhalten", async () => {
  const [rig, profile, fullSync] = await Promise.all([
    readText("www/full-face-rig.mjs"),
    readText("www/sol-motion-profile.js"),
    readText("www/original-full-sync.js")
  ]);

  assert.equal(
    sha256(rig),
    "5f307977dfc01bd51e0333a9c3ba671a23611d15989620261ecb78ced2ceebe6"
  );
  assert.equal(
    sha256(profile),
    "bf3315ef44d7e1eb085dec01f7d207c1b00ad701081e5aed5dfb3e8543700d89"
  );
  assert.equal(
    sha256(fullSync),
    "213d4de2c4f2f046b062ce03487662a307202cc453330ad692a3e45bb7f5e9dc"
  );
});

test("Pams sichtbare Lippenform entspricht den freigegebenen Build-271-Flaechen", async () => {
  const html = await readText("www/index.html");
  const ranges = [
    extractRange(html, "#mouthOpening{", "#solCloneWrap.sol-speaking{"),
    extractRange(html, '<svg\n  id="mouthOpening"', "\n</svg>", true),
    extractRange(
      html,
      "const DEFAULT_LIP_SYNC_FACE = {",
      "\nconst FULL_FACE_RIG_ENABLED"
    ),
    extractRange(
      html,
      "function detectedMouthShape(",
      "\nfunction updateMouthGeometry(){"
    ),
    extractRange(
      html,
      "function updateMouthGeometry(){",
      "\nfunction clearNaturalMouth(){"
    ),
    extractRange(
      html,
      "function renderVisibleMouthOpening(",
      "\nfunction renderNaturalMouth("
    ),
    extractRange(
      html,
      "function renderNaturalMouth(",
      "\nfunction getFrequencyBand("
    )
  ];

  assert.equal(
    sha256(ranges.join("\n--BUILD-271-LIP-REFERENCE--\n")),
    "27bc44b6a5a38826467b46c065053354e87ed01756368547504cf7d26a678ff2"
  );
});
