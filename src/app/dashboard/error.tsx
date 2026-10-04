"use client";

import { useEffect } from "react";
import { StatusPage } from "@/components/layout/status-page";

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <StatusPage kind="error" onRetry={reset} withinDashboard />;
}
