"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type AutoRefreshProps = {
  intervalMs?: number;
  enabled?: boolean;
  onRefresh?: () => void | Promise<void>;
};

export function AutoRefresh({
  intervalMs = 30000,
  enabled = true,
  onRefresh,
}: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    const refresh = () => {
      if (onRefresh) {
        void onRefresh();
        return;
      }

      router.refresh();
    };

    const timerId = window.setInterval(refresh, intervalMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [enabled, intervalMs, onRefresh, router]);

  return null;
}
