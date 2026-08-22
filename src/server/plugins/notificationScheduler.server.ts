/**
 * Nitro lifecycle plugin for background notification scheduling.
 *
 * Runs non-overlapping worker cycles once per minute and cleanly stops on Nitro close.
 *
 * @module server/plugins/notificationScheduler.server
 */

import { runNotificationWorkerCycle } from "../notificationWorker.server";

import type { NitroApp } from "nitropack";

/**
 *
 */
export default function notificationSchedulerPlugin(nitroApp: NitroApp): void {
  let timer: ReturnType<typeof setInterval> | null = null;
  let isRunning = false;

  const runCycle = async () => {
    if (isRunning) {
      return;
    }
    isRunning = true;
    try {
      await runNotificationWorkerCycle();
    } catch (error) {
      // Worker cycles must not crash the host process
      console.error("Error during notification worker cycle:", error);
    } finally {
      isRunning = false;
    }
  };

  // Run initial cycle immediately
  void runCycle();

  // Schedule periodic 1-minute execution
  timer = setInterval(() => {
    void runCycle();
  }, 60_000);

  // Clean shutdown hook
  nitroApp.hooks.hook("close", () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  });
}
