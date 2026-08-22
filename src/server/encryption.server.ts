import type { AiConfig } from "../domain/persistence/aiConfig";

/** Cached encryption key bytes derived from the ENCRYPTION_KEY env var. */
let keyBytes: Uint8Array | null = null;

/**
 * Resets the cached encryption key. Used in tests to ensure each test case
 * picks up environment variable changes.
 */
export function resetEncryptionKey(): void {
  keyBytes = null;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

/**
 * Returns the AES-256-GCM encryption key as raw bytes, caching it after the
 * first call. The key is read from the `ENCRYPTION_KEY` environment variable
 * which must be 64 hex characters (32 bytes).
 *
 * @returns The 32-byte encryption key.
 * @throws If ENCRYPTION_KEY is not set or is not 64 hex characters.
 */
function getKeyBytes(): Uint8Array {
  if (keyBytes) return keyBytes;

  const hexKey = process.env.ENCRYPTION_KEY;
  if (!hexKey) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. " +
        "Generate with: openssl rand -hex 32",
    );
  }

  if (hexKey.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes).");
  }

  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = Number.parseInt(hexKey.slice(i * 2, i * 2 + 2), 16);
  }
  keyBytes = bytes;
  return bytes;
}

/**
 * Returns a SubtleCrypto-compatible CryptoKey for AES-256-GCM operations.
 *
 * @returns The CryptoKey.
 */
async function getCryptoKey(): Promise<CryptoKey> {
  const keyData = getKeyBytes();
  return crypto.subtle.importKey(
    "raw",
    keyData as BufferSource,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Converts a Uint8Array to a hex-encoded string.
 *
 * @param bytes - The bytes to convert.
 * @returns The hex-encoded string.
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Converts a hex-encoded string to a Uint8Array.
 *
 * @param hex - The hex string to convert.
 * @returns The decoded bytes.
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Encrypts generic text using AES-256-GCM.
 *
 * @param text - The plaintext string to encrypt.
 * @returns Hex-encoded ciphertext, IV, and authTag.
 */
export async function encryptText(text: string): Promise<EncryptedPayload> {
  const cryptoKey = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(text);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    plaintext,
  );

  // The Web Crypto API returns ciphertext || authTag (last 16 bytes).
  const ciphertextBytes = new Uint8Array(
    encrypted,
    0,
    encrypted.byteLength - 16,
  );
  const authTagBytes = new Uint8Array(encrypted, encrypted.byteLength - 16, 16);

  return {
    ciphertext: bytesToHex(ciphertextBytes),
    iv: bytesToHex(iv),
    authTag: bytesToHex(authTagBytes),
  };
}

/**
 * Decrypts hex-encoded AES-256-GCM ciphertext to string.
 *
 * @param ciphertext - The encrypted ciphertext (hex-encoded).
 * @param iv - The initialisation vector (hex-encoded).
 * @param authTag - The authentication tag (hex-encoded).
 * @returns The decrypted plaintext string.
 */
export async function decryptText(
  ciphertext: string,
  iv: string,
  authTag: string,
): Promise<string> {
  const cryptoKey = await getCryptoKey();
  const ivBytes = hexToBytes(iv);
  const ciphertextBytes = hexToBytes(ciphertext);
  const authTagBytes = hexToBytes(authTag);

  // Combine ciphertext and auth tag as required by Web Crypto.
  const combined = new Uint8Array(ciphertextBytes.length + authTagBytes.length);
  combined.set(ciphertextBytes);
  combined.set(authTagBytes, ciphertextBytes.length);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes as BufferSource },
      cryptoKey,
      combined,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error("Decryption failed: invalid key or corrupted data.");
  }
}

/**
 * Encrypts a typed JSON object using AES-256-GCM.
 *
 * @param value - The JSON-serializable value to encrypt.
 * @returns Hex-encoded ciphertext, IV, and authTag.
 */
export async function encryptJson<T>(value: T): Promise<EncryptedPayload> {
  return encryptText(JSON.stringify(value));
}

/**
 * Decrypts hex-encoded AES-256-GCM ciphertext to a typed JSON object.
 *
 * @param ciphertext - The encrypted ciphertext (hex-encoded).
 * @param iv - The initialisation vector (hex-encoded).
 * @param authTag - The authentication tag (hex-encoded).
 * @returns The decrypted and parsed JSON value.
 */
export async function decryptJson<T>(
  ciphertext: string,
  iv: string,
  authTag: string,
): Promise<T> {
  const json = await decryptText(ciphertext, iv, authTag);
  return JSON.parse(json) as T;
}

/**
 * Encrypts an AiConfig object using AES-256-GCM.
 *
 * @param config - The AI configuration to encrypt.
 * @returns The encrypted ciphertext, IV, and authentication tag.
 */
export async function encryptAiConfig(
  config: AiConfig,
): Promise<EncryptedPayload> {
  return encryptJson(config);
}

/**
 * Decrypts an encrypted AiConfig using AES-256-GCM.
 *
 * @param ciphertext - The encrypted ciphertext (hex-encoded).
 * @param iv - The initialisation vector (hex-encoded).
 * @param authTag - The authentication tag (hex-encoded).
 * @returns The decrypted AiConfig.
 */
export async function decryptAiConfig(
  ciphertext: string,
  iv: string,
  authTag: string,
): Promise<AiConfig> {
  return decryptJson<AiConfig>(ciphertext, iv, authTag);
}
