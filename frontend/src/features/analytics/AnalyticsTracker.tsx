import { useEffect, useSyncExternalStore } from "react";
import { useLocation } from "@tanstack/react-router";
import { analytics } from "./analytics";

/** Sends page views while consent is valid; renders nothing. */
export function AnalyticsTracker() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const choice = useSyncExternalStore(analytics.subscribe, analytics.getChoice);

  useEffect(() => {
    analytics.pageview(pathname);
  }, [pathname, choice]);

  useEffect(() => {
    // Notice expired consent even if the page stays open.
    const timer = setInterval(() => analytics.sync(), 60_000);
    return () => clearInterval(timer);
  }, []);

  return null;
}
