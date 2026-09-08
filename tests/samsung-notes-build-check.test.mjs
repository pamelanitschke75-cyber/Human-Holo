import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = fileURLToPath(
  new URL("../", import.meta.url)
);


test(
  "Samsung-Notes-Buildprüfung lädt alle Parser-Abhängigkeiten",
  () => {

    const result = spawnSync(
      process.execPath,
      ["scripts/check-samsung-notes-language.mjs"],
      {
        cwd: repositoryRoot,
        encoding: "utf8"
      }
    );

    assert.equal(
      result.status,
      0,
      result.stderr || result.stdout
    );

    assert.match(
      result.stdout,
      /Samsung-Notes-Textübergabe und sichere Gerätebestätigungen sind geprüft\./u
    );
  }
);
