"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { GmApiError } from "../../services/gameManagementApi";

/** Runs a mock-API call, toasts the outcome and tracks which action is busy. */
export function useRun() {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const run = useCallback(
    async (key: string, fn: () => Promise<unknown>, success?: string): Promise<boolean> => {
      setBusy(key);
      try {
        await fn();
        if (success) toast(success, "success");
        return true;
      } catch (e) {
        toast(e instanceof GmApiError ? e.message : "Something went wrong. Please try again.", "error");
        return false;
      } finally {
        setBusy(null);
      }
    },
    [toast],
  );
  return { run, busy };
}
