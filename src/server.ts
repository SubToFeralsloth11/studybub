import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import { createServerEntry } from "@tanstack/react-start/server-entry";

/**
 * StudyBub server entry point for TanStack Start.
 *
 * Uses the default streaming handler to process incoming requests for SSR
 * and server functions. The handler is wrapped via createServerEntry for
 * the Nitro server build with the Bun preset.
 */
const handler = createStartHandler(defaultStreamHandler);

export default createServerEntry({ fetch: handler });
