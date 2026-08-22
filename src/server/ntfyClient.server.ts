/**
 * Outbound client for ntfy.sh notification publishing.
 *
 * Implements the contract in `.local/specs/001-ntfy-streak-notifications/contracts/ntfy-publish.md`:
 * - Publishes to `https://ntfy.sh/{percent-encoded-topic}` using native `fetch`
 * - Plain text UTF-8 body with `X-Title`, `X-Priority`, `X-Sequence-ID`, `X-Click`, `X-Tags`
 * - 10-second timeout via AbortController
 * - Defensively parses JSON 2xx responses for ntfy message ID
 * - Classifies failure results into safe status categories (timeout, network, rate-limited, service-unavailable, rejected)
 * - Honors `Retry-After` header when rate limited
 * - Never returns or discloses topic or response body strings
 *
 * @module server/ntfyClient.server
 */

import {
  classifyDeliveryFailure,
  type NotificationDeliveryFailureClassification,
} from "../domain/notifications/notifications";

const NTFY_BASE_URL = "https://ntfy.sh";
const DEFAULT_TIMEOUT_MS = 10_000;

export interface NtfyPublishOptions {
  topic: string;
  title: string;
  body: string;
  priority: 2 | 3;
  tags?: string[];
  sequenceId?: string;
  publicUrl?: string;
}

export interface NtfyPublishContext {
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export interface NtfyPublishSuccess {
  ok: true;
  status: number;
  ntfyMessageId: string | null;
}

export interface NtfyPublishFailure {
  ok: false;
  status?: number;
  classification: NotificationDeliveryFailureClassification;
  isPermanent: boolean;
  retryAfterSeconds?: number;
}

export type NtfyPublishResult = NtfyPublishSuccess | NtfyPublishFailure;

/**
 * Publishes a notification to ntfy.sh.
 */
export async function publishNtfyNotification(
  options: NtfyPublishOptions,
  context?: NtfyPublishContext,
): Promise<NtfyPublishResult> {
  const fetchFn = context?.fetch ?? fetch;
  const timeoutMs = context?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const encodedTopic = encodeURIComponent(options.topic);
  const targetUrl = `${NTFY_BASE_URL}/${encodedTopic}`;

  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Title": options.title,
    "X-Priority": String(options.priority),
  };

  if (options.sequenceId) {
    headers["X-Sequence-ID"] = options.sequenceId;
  }

  if (options.publicUrl) {
    headers["X-Click"] = options.publicUrl;
  }

  if (options.tags && options.tags.length > 0) {
    headers["X-Tags"] = options.tags.join(",");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(targetUrl, {
      method: "POST",
      headers,
      body: options.body,
      signal: controller.signal,
      redirect: "error",
    });

    if (response.ok) {
      let messageId: string | null = null;
      try {
        const contentType = response.headers.get("Content-Type") ?? "";
        if (contentType.includes("application/json")) {
          const json: unknown = await response.json();
          if (json && typeof json === "object" && "id" in json) {
            const rawId = json.id;
            if (typeof rawId === "string") {
              messageId = rawId;
            }
          }
        }
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          (error.name === "AbortError" ||
            error.message.includes("aborted") ||
            error.message.includes("timeout"))
        ) {
          throw error;
        }
        // Non-JSON or malformed 2xx body still represents transport success
        messageId = null;
      }

      return {
        ok: true,
        status: response.status,
        ntfyMessageId: messageId,
      };
    }

    // Handle failure response
    const classification = classifyDeliveryFailure({ status: response.status });
    const isPermanent = classification === "rejected";

    let retryAfterSeconds: number | undefined;
    const retryAfterHeader = response.headers.get("Retry-After");
    if (retryAfterHeader) {
      const trimmed = retryAfterHeader.trim();
      const parsedSeconds = Number.parseInt(trimmed, 10);
      if (!Number.isNaN(parsedSeconds) && /^\d+$/.test(trimmed)) {
        if (parsedSeconds > 0) {
          retryAfterSeconds = parsedSeconds;
        }
      } else {
        const parsedDateMs = Date.parse(trimmed);
        if (!Number.isNaN(parsedDateMs)) {
          const deltaSeconds = Math.round((parsedDateMs - Date.now()) / 1000);
          if (deltaSeconds > 0) {
            retryAfterSeconds = deltaSeconds;
          }
        }
      }
    }

    return {
      ok: false,
      status: response.status,
      classification,
      isPermanent,
      retryAfterSeconds,
    };
  } catch (error: unknown) {
    const isAbort =
      error instanceof Error &&
      (error.name === "AbortError" ||
        error.message.includes("aborted") ||
        error.message.includes("timeout"));

    const classification = classifyDeliveryFailure({
      isTimeout: isAbort,
      errorName: error instanceof Error ? error.name : undefined,
    });

    return {
      ok: false,
      classification,
      isPermanent: false,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
