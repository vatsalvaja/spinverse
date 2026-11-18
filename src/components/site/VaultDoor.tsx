"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useReduceMotion } from "@/lib/useReduceMotion";
import { VAULT_ART } from "@/components/art/art";
import { cn } from "@/lib/utils";

/** A brushed-steel vault door (baked artwork) with a rotating gold handle wheel and a glass window for the balance. */
export function VaultDoor({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReduceMotion();
  const [turns, setTurns] = useState(0);
  return (
    <div className={cn("group relative mx-auto aspect-square w-full max-w-[560px]", className)}>
      <div className="absolute inset-[-8%] rounded-full bg-[radial-gradient(circle,rgba(240,200,100,.2),transparent_62%)]" aria-hidden />
      <div className="absolute inset-x-[10%] bottom-[-2%] h-[8%] rounded-full bg-black/70 blur-2xl" aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={VAULT_ART.door} alt="" aria-hidden draggable={false} className="absolute inset-0 h-full w-full select-none" />
      <motion.button
        type="button"
        aria-label="Turn the vault wheel"
        onClick={() => setTurns((t) => t + 1)}
        animate={{ rotate: turns * 60 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 60, damping: 14 }}
        className="absolute inset-0 rounded-full outline-offset-[-8%]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={VAULT_ART.wheel} alt="" aria-hidden draggable={false} className="h-full w-full select-none" />
      </motion.button>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex w-[36%] flex-col items-center justify-center text-center">{children}</div>
      </div>
    </div>
  );
}
