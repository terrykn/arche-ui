"use client";

import * as React from "react";

/**
 * Lazy block preview with one retry.
 *
 * `React.lazy` caches a rejected import for the life of the process, so a
 * single dropped chunk would leave that block showing "Preview unavailable"
 * for the rest of the session — and a route that mounts the whole catalog at
 * once (the editor, the docs indexes) loads a lot of chunks at once. Catching
 * the first failure and trying once more keeps a transient miss from becoming
 * a permanent one; a real error still surfaces on the retry.
 */
export function lazyBlock<T extends React.ComponentType<Record<string, never>>>(
  load: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      return await load();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
      return await load();
    }
  });
}
