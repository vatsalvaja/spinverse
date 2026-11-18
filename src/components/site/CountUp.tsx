"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";

export function CountUp({ value, duration = 1.4 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(value);
      return;
    }
    const controls = animate(0, value, { duration, ease: "easeOut", onUpdate: (v) => setN(Math.round(v)) });
    return () => controls.stop();
  }, [value, duration]);
  return <span className="tabular-nums">{n.toLocaleString("en-US")}</span>;
}
