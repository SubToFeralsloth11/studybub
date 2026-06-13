import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CURRENT_VERSION,
  defaultState,
  OLD_STORAGE_KEY,
  STORAGE_KEY,
  type SavedState,
} from "./schema";
import {
  loadProgress,
  migrateProgress,
  resetProgress,
  saveProgress,
  type StorageLike,
} from "./storage";

// An in-memory storage stub implementing the StorageLike interface.
function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

// A storage stub whose every method throws, simulating a disabled backend.
function throwingStorage(): StorageLike {
  return {
    getItem: () => {
      throw new Error("storage disabled");
    },
    setItem: () => {
      throw new Error("storage disabled");
    },
    removeItem: () => {
      throw new Error("storage disabled");
    },
  };
}

const sample: SavedState = {
  version: CURRENT_VERSION,
  lessons: { "alg-5g": { completed: true, bestAccuracy: 1 } },
  challenges: {},
  xp: 50,
  streak: { count: 1, lastActiveDate: "2026-06-07" },
  badges: ["first-lesson"],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("saveProgress / loadProgress round-trip", () => {
  it("persists and reloads an identical state", () => {
    const storage = memoryStorage();
    expect(saveProgress(sample, storage)).toBe(true);
    expect(loadProgress(storage)).toEqual(sample);
  });

  it("writes under the versioned storage key", () => {
    const storage = memoryStorage();
    saveProgress(sample, storage);
    expect(storage.getItem(STORAGE_KEY)).toContain('"version":1');
  });
});

describe("loadProgress recovery", () => {
  it("returns default state when nothing is stored", () => {
    expect(loadProgress(memoryStorage())).toEqual(defaultState());
  });

  it("returns default state for corrupt stored data", () => {
    const storage = memoryStorage({ [STORAGE_KEY]: "{ broken" });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(loadProgress(storage)).toEqual(defaultState());
  });

  it("survives a throwing storage backend", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => loadProgress(throwingStorage())).not.toThrow();
    expect(loadProgress(throwingStorage())).toEqual(defaultState());
  });

  it("returns default state when storage is unavailable (null)", () => {
    expect(loadProgress(null)).toEqual(defaultState());
  });
});

describe("saveProgress failure handling", () => {
  it("returns false without throwing when the write fails", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(saveProgress(sample, throwingStorage())).toBe(false);
  });

  it("returns false when storage is unavailable (null)", () => {
    expect(saveProgress(sample, null)).toBe(false);
  });
});

describe("resetProgress", () => {
  it("clears the stored key and returns a clean default", () => {
    const storage = memoryStorage();
    saveProgress(sample, storage);
    const result = resetProgress(storage);
    expect(result).toEqual(defaultState());
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("returns a clean default even when clearing throws", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(resetProgress(throwingStorage())).toEqual(defaultState());
  });
});

describe("migrateProgress", () => {
  it("moves data from old key to new key", () => {
    const storage = memoryStorage({
      [OLD_STORAGE_KEY]: JSON.stringify(sample),
    });
    migrateProgress(storage);
    const newData = storage.getItem(STORAGE_KEY);
    expect(newData).not.toBeNull();
    expect(JSON.parse(newData!)).toEqual(sample);
  });

  it("clears old key after successful migration", () => {
    const storage = memoryStorage({
      [OLD_STORAGE_KEY]: JSON.stringify(sample),
    });
    migrateProgress(storage);
    expect(storage.getItem(OLD_STORAGE_KEY)).toBeNull();
  });

  it("prefers new key when both old and new keys exist", () => {
    const newer: SavedState = { ...sample, xp: 999 };
    const storage = memoryStorage({
      [OLD_STORAGE_KEY]: JSON.stringify(sample),
      [STORAGE_KEY]: JSON.stringify(newer),
    });
    migrateProgress(storage);
    expect(storage.getItem(OLD_STORAGE_KEY)).toBeNull();
    const newData = storage.getItem(STORAGE_KEY);
    expect(JSON.parse(newData!)).toEqual(newer);
  });

  it("does not attempt migration when old key is absent", () => {
    const storage = memoryStorage({
      [STORAGE_KEY]: JSON.stringify(sample),
    });
    migrateProgress(storage);
    expect(storage.getItem(OLD_STORAGE_KEY)).toBeNull();
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!)).toEqual(sample);
  });

  it("survives corrupt data in old key", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const storage = memoryStorage({
      [OLD_STORAGE_KEY]: "{ not json",
    });
    expect(() => migrateProgress(storage)).not.toThrow();
  });
});
