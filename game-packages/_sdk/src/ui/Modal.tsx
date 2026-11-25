import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

/** The host's dark dialog, for games that show rules or settings. (Copied from the host: same look and behaviour.) */
export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <button aria-label="Close dialog" className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} tabIndex={-1} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl",
              size === "sm" && "sm:max-w-md",
              size === "md" && "sm:max-w-xl",
              size === "lg" && "sm:max-w-3xl",
              "sv-glass !rounded-b-none !bg-obsidian-900/95 text-obsidian-100 shadow-2xl sm:!rounded-[1.75rem]",
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
              <div>
                <h2 className="sv-display text-xl font-semibold text-white">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-obsidian-200">{description}</p>}
              </div>
              <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-obsidian-200 transition hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5">{children}</div>
            {footer && <div className="flex flex-col-reverse gap-2 border-t border-white/[0.07] bg-black/20 px-5 py-3.5 sm:flex-row sm:justify-end">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
