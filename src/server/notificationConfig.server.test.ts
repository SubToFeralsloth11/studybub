import { describe, expect, it } from "vitest";

import {
  getPublicAppUrl,
  validatePublicAppUrl,
} from "./notificationConfig.server";

describe("notificationConfig.server", () => {
  describe("validatePublicAppUrl", () => {
    it("accepts valid absolute http and https origin URLs", () => {
      expect(validatePublicAppUrl("https://studybub.syntaxrewrite.com")).toBe(
        "https://studybub.syntaxrewrite.com",
      );
      expect(validatePublicAppUrl("http://localhost:3000")).toBe(
        "http://localhost:3000",
      );
      expect(validatePublicAppUrl("https://example.com/")).toBe(
        "https://example.com",
      );
    });

    it("rejects non-http/https protocols, relative paths, credentials, paths, query params, hash, and malformed URLs", () => {
      expect(() => validatePublicAppUrl("ftp://example.com")).toThrow();
      expect(() => validatePublicAppUrl("/relative/path")).toThrow();
      expect(() => validatePublicAppUrl("not-a-url")).toThrow();
      expect(() => validatePublicAppUrl("")).toThrow();
      expect(() =>
        validatePublicAppUrl("https://user:pass@example.com"),
      ).toThrow();
      expect(() => validatePublicAppUrl("https://example.com/app")).toThrow();
      expect(() =>
        validatePublicAppUrl("https://example.com?query=1"),
      ).toThrow();
      expect(() => validatePublicAppUrl("https://example.com#hash")).toThrow();
    });
  });

  describe("getPublicAppUrl", () => {
    it("returns validated URL when STUDYBUB_PUBLIC_URL environment variable is set", () => {
      const url = getPublicAppUrl({
        STUDYBUB_PUBLIC_URL: "https://studybub.example.com",
        NODE_ENV: "production",
      });
      expect(url).toBe("https://studybub.example.com");
    });

    it("defaults to http://localhost:3000 in development/test when environment variable is unset", () => {
      const devUrl = getPublicAppUrl({
        NODE_ENV: "development",
      });
      expect(devUrl).toBe("http://localhost:3000");

      const testUrl = getPublicAppUrl({
        NODE_ENV: "test",
      });
      expect(testUrl).toBe("http://localhost:3000");
    });

    it("throws error in production when STUDYBUB_PUBLIC_URL is unset or empty", () => {
      expect(() =>
        getPublicAppUrl({
          NODE_ENV: "production",
        }),
      ).toThrow(/STUDYBUB_PUBLIC_URL is required in production/i);

      expect(() =>
        getPublicAppUrl({
          NODE_ENV: "production",
          STUDYBUB_PUBLIC_URL: "",
        }),
      ).toThrow(/STUDYBUB_PUBLIC_URL is required in production/i);
    });
  });
});
