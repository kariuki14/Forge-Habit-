import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "crypto";

/**
 * Envelope encryption for crypto erasable PII.
 *
 * - DATA_ENCRYPTION_KEY (env, 32-byte base64) is the Key-Encryption-Key (KEK).
 * - Each user gets a random 256-bit Data-Encryption-Key (DEK), wrapped with the
 *   KEK and stored in the UserKey table — separate from the data it decrypts.
 * - Deleting the UserKey row makes the ciphertext permanently unrecoverable,
 *   even if encrypted data survives in backups. That is the erasure event.
 *
 * Ciphertext format: "v1.<iv_b64>.<tag_b64>.<ct_b64>" (AES-256-GCM).
 * Values not matching this format are treated as legacy plaintext.
 */

const PREFIX = "v1";

let cachedKek: Buffer | null = null;

export function getKek(): Buffer {
  if (cachedKek) return cachedKek;
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("DATA_ENCRYPTION_KEY is not set (generate: openssl rand -base64 32)");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("DATA_ENCRYPTION_KEY must be a 32-byte base64 value");
  }
  cachedKek = key;
  return key;
}

function encryptAesGcm(key: Buffer, plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `${PREFIX}.${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${ct.toString("base64")}`;
}

function decryptAesGcm(key: Buffer, blob: string): string {
  const parts = blob.split(".");
  if (parts.length !== 4 || parts[0] !== PREFIX) throw new Error("Malformed ciphertext");
  const [, iv64, tag64, ct64] = parts;
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv64, "base64"));
  decipher.setAuthTag(Buffer.from(tag64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ct64, "base64")), decipher.final()]).toString("utf8");
}

export function isCiphertext(value: string | null | undefined): value is string {
  return typeof value === "string" && value.startsWith(`${PREFIX}.`);
}

/** Generate a fresh 256-bit DEK. */
export function generateDek(): Buffer {
  return randomBytes(32);
}

/** Wrap a DEK with the KEK for storage. */
export function wrapDek(dek: Buffer): string {
  return encryptAesGcm(getKek(), dek.toString("base64"));
}

/** Unwrap a stored DEK with the KEK. */
export function unwrapDek(wrapped: string): Buffer {
  return Buffer.from(decryptAesGcm(getKek(), wrapped), "base64");
}

/** Encrypt a PII field with the user's DEK. Nullable in, nullable out. */
export function encryptField(dek: Buffer, plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return plaintext ?? null;
  return encryptAesGcm(dek, plaintext);
}

/**
 * Decrypt a PII field with the user's DEK.
 * Legacy plaintext (pre-encryption rows) passes through unchanged.
 */
export function decryptField(dek: Buffer, value: string | null | undefined): string | null {
  if (value == null || value === "") return value ?? null;
  if (!isCiphertext(value)) return value;
  return decryptAesGcm(dek, value);
}

/**
 * Deterministic blind index for lookups on encrypted email.
 * HMAC-SHA256 keyed with the KEK — no rainbow-table risk at app scale
 * and never stored elsewhere.
 */
export function emailIndex(email: string): string {
  return createHmac("sha256", getKek()).update(email.trim().toLowerCase()).digest("hex");
}
