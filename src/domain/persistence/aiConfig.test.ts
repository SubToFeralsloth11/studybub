import { describe, expect, it, beforeEach } from "vitest";

import {
  clearAiConfig,
  loadAiConfig,
  saveAiConfig,
  STORAGE_KEY,
  type AiConfig,
} from "./aiConfig";

import type { StorageLike } from "./storage";

/** A simple in-memory storage stub for testing. */
class MemoryStorage implements StorageLike {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }
}

describe("AiConfig persistence", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it("saves and loads in a round-trip", () => {
    const config: AiConfig = {
      baseUrl: "https://api.example.com/v1/chat/completions",
      apiKey: "sk-test123",
      model: "gpt-4o",
    };

    const saved = saveAiConfig(config, storage);
    expect(saved).toBe(true);

    const loaded = loadAiConfig(storage);
    expect(loaded).toEqual(config);
  });

  it("returns null when no config has been saved", () => {
    expect(loadAiConfig(storage)).toBeNull();
  });

  it("returns null when stored JSON is corrupt", () => {
    storage.setItem(STORAGE_KEY, "not valid json {");

    const loaded = loadAiConfig(storage);
    expect(loaded).toBeNull();
  });

  it("clears removes the stored key", () => {
    const config: AiConfig = {
      baseUrl: "https://api.example.com",
      apiKey: "key",
      model: "model",
    };
    saveAiConfig(config, storage);

    clearAiConfig(storage);
    expect(loadAiConfig(storage)).toBeNull();
    // Verify the key is actually removed, not set to empty string.
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("returns null when stored JSON has wrong shape", () => {
    // JSON parses but fields are missing.
    storage.setItem(STORAGE_KEY, JSON.stringify({ baseUrl: "x" }));

    const loaded = loadAiConfig(storage);
    expect(loaded).toBeNull();
  });

  it("returns null when stored JSON has wrong types", () => {
    // Correct field names but wrong types.
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ baseUrl: 123, apiKey: true, model: null }),
    );

    const loaded = loadAiConfig(storage);
    expect(loaded).toBeNull();
  });

  it("returns null when stored JSON is null", () => {
    storage.setItem(STORAGE_KEY, "null");

    const loaded = loadAiConfig(storage);
    expect(loaded).toBeNull();
  });

  it("handles the StorageLike throwing on getItem", () => {
    const throwingStorage: StorageLike = {
      getItem: () => {
        throw new Error("Quota exceeded");
      },
      setItem: () => {},
      removeItem: () => {},
    };

    const loaded = loadAiConfig(throwingStorage);
    expect(loaded).toBeNull();
  });

  it("handles the StorageLike throwing on setItem", () => {
    const throwingStorage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error("Quota exceeded");
      },
      removeItem: () => {},
    };

    const config: AiConfig = {
      baseUrl: "https://api.example.com",
      apiKey: "key",
      model: "model",
    };

    const result = saveAiConfig(config, throwingStorage);
    expect(result).toBe(false);
  });

  it("handles the StorageLike throwing on removeItem", () => {
    const throwingStorage: StorageLike = {
      getItem: () => JSON.stringify({ baseUrl: "x", apiKey: "k", model: "m" }),
      setItem: () => {},
      removeItem: () => {
        throw new Error("Quota exceeded");
      },
    };

    // Should not throw.
    expect(() => clearAiConfig(throwingStorage)).not.toThrow();
  });
});
