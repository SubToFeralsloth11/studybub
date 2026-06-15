/**
 * AI-powered short-text marking. Given a question, the learner's answer, and
 * AI config, builds a prompt for an OpenAI-compatible endpoint, sends it via
 * the injected fetch, and parses the response into a MarkResult.
 *
 * @module domain/marking/markShortTextAi
 * @author John Grimes
 */

import { richBlocksToPlainText } from "./richBlocksToPlainText";

import type { MarkResult } from "./markResult";
import type { ShortTextQuestion } from "../content/types";
import type { AiConfig } from "../persistence/aiConfig";

/**
 * Marks a short-text answer by asking an AI model to judge correctness.
 *
 * The function is pure in the sense that it receives fetch and config as
 * parameters — it never touches `window` or `localStorage` directly.
 *
 * @param question - The short-text question being answered.
 * @param answer - The learner's raw text answer.
 * @param aiConfig - The AI provider configuration, or undefined if not set up.
 * @param fetchFn - The fetch implementation (injected for testability).
 * @param signal - An optional AbortSignal for cancellation.
 * @returns A promise resolving to a {@link MarkResult}.
 * @example
 * const result = await markShortTextAi(q, "Paris", config, globalThis.fetch);
 */
/** The shape we expect the AI to respond with. */
interface AiResponse {
  correct: boolean;
  feedback: string;
}

/** Checks whether a parsed value has the expected AI response shape. */
function isValidAiResponse(value: unknown): value is AiResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).correct === "boolean" &&
    typeof (value as Record<string, unknown>).feedback === "string" &&
    (value as Record<string, unknown>).feedback !== ""
  );
}

/** The OpenAI chat completions response shape. */
interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

/**
 * Extracts the AI response from a chat completions envelope.
 *
 * OpenAI-compatible APIs wrap the model output in
 * `choices[0].message.content`. If the content is a JSON string, it is
 * parsed; otherwise the envelope itself is returned as a fallback (for
 * providers that return the flat shape directly).
 *
 * @param envelope - The parsed outer response body.
 * @returns The extracted AI response object.
 */
function extractAiResponse(envelope: unknown): unknown {
  const cc = envelope as ChatCompletionResponse;
  const content = cc.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {
      // Content was not JSON; fall through to return the envelope.
    }
  }
  return envelope;
}

const SYSTEM_PROMPT =
  'You are a marking assistant for an educational app. Judge whether the learner\'s answer is correct based on the provided rubric. Respond ONLY with valid JSON: {"correct": true|false, "feedback": "1-3 sentence personalised explanation"}';

/**
 * Builds the user message from a question, its accepted keywords, its
 * worked explanation, and the learner's answer.
 *
 * @param question - The short-text question.
 * @param answer - The learner's raw answer text.
 * @returns A structured user message for the AI.
 */
function buildUserMessage(question: ShortTextQuestion, answer: string): string {
  const prompt = richBlocksToPlainText(question.prompt);
  const accepted = question.accepted.join(", ");
  const explanation = richBlocksToPlainText(question.explanation);
  return [
    `Question: ${prompt}`,
    `Accepted keywords/phrases: ${accepted}`,
    `Worked explanation: ${explanation}`,
    `Learner's answer: ${answer}`,
    "Judge this answer.",
  ].join("\n\n");
}

/**
 *
 */
export async function markShortTextAi(
  question: ShortTextQuestion,
  answer: string,
  aiConfig: AiConfig | undefined,
  fetchFn: typeof globalThis.fetch,
  signal?: AbortSignal,
): Promise<MarkResult> {
  // Not configured — return immediately.
  if (!aiConfig) {
    return {
      status: "aiNotConfigured",
      message:
        "AI marking is not configured. Go to Settings to set up your AI provider.",
    };
  }

  // Timeout at 30 seconds.
  const timeoutMs = 30_000;
  const timeoutController = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    timeoutController.abort();
  }, timeoutMs);

  // Combine the caller's signal with our timeout signal.
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeoutController.signal])
    : timeoutController.signal;

  let response: Response;
  try {
    response = await fetchFn(aiConfig.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(question, answer) },
        ],
      }),
      signal: combinedSignal,
    });
  } catch {
    clearTimeout(timeoutId);
    if (timedOut) {
      return {
        status: "aiError",
        message: "AI service did not respond in time. Try again.",
      };
    }
    return {
      status: "aiError",
      message:
        "Could not reach the AI service. Check your API Base URL in Settings.",
    };
  }

  clearTimeout(timeoutId);

  // Check HTTP status.
  if (!response.ok) {
    return {
      status: "aiError",
      message: `AI service returned an error (HTTP ${response.status}). Check your Settings.`,
    };
  }

  // Parse the outer JSON response.
  let body: unknown;
  try {
    body = extractAiResponse(await response.json());
  } catch {
    return {
      status: "aiError",
      message: "AI service returned an unexpected response. Try again.",
    };
  }

  // Validate shape.
  if (!isValidAiResponse(body)) {
    return {
      status: "aiError",
      message: "AI service returned an unexpected response. Try again.",
    };
  }

  return {
    status: body.correct ? "correct" : "incorrect",
    feedback: body.feedback,
  };
}
