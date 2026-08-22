/* eslint-disable unicorn/number-literal-case */

import {
  decryptAiConfig,
  decryptJson,
  decryptText,
  encryptAiConfig,
  encryptJson,
  encryptText,
  resetEncryptionKey,
} from "./encryption.server";

import type { AiConfig } from "../domain/persistence/aiConfig";

const VALID_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const sampleConfig: AiConfig = {
  baseUrl: "https://api.openai.com/v1/chat/completions",
  apiKey: "sk-test-key-12345",
  model: "gpt-4o",
};

describe("encryptText & decryptText (generic AES-GCM string encryption)", () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = VALID_KEY;
    resetEncryptionKey();
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalKey;
    resetEncryptionKey();
  });

  it("encrypts plaintext and decrypts back to original text", async () => {
    const plaintext = "my-secret-ntfy-topic-123";
    const encrypted = await encryptText(plaintext);

    expect(typeof encrypted.ciphertext).toBe("string");
    expect(typeof encrypted.iv).toBe("string");
    expect(typeof encrypted.authTag).toBe("string");
    expect(encrypted.iv).toHaveLength(24);
    expect(encrypted.authTag).toHaveLength(32);

    const decrypted = await decryptText(
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.authTag,
    );
    expect(decrypted).toBe(plaintext);
  });

  it("produces distinct ciphertexts and IVs on multiple encrypt calls for same text", async () => {
    const text = "constant-text";
    const enc1 = await encryptText(text);
    const enc2 = await encryptText(text);

    expect(enc1.iv).not.toBe(enc2.iv);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
  });

  it("rejects corrupted ciphertext in decryptText", async () => {
    const encrypted = await encryptText("hello world");
    const tampered =
      encrypted.ciphertext.slice(0, -2) +
      (Number.parseInt(encrypted.ciphertext.slice(-2), 16) ^ 0xff)
        .toString(16)
        .padStart(2, "0");

    await expect(
      decryptText(tampered, encrypted.iv, encrypted.authTag),
    ).rejects.toThrow("Decryption failed");
  });

  it("rejects corrupted authTag in decryptText", async () => {
    const encrypted = await encryptText("hello world");
    const tampered =
      encrypted.authTag.slice(0, -2) +
      (Number.parseInt(encrypted.authTag.slice(-2), 16) ^ 0xff)
        .toString(16)
        .padStart(2, "0");

    await expect(
      decryptText(encrypted.ciphertext, encrypted.iv, tampered),
    ).rejects.toThrow("Decryption failed");
  });

  it("rejects corrupted IV in decryptText", async () => {
    const encrypted = await encryptText("hello world");
    const tampered =
      encrypted.iv.slice(0, -2) +
      (Number.parseInt(encrypted.iv.slice(-2), 16) ^ 0xff)
        .toString(16)
        .padStart(2, "0");

    await expect(
      decryptText(encrypted.ciphertext, tampered, encrypted.authTag),
    ).rejects.toThrow("Decryption failed");
  });
});

describe("encryptJson & decryptJson (generic AES-GCM typed JSON encryption)", () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = VALID_KEY;
    resetEncryptionKey();
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalKey;
    resetEncryptionKey();
  });

  it("round-trips complex JSON object", async () => {
    interface ComplexPayload {
      id: string;
      tags: string[];
      nested: { count: number; active: boolean };
    }
    const payload: ComplexPayload = {
      id: "abc-123",
      tags: ["alpha", "beta"],
      nested: { count: 42, active: true },
    };

    const encrypted = await encryptJson(payload);
    const decrypted = await decryptJson<ComplexPayload>(
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.authTag,
    );

    expect(decrypted).toEqual(payload);
  });
});

describe("encryptAiConfig (backward compatibility)", () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = VALID_KEY;
    resetEncryptionKey();
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalKey;
    resetEncryptionKey();
  });

  it("encrypts an AiConfig and returns hex-encoded ciphertext, iv, and authTag", async () => {
    const result = await encryptAiConfig(sampleConfig);
    expect(typeof result.ciphertext).toBe("string");
    expect(typeof result.iv).toBe("string");
    expect(typeof result.authTag).toBe("string");
    // IV should be 12 bytes = 24 hex characters.
    expect(result.iv).toHaveLength(24);
    // Auth tag should be 16 bytes = 32 hex characters.
    expect(result.authTag).toHaveLength(32);
  });

  it("produces different ciphertexts for the same input due to random IV", async () => {
    const result1 = await encryptAiConfig(sampleConfig);
    const result2 = await encryptAiConfig(sampleConfig);
    // IVs should differ.
    expect(result1.iv).not.toBe(result2.iv);
    // Ciphertexts should differ because of different IVs.
    expect(result1.ciphertext).not.toBe(result2.ciphertext);
  });

  it("throws when ENCRYPTION_KEY is not set", async () => {
    resetEncryptionKey();
    delete process.env.ENCRYPTION_KEY;
    await expect(encryptAiConfig(sampleConfig)).rejects.toThrow(
      "ENCRYPTION_KEY",
    );
  });

  it("throws when ENCRYPTION_KEY has invalid length", async () => {
    process.env.ENCRYPTION_KEY = "too-short";
    resetEncryptionKey();
    await expect(encryptAiConfig(sampleConfig)).rejects.toThrow(
      "ENCRYPTION_KEY must be 64 hex characters",
    );
  });
});

describe("decryptAiConfig (backward compatibility)", () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = VALID_KEY;
    resetEncryptionKey();
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalKey;
    resetEncryptionKey();
  });

  it("round-trip: encrypt then decrypt returns the original AiConfig", async () => {
    const encrypted = await encryptAiConfig(sampleConfig);
    const decrypted = await decryptAiConfig(
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.authTag,
    );
    expect(decrypted).toEqual(sampleConfig);
  });

  it("rejects tampered ciphertext", async () => {
    const encrypted = await encryptAiConfig(sampleConfig);
    // Flip a bit in the ciphertext.
    const tamperedCiphertext =
      encrypted.ciphertext.slice(0, -2) +
      (Number.parseInt(encrypted.ciphertext.slice(-2), 16) ^ 0xff)
        .toString(16)
        .padStart(2, "0");
    await expect(
      decryptAiConfig(tamperedCiphertext, encrypted.iv, encrypted.authTag),
    ).rejects.toThrow("Decryption failed");
  });

  it("rejects tampered auth tag", async () => {
    const encrypted = await encryptAiConfig(sampleConfig);
    const tamperedAuthTag =
      encrypted.authTag.slice(0, -2) +
      (Number.parseInt(encrypted.authTag.slice(-2), 16) ^ 0xff)
        .toString(16)
        .padStart(2, "0");
    await expect(
      decryptAiConfig(encrypted.ciphertext, encrypted.iv, tamperedAuthTag),
    ).rejects.toThrow("Decryption failed");
  });

  it("rejects tampered IV", async () => {
    const encrypted = await encryptAiConfig(sampleConfig);
    const tamperedIv =
      encrypted.iv.slice(0, -2) +
      (Number.parseInt(encrypted.iv.slice(-2), 16) ^ 0xff)
        .toString(16)
        .padStart(2, "0");
    await expect(
      decryptAiConfig(encrypted.ciphertext, tamperedIv, encrypted.authTag),
    ).rejects.toThrow("Decryption failed");
  });

  it("throws when ENCRYPTION_KEY is not set", async () => {
    resetEncryptionKey();
    delete process.env.ENCRYPTION_KEY;
    await expect(
      decryptAiConfig("aa", "bb".repeat(6), "cc".repeat(8)),
    ).rejects.toThrow("ENCRYPTION_KEY");
  });
});
