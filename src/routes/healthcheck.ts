import { createFileRoute } from "@tanstack/react-router";

/**
 * Healthcheck endpoint for Kubernetes probes. Returns HTTP 200 with a JSON
 * status object indicating the application is running.
 */
export const Route = createFileRoute("/healthcheck")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({ status: "ok" });
      },
    },
  },
});
