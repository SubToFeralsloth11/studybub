import { describe, expect, it } from "vitest";

import { Route } from "./healthcheck";

describe("healthcheck route", () => {
  it("returns 200 with status ok", async () => {
    const handler = (
      Route.options as {
        server: { handlers: { GET: () => Promise<Response> } };
      }
    ).server.handlers.GET;
    const response = await handler();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "ok" });
  });
});
