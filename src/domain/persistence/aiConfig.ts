/**
 * AI provider configuration type for StudyBub.
 *
 * This module defines the shape of the learner's AI provider configuration.
 * Persistence is handled server-side via the server functions in
 * `src/server/api/aiConfig.ts`. The AiConfig type is the canonical
 * definition shared between client and server.
 *
 * @module domain/persistence/aiConfig
 * @author John Grimes
 */

/** The learner's AI provider configuration (see contracts/markingApi.md). */
export interface AiConfig {
  /** Full URL of the OpenAI-compatible chat completions endpoint. */
  baseUrl: string;
  /** Bearer token for authenticating requests. */
  apiKey: string;
  /** Model name to pass in the request body. */
  model: string;
}
