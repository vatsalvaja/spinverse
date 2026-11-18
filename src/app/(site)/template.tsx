"use client";

import { motion } from "framer-motion";
import { useReduceMotion } from "@/lib/useReduceMotion";

/** Opacity only: a transform here would make `position: fixed` backdrops inside pages behave like absolute ones. */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReduceMotion();
  return (
    <motion.div initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}
