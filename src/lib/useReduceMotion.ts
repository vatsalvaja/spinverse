"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Like framer-motion's useReducedMotion, but safe for server rendering: it reports false until the component
 * has mounted, so the first client render always matches the server HTML. Using the raw hook to choose a
 * component's `initial` state causes hydration errors for anyone whose system asks for reduced motion.
 */
export function useReduceMotion(): boolean {
  const pref = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && !!pref;
}
