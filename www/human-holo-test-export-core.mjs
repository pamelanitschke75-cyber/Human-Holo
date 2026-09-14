export const HUMAN_HOLO_TEST_DATA_FORMAT = "human-holo-test-data-export";
export const HUMAN_HOLO_TEST_DATA_VERSION = 1;
export const HUMAN_HOLO_TEST_ENCRYPTED_FORMAT =
  "human-holo-encrypted-test-data-export";
export const HUMAN_HOLO_TEST_EXPORT_MIN_PASSWORD_LENGTH = 12;
// 90 MiB Klartext bleiben auch nach AES-GCM und Base64-Hülle sicher unter
// der nativen 128-MiB-Dateigrenze.
export const HUMAN_HOLO_TEST_EXPORT_MAX_BYTES = 90 * 1024 * 1024;
export const HUMAN_HOLO_TEST_EXPORT_PBKDF2_ITERATIONS = 310_000;

const OWNER_PATTERN = /^human-test-[a-z0-9][a-z0-9-]{2,39}$/u;
const SPEAKER_PATTERN = /^tester-[a-z0-9][a-z0-9-]{2,39}$/u;
const ADDITIONAL_DATA = "human-holo-test-data-export:v1";

function toIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("HUMAN_HOLO_TEST_EXPORT_DATE_INVALID");
  }
  return date.toISOString();
}

function requiredIdentity(identity) {
  const ownerId = String(identity?.ownerId || "").trim();
  const speakerId = String(identity?.speakerId || "").trim();
  const cloneId = String(identity?.cloneId || "").trim();
  if (
    identity?.testOnly !== true ||
    !OWNER_PATTERN.test(ownerId) ||
    !SPEAKER_PATTERN.test(speakerId) ||
    cloneId !== `${ownerId}-001`
  ) {
    throw new Error("HUMAN_HOLO_TEST_EXPORT_IDENTITY_INVALID");
  }
  return Object.freeze({
    ownerId,
    speakerId,
    cloneId,
    displayName: String(identity?.displayName || "Tester").trim().slice(0, 80),
    role: String(identity?.role || "tester").trim().slice(0, 80),
    testOnly: true
  });
}

function requiredServerMemory(value, identity) {
  if (
    value?.format !== "human-holo-owner-memory" ||
    value?.version !== 1 ||
    value?.ownerId !== identity.ownerId ||
    value?.speakerId !== identity.speakerId ||
    value?.cloneId !== identity.cloneId ||
    value?.integrity?.algorithm !== "SHA-256" ||
    !/^[a-f0-9]{64}$/u.test(String(value?.integrity?.contentDigest || ""))
  ) {
    throw new Error("HUMAN_HOLO_TEST_EXPORT_MEMORY_SCOPE_MISMATCH");
  }
  return value;
}

function requiredPassword(value) {
  const password = String(value || "");
  if (
    password.length < HUMAN_HOLO_TEST_EXPORT_MIN_PASSWORD_LENGTH ||
    password.length > 1024
  ) {
    throw new Error("HUMAN_HOLO_TEST_EXPORT_PASSWORD_INVALID");
  }
  return password;
}

function requiredCrypto(cryptoObject) {
  if (!cryptoObject?.getRandomValues || !cryptoObject?.subtle) {
    throw new Error("HUMAN_HOLO_TEST_EXPORT_CRYPTO_UNAVAILABLE");
  }
  return cryptoObject;
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  let binary;
  try {
    binary = atob(String(value || ""));
  } catch {
    throw new Error("HUMAN_HOLO_TEST_EXPORT_BASE64_INVALID");
  }
  const result = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    result[index] = binary.charCodeAt(index);
  }
  return result;
}

async function encryptionKey(password, salt, cryptoObject, usages) {
  const encoder = new TextEncoder();
  const material = await cryptoObject.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return cryptoObject.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: HUMAN_HOLO_TEST_EXPORT_PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    usages
  );
}

export function createHumanHoloTestDataSnapshot({
  identity: identityValue,
  serverMemory,
  memoryPreferences = null,
  localData = null,
  createdAt = new Date()
} = {}) {
  const identity = requiredIdentity(identityValue);
  const memory = requiredServerMemory(serverMemory, identity);
  return Object.freeze({
    format: HUMAN_HOLO_TEST_DATA_FORMAT,
    version: HUMAN_HOLO_TEST_DATA_VERSION,
    testOnly: true,
    createdAt: toIso(createdAt),
    identity,
    scope: Object.freeze({
      serverMemory: true,
      memoryPreferences: true,
      ownerScopedLocalData: true,
      restoreAvailableInTest: false,
      excluded: Object.freeze([
        "Einladungs-Zugangscode",
        "Sitzungstoken",
        "OAuth-Zugangs- und Aktualisierungstoken",
        "Server- und Signiergeheimnisse",
        "flüchtiger RAM-Gesprächskontext"
      ])
    }),
    data: Object.freeze({
      serverMemory: memory,
      memoryPreferences,
      local: localData
    })
  });
}

export async function encryptHumanHoloTestData(
  snapshot,
  passwordValue,
  cryptoValue = globalThis.crypto
) {
  if (
    snapshot?.format !== HUMAN_HOLO_TEST_DATA_FORMAT ||
    snapshot?.version !== HUMAN_HOLO_TEST_DATA_VERSION ||
    snapshot?.testOnly !== true
  ) {
    throw new Error("HUMAN_HOLO_TEST_EXPORT_FORMAT_INVALID");
  }
  const password = requiredPassword(passwordValue);
  const cryptoObject = requiredCrypto(cryptoValue);
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(snapshot));
  if (plaintext.byteLength > HUMAN_HOLO_TEST_EXPORT_MAX_BYTES) {
    throw new Error("HUMAN_HOLO_TEST_EXPORT_TOO_LARGE");
  }

  const salt = cryptoObject.getRandomValues(new Uint8Array(16));
  const iv = cryptoObject.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey(password, salt, cryptoObject, ["encrypt"]);
  const ciphertext = new Uint8Array(await cryptoObject.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: encoder.encode(ADDITIONAL_DATA),
      tagLength: 128
    },
    key,
    plaintext
  ));

  return JSON.stringify({
    format: HUMAN_HOLO_TEST_ENCRYPTED_FORMAT,
    version: HUMAN_HOLO_TEST_DATA_VERSION,
    testOnly: true,
    createdAt: snapshot.createdAt,
    encryption: {
      cipher: "AES-GCM-256",
      kdf: "PBKDF2",
      hash: "SHA-256",
      iterations: HUMAN_HOLO_TEST_EXPORT_PBKDF2_ITERATIONS,
      saltBase64: bytesToBase64(salt),
      ivBase64: bytesToBase64(iv),
      additionalData: ADDITIONAL_DATA,
      tagLength: 128
    },
    ciphertextBase64: bytesToBase64(ciphertext)
  }, null, 2);
}

export async function decryptHumanHoloTestData(
  encryptedValue,
  passwordValue,
  cryptoValue = globalThis.crypto
) {
  const envelope = typeof encryptedValue === "string"
    ? JSON.parse(encryptedValue)
    : encryptedValue;
  if (
    envelope?.format !== HUMAN_HOLO_TEST_ENCRYPTED_FORMAT ||
    envelope?.version !== HUMAN_HOLO_TEST_DATA_VERSION ||
    envelope?.testOnly !== true ||
    envelope?.encryption?.cipher !== "AES-GCM-256" ||
    envelope?.encryption?.kdf !== "PBKDF2" ||
    envelope?.encryption?.hash !== "SHA-256" ||
    envelope?.encryption?.iterations !==
      HUMAN_HOLO_TEST_EXPORT_PBKDF2_ITERATIONS ||
    envelope?.encryption?.additionalData !== ADDITIONAL_DATA ||
    envelope?.encryption?.tagLength !== 128
  ) {
    throw new Error("HUMAN_HOLO_TEST_EXPORT_FORMAT_INVALID");
  }
  const password = requiredPassword(passwordValue);
  const cryptoObject = requiredCrypto(cryptoValue);
  const salt = base64ToBytes(envelope.encryption.saltBase64);
  const iv = base64ToBytes(envelope.encryption.ivBase64);
  const ciphertext = base64ToBytes(envelope.ciphertextBase64);
  if (salt.byteLength !== 16 || iv.byteLength !== 12) {
    throw new Error("HUMAN_HOLO_TEST_EXPORT_CRYPTO_PARAMETERS_INVALID");
  }
  const key = await encryptionKey(password, salt, cryptoObject, ["decrypt"]);
  const plaintext = await cryptoObject.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode(ADDITIONAL_DATA),
      tagLength: 128
    },
    key,
    ciphertext
  );
  const snapshot = JSON.parse(new TextDecoder().decode(plaintext));
  if (
    snapshot?.format !== HUMAN_HOLO_TEST_DATA_FORMAT ||
    snapshot?.version !== HUMAN_HOLO_TEST_DATA_VERSION ||
    snapshot?.testOnly !== true
  ) {
    throw new Error("HUMAN_HOLO_TEST_EXPORT_PLAINTEXT_INVALID");
  }
  return snapshot;
}

export function humanHoloTestExportFileName(
  identityValue,
  dateValue = new Date()
) {
  const identity = requiredIdentity(identityValue);
  const date = new Date(dateValue);
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0")
  ].join("");
  return `Human-Holo-Testexport-${identity.ownerId}-${stamp}.human-holo-test-export`;
}
