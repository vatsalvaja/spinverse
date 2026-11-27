"use client";

import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/admin/ui";

export function BackendModeBanner({
  connected,
  error,
  endpoints,
}: {
  connected: boolean;
  error?: string | null;
  endpoints: string[];
}) {
  if (connected && !error) {
    return (
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-[13px] text-emerald-900">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Connected to live NestJS backend API ({endpoints.join(", ")}).</span>
        </div>
        <Badge tone="green" dot>Live Backend</Badge>
      </div>
    );
  }

  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-[13px] text-amber-950">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <p className="font-medium">
            {error ? `Backend request failed: ${error}` : "Running in frontend demo mode — backend API not connected."}
          </p>
          <p className="mt-0.5 text-xs text-amber-800">
            Supported backend endpoints: <span className="ad-mono">{endpoints.join(" · ")}</span>. Configure a live API URL &amp; JWT in{" "}
            <Link href="/super-admin/settings" className="font-semibold underline hover:text-amber-950">Platform Settings</Link>.
          </p>
        </div>
      </div>
      <Badge tone="amber" dot>{error ? "API Error" : "Demo Fallback"}</Badge>
    </div>
  );
}
