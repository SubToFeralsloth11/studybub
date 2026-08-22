import { describe, expect, it, vi } from "vitest";

import {
  publishNtfyNotification,
  type NtfyPublishOptions,
} from "./ntfyClient.server";

describe("ntfyClient.server publishNtfyNotification", () => {
  const defaultOptions: NtfyPublishOptions = {
    topic: "my-streak-topic",
    title: "Keep your 5-day streak",
    body: "Study today to keep it going.",
    priority: 3,
    tags: ["fire"],
    sequenceId: "seq_opaque_12345",
    publicUrl: "https://studybub.example.com",
  };

  it("publishes to https://ntfy.sh/{percent-encoded-topic} with correct headers, body, and sequence ID", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      Response.json(
        {
          id: "ntfy_resp_abc123",
          time: 1_787_356_800,
          event: "message",
        },
        { status: 200 },
      ),
    );

    const result = await publishNtfyNotification(defaultOptions, {
      fetch: mockFetch as unknown as typeof fetch,
    });

    expect(result).toEqual({
      ok: true,
      status: 200,
      ntfyMessageId: "ntfy_resp_abc123",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://ntfy.sh/my-streak-topic");
    expect(init.method).toBe("POST");
    expect(init.redirect).toBe("error");
    expect(init.body).toBe("Study today to keep it going.");
    const headers = init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("text/plain; charset=utf-8");
    expect(headers["X-Title"]).toBe("Keep your 5-day streak");
    expect(headers["X-Priority"]).toBe("3");
    expect(headers["X-Tags"]).toBe("fire");
    expect(headers["X-Sequence-ID"]).toBe("seq_opaque_12345");
    expect(headers["X-Click"]).toBe("https://studybub.example.com");
  });

  it("percent-encodes topic name in outbound URL", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 200 }));

    await publishNtfyNotification(
      {
        ...defaultOptions,
        topic: "topic_with_dash-and_underscore",
      },
      { fetch: mockFetch as unknown as typeof fetch },
    );

    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://ntfy.sh/topic_with_dash-and_underscore",
    );
  });

  it("omits X-Tags header when tags array is empty or undefined", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(new Response("ok", { status: 200 }));

    await publishNtfyNotification(
      {
        ...defaultOptions,
        tags: undefined,
      },
      { fetch: mockFetch as unknown as typeof fetch },
    );

    const headers = mockFetch.mock.calls[0][1].headers as Record<
      string,
      string
    >;
    expect(headers["X-Tags"]).toBeUndefined();
  });

  it("handles 2xx response with plain text or non-JSON gracefully (ok=true, messageId=null)", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response("OK plain text", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    const result = await publishNtfyNotification(defaultOptions, {
      fetch: mockFetch as unknown as typeof fetch,
    });

    expect(result).toEqual({
      ok: true,
      status: 200,
      ntfyMessageId: null,
    });
  });

  it("classifies HTTP 408 as temporary timeout failure", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue(new Response("Request Timeout", { status: 408 }));

    const result = await publishNtfyNotification(defaultOptions, {
      fetch: mockFetch as unknown as typeof fetch,
    });

    expect(result).toEqual({
      ok: false,
      status: 408,
      classification: "timeout",
      isPermanent: false,
    });
  });
  it("classifies HTTP 429 as temporary rate-limited failure and parses Retry-After delta seconds", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response("Rate limited", {
        status: 429,
        headers: { "Retry-After": "120" },
      }),
    );

    const result = await publishNtfyNotification(defaultOptions, {
      fetch: mockFetch as unknown as typeof fetch,
    });

    expect(result).toEqual({
      ok: false,
      status: 429,
      classification: "rate-limited",
      isPermanent: false,
      retryAfterSeconds: 120,
    });
  });

  it("classifies HTTP 429 and parses Retry-After HTTP-date format", async () => {
    const futureDate = new Date(Date.now() + 60_000).toUTCString();
    const mockFetch = vi.fn().mockResolvedValue(
      new Response("Rate limited", {
        status: 429,
        headers: { "Retry-After": futureDate },
      }),
    );

    const result = (await publishNtfyNotification(defaultOptions, {
      fetch: mockFetch as unknown as typeof fetch,
    })) as {
      ok: false;
      classification: string;
      retryAfterSeconds?: number;
    };

    expect(result.ok).toBe(false);
    expect(result.classification).toBe("rate-limited");
    expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(58);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(62);
  });
  it("classifies HTTP 500, 502, 503, 504 as temporary service-unavailable failure", async () => {
    for (const status of [500, 502, 503, 504]) {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response("Error", { status }));

      const result = await publishNtfyNotification(defaultOptions, {
        fetch: mockFetch as unknown as typeof fetch,
      });

      expect(result).toEqual({
        ok: false,
        status,
        classification: "service-unavailable",
        isPermanent: false,
      });
    }
  });

  it("classifies other 4xx (400, 401, 403, 404, 422) as permanent rejected failure", async () => {
    for (const status of [400, 401, 403, 404, 422]) {
      const mockFetch = vi
        .fn()
        .mockResolvedValue(new Response("Rejected", { status }));

      const result = await publishNtfyNotification(defaultOptions, {
        fetch: mockFetch as unknown as typeof fetch,
      });

      expect(result).toEqual({
        ok: false,
        status,
        classification: "rejected",
        isPermanent: true,
      });
    }
  });
  it("classifies network exception as temporary network failure", async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await publishNtfyNotification(defaultOptions, {
      fetch: mockFetch as unknown as typeof fetch,
    });
    expect(result).toEqual({
      ok: false,
      classification: "network",
      isPermanent: false,
    });
  });
  it("classifies abort / timeout as temporary timeout failure", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    const mockFetch = vi.fn().mockRejectedValue(abortError);

    const result = await publishNtfyNotification(defaultOptions, {
      fetch: mockFetch as unknown as typeof fetch,
    });
    expect(result).toEqual({
      ok: false,
      classification: "timeout",
      isPermanent: false,
    });
  });
  it("keeps timeout timer active during slow response body consumption and classifies as timeout", async () => {
    const mockFetch = vi
      .fn()
      .mockImplementation(async (_url: string, init?: RequestInit) => {
        const signal = init?.signal;
        return {
          ok: true,
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
          json: async () => {
            return new Promise((_, reject) => {
              if (signal) {
                signal.addEventListener("abort", () => {
                  const abortErr = new Error("The operation was aborted");
                  abortErr.name = "AbortError";
                  reject(abortErr);
                });
              }
            });
          },
        } as unknown as Response;
      });

    const result = await publishNtfyNotification(defaultOptions, {
      fetch: mockFetch as unknown as typeof fetch,
      timeoutMs: 50,
    });

    expect(result).toEqual({
      ok: false,
      classification: "timeout",
      isPermanent: false,
    });
  });
  it("never includes topic or response body in result error fields (data non-disclosure)", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response("Sensitive upstream body with topic=secret-topic", {
        status: 400,
      }),
    );

    const result = await publishNtfyNotification(
      {
        ...defaultOptions,
        topic: "very-confidential-topic",
      },
      { fetch: mockFetch as unknown as typeof fetch },
    );

    // Verify result object contains no topic or response body strings
    const json = JSON.stringify(result);
    expect(json).not.toContain("very-confidential-topic");
    expect(json).not.toContain("Sensitive upstream body");
  });
});
