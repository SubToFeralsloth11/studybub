import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import notificationSchedulerPlugin from "./notificationScheduler.server";
import * as worker from "../notificationWorker.server";

describe("notificationScheduler.server plugin", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts periodic 1-minute interval and executes worker cycle", async () => {
    const runSpy = vi
      .spyOn(worker, "runNotificationWorkerCycle")
      .mockResolvedValue({
        evaluations: 0,
        claims: 0,
        succeeded: 0,
        failed: 0,
        suppressed: 0,
        expired: 0,
      });

    const hooks: Record<string, () => Promise<void> | void> = {};
    const nitroApp = {
      hooks: {
        hook: (name: string, cb: () => Promise<void> | void) => {
          hooks[name] = cb;
        },
      },
    };

    // Initialize plugin
    notificationSchedulerPlugin(nitroApp as never);

    expect(runSpy).toHaveBeenCalledTimes(1);

    // Fast forward 1 minute
    await vi.advanceTimersByTimeAsync(60_000);
    expect(runSpy).toHaveBeenCalledTimes(2);

    // Fast forward another minute
    await vi.advanceTimersByTimeAsync(60_000);
    expect(runSpy).toHaveBeenCalledTimes(3);

    // Close hook clears timer
    expect(hooks.close).toBeDefined();
    hooks.close?.();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(runSpy).toHaveBeenCalledTimes(3);
  });

  it("prevents overlapping worker cycles if a prior cycle is still running", async () => {
    let resolveSlowCycle: () => void = () => {};
    const slowPromise = new Promise<worker.WorkerCycleResult>((resolve) => {
      resolveSlowCycle = () =>
        resolve({
          evaluations: 0,
          claims: 0,
          succeeded: 0,
          failed: 0,
          suppressed: 0,
          expired: 0,
        });
    });

    const runSpy = vi
      .spyOn(worker, "runNotificationWorkerCycle")
      .mockImplementation(() => slowPromise);

    const nitroApp = {
      hooks: {
        hook: () => {},
      },
    };

    notificationSchedulerPlugin(nitroApp as never);
    expect(runSpy).toHaveBeenCalledTimes(1);

    // Advance 60s while cycle is still running
    await vi.advanceTimersByTimeAsync(60_000);
    expect(runSpy).toHaveBeenCalledTimes(1);

    // Resolve slow cycle
    resolveSlowCycle();
    await Promise.resolve();

    // Next timer tick should run
    await vi.advanceTimersByTimeAsync(60_000);
    expect(runSpy).toHaveBeenCalledTimes(2);
  });
});
