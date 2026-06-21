"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track-event";

/** Dispara um evento de uso uma vez, ao montar (para páginas server). */
export function TrackEvent({
  event,
  data,
}: {
  event: string;
  data?: Record<string, unknown>;
}) {
  useEffect(() => {
    trackEvent(event, data ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
