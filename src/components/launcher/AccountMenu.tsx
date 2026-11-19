"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Crown, LogOut, Settings, User, Wallet } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useSession } from "@/lib/session";

/** Account controls in the toolbar: who is signed in, and quick links. Closes on outside click, Escape, or a choice. */
export function AccountMenu({ onLogout }: { onLogout: () => void }) {
  const { player, mode } = useSession();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const name = player?.name ?? "Player";

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={`Account: ${name}`} className="lx-acct">
        <Avatar name={name} size={28} />
        <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-white/90 lg:block">{name}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-white/45 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Account"
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.14 }}
            className="lx-pop absolute right-0 top-[calc(100%+8px)] z-50 w-[232px] p-1.5"
          >
            <div className="flex items-center gap-3 px-2.5 pb-3 pt-2">
              <Avatar name={name} size={38} />
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-semibold text-white">{name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[#e6c170]">
                  <Crown className="h-3 w-3" /> {mode === "guest" ? "Guest" : `${player?.membership ?? "Member"} member`}
                </p>
              </div>
            </div>
            <div className="border-t border-white/[0.07] pt-1.5">
              <Link role="menuitem" href="/profile" onClick={() => setOpen(false)} className="lx-pop-item"><User className="h-4 w-4" /> Profile</Link>
              <Link role="menuitem" href="/wallet" onClick={() => setOpen(false)} className="lx-pop-item"><Wallet className="h-4 w-4" /> Vault</Link>
              <Link role="menuitem" href="/settings" onClick={() => setOpen(false)} className="lx-pop-item"><Settings className="h-4 w-4" /> Settings</Link>
            </div>
            <div className="mt-1.5 border-t border-white/[0.07] pt-1.5">
              <button role="menuitem" type="button" onClick={() => { setOpen(false); onLogout(); }} className="lx-pop-item"><LogOut className="h-4 w-4" /> Log out</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
