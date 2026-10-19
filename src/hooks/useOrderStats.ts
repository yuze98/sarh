import { useEffect, useState } from "react";
import { ordersService } from "../services/ordersService";
import type { OrderStats } from "../types/api";

function isAbortError(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === "AbortError";
}

export function useOrderStats() {
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    ordersService
      .getStats(controller.signal)
      .then(setStats)
      .catch((cause: unknown) => {
        if (isAbortError(cause)) return;
        setError(
          cause instanceof Error ? cause.message : "Unable to load order stats",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [retryCount]);

  return {
    stats,
    loading,
    error,
    retry: () => setRetryCount((count) => count + 1),
  };
}
