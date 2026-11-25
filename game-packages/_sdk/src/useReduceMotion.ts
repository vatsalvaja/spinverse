import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Like framer-motion's useReducedMotion, but reports false until the component has mounted, so the first render
 * always matches what was rendered before. (Copied from the host so games behave identically.)
 */
export function useReduceMotion(): boolean {
  const pref = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && !!pref;
}
