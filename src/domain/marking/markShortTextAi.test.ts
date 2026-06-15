import { afterEach, describe, expect, it, vi } from "vitest";

import { markShortTextAi } from "./markShortTextAi";

import type { ShortTextQuestion } from "../content/types";
import type { AiConfig } from "../persistence/aiConfig";

/** A valid AI config for testing. */
const validConfig: AiConfig = {
  baseUrl: "https://api.example.com/v1/chat/completions",
  apiKey: "sk-test123",
  model: "gpt-4o",
};

/** A short-text question fixture. */
function shortTextQ(overrides?: Partial<ShortTextQuestion>): ShortTextQuestion {
  return {
    id: "q1",
    type: "shortText",
    prompt: [{ kind: "text", text: "What is the capital of France?" }],
    explanation: [{ kind: "text", text: "The capital of France is Paris." }],
    xp: 10,
    accepted: ["Paris", "paris"],
    ...overrides,
  };
}

/** Creates a mock fetch that returns a controlled JSON response. */
function mockFetch(
  status: number,
  body: unknown,
  delayMs = 0,
): typeof globalThis.fetch {
  return vi.fn().mockImplementation(
    () =>
      new Promise<Response>((resolve) => {
        setTimeout(() => {
          resolve({
            ok: status >= 200 && status < 300,
            status,
            json: async () => body,
          } as Response);
        }, delayMs);
      }),
  ) as unknown as typeof globalThis.fetch;
}

/** Creates a mock fetch that throws an error. */
function mockFetchThrows(error: Error): typeof globalThis.fetch {
  return vi.fn().mockRejectedValue(error) as unknown as typeof globalThis.fetch;
}

describe("markShortTextAi — success path", () => {
  it("returns correct with feedback when AI says correct", async () => {
    const fetchFn = mockFetch(200, {
      correct: true,
      feedback: "Well done! That is the right answer.",
    });
    const result = await markShortTextAi(
      shortTextQ(),
      "Paris",
      validConfig,
      fetchFn,
    );
    expect(result).toEqual({
      status: "correct",
      feedback: "Well done! That is the right answer.",
    });
  });

  it("returns incorrect with feedback when AI says incorrect", async () => {
    const fetchFn = mockFetch(200, {
      correct: false,
      feedback: "Not quite. The capital is Paris, not London.",
    });
    const result = await markShortTextAi(
      shortTextQ(),
      "London",
      validConfig,
      fetchFn,
    );
    expect(result).toEqual({
      status: "incorrect",
      feedback: "Not quite. The capital is Paris, not London.",
    });
  });
});

describe("markShortTextAi — error paths", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns aiNotConfigured when aiConfig is undefined", async () => {
    const fetchFn = mockFetch(200, { correct: true, feedback: "ok" });
    const result = await markShortTextAi(
      shortTextQ(),
      "Paris",
      undefined,
      fetchFn,
    );
    expect(result).toEqual({
      status: "aiNotConfigured",
      message:
        "AI marking is not configured. Go to Settings to set up your AI provider.",
    });
  });

  it("returns aiError when fetch throws a network error", async () => {
    const fetchFn = mockFetchThrows(new TypeError("Failed to fetch"));
    const result = await markShortTextAi(
      shortTextQ(),
      "Paris",
      validConfig,
      fetchFn,
    );
    expect(result).toEqual({
      status: "aiError",
      message:
        "Could not reach the AI service. Check your API Base URL in Settings.",
    });
  });

  it("returns aiError on HTTP 401 Unauthorized", async () => {
    const fetchFn = mockFetch(401, {
      error: "Invalid API key",
    });
    const result = await markShortTextAi(
      shortTextQ(),
      "Paris",
      validConfig,
      fetchFn,
    );
    expect(result).toEqual({
      status: "aiError",
      message: "AI service returned an error (HTTP 401). Check your Settings.",
    });
  });

  it("returns aiError on HTTP 429 Rate Limited", async () => {
    const fetchFn = mockFetch(429, { error: "Too many requests" });
    const result = await markShortTextAi(
      shortTextQ(),
      "Paris",
      validConfig,
      fetchFn,
    );
    expect(result).toEqual({
      status: "aiError",
      message: "AI service returned an error (HTTP 429). Check your Settings.",
    });
  });

  it("returns aiError on HTTP 500 Server Error", async () => {
    const fetchFn = mockFetch(500, { error: "Internal error" });
    const result = await markShortTextAi(
      shortTextQ(),
      "Paris",
      validConfig,
      fetchFn,
    );
    expect(result).toEqual({
      status: "aiError",
      message: "AI service returned an error (HTTP 500). Check your Settings.",
    });
  });

  it("returns aiError when response is not valid JSON", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    }) as unknown as typeof globalThis.fetch;
    const result = await markShortTextAi(
      shortTextQ(),
      "Paris",
      validConfig,
      fetchFn,
    );
    expect(result).toEqual({
      status: "aiError",
      message: "AI service returned an unexpected response. Try again.",
    });
  });

  it("returns aiError when response JSON shape is invalid — missing correct", async () => {
    const fetchFn = mockFetch(200, {
      feedback: "Some feedback but no correct field",
    });
    const result = await markShortTextAi(
      shortTextQ(),
      "Paris",
      validConfig,
      fetchFn,
    );
    expect(result).toEqual({
      status: "aiError",
      message: "AI service returned an unexpected response. Try again.",
    });
  });

  it("returns aiError when response JSON shape is invalid — correct is not boolean", async () => {
    const fetchFn = mockFetch(200, {
      correct: "yes",
      feedback: "ok",
    });
    const result = await markShortTextAi(
      shortTextQ(),
      "Paris",
      validConfig,
      fetchFn,
    );
    expect(result).toEqual({
      status: "aiError",
      message: "AI service returned an unexpected response. Try again.",
    });
  });

  it("returns aiError when response JSON shape is invalid — feedback is not string", async () => {
    const fetchFn = mockFetch(200, {
      correct: true,
      feedback: 123,
    });
    const result = await markShortTextAi(
      shortTextQ(),
      "Paris",
      validConfig,
      fetchFn,
    );
    expect(result).toEqual({
      status: "aiError",
      message: "AI service returned an unexpected response. Try again.",
    });
  });

  it("returns aiError when response JSON feedback is empty string", async () => {
    const fetchFn = mockFetch(200, {
      correct: true,
      feedback: "",
    });
    const result = await markShortTextAi(
      shortTextQ(),
      "Paris",
      validConfig,
      fetchFn,
    );
    expect(result).toEqual({
      status: "aiError",
      message: "AI service returned an unexpected response. Try again.",
    });
  });

  it("returns timeout message when fetch is aborted by timeout", async () => {
    // Simulate what happens after the 30s timeout fires: the AbortController
    // aborts the signal, fetch throws AbortError. We simulate by having
    // the fetch mock throw AbortError AND passing a signal that will be
    // checked by the implementation's timedOut flag. The implementation
    // sets timedOut = true before aborting; the catch block checks timedOut.
    //
    // We use fake timers so the internal setTimeout fires and sets timedOut.
    vi.useFakeTimers();

    const fetchFn = vi
      .fn()
      .mockImplementation((_url: string, init: RequestInit) => {
        const signal = init?.signal as AbortSignal | undefined;
        if (signal) {
          return new Promise<Response>((_resolve, reject) => {
            const onAbort = () =>
              reject(new DOMException("Aborted", "AbortError"));
            // If already aborted, reject immediately.
            if (signal.aborted) {
              reject(new DOMException("Aborted", "AbortError"));
              return;
            }
            signal.addEventListener("abort", onAbort, { once: true });
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ correct: true, feedback: "ok" }),
        } as Response);
      }) as unknown as typeof globalThis.fetch;

    const resultPromise = markShortTextAi(
      shortTextQ(),
      "Paris",
      validConfig,
      fetchFn,
    );

    // Advance past 30s — this fires the setTimeout callback which:
    // 1. Sets timedOut = true
    // 2. Calls timeoutController.abort()
    vi.advanceTimersByTime(31_000);

    // Let pending microtasks run.
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
      vi.advanceTimersByTime(0);
    });

    const result = await resultPromise;
    expect(result).toEqual({
      status: "aiError",
      message: "AI service did not respond in time. Try again.",
    });
  }, 10_000);
});

describe("markShortTextAi — request body shape", () => {
  it("sends the correct JSON request body", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ correct: true, feedback: "Great!" }),
    }) as unknown as typeof globalThis.fetch;

    await markShortTextAi(
      shortTextQ({
        prompt: [{ kind: "text", text: "What is the capital of France?" }],
        explanation: [
          { kind: "text", text: "The capital of France is Paris." },
        ],
        accepted: ["Paris"],
      }),
      "Paris",
      validConfig,
      fetchFn,
    );

    expect(fetchFn).toHaveBeenCalledOnce();
    const callArgs = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0];
    const url = callArgs[0];
    const init = callArgs[1] as RequestInit;

    expect(url).toBe("https://api.example.com/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer sk-test123",
    });

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("gpt-4o");
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0]).toEqual({
      role: "system",
      content: expect.stringContaining("marking assistant"),
    });
    expect(body.messages[1]).toEqual({
      role: "user",
      content: expect.stringContaining("What is the capital of France?"),
    });
    // Verify the user message contains all required sections.
    const userContent = body.messages[1].content as string;
    expect(userContent).toContain("Question: What is the capital of France?");
    expect(userContent).toContain("Accepted keywords/phrases: Paris");
    expect(userContent).toContain(
      "Worked explanation: The capital of France is Paris.",
    );
    expect(userContent).toContain("Learner's answer: Paris");
  });

  it("handles math blocks in prompt — uses fallback text", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ correct: true, feedback: "ok" }),
    }) as unknown as typeof globalThis.fetch;

    await markShortTextAi(
      shortTextQ({
        prompt: [
          { kind: "text", text: "Solve:" },
          { kind: "math", tex: "x^2 = 4", fallback: "x squared equals 4" },
        ],
        explanation: [{ kind: "math", tex: "x=2", fallback: "x equals 2" }],
        accepted: ["2"],
      }),
      "2",
      validConfig,
      fetchFn,
    );

    const body = JSON.parse(
      ((fetchFn as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit)
        .body as string,
    );
    expect(body.messages[1].content).toContain(
      "Question: Solve: x squared equals 4",
    );
    expect(body.messages[1].content).toContain(
      "Worked explanation: x equals 2",
    );
  });
});

describe("markShortTextAi — chat completions envelope", () => {
  it("extracts and parses JSON from choices[0].message.content", async () => {
    const fetchFn = mockFetch(200, {
      id: "gen-123",
      object: "chat.completion",
      model: "deepseek/deepseek-v4-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content:
              '{"correct": true, "feedback": "Exactly right — chinampas were indeed floating gardens used by the Aztecs."}',
          },
        },
      ],
    });

    const result = await markShortTextAi(
      shortTextQ(),
      "floating garden",
      validConfig,
      fetchFn,
    );

    expect(result).toEqual({
      status: "correct",
      feedback:
        "Exactly right — chinampas were indeed floating gardens used by the Aztecs.",
    });
  });

  it("handles incorrect answer in chat completions format", async () => {
    const fetchFn = mockFetch(200, {
      choices: [
        {
          message: {
            content:
              '{"correct": false, "feedback": "Not quite — chinampas were man-made farming islands, not naturally occurring gardens."}',
          },
        },
      ],
    });

    const result = await markShortTextAi(
      shortTextQ(),
      "a natural garden",
      validConfig,
      fetchFn,
    );

    expect(result).toEqual({
      status: "incorrect",
      feedback:
        "Not quite — chinampas were man-made farming islands, not naturally occurring gardens.",
    });
  });

  it("falls back to envelope when content is not parseable JSON", async () => {
    const fetchFn = mockFetch(200, {
      choices: [
        {
          message: {
            content: "Not JSON — just plain text",
          },
        },
      ],
    });

    const result = await markShortTextAi(
      shortTextQ(),
      "floating garden",
      validConfig,
      fetchFn,
    );

    expect(result).toEqual({
      status: "aiError",
      message: "AI service returned an unexpected response. Try again.",
    });
  });

  it("falls back to envelope when choices array is empty", async () => {
    const fetchFn = mockFetch(200, { choices: [] });

    const result = await markShortTextAi(
      shortTextQ(),
      "floating garden",
      validConfig,
      fetchFn,
    );

    expect(result).toEqual({
      status: "aiError",
      message: "AI service returned an unexpected response. Try again.",
    });
  });
});
