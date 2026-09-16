import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BINARY_SUFFIXES = new Set([
  ".bin",
  ".glb",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".mp3",
  ".mp4",
  ".pdf",
  ".png",
  ".webm",
  ".webp",
  ".zip"
]);
const FORBIDDEN_FILE_SUFFIXES = Object.freeze([
  ".jks",
  ".keystore",
  ".p12",
  ".pfx",
  ".sqlite",
  ".sqlite3"
]);
const FORBIDDEN_EXACT_NAMES = new Set([
  ".env",
  "google-services.json",
  "service-account.json"
]);

function joined(...parts) {
  return parts.join("");
}

const SECRET_PATTERNS = Object.freeze([
  {
    id: "private-key",
    pattern: new RegExp(joined("-----BEGIN ", "(?:RSA |EC |OPENSSH )?", "PRIVATE KEY-----"), "u")
  },
  {
    id: "openai-key",
    pattern: new RegExp(joined("\\b", "s", "k-[A-Za-z0-9_-]{20,}"), "u")
  },
  {
    id: "github-token",
    pattern: new RegExp(joined("\\b", "gh", "[opsu]_[A-Za-z0-9]{30,}"), "u")
  },
  {
    id: "github-fine-grained-token",
    pattern: new RegExp(joined("\\b", "github_pat_", "[A-Za-z0-9_]{40,}"), "u")
  },
  {
    id: "google-api-key",
    pattern: new RegExp(joined("\\b", "AI", "za[0-9A-Za-z_-]{35}"), "u")
  },
  {
    id: "aws-access-key",
    pattern: new RegExp(joined("\\b", "AK", "IA[0-9A-Z]{16}"), "u")
  },
  {
    id: "slack-token",
    pattern: new RegExp(joined("\\b", "xox", "[aboprs]-[A-Za-z0-9-]{20,}"), "u")
  },
  {
    id: "stripe-live-key",
    pattern: new RegExp(joined("\\b", "sk", "_live_[A-Za-z0-9]{20,}"), "u")
  }
]);

function trackedAndUntrackedFiles(rootDirectory) {
  const output = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    {
      cwd: rootDirectory,
      encoding: "buffer",
      maxBuffer: 16 * 1024 * 1024
    }
  );
  return output
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .sort();
}

function forbiddenFileReason(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  const name = path.posix.basename(normalized).toLowerCase();
  if (FORBIDDEN_EXACT_NAMES.has(name)) return "sensitive-file";
  if (name.startsWith(".env.") && name !== ".env.example") {
    return "sensitive-environment-file";
  }
  if (FORBIDDEN_FILE_SUFFIXES.some((suffix) => name.endsWith(suffix))) {
    return "sensitive-binary-file";
  }
  return "";
}

export function scanRepositorySecurity({
  rootDirectory = process.cwd(),
  files = trackedAndUntrackedFiles(rootDirectory),
  readFile = (relativePath) => readFileSync(path.join(rootDirectory, relativePath))
} = {}) {
  const findings = [];
  for (const relativePath of files) {
    const fileReason = forbiddenFileReason(relativePath);
    if (fileReason) {
      findings.push({ file: relativePath, rule: fileReason });
      continue;
    }
    if (BINARY_SUFFIXES.has(path.extname(relativePath).toLowerCase())) continue;

    let buffer;
    try {
      buffer = readFile(relativePath);
    } catch {
      findings.push({ file: relativePath, rule: "unreadable-file" });
      continue;
    }
    if (!Buffer.isBuffer(buffer)) buffer = Buffer.from(String(buffer), "utf8");
    if (buffer.includes(0)) continue;
    const text = buffer.toString("utf8");
    for (const { id, pattern } of SECRET_PATTERNS) {
      if (pattern.test(text)) findings.push({ file: relativePath, rule: id });
    }
  }
  return findings;
}

export function assertRepositorySecurity(options = {}) {
  const findings = scanRepositorySecurity(options);
  if (findings.length === 0) return Object.freeze({ filesChecked: true });
  const summary = findings
    .map(({ file, rule }) => `- ${file} (${rule})`)
    .join("\n");
  throw new Error(
    "Sicherheitsprüfung abgebrochen. Mögliche Geheimnisse oder private Dateien:\n" +
      summary
  );
}

const invokedPath = process.argv[1]
  ? path.resolve(process.argv[1])
  : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    assertRepositorySecurity();
    console.log(
      "Human Holo: keine bekannten Geheimnismuster oder privaten Schlüsseldateien im Git-Bestand."
    );
  } catch (error) {
    console.error(String(error?.message || "Sicherheitsprüfung fehlgeschlagen."));
    process.exitCode = 1;
  }
}
