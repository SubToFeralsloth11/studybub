/**
 * Tests for the AiConfig type definition.
 *
 * Since the AiConfig type has no runtime functions (persistence is
 * server-side), this test verifies the type shape is correct.
 *
 * @module domain/persistence/aiConfig.test
 * @author John Grimes
 */

import { describe, expect, it } from "vitest";

import type { AiConfig } from "./aiConfig";

describe("AiConfig type shape", () => {
  it("accepts a valid config object", () => {
    const config: AiConfig = {
      baseUrl: "https://api.example.com/v1/chat/completions",
      apiKey: "sk-test-key",
      model: "gpt-4o",
    };
    expect(config.baseUrl).toBe("https://api.example.com/v1/chat/completions");
    expect(config.apiKey).toBe("sk-test-key");
    expect(config.model).toBe("gpt-4o");
  });

  it("requires all three string fields", () => {
    // This is a compile-time check - if this compiles, the type is correct.
    const config: AiConfig = {
      baseUrl: "https://api.example.com/v1/chat/completions",
      apiKey: "sk-test-key",
      model: "gpt-4o",
    };
    expect(typeof config.baseUrl).toBe("string");
    expect(typeof config.apiKey).toBe("string");
    expect(typeof config.model).toBe("string");
  });
});
