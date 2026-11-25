"use client";

import * as React from "react";

/**
 * Import with retries for preview chunks.
 *
 * Routes that mount the whole catalog at once (the editor, the docs indexes)
 * fire off a lot of chunk requests together, and in dev the bundler compiles
 * them on demand — so the first attempt can miss while the chunk is still
 * being built. Each miss waits a little longer before trying again; a real
 * error still surfaces after the last attempt.
 */
export async function loadWithRetry<T>(
  load: () => Promise<T>,
  delays: readonly number[] = [400, 1500],
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await load();
    } catch (error) {
      const wait = delays[attempt];
      if (wait === undefined) throw error;
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
}

/**
 * Lazy block preview with retries.
 *
 * `React.lazy` caches a rejected import for the life of the process, so a
 * single dropped chunk would leave that block showing "Preview unavailable"
 * for the rest of the session. Retrying inside the initializer (before the
 * result is cached) keeps a transient miss from becoming a permanent one.
 */
export function lazyBlock<T extends React.ComponentType<Record<string, never>>>(
  load: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return React.lazy(() => loadWithRetry(load));
}
