import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Crown, LogOut, Settings, User, Wallet } from "lucide-react";
import { useGameHost } from "../GameHostProvider";
import { Avatar } from "./Avatar";

// The three rules sets below are the account-menu rules from the host's launcher styles, unchanged.
const ACCOUNT_CSS = `
.lx-acct{display:flex;align-items:center;gap:9px;height:36px;padding:0 8px 0 4px;border-radius:10px;background:#10131d;box-shadow:inset 0 0 0 1px rgba(255,255,255,.07);transition:box-shadow .2s,background .2s}
.lx-acct:hover,.lx-acct[aria-expanded="true"]{background:#141828;box-shadow:inset 0 0 0 1px rgba(230,193,112,.45)}
.lx-acct:focus-visible{outline:2px solid var(--lx-gold);outline-offset:2px}
.lx-pop{background:#0f121c;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.09),0 24px 60px -12px #000;transform-origin:top right}
.lx-pop-item{display:flex;align-items:center;gap:11px;width:100%;height:36px;padding:0 10px;border-radius:8px;font-size:13px;font-weight:500;color:#b4bad0;transition:background .15s,color .15s}
.lx-pop-item:hover,.lx-pop-item:focus-visible{background:rgba(255,255,255,.07);color:#fff;outline:none}
`;

/**
 * Account controls for a game toolbar: who is playing, plus quick links. Everything it does goes through the
 * host (navigate / sign out), so the game never touches the site's routes or session itself.
 */
export function AccountMenu() {
  const host = useGameHost();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const name = host.player?.name ?? "Player";
  const guest = host.player?.guest ?? false;

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

  const go = (to: "profile" | "wallet" | "settings") => () => {
    setOpen(false);
    host.navigate(to);
  };

  return (
    <div ref={box} className="relative" style={{ "--lx-gold": "#e6c170" } as CSSProperties}>
      <style dangerouslySetInnerHTML={{ __html: ACCOUNT_CSS }} />
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
                  <Crown className="h-3 w-3" /> {guest ? "Guest" : `${host.player?.membership ?? "Member"} member`}
                </p>
              </div>
            </div>
            <div className="border-t border-white/[0.07] pt-1.5">
              <button role="menuitem" type="button" onClick={go("profile")} className="lx-pop-item"><User className="h-4 w-4" /> Profile</button>
              <button role="menuitem" type="button" onClick={go("wallet")} className="lx-pop-item"><Wallet className="h-4 w-4" /> Vault</button>
              <button role="menuitem" type="button" onClick={go("settings")} className="lx-pop-item"><Settings className="h-4 w-4" /> Settings</button>
            </div>
            <div className="mt-1.5 border-t border-white/[0.07] pt-1.5">
              <button role="menuitem" type="button" onClick={() => { setOpen(false); host.signOut(); }} className="lx-pop-item"><LogOut className="h-4 w-4" /> Log out</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
