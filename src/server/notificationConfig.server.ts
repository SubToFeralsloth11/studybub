/**
 * Validated server-only public application URL reader for streak notifications.
 *
 * Ensures notification click URLs (X-Click) point to an absolute HTTP(S) origin.
 * In production (NODE_ENV=production), STUDYBUB_PUBLIC_URL is mandatory and must be an absolute URL.
 * In development/test environments, defaults to http://localhost:3000 if unset.
 *
 * @module server/notificationConfig.server
 */

/**
 * Validates and normalizes an absolute http(s) URL without trailing slash.
 */
export function validatePublicAppUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new Error("Invalid public app URL: string is required.");
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid public app URL format: "${rawUrl}"`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `Invalid public app URL protocol "${parsed.protocol}": must be http: or https:`,
    );
  }

  if (parsed.username || parsed.password) {
    throw new Error("Invalid public app URL: credentials are not allowed.");
  }

  if (parsed.pathname !== "/" && parsed.pathname !== "") {
    throw new Error("Invalid public app URL: path components are not allowed.");
  }

  if (parsed.search) {
    throw new Error(
      "Invalid public app URL: query parameters are not allowed.",
    );
  }

  if (parsed.hash) {
    throw new Error("Invalid public app URL: hash fragments are not allowed.");
  }

  return parsed.origin;
}

/**
 * Resolves the validated public application URL from environment variables.
 */
export function getPublicAppUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const nodeEnv = env.NODE_ENV ?? "development";
  const rawUrl = env.STUDYBUB_PUBLIC_URL?.trim();

  if (!rawUrl) {
    if (nodeEnv === "production") {
      throw new Error(
        "STUDYBUB_PUBLIC_URL is required in production. Configure the absolute public origin (e.g. https://studybub.syntaxrewrite.com).",
      );
    }
    return "http://localhost:3000";
  }

  return validatePublicAppUrl(rawUrl);
}
